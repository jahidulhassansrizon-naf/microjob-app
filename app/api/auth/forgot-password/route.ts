import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";
import { sendTransactionalEmail } from "@/app/api/_lib/emailDelivery";
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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[character] || character;
  });
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

    const otpCode = createSixDigitOtp();
    const pending = await Otp.create({
      identifier: cleanEmail,
      email: cleanEmail,
      otpHash: hashOtp(otpCode),
      purpose: "password-reset",
      attempts: 0,
    });
    pendingOtpId = String(pending._id);

    const safeName = escapeHtml(String(user.fullName || "there").slice(0, 100));
    const emailHTML = `
      <div style="margin:0;padding:32px 12px;background:#f5f7ff;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e7eaf3;border-radius:22px;overflow:hidden;">
          <tr><td style="padding:26px 28px 22px;background:#ffffff;border-bottom:1px solid #eef0f7;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="middle" style="width:44px;height:44px;border-radius:13px;background:#4f46e5;background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);color:#ffffff;text-align:center;font-size:15px;font-weight:800;">SL</td>
            <td valign="middle" style="padding-left:12px;"><div style="font-size:21px;line-height:1.15;font-weight:800;letter-spacing:-.6px;color:#111827;">সেবা <span style="color:#4f46e5;">লাগবে</span></div><div style="margin-top:5px;font-size:9px;font-weight:700;letter-spacing:2px;color:#94a3b8;">ডিজিটাল সেবা</div></td>
          </tr></table></td></tr>
          <tr><td style="padding:30px 28px 28px;">
            <div style="display:inline-block;margin-bottom:16px;padding:7px 11px;border:1px solid #dbeafe;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:700;">ACCOUNT SECURITY</div>
            <h1 style="margin:0 0 12px;font-size:25px;line-height:1.25;letter-spacing:-.5px;color:#111827;">Reset your password</h1>
            <p style="margin:0 0 10px;font-size:14px;line-height:1.75;color:#475569;">Hello ${safeName},</p>
            <p style="margin:0;font-size:14px;line-height:1.75;color:#475569;">Use this one-time code to securely reset your Seba Lagbe password.</p>
            <div style="margin:24px 0;padding:23px 12px;text-align:center;border:1px solid #e0e7ff;border-radius:16px;background:#f5f3ff;"><div style="margin-bottom:8px;font-size:10px;font-weight:700;letter-spacing:2px;color:#64748b;">YOUR 6-DIGIT CODE</div><div style="font-size:34px;line-height:1.2;font-weight:800;letter-spacing:9px;color:#4f46e5;">${otpCode}</div></div>
            <p style="margin:0 0 8px;font-size:12px;line-height:1.7;color:#64748b;">This code expires in <strong style="color:#334155;">5 minutes</strong>. Never share it with anyone.</p>
            <p style="margin:22px 0 0;font-size:12px;line-height:1.7;color:#94a3b8;">If you did not request a password reset, no action is needed and your password will remain unchanged.</p>
          </td></tr>
          <tr><td style="padding:17px 28px;background:#f8fafc;border-top:1px solid #eef0f7;font-size:11px;line-height:1.6;color:#94a3b8;">© ${new Date().getFullYear()} Seba Lagbe · Your everyday digital workspace</td></tr>
        </table>
      </div>`;

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
