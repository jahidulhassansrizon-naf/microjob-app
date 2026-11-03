import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import ImpersonationLog from "@/models/ImpersonationLog";
import { ENV_ADMIN_USER_ID, isConfiguredAdminEmail } from "@/lib/adminCredentials";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";
import {
  IMPERSONATION_MAX_SESSION_SECONDS,
  IMPERSONATION_SLIDING_WINDOW_SECONDS,
  applyImpersonationCookies,
  getCookie,
  signImpersonationToken,
  SESSION_COOKIE,
} from "@/lib/impersonation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ userId: string }> };

/**
 * Starts an impersonation session: the requesting admin's session cookie is
 * swapped for a short-lived token for the target user, and the admin's own
 * token is kept (separately, httpOnly) so they can return to it. No
 * password is read, changed, or exposed. Every call here is written to
 * ImpersonationLog before the cookie is issued.
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  if (!auth.admin) {
    return NextResponse.json({ success: false, message: "Could not verify administrator access." }, { status: 503 });
  }

  const adminToken = getCookie(request, SESSION_COOKIE);
  if (!adminToken) {
    return NextResponse.json({ success: false, message: "Your admin session token could not be read. Please sign in again." }, { status: 401 });
  }

  try {
    const { userId } = await context.params;
    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user ID." }, { status: 400 });
    }
    if (userId === auth.admin.id || userId === ENV_ADMIN_USER_ID) {
      return NextResponse.json({ success: false, message: "You cannot impersonate your own administrator account." }, { status: 403 });
    }

    await connectDB();
    const user = await User.findById(userId).select("fullName email role isBanned sessionVersion");
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }
    if (isConfiguredAdminEmail(user.email)) {
      return NextResponse.json({ success: false, message: "The Main Admin identity cannot be impersonated." }, { status: 403 });
    }
    if (user.role === "admin" && !auth.admin.isRootAdmin) {
      return NextResponse.json({ success: false, message: "Only the primary administrator can log in as another administrator account." }, { status: 403 });
    }

    const now = new Date();
    const nowSeconds = Math.floor(now.getTime() / 1000);
    // Shown to the admin as "ends at" — the first sliding-window edge. The
    // session can keep renewing past this (see the heartbeat route) up to
    // the 12h hard cap from sessionStartedAt.
    const expiresAt = new Date(now.getTime() + IMPERSONATION_SLIDING_WINDOW_SECONDS * 1000);
    const hardCapAt = new Date(now.getTime() + IMPERSONATION_MAX_SESSION_SECONDS * 1000);

    // Write the audit record before issuing the cookie, so a session can
    // never exist without a corresponding log entry.
    const log = await ImpersonationLog.create({
      adminId: auth.admin.id,
      adminEmail: auth.admin.email,
      adminFullName: auth.admin.fullName,
      targetUserId: user._id,
      targetEmail: user.email || "",
      targetFullName: user.fullName || "",
      startedAt: now,
      expiresAt,
      hardCapAt,
      ipAddress: request.headers.get("x-forwarded-for") || "",
      userAgent: request.headers.get("user-agent") || "",
    });

    const impersonationToken = signImpersonationToken(
      {
        userId: String(user._id),
        role: user.role === "admin" ? "admin" : "user",
        sessionVersion: Number(user.sessionVersion || 0),
        impersonation: true,
        impersonatedBy: auth.admin.id,
        impersonatedByEmail: auth.admin.email,
        logId: String(log._id),
        sessionStartedAt: nowSeconds,
      },
      IMPERSONATION_SLIDING_WINDOW_SECONDS,
    );

    const response = NextResponse.json({
      success: true,
      message: `You are now signed in as ${user.fullName || user.email}. Staying active keeps this session open up to 12 hours; it is logged under reference ${String(log._id)}.`,
      expiresAt,
      hardCapAt,
      logId: String(log._id),
    });
    applyImpersonationCookies(response, impersonationToken, adminToken, IMPERSONATION_SLIDING_WINDOW_SECONDS);
    return response;
  } catch (error) {
    console.error("Admin impersonation start error:", error);
    return NextResponse.json({ success: false, message: "Could not start an impersonation session." }, { status: 500 });
  }
}
