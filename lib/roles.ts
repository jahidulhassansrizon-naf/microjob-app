export type AppRole = "admin" | "user";

/** Never infer administrator privileges from an email address. Always read the current User record. */
export function isAdminEmail(_email: unknown): boolean {
  return false;
}

/** Compatibility helper: callers must resolve the role from the database. */
export function getRoleForEmail(_email: unknown): AppRole {
  return "user";
}
