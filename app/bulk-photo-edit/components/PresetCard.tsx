import { Check, ChevronDown } from "lucide-react";
import { BulkT } from "./bulkPhotoI18n";
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
      aria-expanded={expanded}
      className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#DC2626]/40 ${
        expanded ? "bg-[#F6D9A8]/60" : "hover:bg-[#EFE3C8]/70"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E3D6B8] bg-[#F6EEDB]">
        {preset.icon}
      </div>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15.5px] font-bold leading-[1.3] text-[#3B2F1E]">
          <BulkT>{preset.name}</BulkT>
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] leading-[1.4] text-[#6B5A40]">
          <BulkT>{preset.description}</BulkT>
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        {selectedCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-2 py-0.5 text-[12px] font-bold text-white">
            <Check size={11} strokeWidth={3} /> {selectedCount}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`text-[#6B5A40] transition-transform duration-200 ${expanded ? "rotate-180 text-[#DC2626]" : ""}`}
        />
      </span>
    </button>
  );
}
