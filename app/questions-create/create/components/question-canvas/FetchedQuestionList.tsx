"use client";

import { T, useQuestionText } from "../../i18n";
import { Check, FileText, Loader2, Search } from "lucide-react";
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
  } = manager;

  return (
    <section className="flex min-h-[330px] flex-col overflow-hidden rounded-xl border border-[#E7DCC7] bg-white shadow-sm">
      <div className="border-b border-[#EEE6D8] px-3.5 pb-3 pt-3.5">
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

      <div className="scroll max-h-[460px] min-h-[190px] flex-1 overflow-y-auto bg-[#FFFEFB] p-2.5">
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
