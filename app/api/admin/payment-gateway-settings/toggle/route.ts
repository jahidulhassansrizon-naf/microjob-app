import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";
import PipraPaySettings from "@/models/PipraPaySettings";
import { getPipraPayConfig } from "@/app/api/payment/_lib/piprapay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" };
const TEST_PP_ID = "SEBALAGBE-LIVE-CHECKOUT-ENABLE-PROBE-NOT-A-REAL-PAYMENT";
const INVALID_REFERENCE = /(payment|transaction|pp.?id|reference).{0,60}(not\s+found|does\s+not\s+exist|invalid|unknown)|(?:not\s+found|does\s+not\s+exist|invalid|unknown).{0,60}(payment|transaction|pp.?id|reference)/i;

async function confirmV3PlusVerification(config: Awaited<ReturnType<typeof getPipraPayConfig>>) {
  if (!config.configured || !config.apiKey || !config.apiBaseUrl) {
    return { ok: false, message: "Save the PipraPay Base URL and API Key first." };
  }

  const response = await fetch(`${config.apiBaseUrl}/verify-payment`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "MHS-PIPRAPAY-API-KEY": config.apiKey,
    },
    body: JSON.stringify({ pp_id: TEST_PP_ID }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const raw = await response.text();
  let payload: Record<string, unknown> = {};
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) payload = parsed as Record<string, unknown>;
  } catch {
    // A non-JSON response is not sufficient evidence to enable payments.
  }
  const message = [payload.message, payload.error, payload.detail]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  const rejectedAsExpected = INVALID_REFERENCE.test(`${message} ${raw.slice(0, 1200)}`);
  return {
    ok: rejectedAsExpected && (response.status === 200 || response.status === 400),
    message: `Provider verification probe returned HTTP ${response.status}.`,
  };
}

export async function POST(request: Request) {
  const { admin, response: authResponse } = await requireAdmin(request);
  if (authResponse) return authResponse;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.enabled !== "boolean") {
      return NextResponse.json({ success: false, message: "Choose whether PipraPay checkout should be enabled or disabled." }, { status: 400, headers: NO_STORE });
    }

    await connectDB();
    const existing = await PipraPaySettings.findOne({ key: "primary" }).select("enabled");
    if (!existing) {
      return NextResponse.json({ success: false, message: "Save PipraPay settings before changing checkout status." }, { status: 400, headers: NO_STORE });
    }

    if (body.enabled) {
      const config = await getPipraPayConfig();
      const probe = await confirmV3PlusVerification(config);
      if (!probe.ok) {
        return NextResponse.json({
          success: false,
          message: "Live checkout was not enabled. The server could not reconfirm the PipraPay V3+ verification endpoint. Run Test Connection and check the provider configuration.",
        }, { status: 409, headers: NO_STORE });
      }
    }

    await PipraPaySettings.updateOne(
      { key: "primary" },
      { $set: { enabled: body.enabled, updatedBy: admin?.email || "administrator" } },
    );

    return NextResponse.json({
      success: true,
      settings: { enabled: body.enabled },
      message: body.enabled
        ? "PipraPay live checkout is enabled. Customers can now start real payments."
        : "PipraPay checkout is disabled. Manual bKash/Nagad payments remain available.",
    }, { headers: NO_STORE });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    console.error("PipraPay checkout toggle failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({
      success: false,
      message: timedOut
        ? "PipraPay did not respond during the verification probe. Checkout remains disabled."
        : "PipraPay checkout status could not be changed. Checkout remains disabled unless it was already enabled.",
    }, { status: timedOut ? 504 : 500, headers: NO_STORE });
  }
}
