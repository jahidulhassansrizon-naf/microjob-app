import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import { verifyAndActivateUddoktaPaySubscription } from "@/app/api/uddoktapay/_lib/uddoktapay";
import { setSubscriptionAccessCookie } from "@/app/api/_lib/requireActiveSubscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const JWT_SECRET = process.env.JWT_SECRET || "";
type JwtPayload = { userId?: string; exp?: number };
function getToken(request: Request) {
  const pair = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="));
  if (!pair) return null;
  try { return decodeURIComponent(pair.slice("token=".length)); } catch { return null; }
}

export async function POST(request: Request) {
  try {
    if (!JWT_SECRET) return NextResponse.json({ success: false, message: "Authentication is not configured on the server." }, { status: 500 });
    const token = getToken(request);
    if (!token) return NextResponse.json({ success: false, message: "Please log in before verifying this payment." }, { status: 401 });
    let decoded: JwtPayload;
    try { decoded = jwt.verify(token, JWT_SECRET) as JwtPayload; } catch { return NextResponse.json({ success: false, message: "Your login session has expired." }, { status: 401 }); }
    if (!decoded.userId) return NextResponse.json({ success: false, message: "Invalid login token." }, { status: 401 });

    const body = await request.json().catch(() => null);
    const invoiceId = String(body?.invoice_id || body?.invoiceId || "").trim();
    const subscriptionId = String(body?.subscription_id || body?.subscriptionId || "").trim();
    if (subscriptionId && !mongoose.isValidObjectId(subscriptionId)) return NextResponse.json({ success: false, message: "Invalid subscription reference." }, { status: 400 });
    if (!invoiceId) return NextResponse.json({ success: false, paymentStatus: "PENDING", message: "UddoktaPay has not returned an invoice_id yet. This page will check again automatically." }, { status: 202 });

    let order: any = null;
    if (subscriptionId) {
      await connectDB();
      order = await Subscription.findOne({ _id: subscriptionId, userId: decoded.userId, paymentProvider: "UddoktaPay" }).select("invoiceId paymentStatus accessStatus expiresAt");
      if (!order) return NextResponse.json({ success: false, message: "This UddoktaPay order was not found for your account." }, { status: 404 });
      if (order.paymentStatus === "COMPLETED" && order.accessStatus === "ACTIVE" && String(order.invoiceId) === invoiceId) {
        const response = NextResponse.json({ success: true, alreadyCompleted: true, paymentStatus: "COMPLETED", message: "UddoktaPay payment has already been confirmed and your subscription is active.", payment: { invoice_id: order.invoiceId }, subscription: { id: String(order._id), accessStatus: order.accessStatus, paymentStatus: order.paymentStatus, expiresAt: order.expiresAt } });
        if (order.expiresAt) setSubscriptionAccessCookie(response, String(decoded.userId), order.expiresAt);
        return response;
      }
      if (order.invoiceId && String(order.invoiceId) !== invoiceId) return NextResponse.json({ success: false, message: "This invoice does not match the selected subscription." }, { status: 409 });
    }

    const result = await verifyAndActivateUddoktaPaySubscription(invoiceId, { expectedUserId: String(decoded.userId), expectedSubscriptionId: subscriptionId || undefined });
    const response = NextResponse.json({
      success: result.ok,
      alreadyCompleted: Boolean(result.alreadyCompleted),
      paymentStatus: result.paymentStatus || result.payment?.status || null,
      message: result.message,
      payment: result.payment ? {
        invoice_id: result.payment.invoice_id || invoiceId,
        transaction_id: result.payment.transaction_id || null,
        sender_number: result.payment.sender_number || null,
        payment_method: result.payment.payment_method || "UddoktaPay",
        status: result.payment.status || null,
        amount: result.payment.amount || null,
      } : null,
      subscription: result.subscription || null,
    }, { status: result.ok ? 200 : result.httpStatus });
    if (result.ok && result.subscription?.expiresAt) setSubscriptionAccessCookie(response, String(decoded.userId), result.subscription.expiresAt);
    return response;
  } catch (error) {
    console.error("UddoktaPay verification error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, message: "UddoktaPay payment verification failed. Please try again." }, { status: 500 });
  }
}
