"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, ShieldOff } from "lucide-react";
import { visibleInterval } from "@/app/_lib/visiblePolling";
import { fetchAuthMe } from "@/lib/clientAuth";

type GateState = {
  pathname: string;
  status: "checking" | "allowed" | "blocked";
  reason?: string;
};

const TOOL_PATHS = [
  "/ai-editor",
  "/ai-photo",
  "/ai-template",
  "/bulk-photo-edit",
  "/manual-editor",
  "/dorkar-link",
  "/dorkari-document",
  "/customers-invoices",
  "/income-expenses",
  "/print-media",
  "/questions-create",
  "/my-files",
];

// When the account was verified recently, opening another tool page needs no waiting:
// the page opens at once and the access check runs quietly in the background (a ban is
// still applied within moments, and the protected APIs enforce access on the server).
// Only a cold load (reload / first visit) waits for the check, behind the page loader.
const VERIFIED_FRESH_MS = 10 * 60 * 1000;
let lastVerifiedAt = 0;
const isRecentlyVerified = () => Date.now() - lastVerifiedAt < VERIFIED_FRESH_MS;

function isToolPath(pathname: string) {
  if (pathname.startsWith("/sohoj-tools/")) return true;
  return TOOL_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function ToolAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const toolPath = isToolPath(pathname);
  const [gate, setGate] = useState<GateState>({ pathname: "", status: "allowed" });

  useEffect(() => {
    if (!toolPath) {
      setGate({ pathname, status: "allowed" });
      // Warm up quietly (e.g. while on the dashboard) so the first click on a tool page
      // also opens instantly. Nothing is shown or held while this runs.
      if (!isRecentlyVerified()) {
        void fetchAuthMe()
          .then((response) => response.json().catch(() => ({})).then((data) => ({ response, data })))
          .then(({ response, data }) => {
            const user = data?.user;
            if (response.ok && user && !(user.role !== "admin" && user.isBanned === true)) {
              lastVerifiedAt = Date.now();
            }
          })
          .catch(() => undefined);
      }
      return;
    }

    let active = true;
    let firstCheck = true;
    // The page always opens at once; the access check runs quietly in the background
    // (a ban is still applied within moments, and the protected APIs enforce access on the server).
    setGate({ pathname, status: "allowed" });

    const checkAccess = async () => {
      try {
        const response = await fetchAuthMe();
        const data = await response.json().catch(() => ({}));
        if (!active) return;

        if (response.ok && data?.user) {
          const user = data.user;
          const blocked = user.role !== "admin" && user.isBanned === true;
          lastVerifiedAt = blocked ? 0 : Date.now();
          setGate({
            pathname,
            status: blocked ? "blocked" : "allowed",
            reason: typeof user.banReason === "string" ? user.banReason : "",
          });
        } else {
          // Guests still see the existing page/login prompt. Protected APIs enforce auth.
          lastVerifiedAt = Date.now();
          setGate({ pathname, status: "allowed" });
        }
      } catch {
        if (active) setGate({ pathname, status: "allowed" });
      } finally {
        firstCheck = false;
      }
    };

    void checkAccess();
    // Also disables already-open tool pages shortly after an administrator bans an account.
    // Checked once a minute (and when the tab becomes visible again) instead of every 8s:
    // protected APIs enforce bans on the server anyway.
    const stopPolling = visibleInterval(() => {
      if (!firstCheck) void checkAccess();
    }, 60_000);

    return () => {
      active = false;
      stopPolling();
    };
  }, [pathname, toolPath]);

  const status = !toolPath
    ? "allowed"
    : gate.pathname !== pathname
      ? "allowed"
      : gate.status;
  const lastAllowedContentRef = useRef<{
    pathname: string;
    children: React.ReactNode;
  } | null>(null);

  // Keep the last settled page mounted during a client-side tool navigation.
  // This avoids a blank white flash while the access check runs and does not
  // render the destination tool until the server confirms access is allowed.
  useLayoutEffect(() => {
    if (status === "allowed") {
      lastAllowedContentRef.current = { pathname, children };
    }
  }, [children, pathname, status]);

  if (status === "checking") {
    const previous = lastAllowedContentRef.current;
    if (previous) return <>{previous.children}</>;

    // On a cold/direct load there is no previous page to retain. Draw only the plain site
    // background (no skeleton blocks): the full-screen page loader covers the wait.
    return (
      <main
        aria-busy="true"
        aria-hidden="true"
        className="min-h-screen bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE]"
      />
    );
  }

  if (status === "blocked") {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] px-4 py-12">
        {/* soft red glow behind the card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(220,38,38,0.12)_0%,rgba(220,38,38,0)_65%)]"
        />

        <section className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-[0_30px_80px_-30px_rgba(59,47,30,0.5)]">
          {/* dark header */}
          <div className="relative bg-[#3B2F1E] px-8 pb-9 pt-9 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(248,113,113,0.22)_0%,rgba(248,113,113,0)_70%)]"
            />
            <div className="relative mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gradient-to-br from-[#DC2626] to-[#B91C1C] shadow-[0_0_0_6px_rgba(220,38,38,0.22),0_10px_30px_-6px_rgba(220,38,38,0.7)]">
              <ShieldOff size={30} strokeWidth={1.8} className="text-white" />
            </div>
            <p className="relative mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#E3D6B8]/70">
              SebaLagbe.com · Account security
            </p>
            <h1 className="relative mt-2 text-[26px] font-extrabold leading-tight tracking-tight text-[#FBF6E8]">
              Unusual activity detected
            </h1>
            <p className="relative mt-1 text-base font-semibold text-[#F2B93B]">
              অস্বাভাবিক অ্যাক্টিভিটি শনাক্ত হয়েছে
            </p>
          </div>

          {/* body */}
          <div className="px-7 pb-8 pt-6 sm:px-9">
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#E3D6B8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#5A4A32]">
              <span className="h-2 w-2 rounded-full bg-[#DC2626] shadow-[0_0_0_3px_rgba(220,38,38,0.18)]" />
              Tools access temporarily paused · টুলস সাময়িকভাবে বন্ধ
            </div>

            <p className="mt-5 text-center text-[15px] leading-7 text-[#3B2F1E]">
              We noticed unusual activity on your account, so an administrator has temporarily turned off your access to the tools.
              If you want to know more, please contact the admin.
            </p>

            <div className="my-5 flex items-center gap-3 text-[#C9B791]" aria-hidden="true">
              <span className="h-px flex-1 bg-[#E3D6B8]" />
              <span className="h-1.5 w-1.5 rotate-45 bg-[#DC2626]" />
              <span className="h-px flex-1 bg-[#E3D6B8]" />
            </div>

            <p className="text-center text-[15px] leading-7 text-[#3B2F1E]">
              আপনার অ্যাকাউন্টে কিছু অস্বাভাবিক অ্যাক্টিভিটি থাকার কারণে অ্যাডমিন সাময়িক সময়ের জন্য আপনার টুলসের অ্যাক্সেস বন্ধ করে দিয়েছে।
              বিস্তারিত জানতে চাইলে অ্যাডমিনের সাথে যোগাযোগ করুন।
            </p>

            {gate.reason && gate.reason !== "Unusual image generation activity" && (
              <div className="mt-5 rounded-xl border border-[#E3D6B8] bg-white px-4 py-3 text-left text-sm text-[#5A4A32]">
                <span className="font-semibold text-[#3B2F1E]">Note from admin:</span> {gate.reason}
              </div>
            )}

            <a
              href="/dashboard"
              className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-b from-[#E23B3B] to-[#C81E1E] px-5 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_24px_-10px_rgba(220,38,38,0.8)] transition hover:brightness-110 active:scale-[0.99]"
            >
              <MessageCircle size={18} strokeWidth={2.2} />
              Contact admin · অ্যাডমিনের সাথে যোগাযোগ
            </a>
            <p className="mt-3 text-center text-xs text-[#7A6A4F]">
              Chat with the admin from your dashboard · ড্যাশবোর্ড থেকে অ্যাডমিনকে মেসেজ করুন
            </p>
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
