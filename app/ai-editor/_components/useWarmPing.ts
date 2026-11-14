"use client";

import { useEffect, useRef } from "react";

// While the AI editor page is open and visible, tell the server now and then
// that this visitor is here ("weak" hint). Once a photo is chosen, send a
// "strong" hint at once. The bot uses this to get ONE Gemini page ready in
// time; if nothing is ready the image is made the normal way.
const PING_EVERY_MS = 60_000;

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

  // Every minute while the tab is visible.
  useEffect(() => {
    ping(hasPhotoRef.current);
    const timer = window.setInterval(() => ping(hasPhotoRef.current), PING_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") ping(hasPhotoRef.current);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // A photo was just chosen: strong hint right away.
  useEffect(() => {
    if (hasPhoto) ping(true);
  }, [hasPhoto]);
}
