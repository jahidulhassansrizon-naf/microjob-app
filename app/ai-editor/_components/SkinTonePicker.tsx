"use client";

import React from "react";
import { Ban, Check } from "lucide-react";
import { SKIN_TONES, SKIN_TONE_PREFIX } from "./editingGuides";

/** The skin tone stored inside a selected-guides list ("" = keep the photo's own skin color). */
export function getSkinToneFromGuides(guides: string[]): string {
  const entry = guides.find((g) => g.startsWith(SKIN_TONE_PREFIX));
  return entry ? entry.slice(SKIN_TONE_PREFIX.length).trim() : "";
}

/** Returns a new guides list with the skin tone replaced ("" removes it). */
export function withSkinTone(guides: string[], name: string): string[] {
  const rest = guides.filter((g) => !g.startsWith(SKIN_TONE_PREFIX));
  return name ? [...rest, `${SKIN_TONE_PREFIX} ${name}`] : rest;
}

interface SkinTonePickerProps {
  value: string;
  onChange: (name: string) => void;
  /** Smaller swatches for the cramped side panel. */
  compact?: boolean;
  className?: string;
}

/**
 * Skin color chooser. "মূল রং" (default) keeps the person's own skin color; any swatch asks the AI
 * for that complexion while the face is cleaned. Works for every kind of skin color.
 */
export default function SkinTonePicker({ value, onChange, compact = false, className = "" }: SkinTonePickerProps) {
  const selected = SKIN_TONES.find((tone) => tone.name === value);
  // Big, clearly visible swatches, each with its own name underneath so every colour is easy to tell apart.
  const size = compact ? "h-9 w-9" : "h-11 w-11";
  const labelCls = compact ? "text-[11px]" : "text-[11.5px]";
  // Short names under the swatches (full names show in the header when selected).
  const shortName = (name: string, bn: string) => ({ "Rosy Fair": "গোলাপি ফর্সা", "Deep Dark": "ঘন কালো" } as Record<string, string>)[name] || bn;
  return (
    <div className={`rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] ${compact ? "p-2.5" : "p-3"} ${className}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className={`${compact ? "text-[14px]" : "text-[15px]"} font-bold text-[#3B2F1E]`}>গায়ের রং</p>
        <p className={`${compact ? "text-[12.5px]" : "text-[14px]"} font-bold text-[#B91C1C]`}>
          {selected ? selected.bn : "মূল রং একই থাকবে"}
        </p>
      </div>
      <div className={`grid ${compact ? "grid-cols-6 gap-x-1 gap-y-2" : "grid-cols-6 gap-x-1 gap-y-2 sm:grid-cols-7"}`}>
        <button
          type="button"
          aria-pressed={!selected}
          aria-label="মূল রং"
          title="ছবির নিজের গায়ের রং-ই থাকবে"
          onClick={() => onChange("")}
          className="group flex flex-col items-center gap-1 cursor-pointer focus-visible:outline-none"
        >
          <span
            className={`flex ${size} items-center justify-center rounded-full border-[3px] transition group-focus-visible:ring-2 group-focus-visible:ring-[#DC2626] ${
              !selected ? "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626] scale-105" : "border-[#E3D6B8] bg-white text-stone-500 group-hover:bg-[#EFE3C8]"
            }`}
          >
            <Ban size={compact ? 18 : 24} aria-hidden="true" />
          </span>
          <span className={`${labelCls} text-center font-semibold leading-tight ${!selected ? "text-[#B91C1C]" : "text-stone-700"}`}>মূল রং</span>
        </button>
        {SKIN_TONES.map((tone) => {
          const on = tone.name === value;
          return (
            <button
              key={tone.name}
              type="button"
              aria-pressed={on}
              aria-label={tone.bn}
              title={tone.bn}
              onClick={() => onChange(on ? "" : tone.name)}
              className="group flex flex-col items-center gap-1 cursor-pointer focus-visible:outline-none"
            >
              <span
                className={`relative flex ${size} items-center justify-center rounded-full border-[3px] transition group-focus-visible:ring-2 group-focus-visible:ring-[#DC2626] ${
                  on ? "border-[#DC2626] ring-[3px] ring-[#DC2626]/25 scale-105" : "border-white shadow-md group-hover:scale-105"
                }`}
                style={{ backgroundColor: tone.hex }}
              >
                {on && <Check size={compact ? 18 : 24} className="text-white drop-shadow" strokeWidth={3.5} aria-hidden="true" />}
              </span>
              <span className={`${labelCls} text-center font-semibold leading-tight ${on ? "text-[#B91C1C]" : "text-stone-700"}`}>{shortName(tone.name, tone.bn)}</span>
            </button>
          );
        })}
      </div>
      <p className={`mt-2 ${compact ? "text-[11.5px]" : "text-[12px]"} leading-snug text-stone-600`}>
        না বাছলে ছবির নিজের গায়ের রং-ই থাকবে। বাছলে মুখ, গলা ও কান সেই রঙে পরিষ্কারভাবে আসবে।
      </p>
    </div>
  );
}
