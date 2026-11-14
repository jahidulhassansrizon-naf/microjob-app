"use client";

import { useEffect, useRef } from "react";

// While the page is open, visible AND the visitor is active, tell the server now
// and then that this visitor is here ("weak" hint). Once a photo is chosen, send a
// "strong" hint at once. The bot uses this to get ONE Gemini page ready in
// time; if nothing is ready the image is made the normal way.
//
// Used by: AI Editor, AI Template, Bulk Photo Edit.
// It never keeps a page warm for ever: no hints while the tab is hidden, and no
// hints once the visitor has been idle for IDLE_STOP_MS (the bot then closes the
// page by itself after a few minutes).
const PING_EVERY_MS = 60_000;
const IDLE_STOP_MS = 10 * 60_000;

let stopped = false; // set when the server says "not logged in / no subscription"

function ping(strong: boolean) {
  if (stopped || typeof document === "undefined") return;
  if (document.visibilityState !== "visible") return;

  fetch("/api/image-warm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ strong }),
    keepalive: true,
  })
    .then((response) => {
      if (response.status === 401 || response.status === 403) stopped = true;
    })
    .catch(() => {});
}

export default function useWarmPing(hasPhoto: boolean) {
  const hasPhotoRef = useRef(hasPhoto);
  hasPhotoRef.current = hasPhoto;
  const lastActivityRef = useRef(Date.now());

  // Every minute while the tab is visible and the visitor is not idle.
  useEffect(() => {
    lastActivityRef.current = Date.now();
    const isIdle = () => Date.now() - lastActivityRef.current > IDLE_STOP_MS;

    ping(hasPhotoRef.current);
    const timer = window.setInterval(() => {
      if (!isIdle()) ping(hasPhotoRef.current);
    }, PING_EVERY_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible" && !isIdle()) {
        ping(hasPhotoRef.current);
      }
    };

    // Any sign of life counts as activity. If the visitor comes back after an
    // idle period, send one hint right away.
    const onActivity = () => {
      const wasIdle = isIdle();
      lastActivityRef.current = Date.now();
      if (wasIdle) ping(hasPhotoRef.current);
    };

    document.addEventListener("visibilitychange", onVisible);
    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    for (const name of events) {
      window.addEventListener(name, onActivity, { passive: true });
    }
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      for (const name of events) window.removeEventListener(name, onActivity);
    };
  }, []);

  // A photo was just chosen: strong hint right away.
  useEffect(() => {
    if (hasPhoto) {
      lastActivityRef.current = Date.now();
      ping(true);
    }
  }, [hasPhoto]);
}
