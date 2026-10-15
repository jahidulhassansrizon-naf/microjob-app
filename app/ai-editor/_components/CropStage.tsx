"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import ReactCrop from "react-image-crop";

/*
 * Crop canvas, isolated from the (very large) editor page on purpose.
 *
 * Why: while dragging, react-image-crop fires onChange on every pointer move.
 * When that state lived in the page component, every pointer move re-rendered
 * the whole AI editor page (sidebar, preview, galleries...), which is what made
 * cropping feel laggy. Here the live crop is local state, so a drag only
 * re-renders this small component. The page is told only when the drag ends.
 */
type MidpointHandle = "n" | "e" | "s" | "w";
type MidpointSession = {
    direction: MidpointHandle;
    startClientX: number;
    startClientY: number;
    imageWidth: number;
    imageHeight: number;
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
    latest: { x: number; y: number; width: number; height: number };
};
type CropStageProps = {
    /** Crop set by the page (initial crop on load / reset). Percent units. */
    crop: any;
    aspect?: number;
    imgRef: React.MutableRefObject<HTMLImageElement | null>;
    src?: string;
    alt: string;
    zoom: number;
    rotate: number;
    onImageLoad: (event: React.SyntheticEvent<HTMLImageElement>) => void;
    /** Called once when a drag ends, with the final crop in pixels. */
    onCommit: (pixelCrop: any) => void;
};
const clampValue = (value: number, min: number, max: number) => {
    const safeMax = Math.max(0, max);
    const safeMin = Math.min(min, safeMax);
    return Math.min(safeMax, Math.max(safeMin, value));
};
const HANDLE_STYLE: React.CSSProperties = {
    position: "absolute",
    width: 16,
    height: 16,
    padding: 0,
    border: "2px solid #ffffff",
    borderRadius: 3,
    background: "#2563eb",
    boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.45), 0 2px 7px rgba(0, 0, 0, 0.25)",
    zIndex: 20,
    pointerEvents: "auto",
    touchAction: "none",
};
const HANDLE_POSITION: Record<MidpointHandle, React.CSSProperties> = {
    n: { top: 0, left: "50%", transform: "translate(-50%, -50%)", cursor: "ns-resize" },
    s: { bottom: 0, left: "50%", transform: "translate(-50%, 50%)", cursor: "ns-resize" },
    w: { top: "50%", left: 0, transform: "translate(-50%, -50%)", cursor: "ew-resize" },
    e: { top: "50%", right: 0, transform: "translate(50%, -50%)", cursor: "ew-resize" },
};
const HANDLE_LABEL: Record<MidpointHandle, string> = { n: "top", s: "bottom", w: "left", e: "right" };
function CropStage({ crop, aspect, imgRef, src, alt, zoom, rotate, onImageLoad, onCommit }: CropStageProps) {
    const [liveCrop, setLiveCrop] = useState<any>(crop);
    const liveRef = useRef<any>(crop);
    const sessionRef = useRef<MidpointSession | null>(null);
    const onCommitRef = useRef(onCommit);
    onCommitRef.current = onCommit;
    // Page replaced the crop (new image loaded / reset): follow it.
    useEffect(() => {
        liveRef.current = crop;
        setLiveCrop(crop);
    }, [crop]);
    const updateLive = useCallback((next: any) => {
        liveRef.current = next;
        setLiveCrop(next);
    }, []);
    const startMidpointResize = (direction: MidpointHandle) => (event: React.PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const image = imgRef.current;
        const current = liveRef.current;
        if (!image || !current || !image.clientWidth || !image.clientHeight)
            return;
        const imageWidth = image.clientWidth;
        const imageHeight = image.clientHeight;
        const initial = {
            x: (Number(current.x) / 100) * imageWidth,
            y: (Number(current.y) / 100) * imageHeight,
            width: (Number(current.width) / 100) * imageWidth,
            height: (Number(current.height) / 100) * imageHeight,
        };
        sessionRef.current = {
            direction,
            startClientX: event.clientX,
            startClientY: event.clientY,
            imageWidth,
            imageHeight,
            cropX: initial.x,
            cropY: initial.y,
            cropWidth: initial.width,
            cropHeight: initial.height,
            latest: initial,
        };
    };
    useEffect(() => {
        let frame = 0;
        let pending: PointerEvent | null = null;
        const apply = () => {
            frame = 0;
            const event = pending;
            const session = sessionRef.current;
            pending = null;
            if (!event || !session)
                return;
            const dx = event.clientX - session.startClientX;
            const dy = event.clientY - session.startClientY;
            const { direction, imageWidth, imageHeight, cropX, cropY, cropWidth, cropHeight } = session;
            const minSize = Math.min(12, imageWidth, imageHeight);
            let x = cropX;
            let y = cropY;
            let width = cropWidth;
            let height = cropHeight;
            // Edge handles resize only the axis they sit on; corner handles stay
            // aspect-locked by ReactCrop itself.
            if (direction === "n") {
                const fixedBottom = cropY + cropHeight;
                y = clampValue(cropY + dy, 0, Math.max(0, fixedBottom - minSize));
                height = fixedBottom - y;
            }
            else if (direction === "s") {
                height = clampValue(cropHeight + dy, minSize, imageHeight - cropY);
            }
            else if (direction === "w") {
                const fixedRight = cropX + cropWidth;
                x = clampValue(cropX + dx, 0, Math.max(0, fixedRight - minSize));
                width = fixedRight - x;
            }
            else {
                width = clampValue(cropWidth + dx, minSize, imageWidth - cropX);
            }
            x = clampValue(x, 0, imageWidth - width);
            y = clampValue(y, 0, imageHeight - height);
            width = Math.min(width, imageWidth - x);
            height = Math.min(height, imageHeight - y);
            session.latest = { x, y, width, height };
            updateLive({
                unit: "%",
                x: (x / imageWidth) * 100,
                y: (y / imageHeight) * 100,
                width: (width / imageWidth) * 100,
                height: (height / imageHeight) * 100,
            });
        };
        const onPointerMove = (event: PointerEvent) => {
            if (!sessionRef.current)
                return;
            event.preventDefault();
            pending = event;
            // At most one update per frame keeps dragging smooth on any pointer rate.
            if (!frame)
                frame = window.requestAnimationFrame(apply);
        };
        const onPointerUp = () => {
            const session = sessionRef.current;
            if (!session)
                return;
            if (frame) {
                window.cancelAnimationFrame(frame);
                frame = 0;
                apply();
            }
            onCommitRef.current({ unit: "px", ...session.latest });
            sessionRef.current = null;
        };
        document.addEventListener("pointermove", onPointerMove, { passive: false });
        document.addEventListener("pointerup", onPointerUp);
        document.addEventListener("pointercancel", onPointerUp);
        return () => {
            if (frame)
                window.cancelAnimationFrame(frame);
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);
            document.removeEventListener("pointercancel", onPointerUp);
            sessionRef.current = null;
        };
    }, [updateLive]);
    return (<ReactCrop crop={liveCrop} aspect={aspect} onChange={(_: any, percentCrop: any) => updateLive(percentCrop)} onComplete={(pixelCrop: any) => onCommit(pixelCrop)} renderSelectionAddon={() => (<div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {(["n", "e", "s", "w"] as const).map((direction) => (<button key={direction} type="button" aria-label={`Resize crop from ${HANDLE_LABEL[direction]} edge`} onPointerDown={startMidpointResize(direction)} style={{ ...HANDLE_STYLE, ...HANDLE_POSITION[direction] }}/>))}
        </div>)} className="sohozkaj-crop-canvas max-h-[70vh]">
      <img ref={imgRef} src={src} alt={alt} onLoad={onImageLoad} style={{
            transform: `scale(${zoom / 100}) rotate(${rotate}deg)`,
            transition: "transform 0.2s ease-in-out",
            willChange: "transform",
        }} className="max-h-[70vh] object-contain select-none"/>
    </ReactCrop>);
}
export default memo(CropStage);
