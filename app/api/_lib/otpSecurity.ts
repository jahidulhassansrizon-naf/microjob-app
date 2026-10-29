import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 45 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export function createSixDigitOtp(): string {
  return String(randomInt(100_000, 1_000_000));
}

/** Store a keyed digest of short-lived OTPs, never the raw code. The server-side
 * pepper prevents a database-only attacker from cheaply brute-forcing six digits.
 */
export function hashOtp(code: string): string {
  const configuredPepper = process.env.OTP_HASH_SECRET?.trim() || process.env.JWT_SECRET?.trim();
  if (!configuredPepper && process.env.NODE_ENV === "production") {
    throw new Error("OTP_HASH_SECRET or JWT_SECRET must be configured in production.");
  }
  const pepper = configuredPepper || "development-only-otp-pepper";
  return createHmac("sha256", pepper).update(code, "utf8").digest("hex");
}

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;

/** OTPs are purpose-bound. Legacy OTPs without a purpose must be re-issued, never reused across flows. */
export function otpPurposeQuery(purpose: "register" | "password-reset") {
  return { purpose };
}

export function constantTimeOtpMatch(storedHash: unknown, storedLegacyCode: unknown, suppliedCode: string): boolean {
  if (typeof storedHash === "string" && /^[a-f\d]{64}$/i.test(storedHash)) {
    const expected = Buffer.from(storedHash, "hex");
    const supplied = Buffer.from(hashOtp(suppliedCode), "hex");
    return expected.length === supplied.length && timingSafeEqual(expected, supplied);
  }
  if (typeof storedLegacyCode === "string") {
    const expected = Buffer.from(storedLegacyCode, "utf8");
    const supplied = Buffer.from(suppliedCode, "utf8");
    return expected.length === supplied.length && timingSafeEqual(expected, supplied);
  }
  return false;
}

export function attemptsQuery() {
  return { $or: [{ attempts: { $lt: OTP_MAX_ATTEMPTS } }, { attempts: { $exists: false } }] };
}
