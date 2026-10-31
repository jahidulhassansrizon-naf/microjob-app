"use client";

import { useEffect, useState } from "react";
import { T } from "@/components/i18n/I18nProvider";
import LoginSuccessCard from "./LoginSuccessCard";

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
