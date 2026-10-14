"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

/* -------------------------------------------------------------------------- */
/* Page-local, hydration-safe English ↔ Bangla translation                   */
/* -------------------------------------------------------------------------- */
const SAVED_PAPER_BN: Record<string, string> = {
  "class:": "শ্রেণি:",
  "subject:": "বিষয়:",
  "chapter:": "অধ্যায়:",
  "time: ": "সময়: ",
  "full marks: ": "পূর্ণমান: ",
  "set: ": "সেট: ",
  "no questions on this page yet.": "এই পৃষ্ঠায় এখনো কোনো প্রশ্ন নেই।",
  "answer:": "উত্তর:",
  "question paper preview": "প্রশ্নপত্রের পূর্বরূপ",
  "saved question papers": "সংরক্ষিত প্রশ্নপত্র",
  "click a paper to preview it. delete removes the saved copy.":
    "একটি প্রশ্নপত্রের পূর্বরূপ দেখতে সেটিতে ক্লিক করুন। ডিলিট করলে সংরক্ষিত কপিটি মুছে যাবে।",
  refresh: "রিফ্রেশ",
  "loading saved question papers...": "সংরক্ষিত প্রশ্নপত্র লোড হচ্ছে...",
  "no saved question papers yet": "এখনো কোনো সংরক্ষিত প্রশ্নপত্র নেই",
  "save a question paper from the question creator and it will appear here automatically.":
    "প্রশ্নপত্র তৈরি করার পেজ থেকে একটি প্রশ্নপত্র সংরক্ষণ করলে সেটি স্বয়ংক্রিয়ভাবে এখানে দেখা যাবে।",
  "current paper": "বর্তমান প্রশ্নপত্র",
  "click to preview": "পূর্বরূপ দেখতে ক্লিক করুন",
  class: "শ্রেণি",
  subject: "বিষয়",
  chapter: "অধ্যায়",
  questions: "প্রশ্ন",
  question: "প্রশ্ন",
  saved: "সংরক্ষিত",
  "preview paper →": "প্রশ্নপত্রের পূর্বরূপ →",
  "question paper": "প্রশ্নপত্র",
  "not saved": "সংরক্ষণ করা হয়নি",
  "all chapters": "সব অধ্যায়",
  "unknown date": "তারিখ জানা নেই",
  "close preview": "পূর্বরূপ বন্ধ করুন",
  "are you sure you want to delete": "আপনি কি নিশ্চিত যে এটি মুছে ফেলতে চান",
  "failed to load saved question papers.":
    "সংরক্ষিত প্রশ্নপত্র লোড করা যায়নি।",
  "could not load saved question papers.":
    "সংরক্ষিত প্রশ্নপত্র লোড করা যায়নি।",
  "question paper could not be deleted.": "প্রশ্নপত্রটি মুছে ফেলা যায়নি।",
  "could not delete the question paper.": "প্রশ্নপত্রটি মুছে ফেলা যায়নি।",
  "delete question paper": "প্রশ্নপত্র মুছে দিন",
  page: "পৃষ্ঠা",
  mark: "নম্বর",
  marks: "নম্বর",
  "the end": "সমাপ্ত",
  classic: "ক্লাসিক",
  modern: "আধুনিক",
};

function normalizeSavedPaperText(value: string) {
  return value
    .replace(/\\r\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function translateSavedPaperText(
  value: string,
  locale: string | undefined,
  baseL: (value: string) => string,
): string {
  if (!value) return value;
  if (!locale || !String(locale).toLowerCase().startsWith("bn")) return value;

  const normalized = normalizeSavedPaperText(value);
  const exact = SAVED_PAPER_BN[normalized];
  if (exact) return exact;

  const pageMatch = /^page (\d+) · $/i.exec(normalized);
  if (pageMatch) return `পৃষ্ঠা ${pageMatch[1]} · `;

  const questionCount = /^(\d+) questions?$/i.exec(normalized);
  if (questionCount) {
    const banglaCount = questionCount[1].replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
    return `${banglaCount}টি প্রশ্ন`;
  }

  const pagesMatch = /^· (\d+) pages$/i.exec(normalized);
  if (pagesMatch) return `· ${pagesMatch[1]} পৃষ্ঠা`;

  const translated = baseL(value);
  if (translated && translated !== value) {
    const hasBangla = /[\u0980-\u09FF]/.test(translated);
    const hasLatin = /[A-Za-z]/.test(translated);
    if (hasBangla && !hasLatin) return translated;
  }
  return value;
}

function useSavedPaperText() {
  const { locale, L: baseL } = useSohozI18n();
  const t = useCallback(
    (value: string) => translateSavedPaperText(value, locale, baseL),
    [locale, baseL],
  );
  return { t, locale };
}

function SavedPaperT({ children }: { children: ReactNode }) {
  const { t } = useSavedPaperText();
  if (typeof children !== "string") return <>{children}</>;
  return <>{t(children)}</>;
}

function savedPaperActionLabel(
  value: string,
  locale: string | undefined,
  baseL: (value: string) => string,
) {
  return translateSavedPaperText(value, locale, baseL);
}

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
function formatDate(value?: string, locale: string | undefined = "en") {
  if (!value)
    return locale?.toLowerCase().startsWith("bn")
      ? "তারিখ জানা নেই"
      : "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return locale?.toLowerCase().startsWith("bn")
      ? "তারিখ জানা নেই"
      : "Unknown date";
  return new Intl.DateTimeFormat(
    locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-BD",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
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
  const { t } = useSavedPaperText();
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
            {meta.examName || paper.title || t("Question Paper")}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-1 text-xs font-medium text-slate-600 sm:grid-cols-3">
            <div>
              <span className="font-semibold text-slate-800">
                <SavedPaperT>{"Class:"}</SavedPaperT>
              </span>
              {<SavedPaperT> </SavedPaperT>}
              {meta.className || "—"}
            </div>
            <div>
              <span className="font-semibold text-slate-800">
                <SavedPaperT>{"Subject:"}</SavedPaperT>
              </span>
              {<SavedPaperT> </SavedPaperT>}
              {meta.subjectName || "—"}
            </div>
            <div>
              <span className="font-semibold text-slate-800">
                <SavedPaperT>{"Chapter:"}</SavedPaperT>
              </span>
              {<SavedPaperT> </SavedPaperT>}
              {meta.chapterName || "—"}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-slate-600">
            {meta.timeText ? (
              <span>
                <SavedPaperT>{"Time: "}</SavedPaperT>
                {meta.timeText}
              </span>
            ) : null}
            <span>
              <SavedPaperT>{"Full Marks: "}</SavedPaperT>
              {fullMarks}
            </span>
            {setNoEnabled && setNo ? (
              <span>
                <SavedPaperT>{"Set: "}</SavedPaperT>
                {setNo}
              </span>
            ) : null}
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
            <SavedPaperT>
              {"No questions on this page yet.\r\n          "}
            </SavedPaperT>
          </div>
        ) : (
          questions.map((question, index) => (
            <div
              key={`${paper.id}-${showHeader ? "left" : "right"}-${question.id}-${index}`}
              className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 text-sm font-bold text-slate-900">
                  {startNumber + index}
                  <SavedPaperT>{".\r\n                "}</SavedPaperT>
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
                            {String.fromCharCode(0x0995 + optionIndex)}
                            <SavedPaperT>
                              {".\r\n                          "}
                            </SavedPaperT>
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
                    <span>{question.type || t("Question")}</span>
                    <span>
                      <SavedPaperT>{"\u2022"}</SavedPaperT>
                    </span>
                    <span>
                      {Number(question.marks) || 1} {t("mark")}
                    </span>
                  </div>

                  {selectAnswerEnabled && question.answer ? (
                    <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                      <span className="font-semibold">
                        <SavedPaperT>{"Answer:"}</SavedPaperT>
                      </span>
                      {<SavedPaperT> </SavedPaperT>}
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
            {pageSize}
            <SavedPaperT>{"\u00B7 "}</SavedPaperT>
            {paperStyle}
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
  const { t } = useSavedPaperText();
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
                <SavedPaperT>
                  {"Question Paper Preview\r\n              "}
                </SavedPaperT>
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {paper.title?.trim() || t("Question Paper")}
                {isJoint ? (
                  <SavedPaperT>{" · 2 pages"}</SavedPaperT>
                ) : (
                  <SavedPaperT>{""}</SavedPaperT>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label={t("Close preview")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8F2EF] p-4 sm:p-6">
          {isJoint && jointPages ? (
            <div className="mx-auto flex max-w-[1160px] flex-col gap-6 lg:flex-row lg:items-start lg:justify-center">
              <div className="w-full lg:w-1/2">
                <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  <SavedPaperT>{"Page 1 \u00B7 "}</SavedPaperT>
                  {jointPages.left.length}
                  <SavedPaperT>{"questions\r\n                "}</SavedPaperT>
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
                  <SavedPaperT>{"Page 2 \u00B7 "}</SavedPaperT>
                  {jointPages.right.length}
                  <SavedPaperT>{"questions\r\n                "}</SavedPaperT>
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
  const { t, locale } = useSavedPaperText();
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
              : t("Failed to load saved question papers."),
          );
        }
        setPapers(Array.isArray(data.data) ? data.data : []);
      } catch (fetchError) {
        console.error("Saved question papers fetch failed:", fetchError);
        setPapers([]);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : t("Could not load saved question papers."),
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
      `${t("Are you sure you want to delete")} "${paper.title || t("Question Paper")}"?`,
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
            : t("Question paper could not be deleted."),
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
          : t("Could not delete the question paper."),
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
                <SavedPaperT>
                  {"Saved Question Papers\r\n              "}
                </SavedPaperT>
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                <SavedPaperT>
                  {
                    "Click a paper to preview it. Delete removes the saved copy.\r\n              "
                  }
                </SavedPaperT>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadSavedPapers(true)}
            disabled={loading || refreshing}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <SavedPaperT>{"Refresh\r\n          "}</SavedPaperT>
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
                <SavedPaperT>
                  {"Loading saved question papers...\r\n              "}
                </SavedPaperT>
              </div>
            </div>
          ) : normalizedPapers.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <FileText className="h-7 w-7" />
              </div>

              <h3 className="text-base font-semibold text-slate-800">
                <SavedPaperT>
                  {"No saved question papers yet\r\n              "}
                </SavedPaperT>
              </h3>

              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                <SavedPaperT>
                  {
                    "Save a question paper from the question creator and it will\r\n                appear here automatically.\r\n              "
                  }
                </SavedPaperT>
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
                              {paper.title?.trim() || t("Question Paper")}
                            </h3>

                            {isCurrent ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700">
                                <CheckCircle2 className="h-3 w-3" />
                                <SavedPaperT>
                                  {
                                    "Current paper\r\n                              "
                                  }
                                </SavedPaperT>
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <Eye className="h-3.5 w-3.5" />
                            <SavedPaperT>
                              {"Click to preview\r\n                          "}
                            </SavedPaperT>
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
                        aria-label={`${t("Delete question paper")} ${paper.title || t("Question Paper")}`}
                        title={t("Delete question paper")}
                        className="inline-flex h-10 w-10 cursor-pointer shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
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
                          <SavedPaperT>
                            {"Class\r\n                        "}
                          </SavedPaperT>
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-700">
                          {paper.resolvedClassName || t("Not saved")}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          <SavedPaperT>
                            {"Subject\r\n                        "}
                          </SavedPaperT>
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-700">
                          {paper.resolvedSubjectName || t("Not saved")}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          <SavedPaperT>
                            {"Chapter\r\n                        "}
                          </SavedPaperT>
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-700">
                          {paper.resolvedChapterName || t("All chapters")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-100 bg-white px-3.5 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            <SavedPaperT>
                              {"Questions\r\n                          "}
                            </SavedPaperT>
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {questionCount}
                            <SavedPaperT>
                              {"question\r\n                            "}
                            </SavedPaperT>
                            {questionCount === 1 ? (
                              <SavedPaperT>{""}</SavedPaperT>
                            ) : (
                              <SavedPaperT>{"s"}</SavedPaperT>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock3 className="h-4 w-4" />
                          <span>
                            {formatDate(
                              paper.updatedAt || paper.createdAt,
                              locale,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-medium text-emerald-700">
                        <SavedPaperT>
                          {"Saved\r\n                      "}
                        </SavedPaperT>
                      </span>
                      <span className="font-semibold text-indigo-600 group-hover:underline">
                        <SavedPaperT>
                          {"Preview paper \u2192\r\n                      "}
                        </SavedPaperT>
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
