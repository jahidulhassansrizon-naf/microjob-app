import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";
import { getPipraPayConfig } from "@/app/api/payment/_lib/piprapay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" };
const AUTH_FAILURE = /unauthori[sz]ed|invalid\s+(api\s*key|key)|api\s*key.{0,30}(invalid|required|missing)|authentication\s+failed|access\s+denied/i;
const INVALID_TEST_REFERENCE = /(payment|transaction|pp.?id).{0,40}(not\s+found|does\s+not\s+exist|invalid)|invalid.{0,30}(payment|transaction|pp.?id)/i;
const TEST_PP_ID = "SEBALAGBE-CONNECTION-TEST-NOT-A-REAL-PAYMENT";

type Probe = {
  contract: "v3plus" | "v2";
  endpoint: string;
  status: number;
  searchable: string;
  invalidReference: boolean;
  authDenied: boolean;
};

async function probeVerifyEndpoint(
  apiBaseUrl: string,
  apiKey: string,
  contract: "v3plus" | "v2",
  signal: AbortSignal,
): Promise<Probe> {
  const endpoint = contract === "v3plus" ? "verify-payment" : "verify-payments";
  // The header names are intentionally different: PipraPay documents MHS-... for
  // the current V3+ API and mh-... for the legacy V2 API.
  const headerName = contract === "v3plus" ? "MHS-PIPRAPAY-API-KEY" : "mh-piprapay-api-key";
  const response = await fetch(`${apiBaseUrl}/${endpoint}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      [headerName]: apiKey,
    },
    // This sentinel is deliberately fake. Verification is read-only and creates no charge/refund.
    body: JSON.stringify({ pp_id: TEST_PP_ID }),
    cache: "no-store",
    signal,
  });

  const responseText = await response.text();
  let providerPayload: Record<string, unknown> = {};
  try {
    const parsed: unknown = responseText ? JSON.parse(responseText) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      providerPayload = parsed as Record<string, unknown>;
    }
  } catch {
    // Do not return arbitrary provider HTML/text to the Admin browser.
  }

  const message = [providerPayload.message, providerPayload.error, providerPayload.detail]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .slice(0, 500);
  const searchable = `${message} ${responseText.slice(0, 1200)}`;

  return {
    contract,
    endpoint,
    status: response.status,
    searchable,
    invalidReference: INVALID_TEST_REFERENCE.test(searchable),
    authDenied: response.status === 401 || response.status === 403 || AUTH_FAILURE.test(searchable),
  };
}

/**
 * Read-only connection diagnostic. It probes current V3+ first, then legacy V2
 * only when the current endpoint rejects or does not recognize the request.
 * No real checkout, charge, or refund is ever created by this route.
 */
export async function POST(request: Request) {
  const { response: authResponse } = await requireAdmin(request);
  if (authResponse) return authResponse;

  try {
    const config = await getPipraPayConfig();
    if (!config.configured || !config.apiKey || !config.apiBaseUrl) {
      return NextResponse.json({
        success: false,
        status: "not-configured",
        message: "Save the PipraPay Base URL and API Key before testing the connection.",
      }, { status: 400, headers: NO_STORE });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18_000);
    try {
      const current = await probeVerifyEndpoint(config.apiBaseUrl, config.apiKey, "v3plus", controller.signal);
      if (current.invalidReference && (current.status === 200 || current.status === 400)) {
        return NextResponse.json({
          success: true,
          status: "connected",
          apiContract: "v3plus",
          httpStatus: current.status,
          message: "Connection confirmed using the current PipraPay V3+ verification endpoint. The dummy reference was rejected as expected. No real payment was created.",
        }, { headers: NO_STORE });
      }

      // A V3+ 401/403 can mean a key/permission issue, but the self-hosted panel
      // may still be running the legacy V2 contract. Probe V2 before concluding.
      const legacy = await probeVerifyEndpoint(config.apiBaseUrl, config.apiKey, "v2", controller.signal);
      if (legacy.invalidReference && (legacy.status === 200 || legacy.status === 400)) {
        return NextResponse.json({
          success: true,
          status: "legacy-api-detected",
          apiContract: "v2",
          httpStatus: legacy.status,
          message: "API connection succeeded with the legacy PipraPay V2 endpoint. Your saved API Key is accepted for V2. Do not enable payments yet: the checkout code currently targets V3+, so checkout/verification must be aligned to V2 first.",
        }, { headers: NO_STORE });
      }

      if (current.authDenied && legacy.authDenied) {
        return NextResponse.json({
          success: false,
          status: "auth-or-access-denied",
          httpStatus: current.status === 403 || legacy.status === 403 ? 403 : 401,
          message: "PipraPay returned 401/403 for both documented API contracts. The key may be invalid, inactive, restricted, or the server may block API access by IP/security policy. This result alone cannot distinguish those causes. Confirm the key from Developer > API Keys and check the self-hosted server's API access rules.",
        }, { status: 200, headers: NO_STORE });
      }

      if (current.status === 404 && legacy.status === 404) {
        return NextResponse.json({
          success: false,
          status: "endpoint-not-found",
          httpStatus: 404,
          message: "Both documented verification endpoints returned 404. Confirm the PipraPay installation version and Base URL (include /api only once).",
        }, { status: 200, headers: NO_STORE });
      }

      return NextResponse.json({
        success: false,
        status: "unconfirmed",
        httpStatus: current.status,
        message: `PipraPay responded, but neither documented verification contract confirmed the test. V3+ HTTP ${current.status}; V2 HTTP ${legacy.status}. Check the installed PipraPay version, API key permissions and server logs. No real payment was created.`,
      }, { status: 200, headers: NO_STORE });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const aborted = error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
    console.error("PipraPay connection test failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({
      success: false,
      status: aborted ? "timeout" : "connection-error",
      message: aborted
        ? "PipraPay did not respond within 18 seconds. Check the server URL and server availability."
        : "Could not connect to PipraPay. Check the Base URL, DNS, HTTPS certificate and server availability.",
    }, { status: 200, headers: NO_STORE });
  }
}
