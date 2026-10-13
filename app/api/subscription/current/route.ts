import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import User from "@/models/User";
import {
  clearSubscriptionAccessCookie,
  setSubscriptionAccessCookie,
} from "@/app/api/_lib/requireActiveSubscription";

export const dynamic = "force-dynamic";

const JWT_SECRET =
  process.env.JWT_SECRET || "";

function getTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice("Bearer ".length).trim();
    if (bearerToken) return bearerToken;
  }

  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) return null;

  const pair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));

  return pair
    ? decodeURIComponent(pair.slice("token=".length))
    : null;
}

export async function GET(request: Request) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in to view your subscription.",
        },
        { status: 401 },
      );
    }

    let decoded: { userId?: string };

    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Your login session has expired.",
        },
        { status: 401 },
      );
    }

    if (!decoded?.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid login token.",
        },
        { status: 401 },
      );
    }

    const now = new Date();

    const [subscription, user] = await Promise.all([
      Subscription.findOne({
        userId: decoded.userId,
        paymentStatus: "COMPLETED",
        accessStatus: "ACTIVE",
        expiresAt: { $gt: now },
      })
        .sort({ expiresAt: -1, startedAt: -1 })
        .lean(),
      User.findById(decoded.userId)
        .select("manualAccessEnabled manualAccessExpiresAt manualAccessGrantedAt")
        .lean(),
    ]);

    const manualExpiresAtMs = user?.manualAccessExpiresAt
      ? new Date(user.manualAccessExpiresAt).getTime()
      : 0;
    const hasManualAccess =
      user?.manualAccessEnabled === true && manualExpiresAtMs > now.getTime();
    const subscriptionExpiresAtMs = subscription?.expiresAt
      ? new Date(subscription.expiresAt).getTime()
      : 0;
    const effectiveAccessExpiresAtMs = Math.max(
      subscriptionExpiresAtMs,
      hasManualAccess ? manualExpiresAtMs : 0,
    );
    const hasAccess = effectiveAccessExpiresAtMs > now.getTime();

    if (!hasAccess) {
      const response = NextResponse.json({
        success: true,
        subscription: null,
        access: { granted: false, source: "none", expiresAt: null },
      });
      clearSubscriptionAccessCookie(response);
      return response;
    }

    const startedAt = subscription?.startedAt
      ? new Date(subscription.startedAt).toISOString()
      : null;
    const expiresAt = subscription?.expiresAt
      ? new Date(subscription.expiresAt).toISOString()
      : null;

    const response = NextResponse.json({
      success: true,
      subscription: subscription
        ? {
            id: String(subscription._id),
            planId: subscription.planId,
            planName: subscription.planName,
            amount: Number(subscription.amount),
            months: Number(subscription.months || 0),
            paymentStatus: subscription.paymentStatus,
            accessStatus: subscription.accessStatus,
            startedAt,
            expiresAt,
          }
        : null,
      // Keep access authorization separate from payment/subscription records.
      access: {
        granted: true,
        source:
          subscription && hasManualAccess
            ? "subscription+admin"
            : hasManualAccess
              ? "admin"
              : "subscription",
        expiresAt: new Date(effectiveAccessExpiresAtMs).toISOString(),
      },
    });

    setSubscriptionAccessCookie(
      response,
      String(decoded.userId),
      effectiveAccessExpiresAtMs,
    );

    return response;
  } catch (error) {
    console.error("Current subscription lookup error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Could not load subscription status.",
      },
      { status: 500 },
    );
  }
}
