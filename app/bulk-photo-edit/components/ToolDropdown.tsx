import { BulkT } from "./bulkPhotoI18n";
import { Check } from "lucide-react";
import type { ToolPreset } from "./types";

interface ToolDropdownProps {
    preset: ToolPreset;
    open: boolean;
    selectedTools: string[];
    onToggleTool: (toolName: string) => void;
    onSelectAll: () => void;
    onClear: () => void;
    onDone: () => void;
}

export default function ToolDropdown({ preset, open, selectedTools, onToggleTool, onSelectAll, onClear, onDone, }: ToolDropdownProps) {
    if (!open)
        return null;
    const allSelected = selectedTools.length === preset.tools.length;
    return (<div className="border-t border-[#E3D6B8] bg-[#F6EEDB]/70">
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
        <p className="text-[12.5px] font-semibold text-[#6B5A40]"><BulkT>{"Select any tools you want to apply."}</BulkT></p>
        <button type="button" onClick={allSelected ? onClear : onSelectAll} className="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-[12.5px] font-bold text-[#B91C1C] transition duration-200 hover:bg-[#FEE9E9] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40">
          <BulkT>{allSelected ? "Clear" : "Select all"}</BulkT>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-1.5 p-2.5">
        {preset.tools.map((tool) => {
            const checked = selectedTools.includes(tool.name);
            return (<button type="button" key={tool.name} onClick={() => onToggleTool(tool.name)} aria-pressed={checked} className={`relative flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 text-left transition duration-200 ease-out active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${checked
                    ? "border-[#DC2626] bg-[#FEF1E0] ring-1 ring-[#DC2626]/30"
                    : "border-[#E3D6B8] bg-[#FBF6E8] hover:border-[#DC2626]/40 hover:bg-[#EFE3C8]"}`}>
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${checked
                    ? "border-[#DC2626] bg-[#DC2626] text-white"
                    : "border-[#D8C9A6] bg-[#FBF6E8] text-transparent"}`}>
                  <Check size={12} strokeWidth={3}/>
                </span>

                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#DC2626]">{tool.icon}</span>
                    <span className="text-[14.5px] font-semibold leading-[1.3] text-[#3B2F1E]">
                      <BulkT>{tool.name}</BulkT>
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-[1.45] text-[#6B5A40]">
                    <BulkT>{tool.description}</BulkT>
                  </span>
                </span>
              </button>);
        })}
      </div>

      <div className="flex justify-end border-t border-[#E3D6B8] px-2.5 py-2">
        <button type="button" onClick={onDone} className="cursor-pointer rounded-xl bg-[#DC2626] px-4 py-1.5 text-[14px] font-bold text-white transition duration-200 ease-out hover:bg-[#B91C1C] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6EEDB]"><BulkT>{"Done · "}</BulkT>{selectedTools.length}
        </button>
      </div>
    </div>);
}
