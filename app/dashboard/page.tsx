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
    // LocalStorage থেকে ইউজার বা টোকেন চেক করা
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!user && !token) {
      // লগইন করা না থাকলে সরাসরি /login পেজে পাঠিয়ে দেবে
      router.replace("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // অথেন্টিকেশন চেক না হওয়া পর্যন্ত ফাঁকা বা লোডিং দেখাবে
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
