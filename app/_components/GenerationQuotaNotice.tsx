"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock3, ImagePlus } from "lucide-react";
import { visibleInterval } from "@/app/_lib/visiblePolling";

type Quota = {
  unlimited?: boolean;
  limited?: boolean;
  remaining?: number;
  hourlyLimit?: number;
  hourlyRemaining?: number;
  unlockAt?: string | null;
};

// Call this after a generation finishes (success or failure) so the count refreshes at once.
export const GENERATION_FINISHED_EVENT = "sohozkaj:generation-finished";

const digitsBn = (v: number | string) => String(v).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

function waitText(ms: number, bn: boolean) {
  const mins = Math.max(1, Math.ceil(ms / 60000));
  if (mins < 60) return bn ? `${digitsBn(mins)} মিনিট` : `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (bn) return m ? `${digitsBn(h)} ঘণ্টা ${digitsBn(m)} মিনিট` : `${digitsBn(h)} ঘণ্টা`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Tells the user the hourly image limit, how many they made in the last hour and how many are left,
 * or when generating opens again. (The daily limit is enforced on the server but never shown.)
 * size="inline" is the slim one-row version used inside the AI Editor's bulk-actions bar; "large" is a big banner;
 * "compact" is a small box above a button.
 */
export default function GenerationQuotaNotice({
  locale = "auto",
  size = "compact",
}: {
  locale?: "bn" | "en" | "auto";
  size?: "compact" | "large" | "inline";
}) {
  // "auto" follows the site language switch (set on <html lang> by the language provider).
  const [siteBn, setSiteBn] = useState(true);
  useEffect(() => {
    const sync = () => setSiteBn(document.documentElement.lang !== "en");
    sync();
    window.addEventListener("sohojkaj:language-change", sync);
    return () => window.removeEventListener("sohojkaj:language-change", sync);
  }, []);
  const bn = locale === "auto" ? siteBn : locale === "bn";

  const [quota, setQuota] = useState<Quota | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/generation-limit", { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json?.success) setQuota(json);
    } catch {
      // The notice is informational only - never break the page.
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => void load();
    const stopPoll = visibleInterval(refresh, 300000);
    const tick = window.setInterval(() => setNowMs(Date.now()), 15000);
    window.addEventListener(GENERATION_FINISHED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      stopPoll();
      window.clearInterval(tick);
      window.removeEventListener(GENERATION_FINISHED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [load]);

  const unlockMs = quota?.unlockAt ? new Date(quota.unlockAt).getTime() : 0;
  const stillLocked = Boolean(quota?.limited) && unlockMs > nowMs;
  const lockExpired = Boolean(quota?.limited) && !stillLocked;

  // The lock time passed while the page stayed open: reload the real numbers once.
  useEffect(() => {
    if (lockExpired) void load();
  }, [lockExpired, unlockMs, load]);

  if (!quota || quota.unlimited) return null;

  const large = size === "large";
  const inline = size === "inline";
  const num = (v: number | undefined) => (bn ? digitsBn(v ?? 0) : String(v ?? 0));

  if (stillLocked) {
    const left = waitText(unlockMs - nowMs, bn);
    const at = new Date(unlockMs).toLocaleTimeString(bn ? "bn-BD" : "en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit" });
    if (inline) {
      return (
        <div role="status" className="mb-3 flex min-w-0 items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-rose-800 xl:mb-0 xl:flex-1">
          <Clock3 size={18} className="shrink-0" />
          <p className="text-[13px] font-bold leading-snug">
            {bn ? <>ছবি তৈরির লিমিট শেষ। <b>{left}</b> পরে ({at}) আবার তৈরি করতে পারবেন।</> : <>Image limit reached. You can generate again in <b>{left}</b> (at {at}).</>}
          </p>
        </div>
      );
    }
    return (
      <div
        role="status"
        className={`flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 ${large ? "mb-4 px-4 py-4 sm:px-5" : "mb-2 px-3 py-2 text-[13px] leading-snug"}`}
      >
        <Clock3 size={large ? 28 : 16} className="mt-0.5 shrink-0" />
        <div>
          <p className={large ? "text-xl font-extrabold leading-snug sm:text-2xl" : "font-semibold"}>
            {bn ? "ছবি তৈরির লিমিট শেষ" : "Image limit reached"}
          </p>
          <p className={large ? "mt-1 text-base sm:text-lg" : ""}>
            {bn ? (
              <><b>{left}</b> পরে ({at}) আবার ছবি তৈরি করতে পারবেন।</>
            ) : (
              <>You can generate again in <b>{left}</b> (at {at}).</>
            )}
          </p>
        </div>
      </div>
    );
  }

  const hourlyLimit = quota.hourlyLimit ?? 0;
  const used = Math.max(0, hourlyLimit - (quota.hourlyRemaining ?? 0));
  // Smaller of the hourly / daily room, so the number shown is never more than the user can really make.
  const remaining = quota.remaining ?? 0;
  const low = remaining <= 3;

  if (inline) {
    return (
      <div
        role="status"
        className={`mb-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-1.5 xl:mb-0 xl:flex-1 ${low ? "border-amber-400 bg-amber-50 text-amber-900" : "border-[#DC2626]/30 bg-[#FFF3E0] text-[#3B2F1E]"}`}
      >
        <ImagePlus size={20} className="shrink-0 text-[#DC2626]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[14px] font-extrabold leading-tight">
              {bn ? <>১ ঘণ্টায় সর্বোচ্চ <span className="text-[#DC2626]">{num(hourlyLimit)}টি</span> ছবি</> : <>Max <span className="text-[#DC2626]">{num(hourlyLimit)}</span> images per hour</>}
            </span>
            <span className="rounded-md border border-[#E3D6B8] bg-white px-2 py-0.5 text-[12.5px] font-bold tabular-nums">
              {bn ? "গত ১ ঘণ্টায় করেছেন" : "Made in last hour"} {num(used)}/{num(hourlyLimit)}
            </span>
            <span className={`rounded-md px-2 py-0.5 text-[12.5px] font-extrabold tabular-nums ${low ? "bg-amber-200 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}>
              {bn ? <>আর পারবেন {num(remaining)}টি</> : <>{num(remaining)} left</>}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] font-semibold leading-tight text-[#5A4A32]">
            {bn ? "শুধু জরুরি ও দরকারি ছবিই তৈরি করুন, ভুল বা উল্টাপাল্টা ছবিতে লিমিট শেষ করবেন না।" : "Only generate photos you really need - don't use up the limit on wrong or test photos."}
          </p>
        </div>
      </div>
    );
  }

  if (large) {
    return (
      <div
        role="status"
        className={`mb-4 rounded-xl border-2 px-4 py-4 sm:px-5 ${low ? "border-amber-400 bg-amber-50 text-amber-900" : "border-[#DC2626]/40 bg-[#FFF3E0] text-[#3B2F1E]"}`}
      >
        <div className="flex items-start gap-3">
          <ImagePlus size={28} className="mt-1 shrink-0 text-[#DC2626]" />
          <div className="min-w-0 flex-1">
            <p className="text-xl font-extrabold leading-snug sm:text-2xl">
              {bn ? <>১ ঘণ্টায় সর্বোচ্চ <span className="text-[#DC2626]">{num(hourlyLimit)}টি</span> ছবি তৈরি করা যাবে</> : <>You can generate up to <span className="text-[#DC2626]">{num(hourlyLimit)}</span> images in 1 hour</>}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="rounded-lg border border-[#E3D6B8] bg-white/80 px-4 py-2">
                <div className="text-sm font-semibold text-[#5A4A32]">{bn ? "গত ১ ঘণ্টায় তৈরি করেছেন" : "Made in the last hour"}</div>
                <div className="text-3xl font-extrabold tabular-nums">{num(used)}<span className="text-lg font-bold text-[#7A6A50]"> / {num(hourlyLimit)}</span></div>
              </div>
              <div className={`rounded-lg border px-4 py-2 ${low ? "border-amber-400 bg-amber-100" : "border-emerald-300 bg-emerald-50"}`}>
                <div className="text-sm font-semibold text-[#5A4A32]">{bn ? "আর তৈরি করতে পারবেন" : "Still available"}</div>
                <div className={`text-3xl font-extrabold tabular-nums ${low ? "text-amber-800" : "text-emerald-700"}`}>{num(remaining)}{bn ? "টি" : ""}</div>
              </div>
            </div>
            <p className="mt-3 text-base font-semibold leading-snug sm:text-lg">
              {bn
                ? "তাই শুধু জরুরি ও দরকারি ছবিগুলোই তৈরি করুন। উল্টাপাল্টা বা ভুল ছবি দিয়ে লিমিট শেষ করবেন না।"
                : "So only generate the photos you really need. Don't use up the limit on wrong or test photos."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={`mb-2 flex items-start gap-2 rounded-xl border px-3 py-2 text-[13px] leading-snug ${low ? "border-amber-300 bg-amber-50 text-amber-900" : "border-[#E3D6B8] bg-[#FFFDF6] text-[#5A4A32]"}`}
    >
      <ImagePlus size={16} className="mt-0.5 shrink-0" />
      <span>
        {bn ? (
          <>১ ঘণ্টায় সর্বোচ্চ {num(hourlyLimit)}টি। গত ১ ঘণ্টায় {num(used)}টি করেছেন, আর <b>{num(remaining)}টি</b> পারবেন।</>
        ) : (
          <>Up to {num(hourlyLimit)} per hour. You made {num(used)} in the last hour, <b>{num(remaining)}</b> left.</>
        )}
      </span>
    </div>
  );
}
