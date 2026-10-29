type TransactionalEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type ProviderResult = { provider: "resend" | "google-apps-script"; messageId?: string };

const EMAIL_TIMEOUT_MS = 12_000;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 300);
  return "Unknown email provider error";
}

function parseProviderBody(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function providerReportedFailure(body: Record<string, unknown> | null, raw: string): boolean {
  if (body) {
    if (body.success === false || body.ok === false || body.error) return true;
    const status = String(body.status ?? body.result ?? "").toLowerCase();
    if (["error", "failed", "failure"].includes(status)) return true;
  }

  // Apps Script can return a login/error HTML page with HTTP 200 after a redirect.
  // Treat those pages as provider failures instead of reporting a false success.
  return /exception:|script function not found|authorization required|service invoked too many times|cannot call mailapp|permission denied|execution failed|failed to send|could not send|unable to send|recipient address rejected|invalid email|not authorized|<\s*!doctype html|<\s*html\b|accounts\.google\.com|sign in to continue/i.test(raw);
}

async function sendWithResend(email: TransactionalEmail): Promise<ProviderResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) throw new Error("Resend email provider is not fully configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
  });

  const raw = (await response.text()).slice(0, 4_000);
  const body = parseProviderBody(raw);
  if (!response.ok || providerReportedFailure(body, raw)) {
    throw new Error(`Resend rejected the email (HTTP ${response.status}).`);
  }

  return {
    provider: "resend",
    messageId: typeof body?.id === "string" ? body.id : undefined,
  };
}

async function sendWithGoogleAppsScript(email: TransactionalEmail): Promise<ProviderResult> {
  const endpoint = process.env.GOOGLE_SCRIPT_URL?.trim();
  if (!endpoint) throw new Error("No transactional email provider is configured.");

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(endpoint);
  } catch {
    throw new Error("GOOGLE_SCRIPT_URL is not a valid URL.");
  }
  if (parsedUrl.protocol !== "https:") {
    throw new Error("GOOGLE_SCRIPT_URL must use HTTPS.");
  }

  const response = await fetch(parsedUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/plain, */*" },
    body: JSON.stringify({
      email: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
  });

  const raw = (await response.text()).slice(0, 4_000);
  const body = parseProviderBody(raw);
  if (!response.ok || providerReportedFailure(body, raw)) {
    throw new Error(`Google Apps Script rejected the email (HTTP ${response.status}).`);
  }

  return { provider: "google-apps-script" };
}

/**
 * Deliver transactional email through configured providers. Resend is preferred
 * when explicitly configured; Apps Script remains the compatible existing path.
 * The result means a provider accepted the request, not that the recipient's inbox
 * has guaranteed delivery (which depends on recipient filtering and sender reputation).
 */
export async function sendTransactionalEmail(email: TransactionalEmail): Promise<ProviderResult> {
  const to = email.to.trim().toLowerCase();
  if (!to || to.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) {
    throw new Error("Invalid recipient email address.");
  }
  if (!email.subject.trim() || email.subject.length > 180) {
    throw new Error("Invalid transactional email subject.");
  }

  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
  const hasGoogleScript = Boolean(process.env.GOOGLE_SCRIPT_URL?.trim());
  const providers: Array<() => Promise<ProviderResult>> = [];
  if (hasResend) providers.push(() => sendWithResend({ ...email, to }));
  if (hasGoogleScript) providers.push(() => sendWithGoogleAppsScript({ ...email, to }));

  if (providers.length === 0) {
    throw new Error("Email delivery is not configured. Set GOOGLE_SCRIPT_URL or RESEND_API_KEY plus EMAIL_FROM.");
  }

  const errors: string[] = [];
  for (const send of providers) {
    try {
      return await send();
    } catch (error) {
      errors.push(getErrorMessage(error));
    }
  }

  // Never include a one-time code, email body, API key, or credentials in this message.
  throw new Error(`All configured transactional email providers failed: ${errors.join("; ")}`);
}
