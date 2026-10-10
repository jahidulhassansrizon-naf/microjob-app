import { createHmac, timingSafeEqual } from "node:crypto";

export const ENV_ADMIN_USER_ID = "env-admin";

export type AdminTokenClaims = {
  userId?: string;
  role?: string;
  admin?: boolean;
  email?: string;
  adminCredentialVersion?: string;
};

export function normalizeAdminEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function getAdminCredentials() {
  return {
    email: normalizeAdminEmail(process.env.ADMIN_EMAIL),
    password: process.env.ADMIN_PASSWORD || "",
    fullName: process.env.ADMIN_NAME?.trim() || "Administrator",
  };
}

/** Constant-time comparison for server-side secrets. */
export function safeSecretEquals(candidate: string, expected: string): boolean {
  const candidateBytes = Buffer.from(candidate, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  if (candidateBytes.length !== expectedBytes.length || expectedBytes.length === 0) {
    return false;
  }
  return timingSafeEqual(candidateBytes, expectedBytes);
}

/**
 * Bind an admin session to the currently configured credentials. The version
 * is HMACed with JWT_SECRET, so the credential itself is never put in the JWT.
 * Rotating ADMIN_PASSWORD invalidates older admin sessions immediately.
 */
export function getAdminCredentialVersion(email: string, password: string): string {
  const jwtSecret = process.env.JWT_SECRET || "";
  return createHmac("sha256", jwtSecret)
    .update(`${normalizeAdminEmail(email)}\u0000${password}`)
    .digest("hex");
}

export function isCurrentAdminToken(payload: AdminTokenClaims): boolean {
  const configured = getAdminCredentials();
  if (!configured.email || !configured.password || !process.env.JWT_SECRET?.trim()) return false;
  if (payload.admin !== true || payload.role !== "admin") return false;
  if (payload.userId !== ENV_ADMIN_USER_ID) return false;
  if (normalizeAdminEmail(payload.email) !== configured.email) return false;
  const expectedVersion = getAdminCredentialVersion(configured.email, configured.password);
  return safeSecretEquals(payload.adminCredentialVersion || "", expectedVersion);
}

export function isConfiguredAdminEmail(email: unknown): boolean {
  const configuredEmail = getAdminCredentials().email;
  return Boolean(configuredEmail && normalizeAdminEmail(email) === configuredEmail);
}
