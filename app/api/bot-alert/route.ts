import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendTransactionalEmail } from "@/app/api/_lib/emailDelivery";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

// The image bot (GitHub Actions) calls this route to tell the owner what is going on.
//   Vercel env:  BOT_ALERT_KEY    = a long random secret (the bot sends the same value)
//                BOT_ALERT_EMAIL  = the owner's email address that receives the alerts
// Without BOT_ALERT_KEY the route answers 404, so nobody can use it by accident.

const MAX_BODY_CHARS = 4_000;
const MAX_TEXT_CHARS = 1_500;
const MAX_PER_HOUR = 40;

// Per server instance only (a simple brake against a runaway bot or a leaked key).
const sentAt: number[] = [];

function sameSecret(received: string, expected: string): boolean {
  const a = crypto.createHash("sha256").update(received).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---- Bot pool: every running bot registers its own public address here (key-protected). ----
// The website reads the list from MongoDB (see app/api/_lib/botUrl.ts) and shares the work between the bots.
const POOL_COLLECTION = "botnodes";
const POOL_URL_REGEX = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/;
let poolIndexesReady = false;

async function handlePool(pool: unknown): Promise<NextResponse> {
  const data = (pool && typeof pool === "object" ? pool : {}) as Record<string, unknown>;
  const action = typeof data.action === "string" ? data.action : "";
  const url = typeof data.url === "string" ? data.url.trim().replace(/\/+$/, "") : "";
  const slot = Math.max(0, Math.min(999, Math.floor(Number(data.slot) || 0)));

  if ((action !== "register" && action !== "unregister") || !POOL_URL_REGEX.test(url)) {
    return NextResponse.json({ success: false, error: "Bad request." }, { status: 400 });
  }

  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ success: false, error: "Database not ready." }, { status: 503 });
    }
    const collection = db.collection(POOL_COLLECTION);

    if (!poolIndexesReady) {
      poolIndexesReady = true;
      await collection.createIndex({ url: 1 }, { unique: true }).catch(() => undefined);
      // Old entries disappear on their own after a day.
      await collection.createIndex({ lastSeen: 1 }, { expireAfterSeconds: 86_400 }).catch(() => undefined);
    }

    if (action === "unregister") {
      await collection.deleteOne({ url });
    } else {
      await collection.updateOne({ url }, { $set: { slot, lastSeen: new Date() } }, { upsert: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bot pool update failed:", error instanceof Error ? error.message.slice(0, 200) : "unknown error");
    return NextResponse.json({ success: false, error: "Pool update failed." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const expectedKey = process.env.BOT_ALERT_KEY?.trim() || "";
  const toEmail = process.env.BOT_ALERT_EMAIL?.trim() || "";

  if (!expectedKey) {
    return new NextResponse(null, { status: 404 });
  }

  const receivedKey = req.headers.get("x-bot-alert-key") || "";
  if (!receivedKey || !sameSecret(receivedKey, expectedKey)) {
    return new NextResponse(null, { status: 404 });
  }

  const raw = (await req.text()).slice(0, MAX_BODY_CHARS);
  let text = "";
  let poolRequest: unknown = null;

  try {
    const parsed = JSON.parse(raw) as { text?: unknown; pool?: unknown };
    text = typeof parsed.text === "string" ? parsed.text.trim() : "";
    poolRequest = parsed.pool ?? null;
  } catch {
    // not JSON
  }

  // Bot pool registration needs only the key. The e-mail alert still needs the owner's address.
  if (poolRequest) return handlePool(poolRequest);

  if (!toEmail) {
    return new NextResponse(null, { status: 404 });
  }

  if (!text) {
    return NextResponse.json({ success: false, error: "No text." }, { status: 400 });
  }

  text = text.slice(0, MAX_TEXT_CHARS);

  const cutoff = Date.now() - 60 * 60 * 1000;
  while (sentAt.length && sentAt[0] < cutoff) sentAt.shift();
  if (sentAt.length >= MAX_PER_HOUR) {
    return NextResponse.json({ success: false, error: "Too many alerts." }, { status: 429 });
  }
  sentAt.push(Date.now());

  const firstLine = text.split("\n")[0].replace(/\s+/g, " ").slice(0, 120);
  const subject = `[Bot] ${firstLine}`;

  try {
    await sendTransactionalEmail({
      to: toEmail,
      subject,
      text,
      html: `<div style="font-family:system-ui,Arial,sans-serif;font-size:15px;line-height:1.6;white-space:pre-wrap">${escapeHtml(
        text,
      )}</div>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Bot alert email failed:",
      error instanceof Error ? error.message.slice(0, 200) : "unknown error",
    );
    return NextResponse.json({ success: false, error: "Email failed." }, { status: 502 });
  }
}
