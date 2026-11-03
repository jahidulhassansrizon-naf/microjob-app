"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Crown, Hourglass, X } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

type Kind = "welcome" | "expired";
type Welcome = { kind: Kind; key: string; months: number; expiresAt: string };

const SEEN_STORAGE_KEYS: Record<Kind, string> = {
  welcome: "sebalagbe:paid-welcome-seen",
  expired: "sebalagbe:paid-expired-seen",
};
/** Re-check at most this often while the user navigates (a payment may have just completed). */
const CHECK_THROTTLE_MS = 15000;

const digitsBn = (v: string | number) =>
  String(v).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

function planLabel(months: number, bn: boolean) {
  if (!months || months < 1) return "";
  if (months % 12 === 0) {
    const years = months / 12;
    return bn ? `${digitsBn(years)} বছর` : years === 1 ? "1 year" : `${years} years`;
  }
  return bn ? `${digitsBn(months)} মাস` : months === 1 ? "1 month" : `${months} months`;
}

function formatDate(iso: string, bn: boolean) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return date.toLocaleDateString(bn ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return date.toDateString();
  }
}

const COPY = {
  bn: {
    welcome: {
      title: "পেইড এক্সেস চালু হয়েছে",
      body: "সব এআই টুলসে এখন আপনার সম্পূর্ণ এক্সেস আছে।",
      plan: "আপনার প্ল্যান",
      until: "এক্সেস চলবে",
      cta: "টুলস ব্যবহার শুরু করুন",
      later: "পরে দেখব",
    },
    expired: {
      title: "পেইড এক্সেসের মেয়াদ শেষ",
      body: "আজ থেকে আপনার পেইড টুলসের এক্সেস বন্ধ হয়ে গেছে। আবার ব্যবহার করতে সাবস্ক্রিপশন প্ল্যান দেখুন।",
      plan: "আপনার প্ল্যান ছিল",
      until: "মেয়াদ শেষ হয়েছে",
      cta: "সাবস্ক্রিপশন দেখুন",
      later: "পরে দেখব",
    },
    close: "বন্ধ করুন",
  },
  en: {
    welcome: {
      title: "Paid access is now active",
      body: "You now have full access to all of our AI tools.",
      plan: "Your plan",
      until: "Access until",
      cta: "Start using the tools",
      later: "Maybe later",
    },
    expired: {
      title: "Your paid access has ended",
      body: "Your access to the paid tools has stopped. See our subscription plans to keep using them.",
      plan: "Your plan was",
      until: "Ended on",
      cta: "View subscription plans",
      later: "Maybe later",
    },
    close: "Close",
  },
} as const;

/** Pages where the popup must not appear (auth screens, admin workspace, phone QR upload). */
function isExcluded(pathname: string | null) {
  if (!pathname) return false;
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/ai-editor/mobile-upload/")
  );
}

function readLocalSeen(kind: Kind) {
  try {
    return window.localStorage.getItem(SEEN_STORAGE_KEYS[kind]) || "";
  } catch {
    return "";
  }
}

function writeLocalSeen(kind: Kind, key: string) {
  try {
    window.localStorage.setItem(SEEN_STORAGE_KEYS[kind], key);
  } catch {
    /* storage is optional; the server copy is the source of truth */
  }
}

function getAuthHeaders(): Record<string, string> {
  try {
    const token = window.localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/**
 * One-time paid-access popup, mounted once in app/layout.tsx so it appears on whatever page
 * the user lands on. Two variants, both decided by api/subscription/welcome:
 *  - "welcome": shown only right after paid access starts (payment or admin grant).
 *  - "expired": shown once after the plan runs out, pointing to the subscription page.
 * Closing either is remembered on the server, so it returns only for a new grant / expiry.
 */
export default function PaidAccessWelcomePopup() {
  const { locale } = useI18n();
  const pathname = usePathname();
  const bn = locale === "bn";
  const lang = bn ? COPY.bn : COPY.en;

  const [welcome, setWelcome] = useState<Welcome | null>(null);
  const checkingRef = useRef(false);
  const lastCheckRef = useRef(0);
  const dismissedKeyRef = useRef("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const welcomeRef = useRef<Welcome | null>(null);

  const check = useCallback(async () => {
    if (checkingRef.current) return;
    if (Date.now() - lastCheckRef.current < CHECK_THROTTLE_MS) return;
    checkingRef.current = true;
    lastCheckRef.current = Date.now();
    try {
      const response = await fetch("/api/subscription/welcome", {
        credentials: "include",
        cache: "no-store",
        headers: getAuthHeaders(),
      });
      if (!response.ok) return;
      const data = await response.json().catch(() => null);
      if (!data?.show || typeof data.key !== "string") return;
      const kind: Kind = data.kind === "expired" ? "expired" : "welcome";
      if (data.key === dismissedKeyRef.current || data.key === readLocalSeen(kind)) return;
      // Someone already on the buying screens does not need the "expired" nudge.
      const path = window.location.pathname;
      if (kind === "expired" && (path.startsWith("/subscription") || path.startsWith("/payment"))) return;
      const next: Welcome = {
        kind,
        key: data.key,
        months: Number(data.months) || 0,
        expiresAt: String(data.expiresAt || ""),
      };
      welcomeRef.current = next;
      setWelcome(next);
    } catch {
      /* offline / transient: try again on the next navigation */
    } finally {
      checkingRef.current = false;
    }
  }, []);

  // Check on first load and whenever the user moves to another page.
  useEffect(() => {
    if (isExcluded(pathname)) {
      welcomeRef.current = null;
      setWelcome(null);
      return;
    }
    void check();
  }, [pathname, check]);

  // The user may have paid in another tab: check again when they come back.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && !isExcluded(window.location.pathname)) {
        void check();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [check]);

  const dismiss = useCallback(() => {
    const current = welcomeRef.current;
    if (!current) return;
    welcomeRef.current = null;
    dismissedKeyRef.current = current.key;
    writeLocalSeen(current.kind, current.key);
    setWelcome(null);
    void fetch("/api/subscription/welcome", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ key: current.key }),
      keepalive: true,
    }).catch(() => undefined);
  }, []);

  // Keyboard: Esc closes, focus goes into the dialog, page behind does not scroll.
  useEffect(() => {
    if (!welcome) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [welcome, dismiss]);

  if (!welcome) return null;

  const copy = lang[welcome.kind];
  const expired = welcome.kind === "expired";
  const plan = planLabel(welcome.months, bn);
  const until = formatDate(welcome.expiresAt, bn);
  const Icon = expired ? Hourglass : Crown;

  return (
    <div className="paw-backdrop" onMouseDown={(e) => e.target === e.currentTarget && dismiss()}>
      <div
        ref={dialogRef}
        className={`paw-card${expired ? " paw-card--expired" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="paw-title"
        tabIndex={-1}
      >
        <button type="button" className="paw-close" onClick={dismiss} aria-label={lang.close}>
          <X size={18} aria-hidden="true" />
        </button>

        <div className="paw-hero">
          <span className="paw-emblem" aria-hidden="true">
            <Icon size={30} strokeWidth={1.5} />
          </span>
          <h2 id="paw-title" className="paw-title">
            {copy.title}
          </h2>
          <p className="paw-body">{copy.body}</p>
        </div>

        {(plan || until) && (
          <dl className="paw-facts">
            {plan && (
              <div>
                <dt>{copy.plan}</dt>
                <dd>{plan}</dd>
              </div>
            )}
            {until && (
              <div>
                <dt>{copy.until}</dt>
                <dd>{until}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="paw-actions">
          <Link
            href={expired ? "/subscription" : "/dashboard"}
            className="paw-cta"
            onClick={dismiss}
            prefetch
          >
            {copy.cta}
          </Link>
          <button type="button" className="paw-later" onClick={dismiss}>
            {copy.later}
          </button>
        </div>
      </div>

      <style>{`
        .paw-backdrop {
          position: fixed; inset: 0; z-index: 2147483100;
          display: grid; place-items: center; padding: 16px;
          background: rgba(43, 33, 19, 0.58);
          backdrop-filter: blur(5px);
          animation: pawFade 0.3s ease both;
        }
        .paw-card {
          position: relative; overflow: hidden; outline: none;
          width: min(430px, 100%); max-height: calc(100dvh - 32px); overflow-y: auto;
          padding: 40px 30px 22px; border-radius: 22px; text-align: center;
          background: linear-gradient(180deg, #FFFDF7 0%, #FBF3DD 100%);
          border: 1px solid #E8D4A2;
          box-shadow: 0 32px 80px rgba(43, 33, 19, 0.4), 0 2px 6px rgba(43, 33, 19, 0.12),
            inset 0 1px 0 #fff;
          animation: pawIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .paw-card::before {
          content: ""; position: absolute; inset: 0 0 auto 0; height: 4px;
          background: linear-gradient(90deg, #B8791A, #F2CB7A 50%, #B8791A);
        }
        .paw-card::after {
          content: ""; position: absolute; inset: 0 0 auto 0; height: 210px; pointer-events: none;
          background: radial-gradient(ellipse 65% 100% at 50% 0%, rgba(232, 176, 72, 0.2), transparent 72%);
        }
        .paw-close {
          position: absolute; top: 14px; right: 14px; z-index: 2;
          width: 32px; height: 32px; border: 0; border-radius: 999px; cursor: pointer;
          display: grid; place-items: center; background: transparent; color: #8A7753;
        }
        .paw-close:hover { background: rgba(43, 33, 19, 0.07); color: #2B2113; }
        .paw-hero { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; }
        .paw-emblem {
          width: 80px; height: 80px; border-radius: 999px; display: grid; place-items: center;
          color: #F2CB7A;
          background: radial-gradient(circle at 50% 30%, #4A3519 0%, #2B2113 78%);
          border: 2px solid #D9A441;
          box-shadow: 0 0 0 7px rgba(217, 164, 65, 0.16), 0 14px 30px rgba(43, 33, 19, 0.35);
          animation: pawEmblem 0.7s 0.15s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .paw-title { margin: 24px 0 0; font-size: 25px; line-height: 1.4; font-weight: 800; color: #2B2113; }
        .paw-body { margin: 10px 0 0; max-width: 340px; font-size: 14.5px; line-height: 1.75; color: #6B5A3E; }
        .paw-facts {
          position: relative; z-index: 1; margin: 24px 0 0; padding: 0;
          display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          border-top: 1px solid #E8D4A2; border-bottom: 1px solid #E8D4A2;
        }
        .paw-facts > div { padding: 14px 10px; }
        .paw-facts > div + div { border-left: 1px solid #E8D4A2; }
        .paw-facts dt { font-size: 12px; font-weight: 600; color: #8A7753; }
        .paw-facts dd { margin: 4px 0 0; font-size: 16px; font-weight: 800; color: #2B2113; }
        .paw-actions { position: relative; z-index: 1; margin-top: 22px; display: grid; gap: 6px; }
        .paw-cta {
          height: 50px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;
          background: linear-gradient(180deg, #E02A2A 0%, #C21B1B 100%); color: #fff;
          font-size: 16px; font-weight: 700; text-decoration: none;
          box-shadow: 0 10px 22px rgba(212, 32, 32, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: filter 0.15s ease, transform 0.15s ease;
        }
        .paw-cta:hover { filter: brightness(1.06); transform: translateY(-1px); }
        .paw-later {
          height: 40px; border: 0; background: transparent; cursor: pointer;
          font-size: 14px; font-weight: 600; color: #8A7753; border-radius: 10px;
        }
        .paw-later:hover { color: #2B2113; background: rgba(43, 33, 19, 0.06); }
        .paw-cta:focus-visible, .paw-later:focus-visible, .paw-close:focus-visible {
          outline: 2px solid #D42020; outline-offset: 2px;
        }
        .paw-card--expired .paw-emblem {
          color: #E8D4A2; border-color: #B9A67F;
          box-shadow: 0 0 0 7px rgba(138, 119, 83, 0.14), 0 14px 30px rgba(43, 33, 19, 0.3);
        }
        .paw-card--expired::before { background: linear-gradient(90deg, #8A7753, #D9C79A 50%, #8A7753); }
        @keyframes pawFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pawIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pawEmblem { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
        @media (max-width: 420px) { .paw-card { padding: 34px 20px 18px; } }
        @media (prefers-reduced-motion: reduce) {
          .paw-backdrop, .paw-card, .paw-emblem { animation: none; }
        }
      `}</style>
    </div>
  );
}
