import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import PageBackgroundInitializer from "@/app/_components/PageBackgroundInitializer";
import NavigationProgressBar from "./_components/NavigationProgressBar";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const banglaSans = Noto_Sans_Bengali({ variable: "--font-bangla", subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "সহজ কাজ - All your digital tasks in one place",
  description: "Create documents, designs, and print media easily.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale: Locale = cookieLocale === "bn" ? "bn" : DEFAULT_LOCALE;

  return (
    <html lang={initialLocale} data-locale={initialLocale} translate="no" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${banglaSans.variable} min-h-screen text-gray-900 antialiased`} suppressHydrationWarning>
        <I18nProvider initialLocale={initialLocale}>
          <PageBackgroundInitializer />
          <NavigationProgressBar />
          <Navbar />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
