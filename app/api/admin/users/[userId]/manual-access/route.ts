import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAdmin } from "../../../_lib/adminAuth";

export const dynamic = "force-dynamic";

const ALLOWED_MONTHS = new Set([1, 3, 6, 12]);

type RouteContext = {
  params: Promise<{ userId: string }>;
};

function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const dayOfMonth = result.getUTCDate();

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  const lastDayOfTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(dayOfMonth, lastDayOfTargetMonth));

  return result;
}

export async function PATCH(request: Request, context: RouteContext) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;

  try {
    const { userId } = await context.params;
    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID." },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (action !== "grant" && action !== "revoke") {
      return NextResponse.json(
        { success: false, message: "Choose whether to grant or revoke access." },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    if (action === "revoke") {
      user.manualAccessEnabled = false;
      await user.save();

      return NextResponse.json({
        success: true,
        message: "Manual access has been revoked. Payment records were not changed.",
        manualAccess: {
          enabled: false,
          isActive: false,
          expiresAt: user.manualAccessExpiresAt || null,
          grantedAt: user.manualAccessGrantedAt || null,
          grantedBy: user.manualAccessGrantedBy || "",
        },
      });
    }

    const months = Number(body?.months);
    if (!Number.isInteger(months) || !ALLOWED_MONTHS.has(months)) {
      return NextResponse.json(
        { success: false, message: "Select 1, 3, 6 or 12 months." },
        { status: 400 },
      );
    }

    const now = new Date();
    const existingExpiry = user.manualAccessExpiresAt
      ? new Date(user.manualAccessExpiresAt)
      : null;
    const baseDate =
      user.manualAccessEnabled &&
      existingExpiry &&
      existingExpiry.getTime() > now.getTime()
        ? existingExpiry
        : now;
    const expiresAt = addCalendarMonths(baseDate, months);

    user.manualAccessEnabled = true;
    user.manualAccessExpiresAt = expiresAt;
    user.manualAccessGrantedAt = now;
    user.manualAccessGrantedBy = authorization.admin?.email || "Administrator";
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Manual access granted until ${expiresAt.toISOString()}. Payment records were not changed.`,
      manualAccess: {
        enabled: true,
        isActive: expiresAt.getTime() > Date.now(),
        expiresAt,
        grantedAt: user.manualAccessGrantedAt,
        grantedBy: user.manualAccessGrantedBy,
      },
    });
  } catch (error) {
    console.error("Admin manual access update error:", error);
    return NextResponse.json(
      { success: false, message: "Could not update manual access." },
      { status: 500 },
    );
  }
}
