"use client";
import { T } from "@/components/i18n/I18nProvider";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import { X } from "lucide-react";
async function getCroppedImage(pixelCrop: PixelCrop, displayedImage: HTMLImageElement | null): Promise<Blob> {
    if (!displayedImage || !displayedImage.naturalWidth) {
        throw new Error("Could not read the photo. Please try again.");
    }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not prepare the cropped image.");
    }
    // ReactCrop works in rendered (CSS) pixels. Use the actual on-screen
    // bounding box, including sub-pixel dimensions, so the exported image lines
    // up exactly with the selection the user sees.
    const renderedRect = displayedImage.getBoundingClientRect();
    const renderedWidth = renderedRect.width;
    const renderedHeight = renderedRect.height;
    if (!renderedWidth || !renderedHeight) {
        throw new Error("Could not determine the crop image size.");
    }
    const scaleX = displayedImage.naturalWidth / renderedWidth;
    const scaleY = displayedImage.naturalHeight / renderedHeight;
    const cropX = Math.min(Math.max(0, Math.round(pixelCrop.x * scaleX)), displayedImage.naturalWidth - 1);
    const cropY = Math.min(Math.max(0, Math.round(pixelCrop.y * scaleY)), displayedImage.naturalHeight - 1);
    const cropWidth = Math.min(Math.max(1, Math.round(pixelCrop.width * scaleX)), displayedImage.naturalWidth - cropX);
    const cropHeight = Math.min(Math.max(1, Math.round(pixelCrop.height * scaleY)), displayedImage.naturalHeight - cropY);
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(displayedImage, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.94));
    if (!blob) {
        throw new Error("Could not create the cropped image.");
    }
    return blob;
}
type PhotoCropModalProps = {
    imageSrc: string;
    onCancel: () => void;
    onApply: (blob: Blob) => void;
};
/*
 * The crop modal keeps its own crop state. Dragging the crop box updates state
 * on every mouse move, so this must NOT live in the big page component, or the
 * whole template grid re-renders on each move and the crop feels laggy.
 */
export const PhotoCropModal = React.memo(function PhotoCropModal({ imageSrc, onCancel, onApply, }: PhotoCropModalProps) {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    // Keep pointer-move updates outside React state until the next animation
    // frame. This prevents ReactCrop from forcing a render for every tiny mouse
    // event and makes dragging/resizing feel much smoother on slower machines.
    const cropRef = useRef<Crop | undefined>(undefined);
    const cropFrameRef = useRef<number | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
        const image = event.currentTarget;
        // Free-form starting box: nearly the whole photo, resizable in any
        // direction with no aspect-ratio lock.
        const initialCrop: Crop = {
            unit: "%",
            x: 5,
            y: 5,
            width: 90,
            height: 90,
        };
        cropRef.current = initialCrop;
        setCrop(initialCrop);
        // The default crop must be usable immediately, even before the first
        // pointer interaction. Use the exact rendered dimensions at this moment.
        const rect = image.getBoundingClientRect();
        const width = rect.width || image.width;
        const height = rect.height || image.height;
        setCompletedCrop({
            unit: "px",
            x: width * 0.05,
            y: height * 0.05,
            width: width * 0.9,
            height: height * 0.9,
        });
    }, []);
    const handleApply = useCallback(async () => {
        if (!completedCrop || completedCrop.width < 1 || completedCrop.height < 1) {
            setErrorMessage("Please adjust the crop and try again.");
            return;
        }
        setIsCropping(true);
        setErrorMessage("");
        try {
            const blob = await getCroppedImage(completedCrop, imgRef.current);
            onApply(blob);
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Could not crop the photo.");
            setIsCropping(false);
        }
    }, [completedCrop, onApply]);
    const handleCropChange = useCallback((nextCrop: Crop) => {
        cropRef.current = nextCrop;
        // One React update per animation frame instead of one per pointer event.
        if (cropFrameRef.current !== null)
            return;
        cropFrameRef.current = window.requestAnimationFrame(() => {
            cropFrameRef.current = null;
            setCrop(cropRef.current);
        });
    }, []);
    const handleCropComplete = useCallback((pixelCrop: PixelCrop, percentCrop: Crop) => {
        cropRef.current = percentCrop;
        if (cropFrameRef.current !== null) {
            window.cancelAnimationFrame(cropFrameRef.current);
            cropFrameRef.current = null;
        }
        setCrop(percentCrop);
        setCompletedCrop(pixelCrop);
    }, []);
    const handleCancel = useCallback(() => {
        if (isCropping)
            return;
        onCancel();
    }, [isCropping, onCancel]);
    useEffect(() => {
        return () => {
            if (cropFrameRef.current !== null) {
                window.cancelAnimationFrame(cropFrameRef.current);
            }
        };
    }, []);
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape")
                handleCancel();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [handleCancel]);
    return (<div className="crop-backdrop">
      <div className="crop-modal" role="dialog" aria-modal="true" aria-label="Crop your photo">
        <div className="crop-header">
          <div>
            <strong><T>{"Adjust your photo"}</T></strong>
            <span><T>{"Move and resize the crop area to select the part of the photo you\n              want to use.\n            "}</T></span>
          </div>

          <button type="button" className="crop-close" onClick={handleCancel} disabled={isCropping} aria-label="Cancel crop">
            <X size={18}/>
          </button>
        </div>

        <div className="crop-stage">
          <ReactCrop crop={crop} minWidth={24} minHeight={24} keepSelection ruleOfThirds onChange={(_, percentCrop) => handleCropChange(percentCrop)} onComplete={handleCropComplete} disabled={isCropping}>
            <img ref={imgRef} src={imageSrc} alt="Crop your uploaded photo" onLoad={handleImageLoad} className="crop-source-image" draggable={false}/>
          </ReactCrop>
        </div>

        <div className="crop-controls">
          <span><T>{"Crop"}</T></span>

          <span className="crop-controls-help"><T>{"Drag inside the box to move it. Drag any corner or edge to resize\n            freely.\n          "}</T></span>

          <span><T>{"Free"}</T></span>
        </div>

        {errorMessage && <p className="crop-error">{errorMessage}</p>}

        <div className="crop-actions">
          <button type="button" className="crop-cancel-btn" onClick={handleCancel} disabled={isCropping}><T>{"Cancel\n          "}</T></button>

          <button type="button" className="crop-apply-btn" onClick={handleApply} disabled={isCropping}>
            {isCropping ? <T>{"Preparing..."}</T> : <T>{"Use This Photo"}</T>}
          </button>
        </div>
      </div>
    </div>);
});
