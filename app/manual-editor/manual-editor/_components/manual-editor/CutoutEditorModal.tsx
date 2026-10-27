"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, Eraser, Loader2, RotateCcw, Undo2, Redo2, X } from "lucide-react";
import type { PhotoAsset } from "./types";
import { removeBackgroundFromImage } from "./segmentation";
import { useManualEditor } from "./EditorProvider";
import { featherMask } from "./photoTools";

type BrushMode = "erase" | "restore";
type Point = { x: number; y: number };
type StrokeOperation = { mode: BrushMode; size: number; points: Point[] };

type Props = { sourcePhoto: PhotoAsset; onClose: () => void };

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("ছবিটি লোড করা যায়নি। আবার চেষ্টা করুন।"));
    image.src = url;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pointToSegmentDistance(px: number, py: number, a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= 0.0001) return Math.hypot(px - a.x, py - a.y);
  const t = clamp(((px - a.x) * dx + (py - a.y) * dy) / lengthSquared, 0, 1);
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}

/** Returns a copy whose alpha channel edge is smoothed. Colour is untouched.
 * A small blur removes jagged/noisy mask edges; the contrast curve afterwards
 * keeps the edge position stable (no shrinking or growing) and reasonably crisp. */
function smoothAlphaEdges(source: ImageData, radius: number) {
  const out = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  if (radius <= 0) return out;
  const alpha = new Uint8Array(source.width * source.height);
  for (let i = 0; i < alpha.length; i += 1) alpha[i] = source.data[i * 4 + 3];
  const blurred = featherMask(alpha, source.width, source.height, radius);
  for (let i = 0; i < blurred.length; i += 1) {
    const curved = clamp((blurred[i] - 127.5) * 1.5 + 127.5, 0, 255);
    // Never make fully opaque interior pixels transparent, or fully empty ones visible.
    out.data[i * 4 + 3] = alpha[i] === 255 && blurred[i] > 250 ? 255 : alpha[i] === 0 && blurred[i] < 5 ? 0 : Math.round(curved);
  }
  return out;
}

const PREVIEW_BACKDROPS: { id: string; label: string; color: string | null }[] = [
  { id: "checker", label: "Transparent", color: null },
  { id: "white", label: "White", color: "#FFFFFF" },
  { id: "blue", label: "Light blue", color: "#BFDBFE" },
  { id: "grey", label: "Grey", color: "#D1D5DB" },
];

/** Paints only the area affected by a brush segment. The original pixels are
 * used by Restore; Erase reduces alpha so the export remains truly transparent. */
function applySegment(
  imageData: ImageData,
  originalPixels: Uint8ClampedArray,
  mode: BrushMode,
  a: Point,
  b: Point,
  brushSize: number,
) {
  const width = imageData.width;
  const height = imageData.height;
  const radius = Math.max(1, brushSize / 2);
  const left = clamp(Math.floor(Math.min(a.x, b.x) - radius - 2), 0, width - 1);
  const top = clamp(Math.floor(Math.min(a.y, b.y) - radius - 2), 0, height - 1);
  const right = clamp(Math.ceil(Math.max(a.x, b.x) + radius + 2), 0, width - 1);
  const bottom = clamp(Math.ceil(Math.max(a.y, b.y) + radius + 2), 0, height - 1);
  const feather = 1.5;

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const distance = pointToSegmentDistance(x + 0.5, y + 0.5, a, b);
      if (distance >= radius + feather) continue;
      const coverage = clamp((radius + feather - distance) / feather, 0, 1);
      const offset = (y * width + x) * 4;
      if (mode === "erase") {
        imageData.data[offset + 3] = Math.round(imageData.data[offset + 3] * (1 - coverage));
      } else {
        for (let channel = 0; channel < 4; channel += 1) {
          const current = imageData.data[offset + channel];
          const original = originalPixels[offset + channel];
          imageData.data[offset + channel] = Math.round(current * (1 - coverage) + original * coverage);
        }
      }
    }
  }

  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

export default function CutoutEditorModal({ sourcePhoto, onClose }: Props) {
  const { applyCutoutFile, setAiNotice, setActiveAiTool } = useManualEditor();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const baseImageDataRef = useRef<ImageData | null>(null);
  const workingImageDataRef = useRef<ImageData | null>(null);
  const originalPixelsRef = useRef<Uint8ClampedArray | null>(null);
  const operationsRef = useRef<StrokeOperation[]>([]);
  const historyIndexRef = useRef(0);
  const strokeRef = useRef<StrokeOperation | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const cutoutUrlRef = useRef<string | null>(null);
  const softBaseRef = useRef<ImageData | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [brushMode, setBrushMode] = useState<BrushMode>("erase");
  const [brushSize, setBrushSize] = useState(48);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyLength, setHistoryLength] = useState(0);
  const [status, setStatus] = useState("AI দিয়ে ব্যাকগ্রাউন্ড আলাদা করা হচ্ছে…");
  const [zoom, setZoom] = useState(100);
  const [fitScale, setFitScale] = useState(1);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [edgeSoftness, setEdgeSoftness] = useState(0);
  const [backdropId, setBackdropId] = useState("checker");
  const [customBackdrop, setCustomBackdrop] = useState("#FFFFFF");

  const drawOperations = useCallback((operations: StrokeOperation[], count: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    const base = softBaseRef.current ?? baseImageDataRef.current;
    const originalPixels = originalPixelsRef.current;
    if (!canvas || !ctx || !base || !originalPixels) return;

    const next = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height);
    for (const operation of operations.slice(0, count)) {
      for (let index = 0; index < operation.points.length; index += 1) {
        const point = operation.points[index];
        const previous = operation.points[index - 1] ?? point;
        applySegment(next, originalPixels, operation.mode, previous, point, operation.size);
      }
    }
    workingImageDataRef.current = next;
    ctx.putImageData(next, 0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    const initialize = async () => {
      setLoading(true);
      setError("");
      setStatus("AI দিয়ে ব্যাকগ্রাউন্ড আলাদা করা হচ্ছে…");
      try {
        const cutoutBlob = await removeBackgroundFromImage(sourcePhoto.file);
        if (cancelled) return;
        createdUrl = URL.createObjectURL(cutoutBlob);
        cutoutUrlRef.current = createdUrl;
        setStatus("এখন ব্রাশ দিয়ে কাটআউট ঠিক করতে পারবেন।");

        const [originalImage, cutoutImage] = await Promise.all([
          loadImage(sourcePhoto.url),
          loadImage(createdUrl),
        ]);
        if (cancelled) return;

        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d", { willReadFrequently: true });
        if (!canvas || !context) throw new Error("Canvas চালু করা যায়নি।");

        const width = cutoutImage.naturalWidth;
        const height = cutoutImage.naturalHeight;
        if (!width || !height) throw new Error("কাটআউট ছবির সাইজ সঠিক নয়।");
        canvas.width = width;
        canvas.height = height;
        context.clearRect(0, 0, width, height);
        context.drawImage(cutoutImage, 0, 0, width, height);
        const base = context.getImageData(0, 0, width, height);

        const originalCanvas = document.createElement("canvas");
        originalCanvas.width = width;
        originalCanvas.height = height;
        const originalContext = originalCanvas.getContext("2d", { willReadFrequently: true });
        if (!originalContext) throw new Error("মূল ছবির পিক্সেল পড়া যায়নি।");
        originalContext.drawImage(originalImage, 0, 0, width, height);
        const originalData = originalContext.getImageData(0, 0, width, height);

        originalImageRef.current = originalImage;
        baseImageDataRef.current = new ImageData(new Uint8ClampedArray(base.data), width, height);
        softBaseRef.current = null;
        setEdgeSoftness(0);
        setImageSize({ width, height });
        workingImageDataRef.current = base;
        originalPixelsRef.current = originalData.data;
        operationsRef.current = [];
        historyIndexRef.current = 0;
        setHistoryIndex(0);
        setHistoryLength(0);
        setLoading(false);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "ব্যাকগ্রাউন্ড সরানো যায়নি।");
        setLoading(false);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
      cutoutUrlRef.current = null;
      originalImageRef.current = null;
      baseImageDataRef.current = null;
      softBaseRef.current = null;
      workingImageDataRef.current = null;
      originalPixelsRef.current = null;
      operationsRef.current = [];
      historyIndexRef.current = 0;
      strokeRef.current = null;
    };
  }, [sourcePhoto]);

  // Recompute the smoothed base whenever the softness slider settles, then replay
  // the user's brush strokes on top so preview and exported pixels stay identical.
  useEffect(() => {
    const base = baseImageDataRef.current;
    if (!base || loading) return;
    const timer = window.setTimeout(() => {
      softBaseRef.current = edgeSoftness > 0 ? smoothAlphaEdges(base, edgeSoftness) : null;
      drawOperations(operationsRef.current, historyIndexRef.current);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [drawOperations, edgeSoftness, loading]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !imageSize.width) return;
    const update = () => {
      const rect = viewport.getBoundingClientRect();
      const scale = Math.min((rect.width - 8) / imageSize.width, (rect.height - 8) / imageSize.height);
      setFitScale(scale > 0 && Number.isFinite(scale) ? scale : 1);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [imageSize]);

  const displayWidth = imageSize.width * fitScale * (zoom / 100);
  const displayHeight = imageSize.height * fitScale * (zoom / 100);
  const backdropColor = backdropId === "custom" ? customBackdrop : PREVIEW_BACKDROPS.find((item) => item.id === backdropId)?.color ?? null;

  const getPoint = (event: ReactPointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * canvas.width, 0, canvas.width - 1),
      y: clamp(((event.clientY - rect.top) / rect.height) * canvas.height, 0, canvas.height - 1),
    };
  };

  const paintCurrentSegment = (operation: StrokeOperation, a: Point, b: Point) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    const working = workingImageDataRef.current;
    const originalPixels = originalPixelsRef.current;
    if (!canvas || !ctx || !working || !originalPixels) return;
    const dirty = applySegment(working, originalPixels, operation.mode, a, b, operation.size);
    ctx.putImageData(working, 0, 0, dirty.left, dirty.top, dirty.width, dirty.height);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (loading || applying || error) return;
    event.preventDefault();
    const point = getPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const operation: StrokeOperation = { mode: brushMode, size: brushSize, points: [point] };
    strokeRef.current = operation;
    lastPointRef.current = point;
    paintCurrentSegment(operation, point, point);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const operation = strokeRef.current;
    if (!operation) return;
    event.preventDefault();
    const point = getPoint(event);
    const previous = lastPointRef.current;
    if (!point || !previous) return;
    operation.points.push(point);
    paintCurrentSegment(operation, previous, point);
    lastPointRef.current = point;
  };

  const finishStroke = () => {
    const operation = strokeRef.current;
    if (!operation) return;
    strokeRef.current = null;
    lastPointRef.current = null;
    const nextOperations = operationsRef.current.slice(0, historyIndexRef.current);
    nextOperations.push(operation);
    operationsRef.current = nextOperations;
    historyIndexRef.current = nextOperations.length;
    setHistoryLength(nextOperations.length);
    setHistoryIndex(nextOperations.length);
    setStatus(operation.mode === "erase" ? "ব্রাশ দিয়ে অংশ মুছে দেওয়া হয়েছে।" : "মূল ছবি থেকে অংশ ফিরিয়ে আনা হয়েছে।");
  };

  const undo = () => {
    if (historyIndexRef.current <= 0 || loading || applying) return;
    historyIndexRef.current -= 1;
    setHistoryIndex(historyIndexRef.current);
    drawOperations(operationsRef.current, historyIndexRef.current);
  };

  const redo = () => {
    if (historyIndexRef.current >= operationsRef.current.length || loading || applying) return;
    historyIndexRef.current += 1;
    setHistoryIndex(historyIndexRef.current);
    drawOperations(operationsRef.current, historyIndexRef.current);
  };

  const reset = () => {
    if (loading || applying) return;
    operationsRef.current = [];
    historyIndexRef.current = 0;
    setHistoryIndex(0);
    setHistoryLength(0);
    drawOperations([], 0);
    setStatus("কাটআউটের আগের AI ফলাফলে ফিরে গেছেন।");
  };

  const close = () => {
    if (applying) return;
    setActiveAiTool(null);
    setAiNotice("");
    onClose();
  };

  const applyCutout = async () => {
    const canvas = canvasRef.current;
    if (!canvas || loading || applying || error) return;
    setApplying(true);
    setError("");
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error("PNG তৈরি করা যায়নি।")), "image/png");
      });
      const file = new File([blob], `${sourcePhoto.file.name.replace(/\.[^/.]+$/, "")}-cutout.png`, { type: "image/png" });
      await applyCutoutFile(file, sourcePhoto.file);
      setAiNotice("Cutout applied. The transparent background is preserved in PNG export.");
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "কাটআউট প্রয়োগ করা যায়নি।");
      setApplying(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#211a13]/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="cutout-editor-title">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#E3D6B8] bg-[#F7EEDB] shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-[#E3D6B8] px-4 py-3 sm:px-5">
          <div>
            <h2 id="cutout-editor-title" className="text-base font-extrabold text-[#3B2F1E] sm:text-lg">Cutout Editor</h2>
            <p className="mt-0.5 text-xs text-[#6B5A40]">AI কাটআউট ঠিক করতে Erase বা Restore ব্রাশ ব্যবহার করুন।</p>
          </div>
          <button type="button" onClick={close} disabled={applying} className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#3B2F1E] hover:bg-[#EFE3C8] disabled:opacity-50" aria-label="Close cutout editor"><X size={18}/></button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_230px]">
          <div className="relative flex min-h-[320px] items-center justify-center p-3 sm:p-5">
            <div ref={viewportRef} className={`h-[60vh] w-full overflow-auto rounded-xl border border-[#D8C9A6] shadow-inner ${loading ? "invisible" : "visible"}`}>
              <div className="relative m-auto" style={{ width: displayWidth || undefined, height: displayHeight || undefined, backgroundColor: backdropColor ?? "#fff", backgroundImage: backdropColor ? undefined : "linear-gradient(45deg,#e7e0d2 25%,transparent 25%),linear-gradient(-45deg,#e7e0d2 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e7e0d2 75%),linear-gradient(-45deg,transparent 75%,#e7e0d2 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0,0 10px,10px -10px,-10px 0" }}>
                <canvas ref={canvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishStroke} onPointerCancel={finishStroke} className="block h-full w-full touch-none cursor-crosshair" aria-label="Cutout brush editing canvas" />
              </div>
            </div>
            {loading && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#DC2626]"/>
              <p className="text-sm font-bold text-[#3B2F1E]">ব্যাকগ্রাউন্ড সরানো হচ্ছে…</p>
              <p className="max-w-xs text-xs text-[#6B5A40]">প্রথমবার মডেল লোড হতে কিছুটা সময় লাগতে পারে।</p>
            </div>}
          </div>

          <aside className="flex flex-col gap-4 border-t border-[#E3D6B8] bg-[#F2E8D2] p-4 md:border-l md:border-t-0">
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#6B5A40]">Brush tool</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" disabled={loading || applying || Boolean(error)} onClick={() => setBrushMode("erase")} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-extrabold ${brushMode === "erase" ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C]" : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32]"}`}><Eraser size={15}/> Erase</button>
                <button type="button" disabled={loading || applying || Boolean(error)} onClick={() => setBrushMode("restore")} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-extrabold ${brushMode === "restore" ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C]" : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32]"}`}><Check size={15}/> Restore</button>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-[#6B5A40]">Erase অংশ স্বচ্ছ করবে। Restore মূল আপলোড করা ছবি থেকে ওই অংশ ফিরিয়ে আনবে।</p>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="cutout-brush-size">Brush size</label><span className="text-[#DC2626]">{brushSize}px</span></div>
              <input id="cutout-brush-size" type="range" min={8} max={180} step={2} value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} disabled={loading || applying || Boolean(error)} className="w-full accent-[#DC2626]"/>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="cutout-zoom">Zoom</label><span className="text-[#DC2626]">{zoom}%</span></div>
              <input id="cutout-zoom" type="range" min={100} max={600} step={25} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} disabled={loading || applying || Boolean(error)} className="w-full accent-[#DC2626]"/>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="cutout-soft">Edge softness</label><span className="text-[#DC2626]">{edgeSoftness === 0 ? "Off" : `${edgeSoftness}px`}</span></div>
              <input id="cutout-soft" type="range" min={0} max={6} step={1} value={edgeSoftness} onChange={(event) => setEdgeSoftness(Number(event.target.value))} disabled={loading || applying || Boolean(error)} className="w-full accent-[#DC2626]"/>
              <p className="mt-1 text-[10px] leading-4 text-[#6B5A40]">Smooths jagged edges. Keep Off unless the edge looks rough.</p>
            </div>

            <div>
              <p className="mb-1 text-xs font-bold text-[#5A4A32]">Preview background</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {PREVIEW_BACKDROPS.map((item) => (<button key={item.id} type="button" onClick={() => setBackdropId(item.id)} title={item.label} aria-label={`Preview on ${item.label}`} className={`h-6 w-6 rounded-full border ${backdropId === item.id ? "ring-2 ring-[#DC2626] ring-offset-1" : "border-[#D8C9A6]"}`} style={{ backgroundColor: item.color ?? "#fff", backgroundImage: item.color ? undefined : "linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)", backgroundSize: "8px 8px", backgroundPosition: "0 0,4px 4px" }}/>))}
                <label className={`h-6 w-6 cursor-pointer overflow-hidden rounded-full border ${backdropId === "custom" ? "ring-2 ring-[#DC2626] ring-offset-1" : "border-[#D8C9A6]"}`} title="Custom colour" style={{ backgroundColor: customBackdrop }}>
                  <input type="color" value={customBackdrop} onChange={(event) => { setCustomBackdrop(event.target.value); setBackdropId("custom"); }} className="h-full w-full cursor-pointer opacity-0"/>
                </label>
              </div>
              <p className="mt-1 text-[10px] leading-4 text-[#6B5A40]">Preview only. The result stays transparent; choose the final background colour in the Background panel.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button type="button" title="Undo (Ctrl+Z)" disabled={historyIndex <= 0 || loading || applying} onClick={undo} className="flex items-center justify-center rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#5A4A32] disabled:opacity-40"><Undo2 size={16}/></button>
              <button type="button" title="Redo (Ctrl+Shift+Z)" disabled={historyIndex >= historyLength || loading || applying} onClick={redo} className="flex items-center justify-center rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#5A4A32] disabled:opacity-40"><Redo2 size={16}/></button>
              <button type="button" title="Reset brush changes" disabled={historyLength === 0 || loading || applying} onClick={reset} className="flex items-center justify-center rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#5A4A32] disabled:opacity-40"><RotateCcw size={16}/></button>
            </div>

            <div className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-3 text-[11px] leading-5 text-[#6B5A40]" aria-live="polite">{status}</div>
            {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700" role="alert">{error}</div>}

            <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
              <button type="button" onClick={close} disabled={applying} className="rounded-xl border border-[#D8C9A6] bg-[#FBF6E8] px-3 py-2.5 text-xs font-extrabold text-[#5A4A32] disabled:opacity-50">Cancel</button>
              <button type="button" onClick={() => void applyCutout()} disabled={loading || applying || Boolean(error)} className="flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-3 py-2.5 text-xs font-extrabold text-white hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50">{applying ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} {applying ? "Applying…" : "Apply cutout"}</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
