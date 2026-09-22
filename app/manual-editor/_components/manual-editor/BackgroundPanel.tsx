"use client";

import { Check, Eraser, Loader2, Palette } from "lucide-react";
import { BACKGROUNDS } from "./constants";
import { useManualEditor } from "./EditorProvider";

export default function BackgroundPanel() {
  const {
    selectedBg,
    setSelectedBg,
    customBg,
    setCustomBg,
    handleRemoveBackground,
    isRemovingBackground,
    backgroundRemoved,
    setBackgroundRemoved,
  } = useManualEditor();

  const handlePresetBackground = (backgroundId: string) => {
    setSelectedBg(backgroundId);
    setBackgroundRemoved(false);
  };

  const handleCustomBackground = () => {
    setSelectedBg("custom");
    setBackgroundRemoved(false);
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3.5 bg-amber-500 rounded-full" />

        <span className="text-xs font-black tracking-wider uppercase">
          BACKGROUND
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {/* -------------------------------------------------------------- */}
        {/* Preset backgrounds                                              */}
        {/* -------------------------------------------------------------- */}
        {BACKGROUNDS.map((bg) => {
          const selected = !backgroundRemoved && selectedBg === bg.id;

          return (
            <button
              key={bg.id}
              type="button"
              disabled={isRemovingBackground}
              aria-label={`Select ${bg.id} background`}
              onClick={() => handlePresetBackground(bg.id)}
              className={`group relative h-11 rounded-2xl border transition-all duration-200 shadow-sm hover:scale-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "ring-2 ring-amber-400 ring-offset-1"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{
                backgroundColor: bg.color,
              }}
            >
              {selected && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/85 shadow-sm">
                    <Check
                      size={12}
                      strokeWidth={3}
                      className="text-gray-700"
                    />
                  </span>
                </span>
              )}
            </button>
          );
        })}

        {/* -------------------------------------------------------------- */}
        {/* Custom color                                                    */}
        {/* -------------------------------------------------------------- */}
        <button
          type="button"
          disabled={isRemovingBackground}
          aria-label="Use custom background color"
          onClick={handleCustomBackground}
          className={`relative h-11 rounded-2xl border flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
            !backgroundRemoved && selectedBg === "custom"
              ? "ring-2 ring-amber-400 ring-offset-1"
              : "border-gray-200 hover:border-gray-300"
          }`}
          style={{
            backgroundColor: customBg,
          }}
          title="Custom color"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm">
            <Palette size={17} className="text-indigo-500 drop-shadow" />
          </span>

          {!backgroundRemoved && selectedBg === "custom" && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
              <Check size={10} strokeWidth={3} className="text-gray-700" />
            </span>
          )}
        </button>

        {/* -------------------------------------------------------------- */}
        {/* Native color picker                                             */}
        {/* -------------------------------------------------------------- */}
        <label
          className={`h-11 rounded-2xl border border-dashed border-gray-300 text-gray-400 flex items-center justify-center text-lg font-bold cursor-pointer transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-600 ${
            isRemovingBackground ? "pointer-events-none opacity-50" : ""
          }`}
          title="Choose custom color"
        >
          +
          <input
            type="color"
            value={customBg}
            disabled={isRemovingBackground}
            onChange={(event) => {
              setCustomBg(event.target.value);
              setSelectedBg("custom");
              setBackgroundRemoved(false);
            }}
            className="hidden"
          />
        </label>

        {/* -------------------------------------------------------------- */}
        {/* Remove Background                                               */}
        {/* -------------------------------------------------------------- */}
        <button
          type="button"
          disabled={isRemovingBackground}
          onClick={() => void handleRemoveBackground()}
          aria-label="Remove background"
          title={
            isRemovingBackground
              ? "Removing background..."
              : "Remove background"
          }
          className={`col-span-2 h-11 rounded-2xl border px-3 flex items-center justify-center gap-2 text-[10px] font-black transition-all duration-200 shadow-sm active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed ${
            backgroundRemoved
              ? "border-emerald-400 bg-emerald-500 text-white hover:bg-emerald-600"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-md"
          }`}
        >
          {isRemovingBackground ? (
            <>
              <Loader2 size={14} className="animate-spin" />

              <span className="whitespace-nowrap">Removing...</span>
            </>
          ) : (
            <>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-lg shadow-sm ${
                  backgroundRemoved ? "bg-white/20" : "bg-white"
                }`}
              >
                {backgroundRemoved ? (
                  <Check size={14} strokeWidth={3} className="text-white" />
                ) : (
                  <Eraser
                    size={14}
                    strokeWidth={2.3}
                    className="text-emerald-600"
                  />
                )}
              </span>

              <span className="whitespace-nowrap">
                {backgroundRemoved ? "BG Removed" : "Remove BG"}
              </span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
