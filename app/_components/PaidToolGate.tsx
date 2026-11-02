"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import PremiumLockIcon from "./PremiumLockIcon";
import OfferVideoFrame from "./OfferVideoFrame";
import { useSebaLagbeToolsI18n } from "@/app/sohoj-tools/_i18n";

/**
 * Wraps a /sohoj-tools/[slug] page.
 *
 * `locked` is decided by the SERVER page (verified session + live subscription lookup), never by
 * a client-side fetch, so the locked state is correct on the very first paint and cannot be
 * flipped by tampering with a browser request/response.
 *
 * Locked: the tool UI is visible, but it is `inert` (no click / focus / typing / file-choose) and
 * a full-cover layer opens the subscription video dialog on any attempt to use it.
 * Unlocked (subscriber, admin, free tool): children render untouched, no wrapper at all.
 *
 * NOTE: this is a UI layer. Anything that must be truly protected has to be enforced in an API
 * route with requireActiveSubscription() (the scanner's save/upload/delete routes already are).
 */
export default function PaidToolGate({
  slug,
  locked,
  children,
}: {
  slug: string;
  locked: boolean;
  children: ReactNode;
}) {
  if (!locked) return <>{children}</>;
  return <LockedGate slug={slug}>{children}</LockedGate>;
}

function LockedGate({ children }: { slug: string; children: ReactNode }) {
  const { L } = useSebaLagbeToolsI18n();
  const [showDialog, setShowDialog] = useState(false);
  const regionRef = useRef<HTMLDivElement | null>(null);
  const coverRef = useRef<HTMLButtonElement | null>(null);

  const openDialog = () => setShowDialog(true);

  useEffect(() => {
    window.addEventListener("sohozkaj:subscription-required", openDialog);
    return () => window.removeEventListener("sohozkaj:subscription-required", openDialog);
  }, []);

  useEffect(() => {
    if (!showDialog) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowDialog(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showDialog]);

  // Defence in depth on top of `inert`: drag & drop, paste, keyboard and file-input events that
  // target the tool region are stopped in the capture phase before the tool can see them.
  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    const inRegion = (event: Event) => event.target instanceof Node && region.contains(event.target);
    const stop = (event: Event) => {
      if (!inRegion(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.type !== "dragover" && event.type !== "dragenter") setShowDialog(true);
    };
    const types = ["drop", "dragover", "dragenter", "paste", "beforeinput", "input", "change", "keydown", "contextmenu"];
    for (const type of types) document.addEventListener(type, stop, true);
    return () => {
      for (const type of types) document.removeEventListener(type, stop, true);
    };
  }, []);

  // If the lock is removed from the DOM (devtools), put it back.
  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    const observer = new MutationObserver(() => {
      if (!region.hasAttribute("inert")) region.setAttribute("inert", "");
      if (coverRef.current && !region.parentElement?.contains(coverRef.current)) setShowDialog(true);
    });
    observer.observe(region, { attributes: true, attributeFilter: ["inert"] });
    if (region.parentElement) observer.observe(region.parentElement, { childList: true });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="relative">
        <div ref={regionRef} inert aria-hidden="true" className="select-none">
          {children}
        </div>
        <button
          ref={coverRef}
          type="button"
          onClick={openDialog}
          onContextMenu={(event) => {
            event.preventDefault();
            openDialog();
          }}
          className="absolute inset-0 z-[1800] h-full w-full cursor-pointer bg-transparent"
          aria-label={L("Subscription required")}
        />
      </div>

      {(
        <button
          type="button"
          onClick={() => setShowDialog(true)}
          className="fixed right-4 top-20 z-[1900] inline-flex items-center gap-2 rounded-full border border-amber-200/90 bg-[#F6EEDB]/95 p-1.5 pr-3 text-sm font-bold text-stone-700 shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:border-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 cursor-pointer"
          aria-label={L("Subscription required")}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_25%,#FFFFFF_0%,#FFF6D6_55%,#F6D77A_100%)] ring-[1.5px] ring-amber-500/80 shadow-[0_2px_5px_rgba(88,50,0,0.3)]">
            <PremiumLockIcon size={18} />
          </span>
          <span>{L("Locked")}</span>
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.12)]" />
        </button>
      )}

      {showDialog && (
        <div
          className="fixed inset-0 z-[2000] flex cursor-pointer items-center justify-center bg-stone-950/90 p-4 backdrop-blur-xl"
          onClick={() => setShowDialog(false)}
        >
          <div
            className="relative w-full max-w-[620px] cursor-default overflow-hidden rounded-[28px] border border-white/70 bg-[#F6EEDB] shadow-[0_28px_100px_rgba(2,6,23,0.38)] ring-1 ring-stone-900/5"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={L("Subscription Required")}
          >
            <div aria-hidden="true" className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-violet-500 to-amber-400" />
            <button
              type="button"
              onClick={() => setShowDialog(false)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-stone-200/80 bg-white/85 text-stone-500 shadow-sm transition hover:text-stone-900"
              aria-label={L("Close")}
            >
              <X size={17} />
            </button>
            <div className="relative px-5 pb-5 pt-7 sm:px-6 sm:pb-6 sm:pt-8">
              <OfferVideoFrame
                src="/intro/subscriptionredirectvideo.mp4"
                compact
                hideControls
                playLabel={L("Watch video")}
                replayLabel={L("Replay video")}
              />
              <p className="mt-3 text-center text-sm font-semibold text-stone-700">
                {L("This is a paid tool. Subscribe to use it.")}
              </p>
              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <Link
                  href="/subscription"
                  className="group inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-600 to-violet-600 px-5 py-3 text-center text-base font-extrabold text-white shadow-[0_8px_18px_rgba(79,70,229,0.24)] transition duration-200 hover:-translate-y-0.5"
                >
                  {L("View Subscription Plans")}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-stone-200 bg-white/90 px-5 py-3 text-base font-bold text-stone-700 transition hover:bg-[#FBF6E8]"
                >
                  {L("Close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
