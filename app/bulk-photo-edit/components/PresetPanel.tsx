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
    return (<aside className="flex w-full shrink-0 flex-col border-t border-[#E3D6B8] bg-[#F2E8D2] p-4 shadow-sm lg:w-96 lg:border-t-0 lg:border-l">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-[15px] font-bold uppercase tracking-wide text-[#3B2F1E]"><BulkT>{"AI Editing tools\n            "}</BulkT></h4>
            <p className="mt-1 text-[14px] leading-[1.6] text-[#6B5A40]"><BulkT>{"Open a group, choose exact AI operations, then apply that same\n              operation set to every photo separately.\n            "}</BulkT></p>
          </div>

          <span className="shrink-0 rounded-full border border-[#FBB6B6] bg-[#FEE9E9] px-2.5 py-1 text-[12px] font-bold text-[#B91C1C]">
            <BulkT>{`${selectedTotal} selected`}</BulkT></span>
        </div>
      </div>

      <div className="scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {selectedGroups.length > 0 && (<div className="rounded-2xl border border-[#FBB6B6] bg-[#FEE9E9] p-3">
            <div className="flex items-center gap-2">
              <ListChecks size={16} className="text-[#DC2626]"/>
              <p className="text-[15px] font-bold text-[#991B1B]"><BulkT>{"Selected AI operations\n              "}</BulkT></p>
            </div>

            <div className="mt-2 space-y-2">
              {selectedGroups.map((group) => (<div key={group.preset.id}>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[#B91C1C]">
                    <BulkT>{group.preset.name}</BulkT>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {group.tools.map((tool) => (<span key={tool.name} className="rounded-full border border-[#FBB6B6] bg-[#FBF6E8] px-2.5 py-1 text-[13px] font-semibold text-[#B91C1C]">
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

      <div className="mt-4 border-t border-[#D8C9A6] pt-4">
        {photosCount < 2 && (<div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[14px] font-medium leading-[1.6] text-amber-700"><BulkT>{"Add at least 2 photos to enable bulk AI enhancement.\n          "}</BulkT></div>)}

        {photosCount >= 2 && selectedTotal === 0 && (<div className="mb-2 rounded-xl border border-[#FBB6B6] bg-[#FEE9E9] px-3 py-2.5 text-[14px] font-medium leading-[1.6] text-[#B91C1C]"><BulkT>{"Choose one or more AI tools above to prepare this bulk edit.\n          "}</BulkT></div>)}

        {isProcessing && (<div className="mb-2 rounded-xl border border-[#FBB6B6] bg-[#FEE9E9] px-3 py-2.5 text-[14px] font-medium leading-[1.6] text-[#B91C1C]"><BulkT>{`Processing photo ${Math.min(processedCount + 1, Math.max(photosCount, 1))} of ${photosCount}. Keep this tab open until the batch finishes.`}</BulkT></div>)}

        <button type="button" onClick={onEnhance} disabled={!canEnhance} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#D42020] px-4 py-3.5 text-base font-bold text-white shadow-sm transition duration-200 ease-out hover:bg-[#AE1717] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-[#D42020] disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F2E8D2]">
          <Sparkles size={18}/>
          {isProcessing
        ? <BulkT>{`Processing ${processedCount}/${photosCount}`}</BulkT> : <BulkT>{`Enhance ${photosCount} photos`}</BulkT>}
        </button>

        {!isProcessing && canEnhance && (<div className="mt-2 flex items-center justify-center gap-1.5 text-[13px] font-medium text-[#6B5A40]">
            <Check size={13} className="text-[#DC2626]"/>
            <BulkT>{`${selectedTotal} exact AI tools will apply to every selected photo.`}</BulkT></div>)}
      </div>
    </aside>);
}
