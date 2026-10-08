import { AiT, useAiEditorText } from "./aiEditorI18n";
import React from "react";
import { Upload, X, ArrowLeftRight, ImageIcon, RefreshCw } from "lucide-react";
export interface BoxInfo {
    text: string;
    style: {
        width: string;
        height: string;
    };
}
interface PhotoPreviewAreaProps {
    isDualMode: boolean;
    uploadedImage: string | null;
    setUploadedImage: React.Dispatch<React.SetStateAction<string | null>>;
    leftImage: string | null;
    setLeftImage: React.Dispatch<React.SetStateAction<string | null>>;
    rightImage: string | null;
    setRightImage: React.Dispatch<React.SetStateAction<string | null>>;
    triggerUpload: (target: "single" | "left" | "right") => void;
    enableDualMode: () => void;
    exitDualMode: () => void;
    activeBoxInfo: BoxInfo;
    currentBgColorValue: string;
    isGenerating: boolean;
    isDeleting: boolean;
    originalImageForDual: string | null;
    setOriginalImageForDual: React.Dispatch<React.SetStateAction<string | null>>;
    isDualPreviewActive: boolean;
    setIsDualPreviewActive: React.Dispatch<React.SetStateAction<boolean>>;
}
const TRANSPARENT_BACKGROUND_STYLE: React.CSSProperties = {
    backgroundImage: "linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
    backgroundColor: "#ffffff",
};
/* ------------------------------------------------------------------ */
/* AI SCAN ANIMATION (generation only)                                 */
/* Keyframes are scoped with the "pp-scan-" prefix. The <style> tag is */
/* rendered only while `isGenerating` is true (see main component).    */
/* ------------------------------------------------------------------ */
const SCAN_STYLES = `
/* Beam uses transform only, so it runs on the compositor thread and keeps
   moving even when the main thread is busy. Do NOT animate top/left.
   "alternate" makes it scan down, then back up, like a real scanner. */
@keyframes pp-scan-sweep {
  0%   { transform: translate3d(0, -50%, 0); }
  100% { transform: translate3d(0, 367%, 0); }
}
@keyframes pp-scan-grid {
  0%, 100% { opacity: 0.25; }
  50%      { opacity: 0.55; }
}
.pp-scan-beam {
  animation: pp-scan-sweep 2.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate;
  will-change: transform;
}
.pp-scan-grid { animation: pp-scan-grid 3.2s ease-in-out infinite; }

/* The beam is the loading indicator, so it always keeps moving.
   Reduced motion only turns off the grid pulse. */
@media (prefers-reduced-motion: reduce) {
  .pp-scan-grid { animation: none; }
}
`;
function ScanOverlay() {
    return (<div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden shadow-[inset_0_0_28px_rgba(37,99,235,0.18)]">
      {/* Soft tint so the scan reads as a layer over the photo */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2563EB]/[0.05] via-transparent to-[#10B981]/[0.05]"/>

      {/* Faint technological grid, fading toward the edges */}
      <div className="pp-scan-grid absolute inset-0" style={{
            backgroundImage: "linear-gradient(rgba(37,99,235,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.14) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            WebkitMaskImage: "radial-gradient(ellipse at center, #000 35%, transparent 95%)",
            maskImage: "radial-gradient(ellipse at center, #000 35%, transparent 95%)",
        }}/>

      {/* Scan beam: glow on both sides of a thin line, so it looks right
            whether it is moving down or up */}
      <div className="pp-scan-beam absolute left-0 right-0 top-0" style={{ height: "24%" }}>
        <div className="absolute inset-0" style={{
            background: "linear-gradient(to bottom, rgba(37,99,235,0) 0%, rgba(37,99,235,0.14) 45%, rgba(16,185,129,0.20) 50%, rgba(37,99,235,0.14) 55%, rgba(37,99,235,0) 100%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent)",
            maskImage: "linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent)",
        }}/>
        <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2" style={{
            background: "linear-gradient(90deg, transparent 0%, #2563EB 18%, #10B981 50%, #2563EB 82%, transparent 100%)",
            boxShadow: "0 0 10px 2px rgba(37,99,235,0.40), 0 0 18px 4px rgba(16,185,129,0.18)",
        }}/>
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2" style={{
            background: "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.85) 50%, transparent 80%)",
        }}/>
      </div>
    </div>);
}
function getBackgroundStyle(background: string): React.CSSProperties {
    return background === "transparent"
        ? TRANSPARENT_BACKGROUND_STYLE
        : { backgroundColor: background };
}
/* Sizes a photo frame so it never gets taller or wider than the space left
   for it. On xl screens the holder becomes a size container, and the frame
   is capped by both the holder width and the holder height (keeping the
   photo aspect ratio). Below xl the original fixed-width behaviour is kept. */
function FitFrame({ info, className = "", style, children, }: {
    info: BoxInfo;
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
}) {
    const w = parseFloat(info.style.width) || 290;
    const h = parseFloat(info.style.height) || 372;
    return (<div className="flex min-h-0 w-full flex-1 items-center justify-center xl:[container-type:size]">
      <div className={`relative w-[min(var(--cw),100%)] xl:w-[min(var(--cw),100cqw,calc(100cqh*var(--cr)))] ${className}`} style={{
            "--cw": `${w}px`,
            "--cr": String(w / h),
            aspectRatio: `${w} / ${h}`,
            height: "auto",
            ...style,
        } as React.CSSProperties}>
        {children}
      </div>
    </div>);
}
function EmptyUploadBox({ title, subtitle, onUpload, }: {
    title: string;
    subtitle?: string;
    onUpload: () => void;
}) {
    const { t } = useAiEditorText();
    return (<div className="flex h-full min-h-[250px] flex-col items-center justify-center bg-[#E2E8F0] p-4 text-center xl:min-h-0 xl:p-2">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC] text-[#2563EB]">
        <Upload size={18}/>
      </div>

      <h3 className="mb-1 text-xs font-medium text-[#0F172A]"><AiT>{title}</AiT></h3>

      {subtitle && (<p className="mb-3 text-[10px] leading-tight text-[#0F172A]/70">
          <AiT>{subtitle}</AiT>
        </p>)}

      <button type="button" onClick={onUpload} className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#2563EB] px-3.5 py-1.5 text-[11px] font-medium text-white shadow-md transition hover:bg-[#2563EB]/90 active:scale-95">
        <Upload size={12}/><AiT>{"Upload Photo\n      "}</AiT></button>
    </div>);
}
function PhotoCard({ image, label, boxInfo, background, onRemove, showBorder = true, isScanning = false, }: {
    image: string | null;
    label: string;
    boxInfo: BoxInfo;
    background: string;
    onRemove: () => void;
    showBorder?: boolean;
    isScanning?: boolean;
}) {
    const { t } = useAiEditorText();
    return (<div className="flex min-w-0 flex-col items-center gap-1.5 xl:min-h-0">
      <span className="max-w-full shrink-0 truncate text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
        <AiT>{label}</AiT>
      </span>

      <FitFrame info={boxInfo} className={`overflow-hidden rounded-2xl shadow-xl ${showBorder ? "border-2 border-[#E2E8F0]" : ""}`} style={getBackgroundStyle(background)}>
        {image ? (<div className="group relative h-full w-full">
            <img src={image} alt={t(label)} className="h-full w-full object-contain"/>

            <button type="button" onClick={onRemove} aria-label={t(`Remove ${label}`)} className="absolute right-2 top-2 z-10 cursor-pointer rounded-full bg-[#0F172A]/80 p-1.5 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100">
              <X size={14}/>
            </button>

            <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#0F172A]/70 px-2 py-0.5 text-[9px] text-white backdrop-blur-sm">
              {boxInfo.text}
            </div>
          </div>) : (<EmptyUploadBox title={`Upload ${label.toLowerCase()}`} onUpload={onRemove}/>)}

        {isScanning && image && <ScanOverlay />}
      </FitFrame>
    </div>);
}
export default function PhotoPreviewArea({
    isDualMode, uploadedImage, setUploadedImage, leftImage, setLeftImage, rightImage, setRightImage, triggerUpload, enableDualMode, exitDualMode, activeBoxInfo, currentBgColorValue, isGenerating, isDeleting, originalImageForDual, setOriginalImageForDual, isDualPreviewActive, setIsDualPreviewActive,
}: PhotoPreviewAreaProps) {
    const { t } = useAiEditorText();
    const handleRemoveSingle = () => {
        if (originalImageForDual && uploadedImage) {
            setUploadedImage(originalImageForDual);
            setOriginalImageForDual(null);
            setIsDualPreviewActive(false);
            return;
        }
        setUploadedImage(null);
        setOriginalImageForDual(null);
        setIsDualPreviewActive(false);
    };
    return (<div className="relative flex max-h-[85vh] min-h-[540px] flex-1 flex-col items-center justify-center overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 shadow-lg sm:p-6 xl:max-h-none xl:min-h-0 xl:overflow-hidden xl:p-4">
      {/* Scan keyframes: only mounted while generating */}
      {isGenerating && <style>{SCAN_STYLES}</style>}

      {/* Deleting keeps the simple overlay. Generating now scans the photo itself. */}
      {isDeleting && (<div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl bg-[#F8FAFC]/90 p-4 text-center backdrop-blur-md">
          <div className="mb-5 h-16 w-16 animate-spin rounded-full border-4 border-red-500/20 border-t-red-500"/>

          <h3 className="mb-1 text-base font-semibold tracking-wide text-[#0F172A]"><AiT>{"Deleting Photo...\n          "}</AiT></h3>

          <p className="max-w-xs text-xs leading-relaxed text-[#0F172A]/70"><AiT>{"Removing your photo, please wait...\n          "}</AiT></p>

          <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full border border-[#E2E8F0] bg-[#E2E8F0]">
            <div className="h-full w-full animate-pulse rounded-full bg-red-500"/>
          </div>
        </div>)}

      {!isDualMode ? (<div className="flex w-full flex-col items-center justify-center gap-4 xl:min-h-0 xl:flex-1 xl:gap-3">
          {isDualPreviewActive && originalImageForDual ? (<div className="grid w-full max-w-[760px] grid-cols-1 gap-6 md:grid-cols-2 xl:min-h-0 xl:flex-1 xl:grid-rows-[minmax(0,1fr)] xl:gap-4">
              <PhotoCard image={originalImageForDual} label="Real Photo" boxInfo={activeBoxInfo} background={currentBgColorValue} onRemove={() => setOriginalImageForDual(null)} isScanning={isGenerating}/>

              <PhotoCard image={uploadedImage} label="Edited Photo" boxInfo={activeBoxInfo} background={currentBgColorValue} onRemove={handleRemoveSingle} isScanning={isGenerating}/>
            </div>) : (<FitFrame info={activeBoxInfo} className={`overflow-hidden rounded-2xl shadow-xl ${uploadedImage
                    ? "border-2 border-transparent"
                    : "border-2 border-dashed border-[#2563EB]/40"}`}>
              {uploadedImage ? (<div className="group relative h-full w-full" style={getBackgroundStyle(currentBgColorValue)}>
                  <img src={uploadedImage} alt="Uploaded or generated preview" className="h-full w-full object-contain"/>

                  <button type="button" onClick={handleRemoveSingle} className="absolute right-2 top-2 z-10 cursor-pointer rounded-full bg-[#0F172A]/80 p-1.5 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100" aria-label={t("Remove current photo")}>
                    <X size={14}/>
                  </button>

                  <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#0F172A]/70 px-2 py-0.5 text-[9px] text-white backdrop-blur-sm">
                    {activeBoxInfo.text}
                  </div>
                </div>) : (<EmptyUploadBox title="Upload a Photo" subtitle={`Click or scan QR code to upload (${activeBoxInfo.text})`} onUpload={() => triggerUpload("single")}/>)}

              {isGenerating && <ScanOverlay />}
            </FitFrame>)}

          {!isDualPreviewActive && (<button type="button" onClick={enableDualMode} className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#E2E8F0]/60 px-4 py-2 text-xs font-medium text-[#0F172A] shadow-sm transition hover:bg-[#E2E8F0]">
              <ImageIcon size={14} className="text-[#2563EB]"/><AiT>{"Upload 2 separate images\n            "}</AiT></button>)}
        </div>) : (<div className="flex w-full max-w-[760px] flex-col items-center gap-5 xl:min-h-0 xl:flex-1 xl:gap-3">
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:min-h-0 xl:flex-1 xl:grid-rows-[minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-1.5 xl:min-h-0">
              <span className="shrink-0 text-center text-xs font-semibold uppercase tracking-wider text-[#0F172A]"><AiT>{"Left Person\n              "}</AiT></span>

              <FitFrame info={activeBoxInfo} className="overflow-hidden rounded-2xl border-2 border-[#E2E8F0] shadow-xl">
                {leftImage ? (<div className="group relative h-full w-full" style={getBackgroundStyle(currentBgColorValue)}>
                    <img src={leftImage} alt="Left person" className="h-full w-full object-contain"/>

                    <button type="button" onClick={() => setLeftImage(null)} className="absolute right-2 top-2 z-10 cursor-pointer rounded-full bg-red-600 p-1.5 text-white opacity-0 transition group-hover:opacity-100" aria-label={t("Remove left photo")}>
                      <X size={14}/>
                    </button>
                  </div>) : (<EmptyUploadBox title="Upload left photo" onUpload={() => triggerUpload("left")}/>)}

                {isGenerating && leftImage && <ScanOverlay />}
              </FitFrame>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5 xl:min-h-0">
              <span className="shrink-0 text-center text-xs font-semibold uppercase tracking-wider text-[#0F172A]"><AiT>{"Right Person\n              "}</AiT></span>

              <FitFrame info={activeBoxInfo} className="overflow-hidden rounded-2xl border-2 border-[#E2E8F0] shadow-xl">
                {rightImage ? (<div className="group relative h-full w-full" style={getBackgroundStyle(currentBgColorValue)}>
                    <img src={rightImage} alt="Right person" className="h-full w-full object-contain"/>

                    <button type="button" onClick={() => setRightImage(null)} className="absolute right-2 top-2 z-10 cursor-pointer rounded-full bg-red-600 p-1.5 text-white opacity-0 transition group-hover:opacity-100" aria-label={t("Remove right photo")}>
                      <X size={14}/>
                    </button>
                  </div>) : (<EmptyUploadBox title="Upload right photo" onUpload={() => triggerUpload("right")}/>)}

                {isGenerating && rightImage && <ScanOverlay />}
              </FitFrame>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button type="button" onClick={() => {
                setLeftImage(rightImage);
                setRightImage(leftImage);
            }} className="cursor-pointer rounded-xl border border-[#E2E8F0] bg-[#E2E8F0] p-2 text-[#0F172A] transition hover:bg-[#E2E8F0]/80" title="Swap images" aria-label={t("Swap images")}>
              <ArrowLeftRight size={16}/>
            </button>

            <button type="button" onClick={() => {
                setLeftImage(null);
                setRightImage(null);
                exitDualMode();
            }} className="flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100">
              <RefreshCw size={14}/><AiT>{"Exit dual mode\n            "}</AiT></button>
          </div>
        </div>)}
    </div>);
}
