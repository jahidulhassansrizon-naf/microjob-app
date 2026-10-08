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
    return (<div className="mt-2 overflow-hidden rounded-2xl border border-[#DBEAFE] bg-[#F8FBFF] shadow-sm">
      <button type="button" onClick={onToggleOpen} className="flex w-full cursor-pointer items-center justify-between border-b border-[#DBEAFE] px-3 py-2.5 text-left">
        <div>
          <p className="text-[10px] font-black text-[#0F172A]"><BulkT>{`${preset.name} AI tools`}</BulkT></p>
          <p className="mt-0.5 text-[8px] text-[#64748B]"><BulkT>{"Select any tools you want to apply."}</BulkT></p>
        </div>
        <ChevronDown size={14} className="rotate-180 text-[#2563EB]"/>
      </button>

      <div className="max-h-64 overflow-y-auto p-2">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
          {preset.tools.map((tool) => {
            const checked = selectedTools.includes(tool.name);
            return (<button type="button" key={tool.name} onClick={() => onToggleTool(tool.name)} className={`relative flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 text-left transition ${checked
                    ? "border-[#2563EB] bg-white shadow-xs"
                    : "border-[#E2E8F0] bg-white hover:border-[#2563EB]/40"}`}>
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked
                    ? "border-[#2563EB] bg-[#2563EB] text-white"
                    : "border-[#CBD5E1] bg-white text-transparent"}`}>
                  <Check size={11} strokeWidth={3}/>
                </span>

                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#2563EB]">{tool.icon}</span>
                    <span className="text-[10px] font-black leading-tight text-[#0F172A]">
                      {<BulkT>{tool.name}</BulkT>}
                    </span>
                  </span>
                  <span className="mt-1 block text-[8px] leading-relaxed text-[#64748B]">
                    {<BulkT>{tool.description}</BulkT>}
                  </span>
                </span>
              </button>);
        })}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-[#DBEAFE] p-2">
        <button type="button" onClick={onClear} className="flex-1 cursor-pointer rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-[9px] font-bold text-[#475569] transition hover:bg-[#F8FAFC]"><BulkT>{"Clear\n        "}</BulkT></button>
        <button type="button" onClick={onDone} className="flex-1 cursor-pointer rounded-xl bg-[#10B981] px-3 py-2 text-[9px] font-black text-white transition hover:bg-[#059669]"><BulkT>{"Done \u00B7 "}</BulkT>{selectedTools.length}
        </button>
      </div>
    </div>);
}
