export type AppRole = "admin" | "user";

function normalizedEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * The primary administrator is configured in server environment variables and
 * is not a User document. Other administrator roles must come from a verified
 * database User record, never from an email address alone.
 */
export function isAdminEmail(email: unknown): boolean {
  const configured = normalizedEmail(process.env.ADMIN_EMAIL);
  const candidate = normalizedEmail(email);
  return Boolean(configured && candidate && configured === candidate);
}

/** Compatibility helper: email alone never grants database administrator access. */
export function getRoleForEmail(_email: unknown): AppRole {
  return "user";
}
