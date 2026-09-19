"use client";

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
}

export const DEFAULT_FILTERS: FilterState = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
};

export const PRESETS: { name: string; filters: FilterState }[] = [
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
  isOpen,
  onClose,
  filters,
  setFilters,
  selectedAspect = "original",
  setSelectedAspect,
  onReset,
}: ImageEditSidebarProps) {
  const [activeTab, setActiveTab] = useState<"adjust" | "crop">("adjust");

  const activePreset = useMemo(
    () =>
      PRESETS.find((preset) =>
        (Object.keys(preset.filters) as (keyof FilterState)[]).every(
          (key) => filters[key] === preset.filters[key],
        ),
      )?.name,
    [filters],
  );

  if (!isOpen) return null;

  const handleChange = (key: keyof FilterState, value: number) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    onReset();
  };

  return (
    <aside
      className="absolute right-0 top-0 bottom-0 w-[min(320px,88vw)] bg-[#1f2937]/95 backdrop-blur-md border-l border-gray-700 text-white p-5 flex flex-col z-20 shadow-2xl"
      aria-label="Image editing tools"
    >
      <div className="overflow-y-auto pr-1">
        <div className="flex items-center justify-between border-b border-gray-700 pb-3 mb-4">
          <div className="flex gap-2 bg-gray-800/80 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("adjust")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === "adjust"
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Sliders size={14} /> Adjustments
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("crop")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === "crop"
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Crop size={14} /> Aspect Ratio
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image editor"
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {activeTab === "adjust" ? (
          <>
            <div className="mb-5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-2.5">
                <Sparkles size={14} className="text-orange-400" />
                <span>Quick Presets</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((preset) => {
                  const active = activePreset === preset.name;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setFilters(preset.filters)}
                      className={`text-xs py-2 px-1 rounded-lg border transition cursor-pointer font-medium text-center truncate ${
                        active
                          ? "bg-orange-500/20 border-orange-500 text-orange-400"
                          : "bg-white/5 border-gray-700 text-gray-300 hover:bg-white/10 hover:border-gray-600"
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-700/80 pt-4 mb-2">
              <span className="text-xs font-medium text-gray-300 block mb-3">
                Manual Controls
              </span>
              <div className="space-y-4">
                {CONTROLS.map((control) => (
                  <label key={control.key} className="block space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>{control.label}</span>
                      <span className="font-mono text-gray-400">
                        {filters[control.key]}
                        {control.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={control.key === "blur" ? 0.5 : 1}
                      value={filters[control.key]}
                      onChange={(event) =>
                        handleChange(control.key, Number(event.target.value))
                      }
                      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-medium text-gray-300 block mb-2">
              Select Aspect Ratio Crop
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {ASPECT_RATIOS.map((item) => {
                const selected = selectedAspect === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedAspect?.(item.value)}
                    className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                      selected
                        ? "bg-orange-500/20 border-orange-500 text-orange-400"
                        : "bg-white/5 border-gray-700 text-gray-300 hover:bg-white/10 hover:border-gray-600"
                    }`}
                  >
                    <Crop
                      size={16}
                      className={selected ? "text-orange-400" : "text-gray-400"}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-700 flex gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 bg-white/10 hover:bg-white/20 text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw size={14} /> Reset All
        </button>
      </div>
    </aside>
  );
}
