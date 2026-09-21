"use client";

import { useEffect } from "react";

export default function PageBackgroundInitializer() {
  useEffect(() => {
    const path = window.location.pathname;

    const bgMap: Record<string, string> = {
      "/tools": "#FFFBF7",
      "/pricing": "#FEF4ED",
      "/reviews": "#F5ECE5",
      "/dorkar-link": "#FCF9F9",
    };

    let backgroundColor = "#FAF7FD";

    for (const [key, color] of Object.entries(bgMap)) {
      if (path.startsWith(key)) {
        backgroundColor = color;
        break;
      }
    }

    document.documentElement.style.backgroundColor = backgroundColor;

    return () => {
      document.documentElement.style.backgroundColor = "";
    };
  }, []);

  return null;
}
