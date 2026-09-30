"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
} from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
  AlertCircle,
  Check,
  Download,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Type,
  Upload,
  X,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type WatermarkType = "text" | "image";
type Position =
  | "top-left"
  | "top-right"
  | "center"
  | "bottom-left"
  | "bottom-right";
type Phase = "idle" | "loading-engine" | "processing" | "done" | "error";

interface VideoMeta {
  width: number;
  height: number;
  duration: number;
}

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/* -------------------------------------------------------------------------- */
/*                                 Constants                                  */
/* -------------------------------------------------------------------------- */

const FFMPEG_CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
const MAX_WATERMARK_BYTES = 5 * 1024 * 1024;
/** Margin from the video edge, as a fraction of video width. Shared by preview + export. */
const MARGIN_RATIO = 0.03;
const DEFAULT_META: VideoMeta = { width: 1920, height: 1080, duration: 0 };

const POSITION_LABELS: Record<Position, string> = {
  "top-left": "Top left",
  "top-right": "Top right",
  center: "Center",
  "bottom-left": "Bottom left",
  "bottom-right": "Bottom right",
};

const POSITION_GRID_ORDER: Position[] = [
  "top-left",
  "top-right",
  "center",
  "bottom-left",
  "bottom-right",
];

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, index);
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
};

const getExtension = (name: string, fallback: string) => {
  const match = /\.([a-z0-9]{2,5})$/i.exec(name);
  return match ? match[1].toLowerCase() : fallback;
};

const baseName = (name: string) => name.replace(/\.[^/.]+$/, "") || "video";

/** Creates an object URL for a Blob/File and revokes it whenever the blob changes or on unmount. */
function useObjectUrl(blob: Blob | null): string {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!blob) {
      setUrl("");
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

/**
 * Renders text to a transparent PNG using the browser's own fonts, so FFmpeg.wasm
 * never needs a font file. The same PNG is used for the live preview.
 */
async function renderTextWatermark(text: string): Promise<Blob | null> {
  const fontSize = 120;
  const pad = 20;
  const font = `800 ${fontSize}px system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Bengali", sans-serif`;
  const lines = text.split("\n").slice(0, 3);
  const lineHeight = Math.round(fontSize * 1.25);

  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return null;
  measure.font = font;
  const textWidth = Math.ceil(
    Math.max(...lines.map((l) => measure.measureText(l).width)),
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(textWidth + pad * 2, 1);
  canvas.height = lineHeight * lines.length + pad * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  lines.forEach((line, i) => {
    ctx.fillText(line, pad, pad + lineHeight * i + lineHeight / 2);
  });

  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
}

/** Position of the watermark, expressed in FFmpeg overlay expressions. */
function overlayExpression(position: Position): { x: string; y: string } {
  const m = `main_w*${MARGIN_RATIO}`;
  const left = m;
  const right = `main_w-overlay_w-${m}`;
  const top = m;
  const bottom = `main_h-overlay_h-${m}`;
  const cx = "(main_w-overlay_w)/2";
  const cy = "(main_h-overlay_h)/2";

  switch (position) {
    case "top-left":
      return { x: left, y: top };
    case "top-right":
      return { x: right, y: top };
    case "bottom-left":
      return { x: left, y: bottom };
    case "bottom-right":
      return { x: right, y: bottom };
    default:
      return { x: cx, y: cy };
  }
}

/** Anchor styles for the CSS preview (mirrors overlayExpression). */
function previewAnchor(position: Position, margin: number): CSSProperties {
  switch (position) {
    case "top-left":
      return { left: margin, top: margin };
    case "top-right":
      return { right: margin, top: margin };
    case "bottom-left":
      return { left: margin, bottom: margin };
    case "bottom-right":
      return { right: margin, bottom: margin };
    default:
      return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  }
}

const timeToSeconds = (h: string, m: string, s: string) =>
  Number(h) * 3600 + Number(m) * 60 + Number(s);

/** Tiny video-frame icon with a filled block showing where the watermark will sit. */
function PositionIcon({ position }: { position: Position }) {
  const spot: Record<Position, string> = {
    "top-left": "left-[3px] top-[3px]",
    "top-right": "right-[3px] top-[3px]",
    center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    "bottom-left": "bottom-[3px] left-[3px]",
    "bottom-right": "bottom-[3px] right-[3px]",
  };
  return (
    <span className="relative block h-[18px] w-6 rounded-[4px] border-2 border-current">
      <span
        className={`absolute h-[5px] w-[9px] rounded-[1.5px] bg-current ${spot[position]}`}
      />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export default function AddWatermarkTool() {
  /* ----------------------------- Form state ------------------------------ */
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [watermarkType, setWatermarkType] = useState<WatermarkType>("image");
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
  const [textBlob, setTextBlob] = useState<Blob | null>(null);
  const [text, setText] = useState("SohojKaj");
  const [size, setSize] = useState(20);
  const [opacity, setOpacity] = useState(60);
  const [position, setPosition] = useState<Position>("bottom-right");

  /* ---------------------------- Processing state ------------------------- */
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Ready to process");
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);

  /* ------------------------------ Preview state -------------------------- */
  const [videoMeta, setVideoMeta] = useState<VideoMeta>(DEFAULT_META);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [draggingVideo, setDraggingVideo] = useState(false);
  const [draggingImage, setDraggingImage] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const durationRef = useRef(0);
  const cancelledRef = useRef(false);

  /* ------------------------------ Object URLs ---------------------------- */
  const videoUrl = useObjectUrl(videoFile);
  const watermarkBlob: Blob | null =
    watermarkType === "image" ? watermarkImage : textBlob;
  const watermarkUrl = useObjectUrl(watermarkBlob);
  const watermarkThumbUrl = useObjectUrl(watermarkImage);
  const outputUrl = useObjectUrl(outputBlob);

  const isBusy = phase === "loading-engine" || phase === "processing";

  /* ------------------------ Text → PNG (debounced) ----------------------- */
  useEffect(() => {
    if (watermarkType !== "text" || !text.trim()) {
      setTextBlob(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const blob = await renderTextWatermark(text);
      if (!cancelled) setTextBlob(blob);
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [text, watermarkType]);

  /* ----------------------- Track preview stage size ---------------------- */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStage({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /** The rectangle the video actually occupies inside the stage (object-contain). */
  const videoRect: Rect = useMemo(() => {
    const { width: cw, height: ch } = stage;
    if (!cw || !ch) return { left: 0, top: 0, width: 0, height: 0 };
    const scale = Math.min(cw / videoMeta.width, ch / videoMeta.height);
    const width = videoMeta.width * scale;
    const height = videoMeta.height * scale;
    return { left: (cw - width) / 2, top: (ch - height) / 2, width, height };
  }, [stage, videoMeta]);

  const hasWatermark = Boolean(watermarkUrl);

  /* ------------------------------ Cleanup -------------------------------- */
  useEffect(() => {
    return () => {
      ffmpegRef.current?.terminate();
      ffmpegRef.current = null;
    };
  }, []);

  /* ------------------------------ Handlers ------------------------------- */
  const invalidateOutput = useCallback(() => {
    setOutputBlob(null);
    setShowResult(false);
    setProgress(0);
    setPhase((p) => (p === "done" || p === "error" ? "idle" : p));
  }, []);

  const handleVideoSelect = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setPhase("error");
      setStatus("Please choose a video file (MP4, WebM, MOV).");
      return;
    }
    setVideoMeta(DEFAULT_META);
    setVideoFile(file);
    invalidateOutput();
    setPhase("idle");
    setStatus("Video ready");
  };

  const handleWatermarkImageSelect = (file?: File | null) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setPhase("error");
      setStatus("Watermark must be a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > MAX_WATERMARK_BYTES) {
      setPhase("error");
      setStatus("Watermark image is larger than 5 MB.");
      return;
    }
    setWatermarkImage(file);
    invalidateOutput();
    setPhase("idle");
    setStatus("Watermark image ready");
  };

  const onDropVideo = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDraggingVideo(false);
    handleVideoSelect(e.dataTransfer.files?.[0]);
  };

  const onDropImage = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDraggingImage(false);
    handleWatermarkImageSelect(e.dataTransfer.files?.[0]);
  };

  const reset = () => {
    ffmpegRef.current?.terminate();
    ffmpegRef.current = null;
    setVideoFile(null);
    setWatermarkImage(null);
    setTextBlob(null);
    setOutputBlob(null);
    setShowResult(false);
    setVideoMeta(DEFAULT_META);
    setText("SohojKaj");
    setSize(20);
    setOpacity(60);
    setPosition("bottom-right");
    setWatermarkType("image");
    setProgress(0);
    setPhase("idle");
    setStatus("Ready to process");
  };

  /* --------------------------- FFmpeg lifecycle -------------------------- */
  const getFFmpeg = async (): Promise<FFmpeg> => {
    if (ffmpegRef.current?.loaded) return ffmpegRef.current;

    const ffmpeg = new FFmpeg();

    ffmpeg.on("progress", ({ progress: p }) => {
      if (!Number.isFinite(p)) return;
      setProgress((prev) => Math.max(prev, Math.min(99, Math.round(p * 100))));
    });

    // The progress event can be unreliable for some containers; also parse `time=` from logs.
    ffmpeg.on("log", ({ message }) => {
      const match = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(message);
      if (match && durationRef.current > 0) {
        const pct =
          (timeToSeconds(match[1], match[2], match[3]) / durationRef.current) *
          100;
        setProgress((prev) => Math.max(prev, Math.min(99, Math.round(pct))));
      }
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(
        `${FFMPEG_CORE_BASE}/ffmpeg-core.js`,
        "text/javascript",
      ),
      wasmURL: await toBlobURL(
        `${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });

    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const cancelProcessing = () => {
    cancelledRef.current = true;
    ffmpegRef.current?.terminate();
    ffmpegRef.current = null;
    setPhase("idle");
    setProgress(0);
    setStatus("Processing cancelled");
  };

  const addWatermark = async () => {
    if (isBusy) return;
    if (!videoFile) {
      setPhase("error");
      setStatus("Add a video to continue");
      return;
    }
    if (!watermarkBlob) {
      setPhase("error");
      setStatus(
        watermarkType === "image"
          ? "Upload a watermark image to continue"
          : "Enter watermark text to continue",
      );
      return;
    }

    cancelledRef.current = false;
    durationRef.current = videoMeta.duration;
    setOutputBlob(null);
    setShowResult(false);
    setProgress(0);

    const inputName = `input.${getExtension(videoFile.name, "mp4")}`;
    const wmName = "watermark.png";
    const outputName = "output.mp4";
    let ffmpeg: FFmpeg | null = null;

    try {
      setPhase("loading-engine");
      setStatus("Loading video engine (first run downloads ~30 MB)…");
      ffmpeg = await getFFmpeg();
      if (cancelledRef.current) return;

      setPhase("processing");
      setStatus("Processing video…");

      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      await ffmpeg.writeFile(wmName, await fetchFile(watermarkBlob));

      const { x, y } = overlayExpression(position);
      const scaleRatio = (size / 100).toFixed(4);
      const alpha = (opacity / 100).toFixed(2);

      const filter = [
        // Scale watermark relative to the main video width, keeping its aspect ratio
        `[1:v][0:v]scale2ref=w=main_w*${scaleRatio}:h=ow/a[wm][base]`,
        // Apply opacity
        `[wm]format=rgba,colorchannelmixer=aa=${alpha}[wmo]`,
        // Overlay + force even dimensions and yuv420p for broad playback support
        `[base][wmo]overlay=${x}:${y}:format=auto,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p[out]`,
      ].join(";");

      const exitCode = await ffmpeg.exec([
        "-i",
        inputName,
        "-i",
        wmName,
        "-filter_complex",
        filter,
        "-map",
        "[out]",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        outputName,
      ]);

      if (cancelledRef.current) return;
      if (exitCode !== 0)
        throw new Error(`FFmpeg exited with code ${exitCode}`);

      const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
      setOutputBlob(new Blob([data as BlobPart], { type: "video/mp4" }));
      setProgress(100);
      setPhase("done");
      setShowResult(true);
      setStatus("Done — your watermarked video is ready");
    } catch (err) {
      if (cancelledRef.current) return;
      console.error(err);
      setPhase("error");
      setProgress(0);
      setStatus(
        err instanceof Error && err.message
          ? `Export failed: ${err.message}`
          : "Export failed. Try a smaller video or a different format.",
      );
      // A crashed instance is not reusable
      ffmpegRef.current?.terminate();
      ffmpegRef.current = null;
    } finally {
      // Free the wasm virtual filesystem
      if (ffmpeg && ffmpegRef.current === ffmpeg) {
        await Promise.allSettled([
          ffmpeg.deleteFile(inputName),
          ffmpeg.deleteFile(wmName),
          ffmpeg.deleteFile(outputName),
        ]);
      }
    }
  };

  const downloadOutput = () => {
    if (!outputUrl || !videoFile) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `${baseName(videoFile.name)}-watermarked.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  /* ------------------------------ Derived UI ----------------------------- */
  const margin = videoRect.width * MARGIN_RATIO;
  const dotColor =
    phase === "error"
      ? "bg-rose-500"
      : isBusy
        ? "bg-[#2563EB]"
        : "bg-[#10B981]";

  const previewingResult = showResult && Boolean(outputUrl);

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="min-h-[calc(100vh-74px)] w-full bg-[#F8FAFC] px-4 py-6 text-[#0F172A] md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-400">
              <span>Sohoz Tools</span>
              <span>/</span>
              <span>Video Tools</span>
              <span>/</span>
              <span className="font-semibold text-[#0F172A]">
                Add Watermark
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5]">
                <ImageIcon size={20} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A] md:text-[30px]">
                Add Watermark
              </h1>
              <span className="rounded-full bg-[#D1FAE5] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#047857]">
                Free
              </span>
            </div>

            <p className="mt-1 max-w-2xl text-xs font-medium leading-relaxed text-slate-500 md:text-sm">
              Add a text or logo watermark to your video — set position and
              opacity, then export as MP4. Everything runs in your browser; your
              video is never uploaded.
            </p>
          </div>
        </header>

        <section className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* ------------------------------ Sidebar ------------------------------ */}
          <aside
            className={`space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)] md:p-5 ${
              isBusy ? "pointer-events-none opacity-70" : ""
            }`}
            aria-busy={isBusy}
          >
            {/* Video file */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#0F172A]">
                  Files
                </h2>
                {videoFile && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#10B981]">
                    <Check size={12} /> ready
                  </span>
                )}
              </div>

              {videoFile ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">
                    <FileVideo size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#0F172A]">
                      {videoFile.name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {formatFileSize(videoFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoFile(null);
                      setVideoMeta(DEFAULT_META);
                      invalidateOutput();
                      setPhase("idle");
                      setStatus("Video removed");
                    }}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#0F172A]"
                    aria-label="Remove video"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDraggingVideo(true);
                  }}
                  onDragLeave={() => setDraggingVideo(false)}
                  onDrop={onDropVideo}
                  className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition ${
                    draggingVideo
                      ? "border-[#818CF8] bg-[#EEF2FF]/60"
                      : "border-slate-300 bg-white hover:border-[#818CF8] hover:bg-[#EEF2FF]/40"
                  }`}
                >
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-[#E0E7FF] group-hover:text-[#4F46E5]">
                    <Upload size={16} />
                  </div>
                  <p className="text-xs font-bold text-[#0F172A]">
                    Drop your video here
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    or click to browse an MP4 / WebM
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      handleVideoSelect(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            {/* Watermark type */}
            <div className="border-t border-slate-200 pt-4">
              <h2 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#0F172A]">
                Watermark type
              </h2>

              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                {(["text", "image"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setWatermarkType(type);
                      invalidateOutput();
                    }}
                    aria-pressed={watermarkType === type}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-extrabold transition ${
                      watermarkType === type
                        ? "bg-white text-[#0F172A] shadow-sm"
                        : "text-slate-500 hover:text-[#0F172A]"
                    }`}
                  >
                    {type === "text" ? (
                      <Type size={14} />
                    ) : (
                      <ImageIcon size={14} />
                    )}
                    {type === "text" ? "Text" : "Image"}
                  </button>
                ))}
              </div>

              {watermarkType === "image" ? (
                watermarkImage ? (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF]/60 p-3">
                    <div className="h-11 w-11 overflow-hidden rounded-lg bg-white ring-1 ring-[#C7D2FE]">
                      {watermarkThumbUrl && (
                        <img
                          src={watermarkThumbUrl}
                          alt="Watermark preview"
                          className="h-full w-full object-contain"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[#0F172A]">
                        {watermarkImage.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        PNG, JPG or WebP · {formatFileSize(watermarkImage.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setWatermarkImage(null);
                        invalidateOutput();
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-[#0F172A]"
                      aria-label="Remove watermark image"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDraggingImage(true);
                    }}
                    onDragLeave={() => setDraggingImage(false)}
                    onDrop={onDropImage}
                    className={`mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3 py-3.5 transition ${
                      draggingImage
                        ? "border-[#818CF8] bg-[#EEF2FF]/60"
                        : "border-slate-300 bg-white hover:border-[#818CF8] hover:bg-[#EEF2FF]/40"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">
                      <ImageIcon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#0F172A]">
                        Upload watermark image
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        PNG, JPG or WebP · max 5 MB
                      </p>
                    </div>
                    <Upload size={15} className="text-slate-400" />
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        handleWatermarkImageSelect(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )
              ) : (
                <div className="mt-3 space-y-2">
                  <label
                    htmlFor="watermark-text"
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Watermark text
                  </label>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-[#818CF8]">
                    <input
                      id="watermark-text"
                      value={text}
                      maxLength={60}
                      onChange={(e) => {
                        setText(e.target.value);
                        invalidateOutput();
                      }}
                      className="w-full bg-transparent text-xs font-bold text-[#0F172A] outline-none placeholder:text-slate-400"
                      placeholder="Type your watermark"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Size */}
            <div className="border-t border-slate-200 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#0F172A]">
                  Size
                </h2>
                <span className="text-[11px] font-bold text-[#4F46E5]">
                  {size}% of video width
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={45}
                value={size}
                aria-label="Watermark size"
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  invalidateOutput();
                }}
                className="h-1.5 w-full cursor-pointer accent-[#6366F1]"
              />
              <div className="mt-1 flex justify-between text-[9px] font-semibold text-slate-400">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>

            {/* Position */}
            <div className="border-t border-slate-200 pt-4">
              <div className="mb-2 flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-slate-500" />
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#0F172A]">
                  Position
                </h2>
              </div>

              <div
                role="radiogroup"
                aria-label="Watermark position"
                className="grid grid-cols-5 gap-1 rounded-xl bg-[#E2E8F0] p-1"
              >
                {POSITION_GRID_ORDER.map((item) => {
                  const active = position === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      title={POSITION_LABELS[item]}
                      aria-label={POSITION_LABELS[item]}
                      onClick={() => {
                        setPosition(item);
                        invalidateOutput();
                      }}
                      className={`flex h-11 items-center justify-center rounded-lg transition ${
                        active
                          ? "bg-white text-[#4F46E5] shadow-sm"
                          : "text-slate-500 hover:bg-white/60 hover:text-[#0F172A]"
                      }`}
                    >
                      <PositionIcon position={item} />
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">
                {POSITION_LABELS[position]}
              </p>
            </div>

            {/* Opacity */}
            <div className="border-t border-slate-200 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#0F172A]">
                  Opacity
                </h2>
                <span className="text-[11px] font-bold text-[#4F46E5]">
                  {opacity}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={opacity}
                aria-label="Watermark opacity"
                onChange={(e) => {
                  setOpacity(Number(e.target.value));
                  invalidateOutput();
                }}
                className="h-1.5 w-full cursor-pointer accent-[#6366F1]"
              />
              <div className="mt-1 flex justify-between text-[9px] font-semibold text-slate-400">
                <span>Transparent</span>
                <span>Solid</span>
              </div>
            </div>
          </aside>

          {/* ------------------------------ Preview ------------------------------ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)] md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-[#0F172A]">
                {previewingResult ? "Watermarked video" : "Video preview"}
              </h2>

              {outputUrl ? (
                <div className="inline-flex rounded-full bg-slate-100 p-0.5 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setShowResult(false)}
                    className={`rounded-full px-2.5 py-1 transition ${
                      !previewingResult
                        ? "bg-white text-[#4F46E5] shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    Live preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResult(true)}
                    className={`rounded-full px-2.5 py-1 transition ${
                      previewingResult
                        ? "bg-white text-[#4F46E5] shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    Exported
                  </button>
                </div>
              ) : (
                <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[10px] font-bold text-[#4F46E5]">
                  Preview
                </span>
              )}
            </div>

            <div className="relative overflow-hidden rounded-xl bg-[#11151b] p-2 shadow-inner">
              <div
                ref={stageRef}
                className="relative aspect-video min-h-[300px] w-full overflow-hidden rounded-lg bg-slate-950"
              >
                {previewingResult ? (
                  <video
                    key={outputUrl}
                    src={outputUrl}
                    controls
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : (
                  <>
                    {videoUrl ? (
                      <video
                        key={videoUrl}
                        src={videoUrl}
                        controls
                        playsInline
                        onLoadedMetadata={(e) => {
                          const v = e.currentTarget;
                          if (v.videoWidth && v.videoHeight) {
                            setVideoMeta({
                              width: v.videoWidth,
                              height: v.videoHeight,
                              duration: Number.isFinite(v.duration)
                                ? v.duration
                                : 0,
                            });
                          }
                        }}
                        className="absolute inset-0 h-full w-full object-contain"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.16),transparent_40%),linear-gradient(145deg,#1f2937,#0b1220)] px-6 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10 backdrop-blur">
                          <Play size={24} fill="currentColor" />
                        </div>
                        <p className="mt-4 text-sm font-extrabold text-white">
                          Your video preview will appear here
                        </p>
                        <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-slate-400">
                          Upload a video from the left panel to preview the
                          watermark position, size and opacity.
                        </p>
                      </div>
                    )}

                    {/* Live watermark overlay, clipped to the real video frame */}
                    {hasWatermark && videoRect.width > 0 && (
                      <div
                        className="pointer-events-none absolute overflow-hidden"
                        style={{
                          left: videoRect.left,
                          top: videoRect.top,
                          width: videoRect.width,
                          height: videoRect.height,
                        }}
                        aria-hidden="true"
                      >
                        <img
                          src={watermarkUrl}
                          alt=""
                          draggable={false}
                          className="absolute block h-auto max-w-none select-none"
                          style={{
                            width: `${size}%`,
                            opacity: opacity / 100,
                            ...previewAnchor(position, margin),
                          }}
                        />
                      </div>
                    )}

                    {/* Processing overlay */}
                    {isBusy && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/75 px-6 text-center backdrop-blur-sm">
                        <Loader2
                          size={28}
                          className="animate-spin text-[#A5B4FC]"
                        />
                        <p className="text-sm font-extrabold text-white">
                          {phase === "loading-engine"
                            ? "Loading video engine…"
                            : `Rendering… ${progress}%`}
                        </p>
                        <div
                          className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/15"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={
                            phase === "processing" ? progress : undefined
                          }
                        >
                          <div
                            className={`h-full rounded-full bg-[#818CF8] transition-[width] duration-300 ${
                              phase === "loading-engine"
                                ? "w-1/3 animate-pulse"
                                : ""
                            }`}
                            style={
                              phase === "processing"
                                ? { width: `${progress}%` }
                                : undefined
                            }
                          />
                        </div>
                        <button
                          type="button"
                          onClick={cancelProcessing}
                          className="pointer-events-auto mt-1 rounded-lg border border-white/20 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
              <span className="truncate pr-3">
                {videoFile?.name ?? "manualEdit.mp4"}
              </span>
              <span className="shrink-0 font-medium">
                {videoFile ? `${videoMeta.width}×${videoMeta.height} · ` : ""}
                {POSITION_LABELS[position]}
              </span>
            </div>
          </div>
        </section>

        {/* ------------------------------ Action bar ------------------------------ */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between md:px-5">
          <div className="min-w-0 flex-1" role="status" aria-live="polite">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              {phase === "error" ? (
                <AlertCircle size={14} className="shrink-0 text-rose-500" />
              ) : (
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
              )}
              <span
                className={`truncate ${phase === "error" ? "text-rose-600" : ""}`}
              >
                {status}
              </span>
              {phase === "processing" && (
                <span className="shrink-0 font-bold text-[#4F46E5]">
                  {progress}%
                </span>
              )}
            </div>

            {(phase === "processing" || phase === "loading-engine") && (
              <div className="mt-2 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full bg-[#6366F1] transition-[width] duration-300 ${
                    phase === "loading-engine" ? "w-1/3 animate-pulse" : ""
                  }`}
                  style={
                    phase === "processing"
                      ? { width: `${progress}%` }
                      : undefined
                  }
                />
              </div>
            )}
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={reset}
              disabled={isBusy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-[#0F172A] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <RotateCcw size={14} />
              Reset
            </button>

            {phase === "done" && outputUrl ? (
              <button
                type="button"
                onClick={downloadOutput}
                className="inline-flex flex-[1.2] items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-700 sm:flex-none"
              >
                <Download size={14} />
                Download MP4
              </button>
            ) : (
              <button
                type="button"
                onClick={addWatermark}
                disabled={isBusy || !videoFile || !watermarkBlob}
                className="inline-flex flex-[1.2] items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {isBusy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ImageIcon size={14} />
                )}
                {isBusy ? "Processing…" : "Add watermark"}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
