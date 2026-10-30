import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import User from "@/models/User";
import { ENV_ADMIN_USER_ID } from "@/lib/adminCredentials";

const JWT_SECRET =
  process.env.JWT_SECRET || "";

type JwtPayload = {
  userId?: string;
  role?: string;
  admin?: boolean;
  exp?: number;
  sessionVersion?: number;
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
  // Browser HttpOnly cookie is canonical; fall back to Bearer for API clients.
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
  if (match) {
    try { return decodeURIComponent(match[1]); }
    catch { return match[1]; }
  }

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }
  return null;
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
      .select("manualAccessEnabled manualAccessExpiresAt isBanned role")
      .lean(),
  ]);

  const manualExpiry = user?.manualAccessExpiresAt
    ? new Date(user.manualAccessExpiresAt).getTime()
    : 0;
  const hasManualAccess =
    user?.manualAccessEnabled === true && manualExpiry > now.getTime();

  if (user?.isBanned === true && user.role !== "admin") return false;
  if (user?.role === "admin") return true;
  return Boolean(subscription || hasManualAccess);
}

export type ToolAccessResult =
  | { ok: true; userId: string; role: "user" | "admin"; isRootAdmin: boolean }
  | { ok: false; response: NextResponse };

/**
 * Verifies a signed session against the latest account state. This is the
 * shared server-side ban check for tool pages and tool APIs.
 */
export async function requireToolAccess(request: Request): Promise<ToolAccessResult> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, code: "AUTH_REQUIRED", message: "Please log in before using this tool." },
        { status: 401 },
      ),
    };
  }

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, code: "INVALID_SESSION", message: "Your login session is invalid or expired." },
        { status: 401 },
      ),
    };
  }

  if (decoded.admin === true || decoded.userId === ENV_ADMIN_USER_ID) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, code: "INVALID_SESSION", message: "Your administrator session has been retired. Please sign in again." },
        { status: 401 },
      ),
    };
  }

  const userId = typeof decoded.userId === "string" ? decoded.userId : "";
  if (!mongoose.isValidObjectId(userId)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, code: "INVALID_SESSION", message: "Invalid user session." },
        { status: 401 },
      ),
    };
  }

  try {
    await connectDB();
    const user = await User.findById(userId).select("role isBanned sessionVersion isPrimaryAdmin").lean();
    if (!user) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, code: "INVALID_SESSION", message: "This account no longer exists." },
          { status: 401 },
        ),
      };
    }

    if (Number(decoded.sessionVersion || 0) !== Number(user.sessionVersion || 0)) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, code: "SESSION_REVOKED", message: "Your session has been reset. Please log in again." },
          { status: 401 },
        ),
      };
    }

    const role = user.role === "admin" ? "admin" : "user";
    if (role !== "admin" && user.isBanned === true) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, code: "USER_BANNED", message: "Tool access for this account has been disabled by an administrator." },
          { status: 403 },
        ),
      };
    }

    return { ok: true, userId, role, isRootAdmin: user.isPrimaryAdmin === true };
  } catch (error) {
    console.error("[tool-access] account lookup failed:", error);
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, code: "ACCESS_CHECK_FAILED", message: "Could not verify tool access. Please try again." },
        { status: 503 },
      ),
    };
  }
}

/**
 * Server-side guard for paid tool/API operations. The account ban is checked
 * first, even when the endpoint has its own subscription access logic.
 */
export async function requireActiveSubscription(
  request: Request,
): Promise<SubscriptionAuthResult> {
  const toolAccess = await requireToolAccess(request);
  if (!toolAccess.ok) return toolAccess;

  if (toolAccess.role === "admin") {
    return { ok: true, userId: toolAccess.userId };
  }

  try {
    const active = await hasActiveSubscription(toolAccess.userId);
    if (!active) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            code: "SUBSCRIPTION_REQUIRED",
            message: "An active subscription is required to use this paid tool.",
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

  return { ok: true, userId: toolAccess.userId };
}
