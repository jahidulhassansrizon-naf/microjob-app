"use client";
import { T } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CreditCard, Wallet } from "lucide-react";
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
const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
function parseTime(value?: string | null) {
    if (!value)
        return null;
    const t = Date.parse(value);
    return Number.isFinite(t) ? t : null;
}
function formatDate(value?: string | null) {
    const t = parseTime(value);
    if (t === null)
        return "—";
    return new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(t));
}
function formatTime(value?: string | null) {
    const t = parseTime(value);
    if (t === null)
        return "";
    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(t));
}
// Returns a big headline value and a smaller supporting line.
function describeRemaining(ms: number) {
    const days = Math.floor(ms / DAY);
    const hours = Math.floor((ms % DAY) / HOUR);
    const minutes = Math.floor((ms % HOUR) / MINUTE);
    const seconds = Math.floor((ms % MINUTE) / 1000);
    if (days > 0) {
        return {
            main: `${days} ${days === 1 ? "day" : "days"}`,
            sub: `${hours}h ${minutes}m remaining`,
        };
    }
    if (hours > 0) {
        return { main: `${hours}h ${minutes}m`, sub: "remaining" };
    }
    return { main: `${minutes}m ${seconds}s`, sub: "remaining" };
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
                    headers: { ...getClientAuthHeaders() },
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
                    throw new Error(data?.message || "Unable to load subscription status.");
                }
                if (!cancelled) {
                    setSubscription(data.subscription || null);
                    setError("");
                }
            }
            catch (requestError) {
                if (!cancelled) {
                    setError(requestError instanceof Error
                        ? requestError.message
                        : "Unable to load subscription status.");
                }
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        };
        void loadSubscription();
        return () => {
            cancelled = true;
        };
    }, []);
    const startMs = useMemo(() => parseTime(subscription?.startedAt), [subscription?.startedAt]);
    const expiryMs = useMemo(() => parseTime(subscription?.expiresAt), [subscription?.expiresAt]);
    // Tick every second only during the final hour, otherwise once a minute.
    const tickEverySecond = expiryMs !== null && expiryMs - now < HOUR;
    useEffect(() => {
        if (expiryMs === null)
            return;
        const timer = window.setInterval(() => setNow(Date.now()), tickEverySecond ? 1000 : MINUTE);
        return () => window.clearInterval(timer);
    }, [expiryMs, tickEverySecond]);
    const remainingMs = expiryMs === null ? null : Math.max(0, expiryMs - now);
    const isExpired = remainingMs !== null && remainingMs <= 0;
    const isActive = Boolean(subscription) && !isExpired;
    const progress = useMemo(() => {
        if (startMs === null || expiryMs === null || expiryMs <= startMs)
            return null;
        const used = ((now - startMs) / (expiryMs - startMs)) * 100;
        return Math.min(100, Math.max(0, used));
    }, [startMs, expiryMs, now]);
    const remaining = remainingMs !== null && !isExpired ? describeRemaining(remainingMs) : null;
    const hasAmount = subscription?.amount != null;
    // ---------- Loading ----------
    if (loading) {
        return (<section aria-busy="true" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-100"/>
        <div className="mt-4 h-7 w-40 animate-pulse rounded bg-slate-100"/>
        <div className="mt-6 h-2 w-full animate-pulse rounded-full bg-slate-100"/>
        <div className="mt-6 h-12 w-full animate-pulse rounded bg-slate-100"/>
      </section>);
    }
    // ---------- Error ----------
    if (error) {
        return (<section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900"><T>{"Subscription"}</T></h3>
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
        <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"><T>{"Try again\n        "}</T></button>
      </section>);
    }
    // ---------- No subscription ----------
    if (!subscription) {
        return (<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <CreditCard size={16}/><T>{"Subscription\n        "}</T></div>
        <h3 className="mt-3 text-xl font-semibold text-slate-900"><T>{"No active plan\n        "}</T></h3>
        <p className="mt-1 text-sm text-slate-500"><T>{"Pick a plan to unlock all the editing tools.\n        "}</T></p>
        <Link href="/subscription" className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"><T>{"View plans\n        "}</T></Link>
      </section>);
    }
    // ---------- Active / expired ----------
    return (<section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <CreditCard size={16}/><T>{"Subscription\n          "}</T></div>

          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isActive
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
            : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}/>
            {isActive ? <T>{"Active"}</T> : <T>{"Expired"}</T>}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
              {subscription.planName || "Your plan"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {isActive
        ? <T>{`Renew before ${formatDate(subscription.expiresAt)} to keep your access.`}</T> : <T>{`Your plan ended on ${formatDate(subscription.expiresAt)}.`}</T>}
            </p>
          </div>

          {remaining && (<div className="text-right">
              <p className="text-2xl font-semibold tabular-nums text-slate-900">
                {remaining.main}
              </p>
              <p className="text-xs tabular-nums text-slate-500">
                {remaining.sub}
              </p>
            </div>)}
        </div>

        {progress !== null && (<div className="mt-5">
            <div role="progressbar" aria-label="Subscription time used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full transition-[width] duration-500 ${progress > 90 ? "bg-amber-500" : "bg-blue-600"}`} style={{ width: `${progress}%` }}/>
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>{formatDate(subscription.startedAt)}</span>
              <span>{formatDate(subscription.expiresAt)}</span>
            </div>
          </div>)}
      </div>

      <dl className="grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-6 py-4">
          <dt className="flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarClock size={14}/><T>{"Started\n          "}</T></dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {formatDate(subscription.startedAt)}
            <span className="ml-1.5 font-normal text-slate-500">
              {formatTime(subscription.startedAt)}
            </span>
          </dd>
        </div>

        <div className="px-6 py-4">
          <dt className="flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarClock size={14}/><T>{"Expires\n          "}</T></dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {formatDate(subscription.expiresAt)}
            <span className="ml-1.5 font-normal text-slate-500">
              {formatTime(subscription.expiresAt)}
            </span>
          </dd>
        </div>

        <div className="px-6 py-4">
          <dt className="flex items-center gap-1.5 text-xs text-slate-500">
            <Wallet size={14}/><T>{"Amount paid\n          "}</T></dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {hasAmount
        ? <T>{`৳${Number(subscription.amount).toLocaleString()}`}</T> : <T>{"—"}</T>}
          </dd>
        </div>
      </dl>

      <div className="flex justify-end border-t border-slate-100 px-6 py-4">
        <Link href="/subscription" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
          {isActive ? <T>{"Manage subscription"}</T> : <T>{"Renew plan"}</T>}
        </Link>
      </div>
    </section>);
}
