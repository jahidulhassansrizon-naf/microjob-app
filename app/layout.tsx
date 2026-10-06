import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import Navbar from "@/components/Navbar";
import PageBackgroundInitializer from "@/app/_components/PageBackgroundInitializer";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "সহজ কাজ - All your digital tasks in one place",
  description: "Create documents, designs, and print media easily.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen text-gray-900 antialiased`}
        suppressHydrationWarning
      >
        {/* Dynamic page background */}
        <PageBackgroundInitializer />

        {/* Google Translate external script */}
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />

        {/* Google Translate initializer */}
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            window.googleTranslateElementInit = function () {
              try {
                if (
                  window.google &&
                  window.google.translate &&
                  document.getElementById("google_translate_element")
                ) {
                  new window.google.translate.TranslateElement(
                    {
                      pageLanguage: "en",
                      includedLanguages: "en,bn",
                      layout:
                        window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                      autoDisplay: false
                    },
                    "google_translate_element"
                  );
                }
              } catch (error) {
                console.error(
                  "Google Translate initialization failed:",
                  error
                );
              }
            };
          `}
        </Script>

        {/* Remove Google Translate banner */}
        <Script id="google-translate-cleanup" strategy="afterInteractive">
          {`
            (function () {
              try {
                const observer = new MutationObserver(function () {
                  const frame =
                    document.querySelector(".goog-te-banner-frame");

                  if (frame) {
                    frame.remove();
                  }

                  if (document.body) {
                    document.body.style.top = "0px";
                  }

                  const gadget =
                    document.querySelector(".goog-te-gadget");

                  if (gadget) {
                    gadget.style.fontSize = "0";
                  }
                });

                observer.observe(document.documentElement, {
                  childList: true,
                  subtree: true
                });

                window.addEventListener("beforeunload", function () {
                  observer.disconnect();
                });
              } catch (error) {
                console.error(
                  "Google Translate cleanup failed:",
                  error
                );
              }
            })();
          `}
        </Script>

        {/* Hidden Google Translate target */}
        <div id="google_translate_element" style={{ display: "none" }} />

        {/* Main Navbar */}
        <Navbar />

        {/* Page Content */}
        {children}
      </body>
    </html>
  );
}
