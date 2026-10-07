"use client";

import {
  ArrowLeftRight,
  FlipHorizontal2,
  Image as ImageIcon,
  Maximize2,
  RotateCcw,
  RotateCw,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const safeRatio = clamp(
    Number.isFinite(ratio) && ratio > 0 ? ratio : 1,
    0.15,
    6,
  );
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

function getContainedRect(
  sourceWidth: number,
  sourceHeight: number,
  containerWidth: number,
  containerHeight: number,
) {
  if (
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    containerWidth <= 0 ||
    containerHeight <= 0
  ) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const scale = Math.min(
    containerWidth / sourceWidth,
    containerHeight / sourceHeight,
  );

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

export default function PhotoWorkspace() {
  const {
    activePhoto,
    dualPhotos,
    activeDualSlot,
    setActiveDualSlot,
    swapDualPhotos,
    openFilePicker,
    fileInputRef,
    handleFileInput,
    handleDrop,
    setIsDragging,
    uploadError,
    isDragging,
    activeBackground,
    currentPreset,
    photoMode,
    zoom,
    setZoom,
    rotation,
    setRotation,
    flipX,
    setFlipX,
    removeActivePhoto,
    activeAiTool,
    objectMaskDataUrl,
    objectBrightness,
    objectContrast,
    objectSaturation,
    objectHue,
    shadowStrength,
    objectTab,
    brightness,
    contrast,
    saturation,
  } = useManualEditor();

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewHostRef = useRef<HTMLDivElement | null>(null);

  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [previewSource, setPreviewSource] = useState<HTMLCanvasElement | null>(
    null,
  );
  const [maskImage, setMaskImage] = useState<HTMLImageElement | null>(null);

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
        if (cancelled) return;

        const size = fitSize(
          image.naturalWidth,
          image.naturalHeight,
          PREVIEW_MAX_SIDE,
        );

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
        if (!cancelled) setMaskImage(image);
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

    if (
      !canvas ||
      !host ||
      !activePhoto ||
      activeAiTool !== "object" ||
      !sourceImage ||
      !previewSource ||
      !maskImage
    ) {
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

      const imageRect = getContainedRect(
        sourceImage.naturalWidth,
        sourceImage.naturalHeight,
        cssWidth,
        cssHeight,
      );

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
          ctx.drawImage(
            adjusted,
            imageRect.x,
            imageRect.y,
            imageRect.width,
            imageRect.height,
          );
        }

        releaseCanvas(adjusted);
      } catch {
        // Keep the last good frame if a single render fails.
      }
    };

    const scheduleRender = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => void draw());
    };

    scheduleRender();

    const resizeObserver = new ResizeObserver(scheduleRender);
    resizeObserver.observe(host);

    return () => {
      cancelled = true;
      if (frameId) window.cancelAnimationFrame(frameId);
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

  const transform = `rotate(${rotation}deg) scaleX(${flipX ? -1 : 1}) scale(${zoom / 100})`;
  const presetRatio =
    currentPreset.heightMm > 0
      ? currentPreset.widthMm / currentPreset.heightMm
      : 1;
  const presetSizeText = `${currentPreset.widthMm} × ${currentPreset.heightMm} mm`;

  return (
    <>
      <main className="lg:col-span-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-5 md:p-6 lg:p-4 flex flex-col items-center justify-center relative min-h-[520px] lg:min-h-0 lg:h-full lg:overflow-y-auto [--canvas-max:400px] lg:[--canvas-max:min(440px,46vh)] shadow-lg text-[#0F172A]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />

        {!activePhoto && photoMode !== "dual" ? (
          <div
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 bg-[#E2E8F0]/40 cursor-pointer transition ${
              isDragging
                ? "border-[#2563EB] ring-2 ring-[#2563EB]/30"
                : "border-slate-300 hover:border-[#2563EB]"
            }`}
            style={getResponsiveCanvasStyle(presetRatio)}
            onClick={openFilePicker}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
          >
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#0F172A] border border-[#E2E8F0] shadow-sm">
              <ImageIcon size={22} />
            </div>

            <div>
              <h3 className="text-[#0F172A] text-base font-bold">
                {isDragging ? "Drop your photo here" : "Upload a Photo"}
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Click or drag &amp; drop to upload
              </p>
              <div className="mt-2 inline-flex px-3 py-1 rounded-full bg-white border border-[#E2E8F0] text-[11px] font-semibold text-[#0F172A] shadow-sm">
                {currentPreset.label}
              </div>
              <div className="mt-1 text-[9px] text-slate-500 font-semibold">
                {presetSizeText}
              </div>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openFilePicker();
              }}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
            >
              <Upload size={14} />
              Upload Photo
            </button>

            <div className="border border-[#E2E8F0] bg-white px-2.5 py-0.5 rounded-md text-[10px] font-mono text-slate-600 shadow-sm">
              Ctrl+U
            </div>
            <p className="text-[9px] text-slate-500">
              JPG, PNG, WEBP • Max 10 MB
            </p>
          </div>
        ) : (
          <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
            {photoMode === "dual" ? (
              <>
                <div className="w-full max-w-[760px] rounded-2xl border border-[#E2E8F0] bg-[#E2E8F0]/30 p-4">
                  <div className="text-center mb-3">
                    <div className="text-[11px] font-black text-[#0F172A]">
                      {currentPreset.label}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {presetSizeText}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full items-start">
                    {[0, 1].map((index) => {
                      const photo = dualPhotos[index as 0 | 1];

                      return (
                        <div
                          key={index}
                          onClick={() => setActiveDualSlot(index as 0 | 1)}
                          className={`relative w-full overflow-hidden rounded-xl border-2 ${
                            activeDualSlot === index
                              ? "border-[#2563EB]"
                              : "border-[#E2E8F0]"
                          } bg-white flex items-center justify-center cursor-pointer transition shadow-sm`}
                          style={{
                            aspectRatio: presetRatio,
                            boxSizing: "border-box",
                            transition: "aspect-ratio 180ms ease",
                          }}
                        >
                          {photo ? (
                            <img
                              src={photo.url}
                              alt={`Photo ${index + 1}`}
                              className="block w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-xs text-slate-400 text-center">
                              <div className="font-bold text-slate-600">
                                Empty {index === 0 ? "Left" : "Right"} Slot
                              </div>
                              <div className="text-[9px] text-slate-400 mt-1">
                                {presetSizeText}
                              </div>
                            </div>
                          )}

                          {activeDualSlot === index && (
                            <div className="absolute left-2 top-2 rounded-full bg-[#10B981] text-white px-2 py-1 text-[8px] font-black shadow-sm">
                              ACTIVE
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => setActiveDualSlot(0)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                      activeDualSlot === 0
                        ? "bg-[#2563EB] text-white shadow-md"
                        : "bg-[#E2E8F0] text-[#0F172A] hover:bg-slate-300"
                    }`}
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDualSlot(1)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                      activeDualSlot === 1
                        ? "bg-[#2563EB] text-white shadow-md"
                        : "bg-[#E2E8F0] text-[#0F172A] hover:bg-slate-300"
                    }`}
                  >
                    Right
                  </button>
                  <button
                    type="button"
                    onClick={swapDualPhotos}
                    className="px-4 py-2 rounded-xl bg-[#E2E8F0] text-[#0F172A] hover:bg-slate-300 text-xs font-black flex gap-2 items-center transition"
                  >
                    <ArrowLeftRight size={14} />
                    Swap
                  </button>
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-black transition shadow-sm"
                  >
                    <Upload size={14} className="inline mr-1" />
                    Upload slot
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2">
                  <div className="text-[11px] font-black text-[#0F172A]">
                    {currentPreset.label}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {presetSizeText}
                  </div>
                </div>

                <div
                  ref={previewHostRef}
                  className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-xl flex items-center justify-center"
                  style={{
                    ...getResponsiveCanvasStyle(presetRatio),
                    backgroundColor: activeBackground,
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      transform,
                      transformOrigin: "center",
                    }}
                  >
                    <img
                      src={activePhoto!.url}
                      alt="Uploaded"
                      className="absolute inset-0 block w-full h-full object-contain"
                      style={{
                        filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`,
                      }}
                    />

                    {activeAiTool === "object" && objectMaskDataUrl && (
                      <canvas
                        ref={previewCanvasRef}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`,
                        }}
                      />
                    )}
                  </div>

                  {activeAiTool === "object" && objectMaskDataUrl && (
                    <ObjectMaskCanvas />
                  )}

                  <button
                    type="button"
                    onClick={removeActivePhoto}
                    className="absolute right-3 top-3 h-8 w-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center z-40 transition"
                    title="Remove photo"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => setZoom(Math.max(25, zoom - 10))}
                    className="h-9 w-9 rounded-lg bg-[#E2E8F0] text-[#0F172A] hover:bg-slate-300 flex items-center justify-center transition"
                    title="Zoom out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="h-9 px-3 rounded-lg bg-[#E2E8F0] text-[#0F172A] flex items-center text-xs font-black">
                    {zoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom(Math.min(300, zoom + 10))}
                    className="h-9 w-9 rounded-lg bg-[#E2E8F0] text-[#0F172A] hover:bg-slate-300 flex items-center justify-center transition"
                    title="Zoom in"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((rotation - 90 + 360) % 360)}
                    className="h-9 px-3 rounded-lg bg-[#E2E8F0] text-[#0F172A] hover:bg-slate-300 text-xs font-black flex items-center gap-1 transition"
                  >
                    <RotateCcw size={13} />
                    Rotate
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((rotation + 90) % 360)}
                    className="h-9 px-3 rounded-lg bg-[#E2E8F0] text-[#0F172A] hover:bg-slate-300 text-xs font-black flex items-center gap-1 transition"
                  >
                    <RotateCw size={13} />
                    Rotate
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipX(!flipX)}
                    className={`h-9 px-3 rounded-lg text-xs font-black flex items-center gap-1 transition ${
                      flipX
                        ? "bg-[#2563EB] text-white shadow-md"
                        : "bg-[#E2E8F0] text-[#0F172A] hover:bg-slate-300"
                    }`}
                  >
                    <FlipHorizontal2 size={13} />
                    Mirror
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(100);
                      setRotation(0);
                      setFlipX(false);
                    }}
                    className="h-9 px-3 rounded-lg bg-[#E2E8F0] text-[#0F172A] hover:bg-slate-300 text-xs font-black flex items-center gap-1 transition"
                  >
                    <Maximize2 size={13} />
                    Reset
                  </button>
                </div>
              </>
            )}

            {uploadError && (
              <div className="absolute bottom-3 left-4 right-4 rounded-xl border border-red-500/30 bg-red-50 px-4 py-2 text-center text-[10px] font-semibold text-red-600 shadow-sm">
                {uploadError}
              </div>
            )}
          </div>
        )}
      </main>
      <CropEditor />
    </>
  );
}
