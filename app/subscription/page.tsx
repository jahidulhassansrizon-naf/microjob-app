"use client";

import { useSebaLagbeToolsI18n } from "@/app/sohoj-tools/_i18n";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  Check,
  Clock3,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wallet,
  X,
} from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import BrandName from "@/app/_components/BrandName";
import OfferVideoFrame from "../_components/OfferVideoFrame";
import {
  SUBSCRIPTION_PLANS as plans,
  SUBSCRIPTION_PLAN_FEATURES as features,
} from "@/app/_lib/subscriptionPlans";

/* Subscription plan details are shared with checkout via app/_lib/subscriptionPlans.ts. */
const formatPrice = (value: number) =>
  `৳${Math.round(value).toLocaleString("en-US")}`;
const getDiscount = (price: number, regularPrice: number) =>
  Math.max(0, Math.round((1 - price / regularPrice) * 100));
const DAY_MS = 24 * 60 * 60 * 1000;

function getTiming(sub: {
  startedAt: string | null;
  expiresAt: string | null;
}) {
  const start = sub.startedAt ? Date.parse(sub.startedAt) : NaN;
  const end = sub.expiresAt ? Date.parse(sub.expiresAt) : NaN;
  const now = Date.now();
  const hasEnd = Number.isFinite(end);
  const msLeft = hasEnd ? end - now : null;
  const expired = msLeft !== null && msLeft <= 0;
  const daysLeft =
    msLeft === null ? null : Math.max(0, Math.floor(msLeft / DAY_MS));
  const progress =
    Number.isFinite(start) && hasEnd && end > start
      ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
      : null;
  return { expired, daysLeft, progress };
}

const capitalize = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";

const SUBSCRIPTION_BN: Record<string, string> = {
  "limited-time launch offer": "সীমিত সময়ের লঞ্চ অফার",
  "choose 1 month, 6 months, or 1 year of access to all paid tools. pay once; renew only when you want.":
    "সব পেইড টুলের জন্য ১ মাস, ৬ মাস অথবা ১ বছরের প্ল্যান বেছে নিন। একবার পেমেন্ট করুন; চাইলে মেয়াদ শেষে নিজে থেকে নবায়ন করুন।",
  "full access to all paid tools for 1 month": "১ মাসের জন্য সব পেইড টুলে পূর্ণ অ্যাক্সেস",
  "full access to all paid tools for 6 months": "৬ মাসের জন্য সব পেইড টুলে পূর্ণ অ্যাক্সেস",
  "full access to all paid tools for 1 year": "১ বছরের জন্য সব পেইড টুলে পূর্ণ অ্যাক্সেস",
  "regular price": "নিয়মিত মূল্য",
  "monthly plan": "মাসিক প্ল্যান",
  "most popular": "সবচেয়ে জনপ্রিয়",
  "/ 1 month": "/ ১ মাস",
  "/ 6 months": "/ ৬ মাস",
  "/ 1 year": "/ ১ বছর",
  "ai editor, ai template, and bulk photo edit are included":
    "AI Editor, AI Template ও Bulk Photo Edit অন্তর্ভুক্ত",
  "one-time payment": "একবারের পেমেন্ট",
  "no auto-renewal": "স্বয়ংক্রিয় নবায়ন নেই",
  "included with your subscription": "আপনার সাবস্ক্রিপশনে যা যা থাকছে",
  "choose your subscription plan": "আপনার সাবস্ক্রিপশনের প্ল্যান নির্বাচন করুন",
  "current subscription": "বর্তমান সাবস্ক্রিপশন",
  "no active plan": "কোনো সক্রিয় প্ল্যান নেই",
  "choose a plan below to unlock all the paid tools.":
    "সব পেইড টুল ব্যবহার করতে নিচের যেকোনো একটি প্ল্যান বেছে নিন।",
  expired: "মেয়াদ শেষ",
  active: "সক্রিয়",
  "day left": "দিন বাকি",
  "days left": "দিন বাকি",
  "this plan ended on": "এই প্ল্যানের মেয়াদ শেষ হয়েছে",
  ". choose a plan below to renew.":
    "। নবায়ন করতে নিচের একটি প্ল্যান বেছে নিন।",
  "your access is active until": "আপনার অ্যাক্সেস চালু থাকবে",
  ". you can choose any plan whenever you want.":
    " পর্যন্ত। চাইলে যেকোনো প্ল্যান নিয়ে আবার নবায়ন করতে পারবেন।",
  "amount paid": "পরিশোধিত অর্থ",
  started: "শুরুর তারিখ",
  ended: "মেয়াদ শেষ",
  expires: "মেয়াদ শেষ হবে",
  "1 month": "১ মাস",
  "3 months": "৩ মাস",
  "6 months": "৬ মাস",
  "1 year": "১ বছর",
  "30 days": "৩০ দিন",
  "90 days": "৯০ দিন",
  "180 days": "১৮০ দিন",
  "365 days": "৩৬৫ দিন",
  "flexible monthly access": "প্রতি মাসে নবায়নের সুবিধা",
  "for regular users": "নিয়মিত ব্যবহারকারীদের জন্য",
  "longer access, less hassle": "দীর্ঘমেয়াদি ব্যবহার, কম ঝামেলা",
  "full-year access": "পুরো এক বছরের সুবিধা",
  "most chosen": "সবচেয়ে জনপ্রিয়",
  "best value": "সবচেয়ে সাশ্রয়ী",
  "billed monthly": "মাসিক বিল",
  "your selection": "আপনার নির্বাচন",
  total: "সর্বমোট",
  "access to all available paid tools": "সব উপলভ্য পেইড টুল ব্যবহারের সুযোগ",
  "use the same account across supported tools":
    "সমর্থিত সব টুলে একই অ্যাকাউন্ট ব্যবহার করুন",
  "manage your subscription status from this page":
    "এই পেজ থেকেই আপনার সাবস্ক্রিপশনের অবস্থা পরিচালনা করুন",
  "payment verification and subscription access are handled automatically":
    "অ্যাডমিন পেমেন্ট যাচাই করে অনুমোদন দিলে সাবস্ক্রিপশন চালু হবে",
  "payment is verified before subscription access is activated":
    "পেমেন্ট যাচাই হওয়ার পর সাবস্ক্রিপশন অ্যাক্সেস চালু হবে",
  "back to tools": "টুলসে ফিরে যান",
  "redirecting to payment...": "পেমেন্ট পেজে নেওয়া হচ্ছে...",
  "online payment is ready.": "অনলাইন পেমেন্টের ব্যবস্থা প্রস্তুত।",
  "unable to create payment request.": "পেমেন্টের অনুরোধ তৈরি করা যায়নি।",
  "payment could not be started. please try again.":
    "পেমেন্ট শুরু করা যায়নি। আবার চেষ্টা করুন।",
  "watch video": "ভিডিও দেখুন",
  "replay video": "আবার দেখুন",
  "recent subscription activity": "সাম্প্রতিক সাবস্ক্রিপশন",
  "payment review in progress": "পেমেন্ট যাচাই চলছে",
  "your payment details have been submitted. paid access starts after admin approval.":
    "আপনার পেমেন্টের তথ্য জমা হয়েছে। অ্যাডমিন অনুমোদন দিলে পেইড অ্যাক্সেস চালু হবে।",
  "transaction id": "ট্রানজেকশন আইডি",
  "waiting for review": "যাচাইয়ের অপেক্ষায়",
  "total buyers": "মোট ক্রেতা",
  "bought today": "আজ কিনেছেন",
  "bought just now": "এইমাত্র কিনেছেন",
  "minutes ago": "মিনিট আগে",
  "purchase notification": "ক্রয় নোটিফিকেশন",
  "1 month plan": "১ মাসের প্যাকেজ",
  "6 months plan": "৬ মাসের প্যাকেজ",
  "1 year plan": "১ বছরের প্যাকেজ",
};

function normalizeSubscriptionText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function translateSubscriptionText(
  value: string,
  locale: string | undefined,
  baseL: (value: string) => string,
): string {
  const raw = String(value ?? "");
  if (!locale || !String(locale).toLowerCase().startsWith("bn")) return raw;

  const key = normalizeSubscriptionText(raw);
  if (!key) return raw;

  const exact = SUBSCRIPTION_BN[key];
  if (exact !== undefined) return exact;

  let match = /^continue with (.+)$/i.exec(key);
  if (match)
    return `${translateSubscriptionText(match[1], locale, baseL)} নিয়ে এগিয়ে যান`;

  match = /^save\s+(৳[\d,]+)\s*·\s*(\d+)%\s*off$/i.exec(key);
  if (match) {
    const banglaDigits = (value: string) =>
      value.replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
    return `${banglaDigits(match[1])} সাশ্রয় · ${banglaDigits(match[2])}% ছাড়`;
  }

  match = /^unlock (1 month|6 months|1 year) access for (৳[\d,]+)$/i.exec(key);
  if (match) {
    const periods: Record<string, string> = {
      "1 month": "১ মাস",
      "6 months": "৬ মাস",
      "1 year": "১ বছর",
    };
    const price = match[2].replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
    return `${periods[match[1].toLowerCase()]}-এর অ্যাক্সেস ${price}-তে নিন`;
  }

  match = /^(৳[\d,]+)\s*\/\s*month$/i.exec(key);
  if (match) return `${match[1]} / মাস`;

  match = /^save\s+(\d+)\s*%$/i.exec(key);
  if (match) return `${match[1]}% সাশ্রয়`;

  match = /^(\d+)\s+days? left$/i.exec(key);
  if (match) return `${match[1]} দিন বাকি`;

  match = /^(\d+)\s+minutes? ago$/i.exec(key);
  if (match) return `${match[1]} মিনিট আগে`;

  const translated = baseL(raw);
  if (translated && translated !== raw) {
    const hasBangla = /[\u0980-\u09FF]/.test(translated);
    const hasUntranslatedLatin = /[A-Za-z]/.test(
      translated.replace(/\b(?:AI|PDF|JPG|PNG|WebP|EXIF|GPS|URL)\b/g, ""),
    );
    if (hasBangla && !hasUntranslatedLatin) return translated;
  }
  return raw;
}

function useSubscriptionText() {
  const { locale, L: baseL } = useSebaLagbeToolsI18n();
  const t = useCallback(
    (value: string) => translateSubscriptionText(value, locale, baseL),
    [locale, baseL],
  );
  return { t, locale };
}

function T({ children }: { children: ReactNode }) {
  const { t } = useSubscriptionText();
  if (typeof children !== "string") return <>{children}</>;
  return <>{t(children)}</>;
}

const toBnDigits = (value: string | number) =>
  String(value).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

function ManualPaymentGuide({ amount }: { amount: number }) {
  const bnAmount = toBnDigits(amount);
  const steps: { title: string; body: ReactNode }[] = [
    {
      title: "Manual Payment বাটনে ক্লিক করুন",
      body: <>আপনার নিজের পেমেন্ট পেজ খুলবে।</>,
    },
    {
      title: "Nagad অথবা bKash বেছে নিন",
      body: (
        <>যে মোবাইল ফাইন্যান্সিয়াল সার্ভিস ব্যবহার করেন, সেটি নির্বাচন করুন।</>
      ),
    },
    {
      title: `ঠিক ${bnAmount} টাকা Send Money করুন`,
      body: (
        <>
          পেমেন্ট পেজে দেওয়া নম্বর কপি করে সেই নম্বরে ঠিক{" "}
          <strong>{bnAmount} টাকা</strong> পাঠান।
        </>
      ),
    },
    {
      title: "TrxID ও প্রেরকের নম্বর জমা দিন",
      body: (
        <>
          পেমেন্ট সফল হওয়ার পর SMS-এ পাওয়া TrxID এবং যে নম্বর থেকে টাকা
          পাঠিয়েছেন সেটি লিখে জমা দিন।
        </>
      ),
    },
    {
      title: "অ্যাডমিন যাচাই করবেন",
      body: (
        <>
          আপনার পেমেন্ট ম্যানুয়ালি যাচাই করা হবে। Approve হলেই নির্বাচিত
          প্যাকেজের মেয়াদ অনুযায়ী অ্যাক্সেস চালু হবে।
        </>
      ),
    },
  ];

  return (
    <section
      aria-label="ম্যানুয়াল পেমেন্ট করার নিয়ম"
      className="relative isolate overflow-hidden rounded-3xl border border-[#E3D6B8] bg-gradient-to-br from-[#FBF6E8] via-[#FBF6E8] to-[#F6EEDB] p-5 shadow-sm sm:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#FBB6B6]/25 blur-3xl"
      />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#B91C1C]">
              <BrandName accentClassName="text-[#DC2626]" /> · Payment guide
            </p>
            <h2 className="mt-1.5 text-2xl font-black tracking-tight text-[#3B2F1E] sm:text-3xl">
              পেমেন্ট করবেন যেভাবে
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#FBB6B6] bg-[#FEE9E9] px-3 py-2 text-sm font-extrabold text-[#B91C1C] sm:text-base">
            <Check size={15} strokeWidth={3} /> ধাপে ধাপে গাইড
          </span>
        </div>
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-base font-semibold leading-7 text-amber-900 sm:text-lg">
          <p className="font-extrabold">অনলাইন পেমেন্টে সমস্যা হলে Manual Payment ব্যবহার করুন।</p>
          <p className="mt-1">bKash অথবা Nagad দিয়ে Send Money করে TrxID ও প্রেরকের নম্বর জমা দিন। অ্যাডমিন পেমেন্ট যাচাই করে Approve করলে আপনার সাবস্ক্রিপশন চালু হবে।</p>
        </div>
        <ol className="mt-5 grid gap-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className={`flex gap-3.5 rounded-2xl border p-4 sm:gap-4 sm:p-4 ${index === 4 ? "border-[#FBB6B6] bg-[#FEE9E9]" : "border-[#E3D6B8] bg-[#FBF6E8] shadow-sm"}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-black text-white shadow-sm sm:h-10 sm:w-10 sm:text-lg ${index === 4 ? "bg-[#B91C1C]" : "bg-[#DC2626]"}`}
              >
                {toBnDigits(index + 1)}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-lg font-extrabold leading-7 text-[#3B2F1E] sm:text-xl">
                  {step.title}
                </p>
                <p className="mt-1 text-base leading-6 text-[#5A4A32] sm:text-lg sm:leading-7">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[#FBB6B6] bg-[#FEE9E9] px-4 py-3.5 text-base font-bold leading-6 text-[#B91C1C] sm:text-lg sm:leading-7">
          <ShieldCheck size={19} className="mt-0.5 shrink-0" />
          মনে রাখবেন: শুধু TrxID জমা দিলে অ্যাক্সেস চালু হবে না। পেমেন্ট যাচাই
          করে অ্যাডমিন Approve করার পরই অ্যাক্সেস চালু হবে।
        </p>
      </div>
    </section>
  );
}

/**
 * DEMO / PRACTICE ONLY.
 * These are made-up names, not real purchases. The whole block renders only when
 * NEXT_PUBLIC_DEMO_ACTIVITY="true". For production, feed it real subscription records instead.
 */
const DEMO_ACTIVITY_ENABLED = process.env.NEXT_PUBLIC_DEMO_ACTIVITY === "true";
const DEMO_TOTAL_BUYERS = 43;
const DEMO_BOUGHT_TODAY = 7;
const DEMO_TOAST_INTERVAL_MS = 1500;
const DEMO_TOAST_VISIBLE_MS = 60000;

const DEMO_NAMES = [
  "মোঃ সাকিব হাসান",
  "তানজিলা আক্তার",
  "আরিফুল ইসলাম",
  "সুমাইয়া রহমান",
  "রাকিব হোসেন",
  "নুসরাত জাহান",
  "ইমরান হোসেন",
  "ফারজানা ইয়াসমিন",
  "মেহেদী হাসান",
  "সাদিয়া ইসলাম",
  "শাহরিয়ার কবির",
  "মিম আক্তার",
  "তৌহিদুল ইসলাম",
  "আফরিন সুলতানা",
  "জুবায়ের আহমেদ",
  "রিফাত রহমান",
  "সুমন মিয়া",
  "জান্নাতুল ফেরদৌস",
  "নাঈম হাসান",
  "মাহিয়া আক্তার",
  "মোঃ রাকিবুল ইসলাম",
  "সাব্বির আহমেদ",
  "আয়েশা সিদ্দিকা",
  "আব্দুল্লাহ আল মামুন",
  "রুবিনা খাতুন",
  "মাসুদ রানা",
  "শারমিন আক্তার",
  "হাসিবুল হাসান",
  "কামরুল ইসলাম",
  "পারভীন সুলতানা",
  "ফয়সাল আহমেদ",
  "লিমা আক্তার",
  "জহিরুল ইসলাম",
  "নাজমুল হুদা",
  "রোকসানা পারভীন",
  "তামিম ইকবাল",
  "মৌসুমী আক্তার",
  "আনোয়ার হোসেন",
  "সোহেল রানা",
  "নাসরিন সুলতানা",
  "মোঃ শফিকুল ইসলাম",
  "বিলকিস বেগম",
  "রবিউল আউয়াল",
  "মরিয়ম আক্তার",
  "ইকবাল হোসেন",
  "ফাহিম আহমেদ",
  "তাসলিমা খাতুন",
  "মেহরাব হোসেন",
  "হালিমা আক্তার",
  "সজীব হাসান",
  "নুরুল ইসলাম",
  "জেসমিন আক্তার",
  "আশিকুর রহমান",
  "রেহানা পারভীন",
  "শামীম আহমেদ",
  "সানজিদা ইসলাম",
  "মিজানুর রহমান",
  "ববিতা সুলতানা",
  "ইয়াসিন আরাফাত",
  "সুরাইয়া আক্তার",
] as const;

// Mixed "time ago" values (in minutes): just now, minutes, hours, days, weeks, months.
const DEMO_AGO_MINUTES = [
  0, 2, 5, 8, 10, 15, 20, 25, 30, 40, 45, 50, 60, 90, 120, 180, 240, 360, 480,
  720, 960, 1440, 2160, 2880, 4320, 5760, 10080, 14400, 20160, 30240, 43200,
] as const;

function formatAgo(
  totalMinutes: number,
  isBn: boolean,
  locale: string,
): string {
  const units: {
    limit: number;
    size: number;
    bn: string;
    en: [string, string];
  }[] = [
    { limit: 60, size: 1, bn: "মিনিট", en: ["minute", "minutes"] },
    { limit: 1440, size: 60, bn: "ঘণ্টা", en: ["hour", "hours"] },
    { limit: 10080, size: 1440, bn: "দিন", en: ["day", "days"] },
    { limit: 43200, size: 10080, bn: "সপ্তাহ", en: ["week", "weeks"] },
    { limit: Infinity, size: 43200, bn: "মাস", en: ["month", "months"] },
  ];
  const unit = units.find((u) => totalMinutes < u.limit) ?? units[0];
  const value = Math.max(1, Math.floor(totalMinutes / unit.size));
  const num = value.toLocaleString(locale);
  return isBn
    ? `${num} ${unit.bn} আগে`
    : `${num} ${value === 1 ? unit.en[0] : unit.en[1]} ago`;
}

type DemoPurchase = { name: string; initials: string; minutes: number };

const DEMO_PURCHASES: DemoPurchase[] = DEMO_NAMES.map((name, i) => {
  const firstWord = name.replace(/^মোঃ\s*/, "").split(" ")[0];
  return {
    name,
    initials: Array.from(firstWord).slice(0, 2).join(""),
    minutes: DEMO_AGO_MINUTES[(i * 5) % DEMO_AGO_MINUTES.length],
  };
});

const AVATAR_TONES = [
  "from-[#DC2626] to-[#B91C1C]",
  "from-[#8B5E34] to-[#5A4A32]",
  "from-[#EF4444] to-[#DC2626]",
  "from-[#C8923F] to-[#A9741F]",
  "from-[#6B5A40] to-[#3B2F1E]",
  "from-[#B91C1C] to-[#991B1B]",
];

function RecentSubscriptionActivity() {
  const { t, locale } = useSubscriptionText();
  const [activeIndex, setActiveIndex] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastDismissed, setToastDismissed] = useState(false);
  const isBn = Boolean(locale?.toLowerCase().startsWith("bn"));
  const numberLocale = isBn ? "bn-BD" : "en-US";

  useEffect(() => {
    if (!DEMO_ACTIVITY_ENABLED) return;
    let hideTimer: number | undefined;
    const showToast = () => {
      setToastVisible(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(
        () => setToastVisible(false),
        DEMO_TOAST_VISIBLE_MS,
      );
    };
    const firstToast = window.setTimeout(showToast, 1500);
    const cycle = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % DEMO_PURCHASES.length);
      setToastDismissed(false);
      showToast();
    }, DEMO_TOAST_INTERVAL_MS);
    return () => {
      window.clearTimeout(firstToast);
      window.clearTimeout(hideTimer);
      window.clearInterval(cycle);
    };
  }, []);

  if (!DEMO_ACTIVITY_ENABLED) return null;

  const at = (offset: number) =>
    DEMO_PURCHASES[
      (activeIndex - offset + DEMO_PURCHASES.length) % DEMO_PURCHASES.length
    ];
  const activePurchase = at(0);
  const timeLabel = (p: DemoPurchase) =>
    p.minutes === 0
      ? t("Bought just now")
      : formatAgo(p.minutes, isBn, numberLocale);

  return (
    <>
      <section
        aria-label={t("Recent subscription activity")}
        className="relative overflow-hidden rounded-2xl border border-[#E3D6B8] bg-gradient-to-br from-[#FBF6E8] via-[#F6EEDB] to-[#F3E9D2] p-4 text-[#3B2F1E] shadow-sm sm:p-5"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FBB6B6]/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-[#F6D9A8]/50 blur-2xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <div className="flex items-center gap-2.5 text-base font-extrabold text-[#3B2F1E] sm:text-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DC2626] text-white shadow-sm">
              <Users size={16} />
            </span>
            <span>{t("Recent subscription activity")}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-[#FBF6E8]/80 px-3 py-1.5 text-sm font-bold text-emerald-700 backdrop-blur sm:text-base">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {isBn ? "লাইভ আপডেট" : "Live updates"}
          </span>
        </div>

        <div className="relative mt-2.5 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8]/80 px-3 py-2 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold text-[#6B5A40] sm:text-base">
              {t("Total buyers")}
            </p>
            <p className="mt-0.5 text-3xl font-black leading-none tabular-nums text-[#DC2626] sm:text-3xl">
              {DEMO_TOTAL_BUYERS.toLocaleString(numberLocale)}
              <span className="text-xl">+</span>
            </p>
          </div>
          <div className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8]/80 px-3 py-2 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold text-[#6B5A40] sm:text-base">
              {t("Bought today")}
            </p>
            <p className="mt-0.5 text-3xl font-black leading-none tabular-nums text-[#DC2626] sm:text-3xl">
              {DEMO_BOUGHT_TODAY.toLocaleString(numberLocale)}
            </p>
          </div>
        </div>

        <ul className="relative mt-2 space-y-1.5" aria-live="off">
          {[0].map((offset) => {
            const p = at(offset);
            const tone =
              AVATAR_TONES[
                (activeIndex - offset + DEMO_PURCHASES.length * 6) %
                  AVATAR_TONES.length
              ];
            return (
              <li
                key={`${activeIndex - offset}`}
                style={{
                  opacity: offset === 0 ? 1 : offset === 1 ? 0.7 : 0.4,
                  animation: "sub-feed-in 250ms ease-out",
                }}
                className="flex items-center gap-3 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8]/80 px-3 py-3 backdrop-blur"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tone} text-[13px] font-black text-white shadow-sm`}
                >
                  {p.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-extrabold text-[#3B2F1E] sm:text-lg">
                    {p.name}
                  </p>
                  <p className="text-sm text-[#6B5A40] sm:text-base">
                    {t(`${plans[activeIndex % plans.length].name} plan`)} · {formatPrice(plans[activeIndex % plans.length].price)}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-[#B91C1C] sm:text-base">
                  <Clock3 size={13} />
                  {timeLabel(p)}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="relative mt-2 text-right text-[12px] font-semibold uppercase tracking-wider text-[#7A6A50] sm:text-sm">
          Data
        </p>
      </section>

      <div
        aria-live="polite"
        aria-label={t("Purchase notification")}
        className={`fixed bottom-4 left-4 z-[45] w-[min(330px,calc(100vw-32px))] transition-all duration-300 sm:bottom-5 sm:left-5 ${toastVisible && !toastDismissed ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
      >
        <div className="overflow-hidden rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-xl">
          <div className="flex items-center justify-between gap-2 bg-[#DC2626] px-3 py-2 text-white">
            <span className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wide">
              <ShoppingBag size={13} /> {t("Purchase notification")}
            </span>
            <button
              type="button"
              onClick={() => setToastDismissed(true)}
              aria-label="Close purchase notification"
              className="rounded-md p-0.5 text-[#FBB6B6] transition hover:bg-white/15 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          <div
            key={activePurchase.name}
            className="flex items-center gap-3 p-3"
            style={{ animation: "sub-feed-in 200ms ease-out" }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEE9E9] text-sm font-black text-[#DC2626] ring-1 ring-inset ring-[#FBB6B6]">
              {activePurchase.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-extrabold text-[#3B2F1E]">
                {activePurchase.name}
              </p>
              <p className="mt-0.5 text-sm text-[#5A4A32]">
                {t(`${plans[activeIndex % plans.length].name} plan`)} · {formatPrice(plans[activeIndex % plans.length].price)}
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#B91C1C] sm:text-base">
                <Clock3 size={13} /> {timeLabel(activePurchase)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SubscriptionPage() {
  type SubscriptionStatus = {
    id: string;
    planId: string;
    planName: string;
    amount: number;
    paymentStatus: string;
    accessStatus: string;
    startedAt: string | null;
    expiresAt: string | null;
  };
  type PendingSubscriptionStatus = {
    id: string;
    planName: string;
    amount: number;
    paymentMethod: string;
    transactionId: string;
    submittedAt: string | null;
    reviewStatus: string;
  };

  const { t, locale } = useSubscriptionText();
  const [selectedId, setSelectedId] = useState<string>("1-month");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPipraPayProcessing, setIsPipraPayProcessing] = useState(false);
  const [isPipraPayEnabled, setIsPipraPayEnabled] = useState(false);
  const [isUddoktaPayProcessing, setIsUddoktaPayProcessing] = useState(false);
  const [isUddoktaPayEnabled, setIsUddoktaPayEnabled] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [currentSubscription, setCurrentSubscription] =
    useState<SubscriptionStatus | null>(null);
  const [pendingSubscription, setPendingSubscription] =
    useState<PendingSubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const selected = plans.find((plan) => plan.id === selectedId) ?? plans[0];

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(
      locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-BD",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
    );
  };

  const loadCurrentSubscription = async () => {
    try {
      setSubscriptionLoading(true);
      const response = await fetch("/api/subscription/current", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setCurrentSubscription(null);
        setPendingSubscription(null);
        return;
      }
      setCurrentSubscription(data?.subscription ?? null);
      setPendingSubscription(data?.pendingSubscription ?? null);
    } catch (error) {
      console.error("Failed to load current subscription:", error);
      setCurrentSubscription(null);
      setPendingSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    void loadCurrentSubscription();
    const controller = new AbortController();
    void fetch("/api/payment/piprapay-status", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.ok && data?.success) setIsPipraPayEnabled(data.enabled === true);
      })
      .catch((error) => {
        if (!controller.signal.aborted) console.error("Failed to load PipraPay checkout status:", error);
      });
    void fetch("/api/uddoktapay/status", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.ok && data?.success) setIsUddoktaPayEnabled(data.enabled === true);
      })
      .catch((error) => {
        if (!controller.signal.aborted) console.error("Failed to load UddoktaPay checkout status:", error);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setPaymentError("");
  };

  const handlePipraPayCheckout = async () => {
    if (isPipraPayProcessing || isUddoktaPayProcessing || isProcessing || !isPipraPayEnabled) return;
    setIsPipraPayProcessing(true);
    setPaymentError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selected.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success !== true || typeof data?.payment_url !== "string") {
        throw new Error(data?.message || "PipraPay payment could not be started. Please try again.");
      }
      const checkoutUrl = new URL(data.payment_url);
      if (checkoutUrl.protocol !== "https:") {
        throw new Error("PipraPay returned an unsafe checkout URL. Please contact support.");
      }
      window.location.assign(checkoutUrl.toString());
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "PipraPay payment could not be started. Please try again.");
      setIsPipraPayProcessing(false);
    }
  };

  const handleUddoktaPayCheckout = async () => {
    if (isUddoktaPayProcessing || isPipraPayProcessing || isProcessing || !isUddoktaPayEnabled) return;
    setIsUddoktaPayProcessing(true);
    setPaymentError("");
    try {
      const response = await fetch("/api/uddoktapay/checkout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selected.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success !== true || typeof data?.payment_url !== "string") {
        throw new Error(data?.message || "UddoktaPay payment could not be started. Please try again.");
      }
      const checkoutUrl = new URL(data.payment_url);
      if (checkoutUrl.protocol !== "https:") throw new Error("UddoktaPay returned an unsafe checkout URL. Please contact support.");
      window.location.assign(checkoutUrl.toString());
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "UddoktaPay payment could not be started. Please try again.");
      setIsUddoktaPayProcessing(false);
    }
  };

  const handleContinue = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setPaymentError("");
    window.location.href = `/payment/manual?plan=${encodeURIComponent(selected.id)}`;
  };

  return (
    <div className="page-font flex min-h-screen flex-col bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] font-sans text-[#3B2F1E] lg:h-dvh lg:overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .page-font.page-font, .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        .page-font h1, .page-font h2, .page-font h3, .page-font h4 { letter-spacing: -0.01em; }
        .scroll { scrollbar-width: thin; scrollbar-color: #F87171 transparent; }
        .scroll::-webkit-scrollbar { width: 12px; height: 12px; }
        .scroll::-webkit-scrollbar-track { background: rgba(148,163,184,0.18); border-radius: 999px; margin: 10px 0; }
        .scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#F87171,#DC2626); border-radius: 999px; border: 3px solid #F2E8D2; min-height: 48px; }
        .scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,#EF4444,#B91C1C); }
      `}</style>
      <DashboardNavbar />
      <main className="font-bengali-ui scroll flex min-h-0 flex-1 flex-col overflow-y-auto lg:overflow-y-auto">
        <div
          data-nav-content
          className="mx-auto grid w-full max-w-[1480px] items-start gap-3 px-3 py-3 sm:px-4 lg:h-auto lg:min-h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,0.98fr)] lg:gap-3 lg:py-2 xl:gap-5 [@media(max-height:800px)]:lg:h-auto [@media(max-height:800px)]:lg:py-3"
        >
          <div className="flex min-w-0 flex-col gap-2 lg:min-h-0">
            <section
              aria-label={t("Subscription offer video")}
              className="w-full"
            >
              <OfferVideoFrame
                src="/intro/subscrioptionvideointro.mp4"
                playLabel={t("Watch video")}
                replayLabel={t("Replay video")}
                maxHeightDvh={30}
                hideControls
              />
            </section>

            <section aria-label={t("Current subscription")}>
              {subscriptionLoading ? (
                <div
                  aria-busy="true"
                  className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-6 shadow-sm"
                >
                  <div className="h-4 w-24 animate-pulse rounded bg-[#F3E9D2]" />
                  <div className="mt-4 h-6 w-36 animate-pulse rounded bg-[#F3E9D2]" />
                  <div className="mt-6 h-2 w-full animate-pulse rounded-full bg-[#F3E9D2]" />
                </div>
              ) : currentSubscription ? (
                (() => {
                  const { expired, daysLeft, progress } =
                    getTiming(currentSubscription);
                  const statusLabel = expired
                    ? "Expired"
                    : capitalize(currentSubscription.accessStatus) || "Active";
                  const isActive = statusLabel === "Active";
                  const RING_R = 52;
                  const RING_C = 2 * Math.PI * RING_R;
                  const remainingPct = expired
                    ? 0
                    : progress === null
                      ? null
                      : 100 - progress;
                  const ringStroke = expired
                    ? "stroke-[#D8C9A6]"
                    : remainingPct !== null && remainingPct < 10
                      ? "stroke-[#B91C1C]"
                      : "stroke-[#DC2626]";
                  const ringMain = expired
                    ? "0"
                    : daysLeft === null
                      ? "—"
                      : daysLeft === 0
                        ? "<1"
                        : String(daysLeft);
                  const ringLabel =
                    daysLeft === 1 || (daysLeft === 0 && !expired)
                      ? "day left"
                      : "days left";

                  return (
                    <div className="overflow-hidden rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-sm">
                      <div className="flex flex-col items-center gap-2 p-[clamp(8px,1.2vh,14px)] sm:flex-row sm:gap-4">
                        <div className="relative h-[clamp(76px,10.5vh,104px)] w-[clamp(76px,10.5vh,104px)] shrink-0">
                          <svg
                            viewBox="0 0 120 120"
                            className="h-full w-full -rotate-90"
                            aria-hidden="true"
                          >
                            <circle
                              cx="60"
                              cy="60"
                              r={RING_R}
                              fill="none"
                              strokeWidth="9"
                              className="stroke-[#E3D6B8]"
                            />
                            {remainingPct !== null && remainingPct > 0 && (
                              <circle
                                cx="60"
                                cy="60"
                                r={RING_R}
                                fill="none"
                                strokeWidth="9"
                                strokeLinecap="round"
                                strokeDasharray={`${(RING_C * remainingPct) / 100} ${RING_C}`}
                                className={`${ringStroke} transition-[stroke-dasharray] duration-700`}
                              />
                            )}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[clamp(20px,3.2vh,30px)] font-semibold leading-none tabular-nums text-[#3B2F1E]">
                              {ringMain}
                            </span>
                            <span className="mt-1 text-[13px] text-[#6B5A40]">
                              <T>{ringLabel}</T>
                            </span>
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 text-center sm:text-left">
                          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-start">
                            <h2 className="text-[clamp(18px,2.8vh,24px)] font-semibold tracking-tight text-[#3B2F1E]">
                              <T>{currentSubscription.planName}</T>
                            </h2>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ring-inset ${isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-[#F3E9D2] text-[#5A4A32] ring-[#E3D6B8]"}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-[#B0A080]"}`}
                              />
                              <T>{statusLabel}</T>
                            </span>
                          </div>
                          <p className="mx-auto mt-1.5 max-w-md rounded-lg border-l-4 border-red-500 bg-[#FEE9E9] px-3 py-1.5 text-left text-sm font-medium leading-4 text-red-700 sm:mx-0">
                            {expired ? (
                              <>
                                <T>{"This plan ended on"}</T>{" "}
                                <strong className="font-bold text-red-800">
                                  {formatDate(currentSubscription.expiresAt)}
                                </strong>
                                <T>{". Choose a plan below to renew."}</T>
                              </>
                            ) : (
                              <>
                                <T>{"Your access is active until"}</T>{" "}
                                <strong className="font-bold text-red-800">
                                  {formatDate(currentSubscription.expiresAt)}
                                </strong>
                                <T>
                                  {
                                    ". You can choose any plan whenever you want."
                                  }
                                </T>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <dl className="grid grid-cols-1 divide-y divide-[#E3D6B8] border-t border-[#E3D6B8] bg-[#F6EEDB]/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="flex items-center gap-2 px-3 py-[clamp(5px,0.8vh,10px)] sm:px-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FBF6E8] text-[#DC2626] ring-1 ring-[#E3D6B8]">
                            <Wallet size={15} />
                          </span>
                          <div>
                            <dt className="text-sm text-[#6B5A40]">
                              <T>{"Amount paid"}</T>
                            </dt>
                            <dd className="text-base font-semibold text-[#3B2F1E]">
                              {formatPrice(currentSubscription.amount)}
                            </dd>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-[clamp(5px,0.8vh,10px)] sm:px-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FBF6E8] text-[#DC2626] ring-1 ring-[#E3D6B8]">
                            <CalendarCheck size={15} />
                          </span>
                          <div>
                            <dt className="text-sm text-[#6B5A40]">
                              <T>{"Started"}</T>
                            </dt>
                            <dd className="text-base font-semibold text-[#3B2F1E]">
                              {formatDate(currentSubscription.startedAt)}
                            </dd>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-[clamp(5px,0.8vh,10px)] sm:px-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FBF6E8] text-[#DC2626] ring-1 ring-[#E3D6B8]">
                            <CalendarClock size={15} />
                          </span>
                          <div>
                            <dt className="text-sm text-[#6B5A40]">
                              {expired ? <T>{"Ended"}</T> : <T>{"Expires"}</T>}
                            </dt>
                            <dd className="text-base font-semibold text-[#3B2F1E]">
                              {formatDate(currentSubscription.expiresAt)}
                            </dd>
                          </div>
                        </div>
                      </dl>
                    </div>
                  );
                })()
              ) : null}
            </section>

            {pendingSubscription && (
              <section
                aria-label={t("Payment review in progress")}
                aria-live="polite"
                className="relative isolate overflow-hidden rounded-3xl border border-[#D8C9A6] bg-gradient-to-br from-[#FFF9E8] via-[#FBF6E8] to-[#FFF1D1] p-5 shadow-sm sm:p-6"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#FBB6B6]/25 blur-3xl"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-14 left-1/3 h-32 w-32 rounded-full bg-[#F6D9A8]/50 blur-3xl"
                />
                <div className="relative flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#DC2626] text-white shadow-sm">
                    <Clock3 size={24} strokeWidth={2.3} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-xl font-black tracking-tight text-[#3B2F1E] sm:text-2xl">
                        <T>{"Payment review in progress"}</T>
                      </h2>
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#FBB6B6] bg-[#FBF6E8]/90 px-3 py-1.5 text-sm font-extrabold text-[#B91C1C] shadow-sm sm:text-base">
                        <span className="h-2 w-2 rounded-full bg-[#DC2626] shadow-[0_0_0_3px_rgba(220,38,38,0.15)]" />
                        <T>{"Waiting for review"}</T>
                      </span>
                    </div>
                    <p className="mt-2 max-w-2xl text-lg leading-7 text-[#3B2F1E]/90 sm:text-[19px] sm:leading-8">
                      <T>
                        {
                          "Your payment details have been submitted. Paid access starts after admin approval."
                        }
                      </T>
                    </p>
                    <dl className="mt-5 grid gap-2 sm:grid-cols-2">
                      <div className="min-w-0 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8]/85 px-4 py-3 shadow-sm">
                        <dt className="text-sm font-bold text-[#6B5A40] sm:text-base">
                          প্ল্যান ও মূল্য
                        </dt>
                        <dd className="mt-1 text-lg font-extrabold text-[#3B2F1E] sm:text-[19px]">
                          {pendingSubscription.planName} ·{" "}
                          {formatPrice(pendingSubscription.amount)}
                        </dd>
                      </div>
                      {pendingSubscription.paymentMethod && (
                        <div className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8]/85 px-4 py-3 shadow-sm">
                          <dt className="text-sm font-bold text-[#6B5A40] sm:text-base">
                            পেমেন্ট মাধ্যম
                          </dt>
                          <dd className="mt-1 text-lg font-extrabold text-[#3B2F1E] sm:text-[19px]">
                            {pendingSubscription.paymentMethod}
                          </dd>
                        </div>
                      )}
                      {pendingSubscription.transactionId && (
                        <div className="min-w-0 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8]/85 px-4 py-3 shadow-sm">
                          <dt className="text-sm font-bold text-[#6B5A40] sm:text-base">
                            <T>{"Transaction ID"}</T>
                          </dt>
                          <dd className="mt-1 break-all font-mono text-lg font-extrabold tracking-wide text-[#3B2F1E] sm:text-[19px]">
                            {pendingSubscription.transactionId}
                          </dd>
                        </div>
                      )}
                      {pendingSubscription.submittedAt && (
                        <div className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8]/85 px-4 py-3 shadow-sm">
                          <dt className="text-sm font-bold text-[#6B5A40] sm:text-base">
                            জমা দেওয়ার তারিখ
                          </dt>
                          <dd className="mt-1 text-lg font-extrabold text-[#3B2F1E] sm:text-[19px]">
                            {formatDate(pendingSubscription.submittedAt)}
                          </dd>
                        </div>
                      )}
                    </dl>
                    <p className="mt-4 flex items-start gap-2 rounded-xl border border-[#D8C9A6] bg-[#F6EEDB] px-3.5 py-3 text-base font-semibold leading-6 text-[#3B2F1E] sm:text-lg sm:leading-7">
                      <ShieldCheck size={19} className="mt-0.5 shrink-0" />
                      অ্যাডমিন পেমেন্টের তথ্য যাচাই করে Approve করলেই আপনার পেইড
                      অ্যাক্সেস চালু হবে।
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section
              aria-label={t("Continue to payment")}
              className="flex w-full flex-col items-center justify-center gap-2 py-0.5 text-center"
            >
              {isPipraPayEnabled && (
                <button
                  type="button"
                  onClick={() => void handlePipraPayCheckout()}
                  disabled={isPipraPayProcessing || isUddoktaPayProcessing || isProcessing}
                  className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl bg-[#166534] px-6 py-2.5 text-center text-base font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#14532D] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EFE5CE] disabled:cursor-not-allowed disabled:opacity-70 sm:px-8"
                >
                  <Wallet size={18} />
                  {isPipraPayProcessing ? "PipraPay checkout খুলছে…" : `অনলাইনে পেমেন্ট করুন · ${formatPrice(selected.price)}`}
                </button>
              )}
              {isUddoktaPayEnabled && (
                <button
                  type="button"
                  onClick={() => void handleUddoktaPayCheckout()}
                  disabled={isUddoktaPayProcessing || isPipraPayProcessing || isProcessing}
                  className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 py-2.5 text-center text-base font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#115E59] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EFE5CE] disabled:cursor-not-allowed disabled:opacity-70 sm:px-8"
                >
                  <Wallet size={18} />
                  {isUddoktaPayProcessing ? "UddoktaPay checkout খুলছে…" : `UddoktaPay দিয়ে পেমেন্ট করুন · ${formatPrice(selected.price)}`}
                </button>
              )}
              <button
                type="button"
                onClick={handleContinue}
                disabled={isProcessing || isPipraPayProcessing || isUddoktaPayProcessing}
                className={`inline-flex min-h-10 max-w-full items-center justify-center rounded-xl px-6 py-2 text-center text-base font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EFE5CE] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:px-8 ${isPipraPayEnabled ? "border border-[#D8C9A6] bg-[#FBF6E8] text-[#5A4A32] hover:bg-[#F6EEDB]" : "bg-[#D42020] text-white hover:bg-[#AE1717]"}`}
              >
                {isProcessing ? (
                  <T>{"Opening payment page..."}</T>
                ) : (
                  "bKash / Nagad দিয়ে Manual Payment করুন"
                )}
              </button>
              {!isPipraPayEnabled && !isUddoktaPayEnabled && (
                <p className="text-xs font-medium text-[#7A6A50]">অনলাইন পেমেন্ট বর্তমানে চালু নেই। আপাতত Manual bKash / Nagad Payment ব্যবহার করতে পারবেন।</p>
              )}
              {paymentError && (
                <p
                  role="alert"
                  className="w-full max-w-xl rounded-lg border border-[#FBB6B6] bg-[#FEE9E9] px-4 py-2.5 text-sm font-semibold text-red-700"
                >
                  <T>{paymentError}</T>
                </p>
              )}
            </section>

            <section
              role="radiogroup"
              aria-label={t("Subscription plans")}
              className="mx-auto grid w-full max-w-[840px] grid-cols-1 pt-2"
            >
              {plans.map((plan) => {
                const isSelected = plan.id === selectedId;
                const savings = getDiscount(plan.price, plan.regularPrice);
                const savingsAmount = plan.regularPrice - plan.price;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelect(plan.id)}
                    className={`group relative w-full rounded-2xl border text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${isSelected ? "border-[#DC2626] bg-[#F6D9A8] shadow-sm ring-2 ring-[#DC2626]/40" : "border-[#E3D6B8] bg-[#FBF6E8] hover:-translate-y-0.5 hover:border-[#D8C9A6] hover:bg-[#EFE3C8] hover:shadow-sm"}`}
                  >
                    <span className="absolute -top-2.5 left-4 inline-flex items-center rounded-full bg-[#DC2626] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-white shadow-sm">
                      <T>{plan.badge}</T>
                    </span>
                    <span
                      className={`absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? "border-[#DC2626] bg-[#DC2626]" : "border-[#D8C9A6] bg-[#FBF6E8]"}`}
                    >
                      <Check
                        size={13}
                        strokeWidth={3.5}
                        className={`text-white transition-all ${isSelected ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                      />
                    </span>

                    <div className="grid gap-3 p-3 pt-6 sm:p-4 sm:pt-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-5">
                      <div className="min-w-0 pr-7 sm:pr-8 md:pr-0">
                        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                          <h2 className="text-xl font-black tracking-tight text-[#3B2F1E] sm:text-2xl">
                            <T>{plan.name}</T>
                          </h2>
                          <span className="pb-0.5 text-sm font-semibold text-[#7A6A50]">
                            <T>{plan.duration}</T>
                          </span>
                        </div>
                        <p className="mt-1 max-w-lg text-sm leading-5 text-[#5A4A32]">
                          <T>{plan.note}</T>
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#FBB6B6] bg-[#FEE9E9] px-2 py-1 text-[12px] font-semibold text-[#B91C1C] sm:text-[13px]">
                            <Check size={13} strokeWidth={3} />
                            <T>
                              {
                                "AI Editor, AI Template, and Bulk Photo Edit are included"
                              }
                            </T>
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#E3D6B8] bg-[#F6EEDB] px-2 py-1 text-[12px] font-semibold text-[#5A4A32] sm:text-[13px]">
                            <Check size={13} strokeWidth={3} />
                            <T>{"One-time payment"}</T>
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#E3D6B8] bg-[#F6EEDB] px-2 py-1 text-[12px] font-semibold text-[#5A4A32] sm:text-[13px]">
                            <Check size={13} strokeWidth={3} />
                            <T>{"No auto-renewal"}</T>
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-[#E3D6B8] pt-2 md:min-w-[170px] md:border-l md:border-t-0 md:pl-5 md:pt-0 md:text-right">
                        <p className="flex items-center gap-2 text-sm font-semibold text-[#7A6A50] md:justify-end">
                          <T>{"Regular price"}</T>
                          <span className="text-base line-through decoration-[#7A6A50]">
                            {formatPrice(plan.regularPrice)}
                          </span>
                        </p>
                        <div className="mt-1 flex items-baseline gap-2 md:justify-end">
                          <span className="text-3xl font-black leading-none tracking-tight text-[#DC2626] sm:text-4xl">
                            {formatPrice(plan.price)}
                          </span>
                          <span className="text-sm font-semibold text-[#6B5A40]">
                            <T>{`/ ${plan.name}`}</T>
                          </span>
                        </div>
                        <span className="mt-2 inline-flex rounded-lg bg-[#FEE9E9] px-2.5 py-1 text-[12px] font-extrabold text-[#B91C1C] ring-1 ring-inset ring-[#FBB6B6] sm:text-sm">
                          <T>{`Save ${formatPrice(savingsAmount)} · ${savings}% OFF`}</T>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </section>

            <section className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2">
              <h2 className="text-sm font-black text-[#3B2F1E]">
                <T>{"Included with your subscription"}</T>
              </h2>
              <div className="mt-1 grid gap-x-3 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-1.5 text-[12px] font-medium leading-5 text-[#5A4A32] sm:text-[13px]"
                  >
                    <Check
                      size={14}
                      strokeWidth={3}
                      className="mt-0.5 shrink-0 text-[#DC2626]"
                    />
                    <span>
                      <T>{feature}</T>
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <div className="text-center">
              <Link
                href="/sohoj-tools"
                className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold text-[#DC2626] hover:underline"
              >
                <ArrowLeft size={14} />
                <T>{"Back to Tools"}</T>
              </Link>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2 lg:min-h-0">
            <RecentSubscriptionActivity />
            <ManualPaymentGuide amount={selected.price} />
          </div>
        </div>
      </main>
    </div>
  );
}
