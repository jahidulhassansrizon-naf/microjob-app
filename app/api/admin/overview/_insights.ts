import User from "@/models/User";
import Subscription from "@/models/Subscription";
import ChatMessage from "@/models/ChatMessage";
import GenerationLog from "@/models/GenerationLog";
import Otp from "@/models/Otp";
import PipraPaySettings from "@/models/PipraPaySettings";
import UddoktaPaySettings from "@/models/UddoktaPaySettings";
import { AI_COST_PER_IMAGE_BDT } from "@/app/api/_lib/generationGuard";

const DAY = 24 * 60 * 60 * 1000;
const PLAN_MONTHS: Record<string, number> = { "1-month": 1, "3-month": 3, "6-month": 6, "1-year": 12 };
const TOOL_LABELS: Record<string, string> = {
  "image-generate": "AI Editor / Bulk Photo Edit",
  "template-generate": "AI Template",
};

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

async function safe<T = any>(promise: PromiseLike<any>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error("Overview insight query failed:", error instanceof Error ? error.message : error);
    return fallback;
  }
}

type Ctx = {
  now: Date;
  startOfToday: Date;
  startOfMonth: Date;
  databaseUserFilter: Record<string, unknown>;
  realPaymentMatch: Record<string, unknown>;
  activeSubscriptionFilter: Record<string, unknown>;
  activeSubscriberIds: unknown[];
};

export async function buildInsights(ctx: Ctx) {
  const { now, startOfToday, startOfMonth, databaseUserFilter, realPaymentMatch, activeSubscriptionFilter } = ctx;
  const activeIdSet = new Set(ctx.activeSubscriberIds.map((id) => String(id)));
  const startOfYesterday = new Date(startOfToday.getTime() - DAY);
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);
  const seriesStart = new Date(startOfToday.getTime() - 29 * DAY);
  const dateGroup = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Dhaka" } };

  const [
    unreadChats,
    failedPayments24h,
    dau,
    mau,
    activeSubs,
    planRows,
    toolRows,
    signups30,
    returnBase,
    returnedCount,
    expiredUserIds,
    costMonthCount,
    dailySignups,
    dailyPaid,
    dailyGenerations,
    piprapay,
    uddokta,
    openChatIds,
    chatMessages,
    otpToday,
  ] = await Promise.all([
    safe(ChatMessage.countDocuments({ senderRole: "user", readByAdmin: false }), 0),
    safe(Subscription.countDocuments({ paymentStatus: { $in: ["ERROR", "REJECTED"] }, updatedAt: { $gte: new Date(now.getTime() - DAY) } }), 0),
    safe(User.countDocuments({ ...databaseUserFilter, lastSeenAt: { $gte: startOfToday } }), 0),
    safe(User.countDocuments({ ...databaseUserFilter, lastSeenAt: { $gte: thirtyDaysAgo } }), 0),
    safe(Subscription.find({ ...activeSubscriptionFilter, ...realPaymentMatch }).select("planId amount months planDays").lean(), [] as any[]),
    safe(Subscription.aggregate([{ $match: realPaymentMatch }, { $sort: { createdAt: -1 } }, { $group: { _id: "$planId", planName: { $first: "$planName" }, count: { $sum: 1 }, revenue: { $sum: "$amount" } } }]), [] as any[]),
    safe(
      GenerationLog.aggregate([
        { $match: { outcome: "allowed", createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: "$route",
            uses: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ["$success", true] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ["$success", false] }, 1, 0] } },
            today: { $sum: { $cond: [{ $gte: ["$createdAt", startOfToday] }, 1, 0] } },
            yesterday: { $sum: { $cond: [{ $and: [{ $gte: ["$createdAt", startOfYesterday] }, { $lt: ["$createdAt", startOfToday] }] }, 1, 0] } },
          },
        },
        { $sort: { uses: -1 } },
      ]),
      [] as any[],
    ),
    safe(User.find({ ...databaseUserFilter, createdAt: { $gte: seriesStart } }).select("_id").lean(), [] as any[]),
    safe(User.countDocuments({ ...databaseUserFilter, createdAt: { $gte: new Date(now.getTime() - 14 * DAY), $lt: sevenDaysAgo } }), 0),
    safe(
      User.countDocuments({
        ...databaseUserFilter,
        createdAt: { $gte: new Date(now.getTime() - 14 * DAY), $lt: sevenDaysAgo },
        $expr: { $gte: ["$lastSeenAt", { $add: ["$createdAt", DAY] }] },
      }),
      0,
    ),
    safe(Subscription.distinct("userId", { paymentStatus: "COMPLETED", expiresAt: { $gte: thirtyDaysAgo, $lt: now } }), [] as any[]),
    safe(GenerationLog.countDocuments({ outcome: "allowed", createdAt: { $gte: startOfMonth } }), 0),
    safe(User.aggregate([{ $match: { ...databaseUserFilter, createdAt: { $gte: seriesStart } } }, { $group: { _id: dateGroup, count: { $sum: 1 } } }]), [] as any[]),
    safe(Subscription.aggregate([{ $match: { ...realPaymentMatch, createdAt: { $gte: seriesStart } } }, { $group: { _id: dateGroup, count: { $sum: 1 }, revenue: { $sum: "$amount" } } }]), [] as any[]),
    safe(GenerationLog.aggregate([{ $match: { outcome: "allowed", createdAt: { $gte: seriesStart } } }, { $group: { _id: dateGroup, count: { $sum: 1 } } }]), [] as any[]),
    safe(PipraPaySettings.findOne({ key: "primary" }).select("+apiKeyEncrypted enabled updatedAt").lean(), null as any),
    safe(UddoktaPaySettings.findOne({ key: "primary" }).select("+apiKeyEncrypted enabled updatedAt").lean(), null as any),
    safe(ChatMessage.distinct("conversationId", { senderRole: "user", readByAdmin: false }), [] as any[]),
    safe(ChatMessage.find({ createdAt: { $gte: sevenDaysAgo } }).select("conversationId senderRole createdAt").sort({ conversationId: 1, createdAt: 1 }).limit(8000).lean(), [] as any[]),
    safe(Otp.countDocuments({ createdAt: { $gte: startOfToday } }), 0),
  ]);

  // MRR: convert each active subscription price to a 30-day equivalent.
  // The immutable day snapshot supports custom plans without relying on fixed IDs.
  const mrr = Math.round(
    (activeSubs as any[]).reduce((sum, sub) => {
      const days = Number(sub.planDays || 0);
      const months = days > 0
        ? (days % 365 === 0 ? (days / 365) * 12 : days / 30)
        : Number(sub.months || PLAN_MONTHS[sub.planId] || 1);
      return sum + Number(sub.amount || 0) / Math.max(months, 1 / 30);
    }, 0),
  );

  // Tools
  const tools = (toolRows as any[]).map((row) => {
    const finished = row.success + row.failed;
    return {
      key: String(row._id),
      label: TOOL_LABELS[String(row._id)] || String(row._id),
      uses: row.uses,
      today: row.today,
      yesterday: row.yesterday,
      successRate: finished > 0 ? Math.round((row.success / finished) * 1000) / 10 : null,
      failed: row.failed,
    };
  });
  const todayTotal = tools.reduce((s, t) => s + t.today, 0);
  const yesterdayTotal = tools.reduce((s, t) => s + t.yesterday, 0);
  const weekTotal = tools.reduce((s, t) => s + t.uses, 0);

  // Activation: of the last-30-day sign-ups, how many generated at least one image.
  const signupIds = (signups30 as any[]).map((u) => u._id);
  const activatedIds = signupIds.length
    ? await safe(GenerationLog.distinct("userId", { userId: { $in: signupIds }, outcome: "allowed" }), [] as any[])
    : [];

  // Churn
  const expiredUnique = Array.from(new Set((expiredUserIds as any[]).map((id) => String(id))));
  const notRenewed = expiredUnique.filter((id) => !activeIdSet.has(id)).length;

  // Support: average first-reply time over the last 7 days
  const replyGaps: number[] = [];
  let currentConversation = "";
  let waitingSince: number | null = null;
  for (const message of chatMessages as any[]) {
    const conversation = String(message.conversationId);
    if (conversation !== currentConversation) {
      currentConversation = conversation;
      waitingSince = null;
    }
    const at = new Date(message.createdAt).getTime();
    if (message.senderRole === "user") {
      if (waitingSince === null) waitingSince = at;
    } else if (waitingSince !== null) {
      replyGaps.push(at - waitingSince);
      waitingSince = null;
    }
  }
  const avgReplyMinutes = replyGaps.length ? Math.round(replyGaps.reduce((a, b) => a + b, 0) / replyGaps.length / 60000) : null;

  // 30-day series
  const signupMap = new Map<string, number>((dailySignups as any[]).map((r) => [r._id, r.count]));
  const paidMap = new Map<string, any>((dailyPaid as any[]).map((r) => [r._id, r]));
  const genMap = new Map<string, number>((dailyGenerations as any[]).map((r) => [r._id, r.count]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(seriesStart.getTime() + i * DAY + 12 * 60 * 60 * 1000);
    const key = dayKey(date);
    return {
      date: key,
      label: new Intl.DateTimeFormat("en", { timeZone: "Asia/Dhaka", day: "numeric", month: "short" }).format(date),
      signups: signupMap.get(key) || 0,
      paid: paidMap.get(key)?.count || 0,
      revenue: Number(paidMap.get(key)?.revenue || 0),
      aiCost: Math.round((genMap.get(key) || 0) * AI_COST_PER_IMAGE_BDT * 100) / 100,
    };
  });

  const aiCostMonth = Math.round(costMonthCount * AI_COST_PER_IMAGE_BDT);
  const aiCostToday = Math.round(todayTotal * AI_COST_PER_IMAGE_BDT);

  const gateway = (name: string, doc: any) => ({
    name,
    enabled: Boolean(doc?.enabled),
    hasKey: Boolean(doc?.apiKeyEncrypted),
    updatedAt: doc?.updatedAt || null,
  });

  return {
    attention: { unreadChats, failedPayments24h },
    kpi: {
      dau,
      mau,
      mrr,
      costConfigured: AI_COST_PER_IMAGE_BDT > 0,
      aiCostMonth,
    },
    usage: { tools, todayTotal, yesterdayTotal, weekTotal },
    growth: {
      activation: { base: signupIds.length, activated: activatedIds.length },
      sevenDayReturn: { base: returnBase, returned: returnedCount },
      churn: { expired: expiredUnique.length, notRenewed },
      plans: (planRows as any[]).map((r) => ({ planId: String(r._id || "unknown"), planName: String(r.planName || ""), count: r.count, revenue: Number(r.revenue || 0) })),
    },
    health: {
      aiCostToday,
      aiCostMonth,
      generationsThisMonth: costMonthCount,
      unitCost: AI_COST_PER_IMAGE_BDT,
      gateways: [gateway("PipraPay", piprapay), gateway("UddoktaPay", uddokta)],
      support: { openChats: (openChatIds as any[]).length, avgReplyMinutes },
      security: { otpToday },
    },
    series: days,
  };
}
