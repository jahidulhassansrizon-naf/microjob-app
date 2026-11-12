"use client";

import { useSebaLagbeToolsI18n } from "@/app/sohoj-tools/_i18n";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  Check,
  Clock3,
  Copy,
  CreditCard,
  Images,
  LayoutTemplate,
  LifeBuoy,
  LoaderCircle,
  Lock,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import { WalletLogo } from "@/app/payment/manual/_components/WalletLogos";
import {
  SUBSCRIPTION_PLANS as DEFAULT_PLANS,
  type SubscriptionPlan,
} from "@/app/_lib/subscriptionPlans";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const formatPrice = (value: number) =>
  `৳${Math.round(value).toLocaleString("en-US")}`;
const getDiscount = (price: number, regularPrice: number) =>
  regularPrice > 0
    ? Math.max(0, Math.round((1 - price / regularPrice) * 100))
    : 0;
const DAY_MS = 24 * 60 * 60 * 1000;
const toBnDigits = (value: string | number) =>
  String(value).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

function getTiming(sub: { startedAt: string | null; expiresAt: string | null }) {
  const end = sub.expiresAt ? Date.parse(sub.expiresAt) : NaN;
  const hasEnd = Number.isFinite(end);
  const msLeft = hasEnd ? end - Date.now() : null;
  const expired = msLeft !== null && msLeft <= 0;
  const daysLeft =
    msLeft === null ? null : Math.max(0, Math.floor(msLeft / DAY_MS));
  return { expired, daysLeft };
}

const capitalize = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";

/* ------------------------------------------------------------------ */
/* Bangla translation for plan names / badges (admin-managed plans)    */
/* ------------------------------------------------------------------ */
const SUBSCRIPTION_BN: Record<string, string> = {
  "1 month": "১ মাস",
  "3 months": "৩ মাস",
  "6 months": "৬ মাস",
  "1 year": "১ বছর",
  "30 days": "৩০ দিন",
  "90 days": "৯০ দিন",
  "180 days": "১৮০ দিন",
  "365 days": "৩৬৫ দিন",
  "monthly plan": "মাসিক প্ল্যান",
  "most popular": "সবচেয়ে জনপ্রিয়",
  "best value": "সবচেয়ে সাশ্রয়ী",
  "most chosen": "সবচেয়ে জনপ্রিয়",
  "regular price": "নিয়মিত মূল্য",
  expired: "মেয়াদ শেষ",
  active: "সক্রিয়",
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

  const match = /^save\s+(৳[\d,]+)\s*·\s*(\d+)%\s*off$/i.exec(key);
  if (match) {
    return `${toBnDigits(match[1])} সাশ্রয় · ${toBnDigits(match[2])}% ছাড়`;
  }

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

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type SubscriptionStatus = {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  paymentStatus: string;
  accessStatus: string;
  startedAt: string | null;
  expiresAt: string | null;
  source?: string;
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
type ManualInfo = {
  paymentNumbers: Record<string, string>;
};
type PayMode = "auto" | "manual" | null;
type GatewayKey = "uddokta" | "pipra";

/* ------------------------------------------------------------------ */
/* Left side: premium features                                         */
/* ------------------------------------------------------------------ */
const TOOL_FEATURES: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}[] = [
  {
    icon: Sparkles,
    title: "AI Editor",
    body: "AI দিয়ে ছবি এডিট ও প্রসেস করুন, কোনো ঝামেলা ছাড়াই।",
  },
  {
    icon: LayoutTemplate,
    title: "AI Template",
    body: "রেডিমেড টেমপ্লেট দিয়ে দ্রুত ডিজাইন তৈরি করুন।",
  },
  {
    icon: Images,
    title: "Bulk Photo Edit",
    body: "একসাথে অনেকগুলো ছবি এডিট করে সময় বাঁচান।",
  },
];

const PERKS: { icon: typeof Check; text: string }[] = [
  { icon: BadgeCheck, text: "সব পেইড টুলে পূর্ণ অ্যাক্সেস" },
  { icon: Check, text: "সব টুলে একই অ্যাকাউন্ট ব্যবহার করুন" },
  { icon: Check, text: "একবারের পেমেন্ট, স্বয়ংক্রিয় নবায়ন নেই" },
  { icon: ShieldCheck, text: "যাচাই করা পেমেন্টের পরই অ্যাক্সেস চালু" },
  { icon: LifeBuoy, text: "সমস্যা হলে অ্যাডমিন সাপোর্ট" },
];

function FeaturesPanel() {
  return (
    <section
      aria-label="প্রিমিয়াম সুবিধা"
      className="overflow-hidden rounded-2xl border border-[#E8DFCC] bg-white shadow-sm"
    >
      <div className="bg-gradient-to-br from-[#DC2626] to-[#991B1B] px-6 py-6 text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
          <Sparkles size={13} /> Premium
        </span>
        <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
          প্রিমিয়াম চালু হলে
          <br />
          যা যা পাবেন
        </h2>
        <p className="mt-2 text-sm font-medium leading-6 text-red-100 sm:text-[15px]">
          একটি প্ল্যানেই সব পেইড টুল আনলক হয়ে যাবে।
        </p>
      </div>

      <div className="space-y-3 px-5 py-5">
        {TOOL_FEATURES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex items-start gap-3.5 rounded-xl border border-[#EEE6D3] bg-[#FCFAF5] px-4 py-3.5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#DC2626] ring-1 ring-inset ring-[#FECACA]">
              <Icon size={21} />
            </span>
            <div className="min-w-0">
              <p className="text-base font-bold text-[#2B2116]">{title}</p>
              <p className="mt-0.5 text-[13.5px] leading-5 text-[#5A4A32]">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <ul className="space-y-2.5 border-t border-[#EEE6D3] px-6 py-5">
        {PERKS.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-2.5 text-[14.5px] font-semibold text-[#3B2F1E]"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FEF2F2] text-[#DC2626]">
              <Icon size={14} strokeWidth={3} />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function SubscriptionPage() {
  const { t, locale } = useSubscriptionText();
  const isBn = Boolean(locale?.toLowerCase().startsWith("bn"));

  // Plans
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>(
    DEFAULT_PLANS[0]?.id || "1-month",
  );
  const selected =
    plans.find((plan) => plan.id === selectedId) ??
    plans[0] ??
    DEFAULT_PLANS[0];

  // Current / pending subscription
  const [currentSubscription, setCurrentSubscription] =
    useState<SubscriptionStatus | null>(null);
  const [pendingSubscription, setPendingSubscription] =
    useState<PendingSubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // Payment mode + gateways
  const [mode, setMode] = useState<PayMode>(null);
  const [isPipraPayEnabled, setIsPipraPayEnabled] = useState(false);
  const [isUddoktaPayEnabled, setIsUddoktaPayEnabled] = useState(false);
  const [gatewayStatusChecked, setGatewayStatusChecked] = useState(false);
  const [gatewayBusy, setGatewayBusy] = useState<GatewayKey | null>(null);
  const [paymentError, setPaymentError] = useState("");

  // Manual payment
  const [manualInfo, setManualInfo] = useState<ManualInfo | null>(null);
  const [manualState, setManualState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [manualLoadError, setManualLoadError] = useState("");
  const [manualWallet, setManualWallet] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [manualError, setManualError] = useState("");
  const [manualNotice, setManualNotice] = useState("");
  const [copiedWallet, setCopiedWallet] = useState("");

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(isBn ? "bn-BD" : "en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const loadCurrentSubscription = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void loadCurrentSubscription();
    const controller = new AbortController();

    void fetch("/api/subscription/plans", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (
          response.ok &&
          data?.success === true &&
          Array.isArray(data.plans) &&
          data.plans.length
        ) {
          const nextPlans = data.plans as SubscriptionPlan[];
          setPlans(nextPlans);
          setSelectedId((current) =>
            nextPlans.some((plan) => plan.id === current)
              ? current
              : nextPlans[0].id,
          );
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          console.error("Failed to load subscription plans:", error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setPlansLoading(false);
      });

    const pipra = fetch("/api/payment/piprapay-status", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.ok && data?.success)
          setIsPipraPayEnabled(data.enabled === true);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          console.error("Failed to load PipraPay checkout status:", error);
      });

    const uddokta = fetch("/api/uddoktapay/status", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.ok && data?.success)
          setIsUddoktaPayEnabled(data.enabled === true);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          console.error("Failed to load UddoktaPay checkout status:", error);
      });

    void Promise.all([pipra, uddokta]).finally(() => {
      if (!controller.signal.aborted) setGatewayStatusChecked(true);
    });

    return () => controller.abort();
  }, [loadCurrentSubscription]);

  const autoAvailable = isUddoktaPayEnabled || isPipraPayEnabled;

  // If online payment turns out to be off, fall back to manual automatically.
  useEffect(() => {
    if (gatewayStatusChecked && !autoAvailable && mode === "auto") {
      setMode("manual");
    }
  }, [gatewayStatusChecked, autoAvailable, mode]);

  /* ---------------- Manual payment: load numbers ---------------- */
  const loadManualInfo = useCallback(async (planId: string) => {
    setManualState("loading");
    setManualLoadError("");
    try {
      const response = await fetch(
        `/api/payment/manual-submit?plan=${encodeURIComponent(planId)}`,
        { credentials: "include", cache: "no-store" },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success)
        throw new Error(data?.message || "পেমেন্টের তথ্য লোড করা যায়নি।");
      setManualInfo({ paymentNumbers: data.paymentNumbers || {} });
      setManualState("ready");
    } catch (error) {
      setManualLoadError(
        error instanceof Error
          ? error.message
          : "পেমেন্টের তথ্য লোড করা যায়নি।",
      );
      setManualState("error");
    }
  }, []);

  useEffect(() => {
    if (mode === "manual" && manualState === "idle" && selected?.id) {
      void loadManualInfo(selected.id);
    }
  }, [mode, manualState, selected?.id, loadManualInfo]);

  const wallets = manualInfo
    ? Object.entries(manualInfo.paymentNumbers)
        .filter(([, number]) => Boolean(number))
        .map(([name, number]) => ({ name, number }))
    : [];
  const activeWallet =
    wallets.find((w) => w.name === manualWallet)?.name ||
    wallets[0]?.name ||
    "";

  const copyNumber = async (name: string, number: string) => {
    try {
      await navigator.clipboard.writeText(number);
      setCopiedWallet(name);
      window.setTimeout(() => setCopiedWallet(""), 1800);
    } catch {
      setManualError("নম্বর কপি করা যায়নি। নম্বরটি হাতে কপি করুন।");
    }
  };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !activeWallet) return;
    setSubmitting(true);
    setManualError("");
    setManualNotice("");
    try {
      const response = await fetch("/api/payment/manual-submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selected.id,
          paymentMethod: activeWallet,
          senderNumber,
          transactionId,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success)
        throw new Error(data?.message || "পেমেন্ট জমা দেওয়া যায়নি।");
      setManualNotice(
        data.message || "আপনার পেমেন্টের তথ্য জমা হয়েছে।",
      );
      setTransactionId("");
      setSenderNumber("");
      await loadCurrentSubscription();
    } catch (error) {
      setManualError(
        error instanceof Error ? error.message : "পেমেন্ট জমা দেওয়া যায়নি।",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- Auto payment (gateway) ---------------- */
  const startGateway = async (gateway: GatewayKey) => {
    if (gatewayBusy || plansLoading) return;
    const cfg =
      gateway === "uddokta"
        ? { url: "/api/uddoktapay/checkout", name: "UddoktaPay" }
        : { url: "/api/checkout", name: "PipraPay" };
    setGatewayBusy(gateway);
    setPaymentError("");
    try {
      const response = await fetch(cfg.url, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selected.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (
        !response.ok ||
        data?.success !== true ||
        typeof data?.payment_url !== "string"
      ) {
        throw new Error(
          data?.message ||
            `${cfg.name} payment could not be started. Please try again.`,
        );
      }
      const checkoutUrl = new URL(data.payment_url);
      if (checkoutUrl.protocol !== "https:")
        throw new Error(
          `${cfg.name} returned an unsafe checkout URL. Please contact support.`,
        );
      window.location.assign(checkoutUrl.toString());
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : `${cfg.name} payment could not be started. Please try again.`,
      );
      setGatewayBusy(null);
    }
  };

  const gateways: { key: GatewayKey; label: string }[] = [];
  if (isUddoktaPayEnabled)
    gateways.push({ key: "uddokta", label: "UddoktaPay" });
  if (isPipraPayEnabled) gateways.push({ key: "pipra", label: "PipraPay" });

  const handleSelectPlan = (id: string) => {
    setSelectedId(id);
    setPaymentError("");
  };

  const reviewPending = Boolean(pendingSubscription);

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="page-font flex min-h-screen flex-col bg-[#F0E6CF] font-sans text-[#2B2116] lg:h-dvh lg:overflow-hidden">
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
        .scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#F87171,#DC2626); border-radius: 999px; border: 3px solid #F0E6CF; min-height: 48px; }
        .scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,#EF4444,#B91C1C); }
        @keyframes sub-open { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <DashboardNavbar />
      <main className="font-bengali-ui scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div
          data-nav-content
          className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8"
        >
          {/* ---------- Header ---------- */}
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#2B2116] sm:text-3xl">
                আপনার সাবস্ক্রিপশন প্ল্যান বেছে নিন
              </h1>
              <p className="mt-1 text-sm font-medium text-[#5A4A32] sm:text-[15px]">
                একবার পেমেন্ট করুন, মেয়াদ শেষে চাইলে নিজে নবায়ন করুন।
              </p>
            </div>
            <Link
              href="/sohoj-tools"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E8DFCC] bg-white px-3.5 py-2 text-sm font-semibold text-[#5A4A32] shadow-sm transition hover:border-[#DC2626]/40 hover:text-[#DC2626]"
            >
              <ArrowLeft size={15} />
              টুলসে ফিরে যান
            </Link>
          </header>

          {/* ---------- Current subscription (compact) ---------- */}
          {subscriptionLoading ? (
            <div
              aria-busy="true"
              className="h-16 animate-pulse rounded-xl border border-[#E8DFCC] bg-white"
            />
          ) : currentSubscription ? (
            (() => {
              const { expired, daysLeft } = getTiming(currentSubscription);
              const statusLabel = expired
                ? "Expired"
                : capitalize(currentSubscription.accessStatus) || "Active";
              const isActive = statusLabel === "Active";
              return (
                <section
                  aria-label="বর্তমান সাবস্ক্রিপশন"
                  className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-[#E8DFCC] bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FEF2F2] text-[#DC2626] ring-1 ring-inset ring-[#FECACA]">
                      <BadgeCheck size={18} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#7A6A50]">
                        বর্তমান সাবস্ক্রিপশন
                      </p>
                      <p className="text-base font-bold text-[#2B2116]">
                        <T>{currentSubscription.planName}</T>
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ring-inset ${isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-[#F3E9D2] text-[#5A4A32] ring-[#E3D6B8]"}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-[#B0A080]"}`}
                    />
                    <T>{statusLabel}</T>
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium text-[#5A4A32]">
                    <CalendarClock size={16} className="text-[#DC2626]" />
                    {expired ? "মেয়াদ শেষ হয়েছে " : "মেয়াদ শেষ হবে "}
                    <strong className="font-bold text-[#2B2116]">
                      {formatDate(currentSubscription.expiresAt)}
                    </strong>
                    {!expired && daysLeft !== null && (
                      <span className="rounded bg-[#FEF2F2] px-1.5 py-0.5 text-xs font-bold text-[#B91C1C] ring-1 ring-inset ring-[#FECACA]">
                        {isBn ? toBnDigits(daysLeft) : daysLeft} দিন বাকি
                      </span>
                    )}
                  </div>
                </section>
              );
            })()
          ) : null}

          {/* ---------- Pending review (compact) ---------- */}
          {pendingSubscription && (
            <section
              aria-live="polite"
              className="flex flex-wrap items-start gap-3 rounded-xl border border-amber-200 bg-[#FFFBEB] px-4 py-3 shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DC2626] text-white">
                <Clock3 size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-[#2B2116]">
                  পেমেন্ট যাচাই চলছে
                </p>
                <p className="mt-0.5 text-sm font-medium leading-6 text-[#5A4A32]">
                  {pendingSubscription.planName} ·{" "}
                  {formatPrice(pendingSubscription.amount)}
                  {pendingSubscription.paymentMethod
                    ? ` · ${pendingSubscription.paymentMethod}`
                    : ""}
                  {pendingSubscription.transactionId ? (
                    <>
                      {" · TrxID: "}
                      <span className="font-mono font-bold">
                        {pendingSubscription.transactionId}
                      </span>
                    </>
                  ) : null}
                  <br />
                  অ্যাডমিন Approve করলেই আপনার পেইড অ্যাক্সেস চালু হবে।
                </p>
              </div>
            </section>
          )}

          {/* ---------- Main: features (left) + payment (right) ---------- */}
          <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.08fr]">
            {/* LEFT: premium features */}
            <FeaturesPanel />

            {/* RIGHT: payment panel */}
            <section
              aria-label="পেমেন্ট প্যানেল"
              className="rounded-2xl border border-[#E8DFCC] bg-white p-5 shadow-sm sm:p-6"
            >
              {/* Step 1: plan */}
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DC2626] text-sm font-bold text-white">
                  ১
                </span>
                <h2 className="text-lg font-bold text-[#2B2116]">
                  প্ল্যান বেছে নিন
                </h2>
              </div>

              <div
                role="radiogroup"
                aria-label="Subscription plans"
                className="mt-3 flex flex-col gap-2.5"
              >
                {plans.map((plan) => {
                  const isSelected = plan.id === selectedId;
                  const savings = getDiscount(plan.price, plan.regularPrice);
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      disabled={plansLoading}
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-[#DC2626]/30 ${isSelected ? "border-[#DC2626] bg-[#FFF8F6] shadow-sm ring-4 ring-[#DC2626]/10" : "border-[#E8DFCC] bg-white hover:border-[#D6C7A5]"}`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${isSelected ? "border-[#DC2626] bg-[#DC2626]" : "border-[#D8C9A6] bg-white"}`}
                      >
                        <Check
                          size={12}
                          strokeWidth={3.5}
                          className={`text-white transition-all ${isSelected ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h3 className="text-base font-bold text-[#2B2116]">
                            <T>{plan.name}</T>
                          </h3>
                          <span className="text-xs font-medium text-[#7A6A50]">
                            <T>{plan.duration}</T>
                          </span>
                          {plan.badge ? (
                            <span className="rounded-full bg-[#DC2626] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                              <T>{plan.badge}</T>
                            </span>
                          ) : null}
                        </div>
                        {plan.regularPrice > plan.price ? (
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#7A6A50]">
                            <span className="line-through decoration-[#9A8A6C]">
                              {formatPrice(plan.regularPrice)}
                            </span>
                            <span className="font-bold text-[#B91C1C]">
                              {isBn
                                ? `${toBnDigits(savings)}% ছাড়`
                                : `${savings}% OFF`}
                            </span>
                          </p>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-2xl font-extrabold leading-none tracking-tight text-[#DC2626]">
                        {formatPrice(plan.price)}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Step 2: payment method */}
              <div className="mt-6 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DC2626] text-sm font-bold text-white">
                  ২
                </span>
                <h2 className="text-lg font-bold text-[#2B2116]">
                  পেমেন্টের ধরন বেছে নিন
                </h2>
              </div>

              <div
                role="radiogroup"
                aria-label="Payment type"
                className="mt-3 grid gap-2.5 sm:grid-cols-2"
              >
                {/* Auto */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={mode === "auto"}
                  disabled={!autoAvailable}
                  onClick={() => {
                    setMode("auto");
                    setPaymentError("");
                  }}
                  className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-[#DC2626]/30 disabled:cursor-not-allowed disabled:opacity-55 ${mode === "auto" ? "border-[#0F766E] bg-[#F0FDFA] ring-4 ring-[#0F766E]/10" : "border-[#E8DFCC] bg-white hover:border-[#D6C7A5]"}`}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0F766E] text-white">
                    <CreditCard size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold text-[#2B2116]">
                      অটো পেমেন্ট
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-5 text-[#5A4A32]">
                      {!gatewayStatusChecked
                        ? "লোড হচ্ছে…"
                        : autoAvailable
                          ? "অনলাইনে পেমেন্ট, সাথে সাথে অ্যাক্সেস চালু"
                          : "বর্তমানে চালু নেই"}
                    </span>
                  </span>
                </button>

                {/* Manual */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={mode === "manual"}
                  onClick={() => {
                    setMode("manual");
                    setPaymentError("");
                  }}
                  className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-[#DC2626]/30 ${mode === "manual" ? "border-[#DC2626] bg-[#FFF8F6] ring-4 ring-[#DC2626]/10" : "border-[#E8DFCC] bg-white hover:border-[#D6C7A5]"}`}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DC2626] text-white">
                    <Wallet size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold text-[#2B2116]">
                      ম্যানুয়াল পেমেন্ট
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-5 text-[#5A4A32]">
                      Send Money করে TrxID জমা দিন
                    </span>
                  </span>
                </button>
              </div>

              {/* Total */}
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#FCFAF5] px-4 py-3 ring-1 ring-inset ring-[#EEE6D3]">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A6A50]">
                    আপনার নির্বাচন
                  </p>
                  <p className="text-[15px] font-bold text-[#2B2116]">
                    <T>{selected.name}</T>
                    <span className="ml-1.5 text-sm font-medium text-[#7A6A50]">
                      · <T>{selected.duration}</T>
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A6A50]">
                    সর্বমোট
                  </p>
                  <p className="text-2xl font-extrabold leading-none text-[#DC2626]">
                    {formatPrice(selected.price)}
                  </p>
                </div>
              </div>

              {/* ---------- AUTO: go to gateway ---------- */}
              {mode === "auto" && autoAvailable && (
                <div
                  className="mt-4 flex flex-col gap-2.5"
                  style={{ animation: "sub-open 220ms ease-out" }}
                >
                  <p className="text-[13px] font-medium leading-5 text-[#3F6B5E]">
                    নিচের বাটনে ক্লিক করলে সুরক্ষিত পেমেন্ট গেটওয়েতে নিয়ে
                    যাওয়া হবে। পেমেন্ট সফল হলে সাবস্ক্রিপশন নিজে থেকেই চালু
                    হবে।
                  </p>
                  {gateways.map((gateway, index) => (
                    <button
                      key={gateway.key}
                      type="button"
                      onClick={() => void startGateway(gateway.key)}
                      disabled={gatewayBusy !== null || plansLoading}
                      className={`inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-lg px-5 py-2.5 text-center text-base font-bold shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${index === 0 ? "bg-[#0F766E] text-white hover:bg-[#115E59] focus-visible:ring-teal-600/40" : "border border-[#0F766E]/40 bg-white text-[#0F766E] hover:bg-[#F0FDFA] focus-visible:ring-teal-600/30"}`}
                    >
                      {gatewayBusy === gateway.key ? (
                        <LoaderCircle size={19} className="animate-spin" />
                      ) : (
                        <CreditCard size={19} />
                      )}
                      {gatewayBusy === gateway.key
                        ? "পেমেন্ট পেজ খুলছে…"
                        : `${gateway.label} দিয়ে পেমেন্ট করুন · ${formatPrice(selected.price)}`}
                    </button>
                  ))}
                  {paymentError && (
                    <p
                      role="alert"
                      className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm font-semibold text-red-700"
                    >
                      {paymentError}
                    </p>
                  )}
                </div>
              )}

              {/* ---------- MANUAL: box opens below ---------- */}
              {mode === "manual" && (
                <div
                  className="mt-4 rounded-xl border-2 border-[#FECACA] bg-[#FFF8F6] p-4"
                  style={{ animation: "sub-open 220ms ease-out" }}
                >
                  <h3 className="text-base font-bold text-[#B91C1C]">
                    ম্যানুয়াল পেমেন্টের নিয়ম
                  </h3>
                  <ol className="mt-2.5 space-y-2">
                    {[
                      <>নিচের যেকোনো একটি নম্বর কপি করুন।</>,
                      <>
                        bKash / Nagad অ্যাপে গিয়ে ওই নম্বরে ঠিক{" "}
                        <strong className="text-[#B91C1C]">
                          {formatPrice(selected.price)}
                        </strong>{" "}
                        <strong>Send Money</strong> করুন।
                      </>,
                      <>
                        পেমেন্ট শেষে SMS-এ পাওয়া <strong>TrxID</strong> এবং যে
                        নম্বর থেকে টাকা পাঠিয়েছেন সেটি নিচের ফর্মে লিখে জমা
                        দিন।
                      </>,
                      <>
                        অ্যাডমিন যাচাই করে Approve করলে আপনার সাবস্ক্রিপশন চালু
                        হবে।
                      </>,
                    ].map((text, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2.5 text-[13.5px] font-medium leading-5 text-[#3B2F1E]"
                      >
                        <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DC2626] text-[11px] font-bold text-white">
                          {toBnDigits(index + 1)}
                        </span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ol>

                  {reviewPending ? (
                    <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-[#FFFBEB] px-3 py-2.5 text-[13.5px] font-semibold leading-5 text-amber-900">
                      <Clock3 size={17} className="mt-0.5 shrink-0" />
                      আপনার একটি পেমেন্ট ইতিমধ্যে রিভিউতে আছে। যাচাই শেষ না
                      হওয়া পর্যন্ত নতুন পেমেন্ট জমা দেওয়া যাবে না।
                    </p>
                  ) : manualState === "loading" || manualState === "idle" ? (
                    <div
                      aria-busy="true"
                      className="mt-4 flex items-center gap-2.5 rounded-lg bg-white px-3 py-3 text-sm font-medium text-[#5A4A32] ring-1 ring-inset ring-[#EEE6D3]"
                    >
                      <LoaderCircle size={16} className="animate-spin" />{" "}
                      পেমেন্টের তথ্য লোড হচ্ছে…
                    </div>
                  ) : manualState === "error" ? (
                    <div
                      role="alert"
                      className="mt-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-sm font-semibold text-red-700"
                    >
                      {manualLoadError}
                      <button
                        type="button"
                        onClick={() => void loadManualInfo(selected.id)}
                        className="ml-2 underline"
                      >
                        আবার চেষ্টা করুন
                      </button>
                    </div>
                  ) : wallets.length === 0 ? (
                    <p
                      role="alert"
                      className="mt-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-sm font-semibold text-red-700"
                    >
                      এই মুহূর্তে কোনো পেমেন্ট নম্বর সেট করা নেই। সাপোর্টে
                      যোগাযোগ করুন।
                    </p>
                  ) : (
                    <>
                      {/* Payment numbers */}
                      <div className="mt-4 space-y-2">
                        {wallets.map(({ name, number }) => (
                          <div
                            key={name}
                            className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 ring-1 ring-inset ring-[#EEE6D3]"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FBF6E8] ring-1 ring-[#E3D6B8]">
                              {name === "bKash" || name === "Nagad" ? (
                                <WalletLogo wallet={name} size={28} />
                              ) : (
                                <Wallet size={20} className="text-[#DC2626]" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#7A6A50]">
                                {name} · Send Money
                              </p>
                              <p className="font-mono text-lg font-extrabold tracking-wide text-[#2B2116]">
                                {number}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void copyNumber(name, number)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-1.5 text-sm font-bold text-[#B91C1C] transition hover:bg-[#FEE2E2] active:scale-[0.97]"
                            >
                              {copiedWallet === name ? (
                                <Check size={14} />
                              ) : (
                                <Copy size={14} />
                              )}
                              {copiedWallet === name ? "কপি হয়েছে" : "Copy"}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Submit form */}
                      <form
                        onSubmit={handleManualSubmit}
                        className="mt-4 space-y-3 border-t border-[#FECACA] pt-4"
                      >
                        <p className="text-sm font-bold text-[#2B2116]">
                          টাকা পাঠানোর পর তথ্য জমা দিন
                        </p>

                        {wallets.length > 1 && (
                          <div>
                            <label className="mb-1.5 block text-[13px] font-bold text-[#3B2F1E]">
                              কোন মাধ্যমে পাঠিয়েছেন?
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {wallets.map(({ name }) => (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() => setManualWallet(name)}
                                  aria-pressed={activeWallet === name}
                                  className={`rounded-lg border-2 px-4 py-1.5 text-sm font-bold transition ${activeWallet === name ? "border-[#DC2626] bg-[#FEF2F2] text-[#B91C1C]" : "border-[#E8DFCC] bg-white text-[#5A4A32] hover:border-[#D6C7A5]"}`}
                                >
                                  {name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <label
                            htmlFor="senderNumber"
                            className="mb-1.5 block text-[13px] font-bold text-[#3B2F1E]"
                          >
                            যে নম্বর থেকে টাকা পাঠিয়েছেন
                          </label>
                          <input
                            id="senderNumber"
                            inputMode="tel"
                            autoComplete="tel"
                            value={senderNumber}
                            onChange={(event) =>
                              setSenderNumber(event.target.value)
                            }
                            placeholder="01XXXXXXXXX"
                            required
                            maxLength={20}
                            className="w-full rounded-lg border border-[#E3D6B8] bg-white px-3.5 py-2.5 text-base outline-none transition placeholder:text-[#B0A080] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="transactionId"
                            className="mb-1.5 block text-[13px] font-bold text-[#3B2F1E]"
                          >
                            Transaction ID (TrxID)
                          </label>
                          <input
                            id="transactionId"
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            value={transactionId}
                            onChange={(event) =>
                              setTransactionId(event.target.value.slice(0, 10))
                            }
                            placeholder="যেমন: BIK7A8G9XZ"
                            required
                            minLength={8}
                            maxLength={10}
                            pattern="[A-Za-z0-9]{8,10}"
                            title="TrxID অবশ্যই ৮–১০টি ইংরেজি অক্ষর/সংখ্যার হতে হবে।"
                            className="w-full rounded-lg border border-[#E3D6B8] bg-white px-3.5 py-2.5 font-mono text-base uppercase tracking-wider outline-none transition placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-[#B0A080] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
                          />
                          <p className="mt-1 text-xs leading-5 text-[#7A6A50]">
                            TrxID ৮–১০টি ইংরেজি অক্ষর/সংখ্যার হয়। SMS-এ যেভাবে
                            আছে সেভাবেই লিখুন।
                          </p>
                        </div>

                        {manualError && (
                          <p
                            role="alert"
                            className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm font-semibold text-red-700"
                          >
                            {manualError}
                          </p>
                        )}
                        {manualNotice && (
                          <p
                            role="status"
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
                          >
                            {manualNotice}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={submitting || !activeWallet}
                          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#DC2626] px-5 py-2.5 text-base font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#B91C1C] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#DC2626]/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {submitting ? (
                            <LoaderCircle size={18} className="animate-spin" />
                          ) : (
                            <Send size={18} />
                          )}
                          {submitting
                            ? "জমা হচ্ছে…"
                            : "পেমেন্টের তথ্য জমা দিন"}
                        </button>
                      </form>
                    </>
                  )}

                  {reviewPending && manualNotice && (
                    <p
                      role="status"
                      className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
                    >
                      {manualNotice}
                    </p>
                  )}
                </div>
              )}

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-[#7A6A50]">
                <Lock size={13} className="shrink-0" />
                পেমেন্ট যাচাই হওয়ার পরই সাবস্ক্রিপশন অ্যাক্সেস চালু হয়
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
