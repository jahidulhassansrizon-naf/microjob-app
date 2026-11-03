"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Shown instead of the sign-in form when the visitor is already signed in.
 * It paints the same cream colour as the site's page loader (never white, never the form),
 * asks the loader to appear immediately and stay up, and opens the destination.
 * The hold is released automatically when the destination page replaces this one.
 */
export default function SessionRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 bg-gradient-to-b from-[#F2E8D2] to-[#EFE5CE]"
    />
  );
}
