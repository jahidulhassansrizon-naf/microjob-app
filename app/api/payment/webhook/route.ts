import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getPipraPayApiKey, verifyAndActivateSubscription } from "../_lib/piprapay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidApiKey(received: string | null, expected: string) {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received.trim());
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

function extractPpId(body: any) {
  const values = [
    body?.pp_id,
    body?.ppId,
    body?.payment_id,
    body?.data?.pp_id,
    body?.data?.ppId,
    body?.data?.payment_id,
    body?.data?.payment?.pp_id,
    body?.data?.payment?.payment_id,
    body?.payment?.pp_id,
    body?.payment?.payment_id,
  ];
  return String(values.find((value) => String(value || "").trim()) || "").trim();
}

async function readBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return request.json().catch(() => null);
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }
  const raw = await request.text();
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export async function POST(request: Request) {
  try {
    const expectedApiKey = await getPipraPayApiKey();
    const receivedApiKey = request.headers.get("mh-piprapay-api-key");
    if (!isValidApiKey(receivedApiKey, expectedApiKey)) {
      return NextResponse.json({ success: false, message: "Unauthorized PipraPay webhook." }, { status: 401 });
    }

    const body = await readBody(request);
    const ppId = extractPpId(body);
    if (!ppId) {
      return NextResponse.json({ success: false, message: "Webhook received without a PipraPay pp_id." }, { status: 400 });
    }

    // Treat webhook data only as a notification. Re-fetch and verify the payment
    // directly with PipraPay before updating the subscription record.
    const result = await verifyAndActivateSubscription(ppId);
    console.info("[PipraPay Webhook]", {
      ppId,
      ok: result.ok,
      paymentStatus: result.paymentStatus || result.payment?.status || null,
      message: result.message,
    });

    const shouldRetry = !result.ok && (
      result.httpStatus >= 500 ||
      result.paymentStatus === "PENDING" ||
      result.paymentStatus === "UNKNOWN"
    );
    const status = result.ok ? 200 : shouldRetry ? 503 : 200;
    return NextResponse.json({
      success: result.ok,
      message: result.message,
      paymentStatus: result.paymentStatus || result.payment?.payment_status || result.payment?.status || null,
      alreadyCompleted: Boolean(result.alreadyCompleted),
    }, { status });
  } catch (error) {
    console.error("[PipraPay Webhook] processing error:", error);
    return NextResponse.json({ success: false, message: "PipraPay webhook processing failed." }, { status: 503 });
  }
}
