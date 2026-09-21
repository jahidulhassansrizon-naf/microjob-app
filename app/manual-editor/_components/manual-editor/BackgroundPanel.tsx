"use client";
import { Check, Palette } from "lucide-react";
import { BACKGROUNDS } from "./constants";
import { useManualEditor } from "./EditorProvider";

export default function BackgroundPanel() {
  const { selectedBg, setSelectedBg, customBg, setCustomBg } =
    useManualEditor();
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
        <span className="text-xs font-black tracking-wider uppercase">
          BACKGROUND
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {BACKGROUNDS.map((bg) => (
          <button
            key={bg.id}
            type="button"
            onClick={() => setSelectedBg(bg.id)}
            className={`h-11 rounded-2xl border transition relative shadow-sm hover:scale-105 ${selectedBg === bg.id ? "ring-2 ring-amber-400" : "border-gray-200"}`}
            style={{ backgroundColor: bg.color }}
          >
            {selectedBg === bg.id && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Check size={12} strokeWidth={3} className="text-gray-700" />
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSelectedBg("custom")}
          className={`h-11 rounded-2xl border flex items-center justify-center ${selectedBg === "custom" ? "ring-2 ring-amber-400" : "border-gray-200"}`}
          style={{ backgroundColor: customBg }}
        >
          <Palette size={18} className="text-indigo-500 drop-shadow" />
        </button>
        <label className="h-11 rounded-2xl border border-dashed border-gray-300 text-gray-400 flex items-center justify-center text-lg font-bold cursor-pointer hover:border-gray-400">
          +
          <input
            type="color"
            value={customBg}
            onChange={(e) => {
              setCustomBg(e.target.value);
              setSelectedBg("custom");
            }}
            className="hidden"
          />
        </label>
      </div>
    </section>
  );
}
