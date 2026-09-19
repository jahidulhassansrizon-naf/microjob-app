"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Download,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Save,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

interface ManualQuestion {
  id: string;
  type: "MCQ" | "Short Questions" | "Descriptive Questions";
  question: string;
  options?: string[];
  answer?: string;
  marks: number;
  stimulus?: string;
  subQuestions?: string[];
}

type PageSize = "A4" | "A5" | "Joint";

type LayoutSettings = {
  columns: 1 | 2;
  questionGap: "compact" | "normal" | "spacious";
  showQuestionMarks: boolean;
  showSectionTitles: boolean;
};

const DRAFT_KEY = "manual-question-paper-draft-v2";

const createId = () =>
  `manual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const clampFont = (value: number) => Math.min(140, Math.max(80, value));

export default function ManualQuestionPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Manual editor
  const [activeTab, setActiveTab] = useState<ManualQuestion["type"]>("MCQ");
  const [manualEnabled, setManualEnabled] = useState(true);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState([
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
  ]);
  const [answer, setAnswer] = useState("");
  const [stimulus, setStimulus] = useState("");
  const [subQuestions, setSubQuestions] = useState(["", "", "", ""]);
  const [marks, setMarks] = useState("1");

  // Paper data
  const [questions, setQuestions] = useState<ManualQuestion[]>([]);
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(
    null,
  );

  // Paper / preview settings
  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [fontScale, setFontScale] = useState(100);
  const [setNoEnabled, setSetNoEnabled] = useState(false);
  const [setNumber, setSetNumber] = useState("A");
  const [selectAnswerEnabled, setSelectAnswerEnabled] = useState(false);
  const [headerNoteEnabled, setHeaderNoteEnabled] = useState(false);
  const [headerNote, setHeaderNote] = useState("Answer all questions.");
  const [footer, setFooter] = useState("The End");
  const [logo, setLogo] = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState("");
  const [examName, setExamName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [className, setClassName] = useState("");
  const [timeText, setTimeText] = useState("3 hours");
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editHeaderOpen, setEditHeaderOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [printMode, setPrintMode] = useState(false);
  const [layout, setLayout] = useState<LayoutSettings>({
    columns: 1,
    questionGap: "normal",
    showQuestionMarks: true,
    showSectionTitles: true,
  });

  // Auth protection
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) router.push("/login");
    else setIsAuthenticated(true);
  }, [router]);

  // Close small popovers when clicking elsewhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLayoutOpen(false);
        setMenuOpen(false);
        setEditHeaderOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const totalMarks = useMemo(
    () =>
      questions.reduce(
        (sum, q) => sum + (Number.isFinite(q.marks) ? q.marks : 0),
        0,
      ),
    [questions],
  );

  const activeTabIsMCQ = activeTab === "MCQ";
  const activeTabIsDescriptive = activeTab === "Descriptive Questions";

  const resetManualForm = () => {
    setQuestionText("");
    setAnswer("");
    setStimulus("");
    setSubQuestions(["", "", "", ""]);
    setOptions(["Option 1", "Option 2", "Option 3", "Option 4"]);
    setMarks(
      activeTab === "Descriptive Questions"
        ? "5"
        : activeTab === "Short Questions"
          ? "2"
          : "1",
    );
    setEditingQuestionId(null);
  };

  const switchTab = (tab: ManualQuestion["type"]) => {
    setActiveTab(tab);
    setEditingQuestionId(null);
    setQuestionText("");
    setAnswer("");
    setStimulus("");
    setSubQuestions(tab === "Descriptive Questions" ? ["", "", "", ""] : []);
    setOptions(
      tab === "MCQ" ? ["Option 1", "Option 2", "Option 3", "Option 4"] : [],
    );
    setMarks(
      tab === "Descriptive Questions"
        ? "5"
        : tab === "Short Questions"
          ? "2"
          : "1",
    );
  };

  const addOption = () =>
    setOptions((current) => [...current, `Option ${current.length + 1}`]);

  const removeOption = (index: number) => {
    setOptions((current) => {
      if (current.length <= 2) return current;
      const removed = current[index];
      if (answer === removed) setAnswer("");
      return current.filter((_, i) => i !== index);
    });
  };

  const addSubQuestion = () => setSubQuestions((current) => [...current, ""]);

  const removeSubQuestion = (index: number) => {
    setSubQuestions((current) => {
      if (current.length <= 1) return current;
      return current.filter((_, i) => i !== index);
    });
  };

  const addToPaper = () => {
    if (!manualEnabled) return;

    if (activeTab === "Descriptive Questions") {
      if (!stimulus.trim() && subQuestions.every((item) => !item.trim())) {
        return;
      }
    } else if (!questionText.trim()) {
      return;
    }

    const parsedMarks = Math.max(0, Number.parseFloat(marks) || 0);
    const question: ManualQuestion = {
      id: editingQuestionId ?? createId(),
      type: activeTab,
      question:
        activeTab === "Descriptive Questions"
          ? stimulus.trim()
          : questionText.trim(),
      marks: parsedMarks,
      options:
        activeTab === "MCQ" ? options.map((item) => item.trim()) : undefined,
      answer: activeTab === "MCQ" && answer ? answer : undefined,
      stimulus:
        activeTab === "Descriptive Questions" ? stimulus.trim() : undefined,
      subQuestions:
        activeTab === "Descriptive Questions"
          ? subQuestions
              .filter((item) => item.trim())
              .map((item) => item.trim())
          : undefined,
    };

    setQuestions((current) => {
      if (editingQuestionId) {
        return current.map((item) =>
          item.id === editingQuestionId ? question : item,
        );
      }
      return [...current, question];
    });

    resetManualForm();
  };

  const editQuestion = (question: ManualQuestion) => {
    setEditingQuestionId(question.id);
    setActiveTab(question.type);
    setMarks(String(question.marks));
    if (question.type === "MCQ") {
      setQuestionText(question.question);
      setOptions(question.options?.length ? question.options : ["", ""]);
      setAnswer(question.answer ?? "");
      setStimulus("");
      setSubQuestions([]);
    } else if (question.type === "Short Questions") {
      setQuestionText(question.question);
      setOptions([]);
      setAnswer("");
      setStimulus("");
      setSubQuestions([]);
    } else {
      setStimulus(question.stimulus ?? question.question);
      setQuestionText("");
      setOptions([]);
      setAnswer("");
      setSubQuestions(
        question.subQuestions?.length ? question.subQuestions : [""],
      );
    }
  };

  const removeQuestion = (id: string) => {
    setQuestions((current) => current.filter((item) => item.id !== id));
    if (editingQuestionId === id) resetManualForm();
  };

  const onDragStart = (event: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedQuestionId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    const sourceId =
      draggedQuestionId || event.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) return;

    setQuestions((current) => {
      const sourceIndex = current.findIndex((item) => item.id === sourceId);
      const targetIndex = current.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDraggedQuestionId(null);
  };

  const updateQuestionMarks = (id: string, value: string) => {
    const nextMarks = Math.max(0, Number.parseFloat(value) || 0);
    setQuestions((current) =>
      current.map((q) => (q.id === id ? { ...q, marks: nextMarks } : q)),
    );
  };

  const toggleAnswer = (questionId: string, option: string) => {
    setQuestions((current) =>
      current.map((q) =>
        q.id === questionId
          ? { ...q, answer: q.answer === option ? undefined : option }
          : q,
      ),
    );
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () =>
      setLogo(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          questions,
          pageSize,
          fontScale,
          setNoEnabled,
          setNumber,
          selectAnswerEnabled,
          headerNoteEnabled,
          headerNote,
          footer,
          logo,
          institutionName,
          examName,
          subjectName,
          className,
          timeText,
          layout,
        }),
      );
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (error) {
      console.error("Unable to save draft", error);
    }
  };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<{
        questions: ManualQuestion[];
        pageSize: PageSize;
        fontScale: number;
        setNoEnabled: boolean;
        setNumber: string;
        selectAnswerEnabled: boolean;
        headerNoteEnabled: boolean;
        headerNote: string;
        footer: string;
        logo: string | null;
        institutionName: string;
        examName: string;
        subjectName: string;
        className: string;
        timeText: string;
        layout: LayoutSettings;
      }>;

      if (Array.isArray(draft.questions)) setQuestions(draft.questions);
      if (draft.pageSize) setPageSize(draft.pageSize);
      if (typeof draft.fontScale === "number")
        setFontScale(clampFont(draft.fontScale));
      if (typeof draft.setNoEnabled === "boolean")
        setSetNoEnabled(draft.setNoEnabled);
      if (typeof draft.setNumber === "string") setSetNumber(draft.setNumber);
      if (typeof draft.selectAnswerEnabled === "boolean")
        setSelectAnswerEnabled(draft.selectAnswerEnabled);
      if (typeof draft.headerNoteEnabled === "boolean")
        setHeaderNoteEnabled(draft.headerNoteEnabled);
      if (typeof draft.headerNote === "string") setHeaderNote(draft.headerNote);
      if (typeof draft.footer === "string") setFooter(draft.footer);
      if (typeof draft.logo === "string" || draft.logo === null)
        setLogo(draft.logo);
      if (typeof draft.institutionName === "string")
        setInstitutionName(draft.institutionName);
      if (typeof draft.examName === "string") setExamName(draft.examName);
      if (typeof draft.subjectName === "string")
        setSubjectName(draft.subjectName);
      if (typeof draft.className === "string") setClassName(draft.className);
      if (typeof draft.timeText === "string") setTimeText(draft.timeText);
      if (draft.layout) setLayout(draft.layout);
    } catch (error) {
      console.error("Unable to load draft", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadDraft();
  }, [isAuthenticated]);

  const handlePrint = () => {
    setPrintMode(true);
    window.setTimeout(() => {
      window.print();
    }, 60);
    window.setTimeout(() => setPrintMode(false), 900);
  };

  const clearPaper = () => {
    if (!questions.length) return;
    if (window.confirm("Clear all questions from the paper?")) {
      setQuestions([]);
      resetManualForm();
    }
  };

  const paperWidthClass =
    pageSize === "A4"
      ? "max-w-[794px]"
      : pageSize === "A5"
        ? "max-w-[560px]"
        : "max-w-[920px]";

  const paperGapClass =
    layout.questionGap === "compact"
      ? "space-y-2"
      : layout.questionGap === "spacious"
        ? "space-y-7"
        : "space-y-4";

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F2EF]">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-5 py-3 rounded-2xl border border-gray-200/80 shadow-sm">
          <Loader2 size={16} className="animate-spin text-[#FF5D00]" />
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @page {
          size: auto;
          margin: 12mm;
        }
        @media print {
          html,
          body {
            background: #fff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #manual-print-area,
          #manual-print-area * {
            visibility: visible !important;
          }
          #manual-print-area {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: 0 !important;
            background: #fff !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      <div
        className={`min-h-screen flex flex-col bg-[#F8F2EF] ${printMode ? "print-state" : ""}`}
      >
        <div className="print-hidden">
          <DashboardNavbar />
        </div>

        <div className="print-hidden border-b border-gray-200/80 bg-white px-5 md:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition shrink-0"
              aria-label="Back"
            >
              <ChevronLeft size={15} />
            </button>
            <div className="min-w-0">
              <h1 className="text-[17px] md:text-[19px] font-extrabold text-gray-900 truncate">
                Create Question Paper (Manual)
              </h1>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                Create, save and manage your question papers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-gray-500">
              <Settings2 size={13} />
              <span>Classic</span>
              <ChevronDown size={13} />
            </div>
            <button
              onClick={saveDraft}
              className="h-8 md:h-9 px-3 md:px-3.5 rounded-xl border border-gray-200 bg-white text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition inline-flex items-center gap-1.5"
            >
              <Save size={13} /> {saved ? "Saved" : "Save"}
            </button>
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex h-8 md:h-9 px-3 md:px-3.5 rounded-xl border border-gray-200 bg-white text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition items-center gap-1.5"
            >
              <Printer size={13} /> Print
            </button>
            <button
              onClick={handlePrint}
              className="h-8 md:h-9 px-3.5 md:px-4 rounded-xl bg-[#FF5D00] hover:bg-[#e65400] text-white text-[11px] font-extrabold transition inline-flex items-center gap-1.5 shadow-sm"
            >
              <Download size={13} /> Download PDF
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-5 px-4 md:px-6 py-4 overflow-hidden">
          {/* LEFT */}
          <aside className="print-hidden w-full lg:w-[390px] xl:w-[410px] shrink-0 overflow-y-auto pr-1 pb-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-3 shadow-sm">
              <div className="flex items-center justify-between px-1 pb-2.5 border-b border-gray-100">
                <label className="flex items-center gap-2 text-[11px] font-extrabold text-gray-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={manualEnabled}
                    onChange={(e) => setManualEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#FF5D00]"
                  />
                  Add Question Manually
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((value) => !value)}
                    className="w-7 h-7 rounded-lg hover:bg-gray-50 flex items-center justify-center text-gray-400"
                    aria-label="More"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-8 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1.5">
                      <button
                        onClick={loadDraft}
                        className="w-full text-left px-3 py-2 text-[11px] text-gray-700 hover:bg-gray-50"
                      >
                        Load saved draft
                      </button>
                      <button
                        onClick={clearPaper}
                        className="w-full text-left px-3 py-2 text-[11px] text-red-500 hover:bg-red-50"
                      >
                        Clear paper
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl mt-2.5">
                {(
                  [
                    "MCQ",
                    "Short Questions",
                    "Descriptive Questions",
                  ] as ManualQuestion["type"][]
                ).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => switchTab(tab)}
                    className={`min-h-[35px] px-2 rounded-lg text-[10px] md:text-[10.5px] leading-tight font-bold transition ${
                      activeTab === tab
                        ? "bg-white text-[#F3A847] shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {tab === "MCQ"
                      ? "MCQ"
                      : tab === "Short Questions"
                        ? "Short Questions"
                        : "Descriptive Questions"}
                  </button>
                ))}
              </div>

              <div
                className={`mt-3 rounded-xl ${!manualEnabled ? "opacity-50 pointer-events-none" : ""}`}
              >
                {activeTabIsDescriptive ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-700">
                        Stimulus / Passage (উদ্দীপক)
                      </label>
                      <textarea
                        rows={3}
                        value={stimulus}
                        onChange={(e) => setStimulus(e.target.value)}
                        placeholder="Type the stimulus / passage here..."
                        className="mt-1.5 w-full border border-gray-200 rounded-xl p-2.5 text-[11px] text-gray-800 outline-none focus:border-[#FF5D00] resize-none"
                      />
                      <p className="mt-1 text-[9px] text-gray-400">
                        Tip: wrap math in $...$ — e.g. $\\frac{1}
                        {2}$
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-700">
                        Sub-questions (ক / খ / গ / ঘ)
                      </label>
                      <div className="mt-1.5 space-y-1.5">
                        {subQuestions.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-[#FFF7E8] text-[#F3A847] text-[10px] font-extrabold flex items-center justify-center shrink-0">
                              {String.fromCharCode(2453 + idx)}
                            </span>
                            <textarea
                              rows={1}
                              value={item}
                              onChange={(e) => {
                                const next = [...subQuestions];
                                next[idx] = e.target.value;
                                setSubQuestions(next);
                              }}
                              placeholder={`Sub-question (${String.fromCharCode(2453 + idx)})`}
                              className="min-h-[31px] w-full resize-none border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] outline-none focus:border-[#FF5D00]"
                            />
                            <button
                              type="button"
                              onClick={() => removeSubQuestion(idx)}
                              className="text-gray-300 hover:text-red-500 transition"
                              aria-label="Remove sub-question"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={addSubQuestion}
                        className="mt-1.5 text-[10px] font-bold text-[#F3A847] hover:underline"
                      >
                        + Add sub-question
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-bold text-gray-700">
                      Question
                    </label>
                    <textarea
                      rows={3}
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Type the question here..."
                      className="mt-1.5 w-full border border-gray-200 rounded-xl p-2.5 text-[11px] text-gray-800 outline-none focus:border-[#FF5D00] resize-none"
                    />
                    <p className="mt-1 text-[9px] text-gray-400">
                      Tip: wrap math in $...$ — e.g. $\\frac{1}
                      {2}$
                    </p>
                  </div>
                )}

                {activeTabIsMCQ && (
                  <div className="mt-2.5 space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-700">
                      Options
                    </label>
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAnswer(opt)}
                          className={`w-5 h-5 rounded-full border text-[9px] font-bold shrink-0 flex items-center justify-center transition ${
                            answer === opt
                              ? "border-[#FF5D00] bg-[#FF5D00] text-white"
                              : "border-gray-300 bg-gray-50 text-gray-500"
                          }`}
                          title="Set as correct answer"
                        >
                          {String.fromCharCode(97 + idx)}
                        </button>
                        <input
                          value={opt}
                          onChange={(e) => {
                            const next = [...options];
                            if (answer === next[idx]) setAnswer(e.target.value);
                            next[idx] = e.target.value;
                            setOptions(next);
                          }}
                          className="w-full h-[31px] border border-gray-200 rounded-lg px-2.5 text-[11px] outline-none focus:border-[#FF5D00]"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="text-gray-300 hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-0.5">
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-[10px] font-bold text-[#F3A847] hover:underline"
                      >
                        + Add option
                      </button>
                      {answer && (
                        <span className="text-[9px] text-gray-400">
                          Correct: {answer}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-2.5">
                  <label className="text-[10px] font-bold text-gray-700">
                    Marks
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    className="mt-1.5 w-full h-[31px] border border-gray-200 rounded-xl px-2.5 text-[11px] outline-none focus:border-[#FF5D00]"
                  />
                </div>

                <button
                  type="button"
                  onClick={addToPaper}
                  className="mt-2.5 w-full h-[31px] rounded-lg bg-[#F3A847] hover:bg-[#e99a35] text-white text-[10.5px] font-extrabold transition flex items-center justify-center gap-1.5"
                >
                  <Plus size={13} />{" "}
                  {editingQuestionId ? "Update in paper" : "Add to paper"}
                </button>
              </div>
            </div>

            <div className="mt-3 bg-white border border-gray-200/80 rounded-2xl p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileText size={13} className="text-[#F3A847]" />
                  <span className="text-[11px] font-extrabold text-gray-800">
                    {questions.length} selected
                  </span>
                </div>
                <span className="text-[11px] font-extrabold text-[#F3A847]">
                  Total marks: {totalMarks}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[9px] text-gray-400">
                <span>Drag questions to reorder</span>
                {editingQuestionId && (
                  <button
                    onClick={resetManualForm}
                    className="ml-auto text-red-400 hover:text-red-600"
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* RIGHT */}
          <main className="flex-1 min-w-0 overflow-y-auto pb-4">
            <div className="print-hidden bg-white border border-gray-200/80 rounded-2xl p-3.5 md:p-4.5 shadow-sm">
              <div className="grid grid-cols-2 xl:grid-cols-[0.8fr_0.8fr_1.8fr_1fr] gap-3 md:gap-4 items-end">
                <div>
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Logo
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-[30px] rounded-lg border border-dashed border-gray-300 hover:border-[#F3A847] bg-white text-[10px] font-semibold text-gray-600 flex items-center justify-center gap-1.5"
                  >
                    {logo ? <Pencil size={11} /> : <ImageIcon size={12} />}
                    {logo ? "Change logo" : "Add logo"}
                  </button>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo(null)}
                      className="mt-1 text-[9px] text-red-400 hover:text-red-600"
                    >
                      Remove logo
                    </button>
                  )}
                </div>

                <div>
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Font
                  </span>
                  <div className="h-[30px] flex items-center justify-between border border-gray-200 rounded-lg px-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFontScale((value) => clampFont(value - 5))
                      }
                      className="text-gray-400 hover:text-gray-800"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-[10px] font-bold text-gray-700">
                      {fontScale}%
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFontScale((value) => clampFont(value + 5))
                      }
                      className="text-gray-400 hover:text-gray-800"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Page
                  </span>
                  <div className="h-[30px] grid grid-cols-3 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                    {(["A4", "A5", "Joint"] as PageSize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPageSize(size)}
                        className={`rounded-md text-[9.5px] font-bold transition ${pageSize === size ? "bg-[#F3A847] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
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

                <div className="relative">
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Layout
                  </span>
                  <button
                    type="button"
                    onClick={() => setLayoutOpen((value) => !value)}
                    className="h-[30px] w-full border border-gray-200 rounded-lg bg-white text-[10px] font-bold text-gray-600 inline-flex items-center justify-center gap-1.5 hover:bg-gray-50"
                  >
                    <Settings2 size={11} /> Options
                  </button>
                  {layoutOpen && (
                    <div className="absolute right-0 top-[55px] w-[260px] bg-white border border-gray-200 rounded-xl shadow-xl z-40 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-extrabold text-gray-900">
                          Layout options
                        </span>
                        <button
                          onClick={() => setLayoutOpen(false)}
                          className="text-gray-400"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">
                            Columns
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {[1, 2].map((column) => (
                              <button
                                key={column}
                                onClick={() =>
                                  setLayout((current) => ({
                                    ...current,
                                    columns: column as 1 | 2,
                                  }))
                                }
                                className={`h-7 rounded-lg text-[10px] font-bold border ${layout.columns === column ? "border-[#F3A847] bg-orange-50 text-[#F3A847]" : "border-gray-200 text-gray-600"}`}
                              >
                                {column === 1 ? "Single" : "Two columns"}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">
                            Question spacing
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            {(
                              [
                                "compact",
                                "normal",
                                "spacious",
                              ] as LayoutSettings["questionGap"][]
                            ).map((gap) => (
                              <button
                                key={gap}
                                onClick={() =>
                                  setLayout((current) => ({
                                    ...current,
                                    questionGap: gap,
                                  }))
                                }
                                className={`h-7 rounded-lg text-[9px] font-bold border capitalize ${layout.questionGap === gap ? "border-[#F3A847] bg-orange-50 text-[#F3A847]" : "border-gray-200 text-gray-600"}`}
                              >
                                {gap}
                              </button>
                            ))}
                          </div>
                        </div>
                        <label className="flex items-center justify-between text-[10px] text-gray-600">
                          Show marks
                          <input
                            type="checkbox"
                            checked={layout.showQuestionMarks}
                            onChange={(e) =>
                              setLayout((current) => ({
                                ...current,
                                showQuestionMarks: e.target.checked,
                              }))
                            }
                            className="accent-[#F3A847]"
                          />
                        </label>
                        <label className="flex items-center justify-between text-[10px] text-gray-600">
                          Show section titles
                          <input
                            type="checkbox"
                            checked={layout.showSectionTitles}
                            onChange={(e) =>
                              setLayout((current) => ({
                                ...current,
                                showSectionTitles: e.target.checked,
                              }))
                            }
                            className="accent-[#F3A847]"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                <div>
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Set No
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSetNoEnabled((value) => !value)}
                      className={`w-8 h-[18px] rounded-full p-0.5 flex items-center ${setNoEnabled ? "bg-[#F3A847] justify-end" : "bg-gray-200 justify-start"}`}
                    >
                      <span className="w-[14px] h-[14px] rounded-full bg-white shadow-sm" />
                    </button>
                    <span className="text-[10px] font-semibold text-gray-600">
                      {setNoEnabled ? "On" : "Off"}
                    </span>
                    {setNoEnabled && (
                      <input
                        value={setNumber}
                        onChange={(e) => setSetNumber(e.target.value)}
                        className="w-12 h-[24px] px-2 rounded-md border border-gray-200 text-[10px] outline-none focus:border-[#F3A847]"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Select Answer
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectAnswerEnabled((value) => !value)}
                      className={`w-8 h-[18px] rounded-full p-0.5 flex items-center ${selectAnswerEnabled ? "bg-[#F3A847] justify-end" : "bg-gray-200 justify-start"}`}
                    >
                      <span className="w-[14px] h-[14px] rounded-full bg-white shadow-sm" />
                    </button>
                    <span className="text-[10px] font-semibold text-gray-600">
                      {selectAnswerEnabled ? "On" : "Off"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Header Note
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHeaderNoteEnabled((value) => !value)}
                      className={`w-8 h-[18px] rounded-full p-0.5 flex items-center ${headerNoteEnabled ? "bg-[#F3A847] justify-end" : "bg-gray-200 justify-start"}`}
                    >
                      <span className="w-[14px] h-[14px] rounded-full bg-white shadow-sm" />
                    </button>
                    <span className="text-[10px] font-semibold text-gray-600">
                      {headerNoteEnabled ? "On" : "Off"}
                    </span>
                    {headerNoteEnabled && (
                      <button
                        type="button"
                        onClick={() => setEditHeaderOpen((value) => !value)}
                        className="text-[#F3A847]"
                        title="Edit note"
                      >
                        <Pencil size={11} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Footer
                  </span>
                  <input
                    value={footer}
                    onChange={(e) => setFooter(e.target.value)}
                    className="w-full h-[28px] border border-gray-200 rounded-lg px-2.5 text-[10px] font-semibold text-gray-700 outline-none focus:border-[#F3A847]"
                  />
                </div>
              </div>

              {editHeaderOpen && headerNoteEnabled && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    Header note text
                  </label>
                  <input
                    value={headerNote}
                    onChange={(e) => setHeaderNote(e.target.value)}
                    className="mt-1.5 w-full h-[30px] border border-gray-200 rounded-lg px-2.5 text-[10px] outline-none focus:border-[#F3A847]"
                  />
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditHeaderOpen(true)}
                  className="text-[10px] font-bold text-gray-600 hover:text-gray-900"
                >
                  Edit paper heading
                </button>
                <span className="text-gray-200">|</span>
                <button
                  type="button"
                  onClick={clearPaper}
                  className="text-[10px] font-bold text-red-400 hover:text-red-600"
                >
                  Clear paper
                </button>
              </div>
            </div>

            {/* PRINTABLE / PREVIEW AREA */}
            <div className="mt-4 bg-[#F1F1F1] border border-gray-200/70 rounded-2xl min-h-[560px] px-3 md:px-5 py-5 md:py-7 flex justify-center">
              <div
                id="manual-print-area"
                className={`w-full ${paperWidthClass} bg-white border border-gray-200 rounded-[2px] shadow-sm min-h-[720px] p-8 md:p-11 text-gray-800 relative`}
                style={{
                  fontSize: `${fontScale / 100}em`,
                  boxShadow: printMode ? "none" : "0 1px 6px rgba(0,0,0,.03)",
                }}
              >
                {questions.length === 0 ? (
                  <div className="h-full min-h-[600px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-11 h-11 rounded-xl bg-[#FFF7E8] text-[#F3A847] mx-auto flex items-center justify-center">
                        <FileText size={22} />
                      </div>
                      <h2 className="mt-2.5 text-[12px] font-bold text-gray-600">
                        No questions selected yet
                      </h2>
                      <p className="mt-1 text-[10px] leading-relaxed text-gray-400 max-w-[300px] mx-auto">
                        Add questions from the left — they will appear here as a
                        paper.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="relative text-center border-b border-gray-300 pb-4">
                      {logo && (
                        <img
                          src={logo}
                          alt="Paper logo"
                          className="mx-auto mb-2 max-h-12 max-w-[140px] object-contain"
                        />
                      )}
                      <h2 className="text-[18px] font-black tracking-tight uppercase">
                        {institutionName ||
                          "Institution name (school / coaching / college)"}
                      </h2>
                      <p className="mt-1 text-[13px] font-bold">
                        {examName || "Set the exam name here"}
                      </p>
                      <div className="mt-2 space-y-0.5 text-[10px] font-semibold text-gray-600">
                        {(subjectName || className) && (
                          <>
                            {subjectName && <div>Subject: {subjectName}</div>}
                            {className && <div>Class: {className}</div>}
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditHeaderOpen(true)}
                        className="print-hidden absolute right-0 top-0 text-gray-300 hover:text-[#F3A847]"
                        title="Edit heading"
                      >
                        <Pencil size={12} />
                      </button>

                      <div className="mt-3 pt-2 border-t border-dashed border-gray-400 flex items-center justify-between text-[10px] font-semibold">
                        <span>Time: {timeText || "—"}</span>
                        <span>Full Marks: {totalMarks}</span>
                      </div>
                      {setNoEnabled && (
                        <div className="absolute right-0 -bottom-4 bg-white px-1.5 text-[10px] font-extrabold">
                          Set: {setNumber || "A"}
                        </div>
                      )}
                      {headerNoteEnabled && headerNote && (
                        <p className="mt-2 text-[10px] italic text-gray-600">
                          {headerNote}
                        </p>
                      )}
                    </div>

                    <div className="mt-4">
                      {Array.from(new Set(questions.map((q) => q.type))).map(
                        (type) =>
                          layout.showSectionTitles && (
                            <div
                              key={`section-${type}`}
                              className="mb-2 text-[10px] font-bold text-gray-500 uppercase"
                            >
                              {type} &nbsp; (
                              {questions.filter((q) => q.type === type).length}{" "}
                              questions)
                            </div>
                          ),
                      )}

                      <div
                        className={`${layout.columns === 2 ? "grid grid-cols-2 gap-x-7 items-start" : "block"}`}
                      >
                        <div className={paperGapClass}>
                          {questions.map((question, index) => (
                            <div
                              key={question.id}
                              draggable
                              onDragStart={(event) =>
                                onDragStart(event, question.id)
                              }
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => onDrop(event, question.id)}
                              className={`relative group ${draggedQuestionId === question.id ? "opacity-40" : ""}`}
                            >
                              <div className="print-hidden absolute -left-7 top-0 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                                <GripVertical
                                  size={13}
                                  className="text-gray-300 cursor-grab"
                                />
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-2">
                                    <span className="font-bold text-[11px] shrink-0">
                                      {index + 1}.
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      {question.type ===
                                      "Descriptive Questions" ? (
                                        <>
                                          <p className="text-[11px] font-bold whitespace-pre-wrap">
                                            {question.stimulus ||
                                              question.question}
                                          </p>
                                          {question.subQuestions?.length ? (
                                            <div className="mt-1.5 space-y-1">
                                              {question.subQuestions.map(
                                                (sub, subIndex) => (
                                                  <div
                                                    key={`${question.id}-sub-${subIndex}`}
                                                    className="flex gap-1.5 text-[10.5px]"
                                                  >
                                                    <span className="font-bold text-[#F3A847] shrink-0">
                                                      (
                                                      {String.fromCharCode(
                                                        2453 + subIndex,
                                                      )}
                                                      )
                                                    </span>
                                                    <span>{sub}</span>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          ) : null}
                                        </>
                                      ) : (
                                        <p className="text-[11px] font-bold whitespace-pre-wrap">
                                          {question.question}
                                        </p>
                                      )}

                                      {question.type === "MCQ" &&
                                      question.options?.length ? (
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2 pl-1.5 text-[10.5px] font-medium">
                                          {question.options.map(
                                            (option, optionIndex) => {
                                              const selected =
                                                selectAnswerEnabled &&
                                                question.answer === option;
                                              return (
                                                <button
                                                  type="button"
                                                  key={`${question.id}-option-${optionIndex}`}
                                                  onClick={() =>
                                                    selectAnswerEnabled &&
                                                    toggleAnswer(
                                                      question.id,
                                                      option,
                                                    )
                                                  }
                                                  className={`text-left flex items-start gap-1.5 ${selectAnswerEnabled ? "cursor-pointer" : "cursor-default"}`}
                                                >
                                                  <span
                                                    className={`w-4 h-4 rounded-full border text-[8px] flex items-center justify-center shrink-0 ${selected ? "bg-[#F3A847] border-[#F3A847] text-white" : "border-gray-400 text-gray-600"}`}
                                                  >
                                                    {String.fromCharCode(
                                                      97 + optionIndex,
                                                    )}
                                                  </span>
                                                  <span>{option}</span>
                                                </button>
                                              );
                                            },
                                          )}
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                                {layout.showQuestionMarks && (
                                  <span className="text-[10px] font-extrabold text-gray-600 shrink-0">
                                    [
                                    <input
                                      className="print-hidden w-9 text-right border-b border-gray-200 outline-none focus:border-[#F3A847] text-[10px]"
                                      value={String(question.marks)}
                                      onChange={(e) =>
                                        updateQuestionMarks(
                                          question.id,
                                          e.target.value,
                                        )
                                      }
                                      aria-label={`Marks for question ${index + 1}`}
                                    />
                                    <span className="hidden print:inline">
                                      {question.marks}
                                    </span>
                                    ]
                                  </span>
                                )}
                              </div>

                              <div className="print-hidden absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-white rounded-lg border border-gray-200 shadow-sm px-1 py-0.5">
                                <button
                                  type="button"
                                  onClick={() => editQuestion(question)}
                                  className="p-1 text-gray-400 hover:text-[#F3A847]"
                                  title="Edit"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeQuestion(question.id)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                  title="Remove"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-3 border-t border-gray-300 text-center text-[9px] text-gray-500">
                      {footer}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {editHeaderOpen && (
          <div className="print-hidden fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Paper heading
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    These fields are reflected directly in the preview.
                  </p>
                </div>
                <button
                  onClick={() => setEditHeaderOpen(false)}
                  className="text-gray-400 hover:text-gray-900"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="mt-4 grid gap-3">
                <label className="text-[10px] font-bold text-gray-600">
                  Institution name
                  <input
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="Institution name"
                    className="mt-1.5 w-full h-9 border border-gray-200 rounded-lg px-3 text-xs outline-none focus:border-[#F3A847]"
                  />
                </label>
                <label className="text-[10px] font-bold text-gray-600">
                  Exam name
                  <input
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="Exam name"
                    className="mt-1.5 w-full h-9 border border-gray-200 rounded-lg px-3 text-xs outline-none focus:border-[#F3A847]"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px] font-bold text-gray-600">
                    Subject
                    <input
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      placeholder="Subject"
                      className="mt-1.5 w-full h-9 border border-gray-200 rounded-lg px-3 text-xs outline-none focus:border-[#F3A847]"
                    />
                  </label>
                  <label className="text-[10px] font-bold text-gray-600">
                    Class
                    <input
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="Class"
                      className="mt-1.5 w-full h-9 border border-gray-200 rounded-lg px-3 text-xs outline-none focus:border-[#F3A847]"
                    />
                  </label>
                </div>
                <label className="text-[10px] font-bold text-gray-600">
                  Time
                  <input
                    value={timeText}
                    onChange={(e) => setTimeText(e.target.value)}
                    placeholder="3 hours"
                    className="mt-1.5 w-full h-9 border border-gray-200 rounded-lg px-3 text-xs outline-none focus:border-[#F3A847]"
                  />
                </label>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setEditHeaderOpen(false)}
                  className="h-8 px-3 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-50"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="print-hidden h-8 border-t border-gray-200/70 bg-white flex items-center justify-between px-4 md:px-6 text-[9px] text-gray-400">
          <span>© 2026 Sigmative. All rights reserved. · v2.03</span>
          <span className="hidden md:block">
            Terms &nbsp; Privacy Policy &nbsp; Copyright &nbsp; Refund Policy
          </span>
        </footer>
      </div>
    </>
  );
}
