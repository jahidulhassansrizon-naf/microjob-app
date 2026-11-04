"use client";

import { useEffect, useRef } from "react";
import { T, useQuestionText } from "../../i18n";
import { Check, FileText, Loader2, Plus, Search } from "lucide-react";
import type { QuestionManager } from "../../hooks/useQuestionManager";
import { getQuestionTypeLabel } from "../../types/question";

export default function FetchedQuestionList({
  manager,
  onExitDemo,
}: {
  manager: QuestionManager;
  onExitDemo: () => void;
}) {
  const { t } = useQuestionText();
  const {
    questions,
    visibleQuestions,
    selectedIds,
    typeCounts,
    resultTypeTab,
    setResultTypeTab,
    questionSearchQuery,
    setQuestionSearchQuery,
    handleSelectAll,
    toggleSelectQuestion,
    loadingQuestions,
    loadingMoreQuestions,
    noMoreQuestions,
    questionError,
    handleLoadMoreQuestions,
  } = manager;

  const sectionRef = useRef<HTMLElement | null>(null);
  const wasLoadingRef = useRef(false);

  // When a fetch finishes, bring the list to the top of the (scrollable) left column
  // so the user sees the questions straight away instead of hunting for them.
  useEffect(() => {
    if (wasLoadingRef.current && !loadingQuestions && questions.length > 0) {
      const section = sectionRef.current;
      const column = section?.closest(".question-filters-column") as HTMLElement | null;
      if (section && column) {
        const top = section.getBoundingClientRect().top - column.getBoundingClientRect().top + column.scrollTop;
        column.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
      }
    }
    wasLoadingRef.current = loadingQuestions;
  }, [loadingQuestions, questions.length]);

  return (
    <section
      ref={sectionRef}
      className="flex min-h-[330px] shrink-0 flex-col rounded-xl border border-[#E7DCC7] bg-white shadow-sm"
    >
      {/* On desktop the whole left column scrolls, so the header (type tabs + search + select all)
          stays pinned while the questions scroll underneath it. */}
      <div className="rounded-t-xl border-b border-[#EEE6D8] bg-white px-3.5 pb-3 pt-3.5 xl:sticky xl:top-0 xl:z-10">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FCE9E6] text-[#D42020]">
                <FileText size={14} />
              </span>
              <h3 className="text-[13px] font-extrabold text-[#3A3021]">
                <T>Available questions</T>
              </h3>
            </div>
            <p className="ml-9 mt-0.5 text-[11px] leading-4 text-[#83745C]">
              <T>Click a question to add or remove it.</T>
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#F4EFE5] px-2.5 py-1 text-[11px] font-bold text-[#65563F]">
            {questions.length
              ? questionSearchQuery
                ? t(`Showing ${visibleQuestions.length} of ${questions.length}`)
                : t(`${questions.length} found`)
              : t("0 found")}
          </span>
        </div>

        {visibleQuestions.length > 0 ? (
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-[#83745C]">
              <T>Filter by type</T>
            </p>
            <button
              type="button"
              onClick={handleSelectAll}
              className="rounded-lg border border-[#E7DCC7] bg-[#FCF8EF] px-2.5 py-1.5 text-[11px] font-bold text-[#65563F] transition hover:border-[#D8C9A6] hover:bg-[#F8F0E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25 active:scale-[0.98]"
            >
              {visibleQuestions.every((question) => selectedIds.has(question.id))
                ? <T>☑ Select all</T>
                : <T>☐ Select all</T>}
            </button>
          </div>
        ) : null}

        <div className="scroll mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              ["all", "All", typeCounts.all],
              ["MCQ", "MCQ", typeCounts.MCQ],
              ["Short", "Short", typeCounts.Short],
              ["CQ", "Creative / CQ", typeCounts.CQ],
              ["Descriptive", "Descriptive", typeCounts.Descriptive],
            ] as const
          ).map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              onClick={() => setResultTypeTab(value)}
              aria-pressed={resultTypeTab === value}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25 active:scale-[0.98] ${
                resultTypeTab === value
                  ? "bg-[#D42020] text-white shadow-sm"
                  : "border border-[#E8DFCF] bg-[#FCF8EF] text-[#6E604B] hover:border-[#D8C9A6] hover:bg-[#F7F0E3]"
              }`}
            >
              <T>{label}</T>
              {value === "all" ? "" : ` (${count})`}
            </button>
          ))}
        </div>

        <div className="mt-2 flex min-h-10 items-center gap-2 rounded-lg border border-[#E7DCC7] bg-[#FCF8EF] px-3 transition focus-within:border-[#D42020] focus-within:ring-2 focus-within:ring-[#D42020]/10">
          <Search size={14} className="shrink-0 text-[#8A795F]" />
          <input
            value={questionSearchQuery}
            onChange={(event) => setQuestionSearchQuery(event.target.value)}
            placeholder={t("Search in fetched questions...")}
            className="w-full border-0 bg-transparent py-2 text-[12px] text-[#342B1E] outline-none placeholder:text-[#A99B83]"
          />
        </div>
      </div>

      {/* Desktop: no inner scrollbar - the list uses the full column height (one scroll, not two).
          Tablet/mobile: a tall inner scroll area (70% of the screen) instead of the old 460px box. */}
      <div className="scroll max-h-[70vh] min-h-[190px] flex-1 overflow-y-auto rounded-b-xl bg-[#FFFEFB] p-2.5 xl:max-h-none xl:overflow-visible">
        {loadingQuestions ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center">
            <Loader2 size={24} className="animate-spin text-[#D42020]" />
            <p className="text-[12px] font-semibold text-[#65563F]">
              <T>Fetching questions via AI...</T>
            </p>
          </div>
        ) : visibleQuestions.length ? (
          <div className="space-y-2">
            {visibleQuestions.map((question, index) => {
              const selected = selectedIds.has(question.id);
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => {
                    onExitDemo();
                    toggleSelectQuestion(question);
                  }}
                  aria-pressed={selected}
                  className={`group relative w-full rounded-xl border p-3 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25 active:scale-[0.995] ${
                    selected
                      ? "border-[#D42020]/45 bg-[#FFF3F0] shadow-[inset_3px_0_0_#D42020]"
                      : "border-[#EEE6D8] bg-white hover:border-[#D8C9A6] hover:bg-[#FFFCF6]"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        selected
                          ? "border-[#D42020] bg-[#D42020] text-white"
                          : "border-[#D8CDBB] bg-white text-transparent group-hover:border-[#D42020]/60"
                      }`}
                    >
                      <Check size={12} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold leading-[1.65] text-[#3D3324]">
                        {question.type === "CQ"
                          ? question.stimulus || question.question
                          : question.question}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-[#F3EDE2] px-2 py-0.5 text-[10px] font-bold text-[#6B5A40]">
                          <T>{getQuestionTypeLabel(question.type)}</T>
                        </span>
                        <span className="text-[10px] font-semibold text-[#8A795F]">
                          {question.marks} <T>marks</T>
                        </span>
                        <span className="ml-auto text-[10px] font-semibold text-[#A0927B]">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Fetch another batch and add it to this list. Questions already placed on the paper stay there. */}
            <div className="pt-1">
              {questionError ? (
                <p className="mb-2 rounded-lg border border-[#F0D5D1] bg-[#FFF7F5] px-3 py-2 text-[11px] font-semibold leading-5 text-[#A83B33]">
                  <T>{questionError}</T>
                </p>
              ) : null}
              {noMoreQuestions ? (
                <p className="mb-2 rounded-lg bg-[#F6F0E5] px-3 py-2 text-center text-[11px] font-semibold leading-5 text-[#7A6A4F]">
                  <T>No more new questions found for this selection.</T>
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  onExitDemo();
                  handleLoadMoreQuestions();
                }}
                disabled={loadingMoreQuestions}
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D42020]/45 bg-[#FFF7F5] px-3 py-2 text-[12px] font-extrabold text-[#B91C1C] transition hover:bg-[#FFF0ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingMoreQuestions ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                {loadingMoreQuestions ? (
                  <T>Fetching more questions...</T>
                ) : (
                  <T>Load more questions</T>
                )}
              </button>
              <p className="mt-1.5 text-center text-[10px] leading-4 text-[#8A795F]">
                <T>Questions already on your paper stay safe. New ones are added to this list.</T>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F6F0E5] text-[#A28E6F]">
              <FileText size={19} />
            </div>
            <p className="text-[12px] font-bold text-[#554832]">
              <T>No questions to show yet</T>
            </p>
            <p className="mt-1 max-w-[230px] text-[11px] leading-5 text-[#8A795F]">
              <T>Choose your class, subject and chapter, then apply the filter.</T>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
