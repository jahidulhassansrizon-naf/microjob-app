import Subscription from "@/models/Subscription";

const PAYMENTLY_BASE_URL = (
  process.env.PAYMENTLY_BASE_URL || "https://test-app.paymently.io/api"
)
  .trim()
  .replace(/\/+$/, "");

const PAYMENTLY_API_KEY = process.env.PAYMENTLY_API_KEY?.trim();

type PaymentlyResponse = {
  status?: string;
  invoice_id?: string;
  amount?: string | number;
  charged_amount?: string | number;
  transaction_id?: string;
  sender_number?: string;
  payment_method?: string;
  metadata?: Record<string, unknown>;
  message?: string;
  [key: string]: unknown;
};

export type VerifyActivationResult = {
  ok: boolean;
  httpStatus: number;
  paymentStatus?: string;
  message: string;
  payment?: PaymentlyResponse;
  subscription?: {
    id: string;
    planId: string;
    planName: string;
    accessStatus: string;
    paymentStatus: string;
    startedAt?: Date | null;
    expiresAt?: Date | null;
  };
  alreadyCompleted?: boolean;
};

// Keep legacy durations so checkouts started before the pricing change can still be verified.
// New checkouts are restricted to the single 1-month plan in /api/checkout.
const DURATION_BY_PLAN_ID: Record<string, number> = {
  "1-month": 30,
  "3-month": 90,
  "6-month": 180,
  "1-year": 365,
};

async function verifyWithPaymently(invoiceId: string) {
  if (!PAYMENTLY_API_KEY) {
    return {
      providerOk: false,
      httpStatus: 500,
      payment: null as PaymentlyResponse | null,
      message: "PAYMENTLY_API_KEY is not configured.",
    };
  }

  const response = await fetch(`${PAYMENTLY_BASE_URL}/verify-payment`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "RT-UDDOKTAPAY-API-KEY": PAYMENTLY_API_KEY,
    },
    body: JSON.stringify({ invoice_id: invoiceId }),
    cache: "no-store",
  });

  const rawText = await response.text();
  let payment: PaymentlyResponse | null = null;

  try {
    payment = rawText ? (JSON.parse(rawText) as PaymentlyResponse) : null;
  } catch {
    payment = { raw: rawText };
  }

  return {
    providerOk: response.ok,
    httpStatus: response.status,
    payment,
    message:
      payment?.message ||
      (response.ok
        ? "Payment verification response received."
        : `Payment verification request failed (${response.status}).`),
  };
}

export async function verifyAndActivateSubscription(
  invoiceId: string,
  options?: { expectedUserId?: string },
): Promise<VerifyActivationResult> {
  const normalizedInvoiceId = String(invoiceId || "").trim();

  if (!normalizedInvoiceId) {
    return {
      ok: false,
      httpStatus: 400,
      message: "invoice_id is required.",
    };
  }

  const provider = await verifyWithPaymently(normalizedInvoiceId);

  if (!provider.providerOk || !provider.payment) {
    return {
      ok: false,
      httpStatus: provider.httpStatus,
      message: provider.message,
      payment: provider.payment || undefined,
    };
  }

  const payment = provider.payment;
  const status = String(payment.status || "").toUpperCase();

  if (status !== "COMPLETED") {
    return {
      ok: false,
      httpStatus: 200,
      paymentStatus: status || "UNKNOWN",
      message:
        status === "PENDING"
          ? "Payment is still pending."
          : status === "ERROR"
            ? "Payment was not completed."
            : "Payment has not been completed.",
      payment,
    };
  }

  const returnedInvoiceId = String(payment.invoice_id || "").trim();

  if (returnedInvoiceId && returnedInvoiceId !== normalizedInvoiceId) {
    return {
      ok: false,
      httpStatus: 409,
      message: "Verified invoice ID does not match the requested invoice.",
      payment,
    };
  }

  const metadata = payment.metadata || {};
  const subscriptionId = String(metadata.subscription_id || "").trim();
  const metadataUserId = String(metadata.user_id || "").trim();
  const metadataPlanId = String(metadata.plan_id || "").trim();

  if (!subscriptionId) {
    return {
      ok: false,
      httpStatus: 409,
      message: "Payment metadata is missing subscription_id.",
      payment,
    };
  }

  if (!metadataUserId) {
    return {
      ok: false,
      httpStatus: 409,
      message: "Payment metadata is missing user_id.",
      payment,
    };
  }

  if (options?.expectedUserId && metadataUserId !== options.expectedUserId) {
    return {
      ok: false,
      httpStatus: 409,
      message: "Payment metadata does not match the logged-in user.",
      payment,
    };
  }

  const subscription = await Subscription.findOne({
    _id: subscriptionId,
    userId: metadataUserId,
  });

  if (!subscription) {
    return {
      ok: false,
      httpStatus: 404,
      message: "Subscription record was not found.",
      payment,
    };
  }

  if (metadataPlanId && metadataPlanId !== String(subscription.planId)) {
    return {
      ok: false,
      httpStatus: 409,
      message: "Payment metadata does not match the subscription plan.",
      payment,
    };
  }

  const paidAmount = Number(payment.amount ?? payment.charged_amount ?? 0);
  const expectedAmount = Number(subscription.amount);

  if (
    !Number.isFinite(paidAmount) ||
    !Number.isFinite(expectedAmount) ||
    paidAmount !== expectedAmount
  ) {
    return {
      ok: false,
      httpStatus: 409,
      message: "Verified payment amount does not match the subscription.",
      payment,
    };
  }

  if (subscription.paymentStatus === "COMPLETED") {
    return {
      ok: true,
      httpStatus: 200,
      alreadyCompleted: true,
      message: "Payment is already completed.",
      payment,
      subscription: {
        id: String(subscription._id),
        planId: String(subscription.planId),
        planName: String(subscription.planName),
        accessStatus: String(subscription.accessStatus),
        paymentStatus: String(subscription.paymentStatus),
        startedAt: subscription.startedAt || null,
        expiresAt: subscription.expiresAt || null,
      },
    };
  }

  const days = DURATION_BY_PLAN_ID[String(subscription.planId)];

  if (!days) {
    return {
      ok: false,
      httpStatus: 409,
      message: "Unknown subscription plan duration.",
      payment,
    };
  }

  const now = new Date();
  const currentExpiry = subscription.expiresAt
    ? new Date(subscription.expiresAt)
    : null;
  const startsAt =
    currentExpiry && currentExpiry.getTime() > now.getTime()
      ? currentExpiry
      : now;
  const expiresAt = new Date(startsAt);
  expiresAt.setDate(expiresAt.getDate() + days);

  subscription.invoiceId = normalizedInvoiceId;
  subscription.paymentStatus = "COMPLETED";
  subscription.accessStatus = "ACTIVE";
  subscription.set({
    transactionId: String(payment.transaction_id || ""),
    paymentMethod: String(payment.payment_method || ""),
    startedAt: startsAt,
    expiresAt,
  });

  await subscription.save();

  return {
    ok: true,
    httpStatus: 200,
    message: "Payment verified and subscription activated.",
    payment,
    subscription: {
      id: String(subscription._id),
      planId: String(subscription.planId),
      planName: String(subscription.planName),
      accessStatus: String(subscription.accessStatus),
      paymentStatus: String(subscription.paymentStatus),
      startedAt: startsAt,
      expiresAt,
    },
  };
}
