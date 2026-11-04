/**
 * Tiny in-memory TTL cache with in-flight de-duplication.
 *
 * Used for AI-generated, rarely-changing lists (subjects per class, chapters per
 * subject). It saves Gemini quota and makes the question picker load instantly
 * after the first request. Only successful results are cached; failures are
 * never stored, so a temporary Gemini error cannot get "stuck".
 *
 * Note: this lives per server instance (per serverless container on Vercel),
 * which is fine for this purpose - a cold instance simply fetches again.
 */

type Entry = { value: unknown; expiresAt: number };

const MAX_ENTRIES = 500;
const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

export async function cachedAsync<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }
  if (hit) store.delete(key);

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = (async () => {
    try {
      const value = await loader();
      if (store.size >= MAX_ENTRIES) {
        // Drop the oldest entry (Map keeps insertion order).
        const oldest = store.keys().next().value;
        if (oldest !== undefined) store.delete(oldest);
      }
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise as Promise<T>;
}
