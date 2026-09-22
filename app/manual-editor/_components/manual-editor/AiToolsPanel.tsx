"use client";

import {
  Eraser,
  Eye,
  FileEdit,
  Grid,
  Loader2,
  Maximize2,
  Plus,
  Redo2,
  RefreshCcw,
  Sparkles,
  Undo2,
  UserCheck,
} from "lucide-react";
import type { ObjectTab } from "./types";
import { useManualEditor } from "./EditorProvider";

export default function AiToolsPanel() {
  const {
    activeAiTool,
    showUnsupportedAiMessage,
    aiNotice,
    objectTab,
    setObjectTab,
    objectBrightness,
    objectContrast,
    shadowStrength,
    brushSize,
    setObjectBrightness,
    setObjectContrast,
    setShadowStrength,
    setBrushSize,
    objectPreview,
    setObjectPreview,
    objectBrushMode,
    setObjectBrushMode,
    objectMaskBusy,
    objectApplyBusy,
    undoObjectMask,
    redoObjectMask,
    resetObjectAdjust,
    cancelObjectAdjust,
    applyObjectAdjust,
  } = useManualEditor();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="h-3.5 w-1 rounded-full bg-amber-500" />
        <span className="text-xs font-black uppercase tracking-wider">
          AI TOOLS
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          {
            id: "face" as const,
            label: "AI Face Enhance",
            icon: <Sparkles className="h-5 w-5 text-gray-400" />,
          },
          {
            id: "object" as const,
            label: "Object Adjust",
            icon: <UserCheck className="h-5 w-5 text-gray-400" />,
          },
          {
            id: "transparent" as const,
            label: "Transparent",
            icon: <Grid className="h-5 w-5 text-gray-400" />,
          },
          {
            id: "upscale" as const,
            label: "Upscale",
            icon: <Maximize2 className="h-5 w-5 text-gray-400" />,
          },
        ].map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => showUnsupportedAiMessage(tool.id)}
            className={`flex h-20 flex-col items-center justify-center gap-1 rounded-2xl border p-2 text-center transition cursor-pointer ${
              activeAiTool === tool.id
                ? "border-amber-400 bg-amber-50/20 ring-1 ring-amber-400"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span>{tool.icon}</span>
            <span className="text-[8px] font-bold leading-tight text-gray-600">
              {tool.label}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => showUnsupportedAiMessage("cutout")}
          className={`flex h-20 flex-col items-center justify-center gap-1 rounded-2xl border bg-white p-2 text-center transition cursor-pointer ${
            activeAiTool === "cutout"
              ? "border-amber-400 bg-amber-50/20 ring-1 ring-amber-400"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <FileEdit className="h-5 w-5 text-gray-400" />
          <span className="text-[8px] font-bold leading-tight text-gray-600">
            Cutout Editor
          </span>
        </button>
      </div>

      {aiNotice && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[9px] leading-4 text-indigo-700">
          {aiNotice}
        </div>
      )}

      {activeAiTool === "object" && (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-2.5">
          <div className="grid grid-cols-2 gap-1.5">
            {[
              ["face", "Face"],
              ["skin", "Skin"],
              ["hair", "Hair"],
              ["shadow", "Shadow"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setObjectTab(id as ObjectTab)}
                className={`rounded-lg border py-2 text-[10px] font-black transition cursor-pointer ${
                  objectTab === id
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {objectTab !== "shadow" ? (
            <>
              <div>
                <label className="block text-[9px] font-bold text-gray-500">
                  Brightness
                  <span className="float-right text-amber-600">
                    {objectBrightness}%
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={1}
                  value={objectBrightness}
                  onChange={(event) =>
                    setObjectBrightness(Number(event.target.value))
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-500">
                  Contrast
                  <span className="float-right text-amber-600">
                    {objectContrast}%
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={1}
                  value={objectContrast}
                  onChange={(event) =>
                    setObjectContrast(Number(event.target.value))
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[9px] font-bold text-gray-500">
                Clear Shadow
                <span className="float-right text-amber-600">
                  {shadowStrength}%
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={shadowStrength}
                onChange={(event) =>
                  setShadowStrength(Number(event.target.value))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          )}

          <div>
            <label className="block text-[9px] font-bold text-gray-500">
              Brush Size
              <span className="float-right text-amber-600">{brushSize}</span>
            </label>
            <input
              type="range"
              min={4}
              max={80}
              step={1}
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            <button
              type="button"
              title="Brush"
              onClick={() => setObjectBrushMode("brush")}
              className={`rounded-lg border p-2 cursor-pointer ${
                objectBrushMode === "brush"
                  ? "border-blue-400 bg-blue-50 text-blue-600"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              <Plus size={14} className="mx-auto" />
            </button>

            <button
              type="button"
              title="Erase"
              onClick={() => setObjectBrushMode("erase")}
              className={`rounded-lg border p-2 cursor-pointer ${
                objectBrushMode === "erase"
                  ? "border-blue-400 bg-blue-50 text-blue-600"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              <Eraser size={14} className="mx-auto" />
            </button>

            <button
              type="button"
              title="Undo"
              onClick={undoObjectMask}
              className="rounded-lg border border-gray-200 p-2 text-gray-500 cursor-pointer"
            >
              <Undo2 size={14} className="mx-auto" />
            </button>

            <button
              type="button"
              title="Redo"
              onClick={redoObjectMask}
              className="rounded-lg border border-gray-200 p-2 text-gray-500 cursor-pointer"
            >
              <Redo2 size={14} className="mx-auto" />
            </button>

            <button
              type="button"
              title="Show / Hide Selection"
              onClick={() => setObjectPreview(!objectPreview)}
              className={`rounded-lg border p-2 cursor-pointer ${
                objectPreview
                  ? "border-amber-400 bg-amber-50 text-amber-600"
                  : "border-gray-200 text-gray-500"
              }`}
            >
              <Eye size={14} className="mx-auto" />
            </button>

            <button
              type="button"
              title="Reset"
              onClick={() => void resetObjectAdjust()}
              disabled={objectMaskBusy || objectApplyBusy}
              className="rounded-lg border border-gray-200 p-2 text-gray-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {objectMaskBusy ? (
                <Loader2 size={14} className="mx-auto animate-spin" />
              ) : (
                <RefreshCcw size={14} className="mx-auto" />
              )}
            </button>
          </div>

          {objectMaskBusy && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 py-2 text-[9px] font-bold text-blue-700">
              <Loader2 size={12} className="animate-spin" />
              Preparing automatic selection…
            </div>
          )}

          {!objectMaskBusy && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-center text-[9px] font-bold text-emerald-700">
              Live adjustment preview is active. The Eye button only shows the
              soft selection overlay.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={cancelObjectAdjust}
              disabled={objectApplyBusy}
              className="rounded-xl border border-gray-200 py-2 text-[10px] font-black text-gray-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void applyObjectAdjust()}
              disabled={objectApplyBusy || objectMaskBusy}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2 text-[10px] font-black text-gray-900 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {objectApplyBusy && (
                <Loader2 size={13} className="animate-spin" />
              )}
              {objectApplyBusy ? "Applying…" : "Apply"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
