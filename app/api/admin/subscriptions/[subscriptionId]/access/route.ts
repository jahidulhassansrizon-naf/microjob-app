import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ subscriptionId: string }> };

/** Deactivates paid access for one subscription while preserving its payment history. */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const { subscriptionId } = await context.params;
    if (!mongoose.isValidObjectId(subscriptionId)) {
      return NextResponse.json({ success: false, message: "Invalid subscription ID." }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (body?.action !== "deactivate") {
      return NextResponse.json({ success: false, message: "Choose deactivate to turn off this subscription access." }, { status: 400 });
    }

    await connectDB();
    const now = new Date();
    const updated = await Subscription.findOneAndUpdate(
      {
        _id: subscriptionId,
        paymentStatus: "COMPLETED",
        accessStatus: "ACTIVE",
        expiresAt: { $gt: now },
      },
      { $set: { accessStatus: "CANCELLED" } },
      { new: true },
    ).select("_id paymentStatus accessStatus expiresAt").lean();

    if (!updated) {
      const existing = await Subscription.findById(subscriptionId).select("_id paymentStatus accessStatus expiresAt").lean();
      if (!existing) {
        return NextResponse.json({ success: false, message: "Subscription record not found." }, { status: 404 });
      }
      return NextResponse.json({ success: false, message: "This subscription does not have active access to deactivate." }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      message: "Subscription access deactivated. Payment history has been preserved.",
      subscription: {
        id: String(updated._id),
        paymentStatus: updated.paymentStatus,
        accessStatus: updated.accessStatus,
        expiresAt: updated.expiresAt,
      },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin subscription access deactivation error:", error);
    return NextResponse.json({ success: false, message: "Could not deactivate subscription access." }, { status: 500 });
  }
}
