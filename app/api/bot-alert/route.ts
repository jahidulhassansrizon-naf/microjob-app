import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendTransactionalEmail } from "@/app/api/_lib/emailDelivery";

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

export async function POST(req: Request) {
  const expectedKey = process.env.BOT_ALERT_KEY?.trim() || "";
  const toEmail = process.env.BOT_ALERT_EMAIL?.trim() || "";

  if (!expectedKey || !toEmail) {
    return new NextResponse(null, { status: 404 });
  }

  const receivedKey = req.headers.get("x-bot-alert-key") || "";
  if (!receivedKey || !sameSecret(receivedKey, expectedKey)) {
    return new NextResponse(null, { status: 404 });
  }

  const raw = (await req.text()).slice(0, MAX_BODY_CHARS);
  let text = "";

  try {
    const parsed = JSON.parse(raw) as { text?: unknown };
    text = typeof parsed.text === "string" ? parsed.text.trim() : "";
  } catch {
    // not JSON
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
