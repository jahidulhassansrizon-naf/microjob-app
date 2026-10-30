import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { SUBSCRIPTION_PLAN_BY_ID, type SubscriptionPlanId } from "@/app/_lib/subscriptionPlans";
import { getPipraPayConfig } from "@/app/api/payment/_lib/piprapay";

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

function providerMessage(payload: any) {
  const message = payload?.message || payload?.error || payload?.data?.message;
  return typeof message === "string" ? message.slice(0, 300) : "PipraPay could not create the payment request.";
}

function getCheckoutUrl(payload: any) {
  const candidates = [
    payload?.pp_url,
    payload?.checkout_url,
    payload?.payment_url,
    payload?.url,
    payload?.data?.pp_url,
    payload?.data?.checkout_url,
    payload?.data?.payment_url,
    payload?.data?.url,
  ];
  const value = candidates.find((item) => typeof item === "string" && item.trim());
  if (!value) return "";
  try {
    const parsed = new URL(String(value));
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  let subscriptionId = "";

  try {
    if (String(process.env.PIPRAPAY_ENABLED || "").toLowerCase() !== "true") {
      return NextResponse.json(
        { success: false, message: "PipraPay is being integrated. Please use the available manual bKash/Nagad payment option for now." },
        { status: 503 },
      );
    }
    if (!JWT_SECRET) {
      return NextResponse.json({ success: false, message: "Authentication is not configured on the server." }, { status: 500 });
    }
    if (!APP_URL || (process.env.NODE_ENV === "production" && !APP_URL.startsWith("https://"))) {
      return NextResponse.json({ success: false, message: "Set NEXT_PUBLIC_SITE_URL to your public HTTPS website URL." }, { status: 503 });
    }

    const config = getPipraPayConfig();
    if (!config.apiKey) {
      return NextResponse.json({ success: false, message: "PIPRAPAY_API_KEY is not configured on the server." }, { status: 503 });
    }
    if (!config.baseUrl) {
      return NextResponse.json({ success: false, message: "PIPRAPAY_BASE_URL is not configured on the server." }, { status: 503 });
    }
    if (process.env.NODE_ENV === "production" && !config.baseUrlExplicitlyConfigured) {
      return NextResponse.json({ success: false, message: "Set PIPRAPAY_BASE_URL to the client's live PipraPay API domain before accepting production payments." }, { status: 503 });
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

    const emailMobile = String(user.email || user.phoneNumber || "").trim();
    if (!emailMobile) {
      return NextResponse.json({ success: false, message: "Add an email address or mobile number to your profile before paying." }, { status: 400 });
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

    // PipraPay V2 returns pp_id through the redirect request body. Use a server
    // callback so both GET and POST return modes can be normalized safely.
    const returnUrl = new URL("/api/payment/return", `${APP_URL}/`);
    returnUrl.searchParams.set("subscription_id", subscriptionId);
    const cancelUrl = new URL("/subscription", `${APP_URL}/`);
    cancelUrl.searchParams.set("payment", "cancelled");

    const payload = {
      full_name: String(user.fullName || "Customer").trim() || "Customer",
      email_mobile: emailMobile,
      amount: String(plan.price),
      metadata: {
        user_id: String(user._id),
        subscription_id: subscriptionId,
        plan_id: planId,
        plan_name: plan.name,
        amount: plan.price,
        currency: "BDT",
      },
      redirect_url: returnUrl.toString(),
      return_type: "POST",
      cancel_url: cancelUrl.toString(),
      webhook_url: `${APP_URL}/api/payment/webhook`,
      currency: "BDT",
    };

    const providerResponse = await fetch(`${config.apiBaseUrl}/create-charge`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "mh-piprapay-api-key": config.apiKey,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    const raw = await providerResponse.text();
    let providerData: any = {};
    try {
      providerData = raw ? JSON.parse(raw) : {};
    } catch {
      providerData = { message: "PipraPay returned an unreadable response." };
    }

    if (!providerResponse.ok || providerData?.success === false || providerData?.status === false) {
      await Subscription.findByIdAndUpdate(subscriptionId, { paymentStatus: "ERROR" });
      return NextResponse.json(
        { success: false, message: providerMessage(providerData) },
        { status: providerResponse.ok ? 502 : providerResponse.status },
      );
    }

    const providerRecord = providerData?.data && typeof providerData.data === "object"
      ? { ...providerData, ...providerData.data }
      : providerData;
    const paymentUrl = getCheckoutUrl(providerRecord);
    if (!paymentUrl) {
      await Subscription.findByIdAndUpdate(subscriptionId, { paymentStatus: "ERROR" });
      return NextResponse.json(
        { success: false, message: "PipraPay did not return a valid checkout URL. Check your API base URL and account API version." },
        { status: 502 },
      );
    }

    const providerPpId = String(providerRecord?.pp_id || providerRecord?.ppId || providerRecord?.payment_id || "").trim();
    const providerInvoiceId = String(providerRecord?.invoice_id || providerRecord?.invoiceId || "").trim();
    const orderUpdate: Record<string, string> = {};
    if (providerPpId) orderUpdate.invoiceId = providerPpId;
    if (providerInvoiceId) orderUpdate.providerInvoiceId = providerInvoiceId;
    if (Object.keys(orderUpdate).length) {
      await Subscription.findByIdAndUpdate(subscriptionId, { $set: orderUpdate });
    }

    return NextResponse.json({
      success: true,
      payment_url: paymentUrl,
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
