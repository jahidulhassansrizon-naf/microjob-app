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
    typeof claims.sessionId !== "string"
  ) {
    return new Response("Invalid presence ticket claims", { status: 401 });
  }

  if (claims.role === "user" && !/^[a-f\d]{24}$/i.test(claims.userId)) {
    return new Response("Invalid user session", { status: 401 });
  }

  // A user socket owns one presence lease in MongoDB. Admin sockets subscribe to
  // Redis so events from other Vercel Function instances reach this connection.
  return experimental_upgradeWebSocket((ws) => {
    let closed = false;
    const connectionId = randomUUID();
    let subscriber: Redis | null = null;
    let openingPresence: Promise<boolean> | null = null;

    const safelySend = (payload: unknown) => {
      if (ws.readyState === 1) {
        try {
          ws.send(JSON.stringify(payload));
        } catch {
          // Connection may have closed between readyState and send.
        }
      }
    };

    if (claims.role === "admin") {
      const redisUrl = process.env.REDIS_URL?.trim();
      if (!redisUrl) {
        safelySend({ type: "realtime-unavailable" });
        ws.close(1000, "Redis pub/sub is not configured; polling fallback is active");
        return;
      }

      subscriber = new Redis(redisUrl, {
        connectTimeout: 3_000,
        maxRetriesPerRequest: 1,
        retryStrategy: (attempt) => (attempt <= 3 ? Math.min(attempt * 250, 1_000) : null),
      });
      subscriber.on("error", (error) => {
        console.error("Presence Redis subscriber error:", error.message);
      });
      subscriber.on("message", (channel, message) => {
        if (channel !== PRESENCE_REDIS_CHANNEL || closed || ws.readyState !== 1) return;
        try {
          const event = JSON.parse(message) as { type?: string; userId?: string; isOnline?: boolean; changedAt?: string };
          if (event.type === "presence" && typeof event.userId === "string" && typeof event.isOnline === "boolean") {
            safelySend(event);
          }
        } catch {
          // Ignore malformed pub/sub messages rather than closing the dashboard.
        }
      });
      void subscriber.subscribe(PRESENCE_REDIS_CHANNEL).then(() => {
        safelySend({ type: "ready" });
      }).catch((error) => {
        console.error("Could not subscribe to presence events:", error);
        safelySend({ type: "realtime-unavailable" });
      });
    } else {
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
      if (claims.role === "admin") {
        safelySend({ type: "pong", at: Date.now() });
        return;
      }

      const message = typeof data === "string" ? data : data.toString();
      if (message === "leave") {
        closed = true;
        void (openingPresence ?? Promise.resolve(true))
          .then(() => endPresenceSession(claims.userId!, claims.sessionId!, connectionId))
          .catch((error) => {
            console.error("Could not end requested presence session:", error);
          })
          .finally(() => {
            if (ws.readyState === 1) ws.close(1000, "Presence session ended");
          });
        return;
      }
      if (message !== "ping" || closed) return;

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
    });

    ws.on("close", () => {
      closed = true;
      if (subscriber) {
        void subscriber.quit().catch(() => subscriber?.disconnect());
      }
      if (claims.role === "user") {
        void (openingPresence ?? Promise.resolve(true))
          .then(() => endPresenceSession(claims.userId!, claims.sessionId!, connectionId))
          .catch((error) => {
            console.error("Could not end live presence session:", error);
          });
      }
    });

    ws.on("error", (error: Error) => {
      console.error("Live presence WebSocket error:", error.message);
    });
  });
}
