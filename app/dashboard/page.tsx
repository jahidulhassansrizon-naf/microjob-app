"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, Heart, X } from "lucide-react";
import DashboardNavbar from "./_components/DashboardNavbar";
import { getClientSession } from "@/lib/clientAuth";
import {
  toolsData,
  ToolTile,
  type ToolItem,
} from "@/app/_components/toolsData";

// হোমে প্রথম কয়টা টুল দেখাবে (সব দেখাতে চাইলে toolsData.length দাও)
const HOME_TOOLS_COUNT = 12;

/* ------------------------------------------------------------------ */
/* Popular tools                                                       */
/* ------------------------------------------------------------------ */

function PopularToolsSection() {
  const homeTools = toolsData.slice(0, HOME_TOOLS_COUNT);

  return (
    <section className="py-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#0F172A] sm:text-2xl">
            Popular Tools
          </h2>
          <p className="mt-1 text-[13px] font-medium text-slate-500">
            Free tools to speed up your daily work.
          </p>
        </div>

        <Link
          href="/sohoj-tools"
          className="group inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1D4ED8] shadow-sm outline-none transition-colors hover:border-blue-200 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
        >
          View all
          <span className="hidden sm:inline">{toolsData.length} tools</span>
          <ArrowRight
            size={13}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {homeTools.map((tool) => (
          <ToolTile key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Welcome banner                                                      */
/* ------------------------------------------------------------------ */

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

  // ব্যানারের ডানে সাজানো তিনটা টুল কার্ড (একই আইকন, একই রঙ)
  const showcase = ["Nid Joiner", "Compress PDF", "Image Upscaler"]
    .map((name) => toolsData.find((t) => t.name === name))
    .filter((t): t is ToolItem => Boolean(t));
  const stagger = ["translate-y-4", "-translate-y-3", "translate-y-6"];

  return (
    <section
      className="relative isolate mt-14 overflow-hidden rounded-3xl border border-white/10 px-6 py-10 text-white shadow-[0_24px_60px_-24px_rgba(37,99,235,0.6)] sm:px-10 sm:py-12 lg:px-14"
      style={{
        // Website-এর brand নীল (#2563EB) থেকে সামান্য গাঢ় নীল পর্যন্ত
        backgroundImage:
          "linear-gradient(135deg, #2563EB 0%, #2563EB 45%, #1D4ED8 100%)",
      }}
    >
      {/* হালকা বিন্দুর জাল */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "linear-gradient(to right, black, transparent 75%)",
          WebkitMaskImage: "linear-gradient(to right, black, transparent 75%)",
        }}
      />
      {/* নরম আলোর আভা */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-white/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-1/4 -z-10 h-72 w-72 rounded-full bg-[#1E3A8A]/40 blur-3xl"
      />

      <div className="relative flex flex-col items-center justify-between gap-10 md:flex-row">
        <div className="max-w-xl text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            {greeting}
          </span>

          <h2 className="mt-4 text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl">
            Welcome back, {firstName}!
          </h2>

          <p className="mt-4 text-sm font-medium leading-7 text-blue-50/90 sm:text-[15px]">
            NID, PDF, ছবি, ভিডিও — আপনার দৈনন্দিন ডিজিটাল কাজগুলো এখন এক
            জায়গায়। যে টুলটা দরকার বেছে নিন, কাজ শেষ হবে মিনিটেই।
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Link
              href="/sohoj-tools"
              className="group inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-semibold text-[#2563EB] shadow-sm outline-none transition-colors hover:bg-blue-50 focus-visible:ring-4 focus-visible:ring-white/30"
            >
              Explore all tools
              <ArrowRight
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="/my-files"
              className="inline-flex cursor-pointer items-center rounded-xl border border-white/30 px-5 py-2.5 text-[13px] font-semibold text-white outline-none transition-colors hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-white/30"
            >
              My Files
            </Link>
          </div>

          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-blue-50/90 md:justify-start">
            <li className="flex items-center gap-1.5">
              <Check size={13} strokeWidth={3} className="text-emerald-300" />
              {toolsData.length} free tools
            </li>
            <li className="flex items-center gap-1.5">
              <Check size={13} strokeWidth={3} className="text-emerald-300" />
              No installation
            </li>
          </ul>
        </div>

        {/* ডানের টুল কার্ড (শুধু সাজানোর জন্য) */}
        <div
          aria-hidden="true"
          className="hidden shrink-0 items-center gap-4 md:flex"
        >
          {showcase.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className={`w-28 rounded-2xl border border-white/20 bg-white/10 p-2.5 shadow-xl shadow-[#1E3A8A]/30 backdrop-blur-sm lg:w-32 ${stagger[i % 3]}`}
              >
                <div
                  className={`flex aspect-square items-center justify-center rounded-xl ${tool.bgColor}`}
                >
                  {Icon && <Icon size={38} className="text-white" />}
                </div>
                <p className="mt-2 truncate text-center text-[11px] font-semibold text-white/95">
                  {tool.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer credit                                                       */
/* ------------------------------------------------------------------ */

function CreditLine() {
  return (
    <div
      className="border-t border-slate-200/70 py-4 text-center text-xs font-medium text-slate-600"
      style={{
        fontFamily:
          '"Trebuchet MS", "Noto Sans Bengali", "Segoe UI", sans-serif',
      }}
    >
      <span className="font-semibold text-slate-700">srizon</span>
      <span className="mx-1.5 text-slate-300">·</span>
      Crafted with{" "}
      <Heart
        size={12}
        className="-mt-0.5 inline fill-red-500 text-red-500"
        aria-label="love"
      />{" "}
      by <span className="font-bold text-[#2563EB]">{CREATOR_NAME}</span>
      <span className="mx-1.5 text-slate-300">·</span>
      Inspired by{" "}
      <span className="font-semibold text-slate-700">Robiul Karim Robi</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Login success progress bar                                          */
/* ------------------------------------------------------------------ */

// ১.৬ সেকেন্ডে ধীরে ধীরে ভরে ওঠে (modal বন্ধ হওয়ার সময়ের সাথে মিলিয়ে)
function LoginProgress() {
  const [go, setGo] = useState<boolean>(false);

  useEffect(() => {
    const id = setTimeout(() => setGo(true), 30);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-[#2563EB] transition-[width] ease-out"
        style={{ width: go ? "100%" : "0%", transitionDuration: "1500ms" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("User");

  useEffect(() => {
    let mounted = true;
    let successTimer: ReturnType<typeof setTimeout> | null = null;

    const loadCachedUser = () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const userObj = JSON.parse(userStr);
        if (userObj?.fullName && mounted) setUserName(userObj.fullName);
      } catch {
        // Cached user data is optional.
      }
    };

    const handleLoginSuccess = () => {
      try {
        if (sessionStorage.getItem("justLoggedIn") !== "true") return;
        sessionStorage.removeItem("justLoggedIn");
        if (!mounted) return;

        setShowLoginSuccess(true);
        successTimer = setTimeout(() => {
          if (!mounted) return;
          setShowLoginSuccess(false);
        }, 1600);
      } catch {
        // Session storage is optional.
      }
    };

    void getClientSession().then((session) => {
      if (!mounted) return;

      if (!session.authenticated) {
        router.replace("/login?callbackUrl=%2Fdashboard");
        return;
      }

      if (session.user?.fullName) {
        setUserName(session.user.fullName);
      } else {
        loadCachedUser();
      }

      setIsAuthenticated(true);
      handleLoginSuccess();
    });

    return () => {
      mounted = false;
      if (successTimer) clearTimeout(successTimer);
    };
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563EB] border-t-transparent"></div>
          <p className="text-xs font-semibold text-slate-600">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-[#F8FAFC] font-sans antialiased">
      <div>
        <DashboardNavbar />

        <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6">
          <PopularToolsSection />
          <WelcomeBanner userName={userName} />
        </main>
      </div>

      <div>
        <CreditLine />
      </div>

      {showLoginSuccess && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-success-title"
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)] animate-in zoom-in-95 duration-300"
          >
            {/* লাল রঙের ক্লোজ বাটন */}
            <button
              type="button"
              onClick={() => {
                setShowLoginSuccess(false);
                setIsAuthenticated(true);
              }}
              className="absolute right-4 top-4 z-10 cursor-pointer rounded-full bg-red-50 p-1.5 text-red-500 transition-colors hover:bg-red-100 hover:text-red-600"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
              <CheckCircle2
                size={34}
                strokeWidth={2}
                className="animate-in zoom-in-50 duration-500"
              />
            </div>

            <h3
              id="login-success-title"
              className="text-xl font-black tracking-tight text-[#0F172A]"
            >
              Login Successful!
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Welcome back,{" "}
              <span className="font-bold text-[#0F172A]">{userName}</span>!
            </p>

            <LoginProgress />
          </div>
        </div>
      )}
    </div>
  );
}
