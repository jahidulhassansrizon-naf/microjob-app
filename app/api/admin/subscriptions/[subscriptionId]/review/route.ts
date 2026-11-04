import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import { requireAdmin } from "../../../_lib/adminAuth";
import { getLegacySubscriptionPlanDays } from "@/app/api/_lib/subscriptionPlans";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ subscriptionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;

  try {
    const { subscriptionId } = await context.params;
    if (!mongoose.isValidObjectId(subscriptionId)) {
      return NextResponse.json({ success: false, message: "Invalid subscription ID." }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const action = String(body?.action || "").toLowerCase();
    const reviewNote = String(body?.note || "").trim().slice(0, 500);
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ success: false, message: "Choose approve or reject." }, { status: 400 });
    }

    await connectDB();
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return NextResponse.json({ success: false, message: "Subscription record not found." }, { status: 404 });
    }
    if (subscription.paymentStatus !== "PENDING" || subscription.accessStatus !== "PENDING") {
      return NextResponse.json({ success: false, message: "This payment has already been reviewed." }, { status: 409 });
    }
    const isManualWalletPayment = ["Nagad", "bKash"].includes(String(subscription.paymentMethod || ""));
    const paymentProvider = String(subscription.paymentProvider || "").trim();
    if (!isManualWalletPayment || !["", "Manual"].includes(paymentProvider) || !String(subscription.transactionId || "").trim()) {
      return NextResponse.json(
        { success: false, message: "Only pending manual bKash/Nagad payments with a TrxID can be reviewed here." },
        { status: 409 },
      );
    }

    const reviewedAt = new Date();
    const reviewer = authorization.admin?.email || "admin";

    if (action === "reject") {
      const rejected = await Subscription.findOneAndUpdate(
        { _id: subscription._id, paymentStatus: "PENDING", accessStatus: "PENDING" },
        { $set: {
          paymentStatus: "REJECTED",
          accessStatus: "CANCELLED",
          reviewStatus: "REJECTED",
          reviewedAt,
          reviewedBy: reviewer,
          reviewNote,
        } },
        { new: true },
      );
      if (!rejected) {
        return NextResponse.json({ success: false, message: "This payment has already been reviewed." }, { status: 409 });
      }
      return NextResponse.json({ success: true, message: "Payment rejected.", subscription: { id: String(rejected._id), paymentStatus: rejected.paymentStatus, accessStatus: rejected.accessStatus, reviewStatus: rejected.reviewStatus } });
    }

    // New orders carry an immutable planDays snapshot. Only very old records
    // fall back to the original built-in durations (including legacy 3-month).
    const planDays = Number(subscription.planDays) || getLegacySubscriptionPlanDays(String(subscription.planId));
    if (!Number.isInteger(planDays) || planDays <= 0 || planDays > 36_500) {
      return NextResponse.json({ success: false, message: "The subscription plan duration is not supported." }, { status: 409 });
    }

    // Renew from the current expiry when the customer already has active paid access.
    const now = new Date();
    const active = await Subscription.findOne({
      userId: subscription.userId,
      _id: { $ne: subscription._id },
      paymentStatus: "COMPLETED",
      accessStatus: "ACTIVE",
      expiresAt: { $gt: now },
    }).sort({ expiresAt: -1 }).select("expiresAt").lean();
    const currentExpiry = active?.expiresAt ? new Date(active.expiresAt) : null;
    const startedAt = currentExpiry && currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
    const expiresAt = new Date(startedAt);
    expiresAt.setDate(expiresAt.getDate() + planDays);

    const approved = await Subscription.findOneAndUpdate(
      { _id: subscription._id, paymentStatus: "PENDING", accessStatus: "PENDING" },
      { $set: {
        paymentStatus: "COMPLETED",
        accessStatus: "ACTIVE",
        reviewStatus: "APPROVED",
        startedAt,
        expiresAt,
        reviewedAt,
        reviewedBy: reviewer,
        reviewNote,
      } },
      { new: true },
    );

    if (!approved) {
      return NextResponse.json({ success: false, message: "This payment has already been reviewed." }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      message: `Payment approved. ${subscription.planName} subscription access is active.`,
      subscription: {
        id: String(approved._id),
        paymentStatus: approved.paymentStatus,
        accessStatus: approved.accessStatus,
        reviewStatus: approved.reviewStatus,
        startedAt: approved.startedAt,
        expiresAt: approved.expiresAt,
      },
    });
  } catch (error) {
    console.error("Admin payment review error:", error);
    return NextResponse.json({ success: false, message: "Could not update payment review status." }, { status: 500 });
  }
}
