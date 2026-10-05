"use client";

import {
  Check,
  Download,
  Printer,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { useManualEditor } from "./EditorProvider";

export default function AdjustmentsPanel() {
  const {
    activePhoto,
    brightness,
    contrast,
    saturation,
    sharp,
    setBrightness,
    setContrast,
    setSaturation,
    setSharp,
    downloadEdited,
    printEdited,
    saveEdited,
    isSavingEdited,
    saveNotice,
  } = useManualEditor();

  const rows: Array<[string, number, (value: number) => void]> = [
    ["Brightness", brightness, setBrightness],
    ["Contrast", contrast, setContrast],
    ["Saturation", saturation, setSaturation],
    ["Sharpness", sharp, setSharp],
  ];

  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 lg:p-3 shadow-sm text-[#0F172A] shrink-0">
      <div className="flex items-center gap-2 mb-4 lg:mb-2">
        <div className="w-1 h-3.5 bg-[#2563EB] rounded-full" />
        <SlidersHorizontal size={15} className="text-[#0F172A]/70" />
        <span className="text-xs font-black tracking-wider uppercase text-[#0F172A]">
          IMAGE ADJUSTMENTS
        </span>
      </div>

      {rows.map(([label, value, setter]) => (
        <div key={label} className="mb-4 lg:mb-2">
          <div className="flex items-center justify-between text-[9px] font-bold text-[#0F172A]/70 uppercase">
            <span>{label}</span>
            <span className="text-[#2563EB]">{value}</span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={value}
            onChange={(event) => setter(Number(event.target.value))}
            className="w-full accent-[#2563EB] cursor-pointer"
          />
        </div>
      ))}

      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          type="button"
          disabled={!activePhoto}
          onClick={() => void downloadEdited()}
          className="rounded-xl bg-[#2563EB] py-2 text-[10px] font-black text-white disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed hover:bg-[#2563EB]/90 transition-colors"
        >
          <Download size={13} /> Download
        </button>

        <button
          type="button"
          disabled={!activePhoto || isSavingEdited}
          onClick={() => void printEdited()}
          className="rounded-xl bg-[#E2E8F0] border border-[#E2E8F0] py-2 text-[10px] font-black text-[#0F172A] disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed hover:bg-[#E2E8F0]/80 transition-colors"
        >
          <Printer size={13} /> Print
        </button>

        <button
          type="button"
          disabled={!activePhoto || isSavingEdited}
          onClick={() => void saveEdited()}
          className="rounded-xl bg-[#E2E8F0] border border-[#E2E8F0] py-2 text-[10px] font-black text-[#0F172A] disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed hover:bg-[#E2E8F0]/80 transition-colors"
        >
          <Save size={13} /> {isSavingEdited ? "Saving" : "Save"}
        </button>
      </div>

      {saveNotice && (
        <div className="mt-3 rounded-xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 px-3 py-2 text-[10px] font-black flex items-center gap-1">
          <Check size={12} />
          {saveNotice}
        </div>
      )}
    </div>
  );
}
