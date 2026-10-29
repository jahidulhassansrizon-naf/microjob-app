import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { validatePhoneNumber } from "@/lib/phoneValidation";
import { isConfiguredAdminEmail } from "@/lib/adminCredentials";
import { enforceAuthRateLimit } from "@/app/api/_lib/authRateLimit";
import { ensureUniqueFullNameIndex, findDuplicateFullName } from "@/app/api/_lib/userIdentity";
import { isValidEmail, NO_STORE_HEADERS } from "@/app/api/_lib/otpSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

/** Preflight validation only: this endpoint never creates OTPs, accounts, or sends email. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ message: "Invalid request body." }, 400);

    const fullName = typeof body.fullName === "string"
      ? body.fullName.normalize("NFKC").trim().replace(/\s+/gu, " ")
      : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const country = typeof body.country === "string" ? body.country.trim().slice(0, 80) : "";

    if (!fullName || fullName.length > 100) return json({ message: "Enter your name (up to 100 characters)." }, 400);
    if (!isValidEmail(email)) return json({ message: "Enter a valid email address." }, 400);
    if (!/^\d{5,15}$/.test(phoneNumber)) return json({ message: "Enter a valid phone number." }, 400);
    const phoneError = validatePhoneNumber(country, phoneNumber);
    if (phoneError) return json({ message: phoneError }, 400);
    if (isConfiguredAdminEmail(email)) {
      return json({ message: "This email is reserved for the administrator and cannot be registered as a regular user." }, 409);
    }

    await connectDB();
    const rateLimit = await enforceAuthRateLimit(request, "register-preflight", 40, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Too many registration attempts. Please wait before trying again.", retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    await ensureUniqueFullNameIndex();
    const [existingEmail, existingPhone, existingName] = await Promise.all([
      User.findOne({ email }).select("_id").lean(),
      User.findOne({ phoneNumber }).select("_id").lean(),
      findDuplicateFullName(fullName),
    ]);

    if (existingEmail) return json({ message: "This email is already registered!" }, 409);
    if (existingPhone) return json({ message: "This phone number is already registered!" }, 409);
    if (existingName) {
      return json({ message: "An account with this exact name already exists. Please change your name slightly (for example, add a middle name or number)." }, 409);
    }

    return json({ message: "Registration details are available." });
  } catch (error: unknown) {
    console.error("[auth-preflight] Registration pre-check failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ message: "Could not validate these details right now. Please try again." }, 500);
  }
}
