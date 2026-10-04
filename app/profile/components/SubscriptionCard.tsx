"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, CheckCircle2, Clock3, CreditCard } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

type SubscriptionData = {
  id?: string;
  planId?: string;
  planName?: string;
  amount?: number;
  months?: number;
  paymentStatus?: string;
  accessStatus?: string;
  startedAt?: string | null;
  expiresAt?: string | null;
};

function formatCountdown(ms: number) {
  if (ms <= 0) return "Expired";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatDate(value?: string | null) {
  if (!value) return null;

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export default function SubscriptionCard() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    const loadSubscription = async () => {
      try {
        const response = await fetch("/api/subscription/current", {
          method: "GET",
          headers: {
            ...getClientAuthHeaders(),
          },
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.replace("/login");
          return;
        }

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message || "Unable to load subscription status.",
          );
        }

        if (!cancelled) {
          setSubscription(data.subscription || null);
          setError("");
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load subscription status.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadSubscription();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!subscription?.expiresAt) return;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [subscription?.expiresAt]);

  const expiryMs = useMemo(() => {
    if (!subscription?.expiresAt) return null;
    const parsed = Date.parse(subscription.expiresAt);
    return Number.isFinite(parsed) ? parsed : null;
  }, [subscription?.expiresAt]);

  const remainingMs = expiryMs === null ? null : Math.max(0, expiryMs - now);
  const isExpired = remainingMs !== null && remainingMs <= 0;
  const isActive = Boolean(subscription) && !isExpired;
  const startedText = formatDate(subscription?.startedAt);
  const expiresText = formatDate(subscription?.expiresAt);

  return (
    <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[#2563EB]">
            <CreditCard size={18} />
            <span className="text-sm font-bold uppercase tracking-[0.14em]">
              Subscription
            </span>
          </div>

          <h3 className="mt-2 text-xl font-bold text-slate-900">
            {subscription?.planName || "Your subscription status"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? "Loading your subscription status..."
              : error
                ? error
                : subscription
                  ? "Your current plan and expiry are synced from your account database."
                  : "You do not have an active subscription right now."}
          </p>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 min-w-[220px] shrink-0 ${
            isActive
              ? "border-emerald-100 bg-emerald-50/60"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div
            className={`flex items-center gap-2 text-xs font-semibold ${
              isActive ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            {isActive ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
            {isActive ? "Active subscription" : "Subscription status"}
          </div>

          <p className="mt-1 text-lg font-black text-slate-900">
            {loading
              ? "Loading..."
              : !subscription
                ? "Not subscribed"
                : remainingMs === null
                  ? "Expiry unavailable"
                  : formatCountdown(remainingMs)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Plan
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {subscription?.planName || "No active plan"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Started
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <CalendarClock size={14} className="text-[#2563EB]" />
            {startedText || "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Expires
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <Clock3 size={14} className="text-[#2563EB]" />
            {expiresText || "—"}
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs font-medium text-slate-400">
          {subscription?.amount != null
            ? `Plan amount: ৳${Number(subscription.amount).toLocaleString()}`
            : "Choose a plan whenever you are ready."}
        </p>

        <Link
          href="/subscription"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
        >
          Manage Subscription
          <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}
