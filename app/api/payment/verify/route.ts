import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_12345";

const PAYMENTLY_BASE_URL = (
  process.env.PAYMENTLY_BASE_URL || "https://test-app.paymently.io/api"
)
  .trim()
  .replace(/\/+$/, "");

const PAYMENTLY_API_KEY = process.env.PAYMENTLY_API_KEY?.trim();

type JwtPayload = {
  userId: string;
  exp?: number;
};

function getTokenFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;

  const pair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));

  return pair ? decodeURIComponent(pair.slice("token=".length)) : null;
}

export async function POST(request: Request) {
  try {
    await connectDB();

    if (!PAYMENTLY_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "PAYMENTLY_API_KEY is missing in .env.local",
        },
        { status: 500 },
      );
    }

    const token = getTokenFromCookie(request.headers.get("cookie"));

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in before verifying this payment.",
        },
        { status: 401 },
      );
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Your login session has expired.",
        },
        { status: 401 },
      );
    }

    if (!decoded?.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid login token.",
        },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    const invoiceId = String(body?.invoice_id || "").trim();

    if (!invoiceId) {
      return NextResponse.json(
        {
          success: false,
          message: "invoice_id is required.",
        },
        { status: 400 },
      );
    }

    const providerResponse = await fetch(
      `${PAYMENTLY_BASE_URL}/verify-payment`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "RT-UDDOKTAPAY-API-KEY": PAYMENTLY_API_KEY,
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
        }),
        cache: "no-store",
      },
    );

    const rawText = await providerResponse.text();

    let payment: any = null;
    try {
      payment = rawText ? JSON.parse(rawText) : null;
    } catch {
      payment = { raw: rawText };
    }

    if (!providerResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            payment?.message ||
            `Payment verification request failed (${providerResponse.status}).`,
          providerStatus: providerResponse.status,
          providerResponse: payment,
        },
        { status: providerResponse.status },
      );
    }

    const status = String(payment?.status || "").toUpperCase();

    if (status !== "COMPLETED") {
      return NextResponse.json({
        success: false,
        paymentStatus: status || "UNKNOWN",
        message:
          status === "PENDING"
            ? "Payment is still pending."
            : status === "ERROR"
              ? "Payment was not completed."
              : "Payment has not been completed.",
      });
    }

    const returnedInvoiceId = String(payment?.invoice_id || "").trim();

    if (returnedInvoiceId && returnedInvoiceId !== invoiceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Verified invoice ID does not match the requested invoice.",
        },
        { status: 409 },
      );
    }

    const metadata = payment?.metadata || {};
    const subscriptionId = String(metadata?.subscription_id || "").trim();
    const metadataUserId = String(metadata?.user_id || "").trim();

    if (!subscriptionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment metadata is missing subscription_id.",
        },
        { status: 409 },
      );
    }

    if (metadataUserId !== String(decoded.userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment metadata does not match the logged-in user.",
        },
        { status: 409 },
      );
    }

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId: decoded.userId,
    });

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          message: "Subscription record was not found.",
        },
        { status: 404 },
      );
    }

    const paidAmount = Number(payment?.amount ?? payment?.charged_amount ?? 0);
    const expectedAmount = Number(subscription.amount);

    if (
      !Number.isFinite(paidAmount) ||
      !Number.isFinite(expectedAmount) ||
      paidAmount !== expectedAmount
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Verified payment amount does not match the subscription.",
        },
        { status: 409 },
      );
    }

    if (subscription.paymentStatus === "COMPLETED") {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        payment: {
          invoice_id: returnedInvoiceId || invoiceId,
          transaction_id: payment?.transaction_id || null,
          sender_number: payment?.sender_number || null,
          payment_method: payment?.payment_method || null,
          status,
        },
        subscription: {
          id: String(subscription._id),
          planId: subscription.planId,
          planName: subscription.planName,
          accessStatus: subscription.accessStatus,
          expiresAt: subscription.expiresAt || null,
        },
      });
    }

    const now = new Date();

    const durationByPlanId: Record<string, number> = {
      "1-month": 30,
      "3-month": 90,
      "6-month": 180,
      "1-year": 365,
    };

    const days = durationByPlanId[String(subscription.planId)];

    if (!days) {
      return NextResponse.json(
        {
          success: false,
          message: "Unknown subscription plan duration.",
        },
        { status: 409 },
      );
    }

    const currentExpiry = subscription.expiresAt
      ? new Date(subscription.expiresAt)
      : null;

    const startsAt =
      currentExpiry && currentExpiry.getTime() > now.getTime()
        ? currentExpiry
        : now;

    const expiresAt = new Date(startsAt);
    expiresAt.setDate(expiresAt.getDate() + days);

    subscription.invoiceId = invoiceId;
    subscription.paymentStatus = "COMPLETED";
    subscription.accessStatus = "ACTIVE";

    subscription.set({
      transactionId: String(payment?.transaction_id || ""),
      paymentMethod: String(payment?.payment_method || ""),
      startedAt: startsAt,
      expiresAt,
    });

    await subscription.save();

    return NextResponse.json({
      success: true,
      payment: {
        invoice_id: returnedInvoiceId || invoiceId,
        transaction_id: payment?.transaction_id || null,
        sender_number: payment?.sender_number || null,
        payment_method: payment?.payment_method || null,
        status,
      },
      subscription: {
        id: String(subscription._id),
        planId: subscription.planId,
        planName: subscription.planName,
        accessStatus: subscription.accessStatus,
        startedAt: startsAt,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Payment verification failed.",
      },
      { status: 500 },
    );
  }
}
