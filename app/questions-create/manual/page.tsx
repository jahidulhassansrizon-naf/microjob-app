// app/questions-create/manual/page.tsx
"use client";

import { useState } from "react";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import {
  Save,
  Printer,
  Download,
  ChevronDown,
  Trash2,
  Plus,
  Minus,
  FileText,
  Image as ImageIcon,
  SlidersHorizontal,
} from "lucide-react";

export default function ManualQuestionPage() {
  const [activeTab, setActiveTab] = useState("MCQ");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState([
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
  ]);
  const [marks, setMarks] = useState("1");

  // Preview Control States
  const [pageSize, setPageSize] = useState("A4");
  const [setNoEnabled, setSetNoEnabled] = useState(false);
  const [selectAnswerEnabled, setSelectAnswerEnabled] = useState(false);
  const [headerNoteEnabled, setHeaderNoteEnabled] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F2EF]">
      {/* ড্যাশবোর্ড নেভবার */}
      <DashboardNavbar />

      {/* টপ অ্যাকশন বার */}
      <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">
            Create Question Paper (Manual)
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

          <button className="flex items-center gap-1.5 border border-gray-200 hover:border-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white transition shadow-xs">
            <Save size={14} className="text-gray-500" /> Save
          </button>

          <button className="flex items-center gap-1.5 border border-gray-200 hover:border-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white transition shadow-xs">
            <Printer size={14} className="text-gray-500" /> Print
          </button>

          <button className="flex items-center gap-1.5 bg-[#FF5D00] hover:bg-[#e05200] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* মূল কন্টেন্ট এরিয়া */}
      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden">
        {/* বাম পাশের ফর্ম প্যানেল */}
        <div className="w-full lg:w-[420px] flex flex-col gap-4 shrink-0 overflow-y-auto">
          <div className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            {/* হেডার চেক বক্স */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-[#FF5D00] rounded"
                />
                <span className="text-xs font-extrabold text-gray-900">
                  Add Question Manually
                </span>
              </label>
            </div>

            {/* সাব-ট্যাবস (MCQ, Short, Descriptive) */}
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-2xl">
              {["MCQ", "Short Questions", "Descriptive Questions"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl transition text-center ${
                      activeTab === tab
                        ? "bg-white text-[#FF5D00] shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>

            {/* কোয়েশ্চেন ইনপুট ফিল্ড */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700">
                Question
              </label>
              <textarea
                rows={3}
                placeholder="Type the question here..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl p-3 text-xs text-gray-800 outline-none focus:border-[#FF5D00] resize-none"
              />
              <p className="text-[10px] text-gray-400">
                Tip: wrap math in $...$ — e.g. $\frac{1}
                {2}$
              </p>
            </div>

            {/* অপশন ফিল্ডস (MCQ এর জন্য) */}
            {activeTab === "MCQ" && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-700">
                  Options
                </label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center shrink-0">
                      {String.fromCharCode(97 + idx)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...options];
                        newOpts[idx] = e.target.value;
                        setOptions(newOpts);
                      }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#FF5D00]"
                    />
                    <button className="text-gray-300 hover:text-red-500 p-1 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <button className="flex items-center gap-1.5 text-xs font-bold text-[#FF5D00] hover:underline pt-1">
                  <Plus size={14} /> Add option
                </button>
              </div>
            )}

            {/* মার্কস ইনপুট */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-bold text-gray-700">
                Marks
              </label>
              <input
                type="text"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:border-[#FF5D00]"
              />
            </div>

            {/* Add to paper বাটন */}
            <button className="w-full bg-[#FF5D00] hover:bg-[#e05200] text-white font-bold py-3 rounded-2xl text-xs transition shadow-sm mt-2">
              + Add to paper
            </button>
          </div>

          {/* সিলেক্টেড সামারি */}
          <div className="bg-white border border-gray-200/80 rounded-3xl p-4 shadow-xs space-y-1">
            <span className="text-xs font-bold text-gray-800">0 selected</span>
            <p className="text-[11px] text-gray-400 font-medium">
              Total marks: 0
            </p>
          </div>
        </div>

        {/* ডান পাশের প্রিভিউ ক্যানভাস */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* সেটিংস টুলবার (প্রথম পেজের মতো আপডেট করা হয়েছে) */}
          <div className="bg-white border border-gray-200/80 rounded-3xl p-4 px-6 shadow-xs flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Logo
                </span>
                <button className="flex items-center justify-center gap-1.5 border border-dashed border-gray-300 hover:border-gray-400 px-3 py-2 rounded-xl bg-white text-xs font-semibold text-gray-600 transition">
                  <ImageIcon size={14} className="text-gray-400" /> Add logo
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Font
                </span>
                <div className="flex items-center border border-gray-200 rounded-xl bg-white px-2 py-1.5 justify-between">
                  <button className="text-gray-400 hover:text-gray-600 p-0.5">
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-bold text-gray-700">100%</span>
                  <button className="text-gray-400 hover:text-gray-600 p-0.5">
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
                    className={`flex-1 py-1.5 rounded-lg transition ${
                      pageSize === "A4"
                        ? "bg-[#F3A847] text-white font-bold shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    A4
                  </button>
                  <button
                    onClick={() => setPageSize("A5")}
                    className={`flex-1 py-1.5 rounded-lg transition ${
                      pageSize === "A5"
                        ? "bg-[#F3A847] text-white font-bold shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    A5 (small)
                  </button>
                  <button
                    onClick={() => setPageSize("Joint")}
                    className={`flex-1 py-1.5 rounded-lg transition ${
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
                <button className="flex items-center justify-center gap-1.5 border border-gray-200 px-3 py-1.5 rounded-xl bg-white text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50">
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

          {/* পেপার প্রিভিউ খালি ঘর */}
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
