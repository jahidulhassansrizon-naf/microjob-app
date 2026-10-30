import { createHmac, timingSafeEqual } from "node:crypto";

export const ENV_ADMIN_USER_ID = "env-admin";

export type AdminTokenClaims = {
  userId?: string;
  role?: string;
  admin?: boolean;
  email?: string;
  adminCredentialVersion?: string;
  sessionVersion?: number;
  exp?: number;
  iat?: number;
};

export function normalizeAdminEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/** Main Admin credentials are read only on the server from environment settings. */
export function getAdminCredentials() {
  return {
    email: normalizeAdminEmail(process.env.ADMIN_EMAIL),
    password: process.env.ADMIN_PASSWORD || "",
    fullName: process.env.ADMIN_NAME?.trim() || "Administrator",
  };
}

/** Constant-time comparison for server-side configured credentials. */
export function safeSecretEquals(candidate: string, expected: string): boolean {
  const candidateBytes = Buffer.from(candidate, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  if (candidateBytes.length !== expectedBytes.length || expectedBytes.length === 0) return false;
  return timingSafeEqual(candidateBytes, expectedBytes);
}

/** Credential fingerprint binds ENV Admin sessions to the currently configured email/password. */
export function getAdminCredentialVersion(email: string, password: string): string {
  const jwtSecret = process.env.JWT_SECRET || "";
  return createHmac("sha256", jwtSecret)
    .update(`${normalizeAdminEmail(email)}\u0000${password}`)
    .digest("hex");
}

export function isCurrentAdminToken(payload: AdminTokenClaims): boolean {
  const configured = getAdminCredentials();
  if (!configured.email || !configured.password || !process.env.JWT_SECRET?.trim()) return false;
  if (payload.admin !== true || payload.role !== "admin" || payload.userId !== ENV_ADMIN_USER_ID) return false;
  if (normalizeAdminEmail(payload.email) !== configured.email) return false;
  const expectedVersion = getAdminCredentialVersion(configured.email, configured.password);
  return safeSecretEquals(payload.adminCredentialVersion || "", expectedVersion);
}

export function isConfiguredAdminEmail(value: unknown): boolean {
  const configuredEmail = getAdminCredentials().email;
  return Boolean(configuredEmail && normalizeAdminEmail(value) === configuredEmail);
}
