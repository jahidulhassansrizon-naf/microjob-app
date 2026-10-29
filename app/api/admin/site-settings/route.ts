import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { DEFAULT_SITE_SETTINGS } from "@/lib/siteSettings";
import { mergeSiteSettingsWithContactLists } from "@/app/_components/contactSettings";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    await connectDB();
    const record = await SiteSettings.collection.findOne({ key: "global" });
    return NextResponse.json(
      { success: true, settings: mergeSiteSettingsWithContactLists(record?.settings ?? DEFAULT_SITE_SETTINGS) },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin site settings read failed:", error);
    return NextResponse.json({ success: false, message: "Site settings could not be loaded. Check the database connection." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { admin, response } = await requireAdmin(request);
  if (response) return response;
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || !body.settings || typeof body.settings !== "object" || Array.isArray(body.settings)) {
      return NextResponse.json({ success: false, message: "Valid site settings are required." }, { status: 400 });
    }
    const settings = mergeSiteSettingsWithContactLists(body.settings);
    await connectDB();
    // Write through the raw collection so dynamic email/phone/location arrays are not
    // discarded by a strict Mongoose schema that predates these new list fields.
    await SiteSettings.collection.updateOne(
      { key: "global" },
      { $set: { settings, updatedBy: admin?.email || "administrator", updatedAt: new Date() }, $setOnInsert: { key: "global" } },
      { upsert: true },
    );
    const record = await SiteSettings.collection.findOne({ key: "global" });
    return NextResponse.json(
      { success: true, message: "Site settings saved successfully.", settings: mergeSiteSettingsWithContactLists(record?.settings ?? settings) },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin site settings save failed:", error);
    return NextResponse.json({ success: false, message: "Changes could not be saved. Check the database connection and try again." }, { status: 500 });
  }
}
