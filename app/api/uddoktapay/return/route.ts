import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readPayload(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    return body && typeof body === "object" ? body as Record<string, unknown> : {};
  }
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }
  const raw = await request.text();
  try { const body = raw ? JSON.parse(raw) : {}; return body && typeof body === "object" ? body as Record<string, unknown> : {}; } catch { return {}; }
}

async function handle(request: Request) {
  const url = new URL(request.url);
  const payload = request.method === "GET" ? Object.fromEntries(url.searchParams.entries()) : await readPayload(request);
  const first = (...values: unknown[]) => String(values.find((v) => typeof v === "string" && v.trim()) || "").trim();
  // UddoktaPay may append "?invoice_id=..." to a redirect_url that already has a query string,
  // producing "?subscription_id=<id>?invoice_id=<invoice>". Parse both values tolerantly.
  const rawQuery = url.search;
  const rawSubscription = first(url.searchParams.get("subscription_id"), payload.subscription_id, payload.subscriptionId);
  const subscriptionId = (rawSubscription.match(/[a-f0-9]{24}/i)?.[0]) || (rawQuery.match(/subscription_id=([a-f0-9]{24})/i)?.[1]) || "";
  let invoiceId = first(payload.invoice_id, payload.invoiceId, url.searchParams.get("invoice_id"), url.searchParams.get("invoiceId"));
  if (!invoiceId) {
    const embedded = rawSubscription.match(/invoice_id=([^&?#]+)/i)?.[1] || rawQuery.match(/invoice_id=([^&?#]+)/i)?.[1] || "";
    try { invoiceId = decodeURIComponent(embedded).trim(); } catch { invoiceId = embedded.trim(); }
  }
  const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").trim();
  let origin = url.origin;
  try { const parsed = new URL(site); if (parsed.protocol === "https:") origin = parsed.origin; } catch { /* Use request origin. */ }
  const destination = new URL("/payment/success", origin);
  destination.searchParams.set("provider", "uddoktapay");
  if (subscriptionId) destination.searchParams.set("subscription_id", subscriptionId);
  if (invoiceId) destination.searchParams.set("invoice_id", invoiceId);
  return NextResponse.redirect(destination, 303);
}
export async function GET(request: Request) { return handle(request); }
export async function POST(request: Request) { return handle(request); }
