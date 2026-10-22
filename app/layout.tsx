import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import PageBackgroundInitializer from "@/app/_components/PageBackgroundInitializer";
import ActivityTracker from "@/app/_components/ActivityTracker";
import LiveScreenShareController from "@/app/_components/LiveScreenShareController";
import NavigationProgressBar from "./_components/NavigationProgressBar";
import LoginSuccessOverlay from "./_components/LoginSuccessOverlay";
import ConditionalSiteChrome from "./_components/ConditionalSiteChrome";
import ConditionalSiteNavbar from "./_components/ConditionalSiteNavbar";
import FloatingUserAdminChat from "./_components/FloatingUserAdminChat";
import PrePaintScript from "./_components/PrePaintScript";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import "@rrweb/replay/dist/style.css";
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

export const metadata: Metadata = {
  title: "Sohoj Hub - All your digital tasks in one place",
  description: "Create documents, designs, and print media easily.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale: Locale = cookieLocale === "bn" ? "bn" : DEFAULT_LOCALE;
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
        <I18nProvider initialLocale={initialLocale}>
          <ActivityTracker />
          <LiveScreenShareController />
          <ConditionalSiteChrome>
            <PageBackgroundInitializer />
            <NavigationProgressBar />
          </ConditionalSiteChrome>
          <ConditionalSiteNavbar>
            <Navbar />
          </ConditionalSiteNavbar>
          {children}
          <FloatingUserAdminChat />
          <LoginSuccessOverlay
            initialVisible={showLoginSuccess}
            initialName={showLoginSuccess ? loginFirstName : ""}
          />
        </I18nProvider>
      </body>
    </html>
  );
}
