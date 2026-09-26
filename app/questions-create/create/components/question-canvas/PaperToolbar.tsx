"use client";

import {
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
      className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition ${checked ? "bg-[#F3A847]" : "bg-[#D9DDE3]"}`}
    >
      <span
        className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}

export default function PaperToolbar({
  manager,
  demoMode,
  loadDemo,
}: {
  manager: QuestionManager;
  demoMode: boolean;
  loadDemo: () => void;
}) {
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
    setSetNoEnabled,
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
            <ImageIcon size={11} />

            {logoUrl ? "Change" : "Add logo"}
          </button>

          {logoUrl ? (
            <button
              type="button"
              onClick={removeLogo}
              className="mt-1 flex w-full items-center justify-center gap-1 text-[8px] font-semibold text-red-400"
            >
              <X size={9} />
              remove
            </button>
          ) : null}
        </div>

        <div>
          <span className="field-label">FONT</span>

          <div className="flex h-8 items-center justify-between rounded-lg border border-gray-200 bg-white px-2">
            <button
              type="button"
              onClick={() => setFontScale((value) => Math.max(70, value - 5))}
              className="text-gray-400 hover:text-gray-700"
            >
              <Minus size={11} />
            </button>

            <span className="text-[10px] font-bold text-gray-700">
              {fontScale}%
            </span>

            <button
              type="button"
              onClick={() => setFontScale((value) => Math.min(140, value + 5))}
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
                onClick={() => handlePageSizeChange(size)}
                className={`flex-1 rounded-md px-2 text-[9px] font-bold transition ${
                  pageSize === size
                    ? "bg-[#F3A847] text-white shadow-sm"
                    : "text-gray-600 hover:bg-white"
                }`}
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
                <Shuffle size={10} />
                Shuffle
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
            <Settings2 size={10} className="text-gray-400" />
            Options
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
                    className={`rounded-lg border px-2 py-2 text-[9px] font-bold ${
                      layoutColumns === columns
                        ? "border-[#F3A847] bg-orange-50 text-[#F3A847]"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    {columns} column
                    {columns > 1 ? "s" : ""}
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

        <div>
          <span className="field-label">DEMO</span>

          <button
            type="button"
            onClick={loadDemo}
            className={`flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border px-2 text-[9px] font-extrabold transition ${
              demoMode
                ? "border-[#F3A847] bg-orange-50 text-[#F3A847]"
                : "border-[#F3A847]/40 bg-white text-[#D58A24] hover:border-[#F3A847] hover:bg-orange-50/40"
            }`}
            title="Load a complete demo question paper for UI testing"
          >
            <FileText size={10} />
            {demoMode ? "Demo Loaded" : "Load Demo"}
          </button>
        </div>
      </div>
    </div>
  );
}
