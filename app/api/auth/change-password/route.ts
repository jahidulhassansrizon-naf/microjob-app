import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { ENV_ADMIN_USER_ID } from "@/lib/adminCredentials";
import { enforceAuthRateLimit } from "@/app/api/_lib/authRateLimit";

const JWT_SECRET = process.env.JWT_SECRET || "";

export async function PUT(req: NextRequest) {
  try {
    if (!JWT_SECRET.trim()) {
      return NextResponse.json(
        { error: "Secure authentication is not configured on the server." },
        { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }
    await connectDB();

    const ipRateLimit = await enforceAuthRateLimit(req, "password-change-ip", 20, 15 * 60 * 1000);
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many password-change attempts. Please wait before trying again." },
        { status: 429, headers: { "Cache-Control": "no-store, max-age=0", "Retry-After": String(ipRateLimit.retryAfterSeconds) } },
      );
    }

    const authHeader = req.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const cookiePair = req.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="));
    let cookieToken = "";
    if (cookiePair) {
      try { cookieToken = decodeURIComponent(cookiePair.slice("token=".length)); }
      catch { cookieToken = cookiePair.slice("token=".length); }
    }
    const token = bearer || cookieToken;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized access. Please login again." },
        { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { error: "Your login session is invalid or expired. Please sign in again." },
        { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    if (!decoded || typeof decoded.userId !== "string" || !mongoose.isValidObjectId(decoded.userId)) {
      return NextResponse.json(
        { error: "Invalid token payload." },
        { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    if (decoded.admin === true || decoded.userId === ENV_ADMIN_USER_ID) {
      return NextResponse.json(
        { error: "This legacy administrator session is no longer valid. Please sign in again." },
        { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both current and new password are required." },
        { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      return NextResponse.json(
        { error: "New password must be between 8 and 128 characters long." },
        { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    // ডাটাবেস থেকে ইউজার খুঁজে বের করা
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404, headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    if (Number(decoded.sessionVersion || 0) !== Number(user.sessionVersion || 0)) {
      return NextResponse.json({ error: "Your session has been reset. Please log in again." }, { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    if (user.isPrimaryAdmin === true && newPassword.length < 12) {
      return NextResponse.json(
        { error: "The primary administrator password must be at least 12 characters long." },
        { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }
    const accountRateLimit = await enforceAuthRateLimit(req, "password-change-account", 8, 15 * 60 * 1000, String(user._id));
    if (!accountRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many password-change attempts for this account. Please wait before trying again." },
        { status: 429, headers: { "Cache-Control": "no-store, max-age=0", "Retry-After": String(accountRateLimit.retryAfterSeconds) } },
      );
    }

    // কারেন্ট পাসওয়ার্ডের সাথে ডাটাবেসের হ্যাশ পাসওয়ার্ড মিলানো
    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: "Current password does not match." },
        { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    // Update against the version we just verified so concurrent password or
    // role/session changes cannot be overwritten by a stale document save.
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const updateResult = await User.updateOne(
      { _id: user._id, sessionVersion: Number(user.sessionVersion || 0) },
      {
        $set: { password: hashedPassword, passwordChangedAt: new Date() },
        $inc: { sessionVersion: 1 },
      },
      { runValidators: true },
    );
    if (updateResult.matchedCount !== 1) {
      return NextResponse.json(
        { error: "Your account changed during this request. Please sign in again and retry." },
        { status: 409, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const response = NextResponse.json(
      { message: "Password updated successfully. Please sign in again." },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    response.cookies.set("subscription_access", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  } catch (error: unknown) {
    console.error("Password change failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Something went wrong while updating the password. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
