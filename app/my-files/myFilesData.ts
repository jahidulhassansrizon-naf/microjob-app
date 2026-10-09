/**
 * Client-side, in-memory data cache for My Files.
 * This is deliberately not persisted to localStorage: file lists are private
 * user data and should not survive a full page/session change.
 */
export interface MyFilesClientItem {
  id?: string;
  name?: string;
  category?: string;
  url?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface MyFilesClientData {
  files: MyFilesClientItem[];
  toolFiles: MyFilesClientItem[];
}

interface CacheEntry {
  identity: string;
  data: MyFilesClientData;
  fetchedAt: number;
  epoch: number;
}

interface PendingEntry {
  identity: string;
  epoch: number;
  promise: Promise<MyFilesClientData>;
}

const PREFETCH_REFRESH_AFTER_MS = 8_000;
const IMAGE_PRELOAD_LIMIT = 12;
const IMAGE_CATEGORIES = new Set([
  "ai-photo-edit",
  "manually-edited",
  "ai-template-generated",
  "bulk-photo-edit",
]);

let cacheEntry: CacheEntry | null = null;
let pendingEntry: PendingEntry | null = null;
let cacheEpoch = 0;

function getAuthIdentity(): string {
  if (typeof window === "undefined") return "server";
  try {
    // Token-scoped cache prevents a second account in the same tab from
    // seeing another account's cached files when token auth is used.
    const token = window.localStorage.getItem("token");
    if (token) return `token:${token}`;
  } catch {
    // Continue with cookie-based identity when local storage is unavailable.
  }
  try {
    // If authentication is cookie-only, use the locally cached account identity
    // as an additional namespace. The data itself remains memory-only.
    const rawUser = window.localStorage.getItem("user");
    if (rawUser) {
      const user = JSON.parse(rawUser) as Record<string, unknown>;
      const accountId = user.id ?? user._id ?? user.userId ?? user.email ?? user.phoneNumber;
      if (typeof accountId === "string" && accountId.trim()) {
        return `user:${accountId.trim().toLowerCase()}`;
      }
    }
  } catch {
    // Cache invalidation on logout remains the fallback.
  }
  return "cookie-session";
}

/**
 * Requests a small Cloudinary delivery thumbnail for grid previews. Full-size
 * originals remain untouched for the preview modal and downloads.
 */
export function getMyFilesThumbnailUrl(url: string): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname !== "res.cloudinary.com" ||
      !parsed.pathname.includes("/image/upload/")
    ) {
      return url;
    }

    const marker = "/image/upload/";
    const index = parsed.pathname.indexOf(marker);
    const afterUpload = parsed.pathname.slice(index + marker.length);
    const firstSegment = afterUpload.split("/")[0] ?? "";

    // Avoid stacking transformations if the source URL already has a
    // Cloudinary transformation segment. Standard versioned/untransformed
    // upload URLs get an optimized, bounded thumbnail rendition.
    const looksLikeExistingTransformation =
      firstSegment.includes(",") || /^(?:w|h|c|q|f|g|e|ar|dpr|r|bo|b|fl)_/.test(firstSegment);
    if (looksLikeExistingTransformation) return url;

    parsed.pathname = parsed.pathname.replace(
      marker,
      `${marker}f_auto,q_auto,w_480,h_360,c_limit/`,
    );
    return parsed.toString();
  } catch {
    return url;
  }
}

function warmImageThumbnails(data: MyFilesClientData): void {
  if (typeof window === "undefined") return;
  const urls = data.files
    .filter((item) => {
      const category = String(item.category ?? "");
      return Boolean(item.url) && IMAGE_CATEGORIES.has(category);
    })
    .slice(0, IMAGE_PRELOAD_LIMIT)
    .map((item) => getMyFilesThumbnailUrl(String(item.url ?? "")))
    .filter(Boolean);

  for (const url of urls) {
    const image = new window.Image();
    image.decoding = "async";
    image.fetchPriority = "low";
    image.src = url;
  }
}

export function getCachedMyFilesData(): MyFilesClientData | null {
  const identity = getAuthIdentity();
  if (!cacheEntry || cacheEntry.identity !== identity || cacheEntry.epoch !== cacheEpoch) {
    return null;
  }
  return cacheEntry.data;
}

export function clearMyFilesDataCache(): void {
  cacheEpoch += 1;
  cacheEntry = null;
  pendingEntry = null;
}

export function removeCachedMyFilesItem(id: string): void {
  const identity = getAuthIdentity();
  if (!cacheEntry || cacheEntry.identity !== identity || cacheEntry.epoch !== cacheEpoch) return;
  cacheEntry = {
    ...cacheEntry,
    fetchedAt: Date.now(),
    data: {
      ...cacheEntry.data,
      files: cacheEntry.data.files.filter((item) => item.id !== id),
      toolFiles: cacheEntry.data.toolFiles.filter((item) => item.id !== id),
    },
  };
}

export async function refreshMyFilesData(force = false): Promise<MyFilesClientData> {
  if (typeof window === "undefined") {
    throw new Error("My Files data can only be loaded in the browser.");
  }

  const identity = getAuthIdentity();
  const epoch = cacheEpoch;
  if (pendingEntry && pendingEntry.identity === identity && pendingEntry.epoch === epoch) {
    return pendingEntry.promise;
  }
  const currentCache =
    cacheEntry && cacheEntry.identity === identity && cacheEntry.epoch === epoch
      ? cacheEntry
      : null;
  if (!force && currentCache && Date.now() - currentCache.fetchedAt < 2_000) {
    return currentCache.data;
  }

  const promise = (async () => {
    const response = await fetch("/api/my-files", {
      credentials: "include",
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      if (response.status === 401 || response.status === 403) clearMyFilesDataCache();
      throw new Error(
        typeof result?.error === "string" ? result.error : "Failed to load saved files.",
      );
    }

    const data = result.data ?? {};
    const normalized: MyFilesClientData = {
      files: Array.isArray(data.files) ? data.files : [],
      toolFiles: Array.isArray(data.toolFiles) ? data.toolFiles : [],
    };

    // A logout/account switch may happen while the request is in flight.
    // Do not repopulate the private cache after it has been cleared.
    if (epoch === cacheEpoch && identity === getAuthIdentity()) {
      cacheEntry = { identity, data: normalized, fetchedAt: Date.now(), epoch };
      warmImageThumbnails(normalized);
    }
    return normalized;
  })();

  const pending: PendingEntry = { identity, epoch, promise };
  pendingEntry = pending;
  try {
    return await promise;
  } finally {
    if (pendingEntry === pending) pendingEntry = null;
  }
}

/**
 * Start fetching My Files before navigation. A short throttle avoids a DB/API
 * request for every tiny pointer movement while keeping recently saved files
 * fresh when the user is about to open the page.
 */
export function prefetchMyFilesData(force = false): void {
  if (typeof window === "undefined") return;
  const identity = getAuthIdentity();
  const usableCache =
    cacheEntry && cacheEntry.identity === identity && cacheEntry.epoch === cacheEpoch
      ? cacheEntry
      : null;

  if (usableCache) warmImageThumbnails(usableCache.data);
  if (force || !usableCache || Date.now() - usableCache.fetchedAt >= PREFETCH_REFRESH_AFTER_MS) {
    void refreshMyFilesData(true).catch(() => undefined);
  }
}
