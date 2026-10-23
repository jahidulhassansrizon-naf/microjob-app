import { BulkT } from "./bulkPhotoI18n";
import { Check, ChevronDown } from "lucide-react";
import type { ToolPreset } from "./types";
interface ToolDropdownProps {
    preset: ToolPreset;
    open: boolean;
    selectedTools: string[];
    onToggleOpen: () => void;
    onToggleTool: (toolName: string) => void;
    onClear: () => void;
    onDone: () => void;
}
export default function ToolDropdown({ preset, open, selectedTools, onToggleOpen, onToggleTool, onClear, onDone, }: ToolDropdownProps) {
    if (!open)
        return null;
    return (<div className="relative mt-3 rounded-2xl border-2 border-[#DC2626] bg-[#F0DDB5] shadow-xl">
      <span aria-hidden="true" className="pointer-events-none absolute -top-[9px] left-8 h-4 w-4 rotate-45 border-l-2 border-t-2 border-[#DC2626] bg-[#F0DDB5]"/>
      <button type="button" onClick={onToggleOpen} className="relative flex w-full cursor-pointer items-center justify-between rounded-t-2xl border-b border-[#D8C9A6] px-3 py-3 text-left transition duration-200 ease-out hover:bg-[#EFE3C8]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F0DDB5]">
        <div>
          <p className="text-[17px] font-semibold text-[#3B2F1E]"><BulkT>{`${preset.name} AI tools`}</BulkT></p>
          <p className="mt-0.5 text-[13px] text-[#6B5A40]"><BulkT>{"Select any tools you want to apply."}</BulkT></p>
        </div>
        <ChevronDown size={14} className="rotate-180 text-[#DC2626]"/>
      </button>

      <div className="scroll max-h-72 overflow-y-auto p-2">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
          {preset.tools.map((tool) => {
            const checked = selectedTools.includes(tool.name);
            return (<button type="button" key={tool.name} onClick={() => onToggleTool(tool.name)} className={`relative flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-left transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F0DDB5] ${checked
                    ? "border-[#DC2626] bg-[#F6D9A8] ring-2 ring-[#DC2626]/40"
                    : "border-[#E3D6B8] bg-[#FBF6E8] hover:border-[#DC2626]/40 hover:bg-[#EFE3C8]"}`}>
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked
                    ? "border-[#DC2626] bg-[#DC2626] text-white"
                    : "border-[#D8C9A6] bg-[#FBF6E8] text-transparent"}`}>
                  <Check size={11} strokeWidth={3}/>
                </span>

                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#DC2626]">{tool.icon}</span>
                    <span className="text-[15px] font-semibold leading-[1.3] text-[#3B2F1E]">
                      {<BulkT>{tool.name}</BulkT>}
                    </span>
                  </span>
                  <span className="mt-1 block text-[13px] leading-[1.45] text-[#6B5A40]">
                    {<BulkT>{tool.description}</BulkT>}
                  </span>
                </span>
              </button>);
        })}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-[#D8C9A6] p-2">
        <button type="button" onClick={onClear} className="flex-1 cursor-pointer rounded-xl border border-[#FBB6B6] bg-[#FBF6E8] px-3 py-2.5 text-[15px] font-semibold text-[#B91C1C] transition duration-200 ease-out hover:bg-[#FEE9E9] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F0DDB5]"><BulkT>{"Clear\n        "}</BulkT></button>
        <button type="button" onClick={onDone} className="flex-1 cursor-pointer rounded-xl bg-[#DC2626] px-3 py-2.5 text-[15px] font-semibold text-white transition duration-200 ease-out hover:bg-[#B91C1C] active:scale-[0.98] active:bg-[#991B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F0DDB5]"><BulkT>{"Done \u00B7 "}</BulkT>{selectedTools.length}
        </button>
      </div>
    </div>);
}
