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
    return (<section className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[17px] font-bold text-[#3B2F1E]">
                      {displaySelectedQuestions.length}<T>{"selected\n                    "}</T></p>

                    <p className="mt-0.5 text-[14px] text-[#6B5A40]"><T>{"Total marks: "}</T>{totalMarks}
                    </p>
                  </div>

                  {displaySelectedQuestions.length ? (<button type="button" onClick={clearSelectedQuestions} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[14px] font-semibold text-red-500 transition duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40">
                      <Trash2 size={14}/><T>{"Clear\n                    "}</T></button>) : null}
                </div>

                {displaySelectedQuestions.length ? (<div className="mt-3 space-y-2 border-t border-[#E3D6B8] pt-2">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#6B5A40]"><T>{"Marks per section\n                    "}</T></p>

                    {sectionGroups.map(({ type, questions: groupQuestions }) => (<div key={type} className="flex items-center justify-between gap-2">
                          <span className="text-[14px] font-semibold text-[#5A4A32]">
                            <T>{getQuestionTypeLabel(type)}</T>
                          </span>

                          <div className="flex items-center gap-1">
                            <input type="number" min={1} max={100} value={sectionMarks[type] ||
                    groupQuestions[0]?.marks ||
                    1} onChange={(event) => updateSectionMarks(type, Number(event.target.value))} className="h-8 w-14 rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-1.5 text-center font-mono text-[14px] font-bold text-[#3B2F1E] outline-none transition duration-150 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"/>

                            <span className="text-[14px] text-[#6B5A40]"><T>{"marks\n                            "}</T></span>
                          </div>
                        </div>))}

                    <p className="pt-1 text-[13px] leading-[1.7] text-[#6B5A40]"><T>{"Drag questions to reorder them within a section. Click a\n                      mark in the preview to set it individually.\n                    "}</T></p>
                  </div>) : null}
              </section>);
}
