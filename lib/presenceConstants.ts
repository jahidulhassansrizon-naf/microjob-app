/** Client pings every 5 seconds. This grace period is for lost connections. */
export const PRESENCE_HEARTBEAT_INTERVAL_MS = 5_000;
export const PRESENCE_STALE_AFTER_MS = 20_000;
export const PRESENCE_SESSION_TTL_MS = 30_000;
export const PRESENCE_REDIS_CHANNEL = "sohojhub:presence:v1";
