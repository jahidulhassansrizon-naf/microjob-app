import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { isConfiguredAdminEmail } from "@/lib/adminCredentials";
import Otp from "@/models/Otp";
import { getPhoneLookupVariants, normalizePhoneNumber, validatePhoneNumber } from "@/lib/phoneValidation";
import { ensureUniqueFullNameIndex, findDuplicateFullName } from "@/app/api/_lib/userIdentity";
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

export async function POST(req: Request) {
  let pendingOtpId: string | null = null;
  let cooldownLease: string | null = null;
  let cooldownIdentifier = "";
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ message: "Invalid request body." }, 400);

    const email = typeof body.email === "string"
      ? body.email
      : typeof body.identifier === "string" && body.identifier.includes("@")
        ? body.identifier
        : "";
    const cleanEmail = email.trim().toLowerCase();
    const rawPhone = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const fullName = typeof body.fullName === "string" ? body.fullName.normalize("NFKC").trim().replace(/\s+/gu, " ") : "";
    const country = typeof body.country === "string" ? body.country.trim().slice(0, 80) : "";
    const effectiveCountry = country || "Bangladesh";
    const cleanPhone = normalizePhoneNumber(effectiveCountry, rawPhone) || "";

    if (!fullName || fullName.length > 100) {
      return json({ message: "Enter your name (up to 100 characters)." }, 400);
    }
    if (!isValidEmail(cleanEmail)) {
      return json({ message: "Enter a valid email address." }, 400);
    }
    if (isConfiguredAdminEmail(cleanEmail)) {
      return json({ message: "This email is reserved for the Main Administrator." }, 409);
    }
    const phoneError = validatePhoneNumber(effectiveCountry, rawPhone);
    if (phoneError || !cleanPhone) return json({ message: phoneError || "Enter a valid phone number." }, 400);

    await connectDB();
    const rateLimit = await enforceAuthRateLimit(req, "register-email-otp", 30, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Too many verification requests. Please wait before trying again.", retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    // All uniqueness checks are performed against the live database before any OTP is created or emailed.
    await ensureUniqueFullNameIndex();
    const [existingEmail, existingPhone, existingName] = await Promise.all([
      User.findOne({ email: cleanEmail }).select("_id").lean(),
      User.findOne({ phoneNumber: { $in: getPhoneLookupVariants(cleanPhone) } }).select("_id").lean(),
      findDuplicateFullName(fullName),
    ]);
    if (existingEmail) return json({ message: "This email is already registered!" }, 409);
    if (existingPhone) return json({ message: "This phone number is already registered!" }, 409);
    if (existingName) return json({ message: "An account with this exact name already exists. Please change your name slightly (for example, add a middle name or number)." }, 409);

    cooldownIdentifier = cleanEmail;
    const cooldown = await claimAuthCooldown("register-email-otp", cleanEmail, OTP_RESEND_COOLDOWN_MS);
    if (!cooldown.allowed) {
      return NextResponse.json(
        { message: "A verification code was sent recently. Please wait a little before requesting another code.", retryAfterSeconds: cooldown.retryAfterSeconds },
        { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(cooldown.retryAfterSeconds) } },
      );
    }
    cooldownLease = cooldown.leaseToken;

    const emailQuota = await enforceAuthRateLimit(req, "otp-email-hourly", 5, 60 * 60 * 1000, cleanEmail);
    if (!emailQuota.allowed) {
      await releaseAuthCooldown("register-email-otp", cooldownIdentifier, cooldownLease);
      cooldownLease = null;
      return NextResponse.json(
        { message: "This email has reached the verification-code limit. Please try again later.", retryAfterSeconds: emailQuota.retryAfterSeconds },
        { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(emailQuota.retryAfterSeconds) } },
      );
    }

    const otpCode = createSixDigitOtp();
    const pending = await Otp.create({
      identifier: cleanEmail,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      otpHash: hashOtp(otpCode),
      purpose: "register",
      attempts: 0,
    });
    pendingOtpId = String(pending._id);

    const emailHTML = renderOtpEmail({ kind: "register", name: fullName, code: otpCode });

    try {
      const delivery = await sendTransactionalEmail({
        to: cleanEmail,
        subject: `${otpCode} is your Seba Lagbe verification code`,
        html: emailHTML,
        text: `Hello ${fullName.slice(0, 100)}. Your Seba Lagbe email verification code is ${otpCode}. It expires in 5 minutes. Never share this code.`,
      });
      console.info(`[auth-email] Registration OTP accepted by ${delivery.provider}.`);
      // Keep the valid OTP and cooldown if post-send housekeeping later encounters an error.
      pendingOtpId = null;
      cooldownLease = null;
    } catch (error) {
      await Otp.deleteOne({ _id: pending._id });
      pendingOtpId = null;
      if (cooldownLease && cooldownIdentifier) {
        await releaseAuthCooldown("register-email-otp", cooldownIdentifier, cooldownLease).catch(() => undefined);
        cooldownLease = null;
      }
      console.error("[auth-email] Registration OTP delivery failed:", error instanceof Error ? error.message : "Unknown provider error");
      return json({ message: "We could not send a verification email right now. Please try again shortly." }, 502);
    }

    await Otp.deleteMany({
      identifier: cleanEmail,
      _id: { $ne: pending._id },
      $or: [{ purpose: "register" }, { purpose: { $exists: false } }, { purpose: null }],
    }).catch((cleanupError: unknown) => {
      console.warn("[auth-email] Could not remove an older registration OTP record:", cleanupError instanceof Error ? cleanupError.message : "Unknown error");
    });

    return json({
      message: "Verification email accepted for delivery. Check your inbox and spam folder.",
      expiresInSeconds: 300,
    });
  } catch (error: unknown) {
    if (pendingOtpId) await Otp.deleteOne({ _id: pendingOtpId }).catch(() => undefined);
    if (cooldownLease && cooldownIdentifier) {
      await releaseAuthCooldown("register-email-otp", cooldownIdentifier, cooldownLease).catch(() => undefined);
    }
    console.error("[auth-email] Registration OTP request failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ message: "Could not process the verification request. Please try again." }, 500);
  }
}
