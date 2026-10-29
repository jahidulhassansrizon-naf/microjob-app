import { cache } from "react";
import { connectDB } from "@/lib/db";
import SiteSettingsModel from "@/models/SiteSettings";
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings, type SiteSettings } from "@/lib/siteSettings";

/**
 * Read the singleton public site configuration from the app's existing MongoDB.
 * React cache deduplicates this read between generateMetadata and RootLayout for
 * the same server render; it is not a persistent/stale cross-request cache.
 */
export const getServerSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    await connectDB();
    const record = await SiteSettingsModel.findOne({ key: "global" }).lean();
    return mergeSiteSettings(record?.settings ?? DEFAULT_SITE_SETTINGS);
  } catch (error) {
    // Fail gracefully, but never write defaults back to the database here.
    console.error("Server could not load saved site settings:", error);
    return DEFAULT_SITE_SETTINGS;
  }
});
