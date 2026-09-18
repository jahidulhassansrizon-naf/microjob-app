import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Navbar from "@/components/Navbar";
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var path = window.location.pathname;
                  
                  // পেজ অনুযায়ী ব্যাকগ্রাউন্ড কালার ম্যাপ
                  var bgMap = {
                    "/tools": "#FFFBF7",
                    "/pricing": "#FEF4ED",      
                    "/reviews": "#F5ECE5",       
                    "/dorkar-link": "#FCF9F9",   
                  };

                  var bg = "#FAF7FD"; // ডিফল্ট (Home Page) কালার

                  for (var key in bgMap) {
                    if (path.startsWith(key)) {
                      bg = bgMap[key];
                      break;
                    }
                  }

                  document.documentElement.style.backgroundColor = bg;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen text-gray-900 antialiased`}
        suppressHydrationWarning={true}
      >
        {/* গুগল ট্রান্সলেট অফিশিয়াল স্ক্রিপ্ট */}
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,bn',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
              }, 'google_translate_element');
            }

            // গুগল ট্রান্সলেট ব্যানার DOM-এ আসাবামাত্র রিমুভ করার লজিক
            if (typeof window !== 'undefined') {
              const observer = new MutationObserver(function() {
                const frame = document.querySelector('.goog-te-banner-frame');
                if (frame) {
                  frame.remove();
                }
                document.body.style.top = '0px';
              });
              observer.observe(document.documentElement, { childList: true, subtree: true });
            }
          `}
        </Script>

        {/* এই হিডেন ডিভটি ব্যাকগ্রাউন্ডে গুগল ট্রান্সলেটরের কাজ সম্পন্ন করবে */}
        <div id="google_translate_element" style={{ display: "none" }}></div>

        <Navbar />
        {children}
      </body>
    </html>
  );
}
