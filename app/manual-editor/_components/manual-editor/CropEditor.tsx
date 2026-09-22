"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
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

function centerFreeCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    {
      unit: "%",
      x: 0,
      y: 0,
      width: 80,
      height: 80,
    },
    mediaWidth,
    mediaHeight,
  );
}

export default function CropEditor() {
  const {
    activePhoto,
    rotation,
    flipX,
    applyCroppedDataUrl,
    cropAvailable,
    consumeCrop,
  } = useManualEditor();

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

  // Crop is an upload-stage action only. Once consumed, changing the active
  // image because of Background Remove/Object Adjust/etc. never reopens it.
  useEffect(() => {
    if (!activePhoto) {
      setOpen(false);
      setProcessedSrc(null);
      setCrop(undefined);
      setCompletedCrop(null);
      sourceUrlRef.current = null;
      return;
    }

    if (!cropAvailable) {
      setOpen(false);
      sourceUrlRef.current = activePhoto.url;
      return;
    }

    if (sourceUrlRef.current !== activePhoto.url) {
      sourceUrlRef.current = activePhoto.url;
      setOpen(true);
      setZoom(100);
      setEditorRotation(rotation);
      setEditorFlipX(flipX);
      setProcessedSrc(null);
      setCompletedCrop(null);
      setCrop(undefined);
    }
  }, [activePhoto?.url, cropAvailable, flipX, rotation, activePhoto]);

  // Rebuild the temporary crop source only when the user changes rotate/mirror
  // inside the editor. This does not affect the one-time crop availability.
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
      const normalizedRotation = ((editorRotation % 360) + 360) % 360;
      const radians = (editorRotation * Math.PI) / 180;
      const swap = normalizedRotation === 90 || normalizedRotation === 270;

      canvas.width = swap ? img.naturalHeight : img.naturalWidth;
      canvas.height = swap ? img.naturalWidth : img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setProcessedSrc(null);
        return;
      }

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.scale(editorFlipX ? -1 : 1, 1);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();

      setProcessedSrc(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      if (!cancelled) setProcessedSrc(null);
    };

    img.src = activePhoto.url;

    return () => {
      cancelled = true;
    };
  }, [open, activePhoto?.url, editorRotation, editorFlipX]);

  useEffect(() => {
    if (!open || !imgRef.current) return;

    const { width, height } = imgRef.current;
    if (!width || !height) return;

    setCrop(centerFreeCrop(width, height));
    setCompletedCrop(null);
  }, [open, processedSrc]);

  const onImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = event.currentTarget;
    setCrop(centerFreeCrop(width, height));
  };

  const closeCrop = () => {
    consumeCrop();
    setOpen(false);
  };

  const handleRotate = () => {
    setEditorRotation((current) => (current + 90) % 360);
  };

  const handleMirror = () => {
    setEditorFlipX((current) => !current);
  };

  const applyCrop = async () => {
    const image = imgRef.current;
    if (!image || !completedCrop) return;

    setBusy(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      const outputWidth = Math.max(1, Math.round(cropWidth));
      const outputHeight = Math.max(1, Math.round(cropHeight));

      canvas.width = outputWidth;
      canvas.height = outputHeight;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputWidth,
        outputHeight,
      );

      const dataUrl = canvas.toDataURL("image/png");
      await applyCroppedDataUrl(dataUrl, "cropped-photo.png");
      consumeCrop();
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
            <div className="flex flex-col">
              <div className="text-[14px] font-black tracking-tight">
                Crop &amp; Rotate Image
              </div>
              <div className="text-[8px] text-gray-400 font-bold">
                Independent photo crop • canvas fit after crop
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-label="Close crop editor"
          onClick={closeCrop}
          className="h-[50px] w-[54px] bg-[#ef4044] hover:bg-[#dc3034] text-white flex items-center justify-center transition-colors"
        >
          <X size={22} strokeWidth={2.2} />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden bg-black">
        <div
          className="flex items-center justify-center origin-center transition-transform duration-75"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          {processedSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(value) => setCompletedCrop(value)}
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
            onClick={closeCrop}
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
