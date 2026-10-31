import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { SUBSCRIPTION_PLAN_BY_ID, type SubscriptionPlanId } from "@/app/_lib/subscriptionPlans";
import {
  createPipraPayCheckout,
  getPipraPayConfig,
} from "@/app/api/payment/_lib/piprapay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "";
const APP_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  ""
).trim().replace(/\/+$/, "");

type JwtPayload = { userId?: string; exp?: number };
type PlanId = SubscriptionPlanId;

function getTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const bearer = authorization.slice("Bearer ".length).trim();
    if (bearer) return bearer;
  }
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const tokenPair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));
  if (!tokenPair) return null;
  try {
    return decodeURIComponent(tokenPair.slice("token=".length));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let subscriptionId = "";

  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ success: false, message: "Authentication is not configured on the server." }, { status: 500 });
    }
    if (!APP_URL || (process.env.NODE_ENV === "production" && !APP_URL.startsWith("https://"))) {
      return NextResponse.json({ success: false, message: "Set NEXT_PUBLIC_SITE_URL to your public HTTPS website URL." }, { status: 503 });
    }

    const config = await getPipraPayConfig();
    if (!config.configured) {
      return NextResponse.json({ success: false, message: "Save the PipraPay Base URL and API Key in Admin → Payment Gateway before testing checkout." }, { status: 503 });
    }
    if (!config.enabled) {
      return NextResponse.json({ success: false, message: "PipraPay is configured but remains disabled until an administrator completes connection and payment testing." }, { status: 503 });
    }

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, message: "Please log in before starting a payment." }, { status: 401 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return NextResponse.json({ success: false, message: "Your login session has expired. Please log in again." }, { status: 401 });
    }
    if (!decoded.userId) {
      return NextResponse.json({ success: false, message: "Invalid login token." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const planId = String(body?.planId || body?.plan_id || "") as PlanId;
    if (!Object.prototype.hasOwnProperty.call(SUBSCRIPTION_PLAN_BY_ID, planId)) {
      return NextResponse.json({ success: false, message: "Invalid subscription plan." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(decoded.userId).select("fullName email phoneNumber");
    if (!user) {
      return NextResponse.json({ success: false, message: "User account was not found." }, { status: 404 });
    }

    const emailAddress = String(user.email || "").trim();
    const mobileNumber = String(user.phoneNumber || "").trim();
    if (!emailAddress || !mobileNumber) {
      return NextResponse.json(
        { success: false, message: "Add both an email address and mobile number to your profile before paying with PipraPay." },
        { status: 400 },
      );
    }

    const plan = SUBSCRIPTION_PLAN_BY_ID[planId];
    const subscription = await Subscription.create({
      userId: user._id,
      planId,
      planName: plan.name,
      months: plan.months,
      amount: plan.price,
      paymentProvider: "PipraPay",
      paymentMethod: "PipraPay",
      paymentStatus: "PENDING",
      accessStatus: "PENDING",
      reviewStatus: "PENDING",
    });
    subscriptionId = String(subscription._id);

    // Current self-hosted PipraPay redirect-checkout API. The provider's
    // returned pp_id is stored before sending the checkout URL to the browser.
    const returnUrl = new URL("/api/payment/return", `${APP_URL}/`);
    returnUrl.searchParams.set("subscription_id", subscriptionId);

    const provider = await createPipraPayCheckout({
      fullName: String(user.fullName || "Customer").trim() || "Customer",
      emailAddress,
      mobileNumber,
      amount: plan.price,
      metadata: {
        user_id: String(user._id),
        subscription_id: subscriptionId,
        plan_id: planId,
        plan_name: plan.name,
        amount: plan.price,
        currency: "BDT",
      },
      returnUrl: returnUrl.toString(),
      webhookUrl: `${APP_URL}/api/payment/webhook`,
    });

    if (!provider.providerOk || !provider.checkoutUrl) {
      await Subscription.findByIdAndUpdate(subscriptionId, { paymentStatus: "ERROR" });
      const responseStatus = provider.httpStatus >= 400 ? provider.httpStatus : 502;
      return NextResponse.json(
        { success: false, message: provider.message },
        { status: responseStatus },
      );
    }

    const providerRecord = provider.payment || {};
    const providerPpId = provider.ppId;
    const providerInvoiceId = String(providerRecord?.invoice_id || providerRecord?.invoiceId || "").trim();
    const orderUpdate: Record<string, string> = {};
    if (providerPpId) orderUpdate.invoiceId = providerPpId;
    if (providerInvoiceId) orderUpdate.providerInvoiceId = providerInvoiceId;
    if (Object.keys(orderUpdate).length) {
      await Subscription.findByIdAndUpdate(subscriptionId, { $set: orderUpdate });
    }

    return NextResponse.json({
      success: true,
      payment_url: provider.checkoutUrl,
      subscription_id: subscriptionId,
      pp_id: providerPpId || null,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[PipraPay Checkout] error:", error);
    if (subscriptionId) {
      try {
        await Subscription.findByIdAndUpdate(subscriptionId, { paymentStatus: "ERROR" });
      } catch (dbError) {
        console.error("[PipraPay Checkout] failed to mark the order as ERROR:", dbError);
      }
    }
    const isTimeout = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      { success: false, message: isTimeout ? "PipraPay did not respond in time. Please try again." : "Could not start the PipraPay payment. Please try again." },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
