"use client";

import { Clock, Download } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

// NOTE: the "30" in the texts below must match FILE_RETENTION_DAYS in app/_lib/retentionConfig.ts

const COPY = {
  bn: {
    title: "আপনার ছবি ৩০ দিন পরে স্বয়ংক্রিয়ভাবে ডিলিট হয়ে যাবে",
    body: "তৈরি করা ছবিগুলো ‘আমার ফাইল’-এ ৩০ দিন সংরক্ষিত থাকে, এরপর সার্ভার থেকে চিরতরে মুছে যায়। তাই তার আগেই প্রয়োজনীয় ছবি ডাউনলোড করে আপনার ডিভাইসে সেভ করে রাখুন।",
    compact:
      "ছবি ৩০ দিন পর অটো-ডিলিট হবে — তার আগেই ডাউনলোড করে ডিভাইসে সেভ করে রাখুন।",
  },
  en: {
    title: "Your photos are automatically deleted after 30 days",
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
      role="note"
      className={`flex items-start gap-3 rounded-2xl border border-[#F0D9A8] bg-[#FFF6E3] px-4 py-3 text-[#7A4B00] shadow-sm ${className}`}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FDE9B8] text-[#B7791F]">
        <Clock size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-bold leading-[1.45] text-[#6B3F00]">
          {copy.title}
        </p>
        <p className="mt-0.5 flex items-start gap-1.5 text-[13px] leading-[1.6] text-[#8A5A12]">
          <Download size={14} className="mt-[4px] shrink-0" aria-hidden="true" />
          <span className="min-w-0">{copy.body}</span>
        </p>
      </div>
    </div>
  );
}
