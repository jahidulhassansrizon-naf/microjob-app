// app/dashboard/page.tsx
"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  X,
  CreditCard,
  UserCheck,
  GraduationCap,
  Calculator,
  BookOpen,
  FileText,
  MapPin,
  Wand2,
  Scan,
  Image as ImageIcon,
  Crop,
  FileImage,
  AlignLeft,
  Minimize2,
  Combine,
  FileCode,
  Lock,
  Edit3,
  Languages,
  Keyboard,
  FileUser,
} from "lucide-react";
import DashboardNavbar from "./_components/DashboardNavbar";
import DashboardFooter from "./_components/DashboardFooter";

type DashboardTool = {
  name: string;
  slug: string;
  bgColor: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  badge?: "New" | "Hot";
};

const dashboardTools: DashboardTool[] = [
  {
    name: "NID Joiner",
    slug: "nid-joiner",
    bgColor: "bg-[#22c55e]",
    icon: CreditCard,
    badge: "Hot",
  },
  {
    name: "Govt Job Photo & Sign Resizer",
    slug: "govt-job-photo-sign-resizer",
    bgColor: "bg-[#7c3aed]",
    icon: UserCheck,
  },
  {
    name: "Education Board Result",
    slug: "education-board-result",
    bgColor: "bg-[#10ca7e]",
    icon: GraduationCap,
  },
  {
    name: "National University Result",
    slug: "national-university-result",
    bgColor: "bg-[#06b6d4]",
    icon: GraduationCap,
  },
  {
    name: "Age Calculator",
    slug: "age-calculator",
    bgColor: "bg-[#db2777]",
    icon: Calculator,
  },
  {
    name: "Passport to PDF",
    slug: "passport-to-pdf",
    bgColor: "bg-[#10b981]",
    icon: BookOpen,
    badge: "Hot",
  },
  {
    name: "Voter Migration Form",
    slug: "voter-migration-form",
    bgColor: "bg-[#4f46e5]",
    icon: FileText,
    badge: "New",
  },
  {
    name: "Family Card Form",
    slug: "family-card-form",
    bgColor: "bg-[#2563eb]",
    icon: CreditCard,
  },
  {
    name: "Allowance Application Tracking",
    slug: "allowance-application-tracking",
    bgColor: "bg-[#7c3aed]",
    icon: MapPin,
    badge: "New",
  },
  {
    name: "Remove Background",
    slug: "remove-background",
    bgColor: "bg-[#16a34a]",
    icon: Wand2,
    badge: "Hot",
  },
  {
    name: "Document Scanner",
    slug: "document-scanner",
    bgColor: "bg-[#84cc16]",
    icon: Scan,
    badge: "New",
  },
  {
    name: "Image Size Reducer",
    slug: "image-size-reducer",
    bgColor: "bg-[#4ade80]",
    icon: ImageIcon,
    badge: "New",
  },
  {
    name: "Crop Image",
    slug: "crop-image",
    bgColor: "bg-[#0369a1]",
    icon: Crop,
  },
  {
    name: "Images to PDF",
    slug: "images-to-pdf",
    bgColor: "bg-[#2563eb]",
    icon: FileImage,
  },
  {
    name: "Image Convert",
    slug: "image-convert",
    bgColor: "bg-[#a855f7]",
    icon: ImageIcon,
    badge: "Hot",
  },
  {
    name: "Image to Text",
    slug: "image-to-text",
    bgColor: "bg-[#14b8a6]",
    icon: AlignLeft,
    badge: "New",
  },
  {
    name: "Compress PDF",
    slug: "compress-pdf",
    bgColor: "bg-[#1cc2e6]",
    icon: Minimize2,
    badge: "Hot",
  },
  {
    name: "Merge PDFs",
    slug: "merge-pdfs",
    bgColor: "bg-[#0eb2ed]",
    icon: Combine,
    badge: "Hot",
  },
  {
    name: "Split PDF",
    slug: "split-pdf",
    bgColor: "bg-[#2563eb]",
    icon: FileCode,
  },
  {
    name: "Lock / Unlock PDF",
    slug: "lock-unlock-pdf",
    bgColor: "bg-[#4338ca]",
    icon: Lock,
  },
  {
    name: "PDF to Image",
    slug: "pdf-to-image",
    bgColor: "bg-[#3b82f6]",
    icon: FileImage,
  },
  {
    name: "Edit PDF",
    slug: "edit-pdf",
    bgColor: "bg-[#ea580c]",
    icon: Edit3,
    badge: "New",
  },
  {
    name: "Bijoy - Unicode",
    slug: "bijoy-unicode",
    bgColor: "bg-[#a3e635]",
    icon: Languages,
  },
  {
    name: "Banglish Typing",
    slug: "banglish-typing",
    bgColor: "bg-[#84cc16]",
    icon: Keyboard,
  },
  {
    name: "ATS Friendly CV Maker",
    slug: "ats-friendly-cv-maker",
    bgColor: "bg-[#2563eb]",
    icon: FileUser,
  },
];

function RealSohojToolsGrid() {
  const groups = [
    {
      title: "Online Application & Result",
      items: dashboardTools.slice(0, 9),
    },
    {
      title: "Image & Scan Editing",
      items: dashboardTools.slice(9, 16),
    },
    {
      title: "PDF Processing",
      items: dashboardTools.slice(16, 22),
    },
    {
      title: "Typing & CV Tools",
      items: dashboardTools.slice(22),
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Sohoj Tools
        </h2>

        <Link
          href="/sohoj-tools"
          className="text-sm font-semibold text-gray-600 transition hover:text-[#FF5D00]"
        >
          View all →
        </Link>
      </div>

      <div className="mt-6 space-y-8">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-4 text-sm font-semibold text-gray-700">
              {group.title}
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {group.items.map((tool) => {
                const Icon = tool.icon;

                return (
                  <Link
                    key={tool.slug}
                    href={`/sohoj-tools/${tool.slug}`}
                    className="group flex min-w-0 flex-col items-center text-center rounded-xl px-2 py-2 transition hover:bg-white"
                    aria-label={tool.name}
                  >
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-[18px] text-white shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5 sm:h-[72px] sm:w-[72px] ${tool.bgColor}`}
                    >
                      <Icon size={31} strokeWidth={1.9} />
                    </div>

                    <span className="mt-2.5 max-w-[155px] text-xs font-semibold leading-snug text-gray-800 transition group-hover:text-[#FF5D00] sm:text-sm">
                      {tool.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("User");

  useEffect(() => {
    // Helper function: Cookie থেকে টোকেন বের করার জন্য
    const getCookie = (name: string) => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };

    const tokenLocal = localStorage.getItem("token");
    const tokenCookie = getCookie("token");

    // LocalStorage অথবা Cookie যেকোনো একটিতে টোকেন থাকলেই লগইন পারমিশন পাবে
    const activeToken = tokenLocal || tokenCookie;

    if (!activeToken) {
      // টোকেন না থাকলে সরাসরি /login পেজে পাঠাবে
      router.replace("/login");
    } else {
      // Cookie তে টোকেন আছে কিন্তু LocalStorage এ মুছে গিয়ে থাকলে সিঙ্ক করে নেওয়া
      if (tokenCookie && !tokenLocal) {
        localStorage.setItem("token", tokenCookie);
      }

      // ইউজারের নাম লোকালস্টোরেজ থেকে ফেচ করা
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userObj = JSON.parse(userStr);
          if (userObj.fullName) {
            setUserName(userObj.fullName);
          }
        }
      } catch (e) {
        // ignore
      }

      // চেক করা ইউজার এইমাত্র লগইন করে এসেছে কি না
      const justLoggedIn = sessionStorage.getItem("justLoggedIn");
      if (justLoggedIn === "true") {
        sessionStorage.removeItem("justLoggedIn");
        setShowLoginSuccess(true);

        // ১.৫ সেকেন্ড পপআপ দেখানোর পর ড্যাশবোর্ড কন্টেন্ট স্মুথলি ওপেন হবে
        const timer = setTimeout(() => {
          setShowLoginSuccess(false);
          setIsAuthenticated(true);
        }, 1600);

        return () => clearTimeout(timer);
      } else {
        // সাধারণ রিফ্রেশ বা সরাসরি ভিজিট হলে পপআপ দেখানোর প্রয়োজন নেই
        setIsAuthenticated(true);
      }
    }
  }, [router]);

  // অথেন্টিকেশন চেক না হওয়া পর্যন্ত বা সাকসেস পপআপ চলাকালীন লোডিং/পপআপ স্টেট
  if (!isAuthenticated && !showLoginSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center font-sans">
        <p className="text-gray-500 font-medium">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans flex flex-col justify-between relative">
      <div>
        <DashboardNavbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12">
          <RealSohojToolsGrid />
        </main>
      </div>

      {/* Dashboard Footer */}
      <DashboardFooter />

      {/* 🟢 Login Success Modal with Close Option & Cleaned up UI */}
      {showLoginSuccess && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden transform animate-in zoom-in-95 duration-300 border border-orange-100">
            {/* Background Glow Effect */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-200 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-200 rounded-full blur-2xl opacity-50 pointer-events-none"></div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowLoginSuccess(false);
                setIsAuthenticated(true);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer z-10"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Success Icon with Bounce Animation */}
            <div className="relative w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-5 text-[#FF5D00] shadow-inner">
              <CheckCircle2 size={48} className="animate-bounce" />
            </div>

            {/* Welcome Heading (Emojis and Subtitle Removed) */}
            <h3 className="text-xl font-black text-gray-900 mb-1">
              Login Successful!
            </h3>
            <p className="text-xs font-bold text-[#FF5D00] mb-6">
              Welcome back, {userName}!
            </p>

            {/* Loading Bar Progress Animation */}
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden p-0.5">
              <div className="bg-gradient-to-r from-amber-500 to-[#FF5D00] h-full rounded-full animate-pulse w-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
