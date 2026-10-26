"use client";

import React, { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop } from "react-image-crop";
import { Check, Crop as CropIcon, FlipHorizontal2, Minus, Plus, RotateCcw, ScanLine, X, LoaderCircle } from "lucide-react";
import { useAiTemplateText } from "./aiTemplateI18n";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function centerFreeCrop(mediaWidth: number, mediaHeight: number): Crop {
  return centerCrop(
    { unit: "%", x: 0, y: 0, width: 80, height: 80 },
    mediaWidth,
    mediaHeight,
  );
}

async function cropImageToBlob(
  image: HTMLImageElement,
  completedCrop: PixelCrop,
): Promise<Blob> {
  if (!image.naturalWidth || !image.naturalHeight || !image.width || !image.height) {
    throw new Error("Could not read the photo. Please try again.");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const sourceX = clamp(Math.round(completedCrop.x * scaleX), 0, image.naturalWidth - 1);
  const sourceY = clamp(Math.round(completedCrop.y * scaleY), 0, image.naturalHeight - 1);
  const outputWidth = clamp(
    Math.round(completedCrop.width * scaleX),
    1,
    image.naturalWidth - sourceX,
  );
  const outputHeight = clamp(
    Math.round(completedCrop.height * scaleY),
    1,
    image.naturalHeight - sourceY,
  );

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the cropped image.");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    sourceX,
    sourceY,
    outputWidth,
    outputHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
  if (!blob) throw new Error("Could not create the cropped image.");
  return blob;
}

type PhotoCropModalProps = {
  imageSrc: string;
  originalFile: File;
  onCancel: () => void;
  onApply: (blob: Blob) => void;
  onUseOriginal: (file: File) => void;
};

/**
 * Full-screen crop workspace intentionally mirrors the Manual Editor controls.
 * Crop state stays local so dragging/resizing doesn't rerender the template grid.
 */
export const PhotoCropModal = React.memo(function PhotoCropModal({
  imageSrc,
  originalFile,
  onCancel,
  onApply,
  onUseOriginal,
}: PhotoCropModalProps) {
  const { t } = useAiTemplateText();
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Match the Manual Editor: rotate/mirror the source first, then crop that preview.
  useEffect(() => {
    let cancelled = false;
    setProcessedSrc(null);
    setCrop(undefined);
    setCompletedCrop(null);

    const sourceImage = new Image();
    sourceImage.onload = () => {
      if (cancelled) return;
      if (rotation === 0 && !flipX) {
        setProcessedSrc(imageSrc);
        return;
      }

      const normalizedRotation = ((rotation % 360) + 360) % 360;
      const swapDimensions = normalizedRotation === 90 || normalizedRotation === 270;
      const canvas = document.createElement("canvas");
      canvas.width = swapDimensions ? sourceImage.naturalHeight : sourceImage.naturalWidth;
      canvas.height = swapDimensions ? sourceImage.naturalWidth : sourceImage.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        setErrorMessage("Could not prepare the cropped image.");
        return;
      }

      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((rotation * Math.PI) / 180);
      context.scale(flipX ? -1 : 1, 1);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(sourceImage, -sourceImage.naturalWidth / 2, -sourceImage.naturalHeight / 2);
      context.restore();
      if (!cancelled) setProcessedSrc(canvas.toDataURL("image/png"));
    };
    sourceImage.onerror = () => {
      if (!cancelled) setErrorMessage("Could not read the photo. Please try again.");
    };
    sourceImage.src = imageSrc;

    return () => {
      cancelled = true;
    };
  }, [imageSrc, rotation, flipX]);

  const handleImageLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const width = image.clientWidth || image.width;
    const height = image.clientHeight || image.height;
    if (!width || !height) return;
    setCrop(centerFreeCrop(width, height));
    setCompletedCrop(null);
    setErrorMessage("");
  }, []);

  const handleApplyCrop = useCallback(async () => {
    const image = imageRef.current;
    if (!image || !completedCrop || completedCrop.width < 1 || completedCrop.height < 1) {
      setErrorMessage("Please adjust the crop and try again.");
      return;
    }

    setIsCropping(true);
    setErrorMessage("");
    try {
      const blob = await cropImageToBlob(image, completedCrop);
      onApply(blob);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not crop the photo.");
      setIsCropping(false);
    }
  }, [completedCrop, onApply]);

  const handleCancel = useCallback(() => {
    if (!isCropping) onCancel();
  }, [isCropping, onCancel]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleCancel]);

  return (
    <div className="fixed inset-0 z-[1200] flex flex-col overflow-hidden bg-black text-white" role="dialog" aria-modal="true" aria-label={t("Crop & Rotate Image")}>
      {isCropping && (
        <div className="absolute inset-0 z-[1300] flex flex-col items-center justify-center gap-3 bg-black/70 text-white backdrop-blur-sm">
          <LoaderCircle className="h-10 w-10 animate-spin text-[#F87171]" />
          <p className="text-base font-medium tracking-wide">{t("Preparing...")}</p>
        </div>
      )}

      <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-[#E3D6B8] bg-[#F2E8D2] text-[#3B2F1E]">
        <div className="flex h-full min-w-0 items-center gap-3 px-3 sm:px-5">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#DC2626] text-base font-bold leading-none text-white">SK</div>
          <div className="hidden leading-none sm:block">
            <div className="text-[17px] font-bold tracking-tight">Studio Seba</div>
            <div className="mt-[3px] text-[12px] uppercase tracking-[0.12em] text-[#6B5A40]">www.sohozkaj.com</div>
          </div>
          <div className="mx-1 hidden h-7 w-px bg-[#E3D6B8] sm:block" />
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-[#F3E9D2] text-[#DC2626]">
            <CropIcon size={16} strokeWidth={2.3} />
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="truncate text-[16px] font-bold tracking-tight text-[#3B2F1E] sm:text-[17px]">{t("Crop & Rotate Image")}</div>
            <div className="hidden text-[13px] font-medium text-[#6B5A40] sm:block">{t("Independent photo crop • canvas fit after crop")}</div>
          </div>
        </div>
        <button
          type="button"
          aria-label={t("Close crop editor")}
          onClick={handleCancel}
          disabled={isCropping}
          className="flex h-[56px] w-[56px] shrink-0 cursor-pointer items-center justify-center bg-[#DC2626] text-white transition-colors duration-200 hover:bg-[#B91C1C] active:bg-[#991B1B] disabled:cursor-not-allowed disabled:opacity-70 sm:w-[60px]"
        >
          <X size={22} strokeWidth={2.2} />
        </button>
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black px-2 py-3 sm:px-4">
        <div className="flex origin-center items-center justify-center transition-transform duration-75" style={{ transform: `scale(${zoom / 100})` }}>
          {processedSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
              className="template-full-crop"
              minWidth={24}
              minHeight={24}
              keepSelection
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={processedSrc}
                alt={t("Crop preview")}
                onLoad={handleImageLoad}
                draggable={false}
                className="block max-h-[72vh] max-w-[88vw] select-none object-contain sm:max-w-[82vw]"
              />
            </ReactCrop>
          ) : (
            <div className="text-base text-white/60">{t("Preparing image…")}</div>
          )}
        </div>
      </main>

      {errorMessage && (
        <p role="alert" className="shrink-0 border-t border-red-200 bg-red-50 px-4 py-2 text-center text-sm font-semibold text-red-700 sm:text-base">
          {t(errorMessage)}
        </p>
      )}

      <footer className="flex shrink-0 flex-col justify-between border-t border-[#E3D6B8] bg-[#F2E8D2] text-[#3B2F1E] shadow-lg sm:h-[56px] sm:flex-row sm:items-stretch">
        <div className="flex h-[52px] shrink-0 items-stretch gap-0.5 scroll overflow-x-auto sm:h-full sm:gap-0">
          <button type="button" aria-label={t("Zoom out")} onClick={() => setZoom((value) => clamp(value - 10, 100, 300))} disabled={isCropping} className="flex w-[42px] shrink-0 cursor-pointer items-center justify-center bg-[#DC2626] text-white transition-colors duration-200 hover:bg-[#B91C1C] active:bg-[#991B1B] disabled:cursor-not-allowed disabled:opacity-70 sm:w-[52px]">
            <Minus size={17} strokeWidth={2.2} />
          </button>
          <div className="flex w-[48px] shrink-0 items-center justify-center border-r border-[#E3D6B8] bg-[#F2E8D2] text-[15px] font-bold tabular-nums sm:w-[56px]">{zoom}%</div>
          <button type="button" aria-label={t("Zoom in")} onClick={() => setZoom((value) => clamp(value + 10, 100, 300))} disabled={isCropping} className="flex w-[42px] shrink-0 cursor-pointer items-center justify-center bg-[#DC2626] text-white transition-colors duration-200 hover:bg-[#B91C1C] active:bg-[#991B1B] disabled:cursor-not-allowed disabled:opacity-70 sm:w-[52px]">
            <Plus size={17} strokeWidth={2.2} />
          </button>
          <button type="button" aria-label={t("Rotate image")} onClick={() => setRotation((value) => (value + 90) % 360)} disabled={isCropping} className="flex min-w-[96px] shrink-0 cursor-pointer items-center justify-center gap-1.5 bg-[#DC2626] px-3 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#B91C1C] active:bg-[#991B1B] disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-[116px]">
            <RotateCcw size={15} strokeWidth={2} /><span>{t("Rotate")}</span>
          </button>
          <button type="button" aria-label={t("Mirror image")} onClick={() => setFlipX((value) => !value)} disabled={isCropping} className="flex min-w-[96px] shrink-0 cursor-pointer items-center justify-center gap-1.5 bg-[#DC2626] px-3 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#B91C1C] active:bg-[#991B1B] disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-[116px]">
            <FlipHorizontal2 size={15} strokeWidth={2} /><span>{t("Mirror")}</span>
          </button>
        </div>

        <div className="flex h-[48px] shrink-0 items-stretch gap-1.5 px-2 pb-2 sm:h-full sm:gap-0 sm:px-0 sm:pb-0">
          <button type="button" onClick={() => !isCropping && onUseOriginal(originalFile)} disabled={isCropping || !processedSrc} className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#FBB6B6] bg-[#FBF6E8] px-2 text-[15px] font-semibold text-[#B91C1C] transition-colors duration-200 hover:bg-[#FEE9E9] disabled:cursor-not-allowed disabled:opacity-70 sm:w-[180px] sm:flex-none sm:rounded-none">
            <ScanLine size={15} strokeWidth={2} className="shrink-0 text-[#B91C1C]" /><span>{t("No Crop Needed")}</span>
          </button>
          <button type="button" onClick={() => void handleApplyCrop()} disabled={isCropping || !processedSrc || !completedCrop} className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#D42020] px-3 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#AE1717] disabled:cursor-not-allowed disabled:opacity-70 sm:w-[150px] sm:flex-none sm:rounded-none">
            <Check size={15} strokeWidth={2.4} /><span>{isCropping ? t("Cropping…") : t("Crop")}</span>
          </button>
        </div>
      </footer>
    </div>
  );
});
