import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
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

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === "production" && !JWT_SECRET.trim()) {
      return NextResponse.json(
        { message: "Secure authentication is not configured on the server." },
        { status: 503 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    const submittedIdentifier = body?.phoneNumber ?? body?.identifier ?? body?.email ?? "";
    const formattedInput = submittedIdentifier ? String(submittedIdentifier).trim().toLowerCase() : "";
    const submittedPassword = typeof body?.password === "string" ? body.password : "";
    if (!formattedInput || formattedInput.length > 254 || submittedPassword.length > 128 || !submittedPassword) {
      return NextResponse.json({ message: "Enter a valid email/phone number and password." }, { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } });
    }

    // A shared MongoDB counter prevents rapid credential guessing across app instances.
    await connectDB();
    const ipRateLimit = await enforceAuthRateLimit(req, "auth-login-ip", 40, 10 * 60 * 1000);
    const identifierRateLimit = await enforceAuthRateLimit(req, "auth-login-identifier", 10, 15 * 60 * 1000, formattedInput);
    const rateLimit = !ipRateLimit.allowed ? ipRateLimit : identifierRateLimit;
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Too many login attempts. Please wait before trying again." },
        { status: 429, headers: { "Cache-Control": "no-store, max-age=0", "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    // Every account, including the primary administrator, is authenticated from
    // MongoDB. Admin credentials are never read from ADMIN_EMAIL/ADMIN_PASSWORD.
    // Existing database-backed login flow for ordinary users remains intact.
    const user = await User.findOne({
      $or: [{ phoneNumber: submittedIdentifier }, { email: formattedInput }],
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid email/phone number or password." }, { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } });
    }

    const isMatch = await bcrypt.compare(submittedPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid email/phone number or password." }, { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } });
    }

    // Keep a database-granted admin role. Ordinary users can never promote
    // themselves because this value comes only from the saved account record.
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
        // A signed role claim enables correct middleware navigation. Privileged
        // pages and APIs still verify the current MongoDB role/sessionVersion.
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
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
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
    console.error("Authentication login failed:", error);
    return NextResponse.json(
      { message: "Login could not be completed. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
