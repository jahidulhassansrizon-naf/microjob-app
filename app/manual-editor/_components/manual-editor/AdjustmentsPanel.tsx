"use client";
import {
  Check,
  Download,
  Maximize2,
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
    saveNotice,
  } = useManualEditor();
  const rows: Array<[string, number, (value: number) => void]> = [
    ["Brightness", brightness, setBrightness],
    ["Contrast", contrast, setContrast],
    ["Saturation", saturation, setSaturation],
    ["Sharpness", sharp, setSharp],
  ];
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
        <SlidersHorizontal size={15} className="text-gray-500" />
        <span className="text-xs font-black tracking-wider uppercase">
          IMAGE ADJUSTMENTS
        </span>
      </div>
      {rows.map(([label, value, setter]) => (
        <div key={label} className="mb-4">
          <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase">
            <span>{label}</span>
            <span className="text-amber-600">{value}</span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={value}
            onChange={(e) => setter(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      ))}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          type="button"
          disabled={!activePhoto}
          onClick={() => void downloadEdited()}
          className="rounded-xl bg-amber-500 py-2 text-[10px] font-black text-gray-900 disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Download size={13} /> Download
        </button>
        <button
          type="button"
          disabled={!activePhoto}
          onClick={() => void printEdited()}
          className="rounded-xl border border-gray-200 py-2 text-[10px] font-black text-gray-700 disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Printer size={13} /> Print
        </button>
        <button
          type="button"
          disabled={!activePhoto}
          onClick={() => void saveEdited()}
          className="rounded-xl border border-gray-200 py-2 text-[10px] font-black text-gray-700 disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Save size={13} /> Save
        </button>
      </div>
      {saveNotice && (
        <div className="mt-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-2 text-[10px] font-black flex items-center gap-1">
          <Check size={12} />
          {saveNotice}
        </div>
      )}
    </div>
  );
}
