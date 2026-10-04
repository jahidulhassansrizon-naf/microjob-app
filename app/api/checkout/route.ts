import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_12345";

const PAYMENTLY_BASE_URL = (
  process.env.PAYMENTLY_BASE_URL || "https://test-app.paymently.io/api"
)
  .trim()
  .replace(/\/+$/, "");

const PAYMENTLY_API_KEY = process.env.PAYMENTLY_API_KEY?.trim();

const APP_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "http://localhost:3000"
)
  .trim()
  .replace(/\/+$/, "");

const PLANS = {
  "1-month": {
    name: "1 Month",
    months: 1,
    days: 30,
    amount: 199,
  },
  "3-month": {
    name: "3 Months",
    months: 3,
    days: 90,
    amount: 499,
  },
  "6-month": {
    name: "6 Months",
    months: 6,
    days: 180,
    amount: 799,
  },
  "1-year": {
    name: "1 Year",
    months: 12,
    days: 365,
    amount: 1299,
  },
} as const;

type PlanId = keyof typeof PLANS;

type JwtPayload = {
  userId: string;
  exp?: number;
};

function getTokenFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;

  const tokenPair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));

  return tokenPair
    ? decodeURIComponent(tokenPair.slice("token=".length))
    : null;
}

function keyFingerprint(key: string | undefined) {
  if (!key) return "MISSING";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export async function POST(request: Request) {
  let subscriptionId: string | null = null;

  try {
    await connectDB();

    console.log("[Paymently] Base URL:", PAYMENTLY_BASE_URL);
    console.log(
      "[Paymently] API key loaded:",
      Boolean(PAYMENTLY_API_KEY),
      "length:",
      PAYMENTLY_API_KEY?.length ?? 0,
      "fingerprint:",
      keyFingerprint(PAYMENTLY_API_KEY),
    );

    if (!PAYMENTLY_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "PAYMENTLY_API_KEY is missing in .env.local",
        },
        { status: 500 },
      );
    }

    const body = await request.json();
    const planId = body?.metadata?.plan_id as PlanId | undefined;

    if (!planId || !(planId in PLANS)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid subscription plan.",
        },
        { status: 400 },
      );
    }

    const token = getTokenFromCookie(request.headers.get("cookie"));

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in before starting a payment.",
        },
        { status: 401 },
      );
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Your login session has expired. Please log in again.",
        },
        { status: 401 },
      );
    }

    if (!decoded.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid login token.",
        },
        { status: 401 },
      );
    }

    const user = await User.findById(decoded.userId).select(
      "fullName email phoneNumber",
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User account was not found.",
        },
        { status: 404 },
      );
    }

    const plan = PLANS[planId];

    const subscription = await Subscription.create({
      userId: user._id,
      planId,
      planName: plan.name,
      months: plan.months,
      amount: plan.amount,
      paymentStatus: "PENDING",
      accessStatus: "PENDING",
    });

    subscriptionId = String(subscription._id);

    const endpoint = `${PAYMENTLY_BASE_URL}/checkout-v2`;

    const payload = {
      full_name: user.fullName,
      email: user.email,
      amount: String(plan.amount),
      metadata: {
        user_id: String(user._id),
        subscription_id: subscriptionId,
        plan_id: planId,
        plan_name: plan.name,
        months: plan.months,
        days: plan.days,
      },
      redirect_url: `${APP_URL}/payment/success`,
      return_type: "GET",
      cancel_url: `${APP_URL}/payment/cancel`,
      webhook_url: `${APP_URL}/api/payment/webhook`,
    };

    console.log("[Paymently] Checkout endpoint:", endpoint);
    console.log("[Paymently] Checkout plan:", {
      planId,
      amount: plan.amount,
      subscriptionId,
    });

    const providerResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "RT-UDDOKTAPAY-API-KEY": PAYMENTLY_API_KEY,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const rawText = await providerResponse.text();

    let providerData: any = null;
    try {
      providerData = rawText ? JSON.parse(rawText) : null;
    } catch {
      providerData = { raw: rawText };
    }

    console.log("[Paymently] Response status:", providerResponse.status);
    console.log("[Paymently] Response body:", providerData);

    if (!providerResponse.ok) {
      await Subscription.findByIdAndUpdate(subscriptionId, {
        paymentStatus: "ERROR",
      });

      return NextResponse.json(
        {
          success: false,
          message:
            providerData?.message ||
            `Payment provider rejected the checkout request (${providerResponse.status}).`,
          providerStatus: providerResponse.status,
          providerResponse: providerData,
        },
        { status: providerResponse.status },
      );
    }

    const paymentUrl =
      providerData?.payment_url ||
      providerData?.checkout_url ||
      providerData?.url;

    if (!paymentUrl) {
      await Subscription.findByIdAndUpdate(subscriptionId, {
        paymentStatus: "ERROR",
      });

      return NextResponse.json(
        {
          success: false,
          message: "Payment provider returned no payment URL.",
          providerResponse: providerData,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      payment_url: paymentUrl,
      subscription_id: subscriptionId,
      invoice_id: providerData?.invoice_id || null,
    });
  } catch (error) {
    console.error("[Paymently] Checkout error:", error);

    if (subscriptionId) {
      try {
        await Subscription.findByIdAndUpdate(subscriptionId, {
          paymentStatus: "ERROR",
        });
      } catch (dbError) {
        console.error(
          "[Paymently] Failed to mark subscription as ERROR:",
          dbError,
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Payment request failed.",
      },
      { status: 500 },
    );
  }
}
