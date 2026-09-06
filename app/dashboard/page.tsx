// app/dashboard/page.tsx
"use client";

import DashboardNavbar from "./_components/DashboardNavbar";
import ToolGrid from "./_components/ToolGrid";
import LatestJobs from "./_components/LatestJobs";
import DashboardSummary from "./_components/DashboardSummary";
import DashboardFooter from "./_components/DashboardFooter";

export default function DashboardPage() {
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
