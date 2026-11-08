import { NextResponse } from "next/server";
import { renderTestEmail } from "@/app/api/_lib/emailTemplates";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";
import { friendlySmtpError, getSmtpSettingsRuntime, sendViaSmtp } from "@/app/api/_lib/smtpMailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Sends a test mail through the SAVED SMTP settings (even when SMTP is still switched off). */
export async function POST(request: Request) {
  const { admin, response } = await requireAdmin(request);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const to = String(body?.to || admin?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(to) || to.length > 254) {
    return NextResponse.json({ success: false, message: "Enter a valid email address to send the test to." }, { status: 400, headers: NO_STORE });
  }

  try {
    const settings = await getSmtpSettingsRuntime({ fresh: true });
    if (!settings) {
      return NextResponse.json({ success: false, message: "Save the SMTP settings first, then send the test." }, { status: 400, headers: NO_STORE });
    }
    await sendViaSmtp(settings, {
      to,
      subject: "SMTP test - SebaLagbe.com",
      text: "This is a test email from your SebaLagbe.com admin panel. Your SMTP settings are working.",
      html: renderTestEmail(),
    });
    return NextResponse.json({ success: true, message: `Test email sent to ${to}. Check the inbox (and spam folder).` }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ success: false, message: friendlySmtpError(error) }, { status: 502, headers: NO_STORE });
  }
}
