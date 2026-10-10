"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Hide global site chrome on focused utility pages and the standalone admin workspace. */
export default function ConditionalSiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMobileQrUpload = pathname?.startsWith("/ai-editor/mobile-upload/") ?? false;
  const isAdminWorkspace = pathname === "/admin" || pathname?.startsWith("/admin/") || false;

  if (isMobileQrUpload || isAdminWorkspace) return null;
  return <>{children}</>;
}
