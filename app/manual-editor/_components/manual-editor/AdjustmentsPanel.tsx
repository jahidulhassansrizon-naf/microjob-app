"use client";
import { ManualT as T } from "./manualEditorI18n";
import { useManualEditor } from "./EditorProvider";

type AdjustmentRow = {
  label: string;
  value: number;
  setter: (value: number) => void;
  min: number;
  max: number;
  suffix?: string;
};

/** Step 4: simple sliders. 0 always means "no change". The download part lives in DownloadPanel. */
export default function AdjustmentsPanel() {
  const {
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
  } = useManualEditor();

  const rows: AdjustmentRow[] = [
    { label: "Brightness", value: brightness, setter: setBrightness, min: -100, max: 100, suffix: "%" },
    { label: "Contrast", value: contrast, setter: setContrast, min: -100, max: 100, suffix: "%" },
    { label: "Saturation", value: saturation, setter: setSaturation, min: -100, max: 100, suffix: "%" },
    { label: "Sharpness", value: sharp, setter: setSharp, min: -100, max: 100, suffix: "%" },
    { label: "Hue", value: hue, setter: setHue, min: -180, max: 180, suffix: "°" },
  ];

  const changed = brightness || contrast || saturation || sharp || hue || sepia || grayscale;

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
    <div className="text-[#3B2F1E]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[12.5px] text-[#6B5A40]"><T>Slide left or right. 0 means no change.</T></p>
        <button
          type="button"
          onClick={resetAdjustments}
          disabled={!changed}
          className="shrink-0 rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2.5 py-1 text-[12px] font-extrabold text-[#B91C1C] hover:bg-[#EFE3C8] disabled:opacity-40"
        >
          <T>Reset</T>
        </button>
      </div>

      {rows.map(({ label, value, setter, min, max, suffix }) => (
        <div key={label} className="mb-3">
          <div className="flex items-center justify-between text-[14px] font-bold text-[#3B2F1E]">
            <span><T>{label}</T></span>
            <span className={value === 0 ? "text-[#8A7A5E]" : "text-[#DC2626]"}>{value}{suffix}</span>
          </div>
          <input type="range" min={min} max={max} step={1} value={value} onChange={(event) => setter(Number(event.target.value))} className="h-5 w-full cursor-pointer accent-[#DC2626]" />
        </div>
      ))}

      <details className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-3">
        <summary className="text-[14px] font-extrabold text-[#5A4A32]"><T>Creative filters</T></summary>
        <div className="mt-3 space-y-3">
          <div>
            <div className="flex items-center justify-between text-[14px] font-bold text-[#3B2F1E]"><label htmlFor="manual-sepia"><T>Sepia</T></label><span className="text-[#DC2626]">{sepia}%</span></div>
            <input id="manual-sepia" type="range" min={0} max={100} value={sepia} onChange={(event) => setSepia(Number(event.target.value))} className="h-5 w-full accent-[#DC2626]" />
          </div>
          <div>
            <div className="flex items-center justify-between text-[14px] font-bold text-[#3B2F1E]"><label htmlFor="manual-grayscale"><T>Black &amp; White</T></label><span className="text-[#DC2626]">{grayscale}%</span></div>
            <input id="manual-grayscale" type="range" min={0} max={100} value={grayscale} onChange={(event) => setGrayscale(Number(event.target.value))} className="h-5 w-full accent-[#DC2626]" />
          </div>
        </div>
      </details>
    </div>
  );
}
