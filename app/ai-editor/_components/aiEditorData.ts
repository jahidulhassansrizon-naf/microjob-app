/**
 * Client-side, in-memory cache for the AI Editor "Recent generations" list.
 * Works like the My Files cache: the navbar starts the request the moment the
 * user points at / clicks "AI Editor", so by the time the page opens the images
 * are already there. Memory only (never localStorage): private user data.
 */
export interface AiEditorGeneration {
  id?: string | number;
  url: string;
  [key: string]: unknown;
}

export class AiEditorFetchError extends Error {
  status: number;
  serverMessage: string;
  constructor(status: number, serverMessage: string) {
    super(serverMessage || "Failed to load recent generations.");
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

interface CacheEntry {
  identity: string;
  list: AiEditorGeneration[];
  fetchedAt: number;
  epoch: number;
}
interface PendingEntry {
  identity: string;
  epoch: number;
  promise: Promise<AiEditorGeneration[]>;
}

const PREFETCH_REFRESH_AFTER_MS = 8_000;
const IMAGE_PRELOAD_LIMIT = 12;

let cacheEntry: CacheEntry | null = null;
let pendingEntry: PendingEntry | null = null;
let cacheEpoch = 0;

function getToken(): string | null {
  try {
    return window.localStorage.getItem("token");
  } catch {
    return null;
  }
}

function getAuthIdentity(): string {
  if (typeof window === "undefined") return "server";
  const token = getToken();
  if (token) return `token:${token}`;
  try {
    const rawUser = window.localStorage.getItem("user");
    if (rawUser) {
      const user = JSON.parse(rawUser) as Record<string, unknown>;
      const accountId = user.id ?? user._id ?? user.userId ?? user.email ?? user.phoneNumber;
      if (typeof accountId === "string" && accountId.trim()) {
        return `user:${accountId.trim().toLowerCase()}`;
      }
    }
  } catch {
    // fall through
  }
  return "cookie-session";
}

/** Small Cloudinary rendition for the recent-images strip. Originals stay untouched for preview/download. */
export function getAiEditorThumbnailUrl(url: string): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com" || !parsed.pathname.includes("/image/upload/")) return url;
    const marker = "/image/upload/";
    const index = parsed.pathname.indexOf(marker);
    const firstSegment = parsed.pathname.slice(index + marker.length).split("/")[0] ?? "";
    const looksTransformed =
      firstSegment.includes(",") || /^(?:w|h|c|q|f|g|e|ar|dpr|r|bo|b|fl)_/.test(firstSegment);
    if (looksTransformed) return url;
    parsed.pathname = parsed.pathname.replace(marker, `${marker}f_auto,q_auto,w_480,c_limit/`);
    return parsed.toString();
  } catch {
    return url;
  }
}

function warmImages(list: AiEditorGeneration[]): void {
  if (typeof window === "undefined") return;
  for (const item of list.slice(0, IMAGE_PRELOAD_LIMIT)) {
    if (!item?.url) continue;
    const image = new window.Image();
    image.decoding = "async";
    image.src = getAiEditorThumbnailUrl(String(item.url));
  }
}

export function getCachedAiEditorGenerations(): AiEditorGeneration[] | null {
  if (typeof window === "undefined") return null;
  const identity = getAuthIdentity();
  if (!cacheEntry || cacheEntry.identity !== identity || cacheEntry.epoch !== cacheEpoch) return null;
  return cacheEntry.list;
}

/** Keep the cache in step with what the page shows (after generate / delete / edit). */
export function setCachedAiEditorGenerations(list: AiEditorGeneration[]): void {
  if (typeof window === "undefined") return;
  cacheEntry = { identity: getAuthIdentity(), list, fetchedAt: Date.now(), epoch: cacheEpoch };
}

export function clearAiEditorGenerationsCache(): void {
  cacheEpoch += 1;
  cacheEntry = null;
  pendingEntry = null;
}

export async function refreshAiEditorGenerations(): Promise<AiEditorGeneration[]> {
  if (typeof window === "undefined") throw new Error("Browser only.");
  const identity = getAuthIdentity();
  const epoch = cacheEpoch;
  if (pendingEntry && pendingEntry.identity === identity && pendingEntry.epoch === epoch) {
    return pendingEntry.promise;
  }

  const promise = (async () => {
    const token = getToken();
    const response = await fetch("/api/ai-generations?source=ai-editor", {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      if (response.status === 401 || response.status === 402 || response.status === 403) {
        clearAiEditorGenerationsCache();
      }
      throw new AiEditorFetchError(response.status, String(result?.error || result?.message || ""));
    }
    const list: AiEditorGeneration[] = Array.isArray(result.data) ? result.data : [];
    if (epoch === cacheEpoch && identity === getAuthIdentity()) {
      cacheEntry = { identity, list, fetchedAt: Date.now(), epoch };
      warmImages(list);
    }
    return list;
  })();

  const pending: PendingEntry = { identity, epoch, promise };
  pendingEntry = pending;
  try {
    return await promise;
  } finally {
    if (pendingEntry === pending) pendingEntry = null;
  }
}

/** Start loading before navigation (navbar hover / press / click). */
export function prefetchAiEditorGenerations(force = false): void {
  if (typeof window === "undefined") return;
  const identity = getAuthIdentity();
  const usable =
    cacheEntry && cacheEntry.identity === identity && cacheEntry.epoch === cacheEpoch ? cacheEntry : null;
  if (usable) warmImages(usable.list);
  if (force || !usable || Date.now() - usable.fetchedAt >= PREFETCH_REFRESH_AFTER_MS) {
    void refreshAiEditorGenerations().catch(() => undefined);
  }
}
