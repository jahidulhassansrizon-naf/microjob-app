import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getUddoktaPayConfig, verifyAndActivateUddoktaPaySubscription } from "@/app/api/uddoktapay/_lib/uddoktapay";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(received: string | null, expected: string) {
  if (!received || !expected) return false;
  const a = Buffer.from(received.trim());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
async function readBody(request: Request): Promise<Record<string, any>> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const value = await request.json().catch(() => ({}));
    return value && typeof value === "object" ? value : {};
  }
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) return Object.fromEntries((await request.formData()).entries());
  const raw = await request.text();
  try { const value = raw ? JSON.parse(raw) : {}; return value && typeof value === "object" ? value : {}; } catch { return {}; }
}

export async function POST(request: Request) {
  try {
    const config = await getUddoktaPayConfig();
    if (!safeEqual(request.headers.get("rt-uddoktapay-api-key"), config.apiKey)) return NextResponse.json({ success: false, message: "Unauthorized UddoktaPay webhook." }, { status: 401 });
    const body = await readBody(request);
    const invoiceId = String(body.invoice_id || body.invoiceId || body.data?.invoice_id || "").trim();
    if (!invoiceId) return NextResponse.json({ success: false, message: "Webhook received without an invoice_id." }, { status: 400 });

    // Never trust webhook status/amount. Verify the invoice directly with UddoktaPay.
    const result = await verifyAndActivateUddoktaPaySubscription(invoiceId);
    console.info("[UddoktaPay Webhook]", { invoiceId, ok: result.ok, paymentStatus: result.paymentStatus || result.payment?.status || null });
    const retry = !result.ok && (result.httpStatus >= 500 || result.paymentStatus === "PENDING" || result.paymentStatus === "UNKNOWN");
    return NextResponse.json({ success: result.ok, message: result.message, paymentStatus: result.paymentStatus || result.payment?.status || null, alreadyCompleted: Boolean(result.alreadyCompleted) }, { status: result.ok ? 200 : retry ? 503 : 200 });
  } catch (error) {
    console.error("[UddoktaPay Webhook] processing error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, message: "UddoktaPay webhook processing failed." }, { status: 503 });
  }
}
