"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import DashboardNavbar from "./_components/DashboardNavbar";
import DashboardFooter from "./_components/DashboardFooter";

function ComingSoonSection() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center relative overflow-hidden py-16">
      <div className="transform -rotate-12 select-none p-6 sm:p-10 border-4 border-dashed border-[#2563EB]/30 rounded-3xl bg-white/60 backdrop-blur-sm shadow-xl">
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-[#2563EB] tracking-wider uppercase text-center drop-shadow-md">
          Coming Soon
        </h1>
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
    const getCookie = (name: string) => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };

    const tokenLocal = localStorage.getItem("token");
    const tokenCookie = getCookie("token");

    const activeToken = tokenLocal || tokenCookie;

    if (!activeToken) {
      router.replace("/login");
    } else {
      if (tokenCookie && !tokenLocal) {
        localStorage.setItem("token", tokenCookie);
      }

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

      const justLoggedIn = sessionStorage.getItem("justLoggedIn");
      if (justLoggedIn === "true") {
        sessionStorage.removeItem("justLoggedIn");
        setShowLoginSuccess(true);

        const timer = setTimeout(() => {
          setShowLoginSuccess(false);
          setIsAuthenticated(true);
        }, 1600);

        return () => clearTimeout(timer);
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [router]);

  if (!isAuthenticated && !showLoginSuccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans">
        <p className="text-[#0F172A]/70 font-medium">
          Checking authentication...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased flex flex-col justify-between relative">
      <div>
        <DashboardNavbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12">
          <ComingSoonSection />
        </main>
      </div>

      <DashboardFooter />

      {showLoginSuccess && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden transform animate-in zoom-in-95 duration-300 border border-[#E2E8F0]">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#2563EB]/20 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#10B981]/20 rounded-full blur-2xl opacity-50 pointer-events-none"></div>

            {/* আপডেট করা লাল রঙের ক্লোজ বাটন */}
            <button
              type="button"
              onClick={() => {
                setShowLoginSuccess(false);
                setIsAuthenticated(true);
              }}
              className="absolute top-4 right-4 text-red-500 hover:text-red-600 p-1.5 rounded-full bg-red-50 hover:bg-red-100 transition-all cursor-pointer z-10"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="relative w-20 h-20 bg-[#2563EB]/10 rounded-full flex items-center justify-center mx-auto mb-5 text-[#2563EB] shadow-inner">
              <CheckCircle2 size={48} className="animate-bounce" />
            </div>

            <h3 className="text-xl font-black text-[#0F172A] mb-1">
              Login Successful!
            </h3>
            <p className="text-xs font-bold text-[#2563EB] mb-6">
              Welcome back, {userName}!
            </p>

            <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden p-0.5">
              <div className="bg-gradient-to-r from-[#2563EB] to-[#10B981] h-full rounded-full animate-pulse w-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
