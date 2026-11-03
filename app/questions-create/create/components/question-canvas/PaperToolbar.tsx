"use client";

import { T, useQuestionText } from "../../i18n";
import {
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Minus,
  Plus,
  Settings2,
  Shuffle,
  X,
} from "lucide-react";
import type { QuestionManager } from "../../hooks/useQuestionManager";

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
      className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25 ${
        checked ? "bg-[#D42020]" : "bg-[#D8CDBB]"
      }`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function PaperToolbar({
  manager,
  demoMode,
  loadDemo,
  onExitDemo,
}: {
  manager: QuestionManager;
  demoMode: boolean;
  loadDemo: () => void;
  onExitDemo: () => void;
}) {
  const { t } = useQuestionText();
  const {
    logoInputRef,
    handleLogoChange,
    logoUrl,
    removeLogo,
    fontScale,
    setFontScale,
    handlePageSizeChange,
    pageSize,
    setNoEnabled,
    toggleSetNoEnabled,
    setNo,
    setSetNo,
    shuffleSelected,
    layoutRef,
    layoutOpen,
    setLayoutOpen,
    layoutColumns,
    setLayoutColumns,
    compactSpacing,
    setCompactSpacing,
    selectAnswerEnabled,
    setSelectAnswerEnabled,
    headerNoteEnabled,
    setHeaderNoteEnabled,
    headerNote,
    setHeaderNote,
    footerText,
    setFooterText,
  } = manager;

  return (
    <section className="screen-only page-font overflow-visible rounded-2xl border border-[#E7DCC7] bg-[#FCF8EF] p-3 shadow-[0_3px_14px_rgba(76,57,28,0.05)]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FCE9E6] text-[#D42020]">
            <FileText size={17} />
          </span>
          <div>
            <h2 className="text-[14px] font-extrabold text-[#342B1E]">
              <T>Customize your paper</T>
            </h2>
            <p className="mt-0.5 text-[11px] leading-4 text-[#83745C]">
              <T>Choose a page size. You can adjust more settings below.</T>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(140px,0.7fr)_minmax(0,1.3fr)]">
          <div className="flex items-center gap-2">
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
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D8C9A6] bg-white px-3 text-[12px] font-bold text-[#65563F] transition hover:border-[#D42020] hover:bg-[#FFF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25 active:scale-[0.99]"
            >
              <ImageIcon size={15} className="text-[#D42020]" />
              {logoUrl ? <T>Change logo</T> : <T>Add logo</T>}
            </button>
            {logoUrl ? (
              <button
                type="button"
                onClick={removeLogo}
                title={t("Remove logo")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#F0D5D1] bg-[#FFF1EF] text-[#B84940] transition hover:bg-[#FFE6E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#E7DCC7] bg-white px-3 py-2">
            <span className="shrink-0 text-[11px] font-bold text-[#77684F]">
              <T>Paper size</T>
            </span>
            <div className="flex min-w-0 flex-1 rounded-lg bg-[#F3EDE2] p-1">
              {(["A4", "A5", "Joint"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handlePageSizeChange(size)}
                  aria-pressed={pageSize === size}
                  className={`min-w-0 flex-1 rounded-md px-2 py-2 text-[11px] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25 active:scale-[0.99] sm:text-[12px] ${
                    pageSize === size
                      ? "bg-[#D42020] text-white shadow-sm"
                      : "text-[#62543E] hover:bg-white hover:text-[#342B1E]"
                  }`}
                >
                  {size === "A5" ? (
                    <T>A5 (small)</T>
                  ) : size === "Joint" ? (
                    <T>Joint (2-in-1)</T>
                  ) : (
                    "A4"
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <details className="group mt-2 border-t border-[#EEE4D2] pt-2">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-2 py-2 text-[12px] font-bold text-[#65563F] transition hover:bg-[#F5EFE3] [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <Settings2 size={15} className="text-[#D42020]" />
            <T>More paper settings</T>
            <span className="hidden text-[11px] font-medium text-[#9A8C75] sm:inline">
              <T>Font, layout, answer options and more</T>
            </span>
          </span>
          <ChevronDown
            size={15}
            className="shrink-0 text-[#8A795F] transition-transform group-open:rotate-180"
          />
        </summary>

        <div className="mt-2 grid grid-cols-1 gap-2.5 rounded-xl bg-[#F8F3E9] p-3 sm:grid-cols-2 2xl:grid-cols-3">
          <div>
            <span className="field-label"><T>Font size</T></span>
            <div className="flex h-10 items-center justify-between rounded-lg border border-[#E7DCC7] bg-white px-2">
              <button
                type="button"
                onClick={() => setFontScale((value) => Math.max(70, value - 5))}
                title={t("Smaller text")}
                className="rounded-md p-1.5 text-[#65563F] transition hover:bg-[#F3EDE2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25"
              >
                <Minus size={14} />
              </button>
              <span className="font-mono text-[12px] font-bold text-[#342B1E]">
                {fontScale}%
              </span>
              <button
                type="button"
                onClick={() => setFontScale((value) => Math.min(140, value + 5))}
                title={t("Larger text")}
                className="rounded-md p-1.5 text-[#65563F] transition hover:bg-[#F3EDE2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div>
            <span className="field-label"><T>Set number</T></span>
            <div className="flex h-10 items-center gap-2">
              <Toggle checked={setNoEnabled} onChange={toggleSetNoEnabled} />
              {setNoEnabled ? (
                <input
                  value={setNo}
                  onChange={(event) => setSetNo(event.target.value)}
                  placeholder={t("e.g. A")}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-[#E7DCC7] bg-white px-2 text-[12px] font-semibold text-[#342B1E] outline-none transition focus:border-[#D42020] focus:ring-2 focus:ring-[#D42020]/10"
                />
              ) : (
                <span className="text-[12px] font-semibold text-[#8A795F]"><T>Off</T></span>
              )}
              {setNoEnabled ? (
                <button
                  type="button"
                  onClick={shuffleSelected}
                  title={t("Shuffle selected questions")}
                  className="flex h-9 shrink-0 items-center gap-1 rounded-lg border border-[#E7DCC7] bg-white px-2 text-[11px] font-bold text-[#65563F] transition hover:border-[#D42020] hover:text-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25"
                >
                  <Shuffle size={13} />
                  <T>Shuffle</T>
                </button>
              ) : null}
            </div>
          </div>

          <div className="relative" ref={layoutRef}>
            <span className="field-label"><T>Layout</T></span>
            <button
              type="button"
              onClick={() => setLayoutOpen((value) => !value)}
              aria-expanded={layoutOpen}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#E7DCC7] bg-white px-3 text-[12px] font-bold text-[#51442F] transition hover:border-[#D8C9A6] hover:bg-[#FFFEFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25"
            >
              <Settings2 size={14} className="text-[#8A795F]" />
              <T>Layout options</T>
            </button>
            {layoutOpen ? (
              <>
                <span
                  aria-hidden="true"
                  className="absolute right-6 top-full z-[51] mt-px h-3 w-3 translate-y-0.5 rotate-45 border-l border-t border-[#D8C9A6] bg-white"
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-[#E7DCC7] bg-white p-3.5 shadow-[0_12px_30px_rgba(45,35,20,0.16)]">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#77684F]">
                    <T>Columns</T>
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[1, 2].map((columns) => (
                      <button
                        key={columns}
                        type="button"
                        onClick={() => setLayoutColumns(columns as 1 | 2)}
                        className={`rounded-lg border px-2 py-2.5 text-[12px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25 ${
                          layoutColumns === columns
                            ? "border-[#D42020] bg-[#FFF1EF] text-[#B91C1C]"
                            : "border-[#E7DCC7] bg-[#FCF8EF] text-[#65563F] hover:bg-[#F8F0E1]"
                        }`}
                      >
                        {columns} <T>columns</T>
                      </button>
                    ))}
                  </div>
                  <label className="mt-3 flex items-center justify-between gap-2 text-[12px] font-semibold text-[#65563F]">
                    <T>Compact spacing</T>
                    <Toggle
                      checked={compactSpacing}
                      onChange={() => setCompactSpacing((value) => !value)}
                    />
                  </label>
                </div>
              </>
            ) : null}
          </div>

          <div>
            <span className="field-label"><T>Select answer</T></span>
            <div className="flex h-10 items-center gap-2">
              <Toggle
                checked={selectAnswerEnabled}
                onChange={() => setSelectAnswerEnabled((value) => !value)}
              />
              <span className="text-[12px] font-semibold text-[#65563F]">
                {selectAnswerEnabled ? <T>On</T> : <T>Off</T>}
              </span>
            </div>
          </div>

          <div>
            <span className="field-label"><T>Header note</T></span>
            <div className="flex min-h-10 items-center gap-2">
              <Toggle
                checked={headerNoteEnabled}
                onChange={() => setHeaderNoteEnabled((value) => !value)}
              />
              {headerNoteEnabled ? (
                <input
                  value={headerNote}
                  onChange={(event) => setHeaderNote(event.target.value)}
                  placeholder={t("Enter a note")}
                  className="h-9 min-w-0 w-full rounded-lg border border-[#E7DCC7] bg-white px-2 text-[12px] text-[#342B1E] outline-none transition focus:border-[#D42020] focus:ring-2 focus:ring-[#D42020]/10"
                />
              ) : (
                <span className="text-[12px] font-semibold text-[#8A795F]"><T>Off</T></span>
              )}
            </div>
          </div>

          <div>
            <span className="field-label"><T>Footer</T></span>
            <input
              value={footerText}
              onChange={(event) => setFooterText(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#E7DCC7] bg-white px-3 text-[12px] font-semibold text-[#342B1E] outline-none transition focus:border-[#D42020] focus:ring-2 focus:ring-[#D42020]/10"
            />
          </div>

          <div>
            <span className="field-label"><T>Demo preview</T></span>
            <button
              type="button"
              onClick={demoMode ? onExitDemo : loadDemo}
              className={`flex h-10 w-full items-center justify-center gap-2 rounded-lg border px-3 text-[12px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25 active:scale-[0.99] ${
                demoMode
                  ? "border-[#D42020]/35 bg-[#FFF1EF] text-[#B91C1C] hover:border-[#D42020] hover:bg-[#FDE7E4]"
                  : "border-[#E7DCC7] bg-white text-[#65563F] hover:border-[#D42020]/50 hover:bg-[#FFF9F6]"
              }`}
              title={demoMode ? t("Close demo") : t("Load a complete demo question paper for UI testing")}
              aria-label={demoMode ? t("Close demo") : t("Load demo")}
            >
              {demoMode ? <X size={14} /> : <FileText size={14} />}
              {demoMode ? <T>Close demo</T> : <T>Load demo</T>}
            </button>
          </div>
        </div>
      </details>
    </section>
  );
}
