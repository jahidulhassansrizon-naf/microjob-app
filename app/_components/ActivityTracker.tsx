"use client";

import { useEffect } from "react";
import { PRESENCE_HEARTBEAT_INTERVAL_MS } from "@/lib/presenceConstants";

/** Keeps a signed-in user's browser-tab presence connected to the server. */
export default function ActivityTracker() {
  useEffect(() => {
    let disposed = false;
    let paused = false;
    let pageHidden = false;
    let socket: WebSocket | null = null;
    let retryTimer: number | null = null;
    let heartbeatTimer: number | null = null;
    let reconnectDelay = 1_000;
    let sessionId = window.crypto.randomUUID();

    const clearTimers = () => {
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
      retryTimer = null;
      heartbeatTimer = null;
    };

    const isCachedAdmin = () => {
      try {
        const raw = window.localStorage.getItem("user");
        const user = raw ? JSON.parse(raw) : null;
        return user?.role === "admin";
      } catch {
        return false;
      }
    };

    const hasPotentialUserSession = () => {
      try {
        return Boolean(window.localStorage.getItem("token"));
      } catch {
        // If storage is blocked, let the HttpOnly-cookie based ticket request decide.
        return true;
      }
    };

    const scheduleReconnect = (delay = reconnectDelay) => {
      if (disposed || paused || pageHidden || retryTimer !== null) return;
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        void connect();
      }, delay);
      reconnectDelay = Math.min(Math.max(reconnectDelay * 2, 1_000), 15_000);
    };

    const connect = async () => {
      if (disposed || paused || pageHidden || isCachedAdmin() || !hasPotentialUserSession()) return;
      clearTimers();

      try {
        let headers: Record<string, string> = { "Content-Type": "application/json" };
        try {
          const token = window.localStorage.getItem("token");
          if (token) headers.Authorization = `Bearer ${token}`;
        } catch {
          // The HttpOnly cookie remains the authoritative session when storage is unavailable.
        }

        const ticketResponse = await fetch("/api/auth/presence/ticket", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers,
          body: JSON.stringify({ sessionId }),
        });
        const ticketData = await ticketResponse.json().catch(() => ({}));
        if (ticketData?.role === "admin") return;
        if (!ticketResponse.ok || !ticketData?.ticket || ticketData?.role !== "user") {
          scheduleReconnect(ticketResponse.status === 401 ? 15_000 : reconnectDelay);
          return;
        }

        if (disposed || paused || pageHidden) return;
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const url = `${wsProtocol}//${window.location.host}/api/auth/presence/ws?ticket=${encodeURIComponent(ticketData.ticket)}`;
        const nextSocket = new WebSocket(url);
        socket = nextSocket;

        nextSocket.addEventListener("open", () => {
          reconnectDelay = 1_000;
          const ping = () => {
            if (nextSocket.readyState !== WebSocket.OPEN) return;
            // Some auth flows invalidate a user from inside the current tab.
            // Detect token removal even when that flow does not navigate away.
            try {
              const canReadStorage = typeof window.localStorage !== "undefined";
              const token = window.localStorage.getItem("token");
              if (canReadStorage && !token) {
                paused = true;
                clearTimers();
                nextSocket.send("leave");
                nextSocket.close(1000, "User session cleared");
                return;
              }
            } catch {
              // Keep the connection if browser storage is disabled; the cookie is authoritative.
            }
            nextSocket.send("ping");
          };
          ping();
          heartbeatTimer = window.setInterval(ping, PRESENCE_HEARTBEAT_INTERVAL_MS);
        });

        nextSocket.addEventListener("message", (event) => {
          // Receiving pong confirms the socket is alive; no UI is needed here.
          if (typeof event.data !== "string") return;
        });

        nextSocket.addEventListener("close", () => {
          if (socket === nextSocket) socket = null;
          clearTimers();
          if (!disposed && !paused && !pageHidden) scheduleReconnect();
        });

        nextSocket.addEventListener("error", () => {
          try {
            nextSocket.close();
          } catch {
            // onclose schedules the reconnect when the browser reports it.
          }
        });
      } catch {
        scheduleReconnect(reconnectDelay);
      }
    };

    const stopForLogout = () => {
      paused = true;
      clearTimers();
      if (socket && socket.readyState < WebSocket.CLOSING) {
        if (socket.readyState === WebSocket.OPEN) socket.send("leave");
        socket.close(1000, "User logged out");
      }
      socket = null;
    };

    const resumeAfterLogin = () => {
      paused = false;
      sessionId = window.crypto.randomUUID();
      clearTimers();
      if (socket && socket.readyState < WebSocket.CLOSING) {
        socket.close(1000, "Session changed");
      } else {
        socket = null;
        void connect();
      }
    };

    const onPageHide = () => {
      pageHidden = true;
      clearTimers();
      if (socket && socket.readyState < WebSocket.CLOSING) {
        if (socket.readyState === WebSocket.OPEN) socket.send("leave");
        socket.close(1000, "Page hidden or closed");
      }
    };

    const onPageShow = () => {
      if (!pageHidden) return;
      pageHidden = false;
      sessionId = window.crypto.randomUUID();
      void connect();
    };

    window.addEventListener("sohojhub:presence-stop", stopForLogout);
    window.addEventListener("sohojhub:auth-changed", resumeAfterLogin);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);

    void connect();

    return () => {
      disposed = true;
      clearTimers();
      window.removeEventListener("sohojhub:presence-stop", stopForLogout);
      window.removeEventListener("sohojhub:auth-changed", resumeAfterLogin);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      if (socket && socket.readyState < WebSocket.CLOSING) {
        if (socket.readyState === WebSocket.OPEN) socket.send("leave");
        socket.close(1000, "Presence tracker disposed");
      }
    };
  }, []);

  return null;
}
