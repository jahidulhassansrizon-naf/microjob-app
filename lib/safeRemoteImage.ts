import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Security helpers for routes that accept an image URL or an uploaded image.
 *
 *  - isTrustedImageUrl(): only allows image links from this site and from Cloudinary.
 *  - safeFetchImage():    fetches such a link on the server without letting it reach
 *                         private/internal addresses (SSRF), without following redirects
 *                         blindly, and with a size limit.
 *  - upload size limit:   MAX_UPLOAD_BYTES (20 MB by default, set MAX_UPLOAD_MB to change).
 */

const isProduction = process.env.NODE_ENV === "production";

const configuredMb = Number(process.env.MAX_UPLOAD_MB);
export const MAX_UPLOAD_BYTES =
  Number.isFinite(configuredMb) && configuredMb > 0
    ? Math.floor(configuredMb * 1024 * 1024)
    : 20 * 1024 * 1024;

export const MAX_UPLOAD_LABEL = `${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB`;

export class UserFacingError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UserFacingError";
    this.status = status;
  }
}

/** Rejects early when the browser says the request body is clearly too big. */
export function assertRequestSizeOk(req: Request, extraBytes = 1024 * 1024) {
  const header = req.headers.get("content-length");
  if (!header) return;
  const length = Number(header);
  if (Number.isFinite(length) && length > MAX_UPLOAD_BYTES + extraBytes) {
    throw new UserFacingError(
      `Image is too large. Please use an image smaller than ${MAX_UPLOAD_LABEL}.`,
      413,
    );
  }
}

export function assertFileSizeOk(sizeInBytes: number) {
  if (sizeInBytes > MAX_UPLOAD_BYTES) {
    throw new UserFacingError(
      `Image is too large. Please use an image smaller than ${MAX_UPLOAD_LABEL}.`,
      413,
    );
  }
}

// ---------------------------------------------------------------------------
// Trusted hosts
// ---------------------------------------------------------------------------

function hostFromEnvValue(value: string | undefined): string | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function getTrustedHosts(requestUrl?: string): Set<string> {
  const hosts = new Set<string>();

  for (const value of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
  ]) {
    const host = hostFromEnvValue(value);
    if (host) hosts.add(host);
  }

  // The site the request itself came to (the templates live in /public of this site).
  const requestHost = hostFromEnvValue(requestUrl);
  if (requestHost) hosts.add(requestHost);

  return hosts;
}

function isCloudinaryHost(hostname: string) {
  return hostname === "res.cloudinary.com" || hostname.endsWith(".res.cloudinary.com");
}

/**
 * Returns the parsed URL when it is an http(s) link to this site or to Cloudinary,
 * otherwise null. No network access happens here.
 */
export function isTrustedImageUrl(raw: string, requestUrl?: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && !isProduction)) {
    return null;
  }

  // No user:pass@host tricks.
  if (parsed.username || parsed.password) return null;

  // In production only the normal HTTPS port is allowed.
  if (isProduction && parsed.port && parsed.port !== "443") return null;

  const hostname = parsed.hostname.toLowerCase();

  // Raw IP addresses are never trusted in production.
  if (isIP(hostname) && isProduction) return null;

  if (isCloudinaryHost(hostname)) return parsed;
  if (getTrustedHosts(requestUrl).has(hostname)) return parsed;

  return null;
}

// ---------------------------------------------------------------------------
// Private address blocking
// ---------------------------------------------------------------------------

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, cloud metadata (169.254.169.254)
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast and reserved
  );
}

function isPrivateIp(ip: string): boolean {
  const lower = ip.toLowerCase();

  if (isIP(lower) === 4) return isPrivateIPv4(lower);

  // IPv6
  if (lower === "::" || lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  if (/^fe[89ab]/.test(lower)) return true; // link-local
  if (lower.startsWith("ff")) return true; // multicast

  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);

  return false;
}

async function assertPublicHost(hostname: string) {
  // Local development: allow the site to fetch its own images from localhost.
  if (!isProduction && (hostname === "localhost" || hostname === "127.0.0.1")) return;

  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new UserFacingError("The image link could not be reached.");
  }

  if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new UserFacingError("This image link is not allowed.");
  }
}

// ---------------------------------------------------------------------------
// Safe fetch
// ---------------------------------------------------------------------------

type SafeFetchOptions = {
  requestUrl?: string;
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
};

export async function safeFetchImage(
  rawUrl: string,
  options: SafeFetchOptions = {},
): Promise<{ blob: Blob; contentType: string }> {
  const maxBytes = options.maxBytes ?? MAX_UPLOAD_BYTES;
  const timeoutMs = options.timeoutMs ?? 20_000;
  const maxRedirects = options.maxRedirects ?? 3;

  let current = isTrustedImageUrl(rawUrl, options.requestUrl);
  if (!current) {
    throw new UserFacingError("This image link is not allowed.");
  }

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    await assertPublicHost(current.hostname.toLowerCase());

    const response = await fetch(current.toString(), {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    // Follow redirects ourselves, checking every hop again.
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new UserFacingError("The image link could not be loaded.");

      let next: string;
      try {
        next = new URL(location, current).toString();
      } catch {
        throw new UserFacingError("The image link could not be loaded.");
      }

      const trusted = isTrustedImageUrl(next, options.requestUrl);
      if (!trusted) throw new UserFacingError("This image link is not allowed.");
      current = trusted;
      continue;
    }

    if (!response.ok) {
      throw new UserFacingError(`Could not fetch the image (${response.status}).`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      throw new UserFacingError("The link does not point to an image.");
    }

    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      throw new UserFacingError("The image is too large.", 413);
    }

    // Read the body in pieces so a huge file is cut off early.
    const reader = response.body?.getReader();
    if (!reader) throw new UserFacingError("The image is empty.");

    const chunks: Uint8Array[] = [];
    let total = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new UserFacingError("The image is too large.", 413);
      }
      chunks.push(value);
    }

    if (!total) throw new UserFacingError("The image is empty.");

    return {
      blob: new Blob(chunks as BlobPart[], { type: contentType }),
      contentType,
    };
  }

  throw new UserFacingError("The image link redirected too many times.");
}
