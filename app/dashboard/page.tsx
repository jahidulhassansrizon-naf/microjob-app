"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Heart, X } from "lucide-react";
import DashboardNavbar from "./_components/DashboardNavbar";
import {
  toolsData,
  ToolTile,
  type ToolItem,
} from "@/app/_components/toolsData";

// হোমে প্রথম কয়টা টুল দেখাবে (সব দেখাতে চাইলে toolsData.length দাও)
const HOME_TOOLS_COUNT = 12;

function PopularToolsSection() {
  const homeTools = toolsData.slice(0, HOME_TOOLS_COUNT);

  return (
    <section className="space-y-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Popular Tools</h2>
          <p className="text-xs text-gray-400 font-medium">
            Free tools to speed up your daily work.
          </p>
        </div>
        <Link
          href="/sohoj-tools"
          className="text-xs font-bold text-[#2563EB] hover:underline whitespace-nowrap"
        >
          View all {toolsData.length} tools →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-7 pt-3">
        {homeTools.map((tool, index) =>
          index < 6 ? (
            <ToolTile key={tool.id} tool={tool} />
          ) : (
            <div key={tool.id} className="w-full flex justify-center">
              <div className="w-full scale-[0.82] origin-top transition-transform duration-200">
                <ToolTile tool={tool} />
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

// ফুটারের নিচের ক্রেডিট লাইনে যে নাম দেখাবে
const CREATOR_NAME = "Jahidul Hassan";

function WelcomeBanner({ userName }: { userName: string }) {
  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour < 12
      ? "Good morning"
      : hour >= 12 && hour < 17
        ? "Good afternoon"
        : hour >= 17 && hour < 21
          ? "Good evening"
          : "Good night";
  const firstName = userName.trim().split(" ")[0] || "there";

  // ব্যানারের ডানে সাজানো তিনটা টুল টাইল (একই আইকন, একই রঙ)
  const showcase = ["Nid Joiner", "Compress PDF", "Image Upscaler"]
    .map((name) => toolsData.find((t) => t.name === name))
    .filter((t): t is ToolItem => Boolean(t));
  const tilt = ["-rotate-6", "rotate-3", "-rotate-3"];
  const lift = ["translate-y-3", "-translate-y-3", "translate-y-2"];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#2563EB] text-white px-6 sm:px-10 py-10 sm:py-12 mt-12 shadow-lg shadow-[#2563EB]/20">
      <div className="absolute -top-20 -right-10 w-72 h-72 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-[#1D4ED8]/60 pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="max-w-xl text-center md:text-left">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFC94D]">
            {greeting}
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black leading-tight">
            Welcome back, {firstName}!
          </h2>
          <p className="mt-3 text-sm sm:text-base font-medium leading-relaxed text-white/85">
            NID, PDF, ছবি, ভিডিও — আপনার দৈনন্দিন ডিজিটাল কাজগুলো এখন এক
            জায়গায়। যে টুলটা দরকার বেছে নিন, কাজ শেষ হবে মিনিটেই।
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-3">
            <Link
              href="/sohoj-tools"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-[#2563EB] hover:bg-blue-50 transition-colors"
            >
              Explore all tools
              <ArrowRight size={14} />
            </Link>
            <span className="text-xs font-semibold text-white/80">
              {toolsData.length} free tools · no installation
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 shrink-0">
          {showcase.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className={`w-24 h-24 lg:w-28 lg:h-28 rounded-[26px] ${tool.bgColor} flex items-center justify-center shadow-xl shadow-black/15 ring-4 ring-white/20 ${tilt[i % 3]} ${lift[i % 3]}`}
              >
                {Icon && <Icon size={46} className="text-[#ffffff]" />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CreditLine() {
  return (
    <div
      className="border-t border-slate-200/70 py-3 text-center text-xs font-medium text-slate-500"
      style={{
        fontFamily:
          '"Trebuchet MS", "Noto Sans Bengali", "Segoe UI", sans-serif',
      }}
    >
      <span className="font-semibold text-slate-600">সৃজন</span>
      <span className="mx-1.5 text-slate-300">·</span>
      Crafted with{" "}
      <Heart
        size={12}
        className="inline -mt-0.5 text-red-500 fill-red-500"
        aria-label="love"
      />{" "}
      by <span className="font-bold text-[#2563EB]">{CREATOR_NAME}</span>
      <span className="mx-1.5 text-slate-300">·</span>
      Inspired by{" "}
      <span className="font-semibold text-slate-600">Robiul Karim Robi</span>
    </div>
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
          <PopularToolsSection />
          <WelcomeBanner userName={userName} />
        </main>
      </div>

      <div>
        <CreditLine />
      </div>

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
