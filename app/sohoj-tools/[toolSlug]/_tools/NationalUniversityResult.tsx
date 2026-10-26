"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import React, { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { AlertCircle, Check, Download, FileVideo, Image as ImageIcon, Loader2, Play, RotateCcw, SlidersHorizontal, Type, Upload, X, } from "lucide-react";
/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */
type WatermarkType = "text" | "image";
type Position = "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right";
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

const POSITION_LABELS_BN: Record<Position, string> = {
    "top-left": "উপরের বামদিকে",
    "top-right": "উপরের ডানদিকে",
    center: "মাঝখানে",
    "bottom-left": "নিচের বামদিকে",
    "bottom-right": "নিচের ডানদিকে",
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
    if (!bytes)
        return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
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
    if (!measure)
        return null;
    measure.font = font;
    const textWidth = Math.ceil(Math.max(...lines.map((l) => measure.measureText(l).width)));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(textWidth + pad * 2, 1);
    canvas.height = lineHeight * lines.length + pad * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx)
        return null;
    ctx.font = font;
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    lines.forEach((line, i) => {
        ctx.fillText(line, pad, pad + lineHeight * i + lineHeight / 2);
    });
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}
/** Position of the watermark, expressed in FFmpeg overlay expressions. */
function overlayExpression(position: Position): {
    x: string;
    y: string;
} {
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
const timeToSeconds = (h: string, m: string, s: string) => Number(h) * 3600 + Number(m) * 60 + Number(s);
/** Tiny video-frame icon with a filled block showing where the watermark will sit. */
function PositionIcon({ position }: {
    position: Position;
}) {
    const spot: Record<Position, string> = {
        "top-left": "left-[3px] top-[3px]",
        "top-right": "right-[3px] top-[3px]",
        center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        "bottom-left": "bottom-[3px] left-[3px]",
        "bottom-right": "bottom-[3px] right-[3px]",
    };
    return (<span className="relative block h-[18px] w-6 rounded-[4px] border-2 border-current">
      <span className={`absolute h-[5px] w-[9px] rounded-[1.5px] bg-current ${spot[position]}`}/>
    </span>);
}
/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */
const PAGE_BN: Record<string, string> = {
    "Studio Seba": "স্টুডিও সেবা",
    "Video Tools": "ভিডিও টুলস",
    "Add Watermark": "ওয়াটারমার্ক যোগ করুন",
    "Free": "বিনামূল্যে",
    "Add a text or logo watermark to your video — set position and opacity, then export as MP4. Everything runs in your browser; your video is never uploaded.": "আপনার ভিডিওতে লেখা বা লোগোর ওয়াটারমার্ক যোগ করুন—এর অবস্থান ও স্বচ্ছতা নির্ধারণ করে MP4 হিসেবে রপ্তানি করুন। সবকিছু আপনার ব্রাউজারেই সম্পন্ন হয়; আপনার ভিডিও কোথাও আপলোড করা হয় না।",
    "Files": "ফাইলসমূহ",
    "ready": "প্রস্তুত",
    "Drop your video here": "আপনার ভিডিও এখানে টেনে এনে ছেড়ে দিন",
    "or click to browse an MP4 / WebM": "অথবা MP4 / WebM ফাইল বাছাই করতে ক্লিক করুন",
    "Watermark type": "ওয়াটারমার্কের ধরন",
    "Text": "লেখা",
    "Image": "ছবি",
    "PNG, JPG or WebP · ": "PNG, JPG বা WebP · ",
    "Upload watermark image": "ওয়াটারমার্কের ছবি আপলোড করুন",
    "PNG, JPG or WebP · max 5 MB": "PNG, JPG বা WebP · সর্বোচ্চ ৫ MB",
    "Watermark text": "ওয়াটারমার্কের লেখা",
    "Type your watermark": "ওয়াটারমার্কের লেখা লিখুন",
    "Size": "আকার",
    "% of video width": "% ভিডিওর প্রস্থ",
    "Small": "ছোট",
    "Large": "বড়",
    "Position": "অবস্থান",
    "Opacity": "স্বচ্ছতা",
    "Transparent": "স্বচ্ছ",
    "Solid": "অস্বচ্ছ",
    "Watermarked video": "ওয়াটারমার্কযুক্ত ভিডিও",
    "Video preview": "ভিডিওর পূর্বরূপ",
    "Live preview": "সরাসরি পূর্বরূপ",
    "Exported": "রপ্তানি করা",
    "Preview": "পূর্বরূপ",
    "Your video preview will appear here": "আপনার ভিডিওর পূর্বরূপ এখানে দেখা যাবে",
    "Upload a video from the left panel to preview the watermark position, size and opacity.": "ওয়াটারমার্কের অবস্থান, আকার ও স্বচ্ছতা দেখতে বাম পাশের অংশ থেকে একটি ভিডিও আপলোড করুন।",
    "Loading video engine…": "ভিডিও প্রক্রিয়াকরণ ব্যবস্থা লোড হচ্ছে…",
    "Cancel": "বাতিল",
    "Reset": "পুনরায় সেট করুন",
    "Download MP4": "MP4 ডাউনলোড করুন",
    "Processing…": "প্রক্রিয়াকরণ চলছে…",
    "Add watermark": "ওয়াটারমার্ক যোগ করুন",
    "Remove video": "ভিডিও সরান",
    "Watermark preview": "ওয়াটারমার্কের পূর্বরূপ",
    "Remove watermark image": "ওয়াটারমার্কের ছবি সরান",
    "Watermark size": "ওয়াটারমার্কের আকার",
    "Watermark position": "ওয়াটারমার্কের অবস্থান",
    "Watermark opacity": "ওয়াটারমার্কের স্বচ্ছতা",
    "manualEdit.mp4": "manualEdit.mp4",
};

const PAGE_STATUS_BN: Record<string, string> = {
    "Ready to process": "প্রক্রিয়া শুরু করার জন্য প্রস্তুত",
    "Please choose a video file (MP4, WebM, MOV).": "একটি ভিডিও ফাইল নির্বাচন করুন (MP4, WebM, MOV)।",
    "Video ready": "ভিডিও প্রস্তুত",
    "Watermark must be a PNG, JPG or WebP image.": "ওয়াটারমার্কের ছবি PNG, JPG বা WebP হতে হবে।",
    "Watermark image is larger than 5 MB.": "ওয়াটারমার্কের ছবির আকার ৫ MB-এর বেশি।",
    "Watermark image ready": "ওয়াটারমার্কের ছবি প্রস্তুত",
    "Video removed": "ভিডিও সরিয়ে দেওয়া হয়েছে",
    "Processing cancelled": "প্রক্রিয়া বাতিল করা হয়েছে",
    "Add a video to continue": "চালিয়ে যেতে একটি ভিডিও যোগ করুন",
    "Upload a watermark image to continue": "চালিয়ে যেতে ওয়াটারমার্কের ছবি আপলোড করুন",
    "Enter watermark text to continue": "চালিয়ে যেতে ওয়াটারমার্কের লেখা লিখুন",
    "Loading video engine (first run downloads ~30 MB)…": "ভিডিও প্রক্রিয়াকরণ ব্যবস্থা লোড হচ্ছে (প্রথমবার প্রায় ৩০ MB ডাউনলোড হবে)…",
    "Processing video…": "ভিডিও প্রক্রিয়াকরণ চলছে…",
    "Done — your watermarked video is ready": "সম্পন্ন—আপনার ওয়াটারমার্কযুক্ত ভিডিও প্রস্তুত।",
};

function localizeStatus(status: string, locale: "en" | "bn", t: (value: unknown) => string): string {
    if (locale === "en") return status;
    if (PAGE_STATUS_BN[status]) return PAGE_STATUS_BN[status];
    if (status.startsWith("Export failed: ")) {
        return `রপ্তানি ব্যর্থ হয়েছে: ${status.slice("Export failed: ".length)}`;
    }
    return t(status);
}

export default function AddWatermarkTool() {
    const { locale, t } = useI18n();
    const L = useCallback((text: string) => {
        if (locale === "en") return text;
        return PAGE_BN[text] ?? t(text);
    }, [locale, t]);
    const positionLabel = useCallback((position: Position) => {
        return locale === "bn" ? POSITION_LABELS_BN[position] : POSITION_LABELS[position];
    }, [locale]);

    /* ----------------------------- Form state ------------------------------ */
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [watermarkType, setWatermarkType] = useState<WatermarkType>("image");
    const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
    const [textBlob, setTextBlob] = useState<Blob | null>(null);
    const [text, setText] = useState("Studio Seba");
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
    const watermarkBlob: Blob | null = watermarkType === "image" ? watermarkImage : textBlob;
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
            if (!cancelled)
                setTextBlob(blob);
        }, 150);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [text, watermarkType]);
    /* ----------------------- Track preview stage size ---------------------- */
    useEffect(() => {
        const el = stageRef.current;
        if (!el)
            return;
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
        if (!cw || !ch)
            return { left: 0, top: 0, width: 0, height: 0 };
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
        if (!file)
            return;
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
        if (!file)
            return;
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
        setText("Studio Seba");
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
        if (ffmpegRef.current?.loaded)
            return ffmpegRef.current;
        const ffmpeg = new FFmpeg();
        ffmpeg.on("progress", ({ progress: p }) => {
            if (!Number.isFinite(p))
                return;
            setProgress((prev) => Math.max(prev, Math.min(99, Math.round(p * 100))));
        });
        // The progress event can be unreliable for some containers; also parse `time=` from logs.
        ffmpeg.on("log", ({ message }) => {
            const match = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(message);
            if (match && durationRef.current > 0) {
                const pct = (timeToSeconds(match[1], match[2], match[3]) / durationRef.current) *
                    100;
                setProgress((prev) => Math.max(prev, Math.min(99, Math.round(pct))));
            }
        });
        await ffmpeg.load({
            coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
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
        if (isBusy)
            return;
        if (!videoFile) {
            setPhase("error");
            setStatus("Add a video to continue");
            return;
        }
        if (!watermarkBlob) {
            setPhase("error");
            setStatus(watermarkType === "image"
                ? "Upload a watermark image to continue"
                : "Enter watermark text to continue");
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
            if (cancelledRef.current)
                return;
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
            if (cancelledRef.current)
                return;
            if (exitCode !== 0)
                throw new Error(`FFmpeg exited with code ${exitCode}`);
            const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
            setOutputBlob(new Blob([data as BlobPart], { type: "video/mp4" }));
            setProgress(100);
            setPhase("done");
            setShowResult(true);
            setStatus("Done — your watermarked video is ready");
        }
        catch (err) {
            if (cancelledRef.current)
                return;
            console.error(err);
            setPhase("error");
            setProgress(0);
            setStatus(err instanceof Error && err.message
                ? `Export failed: ${err.message}`
                : "Export failed. Try a smaller video or a different format.");
            // A crashed instance is not reusable
            ffmpegRef.current?.terminate();
            ffmpegRef.current = null;
        }
        finally {
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
        if (!outputUrl || !videoFile)
            return;
        const a = document.createElement("a");
        a.href = outputUrl;
        a.download = `${baseName(videoFile.name)}-watermarked.mp4`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };
    /* ------------------------------ Derived UI ----------------------------- */
    const margin = videoRect.width * MARGIN_RATIO;
    const dotColor = phase === "error"
        ? "bg-rose-500"
        : isBusy
            ? "bg-[#D42020]"
            : "bg-[#10B981]";
    const previewingResult = showResult && Boolean(outputUrl);
    /* -------------------------------------------------------------------------- */
    /*                                   Render                                   */
    /* -------------------------------------------------------------------------- */
    return (<div id="add-watermark-tool" className="isolate relative min-h-screen w-full bg-transparent px-4 py-6 text-[#3B2F1E] md:px-8 md:py-8">
      {/* Pointer cursor on every clickable element of this tool */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        #add-watermark-tool {
          isolation: isolate;
          position: relative;
          min-height: 100vh;
          color: #3B2F1E;
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        #add-watermark-tool::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: linear-gradient(180deg, #E9DDC3 0%, #EFE5CE 100%);
        }
        #add-watermark-tool, #add-watermark-tool *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
        }
        #add-watermark-tool h1, #add-watermark-tool h2, #add-watermark-tool h3, #add-watermark-tool h4 {
          letter-spacing: -0.01em;
        }
        #add-watermark-tool button {
          transition-duration: 180ms;
        }
        #add-watermark-tool button:active:not(:disabled) {
          transform: scale(0.98);
        }
        #add-watermark-tool :focus-visible {
          outline: 2px solid #DC2626;
          outline-offset: 2px;
        }
        #add-watermark-tool input:not([type="range"]):not([type="file"]),
        #add-watermark-tool textarea,
        #add-watermark-tool select {
          color: #3B2F1E;
        }
        #add-watermark-tool input::placeholder,
        #add-watermark-tool textarea::placeholder {
          color: #B0A080;
          opacity: 1;
        }
        #add-watermark-tool .warm-scroll {
          scrollbar-width: thin;
          scrollbar-color: #F87171 transparent;
        }
        #add-watermark-tool .warm-scroll::-webkit-scrollbar { width: 12px; }
        #add-watermark-tool .warm-scroll::-webkit-scrollbar-track {
          background: rgba(148, 113, 67, 0.12);
          border-radius: 999px;
          margin: 10px 0;
        }
        #add-watermark-tool .warm-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #F87171, #DC2626);
          border-radius: 999px;
          border: 3px solid #F2E8D2;
          min-height: 48px;
        }
        #add-watermark-tool .warm-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #EF4444, #B91C1C);
        }

        :where(#add-watermark-tool) a[href],
        :where(#add-watermark-tool) button:not(:disabled),
        :where(#add-watermark-tool) label:has(input[type="file"]),
        :where(#add-watermark-tool) summary,
        :where(#add-watermark-tool) select,
        :where(#add-watermark-tool) input[type="color"],
        :where(#add-watermark-tool) input[type="range"],
        :where(#add-watermark-tool) input[type="checkbox"],
        :where(#add-watermark-tool) input[type="radio"],
        :where(#add-watermark-tool) input[type="file"] {
          cursor: pointer;
        }

        :where(#add-watermark-tool) button:disabled {
          cursor: not-allowed;
        }
      `}</style>

      <div className="mx-auto w-full max-w-6xl space-y-5">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-[#7A6A50]">
              <span>{L("Studio Seba")}</span>
              <span>{L("/")}</span>
              <span>{L("Video Tools")}</span>
              <span>{L("/")}</span>
              <span className="font-semibold text-[#3B2F1E]">{L("Add Watermark")}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#FBB6B6] bg-[#F6D9A8] text-[#DC2626]">
                <ImageIcon size={20}/>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#3B2F1E] md:text-[30px]">{L("Add Watermark")}</h1>
              <span className="rounded-full bg-[#D1FAE5] px-2.5 py-1 text-[12px] font-extrabold uppercase tracking-wide text-[#047857]">{L("Free")}</span>
            </div>

            <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-[#6B5A40] md:text-base">{L("Add a text or logo watermark to your video — set position and opacity, then export as MP4. Everything runs in your browser; your video is never uploaded.")}</p>
          </div>
        </header>

        <section className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* ------------------------------ Sidebar ------------------------------ */}
          <aside className={`space-y-4 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-[0_8px_28px_rgba(59,47,30,0.08)] md:p-5 ${isBusy ? "pointer-events-none opacity-70" : ""}`} aria-busy={isBusy}>
            {/* Video file */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#3B2F1E]">{L("Files")}</h2>
                {videoFile && (<span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#10B981]">
                    <Check size={12}/>{L("ready")}</span>)}
              </div>

              {videoFile ? (<div className="flex items-center gap-3 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F6D9A8] text-[#DC2626]">
                    <FileVideo size={18}/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#3B2F1E]">
                      {videoFile.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[#7A6A50]">
                      {formatFileSize(videoFile.size)}
                    </p>
                  </div>
                  <button type="button" onClick={() => {
                setVideoFile(null);
                setVideoMeta(DEFAULT_META);
                invalidateOutput();
                setPhase("idle");
                setStatus("Video removed");
            }} className="rounded-lg p-1.5 text-[#7A6A50] transition hover:bg-[#EFE3C8] hover:text-[#3B2F1E]" aria-label={L("Remove video")}>
                    <X size={15}/>
                  </button>
                </div>) : (<label onDragOver={(e) => {
                e.preventDefault();
                setDraggingVideo(true);
            }} onDragLeave={() => setDraggingVideo(false)} onDrop={onDropVideo} className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition ${draggingVideo
                ? "border-[#DC2626] bg-[#F6D9A8]"
                : "border-[#D8C9A6] bg-[#FBF6E8] hover:border-[#DC2626] hover:bg-[#EFE3C8]"}`}>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3E9D2] text-[#6B5A40] transition group-hover:bg-[#F6D9A8] group-hover:text-[#DC2626]">
                    <Upload size={16}/>
                  </div>
                  <p className="text-sm font-bold text-[#3B2F1E]">{L("Drop your video here")}</p>
                  <p className="mt-1 text-[12px] text-[#7A6A50]">{L("or click to browse an MP4 / WebM")}</p>
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => {
                handleVideoSelect(e.target.files?.[0]);
                e.target.value = "";
            }}/>
                </label>)}
            </div>

            {/* Watermark type */}
            <div className="border-t border-[#E3D6B8] pt-4">
              <h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#3B2F1E]">{L("Watermark type")}</h2>

              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F3E9D2] p-1">
                {(["text", "image"] as const).map((type) => (<button key={type} type="button" onClick={() => {
                setWatermarkType(type);
                invalidateOutput();
            }} aria-pressed={watermarkType === type} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-extrabold transition ${watermarkType === type
                ? "bg-[#FBF6E8] text-[#3B2F1E] shadow-sm"
                : "text-[#6B5A40] hover:text-[#3B2F1E]"}`}>
                    {type === "text" ? (<Type size={14}/>) : (<ImageIcon size={14}/>)}
                    {type === "text" ? L("Text") : L("Image")}
                  </button>))}
              </div>

              {watermarkType === "image" ? (watermarkImage ? (<div className="mt-3 flex items-center gap-3 rounded-xl border border-[#FBB6B6] bg-[#F6D9A8] p-3">
                    <div className="h-11 w-11 overflow-hidden rounded-lg bg-[#FBF6E8] ring-1 ring-[#DC2626]/40">
                      {watermarkThumbUrl && (<img src={watermarkThumbUrl} alt={L("Watermark preview")} className="h-full w-full object-contain"/>)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#3B2F1E]">
                        {watermarkImage.name}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#7A6A50]">{L("PNG, JPG or WebP · ")}{formatFileSize(watermarkImage.size)}
                      </p>
                    </div>
                    <button type="button" onClick={() => {
                setWatermarkImage(null);
                invalidateOutput();
            }} className="rounded-lg p-1.5 text-[#7A6A50] hover:bg-[#FBF6E8] hover:text-[#3B2F1E]" aria-label={L("Remove watermark image")}>
                      <X size={15}/>
                    </button>
                  </div>) : (<label onDragOver={(e) => {
                e.preventDefault();
                setDraggingImage(true);
            }} onDragLeave={() => setDraggingImage(false)} onDrop={onDropImage} className={`mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3 py-3.5 transition ${draggingImage
                ? "border-[#DC2626] bg-[#F6D9A8]"
                : "border-[#D8C9A6] bg-[#FBF6E8] hover:border-[#DC2626] hover:bg-[#EFE3C8]"}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F6D9A8] text-[#DC2626]">
                      <ImageIcon size={16}/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#3B2F1E]">{L("Upload watermark image")}</p>
                      <p className="mt-0.5 text-[12px] text-[#7A6A50]">{L("PNG, JPG or WebP · max 5 MB")}</p>
                    </div>
                    <Upload size={15} className="text-[#7A6A50]"/>
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => {
                handleWatermarkImageSelect(e.target.files?.[0]);
                e.target.value = "";
            }}/>
                  </label>)) : (<div className="mt-3 space-y-2">
                  <label htmlFor="watermark-text" className="text-[12px] font-bold uppercase tracking-wider text-[#6B5A40]">{L("Watermark text")}</label>
                  <div className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2.5 focus-within:border-[#DC2626]">
                    <input id="watermark-text" value={text} maxLength={60} onChange={(e) => {
                setText(e.target.value);
                invalidateOutput();
            }} className="w-full bg-transparent text-sm font-bold text-[#3B2F1E] outline-none placeholder:text-[#7A6A50]" placeholder={L("Type your watermark")}/>
                  </div>
                </div>)}
            </div>

            {/* Size */}
            <div className="border-t border-[#E3D6B8] pt-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#3B2F1E]">{L("Size")}</h2>
                <span className="text-[13px] font-bold text-[#DC2626]">
                  {locale === "bn" ? `ভিডিওর প্রস্থের ${size}%` : `${size}% of video width`}</span>
              </div>
              <input type="range" min={8} max={45} value={size} aria-label={L("Watermark size")} onChange={(e) => {
            setSize(Number(e.target.value));
            invalidateOutput();
        }} className="h-1.5 w-full cursor-pointer accent-[#DC2626]"/>
              <div className="mt-1 flex justify-between text-[12px] font-semibold text-[#7A6A50]">
                <span>{L("Small")}</span>
                <span>{L("Large")}</span>
              </div>
            </div>

            {/* Position */}
            <div className="border-t border-[#E3D6B8] pt-4">
              <div className="mb-2 flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-[#6B5A40]"/>
                <h2 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#3B2F1E]">{L("Position")}</h2>
              </div>

              <div role="radiogroup" aria-label={L("Watermark position")} className="grid grid-cols-5 gap-1 rounded-xl bg-[#F3E9D2] p-1">
                {POSITION_GRID_ORDER.map((item) => {
            const active = position === item;
            return (<button key={item} type="button" role="radio" aria-checked={active} title={positionLabel(item)} aria-label={positionLabel(item)} onClick={() => {
                    setPosition(item);
                    invalidateOutput();
                }} className={`flex h-11 items-center justify-center rounded-lg transition ${active
                    ? "bg-[#FBF6E8] text-[#DC2626] shadow-sm"
                    : "text-[#6B5A40] hover:bg-white/60 hover:text-[#3B2F1E]"}`}>
                      <PositionIcon position={item}/>
                    </button>);
        })}
              </div>
              <p className="mt-2 text-center text-[12px] font-semibold text-[#7A6A50]">
                {positionLabel(position)}
              </p>
            </div>

            {/* Opacity */}
            <div className="border-t border-[#E3D6B8] pt-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#3B2F1E]">{L("Opacity")}</h2>
                <span className="text-[13px] font-bold text-[#DC2626]">
                  {opacity}{"%"}</span>
              </div>
              <input type="range" min={10} max={100} value={opacity} aria-label={L("Watermark opacity")} onChange={(e) => {
            setOpacity(Number(e.target.value));
            invalidateOutput();
        }} className="h-1.5 w-full cursor-pointer accent-[#DC2626]"/>
              <div className="mt-1 flex justify-between text-[12px] font-semibold text-[#7A6A50]">
                <span>{L("Transparent")}</span>
                <span>{L("Solid")}</span>
              </div>
            </div>
          </aside>

          {/* ------------------------------ Preview ------------------------------ */}
          <div className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-[0_8px_28px_rgba(59,47,30,0.08)] md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#3B2F1E]">
                {previewingResult ? L("Watermarked video") : L("Video preview")}
              </h2>

              {outputUrl ? (<div className="inline-flex rounded-full bg-[#F3E9D2] p-0.5 text-[12px] font-bold">
                  <button type="button" onClick={() => setShowResult(false)} className={`rounded-full px-2.5 py-1 transition ${!previewingResult
                ? "bg-[#FBF6E8] text-[#DC2626] shadow-sm"
                : "text-[#6B5A40]"}`}>{L("Live preview")}</button>
                  <button type="button" onClick={() => setShowResult(true)} className={`rounded-full px-2.5 py-1 transition ${previewingResult
                ? "bg-[#FBF6E8] text-[#DC2626] shadow-sm"
                : "text-[#6B5A40]"}`}>{L("Exported")}</button>
                </div>) : (<span className="rounded-full bg-[#F6D9A8] px-2.5 py-1 text-[12px] font-bold text-[#DC2626]">{L("Preview")}</span>)}
            </div>

            <div className="relative overflow-hidden rounded-xl bg-[#11151b] p-2 shadow-inner">
              <div ref={stageRef} className="relative aspect-video min-h-[300px] w-full overflow-hidden rounded-lg bg-slate-950">
                {previewingResult ? (<video key={outputUrl} src={outputUrl} controls className="absolute inset-0 h-full w-full object-contain"/>) : (<>
                    {videoUrl ? (<video key={videoUrl} src={videoUrl} controls playsInline onLoadedMetadata={(e) => {
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
                }} className="absolute inset-0 h-full w-full object-contain"/>) : (<div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.16),transparent_40%),linear-gradient(145deg,#1f2937,#0b1220)] px-6 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10 backdrop-blur">
                          <Play size={24} fill="currentColor"/>
                        </div>
                        <p className="mt-4 text-base font-extrabold text-white">{L("Your video preview will appear here")}</p>
                        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-[#7A6A50]">{L("Upload a video from the left panel to preview the watermark position, size and opacity.")}</p>
                      </div>)}

                    {/* Live watermark overlay, clipped to the real video frame */}
                    {hasWatermark && videoRect.width > 0 && (<div className="pointer-events-none absolute overflow-hidden" style={{
                    left: videoRect.left,
                    top: videoRect.top,
                    width: videoRect.width,
                    height: videoRect.height,
                }} aria-hidden="true">
                        <img src={watermarkUrl} alt="" draggable={false} className="absolute block h-auto max-w-none select-none" style={{
                    width: `${size}%`,
                    opacity: opacity / 100,
                    ...previewAnchor(position, margin),
                }}/>
                      </div>)}

                    {/* Processing overlay */}
                    {isBusy && (<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/75 px-6 text-center backdrop-blur-sm">
                        <Loader2 size={28} className="animate-spin text-[#F87171]"/>
                        <p className="text-base font-extrabold text-white">
                          {phase === "loading-engine"
                ? L("Loading video engine…") : (locale === "bn" ? `ভিডিও প্রস্তুত হচ্ছে… ${progress}%` : `Rendering… ${progress}%`)}
                        </p>
                        <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={phase === "processing" ? progress : undefined}>
                          <div className={`h-full rounded-full bg-[#DC2626] transition-[width] duration-300 ${phase === "loading-engine"
                    ? "w-1/3 animate-pulse"
                    : ""}`} style={phase === "processing"
                    ? { width: `${progress}%` }
                    : undefined}/>
                        </div>
                        <button type="button" onClick={cancelProcessing} className="pointer-events-auto mt-1 rounded-lg border border-white/20 px-3 py-1.5 text-[13px] font-bold text-white transition hover:bg-white/10">{L("Cancel")}</button>
                      </div>)}
                  </>)}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[12px] text-[#7A6A50]">
              <span className="truncate pr-3">
                {videoFile?.name ?? "manualEdit.mp4"}
              </span>
              <span className="shrink-0 font-medium">
                {videoFile ? `${videoMeta.width}×${videoMeta.height} · ` : ""}
                {positionLabel(position)}
              </span>
            </div>
          </div>
        </section>

        {/* ------------------------------ Action bar ------------------------------ */}
        <section className="flex flex-col gap-3 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] px-4 py-4 shadow-[0_8px_28px_rgba(59,47,30,0.08)] sm:flex-row sm:items-center sm:justify-between md:px-5">
          <div className="min-w-0 flex-1" role="status" aria-live="polite">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#6B5A40]">
              {phase === "error" ? (<AlertCircle size={14} className="shrink-0 text-rose-500"/>) : (<span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`}/>)}
              <span className={`truncate ${phase === "error" ? "text-rose-600" : ""}`}>
                {localizeStatus(status, locale, t)}
              </span>
              {phase === "processing" && (<span className="shrink-0 font-bold text-[#DC2626]">
                  {progress}{"%"}</span>)}
            </div>

            {(phase === "processing" || phase === "loading-engine") && (<div className="mt-2 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-[#F3E9D2]">
                <div className={`h-full rounded-full bg-[#DC2626] transition-[width] duration-300 ${phase === "loading-engine" ? "w-1/3 animate-pulse" : ""}`} style={phase === "processing"
                ? { width: `${progress}%` }
                : undefined}/>
              </div>)}
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <button type="button" onClick={reset} disabled={isBusy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-4 py-2.5 text-sm font-extrabold text-[#3B2F1E] transition hover:bg-[#EFE3C8] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none">
              <RotateCcw size={14}/>{L("Reset")}</button>

            {phase === "done" && outputUrl ? (<button type="button" onClick={downloadOutput} className="inline-flex flex-[1.2] items-center justify-center gap-2 rounded-xl bg-[#D42020] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#B91C1C] sm:flex-none">
                <Download size={14}/>{L("Download MP4")}</button>) : (<button type="button" onClick={addWatermark} disabled={isBusy || !videoFile || !watermarkBlob} className="inline-flex flex-[1.2] items-center justify-center gap-2 rounded-xl bg-[#D42020] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none">
                {isBusy ? (<Loader2 size={14} className="animate-spin"/>) : (<ImageIcon size={14}/>)}
                {isBusy ? L("Processing…") : L("Add watermark")}
              </button>)}
          </div>
        </section>
      </div>
    </div>);
}
