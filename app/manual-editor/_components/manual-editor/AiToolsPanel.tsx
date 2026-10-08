"use client";
import { ManualT as T, useManualEditorText } from "./manualEditorI18n";
import { Eraser, Eye, FileEdit, Grid, Loader2, Maximize2, Plus, Redo2, RefreshCcw, ScanLine, Sparkles, Undo2, UserCheck, } from "lucide-react";
import type { ObjectTab } from "./types";
import { useManualEditor } from "./EditorProvider";
import { preloadFaceDetector, preloadUpscaler } from "./aiEnhancement";
export default function AiToolsPanel() {
    const { t } = useManualEditorText();
    const { activeAiTool, showUnsupportedAiMessage, runUpscale, runFaceEnhance, aiProcessing, aiNotice, objectTab, setObjectTab, objectBrightness, objectContrast, objectSaturation, objectHue, shadowStrength, brushSize, setObjectBrightness, setObjectContrast, setObjectSaturation, setObjectHue, setShadowStrength, setBrushSize, objectPreview, setObjectPreview, objectBrushMode, setObjectBrushMode, objectMaskBusy, objectApplyBusy, undoObjectMask, redoObjectMask, resetObjectAdjust, cancelObjectAdjust, applyObjectAdjust, } = useManualEditor();
    return (<>
      <style>{`
        @keyframes manual-editor-button-scan {
          0% {
            transform: translateY(-7px);
            opacity: 0.25;
          }
          50% {
            transform: translateY(7px);
            opacity: 1;
          }
          100% {
            transform: translateY(-7px);
            opacity: 0.25;
          }
        }
      `}</style>
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="h-3.5 w-1 rounded-full bg-[#2563EB]"/>
        <span className="text-xs font-black uppercase tracking-wider text-[#0F172A]"><T>{"AI TOOLS\n        "}</T></span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
            {
                id: "face" as const,
                label: "AI Face Enhance",
                icon: <Sparkles className="h-5 w-5 text-gray-400"/>,
            },
            {
                id: "object" as const,
                label: "Object Adjust",
                icon: <UserCheck className="h-5 w-5 text-gray-400"/>,
            },
            {
                id: "transparent" as const,
                label: "Transparent",
                icon: <Grid className="h-5 w-5 text-gray-400"/>,
            },
            {
                id: "upscale" as const,
                label: "Upscale",
                icon: <Maximize2 className="h-5 w-5 text-gray-400"/>,
            },
        ].map((tool) => (<button key={tool.id} type="button" onClick={() => {
                if (tool.id === "face") {
                    void runFaceEnhance();
                    return;
                }
                if (tool.id === "upscale") {
                    void runUpscale();
                    return;
                }
                showUnsupportedAiMessage(tool.id);
            }} onPointerEnter={() => {
                if (tool.id === "face")
                    preloadFaceDetector();
                if (tool.id === "upscale")
                    preloadUpscaler();
            }} disabled={Boolean(aiProcessing)} aria-busy={aiProcessing === tool.id} className={`flex h-20 lg:h-16 flex-col items-center justify-center gap-1 rounded-2xl border p-2 text-center transition cursor-pointer ${activeAiTool === tool.id
                ? "border-[#2563EB] bg-[#2563EB]/10 ring-1 ring-[#2563EB]"
                : "border-[#E2E8F0] bg-white hover:border-gray-300"} disabled:cursor-not-allowed disabled:opacity-60`}>
            <span>
              {aiProcessing === tool.id ? (<span className="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-md text-[#2563EB]">
                  <ScanLine className="h-5 w-5"/>
                  <span className="absolute left-0 right-0 top-1/2 h-px bg-[#2563EB] shadow-[0_0_6px_rgba(37,99,235,0.9)]" style={{ animation: "manual-editor-button-scan 1.2s ease-in-out infinite" }}/>
                </span>) : (tool.icon)}
            </span>
            <span className="text-[8px] font-bold leading-tight text-[#0F172A]">
              {aiProcessing === tool.id
            ? tool.id === "upscale"
                ? <T>{"Upscaling…"}</T>
                : <T>{"Enhancing…"}</T>
            : <T>{tool.label}</T>}
            </span>
          </button>))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button type="button" onClick={() => showUnsupportedAiMessage("cutout")} className={`flex h-20 lg:h-16 flex-col items-center justify-center gap-1 rounded-2xl border bg-white p-2 text-center transition cursor-pointer ${activeAiTool === "cutout"
            ? "border-[#2563EB] bg-[#2563EB]/10 ring-1 ring-[#2563EB]"
            : "border-[#E2E8F0] hover:border-gray-300"}`}>
          <FileEdit className="h-5 w-5 text-gray-400"/>
          <span className="text-[8px] font-bold leading-tight text-[#0F172A]"><T>{"Cutout Editor\n          "}</T></span>
        </button>
      </div>

      {aiNotice && (<div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[9px] leading-4 text-indigo-700">
          <T>{aiNotice}</T>
        </div>)}

      {activeAiTool === "object" && (<div className="space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-2.5">
          <div className="grid grid-cols-2 gap-1.5">
            {[
                ["face", "Face"],
                ["skin", "Skin"],
                ["hair", "Hair"],
                ["shadow", "Shadow"],
            ].map(([id, label]) => (<button key={id} type="button" onClick={() => setObjectTab(id as ObjectTab)} className={`rounded-lg border py-2 text-[10px] font-black transition cursor-pointer ${objectTab === id
                    ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                    : "border-[#E2E8F0] text-gray-500 hover:border-gray-300"}`}>
                <T>{label}</T>
              </button>))}
          </div>

          {objectTab !== "shadow" ? (<>
              <div>
                <label className="block text-[9px] font-bold text-gray-500"><T>{"Brightness\n                  "}</T><span className="float-right text-[#2563EB]">
                    {objectBrightness}<T>{"%\n                  "}</T></span>
                </label>
                <input type="range" min={0} max={200} step={1} value={objectBrightness} onChange={(event) => setObjectBrightness(Number(event.target.value))} className="w-full accent-[#2563EB] cursor-pointer"/>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-500"><T>{"Contrast\n                  "}</T><span className="float-right text-[#2563EB]">
                    {objectContrast}<T>{"%\n                  "}</T></span>
                </label>
                <input type="range" min={0} max={200} step={1} value={objectContrast} onChange={(event) => setObjectContrast(Number(event.target.value))} className="w-full accent-[#2563EB] cursor-pointer"/>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-500"><T>{"Saturation\n                  "}</T><span className="float-right text-[#2563EB]">
                    {objectSaturation}<T>{"%\n                  "}</T></span>
                </label>
                <input type="range" min={0} max={200} step={1} value={objectSaturation} onChange={(event) => setObjectSaturation(Number(event.target.value))} className="w-full accent-[#2563EB] cursor-pointer"/>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-500"><T>{"Hue\n                  "}</T><span className="float-right text-[#2563EB]">
                    {objectHue}<T>{"\u00B0\n                  "}</T></span>
                </label>
                <input type="range" min={-180} max={180} step={1} value={objectHue} onChange={(event) => setObjectHue(Number(event.target.value))} className="w-full accent-[#2563EB] cursor-pointer"/>
              </div>
            </>) : (<div>
              <label className="block text-[9px] font-bold text-gray-500"><T>{"Clear Shadow\n                "}</T><span className="float-right text-[#2563EB]">
                  {shadowStrength}<T>{"%\n                "}</T></span>
              </label>
              <input type="range" min={0} max={100} step={1} value={shadowStrength} onChange={(event) => setShadowStrength(Number(event.target.value))} className="w-full accent-[#2563EB] cursor-pointer"/>
            </div>)}

          <div>
            <label className="block text-[9px] font-bold text-gray-500"><T>{"Brush Size\n              "}</T><span className="float-right text-[#2563EB]">{brushSize}</span>
            </label>
            <input type="range" min={4} max={80} step={1} value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} className="w-full accent-[#2563EB] cursor-pointer"/>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            <button type="button" title={t("Brush")} onClick={() => setObjectBrushMode("brush")} className={`rounded-lg border p-2 cursor-pointer ${objectBrushMode === "brush"
                ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                : "border-[#E2E8F0] text-gray-600"}`}>
              <Plus size={14} className="mx-auto"/>
            </button>

            <button type="button" title={t("Erase")} onClick={() => setObjectBrushMode("erase")} className={`rounded-lg border p-2 cursor-pointer ${objectBrushMode === "erase"
                ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                : "border-[#E2E8F0] text-gray-600"}`}>
              <Eraser size={14} className="mx-auto"/>
            </button>

            <button type="button" title={t("Undo")} onClick={undoObjectMask} className="rounded-lg border border-[#E2E8F0] p-2 text-gray-500 cursor-pointer">
              <Undo2 size={14} className="mx-auto"/>
            </button>

            <button type="button" title={t("Redo")} onClick={redoObjectMask} className="rounded-lg border border-[#E2E8F0] p-2 text-gray-500 cursor-pointer">
              <Redo2 size={14} className="mx-auto"/>
            </button>

            <button type="button" title={t("Show / Hide Selection")} onClick={() => setObjectPreview(!objectPreview)} className={`rounded-lg border p-2 cursor-pointer ${objectPreview
                ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                : "border-[#E2E8F0] text-gray-500"}`}>
              <Eye size={14} className="mx-auto"/>
            </button>

            <button type="button" title={t("Reset")} onClick={() => void resetObjectAdjust()} disabled={objectMaskBusy || objectApplyBusy} className="rounded-lg border border-[#E2E8F0] p-2 text-gray-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
              {objectMaskBusy ? (<Loader2 size={14} className="mx-auto animate-spin"/>) : (<RefreshCcw size={14} className="mx-auto"/>)}
            </button>
          </div>

          {objectMaskBusy && (<div className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 py-2 text-[9px] font-bold text-blue-700">
              <Loader2 size={12} className="animate-spin"/><T>{"Preparing automatic selection\u2026\n            "}</T></div>)}

          {!objectMaskBusy && (<div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-center text-[9px] font-bold text-[#10B981]"><T>{"Live adjustment preview is active. The Eye button only shows the\n              soft selection overlay.\n            "}</T></div>)}

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={cancelObjectAdjust} disabled={objectApplyBusy} className="rounded-xl border border-[#E2E8F0] py-2 text-[10px] font-black text-[#0F172A] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"><T>{"Cancel\n            "}</T></button>
            <button type="button" onClick={() => void applyObjectAdjust()} disabled={objectApplyBusy || objectMaskBusy} className="flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-2 text-[10px] font-black text-white cursor-pointer hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {objectApplyBusy && (<Loader2 size={13} className="animate-spin"/>)}
              {objectApplyBusy ? <T>{"Applying…"}</T> : <T>{"Apply"}</T>}
            </button>
          </div>
        </div>)}
    </section>
    </>);
}
