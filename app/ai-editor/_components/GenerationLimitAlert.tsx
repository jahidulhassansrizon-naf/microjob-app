"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const digitsBn = (v: number | string) => String(v).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

function waitTextBn(ms: number) {
  const mins = Math.max(1, Math.ceil(ms / 60000));
  if (mins < 60) return `${digitsBn(mins)} মিনিট`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${digitsBn(h)} ঘণ্টা ${digitsBn(m)} মিনিট` : `${digitsBn(h)} ঘণ্টা`;
}

/**
 * Red alert popup shown ONLY when the user's image-generation limit is used up.
 * (The always-visible "max 20 per hour / made 1/20 / 19 left" banner was removed.)
 */
export default function GenerationLimitAlert({
  unlockAt,
  onClose,
}: {
  unlockAt: string | null;
  onClose: () => void;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 15000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const unlockMs = unlockAt ? new Date(unlockAt).getTime() : 0;
  const hasTime = unlockMs > 0 && !Number.isNaN(unlockMs);
  const open = hasTime && unlockMs <= nowMs; // the wait is over while the popup stayed open
  const left = hasTime ? waitTextBn(Math.max(0, unlockMs - nowMs)) : "";
  const at = hasTime
    ? new Date(unlockMs).toLocaleTimeString("bn-BD", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="gen-limit-title"
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-[#3B2F1E]/55 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border-2 border-[#DC2626] bg-[#FFF5F5] shadow-2xl"
      >
        <div className="flex items-center gap-3 bg-[#DC2626] px-5 py-3 text-white">
          <AlertTriangle size={26} className="shrink-0" />
          <h2 id="gen-limit-title" className="text-lg font-extrabold leading-snug sm:text-xl">
            ছবি তৈরির লিমিট শেষ
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/15 transition hover:bg-white/30"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5 text-[#7F1D1D]">
          <p className="text-base font-bold leading-relaxed sm:text-lg">
            আপনার ছবি তৈরির সীমা পূরণ হয়ে গেছে।
          </p>
          <p className="mt-2 text-base font-semibold leading-relaxed">
            {open ? (
              <>এখন আবার ছবি তৈরি করতে পারবেন, আবার চেষ্টা করুন।</>
            ) : hasTime ? (
              <><span className="font-extrabold text-[#DC2626]">{left}</span> পরে ({at}) আবার ছবি তৈরি করতে পারবেন।</>
            ) : (
              <>কিছুক্ষণ পরে আবার চেষ্টা করুন।</>
            )}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full cursor-pointer rounded-xl bg-[#DC2626] px-4 py-2.5 text-base font-extrabold text-white transition hover:bg-[#B91C1C]"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
}
