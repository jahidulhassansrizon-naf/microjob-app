/**
 * Legacy marker retained only to explicitly reject pre-migration env-admin JWTs.
 * Admin credentials are now stored as a normal MongoDB User record with
 * role="admin" and isPrimaryAdmin=true. No admin login depends on ADMIN_EMAIL
 * or ADMIN_PASSWORD environment variables anymore.
 */
export const ENV_ADMIN_USER_ID = "env-admin";

export type AdminTokenClaims = {
  userId?: string;
  role?: string;
  admin?: boolean;
  email?: string;
  sessionVersion?: number;
  primaryAdmin?: boolean;
  exp?: number;
  iat?: number;
};
