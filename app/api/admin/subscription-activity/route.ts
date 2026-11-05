import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const KEY = "subscription-activity";
const DEFAULT_TOTAL_BUYERS = 850;
const MIN_TOTAL_BUYERS = 100;
const MAX_TOTAL_BUYERS = 10000000;

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    await connectDB();
    const record: any = await SiteSettings.collection.findOne({ key: KEY });
    const stored = Number(record?.totalBuyers);
    return NextResponse.json(
      { success: true, totalBuyers: Number.isFinite(stored) && stored >= MIN_TOTAL_BUYERS ? Math.floor(stored) : DEFAULT_TOTAL_BUYERS },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin subscription activity read failed:", error);
    return NextResponse.json({ success: false, message: "Settings could not be loaded." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { admin, response } = await requireAdmin(request);
  if (response) return response;
  try {
    const body = await request.json().catch(() => null);
    const value = Number(body?.totalBuyers);
    if (!Number.isInteger(value) || value < MIN_TOTAL_BUYERS || value > MAX_TOTAL_BUYERS) {
      return NextResponse.json(
        { success: false, message: `Total buyers must be a whole number between ${MIN_TOTAL_BUYERS} and ${MAX_TOTAL_BUYERS.toLocaleString("en-US")}.` },
        { status: 400 },
      );
    }
    await connectDB();
    await SiteSettings.collection.updateOne(
      { key: KEY },
      { $set: { totalBuyers: value, updatedBy: admin?.email || "administrator", updatedAt: new Date() }, $setOnInsert: { key: KEY } },
      { upsert: true },
    );
    return NextResponse.json(
      { success: true, message: "Subscription activity saved successfully.", totalBuyers: value },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin subscription activity save failed:", error);
    return NextResponse.json({ success: false, message: "Changes could not be saved. Check the database connection and try again." }, { status: 500 });
  }
}
