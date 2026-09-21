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
  ArrowLeft,
  ArrowRight,
  Check,
  Crop as CropIcon,
  Maximize2,
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

export default function CropEditor() {
  const { activePhoto, currentPreset, rotation, flipX, applyCroppedDataUrl } =
    useManualEditor();
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const skipOpenUrl = useRef<string | null>(null);

  const targetRatio = useMemo(
    () => currentPreset.widthMm / currentPreset.heightMm,
    [currentPreset],
  );

  // ডায়ালগ ওপেন এবং প্রি-সেট হ্যান্ডলিং
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
    }
  }, [activePhoto?.url]);

  // রোটেশন ও ফ্লিপ সহ ছবি ক্যানভাসে রেন্ডার করে নতুন ইমেজ ইউআরএল তৈরি
  useEffect(() => {
    if (!open || !activePhoto) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      const radians = ((rotation % 360) * Math.PI) / 180;
      const swap = Math.abs(rotation % 180) === 90;
      canvas.width = swap ? img.naturalHeight : img.naturalWidth;
      canvas.height = swap ? img.naturalWidth : img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.scale(flipX ? -1 : 1, 1);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();

      setProcessedSrc(canvas.toDataURL("image/png"));
    };
    img.src = activePhoto.url;
    return () => {
      cancelled = true;
    };
  }, [open, activePhoto?.url, rotation, flipX]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, targetRatio));
  };

  const resetCrop = () => {
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;
    setCrop(centerAspectCrop(width, height, targetRatio));
    setZoom(100);
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
    } catch (e) {
      console.error("Failed to crop image:", e);
    } finally {
      setBusy(false);
    }
  };

  if (!open || !activePhoto) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black text-white">
      {/* Header Bar */}
      <div className="h-14 shrink-0 bg-white text-gray-900 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#FF9300] text-white flex items-center justify-center">
            <CropIcon size={18} />
          </div>
          <div>
            <div className="text-sm font-black">সহজকাজ</div>
            <div className="text-[9px] uppercase tracking-widest text-gray-400">
              Crop &amp; Rotate Image
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-9 w-9 rounded-full text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Cropper Container */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-6 overflow-hidden bg-[#101010]">
        <div
          className="max-w-[1000px] max-h-[72vh] flex items-center justify-center transition-transform duration-75"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          {processedSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={targetRatio}
              className="max-h-[68vh]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                alt="Crop preview"
                src={processedSrc}
                onLoad={onImageLoad}
                className="max-h-[68vh] w-auto object-contain"
              />
            </ReactCrop>
          ) : (
            <div className="text-sm text-white/60">Preparing image…</div>
          )}
        </div>
      </div>

      {/* Footer Controls Bar */}
      <div className="h-16 shrink-0 bg-white text-gray-900 border-t flex items-center justify-between px-4">
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => clamp(z - 10, 100, 300))}
            className="h-10 w-10 rounded-lg border flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="h-10 min-w-16 px-3 rounded-lg border flex items-center justify-center text-xs font-black">
            {zoom}%
          </div>
          <button
            type="button"
            onClick={() => setZoom((z) => clamp(z + 10, 100, 300))}
            className="h-10 w-10 rounded-lg border flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowRight size={15} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className="h-10 px-3 rounded-lg border text-xs font-black hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetCrop}
            className="h-10 px-4 rounded-lg border text-xs font-black flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Maximize2 size={14} /> Reset crop
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-10 px-4 rounded-lg border text-xs font-black hover:bg-gray-50 transition-colors"
          >
            No Crop Needed
          </button>
          <button
            type="button"
            disabled={busy || !completedCrop}
            onClick={() => void applyCrop()}
            className="h-10 px-5 rounded-lg bg-[#FF9300] text-white text-xs font-black flex items-center gap-2 disabled:opacity-50 hover:bg-[#e08200] transition-colors"
          >
            <Check size={14} />
            {busy ? "Cropping…" : "Crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
