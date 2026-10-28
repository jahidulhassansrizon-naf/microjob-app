"use client";
import { ManualT as T, useManualEditorText } from "./manualEditorI18n";
import { Check, Eraser, Loader2, Palette } from "lucide-react";
import { BACKGROUNDS } from "./constants";
import { useManualEditor } from "./EditorProvider";
import { preloadBackgroundRemoval } from "./segmentation";
export default function BackgroundPanel() {
    const { t } = useManualEditorText();
    const { selectedBg, setSelectedBg, customBg, setCustomBg, handleRemoveBackground, isRemovingBackground, backgroundRemoved, setBackgroundRemoved, } = useManualEditor();
    const handlePresetBackground = (backgroundId: string) => {
        setSelectedBg(backgroundId);
        setBackgroundRemoved(false);
    };
    const handleCustomBackground = () => {
        setSelectedBg("custom");
        setBackgroundRemoved(false);
    };
    return (<section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3.5 bg-[#DC2626] rounded-full"/>

        <span className="text-sm font-extrabold tracking-wider uppercase text-[#3B2F1E]"><T>{"BACKGROUND\r\n        "}</T></span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {/* -------------------------------------------------------------- */}
        {/* Preset backgrounds                                              */}
        {/* -------------------------------------------------------------- */}
        {BACKGROUNDS.map((bg) => {
            const selected = !backgroundRemoved && selectedBg === bg.id;
            return (<button key={bg.id} type="button" disabled={isRemovingBackground} aria-label={t(`Select ${bg.id} background`)} onClick={() => handlePresetBackground(bg.id)} className={`group relative h-11 lg:h-9 rounded-2xl border transition-all duration-200 shadow-sm hover:scale-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${selected
                    ? "ring-2 ring-[#DC2626] ring-offset-1 border-transparent"
                    : "border-[#E3D6B8] hover:border-[#D8C9A6]"}`} style={{
                    backgroundColor: bg.color,
                }}>
              {selected && (<span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FBF6E8]/85 shadow-sm">
                    <Check size={12} strokeWidth={3} className="text-[#3B2F1E]"/>
                  </span>
                </span>)}
            </button>);
        })}

        {/* -------------------------------------------------------------- */}
        {/* Custom color                                                    */}
        {/* -------------------------------------------------------------- */}
        <button type="button" disabled={isRemovingBackground} aria-label={t("Use custom background color")} onClick={handleCustomBackground} className={`relative h-11 lg:h-9 rounded-2xl border flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${!backgroundRemoved && selectedBg === "custom"
            ? "ring-2 ring-[#DC2626] ring-offset-1 border-transparent"
            : "border-[#E3D6B8] hover:border-[#D8C9A6]"}`} style={{
            backgroundColor: customBg,
        }} title={t("Custom color")}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FBF6E8]/80 shadow-sm">
            <Palette size={17} className="text-[#DC2626] drop-shadow"/>
          </span>

          {!backgroundRemoved && selectedBg === "custom" && (<span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FBF6E8] shadow-sm">
              <Check size={10} strokeWidth={3} className="text-[#3B2F1E]"/>
            </span>)}
        </button>

        {/* -------------------------------------------------------------- */}
        {/* Native color picker                                             */}
        {/* -------------------------------------------------------------- */}
        <label className={`h-11 lg:h-9 rounded-2xl border border-dashed border-[#E3D6B8] text-[#7A6A50] flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 hover:border-[#B0A080] hover:bg-[#EFE3C8] hover:text-[#3B2F1E] ${isRemovingBackground ? "pointer-events-none opacity-50" : ""}`} title={t("Choose custom color")}><T>{"+\r\n          "}</T><input type="color" value={customBg} disabled={isRemovingBackground} onChange={(event) => {
            setCustomBg(event.target.value);
            setSelectedBg("custom");
            setBackgroundRemoved(false);
        }} className="hidden"/>
        </label>

        {/* -------------------------------------------------------------- */}
        {/* Remove Background                                               */}
        {/* -------------------------------------------------------------- */}
        <button type="button" disabled={isRemovingBackground} onClick={() => void handleRemoveBackground()} onPointerEnter={() => void preloadBackgroundRemoval()} onFocus={() => void preloadBackgroundRemoval()} aria-label={t("Remove background")} title={isRemovingBackground
            ? t("Removing background...")
            : t("Remove background")} className={`col-span-2 h-12 lg:h-10 rounded-2xl border px-3 flex items-center justify-center gap-2 text-[12px] font-extrabold transition-all duration-200 shadow-sm active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed ${backgroundRemoved
            ? "border-[#10B981] bg-[#10B981] text-white hover:bg-emerald-600"
            : "border-emerald-200 bg-emerald-50 text-[#10B981] hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-md"}`}>
          {isRemovingBackground ? (<>
              <Loader2 size={14} className="animate-spin"/>

              <span className="whitespace-nowrap"><T>{"Removing..."}</T></span>
            </>) : (<>
              <span className={`flex h-6 w-6 items-center justify-center rounded-lg shadow-sm ${backgroundRemoved ? "bg-[#FBF6E8]/20" : "bg-[#FBF6E8]"}`}>
                {backgroundRemoved ? (<Check size={14} strokeWidth={3} className="text-white"/>) : (<Eraser size={14} strokeWidth={2.3} className="text-[#10B981]"/>)}
              </span>

              <span className="whitespace-nowrap">
                {backgroundRemoved ? <T>{"BG Removed"}</T> : <T>{"Remove BG"}</T>}
              </span>
            </>)}
        </button>
      </div>
    </section>);
}
