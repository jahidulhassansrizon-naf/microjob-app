import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { PRESENCE_STALE_AFTER_MS } from "@/lib/presenceConstants";
import { getAdminCredentials } from "@/lib/adminCredentials";
import { requireAdmin } from "../_lib/adminAuth";
import { buildInsights } from "./_insights";

export const dynamic = "force-dynamic";

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// Short in-memory cache (per warm function instance) used only for background polling
// (?cached=1). Explicit loads and loads after admin actions always compute fresh data.
// The client polls every 60s, so the TTL must be longer than that for a single admin to ever
// get a cache hit; 90s lets roughly every second poll be served from memory.
const OVERVIEW_CACHE_TTL_MS = 90_000;
let overviewCache: { at: number; body: Record<string, unknown> } | null = null;
const OVERVIEW_HEADERS = { "Cache-Control": "no-store, max-age=0" };

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;

  const allowCached = new URL(request.url).searchParams.get("cached") === "1";
  if (allowCached && overviewCache && Date.now() - overviewCache.at < OVERVIEW_CACHE_TTL_MS) {
    return NextResponse.json(
      { ...overviewCache.body, admin: authorization.admin },
      { headers: OVERVIEW_HEADERS },
    );
  }

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
    const startOfMonth = new Date(`${dayKey(now).slice(0, 7)}-01T00:00:00+06:00`);
    const previousWeekStart = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
    const nextSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const realPaymentMatch = {
      paymentStatus: "COMPLETED",
      invoiceId: { $not: /^MOCK-/i },
      paymentMethod: { $not: /MOCK/i },
    };

    const [
      totalUsers,
      activeNow,
      loginsToday,
      activeSubscriberIds,
      activeSubscriptions,
      totalSubscriptions,
      pendingPayments,
      revenueRows,
      registrationRows,
      newToday,
      newThisMonth,
      newPreviousWeek,
      neverLoggedIn,
      bannedUsers,
      districtRows,
      revenueThisMonthRows,
      expiringSoon,
    ] = await Promise.all([
      User.countDocuments(databaseUserFilter),
      User.countDocuments({ ...databaseUserFilter, lastSeenAt: { $gte: activeCutoff } }),
      User.countDocuments({ ...databaseUserFilter, lastLoginAt: { $gte: startOfToday } }),
      Subscription.distinct("userId", activeSubscriptionFilter),
      Subscription.countDocuments(activeSubscriptionFilter),
      Subscription.countDocuments({}),
      Subscription.countDocuments({ paymentStatus: "PENDING" }),
      Subscription.aggregate([
        { $match: realPaymentMatch },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
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
      User.countDocuments({ ...databaseUserFilter, createdAt: { $gte: startOfToday } }),
      User.countDocuments({ ...databaseUserFilter, createdAt: { $gte: startOfMonth } }),
      User.countDocuments({
        ...databaseUserFilter,
        createdAt: { $gte: previousWeekStart, $lt: sevenDaysAgo },
      }),
      User.countDocuments({
        ...databaseUserFilter,
        $or: [{ lastLoginAt: null }, { lastLoginAt: { $exists: false } }],
      }),
      User.countDocuments({ ...databaseUserFilter, isBanned: true }),
      User.aggregate([
        { $match: { ...databaseUserFilter, district: { $type: "string", $ne: "" } } },
        { $group: { _id: "$district", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
      Subscription.aggregate([
        { $match: { ...realPaymentMatch, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Subscription.countDocuments({
        paymentStatus: "COMPLETED",
        accessStatus: "ACTIVE",
        expiresAt: { $gt: now, $lte: nextSevenDays },
      }),
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

    const weeklyTotal = weeklyRegistrations.reduce((sum, day) => sum + day.count, 0);
    const weeklyGrowthPercent = newPreviousWeek > 0
      ? Math.round(((weeklyTotal - newPreviousWeek) / newPreviousWeek) * 100)
      : null;
    const paidConversionPercent = totalUsers > 0
      ? Math.round((activeSubscriberIds.length / totalUsers) * 1000) / 10
      : 0;
    const topDistrict = districtRows[0]
      ? { name: String(districtRows[0]._id), users: Number(districtRows[0].count || 0) }
      : null;

    let insights = null;
    try {
      insights = await buildInsights({ now, startOfToday, startOfMonth, databaseUserFilter, realPaymentMatch, activeSubscriptionFilter, activeSubscriberIds });
    } catch (insightError) {
      console.error("Admin overview insights error:", insightError);
    }

    const body = {
        success: true,
        stats: {
          totalUsers,
          activeNow,
          loginsToday,
          activeSubscribers: activeSubscriberIds.length,
          activeSubscriptions,
          totalSubscriptions,
          pendingPayments,
          totalRevenue: Number(revenueRows[0]?.total || 0),
          newToday,
          newThisMonth,
          weeklyRegistrations: weeklyTotal,
          previousWeekRegistrations: newPreviousWeek,
          weeklyGrowthPercent,
          neverLoggedIn,
          bannedUsers,
          paidConversionPercent,
          revenueThisMonth: Number(revenueThisMonthRows[0]?.total || 0),
          expiringSoon,
          topDistrict,
        },
        weeklyRegistrations,
        insights,
        generatedAt: now.toISOString(),
    };
    overviewCache = { at: Date.now(), body };
    return NextResponse.json(
      { ...body, admin: authorization.admin },
      { headers: OVERVIEW_HEADERS },
    );
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json(
      { success: false, message: "Could not load admin overview." },
      { status: 500 },
    );
  }
}
