"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Makes an active "login as this user" session visible, instead of it being
 * a silent thing happening to the account. Shown on every page (mounted once
 * in the root layout) for as long as the impersonation cookie is valid.
 */
export default function ImpersonationBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);

  // This component lives in the root layout, so it is NOT remounted on in-app navigation.
  // Re-check the session on every route change, otherwise the banner keeps showing after
  // "Return to admin" (until a manual reload).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const impersonation = data?.user?.impersonation;
        setAdminEmail(impersonation?.active ? impersonation.adminEmail || "an administrator" : null);
      })
      .catch(() => {
        if (!cancelled) setAdminEmail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Keeps the session alive while this tab is actually open and in the
  // foreground. Stop working / close the tab, and the existing cookie
  // expiry (at most ~1h away) ends it on its own — nothing to clean up here.
  useEffect(() => {
    if (!adminEmail) return;
    const sendHeartbeat = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/admin/impersonation-heartbeat", { method: "POST", credentials: "include", cache: "no-store" }).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 5 * 60 * 1000);
    document.addEventListener("visibilitychange", sendHeartbeat);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", sendHeartbeat);
    };
  }, [adminEmail]);

  if (!adminEmail) return null;

  const handleReturn = async () => {
    if (returning) return;
    setReturning(true);
    try {
      const response = await fetch("/api/admin/stop-impersonation", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      if (response.ok) {
        // The session has ended: hide the banner right away, don't wait for a reload.
        setAdminEmail(null);
        router.push("/admin");
        router.refresh();
      }
    } finally {
      setReturning(false);
    }
  };

  return (
    <div className="sticky top-0 z-[200] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-amber-950 shadow-md">
      <span>
        You are signed in to this account as an administrator ({adminEmail}). This session is logged, stays open while you're active here, and ends automatically if left idle or after 12 hours.
      </span>
      <button
        type="button"
        onClick={handleReturn}
        disabled={returning}
        className="shrink-0 rounded-md bg-amber-950 px-3 py-1 text-xs font-bold text-amber-50 transition hover:bg-amber-900 disabled:opacity-60"
      >
        {returning ? "Returning…" : "Return to admin"}
      </button>
    </div>
  );
}
