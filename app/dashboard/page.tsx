// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "./_components/DashboardNavbar";
import ToolGrid from "./_components/ToolGrid";
import LatestJobs from "./_components/LatestJobs";
import DashboardSummary from "./_components/DashboardSummary";
import DashboardFooter from "./_components/DashboardFooter";

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

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
      setIsAuthenticated(true);
    }
  }, [router]);

  // অথেন্টিকেশন চেক না হওয়া পর্যন্ত লোডিং দেখাবে
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center font-sans">
        <p className="text-gray-500 font-medium">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans flex flex-col justify-between">
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
    </div>
  );
}
