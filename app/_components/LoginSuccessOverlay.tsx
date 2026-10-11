"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { T } from "@/components/i18n/I18nProvider";

type LoginSuccessOverlayProps = {
  /** Read on the server from a short-lived, one-time UI cookie. */
  initialVisible?: boolean;
};

/**
 * Shows the existing login-success message above whichever page the user was
 * trying to open. The target page remains mounted and visible behind the modal.
 */
export default function LoginSuccessOverlay({
  initialVisible = false,
}: LoginSuccessOverlayProps) {
  const [visible, setVisible] = useState(initialVisible);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    if (!initialVisible) return;

    // Consume the UI-only flag so a refresh or later navigation cannot replay it.
    const secureCookie = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `sohoj_login_success=; path=/; max-age=0; SameSite=Lax${secureCookie}`;

    // Match the Dashboard success message by using the cached account's first name.
    try {
      const rawUser = window.localStorage.getItem("user");
      if (rawUser) {
        const user = JSON.parse(rawUser) as { fullName?: unknown; name?: unknown };
        const name = typeof user?.fullName === "string"
          ? user.fullName
          : typeof user?.name === "string"
            ? user.name
            : "";
        const trimmedName = name.trim();
        if (trimmedName) setFirstName(trimmedName.split(/\s+/)[0]);
      }
    } catch {
      // The success message does not depend on cached profile data.
    }

    const timer = window.setTimeout(() => setVisible(false), 1600);
    return () => window.clearTimeout(timer);
  }, [initialVisible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-success-title"
        className="relative w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white p-7 text-center shadow-xl animate-in zoom-in-95 duration-300"
      >
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="absolute right-3 top-3 z-10 cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close login successful message"
          title="Close"
        >
          <X size={16} />
        </button>

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={26} strokeWidth={2} className="animate-in zoom-in-50 duration-500" />
        </div>

        <h2 id="login-success-title" className="text-lg font-semibold text-slate-900">
          <T>Login Successful!</T>
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {firstName ? (
            <>
              <T>Welcome back,</T>{" "}{firstName}!
            </>
          ) : (
            <T>Welcome back!</T>
          )}
        </p>

        <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-full origin-left rounded-full bg-[#2563EB] animate-[loginProgress_1.6s_linear_forwards]" />
        </div>
      </div>

      <style jsx global>{`
        @keyframes loginProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
