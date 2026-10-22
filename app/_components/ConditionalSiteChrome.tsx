"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Hide global site chrome on focused utility pages and the standalone admin workspace. */
export default function ConditionalSiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMobileQrUpload = pathname?.startsWith("/ai-editor/mobile-upload/") ?? false;
  const isAdminWorkspace = pathname === "/admin" || pathname?.startsWith("/admin/") || false;
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";

  // Keep authentication pages focused and consistent: they use their own branded headers.
  if (isMobileQrUpload || isAdminWorkspace || isAuthPage) return null;
  return <>{children}</>;
}
