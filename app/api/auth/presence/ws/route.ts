import { randomUUID } from "node:crypto";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import {
  experimental_upgradeWebSocket,
  type WebSocketData,
} from "@vercel/functions";
import { endPresenceSession, openPresenceSession, refreshPresenceSession } from "@/lib/presence";
import { PRESENCE_REDIS_CHANNEL } from "@/lib/presenceConstants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel closes WebSocket connections at the Function's configured max duration;
// clients reconnect with a fresh short-lived ticket when this limit is reached.
export const maxDuration = 300;

type PresenceTicketClaims = jwt.JwtPayload & {
  purpose?: string;
  role?: string;
  userId?: string;
  sessionId?: string;
};

type ValidScreenSignal =
  | { kind: "description"; value: { type: "offer" | "answer"; sdp: string } }
  | { kind: "candidate"; value: { candidate: string; sdpMid?: string | null; sdpMLineIndex?: number | null; usernameFragment?: string | null } };

const SESSION_ID_PATTERN = /^[a-zA-Z0-9._:-]{16,120}$/;
const USER_ID_PATTERN = /^[a-f\d]{24}$/i;
const SCREEN_STATUSES = new Set(["sharing", "not-sharing", "stopped", "denied", "requesting"]);

let signalPublisher: Redis | null = null;
function getSignalPublisher() {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  if (!signalPublisher || signalPublisher.status === "end") {
    signalPublisher = new Redis(url, {
      connectTimeout: 3_000,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => (attempt <= 3 ? Math.min(attempt * 250, 1_000) : null),
    });
    signalPublisher.on("error", (error) => {
      console.error("Live screen signaling publisher error:", error.message);
    });
  }
  return signalPublisher;
}

async function publishScreenEvent(event: Record<string, unknown>) {
  const publisher = getSignalPublisher();
  if (!publisher) return false;
  try {
    await publisher.publish(PRESENCE_REDIS_CHANNEL, JSON.stringify(event));
    return true;
  } catch (error) {
    console.error("Could not publish live screen event:", error);
    return false;
  }
}

function normalizeScreenSignal(value: unknown): ValidScreenSignal | null {
  if (!value || typeof value !== "object") return null;
  const signal = value as Record<string, any>;
  if (signal.kind === "description") {
    const description = signal.value;
    if (
      !description || typeof description !== "object" ||
      (description.type !== "offer" && description.type !== "answer") ||
      typeof description.sdp !== "string" || description.sdp.length > 48_000
    ) return null;
    return { kind: "description", value: { type: description.type, sdp: description.sdp } };
  }
  if (signal.kind === "candidate") {
    const candidate = signal.value;
    if (!candidate || typeof candidate !== "object") return null;
    if (typeof candidate.candidate !== "string" || candidate.candidate.length > 5_000) return null;
    const normalized: ValidScreenSignal["value"] = {
      candidate: candidate.candidate,
      ...(typeof candidate.sdpMid === "string" || candidate.sdpMid === null ? { sdpMid: candidate.sdpMid } : {}),
      ...(typeof candidate.sdpMLineIndex === "number" || candidate.sdpMLineIndex === null ? { sdpMLineIndex: candidate.sdpMLineIndex } : {}),
      ...(typeof candidate.usernameFragment === "string" || candidate.usernameFragment === null ? { usernameFragment: candidate.usernameFragment } : {}),
    };
    return { kind: "candidate", value: normalized as Extract<ValidScreenSignal, { kind: "candidate" }>['value'] };
  }
  return null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== requestUrl.host) {
        return new Response("Origin not allowed", { status: 403 });
      }
    } catch {
      return new Response("Invalid origin", { status: 403 });
    }
  }

  const secret = process.env.JWT_SECRET?.trim();
  const ticket = requestUrl.searchParams.get("ticket") || "";
  if (!secret || !ticket) return new Response("Missing presence ticket", { status: 401 });

  let claims: PresenceTicketClaims;
  try {
    claims = jwt.verify(ticket, secret, {
      issuer: "sohojhub",
      audience: "presence-ws",
    }) as PresenceTicketClaims;
  } catch {
    return new Response("Invalid or expired presence ticket", { status: 401 });
  }

  if (
    claims.purpose !== "sohojhub-presence" ||
    (claims.role !== "user" && claims.role !== "admin") ||
    typeof claims.userId !== "string" ||
    typeof claims.sessionId !== "string" ||
    !SESSION_ID_PATTERN.test(claims.sessionId)
  ) {
    return new Response("Invalid presence ticket claims", { status: 401 });
  }

  if (claims.role === "user" && !USER_ID_PATTERN.test(claims.userId)) {
    return new Response("Invalid user session", { status: 401 });
  }

  const redisUrl = process.env.REDIS_URL?.trim();
  // Preserve the existing admin fallback behavior when Redis is not configured.
  if (claims.role === "admin" && !redisUrl) {
    return experimental_upgradeWebSocket((ws) => {
      if (ws.readyState === 1) {
        try { ws.send(JSON.stringify({ type: "realtime-unavailable" })); } catch { /* closing */ }
        ws.close(1000, "Redis pub/sub is not configured; polling fallback is active");
      }
    });
  }

  return experimental_upgradeWebSocket((ws) => {
    let closed = false;
    const connectionId = randomUUID();
    let subscriber: Redis | null = null;
    let openingPresence: Promise<boolean> | null = null;

    const safelySend = (payload: unknown) => {
      if (ws.readyState === 1) {
        try { ws.send(JSON.stringify(payload)); } catch { /* connection may have closed */ }
      }
    };

    const handleRedisMessage = (channel: string, rawMessage: string) => {
      if (channel !== PRESENCE_REDIS_CHANNEL || closed || ws.readyState !== 1) return;
      let event: any;
      try { event = JSON.parse(rawMessage); } catch { return; }
      if (!event || typeof event.type !== "string") return;

      // Existing presence fan-out for the admin dashboard.
      if (event.type === "presence") {
        if (claims.role === "admin" && typeof event.userId === "string" && typeof event.isOnline === "boolean") {
          safelySend(event);
        }
        return;
      }

      // Screen-signaling messages are transient Redis Pub/Sub messages only.
      // User sockets receive only requests/signals addressed to their own tab.
      if (claims.role === "user" && event.audience === "users") {
        if (event.type === "screen-query") {
          safelySend({ type: "screen-query" });
          return;
        }
        if (
          event.targetSessionId === claims.sessionId &&
          (!event.targetUserId || event.targetUserId === claims.userId) &&
          ["screen-request", "screen-signal", "screen-stop"].includes(event.type)
        ) {
          safelySend(event);
        }
        return;
      }

      // Admin sockets receive shared status updates and signals only when addressed
      // to their own short-lived WebSocket session ID.
      if (claims.role === "admin" && event.audience === "admins") {
        if (typeof event.targetSessionId === "string" && event.targetSessionId !== claims.sessionId) return;
        if (["screen-status", "screen-signal"].includes(event.type)) safelySend(event);
      }
    };

    if (redisUrl) {
      subscriber = new Redis(redisUrl, {
        connectTimeout: 3_000,
        maxRetriesPerRequest: 1,
        retryStrategy: (attempt) => (attempt <= 3 ? Math.min(attempt * 250, 1_000) : null),
      });
      subscriber.on("error", (error) => {
        console.error("Presence/screen subscriber error:", error.message);
      });
      subscriber.on("message", handleRedisMessage);
      void subscriber.subscribe(PRESENCE_REDIS_CHANNEL).then(() => {
        safelySend({ type: "ready" });
      }).catch((error) => {
        console.error("Could not subscribe to live presence channel:", error);
        safelySend({ type: "realtime-unavailable" });
        if (claims.role === "admin" && ws.readyState === 1) ws.close(1011, "Realtime subscription unavailable");
      });
    } else {
      safelySend({ type: "realtime-unavailable" });
    }

    if (claims.role === "user") {
      openingPresence = openPresenceSession(claims.userId!, claims.sessionId!, connectionId)
        .then((exists) => {
          if (!exists && !closed) ws.close(1008, "User account was not found");
          else if (exists && !closed) safelySend({ type: "presence-ready" });
          return exists;
        })
        .catch((error) => {
          console.error("Could not start live presence session:", error);
          if (!closed) ws.close(1011, "Could not start presence tracking");
          return false;
        });
    }

    ws.on("message", (data: WebSocketData) => {
      const message = typeof data === "string" ? data : data.toString();
      if (message.length > 64_000) return;

      if (claims.role === "admin") {
        if (message === "ping") {
          safelySend({ type: "pong", at: Date.now() });
          return;
        }
        let payload: any;
        try { payload = JSON.parse(message); } catch { return; }
        if (!payload || typeof payload.type !== "string") return;

        if (payload.type === "screen-query") {
          void publishScreenEvent({ type: "screen-query", audience: "users" });
          return;
        }
        if (payload.type === "screen-request") {
          const targetSessionId = typeof payload.targetSessionId === "string" ? payload.targetSessionId : "";
          const targetUserId = typeof payload.targetUserId === "string" ? payload.targetUserId : "";
          if (!SESSION_ID_PATTERN.test(targetSessionId) || !USER_ID_PATTERN.test(targetUserId)) return;
          void publishScreenEvent({
            type: "screen-request",
            audience: "users",
            targetSessionId,
            targetUserId,
            adminSessionId: claims.sessionId,
          });
          return;
        }
        if (payload.type === "screen-signal") {
          const targetSessionId = typeof payload.toSessionId === "string" ? payload.toSessionId : "";
          const targetUserId = typeof payload.targetUserId === "string" ? payload.targetUserId : "";
          const signal = normalizeScreenSignal(payload.signal);
          if (!SESSION_ID_PATTERN.test(targetSessionId) || !USER_ID_PATTERN.test(targetUserId) || !signal) return;
          void publishScreenEvent({
            type: "screen-signal",
            audience: "users",
            targetSessionId,
            targetUserId,
            fromSessionId: claims.sessionId,
            signal,
          });
          return;
        }
        if (payload.type === "screen-stop") {
          const targetSessionId = typeof payload.toSessionId === "string" ? payload.toSessionId : "";
          const targetUserId = typeof payload.targetUserId === "string" ? payload.targetUserId : "";
          if (!SESSION_ID_PATTERN.test(targetSessionId) || !USER_ID_PATTERN.test(targetUserId)) return;
          void publishScreenEvent({
            type: "screen-stop",
            audience: "users",
            targetSessionId,
            targetUserId,
            fromSessionId: claims.sessionId,
          });
        }
        return;
      }

      if (message === "leave") {
        closed = true;
        void (openingPresence ?? Promise.resolve(true))
          .then(() => endPresenceSession(claims.userId!, claims.sessionId!, connectionId))
          .catch((error) => console.error("Could not end requested presence session:", error))
          .finally(() => { if (ws.readyState === 1) ws.close(1000, "Presence session ended"); });
        return;
      }
      if (message === "ping") {
        void (openingPresence ?? Promise.resolve(false))
          .then((opened) => {
            if (!opened || closed) return false;
            return refreshPresenceSession(claims.userId!, claims.sessionId!, connectionId);
          })
          .then((exists) => {
            if (!exists && !closed) ws.close(1012, "Presence session expired; reconnecting");
            else if (!closed) safelySend({ type: "pong", at: Date.now() });
          })
          .catch((error) => {
            console.error("Could not renew live presence session:", error);
            safelySend({ type: "presence-error" });
          });
        return;
      }

      let payload: any;
      try { payload = JSON.parse(message); } catch { return; }
      if (!payload || typeof payload.type !== "string") return;

      if (payload.type === "screen-status") {
        const status = typeof payload.status === "string" ? payload.status : "";
        if (!SCREEN_STATUSES.has(status)) return;
        void publishScreenEvent({
          type: "screen-status",
          audience: "admins",
          userId: claims.userId,
          userSessionId: claims.sessionId,
          status,
        });
        return;
      }

      if (payload.type === "screen-signal") {
        const targetSessionId = typeof payload.toSessionId === "string" ? payload.toSessionId : "";
        const signal = normalizeScreenSignal(payload.signal);
        if (!SESSION_ID_PATTERN.test(targetSessionId) || !signal) return;
        void publishScreenEvent({
          type: "screen-signal",
          audience: "admins",
          targetSessionId,
          fromSessionId: claims.sessionId,
          userId: claims.userId,
          signal,
        });
      }
    });

    ws.on("close", () => {
      closed = true;
      if (subscriber) void subscriber.quit().catch(() => subscriber?.disconnect());
      if (claims.role === "user") {
        void (openingPresence ?? Promise.resolve(true))
          .then(() => endPresenceSession(claims.userId!, claims.sessionId!, connectionId))
          .catch((error) => console.error("Could not end live presence session:", error));
      }
    });

    ws.on("error", (error: Error) => {
      console.error("Live presence WebSocket error:", error.message);
    });
  });
}
