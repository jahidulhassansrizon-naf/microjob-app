import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";
import PipraPaySettings from "@/models/PipraPaySettings";
import { encryptPipraPayApiKey, validatePipraPayBaseUrl } from "@/lib/serverPipraPaySettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_BASE_URL = "https://pay.devprobd.top/api";
const NO_STORE = { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" };

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    await connectDB();
    const settings = await PipraPaySettings.findOne({ key: "primary" })
      .select("baseUrl enabled updatedAt updatedBy")
      .lean();
    const hasApiKey = Boolean((await PipraPaySettings.exists({ key: "primary", apiKeyEncrypted: { $ne: null } })));
    return NextResponse.json({
      success: true,
      settings: {
        baseUrl: settings?.baseUrl || DEFAULT_BASE_URL,
        apiKeyConfigured: hasApiKey,
        enabled: Boolean(settings?.enabled),
        updatedAt: settings?.updatedAt || null,
        updatedBy: settings?.updatedBy || "",
      },
    }, { headers: NO_STORE });
  } catch (error) {
    console.error("PipraPay settings read failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, message: "PipraPay settings could not be loaded." }, { status: 500, headers: NO_STORE });
  }
}

export async function PUT(request: Request) {
  const { admin, response } = await requireAdmin(request);
  if (response) return response;
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: "Valid PipraPay settings are required." }, { status: 400, headers: NO_STORE });
    }

    const validatedUrl = validatePipraPayBaseUrl(body.baseUrl);
    if (!validatedUrl.ok) {
      return NextResponse.json({ success: false, message: validatedUrl.message }, { status: 400, headers: NO_STORE });
    }

    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    if (apiKey && (apiKey.length > 512 || /[\r\n]/.test(apiKey))) {
      return NextResponse.json({ success: false, message: "The API key format is invalid. Check the key and try again." }, { status: 400, headers: NO_STORE });
    }

    await connectDB();
    const existing = await PipraPaySettings.findOne({ key: "primary" }).select("+apiKeyEncrypted enabled");
    const existingHasKey = Boolean(existing?.apiKeyEncrypted);
    if (!apiKey && !existingHasKey) {
      return NextResponse.json({ success: false, message: "Enter the PipraPay API Key before saving these settings." }, { status: 400, headers: NO_STORE });
    }

    const update: Record<string, unknown> = {
      baseUrl: validatedUrl.baseUrl,
      updatedBy: admin?.email || "administrator",
      // Keep provider payments disabled until the checkout/verification flow is tested end-to-end.
      enabled: false,
    };
    if (apiKey) update.apiKeyEncrypted = encryptPipraPayApiKey(apiKey);

    await PipraPaySettings.updateOne(
      { key: "primary" },
      { $set: update, $setOnInsert: { key: "primary" } },
      { upsert: true, runValidators: true },
    );

    return NextResponse.json({
      success: true,
      message: "PipraPay settings saved securely. Payments remain disabled until integration testing is completed.",
      settings: {
        baseUrl: validatedUrl.baseUrl,
        apiKeyConfigured: true,
        enabled: false,
      },
    }, { headers: NO_STORE });
  } catch (error) {
    console.error("PipraPay settings save failed:", error instanceof Error ? error.message : "Unknown error");
    const encryptionError = error instanceof Error && error.message.includes("PIPRAPAY_ENCRYPTION_KEY");
    return NextResponse.json({
      success: false,
      code: encryptionError ? "PIPRAPAY_ENCRYPTION_KEY_NOT_CONFIGURED" : "PIPRAPAY_SETTINGS_SAVE_FAILED",
      message: encryptionError
        ? "PipraPay encryption is not configured. Add PIPRAPAY_ENCRYPTION_KEY to .env.local (64 hexadecimal characters), then restart the local server. Keep JWT_SECRET unchanged."
        : "PipraPay settings could not be saved. Check the database connection and try again.",
    }, { status: encryptionError ? 503 : 500, headers: NO_STORE });
  }
}
