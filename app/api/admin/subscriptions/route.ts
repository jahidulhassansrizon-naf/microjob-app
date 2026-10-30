import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { requireAdmin } from "../_lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;

  try {
    await connectDB();
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim().slice(0, 120);
    const status = url.searchParams.get("status") || "all";
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20));
    const now = new Date();
    const filter: Record<string, any> = {};

    if (status === "active") {
      Object.assign(filter, { paymentStatus: "COMPLETED", accessStatus: "ACTIVE", expiresAt: { $gt: now } });
    } else if (status === "expired") {
      filter.$or = [{ accessStatus: "EXPIRED" }, { expiresAt: { $lte: now } }];
    } else if (status === "pending") {
      filter.paymentStatus = "PENDING";
    } else if (status === "cancelled") {
      filter.$or = [{ paymentStatus: "CANCELLED" }, { accessStatus: "CANCELLED" }];
    } else if (status === "error") {
      filter.paymentStatus = "ERROR";
    } else if (status === "rejected") {
      filter.paymentStatus = "REJECTED";
    }

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      const matchingUsers = await User.find({ $or: [{ fullName: regex }, { email: regex }, { phoneNumber: regex }] }).select("_id").lean();
      const ids = matchingUsers.map((user: any) => user._id);
      const userIdClause = { userId: { $in: ids } };
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, userIdClause];
        delete filter.$or;
      } else {
        filter.userId = { $in: ids };
      }
    }

    const [total, itemsRaw] = await Promise.all([
      Subscription.countDocuments(filter),
      Subscription.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: "userId", select: "fullName email phoneNumber" })
        .lean(),
    ]);

    const subscriptions = itemsRaw.map((item: any) => ({
      id: String(item._id),
      planId: item.planId,
      planName: item.planName,
      months: Number(item.months || 0),
      amount: Number(item.amount || 0),
      invoiceId: item.invoiceId || item.providerInvoiceId || "",
      paymentProvider: item.paymentProvider || "",
      transactionId: item.transactionId || "",
      paymentMethod: item.paymentMethod || "",
      senderNumber: item.senderNumber || "",
      reviewStatus: item.reviewStatus || (item.paymentStatus === "COMPLETED" ? "APPROVED" : item.paymentStatus === "REJECTED" ? "REJECTED" : "PENDING"),
      submittedAt: item.submittedAt || null,
      reviewedAt: item.reviewedAt || null,
      reviewedBy: item.reviewedBy || "",
      reviewNote: item.reviewNote || "",
      paymentStatus: item.paymentStatus,
      accessStatus: item.accessStatus,
      startedAt: item.startedAt || null,
      expiresAt: item.expiresAt || null,
      createdAt: item.createdAt || null,
      user: item.userId && typeof item.userId === "object"
        ? {
            id: String(item.userId._id),
            fullName: item.userId.fullName || "Unknown user",
            email: item.userId.email || "",
            phoneNumber: item.userId.phoneNumber || "",
          }
        : null,
    }));

    return NextResponse.json(
      { success: true, subscriptions, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin subscription list error:", error);
    return NextResponse.json(
      { success: false, message: "Could not load the subscription list." },
      { status: 500 },
    );
  }
}
