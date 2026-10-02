import { Check, ChevronDown } from "lucide-react";
import type { ToolPreset } from "./types";

interface PresetCardProps {
  preset: ToolPreset;
  selectedTools: string[];
  expanded: boolean;
  onClick: () => void;
}

export default function PresetCard({
  preset,
  selectedTools,
  expanded,
  onClick,
}: PresetCardProps) {
  const selectedCount = selectedTools.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition ${
        expanded || selectedCount > 0
          ? "border-[#2563EB] bg-[#2563EB]/5 ring-1 ring-[#2563EB] shadow-sm"
          : "border-[#E2E8F0] bg-white hover:border-[#2563EB]/50"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F8FAFC]">
        {preset.icon}
      </div>

      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-black leading-tight text-[#0F172A]">
          {preset.name}
        </span>
        <span className="mt-1 block text-[8px] leading-relaxed text-[#64748B]">
          {preset.description}
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1">
        {selectedCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#2563EB] px-1.5 py-0.5 text-[8px] font-black text-white">
            <Check size={9} /> {selectedCount}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-[#64748B] transition-transform ${expanded ? "rotate-180 text-[#2563EB]" : ""}`}
        />
      </span>
    </button>
  );
}
