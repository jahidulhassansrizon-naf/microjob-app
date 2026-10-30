import { createHash, randomBytes } from "node:crypto";
import AuthRateLimit from "@/models/AuthRateLimit";

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

function getRateLimitSecret(): string {
  const configuredSecret = process.env.AUTH_RATE_LIMIT_SECRET?.trim() || process.env.JWT_SECRET?.trim();
  if (!configuredSecret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_RATE_LIMIT_SECRET or JWT_SECRET must be configured in production.");
  }
  return configuredSecret || "local-rate-limit-fallback";
}

/**
 * Cross-instance fixed-window rate limiter backed by MongoDB. Client IPs are
 * hashed with a server secret before being stored, so raw IPs are not persisted.
 */
export async function enforceAuthRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
  subject?: string,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs);
  const windowEnd = (windowStart + 1) * windowMs;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const remoteIp = request.headers.get("x-real-ip")?.trim() || forwarded || "unknown";
  const secret = getRateLimitSecret();
  const rateLimitIdentity = typeof subject === "string" && subject.trim()
    ? `subject:${subject.trim().toLowerCase()}`
    : `ip:${remoteIp}`;
  const identityFingerprint = createHash("sha256")
    .update(`${secret}\u0000${scope}\u0000${rateLimitIdentity}`)
    .digest("hex")
    .slice(0, 40);
  const key = `${scope}:${identityFingerprint}:${windowStart}`;
  const expiresAt = new Date(windowEnd + windowMs);

  let count = 0;
  try {
    const record = await AuthRateLimit.findOneAndUpdate(
      { key },
      { $setOnInsert: { key, expiresAt }, $inc: { count: 1 } },
      { upsert: true, new: true },
    ).select("count").lean();
    count = Number(record?.count || 0);
  } catch (error) {
    // Concurrent upserts can race on the unique key. Re-run as an update once.
    if (!error || typeof error !== "object" || (error as { code?: unknown }).code !== 11000) throw error;
    const record = await AuthRateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 } },
      { new: true },
    ).select("count").lean();
    count = Number(record?.count || 0);
  }

  if (count <= limit) return { allowed: true };
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - now) / 1000)),
  };
}


export type CooldownResult = { allowed: true; leaseToken: string } | { allowed: false; retryAfterSeconds: number };

/** Atomically claims a short per-identifier cooldown without storing the raw email/phone. */
export async function claimAuthCooldown(
  scope: string,
  identifier: string,
  cooldownMs: number,
): Promise<CooldownResult> {
  const nowMs = Date.now();
  const now = new Date(nowMs);
  const expiresAt = new Date(nowMs + cooldownMs);
  const secret = getRateLimitSecret();
  const fingerprint = createHash("sha256")
    .update(`${secret}\u0000${scope}\u0000${identifier.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 40);
  const key = `cooldown:${scope}:${fingerprint}`;
  const leaseToken = randomBytes(18).toString("base64url");

  const refreshed = await AuthRateLimit.findOneAndUpdate(
    { key, expiresAt: { $lte: now } },
    { $set: { expiresAt, count: 1, leaseToken } },
    { new: true },
  ).select("expiresAt leaseToken").lean();
  if (refreshed) return { allowed: true, leaseToken };

  try {
    await AuthRateLimit.create({ key, count: 1, expiresAt, leaseToken });
    return { allowed: true, leaseToken };
  } catch (error) {
    if (!error || typeof error !== "object" || (error as { code?: unknown }).code !== 11000) throw error;
    const existing = await AuthRateLimit.findOne({ key }).select("expiresAt").lean();
    const remaining = existing?.expiresAt instanceof Date
      ? existing.expiresAt.getTime() - nowMs
      : existing?.expiresAt
        ? new Date(existing.expiresAt).getTime() - nowMs
        : cooldownMs;
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(remaining / 1000)) };
  }
}

/** Releases only the caller's cooldown lease, never a later request's lease. */
export async function releaseAuthCooldown(scope: string, identifier: string, leaseToken: string): Promise<void> {
  const secret = getRateLimitSecret();
  const fingerprint = createHash("sha256")
    .update(`${secret}\u0000${scope}\u0000${identifier.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 40);
  await AuthRateLimit.deleteOne({ key: `cooldown:${scope}:${fingerprint}`, leaseToken });
}
