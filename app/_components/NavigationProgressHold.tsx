"use client";

import { useEffect } from "react";

/**
 * Put this inside any loading screen (skeleton, spinner page, loading.tsx).
 * While it is on screen, the full-screen page loader stays up; when the loading
 * screen disappears, the loader completes to 100%.
 */
export default function NavigationProgressHold() {
  useEffect(() => {
    window.dispatchEvent(new Event("navigation-progress:hold"));

    return () => {
      window.dispatchEvent(new Event("navigation-progress:release"));
    };
  }, []);

  return null;
}
