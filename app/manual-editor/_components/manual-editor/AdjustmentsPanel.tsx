"use client";
import { ManualT as T } from "./manualEditorI18n";
import { Check, Download, Printer, Save, SlidersHorizontal, } from "lucide-react";
import { useManualEditor } from "./EditorProvider";
export default function AdjustmentsPanel() {
    const { activePhoto, brightness, contrast, saturation, sharp, setBrightness, setContrast, setSaturation, setSharp, downloadEdited, printEdited, saveEdited, isSavingEdited, saveNotice, } = useManualEditor();
    const rows: Array<[
        string,
        number,
        (value: number) => void
    ]> = [
        ["Brightness", brightness, setBrightness],
        ["Contrast", contrast, setContrast],
        ["Saturation", saturation, setSaturation],
        ["Sharpness", sharp, setSharp],
    ];
    return (<div className="bg-[#F2E8D2] border border-[#E3D6B8] rounded-2xl p-4 lg:p-3 shadow-sm text-[#3B2F1E] shrink-0">
      <div className="flex items-center gap-2 mb-4 lg:mb-2">
        <div className="w-1 h-3.5 bg-[#DC2626] rounded-full"/>
        <SlidersHorizontal size={15} className="text-[#5A4A32]"/>
        <span className="text-sm font-extrabold tracking-wider uppercase text-[#3B2F1E]"><T>{"IMAGE ADJUSTMENTS\r\n        "}</T></span>
      </div>

      {rows.map(([label, value, setter]) => (<div key={label} className="mb-4 lg:mb-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#5A4A32] uppercase">
            <span><T>{label}</T></span>
            <span className="text-[#DC2626]">{value}</span>
          </div>
          <input type="range" min={-100} max={100} value={value} onChange={(event) => setter(Number(event.target.value))} className="w-full accent-[#DC2626] cursor-pointer"/>
        </div>))}

      <div className="grid grid-cols-3 gap-2 pt-1">
        <button type="button" disabled={!activePhoto} onClick={() => void downloadEdited()} className="rounded-xl bg-[#DC2626] py-2 text-[12px] font-extrabold text-white disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed hover:bg-[#B91C1C] transition-colors">
          <Download size={13}/><T>{"Download\r\n        "}</T></button>

        <button type="button" disabled={!activePhoto || isSavingEdited} onClick={() => void printEdited()} className="rounded-xl bg-[#FBF6E8] border border-[#E3D6B8] py-2 text-[12px] font-extrabold text-[#3B2F1E] disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed hover:bg-[#EFE3C8] transition-colors">
          <Printer size={13}/><T>{"Print\r\n        "}</T></button>

        <button type="button" disabled={!activePhoto || isSavingEdited} onClick={() => void saveEdited()} className="rounded-xl bg-[#FBF6E8] border border-[#E3D6B8] py-2 text-[12px] font-extrabold text-[#3B2F1E] disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed hover:bg-[#EFE3C8] transition-colors">
          <Save size={13}/> {isSavingEdited ? <T>{"Saving"}</T> : <T>{"Save"}</T>}
        </button>
      </div>

      {saveNotice && (<div className="mt-3 rounded-xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 px-3 py-2 text-[12px] font-extrabold flex items-center gap-1">
          <Check size={12}/>
          <T>{saveNotice}</T>
        </div>)}
    </div>);
}
