import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GenerationLog from "@/models/GenerationLog";
import User from "@/models/User";
import { GENERATION_DAILY_LIMIT, GENERATION_HOURLY_LIMIT } from "@/app/api/_lib/generationGuard";
import { requireAdmin } from "../_lib/adminAuth";

export const dynamic = "force-dynamic";

const HOUR_MS = 60 * 60 * 1000;

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;

  try {
    await connectDB();
    const url = new URL(request.url);
    const now = Date.now();
    const hours = url.searchParams.get("hours") === "168" ? 168 : 24;
    const since = new Date(now - hours * HOUR_MS);
    const hourAgo = new Date(now - HOUR_MS);

    // ---- Detail of one user: IP list + recent attempts ----
    const detailUserId = url.searchParams.get("userId");
    if (detailUserId) {
      if (!mongoose.isValidObjectId(detailUserId)) {
        return NextResponse.json({ success: false, message: "Invalid user id." }, { status: 400 });
      }
      const uid = new mongoose.Types.ObjectId(detailUserId);
      const [ips, recent] = await Promise.all([
        GenerationLog.aggregate([
          { $match: { userId: uid, createdAt: { $gte: new Date(now - 168 * HOUR_MS) } } },
          { $group: { _id: "$ip", count: { $sum: 1 }, lastAt: { $max: "$createdAt" }, userAgent: { $last: "$userAgent" } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ]),
        GenerationLog.find({ userId: uid }).sort({ createdAt: -1 }).limit(60).lean(),
      ]);
      return NextResponse.json({
        success: true,
        ips: ips.map((r: any) => ({ ip: r._id, count: r.count, lastAt: r.lastAt, userAgent: r.userAgent || "" })),
        recent: recent.map((r: any) => ({ id: String(r._id), route: r.route, ip: r.ip, userAgent: r.userAgent || "", outcome: r.outcome, createdAt: r.createdAt })),
      });
    }

    // ---- Overview list ----
    const rows = await GenerationLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: "$userId",
          allowed: { $sum: { $cond: [{ $eq: ["$outcome", "allowed"] }, 1, 0] } },
          blocked: { $sum: { $cond: [{ $eq: ["$outcome", "blocked"] }, 1, 0] } },
          lastHour: { $sum: { $cond: [{ $and: [{ $eq: ["$outcome", "allowed"] }, { $gte: ["$createdAt", hourAgo] }] }, 1, 0] } },
          ips: { $addToSet: "$ip" },
          lastAt: { $max: "$createdAt" },
        },
      },
      { $sort: { allowed: -1, blocked: -1 } },
      { $limit: 100 },
    ]);

    const sharedIpRows = await GenerationLog.aggregate([
      { $match: { createdAt: { $gte: since }, ip: { $ne: "unknown" } } },
      { $group: { _id: "$ip", users: { $addToSet: "$userId" }, count: { $sum: 1 } } },
      { $match: { "users.1": { $exists: true } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    const totals = await GenerationLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          allowed: { $sum: { $cond: [{ $eq: ["$outcome", "allowed"] }, 1, 0] } },
          blocked: { $sum: { $cond: [{ $eq: ["$outcome", "blocked"] }, 1, 0] } },
        },
      },
    ]);

    const userIds = new Set<string>();
    rows.forEach((r: any) => userIds.add(String(r._id)));
    sharedIpRows.forEach((r: any) => r.users.forEach((u: any) => userIds.add(String(u))));
    const users = await User.find({ _id: { $in: Array.from(userIds) } })
      .select("fullName email phoneNumber loginCount lastLoginAt isBanned")
      .lean();
    const userMap = new Map<string, any>(users.map((u: any) => [String(u._id), u]));

    const describe = (id: string) => {
      const u = userMap.get(id);
      return {
        id,
        fullName: u?.fullName || "(deleted user)",
        email: u?.email || "",
        phoneNumber: u?.phoneNumber || "",
        loginCount: Number(u?.loginCount || 0),
        lastLoginAt: u?.lastLoginAt || null,
        isBanned: Boolean(u?.isBanned),
      };
    };

    const items = rows.map((r: any) => {
      const reasons: string[] = [];
      if (r.blocked > 0) reasons.push("Hit the limit");
      if (r.lastHour >= Math.ceil(GENERATION_HOURLY_LIMIT * 0.75)) reasons.push("Very high in the last hour");
      if (r.allowed >= Math.ceil(GENERATION_DAILY_LIMIT * 0.7)) reasons.push("Very high volume");
      const realIps = (r.ips as string[]).filter((ip) => ip !== "unknown");
      if (realIps.length >= 3) reasons.push(`${realIps.length} different IPs`);
      return {
        ...describe(String(r._id)),
        allowed: r.allowed,
        blocked: r.blocked,
        lastHour: r.lastHour,
        ipCount: realIps.length,
        lastAt: r.lastAt,
        suspicious: reasons.length > 0,
        reasons,
      };
    });

    return NextResponse.json({
      success: true,
      hours,
      limits: { hourly: GENERATION_HOURLY_LIMIT, daily: GENERATION_DAILY_LIMIT },
      totals: { allowed: totals[0]?.allowed || 0, blocked: totals[0]?.blocked || 0, users: rows.length },
      items,
      sharedIps: sharedIpRows.map((r: any) => ({
        ip: r._id,
        count: r.count,
        users: (r.users as any[]).map((u) => describe(String(u))),
      })),
    });
  } catch (error) {
    console.error("Admin generation activity error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: "Could not load generation activity." }, { status: 500 });
  }
}
