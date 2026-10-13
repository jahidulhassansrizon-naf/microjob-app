import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getVerifiedRequestSession } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_ID_PATTERN = /^[a-zA-Z0-9._:-]{16,120}$/;

export async function POST(request: Request) {
  const session = getVerifiedRequestSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Please sign in to connect to live presence." },
      { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { success: false, message: "Live presence is not configured." },
      { status: 503 },
    );
  }

  let body: { sessionId?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // An invalid body is rejected below.
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  if (!SESSION_ID_PATTERN.test(sessionId)) {
    return NextResponse.json(
      { success: false, message: "A valid browser session ID is required." },
      { status: 400 },
    );
  }

  const ticket = jwt.sign(
    {
      purpose: "sohojhub-presence",
      role: session.role,
      userId: session.userId,
      sessionId,
    },
    secret,
    { expiresIn: "45s", issuer: "sohojhub", audience: "presence-ws" },
  );

  return NextResponse.json(
    {
      success: true,
      ticket,
      role: session.role,
      // WebSocket events need a shared pub/sub store across Vercel instances.
      broadcastAvailable: Boolean(process.env.REDIS_URL?.trim()),
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
