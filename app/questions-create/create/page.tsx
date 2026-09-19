"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type DragEvent,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Minus,
  Plus,
  Printer,
  Save,
  Search,
  Settings2,
  Shuffle,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

interface Question {
  id: string;
  type: "MCQ" | "Short" | "Descriptive";
  question: string;
  options?: string[];
  answer?: string;
  marks: number;
}

type FilterOption = { label: string; value: string };

type FilterKey = "class" | "subject" | "chapter" | "type" | null;

const CLASS_OPTIONS: FilterOption[] = [
  { label: "HSC", value: "HSC" },
  { label: "SSC", value: "SSC" },
  { label: "Class 8", value: "Class 8" },
  { label: "Class 7", value: "Class 7" },
  { label: "Class 6", value: "Class 6" },
  { label: "Class 5", value: "Class 5" },
  { label: "Class 4", value: "Class 4" },
  { label: "Class 3", value: "Class 3" },
];

const QUESTION_TYPE_OPTIONS: FilterOption[] = [
  { label: "All question types", value: "All question types" },
  { label: "MCQ", value: "MCQ" },
  { label: "Short Questions", value: "Short Questions" },
  { label: "Descriptive Questions", value: "Descriptive Questions" },
];

const DEFAULT_SECTION_MARKS: Record<Question["type"], number> = {
  MCQ: 1,
  Short: 2,
  Descriptive: 5,
};

function normalizeQuestionType(value: unknown): Question["type"] {
  const text = String(value || "").toLowerCase();
  if (text.includes("mcq")) return "MCQ";
  if (text.includes("short")) return "Short";
  return "Descriptive";
}

function normalizeQuestions(raw: unknown[]): Question[] {
  return raw.map((item, index) => {
    const q = (item || {}) as Record<string, unknown>;
    const options = Array.isArray(q.options)
      ? q.options.map((option) => String(option ?? "")).filter(Boolean)
      : undefined;
    const rawMarks = Number(q.marks);

    return {
      id: String(
        q.id ||
          `question-${index + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ),
      type: normalizeQuestionType(q.type),
      question: String(q.question || q.text || "Untitled question"),
      options,
      answer: q.answer ? String(q.answer) : undefined,
      marks: Number.isFinite(rawMarks) && rawMarks > 0 ? rawMarks : 1,
    };
  });
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onChange}
      className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition ${checked ? "bg-[#F3A847]" : "bg-[#D9DDE3]"}`}
    >
      <span
        className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}

function FilterSelect({
  label,
  value,
  options,
  placeholder,
  disabled,
  loading,
  open,
  onOpen,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  open: boolean;
  onOpen: () => void;
  onChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value);
  const display = loading
    ? `Loading ${label.toLowerCase()}...`
    : selected?.label || placeholder;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onOpen}
        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[11px] font-semibold transition ${
          disabled || loading
            ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300"
            : open
              ? "border-[#F3A847] bg-white text-gray-800 ring-1 ring-[#F3A847]/20"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
        }`}
      >
        <span className="truncate">{display}</span>
        {open ? (
          <ChevronUp size={13} className="text-gray-400" />
        ) : (
          <ChevronDown size={13} className="text-gray-400" />
        )}
      </button>

      {open && !disabled && !loading && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-[0_16px_35px_rgba(17,24,39,0.12)]">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[11px] transition ${
                  active
                    ? "bg-orange-50/70 font-bold text-gray-900"
                    : "font-medium text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="w-4 shrink-0">
                  {active ? (
                    <Check size={13} className="text-[#F3A847]" />
                  ) : null}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CreateQuestionPage() {
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
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingMarkId, setEditingMarkId] = useState<string | null>(null);
  const [answerSelections, setAnswerSelections] = useState<
    Record<string, string>
  >({});
  const [sectionMarks, setSectionMarks] = useState<
    Record<Question["type"], number>
  >(DEFAULT_SECTION_MARKS);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) router.push("/login");
    else setIsAuthenticated(true);
  }, [router]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (layoutRef.current && !layoutRef.current.contains(target))
        setLayoutOpen(false);
      const filterRoot = document.getElementById("question-filter-panel");
      if (filterRoot && !filterRoot.contains(target)) setOpenFilter(null);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (!selectedQuestions.length) return;
    setSectionMarks((current) => {
      const next = { ...current };
      for (const q of selectedQuestions) {
        if (!next[q.type]) next[q.type] = q.marks || 1;
      }
      return next;
    });
  }, [selectedQuestions]);

  const visibleQuestions = useMemo(() => {
    const query = questionSearchQuery.trim().toLowerCase();
    return questions.filter((q) => {
      const typeMatches = resultTypeTab === "all" || q.type === resultTypeTab;
      const searchMatches =
        !query ||
        q.question.toLowerCase().includes(query) ||
        q.options?.some((option) => option.toLowerCase().includes(query));
      return typeMatches && searchMatches;
    });
  }, [questions, questionSearchQuery, resultTypeTab]);

  const selectedIds = useMemo(
    () => new Set(selectedQuestions.map((q) => q.id)),
    [selectedQuestions],
  );
  const totalMarks = selectedQuestions.reduce(
    (sum, q) => sum + Math.max(1, Number(q.marks) || 1),
    0,
  );

  const typeCounts = useMemo(
    () => ({
      all: questions.length,
      MCQ: questions.filter((q) => q.type === "MCQ").length,
      Short: questions.filter((q) => q.type === "Short").length,
      Descriptive: questions.filter((q) => q.type === "Descriptive").length,
    }),
    [questions],
  );

  const sectionGroups = useMemo(() => {
    const order: Question["type"][] = [];
    const groups: Record<string, Question[]> = {};
    selectedQuestions.forEach((question) => {
      if (!groups[question.type]) {
        groups[question.type] = [];
        order.push(question.type);
      }
      groups[question.type].push(question);
    });
    return order.map((type) => ({ type, questions: groups[type] }));
  }, [selectedQuestions]);

  const questionNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    selectedQuestions.forEach((question, index) =>
      map.set(question.id, index + 1),
    );
    return map;
  }, [selectedQuestions]);

  const paperFontPx = Math.max(9, Math.round(11 * (fontScale / 100)));
  const paperGap =
    compactSpacing || paperStyle === "Compact" ? "gap-2" : "gap-4";

  const updateSelectedQuestions = (
    updater: (current: Question[]) => Question[],
  ) => {
    setSelectedQuestions((current) => updater(current));
  };

  const toggleSelectQuestion = (question: Question) => {
    updateSelectedQuestions((current) => {
      if (current.some((item) => item.id === question.id)) {
        return current.filter((item) => item.id !== question.id);
      }
      return [...current, question];
    });
  };

  const handleSelectAll = () => {
    const visibleIds = new Set(visibleQuestions.map((question) => question.id));
    const allVisibleSelected =
      visibleQuestions.length > 0 &&
      visibleQuestions.every((question) => selectedIds.has(question.id));
    setSelectedQuestions((current) => {
      if (allVisibleSelected)
        return current.filter((question) => !visibleIds.has(question.id));
      const currentMap = new Map(
        current.map((question) => [question.id, question]),
      );
      visibleQuestions.forEach((question) =>
        currentMap.set(question.id, question),
      );
      return [...currentMap.values()];
    });
  };

  const clearSelectedQuestions = () => {
    setSelectedQuestions([]);
    setAnswerSelections({});
    setEditingMarkId(null);
  };

  const handleClassChange = async (classValue: string) => {
    setSelectedClass(classValue);
    setSelectedSubject("");
    setSelectedChapter("");
    setSubjects([]);
    setChapters([]);
    setQuestions([]);
    setSelectedQuestions([]);
    setQuestionSearchQuery("");
    setOpenFilter(null);
    setQuestionError("");
    if (!classValue) return;

    setLoadingSubjects(true);
    try {
      const response = await fetch("/api/get-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ className: classValue }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !Array.isArray(data.subjects))
        throw new Error("Unable to load subjects.");
      setSubjects(data.subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
      setQuestionError("Could not load subjects. Please try again.");
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleSubjectChange = async (subjectValue: string) => {
    setSelectedSubject(subjectValue);
    setSelectedChapter("");
    setChapters([]);
    setQuestions([]);
    setSelectedQuestions([]);
    setQuestionSearchQuery("");
    setOpenFilter(null);
    setQuestionError("");
    if (!subjectValue || !selectedClass) return;

    const subjectName =
      subjects.find((subject) => subject.value === subjectValue)?.label ||
      subjectValue;
    setLoadingChapters(true);
    try {
      const response = await fetch("/api/get-chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ className: selectedClass, subjectName }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !Array.isArray(data.chapters))
        throw new Error("Unable to load chapters.");
      setChapters(data.chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      setChapters([]);
      setQuestionError("Could not load chapters. Please try again.");
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleFetchQuestions = async () => {
    if (!selectedClass || !selectedSubject || !selectedChapter) return;
    setLoadingQuestions(true);
    setQuestionError("");
    setOpenFilter(null);

    try {
      const response = await fetch("/api/get-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: selectedClass,
          subjectName: selectedSubject,
          chapterName: selectedChapter,
          questionType: selectedQuestionType,
          searchQuery: searchQuery.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !Array.isArray(data.questions))
        throw new Error("Unable to load questions.");
      setQuestions(normalizeQuestions(data.questions));
      setQuestionSearchQuery("");
      setResultTypeTab("all");
    } catch (error) {
      console.error("Error fetching questions:", error);
      setQuestions([]);
      setQuestionError("Could not fetch questions. Please try again.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAutoCreate = () => {
    const count = Math.max(1, Math.min(autoCount, questions.length));
    setSelectedQuestions(shuffle(questions).slice(0, count));
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoUrl((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return url;
    });
  };

  const removeLogo = () => {
    setLogoUrl((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return "";
    });
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const updateQuestionMark = (id: string, value: number) => {
    const mark = Math.max(
      1,
      Math.min(100, Number.isFinite(value) ? Math.round(value) : 1),
    );
    updateSelectedQuestions((current) =>
      current.map((q) => (q.id === id ? { ...q, marks: mark } : q)),
    );
  };

  const updateSectionMarks = (type: Question["type"], value: number) => {
    const mark = Math.max(
      1,
      Math.min(100, Number.isFinite(value) ? Math.round(value) : 1),
    );
    setSectionMarks((current) => ({ ...current, [type]: mark }));
    updateSelectedQuestions((current) =>
      current.map((q) => (q.type === type ? { ...q, marks: mark } : q)),
    );
  };

  const moveQuestion = (dragId: string, targetId: string) => {
    if (dragId === targetId) return;
    updateSelectedQuestions((current) => {
      const sourceIndex = current.findIndex(
        (question) => question.id === dragId,
      );
      const targetIndex = current.findIndex(
        (question) => question.id === targetId,
      );
      if (
        sourceIndex < 0 ||
        targetIndex < 0 ||
        current[sourceIndex].type !== current[targetIndex].type
      )
        return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    if (draggedId) moveQuestion(draggedId, targetId);
    setDraggedId(null);
    setDragOverId(null);
  };

  const shuffleSelected = () => {
    setSelectedQuestions((current) => shuffle(current));
  };

  const handleSave = () => {
    const draft = {
      selectedQuestions,
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
    };
    localStorage.setItem("question-paper-draft", JSON.stringify(draft));
    setSaveStatus("Saved");
    window.setTimeout(() => setSaveStatus(""), 1800);
  };

  const handleDownloadPdf = () => window.print();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("question-paper-draft");
      if (!raw) return;
      const draft = JSON.parse(raw) as Record<string, unknown>;
      if (Array.isArray(draft.selectedQuestions))
        setSelectedQuestions(normalizeQuestions(draft.selectedQuestions));
      if (
        draft.pageSize === "A4" ||
        draft.pageSize === "A5" ||
        draft.pageSize === "Joint"
      )
        setPageSize(draft.pageSize);
      if (Number.isFinite(Number(draft.fontScale)))
        setFontScale(Math.max(70, Math.min(140, Number(draft.fontScale))));
      if (typeof draft.setNoEnabled === "boolean")
        setSetNoEnabled(draft.setNoEnabled);
      if (typeof draft.setNo === "string") setSetNo(draft.setNo);
      if (typeof draft.selectAnswerEnabled === "boolean")
        setSelectAnswerEnabled(draft.selectAnswerEnabled);
      if (typeof draft.headerNoteEnabled === "boolean")
        setHeaderNoteEnabled(draft.headerNoteEnabled);
      if (typeof draft.headerNote === "string") setHeaderNote(draft.headerNote);
      if (typeof draft.footerText === "string") setFooterText(draft.footerText);
      if (typeof draft.institutionName === "string")
        setInstitutionName(draft.institutionName);
      if (typeof draft.examName === "string") setExamName(draft.examName);
      if (typeof draft.timeText === "string") setTimeText(draft.timeText);
      if (draft.paperStyle === "Classic" || draft.paperStyle === "Compact")
        setPaperStyle(draft.paperStyle);
      if (draft.layoutColumns === 1 || draft.layoutColumns === 2)
        setLayoutColumns(draft.layoutColumns);
      if (typeof draft.compactSpacing === "boolean")
        setCompactSpacing(draft.compactSpacing);
      if (draft.answerSelections && typeof draft.answerSelections === "object")
        setAnswerSelections(draft.answerSelections as Record<string, string>);
      if (draft.sectionMarks && typeof draft.sectionMarks === "object")
        setSectionMarks({
          ...DEFAULT_SECTION_MARKS,
          ...(draft.sectionMarks as Partial<Record<Question["type"], number>>),
        });
    } catch (error) {
      console.warn("Could not restore saved question paper draft.", error);
    }
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F2EF]">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-200/80 bg-white px-5 py-3 text-xs font-semibold text-gray-600 shadow-sm">
          <Loader2 size={16} className="animate-spin text-[#FF5D00]" />
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <div className="question-paper-page min-h-screen bg-[#F8F2EF] text-[#1F2937]">
      <div className="screen-only">
        <DashboardNavbar />
      </div>

      <header className="screen-only flex flex-col gap-3 border-b border-gray-200 bg-white px-6 py-3.5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="hidden h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 sm:flex"
            title="Go back"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
              New question paper
            </h1>
            <p className="mt-0.5 text-xs font-medium text-gray-400">
              {selectedQuestions.length} questions · Full marks {totalMarks}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={paperStyle}
            onChange={(event) =>
              setPaperStyle(event.target.value as "Classic" | "Compact")
            }
            className="h-8 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none"
          >
            <option value="Classic">Classic</option>
            <option value="Compact">Compact</option>
          </select>
          <button
            type="button"
            onClick={handleSave}
            className="flex h-8 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Save size={13} className="text-gray-500" /> Save
            {saveStatus ? (
              <span className="text-[#F3A847]">· {saveStatus}</span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-8 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Printer size={13} className="text-gray-500" /> Print
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex h-8 items-center gap-1.5 rounded-xl bg-[#F3A847] px-3.5 text-xs font-bold text-white shadow-sm hover:bg-[#e29a3e]"
          >
            <Download size={13} /> Download PDF
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-4 p-4 lg:flex-row lg:gap-4 xl:p-6">
        <aside className="screen-only flex w-full min-h-0 shrink-0 flex-col gap-3 lg:w-[315px] xl:w-[330px]">
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setSelectedTab("browse")}
              className={`flex-1 rounded-lg py-2 text-[11px] font-bold transition ${selectedTab === "browse" ? "bg-orange-50 text-[#F3A847]" : "text-gray-500 hover:text-gray-700"}`}
            >
              Browse &amp; pick
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab("auto")}
              className={`flex-1 rounded-lg py-2 text-[11px] font-bold transition ${selectedTab === "auto" ? "bg-orange-50 text-[#F3A847]" : "text-gray-500 hover:text-gray-700"}`}
            >
              Auto create
            </button>
          </div>

          {selectedTab === "browse" ? (
            <>
              <section
                id="question-filter-panel"
                className="rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setFiltersOpen((current) => !current)}
                  className="flex w-full items-center justify-between border-b border-gray-100 px-3 py-3 text-left"
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.09em] text-gray-700">
                    <SlidersHorizontal size={13} className="text-[#F3A847]" />{" "}
                    Filters
                  </span>
                  {filtersOpen ? (
                    <ChevronUp size={14} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-400" />
                  )}
                </button>

                {filtersOpen ? (
                  <div className="space-y-2.5 p-3">
                    <FilterSelect
                      label="class"
                      value={selectedClass}
                      placeholder="Select class"
                      options={CLASS_OPTIONS}
                      open={openFilter === "class"}
                      onOpen={() =>
                        setOpenFilter(openFilter === "class" ? null : "class")
                      }
                      onChange={handleClassChange}
                    />

                    <FilterSelect
                      label="subject"
                      value={selectedSubject}
                      placeholder="Select subject"
                      options={subjects}
                      loading={loadingSubjects}
                      disabled={!selectedClass}
                      open={openFilter === "subject"}
                      onOpen={() =>
                        setOpenFilter(
                          openFilter === "subject" ? null : "subject",
                        )
                      }
                      onChange={handleSubjectChange}
                    />

                    <FilterSelect
                      label="chapter"
                      value={selectedChapter}
                      placeholder="Select chapter"
                      options={chapters}
                      loading={loadingChapters}
                      disabled={!selectedSubject}
                      open={openFilter === "chapter"}
                      onOpen={() =>
                        setOpenFilter(
                          openFilter === "chapter" ? null : "chapter",
                        )
                      }
                      onChange={(value) => {
                        setSelectedChapter(value);
                        setOpenFilter(null);
                        setQuestions([]);
                        setSelectedQuestions([]);
                        setQuestionError("");
                      }}
                    />

                    <FilterSelect
                      label="question type"
                      value={selectedQuestionType}
                      placeholder="All question types"
                      options={QUESTION_TYPE_OPTIONS}
                      disabled={!selectedChapter}
                      open={openFilter === "type"}
                      onOpen={() =>
                        setOpenFilter(openFilter === "type" ? null : "type")
                      }
                      onChange={(value) => {
                        setSelectedQuestionType(value);
                        setOpenFilter(null);
                      }}
                    />

                    <div
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${selectedChapter ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50 opacity-50"}`}
                    >
                      <Search size={13} className="shrink-0 text-gray-400" />
                      <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        disabled={!selectedChapter}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleFetchQuestions();
                        }}
                        placeholder="Search questions..."
                        className="w-full border-0 bg-transparent text-[11px] font-medium text-gray-700 outline-none placeholder:text-gray-300"
                      />
                    </div>

                    {questionError ? (
                      <p className="rounded-lg bg-red-50 px-2.5 py-2 text-[10px] font-semibold text-red-500">
                        {questionError}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleFetchQuestions}
                      disabled={
                        !selectedClass ||
                        !selectedSubject ||
                        !selectedChapter ||
                        loadingQuestions
                      }
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-extrabold transition ${!selectedClass || !selectedSubject || !selectedChapter || loadingQuestions ? "cursor-not-allowed bg-amber-100 text-amber-400" : "bg-[#F3A847] text-white hover:bg-[#e29a3e]"}`}
                    >
                      {loadingQuestions ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <SlidersHorizontal size={13} />
                      )}
                      {loadingQuestions ? "Loading..." : "Apply filter"}
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="space-y-2 border-b border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-gray-500">
                      {questions.length
                        ? questionSearchQuery
                          ? `Showing ${visibleQuestions.length} of ${questions.length}`
                          : `${questions.length} found`
                        : "0 found"}
                    </span>
                    {visibleQuestions.length > 0 ? (
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        {visibleQuestions.every((question) =>
                          selectedIds.has(question.id),
                        )
                          ? "☑ Select all"
                          : "☐ Select all"}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                    {(
                      [
                        ["all", "All", typeCounts.all],
                        ["MCQ", "MCQ", typeCounts.MCQ],
                        ["Short", "Short", typeCounts.Short],
                        ["Descriptive", "Descriptive", typeCounts.Descriptive],
                      ] as const
                    ).map(([value, label, count]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setResultTypeTab(value)}
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-semibold transition ${resultTypeTab === value ? "bg-[#F3A847] text-white" : "border border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}
                      >
                        {label}
                        {value === "all" ? "" : ` (${count})`}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2">
                    <Search size={12} className="text-gray-400" />
                    <input
                      value={questionSearchQuery}
                      onChange={(event) =>
                        setQuestionSearchQuery(event.target.value)
                      }
                      placeholder="Search in fetched questions..."
                      className="w-full border-0 bg-transparent text-[10px] outline-none placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
                  {loadingQuestions ? (
                    <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-center">
                      <Loader2
                        size={22}
                        className="animate-spin text-[#F3A847]"
                      />
                      <p className="text-[10px] font-semibold text-gray-500">
                        Fetching questions via AI...
                      </p>
                    </div>
                  ) : visibleQuestions.length ? (
                    <div className="space-y-2">
                      {visibleQuestions.map((question) => {
                        const selected = selectedIds.has(question.id);
                        return (
                          <button
                            key={question.id}
                            type="button"
                            onClick={() => toggleSelectQuestion(question)}
                            className={`w-full rounded-lg border px-2.5 py-2.5 text-left transition ${selected ? "border-[#F3A847] bg-[#FFF9EF]" : "border-gray-200 bg-white hover:border-gray-300"}`}
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${selected ? "border-[#F3A847] bg-[#F3A847] text-white" : "border-gray-300 bg-white"}`}
                              >
                                {selected ? <Check size={10} /> : null}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-[10px] font-semibold leading-relaxed text-gray-700">
                                  {question.question}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-[9px] text-gray-400">
                                  <span className="font-bold">
                                    {question.type === "Short"
                                      ? "Short"
                                      : question.type}
                                  </span>
                                  <span>{question.marks || 1} marks</span>
                                </div>
                              </div>
                              {selected ? (
                                <FileText
                                  size={12}
                                  className="shrink-0 text-[#F3A847]"
                                />
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex min-h-[240px] flex-col items-center justify-center px-5 text-center">
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F3A847]">
                        <FileText size={18} />
                      </div>
                      <p className="text-[10px] font-semibold text-gray-500">
                        Set your filters and press “Apply filter” to load
                        questions.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-extrabold text-gray-800">
                      {selectedQuestions.length} selected
                    </p>
                    <p className="mt-0.5 text-[9px] text-gray-400">
                      Total marks: {totalMarks}
                    </p>
                  </div>
                  {selectedQuestions.length ? (
                    <button
                      type="button"
                      onClick={clearSelectedQuestions}
                      className="flex items-center gap-1 text-[10px] font-semibold text-red-400 hover:text-red-500"
                    >
                      <Trash2 size={11} /> Clear
                    </button>
                  ) : null}
                </div>

                {selectedQuestions.length ? (
                  <div className="mt-3 space-y-2 border-t border-gray-100 pt-2">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                      Marks per section
                    </p>
                    {sectionGroups.map(
                      ({ type, questions: groupQuestions }) => (
                        <div
                          key={type}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="text-[9px] font-semibold text-gray-500">
                            {type === "MCQ" ? "MCQ" : type}
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={
                                sectionMarks[type] ||
                                groupQuestions[0]?.marks ||
                                1
                              }
                              onChange={(event) =>
                                updateSectionMarks(
                                  type,
                                  Number(event.target.value),
                                )
                              }
                              className="h-6 w-12 rounded-md border border-gray-200 px-1.5 text-center text-[9px] font-bold outline-none focus:border-[#F3A847]"
                            />
                            <span className="text-[9px] text-gray-400">
                              marks
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                    <p className="pt-1 text-[8px] leading-relaxed text-gray-300">
                      Drag questions to reorder them within a section. Click a
                      mark in the preview to set it individually.
                    </p>
                  </div>
                ) : null}
              </section>
            </>
          ) : (
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#F3A847]">
                  <Shuffle size={14} />
                </div>
                <div>
                  <h3 className="text-[11px] font-extrabold text-gray-800">
                    Auto create
                  </h3>
                  <p className="text-[9px] text-gray-400">
                    Pick a random set from the fetched questions.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <label className="text-[10px] font-bold text-gray-500">
                  Number of questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, questions.length)}
                  value={autoCount}
                  onChange={(event) =>
                    setAutoCount(Math.max(1, Number(event.target.value) || 1))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[11px] font-semibold outline-none focus:border-[#F3A847]"
                />
                <button
                  type="button"
                  onClick={handleAutoCreate}
                  disabled={!questions.length}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-extrabold ${questions.length ? "bg-[#F3A847] text-white hover:bg-[#e29a3e]" : "cursor-not-allowed bg-gray-100 text-gray-300"}`}
                >
                  <Shuffle size={13} /> Create random set
                </button>
                <p className="text-[9px] leading-relaxed text-gray-400">
                  Fetch questions first from Browse &amp; pick, then use Auto
                  create to select a random set.
                </p>
              </div>
            </section>
          )}
        </aside>

        <section className="min-w-0 flex-1">
          <div className="flex flex-col gap-3">
            <div className="screen-only rounded-xl border border-gray-200 bg-white p-3 shadow-sm xl:p-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-[85px_110px_minmax(270px,1fr)_115px_140px] xl:items-start">
                <div>
                  <span className="field-label">LOGO</span>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-white px-2 text-[10px] font-semibold text-gray-500 hover:border-gray-400"
                  >
                    <ImageIcon size={11} /> {logoUrl ? "Change" : "Add logo"}
                  </button>
                  {logoUrl ? (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="mt-1 flex w-full items-center justify-center gap-1 text-[8px] font-semibold text-red-400"
                    >
                      <X size={9} /> remove
                    </button>
                  ) : null}
                </div>

                <div>
                  <span className="field-label">FONT</span>
                  <div className="flex h-8 items-center justify-between rounded-lg border border-gray-200 bg-white px-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFontScale((value) => Math.max(70, value - 5))
                      }
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-[10px] font-bold text-gray-700">
                      {fontScale}%
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFontScale((value) => Math.min(140, value + 5))
                      }
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>

                <div className="col-span-2 md:col-span-2 xl:col-span-1">
                  <span className="field-label">PAGE</span>
                  <div className="flex h-8 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 p-0.5">
                    {(["A4", "A5", "Joint"] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPageSize(size)}
                        className={`flex-1 rounded-md px-2 text-[9px] font-bold transition ${pageSize === size ? "bg-[#F3A847] text-white shadow-sm" : "text-gray-600 hover:bg-white"}`}
                      >
                        {size === "A5"
                          ? "A5 (small)"
                          : size === "Joint"
                            ? "Joint (2-in-1)"
                            : "A4"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="field-label">SET NO</span>
                  <div className="flex h-8 items-center gap-2">
                    <Toggle
                      checked={setNoEnabled}
                      onChange={() => setSetNoEnabled((value) => !value)}
                    />
                    {setNoEnabled ? (
                      <input
                        value={setNo}
                        onChange={(event) => setSetNo(event.target.value)}
                        placeholder="e.g. A"
                        className="h-8 w-full rounded-lg border border-gray-200 px-2 text-[9px] font-semibold outline-none focus:border-[#F3A847]"
                      />
                    ) : (
                      <span className="text-[9px] font-semibold text-gray-400">
                        Off
                      </span>
                    )}
                    {setNoEnabled ? (
                      <button
                        type="button"
                        onClick={shuffleSelected}
                        title="Shuffle selected questions"
                        className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2 text-[9px] font-bold text-gray-600 hover:bg-gray-50"
                      >
                        <Shuffle size={10} /> Shuffle
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="relative" ref={layoutRef}>
                  <span className="field-label">LAYOUT</span>
                  <button
                    type="button"
                    onClick={() => setLayoutOpen((value) => !value)}
                    className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 text-[9px] font-bold text-gray-600 hover:bg-gray-50"
                  >
                    <Settings2 size={10} className="text-gray-400" /> Options
                  </button>
                  {layoutOpen ? (
                    <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-gray-200 bg-white p-3 shadow-[0_16px_35px_rgba(17,24,39,0.12)]">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-gray-400">
                        Columns
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {[1, 2].map((columns) => (
                          <button
                            key={columns}
                            type="button"
                            onClick={() => setLayoutColumns(columns as 1 | 2)}
                            className={`rounded-lg border px-2 py-2 text-[9px] font-bold ${layoutColumns === columns ? "border-[#F3A847] bg-orange-50 text-[#F3A847]" : "border-gray-200 text-gray-500"}`}
                          >
                            {columns} column{columns > 1 ? "s" : ""}
                          </button>
                        ))}
                      </div>
                      <label className="mt-3 flex items-center justify-between gap-2 text-[9px] font-semibold text-gray-500">
                        Compact spacing
                        <Toggle
                          checked={compactSpacing}
                          onChange={() => setCompactSpacing((value) => !value)}
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 md:grid-cols-4 xl:grid-cols-[1fr_1fr_1fr_2fr]">
                <div>
                  <span className="field-label">SELECT ANSWER</span>
                  <div className="flex h-8 items-center gap-2">
                    <Toggle
                      checked={selectAnswerEnabled}
                      onChange={() => setSelectAnswerEnabled((value) => !value)}
                    />
                    <span className="text-[9px] font-semibold text-gray-400">
                      {selectAnswerEnabled ? "On" : "Off"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="field-label">HEADER NOTE</span>
                  <div className="flex min-h-8 items-center gap-2">
                    <Toggle
                      checked={headerNoteEnabled}
                      onChange={() => setHeaderNoteEnabled((value) => !value)}
                    />
                    {headerNoteEnabled ? (
                      <input
                        value={headerNote}
                        onChange={(event) => setHeaderNote(event.target.value)}
                        placeholder="Enter a note"
                        className="h-8 w-full rounded-lg border border-gray-200 px-2 text-[9px] outline-none focus:border-[#F3A847]"
                      />
                    ) : (
                      <span className="text-[9px] font-semibold text-gray-400">
                        Off
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="field-label">FOOTER</span>
                  <input
                    value={footerText}
                    onChange={(event) => setFooterText(event.target.value)}
                    className="h-8 w-full rounded-lg border border-gray-200 px-2.5 text-[9px] font-semibold text-gray-600 outline-none focus:border-[#F3A847]"
                  />
                </div>
                <div className="hidden xl:block" />
              </div>
            </div>

            <div className="paper-stage rounded-xl border border-gray-200 bg-[#F4F4F4] p-3 shadow-sm">
              <div className="screen-only mb-2 flex items-center gap-1.5 text-[9px] font-medium text-gray-400">
                <GripVertical size={11} /> Drag questions to reorder them within
                a section
              </div>
              <div className="paper-print-root overflow-auto py-1">
                {selectedQuestions.length === 0 ? (
                  <div className="flex min-h-[590px] items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#F3A847] shadow-sm">
                        <FileText size={18} />
                      </div>
                      <p className="text-[11px] font-bold text-gray-500">
                        No questions selected yet
                      </p>
                      <p className="mt-1 max-w-xs text-[9px] leading-relaxed text-gray-400">
                        Filter and pick questions from the left — they will
                        appear here as a paper.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex items-start justify-center gap-3 ${pageSize === "Joint" ? "min-w-[1050px]" : "min-w-[620px]"}`}
                  >
                    {pageSize === "Joint" ? (
                      <>
                        <PaperSheet
                          pageSize="A5"
                          fontSize={paperFontPx}
                          paperGap={paperGap}
                          layoutColumns={1}
                          logoUrl={logoUrl}
                          institutionName={institutionName}
                          setInstitutionName={setInstitutionName}
                          examName={examName}
                          setExamName={setExamName}
                          selectedSubject={
                            subjects.find((s) => s.value === selectedSubject)
                              ?.label || selectedSubject
                          }
                          selectedClass={selectedClass}
                          selectedChapter={
                            chapters.find((c) => c.value === selectedChapter)
                              ?.label || selectedChapter
                          }
                          timeText={timeText}
                          totalMarks={totalMarks}
                          setNoEnabled={setNoEnabled}
                          setNo={setNo}
                          headerNoteEnabled={headerNoteEnabled}
                          headerNote={headerNote}
                          footerText={footerText}
                          styleVariant={paperStyle}
                          groups={sectionGroups}
                          questionNumberMap={questionNumberMap}
                          onRemove={toggleSelectQuestion}
                          onDragStart={(id) => setDraggedId(id)}
                          onDragOver={(event, id) => {
                            event.preventDefault();
                            setDragOverId(id);
                          }}
                          onDrop={handleDrop}
                          onDragEnd={() => {
                            setDraggedId(null);
                            setDragOverId(null);
                          }}
                          dragOverId={dragOverId}
                          editingMarkId={editingMarkId}
                          setEditingMarkId={setEditingMarkId}
                          updateQuestionMark={updateQuestionMark}
                          selectAnswerEnabled={selectAnswerEnabled}
                          answerSelections={answerSelections}
                          setAnswerSelections={setAnswerSelections}
                          pagePart="left"
                        />
                        <PaperSheet
                          pageSize="A5"
                          fontSize={paperFontPx}
                          paperGap={paperGap}
                          layoutColumns={1}
                          logoUrl={logoUrl}
                          institutionName={institutionName}
                          setInstitutionName={setInstitutionName}
                          examName={examName}
                          setExamName={setExamName}
                          selectedSubject={
                            subjects.find((s) => s.value === selectedSubject)
                              ?.label || selectedSubject
                          }
                          selectedClass={selectedClass}
                          selectedChapter={
                            chapters.find((c) => c.value === selectedChapter)
                              ?.label || selectedChapter
                          }
                          timeText={timeText}
                          totalMarks={totalMarks}
                          setNoEnabled={setNoEnabled}
                          setNo={setNo}
                          headerNoteEnabled={headerNoteEnabled}
                          headerNote={headerNote}
                          footerText={footerText}
                          styleVariant={paperStyle}
                          groups={sectionGroups}
                          questionNumberMap={questionNumberMap}
                          onRemove={toggleSelectQuestion}
                          onDragStart={(id) => setDraggedId(id)}
                          onDragOver={(event, id) => {
                            event.preventDefault();
                            setDragOverId(id);
                          }}
                          onDrop={handleDrop}
                          onDragEnd={() => {
                            setDraggedId(null);
                            setDragOverId(null);
                          }}
                          dragOverId={dragOverId}
                          editingMarkId={editingMarkId}
                          setEditingMarkId={setEditingMarkId}
                          updateQuestionMark={updateQuestionMark}
                          selectAnswerEnabled={selectAnswerEnabled}
                          answerSelections={answerSelections}
                          setAnswerSelections={setAnswerSelections}
                          pagePart="right"
                        />
                      </>
                    ) : (
                      <PaperSheet
                        pageSize={pageSize}
                        fontSize={paperFontPx}
                        paperGap={paperGap}
                        layoutColumns={
                          pageSize === "A5" ? layoutColumns : layoutColumns
                        }
                        logoUrl={logoUrl}
                        institutionName={institutionName}
                        setInstitutionName={setInstitutionName}
                        examName={examName}
                        setExamName={setExamName}
                        selectedSubject={
                          subjects.find((s) => s.value === selectedSubject)
                            ?.label || selectedSubject
                        }
                        selectedClass={selectedClass}
                        selectedChapter={
                          chapters.find((c) => c.value === selectedChapter)
                            ?.label || selectedChapter
                        }
                        timeText={timeText}
                        totalMarks={totalMarks}
                        setNoEnabled={setNoEnabled}
                        setNo={setNo}
                        headerNoteEnabled={headerNoteEnabled}
                        headerNote={headerNote}
                        footerText={footerText}
                        styleVariant={paperStyle}
                        groups={sectionGroups}
                        questionNumberMap={questionNumberMap}
                        onRemove={toggleSelectQuestion}
                        onDragStart={(id) => setDraggedId(id)}
                        onDragOver={(event, id) => {
                          event.preventDefault();
                          setDragOverId(id);
                        }}
                        onDrop={handleDrop}
                        onDragEnd={() => {
                          setDraggedId(null);
                          setDragOverId(null);
                        }}
                        dragOverId={dragOverId}
                        editingMarkId={editingMarkId}
                        setEditingMarkId={setEditingMarkId}
                        updateQuestionMark={updateQuestionMark}
                        selectAnswerEnabled={selectAnswerEnabled}
                        answerSelections={answerSelections}
                        setAnswerSelections={setAnswerSelections}
                        pagePart="single"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx global>{`
        .field-label {
          display: block;
          margin-bottom: 6px;
          color: #9ca3af;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .paper-a4 {
          width: 620px;
          min-height: 875px;
        }
        .paper-a5 {
          width: 520px;
          min-height: 735px;
        }
        @media (max-width: 900px) {
          .paper-a4 {
            width: 580px;
          }
          .paper-a5 {
            width: 490px;
          }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media print {
          @page {
            margin: 10mm;
          }
          html,
          body {
            background: #fff !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .screen-only {
            display: none !important;
          }
          .question-paper-page {
            min-height: auto !important;
            background: #fff !important;
          }
          main {
            display: block !important;
            padding: 0 !important;
          }
          main > section {
            width: 100% !important;
          }
          .paper-stage {
            border: 0 !important;
            background: #fff !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .paper-print-root {
            overflow: visible !important;
            padding: 0 !important;
          }
          .paper-screen-sheet {
            border: 0 !important;
            box-shadow: none !important;
            margin: 0 auto 10mm !important;
          }
          .paper-screen-sheet .group {
            break-inside: avoid;
          }
          .paper-screen-sheet input {
            color: #111827 !important;
          }
        }
      `}</style>
    </div>
  );
}

function PaperSheet({
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
}) {
  const isJointPart = pagePart !== "single";
  const allQuestions = groups.flatMap((group) => group.questions);
  const half = Math.ceil(allQuestions.length / 2);
  const visibleIds = new Set(
    isJointPart
      ? allQuestions
          .slice(
            pagePart === "left" ? 0 : half,
            pagePart === "left" ? half : allQuestions.length,
          )
          .map((q) => q.id)
      : allQuestions.map((q) => q.id),
  );
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      questions: group.questions.filter((question) =>
        visibleIds.has(question.id),
      ),
    }))
    .filter((group) => group.questions.length > 0);

  const paperClass = pageSize === "A5" ? "paper-a5" : "paper-a4";
  const padding = pageSize === "A5" ? "p-6" : "p-7";

  return (
    <article
      className={`paper-screen-sheet ${paperClass} rounded-sm border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(17,24,39,0.08)] ${padding}`}
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="relative border-b border-[#8B8B8B] pb-2.5 text-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="absolute left-0 top-0 h-8 w-auto max-w-[64px] object-contain"
            />
          ) : null}
          <div className="absolute right-0 top-0 text-[8px] font-semibold text-gray-500">
            {setNoEnabled ? `Set No: ${setNo || "—"}` : ""}
          </div>
          {headerNoteEnabled && headerNote ? (
            <div className="mb-1 text-[8px] font-semibold text-gray-500">
              {headerNote}
            </div>
          ) : null}
          <input
            value={institutionName}
            placeholder="Institution name (school / coaching / college)"
            onChange={(event) => setInstitutionName(event.target.value)}
            className="w-full border-0 bg-transparent text-center font-extrabold text-gray-900 outline-none placeholder:text-gray-300 placeholder:opacity-60"
            style={{ fontSize: `${Math.max(14, fontSize + 3)}px` }}
            data-paper-input="institution"
          />
          <input
            value={examName}
            placeholder="Set the exam name here"
            onChange={(event) => setExamName(event.target.value)}
            className="mt-0.5 w-full border-0 bg-transparent text-center font-bold text-gray-600 outline-none placeholder:text-gray-300 placeholder:opacity-60"
            style={{ fontSize: `${Math.max(11, fontSize + 1)}px` }}
            data-paper-input="exam"
          />
          <p className="mt-2 text-[9px] font-semibold text-gray-700">
            Subject: {selectedSubject || "—"}
          </p>
          <p className="text-[9px] font-semibold text-gray-700">
            Class: {selectedClass || "—"}
          </p>
          <div className="mt-2 flex items-center justify-between border-t border-dashed border-gray-500 pt-1.5 text-[8px] font-semibold text-gray-700">
            <span>Time: {timeText || "e.g. 3 hours"}</span>
            <span>Full Marks: {totalMarks}</span>
          </div>
        </header>

        <div className="mt-2 text-left text-[8px] text-gray-500">
          Chapter: {selectedChapter || "—"}
        </div>

        <div
          className={`mt-2 flex-1 ${layoutColumns === 2 ? "columns-2 gap-4" : ""}`}
        >
          {visibleGroups.map((group) => (
            <section key={group.type} className="mb-3 break-inside-avoid">
              <div className="mb-1.5 flex items-center justify-between border-b border-gray-300 pb-1">
                <h3 className="text-[8px] font-extrabold text-gray-600">
                  {group.type === "MCQ"
                    ? "MCQ"
                    : group.type === "Short"
                      ? "Short Questions"
                      : "Descriptive Questions"}{" "}
                  ({group.questions.reduce((sum, q) => sum + (q.marks || 1), 0)}{" "}
                  marks)
                </h3>
              </div>

              <div className={`flex flex-col ${paperGap}`}>
                {group.questions.map((question) => (
                  <QuestionPreviewRow
                    key={question.id}
                    question={question}
                    questionNumber={questionNumberMap.get(question.id) || 1}
                    fontSize={fontSize}
                    isDragOver={dragOverId === question.id}
                    styleVariant={styleVariant}
                    onRemove={() => onRemove(question)}
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
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-2 border-t border-gray-200 pt-1.5 text-center text-[8px] text-gray-400">
          {footerText}
        </footer>
      </div>
    </article>
  );
}

function QuestionPreviewRow({
  question,
  questionNumber,
  fontSize,
  isDragOver,
  styleVariant,
  onRemove,
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
}: {
  key?: string;
  question: Question;
  questionNumber: number;
  fontSize: number;
  isDragOver: boolean;
  styleVariant: "Classic" | "Compact";
  onRemove: () => void;
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
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group relative break-inside-avoid rounded-sm border border-transparent px-1.5 py-1 transition ${isDragOver ? "border-dashed border-[#F3A847] bg-orange-50/30" : "hover:bg-gray-50"}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical
          size={10}
          className="mt-0.5 shrink-0 cursor-grab text-gray-300 opacity-0 transition group-hover:opacity-100 print:hidden"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`${styleVariant === "Compact" ? "font-semibold" : "font-bold"} min-w-0 text-gray-800`}
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.45 }}
            >
              {questionNumber}. {question.question}
            </p>
            <div className="shrink-0 text-right">
              {editingMarkId === question.id ? (
                <input
                  autoFocus
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={question.marks || 1}
                  onBlur={(event) => {
                    updateQuestionMark(question.id, Number(event.target.value));
                    setEditingMarkId(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      updateQuestionMark(
                        question.id,
                        Number((event.currentTarget as HTMLInputElement).value),
                      );
                      setEditingMarkId(null);
                    }
                    if (event.key === "Escape") setEditingMarkId(null);
                  }}
                  className="h-5 w-9 rounded border border-[#F3A847] px-1 text-center text-[8px] font-bold outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingMarkId(question.id)}
                  className="rounded px-1 text-[8px] font-bold text-gray-500 hover:bg-orange-50 hover:text-[#F3A847]"
                >
                  {question.marks || 1}
                </button>
              )}
            </div>
          </div>

          {question.options?.length ? (
            <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 pl-2">
              {question.options.map((option, index) => {
                const selected = answerSelections[question.id] === option;
                return (
                  <button
                    key={`${question.id}-option-${index}`}
                    type="button"
                    onClick={() => {
                      if (!selectAnswerEnabled) return;
                      setAnswerSelections((current) => ({
                        ...current,
                        [question.id]: option,
                      }));
                    }}
                    className={`flex items-start gap-1 text-left text-gray-600 ${selectAnswerEnabled ? "cursor-pointer" : "cursor-default"}`}
                    style={{
                      fontSize: `${Math.max(8, fontSize - 1)}px`,
                      lineHeight: 1.35,
                    }}
                  >
                    <span
                      className={`mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border text-[6px] ${selected ? "border-[#F3A847] bg-[#F3A847] text-white" : "border-gray-400 text-gray-500"}`}
                    >
                      {selected ? (
                        <Check size={7} />
                      ) : (
                        String.fromCharCode(97 + index)
                      )}
                    </span>
                    <span className="min-w-0">{option}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="mt-0.5 shrink-0 rounded p-1 text-red-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 print:hidden"
          title="Remove question"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}
