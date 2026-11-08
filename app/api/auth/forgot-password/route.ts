import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { isConfiguredAdminEmail } from "@/lib/adminCredentials";
import Otp from "@/models/Otp";
import { sendTransactionalEmail } from "@/app/api/_lib/emailDelivery";
import { renderOtpEmail } from "@/app/api/_lib/emailTemplates";
import { claimAuthCooldown, enforceAuthRateLimit, releaseAuthCooldown } from "@/app/api/_lib/authRateLimit";
import {
  createSixDigitOtp,
  hashOtp,
  isValidEmail,
  NO_STORE_HEADERS,
  OTP_RESEND_COOLDOWN_MS,
} from "@/app/api/_lib/otpSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

const genericMessage = "If an account matches this email address, a password-reset code will be sent. Check your inbox and spam folder.";

export async function POST(req: Request) {
  let pendingOtpId: string | null = null;
  let cooldownLease: string | null = null;
  let cooldownIdentifier = "";
  try {
    const body = await req.json().catch(() => null);
    const emailInput = body && typeof body.email === "string" ? body.email : "";
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) return json({ message: "Enter a valid email address." }, 400);

    if (isConfiguredAdminEmail(cleanEmail)) return json({ message: genericMessage, expiresInSeconds: 300 });

    await connectDB();
    const rateLimit = await enforceAuthRateLimit(req, "password-reset-email-otp", 30, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: genericMessage, retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }
    // Crucial privacy/security gate: never create an OTP or call the mail provider
    // unless a user account with this normalized email already exists.
    const user = await User.findOne({ email: cleanEmail }).select("_id fullName email").lean();
    // Keep the same response for known/unknown emails to prevent account enumeration.
    // The UI may show the generic next step, but there is no OTP record or email for a missing account.
    if (!user) return json({ message: genericMessage, expiresInSeconds: 300 });

    cooldownIdentifier = cleanEmail;
    const cooldown = await claimAuthCooldown("password-reset-email-otp", cleanEmail, OTP_RESEND_COOLDOWN_MS);
    if (!cooldown.allowed) return json({ message: genericMessage, expiresInSeconds: 300 });
    cooldownLease = cooldown.leaseToken;

    // Share one hourly quota across registration and password-reset emails.
    const emailQuota = await enforceAuthRateLimit(req, "otp-email-hourly", 5, 60 * 60 * 1000, cleanEmail);
    if (!emailQuota.allowed) {
      await releaseAuthCooldown("password-reset-email-otp", cooldownIdentifier, cooldownLease);
      cooldownLease = null;
      // Preserve the endpoint's generic response to avoid email-account enumeration.
      return json({ message: genericMessage, expiresInSeconds: 300 });
    }

    const otpCode = createSixDigitOtp();
    const pending = await Otp.create({
      identifier: cleanEmail,
      email: cleanEmail,
      otpHash: hashOtp(otpCode),
      purpose: "password-reset",
      attempts: 0,
    });
    pendingOtpId = String(pending._id);

    const emailHTML = renderOtpEmail({ kind: "password-reset", name: String(user.fullName || ""), code: otpCode });

    try {
      const delivery = await sendTransactionalEmail({
        to: cleanEmail,
        subject: `${otpCode} is your Seba Lagbe password reset code`,
        html: emailHTML,
        text: `Hello ${String(user.fullName || "there").slice(0, 100)}. Your Seba Lagbe password-reset code is ${otpCode}. It expires in 5 minutes. Never share this code.`,
      });
      console.info(`[auth-email] Password-reset OTP accepted by ${delivery.provider}.`);
      // Keep the valid OTP and cooldown if post-send housekeeping later encounters an error.
      pendingOtpId = null;
      cooldownLease = null;
    } catch (error) {
      await Otp.deleteOne({ _id: pending._id });
      pendingOtpId = null;
      if (cooldownLease && cooldownIdentifier) {
        await releaseAuthCooldown("password-reset-email-otp", cooldownIdentifier, cooldownLease).catch(() => undefined);
        cooldownLease = null;
      }
      // Keep response shape/status identical to the unknown-account path so this
      // public endpoint cannot be used to enumerate registered email addresses.
      // Provider errors are retained in server logs for operational monitoring.
      console.error("[auth-email] Password-reset email delivery failed:", error instanceof Error ? error.message : "Unknown provider error");
      return json({ message: genericMessage, expiresInSeconds: 300 });
    }

    await Otp.deleteMany({ identifier: cleanEmail, purpose: "password-reset", _id: { $ne: pending._id } }).catch((cleanupError: unknown) => {
      console.warn("[auth-email] Could not remove an older password-reset OTP record:", cleanupError instanceof Error ? cleanupError.message : "Unknown error");
    });
    return json({ message: genericMessage, expiresInSeconds: 300 });
  } catch (error: unknown) {
    if (pendingOtpId) await Otp.deleteOne({ _id: pendingOtpId }).catch(() => undefined);
    if (cooldownLease && cooldownIdentifier) {
      await releaseAuthCooldown("password-reset-email-otp", cooldownIdentifier, cooldownLease).catch(() => undefined);
    }
    console.error("[auth-email] Forgot-password request failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ message: "Could not process the password-reset request. Please try again." }, 500);
  }
}
