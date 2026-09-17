import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
                    "/reviews": "#FFFBF7",       
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
        <Navbar />
        {children}
      </body>
    </html>
  );
}
