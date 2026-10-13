import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import User from "@/models/User";

const JWT_SECRET =
  process.env.JWT_SECRET || "";

type JwtPayload = {
  userId?: string;
  exp?: number;
};

type AuthSuccess = {
  ok: true;
  userId: string;
};

type AuthFailure = {
  ok: false;
  response: NextResponse;
};

export type SubscriptionAuthResult = AuthSuccess | AuthFailure;

const SUBSCRIPTION_ACCESS_COOKIE = "subscription_access";
const SUBSCRIPTION_ACCESS_TTL_SECONDS = 60 * 5;

export function createSubscriptionAccessToken(
  userId: string,
  subscriptionExpiresAt: Date | string | number,
): string {
  const expiresAtMs = new Date(subscriptionExpiresAt).getTime();
  const maxLifetimeMs = SUBSCRIPTION_ACCESS_TTL_SECONDS * 1000;
  const tokenExpiryMs = Math.min(expiresAtMs, Date.now() + maxLifetimeMs);

  return jwt.sign(
    {
      userId,
      subscriptionExpiresAt: expiresAtMs,
      type: "subscription-access",
    },
    JWT_SECRET,
    {
      expiresIn: Math.max(1, Math.floor((tokenExpiryMs - Date.now()) / 1000)),
    },
  );
}

export function getUserIdFromSubscriptionAccessToken(
  token: string | null,
): string | null {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & {
      subscriptionExpiresAt?: number;
      type?: string;
    };

    if (
      decoded.type !== "subscription-access" ||
      typeof decoded.userId !== "string" ||
      !decoded.subscriptionExpiresAt ||
      decoded.subscriptionExpiresAt <= Date.now()
    ) {
      return null;
    }

    return decoded.userId;
  } catch {
    return null;
  }
}

export function setSubscriptionAccessCookie(
  response: NextResponse,
  userId: string,
  subscriptionExpiresAt: Date | string | number,
) {
  const expiresAtMs = new Date(subscriptionExpiresAt).getTime();
  const maxAge = Math.max(
    1,
    Math.min(
      SUBSCRIPTION_ACCESS_TTL_SECONDS,
      Math.floor((expiresAtMs - Date.now()) / 1000),
    ),
  );

  response.cookies.set(SUBSCRIPTION_ACCESS_COOKIE, createSubscriptionAccessToken(userId, expiresAtMs), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearSubscriptionAccessCookie(response: NextResponse) {
  response.cookies.set(SUBSCRIPTION_ACCESS_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export function getSubscriptionAccessCookieName() {
  return SUBSCRIPTION_ACCESS_COOKIE;
}


function getTokenFromRequest(request: Request): string | null {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);

  return match ? decodeURIComponent(match[1]) : null;
}

export function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = typeof decoded.userId === "string" ? decoded.userId : "";

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  if (!mongoose.isValidObjectId(userId)) return false;

  await connectDB();

  const now = new Date();

  const [subscription, user] = await Promise.all([
    Subscription.findOne({
      userId,
      paymentStatus: "COMPLETED",
      accessStatus: "ACTIVE",
      expiresAt: { $gt: now },
    })
      .select("_id")
      .lean(),
    User.findById(userId)
      .select("manualAccessEnabled manualAccessExpiresAt")
      .lean(),
  ]);

  const manualExpiry = user?.manualAccessExpiresAt
    ? new Date(user.manualAccessExpiresAt).getTime()
    : 0;
  const hasManualAccess =
    user?.manualAccessEnabled === true && manualExpiry > now.getTime();

  return Boolean(subscription || hasManualAccess);
}

/**
 * Server-side guard for paid tool/API operations.
 *
 * This deliberately checks the database on every protected request rather
 * than trusting client-side UI state, localStorage, or query parameters.
 */
export async function requireActiveSubscription(
  request: Request,
): Promise<SubscriptionAuthResult> {
  const token = getTokenFromRequest(request);

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          code: "AUTH_REQUIRED",
          message: "Please log in before using this paid tool.",
        },
        { status: 401 },
      ),
    };
  }

  let userId: string | null = null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    userId =
      typeof decoded.userId === "string" ? decoded.userId : null;
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          code: "INVALID_SESSION",
          message: "Your login session is invalid or expired.",
        },
        { status: 401 },
      ),
    };
  }

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          code: "INVALID_SESSION",
          message: "Invalid user session.",
        },
        { status: 401 },
      ),
    };
  }

  try {
    const active = await hasActiveSubscription(userId);

    if (!active) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            code: "SUBSCRIPTION_REQUIRED",
            message:
              "An active subscription is required to use this paid tool.",
          },
          { status: 403 },
        ),
      };
    }
  } catch (error) {
    console.error("[subscription-guard] subscription lookup failed:", error);

    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          code: "SUBSCRIPTION_CHECK_FAILED",
          message: "Could not verify subscription access.",
        },
        { status: 503 },
      ),
    };
  }

  return { ok: true, userId };
}
