"use client";

import { T } from "../../i18n";
import type { QuestionManager } from "../../hooks/useQuestionManager";
import AutoCreatePanel from "./AutoCreatePanel";
import QuestionFilters from "./QuestionFilters";
import { ListFilter, Shuffle, Sparkles, X } from "lucide-react";

export default function CanvasSidebar({
  manager,
  demoMode,
  onExitDemo,
}: {
  manager: QuestionManager;
  demoMode: boolean;
  onExitDemo: () => void;
}) {
  const { selectedTab, setSelectedTab } = manager;

  return (
    <aside className="screen-only page-font flex min-w-0 w-full shrink-0 flex-col gap-3">
      <section className="overflow-visible rounded-2xl border border-[#E7DCC7] bg-[#FCF8EF] shadow-[0_3px_14px_rgba(76,57,28,0.05)]">
        <div className="border-b border-[#EEE4D2] px-3.5 pb-3 pt-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FCE9E6] text-[#D42020]">
              <ListFilter size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-extrabold text-[#342B1E]">
                <T>Find questions</T>
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#80715A]">
                <T>Choose a source and filter the questions.</T>
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-[#F1E9DA] p-1">
            <button
              type="button"
              onClick={() => setSelectedTab("browse")}
              aria-pressed={selectedTab === "browse"}
              className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[12px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/30 active:scale-[0.99] ${
                selectedTab === "browse"
                  ? "bg-white text-[#B91C1C] shadow-sm ring-1 ring-[#E9D8D2]"
                  : "text-[#73644C] hover:bg-white/60 hover:text-[#342B1E]"
              }`}
            >
              <ListFilter size={13} />
              <T>Browse &amp; pick</T>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab("auto")}
              aria-pressed={selectedTab === "auto"}
              className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[12px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/30 active:scale-[0.99] ${
                selectedTab === "auto"
                  ? "bg-white text-[#B91C1C] shadow-sm ring-1 ring-[#E9D8D2]"
                  : "text-[#73644C] hover:bg-white/60 hover:text-[#342B1E]"
              }`}
            >
              <Shuffle size={13} />
              <T>Auto create</T>
            </button>
          </div>
        </div>

        <div className="space-y-3 p-3">
          {selectedTab === "browse" ? (
            <QuestionFilters manager={manager} onExitDemo={onExitDemo} />
          ) : (
            <AutoCreatePanel manager={manager} onExitDemo={onExitDemo} />
          )}
        </div>
      </section>

      {demoMode ? (
        <div className="flex items-start gap-2 rounded-xl border border-[#EFD6A6] bg-[#FFF8E7] px-3 py-2.5 text-[12px] leading-5 text-[#80602B] shadow-[0_2px_8px_rgba(128,96,43,0.05)]">
          <Sparkles size={15} className="mt-0.5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block font-bold"><T>Demo preview is active</T></span>
            <span className="mt-0.5 block"><T>Close the demo to return to your own question paper.</T></span>
          </span>
          <button
            type="button"
            onClick={onExitDemo}
            aria-label="Close demo"
            title="Close demo"
            className="-mr-1 -mt-1 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[#E9D2A5] bg-white/80 px-2 text-[11px] font-extrabold text-[#765522] transition hover:border-[#D42020]/40 hover:bg-white hover:text-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25 active:scale-[0.98]"
          >
            <X size={13} />
            <T>Close demo</T>
          </button>
        </div>
      ) : null}
    </aside>
  );
}
