"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import katex from "katex";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

interface SavedQuestion {
  id: string;
  type: string;
  question: string;
  options: string[];
  answer?: string;
  marks: number;
}

interface SavedQuestionPaper {
  id: string;
  title: string;
  className: string;
  subjectName: string;
  chapterName: string;
  selectedQuestions: SavedQuestion[];
  settings?: Record<string, unknown>;
  isDraft?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

type SavedQuestionPapersProps = {
  refreshKey?: number;
  currentPaperId?: string | null;
  onDeleted?: (paperId: string) => void;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeLatex(value: string): string {
  return value.replace(/\\ineq\b/g, "\\neq").replace(/\u2212/g, "-");
}

function renderInlineMath(value: string): string {
  const source = normalizeLatex(value);

  try {
    return katex.renderToString(source, {
      throwOnError: false,
      displayMode: false,
      output: "htmlAndMathml",
      strict: "ignore",
    });
  } catch {
    return escapeHtml(value);
  }
}

function renderRichText(value: string): string {
  if (!value) {
    return "";
  }

  const source = normalizeLatex(value);

  const pieces = source.split(
    /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]+?\$)/g,
  );

  return pieces
    .map((piece) => {
      if (!piece) return "";

      if (piece.startsWith("$$") && piece.endsWith("$$")) {
        return katex.renderToString(piece.slice(2, -2), {
          throwOnError: false,
          displayMode: true,
          output: "htmlAndMathml",
          strict: "ignore",
        });
      }

      if (piece.startsWith("\\[") && piece.endsWith("\\]")) {
        return katex.renderToString(piece.slice(2, -2), {
          throwOnError: false,
          displayMode: true,
          output: "htmlAndMathml",
          strict: "ignore",
        });
      }

      if (piece.startsWith("\\(") && piece.endsWith("\\)")) {
        return renderInlineMath(piece.slice(2, -2));
      }

      if (piece.startsWith("$") && piece.endsWith("$")) {
        return renderInlineMath(piece.slice(1, -1));
      }

      return escapeHtml(piece).replace(/\n/g, "<br />");
    })
    .join("");
}

function formatDate(value?: string) {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const text = asString(value);
    if (text) return text;
  }

  return "";
}

function getPaperMeta(paper: SavedQuestionPaper) {
  const settings = asRecord(paper.settings);

  return {
    className: firstNonEmpty(
      paper.className,
      settings.selectedClass,
      settings.className,
    ),
    subjectName: firstNonEmpty(
      paper.subjectName,
      settings.selectedSubject,
      settings.subjectName,
    ),
    chapterName: firstNonEmpty(
      paper.chapterName,
      settings.selectedChapter,
      settings.chapterName,
    ),
    institutionName: firstNonEmpty(settings.institutionName),
    examName: firstNonEmpty(settings.examName, paper.title),
    timeText: firstNonEmpty(settings.timeText),
    footerText: firstNonEmpty(settings.footerText),
    headerNote: firstNonEmpty(settings.headerNote),
  };
}

function getJointQuestionPages(paper: SavedQuestionPaper) {
  const settings = asRecord(paper.settings);
  const jointPages = asRecord(settings.jointPages);

  const leftIds = Array.isArray(jointPages.left)
    ? jointPages.left.map((value) => asString(value))
    : [];
  const rightIds = Array.isArray(jointPages.right)
    ? jointPages.right.map((value) => asString(value))
    : [];

  if (leftIds.length || rightIds.length) {
    const questionMap = new Map(
      paper.selectedQuestions.map((question) => [question.id, question]),
    );

    const left = leftIds
      .map((id) => questionMap.get(id))
      .filter((question): question is SavedQuestion => Boolean(question));

    const right = rightIds
      .map((id) => questionMap.get(id))
      .filter((question): question is SavedQuestion => Boolean(question));

    const assignedIds = new Set(
      [...left, ...right].map((question) => question.id),
    );

    const unassigned = paper.selectedQuestions.filter(
      (question) => !assignedIds.has(question.id),
    );

    return {
      left,
      right: [...right, ...unassigned],
    };
  }

  const half = Math.ceil(paper.selectedQuestions.length / 2);

  return {
    left: paper.selectedQuestions.slice(0, half),
    right: paper.selectedQuestions.slice(half),
  };
}

function SavedPaperPagePreview({
  paper,
  questions,
  meta,
  setNoEnabled,
  setNo,
  headerNoteEnabled,
  selectAnswerEnabled,
  footerText,
  showHeader,
  startNumber,
  pageSize,
  paperStyle,
}: {
  paper: SavedQuestionPaper;
  questions: SavedQuestion[];
  meta: ReturnType<typeof getPaperMeta>;
  setNoEnabled: boolean;
  setNo: string;
  headerNoteEnabled: boolean;
  selectAnswerEnabled: boolean;
  footerText: string;
  showHeader: boolean;
  startNumber: number;
  pageSize: string;
  paperStyle: string;
}) {
  const fullMarks = questions.reduce(
    (sum, item) => sum + (Number(item.marks) || 0),
    0,
  );

  return (
    <div className="mx-auto w-full max-w-[820px] rounded-sm border border-slate-200 bg-white px-6 py-8 shadow-[0_12px_30px_rgba(17,24,39,0.08)] sm:px-10 sm:py-10">
      {showHeader ? (
        <header className="border-b border-slate-300 pb-4 text-center">
          {meta.institutionName ? (
            <div className="text-xl font-extrabold text-slate-900">
              {meta.institutionName}
            </div>
          ) : null}

          <div className="mt-1 text-lg font-bold text-slate-900">
            {meta.examName || paper.title || "Question Paper"}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-1 text-xs font-medium text-slate-600 sm:grid-cols-3">
            <div>
              <span className="font-semibold text-slate-800">Class:</span>{" "}
              {meta.className || "—"}
            </div>
            <div>
              <span className="font-semibold text-slate-800">Subject:</span>{" "}
              {meta.subjectName || "—"}
            </div>
            <div>
              <span className="font-semibold text-slate-800">Chapter:</span>{" "}
              {meta.chapterName || "—"}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-slate-600">
            {meta.timeText ? <span>Time: {meta.timeText}</span> : null}
            <span>Full Marks: {fullMarks}</span>
            {setNoEnabled && setNo ? <span>Set: {setNo}</span> : null}
          </div>

          {headerNoteEnabled && meta.headerNote ? (
            <div className="mt-3 text-xs font-medium text-slate-600">
              {meta.headerNote}
            </div>
          ) : null}
        </header>
      ) : null}

      <div className={`${showHeader ? "mt-6" : "mt-0"} space-y-5`}>
        {questions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
            No questions on this page yet.
          </div>
        ) : (
          questions.map((question, index) => (
            <div
              key={`${paper.id}-${showHeader ? "left" : "right"}-${question.id}-${index}`}
              className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 text-sm font-bold text-slate-900">
                  {startNumber + index}.
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className="text-sm leading-7 text-slate-800"
                    dangerouslySetInnerHTML={{
                      __html: renderRichText(question.question || ""),
                    }}
                  />

                  {Array.isArray(question.options) &&
                  question.options.length > 0 ? (
                    <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={`${question.id}-option-${optionIndex}`}
                          className="flex items-start gap-2 text-sm leading-6 text-slate-700"
                        >
                          <span className="font-semibold text-slate-500">
                            {String.fromCharCode(0x0995 + optionIndex)}.
                          </span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: renderRichText(option),
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500">
                    <span>{question.type || "Question"}</span>
                    <span>•</span>
                    <span>
                      {Number(question.marks) || 1} mark
                      {Number(question.marks) === 1 ? "" : "s"}
                    </span>
                  </div>

                  {selectAnswerEnabled && question.answer ? (
                    <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                      <span className="font-semibold">Answer:</span>{" "}
                      {question.answer}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showHeader ? (
        <footer className="mt-8 border-t border-slate-200 pt-3 text-center text-xs font-medium text-slate-500">
          <span>{footerText}</span>
          <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-400">
            {pageSize} · {paperStyle}
          </span>
        </footer>
      ) : null}
    </div>
  );
}

function QuestionPaperPreviewModal({
  paper,
  onClose,
}: {
  paper: SavedQuestionPaper;
  onClose: () => void;
}) {
  const settings = asRecord(paper.settings);
  const meta = getPaperMeta(paper);
  const setNoEnabled = settings.setNoEnabled === true;
  const setNo = asString(settings.setNo);
  const headerNoteEnabled = settings.headerNoteEnabled === true;
  const selectAnswerEnabled = settings.selectAnswerEnabled === true;
  const pageSize = asString(settings.pageSize) || "A4";
  const paperStyle = asString(settings.paperStyle) || "Classic";
  const footerText = meta.footerText || "The End";
  const isJoint = pageSize === "Joint";
  const jointPages = isJoint ? getJointQuestionPages(paper) : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Eye className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Question Paper Preview
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {paper.title?.trim() || "Question Paper"}
                {isJoint ? " · 2 pages" : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8F2EF] p-4 sm:p-6">
          {isJoint && jointPages ? (
            <div className="mx-auto flex max-w-[1160px] flex-col gap-6 lg:flex-row lg:items-start lg:justify-center">
              <div className="w-full lg:w-1/2">
                <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Page 1 · {jointPages.left.length} questions
                </div>
                <SavedPaperPagePreview
                  paper={paper}
                  questions={jointPages.left}
                  meta={meta}
                  setNoEnabled={setNoEnabled}
                  setNo={setNo}
                  headerNoteEnabled={headerNoteEnabled}
                  selectAnswerEnabled={selectAnswerEnabled}
                  footerText={footerText}
                  showHeader
                  startNumber={1}
                  pageSize="A5"
                  paperStyle={paperStyle}
                />
              </div>

              <div className="w-full lg:w-1/2">
                <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Page 2 · {jointPages.right.length} questions
                </div>
                <SavedPaperPagePreview
                  paper={paper}
                  questions={jointPages.right}
                  meta={meta}
                  setNoEnabled={setNoEnabled}
                  setNo={setNo}
                  headerNoteEnabled={headerNoteEnabled}
                  selectAnswerEnabled={selectAnswerEnabled}
                  footerText={footerText}
                  showHeader={false}
                  startNumber={jointPages.left.length + 1}
                  pageSize="A5"
                  paperStyle={paperStyle}
                />
              </div>
            </div>
          ) : (
            <SavedPaperPagePreview
              paper={paper}
              questions={paper.selectedQuestions}
              meta={meta}
              setNoEnabled={setNoEnabled}
              setNo={setNo}
              headerNoteEnabled={headerNoteEnabled}
              selectAnswerEnabled={selectAnswerEnabled}
              footerText={footerText}
              showHeader
              startNumber={1}
              pageSize={pageSize}
              paperStyle={paperStyle}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function SavedQuestionPapers({
  refreshKey = 0,
  currentPaperId = null,
  onDeleted,
}: SavedQuestionPapersProps) {
  const [papers, setPapers] = useState<SavedQuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewPaper, setPreviewPaper] = useState<SavedQuestionPaper | null>(
    null,
  );

  const getAuthHeaders = useCallback((): HeadersInit => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  }, []);

  const loadSavedPapers = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetch("/api/question-papers", {
          method: "GET",
          headers: {
            ...getAuthHeaders(),
          },
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Failed to load saved question papers.",
          );
        }

        setPapers(Array.isArray(data.data) ? data.data : []);
      } catch (fetchError) {
        console.error("Saved question papers fetch failed:", fetchError);
        setPapers([]);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Could not load saved question papers.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getAuthHeaders],
  );

  useEffect(() => {
    void loadSavedPapers();
  }, [loadSavedPapers, refreshKey]);

  const handleDelete = async (paper: SavedQuestionPaper) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${paper.title || "Question Paper"}"?`,
    );

    if (!confirmed) return;

    setDeletingId(paper.id);
    setError("");

    try {
      const response = await fetch(
        `/api/question-papers?id=${encodeURIComponent(paper.id)}`,
        {
          method: "DELETE",
          headers: {
            ...getAuthHeaders(),
          },
          cache: "no-store",
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Question paper could not be deleted.",
        );
      }

      setPapers((current) => current.filter((item) => item.id !== paper.id));

      if (previewPaper?.id === paper.id) {
        setPreviewPaper(null);
      }

      onDeleted?.(paper.id);
    } catch (deleteError) {
      console.error("Saved question paper delete failed:", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the question paper.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const normalizedPapers = useMemo(
    () =>
      papers.map((paper) => {
        const meta = getPaperMeta(paper);

        return {
          ...paper,
          resolvedClassName: meta.className,
          resolvedSubjectName: meta.subjectName,
          resolvedChapterName: meta.chapterName,
        };
      }),
    [papers],
  );

  return (
    <section className="mt-8 w-full">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Saved Question Papers
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Click a paper to preview it. Delete removes the saved copy.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadSavedPapers(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="p-5">
          {loading ? (
            <div className="flex min-h-[180px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading saved question papers...
              </div>
            </div>
          ) : normalizedPapers.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <FileText className="h-7 w-7" />
              </div>

              <h3 className="text-base font-semibold text-slate-800">
                No saved question papers yet
              </h3>

              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                Save a question paper from the question creator and it will
                appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {normalizedPapers.map((paper) => {
                const questionCount = Array.isArray(paper.selectedQuestions)
                  ? paper.selectedQuestions.length
                  : 0;
                const isDeleting = deletingId === paper.id;
                const isCurrent = currentPaperId === paper.id;

                return (
                  <article
                    key={paper.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setPreviewPaper(paper)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPreviewPaper(paper);
                      }
                    }}
                    className={`group cursor-pointer rounded-2xl border bg-white p-5 text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                      isCurrent
                        ? "border-indigo-300 ring-1 ring-indigo-100"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <BookOpen className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-slate-900">
                              {paper.title?.trim() || "Question Paper"}
                            </h3>

                            {isCurrent ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Current paper
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <Eye className="h-3.5 w-3.5" />
                            Click to preview
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(paper);
                        }}
                        disabled={isDeleting}
                        aria-label={`Delete ${paper.title || "question paper"}`}
                        title="Delete question paper"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Class
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-700">
                          {paper.resolvedClassName || "Not saved"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Subject
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-700">
                          {paper.resolvedSubjectName || "Not saved"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Chapter
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-700">
                          {paper.resolvedChapterName || "All chapters"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-100 bg-white px-3.5 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Questions
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {questionCount} question
                            {questionCount === 1 ? "" : "s"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock3 className="h-4 w-4" />
                          <span>
                            {formatDate(paper.updatedAt || paper.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-medium text-emerald-700">
                        Saved
                      </span>
                      <span className="font-semibold text-indigo-600 group-hover:underline">
                        Preview paper →
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {previewPaper ? (
        <QuestionPaperPreviewModal
          paper={previewPaper}
          onClose={() => setPreviewPaper(null)}
        />
      ) : null}
    </section>
  );
}
