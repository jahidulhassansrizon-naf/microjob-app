import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { isConfiguredAdminEmail } from "@/lib/adminCredentials";
import Otp from "@/models/Otp";
import { enforceAuthRateLimit } from "@/app/api/_lib/authRateLimit";
import { validatePhoneNumber } from "@/lib/phoneValidation";
import { ensureUniqueFullNameIndex, findDuplicateFullName, normalizeFullName } from "@/app/api/_lib/userIdentity";
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

async function recordFailedOtpAttempt(identifier: string, purpose: "register") {
  const cutoff = new Date(Date.now() - OTP_TTL_MS);
  const latest = await Otp.findOne({
    identifier,
    createdAt: { $gt: cutoff },
    $and: [otpPurposeQuery(purpose)],
  }).sort({ createdAt: -1 }).select("_id attempts").lean();
  if (!latest) return;

  const updated = await Otp.findOneAndUpdate(
    { _id: latest._id, $and: [attemptsQuery()] },
    { $inc: { attempts: 1 } },
    { new: true },
  ).select("attempts").lean();
  if (Number(updated?.attempts || 0) >= 5) {
    await Otp.deleteOne({ _id: latest._id });
  }
}

function duplicateKey(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const candidate = error as { code?: unknown; keyPattern?: Record<string, unknown>; keyValue?: Record<string, unknown> };
  if (candidate.code !== 11000) return null;
  return Object.keys(candidate.keyPattern || candidate.keyValue || {})[0] || "email or phone number";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ message: "Invalid request body." }, 400);

    const fullName = typeof body.fullName === "string" ? body.fullName.normalize("NFKC").trim().replace(/\s+/gu, " ") : "";
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const cleanEmail = rawEmail.trim().toLowerCase();
    const cleanPhone = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const country = typeof body.country === "string" ? body.country.trim().slice(0, 80) : "";
    const district = typeof body.district === "string" ? body.district.trim().slice(0, 100) : "";
    const password = typeof body.password === "string" ? body.password : "";
    const cleanOtp = typeof body.otp === "string" ? body.otp.trim() : String(body.otp ?? "").trim();

    if (!fullName || fullName.length > 100) return json({ message: "Enter your name (up to 100 characters)." }, 400);
    if (!isValidEmail(cleanEmail)) return json({ message: "Enter a valid email address." }, 400);
    if (isConfiguredAdminEmail(cleanEmail)) return json({ message: "This email is reserved for the Main Administrator." }, 409);
    if (!cleanPhone || !/^\d{5,15}$/.test(cleanPhone)) return json({ message: "Enter a valid phone number." }, 400);
    const phoneError = validatePhoneNumber(country, cleanPhone);
    if (phoneError) return json({ message: phoneError }, 400);
    if (password.length < 8 || password.length > 128) {
      return json({ message: "Password must be between 8 and 128 characters long." }, 400);
    }
    if (!/^\d{6}$/.test(cleanOtp)) return json({ message: "Enter a valid 6-digit OTP code." }, 400);

    await connectDB();
    const rateLimit = await enforceAuthRateLimit(req, "register-submit", 60, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Too many registration attempts. Please wait before trying again.", retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    // Fresh database checks on every attempt; client state and browser cache are never trusted.
    await ensureUniqueFullNameIndex();
    const [existingEmail, existingPhone, existingName] = await Promise.all([
      User.findOne({ email: cleanEmail }).select("_id").lean(),
      User.findOne({ phoneNumber: cleanPhone }).select("_id").lean(),
      findDuplicateFullName(fullName),
    ]);
    if (existingEmail) return json({ message: "This email is already registered!" }, 409);
    if (existingPhone) return json({ message: "This phone number is already registered!" }, 409);
    if (existingName) return json({ message: "An account with this exact name already exists. Please change your name slightly (for example, add a middle name or number)." }, 409);

    const cutoff = new Date(Date.now() - OTP_TTL_MS);
    const otpRecord = await Otp.findOne({
      identifier: cleanEmail,
      createdAt: { $gt: cutoff },
      $and: [otpPurposeQuery("register")],
    })
      .sort({ createdAt: -1 })
      .select("+otp +otpHash attempts")
      .exec();

    if (!otpRecord || Number(otpRecord.attempts || 0) >= 5) {
      return json({ message: "Invalid or expired OTP code! Please request a new code." }, 400);
    }

    if (!constantTimeOtpMatch(otpRecord.otpHash, otpRecord.otp, cleanOtp)) {
      await recordFailedOtpAttempt(cleanEmail, "register");
      return json({ message: "Invalid or expired OTP code!" }, 400);
    }

    // Atomic one-time consumption prevents two concurrent requests from using the same OTP.
    const consumeFilter: Record<string, unknown> = {
      _id: otpRecord._id,
      createdAt: { $gt: cutoff },
      $and: [attemptsQuery()],
    };
    if (typeof otpRecord.otpHash === "string") consumeFilter.otpHash = otpRecord.otpHash;
    else consumeFilter.otp = otpRecord.otp;
    const consumedOtp = await Otp.findOneAndDelete(consumeFilter).exec();
    if (!consumedOtp) return json({ message: "This OTP has already been used or expired. Please request a new code." }, 400);

    const hashedPassword = await bcrypt.hash(password, 12);
    let newUser;
    try {
      newUser = await User.create({
        country: country || "Bangladesh",
        phoneNumber: cleanPhone,
        email: cleanEmail,
        fullName,
        fullNameNormalized: normalizeFullName(fullName),
        district,
        // Never trust a client-provided role; public registration always creates a regular user.
        role: "user",
        password: hashedPassword,
      });
    } catch (error) {
      const field = duplicateKey(error);
      if (field) {
        const lowerField = field.toLowerCase();
        if (lowerField.includes("fullname") || lowerField.includes("name")) {
          return json({ message: "An account with this exact name already exists. Please change your name slightly and try again." }, 409);
        }
        return json({ message: lowerField.includes("phone") ? "This phone number is already registered! Please request a new verification code." : "This email is already registered! Please request a new verification code." }, 409);
      }
      throw error;
    }

    // Clear stale verification records for the newly registered identity.
    await Otp.deleteMany({ identifier: cleanEmail });

    return json({
      message: "User registered successfully!",
      user: {
        id: String(newUser._id),
        fullName: newUser.fullName,
        phoneNumber: newUser.phoneNumber,
        email: newUser.email,
        district: newUser.district,
        role: "user",
      },
    }, 201);
  } catch (error: unknown) {
    console.error("[auth-register] Registration failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ message: "Registration could not be completed. Please check your details and try again." }, 500);
  }
}
