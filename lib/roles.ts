export type AppRole = "admin" | "user";

function normalizedEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * A database user account is never promoted to admin just because its email
 * matches ADMIN_EMAIL. The single environment-configured admin has a separate
 * signed server session and is not a registered User document.
 */
export function isAdminEmail(email: unknown): boolean {
  const configured = normalizedEmail(process.env.ADMIN_EMAIL);
  const candidate = normalizedEmail(email);
  return Boolean(configured && candidate && configured === candidate);
}

/** Public/database accounts always have the user role. */
export function getRoleForEmail(_email: unknown): AppRole {
  return "user";
}
