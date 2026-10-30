import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { authenticateLogin, normalizeLoginIdentifier, pickSubmittedIdentifier } from "@/lib/loginCore";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { setSubscriptionAccessCookie } from "../../_lib/requireActiveSubscription";
import {
  ENV_ADMIN_USER_ID,
  getAdminCredentialVersion,
  getAdminCredentials,
  safeSecretEquals,
} from "@/lib/adminCredentials";

const JWT_SECRET = process.env.JWT_SECRET || "";
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

    // Login itself is not rate-limited so the same account can authenticate
    // from multiple devices without sharing an IP/account attempt counter.
    // Database connectivity is still required for database-backed accounts.
    await connectDB();

    // The configured Main Admin identity is synthetic and takes precedence over
    // any legacy MongoDB account using the same email. A wrong ENV password never
    // falls through to the database account.
    const configuredAdmin = getAdminCredentials();
    if (configuredAdmin.email && identifier === configuredAdmin.email) {
      if (!configuredAdmin.password) {
        return fail("Main administrator login is not configured on the server.", 503, id, "ADMIN_CREDENTIALS_NOT_CONFIGURED");
      }
      if (!safeSecretEquals(password, configuredAdmin.password)) {
        console.warn(`[auth-login] requestId=${id} category=env_admin_password_mismatch`);
        return fail("The phone/email or password is incorrect. Please try again.", 401, id, "INVALID_CREDENTIALS");
      }

      const token = jwt.sign(
        {
          userId: ENV_ADMIN_USER_ID,
          email: configuredAdmin.email,
          role: "admin",
          admin: true,
          adminCredentialVersion: getAdminCredentialVersion(configuredAdmin.email, configuredAdmin.password),
        },
        JWT_SECRET,
        { expiresIn: "7d" },
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
      },
      body,
    );

    if (outcome.kind === "bad_request") {
      return fail("Enter a valid email/phone number and password.", 400, id, "BAD_REQUEST");
    }
    if (outcome.kind === "invalid_credentials") {
      console.warn(`[auth-login] requestId=${id} category=${outcome.category}`);
      return fail("The phone/email or password is incorrect. Please try again.", 401, id, "INVALID_CREDENTIALS");
    }

    const user = outcome.user as Record<string, any>;
    const role = user.role === "admin" ? "admin" as const : "user" as const;
    const loginAt = new Date();
    await User.updateOne(
      { _id: user._id, sessionVersion: Number(user.sessionVersion || 0) },
      { $set: { lastLoginAt: loginAt, lastSeenAt: loginAt }, $inc: { loginCount: 1 } },
    );

    const token = jwt.sign(
      {
        userId: String(user._id),
        phoneNumber: user.phoneNumber,
        role,
        sessionVersion: Number(user.sessionVersion || 0),
      },
      JWT_SECRET,
      { expiresIn: "7d" },
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
