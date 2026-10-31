import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { SUBSCRIPTION_PLAN_BY_ID, type SubscriptionPlanId } from "@/app/_lib/subscriptionPlans";
import { createUddoktaPayCheckout, getUddoktaPayConfig } from "@/app/api/uddoktapay/_lib/uddoktapay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const JWT_SECRET = process.env.JWT_SECRET || "";
const APP_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").trim().replace(/\/+$/, "");
type JwtPayload = { userId?: string; exp?: number };

function getTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim() || null;
  const cookieHeader = request.headers.get("cookie");
  const pair = cookieHeader?.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="));
  if (!pair) return null;
  try { return decodeURIComponent(pair.slice("token=".length)); } catch { return null; }
}

export async function POST(request: Request) {
  let subscriptionId = "";
  try {
    if (!JWT_SECRET) return NextResponse.json({ success: false, message: "Authentication is not configured on the server." }, { status: 500 });
    if (!APP_URL || (process.env.NODE_ENV === "production" && !APP_URL.startsWith("https://"))) return NextResponse.json({ success: false, message: "Set NEXT_PUBLIC_SITE_URL to your public HTTPS website URL." }, { status: 503 });
    const config = await getUddoktaPayConfig();
    if (!config.configured) return NextResponse.json({ success: false, message: "Save the UddoktaPay Hosted Domain and API Key in Admin → Payment Gateway first." }, { status: 503 });
    if (!config.enabled) return NextResponse.json({ success: false, message: "UddoktaPay checkout is currently disabled by the administrator." }, { status: 503 });

    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, message: "Please log in before starting a payment." }, { status: 401 });
    let decoded: JwtPayload;
    try { decoded = jwt.verify(token, JWT_SECRET) as JwtPayload; } catch { return NextResponse.json({ success: false, message: "Your login session has expired. Please log in again." }, { status: 401 }); }
    if (!decoded.userId) return NextResponse.json({ success: false, message: "Invalid login token." }, { status: 401 });

    const body = await request.json().catch(() => null);
    const planId = String(body?.planId || body?.plan_id || "") as SubscriptionPlanId;
    if (!Object.prototype.hasOwnProperty.call(SUBSCRIPTION_PLAN_BY_ID, planId)) return NextResponse.json({ success: false, message: "Invalid subscription plan." }, { status: 400 });

    await connectDB();
    const user = await User.findById(decoded.userId).select("fullName email phoneNumber");
    if (!user) return NextResponse.json({ success: false, message: "User account was not found." }, { status: 404 });
    const email = String(user.email || "").trim();
    if (!email) return NextResponse.json({ success: false, message: "Add an email address to your profile before paying with UddoktaPay." }, { status: 400 });

    const plan = SUBSCRIPTION_PLAN_BY_ID[planId];
    const subscription = await Subscription.create({
      userId: user._id,
      planId,
      planName: plan.name,
      months: plan.months,
      amount: plan.price,
      paymentProvider: "UddoktaPay",
      paymentMethod: "UddoktaPay",
      paymentStatus: "PENDING",
      accessStatus: "PENDING",
      reviewStatus: "PENDING",
    });
    subscriptionId = String(subscription._id);

    const redirectUrl = new URL("/api/uddoktapay/return", `${APP_URL}/`);
    redirectUrl.searchParams.set("subscription_id", subscriptionId);
    const cancelUrl = new URL("/api/uddoktapay/cancel", `${APP_URL}/`);
    cancelUrl.searchParams.set("subscription_id", subscriptionId);

    const provider = await createUddoktaPayCheckout({
      fullName: String(user.fullName || "Customer").trim() || "Customer",
      email,
      amount: plan.price,
      metadata: {
        user_id: String(user._id),
        subscription_id: subscriptionId,
        plan_id: planId,
        plan_name: plan.name,
        currency: "BDT",
      },
      redirectUrl: redirectUrl.toString(),
      cancelUrl: cancelUrl.toString(),
      webhookUrl: `${APP_URL}/api/uddoktapay/webhook`,
    });

    if (!provider.providerOk || !provider.checkoutUrl) {
      await Subscription.findByIdAndUpdate(subscriptionId, { paymentStatus: "ERROR" });
      return NextResponse.json({ success: false, message: provider.message }, { status: provider.httpStatus >= 400 ? provider.httpStatus : 502 });
    }
    return NextResponse.json({ success: true, payment_url: provider.checkoutUrl, subscription_id: subscriptionId }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[UddoktaPay Checkout] error:", error instanceof Error ? error.message : "Unknown error");
    if (subscriptionId) {
      try { await Subscription.findByIdAndUpdate(subscriptionId, { paymentStatus: "ERROR" }); } catch { /* Preserve original checkout error. */ }
    }
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json({ success: false, message: timedOut ? "UddoktaPay did not respond in time. Please try again." : "Could not start the UddoktaPay payment. Please try again." }, { status: timedOut ? 504 : 500 });
  }
}
