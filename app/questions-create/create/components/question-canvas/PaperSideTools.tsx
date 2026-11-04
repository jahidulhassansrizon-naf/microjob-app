"use client";

import { T } from "../../i18n";
import type { QuestionManager } from "../../hooks/useQuestionManager";
import { GripVertical, Move, SquareDashedMousePointer } from "lucide-react";

/**
 * Screen-only paper tools that used to sit above the paper preview.
 * They now live in the right column so the paper stays centered on its own.
 * Behaviour is unchanged; the same manager state/handlers are used.
 */
export default function PaperSideTools({ manager }: { manager: QuestionManager }) {
  const {
    pageSize,
    selectedQuestions,
    jointLayoutMode,
    regionSelectMode,
    setRegionSelectMode,
    overflowJointPages,
    handleAutoBalanceJoint,
    addJointPage,
    removeLastJointPage,
    jointPageCount,
  } = manager;

  return (
    <div className="screen-only page-font flex min-w-0 flex-col gap-3">
      <section className="rounded-xl border border-[#E7DCC7] bg-[#FCF8EF] p-3.5 shadow-sm">
        <div className="flex items-start gap-2.5">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              regionSelectMode ? "bg-[#FCE9E6] text-[#DC2626]" : "bg-[#F1E9DA] text-[#6B5A40]"
            }`}
          >
            <SquareDashedMousePointer size={16} />
          </span>
          <p className="min-w-0 flex-1 text-[12px] font-semibold leading-5 text-[#3B2F1E]">
            {regionSelectMode ? (
              <T>{"Drag anywhere on the paper to mark a custom text region"}</T>
            ) : (
              <T>{"Add a custom text area to your question paper (optional)"}</T>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRegionSelectMode(!regionSelectMode)}
          className={`mt-3 w-full rounded-lg border px-3 py-2 text-[12px] font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30 active:scale-[0.98] ${
            regionSelectMode
              ? "border-[#D42020] bg-[#FFF1EF] text-[#B91C1C]"
              : "border-[#E7DCC7] bg-white text-[#51442F] hover:bg-[#F8F0E1]"
          }`}
        >
          {regionSelectMode ? <T>{"Cancel area"}</T> : <T>{"Select area"}</T>}
        </button>

        {selectedQuestions.length ? (
          <div className="mt-3 flex items-start gap-2 border-t border-[#E9DFCE] pt-3 text-[11px] font-medium leading-4 text-[#6B5A40]">
            <GripVertical size={14} className="mt-0.5 shrink-0" />
            <span className="min-w-0">
              {regionSelectMode ? (
                <T>{"Drag across any page area to create a custom inline text box"}</T>
              ) : (
                <T>{"Drag questions to reorder them within a section or move them between pages"}</T>
              )}
            </span>
          </div>
        ) : null}
      </section>

      {pageSize === "Joint" ? (
        <section className="rounded-xl border border-[#E7DCC7] bg-[#FCF8EF] p-3.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Move size={16} className="text-[#DC2626]" />
            <span className="text-[13px] font-semibold text-[#3B2F1E]">
              {jointLayoutMode === "manual" ? (
                <T>{"Manual page distribution"}</T>
              ) : (
                <T>{"Auto-balanced distribution"}</T>
              )}
            </span>
            {overflowJointPages.length ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[12px] font-bold text-red-500">
                <T>{"Overflow:"}</T>
                <T>{" "}</T>
                {overflowJointPages.map((page) => page + 1).join(", ")}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleAutoBalanceJoint}
              className="rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-1.5 text-[13px] font-bold text-[#3B2F1E] transition duration-150 hover:border-[#DC2626] hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]"
            >
              <T>{"Auto balance"}</T>
            </button>
            <button
              type="button"
              onClick={addJointPage}
              className="rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-1.5 text-[13px] font-bold text-[#3B2F1E] transition duration-150 hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]"
            >
              <T>{"+ Page"}</T>
            </button>
            <button
              type="button"
              onClick={removeLastJointPage}
              disabled={jointPageCount <= 2}
              className="rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-1.5 text-[13px] font-bold text-[#3B2F1E] transition duration-150 hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <T>{"\u2212 Page"}</T>
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
