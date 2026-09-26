"use client";

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
              <section className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="space-y-2 border-b border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-gray-500">
                      {questions.length
                        ? questionSearchQuery
                          ? `Showing ${visibleQuestions.length} of ${questions.length}`
                          : `${questions.length} found`
                        : "0 found"}
                    </span>

                    {visibleQuestions.length > 0 ? (
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        {visibleQuestions.every((question) =>
                          selectedIds.has(question.id),
                        )
                          ? "☑ Select all"
                          : "☐ Select all"}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
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
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-semibold transition ${
                          resultTypeTab === value
                            ? "bg-[#F3A847] text-white"
                            : "border border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {label}
                        {value === "all" ? "" : ` (${count})`}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2">
                    <Search size={12} className="text-gray-400" />

                    <input
                      value={questionSearchQuery}
                      onChange={(event) =>
                        setQuestionSearchQuery(event.target.value)
                      }
                      placeholder="Search in fetched questions..."
                      className="w-full border-0 bg-transparent text-[10px] outline-none placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
                  {loadingQuestions ? (
                    <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-center">
                      <Loader2
                        size={22}
                        className="animate-spin text-[#F3A847]"
                      />

                      <p className="text-[10px] font-semibold text-gray-500">
                        Fetching questions via AI...
                      </p>
                    </div>
                  ) : visibleQuestions.length ? (
                    <div className="space-y-2">
                      {visibleQuestions.map((question) => {
                        const selected = selectedIds.has(question.id);

                        return (
                          <button
                            key={question.id}
                            type="button"
                            onClick={() => {
                              onExitDemo();
                              toggleSelectQuestion(question);
                            }}
                            className={`w-full cursor-pointer rounded-lg border px-2.5 py-2.5 text-left transition ${
                              selected
                                ? "border-[#F3A847] bg-[#FFF9EF]"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${
                                  selected
                                    ? "border-[#F3A847] bg-[#F3A847] text-white"
                                    : "border-gray-300 bg-white"
                                }`}
                              >
                                {selected ? <Check size={10} /> : null}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-[10px] font-semibold leading-relaxed text-gray-700">
                                  {question.type === "CQ"
                                    ? question.stimulus || question.question
                                    : question.question}
                                </p>

                                <div className="mt-1 flex items-center gap-2 text-[9px] text-gray-400">
                                  <span className="font-bold">
                                    {getQuestionTypeLabel(question.type)}
                                  </span>

                                  <span>{question.marks} marks</span>
                                </div>
                              </div>

                              {selected ? (
                                <FileText
                                  size={12}
                                  className="shrink-0 text-[#F3A847]"
                                />
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex min-h-[240px] flex-col items-center justify-center px-5 text-center">
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F3A847]">
                        <FileText size={18} />
                      </div>

                      <p className="text-[10px] font-semibold text-gray-500">
                        Set your filters and press “Apply filter” to load
                        questions.
                      </p>
                    </div>
                  )}
                </div>
              </section>
  );
}
