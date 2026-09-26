"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type DragEvent,
  type FocusEvent,
  type PointerEvent,
  type SetStateAction,
} from "react";

import type {
  JointPage,
  PaperAnnotation,
  Question,
  QuestionLayout,
} from "../../types/question";

import { clampNumber } from "../../types/question";
import QuestionGroup from "./QuestionGroup";
import PaperHeader from "./PaperHeader";

import {
  collectRegionTargetIds,
  commitRegionDescendantTargets,
  commitRegionTargetsByIds,
  readCanvasRegionText,
  readEditableText,
  shouldCommitRegionBlur,
  type RegionSelection,
  RegionSelectionOverlay,
} from "./RegionSelectionOverlay";

const STRUCTURAL_BLOCK_IDS = new Set([
  "paper:header",
  "paper:chapter-block",
  "paper:footer-block",
]);

function makeRegionId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `region-${crypto.randomUUID()}`;
  }

  return `region-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function PaperSheet({
  pageSize,
  fontSize,
  paperGap,
  layoutColumns,
  logoUrl,
  institutionName,
  setInstitutionName,
  examName,
  setExamName,
  selectedSubject,
  selectedClass,
  selectedChapter,
  timeText,
  totalMarks,
  showHeader = true,
  showFooter = showHeader,
  isActive = false,
  onActivate,
  jointPage,
  onMoveToOtherPage,
  setNoEnabled,
  setNo,
  headerNoteEnabled,
  headerNote,
  footerText,
  styleVariant,
  groups,
  questionNumberMap,
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
  pagePart,
  measurementMode,
  pageIndex,
  pageCount,
  onDropOnPage,
  onMoveToPage,
  activeQuestionId,
  regionSelectMode = false,
  onSetRegionSelectMode,
  onRegionTargetCommit,
  canvasTextOverrides = {},
  annotations = [],
  onCreateRegionAnnotation,
  onUpdateRegionAnnotation,
  onDeleteRegionAnnotation,
  onRegionSelectionTargets,
  questionLayoutById = {},
  onAdjustQuestionLayout,
  editingQuestionId,
  onStartQuestionEdit,
  onUpdateQuestion,
  onReplaceQuestion,
  replacementCandidates = [],
  onSetActiveQuestion,
}: {
  pageSize: "A4" | "A5";
  fontSize: number;
  paperGap: string;
  layoutColumns: 1 | 2;
  logoUrl: string;
  institutionName: string;
  setInstitutionName: Dispatch<SetStateAction<string>>;
  examName: string;
  setExamName: Dispatch<SetStateAction<string>>;
  selectedSubject: string;
  selectedClass: string;
  selectedChapter: string;
  timeText: string;
  totalMarks: number;
  showHeader?: boolean;
  showFooter?: boolean;
  isActive?: boolean;
  onActivate?: () => void;
  jointPage?: JointPage;
  onMoveToOtherPage?: (id: string) => void;
  setNoEnabled: boolean;
  setNo: string;
  headerNoteEnabled: boolean;
  headerNote: string;
  footerText: string;
  styleVariant: "Classic" | "Compact";
  groups: { type: Question["type"]; questions: Question[] }[];
  questionNumberMap: Map<string, number>;
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
  pagePart: "left" | "right" | "single";
  pageIndex?: number;
  pageCount?: number;
  onDropOnPage?: (event: DragEvent<HTMLDivElement>, pageIndex: number) => void;
  onMoveToPage?: (questionId: string, targetPage: number) => void;
  activeQuestionId?: string | null;
  regionSelectMode?: boolean;
  onSetRegionSelectMode?: (value: boolean) => void;
  onRegionTargetCommit?: (targetId: string, value: string) => void;
  canvasTextOverrides?: Record<string, string>;
  annotations?: PaperAnnotation[];
  onCreateRegionAnnotation?: (
    pageIndex: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => string | void;
  onUpdateRegionAnnotation?: (
    annotationId: string,
    patch: Partial<PaperAnnotation>,
  ) => void;
  onDeleteRegionAnnotation?: (annotationId: string) => void;
  onRegionSelectionTargets?: (targetIds: string[]) => void;
  questionLayoutById?: Record<string, QuestionLayout>;
  onAdjustQuestionLayout?: (
    questionId: string,
    field: keyof QuestionLayout,
    delta: number,
  ) => void;
  editingQuestionId?: string | null;
  onStartQuestionEdit?: (id: string | null) => void;
  onUpdateQuestion?: (question: Question) => void;
  onReplaceQuestion?: (questionId: string, replacement: Question) => void;
  replacementCandidates?: Question[];
  onSetActiveQuestion?: (id: string | null) => void;
  measurementMode?:
    | "none"
    | "header"
    | "header-no-footer"
    | "no-header"
    | "no-header-footer"
    | "rows";
}) {
  const isJointPart = pagePart !== "single";

  const allQuestions = groups.flatMap((group) => group.questions);

  const visibleIds = new Set(allQuestions.map((question) => question.id));

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      questions: group.questions.filter((question) =>
        visibleIds.has(question.id),
      ),
    }))
    .filter((group) => group.questions.length > 0);

  const paperClass = pageSize === "A5" ? "paper-a5" : "paper-a4";
  const jointFixedClass = isJointPart ? "joint-fixed-paper" : "";
  const padding = pageSize === "A5" ? "p-6" : "p-7";

  const isMeasurement = Boolean(measurementMode) && measurementMode !== "none";

  const measurementAttributes = isMeasurement
    ? { "data-joint-measure-paper": measurementMode }
    : {};

  const [selectionPointerId, setSelectionPointerId] = useState<number | null>(
    null,
  );

  const [selectionStart, setSelectionStart] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [activeRegion, setActiveRegion] = useState<RegionSelection | null>(
    null,
  );

  const pageElementRef = useRef<HTMLElement | null>(null);

  const activeRegionTargetIds = useMemo(
    () => new Set(activeRegion?.targetIds || []),
    [activeRegion],
  );

  const [hiddenRegionBlockIds, setHiddenRegionBlockIds] = useState<Set<string>>(
    () => new Set(),
  );

  const isRegionBlockActive = (blockId: string) =>
    activeRegionTargetIds.has(blockId);

  const handleRegionBlockInput = (blockId: string, element: HTMLElement) => {
    if (!isRegionBlockActive(blockId)) {
      return;
    }

    if (Boolean(readCanvasRegionText(element))) {
      return;
    }

    setHiddenRegionBlockIds((current) => {
      if (current.has(blockId)) {
        return current;
      }

      const next = new Set(current);
      next.add(blockId);
      return next;
    });

    setActiveRegion((current) =>
      current?.targetIds.includes(blockId) ? null : current,
    );
  };

  const handleRegionBlockBlur = (
    event: FocusEvent<HTMLElement>,
    blockId: string,
  ) => {
    if (!isRegionBlockActive(blockId)) {
      return;
    }

    if (!shouldCommitRegionBlur(event)) {
      return;
    }

    const expectedTargetIds: Record<string, string[]> = {
      "paper:header": [
        "paper:set-no-label",
        "paper:set-no",
        "paper:header-note",
        "paper:institution",
        "paper:exam",
        "paper:subject-label",
        "paper:subject",
        "paper:class-label",
        "paper:class",
        "paper:time-label",
        "paper:time",
        "paper:full-marks-label",
        "paper:full-marks",
      ],
      "paper:chapter-block": ["paper:chapter-label", "paper:chapter"],
      "paper:footer-block": ["paper:footer"],
    };

    const expected = expectedTargetIds[blockId];

    if (expected) {
      commitRegionTargetsByIds(
        event.currentTarget,
        expected,
        onRegionTargetCommit,
      );
      return;
    }

    commitRegionDescendantTargets(event.currentTarget, onRegionTargetCommit);
  };

  const handleRegionBlockFocus = (blockId: string) => {
    if (!hiddenRegionBlockIds.has(blockId)) {
      return;
    }

    setHiddenRegionBlockIds((current) => {
      const next = new Set(current);
      next.delete(blockId);
      return next;
    });
  };

  const focusFirstRegionTarget = () => {
    if (!activeRegion || isMeasurement) {
      return;
    }

    const firstTargetId = activeRegion.targetIds[0];

    if (!firstTargetId || firstTargetId.startsWith("canvas:")) {
      return;
    }

    window.requestAnimationFrame(() => {
      const pageElement = pageElementRef.current;

      if (!pageElement) {
        return;
      }

      const firstTarget = pageElement.querySelector<HTMLElement>(
        `[data-region-edit-target="${CSS.escape(firstTargetId)}"]`,
      );

      if (!firstTarget) {
        return;
      }

      if (
        firstTarget instanceof HTMLInputElement ||
        firstTarget instanceof HTMLTextAreaElement
      ) {
        firstTarget.focus({ preventScroll: true });
        firstTarget.select();
        return;
      }

      if (firstTarget.isContentEditable) {
        firstTarget.focus({ preventScroll: true });

        const selection = window.getSelection();
        const range = document.createRange();

        range.selectNodeContents(firstTarget);

        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });
  };

  useEffect(() => {
    if (!activeRegion) {
      return;
    }

    focusFirstRegionTarget();
  }, [activeRegion]);

  const annotationPointFromEvent = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    return {
      x: clampNumber(((event.clientX - rect.left) / width) * 100, 0, 100),
      y: clampNumber(((event.clientY - rect.top) / height) * 100, 0, 100),
    };
  };

  const createSelectionRect = (
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) => ({
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  });

  const releaseSelectionPointer = (
    element: HTMLDivElement,
    pointerId: number,
  ) => {
    try {
      if (element.hasPointerCapture(pointerId)) {
        element.releasePointerCapture(pointerId);
      }
    } catch {
      // already released
    }
  };

  const handleRegionPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isMeasurement || !regionSelectMode || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const point = annotationPointFromEvent(event);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // optional
    }

    setSelectionPointerId(event.pointerId);
    setSelectionStart(point);

    setSelectionRect({
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
    });

    setActiveRegion(null);
  };

  const handleRegionPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (selectionPointerId !== event.pointerId || !selectionStart) {
      return;
    }

    event.preventDefault();

    setSelectionRect(
      createSelectionRect(selectionStart, annotationPointFromEvent(event)),
    );
  };

  const finishRegionSelection = (event: PointerEvent<HTMLDivElement>) => {
    if (selectionPointerId !== event.pointerId || !selectionStart) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const finalPoint = annotationPointFromEvent(event);

    const rawRect = createSelectionRect(selectionStart, finalPoint);

    const selectionHostRect = event.currentTarget.getBoundingClientRect();

    let finalRect = rawRect;

    const pageElement = pageElementRef.current;

    let allTargetIds = pageElement
      ? collectRegionTargetIds(pageElement, rawRect, selectionHostRect)
      : [];

    if (allTargetIds.length === 0) {
      const centerX =
        selectionHostRect.left +
        ((rawRect.x + rawRect.width / 2) / 100) * selectionHostRect.width;

      const centerY =
        selectionHostRect.top +
        ((rawRect.y + rawRect.height / 2) / 100) * selectionHostRect.height;

      const hit = document.elementFromPoint(centerX, centerY);

      const targetEl = hit?.closest<HTMLElement>("[data-region-edit-target]");

      const id = targetEl?.dataset.regionEditTarget;

      if (id && !STRUCTURAL_BLOCK_IDS.has(id)) {
        allTargetIds = [id];

        const tr = targetEl!.getBoundingClientRect();

        finalRect = {
          x: clampNumber(
            ((tr.left - selectionHostRect.left) / selectionHostRect.width) *
              100,
            0,
            100,
          ),
          y: clampNumber(
            ((tr.top - selectionHostRect.top) / selectionHostRect.height) * 100,
            0,
            100,
          ),
          width: clampNumber(
            (tr.width / selectionHostRect.width) * 100,
            1,
            100,
          ),
          height: clampNumber(
            (tr.height / selectionHostRect.height) * 100,
            1,
            100,
          ),
        };
      }
    }

    if (allTargetIds.length === 0) {
      const isTiny = rawRect.width < 1.25 || rawRect.height < 1.25;

      if (isTiny) {
        const cx = rawRect.x + rawRect.width / 2;

        const cy = rawRect.y + rawRect.height / 2;

        finalRect = {
          x: clampNumber(cx - 6, 0, 88),
          y: clampNumber(cy - 3, 0, 92),
          width: 12,
          height: 6,
        };
      }
    }

    const primaryTargetId = allTargetIds[0];

    if (primaryTargetId) {
      setActiveRegion({
        id: makeRegionId(),
        x: finalRect.x,
        y: finalRect.y,
        width: finalRect.width,
        height: finalRect.height,
        targetIds: [primaryTargetId],
      });

      onRegionSelectionTargets?.([primaryTargetId]);
      onSetRegionSelectMode?.(false);
    } else {
      const currentPageIndex = pageIndex;

      if (currentPageIndex == null) {
        releaseSelectionPointer(event.currentTarget, event.pointerId);

        setSelectionPointerId(null);
        setSelectionStart(null);
        setSelectionRect(null);
        return;
      }

      const annotationId = onCreateRegionAnnotation?.(
        currentPageIndex,
        finalRect.x,
        finalRect.y,
        finalRect.width,
        finalRect.height,
      );

      if (annotationId) {
        const targetId = `canvas:${annotationId}`;

        setActiveRegion({
          id: makeRegionId(),
          x: finalRect.x,
          y: finalRect.y,
          width: finalRect.width,
          height: finalRect.height,
          targetIds: [targetId],
        });

        onRegionSelectionTargets?.([targetId]);
        onSetRegionSelectMode?.(false);
      }
    }

    releaseSelectionPointer(event.currentTarget, event.pointerId);

    setSelectionPointerId(null);
    setSelectionStart(null);
    setSelectionRect(null);
  };

  const cancelRegionSelection = (event: PointerEvent<HTMLDivElement>) => {
    if (selectionPointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    releaseSelectionPointer(event.currentTarget, event.pointerId);

    setSelectionPointerId(null);
    setSelectionStart(null);
    setSelectionRect(null);
  };

  const clearActiveRegion = () => {
    if (activeRegion) {
      const nonCanvasTargetIds = activeRegion.targetIds.filter(
        (targetId) => !targetId.startsWith("canvas:"),
      );

      const pageElement = pageElementRef.current;

      if (nonCanvasTargetIds.length && pageElement) {
        commitRegionTargetsByIds(
          pageElement,
          nonCanvasTargetIds,
          onRegionTargetCommit,
        );
      }
    }

    setActiveRegion(null);
  };

  const activateCanvasAnnotation = (annotationId: string) => {
    const annotation = annotations.find((item) => item.id === annotationId);

    if (!annotation) {
      return;
    }

    const targetId = `canvas:${annotationId}`;

    setActiveRegion({
      id: makeRegionId(),
      x: annotation.x,
      y: annotation.y,
      width: annotation.width,
      height: annotation.height,
      targetIds: [targetId],
    });

    onRegionSelectionTargets?.([targetId]);
  };

  return (
    <article
      {...measurementAttributes}
      data-joint-page-index={pageIndex ?? undefined}
      data-joint-screen-paper={isMeasurement ? undefined : "true"}
      ref={pageElementRef}
      onClick={onActivate}
      onBlur={(event) => {
        if (isMeasurement) {
          return;
        }

        const next = event.relatedTarget as Node | null;

        if (!next || !event.currentTarget.contains(next)) {
          if (
            activeRegion &&
            !activeRegion.targetIds.some((targetId) =>
              targetId.startsWith("canvas:"),
            )
          ) {
            const pageElement = pageElementRef.current;

            if (pageElement) {
              commitRegionTargetsByIds(
                pageElement,
                activeRegion.targetIds,
                onRegionTargetCommit,
              );
            }

            setActiveRegion(null);
          }
        }
      }}
      onDragOver={(event) => {
        if (!isMeasurement && pageIndex != null && pageCount && onDropOnPage) {
          event.preventDefault();
        }
      }}
      onDrop={(event) => {
        if (!isMeasurement && pageIndex != null && pageCount && onDropOnPage) {
          onDropOnPage(event, pageIndex);
        }
      }}
      className={`paper-screen-sheet ${paperClass} ${jointFixedClass} relative rounded-sm border bg-white shadow-[0_12px_30px_rgba(17,24,39,0.08)] ${padding} ${
        isActive
          ? "border-[#F3A847] ring-2 ring-[#F3A847]/30"
          : "border-[#E5E7EB]"
      } ${onActivate ? "cursor-pointer" : ""}`}
      style={{
        fontFamily:
          '"Noto Sans Bengali", "Noto Serif Bengali", "SolaimanLipi", Arial, sans-serif',
        ...(isMeasurement
          ? {
              width: "520px",
              height: "735px",
              minHeight: "735px",
              maxHeight: "735px",
              visibility: "hidden" as const,
              pointerEvents: "none" as const,
            }
          : {
              minHeight: pageSize === "A5" ? "520px" : "735px",
            }),
      }}
    >
      <div
        className={`paper-sheet-content flex h-full min-h-0 flex-col`}
        style={
          regionSelectMode
            ? {
                pointerEvents: "none",
                userSelect: "none",
              }
            : undefined
        }
      >
        <PaperHeader
          showHeader={showHeader}
          hiddenRegionBlockIds={hiddenRegionBlockIds}
          fontSize={fontSize}
          logoUrl={logoUrl}
          institutionName={institutionName}
          setInstitutionName={setInstitutionName}
          examName={examName}
          setExamName={setExamName}
          selectedSubject={selectedSubject}
          selectedClass={selectedClass}
          selectedChapter={selectedChapter}
          timeText={timeText}
          totalMarks={totalMarks}
          setNoEnabled={setNoEnabled}
          setNo={setNo}
          headerNoteEnabled={headerNoteEnabled}
          headerNote={headerNote}
          activeRegionTargetIds={activeRegionTargetIds}
          canvasTextOverrides={canvasTextOverrides}
          isRegionBlockActive={isRegionBlockActive}
          handleRegionBlockInput={handleRegionBlockInput}
          handleRegionBlockBlur={handleRegionBlockBlur}
          handleRegionBlockFocus={handleRegionBlockFocus}
          onRegionTargetCommit={onRegionTargetCommit}
          readEditableText={readEditableText}
        />

        <div
          data-paper-question-area="true"
          className={`mt-2 min-h-0 flex-1 overflow-hidden [scrollbar-width:none] ${
            layoutColumns === 2 ? "columns-2 gap-4" : ""
          }`}
          style={
            layoutColumns === 2
              ? {
                  columnFill: "auto",
                  columnGap: "16px",
                  height: "100%",
                  minHeight: 0,
                }
              : undefined
          }
        >
          {visibleGroups.map((group) => (
            <QuestionGroup
              key={group.type}
              group={group}
              layoutColumns={layoutColumns}
              paperGap={paperGap}
              hiddenRegionBlockIds={hiddenRegionBlockIds}
              activeRegionTargetIds={activeRegionTargetIds}
              canvasTextOverrides={canvasTextOverrides}
              isRegionBlockActive={isRegionBlockActive}
              handleRegionBlockInput={handleRegionBlockInput}
              handleRegionBlockBlur={handleRegionBlockBlur}
              handleRegionBlockFocus={handleRegionBlockFocus}
              questionNumberMap={questionNumberMap}
              fontSize={fontSize}
              styleVariant={styleVariant}
              onRemove={onRemove}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              dragOverId={dragOverId}
              editingMarkId={editingMarkId}
              setEditingMarkId={setEditingMarkId}
              updateQuestionMark={updateQuestionMark}
              selectAnswerEnabled={selectAnswerEnabled}
              answerSelections={answerSelections}
              setAnswerSelections={setAnswerSelections}
              jointPage={jointPage}
              pageIndex={pageIndex}
              pageCount={pageCount}
              onMoveToPage={onMoveToPage}
              activeQuestionId={activeQuestionId}
              editingQuestionId={editingQuestionId}
              onStartQuestionEdit={onStartQuestionEdit}
              onUpdateQuestion={onUpdateQuestion}
              onReplaceQuestion={onReplaceQuestion}
              replacementCandidates={replacementCandidates}
              onSetActiveQuestion={onSetActiveQuestion}
              onRegionTargetCommit={onRegionTargetCommit}
              onRegionBlockEmpty={(blockId, question) => {
                setHiddenRegionBlockIds((current) => {
                  if (current.has(blockId)) {
                    return current;
                  }

                  const next = new Set(current);

                  next.add(blockId);

                  return next;
                });

                setActiveRegion((current) =>
                  current?.targetIds.includes(blockId) ? null : current,
                );

                onRemove(question);
              }}
              questionLayoutById={questionLayoutById}
              onAdjustQuestionLayout={onAdjustQuestionLayout}
            />
          ))}
        </div>

        {showFooter && !hiddenRegionBlockIds.has("paper:footer-block") ? (
          <footer
            data-paper-footer="true"
            data-region-edit-target="paper:footer-block"
            contentEditable={isRegionBlockActive("paper:footer-block")}
            suppressContentEditableWarning
            onInput={(event) =>
              handleRegionBlockInput("paper:footer-block", event.currentTarget)
            }
            onBlur={(event) =>
              handleRegionBlockBlur(event, "paper:footer-block")
            }
            onFocus={() => handleRegionBlockFocus("paper:footer-block")}
            onPointerDown={(event) => {
              if (isRegionBlockActive("paper:footer-block")) {
                event.stopPropagation();
              }
            }}
            className="mt-2 border-t border-gray-200 pt-1.5 text-center text-[8px] text-gray-400"
          >
            <span
              data-region-edit-target="paper:footer"
              contentEditable={activeRegionTargetIds.has("paper:footer")}
              suppressContentEditableWarning
              onPointerDown={(event) => {
                if (activeRegionTargetIds.has("paper:footer")) {
                  event.stopPropagation();
                }
              }}
              onClick={(event) => {
                if (activeRegionTargetIds.has("paper:footer")) {
                  event.stopPropagation();
                }
              }}
              onBlur={(event) => {
                if (
                  !isRegionBlockActive("paper:footer-block") &&
                  activeRegionTargetIds.has("paper:footer")
                ) {
                  onRegionTargetCommit?.(
                    "paper:footer",
                    readEditableText(event.currentTarget),
                  );
                }
              }}
              className={
                activeRegionTargetIds.has("paper:footer") ? "outline-none" : ""
              }
            >
              {Object.prototype.hasOwnProperty.call(
                canvasTextOverrides,
                "paper:footer",
              )
                ? canvasTextOverrides["paper:footer"]
                : footerText}
            </span>
          </footer>
        ) : null}
      </div>

      {pageIndex != null && !isMeasurement ? (
        <RegionSelectionOverlay
          pageIndex={pageIndex}
          pageCount={pageCount}
          activeRegion={activeRegion}
          selectionRect={selectionRect}
          regionSelectMode={regionSelectMode}
          onClearActiveRegion={clearActiveRegion}
          onPointerDown={handleRegionPointerDown}
          onPointerMove={handleRegionPointerMove}
          onPointerUp={finishRegionSelection}
          onPointerCancel={cancelRegionSelection}
          onRegionTargetCommit={onRegionTargetCommit}
          canvasTextOverrides={canvasTextOverrides}
          annotations={annotations}
          onCreateRegionAnnotation={onCreateRegionAnnotation}
          onUpdateRegionAnnotation={onUpdateRegionAnnotation}
          onDeleteRegionAnnotation={onDeleteRegionAnnotation}
          onRegionSelectionTargets={onRegionSelectionTargets}
          onActivateCanvasAnnotation={activateCanvasAnnotation}
        />
      ) : null}
    </article>
  );
}
