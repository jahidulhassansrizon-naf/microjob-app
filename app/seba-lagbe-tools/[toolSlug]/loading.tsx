import NavigationProgressHold from "@/app/_components/NavigationProgressHold";
import DashboardNavbar from "../../dashboard/_components/DashboardNavbar";

// Shown the moment a tool is clicked, while the server checks login and access.
// Uses the same warm sand colours as the tools pages, so no white flash appears.
export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] text-[#3B2F1E] font-sans">
      <NavigationProgressHold />
      <DashboardNavbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <section
          aria-busy="true"
          aria-label="Loading tool"
          className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-5 shadow-sm sm:p-7"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-56 animate-pulse rounded-lg bg-[#E3D6B8]" />
              <div className="h-4 w-80 max-w-full animate-pulse rounded bg-[#F3E9D2]" />
            </div>
            <div className="h-10 w-24 animate-pulse rounded-xl bg-[#F3E9D2]" />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="h-12 animate-pulse rounded-xl bg-[#F3E9D2]" />
            <div className="h-12 animate-pulse rounded-xl bg-[#F3E9D2]" />
            <div className="h-32 animate-pulse rounded-2xl bg-[#F3E9D2] sm:col-span-2" />
            <div className="h-12 animate-pulse rounded-xl bg-[#F3E9D2]" />
            <div className="h-12 animate-pulse rounded-xl bg-[#F3E9D2]" />
          </div>
        </section>
      </main>
    </div>
  );
}
