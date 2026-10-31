import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const subscriptionId = String(url.searchParams.get("subscription_id") || "").trim();
  if (mongoose.isValidObjectId(subscriptionId)) {
    try {
      await connectDB();
      await Subscription.updateOne(
        { _id: subscriptionId, paymentProvider: "UddoktaPay", paymentStatus: "PENDING", accessStatus: "PENDING" },
        { $set: { paymentStatus: "CANCELLED", accessStatus: "CANCELLED", reviewNote: "Customer cancelled the UddoktaPay checkout." } },
      );
    } catch (error) {
      console.error("UddoktaPay cancel callback could not update subscription:", error instanceof Error ? error.message : "Unknown error");
    }
  }
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").trim();
  let origin = url.origin;
  try { const parsed = new URL(configured); if (parsed.protocol === "https:") origin = parsed.origin; } catch { /* Keep request origin. */ }
  const destination = new URL("/payment/success", origin);
  destination.searchParams.set("provider", "uddoktapay");
  destination.searchParams.set("cancelled", "1");
  if (subscriptionId) destination.searchParams.set("subscription_id", subscriptionId);
  return NextResponse.redirect(destination, 303);
}
