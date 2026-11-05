import { BulkT } from "./bulkPhotoI18n";
import { Check, ChevronLeft, ChevronRight, Circle, Copy, Sparkles, X } from "lucide-react";
import { TOOL_PRESETS } from "./toolCatalog";
import type { ApplyMode, PhotoItem, SelectedTools } from "./types";
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
    applyMode: ApplyMode;
    onApplyModeChange: (mode: ApplyMode) => void;
    photos: PhotoItem[];
    activePhotoId: string | null;
    activeIndex: number;
    photoToolCounts: Record<string, number>;
    photosWithTools: number;
    toolsReady: boolean;
    onSelectPhoto: (id: string) => void;
    onGoToPhoto: (offset: number) => void;
    onCopyToAll: () => void;
    onOpenGuide: () => void;
}

export default function PresetPanel({ selectedTools, expandedPreset, onTogglePreset, onToggleTool, onClearPreset, onCloseDropdown, photosCount, onEnhance, isProcessing, processedCount, applyMode, onApplyModeChange, photos, activePhotoId, activeIndex, photoToolCounts, photosWithTools, toolsReady, onSelectPhoto, onGoToPhoto, onCopyToAll, onOpenGuide, }: PresetPanelProps) {
    const selectedGroups = TOOL_PRESETS.map((preset) => ({
        preset,
        tools: preset.tools.filter((tool) => (selectedTools[preset.name] ?? []).includes(tool.name)),
    })).filter((group) => group.tools.length > 0);
    const selectedTotal = selectedGroups.reduce((sum, group) => sum + group.tools.length, 0);
    const hasEnoughPhotos = photosCount >= 2;
    const eachMode = applyMode === "each";
    const hasTools = toolsReady;
    const canEnhance = hasEnoughPhotos && hasTools && !isProcessing;
    const activePhoto = photos.find((photo) => photo.id === activePhotoId) ?? photos[0] ?? null;
    const isLastPhoto = activeIndex >= photos.length - 1;
    const activeHasTools = selectedTotal > 0;

    const clearAllTools = () => {
        TOOL_PRESETS.forEach((preset) => onClearPreset(preset.name));
    };
    const selectAllInPreset = (presetName: string) => {
        const preset = TOOL_PRESETS.find((item) => item.name === presetName);
        if (!preset)
            return;
        const current = selectedTools[presetName] ?? [];
        preset.tools.forEach((tool) => {
            if (!current.includes(tool.name))
                onToggleTool(presetName, tool.name);
        });
    };

    return (<aside className="order-2 flex w-full shrink-0 flex-col rounded-2xl bg-[#F2E8D2] p-4 text-[#3B2F1E] shadow-sm lg:w-auto lg:min-w-[360px] lg:flex-[1.3] xl:order-3 xl:min-h-0 xl:w-[400px] xl:flex-none">
      <div className="mb-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DC2626] text-[13px] font-extrabold text-white shadow-sm">2</span>
            <h2 className="text-[17px] font-bold leading-tight"><BulkT>{"Choose AI tools"}</BulkT></h2>
          </div>

          <span className="shrink-0 rounded-full border border-[#FBB6B6] bg-[#FEE9E9] px-2.5 py-0.5 text-[12.5px] font-bold text-[#B91C1C]">
            <BulkT>{`${selectedTotal} selected`}</BulkT></span>
        </div>
        <p className="mt-1.5 text-[13px] leading-[1.55] text-[#6B5A40]"><BulkT>{eachMode ? "Go photo by photo and choose exactly what to apply to each one." : "Open a group, choose exact AI operations, then apply that same operation set to every photo separately."}</BulkT></p>

        <button type="button" onClick={onOpenGuide} disabled={isProcessing || photosCount < 2} className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#059669] bg-[#ECFDF5] px-3 py-2 text-[14.5px] font-extrabold text-[#065F46] transition hover:bg-[#D1FAE5] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]/40"><Sparkles size={16}/><BulkT>{"Guide me step by step"}</BulkT></button>

        <div role="radiogroup" aria-label="Apply mode" className="mt-2.5 grid grid-cols-2 gap-1 rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] p-1">
          {([["all", "Same for all photos"], ["each", "Different for each photo"]] as const).map(([mode, label]) => (<button key={mode} type="button" role="radio" aria-checked={applyMode === mode} onClick={() => onApplyModeChange(mode)} disabled={isProcessing} className={`cursor-pointer rounded-lg px-2 py-1.5 text-[13px] font-bold leading-tight transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${applyMode === mode ? "bg-[#DC2626] text-white shadow-sm" : "text-[#5A4A32] hover:bg-[#EFE3C8]"}`}><BulkT>{label}</BulkT></button>))}
        </div>

        {eachMode && activePhoto && (<div className="mt-2.5 rounded-2xl border border-[#DC2626]/40 bg-[#FBF6E8] p-2.5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <img src={activePhoto.preview} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-[#E3D6B8] object-cover"/>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold uppercase tracking-wide text-[#DC2626]"><BulkT>{`Photo ${activeIndex + 1}`}</BulkT> <span className="text-[#6B5A40]">/ {photos.length}</span></p>
                <p className="text-[14px] font-bold leading-snug text-[#3B2F1E]"><BulkT>{"What should we apply to this photo?"}</BulkT></p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => onGoToPhoto(-1)} disabled={activeIndex <= 0 || isProcessing} aria-label="Previous photo" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#E3D6B8] bg-[#F6EEDB] text-[#5A4A32] transition hover:bg-[#EFE3C8] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"><ChevronLeft size={16}/></button>
                <button type="button" onClick={() => onGoToPhoto(1)} disabled={isLastPhoto || isProcessing} aria-label="Next photo" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#E3D6B8] bg-[#F6EEDB] text-[#5A4A32] transition hover:bg-[#EFE3C8] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"><ChevronRight size={16}/></button>
              </div>
            </div>

            <div className="scroll mt-2 flex gap-1.5 overflow-x-auto pb-1">
              {photos.map((photo, index) => {
                const count = photoToolCounts[photo.id] ?? 0;
                const isActive = photo.id === activePhoto.id;
                return (<button key={photo.id} type="button" onClick={() => onSelectPhoto(photo.id)} disabled={isProcessing} aria-label={`Photo ${index + 1}`} aria-current={isActive} className={`relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-md border transition disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${isActive ? "border-[#DC2626] ring-2 ring-[#DC2626]/40" : "border-[#E3D6B8] opacity-80 hover:opacity-100"}`}>
                    <img src={photo.preview} alt="" className="h-full w-full object-cover"/>
                    <span className={`absolute bottom-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-tl-md px-0.5 text-[10px] font-extrabold text-white ${count > 0 ? "bg-emerald-600" : "bg-amber-600"}`}>{count > 0 ? count : "!"}</span>
                  </button>);
              })}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12.5px] font-semibold text-[#6B5A40]"><BulkT>{`${photosWithTools}/${photos.length} photos ready`}</BulkT></p>
              <div className="flex items-center gap-1.5">
                {activeHasTools && photos.length > 1 && (<button type="button" onClick={onCopyToAll} disabled={isProcessing} className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#E3D6B8] bg-[#F6EEDB] px-2 py-1 text-[12.5px] font-bold text-[#5A4A32] transition hover:bg-[#EFE3C8] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"><Copy size={12}/><BulkT>{"Copy to all photos"}</BulkT></button>)}
                {!isLastPhoto && (<button type="button" onClick={() => onGoToPhoto(1)} disabled={!activeHasTools || isProcessing} className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#DC2626] px-2.5 py-1 text-[12.5px] font-bold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"><BulkT>{"Next photo"}</BulkT><ChevronRight size={13}/></button>)}
              </div>
            </div>
          </div>)}
      </div>

      <div className="scroll max-h-[520px] min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 xl:max-h-none">
        {TOOL_PRESETS.map((preset) => {
            const selected = selectedTools[preset.name] || [];
            const expanded = expandedPreset === preset.id;
            return (<div key={preset.id} className={`overflow-hidden rounded-2xl border bg-[#FBF6E8] shadow-sm transition duration-200 ${expanded || selected.length > 0 ? "border-[#DC2626]/60" : "border-[#E3D6B8]"}`}>
              <PresetCard preset={preset} selectedTools={selected} expanded={expanded} onClick={() => onTogglePreset(preset.id)}/>

              <ToolDropdown preset={preset} open={expanded} selectedTools={selected} onToggleTool={(toolName) => onToggleTool(preset.name, toolName)} onSelectAll={() => selectAllInPreset(preset.name)} onClear={() => onClearPreset(preset.name)} onDone={onCloseDropdown}/>
            </div>);
        })}
      </div>

      <div className="mt-3 shrink-0 border-t border-[#D8C9A6] pt-3">
        <div className="mb-2 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DC2626] text-[13px] font-extrabold text-white shadow-sm">3</span>
          <h2 className="text-[17px] font-bold leading-tight"><BulkT>{"Start & download"}</BulkT></h2>
        </div>

        {selectedTotal > 0 && (<div className="mb-2.5 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-2">
            <div className="mb-1.5 flex items-center justify-between px-1">
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#6B5A40]"><BulkT>{eachMode ? `Photo ${activeIndex + 1} AI operations` : "Selected AI operations"}</BulkT></p>
              <button type="button" onClick={clearAllTools} disabled={isProcessing} className="cursor-pointer rounded-md px-1.5 py-0.5 text-[12.5px] font-semibold text-[#B91C1C] transition hover:bg-[#FEE9E9] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"><BulkT>{"Clear all"}</BulkT></button>
            </div>
            <div className="scroll flex max-h-[68px] flex-wrap gap-1 overflow-y-auto pr-1">
              {selectedGroups.flatMap((group) => group.tools.map((tool) => (<span key={`${group.preset.id}-${tool.name}`} className="inline-flex items-center gap-1 rounded-full border border-[#FBB6B6] bg-[#FEF1E0] py-0.5 pl-2.5 pr-1 text-[12.5px] font-semibold text-[#B91C1C]">
                  <BulkT>{tool.name}</BulkT>
                  <button type="button" onClick={() => onToggleTool(group.preset.name, tool.name)} disabled={isProcessing} aria-label={tool.name} className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-[#B91C1C] transition hover:bg-[#DC2626] hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
                    <X size={10} strokeWidth={3}/>
                  </button>
                </span>)))}
            </div>
          </div>)}

        <ul className="mb-2.5 space-y-1 text-[13px] font-medium">
          <li className={`flex items-center gap-2 ${hasEnoughPhotos ? "text-emerald-700" : "text-[#6B5A40]"}`}>
            {hasEnoughPhotos ? <Check size={14} strokeWidth={3}/> : <Circle size={14}/>}
            <BulkT>{"At least 2 photos added"}</BulkT>
          </li>
          <li className={`flex items-center gap-2 ${hasTools ? "text-emerald-700" : "text-[#6B5A40]"}`}>
            {hasTools ? <Check size={14} strokeWidth={3}/> : <Circle size={14}/>}
            <BulkT>{eachMode ? `Every photo has at least 1 tool (${photosWithTools}/${photos.length})` : "At least 1 AI tool selected"}</BulkT>
          </li>
        </ul>

        {isProcessing && (<div className="mb-2.5 rounded-xl border border-[#FBB6B6] bg-[#FEE9E9] px-3 py-2 text-[13px] font-medium leading-[1.55] text-[#B91C1C]"><BulkT>{`Processing photo ${Math.min(processedCount + 1, Math.max(photosCount, 1))} of ${photosCount}. Keep this tab open until the batch finishes.`}</BulkT></div>)}

        <button type="button" onClick={onEnhance} disabled={!canEnhance} className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E53935] to-[#C81D1D] px-4 text-[16px] font-bold text-white shadow-md transition duration-200 ease-out hover:from-[#D42020] hover:to-[#AE1717] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F2E8D2]">
          <Sparkles size={18}/>
          {isProcessing
        ? <BulkT>{`Processing ${processedCount}/${photosCount}`}</BulkT> : <BulkT>{`Enhance ${photosCount} photos`}</BulkT>}
        </button>
      </div>
    </aside>);
}
