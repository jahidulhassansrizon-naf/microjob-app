"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { T } from "@/components/i18n/I18nProvider";

type LoginSuccessOverlayProps = {
  /** Read on the server from a short-lived, one-time UI cookie. */
  initialVisible?: boolean;
  /** First name, also read on the server from a one-time cookie, so the very first HTML is final. */
  initialName?: string;
};

function clearCookie(name: string) {
  const secureCookie = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${secureCookie}`;
}

/**
 * Shows the existing login-success message above whichever page the user was
 * trying to open. The target page remains mounted and visible behind the modal.
 */
export default function LoginSuccessOverlay({
  initialVisible = false,
  initialName = "",
}: LoginSuccessOverlayProps) {
  const [visible, setVisible] = useState(initialVisible);
  // Starts with the name from the server, so the text never changes after the page loads.
  const [firstName, setFirstName] = useState(
    initialName.trim().split(/\s+/)[0] ?? "",
  );
  // The bar starts empty in the server HTML and fills after hydration. (The old CSS keyframes were
  // injected by styled-jsx only after hydration, so the bar showed full and then restarted.)
  const [go, setGo] = useState(false);

  useEffect(() => {
    if (!initialVisible) return;

    // Consume the UI-only flags so a refresh or later navigation cannot replay it.
    clearCookie("sohoj_login_success");
    clearCookie("sohoj_login_name");

    // Fallback: no name cookie -> use the cached account's first name.
    if (!initialName.trim()) {
      try {
        const rawUser = window.localStorage.getItem("user");
        if (rawUser) {
          const user = JSON.parse(rawUser) as {
            fullName?: unknown;
            name?: unknown;
          };
          const name =
            typeof user?.fullName === "string"
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
    }

    const startBar = window.setTimeout(() => setGo(true), 30);
    const timer = window.setTimeout(() => setVisible(false), 1600);
    return () => {
      window.clearTimeout(startBar);
      window.clearTimeout(timer);
    };
  }, [initialVisible, initialName]);

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
          <CheckCircle2
            size={26}
            strokeWidth={2}
            className="animate-in zoom-in-50 duration-500"
          />
        </div>

        <h2
          id="login-success-title"
          className="text-lg font-semibold text-slate-900"
        >
          <T>Login Successful!</T>
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {firstName ? (
            <>
              <T>Welcome back,</T> {firstName}!
            </>
          ) : (
            <T>Welcome back!</T>
          )}
        </p>

        <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#2563EB] transition-[width] ease-out"
            style={{ width: go ? "100%" : "0%", transitionDuration: "1500ms" }}
          />
        </div>
      </div>
    </div>
  );
}
