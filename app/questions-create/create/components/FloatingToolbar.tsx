"use client";

import { Bold, Italic, Minus, Plus, Trash2 } from "lucide-react";
import type { PaperAnnotation, RegionTextAlign } from "../types/question";

export interface FloatingToolbarProps {
  annotation: PaperAnnotation;
  onUpdate: (patch: Partial<PaperAnnotation>) => void;
  onDelete: () => void;
}

const ALIGN_OPTIONS: RegionTextAlign[] = ["left", "center", "right"];

export default function FloatingToolbar({
  annotation,
  onUpdate,
  onDelete,
}: FloatingToolbarProps) {
  const adjustFont = (delta: number) => {
    const next = Math.max(70, Math.min(180, annotation.fontScale + delta));
    onUpdate({ fontScale: next });
  };

  return (
    <div
      data-print-control="true"
      className="screen-only absolute left-1 top-1 z-[60] flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-[0_12px_28px_rgba(17,24,39,0.14)]"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => adjustFont(-5)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        title="Smaller text"
      >
        <Minus size={12} />
      </button>

      <span className="min-w-10 text-center text-[8px] font-extrabold text-gray-600">
        {annotation.fontScale}%
      </span>

      <button
        type="button"
        onClick={() => adjustFont(5)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        title="Larger text"
      >
        <Plus size={12} />
      </button>

      <button
        type="button"
        onClick={() =>
          onUpdate({ fontWeight: annotation.fontWeight === 700 ? 400 : 700 })
        }
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
          annotation.fontWeight === 700
            ? "bg-gray-900 text-white"
            : "text-gray-500 hover:bg-gray-100"
        }`}
        title="Bold"
      >
        <Bold size={12} />
      </button>

      <button
        type="button"
        onClick={() =>
          onUpdate({
            fontStyle: annotation.fontStyle === "italic" ? "normal" : "italic",
          })
        }
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
          annotation.fontStyle === "italic"
            ? "bg-gray-900 text-white"
            : "text-gray-500 hover:bg-gray-100"
        }`}
        title="Italic"
      >
        <Italic size={12} />
      </button>

      <div className="mx-0.5 h-5 w-px bg-gray-200" />

      {ALIGN_OPTIONS.map((align) => (
        <button
          key={align}
          type="button"
          onClick={() => onUpdate({ textAlign: align })}
          className={`rounded-md px-1.5 py-1 text-[8px] font-bold uppercase ${
            annotation.textAlign === align
              ? "bg-orange-50 text-[#F3A847]"
              : "text-gray-500 hover:bg-gray-100"
          }`}
          title={`Align ${align}`}
        >
          {align === "left" ? "L" : align === "center" ? "C" : "R"}
        </button>
      ))}

      <button
        type="button"
        onClick={onDelete}
        className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
        title="Delete selected area"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
