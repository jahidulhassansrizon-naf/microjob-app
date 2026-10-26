"use client";

import "react-image-crop/dist/ReactCrop.css";

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";
import ReactCrop, { type Crop } from "react-image-crop";
import {
  Check,
  Crop as CropIcon,
  FlipHorizontal2,
  Minus,
  Plus,
  RotateCcw,
  ScanLine,
  X,
  LoaderCircle,
} from "lucide-react";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

async function cropImageToBlob(
  image: HTMLImageElement,
  percentCrop: Crop,
): Promise<Blob> {
  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error("Could not read the photo. Please try again.");
  }

  // Use percentage coordinates against the original pixels. This keeps crop
  // output exact even while the preview is zoomed by a CSS transform.
  const cropXPercent = clamp(percentCrop.x, 0, 100);
  const cropYPercent = clamp(percentCrop.y, 0, 100);
  const cropWidthPercent = clamp(percentCrop.width, 1, 100 - cropXPercent);
  const cropHeightPercent = clamp(percentCrop.height, 1, 100 - cropYPercent);
  const sourceX = clamp(
    Math.round((cropXPercent / 100) * image.naturalWidth),
    0,
    image.naturalWidth - 1,
  );
  const sourceY = clamp(
    Math.round((cropYPercent / 100) * image.naturalHeight),
    0,
    image.naturalHeight - 1,
  );
  const outputWidth = clamp(
    Math.round((cropWidthPercent / 100) * image.naturalWidth),
    1,
    image.naturalWidth - sourceX,
  );
  const outputHeight = clamp(
    Math.round((cropHeightPercent / 100) * image.naturalHeight),
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

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.95),
  );
  if (!blob) throw new Error("Could not create the cropped image.");
  return blob;
}

type PhotoCropWorkspaceProps = {
  imageSrc: string;
  originalFile: File;
  onCancel: () => void;
  onApply: (blob: Blob) => void;
  onUseOriginal: (file: File) => void;
  translate: (value: string) => string;
};

type CropCanvasHandle = {
  getCroppedBlob: () => Promise<Blob>;
};

type CropCanvasProps = {
  imageSrc: string;
  t: (value: string) => string;
  onCropAvailabilityChange: (available: boolean) => void;
};

/**
 * Keep fast pointer/crop state in this small component. Moving the crop area
 * only rerenders ReactCrop, not the full-screen controls or image preparation.
 */
const CropCanvas = React.memo(
  React.forwardRef<CropCanvasHandle, CropCanvasProps>(function CropCanvas(
    { imageSrc, t, onCropAvailabilityChange },
    ref,
  ) {
    const [crop, setCrop] = useState<Crop>({
      unit: "%",
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    });
    const imageRef = useRef<HTMLImageElement | null>(null);

    const handleImageLoad = useCallback(
      (event: SyntheticEvent<HTMLImageElement>) => {
        const image = event.currentTarget;
        const width = image.clientWidth || image.width;
        const height = image.clientHeight || image.height;
        if (!width || !height) return;
        // The crop rectangle is already initialized in state at 80% x 80%.
        // Only enable controls here; don't trigger another crop-state render
        // when the image appears.
        onCropAvailabilityChange(true);
      },
      [onCropAvailabilityChange],
    );

    useImperativeHandle(
      ref,
      () => ({
        getCroppedBlob: async () => {
          const image = imageRef.current;
          if (
            !image ||
            !crop ||
            crop.width < 1 ||
            crop.height < 1
          ) {
            throw new Error("Please adjust the crop and try again.");
          }
          return cropImageToBlob(image, crop);
        },
      }),
      [crop],
    );

    return (
      <ReactCrop
        crop={crop}
        onChange={(_, percentCrop) => setCrop(percentCrop)}
        className="sohozkaj-crop-canvas max-w-[82vw] max-h-[72vh] select-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={imageSrc}
          alt={t("Crop preview")}
          onLoad={handleImageLoad}
          decoding="async"
          draggable={false}
          className="block max-h-[72vh] max-w-[88vw] select-none object-contain sm:max-w-[82vw]"
        />
      </ReactCrop>
    );
  }),
);

export const PhotoCropWorkspace = React.memo(function PhotoCropWorkspace({
  imageSrc,
  originalFile,
  onCancel,
  onApply,
  onUseOriginal,
  translate,
}: PhotoCropWorkspaceProps) {
  const t = translate;
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [hasCompletedCrop, setHasCompletedCrop] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const cropCanvasRef = useRef<CropCanvasHandle | null>(null);
  const processedObjectUrlRef = useRef<string | null>(null);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);

  // Isolate the cropper from route-specific CSS so pointer geometry remains
  // consistent between AI Template, Bulk Photo Edit and Manual Editor.
  useEffect(() => {
    setPortalHost(document.body);
  }, []);

  // Rotate/mirror before the crop interaction, as in Manual Editor.
  useEffect(() => {
    let cancelled = false;
    setProcessedSrc(null);
    setHasCompletedCrop(false);
    setErrorMessage("");

    // The common upload path needs no canvas copy: use the original object URL
    // directly. This avoids decoding the same full-resolution file twice before
    // the first crop frame appears.
    if (rotation === 0 && !flipX) {
      setProcessedSrc(imageSrc);
      return () => {
        cancelled = true;
      };
    }

    const sourceImage = new Image();
    sourceImage.decoding = "async";
    sourceImage.onload = () => {
      if (cancelled) return;

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
      context.drawImage(
        sourceImage,
        -sourceImage.naturalWidth / 2,
        -sourceImage.naturalHeight / 2,
      );
      context.restore();
      // Encoding a full-resolution data URL synchronously can freeze the UI.
      // Blob URLs keep rotation/mirror preparation off the synchronous path.
      canvas.toBlob((blob) => {
        if (cancelled || !blob) return;
        const nextObjectUrl = URL.createObjectURL(blob);
        processedObjectUrlRef.current = nextObjectUrl;
        setProcessedSrc(nextObjectUrl);
      }, "image/png");
    };
    sourceImage.onerror = () => {
      if (!cancelled) setErrorMessage("Could not read the photo. Please try again.");
    };
    sourceImage.src = imageSrc;

    return () => {
      cancelled = true;
      if (processedObjectUrlRef.current) {
        URL.revokeObjectURL(processedObjectUrlRef.current);
        processedObjectUrlRef.current = null;
      }
    };
  }, [imageSrc, rotation, flipX]);

  const handleCropAvailabilityChange = useCallback((available: boolean) => {
    setHasCompletedCrop(available);
  }, []);

  const handleApplyCrop = useCallback(async () => {
    if (!cropCanvasRef.current || !hasCompletedCrop) {
      setErrorMessage("Please adjust the crop and try again.");
      return;
    }

    setIsCropping(true);
    setErrorMessage("");
    try {
      const blob = await cropCanvasRef.current.getCroppedBlob();
      onApply(blob);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not crop the photo.");
      setIsCropping(false);
    }
  }, [hasCompletedCrop, onApply]);

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

  if (!portalHost) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex flex-col overflow-hidden bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label={t("Crop & Rotate Image")}
    >
      <style>{`
        .sohozkaj-crop-canvas .ReactCrop__crop-selection {
          border: 2px solid #ffffff !important;
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.8), inset 0 0 0 1px rgba(255, 255, 255, 0.18) !important;
          cursor: move;
          touch-action: none;
        }
        .sohozkaj-crop-canvas .ReactCrop__drag-handle {
          display: block !important;
          opacity: 1 !important;
          width: 16px !important;
          height: 16px !important;
          border: 2px solid #ffffff !important;
          border-radius: 3px !important;
          background: #2563eb !important;
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.45), 0 2px 7px rgba(0, 0, 0, 0.25) !important;
          touch-action: none;
        }
        .sohozkaj-crop-canvas .ReactCrop__child-wrapper,
        .sohozkaj-crop-canvas .ReactCrop__child-wrapper img {
          user-select: none;
          -webkit-user-select: none;
          -webkit-user-drag: none;
        }
      `}</style>
      {isCropping && (
        <div className="absolute inset-0 z-[1300] flex flex-col items-center justify-center gap-3 bg-black/70 text-white backdrop-blur-sm">
          <LoaderCircle className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="text-sm font-medium tracking-wide">{t("Preparing...")}</p>
        </div>
      )}

      <header className="flex h-[50px] shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 text-slate-900">
        <div className="flex h-full min-w-0 items-center gap-3 px-3 sm:px-5">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black leading-none text-white">
            SK
          </div>
          <div className="hidden leading-none sm:block">
            <div className="text-[14px] font-black tracking-tight">Studio Seba</div>
            <div className="mt-[3px] text-[7px] uppercase tracking-[0.16em] text-slate-500">
              www.sohozkaj.com
            </div>
          </div>
          <div className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" />
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-slate-200 text-blue-600">
            <CropIcon size={16} strokeWidth={2.3} />
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="truncate text-[12px] font-black tracking-tight text-slate-900 sm:text-[14px]">
              {t("Crop & Rotate Image")}
            </div>
            <div className="hidden text-[8px] font-bold text-slate-500 sm:block">
              {t("Independent photo crop • canvas fit after crop")}
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-label={t("Close crop editor")}
          onClick={handleCancel}
          disabled={isCropping}
          className="flex h-[50px] w-[50px] shrink-0 cursor-pointer items-center justify-center bg-red-500 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[54px]"
        >
          <X size={22} strokeWidth={2.2} />
        </button>
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black px-2 py-3 sm:px-4">
        <div
          className="flex origin-center items-center justify-center"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "center center",
            willChange: zoom === 100 ? "auto" : "transform",
          }}
        >
          {processedSrc ? (
            <CropCanvas
              ref={cropCanvasRef}
              imageSrc={processedSrc}
              t={t}
              onCropAvailabilityChange={handleCropAvailabilityChange}
            />
          ) : (
            <div className="text-sm text-white/60">{t("Preparing image…")}</div>
          )}
        </div>
      </main>

      {errorMessage && (
        <p
          role="alert"
          className="shrink-0 border-t border-red-200 bg-red-50 px-4 py-2 text-center text-xs font-semibold text-red-700 sm:text-sm"
        >
          {t(errorMessage)}
        </p>
      )}

      <footer className="flex shrink-0 flex-col justify-between border-t border-slate-200 bg-slate-50 text-slate-900 shadow-lg sm:h-[50px] sm:flex-row sm:items-stretch">
        <div className="flex h-[48px] shrink-0 items-stretch gap-0.5 overflow-x-auto sm:h-full sm:gap-0">
          <button
            type="button"
            aria-label={t("Zoom out")}
            onClick={() => setZoom((value) => clamp(value - 10, 100, 300))}
            disabled={isCropping}
            className="flex w-[42px] shrink-0 cursor-pointer items-center justify-center bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[48px]"
          >
            <Minus size={17} strokeWidth={2.2} />
          </button>
          <div className="flex w-[42px] shrink-0 items-center justify-center border-r border-slate-200 bg-slate-50 text-[11px] font-black tabular-nums sm:w-[48px] sm:text-[12px]">
            {zoom}%
          </div>
          <button
            type="button"
            aria-label={t("Zoom in")}
            onClick={() => setZoom((value) => clamp(value + 10, 100, 300))}
            disabled={isCropping}
            className="flex w-[42px] shrink-0 cursor-pointer items-center justify-center bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[48px]"
          >
            <Plus size={17} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            aria-label={t("Rotate image")}
            onClick={() => setRotation((value) => (value + 90) % 360)}
            disabled={isCropping}
            className="flex min-w-[78px] shrink-0 cursor-pointer items-center justify-center gap-1.5 bg-blue-600 px-2 text-[11px] font-black text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[96px] sm:text-[12px]"
          >
            <RotateCcw size={15} strokeWidth={2} />
            <span>{t("Rotate")}</span>
          </button>
          <button
            type="button"
            aria-label={t("Mirror image")}
            onClick={() => setFlipX((value) => !value)}
            disabled={isCropping}
            className="flex min-w-[78px] shrink-0 cursor-pointer items-center justify-center gap-1.5 bg-blue-600 px-2 text-[11px] font-black text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[96px] sm:text-[12px]"
          >
            <FlipHorizontal2 size={15} strokeWidth={2} />
            <span>{t("Mirror")}</span>
          </button>
        </div>

        <div className="flex h-[44px] shrink-0 items-stretch gap-1.5 px-2 pb-2 sm:h-full sm:gap-0 sm:px-0 sm:pb-0">
          <button
            type="button"
            onClick={() => !isCropping && onUseOriginal(originalFile)}
            disabled={isCropping || !processedSrc}
            className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-200 px-2 text-[10px] font-black text-slate-900 transition-colors hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[150px] sm:flex-none sm:rounded-none sm:text-[11px]"
          >
            <ScanLine size={15} strokeWidth={2} className="shrink-0 text-slate-700" />
            <span>{t("No Crop Needed")}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleApplyCrop()}
            disabled={isCropping || !processedSrc || !hasCompletedCrop}
            className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-[11px] font-black text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[125px] sm:flex-none sm:rounded-none sm:text-[12px]"
          >
            <Check size={15} strokeWidth={2.4} />
            <span>{isCropping ? t("Cropping…") : t("Crop")}</span>
          </button>
        </div>
      </footer>
    </div>,
    portalHost,
  );
});
