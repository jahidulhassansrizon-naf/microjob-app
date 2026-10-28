"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

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
  const isBangla = locale === "bn";

  return (
    <span className={className} translate="no">
      {isBangla ? "সেবা" : "Seba"}{" "}
      <span className={accentClassName}>{isBangla ? "লাগবে" : "Lagbe"}</span>
    </span>
  );
}
