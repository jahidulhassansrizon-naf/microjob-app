"use client";
import { ManualT as T, useManualEditorText } from "./manualEditorI18n";
import { ArrowLeftRight, FlipHorizontal2, Image as ImageIcon, Maximize2, RotateCcw, RotateCw, ScanLine, Upload, X, ZoomIn, ZoomOut, } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, } from "react";
import { useManualEditor } from "./EditorProvider";
import CropEditor from "./CropEditor";
import ObjectMaskCanvas from "./ObjectMaskCanvas";
import { createCanvas, fitSize, get2d, releaseCanvas } from "./canvasUtils";
import { renderObjectAdjust } from "./objectAdjust";
/* Longest side used for the live Object Adjust preview. */
const PREVIEW_MAX_SIDE = 800;
function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}
function getResponsiveCanvasStyle(ratio: number) {
    const safeRatio = clamp(Number.isFinite(ratio) && ratio > 0 ? ratio : 1, 0.15, 6);
    const inverseRatio = 1 / safeRatio;
    // Fit the selected preset ratio inside the workspace without allowing
    // max-height to distort tall/portrait presets. Both dimensions are
    // calculated from the same ratio, so the visible frame always matches
    // the selected print size.
    return {
        width: `min(72vw, 420px, calc(var(--canvas-max, 400px) * ${safeRatio}))`,
        height: `min(var(--canvas-max, 400px), calc(72vw * ${inverseRatio}), calc(420px * ${inverseRatio}))`,
        boxSizing: "border-box" as const,
        transition: "width 180ms ease, height 180ms ease",
    };
}
function getScanOverlayStyle(sourceRatio: number, containerRatio: number): CSSProperties {
    const safeSourceRatio = Number.isFinite(sourceRatio) && sourceRatio > 0 ? sourceRatio : 1;
    const safeContainerRatio = Number.isFinite(containerRatio) && containerRatio > 0
        ? containerRatio
        : 1;
    if (safeSourceRatio >= safeContainerRatio) {
        const heightPercent = Math.min(100, Math.max(1, (safeContainerRatio / safeSourceRatio) * 100));
        const topPercent = (100 - heightPercent) / 2;
        return {
            left: 0,
            right: 0,
            top: `${topPercent}%`,
            height: `${heightPercent}%`,
        };
    }
    const widthPercent = Math.min(100, Math.max(1, (safeSourceRatio / safeContainerRatio) * 100));
    const leftPercent = (100 - widthPercent) / 2;
    return {
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        top: 0,
        bottom: 0,
    };
}
function getContainedRect(sourceWidth: number, sourceHeight: number, containerWidth: number, containerHeight: number) {
    if (sourceWidth <= 0 ||
        sourceHeight <= 0 ||
        containerWidth <= 0 ||
        containerHeight <= 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }
    const scale = Math.min(containerWidth / sourceWidth, containerHeight / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    return {
        x: (containerWidth - width) / 2,
        y: (containerHeight - height) / 2,
        width,
        height,
    };
}
function waitForImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Could not load preview image."));
        image.src = url;
    });
}
function ScanProcessingOverlay({ mode, progress, style, onCancel, firstRunMessage, }: {
    mode: "upscale" | "face" | "background";
    progress: number;
    style?: CSSProperties;
    onCancel?: () => void;
    firstRunMessage?: string;
}) {
    const { t } = useManualEditorText();
    const label = mode === "upscale"
        ? t("Upscaling Image...")
        : mode === "face"
            ? t("Enhancing Face...")
            : t("Removing Background...");
    const progressPercent = Math.max(8, Math.min(100, Math.round(progress * 100)));
    return (<div className="absolute z-40 overflow-hidden rounded-2xl border border-[#FCA5A5]/30 bg-[#2A2117]/18 backdrop-blur-[1.5px] pointer-events-auto" style={style} aria-live="polite" aria-busy="true">
      <style>{`
        @keyframes manual-editor-photo-scan-sweep {
          0% {
            transform: translate3d(0, -115%, 0);
            opacity: 0.05;
          }
          8% {
            opacity: 0.55;
          }
          50% {
            opacity: 1;
          }
          92% {
            opacity: 0.55;
          }
          100% {
            transform: translate3d(0, 815%, 0);
            opacity: 0.08;
          }
        }

        @keyframes manual-editor-photo-scan-pulse {
          0%, 100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes manual-editor-photo-scan-corners {
          0%, 100% {
            opacity: 0.45;
            transform: scale(0.985);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {onCancel && (<button type="button" onClick={onCancel} className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-[#2A2117]/60 text-white shadow-lg backdrop-blur-md transition hover:bg-[#2A2117]/80 hover:text-[#FEE9E9] focus:outline-none focus:ring-2 focus:ring-[#FCA5A5]/70" title={t("Cancel processing")} aria-label={t("Cancel processing")}>
          <X className="h-3.5 w-3.5" strokeWidth={2.2}/>
        </button>)}

      <div className="absolute inset-0 bg-gradient-to-b from-[#F87171]/5 via-[#FCA5A5]/10 to-[#DC2626]/5"/>

      <div className="absolute inset-x-0 top-0 h-[14%] bg-gradient-to-b from-transparent via-[#FCA5A5]/85 to-transparent" style={{
            animation: "manual-editor-photo-scan-sweep 1.55s cubic-bezier(.4,0,.2,1) infinite alternate",
            boxShadow: "0 0 18px rgba(248,113,113,0.65), 0 0 42px rgba(220,38,38,0.28)",
            willChange: "transform",
        }}/>

      <div className="absolute inset-3 rounded-xl border border-[#FCA5A5]/25" style={{ animation: "manual-editor-photo-scan-pulse 1.6s ease-in-out infinite" }}/>

      <div className="absolute inset-4 rounded-lg" style={{
            animation: "manual-editor-photo-scan-corners 1.35s ease-in-out infinite",
        }}>
        <div className="absolute left-0 top-0 h-6 w-6 rounded-tl-md border-l-2 border-t-2 border-[#FCA5A5]/95"/>
        <div className="absolute right-0 top-0 h-6 w-6 rounded-tr-md border-r-2 border-t-2 border-[#FCA5A5]/95"/>
        <div className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-md border-b-2 border-l-2 border-[#FCA5A5]/95"/>
        <div className="absolute bottom-0 right-0 h-6 w-6 rounded-br-md border-b-2 border-r-2 border-[#FCA5A5]/95"/>
      </div>

      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-xl border border-white/15 bg-[#2A2117]/45 px-4 py-2.5 text-white shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-[#FCA5A5]" strokeWidth={1.8}/>
          <span className="text-[13px] font-extrabold tracking-wide whitespace-nowrap">
            {label}
          </span>
        </div>
        <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FEE9E9]/70"><T>{"AI scan in progress\n        "}</T></span>

        {firstRunMessage && (<span className="mt-1.5 max-w-[230px] text-center text-[11px] font-semibold leading-tight text-white/85">
            <T>{firstRunMessage}</T>
          </span>)}
      </div>

      {mode === "background" ? (<div className="absolute bottom-3 left-3 right-3 h-1 overflow-hidden rounded-full bg-white/15
          ">
          <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-[#FCA5A5] via-[#EF4444] to-[#DC2626]" style={{
                animation: "manual-editor-photo-scan-sweep 1.35s cubic-bezier(.4,0,.2,1) infinite alternate",
            }}/>
        </div>) : (<div className="absolute bottom-3 left-3 right-3 h-1 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-gradient-to-r from-[#FCA5A5] via-[#EF4444] to-[#DC2626] transition-[width] duration-300 ease-out" style={{ width: `${progressPercent}%` }}/>
        </div>)}
    </div>);
}
export default function PhotoWorkspace() {
    const { t } = useManualEditorText();
    const { activePhoto, comparisonOriginalFile, dualPhotos, activeDualSlot, setActiveDualSlot, swapDualPhotos, openFilePicker, fileInputRef, handleFileInput, handleDrop, setIsDragging, uploadError, isDragging, activeBackground, backgroundRemoved, currentPreset, photoMode, zoom, setZoom, rotation, setRotation, flipX, setFlipX, removeActivePhoto, activeAiTool, aiProcessing, aiProgress, cancelAiProcessing, isRemovingBackground, aiNotice, objectMaskDataUrl, objectBrightness, objectContrast, objectSaturation, objectHue, shadowStrength, objectTab, brightness, contrast, saturation, } = useManualEditor();
    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const previewHostRef = useRef<HTMLDivElement | null>(null);
    const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
    const [previewSource, setPreviewSource] = useState<HTMLCanvasElement | null>(null);
    const [maskImage, setMaskImage] = useState<HTMLImageElement | null>(null);
    const [compareOpen, setCompareOpen] = useState(false);
    const [comparePosition, setComparePosition] = useState(50);
    const [compareOriginalUrl, setCompareOriginalUrl] = useState<string | null>(null);
    const compareHostRef = useRef<HTMLDivElement | null>(null);
    const compareDraggingRef = useRef(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panDragRef = useRef({
        active: false,
        startX: 0,
        startY: 0,
        startPanX: 0,
        startPanY: 0,
    });
    useEffect(() => {
        setCompareOpen(false);
        setComparePosition(50);
    }, [activePhoto?.url]);
    useEffect(() => {
        setPan({ x: 0, y: 0 });
        setIsPanning(false);
        panDragRef.current.active = false;
    }, [activePhoto?.url]);
    useEffect(() => {
        if (!compareOpen || !comparisonOriginalFile) {
            setCompareOriginalUrl(null);
            return;
        }
        const url = URL.createObjectURL(comparisonOriginalFile);
        setCompareOriginalUrl(url);
        return () => {
            URL.revokeObjectURL(url);
            setCompareOriginalUrl(null);
        };
    }, [compareOpen, comparisonOriginalFile]);
    const updateComparePosition = (clientX: number) => {
        const host = compareHostRef.current;
        if (!host)
            return;
        const rect = host.getBoundingClientRect();
        if (rect.width <= 0)
            return;
        const next = ((clientX - rect.left) / rect.width) * 100;
        setComparePosition(clamp(next, 0, 100));
    };
    const handleComparePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!compareOpen)
            return;
        // Compare owns the pointer gesture. Prevent it from bubbling into the
        // photo pan handler so the comparison divider never gets "stuck" while
        // the zoom/pan canvas is also listening for pointer events.
        event.stopPropagation();
        compareDraggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        updateComparePosition(event.clientX);
    };
    const handleComparePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!compareDraggingRef.current)
            return;
        updateComparePosition(event.clientX);
    };
    const handleComparePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        compareDraggingRef.current = false;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };
    const getPanBounds = () => {
        const host = previewHostRef.current;
        if (!host || !sourceImage) {
            return { maxX: 0, maxY: 0 };
        }
        const hostWidth = Math.max(1, host.clientWidth);
        const hostHeight = Math.max(1, host.clientHeight);
        const baseRect = getContainedRect(sourceImage.naturalWidth, sourceImage.naturalHeight, hostWidth, hostHeight);
        const isQuarterTurn = Math.abs(Math.round(rotation / 90)) % 2 === 1;
        const displayedWidth = (isQuarterTurn ? baseRect.height : baseRect.width) * (zoom / 100);
        const displayedHeight = (isQuarterTurn ? baseRect.width : baseRect.height) * (zoom / 100);
        // Allow deliberate positioning at every zoom level. At zoom < 100%,
        // the image can be moved anywhere inside the card until an edge reaches
        // the card edge. At zoom > 100%, keep the movement constrained so the
        // image cannot be dragged completely out of the viewport.
        return {
            maxX: Math.max(0, Math.abs(displayedWidth - hostWidth) / 2),
            maxY: Math.max(0, Math.abs(displayedHeight - hostHeight) / 2),
        };
    };
    const clampPan = (x: number, y: number) => {
        const { maxX, maxY } = getPanBounds();
        return {
            x: clamp(x, -maxX, maxX),
            y: clamp(y, -maxY, maxY),
        };
    };
    const handlePanPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (aiProcessing ||
            isRemovingBackground ||
            compareOpen ||
            activeAiTool === "object" ||
            !sourceImage) {
            return;
        }
        const current = pan;
        panDragRef.current = {
            active: true,
            startX: event.clientX,
            startY: event.clientY,
            startPanX: current.x,
            startPanY: current.y,
        };
        setIsPanning(true);
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const handlePanPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!panDragRef.current.active)
            return;
        const deltaX = event.clientX - panDragRef.current.startX;
        const deltaY = event.clientY - panDragRef.current.startY;
        const next = clampPan(panDragRef.current.startPanX + deltaX, panDragRef.current.startPanY + deltaY);
        setPan(next);
    };
    const finishPan = (event: ReactPointerEvent<HTMLDivElement>) => {
        panDragRef.current.active = false;
        setIsPanning(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };
    useEffect(() => {
        setPan((current) => clampPan(current.x, current.y));
    }, [zoom, rotation, sourceImage]);
    useEffect(() => {
        const host = previewHostRef.current;
        if (!host)
            return;
        const resizeObserver = new ResizeObserver(() => {
            setPan((current) => clampPan(current.x, current.y));
        });
        resizeObserver.observe(host);
        return () => resizeObserver.disconnect();
    }, [sourceImage, zoom, rotation]);
    const hasComparison = Boolean(activePhoto && comparisonOriginalFile);
    /* Photo -> image element + a downscaled copy used for fast previews. */
    useEffect(() => {
        let cancelled = false;
        let createdCanvas: HTMLCanvasElement | null = null;
        setSourceImage(null);
        setPreviewSource(null);
        if (!activePhoto?.url) {
            return;
        }
        void waitForImage(activePhoto.url)
            .then((image) => {
            if (cancelled)
                return;
            const size = fitSize(image.naturalWidth, image.naturalHeight, PREVIEW_MAX_SIDE);
            createdCanvas = createCanvas(size.width, size.height);
            get2d(createdCanvas).drawImage(image, 0, 0, size.width, size.height);
            setSourceImage(image);
            setPreviewSource(createdCanvas);
        })
            .catch(() => {
            // Preview simply stays hidden if the photo cannot be decoded.
        });
        return () => {
            cancelled = true;
            releaseCanvas(createdCanvas);
        };
    }, [activePhoto?.url]);
    /* Selection mask -> image element. */
    useEffect(() => {
        let cancelled = false;
        if (!objectMaskDataUrl) {
            setMaskImage(null);
            return;
        }
        // The previous mask stays until the new one has decoded, so brush
        // strokes do not make the preview flicker.
        void waitForImage(objectMaskDataUrl)
            .then((image) => {
            if (!cancelled)
                setMaskImage(image);
        })
            .catch(() => {
            // Without a readable mask there is nothing to preview.
        });
        return () => {
            cancelled = true;
        };
    }, [objectMaskDataUrl]);
    /*
     * Live Object Adjust preview, rendered with fabric.js. Global
     * brightness/contrast/saturation is applied by a CSS filter on the
     * canvas, exactly like the plain <img> underneath it.
     */
    useEffect(() => {
        const canvas = previewCanvasRef.current;
        const host = previewHostRef.current;
        if (!canvas ||
            !host ||
            !activePhoto ||
            activeAiTool !== "object" ||
            !sourceImage ||
            !previewSource ||
            !maskImage) {
            if (canvas) {
                canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }
        let cancelled = false;
        let frameId = 0;
        let renderToken = 0;
        const draw = async () => {
            const token = ++renderToken;
            const cssWidth = Math.max(1, Math.round(host.clientWidth));
            const cssHeight = Math.max(1, Math.round(host.clientHeight));
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            const imageRect = getContainedRect(sourceImage.naturalWidth, sourceImage.naturalHeight, cssWidth, cssHeight);
            if (imageRect.width <= 0 || imageRect.height <= 0) {
                return;
            }
            try {
                const adjusted = await renderObjectAdjust({
                    source: previewSource,
                    mask: maskImage,
                    width: previewSource.width,
                    height: previewSource.height,
                    params: {
                        target: objectTab,
                        brightness: objectBrightness,
                        contrast: objectContrast,
                        saturation: objectSaturation,
                        hue: objectHue,
                        shadowStrength,
                    },
                });
                if (cancelled || token !== renderToken) {
                    releaseCanvas(adjusted);
                    return;
                }
                canvas.width = Math.round(cssWidth * dpr);
                canvas.height = Math.round(cssHeight * dpr);
                canvas.style.width = `${cssWidth}px`;
                canvas.style.height = `${cssHeight}px`;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                    ctx.clearRect(0, 0, cssWidth, cssHeight);
                    ctx.imageSmoothingQuality = "high";
                    ctx.drawImage(adjusted, imageRect.x, imageRect.y, imageRect.width, imageRect.height);
                }
                releaseCanvas(adjusted);
            }
            catch {
                // Keep the last good frame if a single render fails.
            }
        };
        const scheduleRender = () => {
            if (frameId)
                window.cancelAnimationFrame(frameId);
            frameId = window.requestAnimationFrame(() => void draw());
        };
        scheduleRender();
        const resizeObserver = new ResizeObserver(scheduleRender);
        resizeObserver.observe(host);
        return () => {
            cancelled = true;
            if (frameId)
                window.cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
        };
    }, [
        activePhoto,
        activeAiTool,
        sourceImage,
        previewSource,
        maskImage,
        objectBrightness,
        objectContrast,
        objectSaturation,
        objectHue,
        shadowStrength,
        objectTab,
        currentPreset.widthMm,
        currentPreset.heightMm,
    ]);
    const scanMode = aiProcessing ?? (isRemovingBackground ? "background" : null);
    const isFirstBackgroundRun = isRemovingBackground &&
        aiNotice ===
            "First-time setup may take a little longer while the AI model loads.";
    const transform = `rotate(${rotation}deg) scaleX(${flipX ? -1 : 1}) scale(${zoom / 100})`;
    const photoTransform = `translate3d(${pan.x}px, ${pan.y}px, 0) ${transform}`;
    const canPan = Boolean(sourceImage) &&
        !aiProcessing &&
        !isRemovingBackground &&
        !compareOpen &&
        activeAiTool !== "object";
    const presetRatio = currentPreset.heightMm > 0
        ? currentPreset.widthMm / currentPreset.heightMm
        : 1;
    const presetSizeText = `${currentPreset.widthMm} × ${currentPreset.heightMm} mm`;
    return (<>
      <main className="lg:col-span-6 bg-[#F2E8D2] border border-[#E3D6B8] rounded-3xl p-5 md:p-6 lg:p-4 flex flex-col items-center justify-center relative min-h-[520px] lg:min-h-0 lg:h-full lg:overflow-y-auto [--canvas-max:400px] lg:[--canvas-max:min(440px,46vh)] shadow-lg text-[#3B2F1E]">
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleFileInput} className="hidden"/>

        {!activePhoto && photoMode !== "dual" ? (<div className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 bg-[#F6EEDB] cursor-pointer transition ${isDragging
                ? "border-[#DC2626] ring-2 ring-[#DC2626]/40"
                : "border-[#D8C9A6] hover:border-[#DC2626]"}`} style={getResponsiveCanvasStyle(presetRatio)} onClick={openFilePicker} onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
            }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
            }} onDrop={handleDrop}>
            <div className="w-12 h-12 rounded-full bg-[#FBF6E8] flex items-center justify-center text-[#3B2F1E] border border-[#E3D6B8] shadow-sm">
              <ImageIcon size={22}/>
            </div>

            <div>
              <h3 className="text-[#3B2F1E] text-lg font-bold">
                {isDragging ? <T>{"Drop your photo here"}</T> : <T>{"Upload a Photo"}</T>}
              </h3>
              <p className="text-[#6B5A40] text-sm mt-1"><T>{"Click or drag &amp; drop to upload\n              "}</T></p>
              <div className="mt-2 inline-flex px-3 py-1 rounded-full bg-[#FBF6E8] border border-[#E3D6B8] text-[13px] font-semibold text-[#3B2F1E] shadow-sm">
                {currentPreset.label}
              </div>
              <div className="mt-1 text-[11px] text-[#6B5A40] font-semibold">
                {presetSizeText}
              </div>
            </div>

            <button type="button" onClick={(event) => {
                event.stopPropagation();
                openFilePicker();
            }} className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold text-sm px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition">
              <Upload size={14}/><T>{"Upload Photo\n            "}</T></button>

            <div className="border border-[#E3D6B8] bg-[#FBF6E8] px-2.5 py-0.5 rounded-md text-[12px] font-mono text-[#5A4A32] shadow-sm"><T>{"Ctrl+U\n            "}</T></div>
            <p className="text-[11px] text-[#6B5A40]"><T>{"JPG, PNG, WEBP \u2022 Max 10 MB\n            "}</T></p>
          </div>) : (<div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
            {photoMode === "dual" ? (<>
                <div className="w-full max-w-[760px] rounded-2xl border border-[#E3D6B8] bg-[#F6EEDB] p-4">
                  <div className="text-center mb-3">
                    <div className="text-[13px] font-extrabold text-[#3B2F1E]">
                      {currentPreset.label}
                    </div>
                    <div className="text-[11px] text-[#6B5A40] mt-0.5">
                      {presetSizeText}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full items-start">
                    {[0, 1].map((index) => {
                    const photo = dualPhotos[index as 0 | 1];
                    return (<div key={index} onClick={() => setActiveDualSlot(index as 0 | 1)} className={`relative w-full overflow-hidden rounded-xl border-2 ${activeDualSlot === index
                            ? "border-[#DC2626]"
                            : "border-[#E3D6B8]"} bg-[#FBF6E8] flex items-center justify-center cursor-pointer transition shadow-sm`} style={{
                            aspectRatio: presetRatio,
                            boxSizing: "border-box",
                            transition: "aspect-ratio 180ms ease",
                        }}>
                          {photo ? (<img src={photo.url} alt={`Photo ${index + 1}`} className="block w-full h-full object-contain"/>) : (<div className="text-sm text-[#7A6A50] text-center">
                              <div className="font-bold text-[#5A4A32]"><T>{"Empty "}</T>{index === 0 ? <T>{"Left"}</T> : <T>{"Right"}</T>}<T>{"Slot\n                              "}</T></div>
                              <div className="text-[11px] text-[#7A6A50] mt-1">
                                {presetSizeText}
                              </div>
                            </div>)}

                          {activeDualSlot === index && (<div className="absolute left-2 top-2 rounded-full bg-[#10B981] text-white px-2 py-1 text-[11px] font-extrabold shadow-sm"><T>{"ACTIVE\n                            "}</T></div>)}
                        </div>);
                })}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap justify-center">
                  <button type="button" onClick={() => setActiveDualSlot(0)} className={`px-4 py-2 rounded-xl text-sm font-extrabold transition ${activeDualSlot === 0
                    ? "bg-[#DC2626] text-white shadow-md"
                    : "bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8]"}`}><T>{"Left\n                  "}</T></button>
                  <button type="button" onClick={() => setActiveDualSlot(1)} className={`px-4 py-2 rounded-xl text-sm font-extrabold transition ${activeDualSlot === 1
                    ? "bg-[#DC2626] text-white shadow-md"
                    : "bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8]"}`}><T>{"Right\n                  "}</T></button>
                  <button type="button" onClick={swapDualPhotos} className="px-4 py-2 rounded-xl bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8] text-sm font-extrabold flex gap-2 items-center transition">
                    <ArrowLeftRight size={14}/><T>{"Swap\n                  "}</T></button>
                  <button type="button" onClick={openFilePicker} className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-extrabold transition shadow-sm">
                    <Upload size={14} className="inline mr-1"/><T>{"Upload slot\n                  "}</T></button>
                </div>
              </>) : (<>
                <div className="flex flex-col items-center gap-2">
                  <div className="text-[13px] font-extrabold text-[#3B2F1E]">
                    <T>{currentPreset.label}</T>
                  </div>
                  <div className="text-[11px] text-[#6B5A40]">
                    {presetSizeText}
                  </div>
                </div>

                <div ref={previewHostRef} className={`relative overflow-hidden rounded-2xl border border-[#E3D6B8] shadow-xl flex items-center justify-center ${canPan ? (isPanning ? "cursor-grabbing" : "cursor-grab") : ""}`} onPointerDown={handlePanPointerDown} onPointerMove={handlePanPointerMove} onPointerUp={finishPan} onPointerCancel={finishPan} style={{
                    ...getResponsiveCanvasStyle(presetRatio),
                    backgroundColor: activeBackground,
                    touchAction: canPan ? "none" : undefined,
                }}>
                  <div className="absolute inset-0 select-none pointer-events-none" style={{
                    transform: photoTransform,
                    transformOrigin: "center",
                    willChange: canPan ? "transform" : undefined,
                }}>
                    {compareOpen && compareOriginalUrl ? (<div ref={compareHostRef} className="absolute inset-0 z-50 overflow-hidden select-none touch-none cursor-col-resize pointer-events-auto" onPointerDown={(event) => {
                        event.preventDefault();
                        handleComparePointerDown(event);
                    }} onPointerMove={handleComparePointerMove} onPointerUp={handleComparePointerUp} onPointerCancel={handleComparePointerUp} onDoubleClick={(event) => {
                        event.stopPropagation();
                        setComparePosition(50);
                    }} role="group" aria-label={t("Before and after image comparison")}>
                        <img src={compareOriginalUrl} alt={t("Original photo")} className="absolute inset-0 block h-full w-full object-contain" draggable={false}/>

                        <div className="absolute inset-0 overflow-hidden" style={{
                        clipPath: `inset(0 ${100 - comparePosition}% 0 0)`,
                        backgroundColor: backgroundRemoved
                            ? activeBackground
                            : "transparent",
                    }}>
                          <img src={activePhoto!.url} alt={t("Edited photo")} className="absolute inset-0 block h-full w-full object-contain" style={{
                        filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`,
                    }} draggable={false}/>
                        </div>

                        <div className="pointer-events-none absolute inset-y-0 w-[2px] bg-white shadow-[0_0_0_1px_rgba(59,47,30,0.18),0_0_18px_rgba(248,113,113,0.65)]" style={{ left: `calc(${comparePosition}% - 1px)` }}>
                          <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#2A2117]/80 text-white shadow-xl backdrop-blur-sm">
                            <ArrowLeftRight className="h-4 w-4" strokeWidth={2.4}/>
                          </div>
                        </div>

                        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/30 bg-[#2A2117]/70 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white shadow-lg backdrop-blur-sm"><T>{"Edited\n                        "}</T></div>
                        <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/30 bg-[#2A2117]/65 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white shadow-lg backdrop-blur-sm"><T>{"Original\n                        "}</T></div>
                      </div>) : (<img src={activePhoto!.url} alt={t("Uploaded")} className="absolute inset-0 block w-full h-full object-contain pointer-events-none select-none" draggable={false} onDragStart={(event) => event.preventDefault()} style={{
                        filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`,
                    }}/>)}

                    {!compareOpen && activeAiTool === "object" && objectMaskDataUrl && (<canvas ref={previewCanvasRef} className="absolute inset-0 pointer-events-none" style={{
                        filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`,
                    }}/>)}

                    {scanMode && (<ScanProcessingOverlay mode={scanMode} progress={aiProgress} onCancel={scanMode === "background" ? undefined : cancelAiProcessing} firstRunMessage={isFirstBackgroundRun
                        ? "First-time setup may take a little longer while the AI model loads."
                        : undefined} style={getScanOverlayStyle(sourceImage
                        ? sourceImage.naturalWidth /
                            Math.max(1, sourceImage.naturalHeight)
                        : presetRatio, presetRatio)}/>)}
                  </div>

                  {!compareOpen && activeAiTool === "object" && objectMaskDataUrl && (<ObjectMaskCanvas />)}

                  {!aiProcessing && !compareOpen && (<button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={removeActivePhoto} className="absolute right-3 top-3 h-8 w-8 rounded-full bg-[#3B2F1E]/60 hover:bg-[#3B2F1E]/80 text-white flex items-center justify-center z-40 transition" title={t("Remove photo")}>
                      <X size={14}/>
                    </button>)}
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button type="button" onClick={() => setZoom(Math.max(25, zoom - 10))} className="h-9 w-9 rounded-lg bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8] flex items-center justify-center transition" title={t("Zoom out")}>
                    <ZoomOut size={14}/>
                  </button>
                  <span className="h-9 px-3 rounded-lg bg-[#FBF6E8] text-[#3B2F1E] flex items-center text-sm font-extrabold">
                    {zoom}<T>{"%\n                  "}</T></span>
                  <button type="button" onClick={() => setZoom(Math.min(300, zoom + 10))} className="h-9 w-9 rounded-lg bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8] flex items-center justify-center transition" title={t("Zoom in")}>
                    <ZoomIn size={14}/>
                  </button>
                  <button type="button" onClick={() => setRotation((rotation - 90 + 360) % 360)} className="h-9 px-3 rounded-lg bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8] text-sm font-extrabold flex items-center gap-1 transition">
                    <RotateCcw size={13}/><T>{"Rotate\n                  "}</T></button>
                  <button type="button" onClick={() => setRotation((rotation + 90) % 360)} className="h-9 px-3 rounded-lg bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8] text-sm font-extrabold flex items-center gap-1 transition">
                    <RotateCw size={13}/><T>{"Rotate\n                  "}</T></button>
                  <button type="button" onClick={() => setFlipX(!flipX)} className={`h-9 px-3 rounded-lg text-sm font-extrabold flex items-center gap-1 transition ${flipX
                    ? "bg-[#DC2626] text-white shadow-md"
                    : "bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8]"}`}>
                    <FlipHorizontal2 size={13}/><T>{"Mirror\n                  "}</T></button>
                  {hasComparison && (<button type="button" disabled={Boolean(aiProcessing)} onClick={() => setCompareOpen((current) => !current)} className={`h-9 px-3 rounded-lg text-sm font-extrabold flex items-center gap-1 transition ${compareOpen
                        ? "bg-[#DC2626] text-white shadow-md"
                        : "bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8]"} disabled:cursor-not-allowed disabled:opacity-50`} title={t("Compare edited and original")} aria-pressed={compareOpen}>
                      <ArrowLeftRight size={13}/><T>{"Compare\n                    "}</T></button>)}
                  <button type="button" onClick={() => {
                    setZoom(100);
                    setRotation(0);
                    setFlipX(false);
                }} className="h-9 px-3 rounded-lg bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8] text-sm font-extrabold flex items-center gap-1 transition">
                    <Maximize2 size={13}/><T>{"Reset\n                  "}</T></button>
                </div>
              </>)}

            {uploadError && (<div className="absolute bottom-3 left-4 right-4 rounded-xl border border-red-500/30 bg-red-50 px-4 py-2 text-center text-[12px] font-semibold text-red-600 shadow-sm">
                <T>{uploadError}</T>
              </div>)}
          </div>)}
      </main>
      <CropEditor />
    </>);
}
