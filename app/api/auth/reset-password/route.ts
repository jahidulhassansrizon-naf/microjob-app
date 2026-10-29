import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";
import { enforceAuthRateLimit } from "@/app/api/_lib/authRateLimit";
import {
  attemptsQuery,
  constantTimeOtpMatch,
  isValidEmail,
  NO_STORE_HEADERS,
  otpPurposeQuery,
  OTP_TTL_MS,
} from "@/app/api/_lib/otpSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

function invalidOtpResponse() {
  return json({ message: "Invalid or expired OTP code. Please request a new code if needed." }, 400);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ message: "Invalid request body." }, 400);

    const cleanEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const cleanOtp = typeof body.otp === "string" ? body.otp.trim() : String(body.otp ?? "").trim();
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!isValidEmail(cleanEmail) || !/^\d{6}$/.test(cleanOtp) || !newPassword) {
      return json({ message: "Email, a valid 6-digit OTP code, and a new password are required." }, 400);
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      return json({ message: "Password must be between 8 and 128 characters long." }, 400);
    }

    await connectDB();
    const rateLimit = await enforceAuthRateLimit(req, "password-reset-submit", 30, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Too many password-reset attempts. Please wait before trying again.", retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }
    const user = await User.findOne({ email: cleanEmail }).select("_id sessionVersion isPrimaryAdmin").lean();
    if (!user) return invalidOtpResponse();
    const cutoff = new Date(Date.now() - OTP_TTL_MS);
    const otpRecord = await Otp.findOne({
      identifier: cleanEmail,
      createdAt: { $gt: cutoff },
      $and: [otpPurposeQuery("password-reset")],
    })
      .sort({ createdAt: -1 })
      .select("+otp +otpHash attempts")
      .exec();

    if (!otpRecord || Number(otpRecord.attempts || 0) >= 5) return invalidOtpResponse();

    if (!constantTimeOtpMatch(otpRecord.otpHash, otpRecord.otp, cleanOtp)) {
      const updated = await Otp.findOneAndUpdate(
        { _id: otpRecord._id, $and: [attemptsQuery()] },
        { $inc: { attempts: 1 } },
        { new: true },
      ).select("attempts").lean();
      if (Number(updated?.attempts || 0) >= 5) await Otp.deleteOne({ _id: otpRecord._id });
      return invalidOtpResponse();
    }

    // Only reveal/apply the stronger primary-admin password policy after OTP
    // ownership is proven, avoiding account-role enumeration through this API.
    if (user.isPrimaryAdmin === true && newPassword.length < 12) {
      return json({ message: "The primary administrator password must be at least 12 characters long." }, 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Atomically consume the matching OTP exactly once before changing credentials.
    const consumeFilter: Record<string, unknown> = {
      _id: otpRecord._id,
      createdAt: { $gt: cutoff },
      $and: [attemptsQuery()],
    };
    if (typeof otpRecord.otpHash === "string") consumeFilter.otpHash = otpRecord.otpHash;
    else consumeFilter.otp = otpRecord.otp;
    const consumedOtp = await Otp.findOneAndDelete(consumeFilter).exec();
    if (!consumedOtp) return invalidOtpResponse();

    const updatedUser = await User.updateOne(
      { _id: user._id, sessionVersion: Number(user.sessionVersion || 0) },
      {
        $set: { password: passwordHash, passwordChangedAt: new Date() },
        $inc: { sessionVersion: 1 },
      },
      { runValidators: true },
    );
    if (updatedUser.matchedCount !== 1) {
      return json({ message: "The account changed during this reset. Request a new reset code and try again." }, 409);
    }

    await Otp.deleteMany({ identifier: cleanEmail });

    const response = json({ message: "Password updated successfully. Please sign in with your new password." });
    const expiredCookie = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    };
    response.cookies.set("token", "", expiredCookie);
    response.cookies.set("subscription_access", "", expiredCookie);
    return response;
  } catch (error: unknown) {
    console.error("[auth-reset] Password reset failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ message: "Password reset could not be completed. Please try again." }, 500);
  }
}
