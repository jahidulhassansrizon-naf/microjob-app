import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { PRESENCE_STALE_AFTER_MS } from "@/lib/presenceConstants";
import { requireAdmin } from "../_lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;

  try {
    await connectDB();
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim().slice(0, 120);
    const status = url.searchParams.get("status") || "all";
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20));
    const now = new Date();
    const filter: Record<string, any> = {};

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ fullName: regex }, { email: regex }, { phoneNumber: regex }];
    }
    if (status === "online") {
      filter.lastSeenAt = { $gte: new Date(now.getTime() - PRESENCE_STALE_AFTER_MS) };
    } else if (status === "offline") {
      filter.$or = [
        ...(filter.$or || []),
        { lastSeenAt: { $lt: new Date(now.getTime() - PRESENCE_STALE_AFTER_MS) } },
        { lastSeenAt: null },
        { lastSeenAt: { $exists: false } },
      ];
      if (q) {
        // Keep search and offline constraints separate rather than replacing one another.
        const searchOr = filter.$or.slice(0, 3);
        const onlineOr = filter.$or.slice(3);
        filter.$and = [{ $or: searchOr }, { $or: onlineOr }];
        delete filter.$or;
      }
    } else if (status === "subscribed") {
      const activeIds = await Subscription.distinct("userId", {
        paymentStatus: "COMPLETED",
        accessStatus: "ACTIVE",
        expiresAt: { $gt: now },
      });
      filter._id = { $in: activeIds };
    }

    const [total, usersRaw] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("fullName email phoneNumber country district role isBanned bannedAt bannedBy banReason createdAt lastLoginAt lastSeenAt loginCount manualAccessEnabled manualAccessExpiresAt manualAccessGrantedAt manualAccessGrantedBy isPrimaryAdmin")
        .sort({ lastLoginAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const activeCutoff = now.getTime() - PRESENCE_STALE_AFTER_MS;
    const activeUserIds = usersRaw.map((user: any) => user._id);
    const subscriptions = await Subscription.find({
      userId: { $in: activeUserIds },
      paymentStatus: "COMPLETED",
      accessStatus: "ACTIVE",
      expiresAt: { $gt: now },
    })
      .sort({ expiresAt: -1 })
      .select("userId planId planName amount expiresAt")
      .lean();
    const subscriptionByUser = new Map<string, any>();
    for (const subscription of subscriptions as any[]) {
      const id = String(subscription.userId);
      if (!subscriptionByUser.has(id)) subscriptionByUser.set(id, subscription);
    }

    const users = usersRaw.map((user: any) => ({
      id: String(user._id),
      fullName: user.fullName || "—",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      country: user.country || "",
      district: user.district || "",
      role: user.role === "admin" ? "admin" : "user",
      isPrimaryAdmin: user.isPrimaryAdmin === true,
      isBanned: user.isBanned === true,
      bannedAt: user.bannedAt || null,
      bannedBy: user.bannedBy || "",
      banReason: user.banReason || "",
      createdAt: user.createdAt || null,
      lastLoginAt: user.lastLoginAt || null,
      lastSeenAt: user.lastSeenAt || null,
      loginCount: Number(user.loginCount || 0),
      isOnline: Boolean(user.lastSeenAt && new Date(user.lastSeenAt).getTime() >= activeCutoff),
      manualAccess: {
        enabled: user.manualAccessEnabled === true,
        isActive: Boolean(
          user.manualAccessEnabled === true &&
            user.manualAccessExpiresAt &&
            new Date(user.manualAccessExpiresAt).getTime() > now.getTime(),
        ),
        expiresAt: user.manualAccessExpiresAt || null,
        grantedAt: user.manualAccessGrantedAt || null,
        grantedBy: user.manualAccessGrantedBy || "",
      },
      subscription: subscriptionByUser.get(String(user._id))
        ? {
            planId: subscriptionByUser.get(String(user._id)).planId,
            planName: subscriptionByUser.get(String(user._id)).planName,
            amount: subscriptionByUser.get(String(user._id)).amount,
            expiresAt: subscriptionByUser.get(String(user._id)).expiresAt,
          }
        : null,
    }));

    return NextResponse.json(
      { success: true, users, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { success: false, message: "Could not load the user list." },
      { status: 500 },
    );
  }
}
