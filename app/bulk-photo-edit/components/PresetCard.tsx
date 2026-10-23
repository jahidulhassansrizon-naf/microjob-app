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
      className={`relative flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F2E8D2] ${
        expanded || selectedCount > 0
          ? "border-[#DC2626] bg-[#F6D9A8] ring-2 ring-[#DC2626]/40 shadow-sm"
          : "border-[#E3D6B8] bg-[#FBF6E8] hover:bg-[#EFE3C8]"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F6EEDB]">
        {preset.icon}
      </div>

      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold leading-[1.3] text-[#3B2F1E]">
          <BulkT>{preset.name}</BulkT>
        </span>
        <span className="mt-1 block text-[13px] leading-[1.45] text-[#6B5A40]">
          <BulkT>{preset.description}</BulkT>
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1">
        {selectedCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-2 py-0.5 text-[12px] font-bold text-white">
            <Check size={11} /> {selectedCount}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-[#6B5A40] transition-transform ${expanded ? "rotate-180 text-[#DC2626]" : ""}`}
        />
      </span>
    </button>
  );
}
