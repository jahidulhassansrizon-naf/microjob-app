"use client";
import { T, useProfileText } from "./profileI18n";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CalendarClock, CreditCard } from "lucide-react";
type JsonObject = Record<string, unknown>;
type UserSubscriptionData = JsonObject & {
    subscription?: JsonObject;
};
function readString(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}
function readNestedString(object: JsonObject | undefined, keys: string[]) {
    if (!object)
        return null;
    for (const key of keys) {
        const value = readString(object[key]);
        if (value)
            return value;
    }
    return null;
}
function getSubscriptionEnd(user: UserSubscriptionData | null) {
    if (!user)
        return null;
    return (readNestedString(user.subscription, [
        "endDate",
        "expiresAt",
        "expiryDate",
        "validUntil",
        "subscriptionEndDate",
    ]) ||
        readNestedString(user, [
            "subscriptionEndDate",
            "subscriptionExpiresAt",
            "subscriptionExpiry",
            "subscriptionValidUntil",
            "planEndDate",
            "planExpiresAt",
            "expiresAt",
            "expiryDate",
        ]));
}
function getSubscriptionPlan(user: UserSubscriptionData | null) {
    if (!user)
        return null;
    return (readNestedString(user.subscription, ["planName", "plan", "name", "title"]) ||
        readNestedString(user, ["subscriptionPlan", "planName", "plan", "subscriptionName"]));
}
function formatCountdown(ms: number, locale?: string) {
    if (ms <= 0)
        return locale?.toLowerCase().startsWith("bn") ? "মেয়াদ শেষ" : "Expired";
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (locale?.toLowerCase().startsWith("bn")) {
        if (days > 0) return `${days} দিন ${hours} ঘণ্টা ${minutes} মিনিট`;
        if (hours > 0) return `${hours} ঘণ্টা ${minutes} মিনিট ${seconds} সেকেন্ড`;
        return `${minutes} মিনিট ${seconds} সেকেন্ড`;
    }
    if (days > 0)
        return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0)
        return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
}
export default function SubscriptionStatusCard({ user, }: {
    user: UserSubscriptionData | null;
}) {
    const { locale } = useProfileText();
    const endValue = getSubscriptionEnd(user);
    const plan = getSubscriptionPlan(user);
    const endMs = useMemo(() => {
        if (!endValue)
            return null;
        const value = Date.parse(endValue);
        return Number.isFinite(value) ? value : null;
    }, [endValue]);
    const [remainingMs, setRemainingMs] = useState<number | null>(null);
    useEffect(() => {
        setRemainingMs(endMs === null ? null : Math.max(0, endMs - Date.now()));
        if (endMs === null)
            return;
        const timer = window.setInterval(() => {
            setRemainingMs(Math.max(0, endMs - Date.now()));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [endMs, locale]);
    const formattedEnd = useMemo(() => {
        if (endMs === null)
            return null;
        return new Intl.DateTimeFormat(locale?.toLowerCase().startsWith("bn") ? "bn-BD" : undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(endMs));
    }, [endMs, locale]);
    const isExpired = endMs !== null && remainingMs === 0;
    return (<div className="bg-[#FBF6E8] rounded-2xl border border-[#E3D6B8] shadow-xs p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#E3D6B8] text-[#DC2626] flex items-center justify-center shrink-0">
            <CreditCard size={18}/>
          </div>

          <div className="min-w-0">
            <p className="text-[12px] uppercase tracking-wider font-bold text-[#7A6A50]"><T>{"Subscription\n            "}</T></p>
            <h3 className="text-base font-bold text-[#3B2F1E] truncate">
              <T>{plan || "Current plan"}</T>
            </h3>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold shrink-0 ${isExpired
            ? "bg-[#FEE9E9] text-red-600"
            : endMs !== null
                ? "bg-emerald-50 text-emerald-700"
                : "bg-[#F3E9D2] text-[#6B5A40]"}`}>
          <BadgeCheck size={11}/>
          {isExpired ? <T>{"Expired"}</T> : endMs !== null ? <T>{"Active"}</T> : <T>{"Not available"}</T>}
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-[#F6EEDB] border border-[#E3D6B8] p-4">
        <div className="flex items-center gap-2 text-[#6B5A40] text-[13px] font-semibold">
          <CalendarClock size={14} className="text-[#DC2626]"/>
          {formattedEnd ? <T>{`Ends ${formattedEnd}`}</T> : <T>{"Subscription end date is not available"}</T>}
        </div>

        <div className="mt-2 text-3xl font-black tracking-tight text-[#3B2F1E]">
          {remainingMs === null ? <T>{"—"}</T> : formatCountdown(remainingMs, locale)}
        </div>

        <p className="text-[12px] text-[#7A6A50] mt-1">
          {remainingMs === null
        ? <T>{"Your subscription expiry field is not present in the supplied profile data yet."}</T> : isExpired
        ? <T>{"Your subscription has expired."}</T>
        : <T>{"Time remaining on your current subscription."}</T>}
        </p>
      </div>
    </div>);
}
