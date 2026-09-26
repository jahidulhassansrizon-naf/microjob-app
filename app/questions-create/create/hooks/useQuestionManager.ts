"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useRouter } from "next/navigation";

import {
  DEFAULT_QUESTION_LAYOUT,
  DEFAULT_SECTION_MARKS,
  REQUEST_TIMEOUT_MS,
  buildSectionGroups,
  clampNumber,
  cleanMultilineText,
  shuffle,
} from "../types/question";

import type {
  CreativeSubQuestion,
  FilterKey,
  FilterOption,
  JointPrintPage,
  JointPrintRowMetric,
  JointPrintSectionMetric,
  PaperAnnotation,
  PrintPageVariant,
  Question,
  QuestionLayout,
} from "../types/question";

import { parseRegionTargetId } from "../components/question-canvas/RegionSelectionOverlay";

import { printPaperInIsolatedIframe } from "../components/PrintDuplexLayout";

class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function fetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const timeoutController = new AbortController();

  const timer = window.setTimeout(() => timeoutController.abort(), timeoutMs);

  const externalSignal = init.signal;

  const abortFromExternalSignal = () => timeoutController.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      timeoutController.abort();
    } else {
      externalSignal.addEventListener("abort", abortFromExternalSignal, {
        once: true,
      });
    }
  }

  try {
    const response = await fetch(input, {
      ...init,
      cache: "no-store",
      signal: timeoutController.signal,
    });

    const rawText = await response.text();

    let payload: unknown = null;

    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const serverMessage =
        payload && typeof payload === "object"
          ? String(
              (payload as Record<string, unknown>).error ||
                (payload as Record<string, unknown>).message ||
                "Request failed",
            )
          : "Request failed";

      throw new ApiRequestError(serverMessage, response.status);
    }

    if (!payload || typeof payload !== "object") {
      throw new ApiRequestError(
        "The server returned an invalid response.",
        response.status,
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      if (externalSignal?.aborted) {
        throw error;
      }

      throw new ApiRequestError(
        "The AI service took too long to respond. Please try again.",
        504,
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timer);

    if (externalSignal) {
      externalSignal.removeEventListener("abort", abortFromExternalSignal);
    }
  }
}

function normalizeQuestionType(value: unknown): Question["type"] {
  const text = String(value || "")
    .toLowerCase()
    .trim();

  // IMPORTANT: check MCQ before CQ. The string "mcq" itself contains the
  // substring "cq", so a plain `text.includes("cq")` check (previously run
  // first) would misclassify every MCQ item as CQ. Those fake-CQ items then
  // failed the CQ-only filter later (which requires a stimulus + at least 2
  // subQuestions) and were silently dropped — that's why MCQ never showed up
  // while CQ/Short did. Word-boundary regexes make this safe regardless of
  // check order.
  const isMcq =
    /\bmcqs?\b/.test(text) ||
    text.includes("multiple choice") ||
    text.includes("multiple-choice");

  if (isMcq) {
    return "MCQ";
  }

  const isShort = /\bshort\b/.test(text) || text.includes("short question");

  if (isShort) {
    return "Short";
  }

  const isCq =
    /\bcqs?\b/.test(text) ||
    text.includes("creative") ||
    text.includes("stimulus") ||
    text.includes("contextual");

  if (isCq) {
    return "CQ";
  }

  return "Descriptive";
}

function normalizeCreativeSubQuestions(value: unknown): CreativeSubQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): CreativeSubQuestion | null => {
      const part = (item || {}) as Record<string, unknown>;

      const question = cleanMultilineText(
        part.question ?? part.prompt ?? part.text,
        1600,
      );

      if (!question) {
        return null;
      }

      const rawMarks = Number(part.marks);

      return {
        label: String(part.label ?? "").trim(),
        question,
        marks:
          Number.isFinite(rawMarks) && rawMarks > 0
            ? Math.max(1, Math.min(10, Math.round(rawMarks)))
            : 1,
        answer: cleanMultilineText(part.answer, 2400) || undefined,
      };
    })
    .filter((part): part is CreativeSubQuestion => part !== null)
    .slice(0, 5);
}

function normalizeQuestions(raw: unknown[]): Question[] {
  return raw
    .map((item, index) => {
      const q = (item || {}) as Record<string, unknown>;

      const type = normalizeQuestionType(q.type);

      const rawOptions = Array.isArray(q.options)
        ? q.options.map((option) => String(option ?? "").trim()).filter(Boolean)
        : [];

      const options =
        type === "MCQ" && rawOptions.length ? rawOptions : undefined;

      const stimulus =
        type === "CQ"
          ? cleanMultilineText(
              q.stimulus ?? q.scenario ?? q.context ?? q.preamble,
              3500,
            )
          : undefined;

      const subQuestions =
        type === "CQ"
          ? normalizeCreativeSubQuestions(
              q.subQuestions ?? q.parts ?? q.subquestions,
            )
          : undefined;

      const rawMarks = Number(q.marks);

      const calculatedCreativeMarks =
        subQuestions?.reduce((sum, part) => sum + part.marks, 0) || 0;

      const fallbackMarks =
        type === "MCQ"
          ? 1
          : type === "Short"
            ? 2
            : type === "CQ"
              ? Math.max(1, calculatedCreativeMarks || 10)
              : 5;

      const creativeFormat: Question["creativeFormat"] =
        q.creativeFormat === "contextual_structured"
          ? "contextual_structured"
          : type === "CQ"
            ? "traditional_cq"
            : undefined;

      return {
        id: String(
          q.id ||
            `question-${index + 1}-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
        ),
        type,
        question:
          type === "CQ"
            ? String(q.question || "Creative Question").trim()
            : String(q.question || q.text || "Untitled question").trim(),
        options,
        answer: q.answer ? String(q.answer).trim() : undefined,
        marks:
          Number.isFinite(rawMarks) && rawMarks > 0 ? rawMarks : fallbackMarks,
        stimulus,
        subQuestions,
        creativeFormat,
      };
    })
    .filter((question) =>
      question.type === "CQ"
        ? Boolean(
            question.stimulus &&
            question.subQuestions &&
            question.subQuestions.length >= 2,
          )
        : question.question.trim().length > 0,
    );
}

function getQuestionSectionType(row: HTMLElement): Question["type"] | null {
  const section = row.closest<HTMLElement>("[data-paper-question-group-type]");

  const value = section?.dataset.paperQuestionGroupType;

  if (
    value === "MCQ" ||
    value === "Short" ||
    value === "CQ" ||
    value === "Descriptive"
  ) {
    return value;
  }

  return null;
}

function solveBalancedJointPrintPagination(
  rows: JointPrintRowMetric[],
  sectionMetrics: Map<Question["type"], JointPrintSectionMetric>,
  capacities: number[],
): JointPrintPage[] | null {
  const questionCount = rows.length;

  const pageCount = capacities.length;

  if (!questionCount || !pageCount || pageCount > questionCount) {
    return null;
  }

  const prefixHeights = new Array<number>(questionCount + 1).fill(0);

  const types: Question["type"][] = ["MCQ", "Short", "CQ", "Descriptive"];

  const prefixCounts = new Map<Question["type"], number[]>();

  types.forEach((type) => {
    prefixCounts.set(type, new Array<number>(questionCount + 1).fill(0));
  });

  rows.forEach((row, index) => {
    prefixHeights[index + 1] = prefixHeights[index] + row.height;

    types.forEach((type) => {
      const prefix = prefixCounts.get(type)!;

      prefix[index + 1] = prefix[index] + (row.type === type ? 1 : 0);
    });
  });

  const segmentHeight = (start: number, end: number): number => {
    if (start >= end) {
      return 0;
    }

    let total = prefixHeights[end] - prefixHeights[start];

    types.forEach((type) => {
      const metric = sectionMetrics.get(type);

      const prefix = prefixCounts.get(type)!;

      const count = prefix[end] - prefix[start];

      if (!metric || count <= 0) {
        return;
      }

      total += metric.fixedOverhead;

      total += Math.max(0, count - 1) * metric.rowGap;

      total += metric.marginBottom;
    });

    return total;
  };

  const dp: number[][] = Array.from(
    {
      length: pageCount + 1,
    },
    () => new Array<number>(questionCount + 1).fill(Number.POSITIVE_INFINITY),
  );

  const previous: number[][] = Array.from(
    {
      length: pageCount + 1,
    },
    () => new Array<number>(questionCount + 1).fill(-1),
  );

  dp[0][0] = 0;

  for (let page = 1; page <= pageCount; page += 1) {
    const capacity = capacities[page - 1];

    if (capacity <= 0) {
      return null;
    }

    for (let end = page; end <= questionCount; end += 1) {
      for (let start = page - 1; start < end; start += 1) {
        const previousCost = dp[page - 1][start];

        if (!Number.isFinite(previousCost)) {
          continue;
        }

        const height = segmentHeight(start, end);

        if (height <= 0 || height > capacity + 0.5) {
          continue;
        }

        const fill = Math.max(height / capacity, 0.000001);

        const balanceCost = -Math.log(fill);

        const candidateCost = previousCost + balanceCost;

        if (candidateCost < dp[page][end] - 1e-9) {
          dp[page][end] = candidateCost;

          previous[page][end] = start;
        }
      }
    }
  }

  if (!Number.isFinite(dp[pageCount][questionCount])) {
    return null;
  }

  const pages: JointPrintPage[] = [];

  let end = questionCount;

  for (let page = pageCount; page >= 1; page -= 1) {
    const start = previous[page][end];

    if (start < 0) {
      return null;
    }

    pages.unshift({
      start,
      end,
    });

    end = start;
  }

  return pages;
}

export function useQuestionManager() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [selectedTab, setSelectedTab] = useState<"browse" | "auto">("browse");

  const [filtersOpen, setFiltersOpen] = useState(true);

  const [openFilter, setOpenFilter] = useState<FilterKey>(null);

  const [selectedClass, setSelectedClass] = useState("");

  const [selectedSubject, setSelectedSubject] = useState("");

  const [selectedChapter, setSelectedChapter] = useState("");

  const [selectedQuestionType, setSelectedQuestionType] =
    useState("All question types");

  const [searchQuery, setSearchQuery] = useState("");

  const [questionSearchQuery, setQuestionSearchQuery] = useState("");

  const [resultTypeTab, setResultTypeTab] = useState<"all" | Question["type"]>(
    "all",
  );

  const [subjects, setSubjects] = useState<FilterOption[]>([]);

  const [chapters, setChapters] = useState<FilterOption[]>([]);

  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [loadingChapters, setLoadingChapters] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);

  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  const [jointPageByQuestionId, setJointPageByQuestionId] = useState<
    Record<string, number>
  >({});

  const [activeJointPage, setActiveJointPage] = useState(0);

  const [jointPageCount, setJointPageCount] = useState(2);

  // Kept in sync below so the prune effect (further down) can always
  // read the latest page count without needing it in its own
  // dependency array — that would prune a page the instant "+ Page"
  // creates it, before the user gets a chance to drag anything in.
  const jointPageCountRef = useRef(jointPageCount);

  useEffect(() => {
    jointPageCountRef.current = jointPageCount;
  }, [jointPageCount]);

  const [jointAutoPackVersion, setJointAutoPackVersion] = useState(0);

  const [jointLayoutMode, setJointLayoutMode] = useState<"auto" | "manual">(
    "auto",
  );

  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [questionError, setQuestionError] = useState("");

  const [pageSize, setPageSize] = useState<"A4" | "A5" | "Joint">("A4");

  const [fontScale, setFontScale] = useState(100);

  const [setNoEnabled, setSetNoEnabled] = useState(false);

  const [setNo, setSetNo] = useState("");

  const [selectAnswerEnabled, setSelectAnswerEnabled] = useState(false);

  const [headerNoteEnabled, setHeaderNoteEnabled] = useState(false);

  const [headerNote, setHeaderNote] = useState("");

  const [footerText, setFooterText] = useState("The End");

  const [logoUrl, setLogoUrl] = useState("");

  const [institutionName, setInstitutionName] = useState("");

  const [examName, setExamName] = useState("");

  const [timeText, setTimeText] = useState("e.g. 3 hours");

  const [paperStyle, setPaperStyle] = useState<"Classic" | "Compact">(
    "Classic",
  );

  const [layoutOpen, setLayoutOpen] = useState(false);

  const [layoutColumns, setLayoutColumns] = useState<1 | 2>(1);

  const [compactSpacing, setCompactSpacing] = useState(false);

  const [autoCount, setAutoCount] = useState(10);

  const [saveStatus, setSaveStatus] = useState("");

  const [savedPapersRefreshKey, setSavedPapersRefreshKey] = useState(0);

  const [currentSavedPaperId, setCurrentSavedPaperId] = useState<string | null>(
    null,
  );

  const savedQuestionsFingerprintRef = useRef("");

  const [draggedId, setDraggedId] = useState<string | null>(null);

  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const [editingMarkId, setEditingMarkId] = useState<string | null>(null);

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );

  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const [questionLayoutById, setQuestionLayoutById] = useState<
    Record<string, QuestionLayout>
  >({});

  const [annotations, setAnnotations] = useState<PaperAnnotation[]>([]);

  /*
   * Central state for Select Area text.
   *
   * Example:
   * canvas:annotation-region-123
   *   -> "ইয়ো ইয়ো"
   */
  const [canvasTextOverrides, setCanvasTextOverrides] = useState<
    Record<string, string>
  >({});

  const [regionSelectMode, setRegionSelectMode] = useState(false);

  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(
    null,
  );

  const [overflowJointPages, setOverflowJointPages] = useState<number[]>([]);

  const [answerSelections, setAnswerSelections] = useState<
    Record<string, string>
  >({});

  const [sectionMarks, setSectionMarks] = useState<
    Record<Question["type"], number>
  >(DEFAULT_SECTION_MARKS);

  const logoInputRef = useRef<HTMLInputElement>(null);

  const layoutRef = useRef<HTMLDivElement>(null);

  const subjectsAbortRef = useRef<AbortController | null>(null);

  const chaptersAbortRef = useRef<AbortController | null>(null);

  const questionsAbortRef = useRef<AbortController | null>(null);

  const printFrameRef = useRef<HTMLIFrameElement | null>(null);

  const jointAutoPackConsumedRef = useRef(0);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (layoutRef.current && !layoutRef.current.contains(target)) {
        setLayoutOpen(false);
      }

      const filterRoot = document.getElementById("question-filter-panel");

      if (filterRoot && !filterRoot.contains(target)) {
        setOpenFilter(null);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    return () => {
      subjectsAbortRef.current?.abort();
      chaptersAbortRef.current?.abort();
      questionsAbortRef.current?.abort();

      printFrameRef.current?.remove();
      printFrameRef.current = null;

      setLogoUrl((current) => {
        if (current.startsWith("blob:")) {
          URL.revokeObjectURL(current);
        }

        return current;
      });

      setAnnotations([]);
      setCanvasTextOverrides({});
      setQuestionLayoutById({});
      setEditingQuestionId(null);
      setActiveQuestionId(null);
    };
  }, []);

  useEffect(() => {
    if (!selectedQuestions.length) {
      return;
    }

    setSectionMarks((current) => {
      const next = {
        ...current,
      };

      for (const question of selectedQuestions) {
        if (!next[question.type]) {
          next[question.type] = question.marks || 1;
        }
      }

      return next;
    });
  }, [selectedQuestions]);

  const visibleQuestions = useMemo(() => {
    const query = questionSearchQuery.trim().toLowerCase();

    return questions.filter((question) => {
      const typeMatches =
        resultTypeTab === "all" || question.type === resultTypeTab;

      const searchMatches =
        !query ||
        question.question.toLowerCase().includes(query) ||
        question.stimulus?.toLowerCase().includes(query) ||
        question.subQuestions?.some((part) =>
          part.question.toLowerCase().includes(query),
        ) ||
        question.options?.some((option) =>
          option.toLowerCase().includes(query),
        );

      return typeMatches && searchMatches;
    });
  }, [questions, questionSearchQuery, resultTypeTab]);

  const selectedIds = useMemo(
    () => new Set(selectedQuestions.map((question) => question.id)),
    [selectedQuestions],
  );

  const totalMarks = useMemo(
    () =>
      selectedQuestions.reduce(
        (sum, question) => sum + Math.max(1, Number(question.marks) || 1),
        0,
      ),
    [selectedQuestions],
  );

  const typeCounts = useMemo(
    () => ({
      all: questions.length,
      MCQ: questions.filter((q) => q.type === "MCQ").length,
      Short: questions.filter((q) => q.type === "Short").length,
      CQ: questions.filter((q) => q.type === "CQ").length,
      Descriptive: questions.filter((q) => q.type === "Descriptive").length,
    }),
    [questions],
  );

  const jointRenderPageCount = Math.max(1, jointPageCount);

  const jointQuestionsByPage = useMemo(() => {
    const pages = Array.from(
      {
        length: jointRenderPageCount,
      },
      () => [] as Question[],
    );

    selectedQuestions.forEach((question) => {
      const rawPage = jointPageByQuestionId[question.id];

      const pageIndex = Number.isFinite(rawPage)
        ? Math.max(0, Math.min(jointRenderPageCount - 1, rawPage))
        : 0;

      pages[pageIndex].push(question);
    });

    return pages;
  }, [jointPageByQuestionId, jointRenderPageCount, selectedQuestions]);

  const jointPageIndices = useMemo(
    () =>
      Array.from(
        {
          length: jointRenderPageCount,
        },
        (_, index) => index,
      ),
    [jointRenderPageCount],
  );

  const jointLeftQuestions = jointQuestionsByPage[0] || [];

  const jointRightQuestions = jointQuestionsByPage[1] || [];

  const jointSectionGroupsByPage = useMemo(
    () => jointQuestionsByPage.map((page) => buildSectionGroups(page)),
    [jointQuestionsByPage],
  );

  const jointLeftSectionGroups = jointSectionGroupsByPage[0] || [];

  const jointRightSectionGroups = jointSectionGroupsByPage[1] || [];

  const sectionGroups = useMemo(
    () => buildSectionGroups(selectedQuestions),
    [selectedQuestions],
  );

  const questionNumberMap = useMemo(() => {
    const map = new Map<string, number>();

    const orderedQuestions =
      pageSize === "Joint" ? jointQuestionsByPage.flat() : selectedQuestions;

    orderedQuestions.forEach((question, index) => {
      map.set(question.id, index + 1);
    });

    return map;
  }, [jointQuestionsByPage, pageSize, selectedQuestions]);

  useEffect(() => {
    setActiveJointPage((current) =>
      Math.max(0, Math.min(current, Math.max(0, jointPageCount - 1))),
    );
  }, [jointPageCount]);

  /*
   * Safety net so a page never lingers empty — whatever emptied it.
   *
   * commitJointPages() already drops empty pages when a question is
   * dragged between pages, but a question can also leave a page by
   * being *removed from the paper entirely* (unchecking it in the
   * question list, "select all" toggling off, etc.). Those paths only
   * ever delete that one question's entry from jointPageByQuestionId —
   * they never re-check whether the page it left behind still has
   * anything on it. This effect is the single place that catches every
   * such case: any time the question list or the page assignments
   * change, it looks at every currently existing page, drops the ones
   * with zero questions, and shifts the rest up so there is never a
   * gap. jointPageCount is intentionally NOT a dependency here — a
   * page just added with "+ Page" is empty by definition, and it
   * should survive long enough for the user to drag something into it
   * instead of being pruned the instant it appears.
   */
  useEffect(() => {
    if (pageSize !== "Joint") {
      return;
    }

    if (!selectedQuestions.length) {
      setJointPageByQuestionId({});
      setJointPageCount(1);
      setActiveJointPage(0);
      return;
    }

    const pageCount = Math.max(1, jointPageCountRef.current);

    const pages = Array.from(
      {
        length: pageCount,
      },
      () => [] as Question[],
    );

    selectedQuestions.forEach((question) => {
      const rawPage = jointPageByQuestionId[question.id];

      const pageIndex = Number.isFinite(rawPage)
        ? clampNumber(Math.round(rawPage as number), 0, pageCount - 1)
        : 0;

      pages[pageIndex].push(question);
    });

    const nonEmptyPages = pages.filter((page) => page.length > 0);

    if (nonEmptyPages.length === pages.length) {
      return;
    }

    const nextAssignments: Record<string, number> = {};

    nonEmptyPages.forEach((page, pageIndex) => {
      page.forEach((question) => {
        nextAssignments[question.id] = pageIndex;
      });
    });

    setJointPageByQuestionId(nextAssignments);

    setJointPageCount(Math.max(1, nonEmptyPages.length));
  }, [jointPageByQuestionId, pageSize, selectedQuestions]);

  const paperFontPx = Math.max(9, Math.round(11 * (fontScale / 100)));

  const paperGap =
    compactSpacing || paperStyle === "Compact" ? "gap-2" : "gap-4";

  const markCurrentDocumentDirty = () => {
    setCurrentSavedPaperId(null);

    savedQuestionsFingerprintRef.current = "";
  };

  /*
   * CENTRAL SELECT AREA COMMIT
   *
   * Existing targets:
   *   -> update actual Question/header state
   *
   * Canvas regions:
   *   -> update canvasTextOverrides
   *   -> update matching PaperAnnotation text
   *
   * This is the permanent source of truth.
   */
  const handleRegionTargetCommit = (targetId: string, value: string) => {
    const target = parseRegionTargetId(targetId);

    if (!target) {
      return;
    }

    const cleanedValue = value
      .replace(/\u00a0/g, " ")
      .replace(/\r\n?/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    switch (target.kind) {
      case "institution": {
        setInstitutionName(cleanedValue);
        break;
      }

      case "exam": {
        setExamName(cleanedValue);
        break;
      }

      case "setNo": {
        setSetNo(cleanedValue);
        break;
      }

      case "headerNote": {
        setHeaderNote(cleanedValue);
        break;
      }

      case "footer": {
        setFooterText(cleanedValue);
        break;
      }

      case "subject": {
        setCanvasTextOverrides((current) => ({
          ...current,
          [targetId]: cleanedValue,
        }));
        break;
      }

      case "class": {
        setCanvasTextOverrides((current) => ({
          ...current,
          [targetId]: cleanedValue,
        }));
        break;
      }

      case "chapter": {
        setCanvasTextOverrides((current) => ({
          ...current,
          [targetId]: cleanedValue,
        }));
        break;
      }

      case "time": {
        setCanvasTextOverrides((current) => ({
          ...current,
          [targetId]: cleanedValue,
        }));
        break;
      }

      case "fullMarks": {
        setCanvasTextOverrides((current) => ({
          ...current,
          [targetId]: cleanedValue,
        }));
        break;
      }

      case "question": {
        if (!target.questionId) {
          return;
        }

        setSelectedQuestions((current) =>
          current.map((question) =>
            question.id === target.questionId
              ? {
                  ...question,
                  question: cleanedValue,
                }
              : question,
          ),
        );

        setActiveQuestionId(target.questionId);
        break;
      }

      case "stimulus": {
        if (!target.questionId) {
          return;
        }

        setSelectedQuestions((current) =>
          current.map((question) => {
            if (question.id !== target.questionId || question.type !== "CQ") {
              return question;
            }

            return {
              ...question,
              stimulus: cleanedValue || undefined,
            };
          }),
        );

        setActiveQuestionId(target.questionId);

        break;
      }

      case "part": {
        if (!target.questionId || target.partIndex == null) {
          return;
        }

        setSelectedQuestions((current) =>
          current.map((question) => {
            if (question.id !== target.questionId || question.type !== "CQ") {
              return question;
            }

            const parts = [...(question.subQuestions || [])];

            if (target.partIndex! < 0 || target.partIndex! >= parts.length) {
              return question;
            }

            parts[target.partIndex!] = {
              ...parts[target.partIndex!],
              question: cleanedValue,
            };

            return {
              ...question,
              subQuestions: parts,
            };
          }),
        );

        setActiveQuestionId(target.questionId);

        break;
      }

      case "partLabel": {
        if (!target.questionId || target.partIndex == null) {
          return;
        }

        setSelectedQuestions((current) =>
          current.map((question) => {
            if (question.id !== target.questionId || question.type !== "CQ") {
              return question;
            }

            const parts = [...(question.subQuestions || [])];

            if (target.partIndex! < 0 || target.partIndex! >= parts.length) {
              return question;
            }

            parts[target.partIndex!] = {
              ...parts[target.partIndex!],
              label: cleanedValue.replace(/\.$/, "").trim(),
            };

            return {
              ...question,
              subQuestions: parts,
            };
          }),
        );

        setActiveQuestionId(target.questionId);

        break;
      }

      case "option": {
        if (!target.questionId || target.optionIndex == null) {
          return;
        }

        setSelectedQuestions((current) =>
          current.map((question) => {
            if (question.id !== target.questionId || question.type !== "MCQ") {
              return question;
            }

            const options = [...(question.options || [])];

            if (
              target.optionIndex! < 0 ||
              target.optionIndex! >= options.length
            ) {
              return question;
            }

            options[target.optionIndex!] = cleanedValue;

            return {
              ...question,
              options,
            };
          }),
        );

        setActiveQuestionId(target.questionId);

        break;
      }

      case "canvasText": {
        /*
         * IMPORTANT:
         *
         * Keep the override even when empty.
         * This prevents deleted/default text from
         * immediately coming back.
         */
        setCanvasTextOverrides((current) => ({
          ...current,
          [targetId]: cleanedValue,
        }));

        /*
         * Dynamic Select Area regions are represented as:
         *
         * canvas:<annotation-id>
         *
         * So the same commit also updates the
         * permanent PaperAnnotation.
         */
        if (targetId.startsWith("canvas:")) {
          const annotationId = targetId.slice("canvas:".length);

          setAnnotations((current) =>
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

        break;
      }
    }

    markCurrentDocumentDirty();
  };

  const updateSelectedQuestions = (
    updater: (current: Question[]) => Question[],
  ) => {
    setSelectedQuestions((current) => updater(current));
  };

  const toggleSelectQuestion = (question: Question) => {
    const exists = selectedIds.has(question.id);

    if (exists) {
      setSelectedQuestions((current) =>
        current.filter((item) => item.id !== question.id),
      );

      setAnswerSelections((current) => {
        const next = {
          ...current,
        };

        delete next[question.id];

        return next;
      });

      setJointPageByQuestionId((assignments) => {
        const next = {
          ...assignments,
        };

        delete next[question.id];

        return next;
      });

      setQuestionLayoutById((current) => {
        if (!current[question.id]) {
          return current;
        }

        const next = {
          ...current,
        };

        delete next[question.id];

        return next;
      });

      /*
       * Any Select Area overrides attached
       * to this question should also go away.
       */
      setCanvasTextOverrides((current) => {
        const next = {
          ...current,
        };

        Object.keys(next)
          .filter((key) => key.startsWith(`question:${question.id}:`))
          .forEach((key) => {
            delete next[key];
          });

        return next;
      });
    } else {
      setSelectedQuestions((current) => [...current, question]);

      if (pageSize === "Joint") {
        setJointPageByQuestionId((assignments) => ({
          ...assignments,
          [question.id]: activeJointPage,
        }));

        setJointLayoutMode("manual");
      }
    }

    markCurrentDocumentDirty();
  };

  const handleSelectAll = () => {
    const visibleIds = new Set(visibleQuestions.map((question) => question.id));

    if (pageSize === "Joint") {
      const activeVisibleQuestions = visibleQuestions.filter((question) => {
        const pageIndex = jointPageByQuestionId[question.id];

        return pageIndex === undefined || pageIndex === activeJointPage;
      });

      const activeVisibleIds = new Set(
        activeVisibleQuestions.map((question) => question.id),
      );

      const allVisibleSelected =
        activeVisibleQuestions.length > 0 &&
        activeVisibleQuestions.every((question) =>
          selectedIds.has(question.id),
        );

      if (allVisibleSelected) {
        setSelectedQuestions((current) =>
          current.filter((question) => !activeVisibleIds.has(question.id)),
        );

        setAnswerSelections((current) => {
          const next = {
            ...current,
          };

          activeVisibleIds.forEach((id) => delete next[id]);

          return next;
        });

        setJointPageByQuestionId((assignments) => {
          const next = {
            ...assignments,
          };

          activeVisibleQuestions.forEach((question) => {
            delete next[question.id];
          });

          return next;
        });

        setJointLayoutMode("manual");

        markCurrentDocumentDirty();

        return;
      }

      const currentMap = new Map(
        selectedQuestions.map((question) => [question.id, question]),
      );

      activeVisibleQuestions.forEach((question) => {
        currentMap.set(question.id, question);
      });

      setSelectedQuestions(Array.from(currentMap.values()));

      setJointPageByQuestionId((assignments) => {
        const next = {
          ...assignments,
        };

        activeVisibleQuestions.forEach((question) => {
          next[question.id] = activeJointPage;
        });

        return next;
      });

      setJointLayoutMode("manual");

      markCurrentDocumentDirty();

      return;
    }

    const allVisibleSelected =
      visibleQuestions.length > 0 &&
      visibleQuestions.every((question) => selectedIds.has(question.id));

    setSelectedQuestions((current) => {
      if (allVisibleSelected) {
        return current.filter((question) => !visibleIds.has(question.id));
      }

      const currentMap = new Map(
        current.map((question) => [question.id, question]),
      );

      visibleQuestions.forEach((question) =>
        currentMap.set(question.id, question),
      );

      return [...currentMap.values()];
    });

    markCurrentDocumentDirty();
  };

  const clearSelectedQuestions = () => {
    setSelectedQuestions([]);

    setJointPageByQuestionId({});

    setActiveJointPage(0);
    setJointPageCount(2);
    setAnswerSelections({});
    setEditingMarkId(null);
    setEditingQuestionId(null);
    setActiveQuestionId(null);
    setQuestionLayoutById({});
    setAnnotations([]);
    setCanvasTextOverrides({});
    setActiveAnnotationId(null);
    setRegionSelectMode(false);
    setCurrentSavedPaperId(null);
    savedQuestionsFingerprintRef.current = "";
  };

  const handlePageSizeChange = (size: "A4" | "A5" | "Joint") => {
    if (size === pageSize) {
      return;
    }

    if (size === "Joint") {
      const nextAssignments: Record<string, number> = {};

      selectedQuestions.forEach((question) => {
        nextAssignments[question.id] = 0;
      });

      setJointPageByQuestionId(nextAssignments);

      setActiveJointPage(0);

      setJointPageCount(selectedQuestions.length > 1 ? 2 : 1);

      setJointLayoutMode("auto");

      setPageSize("Joint");

      setJointAutoPackVersion((current) => {
        const next = current + 1;

        if (!selectedQuestions.length) {
          jointAutoPackConsumedRef.current = next;
        }

        return next;
      });

      markCurrentDocumentDirty();

      return;
    }

    if (pageSize === "Joint") {
      const orderedPages = Array.from(
        {
          length: Math.max(1, jointPageCount),
        },
        () => [] as Question[],
      );

      selectedQuestions.forEach((question) => {
        const pageIndex = clampNumber(
          Number(jointPageByQuestionId[question.id] ?? 0),
          0,
          Math.max(0, orderedPages.length - 1),
        );

        orderedPages[pageIndex].push(question);
      });

      setSelectedQuestions(orderedPages.flat());

      setJointPageByQuestionId({});

      setActiveJointPage(0);

      setJointPageCount(2);

      setJointLayoutMode("auto");
    }

    setPageSize(size);

    markCurrentDocumentDirty();
  };

  const getCurrentJointPages = (): Question[][] => {
    const pageCount = Math.max(2, jointPageCount);

    const pages = Array.from(
      {
        length: pageCount,
      },
      () => [] as Question[],
    );

    selectedQuestions.forEach((question) => {
      const pageIndex = clampNumber(
        Number(jointPageByQuestionId[question.id] ?? 0),
        0,
        pageCount - 1,
      );

      pages[pageIndex].push(question);
    });

    return pages;
  };

  const commitJointPages = (pages: Question[][]) => {
    // Drop any page that ended up with zero questions after this move.
    // Without this, a page emptied by dragging its last question away
    // keeps occupying a slot (and shows up as a blank sheet on
    // print/PDF) because jointPageCount never shrank back down.
    const nonEmptyPages = pages.filter((page) => page.length > 0);

    const nextPages = nonEmptyPages.length ? nonEmptyPages : [[]];

    const nextAssignments: Record<string, number> = {};

    nextPages.forEach((page, pageIndex) => {
      page.forEach((question) => {
        nextAssignments[question.id] = pageIndex;
      });
    });

    setSelectedQuestions(nextPages.flat());

    setJointPageByQuestionId(nextAssignments);

    setJointPageCount(Math.max(2, nextPages.length));

    setJointLayoutMode("manual");

    markCurrentDocumentDirty();
  };

  const moveQuestionToPage = (questionId: string, targetPage: number) => {
    if (pageSize !== "Joint") {
      return;
    }

    const pages = getCurrentJointPages();

    const target = clampNumber(
      Math.round(targetPage),
      0,
      Math.max(0, pages.length - 1),
    );

    let movedQuestion: Question | null = null;

    pages.forEach((page) => {
      const index = page.findIndex((question) => question.id === questionId);

      if (index >= 0) {
        [movedQuestion] = page.splice(index, 1);
      }
    });

    if (!movedQuestion) {
      return;
    }

    pages[target].push(movedQuestion);

    commitJointPages(pages);
  };

  const handleAutoBalanceJoint = () => {
    if (pageSize !== "Joint" || !selectedQuestions.length) {
      return;
    }

    setJointLayoutMode("auto");

    setQuestionError("");

    setJointAutoPackVersion((current) => current + 1);
  };

  const addJointPage = () => {
    if (pageSize !== "Joint") {
      return;
    }

    setJointPageCount((current) => current + 1);

    setJointLayoutMode("manual");

    markCurrentDocumentDirty();
  };

  const removeLastJointPage = () => {
    if (pageSize !== "Joint" || jointPageCount <= 1) {
      return;
    }

    const lastPageIndex = jointPageCount - 1;

    const hasContent = (jointQuestionsByPage[lastPageIndex] || []).length > 0;

    if (hasContent) {
      setQuestionError(
        "Move the questions off the last page before removing it.",
      );

      return;
    }

    setJointPageCount((current) => Math.max(1, current - 1));

    setAnnotations((current) =>
      current.filter((annotation) => annotation.pageIndex !== lastPageIndex),
    );

    setActiveJointPage((current) =>
      Math.min(current, Math.max(0, jointPageCount - 2)),
    );

    setJointLayoutMode("manual");

    markCurrentDocumentDirty();
  };

  const moveQuestion = (dragId: string, targetId: string) => {
    if (dragId === targetId) {
      return;
    }

    if (pageSize !== "Joint") {
      updateSelectedQuestions((current) => {
        const sourceIndex = current.findIndex(
          (question) => question.id === dragId,
        );

        const targetIndex = current.findIndex(
          (question) => question.id === targetId,
        );

        if (sourceIndex < 0 || targetIndex < 0) {
          return current;
        }

        if (current[sourceIndex].type !== current[targetIndex].type) {
          return current;
        }

        const next = [...current];

        const [moved] = next.splice(sourceIndex, 1);

        next.splice(targetIndex, 0, moved);

        return next;
      });

      markCurrentDocumentDirty();

      return;
    }

    const pages = getCurrentJointPages();

    let sourcePage = -1;
    let targetPage = -1;

    pages.forEach((page, pageIndex) => {
      if (page.some((question) => question.id === dragId)) {
        sourcePage = pageIndex;
      }

      if (page.some((question) => question.id === targetId)) {
        targetPage = pageIndex;
      }
    });

    if (sourcePage < 0 || targetPage < 0) {
      return;
    }

    const sourceList = pages[sourcePage];

    const sourceIndex = sourceList.findIndex(
      (question) => question.id === dragId,
    );

    if (sourceIndex < 0) {
      return;
    }

    const [movedQuestion] = sourceList.splice(sourceIndex, 1);

    const targetIndex = pages[targetPage].findIndex(
      (question) => question.id === targetId,
    );

    if (targetIndex < 0 || !movedQuestion) {
      return;
    }

    pages[targetPage].splice(targetIndex, 0, movedQuestion);

    commitJointPages(pages);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    event.stopPropagation();

    if (draggedId) {
      moveQuestion(draggedId, targetId);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handlePageDrop = (
    event: DragEvent<HTMLDivElement>,
    targetPage: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!draggedId || pageSize !== "Joint") {
      setDraggedId(null);
      return;
    }

    moveQuestionToPage(draggedId, targetPage);

    setDraggedId(null);
    setDragOverId(null);
  };

  const resetDocumentEditingState = () => {
    setSelectedQuestions([]);

    setJointPageByQuestionId({});

    setActiveJointPage(0);
    setJointPageCount(2);

    setJointLayoutMode("auto");

    setAnnotations([]);
    setCanvasTextOverrides({});
    setActiveAnnotationId(null);

    setRegionSelectMode(false);

    setQuestionLayoutById({});

    setEditingQuestionId(null);

    setActiveQuestionId(null);

    setCurrentSavedPaperId(null);

    savedQuestionsFingerprintRef.current = "";

    setAnswerSelections({});
    setEditingMarkId(null);
  };

  const handleClassChange = async (classValue: string) => {
    subjectsAbortRef.current?.abort();
    chaptersAbortRef.current?.abort();
    questionsAbortRef.current?.abort();

    setSelectedClass(classValue);

    setSelectedSubject("");
    setSelectedChapter("");

    setSubjects([]);
    setChapters([]);
    setQuestions([]);

    resetDocumentEditingState();

    setQuestionSearchQuery("");

    setOpenFilter(null);
    setQuestionError("");

    if (!classValue) {
      return;
    }

    const controller = new AbortController();

    subjectsAbortRef.current = controller;

    setLoadingSubjects(true);

    try {
      const data = await fetchJson<{
        success?: boolean;
        subjects?: FilterOption[];
        error?: string;
      }>("/api/get-subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          className: classValue,
        }),
        signal: controller.signal,
      });

      if (!data.success || !Array.isArray(data.subjects)) {
        throw new ApiRequestError(
          data.error || "The subjects response was invalid.",
        );
      }

      const validSubjects = data.subjects
        .map((item) => ({
          label: String(item?.label || "").trim(),
          value: String(item?.value || "").trim(),
        }))
        .filter((item) => item.label && item.value);

      if (!validSubjects.length) {
        throw new ApiRequestError("No subjects were returned for this class.");
      }

      setSubjects(validSubjects);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      console.error("Error fetching subjects:", error);

      setSubjects([]);

      setQuestionError(
        error instanceof ApiRequestError
          ? error.message
          : "Could not load subjects. Please try again.",
      );
    } finally {
      if (subjectsAbortRef.current === controller) {
        subjectsAbortRef.current = null;

        setLoadingSubjects(false);
      }
    }
  };

  const handleSubjectChange = async (subjectValue: string) => {
    chaptersAbortRef.current?.abort();
    questionsAbortRef.current?.abort();

    setSelectedSubject(subjectValue);

    setSelectedChapter("");

    setChapters([]);
    setQuestions([]);

    resetDocumentEditingState();

    setQuestionSearchQuery("");

    setOpenFilter(null);
    setQuestionError("");

    if (!subjectValue || !selectedClass) {
      return;
    }

    const subjectName =
      subjects.find((subject) => subject.value === subjectValue)?.label ||
      subjectValue;

    const controller = new AbortController();

    chaptersAbortRef.current = controller;

    setLoadingChapters(true);

    try {
      const data = await fetchJson<{
        success?: boolean;
        chapters?: FilterOption[];
        error?: string;
      }>("/api/get-chapters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          className: selectedClass,
          subjectName,
        }),
        signal: controller.signal,
      });

      if (!data.success || !Array.isArray(data.chapters)) {
        throw new ApiRequestError(
          data.error || "The chapters response was invalid.",
        );
      }

      const validChapters = data.chapters
        .map((item) => ({
          label: String(item?.label || "").trim(),
          value: String(item?.value || "").trim(),
        }))
        .filter((item) => item.label && item.value);

      if (!validChapters.length) {
        throw new ApiRequestError(
          "No chapters were returned for this subject.",
        );
      }

      setChapters(validChapters);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      console.error("Error fetching chapters:", error);

      setChapters([]);

      setQuestionError(
        error instanceof ApiRequestError
          ? error.message
          : "Could not load chapters. Please try again.",
      );
    } finally {
      if (chaptersAbortRef.current === controller) {
        chaptersAbortRef.current = null;

        setLoadingChapters(false);
      }
    }
  };

  const handleChapterChange = (chapterValue: string) => {
    questionsAbortRef.current?.abort();

    setSelectedChapter(chapterValue);

    setOpenFilter(null);
    setQuestions([]);

    resetDocumentEditingState();

    setQuestionSearchQuery("");

    setResultTypeTab("all");
    setQuestionError("");
  };

  const handleFetchQuestions = async () => {
    if (!selectedClass || !selectedSubject || !selectedChapter) {
      return;
    }

    questionsAbortRef.current?.abort();

    const controller = new AbortController();

    questionsAbortRef.current = controller;

    const subjectName =
      subjects.find((subject) => subject.value === selectedSubject)?.label ||
      selectedSubject;

    const chapterName =
      chapters.find((chapter) => chapter.value === selectedChapter)?.label ||
      selectedChapter;

    setLoadingQuestions(true);

    setQuestionError("");
    setOpenFilter(null);

    try {
      const data = await fetchJson<{
        success?: boolean;
        questions?: unknown[];
        error?: string;
      }>("/api/get-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          className: selectedClass,
          subjectName,
          chapterName,
          questionType: selectedQuestionType,
          searchQuery: searchQuery.trim().slice(0, 200),
        }),
        signal: controller.signal,
      });

      if (!data.success || !Array.isArray(data.questions)) {
        throw new ApiRequestError(
          data.error || "The questions response was invalid.",
        );
      }

      const normalized = normalizeQuestions(data.questions);

      if (!normalized.length) {
        throw new ApiRequestError("No usable questions were returned.");
      }

      setQuestions(normalized);

      if (pageSize !== "Joint") {
        resetDocumentEditingState();
      }

      setQuestionSearchQuery("");

      setResultTypeTab("all");
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      console.error("Error fetching questions:", error);

      setQuestions([]);

      if (pageSize !== "Joint") {
        resetDocumentEditingState();
      }

      setQuestionSearchQuery("");

      setResultTypeTab("all");

      setQuestionError(
        error instanceof ApiRequestError
          ? error.message
          : "Could not fetch questions. Please try again.",
      );
    } finally {
      if (questionsAbortRef.current === controller) {
        questionsAbortRef.current = null;

        setLoadingQuestions(false);
      }
    }
  };

  const handleAutoCreate = () => {
    if (!questions.length) {
      return;
    }

    const count = Math.max(1, Math.min(autoCount, questions.length));

    if (pageSize !== "Joint") {
      setSelectedQuestions(shuffle(questions).slice(0, count));

      setJointPageByQuestionId({});

      setActiveJointPage(0);

      setCurrentSavedPaperId(null);

      savedQuestionsFingerprintRef.current = "";

      setCanvasTextOverrides({});

      setAnnotations([]);

      setActiveAnnotationId(null);

      return;
    }

    const currentPageQuestions = jointQuestionsByPage[activeJointPage] || [];

    const currentOtherQuestions = selectedQuestions.filter(
      (question) =>
        (jointPageByQuestionId[question.id] ?? 0) !== activeJointPage,
    );

    const otherIds = new Set(
      currentOtherQuestions.map((question) => question.id),
    );

    const candidates = shuffle(questions).filter(
      (question) => !otherIds.has(question.id),
    );

    const nextPageQuestions = candidates.slice(0, count);

    const currentPageIds = new Set(
      currentPageQuestions.map((question) => question.id),
    );

    setSelectedQuestions((current) => {
      const preserved = current.filter(
        (question) => !currentPageIds.has(question.id),
      );

      return [...preserved, ...nextPageQuestions];
    });

    setAnswerSelections((current) => {
      const next = {
        ...current,
      };

      currentPageIds.forEach((id) => delete next[id]);

      return next;
    });

    setJointPageByQuestionId((assignments) => {
      const next = {
        ...assignments,
      };

      currentPageIds.forEach((id) => delete next[id]);

      nextPageQuestions.forEach((question) => {
        next[question.id] = activeJointPage;
      });

      return next;
    });

    /*
     * Auto-create replaces the displayed
     * paper content, so old freeform regions
     * must not remain attached to it.
     */
    setCanvasTextOverrides({});
    setAnnotations([]);
    setActiveAnnotationId(null);

    markCurrentDocumentDirty();
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const url = URL.createObjectURL(file);

    setLogoUrl((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }

      return url;
    });
  };

  const removeLogo = () => {
    setLogoUrl((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }

      return "";
    });

    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (
      pageSize !== "Joint" ||
      !selectedQuestions.length ||
      jointAutoPackVersion <= 0 ||
      jointAutoPackConsumedRef.current === jointAutoPackVersion
    ) {
      return;
    }

    let cancelled = false;

    const frame = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      const measureRoot = document.querySelector(
        '[data-joint-measure-root="true"]',
      ) as HTMLElement | null;

      if (!measureRoot) {
        return;
      }

      const getQuestionAreaCapacity = (
        key: "header" | "header-no-footer" | "no-header" | "no-header-footer",
      ) => {
        const sheet = measureRoot.querySelector(
          `[data-joint-measure-paper="${key}"]`,
        ) as HTMLElement | null;

        if (!sheet) {
          return 0;
        }

        const area = sheet.querySelector(
          '[data-paper-question-area="true"]',
        ) as HTMLElement | null;

        if (!area) {
          return 0;
        }

        const areaHeight = area.getBoundingClientRect().height;

        return Math.max(0, areaHeight - 2);
      };

      const rowSheet = measureRoot.querySelector(
        '[data-joint-measure-paper="rows"]',
      ) as HTMLElement | null;

      if (!rowSheet) {
        return;
      }

      const rows: JointPrintRowMetric[] = [];

      rowSheet
        .querySelectorAll<HTMLElement>('[data-joint-measure-question="true"]')
        .forEach((row) => {
          const id = row.dataset.questionId;

          const type = getQuestionSectionType(row);

          if (!id || !type) {
            return;
          }

          rows.push({
            id,
            type,
            height: Math.max(1, row.getBoundingClientRect().height),
          });
        });

      if (rows.length !== selectedQuestions.length) {
        return;
      }

      const onePageCapacity = getQuestionAreaCapacity("header");

      const firstPageCapacity = getQuestionAreaCapacity("header-no-footer");

      const middlePageCapacity = getQuestionAreaCapacity("no-header");

      const lastPageCapacity = getQuestionAreaCapacity("no-header-footer");

      if (
        onePageCapacity <= 0 ||
        firstPageCapacity <= 0 ||
        middlePageCapacity <= 0 ||
        lastPageCapacity <= 0
      ) {
        return;
      }

      const sectionMetrics = new Map<
        Question["type"],
        JointPrintSectionMetric
      >();

      const measurementSections = Array.from(
        rowSheet.querySelectorAll<HTMLElement>(
          '[data-paper-question-group="true"]',
        ),
      );

      measurementSections.forEach((section, sectionIndex) => {
        const type = sectionGroups[sectionIndex]?.type;

        if (!type) {
          return;
        }

        const sectionRows = Array.from(
          section.querySelectorAll<HTMLElement>(
            '[data-joint-measure-question="true"]',
          ),
        );

        const sectionHeight = section.getBoundingClientRect().height;

        const rowsHeight = sectionRows.reduce(
          (sum, row) => sum + Math.max(1, row.getBoundingClientRect().height),
          0,
        );

        const rowsContainer = section.querySelector(
          '[data-paper-question-rows="true"]',
        ) as HTMLElement | null;

        const computedRows = rowsContainer
          ? getComputedStyle(rowsContainer)
          : null;

        const rowGapValue = parseFloat(
          computedRows?.rowGap || computedRows?.gap || "0",
        );

        const rowGap = Number.isFinite(rowGapValue) ? rowGapValue : 0;

        const marginBottomValue = parseFloat(
          getComputedStyle(section).marginBottom || "0",
        );

        const marginBottom = Number.isFinite(marginBottomValue)
          ? marginBottomValue
          : 0;

        const totalInternalGap = Math.max(0, sectionRows.length - 1) * rowGap;

        const fixedOverhead = Math.max(
          0,
          sectionHeight - rowsHeight - totalInternalGap,
        );

        sectionMetrics.set(type, {
          fixedOverhead,
          rowGap,
          marginBottom,
        });
      });

      let pagePlan: JointPrintPage[] | null = null;

      const minimumJointPageCount = selectedQuestions.length > 1 ? 2 : 1;

      for (
        let pageCount = minimumJointPageCount;
        pageCount <= selectedQuestions.length;
        pageCount += 1
      ) {
        const capacities =
          pageCount === 1
            ? [onePageCapacity]
            : Array.from(
                {
                  length: pageCount,
                },
                (_, pageIndex) => {
                  if (pageIndex === 0) {
                    return firstPageCapacity;
                  }

                  if (pageIndex === pageCount - 1) {
                    return lastPageCapacity;
                  }

                  return middlePageCapacity;
                },
              );

        const candidate = solveBalancedJointPrintPagination(
          rows,
          sectionMetrics,
          capacities,
        );

        if (candidate) {
          pagePlan = candidate;
          break;
        }
      }

      if (!pagePlan) {
        setQuestionError(
          "The selected questions cannot fit on the printable A5 pages at the current font size. Reduce the font size or use A4.",
        );

        setJointPageCount(2);

        setActiveJointPage(0);

        return;
      }

      if (cancelled) {
        return;
      }

      const nextAssignments: Record<string, number> = {};

      pagePlan.forEach((page, pageIndex) => {
        for (let index = page.start; index < page.end; index += 1) {
          nextAssignments[selectedQuestions[index].id] = pageIndex;
        }
      });

      jointAutoPackConsumedRef.current = jointAutoPackVersion;

      setQuestionError((current) =>
        current.startsWith("The selected questions cannot fit") ? "" : current,
      );

      setJointPageCount(pagePlan.length);

      setJointPageByQuestionId(nextAssignments);

      setActiveJointPage((current) =>
        Math.min(Math.max(0, current), Math.max(0, pagePlan!.length - 1)),
      );
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [
    compactSpacing,
    fontScale,
    jointAutoPackVersion,
    pageSize,
    paperGap,
    paperStyle,
    selectedQuestions,
    sectionGroups,
  ]);

  const shuffleSelected = () => {
    if (pageSize !== "Joint") {
      setSelectedQuestions((current) => shuffle(current));

      setCurrentSavedPaperId(null);

      savedQuestionsFingerprintRef.current = "";

      return;
    }

    const activePageQuestions = jointQuestionsByPage[activeJointPage] || [];

    const activeIds = new Set(
      activePageQuestions.map((question) => question.id),
    );

    const shuffled = shuffle(activePageQuestions);

    setSelectedQuestions((current) => {
      const next = [...current];

      const indexes = next
        .map((question, index) => ({
          question,
          index,
        }))
        .filter(({ question }) => activeIds.has(question.id))
        .map(({ index }) => index);

      indexes.forEach((index, orderIndex) => {
        next[index] = shuffled[orderIndex];
      });

      return next;
    });

    setCurrentSavedPaperId(null);

    savedQuestionsFingerprintRef.current = "";
  };

  const updateQuestionMark = (id: string, value: number) => {
    const mark = Math.max(
      1,
      Math.min(100, Number.isFinite(value) ? Math.round(value) : 1),
    );

    updateSelectedQuestions((current) =>
      current.map((question) =>
        question.id === id
          ? {
              ...question,
              marks: mark,
            }
          : question,
      ),
    );

    setCanvasTextOverrides((current) => {
      const key = `question:${id}:marks`;

      if (!Object.prototype.hasOwnProperty.call(current, key)) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[key];

      return next;
    });

    markCurrentDocumentDirty();
  };

  const updateSectionMarks = (type: Question["type"], value: number) => {
    const mark = Math.max(
      1,
      Math.min(100, Number.isFinite(value) ? Math.round(value) : 1),
    );

    setSectionMarks((current) => ({
      ...current,
      [type]: mark,
    }));

    updateSelectedQuestions((current) =>
      current.map((question) =>
        question.type === type
          ? {
              ...question,
              marks: mark,
            }
          : question,
      ),
    );

    markCurrentDocumentDirty();
  };

  const updateQuestionContent = (updatedQuestion: Question) => {
    updateSelectedQuestions((current) =>
      current.map((question) =>
        question.id === updatedQuestion.id ? updatedQuestion : question,
      ),
    );

    setEditingQuestionId(null);

    setActiveQuestionId(updatedQuestion.id);

    markCurrentDocumentDirty();
  };

  const replaceQuestion = (questionId: string, replacement: Question) => {
    if (selectedIds.has(replacement.id) && replacement.id !== questionId) {
      setQuestionError("That question is already selected.");

      return;
    }

    const sourcePage =
      pageSize === "Joint" ? Number(jointPageByQuestionId[questionId] ?? 0) : 0;

    updateSelectedQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...replacement,
            }
          : question,
      ),
    );

    if (pageSize === "Joint") {
      setJointPageByQuestionId((current) => {
        const next = {
          ...current,
        };

        delete next[questionId];

        next[replacement.id] = sourcePage;

        return next;
      });
    }

    setQuestionLayoutById((current) => {
      const next = {
        ...current,
      };

      const oldLayout = next[questionId];

      delete next[questionId];

      if (oldLayout) {
        next[replacement.id] = oldLayout;
      }

      return next;
    });

    setAnswerSelections((current) => {
      const next = {
        ...current,
      };

      delete next[questionId];

      return next;
    });

    setCanvasTextOverrides((current) => {
      const next = {
        ...current,
      };

      Object.keys(next)
        .filter((key) => key.startsWith(`question:${questionId}:`))
        .forEach((key) => {
          delete next[key];
        });

      return next;
    });

    setEditingQuestionId(null);

    setActiveQuestionId(replacement.id);

    setQuestionError("");

    markCurrentDocumentDirty();
  };

  const adjustQuestionLayout = (
    questionId: string,
    field: keyof QuestionLayout,
    delta: number,
  ) => {
    setQuestionLayoutById((current) => {
      // Merge with the current default so papers saved before boxScale was
      // introduced remain fully compatible instead of producing NaN.
      const base = {
        ...DEFAULT_QUESTION_LAYOUT,
        ...(current[questionId] || {}),
      };

      let nextValue: number;

      switch (field) {
        case "fontScale":
          nextValue = clampNumber(base.fontScale + delta, 75, 135);
          break;
        case "spacing":
          nextValue = clampNumber(base.spacing + delta, 0, 16);
          break;
        case "boxScale":
          nextValue = clampNumber(base.boxScale + delta, 55, 135);
          break;
        case "offsetX": {
          const visibleWidth = Math.min(
            100,
            clampNumber(base.boxScale, 55, 135),
          );
          const maxOffset = Math.max(0, (100 - visibleWidth) / 2);
          nextValue = clampNumber(base.offsetX + delta, -maxOffset, maxOffset);
          break;
        }
        default:
          nextValue = base[field];
      }

      return {
        ...current,
        [questionId]: {
          ...base,
          [field]: nextValue,
        },
      };
    });

    if (pageSize === "Joint") {
      setJointLayoutMode("manual");
    }

    markCurrentDocumentDirty();
  };

  /*
   * Create a permanent empty-region annotation.
   *
   * IMPORTANT:
   * Returns the generated annotation id.
   *
   * Example:
   * annotation id:
   *   annotation-region-123
   *
   * target id:
   *   canvas:annotation-region-123
   */
  const addRegionTextAnnotation = (
    pageIndex: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ): string => {
    const safeWidth = clampNumber(width, 1, 96);

    const safeHeight = clampNumber(height, 1, 70);

    const annotationId = `annotation-region-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const annotation: PaperAnnotation = {
      id: annotationId,
      pageIndex,
      type: "regionText",
      x: clampNumber(x, 0, 100 - safeWidth),
      y: clampNumber(y, 0, 100 - safeHeight),
      width: safeWidth,
      height: safeHeight,
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

    setAnnotations((current) => [...current, annotation]);

    setActiveAnnotationId(annotation.id);

    setRegionSelectMode(false);

    markCurrentDocumentDirty();

    return annotation.id;
  };

  /*
   * Update any PaperAnnotation.
   *
   * Used by the persistent Select Area editor
   * when the user types or changes the text.
   */
  const updateAnnotation = (id: string, patch: Partial<PaperAnnotation>) => {
    setAnnotations((current) =>
      current.map((annotation) =>
        annotation.id === id
          ? {
              ...annotation,
              ...patch,
            }
          : annotation,
      ),
    );

    /*
     * Keep canvas:<annotation-id> synchronized
     * with the annotation text.
     */
    if (Object.prototype.hasOwnProperty.call(patch, "text")) {
      const targetId = `canvas:${id}`;

      const nextValue = String(patch.text ?? "");

      setCanvasTextOverrides((current) => ({
        ...current,
        [targetId]: nextValue,
      }));
    }

    markCurrentDocumentDirty();
  };

  const deleteAnnotation = (annotationId: string) => {
    setAnnotations((current) =>
      current.filter((annotation) => annotation.id !== annotationId),
    );

    /*
     * Remove the paired canvas override too.
     */
    setCanvasTextOverrides((current) => {
      const next = {
        ...current,
      };

      delete next[`canvas:${annotationId}`];

      return next;
    });

    setActiveAnnotationId((current) =>
      current === annotationId ? null : current,
    );

    markCurrentDocumentDirty();
  };

  const deleteActiveAnnotation = () => {
    if (!activeAnnotationId) {
      return;
    }

    deleteAnnotation(activeAnnotationId);
  };

  const clearAllAnnotations = () => {
    if (!annotations.length) {
      return;
    }

    setAnnotations([]);
    setActiveAnnotationId(null);

    /*
     * Dynamic region text overrides belong
     * to annotations, so remove those as well.
     *
     * Keep normal question/header overrides.
     */
    setCanvasTextOverrides((current) => {
      const next = {
        ...current,
      };

      Object.keys(next)
        .filter((key) => key.startsWith("canvas:"))
        .forEach((key) => {
          delete next[key];
        });

      return next;
    });

    markCurrentDocumentDirty();
  };

  useEffect(() => {
    if (pageSize !== "Joint" || !selectedQuestions.length) {
      setOverflowJointPages([]);

      return;
    }

    let frame = 0;

    const measureOverflow = () => {
      window.cancelAnimationFrame(frame);

      frame = window.requestAnimationFrame(() => {
        const overflow = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[data-joint-page-index][data-joint-screen-paper="true"]',
          ),
        )
          .filter((paper) => {
            const area = paper.querySelector<HTMLElement>(
              '[data-paper-question-area="true"]',
            );

            return Boolean(area && area.scrollHeight > area.clientHeight + 2);
          })
          .map((paper) => Number(paper.dataset.jointPageIndex))
          .filter(Number.isFinite);

        setOverflowJointPages(overflow);
      });
    };

    measureOverflow();

    window.addEventListener("resize", measureOverflow);

    return () => {
      window.cancelAnimationFrame(frame);

      window.removeEventListener("resize", measureOverflow);
    };
  }, [
    annotations,
    canvasTextOverrides,
    compactSpacing,
    fontScale,
    jointPageByQuestionId,
    jointPageCount,
    pageSize,
    paperGap,
    paperStyle,
    questionLayoutById,
    selectedQuestions,
  ]);

  const handleSave = async () => {
    const savedSubjectName =
      subjects
        .find((subject) => subject.value === selectedSubject)
        ?.label?.trim() || selectedSubject.trim();

    const savedChapterName =
      chapters
        .find((chapter) => chapter.value === selectedChapter)
        ?.label?.trim() || selectedChapter.trim();

    const savedClassName = selectedClass.trim();

    const draft = {
      selectedQuestions,
      selectedClass: savedClassName,
      selectedSubject: savedSubjectName,
      selectedChapter: savedChapterName,
      pageSize,
      fontScale,
      setNoEnabled,
      setNo,
      selectAnswerEnabled,
      headerNoteEnabled,
      headerNote,
      footerText,
      institutionName,
      examName,
      timeText,
      paperStyle,
      layoutColumns,
      compactSpacing,
      answerSelections,
      sectionMarks,
      questionLayoutById,
      annotations,

      /*
       * Select Area text edits are persisted here.
       */
      canvasTextOverrides,

      regionSelectMode,
      jointLayoutMode,

      jointPages:
        pageSize === "Joint"
          ? {
              pages: jointQuestionsByPage
                .slice(0, jointPageCount)
                .map((page) => page.map((question) => question.id)),
              left: jointLeftQuestions.map((question) => question.id),
              right: jointRightQuestions.map((question) => question.id),
            }
          : null,

      activeJointPage: pageSize === "Joint" ? activeJointPage : null,
    };

    if (!selectedQuestions.length) {
      setSaveStatus("Nothing to save");

      window.setTimeout(() => setSaveStatus(""), 1800);

      return;
    }

    setSaveStatus("Saving...");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/question-papers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
        body: JSON.stringify({
          title: examName.trim() || "Question Paper",
          className: savedClassName,
          subjectName: savedSubjectName,
          chapterName: savedChapterName,
          selectedQuestions,
          settings: draft,
          isDraft: true,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Question paper could not be saved.",
        );
      }

      setSaveStatus("Saved");

      const savedPaperId =
        typeof data?.data?.id === "string" ? data.data.id : null;

      setCurrentSavedPaperId(savedPaperId);

      savedQuestionsFingerprintRef.current = JSON.stringify({
        selectedQuestions,
        jointPageByQuestionId:
          pageSize === "Joint" ? jointPageByQuestionId : {},
        questionLayoutById,
        annotations,
        canvasTextOverrides,
      });

      setSavedPapersRefreshKey((current) => current + 1);
    } catch (error) {
      console.error("Question paper save failed:", error);

      setSaveStatus("Save failed");
    }

    window.setTimeout(() => setSaveStatus(""), 1800);
  };

  const handlePrint = async () => {
    if (!selectedQuestions.length) {
      return;
    }

    if (pageSize === "Joint" && overflowJointPages.length) {
      setQuestionError(
        `Page ${overflowJointPages
          .map((page) => page + 1)
          .join(
            ", ",
          )} overflows the printable area. Move, resize, or rebalance those questions before printing.`,
      );

      return;
    }

    const sourceRoot = document.querySelector(
      ".paper-print-root",
    ) as HTMLElement | null;

    if (!sourceRoot) {
      setQuestionError("Question paper preview is not available for printing.");

      return;
    }

    try {
      const previousTitle = document.title;

      const safeInstitution = institutionName.trim();

      const safeExam = examName.trim();

      document.title =
        [safeInstitution, safeExam, "Question Paper"]
          .filter(Boolean)
          .join(" - ") || "Question Paper";

      const variant: PrintPageVariant = pageSize;

      await printPaperInIsolatedIframe(sourceRoot, variant, printFrameRef);

      window.setTimeout(() => {
        document.title = previousTitle;
      }, 1500);
    } catch (error) {
      console.error("Isolated print failed:", error);

      setQuestionError(
        "Could not prepare the print preview. Please try again.",
      );
    }
  };

  const handleDownloadPdf = handlePrint;

  const handleSavedPaperDeleted = (paperId: string) => {
    if (paperId !== currentSavedPaperId) {
      return;
    }

    savedQuestionsFingerprintRef.current = "";

    setCurrentSavedPaperId(null);

    setSelectedQuestions([]);

    setJointPageByQuestionId({});

    setActiveJointPage(0);
    setJointPageCount(2);

    setAnswerSelections({});
    setEditingMarkId(null);
    setEditingQuestionId(null);
    setActiveQuestionId(null);
    setQuestionLayoutById({});
    setRegionSelectMode(false);
    setAnnotations([]);
    setCanvasTextOverrides({});
    setActiveAnnotationId(null);
  };

  useEffect(() => {
    if (!currentSavedPaperId) {
      return;
    }

    const currentFingerprint = JSON.stringify({
      selectedQuestions,
      jointPageByQuestionId: pageSize === "Joint" ? jointPageByQuestionId : {},
      questionLayoutById,
      annotations,
      canvasTextOverrides,
    });

    if (
      savedQuestionsFingerprintRef.current &&
      currentFingerprint !== savedQuestionsFingerprintRef.current
    ) {
      setCurrentSavedPaperId(null);

      savedQuestionsFingerprintRef.current = currentFingerprint;
    }
  }, [
    annotations,
    canvasTextOverrides,
    currentSavedPaperId,
    jointPageByQuestionId,
    pageSize,
    questionLayoutById,
    selectedQuestions,
  ]);

  return {
    router,
    isAuthenticated,

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

    questionSearchQuery,
    setQuestionSearchQuery,

    resultTypeTab,
    setResultTypeTab,

    subjects,
    chapters,

    loadingSubjects,
    loadingChapters,
    loadingQuestions,

    questions,
    selectedQuestions,
    selectedIds,
    visibleQuestions,
    typeCounts,

    totalMarks,

    jointRenderPageCount,
    jointQuestionsByPage,
    jointPageIndices,

    jointLeftQuestions,
    jointRightQuestions,

    jointSectionGroupsByPage,
    jointLeftSectionGroups,
    jointRightSectionGroups,

    sectionGroups,
    questionNumberMap,

    paperFontPx,
    paperGap,

    jointPageByQuestionId,

    activeJointPage,
    setActiveJointPage,

    jointPageCount,
    jointLayoutMode,

    questionError,

    pageSize,
    fontScale,
    setFontScale,

    setNoEnabled,
    setNo,

    setSetNo,

    selectAnswerEnabled,
    setSelectAnswerEnabled,

    headerNoteEnabled,
    setHeaderNoteEnabled,

    headerNote,
    setHeaderNote,

    footerText,
    setFooterText,

    logoUrl,

    institutionName,
    setInstitutionName,

    examName,
    setExamName,

    timeText,
    setTimeText,

    paperStyle,
    setPaperStyle,

    layoutOpen,
    setLayoutOpen,

    layoutColumns,
    setLayoutColumns,

    compactSpacing,
    setCompactSpacing,

    autoCount,
    setAutoCount,

    saveStatus,

    savedPapersRefreshKey,
    currentSavedPaperId,

    draggedId,
    setDraggedId,

    dragOverId,
    setDragOverId,

    editingMarkId,
    setEditingMarkId,

    editingQuestionId,
    setEditingQuestionId,

    activeQuestionId,
    setActiveQuestionId,

    questionLayoutById,

    annotations,

    /*
     * Select Area state
     */
    canvasTextOverrides,
    setCanvasTextOverrides,

    regionSelectMode,
    setRegionSelectMode,

    activeAnnotationId,
    setActiveAnnotationId,

    overflowJointPages,

    answerSelections,
    setAnswerSelections,

    sectionMarks,

    logoInputRef,
    layoutRef,

    toggleSelectQuestion,
    handleSelectAll,
    clearSelectedQuestions,

    handlePageSizeChange,

    handleAutoBalanceJoint,
    addJointPage,
    removeLastJointPage,

    moveQuestionToPage,
    moveQuestion,

    handleDrop,
    handlePageDrop,

    handleClassChange,
    handleSubjectChange,
    handleChapterChange,
    handleFetchQuestions,

    handleAutoCreate,
    handleLogoChange,
    removeLogo,

    shuffleSelected,

    updateQuestionMark,
    updateSectionMarks,

    updateQuestionContent,
    replaceQuestion,

    adjustQuestionLayout,

    addRegionTextAnnotation,
    updateAnnotation,
    deleteAnnotation,
    deleteActiveAnnotation,
    clearAllAnnotations,

    /*
     * Main Select Area commit callback.
     */
    handleRegionTargetCommit,

    handleSave,
    handlePrint,
    handleDownloadPdf,

    handleSavedPaperDeleted,
  };
}

export type QuestionManager = ReturnType<typeof useQuestionManager>;
