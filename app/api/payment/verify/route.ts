import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import { verifyAndActivateSubscription } from "../_lib/piprapay";
import { setSubscriptionAccessCookie } from "../../_lib/requireActiveSubscription";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "";

type JwtPayload = { userId?: string; exp?: number };

function getTokenFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const pair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));
  if (!pair) return null;
  try {
    return decodeURIComponent(pair.slice("token=".length));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ success: false, message: "Authentication is not configured on the server." }, { status: 500 });
    }
    const token = getTokenFromCookie(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ success: false, message: "Please log in before verifying this payment." }, { status: 401 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return NextResponse.json({ success: false, message: "Your login session has expired." }, { status: 401 });
    }
    if (!decoded?.userId) {
      return NextResponse.json({ success: false, message: "Invalid login token." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const ppId = String(body?.pp_id || body?.ppId || "").trim();
    const subscriptionId = String(body?.subscription_id || body?.subscriptionId || "").trim();
    if (!ppId && !subscriptionId) {
      return NextResponse.json({ success: false, message: "A PipraPay pp_id or subscription reference is required." }, { status: 400 });
    }

    // When PipraPay redirects before its webhook arrives, the browser may only
    // have our order reference. This branch only reads the order; it never grants
    // access unless the webhook already verified it or a stored pp_id is verified.
    let candidatePpId = ppId;
    if (subscriptionId) {
      if (!mongoose.isValidObjectId(subscriptionId)) {
        return NextResponse.json({ success: false, message: "Invalid subscription reference." }, { status: 400 });
      }
      await connectDB();
      const order = await Subscription.findOne({
        _id: subscriptionId,
        userId: decoded.userId,
        paymentProvider: "PipraPay",
      }).select("invoiceId paymentStatus accessStatus expiresAt");
      if (!order) {
        return NextResponse.json({ success: false, message: "This PipraPay order was not found for your account." }, { status: 404 });
      }
      if (!candidatePpId && order.invoiceId) candidatePpId = String(order.invoiceId);
      if (!candidatePpId && order.paymentStatus === "COMPLETED" && order.accessStatus === "ACTIVE") {
        const response = NextResponse.json({
          success: true,
          alreadyCompleted: true,
          paymentStatus: "COMPLETED",
          message: "PipraPay payment has been confirmed and your subscription access is active.",
          subscription: { id: String(order._id), accessStatus: order.accessStatus, paymentStatus: order.paymentStatus, expiresAt: order.expiresAt },
        });
        if (order.expiresAt) setSubscriptionAccessCookie(response, String(decoded.userId), order.expiresAt);
        return response;
      }
      if (!candidatePpId && order.paymentStatus === "PENDING" && order.accessStatus === "PENDING") {
        return NextResponse.json({
          success: false,
          paymentStatus: "PENDING",
          message: "PipraPay is still confirming the payment. This page will check again automatically.",
        }, { status: 202 });
      }
      if (!candidatePpId) {
        return NextResponse.json({
          success: false,
          paymentStatus: order.paymentStatus,
          message: "This payment order is no longer awaiting a PipraPay reference. Please contact support if you need help.",
        }, { status: 409 });
      }
    }

    if (!candidatePpId) {
      return NextResponse.json({ success: false, paymentStatus: "PENDING", message: "The PipraPay payment reference has not arrived yet." }, { status: 202 });
    }

    const result = await verifyAndActivateSubscription(candidatePpId, {
      expectedUserId: String(decoded.userId),
      expectedSubscriptionId: subscriptionId || undefined,
    });

    const response = NextResponse.json({
      success: result.ok,
      alreadyCompleted: Boolean(result.alreadyCompleted),
      paymentStatus: result.paymentStatus || result.payment?.payment_status || result.payment?.status || null,
      message: result.message,
      payment: result.payment ? {
        pp_id: result.payment.pp_id || result.payment.payment_id || candidatePpId,
        transaction_id: result.payment.transaction_id || null,
        sender_number: result.payment.sender_number || result.payment.sender || null,
        payment_method: result.payment.payment_method || result.payment.gateway || null,
        status: result.payment.payment_status || result.payment.status || null,
        amount: result.payment.amount || null,
        currency: result.payment.currency || null,
      } : null,
      subscription: result.subscription || null,
    }, { status: result.ok ? 200 : result.httpStatus });

    if (result.ok && result.subscription?.expiresAt) {
      setSubscriptionAccessCookie(response, String(decoded.userId), result.subscription.expiresAt);
    }
    return response;
  } catch (error) {
    console.error("PipraPay payment verification error:", error);
    return NextResponse.json({ success: false, message: "PipraPay payment verification failed. Please try again." }, { status: 500 });
  }
}
