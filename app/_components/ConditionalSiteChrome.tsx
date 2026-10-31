"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Hide global site chrome on focused utility pages and the standalone admin workspace. */
export default function ConditionalSiteChrome({
  children,
  showOnLoginWhenSignedIn = false,
}: {
  children: ReactNode;
  /** Keep this chrome (the page loader) on /login when a session cookie exists, because a signed-in
   *  visitor is sent straight on to the dashboard and must see the loader, not a blank page. */
  showOnLoginWhenSignedIn?: boolean;
}) {
  const pathname = usePathname();
  const isMobileQrUpload = pathname?.startsWith("/ai-editor/mobile-upload/") ?? false;
  const isAdminWorkspace = pathname === "/admin" || pathname?.startsWith("/admin/") || false;
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";

  // Keep authentication pages focused and consistent: they use their own branded headers.
  if (showOnLoginWhenSignedIn && pathname === "/login" && !isMobileQrUpload && !isAdminWorkspace) {
    return <>{children}</>;
  }
  if (isMobileQrUpload || isAdminWorkspace || isAuthPage) return null;
  return <>{children}</>;
}
