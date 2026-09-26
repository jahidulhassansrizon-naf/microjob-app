"use client";

import { useQuestionManager } from "./hooks/useQuestionManager";

import InteractiveQuestionCanvas from "./components/question-canvas/InteractiveQuestionCanvas";

import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";

import SavedQuestionPapers from "@/components/questionPapers/SavedQuestionPapers";

import { ArrowLeft, Download, Loader2, Printer, Save } from "lucide-react";

export default function CreateQuestionPage() {
  const manager = useQuestionManager();

  if (manager.isAuthenticated === null) {
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
    <div
      className={`question-paper-page print-page-${manager.pageSize} min-h-screen bg-[#F8F2EF] text-[#1F2937]`}
    >
      <div className="screen-only">
        <DashboardNavbar />
      </div>

      <header className="screen-only flex flex-col gap-3 border-b border-gray-200 bg-white px-6 py-3.5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => manager.router.back()}
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
              {manager.selectedQuestions.length} questions · Full marks{" "}
              {manager.totalMarks}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={manager.paperStyle}
            onChange={(event) =>
              manager.setPaperStyle(event.target.value as "Classic" | "Compact")
            }
            className="h-8 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none"
          >
            <option value="Classic">Classic</option>
            <option value="Compact">Compact</option>
          </select>

          <button
            type="button"
            onClick={manager.handleSave}
            className="flex h-8 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Save size={13} className="text-gray-500" />
            Save
            {manager.saveStatus ? (
              <span className="text-[#F3A847]">· {manager.saveStatus}</span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={manager.handlePrint}
            className="flex h-8 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Printer size={13} className="text-gray-500" />
            Print
          </button>

          <button
            type="button"
            onClick={manager.handleDownloadPdf}
            className="flex h-8 items-center gap-1.5 rounded-xl bg-[#F3A847] px-3.5 text-xs font-bold text-white shadow-sm hover:bg-[#e29a3e]"
          >
            <Download size={13} />
            Download PDF
          </button>
        </div>
      </header>

      <InteractiveQuestionCanvas manager={manager} />

      <div className="screen-only px-4 pb-6 xl:px-6">
        <SavedQuestionPapers
          refreshKey={manager.savedPapersRefreshKey}
          currentPaperId={manager.currentSavedPaperId}
          onDeleted={manager.handleSavedPaperDeleted}
        />
      </div>
    </div>
  );
}
