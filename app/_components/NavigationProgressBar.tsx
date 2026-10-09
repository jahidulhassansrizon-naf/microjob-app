"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type ProgressTimer = ReturnType<typeof setTimeout>;

type NavigationStartDetail = {
  targetPath?: string | null;
};

const PROGRESS_MILESTONES: ReadonlyArray<readonly [number, number]> = [
  [8, 24],
  [22, 80],
  [39, 170],
  [55, 320],
  [69, 520],
  [80, 850],
];

/**
 * A small, determinate-looking route progress indicator shared by the app.
 * It grows from 0% to a safe waiting point, then completes when navigation
 * or login-session verification settles. It never slides back and forth.
 */
export default function NavigationProgressBar() {
  const pathname = usePathname() || "/";
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const activeRef = useRef(false);
  const finishingRef = useRef(false);
  const targetPathRef = useRef<string | null>(null);
  // Navigating from the dashboard logo to the home page fills from right to left.
  const reverseProgress = targetPathRef.current === "/";
  const previousPathRef = useRef(pathname);
  const progressTimersRef = useRef<ProgressTimer[]>([]);
  const hideTimerRef = useRef<ProgressTimer | null>(null);

  const clearProgressTimers = useCallback(() => {
    progressTimersRef.current.forEach((timer) => clearTimeout(timer));
    progressTimersRef.current = [];
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const startProgress = useCallback(
    (targetPath?: string | null) => {
      // A login-page start event must not restart a bar already started by its link.
      if (activeRef.current && !finishingRef.current) return;

      clearProgressTimers();
      clearHideTimer();
      activeRef.current = true;
      finishingRef.current = false;
      targetPathRef.current = targetPath ?? null;
      setVisible(true);
      setProgress(0);

      PROGRESS_MILESTONES.forEach(([value, delay]) => {
        const timer = setTimeout(() => {
          if (activeRef.current && !finishingRef.current) {
            setProgress((current) => Math.max(current, value));
          }
        }, delay);
        progressTimersRef.current.push(timer);
      });
    },
    [clearHideTimer, clearProgressTimers],
  );

  const finishProgress = useCallback(() => {
    if (!activeRef.current) return;

    clearProgressTimers();
    clearHideTimer();
    finishingRef.current = true;
    setProgress(100);

    // Leave 100% visible briefly so the completed movement is easy to notice.
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
      activeRef.current = false;
      finishingRef.current = false;
      targetPathRef.current = null;
      hideTimerRef.current = null;
    }, 280);
  }, [clearHideTimer, clearProgressTimers]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const eventTarget = event.target;
      if (!(eventTarget instanceof Element)) return;

      const anchor = eventTarget.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      let destination: URL;
      try {
        destination = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (destination.origin !== window.location.origin) return;
      if (destination.pathname !== "/" && destination.pathname !== "/login") return;

      const current = new URL(window.location.href);
      if (
        destination.pathname === current.pathname &&
        destination.search === current.search
      ) {
        return;
      }

      startProgress(destination.pathname);
    };

    const handleProgressStart = (event: Event) => {
      const detail = (event as CustomEvent<NavigationStartDetail>).detail;
      startProgress(detail?.targetPath ?? null);
    };

    const handleProgressFinish = () => finishProgress();

    // Capture phase catches the click before Next.js handles the Link navigation.
    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("navigation-progress:start", handleProgressStart);
    window.addEventListener("navigation-progress:finish", handleProgressFinish);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("navigation-progress:start", handleProgressStart);
      window.removeEventListener("navigation-progress:finish", handleProgressFinish);
      clearProgressTimers();
      clearHideTimer();
    };
  }, [clearHideTimer, clearProgressTimers, finishProgress, startProgress]);

  useEffect(() => {
    if (previousPathRef.current === pathname) return;
    previousPathRef.current = pathname;

    if (!activeRef.current) return;

    // /login is an intermediate route when an existing session is being checked.
    // Keep the same bar until that check either redirects or finishes with the form.
    if (targetPathRef.current === "/login" && pathname === "/login") return;

    finishProgress();
  }, [pathname, finishProgress]);

  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none fixed inset-x-0 top-0 z-[10000] h-[3px] transition-opacity duration-150 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        role="progressbar"
        aria-label="Page loading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-full shadow-[0_0_7px_rgba(37,99,235,0.3)]"
        style={{
          width: `${progress}%`,
          // `marginLeft: auto` anchors the growing fill to the right edge for logo navigation.
          marginLeft: reverseProgress ? "auto" : "0",
          background: reverseProgress
            ? "linear-gradient(270deg, #2563EB 0%, #10B981 55%, #2563EB 100%)"
            : "linear-gradient(90deg, #2563EB 0%, #10B981 55%, #2563EB 100%)",
          transition: "width 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}
