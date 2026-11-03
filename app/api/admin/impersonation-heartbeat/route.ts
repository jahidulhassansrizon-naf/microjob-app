import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ImpersonationLog from "@/models/ImpersonationLog";
import {
  ADMIN_RETURN_COOKIE,
  JWT_SECRET,
  SESSION_COOKIE,
  applyImpersonationCookies,
  getCookie,
  nextImpersonationTtlSeconds,
  signImpersonationToken,
  type ImpersonationClaims,
} from "@/lib/impersonation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Keeps an active impersonation session alive while the admin is actually
 * using it. Called every few minutes by ImpersonationBanner. If the tab is
 * closed or the admin walks away, heartbeats stop and the existing cookie
 * expiry (at most IMPERSONATION_SLIDING_WINDOW_SECONDS away) still ends it —
 * this route only ever pushes that edge forward, never past the fixed 12h
 * hard cap measured from when the session first started.
 */
export async function POST(request: Request) {
  const token = getCookie(request, SESSION_COOKIE);
  const adminReturnToken = getCookie(request, ADMIN_RETURN_COOKIE);
  if (!token || !adminReturnToken) {
    return NextResponse.json({ success: false, message: "No active impersonation session." }, { status: 400 });
  }

  let claims: ImpersonationClaims;
  try {
    claims = jwt.verify(token, JWT_SECRET) as ImpersonationClaims;
  } catch {
    return NextResponse.json({ success: false, message: "Session expired." }, { status: 401 });
  }
  if (!claims.impersonation || typeof claims.sessionStartedAt !== "number") {
    return NextResponse.json({ success: false, message: "Not an impersonation session." }, { status: 400 });
  }

  const ttl = nextImpersonationTtlSeconds(claims.sessionStartedAt);
  if (ttl <= 0) {
    return NextResponse.json({ success: false, code: "HARD_CAP_REACHED", message: "This session has reached its 12-hour limit. Start a new one from the admin panel." }, { status: 410 });
  }

  const renewedToken = signImpersonationToken(claims, ttl);
  const expiresAt = new Date(Date.now() + ttl * 1000);

  if (claims.logId) {
    try {
      await connectDB();
      await ImpersonationLog.updateOne({ _id: claims.logId, endedAt: null }, { $set: { expiresAt } });
    } catch (error) {
      // Logging is best-effort here; a DB hiccup should not drop an
      // otherwise-active admin session mid-task.
      console.error("Impersonation heartbeat logging error:", error);
    }
  }

  const response = NextResponse.json({ success: true, expiresAt });
  applyImpersonationCookies(response, renewedToken, adminReturnToken, ttl);
  return response;
}
