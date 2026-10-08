"use client";
import { T, useQuestionText } from "./i18n";
import { useQuestionManager } from "./hooks/useQuestionManager";
import InteractiveQuestionCanvas from "./components/question-canvas/InteractiveQuestionCanvas";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import SavedQuestionPapers from "@/components/questionPapers/SavedQuestionPapers";
import { ArrowLeft, Download, Printer, Save } from "lucide-react";
export default function CreateQuestionPage() {
    const manager = useQuestionManager();
    const { t } = useQuestionText();
    return (<div className={`question-paper-page print-page-${manager.pageSize} min-h-screen bg-[#F8FAFC] text-[#0F172A]`}>
      <style>{`
        body:has(.question-paper-page) button:not(:disabled),
        body:has(.question-paper-page) a[href],
        body:has(.question-paper-page) select,
        body:has(.question-paper-page) summary,
        body:has(.question-paper-page) [role="button"],
        body:has(.question-paper-page) input[type="file"],
        body:has(.question-paper-page) input[type="checkbox"],
        body:has(.question-paper-page) input[type="radio"],
        body:has(.question-paper-page) input[type="range"],
        body:has(.question-paper-page) label[for] { cursor: pointer !important; }
        body:has(.question-paper-page) button:disabled { cursor: not-allowed !important; }
      `}</style>
      <div className="screen-only">
        <DashboardNavbar />
      </div>

      <header className="screen-only flex flex-col gap-3 border-b border-[#E2E8F0] bg-white px-6 py-3.5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => manager.router.back()} className="hidden h-8 w-8 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A]/70 hover:bg-[#E2E8F0] sm:flex" title={t("Go back")}>
            <ArrowLeft size={15}/>
          </button>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#0F172A]"><T>{"New question paper\n            "}</T></h1>

            <p className="mt-0.5 text-xs font-medium text-[#0F172A]/55">
              {manager.selectedQuestions.length}<T>{"questions \u00B7 Full marks"}</T>{<T>{" "}</T>}
              {manager.totalMarks}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={manager.paperStyle} onChange={(event) => manager.setPaperStyle(event.target.value as "Classic" | "Compact")} className="h-8 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] outline-none">
            <option value="Classic"><T>{"Classic"}</T></option>
            <option value="Compact"><T>{"Compact"}</T></option>
          </select>

          <button type="button" onClick={manager.handleSave} className="flex h-8 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] hover:bg-[#E2E8F0]">
            <Save size={13} className="text-[#0F172A]/70"/><T>{"Save\n            "}</T>{manager.saveStatus ? (<span className="text-[#10B981]"><T>{"\u00B7 "}</T><T>{manager.saveStatus}</T></span>) : null}
          </button>

          <button type="button" onClick={manager.handlePrint} className="flex h-8 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] hover:bg-[#E2E8F0]">
            <Printer size={13} className="text-[#0F172A]/70"/><T>{"Print\n          "}</T></button>

          <button type="button" onClick={manager.handleDownloadPdf} className="flex h-8 items-center gap-1.5 rounded-xl bg-[#2563EB] px-3.5 text-xs font-bold text-white shadow-sm hover:bg-[#2563EB]">
            <Download size={13}/><T>{"Download PDF\n          "}</T></button>
        </div>
      </header>

      <InteractiveQuestionCanvas manager={manager}/>

      <div className="screen-only px-4 pb-6 xl:px-6">
        <SavedQuestionPapers refreshKey={manager.savedPapersRefreshKey} currentPaperId={manager.currentSavedPaperId} onDeleted={manager.handleSavedPaperDeleted}/>
      </div>
    </div>);
}
