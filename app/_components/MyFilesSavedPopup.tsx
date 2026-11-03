"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FolderOpen, X } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  MY_FILES_SAVED_EVENT,
  type MyFilesSavedDetail,
} from "@/app/_lib/myFilesNotice";

/** How long the popup stays on screen. Hovering / focusing it pauses the timer. */
const VISIBLE_MS = 14000;

const digitsBn = (v: number) =>
  String(v).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

const COPY = {
  bn: {
    title: "ছবি তৈরি হয়ে গেছে!",
    one: "আপনার ছবিটি ‘আমার ফাইল’-এ সেভ হয়েছে। যেকোনো সময় সেখানে গিয়ে ছবিটি দেখতে ও ডাউনলোড করতে পারবেন।",
    many: (n: number) =>
      `আপনার ${digitsBn(n)}টি ছবি ‘আমার ফাইল’-এ সেভ হয়েছে। যেকোনো সময় সেখানে গিয়ে ছবিগুলো দেখতে ও ডাউনলোড করতে পারবেন।`,
    cta: "আমার ফাইলে দেখুন",
    close: "বন্ধ করুন",
  },
  en: {
    title: "Your photo is ready!",
    one: "It has been saved in My Files. You can open it there any time to view and download it.",
    many: (n: number) =>
      `${n} photos have been saved in My Files. You can open them there any time to view and download them.`,
    cta: "View in My Files",
    close: "Close",
  },
} as const;

/**
 * Global popup that tells the user where a freshly generated image went.
 * Mounted once in app/layout.tsx; any tool triggers it with notifyMyFilesSaved().
 */
export default function MyFilesSavedPopup() {
  const { locale } = useI18n();
  const pathname = usePathname();
  const copy = locale === "bn" ? COPY.bn : COPY.en;

  const [count, setCount] = useState(1);
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);
  // Bumped on every new event, so the countdown bar restarts for the newest image.
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const onSaved = (event: Event) => {
      const detail = (event as CustomEvent<MyFilesSavedDetail>).detail;
      const added = Math.max(1, detail?.count ?? 1);
      // Bulk editing saves photos one by one: while the popup is open, keep adding to its count.
      setCount((current) => (visibleRef.current ? current + added : added));
      setRunId((id) => id + 1);
      visibleRef.current = true;
      setVisible(true);
    };
    window.addEventListener(MY_FILES_SAVED_EVENT, onSaved);
    return () => window.removeEventListener(MY_FILES_SAVED_EVENT, onSaved);
  }, []);

  // The user is already looking at My Files (or left the page): nothing to point to.
  useEffect(() => {
    if (pathname === "/my-files" || pathname?.startsWith("/my-files/")) {
      visibleRef.current = false;
      setVisible(false);
    }
  }, [pathname]);

  if (!visible) return null;

  const close = () => {
    visibleRef.current = false;
    setVisible(false);
  };

  return (
    <div className="my-files-popup-wrap" role="status" aria-live="polite">
      <div key={runId} className="my-files-popup">
        <button
          type="button"
          className="my-files-popup-close"
          onClick={close}
          aria-label={copy.close}
        >
          <X size={16} aria-hidden="true" />
        </button>

        <div className="my-files-popup-body">
          <span className="my-files-popup-icon" aria-hidden="true">
            <CheckCircle2 size={22} />
          </span>
          <div className="my-files-popup-text">
            <p className="my-files-popup-title">{copy.title}</p>
            <p className="my-files-popup-desc">
              {count > 1 ? copy.many(count) : copy.one}
            </p>
          </div>
        </div>

        <Link
          href="/my-files"
          className="my-files-popup-cta"
          onClick={close}
          prefetch
        >
          <FolderOpen size={16} aria-hidden="true" />
          <span>{copy.cta}</span>
        </Link>

        {/* Countdown bar: the popup closes itself when the bar finishes. */}
        <span
          className="my-files-popup-timer"
          style={{ animationDuration: `${VISIBLE_MS}ms` }}
          onAnimationEnd={close}
          aria-hidden="true"
        />
      </div>

      <style>{`
        .my-files-popup-wrap {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          width: min(440px, calc(100vw - 24px));
          z-index: 2147483000; /* above every modal / backdrop in the app */
          pointer-events: none;
        }
        .my-files-popup {
          position: relative;
          overflow: hidden;
          pointer-events: auto;
          padding: 16px 16px 18px;
          border-radius: 18px;
          border: 1px solid #F0D9A8;
          background: #FFFBF0;
          box-shadow: 0 18px 44px rgba(59, 47, 30, 0.28), 0 2px 6px rgba(59, 47, 30, 0.12);
          animation: myFilesPopupIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .my-files-popup-body {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding-right: 26px;
        }
        .my-files-popup-icon {
          flex: none;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: #DDF5E7;
          color: #12A150;
        }
        .my-files-popup-text { min-width: 0; }
        .my-files-popup-title {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          line-height: 1.4;
          color: #2B2113;
        }
        .my-files-popup-desc {
          margin: 3px 0 0;
          font-size: 13.5px;
          line-height: 1.6;
          color: #6B5A3E;
        }
        .my-files-popup-cta {
          margin-top: 13px;
          width: 100%;
          height: 44px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #D42020;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .my-files-popup-cta:hover { background: #AE1717; transform: translateY(-1px); }
        .my-files-popup-cta:focus-visible,
        .my-files-popup-close:focus-visible {
          outline: 2px solid #D42020;
          outline-offset: 2px;
        }
        .my-files-popup-close {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: transparent;
          color: #8A7753;
          cursor: pointer;
        }
        .my-files-popup-close:hover { background: #F4E8CB; color: #2B2113; }
        .my-files-popup-timer {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 4px;
          width: 100%;
          background: #D42020;
          transform-origin: left center;
          animation-name: myFilesPopupTimer;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        .my-files-popup:hover .my-files-popup-timer,
        .my-files-popup:focus-within .my-files-popup-timer {
          animation-play-state: paused;
        }
        @keyframes myFilesPopupIn {
          from { opacity: 0; transform: translateY(-14px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes myFilesPopupTimer {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .my-files-popup { animation: none; }
        }
      `}</style>
    </div>
  );
}
