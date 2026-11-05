import { getJwtSecret } from "@/lib/jwtSecurity";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { getSubscriptionPlan } from "@/app/api/_lib/subscriptionPlans";

export const dynamic = "force-dynamic";

const JWT_SECRET = getJwtSecret();


function getToken(cookieHeader: string | null) {
  if (!cookieHeader) return null;

  const pair = cookieHeader
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("token="));

  return pair ? decodeURIComponent(pair.slice("token=".length)) : null;
}

export async function POST(request: Request) {
  // Hard stop in production. This endpoint is only for local development.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        message: "Mock payment endpoint is disabled in production.",
      },
      { status: 404 },
    );
  }

  try {
    await connectDB();

    const token = getToken(request.headers.get("cookie"));

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 },
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as { userId?: string };

    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid login token." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    const planId = String(body?.plan_id || "").trim();
    const plan = planId ? await getSubscriptionPlan(planId) : null;

    if (!plan) {
      return NextResponse.json(
        { success: false, message: "Invalid plan_id." },
        { status: 400 },
      );
    }

    const user = await User.findById(decoded.userId).select(
      "fullName email phoneNumber",
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User account was not found." },
        { status: 404 },
      );
    }

    const now = new Date();
    const subscription = await Subscription.create({
      userId: user._id,
      planId,
      planName: plan.name,
      months: plan.months,
      planDays: plan.days,
      amount: plan.price,
      paymentStatus: "COMPLETED",
      accessStatus: "ACTIVE",
      invoiceId: `MOCK-${Date.now()}`,
    });

    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + plan.days);

    subscription.set({
      transactionId: `MOCK-TRX-${Date.now()}`,
      paymentMethod: "Nagad Personal (MOCK)",
      startedAt: now,
      expiresAt,
    });

    await subscription.save();

    return NextResponse.json({
      success: true,
      mock: true,
      subscription: {
        id: String(subscription._id),
        planId,
        planName: plan.name,
        paymentStatus: subscription.paymentStatus,
        accessStatus: subscription.accessStatus,
        startedAt: now,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("[MOCK PAYMENT] error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Mock payment failed.",
      },
      { status: 500 },
    );
  }
}
