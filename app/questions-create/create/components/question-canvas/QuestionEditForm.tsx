"use client";
import { T, useQuestionText } from "../../i18n";
import type { Dispatch, SetStateAction } from "react";
import type { Question } from "../../types/question";
import { cleanMultilineText, getQuestionTypeLabel } from "../../types/question";
function questionNumberMapForReplacement(candidate: Question, currentQuestionNumber: number): string {
    const typeLabel = getQuestionTypeLabel(candidate.type);
    const compact = cleanMultilineText(candidate.question, 90).replace(/\s+/g, " ");
    const currentMarker = candidate.id
        ? compact
        : `Question ${currentQuestionNumber}`;
    return `${typeLabel} · ${currentMarker}`;
}
export default function QuestionEditForm({ question, questionNumber, draft, setDraft, showReplace, setShowReplace, replacementCandidates, onReplace, onCancel, onSave, }: {
    question: Question;
    questionNumber: number;
    draft: Question;
    setDraft: Dispatch<SetStateAction<Question>>;
    showReplace: boolean;
    setShowReplace: (value: boolean) => void;
    replacementCandidates: Question[];
    onReplace: (replacementId: string) => void;
    onCancel: () => void;
    onSave: () => void;
}) {
    const { t } = useQuestionText();
    return (<div className="page-font space-y-3 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-xl print:hidden">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-[#6B5A40]"><T>{"Edit Question "}</T>{questionNumber}
        </span>

        <button type="button" onClick={(event) => {
            event.stopPropagation();
            setShowReplace(!showReplace);
        }} className="rounded-lg border border-[#E3D6B8] px-3 py-1.5 text-[14px] font-bold text-[#5A4A32] transition duration-150 hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]"><T>{"Change question\n        "}</T></button>
      </div>

      {showReplace ? (<div className="rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] p-2.5">
          <select defaultValue="" onChange={(event) => onReplace(event.target.value)} className="h-11 w-full rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 text-[15px] font-semibold text-[#3B2F1E] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20">
            <option value=""><T>{"Select replacement\u2026"}</T></option>
            {replacementCandidates
                .filter((candidate) => candidate.id !== question.id)
                .map((candidate) => (<option key={candidate.id} value={candidate.id}>
                  {questionNumberMapForReplacement(candidate, questionNumber)}
                </option>))}
          </select>
        </div>) : null}

      <textarea value={draft.question} onChange={(event) => setDraft((current) => ({
            ...current,
            question: event.target.value,
        }))} rows={3} className="w-full resize-y rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2 text-[15px] leading-[1.5] text-[#3B2F1E] placeholder:text-[#B0A080] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20" placeholder={t("Question text")} onClick={(event) => event.stopPropagation()}/>

      {draft.type === "CQ" ? (<>
          <textarea value={draft.stimulus || ""} onChange={(event) => setDraft((current) => ({
                ...current,
                stimulus: event.target.value,
            }))} rows={3} className="w-full resize-y rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2 text-[15px] leading-[1.5] text-[#3B2F1E] placeholder:text-[#B0A080] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20" placeholder={t("Stimulus / context")} onClick={(event) => event.stopPropagation()}/>

          {(draft.subQuestions || []).map((part, index) => (<div key={`${draft.id}-edit-part-${index}`} className="grid grid-cols-[56px_1fr] gap-2">
              <input value={part.label} onChange={(event) => setDraft((current) => ({
                    ...current,
                    subQuestions: (current.subQuestions || []).map((item, itemIndex) => itemIndex === index
                        ? { ...item, label: event.target.value }
                        : item),
                }))} className="h-11 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-2 text-center text-[15px] font-bold text-[#3B2F1E] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20" onClick={(event) => event.stopPropagation()} placeholder="a"/>

              <textarea value={part.question} onChange={(event) => setDraft((current) => ({
                    ...current,
                    subQuestions: (current.subQuestions || []).map((item, itemIndex) => itemIndex === index
                        ? { ...item, question: event.target.value }
                        : item),
                }))} rows={2} className="w-full resize-y rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2 text-[15px] leading-[1.5] text-[#3B2F1E] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20" onClick={(event) => event.stopPropagation()}/>
            </div>))}
        </>) : null}

      {draft.type === "MCQ" ? (<div className="grid grid-cols-1 gap-1.5">
          {(draft.options || []).map((option, index) => (<input key={`${draft.id}-edit-option-${index}`} value={option} onChange={(event) => setDraft((current) => ({
                    ...current,
                    options: (current.options || []).map((item, itemIndex) => itemIndex === index ? event.target.value : item),
                }))} className="h-11 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 text-[15px] text-[#3B2F1E] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20" onClick={(event) => event.stopPropagation()}/>))}
        </div>) : null}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={(event) => {
            event.stopPropagation();
            onCancel();
        }} className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-4 py-2 text-[15px] font-bold text-[#5A4A32] transition duration-150 hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]"><T>{"Cancel\n        "}</T></button>

        <button type="button" onClick={(event) => {
            event.stopPropagation();
            onSave();
        }} className="rounded-xl bg-[#D42020] px-4 py-2 text-[15px] font-bold text-white shadow-sm transition duration-150 hover:bg-[#AE1717] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]"><T>{"Save changes\n        "}</T></button>
      </div>
    </div>);
}
