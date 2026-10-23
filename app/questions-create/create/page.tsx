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
    return (<div className={`question-paper-page print-page-${manager.pageSize} min-h-screen bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] text-[#3B2F1E]`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
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
        .page-font.page-font, .page-font.page-font *:not(.font-mono):not(svg):not(svg *):not(.paper-screen-sheet):not(.paper-screen-sheet *),
        .ui-font.ui-font, .ui-font.ui-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        .page-font h1, .page-font h2, .page-font h3, .page-font h4 { letter-spacing: -0.01em; }
        .scroll { scrollbar-width: thin; scrollbar-color: #F87171 transparent; }
        .scroll::-webkit-scrollbar { width: 12px; height: 12px; }
        .scroll::-webkit-scrollbar-track { background: rgba(148,163,184,0.18); border-radius: 999px; margin: 10px 0; }
        .scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#F87171,#DC2626); border-radius: 999px; border: 3px solid #F2E8D2; min-height: 48px; }
        .scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,#EF4444,#B91C1C); }
      `}</style>
      <div className="screen-only">
        <DashboardNavbar />
      </div>

      <header className="screen-only page-font flex flex-col gap-3 border-b border-[#E3D6B8] bg-[#F2E8D2] px-6 py-3.5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => manager.router.back()} className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] transition duration-150 hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] sm:flex" title={t("Go back")}>
            <ArrowLeft size={17}/>
          </button>

          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-[#3B2F1E]"><T>{"New question paper\n            "}</T></h1>

            <p className="mt-0.5 text-[15px] font-medium text-[#6B5A40]">
              {manager.selectedQuestions.length}<T>{"questions \u00B7 Full marks"}</T>{<T>{" "}</T>}
              {manager.totalMarks}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={manager.paperStyle} onChange={(event) => manager.setPaperStyle(event.target.value as "Classic" | "Compact")} className="h-10 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 text-[15px] font-semibold text-[#3B2F1E] outline-none transition duration-150 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20">
            <option value="Classic"><T>{"Classic"}</T></option>
            <option value="Compact"><T>{"Compact"}</T></option>
          </select>

          <button type="button" onClick={manager.handleSave} className="flex h-10 items-center gap-2 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-4 text-[15px] font-semibold text-[#3B2F1E] transition duration-150 hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]">
            <Save size={16} className="text-[#5A4A32]"/><T>{"Save\n            "}</T>{manager.saveStatus ? (<span className="text-[#10B981]"><T>{"\u00B7 "}</T><T>{manager.saveStatus}</T></span>) : null}
          </button>

          <button type="button" onClick={manager.handlePrint} className="flex h-10 items-center gap-2 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-4 text-[15px] font-semibold text-[#3B2F1E] transition duration-150 hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]">
            <Printer size={16} className="text-[#5A4A32]"/><T>{"Print\n          "}</T></button>

          <button type="button" onClick={manager.handleDownloadPdf} className="flex h-10 items-center gap-2 rounded-xl bg-[#D42020] px-4 text-[15px] font-bold text-white shadow-sm transition duration-150 hover:bg-[#AE1717] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]">
            <Download size={16}/><T>{"Download PDF\n          "}</T></button>
        </div>
      </header>

      <InteractiveQuestionCanvas manager={manager}/>

      <div className="screen-only page-font px-4 pb-6 xl:px-6">
        <SavedQuestionPapers refreshKey={manager.savedPapersRefreshKey} currentPaperId={manager.currentSavedPaperId} onDeleted={manager.handleSavedPaperDeleted}/>
      </div>
    </div>);
}
