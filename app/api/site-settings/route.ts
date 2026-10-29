import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { DEFAULT_SITE_SETTINGS } from "@/lib/siteSettings";
import { mergeSiteSettingsWithContactLists } from "@/app/_components/contactSettings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();
    const record = await SiteSettings.collection.findOne({ key: "global" });
    return NextResponse.json(
      { success: true, settings: mergeSiteSettingsWithContactLists(record?.settings ?? DEFAULT_SITE_SETTINGS) },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Public site settings could not be loaded:", error);
    // Do not return defaults as a successful settings read: a client refresh after
    // an Admin save could otherwise overwrite the freshly saved values in memory.
    return NextResponse.json(
      { success: false, message: "Saved site settings are temporarily unavailable." },
      {
        status: 503,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  }
}
