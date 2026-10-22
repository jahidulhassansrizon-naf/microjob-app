"use client";

import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, CalendarClock, Check, Wallet } from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import OfferVideoFrame from "../_components/OfferVideoFrame";
import { SUBSCRIPTION_PLANS as plans, SUBSCRIPTION_PLAN_FEATURES as features } from "@/app/_lib/subscriptionPlans";

/* Subscription plan details are shared with checkout via app/_lib/subscriptionPlans.ts. */
const formatPrice = (value: number) => `৳${Math.round(value).toLocaleString("en-US")}`;
const getDiscount = (price: number, regularPrice: number) =>
  Math.max(0, Math.round((1 - price / regularPrice) * 100));
const DAY_MS = 24 * 60 * 60 * 1000;

function getTiming(sub: { startedAt: string | null; expiresAt: string | null }) {
  const start = sub.startedAt ? Date.parse(sub.startedAt) : NaN;
  const end = sub.expiresAt ? Date.parse(sub.expiresAt) : NaN;
  const now = Date.now();
  const hasEnd = Number.isFinite(end);
  const msLeft = hasEnd ? end - now : null;
  const expired = msLeft !== null && msLeft <= 0;
  const daysLeft = msLeft === null ? null : Math.max(0, Math.floor(msLeft / DAY_MS));
  const progress = Number.isFinite(start) && hasEnd && end > start
    ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
    : null;
  return { expired, daysLeft, progress };
}

const capitalize = (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";

const SUBSCRIPTION_BN: Record<string, string> = {
  "limited-time launch offer": "সীমিত সময়ের লঞ্চ অফার",
  "launch offer: get 30 days of access to all paid tools at a special price. pay once; renew only when you want.": "লঞ্চ অফারে বিশেষ কম দামে ৩০ দিনের জন্য সব পেইড টুল ব্যবহার করুন। একবার পেমেন্ট করুন; চাইলে পরের মাসে নিজে থেকে নবায়ন করুন।",
  "full access to all paid tools for 30 days": "৩০ দিনের জন্য সব পেইড টুলে পূর্ণ অ্যাক্সেস",
  "regular price": "নিয়মিত মূল্য",
  "/ 30 days": "/ ৩০ দিন",
  "ai editor, ai template, and bulk photo edit are included": "AI Editor, AI Template ও Bulk Photo Edit অন্তর্ভুক্ত",
  "one-time payment": "একবারের পেমেন্ট",
  "no auto-renewal": "স্বয়ংক্রিয় নবায়ন নেই",
  "included with your subscription": "আপনার সাবস্ক্রিপশনে যা যা থাকছে",
  "choose your subscription plan": "আপনার সাবস্ক্রিপশনের প্ল্যান নির্বাচন করুন",
  "current subscription": "বর্তমান সাবস্ক্রিপশন",
  "no active plan": "কোনো সক্রিয় প্ল্যান নেই",
  "choose a plan below to unlock all the paid tools.": "সব পেইড টুল ব্যবহার করতে নিচের যেকোনো একটি প্ল্যান বেছে নিন।",
  expired: "মেয়াদ শেষ",
  active: "সক্রিয়",
  "day left": "দিন বাকি",
  "days left": "দিন বাকি",
  "this plan ended on": "এই প্ল্যানের মেয়াদ শেষ হয়েছে",
  ". choose a plan below to renew.": "। নবায়ন করতে নিচের একটি প্ল্যান বেছে নিন।",
  "your access is active until": "আপনার অ্যাক্সেস চালু থাকবে",
  ". you can renew for another month whenever you want.": " পর্যন্ত। চাইলে পরবর্তী মাসের জন্য আবার নবায়ন করতে পারবেন।",
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
  "use the same account across supported tools": "সমর্থিত সব টুলে একই অ্যাকাউন্ট ব্যবহার করুন",
  "manage your subscription status from this page": "এই পেজ থেকেই আপনার সাবস্ক্রিপশনের অবস্থা পরিচালনা করুন",
  "payment verification and subscription access are handled automatically": "পেমেন্ট যাচাই ও সাবস্ক্রিপশন অ্যাক্সেস স্বয়ংক্রিয়ভাবে পরিচালিত হয়",
  "back to tools": "টুলসে ফিরে যান",
  "redirecting to payment...": "পেমেন্ট পেজে নেওয়া হচ্ছে...",
  "online payment is ready.": "অনলাইন পেমেন্টের ব্যবস্থা প্রস্তুত।",
  "unable to create payment request.": "পেমেন্টের অনুরোধ তৈরি করা যায়নি।",
  "payment could not be started. please try again.": "পেমেন্ট শুরু করা যায়নি। আবার চেষ্টা করুন।",
  "watch video": "ভিডিও দেখুন",
  "replay video": "আবার দেখুন",
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
  if (match) return `${translateSubscriptionText(match[1], locale, baseL)} নিয়ে এগিয়ে যান`;

  match = /^save\s+(৳[\d,]+)\s*·\s*(\d+)%\s*off$/i.exec(key);
  if (match) {
    const banglaDigits = (value: string) => value.replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
    return `${banglaDigits(match[1])} সাশ্রয় · ${banglaDigits(match[2])}% ছাড়`;
  }

  match = /^unlock 30-day access for (৳[\d,]+)$/i.exec(key);
  if (match) {
    const price = match[1].replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
    return `${price}-তে ৩০ দিনের অ্যাক্সেস নিন`;
  }

  match = /^(৳[\d,]+)\s*\/\s*month$/i.exec(key);
  if (match) return `${match[1]} / মাস`;

  match = /^save\s+(\d+)\s*%$/i.exec(key);
  if (match) return `${match[1]}% সাশ্রয়`;

  match = /^(\d+)\s+days? left$/i.exec(key);
  if (match) return `${match[1]} দিন বাকি`;

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
  const { locale, L: baseL } = useSohozI18n();
  const t = useCallback((value: string) => translateSubscriptionText(value, locale, baseL), [locale, baseL]);
  return { t, locale };
}

function T({ children }: { children: ReactNode }) {
  const { t } = useSubscriptionText();
  if (typeof children !== "string") return <>{children}</>;
  return <>{t(children)}</>;
}


const toBnDigits = (value: string | number) => String(value).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

function NagadPaymentGuide({ amount }: { amount: number }) {
  const bnAmount = toBnDigits(amount);
  const steps: { title: string; body: ReactNode }[] = [
    {
      title: "আনলক বাটনে ক্লিক করুন",
      body: <>উপরের নীল বাটনে চাপ দিন। পেমেন্টের পেজ খুলে যাবে।</>,
    },
    {
      title: "নগদ বেছে নিয়ে পে করুন",
      body: <><strong>Nagad Personal</strong> সিলেক্ট করুন, তারপর <strong>Pay {amount} BDT</strong> বাটনে চাপ দিন।</>,
    },
    {
      title: "আপনার নগদ নম্বর দিন",
      body: <>যে নগদ নম্বর থেকে টাকা পাঠাবেন, সেই নম্বরটি লিখে <strong>Submit</strong> চাপুন।</>,
    },
    {
      title: `নগদ অ্যাপ থেকে ঠিক ${bnAmount} টাকা পাঠান`,
      body: <>পেমেন্ট পেজে যে নম্বর দেখাবে, নগদ অ্যাপে <strong>Send Money</strong> দিয়ে সেই নম্বরে ঠিক <strong>{bnAmount} টাকা</strong> পাঠান। নম্বর ও টাকার পাশের <strong>Copy</strong> বাটন ব্যবহার করলে ভুল হবে না।</>,
    },
    {
      title: "ট্রানজেকশন আইডি (TrxID) জমা দিন",
      body: <>টাকা পাঠানো হয়ে গেলে নগদের মেসেজে একটি <strong>TrxID</strong> পাবেন। পেমেন্ট পেজের একদম নিচে <strong>&quot;Taking too long to verify? Submit Nagad Transaction ID&quot;</strong> লেখার নীল লিংকে ক্লিক করুন। তারপর ঘরে TrxID বসিয়ে <strong>Submit</strong> চাপুন।</>,
    },
    {
      title: "অ্যাক্সেস চালু হয়ে যাবে",
      body: <>পেমেন্ট যাচাই হলেই আপনার ৩০ দিনের অ্যাক্সেস চালু হবে।</>,
    },
  ];

  return (
    <section aria-label="নগদে পেমেন্ট করার নিয়ম" className="w-full rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-black text-[#0F172A] sm:text-2xl">নগদে পেমেন্ট করবেন যেভাবে</h2>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100">ধাপে ধাপে গাইড</span>
      </div>
      <ol className="mt-5 grid gap-3.5">
        {steps.map((step, index) => (
          <li key={step.title} className={`flex gap-4 rounded-xl border px-4 py-3.5 ${index === 4 ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50/60"}`}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-black text-white ${index === 4 ? "bg-amber-500" : "bg-[#2563EB]"}`}>{toBnDigits(index + 1)}</span>
            <div className="min-w-0">
              <p className="text-base font-extrabold text-[#0F172A] sm:text-lg">{step.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600 sm:text-[15px] sm:leading-7">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
        মনে রাখবেন: টাকা পাঠানোর পর TrxID জমা না দিলে অ্যাক্সেস চালু হতে দেরি হতে পারে। কোনো সমস্যা হলে আমাদের সাপোর্টে যোগাযোগ করুন।
      </p>
    </section>
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

  const { t, locale } = useSubscriptionText();
  const [selectedId, setSelectedId] = useState<string>("1-month");
  const [showNotice, setShowNotice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const selected = plans.find((plan) => plan.id === selectedId) ?? plans[0];

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
        return;
      }
      setCurrentSubscription(data?.subscription ?? null);
    } catch (error) {
      console.error("Failed to load current subscription:", error);
      setCurrentSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    void loadCurrentSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setShowNotice(false);
    setPaymentError("");
  };

  const handleContinue = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setShowNotice(false);
    setPaymentError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selected.price,
          metadata: {
            plan_id: selected.id,
            plan_name: selected.name,
            duration: selected.duration,
            months: selected.months,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.payment_url) {
        throw new Error(data?.message || "Unable to create payment request.");
      }
      window.location.href = data.payment_url;
    } catch (error) {
      console.error("Checkout error:", error);
      setPaymentError(error instanceof Error ? error.message : "Payment could not be started. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-[#0F172A] lg:h-dvh">
      <DashboardNavbar />
      <main className="flex min-h-0 flex-1 flex-col lg:overflow-y-auto">
        <div data-nav-content className="mx-auto my-auto grid w-full max-w-[1480px] items-start gap-6 px-4 py-[clamp(12px,3vh,40px)] lg:grid-cols-2 xl:gap-10">
          <div className="flex min-w-0 flex-col gap-[clamp(10px,2vh,24px)]">
          <section aria-label={t("Subscription offer video")} className="w-full">
            <OfferVideoFrame
              src="/offervideo/offerwoman2.mp4"
              playLabel={t("Watch video")}
              replayLabel={t("Replay video")}
            />
          </section>

          <section aria-label={t("Current subscription")}>
            {subscriptionLoading ? (
              <div aria-busy="true" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                <div className="mt-4 h-6 w-36 animate-pulse rounded bg-slate-100" />
                <div className="mt-6 h-2 w-full animate-pulse rounded-full bg-slate-100" />
              </div>
            ) : currentSubscription ? (
              (() => {
                const { expired, daysLeft, progress } = getTiming(currentSubscription);
                const statusLabel = expired ? "Expired" : capitalize(currentSubscription.accessStatus) || "Active";
                const isActive = statusLabel === "Active";
                const RING_R = 52;
                const RING_C = 2 * Math.PI * RING_R;
                const remainingPct = expired ? 0 : progress === null ? null : 100 - progress;
                const ringStroke = expired
                  ? "stroke-slate-300"
                  : remainingPct !== null && remainingPct < 10
                    ? "stroke-amber-500"
                    : "stroke-[#2563EB]";
                const ringMain = expired ? "0" : daysLeft === null ? "—" : daysLeft === 0 ? "<1" : String(daysLeft);
                const ringLabel = daysLeft === 1 || (daysLeft === 0 && !expired) ? "day left" : "days left";

                return (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col items-center gap-4 p-[clamp(14px,2.6vh,32px)] sm:flex-row sm:gap-6">
                      <div className="relative h-[clamp(84px,12vh,128px)] w-[clamp(84px,12vh,128px)] shrink-0">
                        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
                          <circle cx="60" cy="60" r={RING_R} fill="none" strokeWidth="9" className="stroke-slate-100" />
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
                          <span className="text-[clamp(20px,3.2vh,30px)] font-semibold leading-none tabular-nums text-[#0F172A]">{ringMain}</span>
                          <span className="mt-1 text-[11px] text-slate-500"><T>{ringLabel}</T></span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-start">
                          <h2 className="text-[clamp(18px,2.8vh,24px)] font-semibold tracking-tight text-[#0F172A]"><T>{currentSubscription.planName}</T></h2>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                            <T>{statusLabel}</T>
                          </span>
                        </div>
                        <p className="mx-auto mt-2.5 max-w-md rounded-lg border-l-4 border-red-500 bg-red-50 px-4 py-2 text-left text-[13px] font-medium leading-5 text-red-700 sm:mx-0">
                          {expired ? (
                            <>
                              <T>{"This plan ended on"}</T>{" "}
                              <strong className="font-bold text-red-800">{formatDate(currentSubscription.expiresAt)}</strong>
                              <T>{". Choose a plan below to renew."}</T>
                            </>
                          ) : (
                            <>
                              <T>{"Your access is active until"}</T>{" "}
                              <strong className="font-bold text-red-800">{formatDate(currentSubscription.expiresAt)}</strong>
                              <T>{". You can renew for another month whenever you want."}</T>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <dl className="grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                      <div className="flex items-center gap-3 px-5 py-[clamp(8px,1.5vh,16px)]">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2563EB] ring-1 ring-slate-200"><Wallet size={15} /></span>
                        <div>
                          <dt className="text-xs text-slate-500"><T>{"Amount paid"}</T></dt>
                          <dd className="text-sm font-semibold text-[#0F172A]">{formatPrice(currentSubscription.amount)}</dd>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 px-5 py-[clamp(8px,1.5vh,16px)]">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2563EB] ring-1 ring-slate-200"><CalendarCheck size={15} /></span>
                        <div>
                          <dt className="text-xs text-slate-500"><T>{"Started"}</T></dt>
                          <dd className="text-sm font-semibold text-[#0F172A]">{formatDate(currentSubscription.startedAt)}</dd>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 px-5 py-[clamp(8px,1.5vh,16px)]">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2563EB] ring-1 ring-slate-200"><CalendarClock size={15} /></span>
                        <div>
                          <dt className="text-xs text-slate-500">{expired ? <T>{"Ended"}</T> : <T>{"Expires"}</T>}</dt>
                          <dd className="text-sm font-semibold text-[#0F172A]">{formatDate(currentSubscription.expiresAt)}</dd>
                        </div>
                      </div>
                    </dl>
                  </div>
                );
              })()
            ) : null}
          </section>

          <section aria-label={t("Continue to payment")} className="flex w-full flex-col items-center justify-center gap-3 py-2 text-center">
            <button type="button" onClick={handleContinue} disabled={isProcessing} className="inline-flex min-h-12 max-w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-8 py-3.5 text-center text-sm font-bold text-white shadow-[0_10px_28px_-10px_rgba(37,99,235,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-10px_rgba(37,99,235,0.85)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:px-10">
              {isProcessing ? <T>{"Redirecting to payment..."}</T> : <T>{`Unlock 30-day access for ${formatPrice(selected.price)}`}</T>}
            </button>
            {showNotice && <p className="w-full max-w-xl rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600"><T>{"Online payment is ready."}</T></p>}
            {paymentError && <p role="alert" className="w-full max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700"><T>{paymentError}</T></p>}
          </section>

          <section role="radiogroup" aria-label={t("Subscription plans")} className="mx-auto grid w-full max-w-[840px] grid-cols-1 pt-3">
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
                  className={`group relative w-full rounded-2xl border text-left outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-[#2563EB]/25 ${isSelected ? "border-[#2563EB] bg-white shadow-[0_16px_44px_-18px_rgba(37,99,235,0.42)] ring-4 ring-[#2563EB]/10" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"}`}
                >
                  <span className="absolute -top-3 left-5 inline-flex items-center rounded-full border border-white/20 bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#4F7DF3] px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_6px_18px_-5px_rgba(37,99,235,0.65)] ring-1 ring-[#2563EB]/20">
                    <T>{plan.badge}</T>
                  </span>
                  <span className={`absolute right-5 top-5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? "border-[#2563EB] bg-[#2563EB]" : "border-slate-300 bg-white"}`}>
                    <Check size={13} strokeWidth={3.5} className={`text-white transition-all ${isSelected ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
                  </span>

                  <div className="grid gap-5 p-5 pt-8 sm:p-7 sm:pt-9 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8">
                    <div className="min-w-0 pr-8 sm:pr-10 md:pr-0">
                      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                        <h2 className="text-xl font-black tracking-tight text-[#0F172A] sm:text-2xl"><T>{plan.name}</T></h2>
                        <span className="pb-0.5 text-xs font-semibold text-slate-400"><T>{plan.duration}</T></span>
                      </div>
                      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600"><T>{plan.note}</T></p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                          <Check size={13} strokeWidth={3} /><T>{"AI Editor, AI Template, and Bulk Photo Edit are included"}</T>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                          <Check size={13} strokeWidth={3} /><T>{"One-time payment"}</T>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                          <Check size={13} strokeWidth={3} /><T>{"No auto-renewal"}</T>
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 md:min-w-[210px] md:border-l md:border-t-0 md:pl-8 md:pt-0 md:text-right">
                      <p className="flex items-center gap-2 text-xs font-semibold text-slate-400 md:justify-end">
                        <T>{"Regular price"}</T>
                        <span className="text-sm line-through decoration-slate-400">{formatPrice(plan.regularPrice)}</span>
                      </p>
                      <div className="mt-1 flex items-baseline gap-2 md:justify-end">
                        <span className="text-4xl font-black leading-none tracking-tight text-[#2563EB] sm:text-5xl">{formatPrice(plan.price)}</span>
                        <span className="text-xs font-semibold text-slate-500"><T>{"/ 30 days"}</T></span>
                      </div>
                      <span className="mt-3 inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                        <T>{`Save ${formatPrice(savingsAmount)} · ${savings}% OFF`}</T>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white px-5 py-[clamp(10px,1.8vh,20px)]">
            <h2 className="text-sm font-black text-[#0F172A]"><T>{"Included with your subscription"}</T></h2>
            <div className="mt-2 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-2 text-xs font-medium text-slate-600 sm:text-[13px]">
                  <Check size={14} strokeWidth={3} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span><T>{feature}</T></span>
                </div>
              ))}
            </div>
          </section>

          <div className="text-center">
            <Link href="/sohoj-tools" className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline">
              <ArrowLeft size={14} /><T>{"Back to Tools"}</T>
            </Link>
          </div>
          </div>

          <div className="min-w-0 lg:sticky lg:top-4">
            <NagadPaymentGuide amount={selected.price} />
          </div>
        </div>
      </main>
    </div>
  );
}
