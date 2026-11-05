import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_TOTAL_BUYERS = 850;

export async function GET() {
  try {
    await connectDB();
    const record: any = await SiteSettings.collection.findOne({ key: "subscription-activity" });
    const stored = Number(record?.totalBuyers);
    return NextResponse.json(
      { success: true, totalBuyers: Number.isFinite(stored) && stored >= 100 ? Math.floor(stored) : DEFAULT_TOTAL_BUYERS },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Subscription activity settings error:", error);
    return NextResponse.json({ success: true, totalBuyers: DEFAULT_TOTAL_BUYERS }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
