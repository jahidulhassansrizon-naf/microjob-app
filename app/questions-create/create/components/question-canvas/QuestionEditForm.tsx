"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Question } from "../../types/question";
import { cleanMultilineText, getQuestionTypeLabel } from "../../types/question";

function questionNumberMapForReplacement(
  candidate: Question,
  currentQuestionNumber: number,
): string {
  const typeLabel = getQuestionTypeLabel(candidate.type);
  const compact = cleanMultilineText(candidate.question, 90).replace(/\s+/g, " ");
  const currentMarker = candidate.id
    ? compact
    : `Question ${currentQuestionNumber}`;
  return `${typeLabel} · ${currentMarker}`;
}

export default function QuestionEditForm({
  question,
  questionNumber,
  draft,
  setDraft,
  showReplace,
  setShowReplace,
  replacementCandidates,
  onReplace,
  onCancel,
  onSave,
}: {
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
  return (
    <div className="space-y-2 rounded-lg border border-[#F3A847]/30 bg-white p-2 print:hidden">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[8px] font-extrabold uppercase tracking-[0.08em] text-gray-400">
          Edit Question {questionNumber}
        </span>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setShowReplace(!showReplace);
          }}
          className="rounded-md border border-gray-200 px-2 py-1 text-[8px] font-bold text-gray-500 hover:bg-gray-50"
        >
          Change question
        </button>
      </div>

      {showReplace ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
          <select
            defaultValue=""
            onChange={(event) => onReplace(event.target.value)}
            className="h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-[8px] font-semibold text-gray-600 outline-none focus:border-[#F3A847]"
          >
            <option value="">Select replacement…</option>
            {replacementCandidates
              .filter((candidate) => candidate.id !== question.id)
              .map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {questionNumberMapForReplacement(candidate, questionNumber)}
                </option>
              ))}
          </select>
        </div>
      ) : null}

      <textarea
        value={draft.question}
        onChange={(event) =>
          setDraft((current) => ({
            ...current,
            question: event.target.value,
          }))
        }
        rows={3}
        className="w-full resize-y rounded-md border border-gray-200 px-2 py-1.5 text-[9px] leading-relaxed text-gray-700 outline-none focus:border-[#F3A847]"
        placeholder="Question text"
        onClick={(event) => event.stopPropagation()}
      />

      {draft.type === "CQ" ? (
        <>
          <textarea
            value={draft.stimulus || ""}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                stimulus: event.target.value,
              }))
            }
            rows={3}
            className="w-full resize-y rounded-md border border-gray-200 px-2 py-1.5 text-[9px] leading-relaxed text-gray-700 outline-none focus:border-[#F3A847]"
            placeholder="Stimulus / context"
            onClick={(event) => event.stopPropagation()}
          />

          {(draft.subQuestions || []).map((part, index) => (
            <div
              key={`${draft.id}-edit-part-${index}`}
              className="grid grid-cols-[45px_1fr] gap-2"
            >
              <input
                value={part.label}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    subQuestions: (current.subQuestions || []).map(
                      (item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, label: event.target.value }
                          : item,
                    ),
                  }))
                }
                className="h-8 rounded-md border border-gray-200 px-2 text-[8px] font-bold outline-none focus:border-[#F3A847]"
                onClick={(event) => event.stopPropagation()}
                placeholder="a"
              />

              <textarea
                value={part.question}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    subQuestions: (current.subQuestions || []).map(
                      (item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, question: event.target.value }
                          : item,
                    ),
                  }))
                }
                rows={2}
                className="w-full resize-y rounded-md border border-gray-200 px-2 py-1.5 text-[8px] leading-relaxed outline-none focus:border-[#F3A847]"
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          ))}
        </>
      ) : null}

      {draft.type === "MCQ" ? (
        <div className="grid grid-cols-1 gap-1.5">
          {(draft.options || []).map((option, index) => (
            <input
              key={`${draft.id}-edit-option-${index}`}
              value={option}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  options: (current.options || []).map(
                    (item, itemIndex) =>
                      itemIndex === index ? event.target.value : item,
                  ),
                }))
              }
              className="h-8 rounded-md border border-gray-200 px-2 text-[8px] outline-none focus:border-[#F3A847]"
              onClick={(event) => event.stopPropagation()}
            />
          ))}
        </div>
      ) : null}

      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onCancel();
          }}
          className="rounded-md border border-gray-200 px-2.5 py-1 text-[8px] font-bold text-gray-500 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSave();
          }}
          className="rounded-md bg-[#F3A847] px-2.5 py-1 text-[8px] font-bold text-white"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
