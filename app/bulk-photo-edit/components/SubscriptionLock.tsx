"use client";
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { LockKeyhole, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import OfferVideoFrame from "../../_components/OfferVideoFrame";
import { useBulkPhotoText } from "./bulkPhotoI18n";

type GateStatus = "checking" | "locked" | "active";

export default function SubscriptionLock() {
  const { t } = useBulkPhotoText();
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
        className="page-font fixed right-4 top-20 z-[1900] inline-flex items-center gap-2 rounded-full border border-[#E3D6B8] bg-[#FBF6E8]/95 p-1.5 pr-3.5 text-[15px] font-semibold text-[#5A4A32] shadow-[0_8px_24px_rgba(59,47,30,0.12)] backdrop-blur-md transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#D8C9A6] hover:bg-[#EFE3C8] hover:shadow-[0_12px_28px_rgba(59,47,30,0.18)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#E9DDC3] cursor-pointer"
        onClick={openDialog}
        aria-label={t("Subscription required")}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3B2F1E] via-[#4A3B26] to-[#3B2F1E] text-amber-300 shadow-sm">
          <LockKeyhole size={14} strokeWidth={2.4} />
        </span>
        <span>{status === "checking" ? t("Checking access...") : t("Locked")}</span>
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.12)]" />
      </button>

      {showDialog && (
        <div
          className="page-font fixed inset-0 z-[2000] flex items-center justify-center bg-[#2A2014]/90 p-4 backdrop-blur-xl cursor-pointer"
          onClick={() => setShowDialog(false)}
        >
          <div
            className="relative w-full max-w-[620px] overflow-hidden rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-xl ring-1 ring-[#3B2F1E]/5 cursor-default"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t("Subscription Required")}
          >
            <div aria-hidden="true" className="h-1.5 w-full bg-gradient-to-r from-[#B91C1C] via-[#DC2626] to-[#F87171]" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#FBB6B6]/40 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-14 h-44 w-44 rounded-full bg-[#F6D9A8]/60 blur-3xl" />

            <button
              type="button"
              onClick={() => setShowDialog(false)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#E3D6B8] bg-[#FBF6E8]/90 text-[#6B5A40] shadow-sm transition duration-200 ease-out hover:border-[#D8C9A6] hover:bg-[#EFE3C8] hover:text-[#3B2F1E] active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 cursor-pointer"
              aria-label={t("Close")}
            >
              <X size={17} />
            </button>

            <div className="relative px-5 pb-5 pt-7 sm:px-6 sm:pb-6 sm:pt-8">
              <OfferVideoFrame src="/offervideo/offerwoman.mp4" compact playLabel={t("Watch video")} replayLabel={t("Replay video")} />

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <Link
                  href="/subscription"
                  className="group inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#D42020] px-5 py-3 text-center text-base font-bold text-white shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#AE1717] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF6E8] cursor-pointer"
                >
                  {t("View Subscription Plans")}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#FBB6B6] bg-[#FBF6E8] px-5 py-3 text-base font-semibold text-[#B91C1C] transition duration-200 ease-out hover:bg-[#FEE9E9] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF6E8] cursor-pointer"
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
