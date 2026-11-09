import { cache } from "react";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import SiteSettingsModel from "@/models/SiteSettings";
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings, type SiteSettings } from "@/lib/siteSettings";

/**
 * Tag used to refresh the cached public site settings. The admin save route calls
 * revalidateTag(SITE_SETTINGS_TAG, "max") after writing, so admin changes show up quickly.
 */
export const SITE_SETTINGS_TAG = "site-settings";

/**
 * Cross-request cache (Next.js data cache) so a normal page view does not hit MongoDB
 * every time. Errors are thrown (not returned) so a failed read is never cached.
 */
const loadCachedSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    await connectDB();
    const record = await SiteSettingsModel.findOne({ key: "global" }).lean();
    return mergeSiteSettings(record?.settings ?? DEFAULT_SITE_SETTINGS);
  },
  ["site-settings-global"],
  { revalidate: 300, tags: [SITE_SETTINGS_TAG] },
);

/**
 * Read the singleton public site configuration from the app's existing MongoDB.
 * React cache also deduplicates this read between generateMetadata and RootLayout
 * for the same server render.
 */
export const getServerSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    return await loadCachedSettings();
  } catch (error) {
    // Fail gracefully, but never write defaults back to the database here.
    console.error("Server could not load saved site settings:", error);
    return DEFAULT_SITE_SETTINGS;
  }
});
