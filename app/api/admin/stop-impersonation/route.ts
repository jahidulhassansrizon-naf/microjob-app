import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ImpersonationLog from "@/models/ImpersonationLog";
import {
  ADMIN_RETURN_COOKIE,
  JWT_SECRET,
  SESSION_COOKIE,
  clearImpersonationCookies,
  getCookie,
} from "@/lib/impersonation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Ends the active impersonation session (if any) and restores the admin's own token. */
export async function POST(request: Request) {
  const adminReturnToken = getCookie(request, ADMIN_RETURN_COOKIE);
  const currentToken = getCookie(request, SESSION_COOKIE);

  if (!adminReturnToken) {
    return NextResponse.json({ success: false, message: "No active impersonation session was found." }, { status: 400 });
  }

  try {
    jwt.verify(adminReturnToken, JWT_SECRET);
  } catch {
    return NextResponse.json({ success: false, message: "Your admin session has expired. Please sign in again." }, { status: 401 });
  }

  // Close out the audit record. Best-effort: a DB hiccup here must not trap
  // the admin inside the impersonated session.
  if (currentToken) {
    try {
      const decoded = jwt.verify(currentToken, JWT_SECRET) as { impersonation?: boolean; logId?: string };
      if (decoded?.impersonation && decoded.logId) {
        await connectDB();
        await ImpersonationLog.updateOne(
          { _id: decoded.logId, endedAt: null },
          { $set: { endedAt: new Date(), endedReason: "stopped" } },
        );
      }
    } catch (error) {
      console.error("Admin impersonation stop logging error:", error);
    }
  }

  const response = NextResponse.json({ success: true, message: "Returned to your administrator session." });
  clearImpersonationCookies(response, adminReturnToken);
  return response;
}
