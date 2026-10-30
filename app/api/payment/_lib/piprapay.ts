import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import { SUBSCRIPTION_PLAN_BY_ID } from "@/app/_lib/subscriptionPlans";

const API_KEY = process.env.PIPRAPAY_API_KEY?.trim() || "";
const RAW_BASE_URL = process.env.PIPRAPAY_BASE_URL?.trim() || "https://sandbox.piprapay.com";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");
const API_BASE_URL = BASE_URL.endsWith("/api") ? BASE_URL : `${BASE_URL}/api`;

export type PipraPayRecord = Record<string, any>;

export type VerifyActivationResult = {
  ok: boolean;
  httpStatus: number;
  paymentStatus?: string;
  message: string;
  payment?: PipraPayRecord;
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

export function getPipraPayConfig() {
  return {
    apiKey: API_KEY,
    baseUrl: BASE_URL,
    apiBaseUrl: API_BASE_URL,
    baseUrlExplicitlyConfigured: Boolean(process.env.PIPRAPAY_BASE_URL?.trim()),
    configured: Boolean(API_KEY && BASE_URL),
  };
}

export function getPipraPayApiKey() {
  return API_KEY;
}

function unwrapProviderRecord(payload: PipraPayRecord): PipraPayRecord {
  const data = payload?.data && typeof payload.data === "object" ? payload.data : {};
  const nestedData = data?.data && typeof data.data === "object" ? data.data : {};
  const payment = payload?.payment && typeof payload.payment === "object" ? payload.payment : {};
  const nestedPayment = data?.payment && typeof data.payment === "object" ? data.payment : {};
  return { ...payload, ...data, ...nestedData, ...payment, ...nestedPayment };
}

async function parseProviderResponse(response: Response) {
  const raw = await response.text();
  let payload: PipraPayRecord | null = null;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = { message: raw.slice(0, 500) };
  }
  return { payload: payload || {}, record: unwrapProviderRecord(payload || {}) };
}

export async function verifyPipraPayPayment(ppId: string) {
  if (!API_KEY) {
    return {
      providerOk: false,
      httpStatus: 503,
      payment: null as PipraPayRecord | null,
      message: "PIPRAPAY_API_KEY is not configured on the server.",
    };
  }

  const response = await fetch(`${API_BASE_URL}/verify-payments`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "mh-piprapay-api-key": API_KEY,
    },
    body: JSON.stringify({ pp_id: ppId }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  const { payload, record } = await parseProviderResponse(response);
  const explicitlyRejected = payload?.success === false || payload?.status === false;

  return {
    providerOk: response.ok && !explicitlyRejected,
    httpStatus: response.status,
    payment: record,
    message:
      String(record?.message || payload?.message || "").trim() ||
      (response.ok ? "PipraPay verification response received." : `PipraPay verification failed (${response.status}).`),
  };
}

function getMetadataValue(metadata: PipraPayRecord, snake: string, camel: string) {
  return String(metadata?.[snake] ?? metadata?.[camel] ?? "").trim();
}

function getSubscriptionDurationDays(planId: string) {
  const plan = SUBSCRIPTION_PLAN_BY_ID[planId as keyof typeof SUBSCRIPTION_PLAN_BY_ID];
  if (plan?.days) return plan.days;
  // Preserve support for an older 3-month subscription that may still exist in the DB.
  return planId === "3-month" ? 90 : 0;
}

function resultSubscription(subscription: any, alreadyCompleted = false) {
  return {
    id: String(subscription._id),
    planId: String(subscription.planId),
    planName: String(subscription.planName),
    accessStatus: String(subscription.accessStatus),
    paymentStatus: String(subscription.paymentStatus),
    startedAt: subscription.startedAt || null,
    expiresAt: subscription.expiresAt || null,
    ...(alreadyCompleted ? { alreadyCompleted: true } : {}),
  };
}

/**
 * Verify the provider's record by pp_id and activate exactly one matching order.
 * Webhook payload fields and browser query parameters are never treated as proof
 * of payment; the provider's verification API is the source of truth.
 */
export async function verifyAndActivateSubscription(
  ppId: string,
  options?: { expectedUserId?: string; expectedSubscriptionId?: string },
): Promise<VerifyActivationResult> {
  const normalizedPpId = String(ppId || "").trim();
  if (!normalizedPpId || normalizedPpId.length > 180) {
    return { ok: false, httpStatus: 400, message: "A valid PipraPay pp_id is required." };
  }

  const provider = await verifyPipraPayPayment(normalizedPpId);
  if (!provider.providerOk || !provider.payment) {
    return {
      ok: false,
      httpStatus: provider.httpStatus >= 500 ? 503 : provider.httpStatus,
      message: provider.message,
      payment: provider.payment || undefined,
    };
  }

  const payment = provider.payment;
  const status = String(payment.payment_status || payment.status || payment.transaction_status || "").trim().toLowerCase();
  if (status !== "completed") {
    return {
      ok: false,
      httpStatus: 200,
      paymentStatus: status.toUpperCase() || "UNKNOWN",
      message: status === "pending"
        ? "PipraPay still reports this payment as pending."
        : status === "failed" || status === "cancelled" || status === "expired"
          ? `PipraPay reports this payment as ${status}.`
          : "PipraPay has not confirmed this payment as completed.",
      payment,
    };
  }

  // PipraPay's pp_id is the payment reference; transaction_id may be the
  // underlying bKash/Nagad transaction and must never be confused with pp_id.
  const returnedPpId = String(payment.pp_id || payment.ppId || payment.payment_id || "").trim();
  if (returnedPpId && returnedPpId !== normalizedPpId) {
    return { ok: false, httpStatus: 409, message: "Verified PipraPay payment ID does not match the submitted ID.", payment };
  }

  let metadata = payment.metadata && typeof payment.metadata === "object" ? payment.metadata : {};
  if (typeof payment.metadata === "string") {
    try {
      const parsed = JSON.parse(payment.metadata);
      if (parsed && typeof parsed === "object") metadata = parsed;
    } catch {
      metadata = {};
    }
  }
  // API routes can run in separate serverless instances. Never assume the
  // caller has already initialized the MongoDB connection (especially webhook).
  await connectDB();

  const metadataSubscriptionId = getMetadataValue(metadata, "subscription_id", "subscriptionId");
  const metadataUserId = getMetadataValue(metadata, "user_id", "userId");
  const metadataPlanId = getMetadataValue(metadata, "plan_id", "planId");
  const expectedSubscriptionId = String(options?.expectedSubscriptionId || "").trim();

  if (metadataSubscriptionId && expectedSubscriptionId && metadataSubscriptionId !== expectedSubscriptionId) {
    return { ok: false, httpStatus: 409, message: "Payment metadata does not match the selected subscription.", payment };
  }

  let subscription: any = null;

  if (metadataSubscriptionId) {
    if (!mongoose.isValidObjectId(metadataSubscriptionId)) {
      return { ok: false, httpStatus: 409, message: "Verified PipraPay metadata contains an invalid subscription reference.", payment };
    }
    subscription = await Subscription.findById(metadataSubscriptionId);
  }
  if (!subscription) {
    // Secure fallback: only use the pp_id that was already stored when the charge was created.
    subscription = await Subscription.findOne({ invoiceId: normalizedPpId, paymentProvider: "PipraPay" });
  }

  if (!subscription) {
    return {
      ok: false,
      httpStatus: 404,
      message: "No subscription order is linked to this PipraPay payment. Contact support with your pp_id.",
      payment,
    };
  }

  if (expectedSubscriptionId && String(subscription._id) !== expectedSubscriptionId) {
    return { ok: false, httpStatus: 409, message: "This payment does not match the subscription checkout you started.", payment };
  }
  if (!metadataSubscriptionId && String(subscription.invoiceId || "") !== normalizedPpId) {
    return { ok: false, httpStatus: 409, message: "Verified PipraPay metadata is missing and the payment ID was not pre-linked to this order.", payment };
  }
  if (String(subscription.paymentProvider || "") !== "PipraPay") {
    return { ok: false, httpStatus: 409, message: "This subscription was not created for PipraPay.", payment };
  }
  if (expectedUserId && String(subscription.userId) !== expectedUserId) {
    return { ok: false, httpStatus: 403, message: "This payment does not belong to the logged-in user.", payment };
  }
  if (metadataUserId && String(subscription.userId) !== metadataUserId) {
    return { ok: false, httpStatus: 409, message: "Verified payment metadata does not match the subscription owner.", payment };
  }
  if (metadataPlanId && metadataPlanId !== String(subscription.planId)) {
    return { ok: false, httpStatus: 409, message: "Verified payment metadata does not match the subscription plan.", payment };
  }
  if (subscription.invoiceId && String(subscription.invoiceId) !== normalizedPpId) {
    return { ok: false, httpStatus: 409, message: "This PipraPay payment ID is already linked to a different payment attempt.", payment };
  }

  const currency = String(payment.currency || "").trim().toUpperCase();
  if (currency !== "BDT") {
    return { ok: false, httpStatus: 409, message: "The verified payment currency is not BDT.", payment };
  }

  const paidAmount = Number(payment.amount);
  const expectedAmount = Number(subscription.amount);
  if (!Number.isFinite(paidAmount) || !Number.isFinite(expectedAmount) || Math.round(paidAmount * 100) !== Math.round(expectedAmount * 100)) {
    return { ok: false, httpStatus: 409, message: "Verified payment amount does not match the selected subscription price.", payment };
  }

  if (subscription.paymentStatus === "COMPLETED" && subscription.accessStatus === "ACTIVE") {
    return {
      ok: true,
      httpStatus: 200,
      alreadyCompleted: true,
      message: "This PipraPay payment has already been verified and subscription access is active.",
      payment,
      subscription: resultSubscription(subscription),
    };
  }

  if (subscription.paymentStatus !== "PENDING" || subscription.accessStatus !== "PENDING") {
    return { ok: false, httpStatus: 409, message: "This subscription payment is no longer pending.", payment };
  }

  const days = getSubscriptionDurationDays(String(subscription.planId));
  if (!days) {
    return { ok: false, httpStatus: 409, message: "Unknown subscription plan duration.", payment };
  }

  const now = new Date();
  const activeSubscription = await Subscription.findOne({
    userId: subscription.userId,
    _id: { $ne: subscription._id },
    paymentStatus: "COMPLETED",
    accessStatus: "ACTIVE",
    expiresAt: { $gt: now },
  }).sort({ expiresAt: -1 }).select("expiresAt").lean();

  const currentExpiry = activeSubscription?.expiresAt ? new Date(activeSubscription.expiresAt) : null;
  const startedAt = currentExpiry && currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
  const expiresAt = new Date(startedAt);
  expiresAt.setDate(expiresAt.getDate() + days);
  const transactionId = String(payment.transaction_id || payment.transactionId || "").trim();
  const paymentMethod = String(payment.payment_method || payment.paymentMethod || payment.gateway || "PipraPay").trim();
  const senderNumber = String(payment.sender_number || payment.senderNumber || payment.sender || "").trim();

  const activated = await Subscription.findOneAndUpdate(
    {
      _id: subscription._id,
      paymentProvider: "PipraPay",
      paymentStatus: "PENDING",
      accessStatus: "PENDING",
    },
    {
      $set: {
        invoiceId: normalizedPpId,
        transactionId,
        paymentMethod,
        senderNumber,
        paymentStatus: "COMPLETED",
        accessStatus: "ACTIVE",
        reviewStatus: "APPROVED",
        reviewedAt: now,
        reviewedBy: "PipraPay automatic verification",
        reviewNote: "Automatically activated after successful server-side PipraPay verification.",
        startedAt,
        expiresAt,
      },
    },
    { new: true },
  );

  if (!activated) {
    const latest = await Subscription.findById(subscription._id);
    if (latest?.paymentStatus === "COMPLETED" && latest?.accessStatus === "ACTIVE" && String(latest.invoiceId) === normalizedPpId) {
      return {
        ok: true,
        httpStatus: 200,
        alreadyCompleted: true,
        message: "This PipraPay payment has already been verified and subscription access is active.",
        payment,
        subscription: resultSubscription(latest),
      };
    }
    return { ok: false, httpStatus: 409, message: "The subscription was updated by another request. Refresh and check its status.", payment };
  }

  return {
    ok: true,
    httpStatus: 200,
    message: "PipraPay payment verified and subscription access activated.",
    payment,
    subscription: resultSubscription(activated),
  };
}
