"use client";
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { LockKeyhole, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import OfferVideo from "../../_components/OfferVideo";
import { useAiTemplateText } from "./aiTemplateI18n";

type GateStatus = "checking" | "locked" | "active";

export default function SubscriptionLock() {
  const { t } = useAiTemplateText();
  const [status, setStatus] = useState<GateStatus>("checking");
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const checkSubscription = async () => {
      try {
        const response = await fetch("/api/subscription/current", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        const subscription = data?.subscription;
        const expiresAt = subscription?.expiresAt
          ? new Date(subscription.expiresAt).getTime()
          : 0;
        const accessExpiresAt = data?.access?.expiresAt
          ? new Date(data.access.expiresAt).getTime()
          : 0;
        const hasManualOrCombinedAccess = data?.access?.granted === true && accessExpiresAt > Date.now();
        const isActive = response.ok && (hasManualOrCombinedAccess || (
          subscription?.paymentStatus === "COMPLETED" &&
          subscription?.accessStatus === "ACTIVE" &&
          expiresAt > Date.now()
        ));
        if (!cancelled) setStatus(isActive ? "active" : "locked");
      } catch (error) {
        console.error("Subscription gate check failed:", error);
        if (!cancelled) setStatus("locked");
      }
    };
    void checkSubscription();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleSubscriptionRequired = () => setShowDialog(true);
    window.addEventListener("sohozkaj:subscription-required", handleSubscriptionRequired);
    return () => window.removeEventListener("sohozkaj:subscription-required", handleSubscriptionRequired);
  }, []);

  useEffect(() => {
    if (!showDialog) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowDialog(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showDialog]);

  if (status === "active") return null;

  const openDialog = (event?: ReactMouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    setShowDialog(true);
  };

  return (
    <>
      <button
        type="button"
        className="fixed right-4 top-20 z-[1900] inline-flex items-center gap-2 rounded-full border border-amber-200/90 bg-[#fffdf5]/95 p-1.5 pr-3 text-xs font-bold text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
        onClick={openDialog}
        aria-label={t("Subscription required")}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-amber-300 shadow-sm">
          <LockKeyhole size={14} strokeWidth={2.4} />
        </span>
        <span>{status === "checking" ? t("Checking access...") : t("Locked")}</span>
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.12)]" />
      </button>

      {showDialog && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-xl cursor-pointer"
          onClick={() => setShowDialog(false)}
        >
          <div
            className="relative w-full max-w-[620px] overflow-hidden rounded-[28px] border border-white/70 bg-[#fffdf5] shadow-[0_28px_100px_rgba(2,6,23,0.38)] ring-1 ring-slate-900/5 cursor-default"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t("Subscription Required")}
          >
            <div aria-hidden="true" className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-violet-500 to-amber-400" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-14 h-44 w-44 rounded-full bg-amber-200/35 blur-3xl" />

            <button
              type="button"
              onClick={() => setShowDialog(false)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              aria-label={t("Close")}
            >
              <X size={17} />
            </button>

            <div className="relative px-5 pb-5 pt-7 sm:px-6 sm:pb-6 sm:pt-8">
              <OfferVideo className="w-full" autoPlay />

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <Link
                  href="/subscription"
                  className="group inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 px-5 py-3 text-center text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(79,70,229,0.24)] transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-[0_12px_24px_rgba(79,70,229,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
                >
                  {t("View Subscription Plans")}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 cursor-pointer"
                >
                  {t("Close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
