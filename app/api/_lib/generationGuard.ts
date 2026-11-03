import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import GenerationLog from "@/models/GenerationLog";
import User from "@/models/User";

// Per-account limits (paid users included). Change here or via .env.local:
//   GENERATION_HOURLY_LIMIT=20   GENERATION_DAILY_LIMIT=100
export const GENERATION_HOURLY_LIMIT = Number(process.env.GENERATION_HOURLY_LIMIT) || 20;
export const GENERATION_DAILY_LIMIT = Number(process.env.GENERATION_DAILY_LIMIT) || 100;

// Estimated provider cost of one generated image in BDT (Gemini/fal/etc.). Used only for the
// "AI cost" and "Net margin" cards on the admin overview. 0 = not configured.
export const AI_COST_PER_IMAGE_BDT = Number(process.env.AI_COST_PER_IMAGE_BDT) || 0;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type LimitStatus = {
  hourCount: number;
  dayCount: number;
  hourHit: boolean;
  dayHit: boolean;
  /** When the account can generate again (ms since epoch), or null if it is not limited now. */
  unlockAt: number | null;
};

/**
 * The limits are rolling windows (last 60 minutes / last 24 hours). An account is open again when
 * enough of its oldest generations have left the window to drop the count below the limit.
 * `times` = createdAt (ms) of the account's "allowed" generations in the last 24 hours.
 */
export function computeLimitStatus(times: number[], now: number): LimitStatus {
  const sorted = [...times].sort((a, b) => a - b);
  const hourTimes = sorted.filter((t) => t >= now - HOUR_MS);
  const dayTimes = sorted.filter((t) => t >= now - DAY_MS);
  const hourHit = hourTimes.length >= GENERATION_HOURLY_LIMIT;
  const dayHit = dayTimes.length >= GENERATION_DAILY_LIMIT;
  const hourUnlock = hourHit ? hourTimes[hourTimes.length - GENERATION_HOURLY_LIMIT] + HOUR_MS : 0;
  const dayUnlock = dayHit ? dayTimes[dayTimes.length - GENERATION_DAILY_LIMIT] + DAY_MS : 0;
  return {
    hourCount: hourTimes.length,
    dayCount: dayTimes.length,
    hourHit,
    dayHit,
    unlockAt: hourHit || dayHit ? Math.max(hourUnlock, dayUnlock) : null,
  };
}

export type GenerationQuota = {
  limited: boolean;
  /** How many more images the account can generate right now (smaller of hourly / daily). */
  remaining: number;
  hourlyLimit: number;
  hourlyRemaining: number;
  dailyLimit: number;
  dailyRemaining: number;
  /** ISO time when the account can generate again, only when limited. */
  unlockAt: string | null;
};

export function quotaFromTimes(times: number[], now: number): GenerationQuota {
  const status = computeLimitStatus(times, now);
  const hourlyRemaining = Math.max(0, GENERATION_HOURLY_LIMIT - status.hourCount);
  const dailyRemaining = Math.max(0, GENERATION_DAILY_LIMIT - status.dayCount);
  return {
    limited: status.unlockAt !== null,
    remaining: Math.min(hourlyRemaining, dailyRemaining),
    hourlyLimit: GENERATION_HOURLY_LIMIT,
    hourlyRemaining,
    dailyLimit: GENERATION_DAILY_LIMIT,
    dailyRemaining,
    unlockAt: status.unlockAt !== null ? new Date(status.unlockAt).toISOString() : null,
  };
}

function waitText(ms: number): { bn: string; en: string } {
  const mins = Math.max(1, Math.ceil(ms / 60000));
  if (mins < 60) return { bn: `${mins} মিনিট`, en: `${mins} min` };
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return { bn: m ? `${h} ঘণ্টা ${m} মিনিট` : `${h} ঘণ্টা`, en: m ? `${h}h ${m}m` : `${h}h` };
}

export function getClientIp(request: Request): string {
  const h = request.headers;
  const ip =
    h.get("cf-connecting-ip")?.trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return ip.slice(0, 64);
}

/**
 * Records the generation (IP + device) and enforces the hourly / daily limit.
 * Returns a 429 response when the limit is reached, otherwise null.
 * Never blocks a generation because of a database hiccup.
 */
export type GenerationGuardResult = { response: NextResponse | null; logId: string | null };

export async function markGenerationResult(logId: string | null, success: boolean): Promise<void> {
  if (!logId) return;
  try {
    await GenerationLog.updateOne({ _id: logId }, { $set: { success } });
  } catch {
    // statistics only - never break a generation because of this
  }
}

export async function enforceGenerationLimit(
  request: Request,
  userId: string,
  route: string,
): Promise<GenerationGuardResult> {
  try {
    if (!mongoose.isValidObjectId(userId)) return { response: null, logId: null };
    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const ip = getClientIp(request);
    const userAgent = (request.headers.get("user-agent") || "").slice(0, 300);
    const now = Date.now();

    const account = await User.findById(userObjectId).select("role").lean<{ role?: string }>();
    const isAdmin = account?.role === "admin";

    if (!isAdmin) {
      // Failed generations (success === false) do not use up the limit. A generation that is
      // still running has no success value yet, so it is counted.
      const recentLogs = await GenerationLog.find({
        userId: userObjectId,
        outcome: "allowed",
        success: { $ne: false },
        createdAt: { $gte: new Date(now - DAY_MS) },
      })
        .select("createdAt")
        .lean<{ createdAt: Date }[]>();
      const status = computeLimitStatus(recentLogs.map((l) => new Date(l.createdAt).getTime()), now);

      if (status.unlockAt !== null) {
        await GenerationLog.create({ userId: userObjectId, route, ip, userAgent, outcome: "blocked" });
        const waitMs = Math.max(0, status.unlockAt - now);
        const wait = waitText(waitMs);
        const response = NextResponse.json(
          {
            success: false,
            code: "GENERATION_RATE_LIMIT",
            unlockAt: new Date(status.unlockAt).toISOString(),
            retryAfterSeconds: Math.ceil(waitMs / 1000),
            error: status.hourHit
              ? `আপনি ১ ঘণ্টায় সর্বোচ্চ ${GENERATION_HOURLY_LIMIT}টি ছবি তৈরি করতে পারবেন। আবার তৈরি করতে পারবেন ${wait.bn} পরে। (Hourly image limit reached - you can generate again in ${wait.en}.)`
              : `আপনার ছবি তৈরির লিমিট শেষ। আবার তৈরি করতে পারবেন ${wait.bn} পরে। (Image limit reached - you can generate again in ${wait.en}.)`,
          },
          { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil(waitMs / 1000))) } },
        );
        return { response, logId: null };
      }
    }

    const created = await GenerationLog.create({ userId: userObjectId, route, ip, userAgent, outcome: "allowed" });
    return { response: null, logId: String(created._id) };
  } catch (error) {
    console.error("Generation guard error (continuing without limit):", error);
    return { response: null, logId: null };
  }
}
