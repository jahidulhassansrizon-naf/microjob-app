"use client";
import { AiT, useAiEditorText } from "./aiEditorI18n";
import React, { useCallback, useEffect, useRef, useState } from "react";
type ClothingMaskEditorProps = {
    imageSrc: string;
    onMaskChange?: (maskDataUrl: string | null) => void;
    onClose?: () => void;
};
const BRUSH_MIN = 8;
const BRUSH_MAX = 180;
const DEFAULT_BRUSH = 50;
export default function ClothingMaskEditor({
    imageSrc, onMaskChange, onClose,
}: ClothingMaskEditorProps) {
    const { t } = useAiEditorText();
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isImageReady, setIsImageReady] = useState(false);
    const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH);
    const [isErasing, setIsErasing] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const getMaskCanvas = () => maskCanvasRef.current;
    const clearMask = useCallback(() => {
        const canvas = getMaskCanvas();
        if (!canvas)
            return;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onMaskChange?.(null);
    }, [onMaskChange]);
    const emitMask = useCallback(() => {
        const canvas = getMaskCanvas();
        if (!canvas)
            return;
        const maskDataUrl = canvas.toDataURL("image/png");
        onMaskChange?.(maskDataUrl);
    }, [onMaskChange]);
    const initializeCanvas = useCallback(() => {
        const image = imageRef.current;
        const canvas = maskCanvasRef.current;
        if (!image || !canvas)
            return;
        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;
        if (!naturalWidth || !naturalHeight)
            return;
        canvas.width = naturalWidth;
        canvas.height = naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        setIsImageReady(true);
        onMaskChange?.(null);
    }, [onMaskChange]);
    const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = maskCanvasRef.current;
        if (!canvas)
            return null;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height)
            return null;
        const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
        return {
            x,
            y,
        };
    };
    const drawPoint = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        const canvas = maskCanvasRef.current;
        if (!canvas)
            return;
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = brushSize;
        if (isErasing) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.strokeStyle = "rgba(255,255,255,1)";
        }
        else {
            // White means "edit this area".
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = "rgba(255,255,255,1)";
        }
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 0.01, y + 0.01);
        ctx.stroke();
        ctx.restore();
    };
    const drawLine = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = brushSize;
        if (isErasing) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.strokeStyle = "rgba(255,255,255,1)";
        }
        else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = "rgba(255,255,255,1)";
        }
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        ctx.restore();
    };
    const lastPointRef = useRef<{
        x: number;
        y: number;
    } | null>(null);
    const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isImageReady)
            return;
        event.preventDefault();
        const canvas = maskCanvasRef.current;
        if (!canvas)
            return;
        canvas.setPointerCapture(event.pointerId);
        const point = getCanvasPoint(event);
        if (!point)
            return;
        setIsDrawing(true);
        lastPointRef.current = point;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        drawPoint(ctx, point.x, point.y);
        emitMask();
    };
    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing)
            return;
        event.preventDefault();
        const canvas = maskCanvasRef.current;
        if (!canvas)
            return;
        const point = getCanvasPoint(event);
        if (!point)
            return;
        const previous = lastPointRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        if (previous) {
            drawLine(ctx, previous.x, previous.y, point.x, point.y);
        }
        else {
            drawPoint(ctx, point.x, point.y);
        }
        lastPointRef.current = point;
        emitMask();
    };
    const stopDrawing = (event?: React.PointerEvent<HTMLCanvasElement>) => {
        if (event) {
            try {
                event.currentTarget.releasePointerCapture(event.pointerId);
            }
            catch {
                // Ignore pointer capture release errors.
            }
        }
        setIsDrawing(false);
        lastPointRef.current = null;
        emitMask();
    };
    const resetMask = () => {
        clearMask();
    };
    const handleImageLoad = () => {
        initializeCanvas();
    };
    useEffect(() => {
        setIsImageReady(false);
        const image = imageRef.current;
        if (!image)
            return;
        if (image.complete) {
            initializeCanvas();
        }
    }, [imageSrc, initializeCanvas]);
    return (<div ref={wrapperRef} className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900"><AiT>{"Select Clothing Area\r\n            "}</AiT></h2>

            <p className="mt-1 text-sm text-slate-500"><AiT>{"Brush only over the clothing you want the AI to change. Keep the\r\n              face, hair and skin untouched.\r\n            "}</AiT></p>
          </div>

          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"><AiT>{"Close\r\n          "}</AiT></button>
        </div>

        {/* Main */}
        <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-slate-50 p-4 md:flex-row">
          {/* Image editor */}
          <div className="flex min-h-[420px] flex-1 items-center justify-center">
            <div className="relative inline-block max-h-[75vh] max-w-full overflow-hidden rounded-xl bg-slate-900 shadow-lg">
              <img ref={imageRef} src={imageSrc} alt={t("Clothing mask source")} onLoad={handleImageLoad} className="block max-h-[75vh] max-w-full select-none object-contain" draggable={false}/>

              <canvas ref={maskCanvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} onPointerLeave={stopDrawing} className="absolute inset-0 h-full w-full touch-none cursor-crosshair"/>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex w-full flex-col gap-4 md:ml-5 md:mt-0 md:w-72">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900"><AiT>{"How to use"}</AiT></p>

              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p><AiT>{"1. Paint over the shirt / dress / jacket."}</AiT></p>
                <p><AiT>{"2. Do not paint over the face or hair."}</AiT></p>
                <p><AiT>{"3. Do not paint over exposed skin."}</AiT></p>
                <p><AiT>{"4. Use Eraser to fix mistakes."}</AiT></p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900"><AiT>{"Brush\r\n                "}</AiT></span>

                <span className="text-xs text-slate-500">{brushSize}<AiT>{"px"}</AiT></span>
              </div>

              <input type="range" min={BRUSH_MIN} max={BRUSH_MAX} value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} className="mt-4 w-full"/>

              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => setIsErasing(false)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${!isErasing
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}><AiT>{"Brush\r\n                "}</AiT></button>

                <button type="button" onClick={() => setIsErasing(true)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${isErasing
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}><AiT>{"Eraser\r\n                "}</AiT></button>
              </div>
            </div>

            <button type="button" onClick={resetMask} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"><AiT>{"Clear Mask\r\n            "}</AiT></button>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
              <strong><AiT>{"Important:"}</AiT></strong><AiT>{"White mask = area AI can edit.\r\n              Unpainted/transparent area = keep unchanged.\r\n            "}</AiT></div>

            <button type="button" onClick={onClose} className="rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"><AiT>{"Done Selecting\r\n            "}</AiT></button>
          </div>
        </div>
      </div>
    </div>);
}
