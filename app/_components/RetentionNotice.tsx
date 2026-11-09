"use client";

import { AlertTriangle, Clock, Download } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

// NOTE: the "30" in the texts below must match FILE_RETENTION_DAYS in app/_lib/retentionConfig.ts

const COPY = {
  bn: {
    title: "আপনার ছবি ",
    highlight: "৩০ দিন",
    titleEnd: " পরে স্বয়ংক্রিয়ভাবে ডিলিট হয়ে যাবে",
    body: "তৈরি করা ছবিগুলো ‘আমার ফাইল’-এ ৩০ দিন সংরক্ষিত থাকে, এরপর সার্ভার থেকে চিরতরে মুছে যায়। তাই তার আগেই প্রয়োজনীয় ছবি ডাউনলোড করে আপনার ডিভাইসে সেভ করে রাখুন।",
    compact:
      "ছবি ৩০ দিন পর অটো-ডিলিট হবে — তার আগেই ডাউনলোড করে ডিভাইসে সেভ করে রাখুন।",
  },
  en: {
    title: "Your photos are automatically deleted after ",
    highlight: "30 days",
    titleEnd: "",
    body: "Generated photos stay in My Files for 30 days and are then permanently removed from our servers. Please download the photos you need and save them on your device before then.",
    compact:
      "Photos are auto-deleted after 30 days — download and save them to your device before then.",
  },
} as const;

type RetentionNoticeProps = {
  /** "banner" = full box with title + explanation, "compact" = one-line pill */
  variant?: "banner" | "compact";
  className?: string;
  /** Force a language (e.g. pages that are always Bangla). Default follows the site language. */
  locale?: "bn" | "en";
};

export default function RetentionNotice({
  variant = "banner",
  className = "",
  locale: forcedLocale,
}: RetentionNoticeProps) {
  const { locale: siteLocale } = useI18n();
  const locale = forcedLocale ?? siteLocale;
  const copy = locale === "bn" ? COPY.bn : COPY.en;

  if (variant === "compact") {
    return (
      <p
        role="note"
        className={`flex items-start gap-1.5 rounded-lg border border-[#F0D9A8] bg-[#FFF6E3] px-2.5 py-1.5 text-[12px] font-medium leading-[1.5] text-[#7A4B00] ${className}`}
      >
        <Clock size={13} className="mt-[3px] shrink-0 text-[#B7791F]" aria-hidden="true" />
        <span className="min-w-0">{copy.compact}</span>
      </p>
    );
  }

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 overflow-hidden rounded-2xl border border-[#F5B5B5] bg-gradient-to-r from-[#FEE2E2] via-[#FEECEC] to-[#FFF5F5] py-3 pl-5 pr-4 text-[#7F1D1D] shadow-[0_2px_10px_rgba(220,38,38,0.15)] sm:items-center sm:gap-4 sm:py-3.5 ${className}`}
    >
      {/* red accent bar */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1.5 bg-[#DC2626]"
      />
      {/* pulsing alert icon */}
      <span className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center sm:mt-0 sm:h-11 sm:w-11">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-ping rounded-full bg-[#DC2626]/30 [animation-duration:2s] motion-reduce:animate-none"
        />
        <span className="relative flex h-full w-full items-center justify-center rounded-full bg-[#DC2626] text-white shadow-md ring-4 ring-[#DC2626]/15">
          <AlertTriangle size={20} strokeWidth={2.2} aria-hidden="true" />
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-extrabold leading-[1.5] text-[#991B1B] sm:text-base">
          {copy.title}
          <span className="mx-0.5 inline-block rounded-md bg-[#DC2626] px-2 py-0.5 text-[13px] font-bold leading-[1.4] text-white sm:text-sm">
            {copy.highlight}
          </span>
          {copy.titleEnd}
        </p>
        <p className="mt-1 flex items-start gap-1.5 text-[13px] font-medium leading-[1.6] text-[#8B2A2A]">
          <Download size={14} className="mt-[4px] shrink-0 text-[#DC2626]" aria-hidden="true" />
          <span className="min-w-0">{copy.body}</span>
        </p>
      </div>
    </div>
  );
}
