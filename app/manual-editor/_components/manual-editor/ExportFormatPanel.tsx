"use client";
import { Check, FileImage, FileText } from "lucide-react";
import { useManualEditorText } from "./manualEditorI18n";
import { useManualEditor, type ExportFormatChoice } from "./EditorProvider";
import { forcedAdmissionFormat, isAdmissionPreset } from "./admissionExport";

/**
 * The file type that will really be downloaded.
 * Admission / job-portal sizes decide the format themselves (JPG only, PNG only, or JPG/PNG),
 * so what the person picked is adjusted here, in one place, for both the picker and the download step.
 */
export function useExportChoice() {
  const { photoMode, currentPreset, exportFormat, exportQuality } = useManualEditor();
  const admission = photoMode === "admission" && isAdmissionPreset(currentPreset) ? currentPreset : null;
  const locked = admission ? forcedAdmissionFormat(admission) : null;
  let format: ExportFormatChoice = exportFormat;
  if (admission) {
    if (locked)
      format = locked;
    else if (format === "webp" || format === "pdf")
      format = "jpeg";
  }
  return { format, quality: exportQuality, admission, locked };
}

export const FORMAT_LABEL: Record<ExportFormatChoice, string> = { png: "PNG", jpeg: "JPG", webp: "WebP", pdf: "PDF" };

const OPTIONS: { id: ExportFormatChoice; label: string; bn: string; en: string }[] = [
  { id: "png", label: "PNG", bn: "স্বচ্ছ ব্যাকগ্রাউন্ড রাখে, সেরা মান", en: "Keeps transparency, best quality" },
  { id: "jpeg", label: "JPG", bn: "ছোট ফাইল, ফর্ম ও আবেদনে সবচেয়ে চলে", en: "Small file, works almost everywhere" },
  { id: "webp", label: "WebP", bn: "খুব ছোট ফাইল (ওয়েবের জন্য)", en: "Very small file (for the web)" },
  { id: "pdf", label: "PDF", bn: "প্রিন্টের দোকানে দেওয়ার জন্য, ঠিক মাপে", en: "For print shops, exact physical size" },
];

export default function ExportFormatPanel() {
  const { locale } = useManualEditorText();
  const bn = String(locale ?? "").toLowerCase().startsWith("bn");
  const tx = (b: string, e: string) => (bn ? b : e);
  const { setExportFormat, setExportQuality } = useManualEditor();
  const { format, quality, admission, locked } = useExportChoice();
  const kbText = admission
    ? `${admission.minKB ? `${admission.minKB}–` : tx("সর্বোচ্চ ", "max ")}${admission.maxKB ?? "?"} KB`
    : "";
  const options = admission ? OPTIONS.filter((o) => o.id === "png" || o.id === "jpeg") : OPTIONS;

  return (<div className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold text-[#3B2F1E]"><FileImage size={15}/>{tx("ফাইলের ধরন (কোন ফরম্যাটে নেবেন?)", "File type (which format do you need?)")}</p>

      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
            const on = format === option.id;
            const disabled = Boolean(locked) && option.id !== locked;
            return (<button key={option.id} type="button" disabled={disabled} onClick={() => setExportFormat(option.id)} className={`relative rounded-xl border px-2.5 py-2 text-left transition ${on ? "border-[#DC2626] bg-[#F6D9A8]" : "border-[#E3D6B8] bg-[#F7EFD9] hover:border-[#DC2626]/40"} disabled:cursor-not-allowed disabled:opacity-40`}>
              {on && (<span className="absolute right-2 top-2 rounded-full bg-[#DC2626] p-0.5 text-white"><Check size={9}/></span>)}
              <span className={`flex items-center gap-1 text-[15px] font-extrabold ${on ? "text-[#DC2626]" : "text-[#3B2F1E]"}`}>{option.id === "pdf" && <FileText size={14}/>}{option.label}</span>
              <span className="mt-0.5 block text-[12px] font-semibold leading-snug text-[#6B5A40]">{tx(option.bn, option.en)}</span>
            </button>);
        })}
      </div>

      {admission && (<p className="mt-2 rounded-lg bg-[#DC2626]/10 px-2.5 py-1.5 text-[12.5px] font-bold leading-snug text-[#B91C1C]">
          {locked
            ? tx(`এই আবেদনে শুধু ${FORMAT_LABEL[locked]} চলে, তাই ফরম্যাট নিজে ঠিক হয়েছে। ফাইলের সাইজ ${kbText}-এর মধ্যে নিজে থেকেই মিলবে।`, `This application accepts only ${FORMAT_LABEL[locked]}, so the format is set for you. File size will fit ${kbText} automatically.`)
            : tx(`ফাইলের সাইজ নিজে থেকেই ${kbText}-এর মধ্যে মিলবে।`, `File size will fit ${kbText} automatically.`)}
        </p>)}

      {!admission && (format === "jpeg" || format === "webp") && (<div className="mt-2">
          <label htmlFor="manual-export-quality" className="mb-1 flex items-center justify-between text-[13px] font-extrabold text-[#5A4A32]">{tx("কোয়ালিটি", "Quality")} <span className="text-[#DC2626]">{quality}%</span></label>
          <input id="manual-export-quality" type="range" min={40} max={100} value={quality} onChange={(event) => setExportQuality(Number(event.target.value))} className="h-5 w-full accent-[#DC2626]"/>
          {format === "jpeg" && <p className="text-[12px] font-semibold text-[#6B5A40]">{tx("JPG-তে স্বচ্ছ অংশ সাদা হয়ে যায়।", "In JPG, transparent areas turn white.")}</p>}
        </div>)}
      {format === "png" && !admission && <p className="mt-2 text-[12px] font-semibold text-[#6B5A40]">{tx("PNG স্বচ্ছ ব্যাকগ্রাউন্ড ধরে রাখে।", "PNG keeps a transparent background.")}</p>}
    </div>);
}
