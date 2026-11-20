import NavigationProgressHold from "@/app/_components/NavigationProgressHold";
import DashboardNavbar from "../../dashboard/_components/DashboardNavbar";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      <NavigationProgressHold />
      <DashboardNavbar />

      <main className="flex-1 w-full px-4 py-6 sm:px-6">
        <section
          aria-busy="true"
          aria-label="Loading tool"
          className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-56 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100 sm:col-span-2" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </section>
      </main>
    </div>
  );
}
