"use client";
import { AiT, useAiEditorText } from "./aiEditorI18n";
import React, { useMemo, useState } from "react";
import { X, RotateCcw, Sliders, Sparkles, Crop } from "lucide-react";
export interface FilterState {
    brightness: number;
    contrast: number;
    saturate: number;
    blur: number;
    grayscale: number;
    sepia: number;
}
export interface AspectRatioOption {
    label: string;
    value: string;
    ratio?: number;
}
interface ImageEditSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    selectedAspect?: string;
    setSelectedAspect?: (aspect: string) => void;
    onReset: () => void;
    /** Render as a normal in-flow block (dropdown inside a panel) instead of the absolute side drawer. */
    inline?: boolean;
    /** Values "Reset All" restores. Defaults to DEFAULT_FILTERS. */
    resetFilters?: FilterState;
}
export const DEFAULT_FILTERS: FilterState = {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    blur: 0,
    grayscale: 0,
    sepia: 0,
};
export function filterString(filters: FilterState) {
    return [
        `brightness(${filters.brightness}%)`,
        `contrast(${filters.contrast}%)`,
        `saturate(${filters.saturate}%)`,
        `blur(${filters.blur}px)`,
        `grayscale(${filters.grayscale}%)`,
        `sepia(${filters.sepia}%)`,
    ].join(" ");
}
export function isNeutralFilters(filters: FilterState) {
    return (Object.keys(DEFAULT_FILTERS) as (keyof FilterState)[]).every((key) => filters[key] === DEFAULT_FILTERS[key]);
}
/** Slightly brighter starting point for a freshly generated photo. The user can change it freely. */
export const RESULT_DEFAULT_FILTERS: FilterState = { ...DEFAULT_FILTERS, brightness: 108 };
export const PRESETS: {
    name: string;
    filters: FilterState;
}[] = [
    { name: "Normal", filters: DEFAULT_FILTERS },
    {
        name: "Vivid",
        filters: {
            brightness: 105,
            contrast: 120,
            saturate: 140,
            blur: 0,
            grayscale: 0,
            sepia: 0,
        },
    },
    {
        name: "Vintage",
        filters: {
            brightness: 90,
            contrast: 90,
            saturate: 85,
            blur: 0,
            grayscale: 0,
            sepia: 40,
        },
    },
    {
        name: "B & W",
        filters: {
            brightness: 105,
            contrast: 120,
            saturate: 0,
            blur: 0,
            grayscale: 100,
            sepia: 0,
        },
    },
    {
        name: "Soft Glow",
        filters: {
            brightness: 110,
            contrast: 95,
            saturate: 110,
            blur: 1,
            grayscale: 0,
            sepia: 10,
        },
    },
    {
        name: "Warm",
        filters: {
            brightness: 100,
            contrast: 105,
            saturate: 115,
            blur: 0,
            grayscale: 0,
            sepia: 20,
        },
    },
];
export const ASPECT_RATIOS: AspectRatioOption[] = [
    { label: "Original", value: "original" },
    { label: "1:1 Square", value: "1/1", ratio: 1 },
    { label: "4:3 Standard", value: "4/3", ratio: 4 / 3 },
    { label: "3:4 Portrait", value: "3/4", ratio: 3 / 4 },
    { label: "16:9 Wide", value: "16/9", ratio: 16 / 9 },
    { label: "Passport (45:55)", value: "45/55", ratio: 45 / 55 },
];
const CONTROLS = [
    { label: "Brightness", key: "brightness", min: 0, max: 200, unit: "%" },
    { label: "Contrast", key: "contrast", min: 0, max: 200, unit: "%" },
    { label: "Saturation", key: "saturate", min: 0, max: 200, unit: "%" },
    { label: "Blur", key: "blur", min: 0, max: 10, unit: "px" },
    { label: "Grayscale", key: "grayscale", min: 0, max: 100, unit: "%" },
    { label: "Sepia", key: "sepia", min: 0, max: 100, unit: "%" },
] as const;
export default function ImageEditSidebar({
    isOpen, onClose, filters, setFilters, selectedAspect = "original", setSelectedAspect, onReset, inline = false, resetFilters,
}: ImageEditSidebarProps) {
    const { t } = useAiEditorText();
    const [activeTab, setActiveTab] = useState<"adjust" | "crop">("adjust");
    const activePreset = useMemo(() => PRESETS.find((preset) => (Object.keys(preset.filters) as (keyof FilterState)[]).every((key) => filters[key] === preset.filters[key]))?.name, [filters]);
    if (!isOpen)
        return null;
    const handleChange = (key: keyof FilterState, value: number) => {
        setFilters((previous) => ({ ...previous, [key]: value }));
    };
    const handleReset = () => {
        setFilters(resetFilters ?? DEFAULT_FILTERS);
        onReset();
    };
    if (inline) {
        return (<div className="rounded-xl bg-[#3B2F1E] text-white px-3.5 py-3 shadow-inner" role="group" aria-label={t("Image editing tools")}>
        <span className="text-[13px] font-medium text-stone-300 block mb-2"><AiT>{"Manual Controls"}</AiT></span>
        <div className="space-y-2">
          {CONTROLS.map((control) => (<label key={control.key} className="block">
              <div className="flex justify-between text-[13px] leading-tight text-stone-300 mb-1">
                <span><AiT>{control.label}</AiT></span>
                <span className="font-mono text-stone-400 tabular-nums">
                  {filters[control.key]}
                  {control.unit}
                </span>
              </div>
              <input type="range" min={control.min} max={control.max} step={control.key === "blur" ? 0.5 : 1} value={filters[control.key]} onChange={(event) => handleChange(control.key, Number(event.target.value))} className="block w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#DC2626]"/>
            </label>))}
        </div>
        <button type="button" onClick={handleReset} className="mt-3 w-full bg-white/10 hover:bg-white/20 text-[13px] py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer">
          <RotateCcw size={13}/><AiT>{"Reset All"}</AiT>
        </button>
      </div>);
    }
    return (<aside className="absolute right-0 top-0 bottom-0 w-[min(320px,88vw)] bg-[#3B2F1E]/95 backdrop-blur-md border-l border-stone-700 text-white p-5 flex flex-col z-20 shadow-2xl" aria-label={t("Image editing tools")}>
      <div className="overflow-y-auto pr-1">
        <div className="flex items-center justify-between border-b border-stone-700 pb-3 mb-4">
          <div className="flex gap-2 bg-stone-800/80 p-1 rounded-lg">
            <button type="button" onClick={() => setActiveTab("adjust")} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition cursor-pointer ${activeTab === "adjust"
            ? "bg-[#DC2626] text-white"
            : "text-stone-400 hover:text-white"}`}>
              <Sliders size={14}/><AiT>{"Adjustments\r\n            "}</AiT></button>
            <button type="button" onClick={() => setActiveTab("crop")} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition cursor-pointer ${activeTab === "crop"
            ? "bg-[#DC2626] text-white"
            : "text-stone-400 hover:text-white"}`}>
              <Crop size={14}/><AiT>{"Aspect Ratio\r\n            "}</AiT></button>
          </div>
          <button type="button" onClick={onClose} aria-label={t("Close image editor")} className="text-stone-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition cursor-pointer">
            <X size={18}/>
          </button>
        </div>

        {activeTab === "adjust" ? (<>
            <div className="mb-5">
              <div className="flex items-center gap-1.5 text-sm font-medium text-stone-300 mb-2.5">
                <Sparkles size={14} className="text-[#10B981]"/>
                <span><AiT>{"Quick Presets"}</AiT></span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((preset) => {
                const active = activePreset === preset.name;
                return (<button key={preset.name} type="button" onClick={() => setFilters(preset.filters)} className={`text-sm py-2 px-1 rounded-lg border transition cursor-pointer font-medium text-center truncate ${active
                        ? "bg-[#DC2626]/20 border-[#DC2626] text-[#DC2626]"
                        : "bg-white/5 border-stone-700 text-stone-300 hover:bg-white/10 hover:border-stone-600"}`}>
                      {preset.name}
                    </button>);
            })}
              </div>
            </div>

            <div className="border-t border-stone-700/80 pt-4 mb-2">
              <span className="text-sm font-medium text-stone-300 block mb-3"><AiT>{"Manual Controls\r\n              "}</AiT></span>
              <div className="space-y-4">
                {CONTROLS.map((control) => (<label key={control.key} className="block space-y-1.5">
                    <div className="flex justify-between text-sm text-stone-300">
                      <span><AiT>{control.label}</AiT></span>
                      <span className="font-mono text-stone-400">
                        {filters[control.key]}
                        {control.unit}
                      </span>
                    </div>
                    <input type="range" min={control.min} max={control.max} step={control.key === "blur" ? 0.5 : 1} value={filters[control.key]} onChange={(event) => handleChange(control.key, Number(event.target.value))} className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#DC2626]"/>
                  </label>))}
              </div>
            </div>
          </>) : (<div className="space-y-3 pt-2">
            <span className="text-sm font-medium text-stone-300 block mb-2"><AiT>{"Select Aspect Ratio Crop\r\n            "}</AiT></span>
            <div className="grid grid-cols-2 gap-2.5">
              {ASPECT_RATIOS.map((item) => {
                const selected = selectedAspect === item.value;
                return (<button key={item.value} type="button" onClick={() => setSelectedAspect?.(item.value)} className={`p-3 rounded-xl border text-sm font-medium flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${selected
                        ? "bg-[#DC2626]/20 border-[#DC2626] text-[#DC2626]"
                        : "bg-white/5 border-stone-700 text-stone-300 hover:bg-white/10 hover:border-stone-600"}`}>
                    <Crop size={16} className={selected ? "text-[#DC2626]" : "text-stone-400"}/>
                    <span><AiT>{item.label}</AiT></span>
                  </button>);
            })}
            </div>
          </div>)}
      </div>

      <div className="pt-4 border-t border-stone-700 flex gap-2">
        <button type="button" onClick={handleReset} className="flex-1 bg-white/10 hover:bg-white/20 text-sm py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer">
          <RotateCcw size={14}/><AiT>{"Reset All\r\n        "}</AiT></button>
      </div>
    </aside>);
}
