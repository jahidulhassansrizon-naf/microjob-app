import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";

export const dynamic = "force-dynamic";

const JWT_SECRET =
  process.env.JWT_SECRET || "your_super_secret_jwt_key_12345";

function getTokenFromCookie(cookieHeader: string | null) {
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

    const token = getTokenFromCookie(request.headers.get("cookie"));

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

    const subscription = await Subscription.findOne({
      userId: decoded.userId,
      paymentStatus: "COMPLETED",
      accessStatus: "ACTIVE",
      expiresAt: { $gt: now },
    })
      .sort({ expiresAt: -1, startedAt: -1 })
      .lean();

    if (!subscription) {
      return NextResponse.json({
        success: true,
        subscription: null,
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: String(subscription._id),
        planId: subscription.planId,
        planName: subscription.planName,
        amount: Number(subscription.amount),
        paymentStatus: subscription.paymentStatus,
        accessStatus: subscription.accessStatus,
        startedAt: subscription.startedAt
          ? new Date(subscription.startedAt).toISOString()
          : null,
        expiresAt: subscription.expiresAt
          ? new Date(subscription.expiresAt).toISOString()
          : null,
      },
    });
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
