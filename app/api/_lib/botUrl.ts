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
 * If no bot is registered (pool off, database unavailable) it falls back to the old behaviour:
 *   1) Vercel Global Config key "botUrl"  2) the GEMINI_RENDER_URL environment variable.
 */

const POOL_COLLECTION = "botnodes";
const BOT_ALIVE_MS = 90_000; // a bot must refresh at least this often
const POOL_CACHE_MS = 8_000; // how long one database read is reused

type PoolNode = { slot: number; url: string };
type PoolState = { at: number; nodes: PoolNode[]; next: number };

// globalThis: every route of the website shares one copy of this state.
const globalState = globalThis as unknown as { __botPoolState?: PoolState };
const state: PoolState =
  globalState.__botPoolState ?? (globalState.__botPoolState = { at: 0, nodes: [], next: 0 });

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
