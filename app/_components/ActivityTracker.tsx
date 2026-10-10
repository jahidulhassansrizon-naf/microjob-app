"use client";

import { useEffect } from "react";

/** Updates lastSeenAt for signed-in users so the admin's online count is useful. */
export default function ActivityTracker() {
  useEffect(() => {
    let disposed = false;

    const heartbeat = () => {
      if (disposed) return;
      let token = "";
      try {
        token = window.localStorage.getItem("token") || "";
      } catch {
        return;
      }
      if (!token) return;

      void fetch("/api/auth/activity", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        keepalive: true,
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    };

    heartbeat();
    const interval = window.setInterval(heartbeat, 60_000);
    window.addEventListener("focus", heartbeat);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", heartbeat);
    };
  }, []);

  return null;
}
