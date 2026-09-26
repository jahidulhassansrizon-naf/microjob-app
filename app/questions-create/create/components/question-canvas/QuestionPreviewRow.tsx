"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type DragEvent,
  type FocusEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import katex from "katex";
import { Check, GripVertical, Move, Pencil, Trash2 } from "lucide-react";
import type { JointPage, Question, QuestionLayout } from "../../types/question";
import {
  BENGALI_OPTION_LABELS,
  DEFAULT_QUESTION_LAYOUT,
  DELIMITED_MATH_REGEX,
  RAW_LATEX_COMMAND_REGEX,
  clampNumber,
  cleanMultilineText,
  getOptionLabel,
  getQuestionTypeLabel,
} from "../../types/question";
import {
  commitRegionTargetsByIds,
  getQuestionCanvasTargetIds,
  readCanvasRegionText,
  readEditableText,
  shouldCommitRegionBlur,
} from "./RegionSelectionOverlay";
import QuestionEditForm from "./QuestionEditForm";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeLatex(value: string): string {
  return value.replace(/\\ineq\b/g, "\\neq").replace(/\u2212/g, "-");
}

function findMatchingBrace(text: string, openIndex: number): number {
  if (text[openIndex] !== "{") return -1;
  let depth = 0;
  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index];
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function renderKatex(source: string, displayMode = false): string {
  const normalized = normalizeLatex(source.trim());
  if (!normalized) return "";
  try {
    const rendered = katex.renderToString(normalized, {
      displayMode,
      throwOnError: false,
      output: "mathml",
      strict: "ignore",
    });
    return displayMode
      ? `<span class="katex-math-display" data-math-rendered="true">${rendered}</span>`
      : `<span class="katex-math-inline" data-math-rendered="true">${rendered}</span>`;
  } catch {
    return `<span>${escapeHtml(source)}</span>`;
  }
}

function parseRawLatexAt(
  text: string,
  index: number,
): { html: string; end: number } | null {
  const remaining = text.slice(index);
  const fracMatch = remaining.match(/^\\(?:frac|dfrac|tfrac)\s*/);
  if (fracMatch) {
    let cursor = index + fracMatch[0].length;
    while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1;
    if (text[cursor] !== "{") return null;
    const numeratorEnd = findMatchingBrace(text, cursor);
    if (numeratorEnd < 0) return null;
    let secondStart = numeratorEnd + 1;
    while (secondStart < text.length && /\s/.test(text[secondStart]))
      secondStart += 1;
    if (text[secondStart] !== "{") return null;
    const denominatorEnd = findMatchingBrace(text, secondStart);
    if (denominatorEnd < 0) return null;
    const numerator = text.slice(cursor + 1, numeratorEnd);
    const denominator = text.slice(secondStart + 1, denominatorEnd);
    const command = normalizeLatex(
      text.slice(index, index + fracMatch[0].trimEnd().length),
    ).split(/\s+/)[0];
    return {
      html: renderKatex(`${command}{${numerator}}{${denominator}}`),
      end: denominatorEnd + 1,
    };
  }
  const sqrtMatch = remaining.match(/^\\sqrt(?:\s*)/);
  if (sqrtMatch) {
    let cursor = index + sqrtMatch[0].length;
    let rootDegree = "";
    while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1;
    if (text[cursor] === "[") {
      const closing = text.indexOf("]", cursor + 1);
      if (closing < 0) return null;
      rootDegree = text.slice(cursor + 1, closing);
      cursor = closing + 1;
      while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1;
    }
    if (text[cursor] !== "{") return null;
    const radicandEnd = findMatchingBrace(text, cursor);
    if (radicandEnd < 0) return null;
    const radicand = text.slice(cursor + 1, radicandEnd);
    const source = rootDegree
      ? `\\sqrt[${rootDegree}]{${radicand}}`
      : `\\sqrt{${radicand}}`;
    return { html: renderKatex(source), end: radicandEnd + 1 };
  }
  const commandMatch = remaining.match(
    /^\\(?:leq?|geq?|neq|ineq|times|cdot|div|pm|mp|approx|sim|equiv|infty|pi|theta|alpha|beta|gamma|delta|Delta|Omega|sum|prod|int|partial|to|rightarrow|Rightarrow|leftarrow|subset|subseteq|supset|supseteq|in|notin|forall|exists)\b/,
  );
  if (commandMatch) {
    return {
      html: renderKatex(normalizeLatex(commandMatch[0])),
      end: index + commandMatch[0].length,
    };
  }
  return null;
}

function renderRawLatexText(text: string): string {
  let html = "";
  let cursor = 0;
  while (cursor < text.length) {
    const match = text.slice(cursor).match(RAW_LATEX_COMMAND_REGEX);
    if (!match || match.index == null) {
      html += escapeHtml(text.slice(cursor));
      break;
    }
    const start = cursor + match.index;
    if (start > cursor) html += escapeHtml(text.slice(cursor, start));
    const parsed = parseRawLatexAt(text, start);
    if (!parsed) {
      html += escapeHtml(text[start]);
      cursor = start + 1;
      continue;
    }
    html += parsed.html;
    cursor = parsed.end;
  }
  return html.replace(/\r?\n/g, "<br />");
}

function renderQuestionText(text: string): string {
  const normalizedText = normalizeLatex(text);
  const matches = Array.from(normalizedText.matchAll(DELIMITED_MATH_REGEX));
  if (!matches.length) return renderRawLatexText(normalizedText);
  let html = "";
  let cursor = 0;
  for (const match of matches) {
    const fullMatch = match[0];
    if (match.index == null) continue;
    const start = match.index;
    if (start > cursor)
      html += renderRawLatexText(normalizedText.slice(cursor, start));
    let source = fullMatch;
    let displayMode = false;
    if (source.startsWith("$$") && source.endsWith("$$")) {
      displayMode = true;
      source = source.slice(2, -2);
    } else if (source.startsWith("\\[") && source.endsWith("\\]")) {
      displayMode = true;
      source = source.slice(2, -2);
    } else if (source.startsWith("\\(") && source.endsWith("\\)")) {
      source = source.slice(2, -2);
    } else if (source.startsWith("$") && source.endsWith("$")) {
      source = source.slice(1, -1);
    }
    html += renderKatex(source, displayMode);
    cursor = start + fullMatch.length;
  }
  if (cursor < normalizedText.length)
    html += renderRawLatexText(normalizedText.slice(cursor));
  return html;
}

function MathText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const html = useMemo(() => renderQuestionText(text), [text]);
  return (
    <span
      className={className}
      data-math-content="true"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function questionNumberMapForReplacement(
  candidate: Question,
  currentQuestionNumber: number,
): string {
  const typeLabel = getQuestionTypeLabel(candidate.type);
  const compact = cleanMultilineText(candidate.question, 90).replace(
    /\s+/g,
    " ",
  );
  const currentMarker = candidate.id
    ? compact
    : `Question ${currentQuestionNumber}`;
  return `${typeLabel} · ${currentMarker}`;
}

export default function QuestionPreviewRow({
  question,
  questionNumber,
  fontSize,
  isDragOver,
  styleVariant,
  onRemove,
  jointPage,
  currentPageIndex,
  pageCount,
  onMoveToPage,
  activeQuestionId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  editingMarkId,
  setEditingMarkId,
  updateQuestionMark,
  selectAnswerEnabled,
  answerSelections,
  setAnswerSelections,
  questionLayout = DEFAULT_QUESTION_LAYOUT,
  onAdjustQuestionLayout,
  editingQuestionId,
  onStartQuestionEdit,
  onUpdateQuestion,
  onReplaceQuestion,
  replacementCandidates = [],
  onSetActiveQuestion,
  activeRegionTargetIds = new Set<string>(),
  onRegionTargetCommit,
  onRegionBlockEmpty,
  canvasTextOverrides = {},
}: {
  key?: string;
  question: Question;
  questionNumber: number;
  fontSize: number;
  isDragOver: boolean;
  styleVariant: "Classic" | "Compact";
  onRemove: () => void;
  jointPage?: JointPage;
  currentPageIndex?: number;
  pageCount?: number;
  onMoveToPage?: (questionId: string, targetPage: number) => void;
  activeQuestionId?: string | null;
  onDragStart: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  editingMarkId: string | null;
  setEditingMarkId: (id: string | null) => void;
  updateQuestionMark: (id: string, value: number) => void;
  selectAnswerEnabled: boolean;
  answerSelections: Record<string, string>;
  setAnswerSelections: Dispatch<SetStateAction<Record<string, string>>>;
  questionLayout?: QuestionLayout;
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
  activeRegionTargetIds?: Set<string>;
  onRegionTargetCommit?: (targetId: string, value: string) => void;
  onRegionBlockEmpty?: (blockId: string) => void;
  canvasTextOverrides?: Record<string, string>;
}) {
  const isEditing = editingQuestionId === question.id;
  const isActive = activeQuestionId === question.id;
  const [draft, setDraft] = useState<Question>(question);
  const [showControls, setShowControls] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [moveOffsetX, setMoveOffsetX] = useState<number | null>(null);
  const [resizeScale, setResizeScale] = useState<number | null>(null);
  const resizeScaleRef = useRef<number | null>(null);
  const resizeBaseRef = useRef<{
    centerX: number;
    centerY: number;
    halfWidth: number;
    halfHeight: number;
    baseScale: number;
  } | null>(null);
  const resizeFrameRef = useRef<HTMLDivElement | null>(null);
  const moveOffsetRef = useRef<number | null>(null);
  const moveBaseRef = useRef<{
    startClientX: number;
    startOffsetX: number;
    containerWidth: number;
    boxScale: number;
  } | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const regionBlockId = `question:${question.id}:block`;
  const regionBlockActive = activeRegionTargetIds.has(regionBlockId);

  const handleRegionRowInput = (event: FormEvent<HTMLElement>) => {
    if (!regionBlockActive) return;
    if (readCanvasRegionText(event.currentTarget)) return;
    onRegionBlockEmpty?.(regionBlockId);
  };

  const handleRegionRowBlur = (event: FocusEvent<HTMLElement>) => {
    if (!regionBlockActive || !shouldCommitRegionBlur(event)) return;
    commitRegionTargetsByIds(
      event.currentTarget,
      getQuestionCanvasTargetIds(question),
      onRegionTargetCommit,
    );
  };

  useEffect(() => {
    if (!isEditing) {
      setDraft(question);
    }
  }, [isEditing, question]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    resizeBaseRef.current = null;
    resizeScaleRef.current = null;
    moveBaseRef.current = null;
    moveOffsetRef.current = null;
    setResizeScale(null);
    setMoveOffsetX(null);
    setIsResizing(false);
    setIsMoving(false);
  }, [isEditing]);

  useEffect(
    () => () => {
      resizeBaseRef.current = null;
      resizeScaleRef.current = null;
      moveBaseRef.current = null;
      moveOffsetRef.current = null;
    },
    [],
  );

  // Portals can only render once we're on the client (document must exist),
  // so we wait for mount rather than rendering createPortal during SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Clicking outside the question clears its active state. The resize handles
  // remain available on hover (or during an active drag), so simply selecting
  // or editing a question can never leave a stale box/handles behind.
  useEffect(() => {
    if (!isActive || isEditing) {
      return;
    }

    const handleOutsidePointerDown = (event: globalThis.PointerEvent) => {
      const row = rowRef.current;
      const target = event.target;

      if (!row || !(target instanceof Node)) {
        return;
      }

      if (!row.contains(target)) {
        onSetActiveQuestion?.(null);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
    };
  }, [isActive, isEditing, onSetActiveQuestion]);

  // Let Escape close the edit modal, same as clicking the backdrop / Cancel.
  useEffect(() => {
    if (!isEditing) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDraft(question);
        onStartQuestionEdit?.(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, question, onStartQuestionEdit]);

  const boxScale = clampNumber(
    resizeScale ?? questionLayout.boxScale ?? 100,
    55,
    135,
  );
  const boxScaleFactor = boxScale / 100;

  // The question's font and spacing follow the box scale together. This keeps
  // MCQ options, CQ stimulus text, marks and sub-parts visually proportional
  // while the user is resizing the question block.
  const scaledFontSize = clampNumber(
    fontSize * (questionLayout.fontScale / 100) * boxScaleFactor,
    7,
    40,
  );
  const detailFontSize = Math.max(7, scaledFontSize - 1);
  const effectiveSpacing = clampNumber(
    questionLayout.spacing * boxScaleFactor,
    0,
    16,
  );
  const extraSpacing = clampNumber(effectiveSpacing - 4, -4, 12);
  const questionBoxWidth = `${Math.min(100, boxScale)}%`;

  const getInitialResizeScale = () =>
    clampNumber(questionLayout.boxScale ?? 100, 55, 135);

  const getInitialMoveOffsetX = () =>
    clampNumber(questionLayout.offsetX ?? 0, -22.5, 22.5);

  const getMoveBounds = (scale: number) => {
    const visibleWidth = Math.min(100, clampNumber(scale, 55, 135));
    const maxOffset = Math.max(0, (100 - visibleWidth) / 2);
    return { min: -maxOffset, max: maxOffset };
  };

  // Resize/move chrome is intentionally transient: it appears while the
  // pointer is over this question or while a drag is in progress. A previous
  // click/edit must never leave the resize box permanently visible.
  const showResizeUI = !isEditing && (showControls || isResizing || isMoving);
  const moveBounds = getMoveBounds(boxScale);
  const effectiveOffsetX = clampNumber(
    moveOffsetX ?? questionLayout.offsetX ?? 0,
    moveBounds.min,
    moveBounds.max,
  );

  const beginQuestionMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (
      isEditing ||
      isResizing ||
      !resizeFrameRef.current ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const frame = resizeFrameRef.current;
    const container = frame.parentElement;
    const containerWidth = Math.max(
      1,
      container?.getBoundingClientRect().width ??
        frame.parentElement?.getBoundingClientRect().width ??
        frame.getBoundingClientRect().width,
    );
    const scale = getInitialResizeScale();
    const startOffsetX = getInitialMoveOffsetX();

    moveBaseRef.current = {
      startClientX: event.clientX,
      startOffsetX,
      containerWidth,
      boxScale: scale,
    };
    moveOffsetRef.current = startOffsetX;
    setMoveOffsetX(startOffsetX);
    setIsMoving(true);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is optional.
    }
  };

  const handleQuestionMoveMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const base = moveBaseRef.current;
    if (!base || !isMoving) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const deltaPercent =
      ((event.clientX - base.startClientX) / base.containerWidth) * 100;
    const bounds = getMoveBounds(base.boxScale);
    const nextOffset = clampNumber(
      base.startOffsetX + deltaPercent,
      bounds.min,
      bounds.max,
    );

    moveOffsetRef.current = nextOffset;
    setMoveOffsetX(nextOffset);
  };

  const finishQuestionMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const base = moveBaseRef.current;
    if (!base || !isMoving) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released.
    }

    const bounds = getMoveBounds(base.boxScale);
    const finalOffsetX = clampNumber(
      moveOffsetRef.current ?? moveOffsetX ?? base.startOffsetX,
      bounds.min,
      bounds.max,
    );
    const committedOffsetX = clampNumber(
      questionLayout.offsetX ?? 0,
      bounds.min,
      bounds.max,
    );

    if (Math.abs(finalOffsetX - committedOffsetX) > 0.01) {
      onAdjustQuestionLayout?.(
        question.id,
        "offsetX",
        finalOffsetX - committedOffsetX,
      );
    }

    moveBaseRef.current = null;
    moveOffsetRef.current = null;
    setMoveOffsetX(null);
    setIsMoving(false);
  };

  const cancelQuestionMove = () => {
    moveBaseRef.current = null;
    moveOffsetRef.current = null;
    setMoveOffsetX(null);
    setIsMoving(false);
  };

  const beginQuestionResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (isEditing || !resizeFrameRef.current || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = resizeFrameRef.current.getBoundingClientRect();
    const halfWidth = Math.max(8, rect.width / 2);
    const halfHeight = Math.max(8, rect.height / 2);

    resizeBaseRef.current = {
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      halfWidth,
      halfHeight,
      baseScale: getInitialResizeScale(),
    };

    const initialScale = getInitialResizeScale();
    resizeScaleRef.current = initialScale;
    setResizeScale(initialScale);
    setIsMoving(false);
    moveBaseRef.current = null;
    moveOffsetRef.current = null;
    setMoveOffsetX(null);
    setIsResizing(true);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is optional; React will still receive the local events.
    }
  };

  const handleQuestionResizeMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const base = resizeBaseRef.current;
    if (!base || !isResizing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const horizontalRatio =
      Math.abs(event.clientX - base.centerX) / base.halfWidth;
    const verticalRatio =
      Math.abs(event.clientY - base.centerY) / base.halfHeight;

    const ratio = Math.max(
      Number.isFinite(horizontalRatio) ? horizontalRatio : 1,
      Number.isFinite(verticalRatio) ? verticalRatio : 1,
    );

    const nextScale = clampNumber(base.baseScale * ratio, 55, 135);
    resizeScaleRef.current = nextScale;
    setResizeScale(nextScale);
  };

  const finishQuestionResize = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const base = resizeBaseRef.current;
    if (!base || !isResizing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already have been released.
    }

    const finalScale = clampNumber(
      resizeScaleRef.current ?? resizeScale ?? base.baseScale,
      55,
      135,
    );
    const committedScale = clampNumber(questionLayout.boxScale ?? 100, 55, 135);

    if (Math.abs(finalScale - committedScale) > 0.01) {
      onAdjustQuestionLayout?.(
        question.id,
        "boxScale",
        finalScale - committedScale,
      );
    }

    resizeBaseRef.current = null;
    resizeScaleRef.current = null;
    setResizeScale(null);
    setIsResizing(false);
  };

  const cancelQuestionResize = () => {
    resizeBaseRef.current = null;
    resizeScaleRef.current = null;
    setResizeScale(null);
    setIsResizing(false);
  };

  const beginEdit = () => {
    setDraft(question);
    onSetActiveQuestion?.(question.id);
    onStartQuestionEdit?.(question.id);
  };

  const saveEdit = () => {
    const cleanedQuestion = {
      ...draft,
      question: cleanMultilineText(draft.question, 4000),
      stimulus:
        draft.type === "CQ"
          ? cleanMultilineText(draft.stimulus, 4000)
          : undefined,
      options:
        draft.type === "MCQ"
          ? (draft.options || []).map((option) => option.trim()).filter(Boolean)
          : undefined,
      subQuestions:
        draft.type === "CQ"
          ? (draft.subQuestions || []).map((part) => ({
              ...part,
              question: cleanMultilineText(part.question, 2000),
              label: part.label.trim(),
              marks: Math.max(
                1,
                Math.min(10, Math.round(Number(part.marks) || 1)),
              ),
              answer: part.answer?.trim() || undefined,
            }))
          : undefined,
    };
    if (!cleanedQuestion.question) {
      return;
    }
    onUpdateQuestion?.(cleanedQuestion);
    onSetActiveQuestion?.(cleanedQuestion.id);
  };

  const handleReplace = (replacementId: string) => {
    const replacement = replacementCandidates.find(
      (candidate) => candidate.id === replacementId,
    );
    if (!replacement || replacement.id === question.id) {
      return;
    }
    onReplaceQuestion?.(question.id, replacement);
    setShowReplace(false);
  };

  const handleRowClick = () => {
    onSetActiveQuestion?.(question.id);
  };

  return (
    <div
      ref={rowRef}
      data-joint-measure-question="true"
      data-question-id={question.id}
      data-region-edit-target={regionBlockId}
      contentEditable={regionBlockActive}
      suppressContentEditableWarning
      onInput={handleRegionRowInput}
      onBlur={handleRegionRowBlur}
      draggable={!isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onDoubleClick={beginEdit}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={handleRowClick}
      className={`paper-question-row group relative rounded-sm border border-transparent px-1.5 transition ${
        isDragOver
          ? "border-dashed border-[#F3A847] bg-orange-50/30"
          : "hover:bg-gray-50"
      } ${isEditing ? "bg-orange-50/30 ring-1 ring-[#F3A847]/30" : ""}`}
      style={{
        paddingTop: `${Math.max(0, 2 + extraSpacing / 2)}px`,
        paddingBottom: `${Math.max(0, 2 + extraSpacing / 2)}px`,
      }}
    >
      <div className="flex items-start gap-2">
        <GripVertical
          size={10}
          data-print-control="true"
          className="mt-1 shrink-0 cursor-grab text-gray-300 opacity-0 transition group-hover:opacity-100 print:hidden"
        />
        <div className="relative min-w-0 flex-1">
          <div
            ref={resizeFrameRef}
            className="relative mx-auto min-w-0 transition-[width] duration-75 ease-out"
            style={{
              width: questionBoxWidth,
              left: `${effectiveOffsetX}%`,
            }}
          >
            <div
              className={
                showResizeUI
                  ? "relative rounded-[4px] ring-1 ring-[#F3A847]/20"
                  : "relative"
              }
            >
              {/* Preview is ALWAYS rendered so the row height stays stable
              and the column / pagination layout never breaks while editing. */}
              <div
                className={
                  isEditing ? "pointer-events-none select-none opacity-60" : ""
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`${
                        styleVariant === "Compact"
                          ? "font-semibold"
                          : "font-bold"
                      } min-w-0 cursor-text text-gray-800`}
                      style={{
                        fontSize: `${scaledFontSize}px`,
                        lineHeight: 1.45,
                      }}
                      title="Double-click to edit"
                    >
                      <span
                        data-region-edit-target={`question:${question.id}:number`}
                      >
                        {Object.prototype.hasOwnProperty.call(
                          canvasTextOverrides,
                          `question:${question.id}:number`,
                        )
                          ? canvasTextOverrides[
                              `question:${question.id}:number`
                            ]
                          : questionNumber}
                      </span>
                      .{" "}
                      {question.type === "CQ" ? null : (
                        <span
                          data-region-edit-target={`question:${question.id}:question`}
                          contentEditable={activeRegionTargetIds.has(
                            `question:${question.id}:question`,
                          )}
                          suppressContentEditableWarning
                          onPointerDown={(event) => {
                            if (
                              activeRegionTargetIds.has(
                                `question:${question.id}:question`,
                              )
                            ) {
                              event.stopPropagation();
                            }
                          }}
                          onClick={(event) => {
                            if (
                              activeRegionTargetIds.has(
                                `question:${question.id}:question`,
                              )
                            ) {
                              event.stopPropagation();
                            }
                          }}
                          onBlur={(event) =>
                            !regionBlockActive &&
                            activeRegionTargetIds.has(
                              `question:${question.id}:question`,
                            ) &&
                            onRegionTargetCommit?.(
                              `question:${question.id}:question`,
                              readEditableText(event.currentTarget),
                            )
                          }
                          className={
                            activeRegionTargetIds.has(
                              `question:${question.id}:question`,
                            )
                              ? "outline-none"
                              : ""
                          }
                        >
                          {activeRegionTargetIds.has(
                            `question:${question.id}:question`,
                          ) ? (
                            question.question
                          ) : (
                            <MathText text={question.question} />
                          )}
                        </span>
                      )}
                    </p>
                    {question.type === "CQ" ? (
                      <div className="mt-1.5 space-y-1.5">
                        {question.stimulus ? (
                          <div
                            className="rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-gray-700"
                            style={{
                              fontSize: `${detailFontSize}px`,
                              lineHeight: 1.45,
                            }}
                          >
                            <span
                              className="font-extrabold"
                              data-region-edit-target={`question:${question.id}:stimulus-label`}
                            >
                              {Object.prototype.hasOwnProperty.call(
                                canvasTextOverrides,
                                `question:${question.id}:stimulus-label`,
                              )
                                ? canvasTextOverrides[
                                    `question:${question.id}:stimulus-label`
                                  ]
                                : "উদ্দীপক:"}
                            </span>{" "}
                            <span
                              data-region-edit-target={`question:${question.id}:stimulus`}
                              contentEditable={activeRegionTargetIds.has(
                                `question:${question.id}:stimulus`,
                              )}
                              suppressContentEditableWarning
                              onPointerDown={(event) => {
                                if (
                                  activeRegionTargetIds.has(
                                    `question:${question.id}:stimulus`,
                                  )
                                ) {
                                  event.stopPropagation();
                                }
                              }}
                              onClick={(event) => {
                                if (
                                  activeRegionTargetIds.has(
                                    `question:${question.id}:stimulus`,
                                  )
                                ) {
                                  event.stopPropagation();
                                }
                              }}
                              onBlur={(event) =>
                                !regionBlockActive &&
                                activeRegionTargetIds.has(
                                  `question:${question.id}:stimulus`,
                                ) &&
                                onRegionTargetCommit?.(
                                  `question:${question.id}:stimulus`,
                                  readEditableText(event.currentTarget),
                                )
                              }
                              className={
                                activeRegionTargetIds.has(
                                  `question:${question.id}:stimulus`,
                                )
                                  ? "outline-none"
                                  : ""
                              }
                            >
                              {activeRegionTargetIds.has(
                                `question:${question.id}:stimulus`,
                              ) ? (
                                question.stimulus
                              ) : (
                                <MathText text={question.stimulus} />
                              )}
                            </span>
                          </div>
                        ) : null}
                        {question.subQuestions?.map((part, partIndex) => (
                          <div
                            key={`${question.id}-part-${partIndex}`}
                            className="flex items-start gap-1.5 pl-1"
                            style={{
                              fontSize: `${detailFontSize}px`,
                              lineHeight: 1.4,
                            }}
                          >
                            <span
                              className="shrink-0 font-extrabold text-gray-700"
                              data-region-edit-target={`question:${question.id}:part-label:${partIndex}`}
                              contentEditable={activeRegionTargetIds.has(
                                `question:${question.id}:part-label:${partIndex}`,
                              )}
                              suppressContentEditableWarning
                              onPointerDown={(event) => {
                                if (
                                  activeRegionTargetIds.has(
                                    `question:${question.id}:part-label:${partIndex}`,
                                  )
                                ) {
                                  event.stopPropagation();
                                }
                              }}
                              onClick={(event) => {
                                if (
                                  activeRegionTargetIds.has(
                                    `question:${question.id}:part-label:${partIndex}`,
                                  )
                                ) {
                                  event.stopPropagation();
                                }
                              }}
                              onBlur={(event) =>
                                !regionBlockActive &&
                                activeRegionTargetIds.has(
                                  `question:${question.id}:part-label:${partIndex}`,
                                ) &&
                                onRegionTargetCommit?.(
                                  `question:${question.id}:part-label:${partIndex}`,
                                  readEditableText(event.currentTarget),
                                )
                              }
                            >
                              {part.label ||
                                BENGALI_OPTION_LABELS[partIndex] ||
                                String(partIndex + 1)}
                              .
                            </span>
                            <div className="min-w-0 flex-1">
                              <span
                                data-region-edit-target={`question:${question.id}:part:${partIndex}`}
                                contentEditable={activeRegionTargetIds.has(
                                  `question:${question.id}:part:${partIndex}`,
                                )}
                                suppressContentEditableWarning
                                onPointerDown={(event) => {
                                  if (
                                    activeRegionTargetIds.has(
                                      `question:${question.id}:part:${partIndex}`,
                                    )
                                  ) {
                                    event.stopPropagation();
                                  }
                                }}
                                onClick={(event) => {
                                  if (
                                    activeRegionTargetIds.has(
                                      `question:${question.id}:part:${partIndex}`,
                                    )
                                  ) {
                                    event.stopPropagation();
                                  }
                                }}
                                onBlur={(event) =>
                                  !regionBlockActive &&
                                  activeRegionTargetIds.has(
                                    `question:${question.id}:part:${partIndex}`,
                                  ) &&
                                  onRegionTargetCommit?.(
                                    `question:${question.id}:part:${partIndex}`,
                                    readEditableText(event.currentTarget),
                                  )
                                }
                                className={
                                  activeRegionTargetIds.has(
                                    `question:${question.id}:part:${partIndex}`,
                                  )
                                    ? "outline-none"
                                    : ""
                                }
                              >
                                {activeRegionTargetIds.has(
                                  `question:${question.id}:part:${partIndex}`,
                                ) ? (
                                  part.question
                                ) : (
                                  <MathText text={part.question} />
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    {editingMarkId === question.id ? (
                      <input
                        autoFocus
                        type="number"
                        min={1}
                        max={100}
                        defaultValue={question.marks || 1}
                        onBlur={(event) => {
                          updateQuestionMark(
                            question.id,
                            Number(event.target.value),
                          );
                          setEditingMarkId(null);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            updateQuestionMark(
                              question.id,
                              Number(
                                (event.currentTarget as HTMLInputElement).value,
                              ),
                            );
                            setEditingMarkId(null);
                          }
                          if (event.key === "Escape") {
                            setEditingMarkId(null);
                          }
                        }}
                        className="h-5 w-9 rounded border border-[#F3A847] px-1 text-center text-[8px] font-bold outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditingMarkId(question.id);
                        }}
                        className="cursor-pointer rounded px-1 text-[8px] font-bold text-gray-500 hover:bg-orange-50 hover:text-[#F3A847]"
                      >
                        <span
                          data-region-edit-target={`question:${question.id}:marks`}
                        >
                          {Object.prototype.hasOwnProperty.call(
                            canvasTextOverrides,
                            `question:${question.id}:marks`,
                          )
                            ? canvasTextOverrides[
                                `question:${question.id}:marks`
                              ]
                            : question.marks || 1}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
                {question.type === "MCQ" && question.options?.length ? (
                  <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 pl-2">
                    {question.options.map((option, index) => {
                      const selected = answerSelections[question.id] === option;
                      return (
                        <button
                          key={`${question.id}-option-${index}`}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!selectAnswerEnabled) return;
                            setAnswerSelections((current) => {
                              const next = { ...current };
                              if (next[question.id] === option)
                                delete next[question.id];
                              else next[question.id] = option;
                              return next;
                            });
                          }}
                          className={`flex items-start gap-1 text-left text-gray-600 ${
                            selectAnswerEnabled
                              ? "cursor-pointer"
                              : "cursor-default"
                          }`}
                          style={{
                            fontSize: `${detailFontSize}px`,
                            lineHeight: 1.35,
                          }}
                        >
                          <span
                            className={`mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border text-[6px] ${
                              selected
                                ? "border-[#F3A847] bg-[#F3A847] text-white"
                                : "border-gray-400 text-gray-500"
                            }`}
                            data-region-edit-target={`question:${question.id}:option-label:${index}`}
                          >
                            {Object.prototype.hasOwnProperty.call(
                              canvasTextOverrides,
                              `question:${question.id}:option-label:${index}`,
                            ) ? (
                              canvasTextOverrides[
                                `question:${question.id}:option-label:${index}`
                              ]
                            ) : selected ? (
                              <Check size={7} />
                            ) : (
                              getOptionLabel(index)
                            )}
                          </span>
                          <span
                            className="min-w-0"
                            data-region-edit-target={`question:${question.id}:option:${index}`}
                            contentEditable={activeRegionTargetIds.has(
                              `question:${question.id}:option:${index}`,
                            )}
                            suppressContentEditableWarning
                            onPointerDown={(event) => {
                              if (
                                activeRegionTargetIds.has(
                                  `question:${question.id}:option:${index}`,
                                )
                              ) {
                                event.stopPropagation();
                              }
                            }}
                            onClick={(event) => {
                              if (
                                activeRegionTargetIds.has(
                                  `question:${question.id}:option:${index}`,
                                )
                              ) {
                                event.stopPropagation();
                              }
                            }}
                            onBlur={(event) =>
                              !regionBlockActive &&
                              activeRegionTargetIds.has(
                                `question:${question.id}:option:${index}`,
                              ) &&
                              onRegionTargetCommit?.(
                                `question:${question.id}:option:${index}`,
                                readEditableText(event.currentTarget),
                              )
                            }
                          >
                            {activeRegionTargetIds.has(
                              `question:${question.id}:option:${index}`,
                            ) ? (
                              option
                            ) : (
                              <MathText text={option} />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            {showResizeUI ? (
              <div
                className="screen-only pointer-events-none absolute inset-0 z-50"
                data-print-control="true"
                aria-hidden="true"
              >
                <div className="absolute inset-0 rounded-[4px] border border-dashed border-[#F3A847]/60" />

                <button
                  type="button"
                  aria-label="Move question horizontally"
                  className="pointer-events-auto absolute left-1/2 top-[-8px] flex h-4 min-w-7 -translate-x-1/2 items-center justify-center rounded-full border border-white bg-[#F3A847] px-1 text-white shadow-[0_1px_4px_rgba(0,0,0,0.18)] cursor-move"
                  onPointerDown={beginQuestionMove}
                  onPointerMove={handleQuestionMoveMove}
                  onPointerUp={finishQuestionMove}
                  onPointerCancel={cancelQuestionMove}
                  onClick={(event) => event.stopPropagation()}
                  onDoubleClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                  title="Drag to move question left or right"
                >
                  <Move size={8} />
                </button>

                {(
                  [
                    ["nw", "left-[-5px] top-[-5px] cursor-nwse-resize"],
                    ["ne", "right-[-5px] top-[-5px] cursor-nesw-resize"],
                    ["sw", "left-[-5px] bottom-[-5px] cursor-nesw-resize"],
                    ["se", "right-[-5px] bottom-[-5px] cursor-nwse-resize"],
                  ] as const
                ).map(([corner, positionClass]) => (
                  <button
                    key={corner}
                    type="button"
                    aria-label={`Resize question ${corner.toUpperCase()} corner`}
                    className={`pointer-events-auto absolute h-2.5 w-2.5 rounded-full border border-white bg-[#F3A847] shadow-[0_1px_4px_rgba(0,0,0,0.18)] ${positionClass}`}
                    onPointerDown={beginQuestionResize}
                    onPointerMove={handleQuestionResizeMove}
                    onPointerUp={finishQuestionResize}
                    onPointerCancel={cancelQuestionResize}
                    onClick={(event) => event.stopPropagation()}
                    onDoubleClick={(event) => event.stopPropagation()}
                    onMouseDown={(event) => event.stopPropagation()}
                  />
                ))}
              </div>
            ) : null}

            {isResizing ? (
              <div
                className="screen-only pointer-events-none absolute left-1/2 top-[-20px] z-[60] -translate-x-1/2 rounded-full bg-gray-900/85 px-2 py-0.5 text-[7px] font-bold text-white"
                data-print-control="true"
              >
                {Math.round(boxScale)}%
              </div>
            ) : null}

            {/* Edit form used to float as an absolute overlay directly inside
              this row. That kept the row height stable, but the row still
              lives inside PaperSheet's `.joint-fixed-paper` container
              (fixed height: 735px + overflow: hidden), so any overlay tall
              enough to exceed the page just got silently clipped.
              Portaling into document.body escapes that ancestor entirely -
              the modal is centered in the viewport and scrolls internally
              (max-h-[85vh] overflow-y-auto), so it can never be cut off no
              matter how long the question / CQ sub-parts get. The row's own
              height still never changes while editing, since this renders
              outside the row's DOM subtree. */}
            {isEditing && mounted
              ? createPortal(
                  <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 print:hidden"
                    onMouseDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      setDraft(question);
                      onStartQuestionEdit?.(null);
                    }}
                  >
                    <div
                      className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg shadow-xl"
                      onClick={(event) => event.stopPropagation()}
                      onDoubleClick={(event) => event.stopPropagation()}
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      <QuestionEditForm
                        question={question}
                        questionNumber={questionNumber}
                        draft={draft}
                        setDraft={setDraft}
                        showReplace={showReplace}
                        setShowReplace={setShowReplace}
                        replacementCandidates={replacementCandidates}
                        onReplace={handleReplace}
                        onCancel={() => {
                          setDraft(question);
                          onStartQuestionEdit?.(null);
                        }}
                        onSave={saveEdit}
                      />
                    </div>
                  </div>,
                  document.body,
                )
              : null}
          </div>
          {/*
           * FIX: this toolbar used to show on `showControls || isActive`.
           * `isActive` stays true for the question you just saved (see
           * saveEdit() below), so after "Save changes" collapses the edit
           * form, that question's toolbar stayed forced open with no
           * hover. At the same instant, the sudden collapse moves the
           * next question's row up underneath the mouse pointer, and the
           * browser fires a real mouseenter on it - which opens ITS
           * toolbar too. Result: two toolbars visible at once right
           * after saving, which reads as "the layout broke".
           * `isActive` still drives the ring highlight below (search
           * `isActive` a few lines up) - only the forced toolbar is
           * removed, so highlighting the edited question is preserved.
           *
           * FIX 2: this toolbar used to render in-flow (a normal sibling
           * div), and `.paper-question-row` is a flex row, so appearing
           * on hover made it a second flex item competing for width with
           * the question content - the content column visibly shrank,
           * text rewrapped onto more lines, and every question below
           * jumped down. It's now `absolute`, pinned to the row's
           * top-right corner (the row itself is already `relative`), so
           * it floats on top of the content instead of squeezing it -
           * hover never changes the row's width or height anymore.
           */}
          {showControls && !isEditing ? (
            <div
              data-print-control="true"
              className="screen-only absolute right-1.5 top-0 z-40 flex max-w-[245px] flex-wrap items-center justify-end gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm"
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.preventDefault()}
            >
              <button
                type="button"
                onClick={beginEdit}
                className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[7px] font-bold text-gray-600 hover:bg-gray-50"
                title="Edit question"
              >
                <Pencil size={9} /> Edit
              </button>
              <button
                type="button"
                onClick={() =>
                  onAdjustQuestionLayout?.(question.id, "fontScale", -5)
                }
                className="h-6 rounded-md px-1.5 text-[7px] font-extrabold text-gray-600 hover:bg-gray-50"
                title="Decrease question font size"
              >
                A−
              </button>
              <button
                type="button"
                onClick={() =>
                  onAdjustQuestionLayout?.(question.id, "fontScale", 5)
                }
                className="h-6 rounded-md px-1.5 text-[7px] font-extrabold text-gray-600 hover:bg-gray-50"
                title="Increase question font size"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() =>
                  onAdjustQuestionLayout?.(question.id, "spacing", -1)
                }
                className="h-6 rounded-md px-1.5 text-[7px] font-extrabold text-gray-600 hover:bg-gray-50"
                title="Reduce spacing"
              >
                S−
              </button>
              <button
                type="button"
                onClick={() =>
                  onAdjustQuestionLayout?.(question.id, "spacing", 1)
                }
                className="h-6 rounded-md px-1.5 text-[7px] font-extrabold text-gray-600 hover:bg-gray-50"
                title="Increase spacing"
              >
                S+
              </button>
              {jointPage && onMoveToPage && pageCount ? (
                <select
                  value={currentPageIndex ?? 0}
                  onChange={(event) =>
                    onMoveToPage(question.id, Number(event.target.value))
                  }
                  className="h-6 max-w-[68px] rounded-md border border-gray-200 bg-white px-1 text-[7px] font-bold text-gray-600 outline-none"
                  title="Move question to page"
                >
                  {Array.from({ length: pageCount }, (_, index) => (
                    <option key={index} value={index}>
                      Page {index + 1}
                    </option>
                  ))}
                </select>
              ) : null}
              <button
                type="button"
                onClick={onRemove}
                className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[7px] font-bold text-red-500 hover:bg-red-50"
                title="Remove question"
              >
                <Trash2 size={9} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
