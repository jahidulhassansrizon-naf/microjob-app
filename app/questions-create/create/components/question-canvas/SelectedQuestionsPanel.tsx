"use client";

import { T } from "../../i18n";
import { CheckCircle2, Trash2 } from "lucide-react";
import type { QuestionManager } from "../../hooks/useQuestionManager";
import type { Question } from "../../types/question";
import { getQuestionTypeLabel } from "../../types/question";

export default function SelectedQuestionsPanel({
  manager,
  displaySelectedQuestions,
}: {
  manager: QuestionManager;
  displaySelectedQuestions: Question[];
}) {
  const {
    totalMarks,
    clearSelectedQuestions,
    sectionGroups,
    sectionMarks,
    updateSectionMarks,
  } = manager;

  return (
    <section className="rounded-xl border border-[#E7DCC7] bg-[#FCF8EF] p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F4EA] text-[#258047]">
            <CheckCircle2 size={16} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[13px] font-extrabold text-[#3A3021]">
              <T>Your question paper</T>
            </h3>
            <p className="mt-0.5 text-[11px] text-[#83745C]">
              {displaySelectedQuestions.length} <T>questions selected</T>
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[17px] font-extrabold leading-none tabular-nums text-[#342B1E]">
            {totalMarks}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-[#83745C]">
            <T>Total marks</T>
          </p>
        </div>
      </div>

      {displaySelectedQuestions.length ? (
        <>
          <div className="mt-3 flex items-center justify-between border-t border-[#E9DFCE] pt-3">
            <p className="text-[11px] font-bold text-[#77684F]">
              <T>Marks per section</T>
            </p>
            <button
              type="button"
              onClick={clearSelectedQuestions}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-[#B84940] transition hover:bg-[#FFF0ED] hover:text-[#A52D25] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25"
            >
              <Trash2 size={12} />
              <T>Clear all</T>
            </button>
          </div>

          <div className="mt-2 space-y-2">
            {sectionGroups.map(({ type, questions: groupQuestions }) => (
              <div
                key={type}
                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2"
              >
                <span className="text-[12px] font-semibold text-[#5A4A32]">
                  <T>{getQuestionTypeLabel(type)}</T>
                  <span className="ml-1 text-[10px] font-medium text-[#95866F]">
                    ({groupQuestions.length})
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    aria-label={`${getQuestionTypeLabel(type)} marks`}
                    value={
                      sectionMarks[type] || groupQuestions[0]?.marks || 1
                    }
                    onChange={(event) =>
                      updateSectionMarks(type, Number(event.target.value))
                    }
                    className="h-8 w-16 rounded-lg border border-[#E7DCC7] bg-[#FCF8EF] px-2 text-center font-mono text-[12px] font-bold text-[#342B1E] outline-none transition focus:border-[#D42020] focus:ring-2 focus:ring-[#D42020]/10"
                  />
                  <span className="text-[10px] text-[#83745C]">
                    <T>marks</T>
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#8A795F]">
            <T>Drag questions in the preview to change their order. Edit individual marks directly on the paper.</T>
          </p>
        </>
      ) : (
        <p className="mt-3 rounded-lg bg-white px-3 py-2.5 text-[11px] leading-5 text-[#8A795F]">
          <T>Questions you choose will appear here. Select a question above to get started.</T>
        </p>
      )}
    </section>
  );
}
