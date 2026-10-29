"use client";
import React from "react";

/**
 * Professional two-tone SVG icons for the "PHOTO SIZE" buttons
 * (Passport, Dual, E-Pass, Visa, Birth).
 * Strokes use currentColor, so they follow the button's active / inactive colour.
 */
export default function PhotoSizeIcon({
  id,
  size = 26,
  className = "",
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "2.5 2.5 27 27",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
    focusable: false,
  };

  switch (id) {
    case "Passport":
      // Passport booklet with globe emblem
      return (
        <svg {...common}>
          <rect x="7" y="3.5" width="18" height="25" rx="2.5" fill="currentColor" fillOpacity="0.12" />
          <path d="M10.5 3.5v25" strokeOpacity="0.45" />
          <circle cx="17.5" cy="12.5" r="4.2" />
          <ellipse cx="17.5" cy="12.5" rx="1.8" ry="4.2" strokeWidth="1.2" />
          <path d="M13.3 12.5h8.4" strokeWidth="1.2" />
          <path d="M14 21.5h7M15.5 24.3h4" strokeWidth="1.4" />
        </svg>
      );

    case "Dual":
      // Two portrait photo frames side by side
      return (
        <svg {...common}>
          <rect x="3" y="7" width="12.5" height="18" rx="2.2" fill="currentColor" fillOpacity="0.12" />
          <rect x="16.5" y="7" width="12.5" height="18" rx="2.2" fill="currentColor" fillOpacity="0.12" />
          <circle cx="9.25" cy="13.6" r="2.4" />
          <path d="M5.2 22c.5-2.6 2-4 4.05-4s3.55 1.4 4.05 4" />
          <circle cx="22.75" cy="13.6" r="2.4" />
          <path d="M18.7 22c.5-2.6 2-4 4.05-4s3.55 1.4 4.05 4" />
        </svg>
      );

    case "E-Pass":
      // Passport booklet with biometric e-chip symbol
      return (
        <svg {...common}>
          <rect x="7" y="3.5" width="18" height="25" rx="2.5" fill="currentColor" fillOpacity="0.12" />
          <path d="M10.5 3.5v25" strokeOpacity="0.45" />
          <rect x="13" y="9" width="9" height="7" rx="1.6" />
          <circle cx="17.5" cy="12.5" r="1.4" fill="currentColor" stroke="none" />
          <path d="M17.5 9v1.4M17.5 14.6V16" strokeWidth="1.2" />
          <path d="M14 21.5h7M15.5 24.3h4" strokeWidth="1.4" />
        </svg>
      );

    case "Visa":
      // Visa page with stamp and airplane
      return (
        <svg {...common}>
          <rect x="4.5" y="5" width="23" height="22" rx="2.8" fill="currentColor" fillOpacity="0.12" />
          <path d="M8.5 10.5h8M8.5 14h5" strokeWidth="1.4" />
          <circle cx="21" cy="12.5" r="3.6" strokeDasharray="1.8 1.6" strokeWidth="1.3" />
          <path
            d="M9 22.2l5.2-1.1 3.4-3.5c.5-.5 1.3-.5 1.7 0 .4.4.3 1.1-.1 1.5l-1 1 3.6 1.1-.9 1.1-3.2-.3-1.3 1.3-1.2-.2-.3-1.2-4.4.9z"
            fill="currentColor"
            fillOpacity="0.85"
            stroke="none"
          />
        </svg>
      );

    case "Birth":
      // Birth certificate with ribbon seal
      return (
        <svg {...common}>
          <path
            d="M7 4.5h13.5l4.5 4.5v13.5a2.5 2.5 0 0 1-2.5 2.5H9.5A2.5 2.5 0 0 1 7 22.5v-15.5A2.5 2.5 0 0 1 7 4.5z"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <path d="M20.5 4.5V9H25" />
          <path d="M11 12.5h6M11 16h4" strokeWidth="1.4" />
          <circle cx="19" cy="22.5" r="4.2" fill="var(--bg-seal, #fff)" />
          <path
            d="M19 20.2c.6-.9 2.1-.7 2.1.5 0 1.1-1.4 1.9-2.1 2.6-.7-.7-2.1-1.5-2.1-2.6 0-1.2 1.5-1.4 2.1-.5z"
            fill="currentColor"
            stroke="none"
          />
          <path d="M16.6 26.5l-.9 3.2 3.3-1.4 3.3 1.4-.9-3.2" strokeWidth="1.3" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <rect x="6" y="5" width="20" height="22" rx="2.5" fill="currentColor" fillOpacity="0.12" />
          <circle cx="16" cy="13" r="3" />
          <path d="M10.5 23c.7-3 2.8-4.6 5.5-4.6s4.8 1.6 5.5 4.6" />
        </svg>
      );
  }
}
