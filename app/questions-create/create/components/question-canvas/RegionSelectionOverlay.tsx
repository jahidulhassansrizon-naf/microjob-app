"use client";
import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
} from "react";
import { X } from "lucide-react";
import type { PaperAnnotation, Question } from "../../types/question";

export type RegionSelection = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetIds: string[];
};

export type RegionCommitTarget = {
  kind:
    | "institution"
    | "exam"
    | "setNo"
    | "headerNote"
    | "footer"
    | "subject"
    | "class"
    | "chapter"
    | "time"
    | "fullMarks"
    | "question"
    | "stimulus"
    | "part"
    | "partLabel"
    | "option"
    | "canvasText";
  questionId?: string;
  canvasKey?: string;
  partIndex?: number;
  optionIndex?: number;
};

export function rectsIntersect(
  first: DOMRect,
  second: { left: number; top: number; right: number; bottom: number },
): boolean {
  return !(
    first.right <= second.left ||
    first.left >= second.right ||
    first.bottom <= second.top ||
    first.top >= second.bottom
  );
}

export function readEditableText(element: HTMLElement): string {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return element.value
      .replace(/\u00a0/g, " ")
      .replace(/\r\n?/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  return (element.innerText || element.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function readCanvasRegionText(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll<HTMLElement>(
      '[data-print-control="true"], [data-region-selection-outline], [data-region-selection-helper="true"], [data-region-selection-editor="true"]',
    )
    .forEach((node) => node.remove());
  clone
    .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")
    .forEach((field) => {
      field.replaceWith(document.createTextNode(field.value || ""));
    });
  return (clone.innerText || clone.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function commitRegionDescendantTargets(
  element: HTMLElement,
  onCommit?: (targetId: string, value: string) => void,
): void {
  if (!onCommit) {
    return;
  }
  const targets = Array.from(
    element.querySelectorAll<HTMLElement>("[data-region-edit-target]"),
  );
  const seen = new Set<string>();
  targets.forEach((target) => {
    const targetId = target.dataset.regionEditTarget;
    if (!targetId || seen.has(targetId)) {
      return;
    }
    seen.add(targetId);
    if (!parseRegionTargetId(targetId)) {
      return;
    }
    onCommit(targetId, readEditableText(target));
  });
}

export function commitRegionTargetsByIds(
  element: HTMLElement,
  targetIds: string[],
  onCommit?: (targetId: string, value: string) => void,
): void {
  if (!onCommit) {
    return;
  }
  const seen = new Set<string>();
  targetIds.forEach((targetId) => {
    if (!targetId || seen.has(targetId) || !parseRegionTargetId(targetId)) {
      return;
    }
    seen.add(targetId);
    const target = element.querySelector<HTMLElement>(
      `[data-region-edit-target="${CSS.escape(targetId)}"]`,
    );
    onCommit(targetId, target ? readEditableText(target) : "");
  });
}

export function getQuestionCanvasTargetIds(question: Question): string[] {
  const ids = [
    `question:${question.id}:number`,
    `question:${question.id}:marks`,
  ];
  if (question.type === "CQ") {
    if (question.stimulus) {
      ids.push(
        `question:${question.id}:stimulus-label`,
        `question:${question.id}:stimulus`,
      );
    }
    (question.subQuestions || []).forEach((_, partIndex) => {
      ids.push(
        `question:${question.id}:part-label:${partIndex}`,
        `question:${question.id}:part:${partIndex}`,
      );
    });
  } else {
    ids.push(`question:${question.id}:question`);
  }
  if (question.type === "MCQ") {
    (question.options || []).forEach((_, index) => {
      ids.push(
        `question:${question.id}:option-label:${index}`,
        `question:${question.id}:option:${index}`,
      );
    });
  }
  return ids;
}

export function shouldCommitRegionBlur(
  event: FocusEvent<HTMLElement>,
): boolean {
  const relatedTarget = event.relatedTarget;
  if (!relatedTarget) {
    return true;
  }
  return !event.currentTarget.contains(relatedTarget as Node);
}

export function parseRegionTargetId(id: string): RegionCommitTarget | null {
  if (id === "paper:institution") return { kind: "institution" };
  if (id === "paper:exam") return { kind: "exam" };
  if (id === "paper:set-no") return { kind: "setNo" };
  if (id === "paper:header-note") return { kind: "headerNote" };
  if (id === "paper:footer") return { kind: "footer" };
  if (id === "paper:subject") return { kind: "subject" };
  if (id === "paper:class") return { kind: "class" };
  if (id === "paper:chapter") return { kind: "chapter" };
  if (id === "paper:time") return { kind: "time" };
  if (id === "paper:full-marks") return { kind: "fullMarks" };
  if (id.startsWith("canvas:")) return { kind: "canvasText", canvasKey: id };
  const staticCanvasTargets = new Set([
    "paper:header",
    "paper:set-no-label",
    "paper:subject-label",
    "paper:class-label",
    "paper:time-label",
    "paper:full-marks-label",
    "paper:chapter-block",
    "paper:chapter-label",
    "paper:footer-block",
  ]);
  if (staticCanvasTargets.has(id)) return { kind: "canvasText", canvasKey: id };
  const groupHeadingMatch = id.match(/^group:([^:]+):(heading|heading-block)$/);
  if (groupHeadingMatch) return { kind: "canvasText", canvasKey: id };
  const questionCanvasMatch = id.match(
    /^question:([^:]+):(number|marks|stimulus-label|option-label)(?::(\d+))?$/,
  );
  if (questionCanvasMatch) return { kind: "canvasText", canvasKey: id };
  const match = id.match(
    /^question:([^:]+):(question|stimulus|part-label|part|option)(?::(\d+))?$/,
  );
  if (!match) return null;
  const [, questionId, kind, rawIndex] = match;
  const index = rawIndex == null ? undefined : Number(rawIndex);
  if (kind === "question") return { kind: "question", questionId };
  if (kind === "stimulus") return { kind: "stimulus", questionId };
  if (kind === "part-label")
    return {
      kind: "partLabel",
      questionId,
      partIndex: Number.isFinite(index) ? index : 0,
    };
  if (kind === "part")
    return {
      kind: "part",
      questionId,
      partIndex: Number.isFinite(index) ? index : 0,
    };
  return {
    kind: "option",
    questionId,
    optionIndex: Number.isFinite(index) ? index : 0,
  };
}

type SelectionRect = { x: number; y: number; width: number; height: number };
type SelectionHostRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};
const STRUCTURAL_REGION_TARGETS = new Set([
  "paper:header",
  "paper:chapter-block",
  "paper:footer-block",
]);

export function collectRegionTargetIds(
  pageElement: HTMLElement,
  selectionRect: SelectionRect,
  selectionHostRect?: SelectionHostRect,
): string[] {
  const pageRect = pageElement.getBoundingClientRect();
  const hostRect = selectionHostRect ?? {
    left: pageRect.left,
    top: pageRect.top,
    width: pageRect.width,
    height: pageRect.height,
  };
  const safeWidth = Math.max(1, hostRect.width);
  const safeHeight = Math.max(1, hostRect.height);
  const region = {
    left: hostRect.left + (selectionRect.x / 100) * safeWidth,
    top: hostRect.top + (selectionRect.y / 100) * safeHeight,
    right:
      hostRect.left +
      ((selectionRect.x + selectionRect.width) / 100) * safeWidth,
    bottom:
      hostRect.top +
      ((selectionRect.y + selectionRect.height) / 100) * safeHeight,
  };
  const matches: Array<{
    id: string;
    top: number;
    left: number;
    area: number;
    element: HTMLElement;
  }> = [];
  pageElement
    .querySelectorAll<HTMLElement>("[data-region-edit-target]")
    .forEach((element) => {
      const id = element.dataset.regionEditTarget || "";
      if (!id) {
        return;
      }
      if (
        element.closest('[data-print-control="true"]') ||
        element.closest("[data-region-selection-outline]") ||
        element.closest('[data-region-selection-editor="true"]') ||
        element.closest('[data-region-selection-surface="true"]')
      ) {
        return;
      }
      if (STRUCTURAL_REGION_TARGETS.has(id)) {
        return;
      }
      const computedStyle = window.getComputedStyle(element);
      if (
        computedStyle.display === "none" ||
        computedStyle.visibility === "hidden"
      ) {
        return;
      }
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }
      if (!rectsIntersect(rect, region)) {
        return;
      }
      const intersectionLeft = Math.max(rect.left, region.left);
      const intersectionTop = Math.max(rect.top, region.top);
      const intersectionRight = Math.min(rect.right, region.right);
      const intersectionBottom = Math.min(rect.bottom, region.bottom);
      const area =
        Math.max(0, intersectionRight - intersectionLeft) *
        Math.max(0, intersectionBottom - intersectionTop);
      if (area <= 0) {
        return;
      }
      matches.push({ id, top: rect.top, left: rect.left, area, element });
    });
  const uniqueMatches = Array.from(
    new Map(matches.map((m) => [m.id, m])).values(),
  );
  const leafMatches = uniqueMatches.filter((candidate) => {
    const hasSelectedDescendant = uniqueMatches.some(
      (other) =>
        other.id !== candidate.id && candidate.element.contains(other.element),
    );
    return !hasSelectedDescendant;
  });
  leafMatches.sort((a, b) => {
    if (Math.abs(b.area - a.area) > 0.5) {
      return b.area - a.area;
    }
    const topDifference = Math.abs(a.top - b.top);
    if (topDifference > 4) {
      return a.top - b.top;
    }
    return a.left - b.left;
  });
  return leafMatches.map((m) => m.id);
}

function makeRegionSelectionId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `region-${crypto.randomUUID()}`;
  }
  return `region-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeCanvasTargetId(annotationId: string): string {
  return `canvas:${annotationId}`;
}

export function RegionSelectionOverlay({
  pageIndex,
  pageCount,
  activeRegion,
  selectionRect,
  regionSelectMode,
  onClearActiveRegion,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onRegionTargetCommit,
  canvasTextOverrides = {},
  annotations = [],
  onCreateRegionAnnotation,
  onUpdateRegionAnnotation,
  onDeleteRegionAnnotation,
  onRegionSelectionTargets,
  onActivateCanvasAnnotation,
}: {
  pageIndex?: number;
  pageCount?: number;
  activeRegion: RegionSelection | null;
  selectionRect: SelectionRect | null;
  regionSelectMode: boolean;
  onClearActiveRegion: () => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (event: PointerEvent<HTMLDivElement>) => void;
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
  onActivateCanvasAnnotation?: (annotationId: string) => void;
}) {
  const [activeCanvasDraft, setActiveCanvasDraft] = useState("");
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const activeCanvasTargetId =
    activeRegion?.targetIds.find((targetId) =>
      targetId.startsWith("canvas:"),
    ) || null;
  const activeCanvasAnnotationId = activeCanvasTargetId
    ? activeCanvasTargetId.slice("canvas:".length)
    : null;
  const activeCanvasAnnotation = activeCanvasAnnotationId
    ? annotations.find(
        (annotation) => annotation.id === activeCanvasAnnotationId,
      ) || null
    : null;

  const activeCanvasEditorRect = activeCanvasAnnotation
    ? {
        x: activeCanvasAnnotation.x,
        y: activeCanvasAnnotation.y,
        width: activeCanvasAnnotation.width,
        height: activeCanvasAnnotation.height,
        id: activeCanvasAnnotation.id,
      }
    : activeRegion && activeCanvasTargetId
      ? {
          x: activeRegion.x,
          y: activeRegion.y,
          width: activeRegion.width,
          height: activeRegion.height,
          id: activeCanvasAnnotationId || activeRegion.id,
        }
      : null;

  useEffect(() => {
    if (!activeCanvasTargetId) {
      setActiveCanvasDraft("");
      return;
    }
    if (
      Object.prototype.hasOwnProperty.call(
        canvasTextOverrides,
        activeCanvasTargetId,
      )
    ) {
      setActiveCanvasDraft(canvasTextOverrides[activeCanvasTargetId] || "");
      return;
    }
    if (activeCanvasAnnotation) {
      setActiveCanvasDraft(activeCanvasAnnotation.text || "");
      return;
    }
    setActiveCanvasDraft("");
  }, [activeCanvasTargetId, activeCanvasAnnotation, canvasTextOverrides]);

  useEffect(() => {
    if (!activeCanvasEditorRect || !activeCanvasTargetId) {
      return;
    }
    const focusEditor = () => {
      const editor = editorRef.current;
      if (!editor || !editor.isConnected) {
        return;
      }
      editor.focus({ preventScroll: true });
      const end = editor.value.length;
      try {
        editor.setSelectionRange(end, end);
      } catch {
        // ignore
      }
    };
    const frame = window.requestAnimationFrame(focusEditor);
    return () => window.cancelAnimationFrame(frame);
  }, [activeCanvasEditorRect?.id, activeCanvasTargetId]);

  // FIX-A: delete only on explicit close (X / Escape) OR empty blur.
  const commitCanvasAnnotation = (opts?: { deleteIfEmpty?: boolean }) => {
    if (!activeCanvasTargetId) {
      return;
    }
    const value = activeCanvasDraft
      .replace(/\r\n?/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    setActiveCanvasDraft(value);
    if (activeCanvasAnnotationId) {
      onUpdateRegionAnnotation?.(activeCanvasAnnotationId, { text: value });
    }
    onRegionTargetCommit?.(activeCanvasTargetId, value);
    if (opts?.deleteIfEmpty && !value && activeCanvasAnnotationId) {
      onDeleteRegionAnnotation?.(activeCanvasAnnotationId);
    }
  };

  const clearActiveSelection = () => {
    commitCanvasAnnotation({ deleteIfEmpty: true });
    onClearActiveRegion();
  };

  if (pageIndex == null) {
    return null;
  }

  return (
    <>
      {annotations
        .filter(
          (annotation) =>
            annotation.type === "regionText" &&
            annotation.pageIndex === pageIndex,
        )
        .map((annotation) => {
          const targetId = makeCanvasTargetId(annotation.id);
          const value = Object.prototype.hasOwnProperty.call(
            canvasTextOverrides,
            targetId,
          )
            ? canvasTextOverrides[targetId]
            : annotation.text || "";
          const isSelected = activeCanvasAnnotation?.id === annotation.id;
          if (isSelected) {
            return null;
          }
          return (
            <div
              key={annotation.id}
              data-region-edit-target={targetId}
              data-region-selection-helper="true"
              // FIX-B: clickable when not in select-mode so an existing box can be re-edited
              className={`absolute z-[55] whitespace-pre-wrap break-words ${
                regionSelectMode
                  ? "pointer-events-none"
                  : "pointer-events-auto cursor-text"
              }`}
              onPointerDown={(event) => {
                if (!regionSelectMode) {
                  event.stopPropagation();
                }
              }}
              onClick={(event) => {
                if (regionSelectMode) {
                  return;
                }
                event.stopPropagation();
                onActivateCanvasAnnotation?.(annotation.id);
              }}
              style={{
                left: `${annotation.x}%`,
                top: `${annotation.y}%`,
                width: `${Math.max(annotation.width, 1)}%`,
                minHeight: `${Math.max(annotation.height, 1)}%`,
                padding: `${Math.max(0, Number(annotation.padding ?? 4))}px`,
                fontSize: `${Math.max(7, Number(annotation.fontScale ?? 100) * 0.09)}px`,
                fontWeight: Number(annotation.fontWeight ?? 400),
                fontStyle: annotation.fontStyle || "normal",
                lineHeight: 1.35,
                textAlign: annotation.textAlign || "left",
                color: annotation.textColor || "#111827",
                backgroundColor: annotation.backgroundColor || "transparent",
                borderRadius: `${Number(annotation.borderRadius ?? 4)}px`,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                boxSizing: "border-box",
              }}
            >
              {value}
            </div>
          );
        })}
      {activeRegion ? (
        <div
          data-region-selection-outline="true"
          className="screen-only pointer-events-none absolute z-[65] box-border border-2 border-dashed border-[#F3A847] bg-[#F3A847]/5"
          style={{
            left: `${activeRegion.x}%`,
            top: `${activeRegion.y}%`,
            width: `${activeRegion.width}%`,
            height: `${activeRegion.height}%`,
          }}
          aria-hidden="true"
        >
          <button
            type="button"
            data-print-control="true"
            aria-label="Close selected area"
            title="Close selected area"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              clearActiveSelection();
            }}
            className="screen-only pointer-events-auto absolute right-0 top-0 flex h-4 w-4 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 focus:outline-none"
          >
            <X size={8} strokeWidth={2.4} />
          </button>
        </div>
      ) : null}
      {activeCanvasEditorRect && activeCanvasTargetId ? (
        <div
          data-region-selection-editor="true"
          data-print-control="true"
          className="screen-only absolute z-[75]"
          style={{
            left: `${activeCanvasEditorRect.x}%`,
            top: `${activeCanvasEditorRect.y}%`,
            width: `${Math.max(activeCanvasEditorRect.width, 1)}%`,
            minHeight: `${Math.max(activeCanvasEditorRect.height, 1)}%`,
          }}
        >
          <textarea
            ref={editorRef}
            value={activeCanvasDraft}
            autoFocus
            rows={1}
            spellCheck={false}
            aria-label="Type text in selected area"
            onChange={(event) => {
              setActiveCanvasDraft(event.target.value);
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onPointerUp={(event) => {
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
            onBlur={(event) => {
              if (!shouldCommitRegionBlur(event)) {
                return;
              }
              // FIX-C: commit AND close on blur so text persists in the helper div
              commitCanvasAnnotation({ deleteIfEmpty: true });
              onClearActiveRegion();
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                commitCanvasAnnotation({ deleteIfEmpty: true });
                onClearActiveRegion();
                return;
              }
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                editorRef.current?.blur();
              }
            }}
            className="pointer-events-auto block min-h-[24px] w-full resize-none overflow-hidden rounded-sm border border-dashed border-[#F3A847] bg-white/95 px-1.5 py-1 text-[10px] leading-[1.35] text-gray-800 shadow-md outline-none focus:border-[#F3A847] focus:ring-1 focus:ring-[#F3A847]/20"
            style={{
              minHeight: `${Math.max(24, Number(activeCanvasEditorRect.height) * 0.01)}px`,
            }}
          />
        </div>
      ) : null}
      {regionSelectMode ? (
        <div
          data-region-selection-surface="true"
          className="screen-only absolute inset-0 z-[80] cursor-crosshair select-none bg-transparent"
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            touchAction: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel || onPointerUp}
          onClick={(event) => event.stopPropagation()}
          aria-label="Select a region to edit directly on the page"
        >
          {selectionRect &&
          selectionRect.width >= 0.15 &&
          selectionRect.height >= 0.15 ? (
            <div
              className="pointer-events-none absolute box-border border-2 border-dashed border-[#F3A847] bg-[#F3A847]/5"
              style={{
                left: `${selectionRect.x}%`,
                top: `${selectionRect.y}%`,
                width: `${selectionRect.width}%`,
                height: `${selectionRect.height}%`,
              }}
            />
          ) : null}
        </div>
      ) : null}
      <div className="screen-only pointer-events-none absolute bottom-2 left-1/2 z-[30] -translate-x-1/2 rounded-full bg-gray-900/70 px-2.5 py-1 text-[8px] font-bold text-white">
        Page {pageIndex + 1}
        {pageCount ? ` / ${pageCount}` : ""}
      </div>
    </>
  );
}
