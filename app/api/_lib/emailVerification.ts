import { createHmac, timingSafeEqual } from "node:crypto";
import { getJwtSecret } from "@/lib/jwtSecurity";

/**
 * Signed, stateless e-mail verification links.
 *
 * - NOT a JWT and signed with a derived key, so it can never be accepted as a login/session token.
 * - Carries only the user id and a keyed hash of the e-mail (no address in the URL).
 * - If the user later changes their e-mail, the hash no longer matches and the old link stops working.
 */
export const EMAIL_VERIFY_TTL_MS = 30 * 60 * 1000;

function signingKey(): Buffer | null {
  const base = process.env.OTP_HASH_SECRET?.trim() || getJwtSecret();
  if (!base) return null;
  return createHmac("sha256", base).update("email-verify-v1").digest();
}

export function hashEmailForVerification(email: string): string | null {
  const key = signingKey();
  if (!key) return null;
  return createHmac("sha256", key).update(`email:${email.trim().toLowerCase()}`).digest("hex").slice(0, 32);
}

export function getSiteOrigin(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").trim();
  return (configured || "https://sebalagbe.com").replace(/\/+$/, "");
}

export function createEmailVerificationToken(userId: string, email: string): string | null {
  const key = signingKey();
  const eh = hashEmailForVerification(email);
  if (!key || !eh) return null;
  const payload = Buffer.from(JSON.stringify({ p: "verify-email", sub: userId, eh, exp: Date.now() + EMAIL_VERIFY_TTL_MS })).toString("base64url");
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readEmailVerificationToken(token: string): { userId: string; emailHash: string } | null {
  const key = signingKey();
  if (!key || typeof token !== "string" || token.length > 600) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const expected = Buffer.from(createHmac("sha256", key).update(parts[0]).digest("base64url"));
  const supplied = Buffer.from(parts[1]);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as { p?: unknown; sub?: unknown; eh?: unknown; exp?: unknown };
    if (data.p !== "verify-email" || typeof data.sub !== "string" || typeof data.eh !== "string") return null;
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    if (!/^[a-f\d]{24}$/i.test(data.sub)) return null;
    return { userId: data.sub, emailHash: data.eh };
  } catch {
    return null;
  }
}
