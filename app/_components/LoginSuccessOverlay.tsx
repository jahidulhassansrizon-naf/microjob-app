"use client";

import { useEffect, useRef, useState } from "react";
import { T } from "@/components/i18n/I18nProvider";
import LoginSuccessCard from "./LoginSuccessCard";

type LoginSuccessOverlayProps = {
  /** Optional. The layout is static now, so the browser reads the one-time UI cookie itself. */
  initialVisible?: boolean;
  /** Optional first name; normally read from the one-time cookie in the browser. */
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
  // Starts with the name from the server (if any), so the text never changes after the page loads.
  const [firstName, setFirstName] = useState(
    initialName.trim().split(/\s+/)[0] ?? "",
  );
  // The bar starts empty in the server HTML and fills after hydration. (The old CSS keyframes were
  // injected by styled-jsx only after hydration, so the bar showed full and then restarted.)
  const [go, setGo] = useState(false);
  // The root layout is static now, so the one-time login cookies are read here, in the browser.
  // Remembered in a ref so a second effect run (React dev strict mode) still shows the message.
  const detectedRef = useRef<{ show: boolean; name: string } | null>(null);

  useEffect(() => {
    if (!detectedRef.current) {
      let show = initialVisible;
      let name = initialName.trim().split(/\s+/)[0] ?? "";
      if (!show) {
        try {
          show = /(?:^|;\s*)sohoj_login_success=1(?:;|$)/.test(document.cookie);
          if (show) {
            const match = /(?:^|;\s*)sohoj_login_name=([^;]*)/.exec(document.cookie);
            if (match) {
              try {
                name = decodeURIComponent(match[1]).trim().split(/\s+/)[0] ?? "";
              } catch {
                name = match[1].trim().split(/\s+/)[0] ?? "";
              }
            }
          }
        } catch {
          show = false;
        }
      }
      detectedRef.current = { show, name };
      // Consume the UI-only flags so a refresh or later navigation cannot replay it.
      if (show) {
        clearCookie("sohoj_login_success");
        clearCookie("sohoj_login_name");
      }
    }

    const { show, name } = detectedRef.current;
    if (!show) {
      // Nothing to show: drop the dim backdrop PrePaintScript may have put up.
      document.documentElement.removeAttribute("data-login-pending");
      return;
    }

    setVisible(true);
    if (name) setFirstName(name);

    // Fallback: no name cookie -> use the cached account's first name.
    if (!name) {
      try {
        const rawUser = window.localStorage.getItem("user");
        if (rawUser) {
          const user = JSON.parse(rawUser) as {
            fullName?: unknown;
            name?: unknown;
          };
          const cachedName =
            typeof user?.fullName === "string"
              ? user.fullName
              : typeof user?.name === "string"
                ? user.name
                : "";
          const trimmedName = cachedName.trim();
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

  // The card is on screen: the early backdrop is no longer needed.
  useEffect(() => {
    if (visible) document.documentElement.removeAttribute("data-login-pending");
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#2A2118]/60 px-4 backdrop-blur-md animate-in fade-in duration-300">
      <LoginSuccessCard
        go={go}
        durationMs={1500}
        onClose={() => setVisible(false)}
        closeLabel="Close login successful message"
        title={<T>Login Successful!</T>}
        subtitle={
          firstName ? (
            <>
              <T>Welcome back,</T> <strong>{firstName}</strong>!
            </>
          ) : (
            <T>Welcome back!</T>
          )
        }
      />
    </div>
  );
}
