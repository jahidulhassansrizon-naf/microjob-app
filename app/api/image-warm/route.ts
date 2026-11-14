import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from "crypto";
import { getJwtSecret } from "@/lib/jwtSecurity";
import {
  hasActiveSubscription as hasActiveToolAccess,
  requireToolAccess,
} from "@/app/api/_lib/requireActiveSubscription";
import { getBotUrl } from "@/app/api/_lib/botUrl";

export const runtime = "nodejs";
export const maxDuration = 10;

// Same secrets as /api/image-generate (GEMINI_RENDER_KEY = ASK_KEY on the bot).
const RENDER_KEY = process.env.GEMINI_RENDER_KEY || "";
const JWT_SECRET = getJwtSecret();

// Soft per-visitor throttle on this server instance. The bot has its own hard
// limits (one page per visitor, a total page cap), so this only saves calls.
const lastPing = new Map<string, { at: number; strong: boolean }>();
const MIN_GAP_MS = 20_000;

function getToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Tells the image bot that a logged-in visitor with an active subscription is on
// the AI editor page, so it can get one Gemini page ready for them.
// Never fails loudly: the page works the same without this call.
export async function POST(req: Request) {
  const access = await requireToolAccess(req);
  if (!access.ok) return access.response;

  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let userId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as {
      userId?: string;
    };
    if (!decoded?.userId || !mongoose.isValidObjectId(decoded.userId)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    userId = decoded.userId;
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!(await hasActiveToolAccess(userId))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let strong = false;
  try {
    const body = await req.json();
    strong = Boolean(body && body.strong);
  } catch {
    // no body = a plain "visitor is here" hint
  }

  const now = Date.now();
  const previous = lastPing.get(userId);
  if (previous && now - previous.at < MIN_GAP_MS && (previous.strong || !strong)) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  lastPing.set(userId, { at: now, strong });
  if (lastPing.size > 5000) {
    for (const [key, value] of lastPing) {
      if (now - value.at > 10 * 60_000) lastPing.delete(key);
    }
  }

  try {
    const botUrl = await getBotUrl();
    if (!botUrl) return NextResponse.json({ ok: true, skipped: true });

    // The bot gets an anonymous key, never the real account id.
    const key = crypto
      .createHash("sha256")
      .update(`${userId}:${JWT_SECRET}`)
      .digest("hex")
      .slice(0, 24);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (RENDER_KEY) headers["x-api-key"] = RENDER_KEY;

    await fetch(`${botUrl}/warm-hint`, {
      method: "POST",
      headers,
      body: JSON.stringify({ key, strong }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // The bot may be restarting. Ignore: image generation still works without a hint.
  }

  return NextResponse.json({ ok: true });
}
