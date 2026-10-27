"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Droplets, Eye, History, Loader2, RotateCcw, Sparkles, Sun, UserCheck, X } from "lucide-react";
import type { PhotoAsset } from "./types";
import { useManualEditor } from "./EditorProvider";
import { detectHeadBoxes } from "./aiEnhancement";
import {
  DEFAULT_RELIGHT,
  DEFAULT_RESTORE,
  EnhanceCancelledError,
  deblur,
  denoise,
  relight,
  restorePhoto,
  runAutoEnhance,
  type DenoiseLevel,
  type FaceBox,
} from "./photoEnhance";
import type { Pixels } from "./photoTools";

type TabId = "auto" | "clean" | "relight" | "restore";
type FaceState = "idle" | "detecting" | "found" | "none" | "error";

type Props = { sourcePhoto: PhotoAsset; onClose: () => void; initialTab?: TabId };

const PREVIEW_MAX_SIDE = 1000;
const MAX_PIXELS = 40_000_000;

const TABS: { id: TabId; label: string; icon: typeof Sparkles; hint: string }[] = [
  { id: "auto", label: "Auto Enhance", icon: Sparkles, hint: "Analyses this photo (exposure, colour cast, contrast, noise, softness) and applies only the corrections it needs. Standard image processing, not generative AI." },
  { id: "clean", label: "Denoise & Deblur", icon: Droplets, hint: "Denoise removes grain while keeping edges. Deblur recovers mild softness with sharpening - it cannot undo heavy motion blur. Neither is an AI model." },
  { id: "relight", label: "Relight", icon: Sun, hint: "Lifts dark areas region by region and protects highlights. It is a tone correction, not a 3-D relighting model; very dark areas will also show more noise." },
  { id: "restore", label: "Old Photo", icon: History, hint: "Repairs dust and thin scratches, restores faded tones, reduces noise and recovers detail. It does not invent missing areas or add colour." },
];

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The photo could not be loaded. Please try again."));
    image.src = url;
  });
}

function getPixels(canvas: HTMLCanvasElement): Pixels {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: img.data, width: img.width, height: img.height };
}

function toCanvas(p: Pixels): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = p.width;
  canvas.height = p.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.putImageData(new ImageData(new Uint8ClampedArray(p.data), p.width, p.height), 0, 0);
  return canvas;
}

function SliderRow({ id, label, value, min = 0, max = 100, unit = "%", disabled, onChange, note }: {
  id: string; label: string; value: number; min?: number; max?: number; unit?: string; disabled?: boolean; onChange: (v: number) => void; note?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]">
        <label htmlFor={id}>{label}</label>
        <span className="text-[#DC2626]">{value}{unit}</span>
      </div>
      <input id={id} type="range" min={min} max={max} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#DC2626]" />
      {note && <p className="mt-0.5 text-[10px] leading-4 text-[#6B5A40]">{note}</p>}
    </div>
  );
}

function LevelPicker({ value, onChange, disabled, allowOff = true }: { value: number; onChange: (v: number) => void; disabled?: boolean; allowOff?: boolean }) {
  const items = [...(allowOff ? [[0, "Off"]] : []), [1, "Weak"], [2, "Medium"], [3, "Strong"]] as [number, string][];
  return (
    <div className="grid grid-cols-4 gap-1.5" role="radiogroup">
      {items.map(([v, label]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} disabled={disabled} onClick={() => onChange(v)} className={`rounded-lg border py-1.5 text-[11px] font-extrabold ${value === v ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C]" : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32]"} disabled:opacity-50`}>{label}</button>
      ))}
    </div>
  );
}

export default function PhotoEnhanceModal({ sourcePhoto, onClose, initialTab = "auto" }: Props) {
  const { applyRetouchedFile, setAiNotice, setActiveAiTool } = useManualEditor();

  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewSrcRef = useRef<{ full: Pixels; crop: Pixels; scale: number; cropX: number; cropY: number } | null>(null);
  const resultRef = useRef<Pixels | null>(null);
  const jobRef = useRef(0);
  const applyCancelRef = useRef(false);
  const facesRef = useRef<FaceBox[]>([]);
  const showOriginalRef = useRef(false);

  const [tab, setTab] = useState<TabId>(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Preparing photo…");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [previewLabel, setPreviewLabel] = useState("");
  const [faceState, setFaceState] = useState<FaceState>("idle");

  const [autoStrength, setAutoStrength] = useState(100);
  const [denoiseLevel, setDenoiseLevel] = useState(1);
  const [deblurStrength, setDeblurStrength] = useState(30);
  const [rlStrength, setRlStrength] = useState(Math.round(DEFAULT_RELIGHT.strength * 100));
  const [rlShadows, setRlShadows] = useState(Math.round(DEFAULT_RELIGHT.shadows * 100));
  const [rlProtect, setRlProtect] = useState(Math.round(DEFAULT_RELIGHT.highlightProtect * 100));
  const [rlFace, setRlFace] = useState(false);
  const [rlFaceBoost, setRlFaceBoost] = useState(Math.round(DEFAULT_RELIGHT.faceBoost * 100));
  const [rsDust, setRsDust] = useState(Math.round(DEFAULT_RESTORE.dust * 100));
  const [rsFade, setRsFade] = useState(Math.round(DEFAULT_RESTORE.fade * 100));
  const [rsDenoise, setRsDenoise] = useState<number>(DEFAULT_RESTORE.denoise);
  const [rsDetail, setRsDetail] = useState(Math.round(DEFAULT_RESTORE.detail * 100));
  const [rsProtect, setRsProtect] = useState(false);

  showOriginalRef.current = showOriginal;
  const disabled = loading || applyBusy;
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];
  const pixelLevel = tab === "clean" || tab === "restore";

  const needFaces = (tab === "relight" && rlFace) || (tab === "restore" && rsProtect);

  /** Neutral (no-op) settings mean there is nothing to apply. */
  const isNeutral = useMemo(() => {
    if (tab === "auto") return autoStrength === 0;
    if (tab === "clean") return denoiseLevel === 0 && deblurStrength === 0;
    if (tab === "relight") return rlStrength === 0 || (rlShadows === 0 && !rlFace);
    return rsDust === 0 && rsFade === 0 && rsDenoise === 0 && rsDetail === 0;
  }, [tab, autoStrength, denoiseLevel, deblurStrength, rlStrength, rlShadows, rlFace, rsDust, rsFade, rsDenoise, rsDetail]);

  /* ---------- load photo and build preview sources ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const image = await loadImage(sourcePhoto.url);
        if (cancelled) return;
        const w = image.naturalWidth;
        const h = image.naturalHeight;
        if (w * h > MAX_PIXELS) throw new Error("This photo is too large for the Enhance tools (over 40 megapixels). Please resize or crop it first.");
        const full = document.createElement("canvas");
        full.width = w;
        full.height = h;
        const ctx = full.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Canvas is not supported in this browser.");
        ctx.drawImage(image, 0, 0);
        fullCanvasRef.current = full;

        // Downscaled view for tone tools, true 100% centre crop for pixel-level tools.
        const scale = Math.min(1, PREVIEW_MAX_SIDE / Math.max(w, h));
        let scaled: Pixels;
        if (scale < 1) {
          const small = document.createElement("canvas");
          small.width = Math.max(1, Math.round(w * scale));
          small.height = Math.max(1, Math.round(h * scale));
          const sctx = small.getContext("2d", { willReadFrequently: true });
          if (!sctx) throw new Error("Canvas is not supported in this browser.");
          sctx.imageSmoothingQuality = "high";
          sctx.drawImage(full, 0, 0, small.width, small.height);
          scaled = getPixels(small);
        } else {
          scaled = getPixels(full);
        }
        const cw = Math.min(w, PREVIEW_MAX_SIDE);
        const ch = Math.min(h, PREVIEW_MAX_SIDE);
        const cropX = Math.floor((w - cw) / 2);
        const cropY = Math.floor((h - ch) / 2);
        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = cw;
        cropCanvas.height = ch;
        const cctx = cropCanvas.getContext("2d", { willReadFrequently: true });
        if (!cctx) throw new Error("Canvas is not supported in this browser.");
        cctx.drawImage(full, cropX, cropY, cw, ch, 0, 0, cw, ch);
        previewSrcRef.current = { full: scaled, crop: getPixels(cropCanvas), scale, cropX, cropY };
        setStatus("Adjust the settings. The preview updates automatically.");
        setLoading(false);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "The photo could not be prepared.");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      jobRef.current += 1;
    };
  }, [sourcePhoto.url]);

  /* ---------- face detection (optional, on demand) ---------- */
  const ensureFaces = useCallback(async () => {
    if (faceState === "found" || faceState === "none") return facesRef.current;
    const canvas = fullCanvasRef.current;
    if (!canvas) return [];
    setFaceState("detecting");
    try {
      const boxes = await detectHeadBoxes(canvas);
      facesRef.current = boxes.map((b) => ({ x: b.x, y: b.y, width: b.width, height: b.height }));
      setFaceState(boxes.length ? "found" : "none");
      return facesRef.current;
    } catch {
      facesRef.current = [];
      setFaceState("error");
      return [];
    }
  }, [faceState]);

  useEffect(() => {
    if (needFaces && faceState === "idle" && !loading) void ensureFaces();
  }, [needFaces, faceState, loading, ensureFaces]);

  /* ---------- core processing (shared by preview and apply) ---------- */
  const process = useCallback(
    async (src: Pixels, faces: FaceBox[], opts: { onProgress?: (f: number) => void; isCancelled: () => boolean }) => {
      if (tab === "auto") {
        const r = await runAutoEnhance(src, autoStrength / 100, opts);
        return { pixels: r.pixels, notes: r.notes };
      }
      if (tab === "clean") {
        let work = src;
        const steps = (denoiseLevel > 0 ? 1 : 0) + (deblurStrength > 0 ? 1 : 0);
        if (denoiseLevel > 0) {
          work = await denoise(work, denoiseLevel as DenoiseLevel, { isCancelled: opts.isCancelled, onProgress: (f) => opts.onProgress?.(f / Math.max(1, steps)) });
        }
        if (deblurStrength > 0) work = deblur(work, deblurStrength / 100);
        const out: string[] = [];
        if (denoiseLevel > 0) out.push(`Denoise: ${["", "weak", "medium", "strong"][denoiseLevel]}.`);
        if (deblurStrength > 0) out.push("Detail recovery applied (sharpening-based).");
        opts.onProgress?.(1);
        return { pixels: work, notes: out };
      }
      if (tab === "relight") {
        const face = rlFace && faces.length ? faces[0] : null;
        const pixels = relight(src, { strength: rlStrength / 100, shadows: rlShadows / 100, highlightProtect: rlProtect / 100, faceBox: face, faceBoost: rlFaceBoost / 100 });
        opts.onProgress?.(1);
        const out = ["Dark regions lifted; highlights protected."];
        if (rlFace && !faces.length) out.push("No face was found, so only the general shadow lift was applied.");
        if (face) out.push("Extra fill light added to the detected face.");
        return { pixels, notes: out };
      }
      const r = await restorePhoto(src, { dust: rsDust / 100, fade: rsFade / 100, denoise: rsDenoise as 0 | 1 | 2 | 3, detail: rsDetail / 100, protect: rsProtect ? faces : [] }, opts);
      return { pixels: r.pixels, notes: r.notes };
    },
    [tab, autoStrength, denoiseLevel, deblurStrength, rlStrength, rlShadows, rlProtect, rlFace, rlFaceBoost, rsDust, rsFade, rsDenoise, rsDetail, rsProtect],
  );

  /* ---------- live preview (debounced, cancels stale jobs) ---------- */
  useEffect(() => {
    if (loading || error || applyBusy) return;
    const base = previewSrcRef.current;
    if (!base) return;
    const jobId = ++jobRef.current;
    const handle = window.setTimeout(async () => {
      setPreviewBusy(true);
      try {
        const useCrop = pixelLevel && (base.crop.width < (fullCanvasRef.current?.width ?? 0) || base.crop.height < (fullCanvasRef.current?.height ?? 0));
        const src = pixelLevel ? base.crop : base.full;
        setPreviewLabel(useCrop ? `Preview: centre ${src.width}×${src.height}px at 100% (the whole photo is processed on Apply)` : pixelLevel ? "Preview at 100%" : base.scale < 1 ? `Preview scaled to ${Math.round(base.scale * 100)}%` : "Preview at 100%");
        let faces: FaceBox[] = [];
        if (needFaces && (faceState === "found" || faceState === "none")) {
          faces = facesRef.current.map((b) =>
            pixelLevel
              ? { x: b.x - base.cropX, y: b.y - base.cropY, width: b.width, height: b.height }
              : { x: b.x * base.scale, y: b.y * base.scale, width: b.width * base.scale, height: b.height * base.scale },
          );
        }
        const { pixels, notes: out } = await process(src, faces, { isCancelled: () => jobId !== jobRef.current });
        if (jobId !== jobRef.current) return;
        resultRef.current = pixels;
        setNotes(out);
        const canvas = previewCanvasRef.current;
        if (canvas) {
          canvas.width = pixels.width;
          canvas.height = pixels.height;
          const ctx = canvas.getContext("2d");
          ctx?.putImageData(new ImageData(new Uint8ClampedArray((showOriginalRef.current ? src : pixels).data), pixels.width, pixels.height), 0, 0);
        }
        setError("");
      } catch (cause) {
        if (cause instanceof EnhanceCancelledError || jobId !== jobRef.current) return;
        setError(cause instanceof Error ? cause.message : "The preview could not be created.");
      } finally {
        if (jobId === jobRef.current) setPreviewBusy(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
    // showOriginal is read through a ref and redrawn by the compare effect below,
    // so toggling it never re-runs processing.
  }, [loading, applyBusy, process, pixelLevel, needFaces, faceState]);

  /* ---------- Compare toggle: just redraws, no reprocessing ---------- */
  useEffect(() => {
    const base = previewSrcRef.current;
    const canvas = previewCanvasRef.current;
    const result = resultRef.current;
    if (!base || !canvas || !result) return;
    const src = pixelLevel ? base.crop : base.full;
    if (src.width !== result.width || src.height !== result.height) return;
    const ctx = canvas.getContext("2d");
    ctx?.putImageData(new ImageData(new Uint8ClampedArray((showOriginal ? src : result).data), result.width, result.height), 0, 0);
  }, [showOriginal, pixelLevel]);

  /* ---------- reset / close / apply ---------- */
  const resetTab = () => {
    if (tab === "auto") setAutoStrength(100);
    if (tab === "clean") { setDenoiseLevel(1); setDeblurStrength(30); }
    if (tab === "relight") {
      setRlStrength(Math.round(DEFAULT_RELIGHT.strength * 100));
      setRlShadows(Math.round(DEFAULT_RELIGHT.shadows * 100));
      setRlProtect(Math.round(DEFAULT_RELIGHT.highlightProtect * 100));
      setRlFace(false);
      setRlFaceBoost(Math.round(DEFAULT_RELIGHT.faceBoost * 100));
    }
    if (tab === "restore") {
      setRsDust(Math.round(DEFAULT_RESTORE.dust * 100));
      setRsFade(Math.round(DEFAULT_RESTORE.fade * 100));
      setRsDenoise(DEFAULT_RESTORE.denoise);
      setRsDetail(Math.round(DEFAULT_RESTORE.detail * 100));
      setRsProtect(false);
    }
    setShowOriginal(false);
  };

  const close = useCallback(() => {
    if (applyBusy) {
      applyCancelRef.current = true;
      return;
    }
    jobRef.current += 1;
    setActiveAiTool(null);
    onClose();
  }, [applyBusy, onClose, setActiveAiTool]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const apply = async () => {
    const full = fullCanvasRef.current;
    if (!full || disabled || isNeutral) return;
    jobRef.current += 1; // stop any running preview
    applyCancelRef.current = false;
    setApplyBusy(true);
    setPreviewBusy(false);
    setError("");
    setProgress(0);
    setStatus("Processing the full photo…");
    try {
      const faces = needFaces ? await ensureFaces() : [];
      // Always start from the untouched source pixels, never from the preview.
      const src = getPixels(full);
      const { pixels, notes: out } = await process(src, faces, { onProgress: setProgress, isCancelled: () => applyCancelRef.current });
      const canvas = toCanvas(pixels);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((v) => (v ? resolve(v) : reject(new Error("The edited photo could not be created."))), "image/png"));
      const base = sourcePhoto.file.name.replace(/\.[^/.]+$/, "");
      const suffix = { auto: "enhanced", clean: "cleaned", relight: "relit", restore: "restored" }[tab];
      await applyRetouchedFile(new File([blob], `${base}-${suffix}.png`, { type: "image/png" }), sourcePhoto.file);
      setAiNotice(`${activeTab.label} applied. ${out[0] ?? ""}`.trim());
      onClose();
    } catch (cause) {
      if (cause instanceof EnhanceCancelledError) {
        setStatus("Cancelled. Your photo was not changed.");
      } else {
        setError(cause instanceof Error ? cause.message : "The edit could not be applied. Your photo was not changed.");
      }
      setApplyBusy(false);
    }
  };

  const faceHelp =
    faceState === "detecting" ? "Finding the face… (a small model downloads the first time)"
    : faceState === "found" ? "Face found."
    : faceState === "none" ? "No face found in this photo."
    : faceState === "error" ? "Face detection is unavailable right now (model could not load or another AI task is running)."
    : "";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-2 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="enhance-title">
      <div className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[#E3D6B8] bg-[#F2E8D2] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-[#E3D6B8] px-4 py-3 sm:px-5">
          <div>
            <h2 id="enhance-title" className="text-base font-extrabold text-[#3B2F1E] sm:text-lg">Enhance &amp; Restore</h2>
            <p className="mt-0.5 text-xs text-[#6B5A40]">Runs entirely in your browser. Your original upload is never overwritten until you press Apply.</p>
          </div>
          <button type="button" onClick={close} className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#3B2F1E] hover:bg-[#EFE3C8]" aria-label="Close"><X size={18} /></button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex min-h-[260px] flex-col gap-2 p-3 sm:p-4">
            <div className="relative flex h-[46vh] items-center justify-center overflow-auto rounded-xl border border-[#D8C9A6] bg-[#EFE5CE] md:h-[58vh]" style={{ backgroundImage: "linear-gradient(45deg,#e7e0d2 25%,transparent 25%),linear-gradient(-45deg,#e7e0d2 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e7e0d2 75%),linear-gradient(-45deg,transparent 75%,#e7e0d2 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0,0 10px,10px -10px,-10px 0" }}>
              <canvas ref={previewCanvasRef} className={`max-h-full max-w-full object-contain ${loading ? "invisible" : "visible"}`} aria-label={showOriginal ? "Original photo" : "Edited preview"} />
              {(loading || previewBusy) && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/30"><Loader2 className="h-8 w-8 animate-spin text-[#DC2626]" /></div>
              )}
              <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">{showOriginal ? "Original" : "Edited"}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6B5A40]">
              <span>{previewLabel}</span>
              <button type="button" aria-pressed={showOriginal} disabled={loading || applyBusy} onClick={() => setShowOriginal((v) => !v)} className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-extrabold ${showOriginal ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C]" : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32]"} disabled:opacity-50`}>
                <Eye size={13} /> {showOriginal ? "Showing original" : "Compare with original"}
              </button>
            </div>
          </div>

          <aside className="flex flex-col gap-3 border-t border-[#E3D6B8] bg-[#F2E8D2] p-4 md:border-l md:border-t-0">
            <div className="grid grid-cols-2 gap-2" role="tablist">
              {TABS.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button key={item.id} type="button" role="tab" aria-selected={active} disabled={applyBusy} onClick={() => { setTab(item.id); setShowOriginal(false); setNotes([]); }} className={`flex items-center justify-center gap-1.5 rounded-xl border px-1 py-2 text-[11px] font-extrabold leading-tight ${active ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C]" : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32]"} disabled:opacity-50`}>
                    <Icon size={14} />{item.label}
                  </button>
                );
              })}
            </div>
            <p className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[11px] leading-5 text-[#6B5A40]">{activeTab.hint}</p>

            {tab === "auto" && (
              <SliderRow id="en-auto" label="Strength" value={autoStrength} disabled={disabled} onChange={setAutoStrength} note="100% = full automatic correction. Lower it for a subtler look." />
            )}

            {tab === "clean" && (
              <>
                <div>
                  <div className="mb-1 text-xs font-bold text-[#5A4A32]">Denoise</div>
                  <LevelPicker value={denoiseLevel} onChange={setDenoiseLevel} disabled={disabled} />
                </div>
                <SliderRow id="en-deblur" label="Deblur (detail recovery)" value={deblurStrength} disabled={disabled} onChange={setDeblurStrength} note="0% = off. High values can create halos or exaggerate noise." />
              </>
            )}

            {tab === "relight" && (
              <>
                <SliderRow id="en-rl-s" label="Overall strength" value={rlStrength} disabled={disabled} onChange={setRlStrength} />
                <SliderRow id="en-rl-sh" label="Shadow lift" value={rlShadows} disabled={disabled} onChange={setRlShadows} />
                <SliderRow id="en-rl-hp" label="Highlight protection" value={rlProtect} disabled={disabled} onChange={setRlProtect} />
                <label className="flex items-start gap-2 text-xs font-bold text-[#5A4A32]">
                  <input type="checkbox" checked={rlFace} disabled={disabled} onChange={(e) => setRlFace(e.target.checked)} className="mt-0.5 accent-[#DC2626]" />
                  <span className="flex items-center gap-1"><UserCheck size={13} /> Add fill light to the face</span>
                </label>
                {rlFace && <SliderRow id="en-rl-fb" label="Face fill" value={rlFaceBoost} disabled={disabled} onChange={setRlFaceBoost} />}
              </>
            )}

            {tab === "restore" && (
              <>
                <SliderRow id="en-rs-d" label="Dust & scratch repair" value={rsDust} disabled={disabled} onChange={setRsDust} note="Fixes specks and hairline scratches. Wide scratches and tears need the Retouch tool." />
                <SliderRow id="en-rs-f" label="Fade restoration" value={rsFade} disabled={disabled} onChange={setRsFade} />
                <div>
                  <div className="mb-1 text-xs font-bold text-[#5A4A32]">Noise reduction</div>
                  <LevelPicker value={rsDenoise} onChange={setRsDenoise} disabled={disabled} />
                </div>
                <SliderRow id="en-rs-dt" label="Detail recovery" value={rsDetail} disabled={disabled} onChange={setRsDetail} />
                <label className="flex items-start gap-2 text-xs font-bold text-[#5A4A32]">
                  <input type="checkbox" checked={rsProtect} disabled={disabled} onChange={(e) => setRsProtect(e.target.checked)} className="mt-0.5 accent-[#DC2626]" />
                  <span>Protect faces from dust repair (keeps eyes, lashes and hair untouched)</span>
                </label>
              </>
            )}

            {needFaces && faceHelp && <p className="text-[10px] leading-4 text-[#6B5A40]" aria-live="polite">{faceHelp}</p>}

            {notes.length > 0 && !error && (
              <ul className="list-disc rounded-xl border border-emerald-100 bg-emerald-50 py-2 pl-6 pr-2 text-[11px] leading-5 text-emerald-800" aria-live="polite">
                {notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            )}
            <div className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-2.5 text-[11px] leading-5 text-[#6B5A40]" aria-live="polite">{applyBusy ? `${status} ${Math.round(progress * 100)}%` : status}</div>
            {applyBusy && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E3D6B8]" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-[#DC2626] transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            )}
            {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700" role="alert">{error}</div>}

            <div className="mt-auto grid grid-cols-3 gap-2 pt-1">
              <button type="button" onClick={resetTab} disabled={disabled} title="Reset these settings" className="flex items-center justify-center gap-1 rounded-xl border border-[#D8C9A6] bg-[#FBF6E8] px-2 py-2.5 text-xs font-extrabold text-[#5A4A32] disabled:opacity-50"><RotateCcw size={13} /> Reset</button>
              <button type="button" onClick={close} className="rounded-xl border border-[#D8C9A6] bg-[#FBF6E8] px-2 py-2.5 text-xs font-extrabold text-[#5A4A32]">{applyBusy ? "Stop" : "Cancel"}</button>
              <button type="button" onClick={() => void apply()} disabled={disabled || isNeutral || Boolean(error && !previewSrcRef.current)} className="flex items-center justify-center gap-1.5 rounded-xl bg-[#10B981] px-2 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">
                {applyBusy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Apply
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
