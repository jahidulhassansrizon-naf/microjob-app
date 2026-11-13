import type { Metadata, Viewport } from "next";
import Navbar from "@/components/Navbar";
import PageBackgroundInitializer from "@/app/_components/PageBackgroundInitializer";
import ActivityTracker from "@/app/_components/ActivityTracker";
import LoginSuccessOverlay from "./_components/LoginSuccessOverlay";
import ConditionalSiteChrome from "./_components/ConditionalSiteChrome";
import ConditionalSiteNavbar from "./_components/ConditionalSiteNavbar";
import FloatingSupportGroup from "./_components/FloatingSupportGroup";
import FloatingUserAdminChat from "./_components/FloatingUserAdminChat";
import ImpersonationBanner from "./_components/ImpersonationBanner";
import MyFilesSavedPopup from "./_components/MyFilesSavedPopup";
import PaidAccessWelcomePopup from "./_components/PaidAccessWelcomePopup";
import PrePaintScript from "./_components/PrePaintScript";
import ToolAccessGuard from "./_components/ToolAccessGuard";
import { SiteSettingsProvider } from "./_components/SiteSettingsProvider";
import { DEFAULT_SITE_SETTINGS, buildSiteTitle } from "@/lib/siteSettings";
import { getServerSiteSettings } from "@/lib/serverSiteSettings";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import "./globals.css";

// The root layout no longer reads cookies, so pages without their own dynamic code are
// pre-rendered once and served from the CDN (no function invocation per page view).
// Site identity comes from MongoDB through getServerSiteSettings (cached, tagged
// "site-settings"): saving in the admin panel calls revalidateTag, and revalidate = 300
// is the safety net so even a missed tag refresh never keeps old branding for more than 5 minutes.
// Language and the one-time login-success message are now handled in the browser
// (PrePaintScript, I18nProvider, LoginSuccessOverlay).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getServerSiteSettings();
  const branding = settings.branding;
  const legacyBrandPattern = /(?:সহজ\s*কাজ|sohoj\s*kaj|sohojkaj|sohozkaj|shohozkaj|shohozkai|sohoj\s*hub|sohojhub|easy[\s_-]*work)/gi;
  const normalizeBrandText = (value: string) =>
    value
      .replace(/(?:https?:\/\/)?(?:www\.)?(?:sohojkaj|sohozkaj|shohozkaj|shohozkai)\.com/gi, "sebalagbe.com")
      .replace(legacyBrandPattern, (match) => /[\u0980-\u09FF]/.test(match) ? "সেবা লাগবে" : "Seba Lagbe");
  const savedSiteName = normalizeBrandText(branding.siteName.trim());
  const siteName = savedSiteName || DEFAULT_SITE_SETTINGS.branding.siteName;
  const title = buildSiteTitle(
    siteName,
    normalizeBrandText(branding.metaTitle),
    normalizeBrandText(branding.tagline),
  );
  const description = normalizeBrandText(
    branding.metaDescription.trim() || DEFAULT_SITE_SETTINGS.branding.metaDescription,
  );

  // Keep the original app/favicon.ico, app/icon.png and apple-icon assets as
  // browser icons. The full horizontal logo is not a suitable favicon: using
  // it here made the recognizable tab icon appear tiny/unclear.
  return { title, description };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initialSiteSettings = await getServerSiteSettings();
  // Static HTML is always rendered in the default language. PrePaintScript switches <html> to the
  // visitor's saved language before first paint, and I18nProvider re-renders the text right after
  // hydration (the page is held invisible for bn visitors in between, see globals.css).
  const initialLocale = DEFAULT_LOCALE;

  return (
    <html
      lang={initialLocale}
      data-locale={initialLocale}
      translate="no"
      suppressHydrationWarning
    >
      <head>
        {/* Restores cached layout values before first paint -> no UI pop-in on reload. */}
        <PrePaintScript />
      </head>
      <body
        className="min-h-screen text-gray-900 antialiased"
        suppressHydrationWarning
      >
        <SiteSettingsProvider initialSettings={initialSiteSettings}>
        <I18nProvider initialLocale={initialLocale}>
          <ActivityTracker />
          <ImpersonationBanner />
          <ConditionalSiteChrome>
            <PageBackgroundInitializer />
          </ConditionalSiteChrome>
          <ConditionalSiteNavbar>
            <Navbar />
          </ConditionalSiteNavbar>
          <ToolAccessGuard>{children}</ToolAccessGuard>
          <FloatingSupportGroup />
          <FloatingUserAdminChat />
          <MyFilesSavedPopup />
          <PaidAccessWelcomePopup />
          <LoginSuccessOverlay />
        </I18nProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
