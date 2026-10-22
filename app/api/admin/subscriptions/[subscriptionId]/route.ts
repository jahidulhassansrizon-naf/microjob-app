import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import { requireAdmin } from "../../_lib/adminAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ subscriptionId: string }> };

/** Permanently deletes a single subscription/payment record. Admin-only. */
export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const { subscriptionId } = await context.params;
    if (!mongoose.isValidObjectId(subscriptionId)) {
      return NextResponse.json(
        { success: false, message: "Invalid subscription record ID." },
        { status: 400 },
      );
    }

    await connectDB();
    const record = await Subscription.findById(subscriptionId).select("_id userId paymentStatus accessStatus").lean();
    if (!record) {
      return NextResponse.json(
        { success: false, message: "This subscription record was not found. It may already have been deleted." },
        { status: 404 },
      );
    }

    await Subscription.deleteOne({ _id: record._id });

    return NextResponse.json(
      {
        success: true,
        deletedId: String(record._id),
        userId: String(record.userId),
        message: "Subscription record permanently deleted. If it was the user's only active paid subscription, that paid access is now removed.",
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin subscription delete error:", error);
    return NextResponse.json(
      { success: false, message: "Could not delete this subscription record." },
      { status: 500 },
    );
  }
}
