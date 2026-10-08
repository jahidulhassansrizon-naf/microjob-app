import { BulkT } from "./bulkPhotoI18n";
import { Check, ListChecks, Sparkles } from "lucide-react";
import { TOOL_PRESETS } from "./toolCatalog";
import type { SelectedTools } from "./types";
import PresetCard from "./PresetCard";
import ToolDropdown from "./ToolDropdown";
interface PresetPanelProps {
    selectedTools: SelectedTools;
    expandedPreset: string | null;
    onTogglePreset: (presetId: string) => void;
    onToggleTool: (presetName: string, toolName: string) => void;
    onClearPreset: (presetName: string) => void;
    onCloseDropdown: () => void;
    photosCount: number;
    onEnhance: () => void | Promise<void>;
    isProcessing: boolean;
    processedCount: number;
}
export default function PresetPanel({ selectedTools, expandedPreset, onTogglePreset, onToggleTool, onClearPreset, onCloseDropdown, photosCount, onEnhance, isProcessing, processedCount, }: PresetPanelProps) {
    const selectedGroups = TOOL_PRESETS.map((preset) => ({
        preset,
        tools: preset.tools.filter((tool) => (selectedTools[preset.name] ?? []).includes(tool.name)),
    })).filter((group) => group.tools.length > 0);
    const selectedTotal = selectedGroups.reduce((sum, group) => sum + group.tools.length, 0);
    const canEnhance = photosCount >= 2 && selectedTotal > 0 && !isProcessing;
    return (<aside className="flex w-full shrink-0 flex-col border-t border-[#E2E8F0] bg-white p-4 shadow-sm lg:w-96 lg:border-t-0 lg:border-l">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0F172A]"><BulkT>{"AI Editing tools\n            "}</BulkT></h4>
            <p className="mt-1 text-[9px] leading-relaxed text-[#64748B]"><BulkT>{"Open a group, choose exact AI operations, then apply that same\n              operation set to every photo separately.\n            "}</BulkT></p>
          </div>

          <span className="shrink-0 rounded-full bg-[#EFF6FF] px-2 py-1 text-[8px] font-black text-[#2563EB]">
            <BulkT>{`${selectedTotal} selected`}</BulkT></span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {selectedGroups.length > 0 && (<div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
            <div className="flex items-center gap-2">
              <ListChecks size={14} className="text-emerald-700"/>
              <p className="text-[10px] font-black text-emerald-800"><BulkT>{"Selected AI operations\n              "}</BulkT></p>
            </div>

            <div className="mt-2 space-y-2">
              {selectedGroups.map((group) => (<div key={group.preset.id}>
                  <p className="text-[8px] font-black uppercase tracking-wide text-emerald-700">
                    <BulkT>{group.preset.name}</BulkT>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {group.tools.map((tool) => (<span key={tool.name} className="rounded-full border border-emerald-200 bg-white px-2 py-1 text-[8px] font-bold text-emerald-800">
                        {<BulkT>{tool.name}</BulkT>}
                      </span>))}
                  </div>
                </div>))}
            </div>
          </div>)}

        {TOOL_PRESETS.map((preset) => {
            const selected = selectedTools[preset.name] || [];
            const expanded = expandedPreset === preset.id;
            return (<div key={preset.id}>
              <PresetCard preset={preset} selectedTools={selected} expanded={expanded} onClick={() => onTogglePreset(preset.id)}/>

              <ToolDropdown preset={preset} open={expanded} selectedTools={selected} onToggleOpen={() => onTogglePreset(preset.id)} onToggleTool={(toolName) => onToggleTool(preset.name, toolName)} onClear={() => onClearPreset(preset.name)} onDone={onCloseDropdown}/>
            </div>);
        })}
      </div>

      <div className="mt-4 border-t border-[#E2E8F0] pt-4">
        {photosCount < 2 && (<div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] font-semibold leading-relaxed text-amber-700"><BulkT>{"Add at least 2 photos to enable bulk AI enhancement.\n          "}</BulkT></div>)}

        {photosCount >= 2 && selectedTotal === 0 && (<div className="mb-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[9px] font-semibold leading-relaxed text-blue-700"><BulkT>{"Choose one or more AI tools above to prepare this bulk edit.\n          "}</BulkT></div>)}

        {isProcessing && (<div className="mb-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[9px] font-semibold leading-relaxed text-blue-700"><BulkT>{`Processing photo ${Math.min(processedCount + 1, Math.max(photosCount, 1))} of ${photosCount}. Keep this tab open until the batch finishes.`}</BulkT></div>)}

        <button type="button" onClick={onEnhance} disabled={!canEnhance} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#10B981] px-4 py-3.5 text-xs font-black text-white shadow-sm transition hover:bg-[#059669] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-[#64748B] disabled:shadow-none">
          <Sparkles size={16}/>
          {isProcessing
        ? <BulkT>{`Processing ${processedCount}/${photosCount}`}</BulkT> : <BulkT>{`Enhance ${photosCount} photos`}</BulkT>}
        </button>

        {!isProcessing && canEnhance && (<div className="mt-2 flex items-center justify-center gap-1 text-[8px] font-bold text-[#64748B]">
            <Check size={10} className="text-[#10B981]"/>
            <BulkT>{`${selectedTotal} exact AI tools will apply to every selected photo.`}</BulkT></div>)}
      </div>
    </aside>);
}
