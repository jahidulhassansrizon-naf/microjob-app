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
    return (<section className="flex min-h-[360px] flex-1 flex-col overflow-hidden rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-sm">
                <div className="space-y-2.5 border-b border-[#E3D6B8] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-semibold text-[#5A4A32]">
                      {questions.length
        ? questionSearchQuery
            ? t(`Showing ${visibleQuestions.length} of ${questions.length}`)
            : t(`${questions.length} found`)
        : <T>{"0 found"}</T>}
                    </span>

                    {visibleQuestions.length > 0 ? (<button type="button" onClick={handleSelectAll} className="rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-1.5 text-[14px] font-semibold text-[#3B2F1E] transition duration-150 hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]">
                        {visibleQuestions.every((question) => selectedIds.has(question.id))
            ? <T>{"☑ Select all"}</T> : <T>{"☐ Select all"}</T>}
                      </button>) : null}
                  </div>

                  <div className="scroll flex items-center gap-1.5 overflow-x-auto pb-1.5">
                    {([
            ["all", "All", typeCounts.all],
            ["MCQ", "MCQ", typeCounts.MCQ],
            ["Short", "Short", typeCounts.Short],
            ["CQ", "Creative / CQ", typeCounts.CQ],
            ["Descriptive", "Descriptive", typeCounts.Descriptive],
        ] as const).map(([value, label, count]) => (<button key={value} type="button" onClick={() => setResultTypeTab(value)} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[14px] font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] ${resultTypeTab === value
                ? "bg-[#DC2626] text-white hover:bg-[#B91C1C]"
                : "border border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:border-[#D8C9A6] hover:bg-[#EFE3C8]"}`}>
                        <T>{label}</T>
                        {value === "all" ? <T>{""}</T> : <T>{` (${count})`}</T>}
                      </button>))}
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2.5 transition duration-150 focus-within:border-[#DC2626] focus-within:ring-2 focus-within:ring-[#DC2626]/20">
                    <Search size={16} className="text-[#6B5A40]"/>

                    <input value={questionSearchQuery} onChange={(event) => setQuestionSearchQuery(event.target.value)} placeholder={t("Search in fetched questions...")} className="w-full border-0 bg-transparent text-[15px] text-[#3B2F1E] outline-none placeholder:text-[#B0A080]"/>
                  </div>
                </div>

                <div className="scroll min-h-0 flex-1 overflow-y-auto p-3">
                  {loadingQuestions ? (<div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-center">
                      <Loader2 size={26} className="animate-spin text-[#DC2626]"/>

                      <p className="text-[14px] font-semibold text-[#5A4A32]"><T>{"Fetching questions via AI...\n                      "}</T></p>
                    </div>) : visibleQuestions.length ? (<div className="space-y-2">
                      {visibleQuestions.map((question) => {
                const selected = selectedIds.has(question.id);
                return (<button key={question.id} type="button" onClick={() => {
                        onExitDemo();
                        toggleSelectQuestion(question);
                    }} className={`relative w-full cursor-pointer rounded-xl border px-3 py-3 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${selected
                        ? "border-[#DC2626] bg-[#F6D9A8] ring-2 ring-[#DC2626]/40"
                        : "border-[#E3D6B8] bg-[#FBF6E8] shadow-sm hover:-translate-y-0.5 hover:bg-[#EFE3C8]"}`}>
                            <div className="flex items-start gap-2">
                              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected
                        ? "border-[#DC2626] bg-[#DC2626] text-white"
                        : "border-[#D8C9A6] bg-[#FBF6E8]"}`}>
                                {selected ? <Check size={13}/> : null}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-[15px] font-semibold leading-[1.5] text-[#3B2F1E]">
                                  {question.type === "CQ"
                        ? question.stimulus || question.question
                        : question.question}
                                </p>

                                <div className="mt-1.5 flex items-center gap-2 text-[13px] text-[#6B5A40]">
                                  <span className="font-bold">
                                    <T>{getQuestionTypeLabel(question.type)}</T>
                                  </span>

                                  <span>{question.marks}<T>{"marks"}</T></span>
                                </div>
                              </div>

                              {selected ? (<FileText size={16} className="shrink-0 text-[#DC2626]"/>) : null}
                            </div>
                          </button>);
            })}
                    </div>) : (<div className="flex min-h-[240px] flex-col items-center justify-center px-5 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#FBB6B6] bg-[#FEE9E9] text-[#DC2626]">
                        <FileText size={22}/>
                      </div>

                      <p className="text-[14px] font-semibold italic leading-[1.6] text-[#6B5A40]"><T>{"Set your filters and press \u201CApply filter\u201D to load\n                        questions.\n                      "}</T></p>
                    </div>)}
                </div>
              </section>);
}
