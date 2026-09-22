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
import { useEffect, useRef } from "react";
import { useManualEditor } from "./EditorProvider";
import CropEditor from "./CropEditor";
import ObjectMaskCanvas from "./ObjectMaskCanvas";

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
    width: `min(72vw, 420px, calc(400px * ${safeRatio}))`,
    height: `min(400px, calc(72vw * ${inverseRatio}), calc(420px * ${inverseRatio}))`,
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

function maskAlphaFromImageData(data: Uint8ClampedArray) {
  let minAlpha = 255;
  let maxAlpha = 0;

  for (let index = 3; index < data.length; index += 4) {
    const alpha = data[index];
    if (alpha < minAlpha) minAlpha = alpha;
    if (alpha > maxAlpha) maxAlpha = alpha;
  }

  // New backend masks use alpha. Older masks were grayscale PNGs with
  // alpha=255 everywhere, so fall back to the red/gray channel in that case.
  const useAlpha = minAlpha < 250 || maxAlpha < 250;

  return (index: number) => (useAlpha ? data[index + 3] : data[index]);
}

function adjustObjectTone(
  r: number,
  g: number,
  b: number,
  brightness: number,
  contrast: number,
  target: "face" | "skin" | "hair",
) {
  let scale = 0.95;
  if (target === "hair") scale = 1.1;
  if (target === "skin") scale = 0.9;

  const blue = b;
  const green = g;
  const red = r;
  const luma = 0.0722 * blue + 0.7152 * green + 0.2126 * red;

  const contrastFactor = 1 + ((contrast - 100) / 100) * 0.45;
  const brightnessDelta = (brightness - 100) * 0.8 * scale;
  const newLuma = clamp(
    (luma - 128) * contrastFactor + 128 + brightnessDelta,
    0,
    255,
  );

  const gain = clamp(newLuma / Math.max(luma, 20), 0.15, 3);

  return {
    r: clamp(red * gain, 0, 255),
    g: clamp(green * gain, 0, 255),
    b: clamp(blue * gain, 0, 255),
  };
}

function applyGlobalTone(
  r: number,
  g: number,
  b: number,
  brightness: number,
  contrast: number,
  saturation: number,
) {
  const brightnessFactor = clamp((100 + brightness) / 100, 0, 3);
  const contrastFactor = clamp((100 + contrast) / 100, 0, 3);
  const saturationFactor = clamp((100 + saturation) / 100, 0, 3);

  let nextR = (r * brightnessFactor - 128) * contrastFactor + 128;
  let nextG = (g * brightnessFactor - 128) * contrastFactor + 128;
  let nextB = (b * brightnessFactor - 128) * contrastFactor + 128;

  const luma = 0.2126 * nextR + 0.7152 * nextG + 0.0722 * nextB;
  nextR = luma + (nextR - luma) * saturationFactor;
  nextG = luma + (nextG - luma) * saturationFactor;
  nextB = luma + (nextB - luma) * saturationFactor;

  return {
    r: clamp(nextR, 0, 255),
    g: clamp(nextG, 0, 255),
    b: clamp(nextB, 0, 255),
  };
}

function buildLumaCanvas(sourceData: ImageData, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const output = ctx.createImageData(width, height);
  const source = sourceData.data;
  const target = output.data;

  for (let index = 0; index < source.length; index += 4) {
    const r = source[index];
    const g = source[index + 1];
    const b = source[index + 2];
    const luma = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

    target[index] = luma;
    target[index + 1] = luma;
    target[index + 2] = luma;
    target[index + 3] = 255;
  }

  ctx.putImageData(output, 0, 0);
  return canvas;
}

function getBlurredLumaData(lumaCanvas: HTMLCanvasElement) {
  const width = lumaCanvas.width;
  const height = lumaCanvas.height;
  const blurSource = document.createElement("canvas");
  blurSource.width = width;
  blurSource.height = height;
  const blurCtx = blurSource.getContext("2d", { willReadFrequently: true });
  if (!blurCtx) return null;

  blurCtx.filter = "blur(21px)";
  blurCtx.drawImage(lumaCanvas, 0, 0);
  blurCtx.filter = "none";

  return blurCtx.getImageData(0, 0, width, height).data;
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
    shadowStrength,
    objectTab,
    brightness,
    contrast,
    saturation,
  } = useManualEditor();

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewHostRef = useRef<HTMLDivElement | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const maskImageRef = useRef<HTMLImageElement | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const maskUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!activePhoto?.url) {
      sourceImageRef.current = null;
      sourceUrlRef.current = null;
      return;
    }

    if (sourceUrlRef.current === activePhoto.url && sourceImageRef.current) {
      return;
    }

    void waitForImage(activePhoto.url)
      .then((image) => {
        if (cancelled) return;
        sourceImageRef.current = image;
        sourceUrlRef.current = activePhoto.url;
      })
      .catch(() => {
        if (cancelled) return;
        sourceImageRef.current = null;
        sourceUrlRef.current = activePhoto.url;
      });

    return () => {
      cancelled = true;
    };
  }, [activePhoto?.url]);

  useEffect(() => {
    let cancelled = false;

    if (!objectMaskDataUrl) {
      maskImageRef.current = null;
      maskUrlRef.current = null;
      return;
    }

    if (maskUrlRef.current === objectMaskDataUrl && maskImageRef.current) {
      return;
    }

    void waitForImage(objectMaskDataUrl)
      .then((image) => {
        if (cancelled) return;
        maskImageRef.current = image;
        maskUrlRef.current = objectMaskDataUrl;
      })
      .catch(() => {
        if (cancelled) return;
        maskImageRef.current = null;
        maskUrlRef.current = objectMaskDataUrl;
      });

    return () => {
      cancelled = true;
    };
  }, [objectMaskDataUrl]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const host = previewHostRef.current;

    if (!canvas || !host || !activePhoto || activeAiTool !== "object") {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    let cancelled = false;
    let frameId = 0;

    const render = () => {
      if (cancelled) return;

      const sourceImage = sourceImageRef.current;
      const maskImage = maskImageRef.current;

      if (!sourceImage || !maskImage) {
        frameId = window.requestAnimationFrame(render);
        return;
      }

      const cssWidth = Math.max(1, Math.round(host.clientWidth));
      const cssHeight = Math.max(1, Math.round(host.clientHeight));
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      const imageRect = getContainedRect(
        sourceImage.naturalWidth,
        sourceImage.naturalHeight,
        cssWidth,
        cssHeight,
      );

      if (imageRect.width <= 0 || imageRect.height <= 0) {
        return;
      }

      const previewWidth = Math.max(1, Math.round(imageRect.width));
      const previewHeight = Math.max(1, Math.round(imageRect.height));

      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = previewWidth;
      sourceCanvas.height = previewHeight;
      const sourceCtx = sourceCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!sourceCtx) return;

      sourceCtx.drawImage(sourceImage, 0, 0, previewWidth, previewHeight);

      const sourceData = sourceCtx.getImageData(
        0,
        0,
        previewWidth,
        previewHeight,
      );

      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = previewWidth;
      maskCanvas.height = previewHeight;
      const maskCtx = maskCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!maskCtx) return;

      maskCtx.drawImage(maskImage, 0, 0, previewWidth, previewHeight);

      const maskData = maskCtx.getImageData(0, 0, previewWidth, previewHeight);

      const getMaskAlpha = maskAlphaFromImageData(maskData.data);
      const pixels = sourceData.data;

      let blurredLumaData: Uint8ClampedArray | null = null;
      if (objectTab === "shadow") {
        const lumaCanvas = buildLumaCanvas(
          sourceData,
          previewWidth,
          previewHeight,
        );
        if (lumaCanvas) {
          blurredLumaData = getBlurredLumaData(lumaCanvas);
        }
      }

      for (let index = 0; index < pixels.length; index += 4) {
        const maskAlpha = getMaskAlpha(index);
        const blend = maskAlpha / 255;

        const originalR = pixels[index];
        const originalG = pixels[index + 1];
        const originalB = pixels[index + 2];

        let objectBlendedR = originalR;
        let objectBlendedG = originalG;
        let objectBlendedB = originalB;

        if (maskAlpha >= 2) {
          let localR = originalR;
          let localG = originalG;
          let localB = originalB;

          if (objectTab === "shadow") {
            const lumaIndex = index;
            const luma =
              0.2126 * originalR + 0.7152 * originalG + 0.0722 * originalB;
            const local = blurredLumaData ? blurredLumaData[lumaIndex] : luma;
            const darkness = Math.max(local - luma, 0);
            const lift = Math.min(darkness * (shadowStrength / 100) * 0.82, 44);
            const newLuma = clamp(luma + lift, 0, 255);
            const gain = newLuma / Math.max(luma, 20);

            localR = clamp(originalR * gain, 0, 255);
            localG = clamp(originalG * gain, 0, 255);
            localB = clamp(originalB * gain, 0, 255);
          } else {
            const adjusted = adjustObjectTone(
              originalR,
              originalG,
              originalB,
              objectBrightness,
              objectContrast,
              objectTab,
            );
            localR = adjusted.r;
            localG = adjusted.g;
            localB = adjusted.b;
          }

          // Object Adjust is calculated first, then the normal Image Adjustments
          // are applied to the complete result. This mirrors the final exported
          // image after Object Adjust has been baked into activePhoto.
          objectBlendedR = originalR * (1 - blend) + localR * blend;
          objectBlendedG = originalG * (1 - blend) + localG * blend;
          objectBlendedB = originalB * (1 - blend) + localB * blend;
        }

        const globalAdjusted = applyGlobalTone(
          objectBlendedR,
          objectBlendedG,
          objectBlendedB,
          brightness,
          contrast,
          saturation,
        );

        pixels[index] = globalAdjusted.r;
        pixels[index + 1] = globalAdjusted.g;
        pixels[index + 2] = globalAdjusted.b;
      }
      sourceCtx.putImageData(sourceData, 0, 0);

      ctx.drawImage(
        sourceCanvas,
        imageRect.x,
        imageRect.y,
        imageRect.width,
        imageRect.height,
      );
    };

    const scheduleRender = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(render);
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
    activePhoto?.url,
    activePhoto?.width,
    activePhoto?.height,
    activeAiTool,
    objectMaskDataUrl,
    objectBrightness,
    objectContrast,
    shadowStrength,
    objectTab,
    brightness,
    contrast,
    saturation,
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
      <main className="lg:col-span-6 bg-[#1A1F2F] border border-gray-700/60 rounded-3xl p-5 md:p-6 flex flex-col items-center justify-center relative min-h-[520px] shadow-lg">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />

        {!activePhoto && photoMode !== "dual" ? (
          <div
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 bg-[#282E3B]/60 cursor-pointer transition ${
              isDragging
                ? "border-amber-400 ring-2 ring-amber-400/30"
                : "border-gray-600/70 hover:border-gray-500"
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
            <div className="w-12 h-12 rounded-full bg-gray-800/90 flex items-center justify-center text-gray-300 border border-gray-700">
              <ImageIcon size={22} />
            </div>

            <div>
              <h3 className="text-white text-base font-bold">
                {isDragging ? "Drop your photo here" : "Upload a Photo"}
              </h3>
              <p className="text-gray-400 text-xs mt-1">
                Click or drag &amp; drop to upload
              </p>
              <div className="mt-2 inline-flex px-3 py-1 rounded-full bg-[#1F242D] border border-gray-700 text-[11px] font-semibold text-gray-300">
                {currentPreset.label}
              </div>
              <div className="mt-1 text-[9px] text-gray-500 font-semibold">
                {presetSizeText}
              </div>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openFilePicker();
              }}
              className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2"
            >
              <Upload size={14} />
              Upload Photo
            </button>

            <div className="border border-gray-700 bg-[#1F242D] px-2.5 py-0.5 rounded-md text-[10px] font-mono text-gray-400">
              Ctrl+U
            </div>
            <p className="text-[9px] text-gray-500">
              JPG, PNG, WEBP • Max 10 MB
            </p>
          </div>
        ) : (
          <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
            {photoMode === "dual" ? (
              <>
                <div className="w-full max-w-[760px] rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-center mb-3">
                    <div className="text-[11px] font-black text-white">
                      {currentPreset.label}
                    </div>
                    <div className="text-[9px] text-gray-500 mt-0.5">
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
                              ? "border-amber-400"
                              : "border-white/10"
                          } bg-white flex items-center justify-center cursor-pointer transition`}
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
                            <div className="text-xs text-gray-400 text-center">
                              <div className="font-bold">
                                Empty {index === 0 ? "Left" : "Right"} Slot
                              </div>
                              <div className="text-[9px] text-gray-500 mt-1">
                                {presetSizeText}
                              </div>
                            </div>
                          )}

                          {activeDualSlot === index && (
                            <div className="absolute left-2 top-2 rounded-full bg-amber-500 text-gray-900 px-2 py-1 text-[8px] font-black">
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
                    className={`px-4 py-2 rounded-xl text-xs font-black ${
                      activeDualSlot === 0
                        ? "bg-amber-500 text-gray-900"
                        : "bg-[#282E3B] text-white"
                    }`}
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDualSlot(1)}
                    className={`px-4 py-2 rounded-xl text-xs font-black ${
                      activeDualSlot === 1
                        ? "bg-amber-500 text-gray-900"
                        : "bg-[#282E3B] text-white"
                    }`}
                  >
                    Right
                  </button>
                  <button
                    type="button"
                    onClick={swapDualPhotos}
                    className="px-4 py-2 rounded-xl bg-[#282E3B] text-white text-xs font-black flex gap-2 items-center"
                  >
                    <ArrowLeftRight size={14} />
                    Swap
                  </button>
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-gray-900 text-xs font-black"
                  >
                    <Upload size={14} className="inline mr-1" />
                    Upload slot
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2">
                  <div className="text-[11px] font-black text-white">
                    {currentPreset.label}
                  </div>
                  <div className="text-[9px] text-gray-500">
                    {presetSizeText}
                  </div>
                </div>

                <div
                  ref={previewHostRef}
                  className="relative overflow-hidden rounded-2xl border border-gray-700 shadow-xl flex items-center justify-center"
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
                      />
                    )}
                  </div>

                  {activeAiTool === "object" && objectMaskDataUrl && (
                    <ObjectMaskCanvas />
                  )}

                  <button
                    type="button"
                    onClick={removeActivePhoto}
                    className="absolute right-3 top-3 h-8 w-8 rounded-full bg-black/60 hover:bg-black/75 text-white flex items-center justify-center z-40"
                    title="Remove photo"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => setZoom(Math.max(25, zoom - 10))}
                    className="h-9 w-9 rounded-lg bg-[#282E3B] text-white flex items-center justify-center"
                    title="Zoom out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="h-9 px-3 rounded-lg bg-[#282E3B] text-white flex items-center text-xs font-black">
                    {zoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom(Math.min(300, zoom + 10))}
                    className="h-9 w-9 rounded-lg bg-[#282E3B] text-white flex items-center justify-center"
                    title="Zoom in"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((rotation - 90 + 360) % 360)}
                    className="h-9 px-3 rounded-lg bg-[#282E3B] text-white text-xs font-black flex items-center gap-1"
                  >
                    <RotateCcw size={13} />
                    Rotate
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((rotation + 90) % 360)}
                    className="h-9 px-3 rounded-lg bg-[#282E3B] text-white text-xs font-black flex items-center gap-1"
                  >
                    <RotateCw size={13} />
                    Rotate
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipX(!flipX)}
                    className={`h-9 px-3 rounded-lg text-xs font-black flex items-center gap-1 ${
                      flipX
                        ? "bg-amber-500 text-gray-900"
                        : "bg-[#282E3B] text-white"
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
                    className="h-9 px-3 rounded-lg bg-[#282E3B] text-white text-xs font-black flex items-center gap-1"
                  >
                    <Maximize2 size={13} />
                    Reset
                  </button>
                </div>
              </>
            )}

            {uploadError && (
              <div className="absolute bottom-3 left-4 right-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-center text-[10px] font-semibold text-red-200">
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
