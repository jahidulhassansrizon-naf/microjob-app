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
  // The tools page and every tool page render their own DashboardNavbar,
  // so the global marketing navbar must not stack on top of it.
  const isSebaLagbeTools =
    pathname === "/seba-lagbe-tools" || pathname.startsWith("/seba-lagbe-tools/");
  // The global components/Navbar.tsx should stay hidden on the manual payment page.
  const isManualPaymentPage = pathname === "/payment/manual";
  // The payment result page renders the dashboard navbar itself.
  const isPaymentResultPage = pathname === "/payment/success";

  if (
    isMobileQrUpload ||
    isAdminWorkspace ||
    isAuthPage ||
    isDashboardSubscription ||
    isSebaLagbeTools ||
    isManualPaymentPage ||
    isPaymentResultPage
  ) {
    return null;
  }

  // `display: contents` keeps the wrapper box-less so the navbar's own sticky/fixed layout is unchanged.
  // The 404 page hides this slot with a style rule (see NotFoundView).
  return <div className="site-navbar-slot" style={{ display: "contents" }}>{children}</div>;
}
