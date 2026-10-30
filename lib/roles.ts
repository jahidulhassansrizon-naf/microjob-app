import { isConfiguredAdminEmail } from "@/lib/adminCredentials";

export type AppRole = "admin" | "user";

/** Environment Main Admin is the only root identity; DB role=admin means sub-admin. */
export function isAdminEmail(email: unknown): boolean {
  return isConfiguredAdminEmail(email);
}

export function getRoleForEmail(email: unknown): AppRole {
  return isConfiguredAdminEmail(email) ? "admin" : "user";
}
