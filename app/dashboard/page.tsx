// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import DashboardNavbar from "./_components/DashboardNavbar";
import ToolGrid from "./_components/ToolGrid";
import LatestJobs from "./_components/LatestJobs";
import DashboardSummary from "./_components/DashboardSummary";
import DashboardFooter from "./_components/DashboardFooter";

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
          <ToolGrid />
          <LatestJobs />
          <DashboardSummary />
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
