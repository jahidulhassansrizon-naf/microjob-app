"use client";
import { Check, Download, Pencil, Printer, Save } from "lucide-react";
import { ManualT as T, useManualEditorText } from "./manualEditorI18n";
import { useManualEditor } from "./EditorProvider";
import { FORMAT_LABEL, useExportChoice } from "./ExportFormatPanel";
import { isAdmissionPreset } from "./admissionExport";
import { DPI } from "./constants";

/**
 * Last step. Shows exactly what the file will be (size, format, KB limit)
 * and only here are Download / Print / Save offered.
 */
export default function DownloadPanel({ onChangeSize }: {
  onChangeSize?: () => void;
}) {
  const { locale } = useManualEditorText();
  const bn = String(locale ?? "").toLowerCase().startsWith("bn");
  const tx = (b: string, e: string) => (bn ? b : e);
  const { activePhoto, photoMode, currentPreset, downloadEdited, printEdited, saveEdited, isSavingEdited, saveNotice, } = useManualEditor();
  const { format, quality, admission } = useExportChoice();
  const dual = photoMode === "dual";
  const widthMm = dual ? currentPreset.widthMm * 2 : currentPreset.widthMm;
  const px = isAdmissionPreset(currentPreset)
    ? { w: currentPreset.widthPx, h: currentPreset.heightPx }
    : { w: Math.round((widthMm / 25.4) * DPI), h: Math.round((currentPreset.heightMm / 25.4) * DPI) };
  const kbText = admission
    ? `${admission.minKB ? `${admission.minKB}–` : tx("সর্বোচ্চ ", "max ")}${admission.maxKB ?? "?"} KB`
    : "";

  return (
    <div className="text-[#3B2F1E]">
      <div className="mb-3 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[13px] font-bold text-[#6B5A40]">{tx("আপনি পাবেন", "You will get")}</p>
            <p className="text-[20px] font-extrabold leading-tight text-[#DC2626]">{px.w} × {px.h} px</p>
            <p className="text-[13px] font-bold text-[#5A4A32]">{FORMAT_LABEL[format]}{kbText ? ` · ${kbText}` : ""}{!admission && format !== "png" && format !== "pdf" ? ` · ${quality}%` : ""}</p>
          </div>
          {onChangeSize && (<button type="button" onClick={onChangeSize} className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-[#E3D6B8] bg-[#F2E8D2] px-2 py-1 text-[12px] font-extrabold text-[#6B5A40] hover:bg-[#EFE3C8]"><Pencil size={12}/>{tx("মাপ/ধরন বদলান", "Change")}</button>)}
        </div>
      </div>

      <button type="button" disabled={!activePhoto} onClick={() => void downloadEdited(format, quality / 100)} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#DC2626] py-3.5 text-[17px] font-extrabold text-white shadow-sm transition-colors hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-40">
        <Download size={20}/>{tx(`${FORMAT_LABEL[format]} ডাউনলোড করুন`, `Download ${FORMAT_LABEL[format]}`)}
      </button>
      {!activePhoto && <p className="mt-2 text-center text-[13px] text-[#6B5A40]"><T>Upload a photo first.</T></p>}

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" disabled={!activePhoto || isSavingEdited} onClick={() => void printEdited()} className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] py-2.5 text-[14px] font-extrabold text-[#3B2F1E] transition-colors hover:bg-[#EFE3C8] disabled:cursor-not-allowed disabled:opacity-40">
          <Printer size={16}/><T>Print</T>
        </button>
        <button type="button" disabled={!activePhoto || isSavingEdited} onClick={() => void saveEdited()} className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] py-2.5 text-[14px] font-extrabold text-[#3B2F1E] transition-colors hover:bg-[#EFE3C8] disabled:cursor-not-allowed disabled:opacity-40">
          <Save size={16}/>{isSavingEdited ? <T>Saving</T> : <T>Save</T>}
        </button>
      </div>

      {saveNotice && <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 px-3 py-2 text-[13px] font-extrabold leading-snug text-[#0B7A57]"><Check size={14} className="mt-0.5 shrink-0"/><T>{saveNotice}</T></div>}
    </div>
  );
}
