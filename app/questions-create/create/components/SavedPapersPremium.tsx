"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Eye,
  EyeOff,
  FileText,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Sigma,
  Trash2,
  X,
} from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";
import { T, useQuestionText } from "../i18n";

type SavedQuestion = {
  id: string;
  type: string;
  question: string;
  options?: string[];
  answer?: string;
  marks: number;
};

type SavedPaper = {
  id: string;
  title: string;
  className: string;
  subjectName: string;
  chapterName: string;
  selectedQuestions: SavedQuestion[];
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  /** Increase this number to reload the list (e.g. right after saving a paper). */
  refreshKey: number;
  /** The paper that is currently open in the editor, if it is a saved one. */
  currentPaperId: string | null;
  /** Called after a paper was deleted so the editor can reset itself if needed. */
  onDeleted: (paperId: string) => void;
};

const TYPE_ORDER = ["MCQ", "Short", "CQ", "Descriptive"] as const;

const TYPE_STYLE: Record<string, string> = {
  MCQ: "bg-[#EAF2FF] text-[#2F5FB3] ring-[#CFE0FA]",
  Short: "bg-[#EAF7EE] text-[#2C7A4B] ring-[#CBEAD6]",
  CQ: "bg-[#F3ECFF] text-[#6B3FB0] ring-[#E0D2F7]",
  Descriptive: "bg-[#FFF3E1] text-[#9A5A0B] ring-[#F6DDB5]",
};

const TYPE_LABEL: Record<string, string> = {
  MCQ: "MCQ",
  Short: "Short",
  CQ: "Creative / CQ",
  Descriptive: "Descriptive",
};

function totalMarks(paper: SavedPaper) {
  return paper.selectedQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
}

function typeCounts(paper: SavedPaper) {
  const counts: Record<string, number> = {};
  for (const q of paper.selectedQuestions) {
    const key = TYPE_STYLE[q.type] ? q.type : "Descriptive";
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export default function SavedPapersPremium({ refreshKey, currentPaperId, onDeleted }: Props) {
  const { t, locale } = useQuestionText();
  const isBn = String(locale || "").toLowerCase().startsWith("bn");

  const [papers, setPapers] = useState<SavedPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const requestRef = useRef(0);

  const num = useCallback(
    (value: number) => new Intl.NumberFormat(isBn ? "bn-BD" : "en-US").format(value),
    [isBn],
  );

  const formatDate = useCallback(
    (value?: string) => {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      return new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    },
    [isBn],
  );

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/question-papers", {
        credentials: "include",
        cache: "no-store",
        headers: { ...getClientAuthHeaders() },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success || !Array.isArray(data.data)) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Could not load saved papers.",
        );
      }
      if (requestId !== requestRef.current) return;
      setPapers(
        (data.data as SavedPaper[]).map((paper) => ({
          ...paper,
          selectedQuestions: Array.isArray(paper.selectedQuestions) ? paper.selectedQuestions : [],
        })),
      );
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setError(err instanceof Error ? err.message : "Could not load saved papers.");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return papers;
    return papers.filter((paper) =>
      [paper.title, paper.className, paper.subjectName, paper.chapterName]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [papers, query]);

  const previewPaper = useMemo(
    () => papers.find((paper) => paper.id === previewId) ?? null,
    [papers, previewId],
  );

  const handleDelete = async (paperId: string) => {
    setDeletingId(paperId);
    setDeleteError("");
    try {
      const response = await fetch(`/api/question-papers?id=${encodeURIComponent(paperId)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { ...getClientAuthHeaders() },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Could not delete this paper.",
        );
      }
      setPapers((current) => current.filter((paper) => paper.id !== paperId));
      setConfirmDeleteId(null);
      if (previewId === paperId) setPreviewId(null);
      onDeleted(paperId);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete this paper.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      aria-label={t("Saved question papers")}
      className="overflow-hidden rounded-[24px] border border-[#E7DCC7] bg-[#FCF8EF] shadow-[0_10px_40px_-18px_rgba(76,57,28,0.28)]"
    >
      {/* ---------- Header ---------- */}
      <div className="relative border-b border-[#EEE4D2] bg-gradient-to-br from-[#FFFDF8] via-[#FCF8EF] to-[#F8EFDD] px-4 py-4 sm:px-6 sm:py-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-[#D42020]/[0.06] blur-2xl"
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E53935] to-[#B71C1C] text-white shadow-[0_8px_20px_-6px_rgba(212,32,32,0.55)]">
              <Layers size={22} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[19px] font-extrabold tracking-tight text-[#342B1E] sm:text-[21px]">
                  <T>Saved question papers</T>
                </h2>
                <span className="rounded-full bg-[#342B1E] px-2.5 py-0.5 text-[11px] font-bold text-[#FCF8EF]">
                  {num(papers.length)}
                </span>
              </div>
              <p className="mt-0.5 text-[12.5px] leading-5 text-[#7A6A52]">
                <T>Preview any paper, or delete the ones you no longer need.</T>
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 lg:w-auto">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#E7DCC7] bg-white px-3 shadow-sm transition focus-within:border-[#D42020] focus-within:ring-2 focus-within:ring-[#D42020]/15 lg:w-[300px] lg:flex-none">
              <Search size={15} className="shrink-0 text-[#8A795F]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Search saved papers...")}
                className="w-full border-0 bg-transparent text-[13px] text-[#342B1E] outline-none placeholder:text-[#A99B83]"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t("Clear search")}
                  className="rounded-md p-0.5 text-[#8A795F] transition hover:bg-[#F2EBDD] hover:text-[#342B1E]"
                >
                  <X size={14} />
                </button>
              ) : null}
            </label>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#E7DCC7] bg-white px-3.5 text-[12.5px] font-bold text-[#51442F] shadow-sm transition hover:border-[#D8C9A6] hover:bg-[#F8F0E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/30 active:scale-[0.98] disabled:opacity-60"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <T>Refresh</T>
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Body ---------- */}
      <div className="p-4 sm:p-6">
        {deleteError ? (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-[#F0C9C4] bg-[#FFF1EF] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#9F1D1D]"
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1">{deleteError}</span>
            <button
              type="button"
              onClick={() => setDeleteError("")}
              aria-label={t("Close")}
              className="shrink-0 rounded-md p-0.5 hover:bg-white/70"
            >
              <X size={14} />
            </button>
          </div>
        ) : null}

        {loading && papers.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[220px] animate-pulse rounded-2xl border border-[#EEE4D2] bg-white/70"
              />
            ))}
          </div>
        ) : error && papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E3CFC9] bg-[#FFF8F6] px-6 py-12 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDE8E5] text-[#D42020]">
              <AlertTriangle size={22} />
            </span>
            <p className="text-[14px] font-extrabold text-[#342B1E]">
              <T>Could not load saved papers.</T>
            </p>
            <p className="mt-1 max-w-md text-[12.5px] leading-5 text-[#7A6A52]">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#D42020] px-4 text-[13px] font-extrabold text-white shadow-sm transition hover:bg-[#B91C1C] active:scale-[0.98]"
            >
              <RefreshCw size={14} />
              <T>Try again</T>
            </button>
          </div>
        ) : papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCCFB5] bg-gradient-to-b from-white/70 to-[#FBF4E6] px-6 py-14 text-center">
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-white text-[#D42020] shadow-[0_10px_26px_-10px_rgba(76,57,28,0.35)] ring-1 ring-[#EEE4D2]">
              <FileText size={28} />
            </span>
            <p className="text-[16px] font-extrabold text-[#342B1E]">
              <T>No saved papers yet</T>
            </p>
            <p className="mt-1.5 max-w-md text-[13px] leading-6 text-[#7A6A52]">
              <T>Save a paper from the creator and it will appear here automatically.</T>
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCCFB5] bg-white/60 px-6 py-12 text-center">
            <Search size={22} className="mb-2 text-[#A28E6F]" />
            <p className="text-[13px] font-bold text-[#554832]">
              <T>No papers match your search.</T>
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((paper) => {
              const counts = typeCounts(paper);
              const isCurrent = paper.id === currentPaperId;
              const confirming = confirmDeleteId === paper.id;
              const deleting = deletingId === paper.id;
              const updated = formatDate(paper.updatedAt || paper.createdAt);

              return (
                <li
                  key={paper.id}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-16px_rgba(76,57,28,0.38)] ${
                    isCurrent
                      ? "border-[#D42020]/45 shadow-[0_0_0_3px_rgba(212,32,32,0.08)]"
                      : "border-[#EADFCB] shadow-[0_4px_16px_-10px_rgba(76,57,28,0.25)]"
                  }`}
                >
                  <div
                    aria-hidden
                    className="h-1.5 w-full bg-gradient-to-r from-[#E53935] via-[#F08A5D] to-[#F5C26B]"
                  />

                  <button
                    type="button"
                    onClick={() => setPreviewId(paper.id)}
                    className="flex flex-1 flex-col gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D42020]/30"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FCE9E6] text-[#D42020] transition group-hover:bg-[#D42020] group-hover:text-white">
                        <FileText size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-[14.5px] font-extrabold leading-snug text-[#342B1E]">
                          {paper.title?.trim() || t("Untitled paper")}
                        </h3>
                        {isCurrent ? (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#FFF1EF] px-2 py-0.5 text-[10.5px] font-extrabold text-[#B91C1C] ring-1 ring-[#F0D5D1]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#D42020]" />
                            <T>Open in editor</T>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {(paper.className || paper.subjectName || paper.chapterName) ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {paper.className ? (
                          <span className="rounded-md bg-[#F3EDE2] px-2 py-0.5 text-[11px] font-bold text-[#6B5A40]">
                            {paper.className}
                          </span>
                        ) : null}
                        {paper.subjectName ? (
                          <span className="inline-flex max-w-full items-center gap-1 truncate rounded-md bg-[#F3EDE2] px-2 py-0.5 text-[11px] font-semibold text-[#6B5A40]">
                            <BookOpen size={11} className="shrink-0" />
                            <span className="truncate">{paper.subjectName}</span>
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {paper.chapterName ? (
                      <p className="line-clamp-1 text-[12px] text-[#80715A]">{paper.chapterName}</p>
                    ) : null}

                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-[#FAF5EA] px-3 py-2">
                        <p className="flex items-center gap-1 text-[10.5px] font-semibold text-[#8A795F]">
                          <FileText size={11} /> <T>questions</T>
                        </p>
                        <p className="text-[16px] font-extrabold leading-tight text-[#342B1E]">
                          {num(paper.selectedQuestions.length)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#FAF5EA] px-3 py-2">
                        <p className="flex items-center gap-1 text-[10.5px] font-semibold text-[#8A795F]">
                          <Sigma size={11} /> <T>marks</T>
                        </p>
                        <p className="text-[16px] font-extrabold leading-tight text-[#342B1E]">
                          {num(totalMarks(paper))}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {TYPE_ORDER.filter((type) => counts[type]).map((type) => (
                        <span
                          key={type}
                          className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ${TYPE_STYLE[type]}`}
                        >
                          <T>{TYPE_LABEL[type]}</T> · {num(counts[type])}
                        </span>
                      ))}
                    </div>
                  </button>

                  <div className="flex items-center justify-between gap-2 border-t border-[#F0E7D6] bg-[#FDFAF3] px-4 py-2.5">
                    <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-[#8A795F]">
                      <CalendarDays size={12} className="shrink-0" />
                      <span className="truncate">{updated}</span>
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewId(paper.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#342B1E] px-3 text-[11.5px] font-bold text-[#FCF8EF] transition hover:bg-[#4A3E2B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#342B1E]/40 active:scale-[0.97]"
                      >
                        <Eye size={13} />
                        <T>Preview</T>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError("");
                          setConfirmDeleteId(paper.id);
                        }}
                        aria-label={t("Delete")}
                        title={t("Delete")}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#EADFCB] bg-white text-[#8A795F] transition hover:border-[#E8B4AE] hover:bg-[#FFF1EF] hover:text-[#C62828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/30 active:scale-[0.95]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Delete confirmation overlay */}
                  {confirming ? (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/95 p-5 text-center backdrop-blur-sm">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FDE8E5] text-[#D42020]">
                        <Trash2 size={20} />
                      </span>
                      <div>
                        <p className="text-[14px] font-extrabold text-[#342B1E]">
                          <T>Delete this paper?</T>
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-[#7A6A52]">
                          <T>This removes the saved copy permanently.</T>
                        </p>
                      </div>
                      <div className="flex w-full max-w-[240px] gap-2">
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => setConfirmDeleteId(null)}
                          className="h-10 flex-1 rounded-xl border border-[#E7DCC7] bg-white text-[12.5px] font-bold text-[#51442F] transition hover:bg-[#F8F0E1] disabled:opacity-60"
                        >
                          <T>Cancel</T>
                        </button>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => void handleDelete(paper.id)}
                          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#D42020] text-[12.5px] font-extrabold text-white shadow-sm transition hover:bg-[#B91C1C] disabled:opacity-70"
                        >
                          {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                          {deleting ? <T>Deleting...</T> : <T>Yes, delete</T>}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {previewPaper ? (
        <PaperPreviewModal
          paper={previewPaper}
          num={num}
          formatDate={formatDate}
          onClose={() => setPreviewId(null)}
        />
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Preview modal                                                       */
/* ------------------------------------------------------------------ */

function PaperPreviewModal({
  paper,
  num,
  formatDate,
  onClose,
}: {
  paper: SavedPaper;
  num: (value: number) => string;
  formatDate: (value?: string) => string;
  onClose: () => void;
}) {
  const { t } = useQuestionText();
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const hasAnyAnswer = paper.selectedQuestions.some((q) => q.answer && q.answer.trim());

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[#2A2217]/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("Paper preview")}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[24px] bg-[#FCF8EF] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] sm:rounded-[24px]">
        <div className="flex items-start justify-between gap-3 border-b border-[#EEE4D2] bg-gradient-to-br from-[#FFFDF8] to-[#F8EFDD] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#B91C1C]">
              <T>Paper preview</T>
            </p>
            <h3 className="mt-0.5 line-clamp-2 text-[18px] font-extrabold leading-snug text-[#342B1E]">
              {paper.title?.trim() || t("Untitled paper")}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px] font-semibold text-[#6B5A40]">
              {paper.className ? (
                <span className="rounded-md bg-white px-2 py-0.5 ring-1 ring-[#EADFCB]">{paper.className}</span>
              ) : null}
              {paper.subjectName ? (
                <span className="rounded-md bg-white px-2 py-0.5 ring-1 ring-[#EADFCB]">{paper.subjectName}</span>
              ) : null}
              {paper.chapterName ? (
                <span className="rounded-md bg-white px-2 py-0.5 ring-1 ring-[#EADFCB]">{paper.chapterName}</span>
              ) : null}
              <span className="rounded-md bg-[#342B1E] px-2 py-0.5 text-[#FCF8EF]">
                {num(paper.selectedQuestions.length)} <T>questions</T> · {num(totalMarks(paper))} <T>marks</T>
              </span>
              <span className="text-[#8A795F]">{formatDate(paper.updatedAt || paper.createdAt)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E7DCC7] bg-white text-[#65563F] transition hover:bg-[#F8F0E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/30"
          >
            <X size={17} />
          </button>
        </div>

        {hasAnyAnswer ? (
          <div className="flex justify-end border-b border-[#F0E7D6] bg-[#FDFAF3] px-5 py-2">
            <button
              type="button"
              onClick={() => setShowAnswers((current) => !current)}
              aria-pressed={showAnswers}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E7DCC7] bg-white px-3 text-[12px] font-bold text-[#51442F] transition hover:bg-[#F8F0E1]"
            >
              {showAnswers ? <EyeOff size={13} /> : <Eye size={13} />}
              {showAnswers ? <T>Hide answers</T> : <T>Show answers</T>}
            </button>
          </div>
        ) : null}

        <div className="scroll min-h-0 flex-1 overflow-y-auto bg-white px-5 py-4">
          <ol className="space-y-3">
            {paper.selectedQuestions.map((question, index) => (
              <li key={`${question.id}-${index}`} className="rounded-xl border border-[#F0E7D6] bg-[#FFFEFB] p-3.5">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-[#FCE9E6] px-1 text-[11.5px] font-extrabold text-[#B91C1C]">
                    {num(index + 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-line text-[13.5px] font-semibold leading-[1.7] text-[#342B1E]">
                      {question.question}
                    </p>

                    {Array.isArray(question.options) && question.options.length > 0 ? (
                      <ul className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <li
                            key={optionIndex}
                            className="flex items-start gap-2 text-[12.5px] leading-6 text-[#5B4C36]"
                          >
                            <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border border-[#CDBFA5]" />
                            <span className="min-w-0">{option}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {showAnswers && question.answer?.trim() ? (
                      <p className="mt-2 rounded-lg bg-[#EAF7EE] px-2.5 py-1.5 text-[12px] font-semibold leading-5 text-[#2C7A4B]">
                        <T>Answer</T>: {question.answer}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-md bg-[#F3EDE2] px-2 py-0.5 text-[11px] font-bold text-[#6B5A40]">
                    {num(Number(question.marks) || 0)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
