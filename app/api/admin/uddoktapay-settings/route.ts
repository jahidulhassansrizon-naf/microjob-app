import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";
import UddoktaPaySettings from "@/models/UddoktaPaySettings";
import { encryptUddoktaPayApiKey, validateUddoktaPayBaseUrl } from "@/lib/serverPipraPaySettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_BASE_URL = "https://test-app.paymently.io";
const NO_STORE = { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" };

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    await connectDB();
    const settings = await UddoktaPaySettings.findOne({ key: "primary" }).select("baseUrl enabled updatedAt updatedBy").lean();
    const hasApiKey = Boolean(await UddoktaPaySettings.exists({ key: "primary", apiKeyEncrypted: { $ne: null } }));
    return NextResponse.json({ success: true, settings: {
      baseUrl: settings?.baseUrl || DEFAULT_BASE_URL,
      apiKeyConfigured: hasApiKey,
      enabled: Boolean(settings?.enabled),
      updatedAt: settings?.updatedAt || null,
      updatedBy: settings?.updatedBy || "",
    } }, { headers: NO_STORE });
  } catch (error) {
    console.error("UddoktaPay settings read failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, message: "UddoktaPay settings could not be loaded." }, { status: 500, headers: NO_STORE });
  }
}

export async function PUT(request: Request) {
  const { admin, response } = await requireAdmin(request);
  if (response) return response;
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ success: false, message: "Valid UddoktaPay settings are required." }, { status: 400, headers: NO_STORE });
    const validated = validateUddoktaPayBaseUrl(body.baseUrl);
    if (!validated.ok) return NextResponse.json({ success: false, message: validated.message }, { status: 400, headers: NO_STORE });
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    if (apiKey && (apiKey.length > 512 || /[\r\n]/.test(apiKey))) return NextResponse.json({ success: false, message: "The UddoktaPay API key format is invalid." }, { status: 400, headers: NO_STORE });

    await connectDB();
    const existing = await UddoktaPaySettings.findOne({ key: "primary" }).select("+apiKeyEncrypted");
    if (!apiKey && !existing?.apiKeyEncrypted) return NextResponse.json({ success: false, message: "Enter the UddoktaPay API Key before saving." }, { status: 400, headers: NO_STORE });

    const update: Record<string, unknown> = {
      baseUrl: validated.baseUrl,
      enabled: false,
      updatedBy: admin?.email || "administrator",
    };
    if (apiKey) update.apiKeyEncrypted = encryptUddoktaPayApiKey(apiKey);
    await UddoktaPaySettings.updateOne({ key: "primary" }, { $set: update, $setOnInsert: { key: "primary" } }, { upsert: true, runValidators: true });

    return NextResponse.json({ success: true, message: "UddoktaPay settings saved securely. Checkout remains disabled until the connection test is successful and an administrator enables it.", settings: { baseUrl: validated.baseUrl, apiKeyConfigured: true, enabled: false } }, { headers: NO_STORE });
  } catch (error) {
    const encryptionError = error instanceof Error && error.message.includes("PIPRAPAY_ENCRYPTION_KEY");
    console.error("UddoktaPay settings save failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, message: encryptionError ? "Credential encryption is not ready. Configure PIPRAPAY_ENCRYPTION_KEY (64 hexadecimal characters) in the server environment." : "UddoktaPay settings could not be saved. Check the database connection and try again." }, { status: encryptionError ? 503 : 500, headers: NO_STORE });
  }
}
