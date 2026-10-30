import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { PRESENCE_STALE_AFTER_MS } from "@/lib/presenceConstants";
import { getAdminCredentials } from "@/lib/adminCredentials";
import { requireAdmin } from "../_lib/adminAuth";

export const dynamic = "force-dynamic";

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;

  try {
    await connectDB();
    const now = new Date();
    const activeCutoff = new Date(now.getTime() - PRESENCE_STALE_AFTER_MS);
    const mainAdminEmail = getAdminCredentials().email;
    const databaseUserFilter = mainAdminEmail ? { email: { $ne: mainAdminEmail } } : {};
    const activeSubscriptionFilter = {
      paymentStatus: "COMPLETED",
      accessStatus: "ACTIVE",
      expiresAt: { $gt: now },
    };
    const startOfToday = new Date(`${dayKey(now)}T00:00:00+06:00`);
    const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeNow,
      loginsToday,
      activeSubscriptions,
      activeSubscriberIds,
      totalSubscriptions,
      pendingPayments,
      revenueRows,
      recentUsersRaw,
      recentLoginsRaw,
      recentSubscriptionsRaw,
      registrationRows,
    ] = await Promise.all([
      User.countDocuments(databaseUserFilter),
      User.countDocuments({ ...databaseUserFilter, lastSeenAt: { $gte: activeCutoff } }),
      User.countDocuments({ ...databaseUserFilter, lastLoginAt: { $gte: startOfToday } }),
      Subscription.countDocuments(activeSubscriptionFilter),
      Subscription.distinct("userId", activeSubscriptionFilter),
      Subscription.countDocuments({}),
      Subscription.countDocuments({ paymentStatus: "PENDING" }),
      Subscription.aggregate([
        {
          $match: {
            paymentStatus: "COMPLETED",
            invoiceId: { $not: /^MOCK-/i },
            paymentMethod: { $not: /MOCK/i },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.find(databaseUserFilter)
        .select("fullName email phoneNumber role isBanned country district createdAt lastLoginAt lastSeenAt loginCount")
        .sort({ createdAt: -1 })
        .limit(7)
        .lean(),
      User.find({ ...databaseUserFilter, lastLoginAt: { $ne: null, $exists: true } })
        .select("fullName email phoneNumber role isBanned lastLoginAt lastSeenAt loginCount")
        .sort({ lastLoginAt: -1 })
        .limit(7)
        .lean(),
      Subscription.find({})
        .sort({ createdAt: -1 })
        .limit(7)
        .populate({ path: "userId", select: "fullName email phoneNumber" })
        .lean(),
      User.aggregate([
        { $match: { ...databaseUserFilter, createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Dhaka",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const registrationsByDate = new Map<string, number>(
      registrationRows.map((row: { _id: string; count: number }) => [row._id, row.count]),
    );
    const weeklyRegistrations = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now.getTime() - (6 - index) * 24 * 60 * 60 * 1000);
      const key = dayKey(date);
      return {
        date: key,
        label: new Intl.DateTimeFormat("en", {
          timeZone: "Asia/Dhaka",
          weekday: "short",
        }).format(date),
        count: registrationsByDate.get(key) || 0,
      };
    });

    const recentUserIds = recentUsersRaw.map((user: any) => user._id);
    const recentUserSubscriptions = await Subscription.find({
      userId: { $in: recentUserIds },
      ...activeSubscriptionFilter,
    })
      .sort({ expiresAt: -1 })
      .select("userId planId planName amount expiresAt")
      .lean();
    const recentSubscriptionByUser = new Map<string, any>();
    for (const subscription of recentUserSubscriptions as any[]) {
      const id = String(subscription.userId);
      if (!recentSubscriptionByUser.has(id)) recentSubscriptionByUser.set(id, subscription);
    }

    const recentUsers = recentUsersRaw.map((user: any) => {
      const activeSubscription = recentSubscriptionByUser.get(String(user._id));
      return {
        ...user,
        id: String(user._id),
        role: user.role === "admin" ? "admin" : "user",
        isBanned: user.isBanned === true,
        isOnline: Boolean(user.lastSeenAt && new Date(user.lastSeenAt).getTime() >= activeCutoff.getTime()),
        subscription: activeSubscription
          ? {
              planId: activeSubscription.planId,
              planName: activeSubscription.planName,
              amount: activeSubscription.amount,
              expiresAt: activeSubscription.expiresAt,
            }
          : null,
      };
    });
    const recentLogins = recentLoginsRaw.map((user: any) => ({
      ...user,
      id: String(user._id),
      role: user.role === "admin" ? "admin" : "user",
      isBanned: user.isBanned === true,
      isOnline: Boolean(user.lastSeenAt && new Date(user.lastSeenAt).getTime() >= activeCutoff.getTime()),
    }));
    const recentSubscriptions = recentSubscriptionsRaw.map((subscription: any) => ({
      ...subscription,
      id: String(subscription._id),
      user: subscription.userId && typeof subscription.userId === "object"
        ? {
            id: String(subscription.userId._id),
            fullName: subscription.userId.fullName || "Unknown user",
            email: subscription.userId.email || "",
            phoneNumber: subscription.userId.phoneNumber || "",
          }
        : null,
      userId: subscription.userId && typeof subscription.userId === "object"
        ? String(subscription.userId._id)
        : String(subscription.userId || ""),
    }));

    return NextResponse.json(
      {
        success: true,
        admin: authorization.admin,
        stats: {
          totalUsers,
          activeNow,
          loginsToday,
          activeSubscribers: activeSubscriberIds.length,
          activeSubscriptions,
          totalSubscriptions,
          pendingPayments,
          totalRevenue: Number(revenueRows[0]?.total || 0),
        },
        weeklyRegistrations,
        recentUsers,
        recentLogins,
        recentSubscriptions,
        generatedAt: now.toISOString(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json(
      { success: false, message: "Could not load admin overview." },
      { status: 500 },
    );
  }
}
