"use client";
import { T } from "@/components/i18n/I18nProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, CalendarClock, Check, Wallet, } from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
/**
 * Subscription plans
 *
 * দাম বদলাতে শুধু `price` (সংখ্যা) আর `months` পরিবর্তন করুন।
 * প্রতি মাসের খরচ ও সাশ্রয় নিচে স্বয়ংক্রিয়ভাবে হিসাব হয়।
 * Payment gateway পরে handleContinue-এর ভেতরে যুক্ত করা যাবে।
 */
const plans = [
    {
        id: "1-month",
        name: "1 Month",
        duration: "30 Days",
        months: 1,
        price: 199,
        note: "Flexible monthly access",
        badge: null,
    },
    {
        id: "3-month",
        name: "3 Months",
        duration: "90 Days",
        months: 3,
        price: 499,
        note: "For regular users",
        badge: null,
    },
    {
        id: "6-month",
        name: "6 Months",
        duration: "180 Days",
        months: 6,
        price: 799,
        note: "Longer access, less hassle",
        badge: "Most chosen",
    },
    {
        id: "1-year",
        name: "1 Year",
        duration: "365 Days",
        months: 12,
        price: 1299,
        note: "Full-year access",
        badge: "Best value",
    },
];
const features = [
    "Access to all available paid tools",
    "Use the same account across supported tools",
    "Manage your subscription status from this page",
    "Payment verification and subscription access are handled automatically",
];
const BASE_MONTHLY = plans[0].price / plans[0].months;
const formatPrice = (value: number) => `৳${Math.round(value).toLocaleString("en-US")}`;
const getSavings = (price: number, months: number) => Math.round((1 - price / (BASE_MONTHLY * months)) * 100);
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
    const daysLeft = msLeft === null ? null : Math.max(0, Math.floor(msLeft / DAY_MS));
    const progress = Number.isFinite(start) && hasEnd && end > start
        ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
        : null;
    return { expired, daysLeft, progress };
}
const capitalize = (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";
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
    const [selectedId, setSelectedId] = useState<string>("6-month");
    const [showNotice, setShowNotice] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState("");
    const [currentSubscription, setCurrentSubscription] = useState<SubscriptionStatus | null>(null);
    const [subscriptionLoading, setSubscriptionLoading] = useState(true);
    const selected = plans.find((p) => p.id === selectedId) ?? plans[0];
    const formatDate = (value: string | null) => {
        if (!value)
            return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime()))
            return "—";
        return date.toLocaleDateString("en-BD", {
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
        }
        catch (error) {
            console.error("Failed to load current subscription:", error);
            setCurrentSubscription(null);
        }
        finally {
            setSubscriptionLoading(false);
        }
    };
    useEffect(() => {
        loadCurrentSubscription();
    }, []);
    const handleSelect = (id: string) => {
        setSelectedId(id);
        setShowNotice(false);
        setPaymentError("");
    };
    const handleContinue = async () => {
        if (isProcessing)
            return;
        setIsProcessing(true);
        setShowNotice(false);
        setPaymentError("");
        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
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
        }
        catch (error) {
            console.error("Checkout error:", error);
            setPaymentError(error instanceof Error
                ? error.message
                : "Payment could not be started. Please try again.");
            setIsProcessing(false);
        }
    };
    return (<div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-[#0F172A] lg:h-dvh">
      <DashboardNavbar />

      <main className="flex min-h-0 flex-1 flex-col lg:overflow-y-auto">
        <div data-nav-content className="mx-auto my-auto flex w-full max-w-[1112px] flex-col gap-[clamp(10px,2vh,24px)] px-4 py-[clamp(12px,3vh,40px)]">
          {/* Header */}
          <section className="max-w-2xl">
            <h1 className="text-[clamp(24px,3.8vh,36px)] font-semibold leading-tight tracking-tight text-[#0F172A]"><T>{"Choose your subscription plan\n            "}</T></h1>

            <p className="mt-1.5 text-sm leading-6 text-slate-600 sm:text-[15px]"><T>{"Pick the duration that suits you. The longer the plan, the lower\n              your monthly cost.\n            "}</T></p>
          </section>

          {/* Current subscription */}
          <section aria-label="Current subscription">
            {subscriptionLoading ? (<div aria-busy="true" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100"/>
                <div className="mt-4 h-6 w-36 animate-pulse rounded bg-slate-100"/>
                <div className="mt-6 h-2 w-full animate-pulse rounded-full bg-slate-100"/>
              </div>) : currentSubscription ? ((() => {
            const { expired, daysLeft, progress } = getTiming(currentSubscription);
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
                ? "stroke-slate-300"
                : remainingPct !== null && remainingPct < 10
                    ? "stroke-amber-500"
                    : "stroke-[#2563EB]";
            const ringMain = expired
                ? "0"
                : daysLeft === null
                    ? "—"
                    : daysLeft === 0
                        ? "<1"
                        : String(daysLeft);
            const ringLabel = daysLeft === 1 || (daysLeft === 0 && !expired)
                ? "day left"
                : "days left";
            return (<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col items-center gap-4 p-[clamp(14px,2.6vh,32px)] sm:flex-row sm:gap-6">
                      <div className="relative h-[clamp(84px,12vh,128px)] w-[clamp(84px,12vh,128px)] shrink-0">
                        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
                          <circle cx="60" cy="60" r={RING_R} fill="none" strokeWidth="9" className="stroke-slate-100"/>

                          {remainingPct !== null && remainingPct > 0 && (<circle cx="60" cy="60" r={RING_R} fill="none" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(RING_C * remainingPct) / 100} ${RING_C}`} className={`${ringStroke} transition-[stroke-dasharray] duration-700`}/>)}
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[clamp(20px,3.2vh,30px)] font-semibold leading-none tabular-nums text-[#0F172A]">
                            {ringMain}
                          </span>

                          <span className="mt-1 text-[11px] text-slate-500">
                            {ringLabel}
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-start">
                          <h2 className="text-[clamp(18px,2.8vh,24px)] font-semibold tracking-tight text-[#0F172A]">
                            {currentSubscription.planName}
                          </h2>

                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${isActive
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}/>

                            {statusLabel}
                          </span>
                        </div>

                        <p className="mx-auto mt-2.5 max-w-md rounded-lg border-l-4 border-red-500 bg-red-50 px-4 py-2 text-left text-[13px] font-medium leading-5 text-red-700 sm:mx-0">
                          {expired ? (<><T>{"This plan ended on"}</T>{<T>{" "}</T>}
                              <strong className="font-bold text-red-800">
                                {formatDate(currentSubscription.expiresAt)}
                              </strong><T>{". Choose a plan below to renew.\n                            "}</T></>) : (<><T>{"Your access is active until"}</T>{<T>{" "}</T>}
                              <strong className="font-bold text-red-800">
                                {formatDate(currentSubscription.expiresAt)}
                              </strong><T>{". You can renew or switch to a longer plan\n                              anytime.\n                            "}</T></>)}
                        </p>
                      </div>
                    </div>

                    <dl className="grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                      <div className="flex items-center gap-3 px-5 py-[clamp(8px,1.5vh,16px)]">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2563EB] ring-1 ring-slate-200">
                          <Wallet size={15}/>
                        </span>

                        <div>
                          <dt className="text-xs text-slate-500"><T>{"Amount paid\n                          "}</T></dt>

                          <dd className="text-sm font-semibold text-[#0F172A]">
                            {formatPrice(currentSubscription.amount)}
                          </dd>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 px-5 py-[clamp(8px,1.5vh,16px)]">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2563EB] ring-1 ring-slate-200">
                          <CalendarCheck size={15}/>
                        </span>

                        <div>
                          <dt className="text-xs text-slate-500"><T>{"Started"}</T></dt>

                          <dd className="text-sm font-semibold text-[#0F172A]">
                            {formatDate(currentSubscription.startedAt)}
                          </dd>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 px-5 py-[clamp(8px,1.5vh,16px)]">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2563EB] ring-1 ring-slate-200">
                          <CalendarClock size={15}/>
                        </span>

                        <div>
                          <dt className="text-xs text-slate-500">
                            {expired ? <T>{"Ended"}</T> : <T>{"Expires"}</T>}
                          </dt>

                          <dd className="text-sm font-semibold text-[#0F172A]">
                            {formatDate(currentSubscription.expiresAt)}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </div>);
        })()) : (<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-[#0F172A]"><T>{"No active plan\n                "}</T></h2>

                <p className="mt-1 text-sm text-slate-600"><T>{"Choose a plan below to unlock all the paid tools.\n                "}</T></p>
              </div>)}
          </section>

          {/* Plans */}
          <section role="radiogroup" aria-label="Subscription plans" className="grid grid-cols-1 gap-[clamp(10px,1.8vh,20px)] pt-3 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
            const isSelected = plan.id === selectedId;
            const savings = getSavings(plan.price, plan.months);
            const perMonth = plan.price / plan.months;
            return (<button key={plan.id} type="button" role="radio" aria-checked={isSelected} onClick={() => handleSelect(plan.id)} className={`group relative cursor-pointer rounded-2xl border p-[clamp(14px,2.4vh,24px)] text-left outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-[#2563EB]/25 ${isSelected
                    ? "-translate-y-1 border-[#2563EB] bg-white shadow-[0_12px_32px_-12px_rgba(37,99,235,0.35)] ring-4 ring-[#2563EB]/10"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"}`}>
                  {plan.badge && (<span className={`absolute -top-3 left-5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${isSelected
                        ? "bg-[#2563EB] text-white"
                        : "bg-slate-800 text-white"}`}>
                      {plan.badge}
                    </span>)}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-black text-[#0F172A] sm:text-lg">
                        {<T>{plan.name}</T>}
                      </h2>

                      <p className="mt-0.5 text-xs font-semibold text-slate-400">
                        {plan.duration}
                      </p>
                    </div>

                    <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200 ${isSelected
                    ? "border-[#2563EB] bg-[#2563EB]"
                    : "border-slate-300 bg-white group-hover:border-slate-400"}`}>
                      <Check size={13} strokeWidth={3.5} className={`text-white transition-all duration-200 ${isSelected
                    ? "scale-100 opacity-100"
                    : "scale-50 opacity-0"}`}/>
                    </span>
                  </div>

                  <div className="mt-[clamp(8px,2.2vh,28px)]">
                    <span className={`text-[clamp(26px,4.2vh,34px)] font-black leading-none tracking-tight transition-colors ${isSelected ? "text-[#2563EB]" : "text-[#0F172A]"}`}>
                      {formatPrice(plan.price)}
                    </span>

                    <p className="mt-1.5 text-xs font-semibold text-slate-500">
                      {plan.months === 1
                ? <T>{"Billed monthly"}</T> : <T>{`${formatPrice(perMonth)} / month`}</T>}
                    </p>
                  </div>

                  <div className="my-[clamp(8px,1.8vh,20px)] h-px bg-slate-100"/>

                  <div className="flex min-h-[24px] items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-400">
                      {plan.note}
                    </p>

                    {savings > 0 && (<span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold transition-colors ${isSelected
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"}`}><T>{"Save "}</T>{savings}<T>{"%\n                      "}</T></span>)}
                  </div>
                </button>);
        })}
          </section>

          {/* Summary bar */}
          <section className="rounded-2xl border border-slate-200 bg-white p-[clamp(12px,2vh,24px)] shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium text-slate-500"><T>{"Your selection\n                "}</T></p>

                <p className="mt-0.5 text-lg font-black text-[#0F172A]">
                  {selected.name}

                  <span className="ml-2 text-sm font-semibold text-slate-400">
                    {selected.duration}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-between gap-6 sm:justify-end">
                <div className="sm:text-right">
                  <p className="text-xs font-medium text-slate-500"><T>{"Total"}</T></p>

                  <p className="mt-0.5 text-2xl font-black text-[#0F172A]">
                    {formatPrice(selected.price)}
                  </p>
                </div>

                <button type="button" onClick={handleContinue} disabled={isProcessing} className="cursor-pointer rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
                  {isProcessing
        ? <T>{"Redirecting to payment..."}</T> : <T>{`Continue with ${selected.name}`}</T>}
                </button>
              </div>
            </div>

            {showNotice && (<p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600"><T>{"Online payment is ready.\n              "}</T></p>)}

            {paymentError && (<p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
                {paymentError}
              </p>)}
          </section>

          {/* Features */}
          <section className="rounded-2xl border border-slate-200 bg-white px-5 py-[clamp(10px,1.8vh,20px)]">
            <h2 className="text-sm font-black text-[#0F172A]"><T>{"Included with every plan\n            "}</T></h2>

            <div className="mt-2 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
              {features.map((feature) => (<div key={feature} className="flex items-start gap-2 text-xs font-medium text-slate-600 sm:text-[13px]">
                  <Check size={14} strokeWidth={3} className="mt-0.5 shrink-0 text-emerald-600"/>

                  <span>{feature}</span>
                </div>))}
            </div>
          </section>

          <div className="text-center">
            <Link href="/sohoj-tools" className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline">
              <ArrowLeft size={14}/><T>{"Back to Tools\n            "}</T></Link>
          </div>
        </div>
      </main>
    </div>);
}
