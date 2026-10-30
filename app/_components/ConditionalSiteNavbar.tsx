"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Keeps the marketing navbar out of focused workspaces that already render
 * their own dashboard navigation. The dashboard navbar remains owned by each page.
 */
export default function ConditionalSiteNavbar({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const isMobileQrUpload = pathname.startsWith("/ai-editor/mobile-upload/");
  const isAdminWorkspace = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";
  const isDashboardSubscription = pathname === "/subscription";
  // The global components/Navbar.tsx should stay hidden on the manual payment page.
  const isManualPaymentPage = pathname === "/payment/manual";

  if (
    isMobileQrUpload ||
    isAdminWorkspace ||
    isAuthPage ||
    isDashboardSubscription ||
    isManualPaymentPage
  ) {
    return null;
  }

  return <>{children}</>;
}
