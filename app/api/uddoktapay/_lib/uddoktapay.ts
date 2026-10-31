import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import UddoktaPaySettings from "@/models/UddoktaPaySettings";
import { decryptUddoktaPayApiKey } from "@/lib/serverPipraPaySettings";
import { SUBSCRIPTION_PLAN_BY_ID } from "@/app/_lib/subscriptionPlans";

type ProviderRecord = Record<string, any>;
type RuntimeConfig = {
  baseUrl: string;
  apiKey: string;
  configured: boolean;
  enabled: boolean;
};

export type UddoktaPayCheckoutInput = {
  fullName: string;
  email: string;
  amount: number;
  metadata: ProviderRecord;
  redirectUrl: string;
  cancelUrl: string;
  webhookUrl: string;
};

export type UddoktaPayCheckoutResult = {
  providerOk: boolean;
  httpStatus: number;
  checkoutUrl: string;
  message: string;
  payload?: ProviderRecord;
};

export type UddoktaPayVerificationResult = {
  providerOk: boolean;
  httpStatus: number;
  payment: ProviderRecord | null;
  message: string;
};

export type UddoktaPayActivationResult = {
  ok: boolean;
  httpStatus: number;
  paymentStatus?: string;
  message: string;
  payment?: ProviderRecord;
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

export async function getUddoktaPayConfig(): Promise<RuntimeConfig> {
  await connectDB();
  const saved = await UddoktaPaySettings.findOne({ key: "primary" })
    .select("+apiKeyEncrypted baseUrl enabled")
    .lean();

  const baseUrl = String(saved?.baseUrl || "").trim().replace(/\/+$/, "");
  let apiKey = "";
  if (saved?.apiKeyEncrypted) {
    try {
      apiKey = decryptUddoktaPayApiKey(saved.apiKeyEncrypted).trim();
    } catch {
      throw new Error("The saved UddoktaPay API key could not be decrypted. Save the API key again in Admin settings.");
    }
  }
  return {
    baseUrl,
    apiKey,
    configured: Boolean(baseUrl && apiKey),
    enabled: Boolean(saved?.enabled),
  };
}

function isHttpsUrl(value: string): boolean {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function unwrap(payload: ProviderRecord): ProviderRecord {
  const data = payload?.data && typeof payload.data === "object" ? payload.data : {};
  const nested = data?.data && typeof data.data === "object" ? data.data : {};
  return { ...payload, ...data, ...nested };
}

async function parseResponse(response: Response): Promise<{ payload: ProviderRecord; record: ProviderRecord }> {
  const raw = await response.text();
  let payload: ProviderRecord = {};
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) payload = parsed;
  } catch {
    payload = { message: raw.slice(0, 500) };
  }
  return { payload, record: unwrap(payload) };
}

export async function createUddoktaPayCheckout(input: UddoktaPayCheckoutInput): Promise<UddoktaPayCheckoutResult> {
  const config = await getUddoktaPayConfig();
  if (!config.configured || !config.apiKey) {
    return { providerOk: false, httpStatus: 503, checkoutUrl: "", message: "Save the UddoktaPay Hosted Domain and API Key in Admin → Payment Gateway first." };
  }
  if (!config.enabled) {
    return { providerOk: false, httpStatus: 503, checkoutUrl: "", message: "UddoktaPay checkout is disabled. An administrator must test and enable it first." };
  }
  if (!String(input.fullName || "").trim() || !String(input.email || "").trim() || !Number.isFinite(input.amount) || input.amount <= 0) {
    return { providerOk: false, httpStatus: 400, checkoutUrl: "", message: "UddoktaPay requires a customer name, email and a positive amount." };
  }
  if (![input.redirectUrl, input.cancelUrl, input.webhookUrl].every(isHttpsUrl)) {
    return { providerOk: false, httpStatus: 400, checkoutUrl: "", message: "UddoktaPay callback and webhook URLs must use HTTPS." };
  }

  const requestBody = {
    full_name: String(input.fullName).trim(),
    email: String(input.email).trim(),
    amount: Number(input.amount).toFixed(2),
    metadata: input.metadata,
    redirect_url: input.redirectUrl,
    return_type: "GET",
    cancel_url: input.cancelUrl,
    webhook_url: input.webhookUrl,
  };

  const response = await fetch(`${config.baseUrl}/api/checkout-v2`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "RT-UDDOKTAPAY-API-KEY": config.apiKey,
    },
    body: JSON.stringify(requestBody),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const { payload, record } = await parseResponse(response);
  const rawUrl = String(record.payment_url || record.checkout_url || record.url || "").trim();
  let checkoutUrl = "";
  if (isHttpsUrl(rawUrl)) {
    try {
      const returned = new URL(rawUrl);
      const expected = new URL(config.baseUrl);
      // The hosted payment URL should remain on the configured UddoktaPay host.
      if (returned.hostname.toLowerCase() === expected.hostname.toLowerCase()) checkoutUrl = returned.toString();
    } catch { /* Keep blank and fail closed. */ }
  }
  const accepted = record.status === true || record.success === true || payload.status === true || payload.success === true;
  const providerOk = response.ok && accepted && Boolean(checkoutUrl);
  return {
    providerOk,
    httpStatus: response.status,
    checkoutUrl,
    payload: record,
    message: String(record.message || payload.message || "").trim() ||
      (!response.ok ? `UddoktaPay checkout request failed (${response.status}).` : !accepted ? "UddoktaPay did not accept the checkout request." : !checkoutUrl ? "UddoktaPay did not return a secure payment URL on its configured host." : "UddoktaPay checkout created."),
  };
}

export async function verifyUddoktaPayPayment(invoiceId: string): Promise<UddoktaPayVerificationResult> {
  const config = await getUddoktaPayConfig();
  if (!config.configured || !config.apiKey) {
    return { providerOk: false, httpStatus: 503, payment: null, message: "UddoktaPay is not configured." };
  }
  const normalized = String(invoiceId || "").trim();
  if (!normalized || normalized.length > 180) {
    return { providerOk: false, httpStatus: 400, payment: null, message: "A valid UddoktaPay invoice_id is required." };
  }
  const response = await fetch(`${config.baseUrl}/api/verify-payment`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "RT-UDDOKTAPAY-API-KEY": config.apiKey,
    },
    body: JSON.stringify({ invoice_id: normalized }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const { payload, record } = await parseResponse(response);
  const message = String(record.message || payload.message || "").trim();
  const authDenied = response.status === 401 || response.status === 403 || /invalid api key|unauthorized|authentication failed/i.test(message);
  return {
    providerOk: response.ok && !authDenied && Boolean(record.status),
    httpStatus: response.status,
    payment: record,
    message: message || (response.ok ? "UddoktaPay verification response received." : `UddoktaPay verification failed (${response.status}).`),
  };
}

function parseMetadata(value: unknown): ProviderRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as ProviderRecord;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as ProviderRecord;
    } catch { /* invalid metadata */ }
  }
  return {};
}

function getDurationDays(planId: string): number {
  const plan = SUBSCRIPTION_PLAN_BY_ID[planId as keyof typeof SUBSCRIPTION_PLAN_BY_ID];
  if (plan?.days) return plan.days;
  return planId === "3-month" ? 90 : 0;
}

function asSubscription(subscription: any) {
  return {
    id: String(subscription._id),
    planId: String(subscription.planId),
    planName: String(subscription.planName),
    accessStatus: String(subscription.accessStatus),
    paymentStatus: String(subscription.paymentStatus),
    startedAt: subscription.startedAt || null,
    expiresAt: subscription.expiresAt || null,
  };
}

/** Only a successful server-side verify response may activate a UddoktaPay subscription. */
export async function verifyAndActivateUddoktaPaySubscription(
  invoiceId: string,
  options?: { expectedUserId?: string; expectedSubscriptionId?: string },
): Promise<UddoktaPayActivationResult> {
  const normalizedInvoiceId = String(invoiceId || "").trim();
  if (!normalizedInvoiceId || normalizedInvoiceId.length > 180) {
    return { ok: false, httpStatus: 400, message: "A valid UddoktaPay invoice_id is required." };
  }

  const provider = await verifyUddoktaPayPayment(normalizedInvoiceId);
  if (!provider.providerOk || !provider.payment) {
    return { ok: false, httpStatus: provider.httpStatus >= 500 ? 503 : provider.httpStatus, message: provider.message, payment: provider.payment || undefined };
  }
  const payment = provider.payment;
  const status = String(payment.status || "").trim().toUpperCase();
  if (status !== "COMPLETED") {
    return {
      ok: false,
      httpStatus: 200,
      paymentStatus: status || "UNKNOWN",
      message: status === "PENDING" ? "UddoktaPay still reports this payment as pending." : status === "ERROR" ? "UddoktaPay reports that this payment is not completed." : "UddoktaPay has not confirmed this payment as completed.",
      payment,
    };
  }

  const returnedInvoiceId = String(payment.invoice_id || "").trim();
  if (!returnedInvoiceId || returnedInvoiceId !== normalizedInvoiceId) {
    return { ok: false, httpStatus: 409, message: "Verified UddoktaPay invoice_id does not match the submitted invoice_id.", payment };
  }

  const metadata = parseMetadata(payment.metadata);
  const metadataSubscriptionId = String(metadata.subscription_id || metadata.subscriptionId || "").trim();
  const metadataUserId = String(metadata.user_id || metadata.userId || "").trim();
  const metadataPlanId = String(metadata.plan_id || metadata.planId || "").trim();
  const metadataCurrency = String(metadata.currency || "").trim().toUpperCase();
  const expectedUserId = String(options?.expectedUserId || "").trim();
  const expectedSubscriptionId = String(options?.expectedSubscriptionId || "").trim();

  if (!metadataSubscriptionId || !metadataUserId || !metadataPlanId || metadataCurrency !== "BDT") {
    return { ok: false, httpStatus: 409, message: "Verified UddoktaPay metadata is incomplete or does not identify the expected BDT subscription.", payment };
  }
  if (expectedSubscriptionId && metadataSubscriptionId !== expectedSubscriptionId) {
    return { ok: false, httpStatus: 409, message: "Payment metadata does not match the selected subscription.", payment };
  }
  if (!mongoose.isValidObjectId(metadataSubscriptionId)) {
    return { ok: false, httpStatus: 409, message: "Verified UddoktaPay metadata contains an invalid subscription reference.", payment };
  }

  await connectDB();
  const subscription: any = await Subscription.findById(metadataSubscriptionId);
  if (!subscription || String(subscription.paymentProvider || "") !== "UddoktaPay") {
    return { ok: false, httpStatus: 404, message: "No UddoktaPay subscription order is linked to this invoice.", payment };
  }
  if (expectedUserId && String(subscription.userId) !== expectedUserId) {
    return { ok: false, httpStatus: 403, message: "This UddoktaPay payment does not belong to the logged-in user.", payment };
  }
  if (String(subscription.userId) !== metadataUserId || String(subscription.planId) !== metadataPlanId) {
    return { ok: false, httpStatus: 409, message: "Verified payment metadata does not match the subscription owner or plan.", payment };
  }
  if (subscription.invoiceId && String(subscription.invoiceId) !== normalizedInvoiceId) {
    return { ok: false, httpStatus: 409, message: "This UddoktaPay invoice is already linked to a different payment attempt.", payment };
  }

  const paidAmount = Number(payment.amount);
  const expectedAmount = Number(subscription.amount);
  if (!Number.isFinite(paidAmount) || !Number.isFinite(expectedAmount) || Math.round(paidAmount * 100) !== Math.round(expectedAmount * 100)) {
    return { ok: false, httpStatus: 409, message: "Verified UddoktaPay amount does not match the selected subscription price.", payment };
  }

  if (subscription.paymentStatus === "COMPLETED" && subscription.accessStatus === "ACTIVE" && String(subscription.invoiceId) === normalizedInvoiceId) {
    return { ok: true, httpStatus: 200, alreadyCompleted: true, message: "This UddoktaPay payment has already been verified and subscription access is active.", payment, subscription: asSubscription(subscription) };
  }
  if (subscription.paymentStatus !== "PENDING" || subscription.accessStatus !== "PENDING") {
    return { ok: false, httpStatus: 409, message: "This subscription payment is no longer pending.", payment };
  }

  const days = getDurationDays(String(subscription.planId));
  if (!days) return { ok: false, httpStatus: 409, message: "Unknown subscription plan duration.", payment };

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
  const paymentMethod = String(payment.payment_method || "UddoktaPay").trim();
  const senderNumber = String(payment.sender_number || "").trim();
  const activated = await Subscription.findOneAndUpdate(
    { _id: subscription._id, paymentProvider: "UddoktaPay", paymentStatus: "PENDING", accessStatus: "PENDING", $or: [{ invoiceId: "" }, { invoiceId: normalizedInvoiceId }] },
    { $set: {
      invoiceId: normalizedInvoiceId,
      transactionId,
      paymentMethod,
      senderNumber,
      paymentStatus: "COMPLETED",
      accessStatus: "ACTIVE",
      reviewStatus: "APPROVED",
      reviewedAt: now,
      reviewedBy: "UddoktaPay automatic verification",
      reviewNote: "Automatically activated after successful server-side UddoktaPay verification.",
      startedAt,
      expiresAt,
    } },
    { new: true },
  );
  if (!activated) {
    const latest: any = await Subscription.findById(subscription._id);
    if (latest?.paymentStatus === "COMPLETED" && latest?.accessStatus === "ACTIVE" && String(latest.invoiceId) === normalizedInvoiceId) {
      return { ok: true, httpStatus: 200, alreadyCompleted: true, message: "This UddoktaPay payment was already applied.", payment, subscription: asSubscription(latest) };
    }
    return { ok: false, httpStatus: 409, message: "The subscription was updated by another request. Refresh and check its status.", payment };
  }
  return { ok: true, httpStatus: 200, message: "UddoktaPay payment verified and subscription access activated.", payment, subscription: asSubscription(activated) };
}

export async function testUddoktaPayConnection() {
  const config = await getUddoktaPayConfig();
  if (!config.configured) return { success: false, status: "not-configured", message: "Save the UddoktaPay Hosted Domain and API Key before testing." };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);
  try {
    const response = await fetch(`${config.baseUrl}/api/verify-payment`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", "RT-UDDOKTAPAY-API-KEY": config.apiKey },
      body: JSON.stringify({ invoice_id: "SEBALAGBE-TEST-NOT-A-REAL-INVOICE" }),
      cache: "no-store",
      signal: controller.signal,
    });
    const { payload, record } = await parseResponse(response);
    const message = String(record.message || payload.message || "").trim();
    const authDenied = response.status === 401 || response.status === 403 || /unauthorized|invalid api key|authentication failed/i.test(message);
    // UddoktaPay installations may describe a deliberately invalid dummy invoice as
    // "Invalid Payment ID" rather than mentioning "invoice". Treat only an explicit
    // invalid/missing invoice/payment-id error (with provider status ERROR) as the
    // expected safe probe rejection; do not treat arbitrary HTTP 200 responses as success.
    const dummyRejected = /invoice.*(not found|invalid|does not exist)|(not found|invalid|does not exist).*invoice|payment\s*id.*(not found|invalid|does not exist)|(not found|invalid|does not exist).*payment\s*id/i.test(message)
      && String(record.status || "").toUpperCase() === "ERROR"
      && [200, 400, 404, 422].includes(response.status);
    if (!authDenied && dummyRejected) {
      return { success: true, status: "connected", httpStatus: response.status, message: "UddoktaPay API connection confirmed. The dummy invoice was rejected as expected; no real payment was created." };
    }
    return { success: false, status: authDenied ? "auth-denied" : "unconfirmed", httpStatus: response.status, message: authDenied ? "UddoktaPay rejected the API key. Check that the key is active and has payment:verify permission." : `UddoktaPay responded, but the verification probe was inconclusive (HTTP ${response.status}). ${message}`.trim() };
  } catch (error) {
    const aborted = error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
    return { success: false, status: aborted ? "timeout" : "connection-error", message: aborted ? "UddoktaPay did not respond within 18 seconds." : "Could not connect to UddoktaPay. Check its HTTPS domain, DNS and server availability." };
  } finally {
    clearTimeout(timeout);
  }
}
