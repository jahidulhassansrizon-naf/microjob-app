"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";

import PrintDuplexLayout from "../PrintDuplexLayout";
import type {
  PaperAnnotation,
  PaperRenderRequest,
  Question,
} from "../../types/question";
import type { QuestionManager } from "../../hooks/useQuestionManager";
import CanvasSidebar from "./CanvasSidebar";
import PaperToolbar from "./PaperToolbar";
import PaperSheet from "./PaperSheet";
import {
  parseRegionTargetId,
  readEditableText,
} from "./RegionSelectionOverlay";

type DemoQuestion = Question;

type DemoHeaderState = {
  institutionName: string;
  examName: string;
  selectedClass: string;
  selectedSubject: string;
  selectedChapter: string;
  timeText: string;
};

const DEMO_HEADER: DemoHeaderState = {
  institutionName: "Model High School",
  examName: "Half Yearly Exam",
  selectedClass: "SSC",
  selectedSubject: "Bangla",
  selectedChapter: "Bangla Demo Chapter",
  timeText: "২ ঘণ্টা",
};

const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: "demo-cq-1",
    type: "CQ",
    question: "উদ্দীপকটি পড়ে ক, খ, গ ও ঘ নম্বর প্রশ্নগুলোর উত্তর দাও।",
    stimulus:
      "রাহাত প্রতিদিন বিদ্যালয়ে যাওয়ার আগে বাংলা বইয়ের একটি গল্প পড়ে। গল্পের চরিত্রগুলোর আচরণ থেকে সে সততা, দায়িত্ববোধ ও সহমর্মিতার শিক্ষা নেয়। একদিন সে বিদ্যালয়ের পথে একটি মানিব্যাগ পেয়ে সেটি মালিকের কাছে ফিরিয়ে দেয়।",
    subQuestions: [
      {
        label: "ক",
        question: "সততা বলতে কী বোঝায়?",
        marks: 1,
      },
      {
        label: "খ",
        question: "রাহাতের কাজটি কেন প্রশংসনীয়—ব্যাখ্যা করো।",
        marks: 2,
      },
      {
        label: "গ",
        question:
          "উদ্দীপকে রাহাতের আচরণে কোন মানবিক গুণটি সবচেয়ে বেশি প্রকাশ পেয়েছে? ব্যাখ্যা করো।",
        marks: 3,
      },
      {
        label: "ঘ",
        question:
          "উদ্দীপকের শিক্ষাকে বাস্তব জীবনে প্রয়োগের গুরুত্ব বিশ্লেষণ করো।",
        marks: 4,
      },
    ],
    marks: 40,
  },
  {
    id: "demo-mcq-1",
    type: "MCQ",
    question: "বাংলা ভাষার বর্ণমালায় স্বরবর্ণের সংখ্যা কত?",
    options: ["১১টি", "১০টি", "১২টি", "৯টি"],
    marks: 10,
  },
  {
    id: "demo-mcq-2",
    type: "MCQ",
    question: "‘সততা’ শব্দের বিপরীতার্থক শব্দ কোনটি?",
    options: ["সত্য", "অসততা", "ন্যায়", "বিশ্বাস"],
    marks: 10,
  },
  {
    id: "demo-short-1",
    type: "Short",
    question: "একজন ভালো শিক্ষার্থীর তিনটি গুণ সংক্ষেপে লেখো।",
    marks: 40,
  },
];

type FabricModule = typeof import("fabric");

type FabricRegionObject = {
  regionTargetId?: string;
  regionType?: "hit" | "text";
  regionSourceElement?: HTMLElement;
  isRegionEditorObject?: boolean;
};

type FabricEditorProps = {
  pageIndex: number;
  disabled?: boolean;
  regionSelectMode: boolean;
  onSetRegionSelectMode: (value: boolean) => void;
  onRegionTargetCommit: (targetId: string, value: string) => void;
  canvasTextOverrides: Record<string, string>;
};

function FabricRegionEditor({
  pageIndex,
  disabled = false,
  regionSelectMode,
  onSetRegionSelectMode,
  onRegionTargetCommit,
  canvasTextOverrides,
}: FabricEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);

  const fabricCanvasRef = useRef<InstanceType<FabricModule["Canvas"]> | null>(
    null,
  );

  const fabricModuleRef = useRef<FabricModule | null>(null);

  const activeTextObjectRef = useRef<any>(null);

  const activeTextTargetIdRef = useRef<string | null>(null);

  const hiddenNativeTargetsRef = useRef<
    Map<
      string,
      {
        element: HTMLElement;
        visibility: string;
      }
    >
  >(new Map());

  const onCommitRef = useRef(onRegionTargetCommit);

  const disabledRef = useRef(disabled);

  const [fabricReady, setFabricReady] = useState(false);

  useEffect(() => {
    onCommitRef.current = onRegionTargetCommit;
  }, [onRegionTargetCommit]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const getCanvasSize = useCallback(() => {
    const host = hostRef.current;

    if (!host) {
      return {
        width: 1,
        height: 1,
      };
    }

    const rect = host.getBoundingClientRect();

    return {
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    };
  }, []);

  useEffect(() => {
    if (disabled || !canvasElementRef.current) {
      return;
    }

    let cancelled = false;
    let canvasInstance: any = null;

    const initialize = async () => {
      try {
        const fabric = await import("fabric");

        if (cancelled) {
          return;
        }

        fabricModuleRef.current = fabric;

        const element = canvasElementRef.current;

        if (!element) {
          return;
        }

        const canvas = new fabric.Canvas(element, {
          selection: true,
          preserveObjectStacking: true,
          stopContextMenu: true,
          fireRightClick: false,
          fireMiddleClick: false,
          enableRetinaScaling: true,
          targetFindTolerance: 2,
        });

        canvasInstance = canvas;
        fabricCanvasRef.current = canvas;

        const size = getCanvasSize();

        canvas.setDimensions({
          width: size.width,
          height: size.height,
        });

        canvas.selectionColor = "rgba(243,168,71,0.08)";

        canvas.selectionBorderColor = "#F3A847";

        canvas.selectionLineWidth = 1;
        canvas.defaultCursor = "default";

        canvas.hoverCursor = "pointer";

        setFabricReady(true);
      } catch (error) {
        console.error("Fabric.js initialization failed:", error);

        setFabricReady(false);
      }
    };

    initialize();

    return () => {
      cancelled = true;

      try {
        activeTextObjectRef.current?.exitEditing?.();
      } catch {}

      hiddenNativeTargetsRef.current.forEach((record) => {
        record.element.style.visibility = record.visibility;
      });

      hiddenNativeTargetsRef.current.clear();

      activeTextObjectRef.current = null;
      activeTextTargetIdRef.current = null;

      if (canvasInstance) {
        try {
          canvasInstance.dispose();
        } catch {}
      }

      fabricCanvasRef.current = null;

      fabricModuleRef.current = null;

      setFabricReady(false);
    };
  }, [disabled, getCanvasSize]);

  /*
   * IMPORTANT:
   * During Select Area mode Fabric must NOT capture pointer events.
   * PaperSheet's DOM selection surface becomes the only pointer layer.
   */
  useEffect(() => {
    const canvas = fabricCanvasRef.current;

    const host = hostRef.current;

    if (!canvas || !host) {
      return;
    }

    canvas.selection = !regionSelectMode;

    const shouldCapture =
      !disabled && !regionSelectMode && Boolean(activeTextObjectRef.current);

    host.style.pointerEvents = shouldCapture ? "auto" : "none";

    const upperCanvas = canvas.upperCanvasEl;

    if (upperCanvas) {
      upperCanvas.style.pointerEvents = shouldCapture ? "auto" : "none";

      upperCanvas.style.cursor = regionSelectMode ? "default" : "default";

      upperCanvas.style.touchAction = "auto";
    }

    canvas.requestRenderAll();
  }, [disabled, regionSelectMode, fabricReady]);

  useEffect(() => {
    if (!fabricReady || disabled) {
      return;
    }

    const canvas = fabricCanvasRef.current;

    const host = hostRef.current;

    if (!canvas || !host) {
      return;
    }

    const resize = () => {
      const size = getCanvasSize();

      canvas.setDimensions({
        width: size.width,
        height: size.height,
      });

      canvas.requestRenderAll();
    };

    resize();

    const observer = new ResizeObserver(resize);

    observer.observe(host);

    return () => observer.disconnect();
  }, [fabricReady, disabled, getCanvasSize]);

  /*
   * Keep any existing Fabric objects cleaned up.
   * Select Area itself is now DOM-driven.
   */
  useEffect(() => {
    if (!fabricReady || disabled) {
      return;
    }

    const canvas = fabricCanvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.requestRenderAll();
  }, [canvasTextOverrides, fabricReady, disabled, pageIndex]);

  /*
   * Keyboard handling for an already active Fabric text object.
   * The actual Select Area drag is intentionally NOT handled here.
   */
  useEffect(() => {
    const canvas = fabricCanvasRef.current;

    if (!canvas || disabled) {
      return;
    }

    const finishTextEditing = (object: any, commit = true) => {
      const regionObject = object as FabricRegionObject;

      const targetId =
        regionObject.regionTargetId || activeTextTargetIdRef.current;

      if (!targetId) {
        return;
      }

      const value = String(object?.text || "")
        .replace(/\r\n?/g, "\n")
        .trim();

      if (commit) {
        onCommitRef.current?.(targetId, value);
      }

      const record = hiddenNativeTargetsRef.current.get(targetId);

      if (record) {
        record.element.style.visibility = record.visibility;

        hiddenNativeTargetsRef.current.delete(targetId);
      }

      try {
        canvas.remove(object);
        object.dispose?.();
      } catch {}

      canvas.discardActiveObject();
      canvas.requestRenderAll();

      activeTextObjectRef.current = null;

      activeTextTargetIdRef.current = null;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const active = canvas.getActiveObject();

      if (!active) {
        return;
      }

      const regionObject = active as FabricRegionObject;

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        regionObject.isRegionEditorObject &&
        (active as any).isEditing
      ) {
        return;
      }

      if (event.key === "Escape") {
        if (activeTextObjectRef.current) {
          finishTextEditing(activeTextObjectRef.current, false);
        } else {
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          onSetRegionSelectMode(false);
        }
      }
    };

    const handleEditingExited = (event: any) => {
      const object = event?.target as FabricRegionObject;

      if (!object?.isRegionEditorObject) {
        return;
      }

      finishTextEditing(object, true);
    };

    canvas.on("text:editing:exited", handleEditingExited);

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      canvas.off("text:editing:exited", handleEditingExited);

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [disabled, fabricReady, onSetRegionSelectMode]);

  if (disabled) {
    return null;
  }

  return (
    <div
      ref={hostRef}
      data-fabric-paper-editor="true"
      data-fabric-page-index={pageIndex}
      className="pointer-events-none absolute inset-0 z-[45] screen-only"
      style={{
        isolation: "isolate",
        // The paper editor is DOM-driven now. Keep the legacy Fabric layer
        // mounted for compatibility, but make its canvas visually inert so it
        // cannot paint an unexpected overlay/bar on top of the paper.
        visibility: "hidden",
      }}
    >
      <canvas
        ref={canvasElementRef}
        className="absolute inset-0 block h-full w-full"
        aria-label="Fabric question paper editor"
      />
    </div>
  );
}

function createPaperRenderer(
  manager: QuestionManager,
  onRegionTargetCommit: (targetId: string, value: string) => void,
  canvasTextOverrides: Record<string, string>,
  regionSelectMode: boolean,
  onSetRegionSelectMode: (value: boolean) => void,
  onRegionSelectionTargets: (targetIds: string[]) => void,
) {
  return ({
    pageIndex,
    groups,
    pagePart,
    showHeader,
    showFooter,
    measurementMode,
  }: PaperRenderRequest) => {
    const isJoint = manager.pageSize === "Joint";

    const actualPageSize = isJoint ? "A5" : manager.pageSize;

    const pageCount = isJoint ? manager.jointPageCount : 1;

    const canMove = isJoint && pageIndex < manager.jointPageCount;

    const targetPage = pageIndex % 2 === 0 ? pageIndex + 1 : pageIndex - 1;

    const moveToOtherPage =
      canMove && targetPage >= 0 && targetPage < manager.jointPageCount
        ? (id: string) => manager.moveQuestionToPage(id, targetPage)
        : undefined;

    const isMeasurement = Boolean(
      measurementMode && measurementMode !== "none",
    );

    return (
      <div
        className="relative w-full"
        data-paper-fabric-wrapper="true"
        data-paper-fabric-page={pageIndex}
      >
        <PaperSheet
          pageSize={actualPageSize as "A4" | "A5"}
          fontSize={manager.paperFontPx}
          paperGap={manager.paperGap}
          layoutColumns={isJoint ? 1 : manager.layoutColumns}
          logoUrl={manager.logoUrl}
          institutionName={manager.institutionName}
          setInstitutionName={manager.setInstitutionName}
          examName={manager.examName}
          setExamName={manager.setExamName}
          selectedSubject={
            manager.subjects.find((s) => s.value === manager.selectedSubject)
              ?.label || manager.selectedSubject
          }
          selectedClass={manager.selectedClass}
          selectedChapter={
            manager.chapters.find((c) => c.value === manager.selectedChapter)
              ?.label || manager.selectedChapter
          }
          timeText={manager.timeText}
          totalMarks={manager.totalMarks}
          setNoEnabled={manager.setNoEnabled}
          setNo={manager.setNo}
          headerNoteEnabled={manager.headerNoteEnabled}
          headerNote={manager.headerNote}
          footerText={manager.footerText}
          styleVariant={manager.paperStyle}
          groups={groups}
          questionNumberMap={manager.questionNumberMap}
          showHeader={showHeader}
          showFooter={showFooter}
          isActive={
            isJoint && pageIndex === manager.activeJointPage && !isMeasurement
          }
          onActivate={
            isJoint && !isMeasurement
              ? () => manager.setActiveJointPage(pageIndex)
              : undefined
          }
          jointPage={pagePart === "single" ? undefined : pagePart}
          onMoveToOtherPage={moveToOtherPage}
          onRemove={manager.toggleSelectQuestion}
          onDragStart={(id) => manager.setDraggedId(id)}
          onDragOver={(event, id) => {
            event.preventDefault();
            manager.setDragOverId(id);
          }}
          onDrop={manager.handleDrop}
          onDragEnd={() => {
            manager.setDraggedId(null);
            manager.setDragOverId(null);
          }}
          dragOverId={manager.dragOverId}
          editingMarkId={manager.editingMarkId}
          setEditingMarkId={manager.setEditingMarkId}
          updateQuestionMark={manager.updateQuestionMark}
          selectAnswerEnabled={manager.selectAnswerEnabled}
          answerSelections={manager.answerSelections}
          setAnswerSelections={manager.setAnswerSelections}
          pagePart={pagePart}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onDropOnPage={
            isJoint && !isMeasurement ? manager.handlePageDrop : undefined
          }
          onMoveToPage={
            isJoint && !isMeasurement ? manager.moveQuestionToPage : undefined
          }
          activeQuestionId={manager.activeQuestionId}
          /*
           * DOM Select Area is now active again.
           */
          regionSelectMode={regionSelectMode}
          onSetRegionSelectMode={onSetRegionSelectMode}
          onRegionTargetCommit={onRegionTargetCommit}
          canvasTextOverrides={canvasTextOverrides}
          annotations={manager.annotations}
          onCreateRegionAnnotation={manager.addRegionTextAnnotation}
          onUpdateRegionAnnotation={(id, patch) =>
            manager.updateAnnotation(id, patch)
          }
          onDeleteRegionAnnotation={manager.deleteAnnotation}
          onRegionSelectionTargets={onRegionSelectionTargets}
          questionLayoutById={manager.questionLayoutById}
          onAdjustQuestionLayout={manager.adjustQuestionLayout}
          editingQuestionId={manager.editingQuestionId}
          onStartQuestionEdit={manager.setEditingQuestionId}
          onUpdateQuestion={manager.updateQuestionContent}
          onReplaceQuestion={manager.replaceQuestion}
          replacementCandidates={manager.visibleQuestions}
          onSetActiveQuestion={manager.setActiveQuestionId}
          measurementMode={measurementMode}
        />

        {/*
         * Joint 2 uses the DOM-based region/selection layer. Do not mount
         * the legacy Fabric editor on Joint pages at all: even a hidden
         * Fabric canvas can create a positioned overlay inside the page.
         */}
        {!isJoint && !isMeasurement && pageIndex != null ? (
          <FabricRegionEditor
            pageIndex={pageIndex}
            regionSelectMode={regionSelectMode}
            onSetRegionSelectMode={onSetRegionSelectMode}
            onRegionTargetCommit={onRegionTargetCommit}
            canvasTextOverrides={canvasTextOverrides}
          />
        ) : null}
      </div>
    );
  };
}

export default function InteractiveQuestionCanvas({
  manager,
}: {
  manager: QuestionManager;
}) {
  const {
    selectedTab,
    setSelectedTab,
    filtersOpen,
    setFiltersOpen,
    openFilter,
    setOpenFilter,
    selectedClass,
    setSelectedClass,
    selectedSubject,
    setSelectedSubject,
    selectedChapter,
    setSelectedChapter,
    selectedQuestionType,
    setSelectedQuestionType,
    searchQuery,
    setSearchQuery,
    questionError,
    questions,
    loadingQuestions,
    visibleQuestions,
    subjects,
    chapters,
    loadingSubjects,
    loadingChapters,
    totalMarks,
    selectedQuestions,
    selectedIds,
    typeCounts,
    resultTypeTab,
    setResultTypeTab,
    questionSearchQuery,
    setQuestionSearchQuery,
    handleClassChange,
    handleSubjectChange,
    handleChapterChange,
    handleFetchQuestions,
    handleSelectAll,
    clearSelectedQuestions,
    toggleSelectQuestion,
    sectionGroups,
    sectionMarks,
    updateSectionMarks,
    autoCount,
    setAutoCount,
    handleAutoCreate,
    logoInputRef,
    handleLogoChange,
    logoUrl,
    removeLogo,
    fontScale,
    setFontScale,
    handlePageSizeChange,
    pageSize,
    setNoEnabled,
    setNo,
    setSetNo,
    shuffleSelected,
    layoutRef,
    layoutOpen,
    setLayoutOpen,
    layoutColumns,
    setLayoutColumns,
    compactSpacing,
    setCompactSpacing,
    selectAnswerEnabled,
    setSelectAnswerEnabled,
    headerNoteEnabled,
    setHeaderNoteEnabled,
    headerNote,
    setHeaderNote,
    footerText,
    setFooterText,
    timeText,
    setTimeText,
    paperStyle,
    setPaperStyle,
    canvasTextOverrides,
    regionSelectMode,
    setRegionSelectMode,
    handleRegionTargetCommit: managerHandleRegionTargetCommit,
  } = manager;

  /*
   * Joint 2 / 2-in-1 center-bar guard
   * --------------------------------
   * The paper itself is rendered by PrintDuplexLayout -> PaperSheet.
   * There is no intentional dark divider in those components, but older
   * editor/overlay layers can leave an absolute child or pseudo-element
   * centered over an A5 sheet. This guard runs ONLY in Joint mode and
   * suppresses a very specific visual signature: a dark, narrow, tall
   * centered overlay that spans most of a page. Normal question content,
   * resize handles, toolbars and borders do not match these dimensions.
   *
   * This is deliberately kept here so the exact InteractiveQuestionCanvas
   * used by the page owns the Joint-2 cleanup without changing the existing
   * question/pagination implementation.
   */
  useEffect(() => {
    if (manager.pageSize !== "Joint") {
      return;
    }

    let cancelled = false;
    let frameId: number | null = null;
    const suppressedElements = new Map<HTMLElement, string>();
    const suppressedPseudoHosts = new Map<
      HTMLElement,
      {
        before: boolean;
        after: boolean;
      }
    >();

    const isDarkColor = (value: string) => {
      const match = value.match(/rgba?\(([^)]+)\)/i);
      if (!match) {
        return false;
      }

      const channels = match[1]
        .split(",")
        .slice(0, 3)
        .map((channel) => Number.parseFloat(channel.trim()));

      if (
        channels.length !== 3 ||
        channels.some((channel) => !Number.isFinite(channel))
      ) {
        return false;
      }

      const luminance =
        channels[0] * 0.299 + channels[1] * 0.587 + channels[2] * 0.114;

      return luminance < 125;
    };

    const parsePx = (value: string) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const looksLikeJointCenterBar = (
      element: HTMLElement,
      pageRect: DOMRect,
    ) => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return false;
      }

      const widthRatio = rect.width / Math.max(pageRect.width, 1);
      const heightRatio = rect.height / Math.max(pageRect.height, 1);
      const centerX = rect.left + rect.width / 2;
      const pageCenterX = pageRect.left + pageRect.width / 2;
      const centered =
        Math.abs(centerX - pageCenterX) <= Math.max(18, pageRect.width * 0.035);

      if (!centered || widthRatio > 0.18 || heightRatio < 0.55) {
        return false;
      }

      const style = window.getComputedStyle(element);
      const positioned =
        style.position === "absolute" ||
        style.position === "fixed" ||
        style.position === "sticky";

      if (!positioned) {
        return false;
      }

      return (
        isDarkColor(style.backgroundColor) ||
        isDarkColor(style.borderLeftColor) ||
        isDarkColor(style.borderRightColor)
      );
    };

    const looksLikePseudoBar = (
      host: HTMLElement,
      pseudo: "::before" | "::after",
      pageRect: DOMRect,
    ) => {
      const style = window.getComputedStyle(host, pseudo);
      if (style.content === "none" || style.display === "none") {
        return false;
      }

      const width = parsePx(style.width);
      const height = parsePx(style.height);
      if (width <= 0 || height <= 0) {
        return false;
      }

      const widthRatio = width / Math.max(pageRect.width, 1);
      const heightRatio = height / Math.max(pageRect.height, 1);
      if (widthRatio > 0.18 || heightRatio < 0.55) {
        return false;
      }

      const backgroundDark = isDarkColor(style.backgroundColor);
      if (!backgroundDark) {
        return false;
      }

      const left = parsePx(style.left);
      const right = parsePx(style.right);
      const centeredByInsets =
        Math.abs(left - right) <= Math.max(12, pageRect.width * 0.035);

      const centeredByTransform = style.transform !== "none" && left >= 0;

      return centeredByInsets || centeredByTransform;
    };

    const suppress = (element: HTMLElement) => {
      if (!suppressedElements.has(element)) {
        suppressedElements.set(
          element,
          element.style.getPropertyValue("display"),
        );
      }
      element.style.setProperty("display", "none", "important");
      element.setAttribute("data-joint-center-bar-suppressed", "true");
    };

    const suppressPseudo = (host: HTMLElement, pseudo: "before" | "after") => {
      const current = suppressedPseudoHosts.get(host) ?? {
        before: false,
        after: false,
      };
      current[pseudo] = true;
      suppressedPseudoHosts.set(host, current);
      const className =
        pseudo === "before"
          ? "joint-hide-center-before"
          : "joint-hide-center-after";
      host.classList.add(className);
    };

    const scan = () => {
      if (cancelled) {
        return;
      }

      const spreads = Array.from(
        document.querySelectorAll<HTMLElement>(".duplex-spread"),
      );

      spreads.forEach((spread) => {
        const pageSides = Array.from(
          spread.querySelectorAll<HTMLElement>(".duplex-spread-side"),
        );

        pageSides.forEach((pageSide) => {
          const page = pageSide.querySelector<HTMLElement>(
            ".paper-screen-sheet",
          );
          if (!page) {
            return;
          }

          const pageRect = page.getBoundingClientRect();
          if (pageRect.width <= 0 || pageRect.height <= 0) {
            return;
          }

          const candidates = Array.from(
            page.querySelectorAll<HTMLElement>("*"),
          );
          candidates.forEach((element) => {
            if (looksLikeJointCenterBar(element, pageRect)) {
              suppress(element);
            }

            if (looksLikePseudoBar(element, "::before", pageRect)) {
              suppressPseudo(element, "before");
            }

            if (looksLikePseudoBar(element, "::after", pageRect)) {
              suppressPseudo(element, "after");
            }
          });

          [page, pageSide].forEach((host) => {
            if (looksLikePseudoBar(host, "::before", pageRect)) {
              suppressPseudo(host, "before");
            }
            if (looksLikePseudoBar(host, "::after", pageRect)) {
              suppressPseudo(host, "after");
            }
          });
        });
      });
    };

    const scheduleScan = () => {
      if (frameId != null) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        scan();
      });
    };

    scheduleScan();

    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", scheduleScan);
    window.addEventListener("scroll", scheduleScan, true);

    return () => {
      cancelled = true;

      if (frameId != null) {
        window.cancelAnimationFrame(frameId);
      }

      observer.disconnect();
      window.removeEventListener("resize", scheduleScan);
      window.removeEventListener("scroll", scheduleScan, true);

      suppressedElements.forEach((originalDisplay, element) => {
        if (originalDisplay) {
          element.style.setProperty("display", originalDisplay);
        } else {
          element.style.removeProperty("display");
        }
        element.removeAttribute("data-joint-center-bar-suppressed");
      });

      suppressedPseudoHosts.forEach((state, host) => {
        if (state.before) {
          host.classList.remove("joint-hide-center-before");
        }
        if (state.after) {
          host.classList.remove("joint-hide-center-after");
        }
      });
    };
  }, [manager.pageSize]);

  const [demoMode, setDemoMode] = useState(false);

  const [demoQuestions, setDemoQuestions] = useState<Question[]>([]);

  const [demoHeader, setDemoHeader] = useState<DemoHeaderState>(DEMO_HEADER);

  const [demoCanvasTextOverrides, setDemoCanvasTextOverrides] = useState<
    Record<string, string>
  >({});

  const [demoAnnotations, setDemoAnnotations] = useState<PaperAnnotation[]>([]);

  const demoSectionGroups = useMemo(() => {
    const order: Question["type"][] = ["CQ", "MCQ", "Short"];

    return order
      .map((type) => ({
        type,
        questions: demoQuestions.filter((question) => question.type === type),
      }))
      .filter((group) => group.questions.length > 0);
  }, [demoQuestions]);

  const demoQuestionNumberMap = useMemo(
    () =>
      new Map(
        demoQuestions.map(
          (question, index) => [question.id, index + 1] as const,
        ),
      ),
    [demoQuestions],
  );

  const demoTotalMarks = useMemo(
    () =>
      demoQuestions.reduce(
        (sum, question) => sum + (Number(question.marks) || 0),
        0,
      ),
    [demoQuestions],
  );

  const demoJointQuestionsByPage = useMemo((): Question[][] => {
    const split = Math.max(1, Math.ceil(demoQuestions.length / 2));

    return [
      demoQuestions.slice(0, split),
      demoQuestions.slice(split),
    ];
  }, [demoQuestions]);

  const demoJointSectionGroupsByPage = useMemo(() => {
    const makeGroups = (questionsForPage: Question[]) => {
      const order: Question["type"][] = ["CQ", "MCQ", "Short"];

      return order
        .map((type) => ({
          type,
          questions: questionsForPage.filter(
            (question) => question.type === type,
          ),
        }))
        .filter((group) => group.questions.length > 0);
    };

    return demoJointQuestionsByPage.map((questionsForPage) =>
      makeGroups(questionsForPage),
    );
  }, [demoJointQuestionsByPage]);

  const loadDemo = () => {
    const freshDemoQuestions = DEMO_QUESTIONS.map((question) => ({
      ...question,
      options: question.options ? [...question.options] : undefined,
      subQuestions: question.subQuestions
        ? question.subQuestions.map((part) => ({
            ...part,
          }))
        : undefined,
    }));

    setDemoQuestions(freshDemoQuestions);

    setDemoHeader({
      ...DEMO_HEADER,
    });

    setDemoCanvasTextOverrides({
      "paper:full-marks": "১০০",
    });

    setDemoAnnotations([]);

    manager.clearAllAnnotations();
    manager.setActiveAnnotationId(null);

    setDemoMode(true);
    setSelectedTab("browse");
    setRegionSelectMode(false);
    manager.setActiveQuestionId(null);
  };

  const demoAddRegionTextAnnotation = useCallback(
    (
      pageIndex: number,
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      const id = `annotation-region-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      const annotation: PaperAnnotation = {
        id,
        pageIndex,
        type: "regionText",
        x: Math.max(0, Math.min(100 - Math.max(width, 1), x)),
        y: Math.max(0, Math.min(100 - Math.max(height, 1), y)),
        width: Math.max(1, Math.min(96, width)),
        height: Math.max(1, Math.min(70, height)),
        text: "",
        fontScale: 100,
        fontWeight: 400,
        fontStyle: "normal",
        textAlign: "left",
        textColor: "#111827",
        backgroundColor: "transparent",
        borderRadius: 4,
        padding: 6,
      };

      setDemoAnnotations((current) => [...current, annotation]);

      setRegionSelectMode(false);

      return id;
    },
    [setRegionSelectMode],
  );

  const demoUpdateAnnotation = useCallback(
    (id: string, patch: Partial<PaperAnnotation>) => {
      setDemoAnnotations((current) =>
        current.map((annotation) =>
          annotation.id === id
            ? {
                ...annotation,
                ...patch,
              }
            : annotation,
        ),
      );
    },
    [],
  );

  const demoDeleteAnnotation = useCallback((id: string) => {
    setDemoAnnotations((current) =>
      current.filter((annotation) => annotation.id !== id),
    );

    setDemoCanvasTextOverrides((current) => {
      const next = {
        ...current,
      };

      delete next[`canvas:${id}`];

      return next;
    });
  }, []);

  const displayManager = useMemo<QuestionManager>(() => {
    if (!demoMode) {
      return manager;
    }

    return {
      ...manager,
      pageSize: manager.pageSize,
      selectedQuestions: demoQuestions,
      totalMarks: demoTotalMarks || 100,
      sectionGroups: demoSectionGroups,
      questionNumberMap: demoQuestionNumberMap,
      institutionName: demoHeader.institutionName,
      examName: demoHeader.examName,
      selectedClass: demoHeader.selectedClass,
      selectedSubject: demoHeader.selectedSubject,
      selectedChapter: demoHeader.selectedChapter,
      timeText: demoHeader.timeText,
      canvasTextOverrides: demoCanvasTextOverrides,
      annotations: demoAnnotations,
      selectedIds: new Set(demoQuestions.map((question) => question.id)),
      jointLayoutMode: "manual" as const,
      jointPageCount: 2,
      jointRenderPageCount: 2,
      jointQuestionsByPage: demoJointQuestionsByPage,
      jointSectionGroupsByPage: demoJointSectionGroupsByPage,
      jointPageIndices: [0, 1],
      overflowJointPages: [],
      setInstitutionName: (value: SetStateAction<string>) =>
        setDemoHeader((current) => ({
          ...current,
          institutionName:
            typeof value === "function"
              ? value(current.institutionName)
              : value,
        })),
      setExamName: (value: SetStateAction<string>) =>
        setDemoHeader((current) => ({
          ...current,
          examName:
            typeof value === "function" ? value(current.examName) : value,
        })),
      addRegionTextAnnotation: demoAddRegionTextAnnotation,
      updateAnnotation: demoUpdateAnnotation,
      deleteAnnotation: demoDeleteAnnotation,
      toggleSelectQuestion: (question: Question) => {
        setDemoQuestions((current) =>
          current.filter((candidate) => candidate.id !== question.id),
        );
      },
      updateQuestionContent: (updatedQuestion: Question) => {
        setDemoQuestions((current) =>
          current.map((question) =>
            question.id === updatedQuestion.id ? updatedQuestion : question,
          ),
        );
      },
      replaceQuestion: (questionId: string, replacement: Question) => {
        setDemoQuestions((current) =>
          current.map((question) =>
            question.id === questionId
              ? {
                  ...replacement,
                }
              : question,
          ),
        );
      },
      setActiveJointPage: manager.setActiveJointPage,
      setDraggedId: manager.setDraggedId,
      setDragOverId: manager.setDragOverId,
    };
  }, [
    demoAddRegionTextAnnotation,
    demoAnnotations,
    demoCanvasTextOverrides,
    demoDeleteAnnotation,
    demoHeader,
    demoJointQuestionsByPage,
    demoJointSectionGroupsByPage,
    demoMode,
    demoQuestionNumberMap,
    demoQuestions,
    demoSectionGroups,
    demoTotalMarks,
    demoUpdateAnnotation,
    manager,
  ]);

  const displaySelectedQuestions = demoMode ? demoQuestions : selectedQuestions;

  const displayCanvasTextOverrides = demoMode
    ? demoCanvasTextOverrides
    : canvasTextOverrides;

  const handleRegionTargetCommit = useCallback(
    (targetId: string, value: string) => {
      const target = parseRegionTargetId(targetId);

      if (!target) {
        return;
      }

      const cleanedValue = value
        .replace(/\u00a0/g, " ")
        .replace(/\r\n?/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (demoMode) {
        if (target.kind === "canvasText") {
          if (target.canvasKey) {
            setDemoCanvasTextOverrides((current) => ({
              ...current,
              [target.canvasKey!]: cleanedValue,
            }));

            const annotationId = target.canvasKey.startsWith("canvas:")
              ? target.canvasKey.slice("canvas:".length)
              : null;

            if (annotationId) {
              setDemoAnnotations((current) =>
                current.map((annotation) =>
                  annotation.id === annotationId
                    ? {
                        ...annotation,
                        text: cleanedValue,
                      }
                    : annotation,
                ),
              );
            }
          }
        } else if (target.kind === "institution") {
          setDemoHeader((current) => ({
            ...current,
            institutionName: cleanedValue,
          }));
        } else if (target.kind === "exam") {
          setDemoHeader((current) => ({
            ...current,
            examName: cleanedValue,
          }));
        } else if (target.kind === "subject") {
          setDemoHeader((current) => ({
            ...current,
            selectedSubject: cleanedValue,
          }));
        } else if (target.kind === "class") {
          setDemoHeader((current) => ({
            ...current,
            selectedClass: cleanedValue,
          }));
        } else if (target.kind === "chapter") {
          setDemoHeader((current) => ({
            ...current,
            selectedChapter: cleanedValue,
          }));
        } else if (target.kind === "time") {
          setDemoHeader((current) => ({
            ...current,
            timeText: cleanedValue,
          }));
        } else if (target.questionId) {
          const sourceQuestion = demoQuestions.find(
            (question) => question.id === target.questionId,
          );

          if (!sourceQuestion) {
            return;
          }

          let updatedQuestion: Question | null = null;

          if (target.kind === "question") {
            updatedQuestion = {
              ...sourceQuestion,
              question: cleanedValue,
            };
          } else if (target.kind === "stimulus") {
            updatedQuestion = {
              ...sourceQuestion,
              stimulus: cleanedValue || undefined,
            };
          } else if (target.kind === "part") {
            updatedQuestion = {
              ...sourceQuestion,
              subQuestions: (sourceQuestion.subQuestions || []).map(
                (part, index) =>
                  index === target.partIndex
                    ? {
                        ...part,
                        question: cleanedValue,
                      }
                    : part,
              ),
            };
          } else if (target.kind === "partLabel") {
            updatedQuestion = {
              ...sourceQuestion,
              subQuestions: (sourceQuestion.subQuestions || []).map(
                (part, index) =>
                  index === target.partIndex
                    ? {
                        ...part,
                        label: cleanedValue.replace(/\.$/, "").trim(),
                      }
                    : part,
              ),
            };
          } else if (target.kind === "option") {
            updatedQuestion = {
              ...sourceQuestion,
              options: (sourceQuestion.options || []).map((option, index) =>
                index === target.optionIndex ? cleanedValue : option,
              ),
            };
          }

          if (updatedQuestion) {
            setDemoQuestions((current) =>
              current.map((question) =>
                question.id === updatedQuestion?.id
                  ? updatedQuestion
                  : question,
              ),
            );
          }
        }

        return;
      }

      managerHandleRegionTargetCommit(targetId, cleanedValue);
    },
    [demoMode, demoQuestions, managerHandleRegionTargetCommit],
  );

  const handleRegionSelectionTargets = useCallback(
    (targetIds: string[]) => {
      const targetId = targetIds[0];
      const parsed = targetId ? parseRegionTargetId(targetId) : null;
      if (!parsed || !targetId) {
        manager.setActiveQuestionId(null);
        manager.setEditingQuestionId(null);
        manager.setEditingMarkId(null);
        return;
      }
      // FIX: in Select Area mode we edit text INLINE (contentEditable / textarea).
      // We must NOT open the big inline EDIT QUESTION form here, otherwise the
      // paper layout / pagination breaks.
      if (parsed.questionId) {
        manager.setActiveQuestionId(parsed.questionId);
        if (targetId.endsWith(":marks")) {
          manager.setEditingMarkId(parsed.questionId);
        } else {
          manager.setEditingMarkId(null);
        }
      } else {
        manager.setActiveQuestionId(null);
        manager.setEditingMarkId(null);
      }
      manager.setEditingQuestionId(null);
    },
    [manager],
  );

  const renderPaper = useMemo(
    () =>
      createPaperRenderer(
        displayManager,
        handleRegionTargetCommit,
        displayCanvasTextOverrides,
        regionSelectMode,
        setRegionSelectMode,
        handleRegionSelectionTargets,
      ),
    [
      displayCanvasTextOverrides,
      displayManager,
      handleRegionSelectionTargets,
      handleRegionTargetCommit,
      regionSelectMode,
      setRegionSelectMode,
    ],
  );

  return (
    <>
      <main className="flex flex-col gap-4 p-4 lg:flex-row lg:gap-4 xl:p-6">
        <CanvasSidebar
          manager={manager}
          demoMode={demoMode}
          onExitDemo={() => {
            setDemoMode(false);
            setRegionSelectMode(false);
          }}
          displaySelectedQuestions={displaySelectedQuestions}
        />

        <section className="min-w-0 flex-1">
          <div className="flex flex-col gap-3">
            <PaperToolbar
              manager={manager}
              demoMode={demoMode}
              loadDemo={loadDemo}
            />

            <div className="relative">
              <PrintDuplexLayout
                key={demoMode ? "demo-question-paper" : "live-question-paper"}
                manager={displayManager}
                renderPaper={renderPaper}
              />

              {!demoMode && regionSelectMode ? (
                <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-[10px] font-bold text-white shadow-xl">
                  Select an area on the question paper
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <style jsx global>{`
        /* Joint 2 defensive cleanup for legacy center/spine overlays. */
        .duplex-spread .joint-hide-center-before::before {
          content: none !important;
          display: none !important;
        }

        .duplex-spread .joint-hide-center-after::after {
          content: none !important;
          display: none !important;
        }

        .duplex-spread .joint-fixed-paper canvas,
        .duplex-spread [data-fabric-paper-editor="true"] {
          display: none !important;
          visibility: hidden !important;
        }
      `}</style>
    </>
  );
}
