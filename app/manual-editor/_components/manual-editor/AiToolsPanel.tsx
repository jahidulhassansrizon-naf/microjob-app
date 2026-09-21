"use client";
import {
  Eraser,
  Eye,
  FileEdit,
  Grid,
  Maximize2,
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
    setActiveAiTool,
    setAiNotice,
  } = useManualEditor();
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
        <span className="text-xs font-black tracking-wider uppercase">
          AI TOOLS
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          {
            id: "face" as const,
            label: "AI Face Enhance",
            icon: <Sparkles className="w-5 h-5 text-gray-400" />,
          },
          {
            id: "object" as const,
            label: "Object Adjust",
            icon: <UserCheck className="w-5 h-5 text-gray-400" />,
          },
          {
            id: "transparent" as const,
            label: "Transparent",
            icon: <Grid className="w-5 h-5 text-gray-400" />,
          },
          {
            id: "upscale" as const,
            label: "Upscale",
            icon: <Maximize2 className="w-5 h-5 text-gray-400" />,
          },
        ].map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => showUnsupportedAiMessage(tool.id)}
            className={`p-2 border rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition h-20 ${activeAiTool === tool.id ? "border-amber-400 bg-amber-50/20 ring-1 ring-amber-400" : "border-gray-200 bg-white hover:border-gray-300"}`}
          >
            <span>{tool.icon}</span>
            <span className="text-[8px] font-bold text-gray-600 leading-tight">
              {tool.label}
            </span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => showUnsupportedAiMessage("cutout")}
          className={`p-2 bg-white border rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition h-20 ${activeAiTool === "cutout" ? "border-amber-400 bg-amber-50/20 ring-1 ring-amber-400" : "border-gray-200 hover:border-gray-300"}`}
        >
          <FileEdit className="w-5 h-5 text-gray-400" />
          <span className="text-[8px] font-bold text-gray-600 leading-tight">
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
        <div className="rounded-2xl border border-gray-200 bg-white p-2.5 space-y-3">
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
                className={`rounded-lg border py-2 text-[10px] font-black ${objectTab === id ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-500"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {objectTab !== "shadow" ? (
            <>
              <label className="block text-[9px] font-bold text-gray-500">
                Brightness{" "}
                <span className="float-right text-amber-600">
                  {objectBrightness}%
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={200}
                value={objectBrightness}
                onChange={(e) => setObjectBrightness(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <label className="block text-[9px] font-bold text-gray-500">
                Contrast{" "}
                <span className="float-right text-amber-600">
                  {objectContrast}%
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={200}
                value={objectContrast}
                onChange={(e) => setObjectContrast(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </>
          ) : (
            <>
              <label className="block text-[9px] font-bold text-gray-500">
                Clear shadow{" "}
                <span className="float-right text-amber-600">
                  {shadowStrength}%
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={shadowStrength}
                onChange={(e) => setShadowStrength(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <label className="block text-[9px] font-bold text-gray-500">
                Brush size{" "}
                <span className="float-right text-amber-600">{brushSize}</span>
              </label>
              <input
                type="range"
                min={1}
                max={50}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </>
          )}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              type="button"
              className="rounded-lg border border-gray-200 p-2 text-gray-600"
            >
              <span className="text-lg">+</span>
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-200 p-2 text-gray-600"
            >
              <Eraser size={14} className="mx-auto" />
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-200 p-2 text-gray-400"
            >
              <Undo2 size={14} className="mx-auto" />
            </button>
            <button
              type="button"
              onClick={() => setObjectPreview(!objectPreview)}
              className={`rounded-lg border p-2 ${objectPreview ? "border-amber-400 bg-amber-50 text-amber-600" : "border-gray-200 text-gray-500"}`}
            >
              <Eye size={14} className="mx-auto" />
            </button>
            <button
              type="button"
              onClick={() => {
                setObjectBrightness(200);
                setObjectContrast(200);
                setShadowStrength(100);
                setBrushSize(4);
              }}
              className="rounded-lg border border-gray-200 p-2 text-gray-500"
            >
              <RefreshCcw size={14} className="mx-auto" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveAiTool(null)}
              className="rounded-xl border border-gray-200 py-2 text-[10px] font-black text-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                setAiNotice("AI processing is reserved for the Python step.")
              }
              className="rounded-xl bg-amber-500 py-2 text-[10px] font-black text-gray-900"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
