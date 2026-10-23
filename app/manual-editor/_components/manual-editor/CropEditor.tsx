"use client";
import { ManualT as T, useManualEditorText } from "./manualEditorI18n";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Check, Crop as CropIcon, FlipHorizontal2, Minus, Plus, RotateCcw, ScanLine, X, } from "lucide-react";
import { useManualEditor } from "./EditorProvider";
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
function centerFreeCrop(mediaWidth: number, mediaHeight: number) {
    return centerCrop({
        unit: "%",
        x: 0,
        y: 0,
        width: 80,
        height: 80,
    }, mediaWidth, mediaHeight);
}
export default function CropEditor() {
    const { t } = useManualEditorText();
    const { activePhoto, rotation, flipX, applyCroppedDataUrl, cropAvailable, consumeCrop, } = useManualEditor();
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
            if (cancelled)
                return;
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
            if (!cancelled)
                setProcessedSrc(null);
        };
        img.src = activePhoto.url;
        return () => {
            cancelled = true;
        };
    }, [open, activePhoto?.url, editorRotation, editorFlipX]);
    useEffect(() => {
        if (!open || !imgRef.current)
            return;
        const { width, height } = imgRef.current;
        if (!width || !height)
            return;
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
        if (!image || !completedCrop)
            return;
        setBusy(true);
        try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx)
                return;
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
            ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);
            const dataUrl = canvas.toDataURL("image/png");
            await applyCroppedDataUrl(dataUrl, "cropped-photo.png");
            consumeCrop();
            setOpen(false);
        }
        catch (error) {
            console.error("Failed to crop image:", error);
        }
        finally {
            setBusy(false);
        }
    };
    if (!open || !activePhoto) {
        return null;
    }
    return (<div className="fixed inset-0 z-[200] flex flex-col bg-black text-white">
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
      <div className="h-[56px] shrink-0 bg-[#F2E8D2] text-[#3B2F1E] border-b border-[#E3D6B8] flex items-center justify-between">
        <div className="h-full flex items-center">
          <div className="pl-5 pr-4 flex items-center gap-2">
            <div className="h-[30px] w-[30px] rounded-full bg-[#DC2626] text-white flex items-center justify-center font-extrabold text-base leading-none"><T>{"X\r\n            "}</T></div>
            <div className="leading-none">
              <div className="text-[16px] font-extrabold tracking-tight text-[#3B2F1E]"><T>{"\u09B8\u09B9\u099C\u0995\u09BE\u099C\r\n              "}</T></div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#6B5A40] mt-[2px]"><T>{"WWW.SHOHOZKAJ.COM\r\n              "}</T></div>
            </div>
          </div>
          <div className="h-7 w-px bg-[#D8C9A6]"/>
          <div className="ml-3 flex items-center gap-3">
            <div className="h-[34px] w-[34px] rounded-xl bg-[#FEE9E9] text-[#DC2626] flex items-center justify-center">
              <CropIcon size={16} strokeWidth={2.3}/>
            </div>
            <div className="flex flex-col">
              <div className="text-[16px] font-extrabold tracking-tight text-[#3B2F1E]"><T>{"Crop &amp; Rotate Image\r\n              "}</T></div>
              <div className="text-[11px] text-[#6B5A40] font-bold"><T>{"Independent photo crop \u2022 canvas fit after crop\r\n              "}</T></div>
            </div>
          </div>
        </div>

        <button type="button" aria-label={t("Close crop editor")} onClick={closeCrop} className="h-[56px] w-[60px] bg-[#D42020] hover:bg-[#AE1717] text-white flex items-center justify-center transition-colors cursor-pointer">
          <X size={22} strokeWidth={2.2}/>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden bg-black">
        <div className="flex items-center justify-center origin-center transition-transform duration-75" style={{ transform: `scale(${zoom / 100})` }}>
          {processedSrc ? (<ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(value) => setCompletedCrop(value)} className="sohozkaj-crop-canvas max-w-[82vw] max-h-[72vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imgRef} alt={t("Crop preview")} src={processedSrc} onLoad={onImageLoad} className="max-w-[82vw] max-h-[72vh] w-auto h-auto object-contain block"/>
            </ReactCrop>) : (<div className="text-base text-white/60"><T>{"Preparing image\u2026"}</T></div>)}
        </div>
      </div>

      <div className="h-[56px] shrink-0 bg-[#F2E8D2] text-[#3B2F1E] border-t border-[#E3D6B8] flex items-stretch justify-between">
        <div className="flex items-stretch">
          <button type="button" aria-label={t("Zoom out")} onClick={() => setZoom((value) => clamp(value - 10, 100, 300))} className="w-[55px] bg-[#DC2626] text-white flex items-center justify-center hover:bg-[#B91C1C] transition-colors cursor-pointer">
            <Minus size={17} strokeWidth={2.2}/>
          </button>
          <div className="w-[56px] bg-[#F6EEDB] flex items-center justify-center text-[14px] font-extrabold border-r border-[#E3D6B8] text-[#3B2F1E]">
            {zoom}<T>{"%\r\n          "}</T></div>
          <button type="button" aria-label={t("Zoom in")} onClick={() => setZoom((value) => clamp(value + 10, 100, 300))} className="w-[55px] bg-[#DC2626] text-white flex items-center justify-center hover:bg-[#B91C1C] transition-colors cursor-pointer">
            <Plus size={17} strokeWidth={2.2}/>
          </button>
          <button type="button" aria-label={t("Rotate image")} onClick={handleRotate} className="w-[116px] bg-[#DC2626] text-white flex items-center justify-center gap-2 text-[14px] font-extrabold hover:bg-[#B91C1C] transition-colors cursor-pointer">
            <RotateCcw size={15} strokeWidth={2}/><T>{"Rotate\r\n          "}</T></button>
          <button type="button" aria-label={t("Mirror image")} onClick={handleMirror} className="w-[116px] bg-[#DC2626] text-white flex items-center justify-center gap-2 text-[14px] font-extrabold hover:bg-[#B91C1C] transition-colors cursor-pointer">
            <FlipHorizontal2 size={15} strokeWidth={2}/><T>{"Mirror\r\n          "}</T></button>
        </div>

        <div className="flex items-stretch ml-auto">
          <button type="button" onClick={closeCrop} className="w-[176px] px-4 bg-[#FBF6E8] text-[#3B2F1E] flex items-center justify-center gap-2 text-[14px] font-extrabold border-l border-[#E3D6B8] hover:bg-[#EFE3C8] transition-colors cursor-pointer">
            <ScanLine size={15} strokeWidth={2} className="text-[#5A4A32]"/><T>{"No Crop Needed\r\n          "}</T></button>
          <button type="button" disabled={busy || !completedCrop} onClick={() => void applyCrop()} className="w-[196px] bg-[#D42020] hover:bg-[#AE1717] active:scale-[0.98] disabled:opacity-60 text-white flex items-center justify-center gap-2 text-[14px] font-extrabold transition-colors cursor-pointer disabled:cursor-not-allowed">
            <Check size={14} strokeWidth={2.4}/>
            {busy ? <T>{"Cropping…"}</T> : <T>{"Crop"}</T>}
          </button>
        </div>
      </div>
    </div>);
}
