"use client";

import { useEffect } from "react";
import { PRESENCE_ACTIVITY_REFRESH_MS } from "@/lib/presenceConstants";

/**
 * Reports "online" when the user actually interacts with the site (click, touch, key,
 * scroll), at most once per PRESENCE_ACTIVITY_REFRESH_MS. There is no background
 * heartbeat, so an idle user generates no requests. It does not report page paths,
 * click targets, or any screen/input content - only "this user is active".
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

    let lastSentAt = 0;
    const reportActivity = () => {
      const now = Date.now();
      if (now - lastSentAt < PRESENCE_ACTIVITY_REFRESH_MS) return;
      lastSentAt = now;
      void sendPresence();
    };
    const onChatOpen = () => {
      lastSentAt = Date.now();
      void sendPresence();
    };
    const onLeave = () => {
      lastSentAt = 0;
      void sendPresence(true);
    };
    const onAuthChanged = () => {
      sessionId = createSessionId();
      setSessionId(sessionId);
      lastSentAt = 0;
    };

    const activityEvents = ["pointerdown", "keydown", "touchstart"] as const;
    for (const name of activityEvents) window.addEventListener(name, reportActivity, { passive: true });
    window.addEventListener("scroll", reportActivity, { passive: true, capture: true });
    window.addEventListener("sohojhub:chat-presence", onChatOpen);
    window.addEventListener("sohojhub:presence-stop", onLeave);
    window.addEventListener("sohojhub:auth-changed", onAuthChanged);

    return () => {
      disposed = true;
      for (const name of activityEvents) window.removeEventListener(name, reportActivity);
      window.removeEventListener("scroll", reportActivity, true);
      window.removeEventListener("sohojhub:chat-presence", onChatOpen);
      window.removeEventListener("sohojhub:presence-stop", onLeave);
      window.removeEventListener("sohojhub:auth-changed", onAuthChanged);
    };
  }, []);

  return null;
}
