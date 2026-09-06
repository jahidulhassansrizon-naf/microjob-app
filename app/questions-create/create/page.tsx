// app/create-question/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Printer,
  Save,
  Download,
  FileText,
  SlidersHorizontal,
  Image as ImageIcon,
  Plus,
  Minus,
  Check,
  Loader2,
} from "lucide-react";

export default function CreateQuestionPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Auth Protection Logic
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.push("/login"); // লগইন না থাকলে সরাসরি /login পেজে পাঠিয়ে দেবে
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const [selectedTab, setSelectedTab] = useState("browse");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedQuestionType, setSelectedQuestionType] =
    useState("All question types");
  const [searchQuery, setSearchQuery] = useState("");

  const [subjects, setSubjects] = useState<{ label: string; value: string }[]>(
    [],
  );
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [chapters, setChapters] = useState<{ label: string; value: string }[]>(
    [],
  );
  const [loadingChapters, setLoadingChapters] = useState(false);

  const [pageSize, setPageSize] = useState("A4");
  const [setNoEnabled, setSetNoEnabled] = useState(false);
  const [selectAnswerEnabled, setSelectAnswerEnabled] = useState(false);
  const [headerNoteEnabled, setHeaderNoteEnabled] = useState(false);

  // Custom Dropdown State for Question Type
  const [isQuestionTypeOpen, setIsQuestionTypeOpen] = useState(false);
  const questionTypeRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        questionTypeRef.current &&
        !questionTypeRef.current.contains(event.target as Node)
      ) {
        setIsQuestionTypeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClassChange = async (classVal: string) => {
    setSelectedClass(classVal);
    setSelectedSubject("");
    setSelectedChapter("");
    setSelectedQuestionType("All question types");
    setSubjects([]);
    setChapters([]);

    if (!classVal) return;

    setLoadingSubjects(true);
    try {
      const res = await fetch("/api/get-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ className: classVal }),
      });
      const data = await res.json();
      console.log("Subjects Response:", data);
      if (data.success && Array.isArray(data.subjects)) {
        setSubjects(data.subjects);
      }
    } catch (err) {
      console.error("Error fetching subjects via AI:", err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleSubjectChange = async (subjectValue: string) => {
    setSelectedSubject(subjectValue);
    setSelectedChapter("");
    setSelectedQuestionType("All question types");
    setChapters([]);

    if (!subjectValue || !selectedClass) return;

    const selectedSubObj = subjects.find((s) => s.value === subjectValue);
    const subjectName = selectedSubObj ? selectedSubObj.label : subjectValue;
    const className = selectedClass;

    setLoadingChapters(true);
    try {
      const res = await fetch("/api/get-chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ className, subjectName }),
      });
      const data = await res.json();
      console.log("Chapters Response:", data);
      if (data.success && Array.isArray(data.chapters)) {
        setChapters(data.chapters);
      }
    } catch (err) {
      console.error("Error fetching chapters via AI:", err);
    } finally {
      setLoadingChapters(false);
    }
  };

  const questionTypeOptions = [
    "All question types",
    "MCQ",
    "Short Questions",
    "Descriptive Questions",
  ];

  // অথেনটিকেশন চেক না হওয়া পর্যন্ত লোডিং স্ক্রিন
  if (isAuthenticated === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F8F2EF" }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-5 py-3 rounded-2xl border border-gray-200/80 shadow-xs">
          <Loader2 size={16} className="animate-spin text-[#FF5D00]" />
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F2EF]">
      <DashboardNavbar />

      <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">
            New question paper
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            Create, save and manage your question papers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-xs font-semibold text-gray-700">
            <span>Classic</span>
            <ChevronDown size={14} className="text-gray-400" />
          </div>
          <button className="flex items-center gap-1.5 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white transition shadow-xs cursor-pointer">
            <Save size={14} className="text-gray-500" /> Save
          </button>
          <button className="flex items-center gap-1.5 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white transition shadow-xs cursor-pointer">
            <Printer size={14} className="text-gray-500" /> Print
          </button>
          <button className="flex items-center gap-1.5 bg-[#FF5D00] hover:bg-[#e05200] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden">
        <div className="w-full lg:w-[400px] flex flex-col gap-4 shrink-0 overflow-y-auto">
          <div className="flex bg-white p-1 rounded-2xl border border-gray-200/80 shadow-xs">
            <button
              onClick={() => setSelectedTab("browse")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                selectedTab === "browse"
                  ? "bg-orange-50 text-[#FF5D00]"
                  : "text-gray-500"
              }`}
            >
              Browse & pick
            </button>
            <button
              onClick={() => setSelectedTab("auto")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                selectedTab === "auto"
                  ? "bg-orange-50 text-[#FF5D00]"
                  : "text-gray-500"
              }`}
            >
              Auto create
            </button>
          </div>

          <div className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[#FF5D00]" />
                <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                  Filters
                </h3>
              </div>
              <ChevronUp size={16} className="text-gray-400" />
            </div>

            <div className="space-y-3">
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="">Select class</option>
                  <option value="HSC">HSC</option>
                  <option value="SSC">SSC</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 7">Class 7</option>
                  <option value="Class 6">Class 6</option>
                  <option value="Class 5">Class 5</option>
                  <option value="Class 4">Class 4</option>
                  <option value="Class 3">Class 3</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-4 top-3.5 text-gray-400 pointer-events-none"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedSubject}
                  disabled={!selectedClass || loadingSubjects}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className={`w-full appearance-none border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-gray-700 outline-none transition ${
                    !selectedClass || loadingSubjects
                      ? "opacity-50 cursor-not-allowed bg-gray-50"
                      : "bg-white cursor-pointer"
                  }`}
                >
                  <option value="">
                    {loadingSubjects ? "Loading..." : "Select subject"}
                  </option>
                  {subjects.map((sub) => (
                    <option key={sub.value} value={sub.value}>
                      {sub.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-4 top-3.5 text-gray-400 pointer-events-none"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedChapter}
                  disabled={!selectedSubject || loadingChapters}
                  onChange={(e) => {
                    setSelectedChapter(e.target.value);
                    setSelectedQuestionType("All question types");
                  }}
                  className={`w-full appearance-none border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-gray-700 outline-none transition ${
                    !selectedSubject || loadingChapters
                      ? "opacity-50 cursor-not-allowed bg-gray-50"
                      : "bg-white cursor-pointer"
                  }`}
                >
                  <option value="">
                    {loadingChapters ? "Loading..." : "Select chapter"}
                  </option>
                  {chapters.map((chap) => (
                    <option key={chap.value} value={chap.value}>
                      {chap.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-4 top-3.5 text-gray-400 pointer-events-none"
                />
              </div>

              {/* Custom Dropdown for Question Types */}
              <div className="relative" ref={questionTypeRef}>
                <div
                  onClick={() => {
                    if (selectedChapter) {
                      setIsQuestionTypeOpen(!isQuestionTypeOpen);
                    }
                  }}
                  className={`w-full flex items-center justify-between border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-gray-700 transition select-none ${
                    !selectedChapter
                      ? "opacity-50 cursor-not-allowed bg-gray-50"
                      : "bg-white cursor-pointer hover:border-gray-300"
                  }`}
                >
                  <span>{selectedQuestionType}</span>
                  {isQuestionTypeOpen ? (
                    <ChevronUp size={14} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-400" />
                  )}
                </div>

                {isQuestionTypeOpen && selectedChapter && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 py-2 overflow-hidden">
                    {questionTypeOptions.map((option) => {
                      const isSelected = selectedQuestionType === option;
                      return (
                        <div
                          key={option}
                          onClick={() => {
                            setSelectedQuestionType(option);
                            setIsQuestionTypeOpen(false);
                          }}
                          className={`flex items-center px-4 py-2.5 text-xs font-semibold cursor-pointer transition ${
                            isSelected
                              ? "text-gray-900 bg-gray-50"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <span className="w-5 flex items-center">
                            {isSelected && (
                              <Check size={14} className="text-[#FF5D00]" />
                            )}
                          </span>
                          <span>{option}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                className={`flex items-center gap-2 border border-gray-200 rounded-2xl px-3.5 py-2.5 ${
                  !selectedChapter ? "opacity-50 bg-gray-50" : "bg-white"
                }`}
              >
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  disabled={!selectedChapter}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full text-gray-700"
                />
              </div>

              <button
                disabled={
                  !selectedClass || !selectedSubject || !selectedChapter
                }
                className={`w-full font-bold py-3 rounded-2xl text-xs transition shadow-sm cursor-pointer ${
                  !selectedClass || !selectedSubject || !selectedChapter
                    ? "bg-amber-100/60 text-amber-400 cursor-not-allowed"
                    : "bg-[#F3A847] hover:bg-[#e0973d] text-white"
                }`}
              >
                Apply filter
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-gray-600">0 found</span>
            <button className="flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 shadow-xs cursor-pointer">
              <span className="text-gray-400">☐</span> Select all
            </button>
          </div>

          <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-6 text-center shadow-xs">
            <p className="text-xs text-gray-400 font-medium">
              Set your filters and press &quot;Apply filter&quot; to load
              questions.
            </p>
          </div>

          <div className="bg-white border border-gray-200/80 rounded-3xl p-4 shadow-xs flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
              <FileText size={16} className="text-[#F3A847]" />
              <span>0 selected</span>
            </div>
            <p className="text-xs text-gray-400 font-medium pl-6">
              Total marks: 0
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white border border-gray-200/80 rounded-3xl p-4 px-6 shadow-xs flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Logo
                </span>
                <button className="flex items-center justify-center gap-1.5 border border-dashed border-gray-300 hover:border-gray-400 px-3 py-2 rounded-xl bg-white text-xs font-semibold text-gray-600 transition cursor-pointer">
                  <ImageIcon size={14} className="text-gray-400" /> Add logo
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Font
                </span>
                <div className="flex items-center border border-gray-200 rounded-xl bg-white px-2 py-1.5 justify-between">
                  <button className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer">
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-bold text-gray-700">100%</span>
                  <button className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Page
                </span>
                <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
                  <button
                    onClick={() => setPageSize("A4")}
                    className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                      pageSize === "A4"
                        ? "bg-[#F3A847] text-white font-bold shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    A4
                  </button>
                  <button
                    onClick={() => setPageSize("A5")}
                    className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                      pageSize === "A5"
                        ? "bg-[#F3A847] text-white font-bold shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    A5 (small)
                  </button>
                  <button
                    onClick={() => setPageSize("Joint")}
                    className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                      pageSize === "Joint"
                        ? "bg-[#F3A847] text-white font-bold shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Joint (2-in-1)
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Set No
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSetNoEnabled(!setNoEnabled)}
                    className={`w-9 h-5 flex items-center rounded-full p-1 transition cursor-pointer ${
                      setNoEnabled ? "bg-[#F3A847]" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition ${
                        setNoEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="font-semibold text-gray-600">
                    {setNoEnabled ? "On" : "Off"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Layout
                </span>
                <button className="flex items-center justify-center gap-1.5 border border-gray-200 px-3 py-1.5 rounded-xl bg-white text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 cursor-pointer">
                  <SlidersHorizontal size={12} className="text-gray-400" />{" "}
                  Options
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Select Answer
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectAnswerEnabled(!selectAnswerEnabled)}
                    className={`w-9 h-5 flex items-center rounded-full p-1 transition cursor-pointer ${
                      selectAnswerEnabled ? "bg-[#F3A847]" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition ${
                        selectAnswerEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="font-semibold text-gray-600">
                    {selectAnswerEnabled ? "On" : "Off"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Header Note
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHeaderNoteEnabled(!headerNoteEnabled)}
                    className={`w-9 h-5 flex items-center rounded-full p-1 transition cursor-pointer ${
                      headerNoteEnabled ? "bg-[#F3A847]" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition ${
                        headerNoteEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="font-semibold text-gray-600">
                    {headerNoteEnabled ? "On" : "Off"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Footer
              </span>
              <input
                type="text"
                defaultValue="The End"
                className="w-full sm:w-64 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white outline-none focus:border-[#F3A847]"
              />
            </div>
          </div>

          <div className="flex-1 bg-white border border-gray-200/80 rounded-3xl p-8 shadow-xs flex flex-col items-center justify-center min-h-[500px]">
            <div className="w-12 h-12 bg-orange-50 text-[#FF5D00] rounded-2xl flex items-center justify-center mb-3">
              <FileText size={24} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              No questions selected yet
            </h3>
            <p className="text-xs text-gray-400 font-medium text-center max-w-sm">
              Filter and pick questions from the left — they will appear here as
              a paper.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
