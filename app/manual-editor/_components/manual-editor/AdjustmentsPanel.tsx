"use client";
import { ManualT as T } from "./manualEditorI18n";
import { useState } from "react";
import { Check, Download, Printer, Save, SlidersHorizontal } from "lucide-react";
import { useManualEditor } from "./EditorProvider";

type AdjustmentRow = {
  label: string;
  value: number;
  setter: (value: number) => void;
  min: number;
  max: number;
  suffix?: string;
};

export default function AdjustmentsPanel() {
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [exportQuality, setExportQuality] = useState(92);
  const {
    activePhoto,
    brightness,
    contrast,
    saturation,
    sharp,
    hue,
    sepia,
    grayscale,
    setBrightness,
    setContrast,
    setSaturation,
    setSharp,
    setHue,
    setSepia,
    setGrayscale,
    downloadEdited,
    printEdited,
    saveEdited,
    isSavingEdited,
    saveNotice,
  } = useManualEditor();

  const rows: AdjustmentRow[] = [
    { label: "Brightness", value: brightness, setter: setBrightness, min: -100, max: 100, suffix: "%" },
    { label: "Contrast", value: contrast, setter: setContrast, min: -100, max: 100, suffix: "%" },
    { label: "Saturation", value: saturation, setter: setSaturation, min: -100, max: 100, suffix: "%" },
    { label: "Sharpness", value: sharp, setter: setSharp, min: -100, max: 100, suffix: "%" },
    { label: "Hue", value: hue, setter: setHue, min: -180, max: 180, suffix: "°" },
  ];

  const resetAdjustments = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setSharp(0);
    setHue(0);
    setSepia(0);
    setGrayscale(0);
  };

  return (
    <div className="shrink-0 rounded-2xl border border-[#E3D6B8] bg-[#F2E8D2] p-4 text-[#3B2F1E] shadow-sm lg:p-3">
      <div className="mb-4 flex items-center justify-between gap-2 lg:mb-2">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-1 rounded-full bg-[#DC2626]" />
          <SlidersHorizontal size={15} className="text-[#5A4A32]" />
          <span className="text-sm font-extrabold uppercase tracking-wider text-[#3B2F1E]"><T>IMAGE ADJUSTMENTS</T></span>
        </div>
        <button type="button" onClick={resetAdjustments} className="text-[10px] font-extrabold text-[#B91C1C] hover:underline">Reset</button>
      </div>

      {rows.map(({ label, value, setter, min, max, suffix }) => (
        <div key={label} className="mb-3 lg:mb-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#5A4A32]">
            <span><T>{label}</T></span>
            <span className="text-[#DC2626]">{value}{suffix}</span>
          </div>
          <input type="range" min={min} max={max} step={1} value={value} onChange={(event) => setter(Number(event.target.value))} className="w-full cursor-pointer accent-[#DC2626]" />
        </div>
      ))}

      <details className="mb-3 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-2">
        <summary className="text-[11px] font-extrabold text-[#5A4A32]">Creative filters</summary>
        <div className="mt-3 space-y-3">
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-[#5A4A32]"><label htmlFor="manual-sepia">Sepia</label><span className="text-[#DC2626]">{sepia}%</span></div>
            <input id="manual-sepia" type="range" min={0} max={100} value={sepia} onChange={(event) => setSepia(Number(event.target.value))} className="w-full accent-[#DC2626]" />
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-[#5A4A32]"><label htmlFor="manual-grayscale">Black &amp; White</label><span className="text-[#DC2626]">{grayscale}%</span></div>
            <input id="manual-grayscale" type="range" min={0} max={100} value={grayscale} onChange={(event) => setGrayscale(Number(event.target.value))} className="w-full accent-[#DC2626]" />
          </div>
        </div>
      </details>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="manual-export-format" className="mb-1 block text-[10px] font-extrabold text-[#5A4A32]">FORMAT</label>
          <select id="manual-export-format" value={exportFormat} onChange={(event) => setExportFormat(event.target.value as "png" | "jpeg" | "webp")} className="w-full rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2 py-2 text-[11px] font-bold text-[#3B2F1E]">
            <option value="png">PNG · Transparent</option>
            <option value="jpeg">JPEG · Smaller file</option>
            <option value="webp">WebP · Smaller file</option>
          </select>
        </div>
        {exportFormat !== "png" ? (
          <div>
            <label htmlFor="manual-export-quality" className="mb-1 flex items-center justify-between text-[10px] font-extrabold text-[#5A4A32]">QUALITY <span className="text-[#DC2626]">{exportQuality}%</span></label>
            <input id="manual-export-quality" type="range" min={40} max={100} value={exportQuality} onChange={(event) => setExportQuality(Number(event.target.value))} className="mt-2 w-full accent-[#DC2626]" />
          </div>
        ) : (
          <p className="self-center text-[10px] leading-4 text-[#6B5A40]">PNG স্বচ্ছ ব্যাকগ্রাউন্ড ধরে রাখে।</p>
        )}
      </div>
      {exportFormat === "jpeg" && <p className="-mt-1 mb-2 text-[10px] text-[#6B5A40]">JPEG-এ স্বচ্ছ অংশ সাদা হয়ে যাবে।</p>}

      <div className="grid grid-cols-3 gap-2 pt-1">
        <button type="button" disabled={!activePhoto} onClick={() => void downloadEdited(exportFormat, exportQuality / 100)} className="flex cursor-pointer items-center justify-center gap-1 rounded-xl bg-[#DC2626] py-2 text-[12px] font-extrabold text-white transition-colors hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-40"><Download size={13} /><T>Download</T></button>
        <button type="button" disabled={!activePhoto || isSavingEdited} onClick={() => void printEdited()} className="flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] py-2 text-[12px] font-extrabold text-[#3B2F1E] transition-colors hover:bg-[#EFE3C8] disabled:cursor-not-allowed disabled:opacity-40"><Printer size={13} /><T>Print</T></button>
        <button type="button" disabled={!activePhoto || isSavingEdited} onClick={() => void saveEdited()} className="flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] py-2 text-[12px] font-extrabold text-[#3B2F1E] transition-colors hover:bg-[#EFE3C8] disabled:cursor-not-allowed disabled:opacity-40"><Save size={13} />{isSavingEdited ? <T>Saving</T> : <T>Save</T>}</button>
      </div>

      {saveNotice && <div className="mt-3 flex items-center gap-1 rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 px-3 py-2 text-[12px] font-extrabold text-[#10B981]"><Check size={12} /><T>{saveNotice}</T></div>}
    </div>
  );
}
