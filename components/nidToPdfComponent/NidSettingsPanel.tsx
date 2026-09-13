"use client";

import React from "react";
import {
  RotateCw,
  Wand2,
  Sparkles,
  Palette,
  Contrast,
  Printer,
} from "lucide-react";

interface NidSettingsPanelProps {
  autoCrop: boolean;
  setAutoCrop: (val: boolean) => void;
  orientation: "portrait" | "landscape";
  setOrientation: (val: "portrait" | "landscape") => void;
  layout: "side-by-side" | "stacked";
  setLayout: (val: "side-by-side" | "stacked") => void;
  rotation: number;
  setRotation: React.Dispatch<React.SetStateAction<number>>;
  position: "top" | "center" | "bottom";
  setPosition: (val: "top" | "center" | "bottom") => void;
  copies: number;
  setCopies: React.Dispatch<React.SetStateAction<number>>;
  roundedCorners: boolean;
  setRoundedCorners: (val: boolean) => void;
  filterPreset: "plain" | "color" | "scan" | "bw";
  setFilterPreset: (val: "plain" | "color" | "scan" | "bw") => void;
  shadowRemoval: number;
  setShadowRemoval: (val: number) => void;
  blackBoost: number;
  setBlackBoost: (val: number) => void;
  saturation: number;
  setSaturation: (val: number) => void;
  textDeepen: number;
  setTextDeepen: (val: number) => void;
  handlePrint: () => void;
}

export default function NidSettingsPanel({
  autoCrop,
  setAutoCrop,
  orientation,
  setOrientation,
  layout,
  setLayout,
  rotation,
  setRotation,
  position,
  setPosition,
  copies,
  setCopies,
  roundedCorners,
  setRoundedCorners,
  filterPreset,
  setFilterPreset,
  shadowRemoval,
  setShadowRemoval,
  blackBoost,
  setBlackBoost,
  saturation,
  setSaturation,
  textDeepen,
  setTextDeepen,
  handlePrint,
}: NidSettingsPanelProps) {
  return (
    <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4">
      <h2 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
        Settings
      </h2>

      {/* Auto crop Toggle */}
      <div className="flex items-center justify-between bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
        <span className="text-xs font-bold text-gray-700">Auto crop</span>
        <button
          onClick={() => setAutoCrop(!autoCrop)}
          className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
            autoCrop ? "bg-amber-500 justify-end" : "bg-gray-300 justify-start"
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-white shadow-md" />
        </button>
      </div>

      {/* Page settings */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] font-bold text-gray-600">
          <span>Page settings</span>
          <span className="text-gray-400 text-[10px]">
            {orientation.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
          <button
            onClick={() => setOrientation("portrait")}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all flex justify-center items-center cursor-pointer ${
              orientation === "portrait"
                ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Auto
          </button>
          <button
            onClick={() => setOrientation("portrait")}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all flex justify-center items-center cursor-pointer ${
              orientation === "portrait"
                ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <div className="w-3 h-4 border-2 border-current rounded-xs" />
          </button>
          <button
            onClick={() => setOrientation("landscape")}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all flex justify-center items-center cursor-pointer ${
              orientation === "landscape"
                ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <div className="w-4 h-3 border-2 border-current rounded-xs" />
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] font-bold text-gray-600">
          <span>Layout</span>
          <button
            onClick={() =>
              setLayout(layout === "side-by-side" ? "stacked" : "side-by-side")
            }
            className="text-[10px] text-amber-600 font-bold hover:underline cursor-pointer"
          >
            Switch
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
          <button
            onClick={() => setLayout("side-by-side")}
            className={`py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-1 transition-all cursor-pointer ${
              layout === "side-by-side"
                ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <div className="flex gap-0.5">
              <div className="w-3 h-4 bg-amber-500 rounded-xs" />
              <div className="w-3 h-4 bg-amber-500 rounded-xs" />
            </div>
          </button>
          <button
            onClick={() => setLayout("stacked")}
            className={`py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-1 transition-all cursor-pointer ${
              layout === "stacked"
                ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <div className="flex flex-col gap-0.5">
              <div className="w-5 h-2 bg-amber-500 rounded-xs" />
              <div className="w-5 h-2 bg-amber-500 rounded-xs" />
            </div>
          </button>
        </div>
      </div>

      {/* Rotate */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] font-bold text-gray-600">
          <span>Rotate</span>
          <button
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            className="text-[10px] text-amber-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RotateCw size={10} /> Rotate 90°
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 text-xs font-bold text-gray-600">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              onClick={() => setRotation(deg)}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                rotation === deg
                  ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                  : "hover:bg-white/50"
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>

      {/* Position on page */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-gray-600 block">
          Position on page
        </span>
        <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100 text-xs font-bold text-gray-600">
          {(["top", "center", "bottom"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => setPosition(pos)}
              className={`py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                position === pos
                  ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                  : "hover:bg-white/50"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Copies */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-gray-600 block">
          Copies
        </span>
        <div className="grid grid-cols-4 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 text-xs font-bold text-gray-600">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => setCopies(num)}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                copies === num
                  ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                  : "hover:bg-white/50"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Rounded corners */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-xs font-bold text-gray-700 block">
            Rounded corners (14px)
          </span>
        </div>
        <button
          onClick={() => setRoundedCorners(!roundedCorners)}
          className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
            roundedCorners
              ? "bg-amber-500 justify-end"
              : "bg-gray-300 justify-start"
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-white shadow-md" />
        </button>
      </div>

      {/* Cleanup style Controls */}
      <div className="space-y-4 border-t border-gray-100 pt-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-900">Cleanup style</span>
          <button
            onClick={() => {
              setFilterPreset("plain");
              setShadowRemoval(0);
              setBlackBoost(0);
              setSaturation(0);
              setTextDeepen(0);
            }}
            className="text-xs text-amber-500 font-bold hover:underline cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* Preset Grid */}
        <div className="bg-gray-100/70 p-2 rounded-2xl grid grid-cols-2 gap-2">
          {[
            { id: "plain", label: "Plain clean", icon: Wand2 },
            { id: "color", label: "Colour clean", icon: Sparkles },
            { id: "scan", label: "Colour scan", icon: Palette },
            { id: "bw", label: "Black & white", icon: Contrast },
          ].map((preset) => {
            const Icon = preset.icon;
            const isActive = filterPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setFilterPreset(preset.id as any);
                  if (preset.id === "plain") {
                    setShadowRemoval(0);
                    setBlackBoost(0);
                    setSaturation(0);
                    setTextDeepen(0);
                  } else if (preset.id === "color") {
                    setShadowRemoval(20);
                    setBlackBoost(10);
                    setSaturation(30);
                    setTextDeepen(10);
                  } else if (preset.id === "scan") {
                    setShadowRemoval(40);
                    setBlackBoost(30);
                    setSaturation(50);
                    setTextDeepen(30);
                  } else if (preset.id === "bw") {
                    setShadowRemoval(60);
                    setBlackBoost(50);
                    setSaturation(0);
                    setTextDeepen(50);
                  }
                }}
                className={`py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-amber-500 shadow-xs border border-gray-200/80 font-semibold"
                    : "text-gray-600 hover:bg-white/60"
                }`}
              >
                <Icon
                  size={16}
                  className={isActive ? "text-amber-500" : "text-gray-600"}
                />
                <span className="text-[11px] font-semibold text-center leading-tight">
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Fine tuning */}
        <div className="space-y-3 pt-1 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-900 block">
            Fine tuning
          </span>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-700">
                <span>Remove shadows and stains</span>
                <span className="w-4 h-4 rounded bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-[10px] font-bold">
                  {shadowRemoval}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={shadowRemoval}
                onChange={(e) => setShadowRemoval(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-700">
                <span>Increase blacks</span>
                <span className="w-4 h-4 rounded bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-[10px] font-bold">
                  {blackBoost}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={blackBoost}
                onChange={(e) => setBlackBoost(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-700">
                <span>Colour intensity</span>
                <span className="w-4 h-4 rounded bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-[10px] font-bold">
                  {saturation}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-700">
                <span>Deepen text</span>
                <span className="w-4 h-4 rounded bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-[10px] font-bold">
                  {textDeepen}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={textDeepen}
                onChange={(e) => setTextDeepen(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="w-full py-2.5 border border-sky-400/80 text-sky-600 hover:bg-sky-50 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Printer size={14} />
          <span>Print</span>
        </button>
      </div>
    </div>
  );
}
