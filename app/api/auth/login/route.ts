import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { authenticateLogin } from "@/lib/loginCore";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { setSubscriptionAccessCookie } from "../../_lib/requireActiveSubscription";
import { enforceAuthRateLimit } from "@/app/api/_lib/authRateLimit";

const JWT_SECRET = process.env.JWT_SECRET || "";

function loginCookie(response: NextResponse, token: string) {
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/**
 * Safe diagnostics: failure category + correlation id + non-secret deployment
 * facts. Never logs the identifier, password, hash, cookies, tokens or URIs.
 */
function logLoginFailure(requestId: string, category: string, status: number) {
  const dbName = mongoose.connection?.name || "unconnected";
  const deployment = process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown";
  const build = (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || "n/a";
  console.warn(
    `[auth-login] requestId=${requestId} status=${status} category=${category} db=${dbName} env=${deployment} build=${build}`,
  );
}

export async function POST(req: Request) {
  const requestId = randomUUID();
  const headers = { "Cache-Control": "no-store, max-age=0", "X-Request-Id": requestId };

  try {
    if (process.env.NODE_ENV === "production" && !JWT_SECRET.trim()) {
      logLoginFailure(requestId, "jwt_secret_missing", 503);
      return NextResponse.json(
        { message: "Secure authentication is not configured on the server.", requestId },
        { status: 503, headers },
      );
    }

    const body = await req.json().catch(() => null);

    await connectDB();

    const outcome = await authenticateLogin(
      {
        findUser: (filter) => User.findOne(filter).lean().exec() as Promise<any>,
        comparePassword: (plain, hash) => bcrypt.compare(plain, hash),
        // The shared MongoDB counters stay active. Both are always evaluated so
        // neither window can be bypassed by exhausting the other first.
        checkRateLimit: (scope, identifier) =>
          scope === "ip"
            ? enforceAuthRateLimit(req, "auth-login-ip", 40, 10 * 60 * 1000)
            : enforceAuthRateLimit(req, "auth-login-identifier", 10, 15 * 60 * 1000, identifier),
      },
      body,
    );

    if (outcome.kind === "bad_request") {
      return NextResponse.json(
        { message: "Enter a valid email/phone number and password.", code: "BAD_REQUEST", requestId },
        { status: 400, headers },
      );
    }

    if (outcome.kind === "rate_limited") {
      logLoginFailure(requestId, "rate_limited", 429);
      return NextResponse.json(
        { message: "Too many login attempts. Please wait before trying again.", code: "RATE_LIMITED", requestId },
        { status: 429, headers: { ...headers, "Retry-After": String(outcome.retryAfterSeconds) } },
      );
    }

    if (outcome.kind === "invalid_credentials") {
      logLoginFailure(requestId, outcome.category, 401);
      // One generic response for unknown account, wrong password and a missing hash.
      return NextResponse.json(
        { message: "Invalid email/phone number or password.", code: "INVALID_CREDENTIALS", requestId },
        { status: 401, headers },
      );
    }

    const user = outcome.user as Record<string, any>;

    // The role comes only from the saved account record; clients cannot set it.
    const role = user.role === "admin" ? ("admin" as const) : ("user" as const);
    const loginAt = new Date();
    await User.updateOne(
      { _id: user._id },
      {
        $set: { lastLoginAt: loginAt, lastSeenAt: loginAt },
        $inc: { loginCount: 1 },
      },
    );

    const token = jwt.sign(
      {
        userId: String(user._id),
        phoneNumber: user.phoneNumber,
        // Signed role claim is for navigation only; privileged pages and APIs
        // re-check the live MongoDB role and sessionVersion.
        role,
        primaryAdmin: user.isPrimaryAdmin === true,
        sessionVersion: Number(user.sessionVersion || 0),
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    const response = NextResponse.json(
      {
        message: "Login successful!",
        // Admin JWTs remain only in the HttpOnly cookie; do not expose them to JS.
        ...(role === "admin" ? {} : { token }),
        user: {
          id: user._id,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          email: user.email,
          district: user.district,
          country: user.country,
          profileImageUrl: user.profileImageUrl || "",
          profileImagePublicId: user.profileImagePublicId || "",
          role,
          isRootAdmin: user.isPrimaryAdmin === true,
          isBanned: user.isBanned === true,
          lastLoginAt: loginAt,
          loginCount: Number(user.loginCount || 0) + 1,
        },
      },
      { status: 200, headers },
    );

    const activeSubscription = await Subscription.findOne({
      userId: user._id,
      paymentStatus: "COMPLETED",
      accessStatus: "ACTIVE",
      expiresAt: { $gt: new Date() },
    })
      .sort({ expiresAt: -1, startedAt: -1 })
      .select("expiresAt")
      .lean();

    loginCookie(response, token);
    if (activeSubscription?.expiresAt) {
      setSubscriptionAccessCookie(response, String(user._id), activeSubscription.expiresAt);
    }

    return response;
  } catch (error: unknown) {
    // Infrastructure faults are a 5xx, never a credential failure.
    console.error(`[auth-login] requestId=${requestId} category=server_error`, error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { message: "Login could not be completed. Please try again.", code: "SERVER_ERROR", requestId },
      { status: 500, headers },
    );
  }
}
