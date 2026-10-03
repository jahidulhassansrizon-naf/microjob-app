"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, ShieldCheck, X } from "lucide-react";
import Link from "next/link";

type GateStatus = "checking" | "locked" | "active";

export default function SubscriptionLock() {
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

        const isActive =
          response.ok &&
          subscription?.paymentStatus === "COMPLETED" &&
          subscription?.accessStatus === "ACTIVE" &&
          expiresAt > Date.now();

        if (!cancelled) {
          setStatus(isActive ? "active" : "locked");
        }
      } catch (error) {
        console.error("Subscription gate check failed:", error);

        if (!cancelled) {
          setStatus("locked");
        }
      }
    };

    checkSubscription();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "active") {
    return null;
  }

  const openDialog = (event?: React.SyntheticEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    setShowDialog(true);
  };

  return (
    <>
      {/* Transparent interaction shield: the page remains visible, but no tool activity can pass through. */}
      <div
        className="fixed inset-0 z-[1900] cursor-not-allowed bg-transparent"
        onPointerDown={openDialog}
        onClick={openDialog}
        onContextMenu={openDialog}
        role="button"
        aria-label="Subscription required"
        tabIndex={0}
        onKeyDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setShowDialog(true);
        }}
      >
        <button
          type="button"
          className="absolute right-4 top-20 flex items-center gap-2 rounded-full border border-amber-200 bg-white/95 px-3 py-2 text-xs font-black text-amber-800 shadow-lg backdrop-blur"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={openDialog}
          aria-label="Subscription required"
        >
          <LockKeyhole size={16} strokeWidth={2.5} />
          {status === "checking" ? "Checking access..." : "Locked"}
        </button>
      </div>

      {showDialog && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[2px]"
          onClick={() => setShowDialog(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-required-title"
          >
            <button
              type="button"
              onClick={() => setShowDialog(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              {status === "checking" ? (
                <ShieldCheck size={28} />
              ) : (
                <LockKeyhole size={28} />
              )}
            </div>

            <div className="mt-5 text-center">
              <h2
                id="subscription-required-title"
                className="text-xl font-black tracking-tight text-slate-900"
              >
                Subscription Required
              </h2>

              <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                এই পেইজের AI features ব্যবহার করতে আগে একটি active subscription
                নিতে হবে।
              </p>

              <p className="mt-2 text-xs font-semibold text-slate-400">
                Subscription active হলে এই lock নিজে থেকেই চলে যাবে এবং পেইজের
                সব feature ব্যবহার করতে পারবেন।
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/subscription"
                className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-blue-700"
              >
                View Subscription Plans
              </Link>

              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
