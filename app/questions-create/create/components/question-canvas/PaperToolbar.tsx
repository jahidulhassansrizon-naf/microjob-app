"use client";
import { T, useQuestionText } from "../../i18n";
import { FileText, Image as ImageIcon, Minus, Plus, Settings2, Shuffle, X, } from "lucide-react";
import type { QuestionManager } from "../../hooks/useQuestionManager";
function Toggle({ checked, onChange, }: {
    checked: boolean;
    onChange: () => void;
}) {
    return (<button type="button" aria-pressed={checked} onClick={onChange} className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${checked ? "bg-[#DC2626]" : "bg-[#D8C9A6]"}`}>
      <span className={`block h-5 w-5 rounded-full bg-[#FBF6E8] shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}/>
    </button>);
}
export default function PaperToolbar({ manager, demoMode, loadDemo, }: {
    manager: QuestionManager;
    demoMode: boolean;
    loadDemo: () => void;
}) {
    const { t } = useQuestionText();
    const { logoInputRef, handleLogoChange, logoUrl, removeLogo, fontScale, setFontScale, handlePageSizeChange, pageSize, setNoEnabled, toggleSetNoEnabled, setNo, setSetNo, shuffleSelected, layoutRef, layoutOpen, setLayoutOpen, layoutColumns, setLayoutColumns, compactSpacing, setCompactSpacing, selectAnswerEnabled, setSelectAnswerEnabled, headerNoteEnabled, setHeaderNoteEnabled, headerNote, setHeaderNote, footerText, setFooterText, } = manager;
    return (<div className="screen-only page-font rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-3 shadow-sm xl:p-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-[90px_110px_minmax(270px,1fr)_200px_130px] xl:items-start">
        <div>
          <span className="field-label"><T>{"LOGO"}</T></span>

          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange}/>

          <button type="button" onClick={() => logoInputRef.current?.click()} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#B0A080] bg-[#FBF6E8] px-2 text-[14px] font-semibold text-[#5A4A32] transition duration-150 hover:border-[#DC2626] hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]">
            <ImageIcon size={14}/>

            {logoUrl ? <T>{"Change"}</T> : <T>{"Add logo"}</T>}
          </button>

          {logoUrl ? (<button type="button" onClick={removeLogo} className="mt-1 flex w-full items-center justify-center gap-1 text-[13px] font-semibold text-red-500 hover:text-red-600">
              <X size={14}/><T>{"remove\n            "}</T></button>) : null}
        </div>

        <div>
          <span className="field-label"><T>{"FONT"}</T></span>

          <div className="flex h-10 items-center justify-between rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2">
            <button type="button" onClick={() => setFontScale((value) => Math.max(70, value - 5))} className="rounded-md p-1 text-[#6B5A40] transition duration-150 hover:bg-[#EFE3C8] hover:text-[#3B2F1E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40">
              <Minus size={14}/>
            </button>

            <span className="font-mono text-[14px] font-bold text-[#3B2F1E]">
              {fontScale}<T>{"%\n            "}</T></span>

            <button type="button" onClick={() => setFontScale((value) => Math.min(140, value + 5))} className="rounded-md p-1 text-[#6B5A40] transition duration-150 hover:bg-[#EFE3C8] hover:text-[#3B2F1E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40">
              <Plus size={14}/>
            </button>
          </div>
        </div>

        <div className="col-span-2 md:col-span-2 xl:col-span-1">
          <span className="field-label"><T>{"PAGE"}</T></span>

          <div className="flex h-10 overflow-hidden rounded-lg border border-[#E3D6B8] bg-[#F3E9D2] p-0.5">
            {(["A4", "A5", "Joint"] as const).map((size) => (<button key={size} type="button" onClick={() => handlePageSizeChange(size)} className={`flex-1 rounded-md px-1.5 text-[14px] font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] ${pageSize === size
                ? "bg-[#DC2626] text-white shadow-sm hover:bg-[#B91C1C]"
                : "text-[#3B2F1E] hover:bg-[#EFE3C8]"}`}>
                {size === "A5"
            ? <T>{"A5 (small)"}</T> : size === "Joint"
            ? "Joint (2-in-1)"
            : "A4"}
              </button>))}
          </div>
        </div>

        <div>
          <span className="field-label"><T>{"SET NO"}</T></span>

          <div className="flex h-10 items-center gap-2">
            <Toggle checked={setNoEnabled} onChange={toggleSetNoEnabled}/>

            {setNoEnabled ? (<input value={setNo} onChange={(event) => setSetNo(event.target.value)} placeholder={t("e.g. A")} className="h-8 w-full rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2 text-[14px] font-semibold text-[#3B2F1E] transition duration-150 outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"/>) : (<span className="text-[14px] font-semibold text-[#6B5A40]"><T>{"Off\n              "}</T></span>)}

            {setNoEnabled ? (<button type="button" onClick={shuffleSelected} title={t("Shuffle selected questions")} className="flex h-10 shrink-0 items-center gap-1 rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2 text-[14px] font-bold text-[#3B2F1E] transition duration-150 hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]">
                <Shuffle size={14}/><T>{"Shuffle\n              "}</T></button>) : null}
          </div>
        </div>

        <div className="relative" ref={layoutRef}>
          <span className="field-label"><T>{"LAYOUT"}</T></span>

          <button type="button" onClick={() => setLayoutOpen((value) => !value)} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2 text-[14px] font-bold text-[#3B2F1E] transition duration-150 hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]">
            <Settings2 size={14} className="text-[#6B5A40]"/><T>{"Options\n          "}</T></button>

          {layoutOpen ? (<>
            <span aria-hidden="true" className="absolute right-6 top-full z-[51] mt-px h-3 w-3 translate-y-0.5 rotate-45 border-l-2 border-t-2 border-[#DC2626] bg-[#F0DDB5]"/>
            <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border-2 border-[#DC2626] bg-[#F0DDB5] p-3.5 shadow-xl">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-[#6B5A40]"><T>{"Columns\n              "}</T></p>

              <div className="mt-2 grid grid-cols-2 gap-2">
                {[1, 2].map((columns) => (<button key={columns} type="button" onClick={() => setLayoutColumns(columns as 1 | 2)} className={`rounded-lg border px-2 py-2.5 text-[14px] font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] ${layoutColumns === columns
                    ? "border-[#DC2626] bg-[#F6D9A8] text-[#DC2626] ring-2 ring-[#DC2626]/40"
                    : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:bg-[#F6D9A8]/70"}`}>
                    {columns}<T>{"column\n                    "}</T>{columns > 1 ? <T>{"s"}</T> : <T>{""}</T>}
                  </button>))}
              </div>

              <label className="mt-3 flex items-center justify-between gap-2 text-[14px] font-semibold text-[#5A4A32]"><T>{"Compact spacing\n                "}</T><Toggle checked={compactSpacing} onChange={() => setCompactSpacing((value) => !value)}/>
              </label>
            </div></>) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#E3D6B8] pt-3 md:grid-cols-4 xl:grid-cols-[1fr_1fr_1fr_2fr]">
        <div>
          <span className="field-label"><T>{"SELECT ANSWER"}</T></span>

          <div className="flex h-10 items-center gap-2">
            <Toggle checked={selectAnswerEnabled} onChange={() => setSelectAnswerEnabled((value) => !value)}/>

            <span className="text-[14px] font-semibold text-[#6B5A40]">
              {selectAnswerEnabled ? <T>{"On"}</T> : <T>{"Off"}</T>}
            </span>
          </div>
        </div>

        <div>
          <span className="field-label"><T>{"HEADER NOTE"}</T></span>

          <div className="flex min-h-10 items-center gap-2">
            <Toggle checked={headerNoteEnabled} onChange={() => setHeaderNoteEnabled((value) => !value)}/>

            {headerNoteEnabled ? (<input value={headerNote} onChange={(event) => setHeaderNote(event.target.value)} placeholder={t("Enter a note")} className="h-8 w-full rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2 text-[14px] text-[#3B2F1E] transition duration-150 outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"/>) : (<span className="text-[14px] font-semibold text-[#6B5A40]"><T>{"Off\n              "}</T></span>)}
          </div>
        </div>

        <div>
          <span className="field-label"><T>{"FOOTER"}</T></span>

          <input value={footerText} onChange={(event) => setFooterText(event.target.value)} className="h-8 w-full rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2.5 text-[14px] font-semibold text-[#3B2F1E] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"/>
        </div>

        <div>
          <span className="field-label"><T>{"DEMO"}</T></span>

          <button type="button" onClick={loadDemo} className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border px-2 text-[14px] font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] ${demoMode
            ? "border-[#DC2626] bg-[#F6D9A8] text-[#DC2626]"
            : "border-[#DC2626]/40 bg-[#FBF6E8] text-[#DC2626] hover:border-[#DC2626] hover:bg-[#FEE9E9]"}`} title={t("Load a complete demo question paper for UI testing")}>
            <FileText size={14}/>
            {demoMode ? <T>{"Demo Loaded"}</T> : <T>{"Load Demo"}</T>}
          </button>
        </div>
      </div>
    </div>);
}
