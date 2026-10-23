"use client";
import { T, useQuestionText } from "../i18n";
import { Bold, Italic, Minus, Plus, Trash2 } from "lucide-react";
import type { PaperAnnotation, RegionTextAlign } from "../types/question";
export interface FloatingToolbarProps {
    annotation: PaperAnnotation;
    onUpdate: (patch: Partial<PaperAnnotation>) => void;
    onDelete: () => void;
}
const ALIGN_OPTIONS: RegionTextAlign[] = ["left", "center", "right"];
export default function FloatingToolbar({ annotation, onUpdate, onDelete, }: FloatingToolbarProps) {
    const { t } = useQuestionText();
    const adjustFont = (delta: number) => {
        const next = Math.max(70, Math.min(180, annotation.fontScale + delta));
        onUpdate({ fontScale: next });
    };
    return (<div data-print-control="true" className="ui-font screen-only absolute left-1 top-1 z-[60] flex items-center gap-1 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-1 shadow-xl" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
      <button type="button" onClick={() => adjustFont(-5)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5A4A32] hover:bg-[#EFE3C8] transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]" title={t("Smaller text")}>
        <Minus size={15}/>
      </button>

      <span className="min-w-12 text-center font-mono text-[14px] font-bold text-[#3B2F1E]">
        {annotation.fontScale}<T>{"%\r\n      "}</T></span>

      <button type="button" onClick={() => adjustFont(5)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5A4A32] hover:bg-[#EFE3C8] transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]" title={t("Larger text")}>
        <Plus size={15}/>
      </button>

      <button type="button" onClick={() => onUpdate({ fontWeight: annotation.fontWeight === 700 ? 400 : 700 })} className={`flex h-9 w-9 items-center justify-center rounded-lg transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] ${annotation.fontWeight === 700
            ? "bg-[#3B2F1E] text-[#FBF6E8]"
            : "text-[#5A4A32] hover:bg-[#EFE3C8]"}`} title={t("Bold")}>
        <Bold size={15}/>
      </button>

      <button type="button" onClick={() => onUpdate({
            fontStyle: annotation.fontStyle === "italic" ? "normal" : "italic",
        })} className={`flex h-9 w-9 items-center justify-center rounded-lg transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] ${annotation.fontStyle === "italic"
            ? "bg-[#3B2F1E] text-[#FBF6E8]"
            : "text-[#5A4A32] hover:bg-[#EFE3C8]"}`} title={t("Italic")}>
        <Italic size={15}/>
      </button>

      <div className="mx-0.5 h-5 w-px bg-[#D8C9A6]"/>

      {ALIGN_OPTIONS.map((align) => (<button key={align} type="button" onClick={() => onUpdate({ textAlign: align })} className={`rounded-lg px-2.5 py-1.5 text-[13px] font-bold uppercase transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] ${annotation.textAlign === align
                ? "bg-[#F6D9A8] text-[#DC2626]"
                : "text-[#5A4A32] hover:bg-[#EFE3C8]"}`} title={t(`Align ${align}`)}>
          {align === "left" ? <T>{"L"}</T> : align === "center" ? "C" : "R"}
        </button>))}

      <button type="button" onClick={onDelete} className="ml-0.5 flex h-9 w-9 items-center justify-center rounded-lg text-[#6B5A40] hover:bg-red-50 hover:text-red-500 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]" title={t("Delete selected area")}>
        <Trash2 size={15}/>
      </button>
    </div>);
}
