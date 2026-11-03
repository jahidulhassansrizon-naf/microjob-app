import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";
import { getSmtpSettingsPublic, saveSmtpSettings, validateSmtpInput } from "@/app/api/_lib/smtpMailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" };

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    const settings = await getSmtpSettingsPublic();
    return NextResponse.json({ success: true, settings }, { headers: NO_STORE });
  } catch (error) {
    console.error("SMTP settings read failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, message: "SMTP settings could not be loaded." }, { status: 500, headers: NO_STORE });
  }
}

export async function PUT(request: Request) {
  const { admin, response } = await requireAdmin(request);
  if (response) return response;
  try {
    const body = await request.json().catch(() => null);
    const validated = validateSmtpInput(body);
    if (!validated.ok) {
      return NextResponse.json({ success: false, message: validated.message }, { status: 400, headers: NO_STORE });
    }
    await saveSmtpSettings(validated.value, admin?.email || "administrator");
    const settings = await getSmtpSettingsPublic();
    return NextResponse.json(
      {
        success: true,
        message: validated.value.enabled
          ? "SMTP settings saved. All website emails now go through this SMTP account."
          : "SMTP settings saved. SMTP is switched off, so it is not used yet.",
        settings,
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const known = /Enter the SMTP password|JWT_SECRET/.test(message);
    console.error("SMTP settings save failed:", message || "Unknown error");
    return NextResponse.json(
      { success: false, message: known ? message : "SMTP settings could not be saved. Check the database connection and try again." },
      { status: known ? 400 : 500, headers: NO_STORE },
    );
  }
}
