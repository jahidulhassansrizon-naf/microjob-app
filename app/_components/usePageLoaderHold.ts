"use client";

import { useEffect } from "react";

/**
 * Keeps the full-screen premium page loader up while a page is still loading its data.
 *   - reload / first visit: the loader (already on screen) stays until `active` turns false,
 *     then completes to 100%,
 *   - normal click on a menu link: data is usually ready (prefetched / cached), so nothing
 *     is shown; the loader only appears if the page is really slow.
 * The hold is always released after `maxMs`, so a slow or failing request can never leave
 * the loader stuck on screen.
 */
export default function usePageLoaderHold(
  active: boolean,
  maxMs = 6000,
  // Optional: the page draws nothing while it waits, so let the loader show after this many ms
  // (instead of the normal, longer delay) to avoid a long empty screen.
  showAfterMs?: number,
) {
  useEffect(() => {
    if (!active) return;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      window.dispatchEvent(new Event("navigation-progress:release"));
    };
    window.dispatchEvent(
      new CustomEvent("navigation-progress:hold", { detail: { showAfterMs } }),
    );
    const timer = window.setTimeout(release, maxMs);
    return () => {
      window.clearTimeout(timer);
      release();
    };
  }, [active, maxMs, showAfterMs]);
}
