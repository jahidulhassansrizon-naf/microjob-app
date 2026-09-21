"use client";
import {
  ChevronDown,
  Image as ImageIcon,
  Maximize2,
  Plane,
  Printer,
  RefreshCcw,
  Users,
} from "lucide-react";
import { R_SIZE_PRESETS, VISA_PRESETS } from "./constants";
import { useManualEditor } from "./EditorProvider";

export default function PhotoSizePanel() {
  const {
    photoMode,
    selectMode,
    sizeMenu,
    setSizeMenu,
    selectedPreset,
    currentPreset,
    selectPreset,
    freeSizeOpen,
    setFreeSizeOpen,
    freeWidth,
    freeHeight,
    setFreeWidth,
    setFreeHeight,
    resetEditor,
  } = useManualEditor();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
          <span className="text-xs font-black tracking-wider uppercase">
            PHOTO SIZE
          </span>
        </div>
        <button
          type="button"
          onClick={resetEditor}
          className="text-gray-400 hover:text-gray-700"
          title="Reset"
        >
          <RefreshCcw size={13} />
        </button>
      </div>
      <div className="grid grid-cols-5 gap-2 relative">
        {[
          {
            id: "passport" as const,
            label: "Passport",
            icon: <ImageIcon className="w-5 h-5 text-gray-400" />,
          },
          {
            id: "dual" as const,
            label: "Dual",
            icon: <Users className="w-5 h-5 text-gray-400" />,
          },
          {
            id: "visa" as const,
            label: "Visa",
            icon: <Plane className="w-5 h-5 text-gray-400" />,
          },
          {
            id: "rsizes" as const,
            label: "R Sizes",
            icon: <Printer className="w-5 h-5 text-gray-400" />,
          },
          {
            id: "freesize" as const,
            label: "Free size",
            icon: <Maximize2 className="w-5 h-5 text-gray-400" />,
          },
        ].map((item) => (
          <div key={item.id} className="relative">
            <button
              type="button"
              onClick={() => {
                selectMode(item.id);
                if (item.id === "freesize") setFreeSizeOpen(true);
              }}
              className={`relative flex w-full flex-col items-center justify-center p-2 rounded-2xl border text-[10px] font-bold transition h-16 ${photoMode === item.id ? "border-amber-400 bg-amber-50/30 ring-1 ring-amber-400" : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <span className="mb-1">{item.icon}</span>
              <span
                className={`truncate w-full text-center text-[9px] font-bold ${photoMode === item.id ? "text-amber-600" : "text-gray-700"}`}
              >
                {item.label}
              </span>
            </button>
            {(item.id === "visa" || item.id === "rsizes") &&
              photoMode === item.id && (
                <button
                  type="button"
                  onClick={() =>
                    setSizeMenu(sizeMenu === item.id ? null : item.id)
                  }
                  className="absolute -right-1 -top-1 rounded-full bg-white border shadow-sm text-gray-500"
                >
                  <ChevronDown size={12} />
                </button>
              )}
          </div>
        ))}
      </div>

      {photoMode === "visa" && sizeMenu === "visa" && (
        <div className="rounded-2xl border border-amber-300 bg-white p-3 shadow-xl">
          <p className="text-[10px] font-black text-gray-700 mb-2">
            Visa Photo Size
          </p>
          <div className="grid grid-cols-2 gap-2">
            {VISA_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset, "visa")}
                className={`rounded-xl border px-2 py-2 text-[9px] font-bold ${selectedPreset?.id === preset.id ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-gray-50"}`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {photoMode === "rsizes" && sizeMenu === "rsizes" && (
        <div className="rounded-2xl border border-amber-300 bg-white p-3 shadow-xl">
          <p className="text-[10px] font-black text-gray-700 mb-2">
            Print / R Size
          </p>
          <div className="grid grid-cols-1 gap-2">
            {R_SIZE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset, "rsizes")}
                className={`rounded-xl border px-2 py-2 text-left text-[9px] font-bold ${selectedPreset?.id === preset.id ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-gray-50"}`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {photoMode === "freesize" && freeSizeOpen && (
        <div className="rounded-2xl border border-amber-300 bg-white p-3 shadow-xl">
          <p className="text-[10px] font-black text-gray-700 mb-2">
            Free Size (mm)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={5}
              max={500}
              value={freeWidth}
              onChange={(e) =>
                setFreeWidth(
                  Math.min(500, Math.max(5, Number(e.target.value) || 5)),
                )
              }
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold outline-none focus:border-amber-400"
            />
            <input
              type="number"
              min={5}
              max={500}
              value={freeHeight}
              onChange={(e) =>
                setFreeHeight(
                  Math.min(500, Math.max(5, Number(e.target.value) || 5)),
                )
              }
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold outline-none focus:border-amber-400"
            />
          </div>
          <div className="mt-2 text-[9px] font-bold text-gray-400">
            Current: {currentPreset.label}
          </div>
          <button
            type="button"
            onClick={() => setFreeSizeOpen(false)}
            className="mt-2 w-full rounded-xl bg-amber-500 px-3 py-2 text-[10px] font-black text-gray-900"
          >
            Apply size
          </button>
        </div>
      )}
    </section>
  );
}
