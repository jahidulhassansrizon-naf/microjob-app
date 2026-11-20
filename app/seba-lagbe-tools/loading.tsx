import NavigationProgressHold from "@/app/_components/NavigationProgressHold";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";

function ToolGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-7 pt-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {Array.from({ length: 16 }).map((_, index) => (
        <div key={index} className="flex flex-col items-center">
          <div className="aspect-square w-full animate-pulse rounded-[28px] bg-[#E3D6B8]" />
          <div className="mt-2.5 h-4 w-24 max-w-full animate-pulse rounded bg-[#E3D6B8]" />
        </div>
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="page-font min-h-screen bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] text-[#3B2F1E] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .page-font.page-font, .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
      `}</style>
      <NavigationProgressHold />
      <DashboardNavbar />

      <main className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6">
        <section
          aria-busy="true"
          aria-label="Loading tools"
          className="space-y-5"
        >
          <div className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-sm">
            <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="h-6 w-24 animate-pulse rounded-lg bg-[#E3D6B8]" />
                <div className="mt-2 h-3 w-60 animate-pulse rounded bg-[#F3E9D2]" />
              </div>
              <div className="h-9 w-40 animate-pulse rounded-xl bg-[#F3E9D2]" />
            </div>

            <div className="border-t border-[#E3D6B8] px-4 py-2.5 sm:px-5">
              <div className="h-10 w-full animate-pulse rounded-xl bg-[#F3E9D2]" />
            </div>

            <div className="border-t border-[#E3D6B8] bg-[#F6EEDB]/70 px-4 py-3 sm:px-5">
              <div className="h-8 w-full animate-pulse rounded-full bg-[#F3E9D2]" />
            </div>
          </div>

          <ToolGridSkeleton />
        </section>
      </main>
    </div>
  );
}
