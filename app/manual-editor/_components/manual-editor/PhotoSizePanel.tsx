"use client";
import { ManualT as T, useManualEditorText } from "./manualEditorI18n";
import { ChevronDown, Image as ImageIcon, Maximize2, Plane, Printer, RefreshCcw, Users, } from "lucide-react";
import { R_SIZE_PRESETS, VISA_PRESETS } from "./constants";
import { useManualEditor } from "./EditorProvider";
import type { PhotoMode } from "./types";
const MODE_LABELS: Record<PhotoMode, string> = {
    passport: "Passport",
    dual: "Dual",
    visa: "Visa",
    rsizes: "R Sizes",
    freesize: "Free size",
};
function compactPresetLabel(label: string) {
    if (label.includes(" — ")) {
        return label.split(" — ")[0];
    }
    return label.replace(" inch", "").replace(" mm", "");
}
export default function PhotoSizePanel() {
    const { t } = useManualEditorText();
    const { photoMode, selectMode, sizeMenu, setSizeMenu, selectedPreset, currentPreset, selectPreset, freeSizeOpen, setFreeSizeOpen, freeWidth, freeHeight, setFreeWidth, setFreeHeight, resetEditor, } = useManualEditor();
    const selectedVisaLabel = photoMode === "visa"
        ? compactPresetLabel(currentPreset.label)
        : MODE_LABELS.visa;
    const selectedRSizeLabel = photoMode === "rsizes"
        ? compactPresetLabel(currentPreset.label)
        : MODE_LABELS.rsizes;
    return (<section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Primary Highlight Bar */}
          <div className="w-1 h-3.5 bg-[#DC2626] rounded-full"/>

          <span className="text-sm font-extrabold tracking-wider uppercase text-[#3B2F1E]"><T>{"PHOTO SIZE\r\n          "}</T></span>
        </div>

        <button type="button" onClick={resetEditor} className="text-[#7A6A50] hover:text-[#3B2F1E] transition-colors cursor-pointer" title={t("Reset editor")}>
          <RefreshCcw size={13}/>
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2 relative">
        {[
            {
                id: "passport" as const,
                label: "Passport",
                icon: <ImageIcon className="w-5 h-5 text-[#7A6A50]"/>,
            },
            {
                id: "dual" as const,
                label: "Dual",
                icon: <Users className="w-5 h-5 text-[#7A6A50]"/>,
            },
            {
                id: "visa" as const,
                label: selectedVisaLabel,
                icon: <Plane className="w-5 h-5 text-[#7A6A50]"/>,
            },
            {
                id: "rsizes" as const,
                label: selectedRSizeLabel,
                icon: <Printer className="w-5 h-5 text-[#7A6A50]"/>,
            },
            {
                id: "freesize" as const,
                label: "Free size",
                icon: <Maximize2 className="w-5 h-5 text-[#7A6A50]"/>,
            },
        ].map((item) => {
            const isActive = photoMode === item.id;
            const isPresetMode = item.id === "visa" || item.id === "rsizes";
            return (<div key={item.id} className="relative min-w-0">
              <button type="button" onClick={() => {
                    selectMode(item.id);
                    if (item.id === "freesize") {
                        setSizeMenu(null);
                        setFreeSizeOpen(true);
                        return;
                    }
                    if (item.id === "visa" || item.id === "rsizes") {
                        setFreeSizeOpen(false);
                        setSizeMenu(item.id);
                        return;
                    }
                    setSizeMenu(null);
                    setFreeSizeOpen(false);
                }} className={`relative flex w-full min-w-0 flex-col items-center justify-center p-2 rounded-2xl border text-[12px] font-bold transition h-[72px] lg:h-16 cursor-pointer ${isActive
                    ? "border-[#DC2626] bg-[#F6D9A8] ring-1 ring-[#DC2626]"
                    : "border-[#E3D6B8] bg-[#FBF6E8] hover:border-[#DC2626]/40"}`}>
                <span className="mb-1 shrink-0">{item.icon}</span>

                <span title={t(item.label)} className={`truncate w-full text-center text-[11px] font-bold ${isActive ? "text-[#DC2626]" : "text-[#3B2F1E]"}`}>
                  {<T>{item.label}</T>}
                </span>
              </button>

              {isPresetMode && isActive && (<button type="button" aria-label={t(`Open ${item.label} size menu`)} onClick={() => setSizeMenu(sizeMenu === item.id ? null : item.id)} className="absolute -right-1 -top-1 rounded-full bg-[#FBF6E8] border border-[#E3D6B8] shadow-sm text-[#6B5A40] hover:text-[#3B2F1E] cursor-pointer">
                  <ChevronDown size={12}/>
                </button>)}
            </div>);
        })}
      </div>

      {/* Visa Size Menu */}
      {photoMode === "visa" && sizeMenu === "visa" && (<div className="rounded-2xl border-2 border-[#DC2626] bg-[#F0DDB5] p-3 shadow-xl">
          <p className="text-[12px] font-extrabold text-[#3B2F1E] mb-2"><T>{"Visa Photo Size\r\n          "}</T></p>

          <div className="grid grid-cols-2 gap-2 scroll max-h-56 overflow-y-auto pr-1">
            {VISA_PRESETS.map((preset) => (<button key={preset.id} type="button" onClick={() => selectPreset(preset, "visa")} className={`rounded-xl border px-2 py-2 text-[11px] font-bold transition-colors cursor-pointer ${selectedPreset?.id === preset.id
                    ? "border-[#DC2626] bg-[#F6D9A8] text-[#DC2626]"
                    : "border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] hover:border-[#DC2626]/40"}`}>
                <T>{preset.label}</T>
              </button>))}
          </div>
        </div>)}

      {/* Print Size Menu */}
      {photoMode === "rsizes" && sizeMenu === "rsizes" && (<div className="rounded-2xl border-2 border-[#DC2626] bg-[#F0DDB5] p-3 shadow-xl">
          <p className="text-[12px] font-extrabold text-[#3B2F1E] mb-2"><T>{"Print Size\r\n          "}</T></p>

          <div className="grid grid-cols-3 gap-2 scroll max-h-56 overflow-y-auto pr-1">
            {R_SIZE_PRESETS.map((preset) => (<button key={preset.id} type="button" onClick={() => selectPreset(preset, "rsizes")} className={`rounded-xl border px-2 py-2 text-[11px] font-bold transition-colors cursor-pointer ${selectedPreset?.id === preset.id
                    ? "border-[#DC2626] bg-[#DC2626] text-white shadow-sm"
                    : "border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] hover:border-[#DC2626]/40"}`}>
                <T>{compactPresetLabel(preset.label)}</T>
              </button>))}
          </div>
        </div>)}

      {/* Free Size Menu */}
      {photoMode === "freesize" && freeSizeOpen && (<div className="rounded-2xl border-2 border-[#DC2626] bg-[#F0DDB5] p-3 shadow-xl">
          <p className="text-[12px] font-extrabold text-[#3B2F1E] mb-2"><T>{"Free Size (mm)\r\n          "}</T></p>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-bold text-[#5A4A32]"><T>{"Width\r\n              "}</T><input type="number" min={5} max={500} value={freeWidth} onChange={(event) => setFreeWidth(Math.min(500, Math.max(5, Number(event.target.value) || 5)))} className="mt-1 w-full rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2 text-sm font-bold text-[#3B2F1E] outline-none focus:border-[#DC2626]"/>
            </label>

            <label className="text-[11px] font-bold text-[#5A4A32]"><T>{"Height\r\n              "}</T><input type="number" min={5} max={500} value={freeHeight} onChange={(event) => setFreeHeight(Math.min(500, Math.max(5, Number(event.target.value) || 5)))} className="mt-1 w-full rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2 text-sm font-bold text-[#3B2F1E] outline-none focus:border-[#DC2626]"/>
            </label>
          </div>

          <div className="mt-2 text-[11px] font-bold text-[#6B5A40]"><T>{"Current: "}</T><T>{currentPreset.label}</T>
          </div>

          {/* Accent CTA Button */}
          <button type="button" onClick={() => setFreeSizeOpen(false)} className="mt-2 w-full rounded-xl bg-[#D42020] px-3 py-2 text-[12px] font-extrabold text-white hover:bg-[#AE1717] active:scale-[0.98] transition-colors cursor-pointer"><T>{"Apply size\r\n          "}</T></button>
        </div>)}
    </section>);
}
