import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { getAdminCredentials } from "@/lib/adminCredentials";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";
import { friendlySmtpError, getSmtpSettingsRuntime, openSmtpSender, type OutgoingMail } from "@/app/api/_lib/smtpMailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BATCH_MAX = 20;
type Audience = "all" | "subscribed" | "not_subscribed";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function firstName(fullName: unknown) {
  const name = String(fullName || "").trim();
  return name ? name.split(/\s+/)[0] : "";
}

function applyPlaceholders(template: string, name: string) {
  return template.replace(/\{\{\s*name\s*\}\}/gi, name || "there");
}

function safeUrl(value: unknown): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function buildMail(input: { to: string; name: string; subject: string; message: string; ctaText: string; ctaUrl: string }): OutgoingMail {
  const subject = applyPlaceholders(input.subject, input.name).slice(0, 180);
  const message = applyPlaceholders(input.message, input.name);
  const body = escapeHtml(message).replace(/\r?\n/g, "<br>");
  const cta =
    input.ctaUrl && input.ctaText
      ? `<p style="margin:24px 0 0"><a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;background:#DC2626;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">${escapeHtml(input.ctaText)}</a></p>`
      : "";
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#EFE5CE;font-family:Arial,Helvetica,sans-serif;color:#3B2F1E">
<div style="max-width:560px;margin:0 auto;background:#FBF6E8;border:1px solid #E3D6B8;border-radius:16px;overflow:hidden">
<div style="background:#3B2F1E;color:#F5E9C8;padding:18px 24px;font-size:18px;font-weight:800">SebaLagbe.com</div>
<div style="padding:24px;font-size:15px;line-height:1.7">${body}${cta}</div>
<div style="padding:14px 24px;border-top:1px solid #E3D6B8;font-size:12px;color:#7A6A4F">You are receiving this email because you have an account on SebaLagbe.com.</div>
</div></body></html>`;
  const text = `${message}${input.ctaUrl && input.ctaText ? `\n\n${input.ctaText}: ${input.ctaUrl}` : ""}\n\n-- SebaLagbe.com`;
  return { to: input.to, subject, html, text };
}

async function audienceFilter(audience: Audience) {
  const filter: Record<string, any> = { email: { $exists: true, $nin: [null, ""] }, isBanned: { $ne: true } };
  const mainAdminEmail = getAdminCredentials().email;
  if (mainAdminEmail) filter.email = { ...filter.email, $ne: mainAdminEmail };
  if (audience !== "all") {
    const activeIds = await Subscription.distinct("userId", {
      paymentStatus: "COMPLETED",
      accessStatus: "ACTIVE",
      expiresAt: { $gt: new Date() },
    });
    filter._id = audience === "subscribed" ? { $in: activeIds } : { $nin: activeIds };
  }
  return filter;
}

function parseAudience(value: unknown): Audience {
  return value === "subscribed" || value === "not_subscribed" ? value : "all";
}

/** Recipient counts for the three audiences. */
export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    await connectDB();
    const [all, subscribed, notSubscribed] = await Promise.all(
      (["all", "subscribed", "not_subscribed"] as Audience[]).map(async (audience) =>
        User.countDocuments(await audienceFilter(audience)),
      ),
    );
    const smtp = await getSmtpSettingsRuntime({ fresh: true });
    return NextResponse.json({ success: true, counts: { all, subscribed, not_subscribed: notSubscribed }, smtpReady: Boolean(smtp?.enabled) }, { headers: NO_STORE });
  } catch (error) {
    console.error("Mail campaign counts failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, message: "Could not load recipient counts." }, { status: 500, headers: NO_STORE });
  }
}

/**
 * action "preview": send the mail to one address (the admin) to check how it looks.
 * action "send": send ONE batch of an audience (offset/limit). The browser calls it repeatedly
 *                until done, so a big list never hits a server time limit.
 */
export async function POST(request: Request) {
  const { admin, response } = await requireAdmin(request);
  if (response) return response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400, headers: NO_STORE });
  }

  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  const ctaText = String(body.ctaText || "").trim().slice(0, 60);
  const ctaUrl = safeUrl(body.ctaUrl);
  if (!subject || subject.length > 180 || /[\r\n]/.test(subject)) {
    return NextResponse.json({ success: false, message: "Enter a subject (max 180 characters)." }, { status: 400, headers: NO_STORE });
  }
  if (!message || message.length > 8000) {
    return NextResponse.json({ success: false, message: "Enter the message (max 8000 characters)." }, { status: 400, headers: NO_STORE });
  }
  if ((ctaText && !ctaUrl) || (!ctaText && body.ctaUrl && !ctaUrl)) {
    return NextResponse.json({ success: false, message: "The button needs both a text and a valid http(s) link." }, { status: 400, headers: NO_STORE });
  }

  let sender: Awaited<ReturnType<typeof openSmtpSender>> | null = null;
  try {
    const smtp = await getSmtpSettingsRuntime({ fresh: true });
    if (!smtp || !smtp.enabled) {
      return NextResponse.json({ success: false, message: "Turn on and save SMTP first (Email & SMTP settings above)." }, { status: 400, headers: NO_STORE });
    }
    sender = await openSmtpSender(smtp);

    if (body.action === "preview") {
      const to = String(body.to || admin?.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(to)) {
        return NextResponse.json({ success: false, message: "Enter a valid email address for the preview." }, { status: 400, headers: NO_STORE });
      }
      await sender.send(buildMail({ to, name: firstName(admin?.fullName), subject, message, ctaText, ctaUrl }));
      return NextResponse.json({ success: true, message: `Preview sent to ${to}.` }, { headers: NO_STORE });
    }

    if (body.action !== "send") {
      return NextResponse.json({ success: false, message: "Unknown action." }, { status: 400, headers: NO_STORE });
    }

    await connectDB();
    const audience = parseAudience(body.audience);
    const offset = Math.max(0, Number.parseInt(String(body.offset ?? 0), 10) || 0);
    const limit = Math.min(BATCH_MAX, Math.max(1, Number.parseInt(String(body.limit ?? BATCH_MAX), 10) || BATCH_MAX));
    const filter = await audienceFilter(audience);
    const total = await User.countDocuments(filter);
    const users: any[] = await User.find(filter).select("fullName email").sort({ _id: 1 }).skip(offset).limit(limit).lean();

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const user of users) {
      const email = String(user.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        failed += 1;
        continue;
      }
      try {
        await sender.send(buildMail({ to: email, name: firstName(user.fullName), subject, message, ctaText, ctaUrl }));
        sent += 1;
      } catch (error) {
        failed += 1;
        if (errors.length < 3) errors.push(friendlySmtpError(error));
      }
    }

    const nextOffset = offset + users.length;
    return NextResponse.json(
      { success: true, total, sent, failed, nextOffset, done: users.length === 0 || nextOffset >= total, errors },
      { headers: NO_STORE },
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: friendlySmtpError(error) }, { status: 502, headers: NO_STORE });
  } finally {
    sender?.close();
  }
}
