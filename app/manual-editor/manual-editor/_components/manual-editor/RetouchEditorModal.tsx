"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, Copy, Droplets, Eraser, Eye, LayoutGrid, Loader2, Redo2, RotateCcw, Sparkles, Undo2, X } from "lucide-react";
import type { PhotoAsset } from "./types";
import { useManualEditor } from "./EditorProvider";
import {
  blurRegion,
  cloneFrom,
  maskIsEmpty,
  paintMaskSegment,
  pixelateRegion,
  removeRedEye,
  repairRegion,
  smoothSkin,
  type Point,
} from "./photoTools";

type ToolId = "remove" | "clone" | "redeye" | "smooth" | "blur" | "pixelate";

type HistoryEntry = { x: number; y: number; width: number; height: number; before: ImageData; after: ImageData };

type Props = { sourcePhoto: PhotoAsset; onClose: () => void };

const MAX_HISTORY = 20;

const TOOLS: { id: ToolId; label: string; hint: string; icon: typeof Eraser }[] = [
  { id: "remove", label: "Remove", hint: "Paint over a spot, dust, scratch or small object, then press Apply to selection. The area is rebuilt from its surroundings (basic repair, not generative AI).", icon: Eraser },
  { id: "clone", label: "Clone / Heal", hint: "1) Press Pick source and click a clean area. 2) Paint over the problem. It is copied in as soon as you release.", icon: Copy },
  { id: "redeye", label: "Red-eye", hint: "Zoom in and paint over the red pupil only, then press Apply to selection.", icon: Eye },
  { id: "smooth", label: "Skin smooth", hint: "Paint over skin, then press Apply to selection. Only skin-coloured pixels are softened, so eyes, lips and hair keep their detail.", icon: Sparkles },
  { id: "blur", label: "Blur", hint: "Paint over anything you want to hide softly, then press Apply to selection.", icon: Droplets },
  { id: "pixelate", label: "Pixelate", hint: "Paint over sensitive details (numbers, faces) to hide them with blocks, then press Apply to selection.", icon: LayoutGrid },
];

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The photo could not be loaded. Please try again."));
    image.src = url;
  });
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function maskBounds(mask: Uint8Array, width: number, height: number) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      if (mask[row + x] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

export default function RetouchEditorModal({ sourcePhoto, onClose }: Props) {
  const { applyRetouchedFile, setAiNotice, setActiveAiTool } = useManualEditor();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const maskRef = useRef<Uint8Array | null>(null);
  const overlayDataRef = useRef<ImageData | null>(null);
  const historyRef = useRef<HistoryEntry[]>([]);
  const strokeRef = useRef<{ last: Point; start: Point } | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Choose a tool, then paint on the photo.");
  const [tool, setTool] = useState<ToolId>("remove");
  const [brushSize, setBrushSize] = useState(24);
  const [strength, setStrength] = useState(50);
  const [blurAmount, setBlurAmount] = useState(10);
  const [blockSize, setBlockSize] = useState(14);
  const [zoom, setZoom] = useState(100);
  const [fitScale, setFitScale] = useState(1);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyLength, setHistoryLength] = useState(0);
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionPercent, setSelectionPercent] = useState(0);
  const [pickingSource, setPickingSource] = useState(false);
  const [cloneSource, setCloneSource] = useState<Point | null>(null);
  const historyIndexRef = useRef(0);
  const cloneSourceRef = useRef<Point | null>(null);
  const pickingRef = useRef(false);
  const toolRef = useRef<ToolId>("remove");

  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { cloneSourceRef.current = cloneSource; }, [cloneSource]);
  useEffect(() => { pickingRef.current = pickingSource; }, [pickingSource]);

  /* ---------------- load photo at native resolution ---------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const image = await loadImage(sourcePhoto.url);
        if (cancelled) return;
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        const canvas = canvasRef.current;
        const overlay = overlayRef.current;
        const ctx = canvas?.getContext("2d", { willReadFrequently: true });
        const octx = overlay?.getContext("2d");
        if (!canvas || !overlay || !ctx || !octx || !width || !height) throw new Error("The editing canvas could not be started.");
        canvas.width = width;
        canvas.height = height;
        overlay.width = width;
        overlay.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0);
        maskRef.current = new Uint8Array(width * height);
        overlayDataRef.current = octx.createImageData(width, height);
        sizeRef.current = { width, height };
        setImageSize({ width, height });
        setBrushSize(Math.max(10, Math.round(Math.min(width, height) / 40)));
        setBlockSize(Math.max(8, Math.round(Math.min(width, height) / 60)));
        setBlurAmount(Math.max(4, Math.round(Math.min(width, height) / 100)));
        setLoading(false);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "The editor could not be opened.");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      historyRef.current = [];
      maskRef.current = null;
      overlayDataRef.current = null;
    };
  }, [sourcePhoto]);

  /* ---------------- fit-to-screen scale ---------------- */
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

  /* ---------------- selection overlay ---------------- */
  const refreshOverlay = useCallback((rect?: { left: number; top: number; right: number; bottom: number }) => {
    const mask = maskRef.current;
    const data = overlayDataRef.current;
    const overlay = overlayRef.current;
    const ctx = overlay?.getContext("2d");
    if (!mask || !data || !overlay || !ctx) return;
    const { width, height } = sizeRef.current;
    const left = rect ? clamp(rect.left, 0, width - 1) : 0;
    const top = rect ? clamp(rect.top, 0, height - 1) : 0;
    const right = rect ? clamp(rect.right, 0, width - 1) : width - 1;
    const bottom = rect ? clamp(rect.bottom, 0, height - 1) : height - 1;
    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        const i = y * width + x;
        const o = i * 4;
        const m = mask[i];
        data.data[o] = 239;
        data.data[o + 1] = 68;
        data.data[o + 2] = 68;
        data.data[o + 3] = Math.round(m * 0.55);
      }
    }
    ctx.putImageData(data, 0, 0, left, top, right - left + 1, bottom - top + 1);
  }, []);

  const clearMask = useCallback(() => {
    const mask = maskRef.current;
    if (!mask) return;
    mask.fill(0);
    overlayDataRef.current?.data.fill(0);
    const overlay = overlayRef.current;
    overlay?.getContext("2d")?.clearRect(0, 0, overlay.width, overlay.height);
    setHasSelection(false);
    setSelectionPercent(0);
  }, []);

  const updateSelectionStats = useCallback(() => {
    const mask = maskRef.current;
    if (!mask) return;
    let count = 0;
    for (let i = 0; i < mask.length; i += 1) if (mask[i] > 24) count += 1;
    setHasSelection(count > 0);
    setSelectionPercent((count / mask.length) * 100);
  }, []);

  /* ---------------- history ---------------- */
  const pushHistory = useCallback((entry: HistoryEntry) => {
    const next = historyRef.current.slice(0, historyIndexRef.current);
    next.push(entry);
    while (next.length > MAX_HISTORY) next.shift();
    historyRef.current = next;
    historyIndexRef.current = next.length;
    setHistoryLength(next.length);
    setHistoryIndex(next.length);
  }, []);

  const undo = useCallback(() => {
    if (busy || loading || historyIndexRef.current <= 0) return;
    const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true });
    const entry = historyRef.current[historyIndexRef.current - 1];
    if (!ctx || !entry) return;
    ctx.putImageData(entry.before, entry.x, entry.y);
    historyIndexRef.current -= 1;
    setHistoryIndex(historyIndexRef.current);
    setStatus("Last change undone.");
  }, [busy, loading]);

  const redo = useCallback(() => {
    if (busy || loading || historyIndexRef.current >= historyRef.current.length) return;
    const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true });
    const entry = historyRef.current[historyIndexRef.current];
    if (!ctx || !entry) return;
    ctx.putImageData(entry.after, entry.x, entry.y);
    historyIndexRef.current += 1;
    setHistoryIndex(historyIndexRef.current);
    setStatus("Change restored.");
  }, [busy, loading]);

  const resetAll = useCallback(() => {
    if (busy || loading) return;
    const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    for (let i = historyIndexRef.current - 1; i >= 0; i -= 1) {
      const entry = historyRef.current[i];
      ctx.putImageData(entry.before, entry.x, entry.y);
    }
    historyRef.current = [];
    historyIndexRef.current = 0;
    setHistoryIndex(0);
    setHistoryLength(0);
    clearMask();
    setStatus("Photo restored to how it was when you opened this editor.");
  }, [busy, clearMask, loading]);

  /* ---------------- run the selected tool on the painted selection ---------------- */
  const runTool = useCallback(
    (toolId: ToolId, cloneOffset?: { dx: number; dy: number }) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d", { willReadFrequently: true });
      const mask = maskRef.current;
      if (!canvas || !ctx || !mask) return false;
      const { width, height } = sizeRef.current;
      const bounds = maskBounds(mask, width, height);
      if (!bounds) {
        setStatus("Paint over the area first.");
        return false;
      }

      // Work only on the painted area plus a margin, so large photos stay fast.
      const margin = toolId === "remove" ? 24 : toolId === "blur" ? Math.ceil(blurAmount * 3) + 2 : toolId === "smooth" ? 6 : 4;
      let left = bounds.x - margin;
      let top = bounds.y - margin;
      let right = bounds.x + bounds.width + margin;
      let bottom = bounds.y + bounds.height + margin;
      if (toolId === "clone" && cloneOffset) {
        left = Math.min(left, left + cloneOffset.dx);
        right = Math.max(right, right + cloneOffset.dx);
        top = Math.min(top, top + cloneOffset.dy);
        bottom = Math.max(bottom, bottom + cloneOffset.dy);
      }
      left = clamp(Math.floor(left), 0, width - 1);
      top = clamp(Math.floor(top), 0, height - 1);
      right = clamp(Math.ceil(right), 1, width);
      bottom = clamp(Math.ceil(bottom), 1, height);
      const rw = right - left;
      const rh = bottom - top;

      const before = ctx.getImageData(left, top, rw, rh);
      const working = new ImageData(new Uint8ClampedArray(before.data), rw, rh);
      const regionMask = new Uint8Array(rw * rh);
      for (let y = 0; y < rh; y += 1) {
        const srcRow = (top + y) * width + left;
        regionMask.set(mask.subarray(srcRow, srcRow + rw), y * rw);
      }

      let changed = 0;
      if (toolId === "remove") {
        changed = repairRegion(working, regionMask, { searchRadius: clamp(Math.round(brushSize / 3), 4, 14), grain: 2 });
        if (changed < 0) {
          setStatus("The selection covers the whole photo, so there is nothing to rebuild it from.");
          return false;
        }
      } else if (toolId === "clone") {
        if (!cloneOffset) return false;
        changed = cloneFrom(working, new Uint8ClampedArray(before.data), regionMask, cloneOffset.dx, cloneOffset.dy, "heal");
      } else if (toolId === "redeye") {
        changed = removeRedEye(working, regionMask);
        if (changed === 0) {
          setStatus("No strongly red pixels were found in the selection. Paint directly over the red pupil.");
          return false;
        }
      } else if (toolId === "smooth") {
        changed = smoothSkin(working, regionMask, strength / 100);
        if (changed === 0) {
          setStatus("No skin-coloured pixels were found in the selection.");
          return false;
        }
      } else if (toolId === "blur") {
        changed = blurRegion(working, regionMask, blurAmount);
      } else if (toolId === "pixelate") {
        changed = pixelateRegion(working, regionMask, blockSize);
      }

      if (changed <= 0) {
        setStatus("Nothing was changed. Try painting a different area.");
        return false;
      }

      ctx.putImageData(working, left, top);
      pushHistory({ x: left, y: top, width: rw, height: rh, before, after: working });
      return true;
    },
    [blockSize, blurAmount, brushSize, pushHistory, strength],
  );

  const applySelection = useCallback(() => {
    if (busy || loading || !hasSelection) return;
    setBusy(true);
    setStatus("Working…");
    // Let the browser paint the "Working…" state before the CPU-heavy step.
    window.setTimeout(() => {
      try {
        const ok = runTool(tool);
        if (ok) {
          clearMask();
          setStatus("Done. You can keep editing, undo, or press Save to photo.");
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "That edit failed. Your photo was not changed.");
      } finally {
        setBusy(false);
      }
    }, 30);
  }, [busy, clearMask, hasSelection, loading, runTool, tool]);

  /* ---------------- pointer painting ---------------- */
  const getPoint = (event: ReactPointerEvent<HTMLCanvasElement>): Point | null => {
    const overlay = overlayRef.current;
    if (!overlay) return null;
    const rect = overlay.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * overlay.width, 0, overlay.width - 1),
      y: clamp(((event.clientY - rect.top) / rect.height) * overlay.height, 0, overlay.height - 1),
    };
  };

  const paintSegment = (a: Point, b: Point) => {
    const mask = maskRef.current;
    if (!mask) return;
    const { width, height } = sizeRef.current;
    paintMaskSegment(mask, width, height, a, b, brushSize);
    const r = brushSize / 2 + 3;
    refreshOverlay({ left: Math.floor(Math.min(a.x, b.x) - r), top: Math.floor(Math.min(a.y, b.y) - r), right: Math.ceil(Math.max(a.x, b.x) + r), bottom: Math.ceil(Math.max(a.y, b.y) + r) });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (loading || busy || error) return;
    event.preventDefault();
    const point = getPoint(event);
    if (!point) return;
    if (pickingRef.current) {
      setCloneSource(point);
      setPickingSource(false);
      setStatus("Source set. Now paint over the area you want to cover.");
      return;
    }
    if (toolRef.current === "clone" && !cloneSourceRef.current) {
      setStatus("Press “Pick source” and click a clean area first.");
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    strokeRef.current = { last: point, start: point };
    paintSegment(point, point);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const stroke = strokeRef.current;
    if (!stroke) return;
    event.preventDefault();
    const point = getPoint(event);
    if (!point) return;
    paintSegment(stroke.last, point);
    stroke.last = point;
  };

  const finishStroke = () => {
    const stroke = strokeRef.current;
    if (!stroke) return;
    strokeRef.current = null;
    if (toolRef.current === "clone") {
      const source = cloneSourceRef.current;
      if (!source) return;
      const dx = Math.round(source.x - stroke.start.x);
      const dy = Math.round(source.y - stroke.start.y);
      const ok = runTool("clone", { dx, dy });
      clearMask();
      if (ok) setStatus("Copied. Paint again to keep cloning from the same source.");
      return;
    }
    updateSelectionStats();
  };

  /* ---------------- close / save ---------------- */
  const close = useCallback(() => {
    if (busy) return;
    if (historyIndexRef.current > 0 && !window.confirm("Discard your retouching changes?")) return;
    setActiveAiTool(null);
    onClose();
  }, [busy, onClose, setActiveAiTool]);

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas || loading || busy || error) return;
    if (historyIndexRef.current === 0) {
      setActiveAiTool(null);
      onClose();
      return;
    }
    setBusy(true);
    setStatus("Saving…");
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("The edited photo could not be created."))), "image/png");
      });
      const base = sourcePhoto.file.name.replace(/\.[^/.]+$/, "");
      const file = new File([blob], `${base}-retouched.png`, { type: "image/png" });
      await applyRetouchedFile(file, sourcePhoto.file);
      setAiNotice("Retouching applied.");
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The edit could not be saved. Your photo was not changed.");
      setBusy(false);
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
  }, [close, redo, undo]);

  const activeTool = useMemo(() => TOOLS.find((item) => item.id === tool) ?? TOOLS[0], [tool]);
  const disabled = loading || busy || Boolean(error);
  const needsApplyButton = tool !== "clone";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#211a13]/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="retouch-editor-title">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#E3D6B8] bg-[#F7EEDB] shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-[#E3D6B8] px-4 py-3 sm:px-5">
          <div>
            <h2 id="retouch-editor-title" className="text-base font-extrabold text-[#3B2F1E] sm:text-lg">Retouch &amp; Remove</h2>
            <p className="mt-0.5 text-xs text-[#6B5A40]">Fix spots, remove small objects, hide private details. Edits happen in your browser at full photo resolution.</p>
          </div>
          <button type="button" onClick={close} disabled={busy} className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#3B2F1E] hover:bg-[#EFE3C8] disabled:opacity-50" aria-label="Close retouch editor"><X size={18} /></button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="relative flex min-h-[320px] flex-col gap-2 p-3 sm:p-4">
            <div ref={viewportRef} className="relative h-[60vh] overflow-auto rounded-xl border border-[#D8C9A6] bg-[#EFE5CE]">
              <div className={`relative m-auto ${loading ? "invisible" : "visible"}`} style={{ width: displayWidth || undefined, height: displayHeight || undefined, backgroundColor: "#fff", backgroundImage: "linear-gradient(45deg,#e7e0d2 25%,transparent 25%),linear-gradient(-45deg,#e7e0d2 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e7e0d2 75%),linear-gradient(-45deg,transparent 75%,#e7e0d2 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0,0 10px,10px -10px,-10px 0" }}>
                <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-label="Photo being retouched" />
                <canvas ref={overlayRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishStroke} onPointerCancel={finishStroke} className={`absolute inset-0 block h-full w-full touch-none ${pickingSource ? "cursor-copy" : "cursor-crosshair"}`} aria-label="Paint selection here" />
                {cloneSource && tool === "clone" && imageSize.width > 0 && (
                  <div className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#10B981] bg-white/40 shadow" style={{ left: `${(cloneSource.x / imageSize.width) * 100}%`, top: `${(cloneSource.y / imageSize.height) * 100}%` }} />
                )}
              </div>
              {loading && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#DC2626]" /></div>}
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-[#5A4A32]">
              <label htmlFor="retouch-zoom" className="whitespace-nowrap">Zoom {zoom}%</label>
              <input id="retouch-zoom" type="range" min={100} max={600} step={25} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} disabled={disabled} className="w-full accent-[#DC2626]" />
              <button type="button" onClick={() => setZoom(100)} disabled={disabled || zoom === 100} className="whitespace-nowrap rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2 py-1 disabled:opacity-40">Fit</button>
            </div>
          </div>

          <aside className="flex flex-col gap-3 border-t border-[#E3D6B8] bg-[#F2E8D2] p-4 md:border-l md:border-t-0">
            <div className="grid grid-cols-3 gap-2">
              {TOOLS.map((item) => {
                const Icon = item.icon;
                const active = tool === item.id;
                return (
                  <button key={item.id} type="button" disabled={disabled} onClick={() => { setTool(item.id); clearMask(); setPickingSource(false); }} title={item.label} className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[10px] font-extrabold leading-tight ${active ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C]" : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32]"} disabled:opacity-50`}>
                    <Icon size={15} />{item.label}
                  </button>
                );
              })}
            </div>
            <p className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[11px] leading-5 text-[#6B5A40]">{activeTool.hint}</p>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="retouch-brush">Brush size</label><span className="text-[#DC2626]">{brushSize}px</span></div>
              <input id="retouch-brush" type="range" min={4} max={Math.max(60, Math.round(Math.min(imageSize.width, imageSize.height) / 4))} step={1} value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} disabled={disabled} className="w-full accent-[#DC2626]" />
            </div>

            {tool === "clone" && (
              <button type="button" disabled={disabled} onClick={() => setPickingSource((value) => !value)} className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${pickingSource ? "border-[#10B981] bg-emerald-50 text-emerald-700" : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32]"}`}>
                {pickingSource ? "Click a clean area now…" : cloneSource ? "Change source" : "Pick source"}
              </button>
            )}
            {tool === "smooth" && (
              <div>
                <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="retouch-strength">Strength</label><span className="text-[#DC2626]">{strength}%</span></div>
                <input id="retouch-strength" type="range" min={10} max={100} value={strength} onChange={(event) => setStrength(Number(event.target.value))} disabled={disabled} className="w-full accent-[#DC2626]" />
                <p className="mt-1 text-[10px] text-[#6B5A40]">Lower values look more natural.</p>
              </div>
            )}
            {tool === "blur" && (
              <div>
                <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="retouch-blur">Blur amount</label><span className="text-[#DC2626]">{blurAmount}px</span></div>
                <input id="retouch-blur" type="range" min={2} max={80} value={blurAmount} onChange={(event) => setBlurAmount(Number(event.target.value))} disabled={disabled} className="w-full accent-[#DC2626]" />
              </div>
            )}
            {tool === "pixelate" && (
              <div>
                <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="retouch-block">Block size</label><span className="text-[#DC2626]">{blockSize}px</span></div>
                <input id="retouch-block" type="range" min={4} max={120} value={blockSize} onChange={(event) => setBlockSize(Number(event.target.value))} disabled={disabled} className="w-full accent-[#DC2626]" />
              </div>
            )}

            {tool === "remove" && selectionPercent > 8 && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] leading-4 text-amber-800">This selection is large. Basic repair works best on small areas; remove big objects in several smaller steps.</p>
            )}

            {needsApplyButton && (
              <button type="button" onClick={applySelection} disabled={disabled || !hasSelection} className="flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-3 py-2.5 text-xs font-extrabold text-white hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Apply to selection
              </button>
            )}
            {needsApplyButton && hasSelection && (
              <button type="button" onClick={clearMask} disabled={disabled} className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2 text-xs font-extrabold text-[#5A4A32] disabled:opacity-50">Clear selection</button>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button type="button" title="Undo (Ctrl+Z)" disabled={historyIndex <= 0 || disabled} onClick={undo} className="flex items-center justify-center rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#5A4A32] disabled:opacity-40"><Undo2 size={16} /></button>
              <button type="button" title="Redo (Ctrl+Shift+Z)" disabled={historyIndex >= historyLength || disabled} onClick={redo} className="flex items-center justify-center rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#5A4A32] disabled:opacity-40"><Redo2 size={16} /></button>
              <button type="button" title="Undo everything" disabled={historyIndex <= 0 || disabled} onClick={resetAll} className="flex items-center justify-center rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#5A4A32] disabled:opacity-40"><RotateCcw size={16} /></button>
            </div>

            <div className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-3 text-[11px] leading-5 text-[#6B5A40]" aria-live="polite">{status}</div>
            {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700" role="alert">{error}</div>}

            <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
              <button type="button" onClick={close} disabled={busy} className="rounded-xl border border-[#D8C9A6] bg-[#FBF6E8] px-3 py-2.5 text-xs font-extrabold text-[#5A4A32] disabled:opacity-50">Cancel</button>
              <button type="button" onClick={() => void save()} disabled={disabled} className="flex items-center justify-center gap-2 rounded-xl bg-[#10B981] px-3 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">
                <Check size={14} /> Save to photo
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
