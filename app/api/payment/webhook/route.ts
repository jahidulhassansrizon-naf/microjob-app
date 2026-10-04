import { NextResponse } from "next/server";
import { verifyAndActivateSubscription } from "../_lib/paymently";

export const dynamic = "force-dynamic";

function extractInvoiceId(body: any) {
  const candidates = [
    body?.invoice_id,
    body?.invoiceId,
    body?.data?.invoice_id,
    body?.data?.invoiceId,
    body?.payment?.invoice_id,
    body?.payment?.invoiceId,
    body?.invoice?.invoice_id,
    body?.invoice?.invoiceId,
  ];

  return candidates.find((value) => String(value || "").trim()) || "";
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any = null;

    if (contentType.includes("application/json")) {
      body = await request.json().catch(() => null);
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    } else {
      const raw = await request.text();
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        body = { raw };
      }
    }

    const invoiceId = String(extractInvoiceId(body)).trim();

    if (!invoiceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Webhook received, but invoice_id was not found.",
        },
        { status: 400 },
      );
    }

    // Webhook fields are not trusted. The invoice is re-verified with Paymently
    // before any subscription is activated in MongoDB.
    const result = await verifyAndActivateSubscription(invoiceId);

    console.log("[Paymently Webhook]", {
      invoiceId,
      ok: result.ok,
      paymentStatus: result.paymentStatus,
      message: result.message,
    });

    return NextResponse.json(
      {
        success: result.ok,
        message: result.message,
        paymentStatus: result.paymentStatus || result.payment?.status || null,
        alreadyCompleted: Boolean(result.alreadyCompleted),
        subscription: result.subscription || null,
      },
      { status: result.ok ? 200 : result.httpStatus },
    );
  } catch (error) {
    console.error("[Paymently Webhook] error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Payment webhook processing failed.",
      },
      { status: 500 },
    );
  }
}
