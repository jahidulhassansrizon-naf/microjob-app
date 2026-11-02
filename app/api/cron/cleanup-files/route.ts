import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { connectDB } from "@/lib/db";
import { runFileRetentionCleanup } from "@/app/_lib/fileRetention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily cleanup: permanently deletes user photos/files older than 30 days from
 * Cloudinary and MongoDB. Scheduled in vercel.json.
 *
 * Auth: Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>`
 * when the CRON_SECRET environment variable is set. Requests without the
 * correct secret are rejected.
 */
function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return { ok: false as const, status: 503, error: "CRON_SECRET is not configured." };

  const header = request.headers.get("authorization") || "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  const match = expected.length === received.length && timingSafeEqual(expected, received);
  return match ? { ok: true as const } : { ok: false as const, status: 401, error: "Unauthorized." };
}

export async function GET(request: Request) {
  const auth = isAuthorized(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    await connectDB();
    const report = await runFileRetentionCleanup({ maxMs: 50_000 });
    console.info("[cron/cleanup-files]", JSON.stringify(report));
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("[cron/cleanup-files] failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Cleanup failed." },
      { status: 500 },
    );
  }
}
