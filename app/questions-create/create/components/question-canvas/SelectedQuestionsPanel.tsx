"use client";
import { T } from "../../i18n";
import { Trash2 } from "lucide-react";
import type { QuestionManager } from "../../hooks/useQuestionManager";
import type { Question } from "../../types/question";
import { getQuestionTypeLabel } from "../../types/question";
export default function SelectedQuestionsPanel({ manager, displaySelectedQuestions, }: {
    manager: QuestionManager;
    displaySelectedQuestions: Question[];
}) {
    const { totalMarks, clearSelectedQuestions, sectionGroups, sectionMarks, updateSectionMarks, } = manager;
    return (<section className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-extrabold text-[#0F172A]">
                      {displaySelectedQuestions.length}<T>{"selected\n                    "}</T></p>

                    <p className="mt-0.5 text-[9px] text-[#0F172A]/55"><T>{"Total marks: "}</T>{totalMarks}
                    </p>
                  </div>

                  {displaySelectedQuestions.length ? (<button type="button" onClick={clearSelectedQuestions} className="flex items-center gap-1 text-[10px] font-semibold text-red-400 hover:text-red-500">
                      <Trash2 size={11}/><T>{"Clear\n                    "}</T></button>) : null}
                </div>

                {displaySelectedQuestions.length ? (<div className="mt-3 space-y-2 border-t border-[#E2E8F0] pt-2">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#0F172A]/55"><T>{"Marks per section\n                    "}</T></p>

                    {sectionGroups.map(({ type, questions: groupQuestions }) => (<div key={type} className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-semibold text-[#0F172A]/70">
                            <T>{getQuestionTypeLabel(type)}</T>
                          </span>

                          <div className="flex items-center gap-1">
                            <input type="number" min={1} max={100} value={sectionMarks[type] ||
                    groupQuestions[0]?.marks ||
                    1} onChange={(event) => updateSectionMarks(type, Number(event.target.value))} className="h-6 w-12 rounded-md border border-[#E2E8F0] px-1.5 text-center text-[9px] font-bold outline-none focus:border-[#2563EB]"/>

                            <span className="text-[9px] text-[#0F172A]/55"><T>{"marks\n                            "}</T></span>
                          </div>
                        </div>))}

                    <p className="pt-1 text-[8px] leading-relaxed text-[#0F172A]/40"><T>{"Drag questions to reorder them within a section. Click a\n                      mark in the preview to set it individually.\n                    "}</T></p>
                  </div>) : null}
              </section>);
}
