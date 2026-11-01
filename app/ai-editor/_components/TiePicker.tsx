"use client";

import React from "react";
import { Check } from "lucide-react";
import { TIE_COLORS, TIE_PREFIX, TIE_STYLES } from "./editingGuides";

/** The tie choice stored inside a selected-guides list ("" = whatever the clothing style comes with). */
export function getTieFromGuides(guides: string[]): string {
  const entry = guides.find((g) => g.startsWith(TIE_PREFIX));
  return entry ? entry.slice(TIE_PREFIX.length).trim() : "";
}

/** Returns a new guides list with the tie replaced ("" removes the choice). */
export function withTie(guides: string[], name: string): string[] {
  const rest = guides.filter((g) => !g.startsWith(TIE_PREFIX));
  return name ? [...rest, `${TIE_PREFIX} ${name}`] : rest;
}

/** Clothing styles that can carry a necktie. */
export const canHaveTie = (clothingName: string | undefined) => !!clothingName && TIE_STYLES.includes(clothingName);

interface TiePickerProps {
  value: string;
  onChange: (name: string) => void;
  compact?: boolean;
  className?: string;
}

/**
 * Necktie chooser shown under the clothing colour. "স্টাইল অনুযায়ী" keeps what the clothing style normally has,
 * "টাই লাগবে না" removes the tie, and a colour puts a neat tie of that colour.
 */
export default function TiePicker({ value, onChange, compact = false, className = "" }: TiePickerProps) {
  const size = compact ? "h-6 w-6" : "h-9 w-9";
  const pill = (on: boolean) =>
    `rounded-lg border px-2.5 py-1 text-[12px] font-bold cursor-pointer transition ${
      on ? "border-[#DC2626] bg-[#DC2626] text-white" : "border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8]"
    }`;
  return (
    <div className={`rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-2.5 ${className}`}>
      <p className="mb-1.5 text-[13px] font-bold text-[#3B2F1E]">টাই কেমন চান?</p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        <button type="button" aria-pressed={value === ""} onClick={() => onChange("")} className={pill(value === "")}>
          স্টাইল অনুযায়ী
        </button>
        <button type="button" aria-pressed={value === "None"} onClick={() => onChange("None")} className={pill(value === "None")}>
          টাই লাগবে না
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {TIE_COLORS.map((c) => {
          const on = value === c.name;
          return (
            <button
              key={c.name}
              type="button"
              aria-pressed={on}
              aria-label={`${c.bn} টাই`}
              title={`${c.bn} টাই`}
              onClick={() => onChange(on ? "" : c.name)}
              style={{ backgroundColor: c.hex }}
              className={`flex ${size} items-center justify-center rounded-full border-2 cursor-pointer transition ${
                on ? "border-[#DC2626] ring-2 ring-[#DC2626]/30 scale-110" : "border-white shadow-sm hover:scale-105"
              }`}
            >
              {on && <Check size={compact ? 12 : 16} className="text-white drop-shadow" strokeWidth={3} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
