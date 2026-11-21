import { get } from "@vercel/global-config";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

/**
 * Address of the Gemini / Duck.ai bot (playwright-service).
 *
 * BOT POOL: many bots run at the same time on GitHub Actions. Each bot registers its own public
 * address in the MongoDB collection "botnodes" (through /api/bot-alert) and refreshes it every
 * ~30 seconds. On every call this function takes the next live bot in turn (round-robin), so the
 * work is shared evenly. A bot that stops refreshing disappears after BOT_ALIVE_MS.
 *
 * SAME BOT FOR ONE VISITOR: when a visitor chooses a photo, the website tells ONE bot to get a page ready
 * (/api/image-warm). assignBot() picks the least busy bot for that visitor and remembers the choice for a few
 * minutes; takeBot() then sends the visitor's picture to the SAME bot, so the page that was prepared is used.
 * Visitors are spread evenly: every new visitor goes to the bot with the fewest waiting + running pictures.
 *
 * If no bot is registered (pool off, database unavailable) it falls back to the old behaviour:
 *   1) Vercel Global Config key "botUrl"  2) the GEMINI_RENDER_URL environment variable.
 */

const POOL_COLLECTION = "botnodes";
const BOT_ALIVE_MS = 90_000; // a bot must refresh at least this often
const POOL_CACHE_MS = 8_000; // how long one database read is reused

const BOT_MAX_CONCURRENT = 3; // same as MAX_CONCURRENT_GENERATIONS on the bots
const ASSIGN_TTL_MS = 6 * 60_000; // a bit longer than the bot keeps a ready page (5 minutes)

type PoolNode = { slot: number; url: string };
type Assignment = { url: string; until: number };
type PoolState = {
  at: number;
  nodes: PoolNode[];
  next: number;
  assign: Map<string, Assignment>; // visitor -> the bot that prepared a page for them
  inflight: Map<string, number>; // bot -> pictures running right now
};

// globalThis: every route of the website shares one copy of this state.
const globalState = globalThis as unknown as { __botPoolState?: PoolState };
const state: PoolState =
  globalState.__botPoolState ??
  (globalState.__botPoolState = { at: 0, nodes: [], next: 0, assign: new Map(), inflight: new Map() });
if (!state.assign) state.assign = new Map();
if (!state.inflight) state.inflight = new Map();

async function loadPool(): Promise<PoolNode[]> {
  if (Date.now() - state.at < POOL_CACHE_MS) return state.nodes;

  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (db) {
      const since = new Date(Date.now() - BOT_ALIVE_MS);
      const docs = await db
        .collection(POOL_COLLECTION)
        .find({ lastSeen: { $gte: since } })
        .toArray();

      state.nodes = docs
        .map((doc: Record<string, unknown>) => ({
          slot: Number(doc.slot) || 0,
          url: typeof doc.url === "string" ? doc.url.trim().replace(/\/+$/, "") : "",
        }))
        .filter((node: PoolNode) => /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(node.url))
        .sort((a: PoolNode, b: PoolNode) => a.slot - b.slot || (a.url < b.url ? -1 : 1));
    }
  } catch (error) {
    // Keep the last known list; the bots refresh again in a few seconds.
    console.error("[botUrl] Could not read the bot pool:", error);
  }

  state.at = Date.now();
  return state.nodes;
}

export async function getBotUrl(): Promise<string> {
  const pool = await loadPool();
  if (pool.length > 0) {
    const node = pool[state.next % pool.length];
    state.next = (state.next + 1) % 1_000_000;
    return node.url;
  }

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

// ------------------------------------------------------------------
// Same bot for one visitor, evenly spread
// ------------------------------------------------------------------

function pruneAssignments(now: number) {
  for (const [key, entry] of state.assign) {
    if (entry.until <= now) state.assign.delete(key);
  }
}

// The bot with the fewest (waiting + running) pictures. Ties are broken in turn.
function pickLeastLoaded(pool: PoolNode[], now: number, onlyBelowCap: boolean): PoolNode | null {
  const waiting = new Map<string, number>();
  for (const entry of state.assign.values()) {
    if (entry.until > now) waiting.set(entry.url, (waiting.get(entry.url) || 0) + 1);
  }

  let best: PoolNode | null = null;
  let bestLoad = Infinity;
  const start = state.next % pool.length;

  for (let i = 0; i < pool.length; i++) {
    const node = pool[(start + i) % pool.length];
    const running = state.inflight.get(node.url) || 0;
    if (onlyBelowCap && running >= BOT_MAX_CONCURRENT) continue;
    const load = running + (waiting.get(node.url) || 0);
    if (load < bestLoad) {
      best = node;
      bestLoad = load;
    }
  }

  state.next = (state.next + 1) % 1_000_000;
  return best;
}

/** A visitor chose a photo: pick (or keep) the bot that prepares a page for them. */
export async function assignBot(userKey: string): Promise<string> {
  const pool = await loadPool();
  if (pool.length === 0 || !userKey) return getBotUrl();

  const now = Date.now();
  pruneAssignments(now);

  const existing = state.assign.get(userKey);
  if (existing && pool.some((node) => node.url === existing.url)) {
    existing.until = now + ASSIGN_TTL_MS;
    return existing.url;
  }
  state.assign.delete(userKey);

  const node = pickLeastLoaded(pool, now, false);
  if (!node) return getBotUrl();

  state.assign.set(userKey, { url: node.url, until: now + ASSIGN_TTL_MS });
  return node.url;
}

/** The bot already chosen for this visitor, or "" (nothing is assigned or created). */
export async function peekBot(userKey: string): Promise<string> {
  const pool = await loadPool();
  const existing = state.assign.get(userKey);
  if (!existing || existing.until <= Date.now()) return "";
  return pool.some((node) => node.url === existing.url) ? existing.url : "";
}

/**
 * The visitor pressed Generate: use the bot that prepared a page for them (if it still has room),
 * otherwise the least busy bot. Call release() when the picture is finished or cancelled.
 */
export async function takeBot(userKey?: string): Promise<{ url: string; release: () => void }> {
  const pool = await loadPool();
  if (pool.length === 0) return { url: await getBotUrl(), release: () => {} };

  const now = Date.now();
  pruneAssignments(now);

  let url = "";
  if (userKey) {
    const existing = state.assign.get(userKey);
    state.assign.delete(userKey); // this visitor's prepared page is used now
    if (
      existing &&
      existing.until > now &&
      pool.some((node) => node.url === existing.url) &&
      (state.inflight.get(existing.url) || 0) < BOT_MAX_CONCURRENT
    ) {
      url = existing.url;
    }
  }

  if (!url) {
    const node = pickLeastLoaded(pool, now, true) || pickLeastLoaded(pool, now, false);
    url = node ? node.url : await getBotUrl();
  }

  const chosen = url;
  state.inflight.set(chosen, (state.inflight.get(chosen) || 0) + 1);

  let released = false;
  return {
    url: chosen,
    release: () => {
      if (released) return;
      released = true;
      const left = (state.inflight.get(chosen) || 1) - 1;
      if (left <= 0) state.inflight.delete(chosen);
      else state.inflight.set(chosen, left);
    },
  };
}
