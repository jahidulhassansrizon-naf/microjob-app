"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// How fast the bar creeps while the page is still loading. It always moves
// (never freezes at a number), slowing down as it gets close to CAP.
const CAP = 99;
const TAU_SECONDS = 1.6;

// A client-side page change opens the next page directly, exactly as before. The loader
// only appears if the page is really slow, i.e. still not ready after this long.
const SHOW_DELAY_MS = 700;
// Once visible, the loader stays at least this long so 0% -> 100% is always seen.
const MIN_VISIBLE_MS = 300;
// Lets freshly rendered loading screens register their "hold" before we finish.
const SETTLE_DELAY_MS = 80;
// 100% stays on screen briefly, then the loader fades out.
const HOLD_AT_100_MS = 150;
const FADE_MS = 250;
// Safety nets: the loader can never stay on screen forever.
const STUCK_TIMEOUT_MS = 12_000;
const ABSOLUTE_MAX_MS = 30_000;

// The first mount of the loader in a tab is the real page load / reload. The server
// renders it already visible (CSS-only 0% -> ~96% animation, see globals.css) so it is
// on screen while the page is still downloading and hydrating. Later mounts are
// normal navigations.
let initialLoadHandled = false;

// The login page sets this short-lived cookie; the "Login Successful" message is shown
// instead of the loader on the first page after signing in.
const LOGIN_QUIET_MS = 2500;
function hasLoginSuccessCookie() {
  try {
    return /(?:^|;\s*)sohoj_login_success=1(?:;|$)/.test(document.cookie);
  } catch {
    return false;
  }
}

type Controller = {
  requestFinish: () => void;
  isRunning: () => boolean;
};

/**
 * Full-screen page loader for the whole website.
 *
 * A branded screen (same cream background as the site) with a big percentage and a
 * striped progress bar at the bottom that fills from 0% to 100%, left to right.
 *   - page load / reload: visible from the very first paint (server-rendered),
 *   - click on an internal link: the next page opens directly; the loader only appears
 *     if the page is still not ready after SHOW_DELAY_MS (a slow page),
 *   - loading screens: <NavigationProgressHold /> keeps it up until they are gone
 *     (once it is visible)
 *   - right after login: not shown, the "Login Successful" message is shown instead
 *     ("navigation-progress:hold" / "navigation-progress:release" events).
 * It never goes backwards and only reaches 100% when the loading has really finished.
 */
export default function NavigationProgressBar({
  suppressInitial = false,
}: {
  /** True when the server saw the one-time login-success cookie (no loader after login). */
  suppressInitial?: boolean;
}) {
  const pathname = usePathname() || "/";
  const [initialPhase] = useState(
    () =>
      !initialLoadHandled &&
      !suppressInitial &&
      !(typeof document !== "undefined" && hasLoginSuccessCookie()),
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<Controller | null>(null);
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    const root = rootRef.current;
    const fill = fillRef.current;
    const row = rowRef.current;
    if (!root || !fill || !row) return;

    initialLoadHandled = true;

    // Right after login the success message is shown, not the loader.
    let quietUntil = 0;
    if (suppressInitial || hasLoginSuccessCookie()) {
      quietUntil = performance.now() + LOGIN_QUIET_MS;
    }

    type Phase = "idle" | "running" | "finishing";
    let phase: Phase = "idle";
    let visible = false;
    let shown = 0;
    let shownAt = 0;
    let startedAt = 0;
    let holds = 0;
    let finishRequested = false;
    let startedByHold = false;
    let lastInt = -1;
    let raf = 0;
    let last = 0;

    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let stuckTimer: ReturnType<typeof setTimeout> | null = null;
    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;

    const clear = (timer: ReturnType<typeof setTimeout> | null) => {
      if (timer !== null) clearTimeout(timer);
      return null;
    };

    const paint = () => {
      const width = `${shown.toFixed(2)}%`;
      fill.style.width = width;
      row.style.width = width;
      const rounded = Math.round(shown);
      if (rounded !== lastInt) {
        lastInt = rounded;
        root.style.setProperty("--lpi", String(rounded));
        root.setAttribute("aria-valuenow", String(rounded));
      }
    };

    const stopLoop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;

      if (phase === "running") {
        shown += (CAP - shown) * (1 - Math.exp(-dt / TAU_SECONDS));
      } else if (phase === "finishing") {
        shown = Math.min(100, shown + Math.max((100 - shown) * 10 * dt, 70 * dt));
        if (shown >= 100) {
          shown = 100;
          paint();
          raf = 0;
          hideTimer = setTimeout(() => {
            hideTimer = null;
            root.dataset.state = "hidden";
            visible = false;
            fadeTimer = setTimeout(() => {
              fadeTimer = null;
              phase = "idle";
              shown = 0;
              lastInt = -1;
              startedByHold = false;
              paint();
            }, FADE_MS);
          }, HOLD_AT_100_MS);
          return;
        }
      }

      paint();
      raf = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const showNow = () => {
      showTimer = clear(showTimer);
      if (visible) return;
      visible = true;
      shownAt = performance.now();
      root.dataset.state = "running";
    };

    const clearAllTimers = () => {
      showTimer = clear(showTimer);
      settleTimer = clear(settleTimer);
      stuckTimer = clear(stuckTimer);
      finishTimer = clear(finishTimer);
      hideTimer = clear(hideTimer);
      fadeTimer = clear(fadeTimer);
    };

    const beginFinishing = () => {
      finishTimer = null;
      phase = "finishing";
      startLoop();
    };

    const finish = () => {
      if (phase !== "running") return;
      stuckTimer = clear(stuckTimer);
      settleTimer = clear(settleTimer);
      finishRequested = false;

      if (!visible) {
        // The next page was ready before the loader even needed to show.
        showTimer = clear(showTimer);
        stopLoop();
        phase = "idle";
        shown = 0;
        startedByHold = false;
        return;
      }

      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - shownAt));
      finishTimer = setTimeout(beginFinishing, wait);
    };

    const armStuckTimer = () => {
      stuckTimer = clear(stuckTimer);
      stuckTimer = setTimeout(() => {
        stuckTimer = null;
        if (phase !== "running") return;
        const age = performance.now() - startedAt;
        if (holds > 0 && age < ABSOLUTE_MAX_MS) {
          armStuckTimer();
          return;
        }
        finish();
      }, STUCK_TIMEOUT_MS);
    };

    const requestFinish = () => {
      if (phase !== "running" || settleTimer !== null || finishTimer !== null) return;
      settleTimer = setTimeout(() => {
        settleTimer = null;
        if (phase !== "running") return;
        if (holds > 0) {
          finishRequested = true;
          return;
        }
        finish();
      }, SETTLE_DELAY_MS);
    };

    const startProgress = (immediate: boolean) => {
      if (phase === "running") {
        if (immediate) showNow();
        return;
      }
      if (performance.now() < quietUntil) return;

      clearAllTimers();
      stopLoop();
      phase = "running";
      shown = 0;
      lastInt = -1;
      finishRequested = false;
      startedAt = performance.now();
      visible = false;
      paint();

      if (immediate) showNow();
      else showTimer = setTimeout(showNow, SHOW_DELAY_MS);

      startLoop();
      armStuckTimer();
    };

    // ---- Page load / reload: continue from the server-rendered CSS animation ----
    if (initialPhase) {
      const rootWidth = root.getBoundingClientRect().width || window.innerWidth || 1;
      const current = (fill.getBoundingClientRect().width / rootWidth) * 100;
      shown = Math.min(96, Math.max(0, Number.isFinite(current) ? current : 0));
      phase = "running";
      visible = true;
      startedAt = performance.now();
      // The server-rendered loader has been on screen since the first paint.
      shownAt = shown >= 3 ? 0 : performance.now();
      lastInt = -1;
      paint();
      root.dataset.state = "running"; // hands over from the CSS animation, no jump
      startLoop();
      armStuckTimer();

      if (document.readyState === "complete") requestFinish();
    }

    const handleLoaded = () => requestFinish();
    if (initialPhase && document.readyState !== "complete") {
      window.addEventListener("load", handleLoaded, { once: true });
    }

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

      const rawHref = anchor.getAttribute("href") || "";
      if (!rawHref || rawHref.startsWith("#")) return;

      let destination: URL;
      try {
        destination = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (destination.origin !== window.location.origin) return;

      // API routes and files (pdf, images, ...) are downloads, not pages.
      if (destination.pathname.startsWith("/api/")) return;
      if (/\.[a-z0-9]{2,5}$/i.test(destination.pathname)) return;

      // Same page (hash or query-only change): the page does not reload.
      if (destination.pathname === window.location.pathname) return;

      startProgress(false);
    };

    const handleProgressStart = () => startProgress(false);
    const handleProgressFinish = () => requestFinish();

    // A loading screen is showing: keep the loader up until it is gone.
    const handleHold = () => {
      holds += 1;
      // Not shown at once: a loading screen that goes away quickly needs no loader.
      // If it stays longer than SHOW_DELAY_MS the loader appears.
      if (phase !== "running") startedByHold = true;
      startProgress(false);
    };

    const handleRelease = () => {
      holds = Math.max(0, holds - 1);
      if (holds === 0 && (finishRequested || startedByHold)) requestFinish();
    };

    // Capture phase catches the click before Next.js handles the Link navigation.
    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("navigation-progress:start", handleProgressStart);
    window.addEventListener("navigation-progress:finish", handleProgressFinish);
    window.addEventListener("navigation-progress:hold", handleHold);
    window.addEventListener("navigation-progress:release", handleRelease);

    controllerRef.current = {
      requestFinish,
      isRunning: () => phase === "running",
    };

    return () => {
      controllerRef.current = null;
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("load", handleLoaded);
      window.removeEventListener("navigation-progress:start", handleProgressStart);
      window.removeEventListener("navigation-progress:finish", handleProgressFinish);
      window.removeEventListener("navigation-progress:hold", handleHold);
      window.removeEventListener("navigation-progress:release", handleRelease);
      clearAllTimers();
      stopLoop();
    };
  }, [initialPhase, suppressInitial]);

  // The new page has arrived: complete the loader (unless a loading screen holds it).
  useEffect(() => {
    if (previousPathRef.current === pathname) return;
    previousPathRef.current = pathname;
    controllerRef.current?.requestFinish();
  }, [pathname]);

  return (
    <div
      ref={rootRef}
      className="nav-loader"
      data-state={initialPhase ? "initial" : "hidden"}
      role="progressbar"
      aria-label="Page loading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <div className="nav-loader__meta">
        <div ref={rowRef} className="nav-loader__row">
          <span className="nav-loader__pct" aria-hidden="true" />
        </div>
      </div>
      <div className="nav-loader__track">
        <div ref={fillRef} className="nav-loader__fill" />
      </div>
    </div>
  );
}
