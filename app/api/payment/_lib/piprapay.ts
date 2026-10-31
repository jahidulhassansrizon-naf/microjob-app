import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import PipraPaySettings from "@/models/PipraPaySettings";
import { decryptPipraPayApiKey } from "@/lib/serverPipraPaySettings";
import { SUBSCRIPTION_PLAN_BY_ID } from "@/app/_lib/subscriptionPlans";

type PipraPayRuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  apiBaseUrl: string;
  configured: boolean;
  enabled: boolean;
};

/**
 * Load the active self-hosted PipraPay credentials from the encrypted Admin
 * settings record. Never fall back to a sandbox or a public environment key:
 * a missing/undecryptable database credential must fail closed.
 */
async function loadPipraPayRuntimeConfig(): Promise<PipraPayRuntimeConfig> {
  await connectDB();
  const saved = await PipraPaySettings.findOne({ key: "primary" })
    .select("+apiKeyEncrypted baseUrl enabled")
    .lean();

  const baseUrl = String(saved?.baseUrl || "").trim().replace(/\/+$/, "");
  const apiBaseUrl = baseUrl
    ? (baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`)
    : "";

  let apiKey = "";
  if (saved?.apiKeyEncrypted) {
    try {
      apiKey = decryptPipraPayApiKey(saved.apiKeyEncrypted).trim();
    } catch {
      throw new Error("The saved PipraPay API key could not be decrypted. Ask an administrator to save the API key again.");
    }
  }

  return {
    apiKey,
    baseUrl,
    apiBaseUrl,
    configured: Boolean(apiKey && apiBaseUrl),
    enabled: Boolean(saved?.enabled),
  };
}

export type PipraPayRecord = Record<string, any>;

export type CreatePipraPayCheckoutInput = {
  fullName: string;
  emailAddress: string;
  mobileNumber: string;
  amount: number;
  metadata: PipraPayRecord;
  returnUrl: string;
  webhookUrl: string;
};

export type CreatePipraPayCheckoutResult = {
  providerOk: boolean;
  httpStatus: number;
  ppId: string;
  checkoutUrl: string;
  payment: PipraPayRecord | null;
  message: string;
};

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

export async function getPipraPayConfig() {
  return loadPipraPayRuntimeConfig();
}

export async function getPipraPayApiKey() {
  const config = await loadPipraPayRuntimeConfig();
  return config.apiKey;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Create a hosted checkout using the current PipraPay redirect-checkout API.
 * The API key is only sent from this server; never call this helper in client code.
 */
export async function createPipraPayCheckout(
  input: CreatePipraPayCheckoutInput,
): Promise<CreatePipraPayCheckoutResult> {
  const config = await loadPipraPayRuntimeConfig();
  if (!config.configured || !config.apiKey) {
    return {
      providerOk: false,
      httpStatus: 503,
      ppId: "",
      checkoutUrl: "",
      payment: null,
      message: "PipraPay Base URL and API Key have not been saved in Admin Settings.",
    };
  }
  if (!config.enabled) {
    return {
      providerOk: false,
      httpStatus: 503,
      ppId: "",
      checkoutUrl: "",
      payment: null,
      message: "PipraPay payments are disabled until the connection is tested and enabled by an administrator.",
    };
  }

  const fullName = String(input.fullName || "").trim();
  const emailAddress = String(input.emailAddress || "").trim();
  const mobileNumber = String(input.mobileNumber || "").trim();
  const amount = Number(input.amount);
  if (!fullName || !emailAddress || !mobileNumber || !Number.isFinite(amount) || amount <= 0) {
    return {
      providerOk: false,
      httpStatus: 400,
      ppId: "",
      checkoutUrl: "",
      payment: null,
      message: "PipraPay checkout requires valid customer details and a positive amount.",
    };
  }
  if (!isHttpsUrl(input.returnUrl) || !isHttpsUrl(input.webhookUrl)) {
    return {
      providerOk: false,
      httpStatus: 400,
      ppId: "",
      checkoutUrl: "",
      payment: null,
      message: "PipraPay return and webhook URLs must use HTTPS.",
    };
  }

  // The current redirect-checkout API expects email and mobile separately.
  // Its documentation describes metadata as a JSON string.
  const requestBody = {
    full_name: fullName,
    email_address: emailAddress,
    mobile_number: mobileNumber,
    amount: amount.toFixed(2).replace(/\.00$/, ""),
    currency: "BDT",
    metadata: JSON.stringify(input.metadata || {}),
    return_url: input.returnUrl,
    webhook_url: input.webhookUrl,
  };

  const response = await fetch(`${config.apiBaseUrl}/checkout/redirect`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "MHS-PIPRAPAY-API-KEY": config.apiKey,
    },
    body: JSON.stringify(requestBody),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  const { payload, record } = await parseProviderResponse(response);
  const explicitlyRejected =
    payload?.success === false || payload?.status === false || record?.success === false || record?.status === false;
  const ppId = String(record?.pp_id || record?.ppId || record?.payment_id || "").trim();
  const rawCheckoutUrl = String(
    record?.checkout_url || record?.pp_url || record?.redirect_url || record?.payment_url || record?.url || "",
  ).trim();
  const checkoutUrl = isHttpsUrl(rawCheckoutUrl) ? rawCheckoutUrl : "";
  const providerOk = response.ok && !explicitlyRejected && Boolean(checkoutUrl);

  return {
    providerOk,
    httpStatus: response.status,
    ppId,
    checkoutUrl,
    payment: record,
    message:
      String(record?.message || payload?.message || "").trim() ||
      (!response.ok
        ? `PipraPay checkout request failed (${response.status}).`
        : explicitlyRejected
          ? "PipraPay rejected the checkout request."
          : !checkoutUrl
            ? "PipraPay did not return a valid HTTPS checkout URL."
            : "PipraPay checkout session created."),
  };
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
  const config = await loadPipraPayRuntimeConfig();
  if (!config.configured || !config.apiKey) {
    return {
      providerOk: false,
      httpStatus: 503,
      payment: null as PipraPayRecord | null,
      message: "PipraPay Base URL and API Key have not been saved in Admin Settings.",
    };
  }

  const response = await fetch(`${config.apiBaseUrl}/verify-payment`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "MHS-PIPRAPAY-API-KEY": config.apiKey,
    },
    body: JSON.stringify({ pp_id: ppId }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  const { payload, record } = await parseProviderResponse(response);
  const explicitlyRejected =
    payload?.success === false || payload?.status === false || record?.success === false || record?.status === false;

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
  const expectedUserId = String(options?.expectedUserId || "").trim();
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
  const transactionId = String(
    payment.transaction_id || payment.transactionId || payment.trx_id || payment.trxId || payment.trxID || "",
  ).trim();
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
