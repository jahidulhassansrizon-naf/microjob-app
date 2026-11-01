import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";

/**
 * Instant placeholder for the AI Editor page.
 * Shown the moment the menu is clicked (loading.tsx) and while the page's first data is
 * being prepared, so the user always sees the real page layout at once instead of a blank
 * screen. It has no state and no data fetching, so it is safe to render anywhere.
 */
function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#E3D6B8] ${className}`} />;
}

export default function AiEditorSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading AI Editor"
      className="min-h-screen xl:h-[100dvh] xl:min-h-0 xl:overflow-hidden bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] flex flex-col relative select-none"
    >
      <DashboardNavbar />
      <div className="flex-1 flex flex-col items-center p-2 sm:p-4 xl:min-h-0 xl:overflow-hidden xl:px-4 xl:py-3">
        <div className="flex flex-col xl:flex-row w-full max-w-[1400px] xl:max-w-none gap-4 items-center xl:items-stretch xl:flex-1 xl:min-h-0">
          {/* Generation settings */}
          <div className="w-full xl:w-[340px] xl:shrink-0 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-sm space-y-3">
            <Block className="h-6 w-40" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Block key={i} className="h-12" />
              ))}
            </div>
            <Block className="h-5 w-32" />
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Block key={i} className="aspect-square rounded-full" />
              ))}
            </div>
            <Block className="h-24 w-full" />
            <Block className="h-11 w-full" />
          </div>

          {/* Photo preview */}
          <div className="w-full xl:flex-1 min-w-0 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-sm flex flex-col items-center justify-center gap-4 min-h-[320px]">
            <Block className="h-40 w-40 sm:h-56 sm:w-56 rounded-3xl" />
            <Block className="h-5 w-56" />
            <Block className="h-11 w-44" />
          </div>

          {/* QR sidebar */}
          <div className="w-full xl:w-[260px] xl:shrink-0 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-sm space-y-3">
            <Block className="h-5 w-32" />
            <Block className="aspect-square w-full" />
            <Block className="h-4 w-40" />
          </div>
        </div>

        {/* Recent generations strip */}
        <div className="mt-3 w-full flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <Block key={i} className="h-24 w-20 shrink-0" />
          ))}
        </div>
      </div>
    </div>
  );
}
