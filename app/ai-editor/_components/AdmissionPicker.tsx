"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import {
  ADMISSION_PRESETS,
  buildAdmissionLabel,
  parseAdmissionLabel,
  presetLabel,
  type AdmissionFormat,
} from "./admissionSizes";

interface AdmissionPickerProps {
  /** The currently chosen full label, e.g. "300×300 px · ≤100KB · JPG". */
  selectedLabel: string;
  onSelect: (label: string) => void;
}

const GROUPS: { key: "university" | "job" | "general"; title: string }[] = [
  { key: "university", title: "বিশ্ববিদ্যালয় ভর্তি" },
  { key: "job", title: "সরকারি চাকরি" },
  { key: "general", title: "অন্যান্য" },
];

const inputCls =
  "w-full rounded-lg border border-[#E3D6B8] bg-white px-2 py-1.5 text-[13px] text-[#3B2F1E] outline-none focus:border-[#DC2626]";

/**
 * Admission photo picker: ready-made university/job presets plus a "custom" box
 * where the user types the pixel size, KB limit and format of any portal.
 */
export default function AdmissionPicker({ selectedLabel, onSelect }: AdmissionPickerProps) {
  const isPreset = ADMISSION_PRESETS.some((p) => presetLabel(p) === selectedLabel);
  const parsed = parseAdmissionLabel(selectedLabel);
  const [w, setW] = useState(String(parsed?.widthPx ?? 300));
  const [h, setH] = useState(String(parsed?.heightPx ?? 300));
  const [minKB, setMinKB] = useState(parsed?.minKB ? String(parsed.minKB) : "");
  const [maxKB, setMaxKB] = useState(parsed?.maxKB ? String(parsed.maxKB) : "100");
  const [format, setFormat] = useState<AdmissionFormat>(parsed?.format ?? "jpg");
  const [error, setError] = useState("");

  const applyCustom = () => {
    const wi = Number(w);
    const hi = Number(h);
    const mx = maxKB.trim() ? Number(maxKB) : 0;
    const mn = minKB.trim() ? Number(minKB) : 0;
    if (!Number.isFinite(wi) || !Number.isFinite(hi) || wi < 20 || hi < 20 || wi > 6000 || hi > 6000) {
      setError("প্রস্থ ও উচ্চতা ২০ থেকে ৬০০০ পিক্সেলের মধ্যে দিন।");
      return;
    }
    if (mx && mx < 5) {
      setError("সর্বোচ্চ KB কমপক্ষে ৫ দিন।");
      return;
    }
    if (mn && mx && mn >= mx) {
      setError("সর্বনিম্ন KB সর্বোচ্চের চেয়ে কম হতে হবে।");
      return;
    }
    setError("");
    onSelect(
      buildAdmissionLabel({
        widthPx: wi,
        heightPx: hi,
        minKB: mn || undefined,
        maxKB: mx || undefined,
        format,
      }),
    );
  };

  return (
    <div className="space-y-3">
      {GROUPS.map((group) => {
        const items = ADMISSION_PRESETS.filter((p) => p.group === group.key);
        if (!items.length) return null;
        return (
          <div key={group.key}>
            <p className="mb-1.5 text-[12px] font-bold text-stone-500">{group.title}</p>
            <div className="grid grid-cols-1 gap-1.5">
              {items.map((preset) => {
                const label = presetLabel(preset);
                const on = selectedLabel === label;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelect(label)}
                    className={`relative cursor-pointer rounded-lg border px-3 py-2 text-left transition-all ${
                      on
                        ? "border-[#DC2626] bg-[#DC2626]/10"
                        : "border-[#E3D6B8] bg-[#FBF6E8] hover:bg-[#EFE3C8]"
                    }`}
                  >
                    {on && (
                      <span className="absolute right-2 top-2 rounded-full bg-[#DC2626] p-0.5 text-white">
                        <Check size={9} />
                      </span>
                    )}
                    <span className={`block text-[13px] font-bold leading-tight ${on ? "text-[#DC2626]" : "text-[#3B2F1E]"}`}>
                      {preset.title}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] font-semibold text-[#5A4A32]">
                      {preset.widthPx}×{preset.heightPx} px · {preset.minKB ? `${preset.minKB}–` : "সর্বোচ্চ "}
                      {preset.maxKB} KB · {preset.format === "jpg" ? "JPG" : preset.format === "png" ? "PNG" : "JPG/PNG"}
                    </span>
                    {preset.note && (
                      <span className="mt-0.5 block text-[10.5px] leading-snug text-stone-500">{preset.note}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div
        className={`rounded-lg border p-2.5 ${
          !isPreset && parsed ? "border-[#DC2626] bg-[#DC2626]/5" : "border-[#E3D6B8] bg-[#F7EFD9]"
        }`}
      >
        <p className="mb-1.5 text-[12px] font-bold text-[#3B2F1E]">নিজের মাপ দিন (অন্য যেকোনো ভর্তি/আবেদন)</p>
        <div className="grid grid-cols-2 gap-1.5">
          <label className="text-[11px] text-stone-600">
            প্রস্থ (px)
            <input className={inputCls} inputMode="numeric" value={w} onChange={(e) => setW(e.target.value.replace(/\D/g, ""))} />
          </label>
          <label className="text-[11px] text-stone-600">
            উচ্চতা (px)
            <input className={inputCls} inputMode="numeric" value={h} onChange={(e) => setH(e.target.value.replace(/\D/g, ""))} />
          </label>
          <label className="text-[11px] text-stone-600">
            সর্বনিম্ন KB (না থাকলে খালি)
            <input className={inputCls} inputMode="numeric" value={minKB} onChange={(e) => setMinKB(e.target.value.replace(/\D/g, ""))} />
          </label>
          <label className="text-[11px] text-stone-600">
            সর্বোচ্চ KB
            <input className={inputCls} inputMode="numeric" value={maxKB} onChange={(e) => setMaxKB(e.target.value.replace(/\D/g, ""))} />
          </label>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          {(["jpg", "png", "any"] as AdmissionFormat[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`cursor-pointer rounded-md border px-2.5 py-1 text-[12px] font-bold transition ${
                format === f
                  ? "border-[#DC2626] bg-[#DC2626] text-white"
                  : "border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8]"
              }`}
            >
              {f === "any" ? "JPG/PNG" : f.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            onClick={applyCustom}
            className="ml-auto cursor-pointer rounded-md bg-[#059669] px-3 py-1 text-[12px] font-bold text-white transition hover:bg-[#047857]"
          >
            এই মাপ নিন
          </button>
        </div>
        {error && <p className="mt-1 text-[11px] font-semibold text-[#DC2626]">{error}</p>}
      </div>
    </div>
  );
}
