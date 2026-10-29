"use client";

import { useState } from "react";
import { useSiteSettings } from "@/app/_components/SiteSettingsProvider";

const ORIGINAL_LOGO = "/sebalagbelogo/sebalagbelogo.png";

type SiteBrandLogoProps = {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
};

/** Shared logo renderer. A broken/stale uploaded URL falls back to the original brand asset. */
export default function SiteBrandLogo({
  className = "h-[40px] w-auto",
  width = 140,
  height = 45,
  alt,
}: SiteBrandLogoProps) {
  const { settings } = useSiteSettings();
  const configuredSrc = settings.branding.logoUrl.trim() || ORIGINAL_LOGO;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [failedOriginalFor, setFailedOriginalFor] = useState<string | null>(null);
  const src = failedSrc === configuredSrc ? ORIGINAL_LOGO : configuredSrc;

  if (src === ORIGINAL_LOGO && failedOriginalFor === configuredSrc) {
    return (
      <span
        className={`inline-flex items-center font-bold tracking-tight text-slate-900 ${className}`}
        role="img"
        aria-label={alt || `${settings.branding.siteName || "Website"} logo`}
      >
        {settings.branding.siteName || "Website"}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt || `${settings.branding.siteName || "Website"} logo`}
      width={width}
      height={height}
      className={`${className} max-w-full object-contain`}
      loading="eager"
      decoding="async"
      onError={() => {
        if (src !== ORIGINAL_LOGO) setFailedSrc(configuredSrc);
        else setFailedOriginalFor(configuredSrc);
      }}
    />
  );
}
