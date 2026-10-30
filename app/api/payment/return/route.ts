import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function firstValue(...values: unknown[]) {
  return String(values.find((value) => typeof value === "string" && value.trim()) || "").trim();
}

async function readReturnPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return request.json().catch(() => ({}));
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }
  const raw = await request.text();
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

async function handleReturn(request: Request) {
  const url = new URL(request.url);
  const payload: any = request.method === "GET"
    ? Object.fromEntries(url.searchParams.entries())
    : await readReturnPayload(request);
  const subscriptionId = firstValue(url.searchParams.get("subscription_id"), payload?.subscription_id, payload?.subscriptionId);
  const ppId = firstValue(payload?.pp_id, payload?.ppId, payload?.payment_id, url.searchParams.get("pp_id"), url.searchParams.get("ppId"));
  const invoiceId = firstValue(payload?.invoice_id, payload?.invoiceId, url.searchParams.get("invoice_id"), url.searchParams.get("invoiceId"));

  const configuredSiteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    ""
  ).trim();
  let redirectOrigin = url.origin;
  if (configuredSiteUrl) {
    try {
      const configuredUrl = new URL(configuredSiteUrl);
      if (configuredUrl.protocol === "https:" || (process.env.NODE_ENV !== "production" && configuredUrl.protocol === "http:")) {
        redirectOrigin = configuredUrl.origin;
      }
    } catch {
      // The checkout endpoint separately rejects an invalid public site URL.
    }
  }
  const destination = new URL("/payment/success", redirectOrigin);
  if (subscriptionId) destination.searchParams.set("subscription_id", subscriptionId);
  if (ppId) destination.searchParams.set("pp_id", ppId);
  if (invoiceId) destination.searchParams.set("invoice_id", invoiceId);
  return NextResponse.redirect(destination, 303);
}

export async function GET(request: Request) {
  return handleReturn(request);
}

export async function POST(request: Request) {
  return handleReturn(request);
}
