"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";

import "react-image-crop/dist/ReactCrop.css";

import {
  Check,
  Crop as CropIcon,
  FlipHorizontal2,
  Minus,
  Plus,
  RotateCcw,
  ScanLine,
  X,
} from "lucide-react";

import { useManualEditor } from "./EditorProvider";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

type EditorActions = {
  rotate?: () => void;

  rotateImage?: () => void;

  setRotation?: (value: number | ((value: number) => number)) => void;

  toggleFlipX?: () => void;

  flipHorizontal?: () => void;

  setFlipX?: (value: boolean | ((value: boolean) => boolean)) => void;
};

export default function CropEditor() {
  const editor = useManualEditor();

  const actions = editor as unknown as EditorActions;

  const { activePhoto, currentPreset, rotation, flipX, applyCroppedDataUrl } =
    editor;

  const [open, setOpen] = useState(false);

  const [zoom, setZoom] = useState(100);

  const [crop, setCrop] = useState<Crop>();

  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  const [processedSrc, setProcessedSrc] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  const [editorRotation, setEditorRotation] = useState(rotation);

  const [editorFlipX, setEditorFlipX] = useState(flipX);

  const imgRef = useRef<HTMLImageElement | null>(null);

  const sourceUrlRef = useRef<string | null>(null);

  const skipOpenUrl = useRef<string | null>(null);

  const targetRatio = useMemo(
    () => currentPreset.widthMm / currentPreset.heightMm,
    [currentPreset],
  );

  useEffect(() => {
    if (!activePhoto) {
      setOpen(false);
      sourceUrlRef.current = null;
      return;
    }

    if (skipOpenUrl.current === activePhoto.url) {
      skipOpenUrl.current = null;

      return;
    }

    if (sourceUrlRef.current !== activePhoto.url) {
      sourceUrlRef.current = activePhoto.url;

      setOpen(true);
      setZoom(100);

      setEditorRotation(rotation);

      setEditorFlipX(flipX);

      setCompletedCrop(null);
      setCrop(undefined);
    }
  }, [activePhoto?.url, flipX, rotation]);

  useEffect(() => {
    if (!open || !activePhoto) {
      return;
    }

    let cancelled = false;

    const img = new Image();

    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;

      const canvas = document.createElement("canvas");

      const radians = ((editorRotation % 360) * Math.PI) / 180;

      const swap = Math.abs(editorRotation % 180) === 90;

      canvas.width = swap ? img.naturalHeight : img.naturalWidth;

      canvas.height = swap ? img.naturalWidth : img.naturalHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.save();

      ctx.translate(canvas.width / 2, canvas.height / 2);

      ctx.rotate(radians);

      ctx.scale(editorFlipX ? -1 : 1, 1);

      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      ctx.restore();

      setProcessedSrc(canvas.toDataURL("image/png"));
    };

    img.src = activePhoto.url;

    return () => {
      cancelled = true;
    };
  }, [open, activePhoto?.url, editorRotation, editorFlipX]);

  useEffect(() => {
    if (!open || !imgRef.current) {
      return;
    }

    const { width, height } = imgRef.current;

    if (!width || !height) {
      return;
    }

    setCrop(centerAspectCrop(width, height, targetRatio));

    setCompletedCrop(null);
  }, [open, targetRatio, processedSrc]);

  const onImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = event.currentTarget;

    setCrop(centerAspectCrop(width, height, targetRatio));
  };

  const handleRotate = () => {
    const nextRotation = (editorRotation + 90) % 360;

    setEditorRotation(nextRotation);

    if (typeof actions.rotate === "function") {
      actions.rotate();
    } else if (typeof actions.rotateImage === "function") {
      actions.rotateImage();
    } else if (typeof actions.setRotation === "function") {
      actions.setRotation(nextRotation);
    }
  };

  const handleMirror = () => {
    const nextFlip = !editorFlipX;

    setEditorFlipX(nextFlip);

    if (typeof actions.toggleFlipX === "function") {
      actions.toggleFlipX();
    } else if (typeof actions.flipHorizontal === "function") {
      actions.flipHorizontal();
    } else if (typeof actions.setFlipX === "function") {
      actions.setFlipX(nextFlip);
    }
  };

  const applyCrop = async () => {
    const image = imgRef.current;

    if (!image || !completedCrop) {
      return;
    }

    setBusy(true);

    try {
      const canvas = document.createElement("canvas");

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return;
      }

      const scaleX = image.naturalWidth / image.width;

      const scaleY = image.naturalHeight / image.height;

      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);

      canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

      ctx.scale(pixelRatio, pixelRatio);

      ctx.imageSmoothingQuality = "high";

      const cropX = completedCrop.x * scaleX;

      const cropY = completedCrop.y * scaleY;

      const cropWidth = completedCrop.width * scaleX;

      const cropHeight = completedCrop.height * scaleY;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );

      const dataUrl = canvas.toDataURL("image/png");

      const newUrl = await applyCroppedDataUrl(dataUrl, "cropped-photo.png");

      skipOpenUrl.current = newUrl;

      sourceUrlRef.current = newUrl;

      setOpen(false);
    } catch (error) {
      console.error("Failed to crop image:", error);
    } finally {
      setBusy(false);
    }
  };

  if (!open || !activePhoto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black text-white">
      <div className="h-[50px] shrink-0 bg-white text-gray-900 border-b border-black/5 flex items-center justify-between">
        <div className="h-full flex items-center">
          <div className="pl-5 pr-4 flex items-center gap-2">
            <div className="h-[30px] w-[30px] rounded-full bg-[#ff9900] text-white flex items-center justify-center font-black text-sm leading-none">
              X
            </div>

            <div className="leading-none">
              <div className="text-[14px] font-black tracking-tight">
                সহজকাজ
              </div>

              <div className="text-[7px] uppercase tracking-[0.16em] text-gray-400 mt-[2px]">
                WWW.SHOHOZKAJ.COM
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-gray-200" />

          <div className="ml-3 flex items-center gap-3">
            <div className="h-[34px] w-[34px] rounded-xl bg-[#fff5e7] text-[#ff9800] flex items-center justify-center">
              <CropIcon size={16} strokeWidth={2.3} />
            </div>

            <div className="text-[14px] font-black tracking-tight">
              Crop &amp; Rotate Image
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-label="Close crop editor"
          onClick={() => setOpen(false)}
          className="h-[50px] w-[54px] bg-[#ef4044] hover:bg-[#dc3034] text-white flex items-center justify-center transition-colors"
        >
          <X size={22} strokeWidth={2.2} />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden bg-black">
        <div
          className="flex items-center justify-center origin-center transition-transform duration-75"
          style={{
            transform: `scale(${zoom / 100})`,
          }}
        >
          {processedSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={targetRatio}
              className="max-w-[82vw] max-h-[72vh]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                alt="Crop preview"
                src={processedSrc}
                onLoad={onImageLoad}
                className="max-w-[82vw] max-h-[72vh] w-auto h-auto object-contain block"
              />
            </ReactCrop>
          ) : (
            <div className="text-sm text-white/60">Preparing image…</div>
          )}
        </div>
      </div>

      <div className="h-[50px] shrink-0 bg-white text-gray-900 border-t border-gray-200 flex items-stretch justify-between">
        <div className="flex items-stretch">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom((value) => clamp(value - 10, 100, 300))}
            className="w-[55px] bg-[#069b79] text-white flex items-center justify-center hover:bg-[#058b6d] transition-colors"
          >
            <Minus size={17} strokeWidth={2.2} />
          </button>

          <div className="w-[48px] bg-white flex items-center justify-center text-[12px] font-black border-r border-gray-200">
            {zoom}%
          </div>

          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom((value) => clamp(value + 10, 100, 300))}
            className="w-[55px] bg-[#069b79] text-white flex items-center justify-center hover:bg-[#058b6d] transition-colors"
          >
            <Plus size={17} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            aria-label="Rotate image"
            onClick={handleRotate}
            className="w-[100px] bg-[#625ee9] text-white flex items-center justify-center gap-2 text-[12px] font-black hover:bg-[#544fde] transition-colors"
          >
            <RotateCcw size={15} strokeWidth={2} />
            Rotate
          </button>

          <button
            type="button"
            aria-label="Mirror image"
            onClick={handleMirror}
            className="w-[100px] bg-[#625ee9] text-white flex items-center justify-center gap-2 text-[12px] font-black hover:bg-[#544fde] transition-colors"
          >
            <FlipHorizontal2 size={15} strokeWidth={2} />
            Mirror
          </button>
        </div>

        <div className="flex items-stretch ml-auto">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-[155px] px-4 bg-white text-gray-700 flex items-center justify-center gap-2 text-[12px] font-black border-l border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ScanLine size={15} strokeWidth={2} className="text-gray-500" />
            No Crop Needed
          </button>

          <button
            type="button"
            disabled={busy || !completedCrop}
            onClick={() => void applyCrop()}
            className="w-[172px] bg-[#ff9f1c] hover:bg-[#ef9210] disabled:opacity-60 text-white flex items-center justify-center gap-2 text-[12px] font-black transition-colors"
          >
            <Check size={14} strokeWidth={2.4} />

            {busy ? "Cropping…" : "Crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
