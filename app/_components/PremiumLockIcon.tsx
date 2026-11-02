"use client";

import { useId } from "react";

type PremiumLockIconProps = {
  size?: number;
  className?: string;
};

/**
 * Premium gold padlock (SVG).
 * Used for every "paid / locked" marker so the lock reads clearly as a premium lock:
 * glossy gold body, rounded metal shackle and a dark keyhole.
 * Gradient ids are unique per instance (useId) so many locks on one page never clash.
 */
export default function PremiumLockIcon({ size = 16, className }: PremiumLockIconProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const body = `pl-body-${uid}`;
  const shackle = `pl-shackle-${uid}`;
  const shine = `pl-shine-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={body} x1="4" y1="10" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFEDA8" />
          <stop offset="0.45" stopColor="#F6BD3F" />
          <stop offset="1" stopColor="#B87708" />
        </linearGradient>
        <linearGradient id={shackle} x1="7" y1="2" x2="17" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF6CC" />
          <stop offset="0.55" stopColor="#E8B13A" />
          <stop offset="1" stopColor="#A9700A" />
        </linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.65" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* shackle */}
      <path
        d="M7.6 10.5V7.6a4.4 4.4 0 0 1 8.8 0v2.9"
        fill="none"
        stroke="#7A4803"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M7.6 10.5V7.6a4.4 4.4 0 0 1 8.8 0v2.9"
        fill="none"
        stroke={`url(#${shackle})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* body */}
      <rect x="3.6" y="10" width="16.8" height="12" rx="3.2" fill={`url(#${body})`} stroke="#8A5A00" strokeWidth="0.8" />
      <rect x="4.6" y="10.9" width="14.8" height="4.2" rx="2.1" fill={`url(#${shine})`} />

      {/* keyhole */}
      <circle cx="12" cy="15" r="2" fill="#5B3600" />
      <path d="M10.9 15.6h2.2l.7 3.6a.5.5 0 0 1-.5.6h-2.6a.5.5 0 0 1-.5-.6z" fill="#5B3600" />
    </svg>
  );
}
