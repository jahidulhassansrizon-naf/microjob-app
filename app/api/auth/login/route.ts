import { bumpEnvAdminSession } from "@/lib/adminSession";
import { randomUUID } from "node:crypto";
import { getJwtSecret } from "@/lib/jwtSecurity";
import { normalizePhoneRateLimitIdentity } from "@/lib/phoneValidation";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { authenticateLogin, normalizeLoginIdentifier, pickSubmittedIdentifier, shouldRehashToCost } from "@/lib/loginCore";
import { BCRYPT_COST } from "../../_lib/passwordPolicy";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { setSubscriptionAccessCookie } from "../../_lib/requireActiveSubscription";
import { checkAuthRateLimit, clearAuthRateLimit, recordAuthRateLimitFailure } from "../../_lib/authRateLimit";
import {
  ENV_ADMIN_USER_ID,
  getAdminCredentialVersion,
  getAdminCredentials,
  safeSecretEquals,
} from "@/lib/adminCredentials";

const JWT_SECRET = getJwtSecret();
const LOGIN_ACCOUNT_LIMIT = 10;
const LOGIN_ACCOUNT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_IP_LIMIT = 150;
const LOGIN_IP_WINDOW_MS = 10 * 60 * 1000;
const DUMMY_PASSWORD_HASH = "$2b$12$UwCKAIUdT4rrPktvtkcpK.LYsY50khtCvCdqBkpFnHs1ms/Yqw2cq";
const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };

function loginCookie(response: NextResponse, token: string) {
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

function requestId() { return randomUUID(); }

function loginRateLimitIdentity(identifier: string): string {
  return identifier.includes("@") ? identifier.trim().toLowerCase() : normalizePhoneRateLimitIdentity(identifier);
}

async function loginRateLimitStatus(req: Request, identifier: string) {
  const subject = loginRateLimitIdentity(identifier);
  const [account, ip] = await Promise.all([
    checkAuthRateLimit(req, "login-failed-account", LOGIN_ACCOUNT_LIMIT, LOGIN_ACCOUNT_WINDOW_MS, subject),
    checkAuthRateLimit(req, "login-failed-ip", LOGIN_IP_LIMIT, LOGIN_IP_WINDOW_MS),
  ]);
  if (!account.allowed) return account;
  if (!ip.allowed) return ip;
  return { allowed: true } as const;
}

async function recordLoginFailure(req: Request, identifier: string) {
  const subject = loginRateLimitIdentity(identifier);
  await Promise.all([
    recordAuthRateLimitFailure(req, "login-failed-account", LOGIN_ACCOUNT_WINDOW_MS, subject),
    recordAuthRateLimitFailure(req, "login-failed-ip", LOGIN_IP_WINDOW_MS),
  ]);
}

async function resetLoginAccountFailures(req: Request, identifier: string) {
  await clearAuthRateLimit(req, "login-failed-account", LOGIN_ACCOUNT_WINDOW_MS, loginRateLimitIdentity(identifier));
}

function fail(message: string, status: number, id: string, code: string) {
  return NextResponse.json({ message, code, requestId: id }, { status, headers: { ...NO_STORE_HEADERS, "X-Request-Id": id } });
}

export async function POST(req: Request) {
  const id = requestId();
  try {
    if (!JWT_SECRET.trim()) {
      return fail("Secure authentication is not configured on the server.", 503, id, "JWT_SECRET_NOT_CONFIGURED");
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return fail("Enter a valid email/phone number and password.", 400, id, "BAD_REQUEST");
    }
    const identifier = normalizeLoginIdentifier(pickSubmittedIdentifier(body as Record<string, unknown>));
    const password = typeof (body as Record<string, unknown>).password === "string"
      ? (body as Record<string, string>).password
      : "";
    if (!identifier || !password || password.length > 128) {
      return fail("Enter a valid email/phone number and password.", 400, id, "BAD_REQUEST");
    }

    // Failed attempts are counted per account identifier and per IP. Successful
    // logins never increment either counter, so multiple devices remain unaffected.
    await connectDB();
    const rateLimit = await loginRateLimitStatus(req, identifier);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Too many login attempts. Please wait before trying again.", retryAfterSeconds: rateLimit.retryAfterSeconds, code: "LOGIN_RATE_LIMITED", requestId: id },
        { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(rateLimit.retryAfterSeconds), "X-Request-Id": id } },
      );
    }

    // The configured Main Admin identity is synthetic and takes precedence over
    // any legacy MongoDB account using the same email. A wrong ENV password never
    // falls through to the database account.
    const configuredAdmin = getAdminCredentials();
    if (configuredAdmin.email && identifier === configuredAdmin.email) {
      if (!configuredAdmin.password) {
        return fail("Main administrator login is not configured on the server.", 503, id, "ADMIN_CREDENTIALS_NOT_CONFIGURED");
      }
      if (!safeSecretEquals(password, configuredAdmin.password)) {
        // Keep the failure path's work comparable to database-user bcrypt checks.
        await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
        await recordLoginFailure(req, identifier);
        console.warn(`[auth-login] requestId=${id} category=env_admin_password_mismatch`);
        return fail("The phone/email or password is incorrect. Please try again.", 401, id, "INVALID_CREDENTIALS");
      }

      // One device at a time: this login signs out the Main Admin on every other device.
      await resetLoginAccountFailures(req, identifier);
      const adminSessionVersion = await bumpEnvAdminSession();
      const token = jwt.sign(
        {
          userId: ENV_ADMIN_USER_ID,
          email: configuredAdmin.email,
          role: "admin",
          admin: true,
          adminCredentialVersion: getAdminCredentialVersion(configuredAdmin.email, configuredAdmin.password),
          adminSessionVersion,
        },
        JWT_SECRET,
        { expiresIn: "7d", algorithm: "HS256" },
      );
      const response = NextResponse.json(
        {
          message: "Login successful!",
          user: {
            id: ENV_ADMIN_USER_ID,
            fullName: configuredAdmin.fullName,
            phoneNumber: "",
            email: configuredAdmin.email,
            role: "admin",
            isRootAdmin: true,
            isPrimaryAdmin: true,
            isBanned: false,
            profileImageUrl: "",
            profileImagePublicId: "",
          },
        },
        { status: 200, headers: { ...NO_STORE_HEADERS, "X-Request-Id": id } },
      );
      loginCookie(response, token);
      return response;
    }

    const outcome = await authenticateLogin(
      {
        // The configured ENV identity is handled above; all remaining database
        // accounts with role=admin authenticate as sub-admins, regardless of legacy flags.
        findUser: (filter) => User.findOne({
          ...filter,
          // Database role=admin accounts are sub-admins. The legacy
          // isPrimaryAdmin flag is deliberately not an authorization source.
          // Reserve the configured Main Admin identity entirely for ENV login,
          // including attempts to reach its legacy DB record by phone number.
          ...(configuredAdmin.email ? { email: { $ne: configuredAdmin.email } } : {}),
        })
          .select("+password")
          .lean()
          .exec() as Promise<any>,
        comparePassword: (plain, hash) => bcrypt.compare(plain, hash),
        dummyPasswordHash: DUMMY_PASSWORD_HASH,
      },
      body,
    );

    if (outcome.kind === "bad_request") {
      return fail("Enter a valid email/phone number and password.", 400, id, "BAD_REQUEST");
    }
    if (outcome.kind === "invalid_credentials") {
      await recordLoginFailure(req, identifier);
      console.warn(`[auth-login] requestId=${id} category=${outcome.category}`);
      return fail("The phone/email or password is incorrect. Please try again.", 401, id, "INVALID_CREDENTIALS");
    }

    const user = outcome.user as Record<string, any>;
    await resetLoginAccountFailures(req, identifier);
    const role = user.role === "admin" ? "admin" as const : "user" as const;
    const loginAt = new Date();
    // One device at a time: bumping sessionVersion signs this account out everywhere else,
    // because every protected route compares the token's sessionVersion with the database.
    // One-time migration: users hashed at the old cost 12 are re-hashed at BCRYPT_COST right after a
    // successful login (we hold the plaintext only now), so every later login is ~4x cheaper.
    // The filter pins the old hash so a concurrent password change is never overwritten.
    // A failure here must never block the login itself.
    const oldHash = String(user.password);
    let rehashedPassword: string | null = null;
    if (shouldRehashToCost(oldHash, BCRYPT_COST)) {
      try {
        rehashedPassword = await bcrypt.hash(password, BCRYPT_COST);
      } catch {
        rehashedPassword = null;
      }
    }
    const bumped = await User.findOneAndUpdate(
      { _id: user._id },
      { $set: { lastLoginAt: loginAt, lastSeenAt: loginAt }, $inc: { loginCount: 1, sessionVersion: 1 } },
      { new: true },
    ).select("sessionVersion").lean<{ sessionVersion?: number }>();
    const newSessionVersion = Number(bumped?.sessionVersion ?? Number(user.sessionVersion || 0) + 1);

    if (rehashedPassword) {
      // Separate, best-effort update pinned to the old hash: runs once per legacy user, and a
      // concurrent password change (hash no longer equal) simply makes this a no-op.
      try {
        await User.updateOne({ _id: user._id, password: oldHash }, { $set: { password: rehashedPassword } });
      } catch (error: unknown) {
        console.warn(`[auth-login] requestId=${id} category=rehash_failed`, error instanceof Error ? error.message : "Unknown error");
      }
    }

    const token = jwt.sign(
      {
        userId: String(user._id),
        phoneNumber: user.phoneNumber,
        role,
        sessionVersion: newSessionVersion,
      },
      JWT_SECRET,
      { expiresIn: "7d", algorithm: "HS256" },
    );

    const response = NextResponse.json(
      {
        message: "Login successful!",
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
          isRootAdmin: false,
          isPrimaryAdmin: false,
          isBanned: user.isBanned === true,
          lastLoginAt: loginAt,
          loginCount: Number(user.loginCount || 0) + 1,
        },
      },
      { status: 200, headers: { ...NO_STORE_HEADERS, "X-Request-Id": id } },
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
    console.error(`[auth-login] requestId=${id} category=server_error`, error instanceof Error ? error.message : "Unknown error");
    return fail("Login could not be completed. Please try again.", 500, id, "SERVER_ERROR");
  }
}
