"use client";
import type {
  Dispatch,
  DragEvent,
  FocusEvent,
  FormEvent,
  SetStateAction,
} from "react";
import type { JointPage, Question, QuestionLayout } from "../../types/question";
import {
  DEFAULT_QUESTION_LAYOUT,
  getQuestionTypeLabel,
} from "../../types/question";
import QuestionPreviewRow from "./QuestionPreviewRow";
import { readEditableText } from "./RegionSelectionOverlay";

export default function QuestionGroup({
  group,
  layoutColumns,
  paperGap,
  hiddenRegionBlockIds,
  activeRegionTargetIds,
  canvasTextOverrides,
  isRegionBlockActive,
  handleRegionBlockInput,
  handleRegionBlockBlur,
  handleRegionBlockFocus,
  questionNumberMap,
  fontSize,
  styleVariant,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  dragOverId,
  editingMarkId,
  setEditingMarkId,
  updateQuestionMark,
  selectAnswerEnabled,
  answerSelections,
  setAnswerSelections,
  jointPage,
  pageIndex,
  pageCount,
  onMoveToPage,
  activeQuestionId,
  editingQuestionId,
  onStartQuestionEdit,
  onUpdateQuestion,
  onReplaceQuestion,
  replacementCandidates,
  onSetActiveQuestion,
  onRegionTargetCommit,
  onRegionBlockEmpty,
  questionLayoutById = {},
  onAdjustQuestionLayout,
}: {
  group: { type: Question["type"]; questions: Question[] };
  layoutColumns: 1 | 2;
  paperGap: string;
  hiddenRegionBlockIds: Set<string>;
  activeRegionTargetIds: Set<string>;
  canvasTextOverrides: Record<string, string>;
  isRegionBlockActive: (blockId: string) => boolean;
  handleRegionBlockInput: (blockId: string, element: HTMLElement) => void;
  handleRegionBlockBlur: (
    event: FocusEvent<HTMLElement>,
    blockId: string,
  ) => void;
  handleRegionBlockFocus: (blockId: string) => void;
  questionNumberMap: Map<string, number>;
  fontSize: number;
  styleVariant: "Classic" | "Compact";
  onRemove: (question: Question) => void;
  onDragStart: (id: string) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>, id: string) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: () => void;
  dragOverId: string | null;
  editingMarkId: string | null;
  setEditingMarkId: (id: string | null) => void;
  updateQuestionMark: (id: string, value: number) => void;
  selectAnswerEnabled: boolean;
  answerSelections: Record<string, string>;
  setAnswerSelections: Dispatch<SetStateAction<Record<string, string>>>;
  jointPage?: JointPage;
  pageIndex?: number;
  pageCount?: number;
  onMoveToPage?: (questionId: string, targetPage: number) => void;
  activeQuestionId?: string | null;
  editingQuestionId?: string | null;
  onStartQuestionEdit?: (id: string | null) => void;
  onUpdateQuestion?: (question: Question) => void;
  onReplaceQuestion?: (questionId: string, replacement: Question) => void;
  replacementCandidates?: Question[];
  onSetActiveQuestion?: (id: string | null) => void;
  onRegionTargetCommit?: (targetId: string, value: string) => void;
  onRegionBlockEmpty?: (blockId: string, question: Question) => void;
  questionLayoutById?: Record<string, QuestionLayout>;
  onAdjustQuestionLayout?: (
    questionId: string,
    field: keyof QuestionLayout,
    delta: number,
  ) => void;
}) {
  const headingBlockId = `group:${group.type}:heading-block`;
  const headingTargetId = `group:${group.type}:heading`;
  const isHeadingActive = isRegionBlockActive(headingBlockId);
  const isHeadingTargetActive = activeRegionTargetIds.has(headingTargetId);
  return (
    <section
      data-paper-question-group="true"
      data-paper-question-group-type={group.type}
      className="paper-question-group mb-3"
    >
      {!hiddenRegionBlockIds.has(headingBlockId) ? (
        <div
          className="paper-question-section-heading mb-1.5 flex items-center justify-between border-b border-gray-300 pb-1"
          data-region-edit-target={headingBlockId}
          contentEditable={isHeadingActive}
          suppressContentEditableWarning
          onInput={(event: FormEvent<HTMLElement>) =>
            handleRegionBlockInput(headingBlockId, event.currentTarget)
          }
          onBlur={(event) => handleRegionBlockBlur(event, headingBlockId)}
          onFocus={() => handleRegionBlockFocus(headingBlockId)}
          onPointerDown={(event) => {
            if (isHeadingActive) {
              event.stopPropagation();
            }
          }}
        >
          <h3
            className={`text-[8px] font-extrabold text-gray-600 ${
              isHeadingTargetActive ? "outline-none" : ""
            }`}
            data-region-edit-target={headingTargetId}
            contentEditable={isHeadingTargetActive}
            suppressContentEditableWarning
            onPointerDown={(event) => {
              if (isHeadingTargetActive) {
                event.stopPropagation();
              }
            }}
            onClick={(event) => {
              if (isHeadingTargetActive) {
                event.stopPropagation();
              }
            }}
            onBlur={(event) => {
              if (!isHeadingActive && isHeadingTargetActive) {
                onRegionTargetCommit?.(
                  headingTargetId,
                  readEditableText(event.currentTarget),
                );
              }
            }}
          >
            {Object.prototype.hasOwnProperty.call(
              canvasTextOverrides,
              headingTargetId,
            )
              ? canvasTextOverrides[headingTargetId]
              : `${getQuestionTypeLabel(group.type)} (${group.questions.reduce(
                  (sum, question) => sum + (question.marks || 1),
                  0,
                )} marks)`}
          </h3>
        </div>
      ) : null}
      <div
        data-paper-question-rows="true"
        className={layoutColumns === 2 ? "block" : `flex flex-col ${paperGap}`}
      >
        {group.questions.map((question) => (
          <QuestionPreviewRow
            key={question.id}
            question={question}
            questionNumber={questionNumberMap.get(question.id) || 1}
            fontSize={fontSize}
            isDragOver={dragOverId === question.id}
            styleVariant={styleVariant}
            onRemove={() => onRemove(question)}
            jointPage={jointPage}
            onDragStart={() => onDragStart(question.id)}
            onDragOver={(event) => onDragOver(event, question.id)}
            onDrop={(event) => onDrop(event, question.id)}
            onDragEnd={onDragEnd}
            editingMarkId={editingMarkId}
            setEditingMarkId={setEditingMarkId}
            updateQuestionMark={updateQuestionMark}
            selectAnswerEnabled={selectAnswerEnabled}
            answerSelections={answerSelections}
            setAnswerSelections={setAnswerSelections}
            questionLayout={
              questionLayoutById[question.id] || DEFAULT_QUESTION_LAYOUT
            }
            onAdjustQuestionLayout={onAdjustQuestionLayout}
            currentPageIndex={pageIndex}
            pageCount={pageCount}
            onMoveToPage={onMoveToPage}
            activeQuestionId={activeQuestionId}
            editingQuestionId={editingQuestionId}
            onStartQuestionEdit={onStartQuestionEdit}
            onUpdateQuestion={onUpdateQuestion}
            onReplaceQuestion={onReplaceQuestion}
            replacementCandidates={replacementCandidates}
            onSetActiveQuestion={onSetActiveQuestion}
            activeRegionTargetIds={activeRegionTargetIds}
            onRegionTargetCommit={onRegionTargetCommit}
            onRegionBlockEmpty={(blockId) =>
              onRegionBlockEmpty?.(blockId, question)
            }
            canvasTextOverrides={canvasTextOverrides}
          />
        ))}
      </div>
    </section>
  );
}
