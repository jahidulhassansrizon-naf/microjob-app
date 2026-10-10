import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "";

const PLANS = {
  "1-month": { name: "1 Month", months: 1, days: 30, amount: 199 },
  "3-month": { name: "3 Months", months: 3, days: 90, amount: 499 },
  "6-month": { name: "6 Months", months: 6, days: 180, amount: 799 },
  "1-year": { name: "1 Year", months: 12, days: 365, amount: 1299 },
} as const;

type PlanId = keyof typeof PLANS;

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

    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };

    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid login token." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    const planId = body?.plan_id as PlanId | undefined;

    if (!planId || !(planId in PLANS)) {
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

    const plan = PLANS[planId];

    const now = new Date();
    const subscription = await Subscription.create({
      userId: user._id,
      planId,
      planName: plan.name,
      months: plan.months,
      amount: plan.amount,
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
