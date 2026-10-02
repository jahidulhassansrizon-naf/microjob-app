"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
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
  "Payment and automatic renewal will be added separately",
];

const BASE_MONTHLY = plans[0].price / plans[0].months;

const formatPrice = (value: number) =>
  `৳${Math.round(value).toLocaleString("en-US")}`;

const getSavings = (price: number, months: number) =>
  Math.round((1 - price / (BASE_MONTHLY * months)) * 100);

export default function SubscriptionPage() {
  const [selectedId, setSelectedId] = useState<string>("6-month");
  const [showNotice, setShowNotice] = useState(false);

  const selected = plans.find((p) => p.id === selectedId) ?? plans[0];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setShowNotice(false);
  };

  const handleContinue = () => {
    // Payment gateway পরে এখানে যুক্ত হবে
    setShowNotice(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      <DashboardNavbar />

      <main className="max-w-[1180px] mx-auto px-4 py-10 sm:py-14">
        {/* Header */}
        <section className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2563EB]">
            Subscription
          </p>
          <h1 className="mt-3 text-3xl sm:text-[40px] sm:leading-[1.15] font-black tracking-tight text-[#0F172A]">
            Choose your subscription plan
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-500 font-medium leading-6">
            Pick the duration that suits you. The longer the plan, the lower
            your monthly cost.
          </p>
        </section>

        {/* Plans */}
        <section
          role="radiogroup"
          aria-label="Subscription plans"
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {plans.map((plan) => {
            const isSelected = plan.id === selectedId;
            const savings = getSavings(plan.price, plan.months);
            const perMonth = plan.price / plan.months;

            return (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelect(plan.id)}
                className={`group relative cursor-pointer text-left rounded-2xl border p-6 transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/25 ${
                  isSelected
                    ? "bg-white border-[#2563EB] shadow-[0_12px_32px_-12px_rgba(37,99,235,0.35)] ring-4 ring-[#2563EB]/10 -translate-y-1"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                {plan.badge && (
                  <span
                    className={`absolute -top-3 left-6 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-colors ${
                      isSelected
                        ? "bg-[#2563EB] text-white"
                        : "bg-slate-800 text-white"
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}

                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-[#0F172A]">
                      {plan.name}
                    </h2>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400">
                      {plan.duration}
                    </p>
                  </div>

                  {/* Radio indicator */}
                  <span
                    className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-[#2563EB] bg-[#2563EB]"
                        : "border-slate-300 bg-white group-hover:border-slate-400"
                    }`}
                  >
                    <Check
                      size={13}
                      strokeWidth={3.5}
                      className={`text-white transition-all duration-200 ${
                        isSelected
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-50"
                      }`}
                    />
                  </span>
                </div>

                {/* Price */}
                <div className="mt-7">
                  <span
                    className={`text-[34px] leading-none font-black tracking-tight transition-colors ${
                      isSelected ? "text-[#2563EB]" : "text-[#0F172A]"
                    }`}
                  >
                    {formatPrice(plan.price)}
                  </span>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {plan.months === 1
                      ? "Billed monthly"
                      : `${formatPrice(perMonth)} / month`}
                  </p>
                </div>

                {/* Divider */}
                <div className="my-5 h-px bg-slate-100" />

                {/* Bottom row */}
                <div className="flex items-center justify-between gap-2 min-h-[24px]">
                  <p className="text-xs font-medium text-slate-400">
                    {plan.note}
                  </p>
                  {savings > 0 && (
                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold transition-colors ${
                        isSelected
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      Save {savings}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </section>

        {/* Summary bar */}
        <section className="mt-8 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Your selection
              </p>
              <p className="mt-1 text-lg font-black text-[#0F172A]">
                {selected.name}
                <span className="ml-2 text-sm font-semibold text-slate-400">
                  {selected.duration}
                </span>
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6">
              <div className="sm:text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Total
                </p>
                <p className="mt-1 text-2xl font-black text-[#0F172A]">
                  {formatPrice(selected.price)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                className="cursor-pointer rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1D4ED8] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/25"
              >
                Continue with {selected.name}
              </button>
            </div>
          </div>

          {showNotice && (
            <p className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600">
              Online payment is not available yet. We will let you know as soon
              as it is ready.
            </p>
          )}
        </section>

        {/* Features */}
        <section className="mt-6 rounded-2xl bg-white border border-slate-200 p-6 sm:p-7">
          <h2 className="text-base font-black text-[#0F172A]">
            Included with every plan
          </h2>
          <div className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-2.5 text-sm font-medium text-slate-600"
              >
                <Check
                  size={16}
                  strokeWidth={3}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link
            href="/sohoj-tools"
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline"
          >
            <ArrowLeft size={14} />
            Back to Tools
          </Link>
        </div>
      </main>
    </div>
  );
}
