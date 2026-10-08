"use client";
import { T, useQuestionText } from "../../i18n";
import { Check, FileText, Loader2, Search } from "lucide-react";
import type { QuestionManager } from "../../hooks/useQuestionManager";
import { getQuestionTypeLabel } from "../../types/question";
export default function FetchedQuestionList({ manager, onExitDemo, }: {
    manager: QuestionManager;
    onExitDemo: () => void;
}) {
    const { t } = useQuestionText();
    const { questions, visibleQuestions, selectedIds, typeCounts, resultTypeTab, setResultTypeTab, questionSearchQuery, setQuestionSearchQuery, handleSelectAll, toggleSelectQuestion, loadingQuestions, } = manager;
    return (<section className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
                <div className="space-y-2 border-b border-[#E2E8F0] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-[#0F172A]/70">
                      {questions.length
        ? questionSearchQuery
            ? t(`Showing ${visibleQuestions.length} of ${questions.length}`)
            : t(`${questions.length} found`)
        : <T>{"0 found"}</T>}
                    </span>

                    {visibleQuestions.length > 0 ? (<button type="button" onClick={handleSelectAll} className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#0F172A] hover:bg-[#E2E8F0]">
                        {visibleQuestions.every((question) => selectedIds.has(question.id))
            ? <T>{"☑ Select all"}</T> : <T>{"☐ Select all"}</T>}
                      </button>) : null}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                    {([
            ["all", "All", typeCounts.all],
            ["MCQ", "MCQ", typeCounts.MCQ],
            ["Short", "Short", typeCounts.Short],
            ["CQ", "Creative / CQ", typeCounts.CQ],
            ["Descriptive", "Descriptive", typeCounts.Descriptive],
        ] as const).map(([value, label, count]) => (<button key={value} type="button" onClick={() => setResultTypeTab(value)} className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-semibold transition ${resultTypeTab === value
                ? "bg-[#2563EB] text-white"
                : "border border-[#E2E8F0] bg-white text-[#0F172A]/70 hover:border-[#E2E8F0]"}`}>
                        <T>{label}</T>
                        {value === "all" ? <T>{""}</T> : <T>{` (${count})`}</T>}
                      </button>))}
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-2.5 py-2">
                    <Search size={12} className="text-[#0F172A]/55"/>

                    <input value={questionSearchQuery} onChange={(event) => setQuestionSearchQuery(event.target.value)} placeholder={t("Search in fetched questions...")} className="w-full border-0 bg-transparent text-[10px] outline-none placeholder:text-[#0F172A]/40"/>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
                  {loadingQuestions ? (<div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-center">
                      <Loader2 size={22} className="animate-spin text-[#2563EB]"/>

                      <p className="text-[10px] font-semibold text-[#0F172A]/70"><T>{"Fetching questions via AI...\n                      "}</T></p>
                    </div>) : visibleQuestions.length ? (<div className="space-y-2">
                      {visibleQuestions.map((question) => {
                const selected = selectedIds.has(question.id);
                return (<button key={question.id} type="button" onClick={() => {
                        onExitDemo();
                        toggleSelectQuestion(question);
                    }} className={`w-full cursor-pointer rounded-lg border px-2.5 py-2.5 text-left transition ${selected
                        ? "border-[#2563EB] bg-[#E2E8F0]"
                        : "border-[#E2E8F0] bg-white hover:border-[#E2E8F0]"}`}>
                            <div className="flex items-start gap-2">
                              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${selected
                        ? "border-[#2563EB] bg-[#2563EB] text-white"
                        : "border-[#E2E8F0] bg-white"}`}>
                                {selected ? <Check size={10}/> : null}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-[10px] font-semibold leading-relaxed text-[#0F172A]">
                                  {question.type === "CQ"
                        ? question.stimulus || question.question
                        : question.question}
                                </p>

                                <div className="mt-1 flex items-center gap-2 text-[9px] text-[#0F172A]/55">
                                  <span className="font-bold">
                                    <T>{getQuestionTypeLabel(question.type)}</T>
                                  </span>

                                  <span>{question.marks}<T>{"marks"}</T></span>
                                </div>
                              </div>

                              {selected ? (<FileText size={12} className="shrink-0 text-[#2563EB]"/>) : null}
                            </div>
                          </button>);
            })}
                    </div>) : (<div className="flex min-h-[240px] flex-col items-center justify-center px-5 text-center">
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E2E8F0] text-[#2563EB]">
                        <FileText size={18}/>
                      </div>

                      <p className="text-[10px] font-semibold text-[#0F172A]/70"><T>{"Set your filters and press \u201CApply filter\u201D to load\n                        questions.\n                      "}</T></p>
                    </div>)}
                </div>
              </section>);
}
