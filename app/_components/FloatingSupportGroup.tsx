"use client";

import { usePathname } from "next/navigation";
import { T } from "@/components/i18n/I18nProvider";
import { useSiteSettings } from "@/app/_components/SiteSettingsProvider";

// Shown until the admin saves their own link in Admin → Site Settings → Footer.
const DEFAULT_SUPPORT_GROUP_URL = "https://chat.whatsapp.com/KaeIxbEHVuwFIve8fTTl9W";

/**
 * Cleans a WhatsApp group link: strips tracking params (fbclid, s, p, iam ...) and unwraps
 * Facebook redirect links (l.facebook.com/l.php?u=...). Returns "" if it is not a valid link.
 */
function normalizeGroupLink(raw?: string): string {
  let value = (raw || "").trim();
  if (!value) return "";
  try {
    const u = new URL(value);
    const inner = u.hostname.endsWith("facebook.com") ? u.searchParams.get("u") : null;
    if (inner) value = inner;
  } catch {
    /* not a URL, fall through */
  }
  const match = value.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i);
  if (match) return `https://chat.whatsapp.com/${match[1]}`;
  return /^https?:\/\//i.test(value) ? value : "";
}

const WA_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

/**
 * The one and only floating WhatsApp support-group button (bottom-left).
 * Mounted once in app/layout.tsx so it appears on every page of the website.
 * Hidden only on the standalone admin workspace and the mobile QR-upload page.
 */
export default function FloatingSupportGroup() {
  const pathname = usePathname() || "/";
  const { settings } = useSiteSettings();

  const isMobileQrUpload = pathname.startsWith("/ai-editor/mobile-upload/");
  const isAdminWorkspace = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isMobileQrUpload || isAdminWorkspace) return null;

  const footerExtra = settings.footer as unknown as { whatsappGroupUrl?: string };
  const href = normalizeGroupLink(footerExtra?.whatsappGroupUrl) || DEFAULT_SUPPORT_GROUP_URL;
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp Support Group"
      title="WhatsApp Support Group"
      className="group fixed bottom-4 left-4 z-[60] flex items-center gap-2 sm:bottom-6 sm:left-6"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14">
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/40" />
        <svg className="relative h-6 w-6 fill-current sm:h-7 sm:w-7" viewBox="0 0 24 24" aria-hidden>
          <path d={WA_PATH} />
        </svg>
      </span>
      <span className="pointer-events-none hidden max-w-0 overflow-hidden whitespace-nowrap rounded-full bg-slate-900/95 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-300 group-hover:max-w-[12rem] group-hover:px-3 group-hover:opacity-100 sm:inline-block">
        <T>{"Support Group"}</T>
      </span>
    </a>
  );
}
