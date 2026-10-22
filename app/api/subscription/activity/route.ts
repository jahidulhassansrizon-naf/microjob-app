import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";

export const dynamic = "force-dynamic";

function bangladeshDayBounds(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const start = new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00+06:00`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

function maskBuyerName(value: unknown) {
  const parts = String(value ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "একজন ক্রেতা";
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts.slice(0, -1).join(" ")} ${last.slice(0, 1)}.`;
}

function makeInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.slice(0, 1)).join("") || "ক্র";
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const parsedLimit = Number.parseInt(url.searchParams.get("limit") || "30", 10);
    const limit = Math.min(30, Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : 30));
    const completedFilter = {
      paymentStatus: "COMPLETED",
      userId: { $exists: true, $ne: null },
    };
    const { start, end } = bangladeshDayBounds(new Date());
    const todayFilter = {
      ...completedFilter,
      startedAt: { $gte: start, $lt: end },
    };

    const [buyerIds, todayBuyerIds, recentRaw] = await Promise.all([
      Subscription.distinct("userId", completedFilter),
      Subscription.distinct("userId", todayFilter),
      Subscription.find(completedFilter)
        .sort({ startedAt: -1, createdAt: -1 })
        .limit(limit)
        .populate({ path: "userId", select: "fullName" })
        .lean(),
    ]);

    const purchases = recentRaw.map((item: any) => {
      const fullName = item.userId && typeof item.userId === "object" ? item.userId.fullName : "";
      const name = maskBuyerName(fullName);
      const months = Number(item.months || 0);
      const fallbackPlan = months === 1 ? "1 Month plan" : months > 1 ? `${months} Months plan` : "Subscription plan";
      return {
        id: String(item._id),
        name,
        initials: makeInitials(name),
        planName: String(item.planName || fallbackPlan),
        amount: Math.max(0, Number(item.amount || 0)),
        createdAt: item.startedAt ? new Date(item.startedAt).toISOString() : item.createdAt ? new Date(item.createdAt).toISOString() : null,
      };
    });

    return NextResponse.json(
      { totalBuyers: buyerIds.length, boughtToday: todayBuyerIds.length, purchases },
      { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } },
    );
  } catch (error) {
    console.error("Subscription activity error:", error);
    return NextResponse.json(
      { message: "Could not load subscription activity." },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
