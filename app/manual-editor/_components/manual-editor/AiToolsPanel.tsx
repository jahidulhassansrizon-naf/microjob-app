"use client";
import React, { useState } from "react";
import { ManualT as T, useManualEditorText } from "./manualEditorI18n";
import { Droplets, Eraser, Eye, FileEdit, Grid, History, Loader2, Maximize2, Plus, Redo2, RefreshCcw, ScanLine, Sparkles, Sun, Undo2, UserCheck, Zap, } from "lucide-react";
import type { ObjectTab } from "./types";
import { useManualEditor } from "./EditorProvider";
import { preloadFaceDetector, preloadUpscaler } from "./aiEnhancement";
import { preloadBackgroundRemoval } from "./segmentation";
import { TOOL_GUIDE, TOOL_GUIDE_ORDER, type ToolGuideId } from "./toolGuide";
import type { PhotoAsset } from "./types";
import CutoutEditorModal from "./CutoutEditorModal";
import RetouchEditorModal from "./RetouchEditorModal";
import PhotoEnhanceModal from "./PhotoEnhanceModal";
export default function AiToolsPanel() {
    const { t, locale } = useManualEditorText();
    const isBn = String(locale ?? "").toLowerCase().startsWith("bn");
    // Hover guide is a floating tooltip (position: fixed), so showing or hiding
    // it never changes the height of the scrollable side panel. An in-flow card
    // resized the panel on every hover, which made the content jump under the
    // pointer and caused the flicker.
    const [hoverGuide, setHoverGuide] = useState<{ id: ToolGuideId; top: number; left: number; } | null>(null);
    const guideOf = (id: ToolGuideId) => TOOL_GUIDE[id][isBn ? "bn" : "en"];
    const showGuide = (id: ToolGuideId, el: HTMLElement) => {
        const rect = el.getBoundingClientRect();
        const panel = el.closest("aside")?.getBoundingClientRect();
        const width = 320;
        const left = Math.max(8, Math.min((panel ? panel.right : rect.right) + 12, window.innerWidth - width - 8));
        const top = Math.max(8, Math.min(rect.top, window.innerHeight - 280));
        setHoverGuide((current) => current && current.id === id && current.top === top && current.left === left
            ? current
            : { id, top, left });
    };
    const hoverProps = (id: ToolGuideId, onEnter?: () => void) => ({
        onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
            onEnter?.();
            if (event.pointerType === "touch")
                return;
            showGuide(id, event.currentTarget);
        },
        onPointerLeave: () => setHoverGuide(null),
        onFocus: (event: React.FocusEvent<HTMLElement>) => showGuide(id, event.currentTarget),
        onBlur: () => setHoverGuide(null),
    });
    const { activeAiTool, showUnsupportedAiMessage, runUpscale, runFaceEnhance, aiProcessing, isRemovingBackground, aiNotice, activePhoto, setActiveAiTool, setAiNotice, objectTab, setObjectTab, objectBrightness, objectContrast, objectSaturation, objectHue, shadowStrength, brushSize, setObjectBrightness, setObjectContrast, setObjectSaturation, setObjectHue, setShadowStrength, setBrushSize, objectPreview, setObjectPreview, objectBrushMode, setObjectBrushMode, objectMaskBusy, objectApplyBusy, undoObjectMask, redoObjectMask, resetObjectAdjust, cancelObjectAdjust, applyObjectAdjust, } = useManualEditor();
    const [cutoutSource, setCutoutSource] = useState<PhotoAsset | null>(null);
    const [retouchSource, setRetouchSource] = useState<PhotoAsset | null>(null);
    const [enhanceSource, setEnhanceSource] = useState<{ photo: PhotoAsset; tab: "auto" | "clean" | "relight" | "restore"; } | null>(null);
    const shownGuide = hoverGuide ? guideOf(hoverGuide.id) : null;
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
        <div className="h-3.5 w-1 rounded-full bg-[#DC2626]"/>
        <span className="text-sm font-extrabold uppercase tracking-wider text-[#3B2F1E]"><T>{"AI TOOLS\n        "}</T></span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
            {
                id: "face" as const,
                label: "AI Face Enhance",
                icon: <Sparkles className="h-5 w-5 text-[#7A6A50]"/>,
            },
            {
                id: "object" as const,
                label: "Object Adjust",
                icon: <UserCheck className="h-5 w-5 text-[#7A6A50]"/>,
            },
            {
                id: "transparent" as const,
                label: "Transparent",
                icon: <Grid className="h-5 w-5 text-[#7A6A50]"/>,
            },
            {
                id: "upscale" as const,
                label: "Upscale",
                icon: <Maximize2 className="h-5 w-5 text-[#7A6A50]"/>,
            },
        ].map((tool) => (<button key={tool.id} type="button" {...hoverProps(tool.id, () => {
                if (tool.id === "face")
                    preloadFaceDetector();
                if (tool.id === "upscale")
                    preloadUpscaler();
                if (tool.id === "transparent")
                    void preloadBackgroundRemoval();
            })} onClick={() => {
                if (tool.id === "face") {
                    void runFaceEnhance();
                    return;
                }
                if (tool.id === "upscale") {
                    void runUpscale();
                    return;
                }
                showUnsupportedAiMessage(tool.id);
            }} disabled={Boolean(aiProcessing)} aria-busy={aiProcessing === tool.id} className={`flex h-24 lg:h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border p-2 text-center transition cursor-pointer ${activeAiTool === tool.id
                ? "border-[#DC2626] bg-[#F6D9A8] ring-1 ring-[#DC2626]"
                : "border-[#E3D6B8] bg-[#FBF6E8] hover:border-[#D8C9A6]"} disabled:cursor-not-allowed disabled:opacity-60`}>
            <span>
              {aiProcessing === tool.id ? (<span className="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-md text-[#DC2626]">
                  <ScanLine className="h-5 w-5"/>
                  <span className="absolute left-0 right-0 top-1/2 h-px bg-[#DC2626] shadow-[0_0_6px_rgba(220,38,38,0.9)]" style={{ animation: "manual-editor-button-scan 1.2s ease-in-out infinite" }}/>
                </span>) : (tool.icon)}
            </span>
            <span className="text-[11px] font-bold leading-tight text-[#3B2F1E]">
              {aiProcessing === tool.id
            ? tool.id === "upscale"
                ? <T>{"Upscaling…"}</T>
                : <T>{"Enhancing…"}</T>
            : <T>{tool.label}</T>}
            </span>
          </button>))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button type="button" onClick={() => {
            if (!activePhoto) {
              setAiNotice("Upload a photo first.");
              return;
            }
            setAiNotice("");
            setActiveAiTool("cutout");
            setCutoutSource(activePhoto);
          }} {...hoverProps("cutout", () => void preloadBackgroundRemoval())} disabled={Boolean(aiProcessing) || isRemovingBackground} className={`flex h-24 lg:h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border bg-[#FBF6E8] p-2 text-center transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${activeAiTool === "cutout"
            ? "border-[#DC2626] bg-[#F6D9A8] ring-1 ring-[#DC2626]"
            : "border-[#E3D6B8] hover:border-[#D8C9A6]"}`}>
          <FileEdit className="h-5 w-5 text-[#7A6A50]"/>
          <span className="text-[11px] font-bold leading-tight text-[#3B2F1E]"><T>{"Cutout Editor\n          "}</T></span>
        </button>
        <button type="button" onClick={() => {
            if (!activePhoto) {
              setAiNotice("Upload a photo first.");
              return;
            }
            setAiNotice("");
            setActiveAiTool("retouch");
            setRetouchSource(activePhoto);
          }} disabled={Boolean(aiProcessing) || isRemovingBackground} {...hoverProps("retouch")} className={`flex h-24 lg:h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border bg-[#FBF6E8] p-2 text-center transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${activeAiTool === "retouch"
            ? "border-[#DC2626] bg-[#F6D9A8] ring-1 ring-[#DC2626]"
            : "border-[#E3D6B8] hover:border-[#D8C9A6]"}`}>
          <Eraser className="h-5 w-5 text-[#7A6A50]"/>
          <span className="text-[11px] font-bold leading-tight text-[#3B2F1E]"><T>{"Retouch"}</T></span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {([
            { tab: "auto" as const, label: "Auto Enhance", hint: "One click: fixes exposure, colour cast, contrast, noise and softness", icon: <Zap className="h-5 w-5 text-[#7A6A50]"/> },
            { tab: "clean" as const, label: "Denoise & Deblur", hint: "Reduce grain and recover mild softness", icon: <Droplets className="h-5 w-5 text-[#7A6A50]"/> },
            { tab: "relight" as const, label: "Relight", hint: "Lift dark areas and faces, protect highlights", icon: <Sun className="h-5 w-5 text-[#7A6A50]"/> },
            { tab: "restore" as const, label: "Old Photo", hint: "Repair dust, scratches and faded tones", icon: <History className="h-5 w-5 text-[#7A6A50]"/> },
        ]).map((item) => (<button key={item.tab} type="button" onClick={() => {
            if (!activePhoto) {
              setAiNotice("Upload a photo first.");
              return;
            }
            setAiNotice("");
            setActiveAiTool("enhance");
            setEnhanceSource({ photo: activePhoto, tab: item.tab });
          }} disabled={Boolean(aiProcessing) || isRemovingBackground} {...hoverProps(item.tab)} className={`flex h-24 lg:h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border bg-[#FBF6E8] p-2 text-center transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${activeAiTool === "enhance" && enhanceSource?.tab === item.tab
            ? "border-[#DC2626] bg-[#F6D9A8] ring-1 ring-[#DC2626]"
            : "border-[#E3D6B8] hover:border-[#D8C9A6]"}`}>
            {item.icon}
            <span className="text-[11px] font-bold leading-tight text-[#3B2F1E]"><T>{item.label}</T></span>
          </button>))}
      </div>

      {aiNotice && (<div className="rounded-xl border border-[#FBB6B6] bg-[#FEE9E9] px-3 py-2 text-[11px] leading-5 text-[#B91C1C]">
          <T>{aiNotice}</T>
        </div>)}

      {activeAiTool === "object" && (<div className="space-y-3 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-2.5">
          <div className="grid grid-cols-2 gap-1.5">
            {[
                ["face", "Face"],
                ["skin", "Skin"],
                ["hair", "Hair"],
                ["shadow", "Shadow"],
            ].map(([id, label]) => (<button key={id} type="button" onClick={() => setObjectTab(id as ObjectTab)} className={`rounded-lg border py-2 text-[12px] font-extrabold transition cursor-pointer ${objectTab === id
                    ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C]"
                    : "border-[#E3D6B8] text-[#6B5A40] hover:border-[#D8C9A6]"}`}>
                <T>{label}</T>
              </button>))}
          </div>

          {objectTab !== "shadow" ? (<>
              <div>
                <label className="block text-[11px] font-bold text-[#6B5A40]"><T>{"Brightness\n                  "}</T><span className="float-right text-[#DC2626]">
                    {objectBrightness}<T>{"%\n                  "}</T></span>
                </label>
                <input type="range" min={0} max={200} step={1} value={objectBrightness} onChange={(event) => setObjectBrightness(Number(event.target.value))} className="w-full accent-[#DC2626] cursor-pointer"/>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B5A40]"><T>{"Contrast\n                  "}</T><span className="float-right text-[#DC2626]">
                    {objectContrast}<T>{"%\n                  "}</T></span>
                </label>
                <input type="range" min={0} max={200} step={1} value={objectContrast} onChange={(event) => setObjectContrast(Number(event.target.value))} className="w-full accent-[#DC2626] cursor-pointer"/>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B5A40]"><T>{"Saturation\n                  "}</T><span className="float-right text-[#DC2626]">
                    {objectSaturation}<T>{"%\n                  "}</T></span>
                </label>
                <input type="range" min={0} max={200} step={1} value={objectSaturation} onChange={(event) => setObjectSaturation(Number(event.target.value))} className="w-full accent-[#DC2626] cursor-pointer"/>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B5A40]"><T>{"Hue\n                  "}</T><span className="float-right text-[#DC2626]">
                    {objectHue}<T>{"\u00B0\n                  "}</T></span>
                </label>
                <input type="range" min={-180} max={180} step={1} value={objectHue} onChange={(event) => setObjectHue(Number(event.target.value))} className="w-full accent-[#DC2626] cursor-pointer"/>
              </div>
            </>) : (<div>
              <label className="block text-[11px] font-bold text-[#6B5A40]"><T>{"Clear Shadow\n                "}</T><span className="float-right text-[#DC2626]">
                  {shadowStrength}<T>{"%\n                "}</T></span>
              </label>
              <input type="range" min={0} max={100} step={1} value={shadowStrength} onChange={(event) => setShadowStrength(Number(event.target.value))} className="w-full accent-[#DC2626] cursor-pointer"/>
            </div>)}

          <div>
            <label className="block text-[11px] font-bold text-[#6B5A40]"><T>{"Brush Size\n              "}</T><span className="float-right text-[#DC2626]">{brushSize}</span>
            </label>
            <input type="range" min={4} max={80} step={1} value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} className="w-full accent-[#DC2626] cursor-pointer"/>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            <button type="button" title={t("Brush")} onClick={() => setObjectBrushMode("brush")} className={`rounded-lg border p-2 cursor-pointer ${objectBrushMode === "brush"
                ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C]"
                : "border-[#E3D6B8] text-[#5A4A32]"}`}>
              <Plus size={14} className="mx-auto"/>
            </button>

            <button type="button" title={t("Erase")} onClick={() => setObjectBrushMode("erase")} className={`rounded-lg border p-2 cursor-pointer ${objectBrushMode === "erase"
                ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C]"
                : "border-[#E3D6B8] text-[#5A4A32]"}`}>
              <Eraser size={14} className="mx-auto"/>
            </button>

            <button type="button" title={t("Undo")} onClick={undoObjectMask} className="rounded-lg border border-[#E3D6B8] p-2 text-[#6B5A40] cursor-pointer">
              <Undo2 size={14} className="mx-auto"/>
            </button>

            <button type="button" title={t("Redo")} onClick={redoObjectMask} className="rounded-lg border border-[#E3D6B8] p-2 text-[#6B5A40] cursor-pointer">
              <Redo2 size={14} className="mx-auto"/>
            </button>

            <button type="button" title={t("Show / Hide Selection")} onClick={() => setObjectPreview(!objectPreview)} className={`rounded-lg border p-2 cursor-pointer ${objectPreview
                ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C]"
                : "border-[#E3D6B8] text-[#6B5A40]"}`}>
              <Eye size={14} className="mx-auto"/>
            </button>

            <button type="button" title={t("Reset")} onClick={() => void resetObjectAdjust()} disabled={objectMaskBusy || objectApplyBusy} className="rounded-lg border border-[#E3D6B8] p-2 text-[#6B5A40] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
              {objectMaskBusy ? (<Loader2 size={14} className="mx-auto animate-spin"/>) : (<RefreshCcw size={14} className="mx-auto"/>)}
            </button>
          </div>

          {objectMaskBusy && (<div className="flex items-center justify-center gap-2 rounded-xl border border-[#FBB6B6] bg-[#FEE9E9] py-2 text-[11px] font-bold text-[#B91C1C]">
              <Loader2 size={12} className="animate-spin"/><T>{"Preparing automatic selection\u2026\n            "}</T></div>)}

          {!objectMaskBusy && (<div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-center text-[11px] font-bold text-[#10B981]"><T>{"Live adjustment preview is active. The Eye button only shows the\n              soft selection overlay.\n            "}</T></div>)}

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={cancelObjectAdjust} disabled={objectApplyBusy} className="rounded-xl border border-[#E3D6B8] py-2 text-[12px] font-extrabold text-[#3B2F1E] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"><T>{"Cancel\n            "}</T></button>
            <button type="button" onClick={() => void applyObjectAdjust()} disabled={objectApplyBusy || objectMaskBusy} className="flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] py-2 text-[12px] font-extrabold text-white cursor-pointer hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50">
              {objectApplyBusy && (<Loader2 size={13} className="animate-spin"/>)}
              {objectApplyBusy ? <T>{"Applying…"}</T> : <T>{"Apply"}</T>}
            </button>
          </div>
        </div>)}
      <details className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-3 text-[11px] leading-[1.55] text-[#5A4A32]">
        <summary className="cursor-pointer text-[12px] font-extrabold text-[#3B2F1E]">{t("How to use each tool")}</summary>
        <div className="mt-3 space-y-3">
          {TOOL_GUIDE_ORDER.map((id) => {
            const guide = guideOf(id);
            return (<div key={id} className="border-t border-[#E3D6B8] pt-2 first:border-t-0 first:pt-0">
                <p className="text-[12px] font-extrabold text-[#3B2F1E]">{guide.name}</p>
                <p className="mt-1">{guide.summary}</p>
                <p className="mt-1"><span className="font-extrabold text-[#DC2626]">{t("Use it when")}: </span>{guide.useWhen}</p>
                <p className="mt-1"><span className="font-extrabold text-[#DC2626]">{t("Good to know")}: </span>{guide.limits}</p>
              </div>);
          })}
        </div>
      </details>
    </section>
    {shownGuide && hoverGuide && (<div role="tooltip" className="pointer-events-none fixed z-[60] w-[320px] rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-3 text-[11px] leading-[1.55] text-[#5A4A32] shadow-xl" style={{ top: hoverGuide.top, left: hoverGuide.left }}>
        <p className="text-[12px] font-extrabold text-[#3B2F1E]">{shownGuide.name}</p>
        <p className="mt-1"><span className="font-extrabold text-[#DC2626]">{t("What it does")}: </span>{shownGuide.summary}</p>
        <p className="mt-1"><span className="font-extrabold text-[#DC2626]">{t("Use it when")}: </span>{shownGuide.useWhen}</p>
        <p className="mt-1"><span className="font-extrabold text-[#DC2626]">{t("Good to know")}: </span>{shownGuide.limits}</p>
      </div>)}
    {cutoutSource && (<CutoutEditorModal sourcePhoto={cutoutSource} onClose={() => {
        setCutoutSource(null);
        setActiveAiTool(null);
      }} />)}
    {retouchSource && (<RetouchEditorModal sourcePhoto={retouchSource} onClose={() => {
        setRetouchSource(null);
        setActiveAiTool(null);
      }} />)}
    {enhanceSource && (<PhotoEnhanceModal sourcePhoto={enhanceSource.photo} initialTab={enhanceSource.tab} onClose={() => {
        setEnhanceSource(null);
        setActiveAiTool(null);
      }} />)}
    </>);
}
