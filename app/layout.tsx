import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";
import { cookies } from "next/headers";
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
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const banglaSans = Noto_Sans_Bengali({
  variable: "--font-bangla",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// The public site identity is stored in the existing MongoDB database. Keep this
// segment dynamic so the browser title and description reflect Admin changes immediately.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const [cookieStore, initialSiteSettings] = await Promise.all([
    cookies(),
    getServerSiteSettings(),
  ]);
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale: Locale = cookieLocale === "bn" ? "bn" : "en";
  const showLoginSuccess =
    cookieStore.get("sohoj_login_success")?.value === "1";
  const rawLoginName = cookieStore.get("sohoj_login_name")?.value ?? "";
  let loginFirstName = rawLoginName;
  try {
    loginFirstName = decodeURIComponent(rawLoginName);
  } catch {
    // keep the raw value
  }

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
        className={`${geistSans.variable} ${geistMono.variable} ${banglaSans.variable} min-h-screen text-gray-900 antialiased`}
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
          <LoginSuccessOverlay
            initialVisible={showLoginSuccess}
            initialName={showLoginSuccess ? loginFirstName : ""}
          />
        </I18nProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
