"use client";

import Link from "next/link";
import { ShieldOff, ArrowRight } from "lucide-react";
import OfferVideoFrame from "./OfferVideoFrame";
import { useSebaLagbeToolsI18n } from "@/app/sohoj-tools/_i18n";

/**
 * Server-selected paid-tool screen.
 * Unsubscribed users see the same premium video + plans presentation used by
 * the AI Editor subscription prompt, centered in the available page area.
 * The actual paid-tool component is not rendered by the server page.
 */
export default function PaidToolLocked({ variant }: { variant: "subscription" | "banned" }) {
  const { L } = useSebaLagbeToolsI18n();

  if (variant === "banned") {
    return (
      <section className="mx-auto w-full max-w-lg overflow-hidden rounded-[28px] border border-white/70 bg-[#F6EEDB] text-center shadow-[0_28px_100px_rgba(2,6,23,0.18)] ring-1 ring-stone-900/5">
        <div aria-hidden="true" className="h-1.5 w-full bg-gradient-to-r from-rose-700 via-red-500 to-amber-400" />
        <div className="px-7 py-9">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-amber-300">
            <ShieldOff size={26} />
          </span>
          <h1 className="mt-5 text-xl font-semibold text-stone-900">
            {L("Tool access is disabled")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {L("An administrator has disabled tool access for this account.")}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-violet-600 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:-translate-y-0.5"
          >
            {L("Back to dashboard")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative isolate mx-auto w-full max-w-[620px] overflow-hidden rounded-[28px] border border-white/70 bg-[#F6EEDB] shadow-[0_28px_100px_rgba(2,6,23,0.18)] ring-1 ring-stone-900/5"
      aria-label={L("Subscription Required")}
    >
      <div aria-hidden="true" className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-violet-500 to-amber-400" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-amber-200/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-14 h-44 w-44 rounded-full bg-amber-200/35 blur-3xl" />

      <div className="relative px-5 pb-5 pt-7 sm:px-6 sm:pb-6 sm:pt-8">
        <OfferVideoFrame
          src="/intro/subscriptionredirectvideo.mp4"
          compact
          hideControls
          playLabel={L("Watch video")}
          replayLabel={L("Replay video")}
        />

        <Link
          href="/subscription"
          className="group mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-600 to-violet-600 px-5 py-3 text-center text-base font-extrabold text-white shadow-[0_8px_18px_rgba(79,70,229,0.24)] transition duration-200 hover:-translate-y-0.5 hover:from-amber-700 hover:to-violet-700 hover:shadow-[0_12px_24px_rgba(79,70,229,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
        >
          {L("View Subscription Plans")}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
