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
      const [hourCount, dayCount] = await Promise.all([
        GenerationLog.countDocuments({ userId: userObjectId, outcome: "allowed", createdAt: { $gte: new Date(now - HOUR_MS) } }),
        GenerationLog.countDocuments({ userId: userObjectId, outcome: "allowed", createdAt: { $gte: new Date(now - DAY_MS) } }),
      ]);

      const hourHit = hourCount >= GENERATION_HOURLY_LIMIT;
      const dayHit = dayCount >= GENERATION_DAILY_LIMIT;

      if (hourHit || dayHit) {
        await GenerationLog.create({ userId: userObjectId, route, ip, userAgent, outcome: "blocked" });
        const response = NextResponse.json(
          {
            success: false,
            code: "GENERATION_RATE_LIMIT",
            error: hourHit
              ? `আপনি ১ ঘণ্টায় সর্বোচ্চ ${GENERATION_HOURLY_LIMIT}টি ছবি তৈরি করতে পারবেন। কিছুক্ষণ পর আবার চেষ্টা করুন। (Hourly image limit reached - please try again later.)`
              : `আপনি ২৪ ঘণ্টায় সর্বোচ্চ ${GENERATION_DAILY_LIMIT}টি ছবি তৈরি করতে পারবেন। পরে আবার চেষ্টা করুন। (Daily image limit reached - please try again later.)`,
          },
          { status: 429, headers: { "Retry-After": hourHit ? "600" : "3600" } },
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
