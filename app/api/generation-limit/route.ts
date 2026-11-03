import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GenerationLog from "@/models/GenerationLog";
import { requireToolAccess } from "@/app/api/_lib/requireActiveSubscription";
import { quotaFromTimes } from "@/app/api/_lib/generationGuard";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/**
 * How many images the signed-in account can still generate, and (when the limit is reached)
 * when it opens again. Same rolling hourly / daily windows as enforceGenerationLimit.
 */
export async function GET(request: Request) {
  const access = await requireToolAccess(request);
  if (!access.ok) return access.response;

  // Admin accounts are not limited.
  if (access.role === "admin" || !mongoose.isValidObjectId(access.userId)) {
    return NextResponse.json({ success: true, unlimited: true }, { headers: NO_STORE });
  }

  try {
    await connectDB();
    const now = Date.now();
    const logs = await GenerationLog.find({
      userId: new mongoose.Types.ObjectId(access.userId),
      outcome: "allowed",
      success: { $ne: false }, // failed generations do not use up the limit
      createdAt: { $gte: new Date(now - DAY_MS) },
    })
      .select("createdAt")
      .lean<{ createdAt: Date }[]>();

    const quota = quotaFromTimes(logs.map((l) => new Date(l.createdAt).getTime()), now);
    return NextResponse.json({ success: true, unlimited: false, ...quota }, { headers: NO_STORE });
  } catch (error) {
    console.error("Generation limit status error:", error);
    return NextResponse.json({ success: false, message: "Could not load the image limit." }, { status: 500, headers: NO_STORE });
  }
}
