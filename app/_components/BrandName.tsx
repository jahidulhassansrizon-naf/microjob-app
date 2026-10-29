"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { useSiteSettings } from "@/app/_components/SiteSettingsProvider";
import { DEFAULT_SITE_SETTINGS } from "@/lib/siteSettings";

type BrandNameProps = {
  className?: string;
  accentClassName?: string;
};

/** The product name follows the language selected in the app. */
export default function BrandName({
  className = "",
  accentClassName = "text-[#DC2626]",
}: BrandNameProps) {
  const { locale } = useI18n();
  const { settings } = useSiteSettings();
  const isBangla = locale === "bn";
  const isDefaultName = settings.branding.siteName.trim() === DEFAULT_SITE_SETTINGS.branding.siteName;

  return (
    <span className={className} translate="no">
      {isDefaultName ? <>{isBangla ? "সেবা" : "Seba"}{" "}<span className={accentClassName}>{isBangla ? "লাগবে" : "Lagbe"}</span></> : settings.branding.siteName}
    </span>
  );
}
