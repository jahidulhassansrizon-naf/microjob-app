import { get } from "@vercel/global-config";

/**
 * Public URL of the Gemini bot (playwright-service).
 *
 * The GitHub Actions bot writes its newest tunnel address into the Vercel Global
 * Config store under the key "botUrl" every time it starts. Reading it here on each
 * request means the site always uses the live address with no redeploy.
 *
 * If the store is unavailable (local dev, not connected, empty) this falls back to
 * the old GEMINI_RENDER_URL environment variable.
 */
export async function getBotUrl(): Promise<string> {
  let url = "";
  try {
    const value = await get<string>("botUrl");
    if (typeof value === "string") url = value.trim();
  } catch (error) {
    console.error("[botUrl] Could not read botUrl from Global Config:", error);
  }
  if (!url) url = (process.env.GEMINI_RENDER_URL || "").trim();
  return url.replace(/\/+$/, "");
}
