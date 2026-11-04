"use client";

import { T, useQuestionText } from "./i18n";
import { useQuestionManager } from "./hooks/useQuestionManager";
import InteractiveQuestionCanvas from "./components/question-canvas/InteractiveQuestionCanvas";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import SavedPapersPremium from "./components/SavedPapersPremium";
import {
  ArrowLeft,
  Download,
  FileText,
  Printer,
  Save,
} from "lucide-react";

export default function CreateQuestionPage() {
  const manager = useQuestionManager();
  const { t } = useQuestionText();

  const backButton = (
    <button
      type="button"
      onClick={() => manager.router.back()}
      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E7DCC7] bg-white text-[#65563F] shadow-sm transition hover:border-[#D8C9A6] hover:bg-[#F8F0E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/30 active:scale-[0.98]"
      title={t("Go back")}
    >
      <ArrowLeft size={17} />
    </button>
  );

  const paperCreatorBadge = (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#F0D5D1] bg-[#FFF1EF] px-2.5 py-1 text-[11px] font-bold text-[#B91C1C]">
      <FileText size={12} />
      <T>Paper creator</T>
    </span>
  );

  const statChips = (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F2EBDD] px-2.5 py-1 text-[12px] font-semibold text-[#65563F]">
        <FileText size={13} />
        {manager.selectedQuestions.length} <T>questions</T>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F2EBDD] px-2.5 py-1 text-[12px] font-semibold text-[#65563F]">
        <span className="text-[11px] font-extrabold">Σ</span>
        <T>Full marks</T>: {manager.totalMarks}
      </span>
    </>
  );

  // Paper style + Save + Print + Download PDF. Rendered once per layout (ids stay unique).
  const renderActions = (idSuffix: string) => (
    <>
      <label className="sr-only" htmlFor={`question-paper-style-${idSuffix}`}>
        <T>Paper style</T>
      </label>
      <select
        id={`question-paper-style-${idSuffix}`}
        value={manager.paperStyle}
        onChange={(event) =>
          manager.setPaperStyle(event.target.value as "Classic" | "Compact")
        }
        className="h-9 min-w-[104px] rounded-lg border border-[#E7DCC7] bg-white px-2.5 text-[12px] font-semibold text-[#342B1E] shadow-sm outline-none transition hover:border-[#D8C9A6] focus:border-[#D42020] focus:ring-2 focus:ring-[#D42020]/15"
      >
        <option value="Classic">{t("Classic")}</option>
        <option value="Compact">{t("Compact")}</option>
      </select>

      <button
        type="button"
        onClick={manager.handleSave}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E7DCC7] bg-white px-3 text-[12px] font-bold text-[#51442F] shadow-sm transition hover:border-[#D8C9A6] hover:bg-[#F8F0E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/30 active:scale-[0.98]"
      >
        <Save size={15} />
        <T>Save</T>
        {manager.saveStatus ? (
          <span className="text-[12px] font-semibold text-emerald-600">
            · <T>{manager.saveStatus}</T>
          </span>
        ) : null}
      </button>

      <button
        type="button"
        onClick={manager.handlePrint}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E7DCC7] bg-white px-3 text-[12px] font-bold text-[#51442F] shadow-sm transition hover:border-[#D8C9A6] hover:bg-[#F8F0E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/30 active:scale-[0.98]"
      >
        <Printer size={15} />
        <T>Print</T>
      </button>

      <button
        type="button"
        onClick={manager.handleDownloadPdf}
        className="flex h-9 items-center gap-1.5 rounded-lg bg-[#D42020] px-3.5 text-[12px] font-extrabold text-white shadow-sm shadow-red-900/10 transition hover:bg-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/30 active:scale-[0.98]"
      >
        <Download size={15} />
        <T>Download PDF</T>
      </button>
    </>
  );

  // Large screens: the header is split. Title/stats go above the filters (left column),
  // the actions go to the top of the right column, so the paper in the middle starts
  // at the very top and is fully visible.
  const leftHeader = (
    <section className="screen-only page-font hidden rounded-2xl border border-[#E7DCC7] bg-[#FCF8EF] p-3.5 shadow-[0_3px_14px_rgba(76,57,28,0.05)] xl:block">
      <div className="flex items-start gap-2.5">
        {backButton}
        <div className="min-w-0">
          <h1 className="text-[19px] font-extrabold leading-tight tracking-tight text-[#342B1E]">
            <T>New question paper</T>
          </h1>
          <p className="mt-0.5 text-[11px] leading-4 text-[#76664E]">
            <T>Choose questions, arrange your paper and download it as a PDF.</T>
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {paperCreatorBadge}
        {statChips}
      </div>
    </section>
  );

  const rightHeader = (
    <section className="screen-only page-font sticky top-0 z-30 hidden rounded-2xl border border-[#E7DCC7] bg-[#FCF8EF] p-2.5 shadow-[0_3px_14px_rgba(76,57,28,0.08)] xl:block">
      <div className="flex flex-wrap items-center gap-1.5">
        {renderActions("desktop")}
      </div>
    </section>
  );

  return (
    <div
      className={`question-paper-page print-page-${manager.pageSize} min-h-screen bg-[#F4EBD8] text-[#342B1E]`}
    >
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
        .scroll { scrollbar-width: thin; scrollbar-color: #E5A0A0 transparent; }
        .scroll::-webkit-scrollbar { width: 10px; height: 10px; }
        .scroll::-webkit-scrollbar-track { background: rgba(148,163,184,0.12); border-radius: 999px; margin: 8px 0; }
        .scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#E8A0A0,#D42020); border-radius: 999px; border: 2px solid #FBF7EE; min-height: 42px; }
        .scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,#DC7777,#B91C1C); }
      `}</style>

      <div className="screen-only">
        <DashboardNavbar />
      </div>

      {/* Small / medium screens: the classic full-width header (columns are stacked there). */}
      <header className="screen-only page-font border-b border-[#E7DCC7] bg-[#FCF8EF] px-4 py-2 sm:px-6 xl:hidden">
        <div className="mx-auto flex max-w-[1900px] flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {backButton}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-extrabold tracking-tight text-[#342B1E] sm:text-[22px]">
                  <T>New question paper</T>
                </h1>
                {paperCreatorBadge}
              </div>
              <p className="mt-0.5 text-[12px] leading-4 text-[#76664E] sm:text-[13px]">
                <T>Choose questions, arrange your paper and download it as a PDF.</T>
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{statChips}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
            {renderActions("mobile")}
          </div>
        </div>
      </header>

      <InteractiveQuestionCanvas
        manager={manager}
        leftHeader={leftHeader}
        rightHeader={rightHeader}
      />

      <div className="screen-only page-font mx-auto max-w-[1900px] px-4 pb-8 sm:px-6">
        <div className="mt-5">
          <SavedPapersPremium
            refreshKey={manager.savedPapersRefreshKey}
            currentPaperId={manager.currentSavedPaperId}
            onDeleted={manager.handleSavedPaperDeleted}
          />
        </div>
      </div>
    </div>
  );
}
