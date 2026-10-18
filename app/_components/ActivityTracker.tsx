"use client";

import { useEffect } from "react";
import { PRESENCE_HEARTBEAT_INTERVAL_MS } from "@/lib/presenceConstants";

/**
 * Maintains only a short-lived online browser presence for the admin's
 * user-selection list. It does not request activity consent, inspect clicks,
 * report page paths, or collect screen/input content.
 */
const SESSION_KEY = "sohojhub:presence-session-id";
const SESSION_ID_PATTERN = /^[a-zA-Z0-9._:-]{16,120}$/;

type AuthHeaders = Record<string, string>;

function createSessionId() {
  return typeof window.crypto?.randomUUID === "function"
    ? window.crypto.randomUUID()
    : `sh-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateSessionId() {
  try {
    const saved = window.sessionStorage.getItem(SESSION_KEY) || "";
    if (SESSION_ID_PATTERN.test(saved)) return saved;
    const next = createSessionId();
    window.sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return createSessionId();
  }
}

function setSessionId(value: string) {
  try { window.sessionStorage.setItem(SESSION_KEY, value); } catch { /* session storage is optional */ }
}

function getClientCredentials(): AuthHeaders | null {
  try {
    const token = window.localStorage.getItem("token") || "";
    const rawUser = window.localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    if (!token || user?.role === "admin") return null;
    return { Authorization: `Bearer ${token}` };
  } catch {
    return null;
  }
}

export default function ActivityTracker() {
  useEffect(() => {
    let disposed = false;
    let busy = false;
    let timer: number | null = null;
    let sessionId = getOrCreateSessionId();

    const sendPresence = async (leave = false) => {
      if (disposed || busy) return;
      const credentials = getClientCredentials();
      if (!credentials) return;
      if (!SESSION_ID_PATTERN.test(sessionId)) {
        sessionId = createSessionId();
        setSessionId(sessionId);
      }
      busy = true;
      try {
        await fetch("/api/auth/presence/update", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          keepalive: leave,
          headers: { "Content-Type": "application/json", ...credentials },
          body: JSON.stringify({ sessionId, leave }),
        });
      } catch {
        // Presence is best-effort; the short server-side expiry cleans stale sessions.
      } finally {
        busy = false;
      }
    };

    const startSession = (newSession: boolean) => {
      if (newSession) {
        sessionId = createSessionId();
        setSessionId(sessionId);
      } else {
        sessionId = getOrCreateSessionId();
      }
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      if (!getClientCredentials()) return;
      void sendPresence();
      timer = window.setInterval(() => { void sendPresence(); }, PRESENCE_HEARTBEAT_INTERVAL_MS);
    };

    const stopSession = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      void sendPresence(true);
    };

    startSession(false);
    window.addEventListener("sohojhub:presence-stop", stopSession);
    const onAuthChanged = () => startSession(true);
    window.addEventListener("sohojhub:auth-changed", onAuthChanged);

    return () => {
      disposed = true;
      window.removeEventListener("sohojhub:presence-stop", stopSession);
      window.removeEventListener("sohojhub:auth-changed", onAuthChanged);
      if (timer !== null) window.clearInterval(timer);
    };
  }, []);

  return null;
}
