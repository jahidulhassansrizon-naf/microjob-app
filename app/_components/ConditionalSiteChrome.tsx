"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Hide global site chrome on the focused mobile QR-upload page. */
export default function ConditionalSiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMobileQrUpload = pathname?.startsWith("/ai-editor/mobile-upload/") ?? false;

  if (isMobileQrUpload) return null;
  return <>{children}</>;
}
