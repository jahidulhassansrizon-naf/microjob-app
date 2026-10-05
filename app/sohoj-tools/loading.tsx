import DashboardNavbar from "../dashboard/_components/DashboardNavbar";

function ToolGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-7 pt-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {Array.from({ length: 16 }).map((_, index) => (
        <div key={index} className="flex flex-col items-center">
          <div className="aspect-square w-full animate-pulse rounded-[28px] bg-slate-200" />
          <div className="mt-2.5 h-4 w-24 max-w-full animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      <DashboardNavbar />

      <main className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6">
        <section
          aria-busy="true"
          aria-label="Loading tools"
          className="space-y-5"
        >
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="h-6 w-24 animate-pulse rounded-lg bg-slate-200" />
                <div className="mt-2 h-3 w-60 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-9 w-40 animate-pulse rounded-xl bg-slate-100" />
            </div>

            <div className="border-t border-slate-100 px-4 py-2.5 sm:px-5">
              <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
              <div className="h-8 w-full animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>

          <ToolGridSkeleton />
        </section>
      </main>
    </div>
  );
}
