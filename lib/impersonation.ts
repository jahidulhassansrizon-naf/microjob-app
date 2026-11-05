import { getJwtSecret } from "./jwtSecurity";
import type { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * "Login as this user" support.
 *
 * Design on purpose: there is no shared/master password anywhere in this
 * flow. Starting an impersonation session only ever works from inside an
 * already-authenticated admin session (requireAdmin), it slides forward only
 * while the admin stays active (see the heartbeat route) and never past a
 * fixed hard cap, and every start/stop is written to ImpersonationLog so it
 * can be audited later. The admin's own session is
 * preserved in a separate httpOnly cookie so they can return to it with one
 * click instead of logging in twice.
 */

export const JWT_SECRET = getJwtSecret();

// The cookie's own lifetime, refreshed on every impersonated request while
// the admin is actively working (see refreshImpersonationCookieIfNeeded).
// This is how a multi-hour analysis session stays open without needing a
// literally unlimited token.
export const IMPERSONATION_SLIDING_WINDOW_SECONDS = 60 * 60; // 1 hour of inactivity ends it

// Hard ceiling even with continuous activity. A single "login as this user"
// session is for one piece of work, not a standing way into the account —
// past this, the admin must deliberately start a new one, which keeps the
// audit trail honest about distinct sessions.
export const IMPERSONATION_MAX_SESSION_SECONDS = 12 * 60 * 60; // 12 hours

export const SESSION_COOKIE = "token";
// Holds the admin's own token while they are "inside" a user's session, so
// "Return to admin" doesn't require logging in again.
export const ADMIN_RETURN_COOKIE = "admin_return_token";

export type ImpersonationClaims = {
  userId: string;
  role: "user" | "admin";
  sessionVersion: number;
  impersonation: true;
  impersonatedBy: string;
  impersonatedByEmail: string;
  logId: string;
  // Unix seconds when this impersonation session first started. Fixed for
  // the life of the session; used to enforce the 12h hard cap even as the
  // cookie itself keeps getting renewed by activity.
  sessionStartedAt: number;
};

/**
 * How many seconds the next token/cookie should live: the normal sliding
 * window, clipped to never cross IMPERSONATION_MAX_SESSION_SECONDS measured
 * from when the session first started. Returns 0 once the hard cap is hit.
 */
export function nextImpersonationTtlSeconds(sessionStartedAt: number): number {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const hardDeadline = sessionStartedAt + IMPERSONATION_MAX_SESSION_SECONDS;
  const remainingUntilHardCap = hardDeadline - nowSeconds;
  if (remainingUntilHardCap <= 0) return 0;
  return Math.min(IMPERSONATION_SLIDING_WINDOW_SECONDS, remainingUntilHardCap);
}

export function signImpersonationToken(claims: ImpersonationClaims, ttlSeconds: number): string {
  return jwt.sign(claims, JWT_SECRET, { expiresIn: ttlSeconds, algorithm: "HS256" });
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Swap the live session cookie to the impersonated user and stash the admin's own token. */
export function applyImpersonationCookies(
  response: NextResponse,
  impersonationToken: string,
  adminToken: string,
  ttlSeconds: number,
) {
  response.cookies.set(SESSION_COOKIE, impersonationToken, cookieOptions(ttlSeconds));
  response.cookies.set(ADMIN_RETURN_COOKIE, adminToken, cookieOptions(ttlSeconds));
}

/** Restore the admin's own session cookie and drop the stashed return token. */
export function clearImpersonationCookies(response: NextResponse, adminToken: string) {
  response.cookies.set(SESSION_COOKIE, adminToken, cookieOptions(60 * 60 * 24 * 7));
  response.cookies.set(ADMIN_RETURN_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
}

export function getCookie(request: Request, name: string): string | null {
  const pair = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!pair) return null;
  const raw = pair.slice(name.length + 1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw || null;
  }
}
