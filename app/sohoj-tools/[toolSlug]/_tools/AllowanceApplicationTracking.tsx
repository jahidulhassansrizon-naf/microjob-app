"use client";
import { T, useSohozI18n, L } from "@/app/sohoj-tools/_i18n";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Download, FileVideo, Film, Loader2, RotateCcw, Share, Star, Upload, Video, X, Zap, } from "lucide-react";
/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
// Single-threaded core: works without SharedArrayBuffer / COOP+COEP headers.
// Keep this version in sync with the major/minor of your installed @ffmpeg/ffmpeg (0.12.x).
const FFMPEG_CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
// Related tools in Video category
const relatedTools = [
    {
        title: "Video Converter",
        description: "Convert video formats easily between MP4, WebM, AVI, and MKV.",
        href: "/sohoj-tools/video-converter",
        icon: Film,
    },
    {
        title: "Trim Video",
        description: "Cut and trim unwanted parts of your video quickly in browser.",
        href: "/sohoj-tools/trim-video",
        icon: Zap,
    },
];
type QualityKey = "high" | "balanced" | "small";
type ResolutionKey = "original" | "1080" | "720" | "480";
// CRF: lower = better quality / bigger file. Preset: slower = smaller file but takes longer.
// In wasm (single thread) "veryfast"/"superfast" keeps processing times reasonable.
const QUALITY_PRESETS: Record<QualityKey, {
    label: string;
    hint: string;
    crf: string;
    preset: string;
    audioBitrate: string;
}> = {
    high: {
        label: "High quality",
        hint: "Larger file",
        crf: "24",
        preset: "veryfast",
        audioBitrate: "128k",
    },
    balanced: {
        label: "Balanced",
        hint: "Recommended",
        crf: "28",
        preset: "veryfast",
        audioBitrate: "96k",
    },
    small: {
        label: "Smallest file",
        hint: "Lower quality",
        crf: "33",
        preset: "superfast",
        audioBitrate: "64k",
    },
};
const RESOLUTION_OPTIONS: {
    key: ResolutionKey;
    label: string;
    height?: number;
}[] = [
    { key: "original", label: "Original" },
    { key: "1080", label: "1080p", height: 1080 },
    { key: "720", label: "720p", height: 720 },
    { key: "480", label: "480p", height: 480 },
];
/* -------------------------------------------------------------------------- */
/*                         FFmpeg singleton (module scope)                    */
/* -------------------------------------------------------------------------- */
let ffmpegSingleton: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;
async function getFFmpeg(): Promise<FFmpeg> {
    if (ffmpegSingleton?.loaded)
        return ffmpegSingleton;
    if (!ffmpegLoadPromise) {
        ffmpegLoadPromise = (async () => {
            const ffmpeg = new FFmpeg();
            const [coreURL, wasmURL] = await Promise.all([
                toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
                toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
            ]);
            await ffmpeg.load({ coreURL, wasmURL });
            ffmpegSingleton = ffmpeg;
            return ffmpeg;
        })().catch((err) => {
            ffmpegLoadPromise = null;
            ffmpegSingleton = null;
            throw err;
        });
    }
    return ffmpegLoadPromise;
}
function resetFFmpegSingleton() {
    ffmpegSingleton = null;
    ffmpegLoadPromise = null;
}
/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */
function formatBytes(bytes: number): string {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function isVideoFile(file: File): boolean {
    return (file.type.startsWith("video/") ||
        /\.(mp4|mov|mkv|avi|webm|m4v|flv|wmv|3gp|mpg|mpeg)$/i.test(file.name));
}
function getExtension(name: string): string {
    const match = name.match(/\.([a-z0-9]+)$/i);
    return match ? match[1].toLowerCase() : "mp4";
}
function getBaseName(name: string): string {
    return name.replace(/\.[^/.]+$/, "") || "video";
}
type EngineState = "loading" | "ready" | "error";
interface CompressionResult {
    url: string;
    size: number;
    fileName: string;
}
/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */
export default function ReduceVideoFileSize() {
    const { L } = useSohozI18n();
    const router = useRouter();
    // UI state
    const [isFavorite, setIsFavorite] = useState(false);
    const [showHowToUse, setShowHowToUse] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    // File state
    const [file, setFile] = useState<File | null>(null);
    const [inputUrl, setInputUrl] = useState<string | null>(null);
    const [result, setResult] = useState<CompressionResult | null>(null);
    // Settings
    const [quality, setQuality] = useState<QualityKey>("balanced");
    const [resolution, setResolution] = useState<ResolutionKey>("original");
    // Engine + job state
    const [engineState, setEngineState] = useState<EngineState>("loading");
    const [isCompressing, setIsCompressing] = useState(false);
    const [progress, setProgress] = useState(0); // 0 - 100
    const [error, setError] = useState<string | null>(null);
    const cancelledRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputUrlRef = useRef<string | null>(null);
    const resultUrlRef = useRef<string | null>(null);
    /* ------------------------------ Engine loading ----------------------------- */
    const loadEngine = useCallback(async () => {
        setEngineState("loading");
        try {
            await getFFmpeg();
            setEngineState("ready");
        }
        catch (err) {
            console.error("FFmpeg failed to load:", err);
            setEngineState("error");
        }
    }, []);
    useEffect(() => {
        void loadEngine();
    }, [loadEngine]);
    useEffect(() => {
        return () => {
            if (inputUrlRef.current)
                URL.revokeObjectURL(inputUrlRef.current);
            if (resultUrlRef.current)
                URL.revokeObjectURL(resultUrlRef.current);
        };
    }, []);
    /* ------------------------------ File handling ------------------------------ */
    const clearResult = useCallback(() => {
        if (resultUrlRef.current) {
            URL.revokeObjectURL(resultUrlRef.current);
            resultUrlRef.current = null;
        }
        setResult(null);
    }, []);
    const handleFile = useCallback((selected: File | null | undefined) => {
        if (!selected || isCompressing)
            return;
        if (!isVideoFile(selected)) {
            setError("That doesn't look like a video. Choose an MP4, MOV, MKV, WebM or AVI file.");
            return;
        }
        if (selected.size > MAX_FILE_SIZE) {
            setError(`This file is ${formatBytes(selected.size)}. The limit is ${formatBytes(MAX_FILE_SIZE)}. Trim the video first, then try again.`);
            return;
        }
        if (inputUrlRef.current)
            URL.revokeObjectURL(inputUrlRef.current);
        clearResult();
        const url = URL.createObjectURL(selected);
        inputUrlRef.current = url;
        setInputUrl(url);
        setFile(selected);
        setProgress(0);
        setError(null);
    }, [isCompressing, clearResult]);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFile(e.target.files?.[0]);
        e.target.value = "";
    };
    useEffect(() => {
        const onPaste = (e: ClipboardEvent) => {
            const pasted = Array.from(e.clipboardData?.files ?? []).find(isVideoFile);
            if (pasted)
                handleFile(pasted);
        };
        window.addEventListener("paste", onPaste);
        return () => window.removeEventListener("paste", onPaste);
    }, [handleFile]);
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isCompressing)
            setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
    };
    /* -------------------------------- Compression ------------------------------ */
    const handleCompress = async () => {
        if (!file || isCompressing)
            return;
        setError(null);
        clearResult();
        setProgress(0);
        setIsCompressing(true);
        cancelledRef.current = false;
        const inputName = `input.${getExtension(file.name)}`;
        const outputName = "output.mp4";
        const logTail: string[] = [];
        let ffmpeg: FFmpeg | null = null;
        const onProgress = ({ progress: p }: {
            progress: number;
        }) => {
            if (Number.isFinite(p)) {
                setProgress(Math.min(99, Math.max(0, Math.round(p * 100))));
            }
        };
        const onLog = ({ message }: {
            message: string;
        }) => {
            logTail.push(message);
            if (logTail.length > 8)
                logTail.shift();
        };
        try {
            ffmpeg = await getFFmpeg();
            setEngineState("ready");
            ffmpeg.on("progress", onProgress);
            ffmpeg.on("log", onLog);
            await ffmpeg.writeFile(inputName, await fetchFile(file));
            const q = QUALITY_PRESETS[quality];
            const targetHeight = RESOLUTION_OPTIONS.find((r) => r.key === resolution)?.height;
            const videoFilter = targetHeight
                ? ["-vf", `scale=-2:'min(${targetHeight},ih)'`]
                : [];
            const args = [
                "-i",
                inputName,
                ...videoFilter,
                "-c:v",
                "libx264",
                "-crf",
                q.crf,
                "-preset",
                q.preset,
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-b:a",
                q.audioBitrate,
                "-movflags",
                "+faststart",
                outputName,
            ];
            const exitCode = await ffmpeg.exec(args);
            if (exitCode !== 0) {
                throw new Error(`FFmpeg exited with code ${exitCode}. ${logTail.slice(-2).join(" ")}`.trim());
            }
            const data = await ffmpeg.readFile(outputName);
            if (typeof data === "string" || data.length === 0) {
                throw new Error("The compressed file came back empty.");
            }
            const blob = new Blob([data as BlobPart], { type: "video/mp4" });
            const url = URL.createObjectURL(blob);
            resultUrlRef.current = url;
            setResult({
                url,
                size: blob.size,
                fileName: `${getBaseName(file.name)}-compressed.mp4`,
            });
            setProgress(100);
        }
        catch (err) {
            if (cancelledRef.current)
                return;
            console.error("Compression failed:", err);
            const message = err instanceof Error ? err.message : "Unknown error";
            const outOfMemory = /memory|abort|out of bounds/i.test(message);
            setError(outOfMemory
                ? "The browser ran out of memory. Try a smaller file, a lower resolution, or close other tabs."
                : `Compression failed. ${message}`);
            setProgress(0);
        }
        finally {
            if (ffmpeg && !cancelledRef.current) {
                ffmpeg.off("progress", onProgress);
                ffmpeg.off("log", onLog);
                await ffmpeg.deleteFile(inputName).catch(() => undefined);
                await ffmpeg.deleteFile(outputName).catch(() => undefined);
            }
            setIsCompressing(false);
        }
    };
    const handleCancel = () => {
        if (!isCompressing)
            return;
        cancelledRef.current = true;
        ffmpegSingleton?.terminate();
        resetFFmpegSingleton();
        setIsCompressing(false);
        setProgress(0);
        void loadEngine();
    };
    const handleReset = () => {
        if (isCompressing)
            handleCancel();
        if (inputUrlRef.current) {
            URL.revokeObjectURL(inputUrlRef.current);
            inputUrlRef.current = null;
        }
        clearResult();
        setInputUrl(null);
        setFile(null);
        setProgress(0);
        setError(null);
    };
    /* --------------------------------- Derived -------------------------------- */
    const savedBytes = file && result ? file.size - result.size : 0;
    const savedPercent = file && result ? Math.round((savedBytes / file.size) * 100) : 0;
    const gotLarger = !!result && savedBytes <= 0;
    const canCompress = !!file && engineState === "ready" && !isCompressing;
    let statusText = "Add a video to get started";
    let statusDot = "bg-[#2563EB]";
    if (engineState === "loading") {
        statusText = "Loading video engine…";
        statusDot = "bg-[#2563EB]";
    }
    else if (engineState === "error") {
        statusText = "Video engine failed to load";
        statusDot = "bg-red-500";
    }
    else if (isCompressing) {
        statusText = `Compressing… ${progress}%`;
        statusDot = "bg-[#2563EB]";
    }
    else if (result) {
        statusText = "Done. Your compressed video is ready";
        statusDot = "bg-[#10B981]";
    }
    else if (file) {
        statusText = "Ready to compress";
        statusDot = "bg-[#10B981]";
    }
    /* --------------------------------- Render --------------------------------- */
    return (<div id="reduce-video-tool" className="w-full bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans pb-16">
      {/* Pointer cursor on every clickable element of this tool */}
      <style>{`
        :where(#reduce-video-tool) a[href],
        :where(#reduce-video-tool) button:not(:disabled),
        :where(#reduce-video-tool) label:has(input[type="file"]:not(:disabled)),
        :where(#reduce-video-tool) summary,
        :where(#reduce-video-tool) select,
        :where(#reduce-video-tool) input[type="color"],
        :where(#reduce-video-tool) input[type="range"],
        :where(#reduce-video-tool) input[type="checkbox"],
        :where(#reduce-video-tool) input[type="radio"],
        :where(#reduce-video-tool) input[type="file"]:not(:disabled) {
          cursor: pointer;
        }

        :where(#reduce-video-tool) button:disabled {
          cursor: not-allowed;
        }
      `}</style>

      <div className="w-full space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-2">
              <button onClick={() => router.back()} className="p-1 hover:bg-[#E2E8F0] rounded-md transition-colors text-[#0F172A] flex items-center justify-center -ml-1" title={L("Go back")}>
                <ArrowLeft size={16}/>
              </button>
              <Link href="/sohoj-tools" className="hover:text-[#0F172A]"><T>{"Sohoj Tools\n              "}</T></Link>
              <span><T>{"/"}</T></span>
              <span className="hover:text-[#0F172A] cursor-pointer"><T>{"Video Tools\n              "}</T></span>
              <span><T>{"/"}</T></span>
              <span className="text-[#0F172A] font-semibold"><T>{"Reduce Video File Size\n              "}</T></span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-50 text-[#2563EB] rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Video size={18}/>
              </div>
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight"><T>{"Reduce Video File Size\n              "}</T></h1>
              <span className="bg-[#10B981]/10 text-[#10B981] text-[11px] font-bold px-2 py-0.5 rounded-full"><T>{"Free\n              "}</T></span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1"><T>{"Shrink video files in your browser \u2014 adjust quality and resolution\n              before sharing or uploading. Your video never leaves your device.\n            "}</T></p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button onClick={() => setIsFavorite(!isFavorite)} aria-label={L("Toggle favorite")} className="p-2 bg-white rounded-lg border border-[#E2E8F0] text-slate-500 hover:text-[#2563EB] hover:border-[#2563EB]/40 transition-all shadow-2xs">
              <Star size={16} className={isFavorite ? "fill-[#2563EB] text-[#2563EB]" : ""}/>
            </button>
            <button aria-label={L("Share")} className="p-2 bg-white rounded-lg border border-[#E2E8F0] text-slate-500 hover:text-[#0F172A] transition-all shadow-2xs">
              <Share size={16}/>
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (<div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4">
            <AlertTriangle size={16} className="mt-0.5 shrink-0"/>
            <p className="text-xs font-medium leading-relaxed flex-1">
              {error}
            </p>
            <button onClick={() => setError(null)} aria-label={L("Dismiss error")} className="p-0.5 hover:bg-red-100 rounded-md transition-colors">
              <X size={14}/>
            </button>
          </div>)}

        {/* Engine status */}
        {engineState === "loading" && (<div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#2563EB] rounded-2xl px-4 py-3 text-xs font-medium">
            <Loader2 size={14} className="animate-spin"/><T>{"Loading the video engine (about 30 MB, only downloaded once)\u2026\n          "}</T></div>)}
        {engineState === "error" && (<div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl px-4 py-3 text-xs font-medium">
            <span><T>{"Couldn&apos;t download the video engine. Check your connection and\n              try again.\n            "}</T></span>
            <button onClick={() => void loadEngine()} className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-100 rounded-lg font-bold transition-colors"><T>{"Retry\n            "}</T></button>
          </div>)}

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: UPLOAD + SETTINGS */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold text-[#0F172A]"><T>{"Files ("}</T>{file ? 1 : 0}<T>{")\n                "}</T></span>
              </div>

              {/* Upload Dropzone */}
              <label onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`border-2 border-dashed transition-all rounded-2xl p-6 flex flex-col items-center justify-center text-center group ${file ? "min-h-[120px]" : "min-h-[220px]"} ${isCompressing
            ? "opacity-50 cursor-not-allowed border-[#E2E8F0]"
            : "cursor-pointer"} ${isDragging
            ? "border-[#2563EB] bg-blue-50/50"
            : "border-[#2563EB]/30 bg-blue-50/20 hover:bg-blue-50/40 hover:border-[#2563EB]/50"}`}>
                <input ref={fileInputRef} type="file" accept="video/*,.mkv" onChange={handleFileChange} disabled={isCompressing} className="hidden"/>
                <div className="w-10 h-10 bg-blue-100 text-[#2563EB] rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Upload size={20}/>
                </div>
                <h3 className="text-xs font-bold text-[#0F172A] mb-1">
                  {file
        ? <T>{"Drop another video or click to replace"}</T> : <T>{"Drop a video here or click to upload"}</T>}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium"><T>{"One video file, max 500 MB\n                "}</T></p>
                {!file && (<p className="text-[10px] text-slate-400 font-medium mt-3"><T>{"Or press Ctrl+V to paste a copied video\n                  "}</T></p>)}
              </label>

              {/* Selected file card */}
              {file && (<div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 shrink-0 bg-blue-100 text-[#2563EB] rounded-lg flex items-center justify-center">
                    <FileVideo size={18}/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0F172A] truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>)}
            </div>

            {/* Settings */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-5">
              <fieldset disabled={isCompressing} className="space-y-2">
                <legend className="text-xs font-bold text-[#0F172A] mb-2"><T>{"Quality\n                "}</T></legend>
                {(Object.keys(QUALITY_PRESETS) as QualityKey[]).map((key) => {
            const preset = QUALITY_PRESETS[key];
            const active = quality === key;
            return (<button key={key} type="button" onClick={() => setQuality(key)} aria-pressed={active} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-colors disabled:opacity-50 ${active
                    ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                    : "border-[#E2E8F0] hover:border-[#2563EB]/30 hover:bg-[#F8FAFC]"}`}>
                      <span className="text-xs font-bold">{preset.label}</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {preset.hint}
                      </span>
                    </button>);
        })}
              </fieldset>

              <fieldset disabled={isCompressing}>
                <legend className="text-xs font-bold text-[#0F172A] mb-2"><T>{"Resolution\n                "}</T></legend>
                <div className="grid grid-cols-4 gap-2">
                  {RESOLUTION_OPTIONS.map((opt) => {
            const active = resolution === opt.key;
            return (<button key={opt.key} type="button" onClick={() => setResolution(opt.key)} aria-pressed={active} className={`px-2 py-2 rounded-xl border text-[11px] font-bold transition-colors disabled:opacity-50 ${active
                    ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                    : "border-[#E2E8F0] hover:border-[#2563EB]/30 hover:bg-[#F8FAFC]"}`}>
                        {opt.label}
                      </button>);
        })}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-2"><T>{"Videos are only scaled down, never enlarged.\n                "}</T></p>
              </fieldset>
            </div>
          </div>

          {/* RIGHT COLUMN: PREVIEW / RESULT */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs flex flex-col min-h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <span className="text-xs font-bold text-[#0F172A]"><T>{"Video preview\n                "}</T></span>
                <span className="text-[11px] font-semibold text-slate-500 bg-[#E2E8F0]/50 px-2.5 py-0.5 rounded-md">
                  {isCompressing
        ? <T>{"Compressing"}</T> : result
        ? "Compressed"
        : file
            ? "Loaded"
            : "Empty"}
                </span>
              </div>

              {!file && (<div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2">
                  <div className="w-10 h-10 bg-blue-50 text-[#2563EB] rounded-xl flex items-center justify-center">
                    <Video size={20}/>
                  </div>
                  <h3 className="text-xs font-bold text-[#0F172A]"><T>{"Add a video to get started\n                  "}</T></h3>
                  <p className="text-[11px] text-slate-400 font-medium max-w-xs leading-relaxed"><T>{"Your original and compressed preview will appear here.\n                  "}</T></p>
                </div>)}

              {file && inputUrl && (<div className="mt-4 space-y-5">
                  <div className={`grid gap-4 ${result ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                    {/* Original */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500"><T>{"Original\n                        "}</T></span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                      <video src={inputUrl} controls preload="metadata" className="w-full max-h-[340px] rounded-xl bg-black"/>
                    </div>

                    {/* Compressed */}
                    {result && (<div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#10B981]"><T>{"Compressed\n                          "}</T></span>
                          <span className="text-[11px] font-semibold text-[#10B981]">
                            {formatBytes(result.size)}
                          </span>
                        </div>
                        <video src={result.url} controls preload="metadata" className="w-full max-h-[340px] rounded-xl bg-black"/>
                      </div>)}
                  </div>

                  {/* Progress */}
                  {isCompressing && (<div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                        <span className="flex items-center gap-2 text-[#2563EB]">
                          <Loader2 size={14} className="animate-spin"/><T>{"Compressing your video\u2026\n                        "}</T></span>
                        <span className="text-[#2563EB]">{progress}<T>{"%"}</T></span>
                      </div>
                      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div className="h-full bg-[#2563EB] rounded-full transition-[width] duration-300" style={{ width: `${Math.max(progress, 2)}%` }}/>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium"><T>{"This runs on your device, so large files can take a few\n                        minutes. Keep this tab open.\n                      "}</T></p>
                    </div>)}

                  {/* Result summary */}
                  {result && (<div className={`p-4 rounded-2xl border space-y-3 ${gotLarger
                    ? "bg-amber-50 border-amber-200"
                    : "bg-emerald-50/60 border-[#10B981]/30"}`}>
                      <div className="flex items-start gap-2">
                        {gotLarger ? (<AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0"/>) : (<CheckCircle2 size={16} className="text-[#10B981] mt-0.5 shrink-0"/>)}
                        <div className="text-xs font-medium leading-relaxed">
                          {gotLarger ? (<p className="text-amber-900"><T>{"This video was already well compressed, so the\n                              result isn&apos;t smaller. Try &quot;Smallest\n                              file&quot; or a lower resolution.\n                            "}</T></p>) : (<p className="text-[#0F172A]">
                              <span className="font-bold text-[#10B981]">
                                {savedPercent}<T>{"% smaller.\n                              "}</T></span>{<T>{" "}</T>}
                              {formatBytes(file.size)}<T>{"\u2192"}</T>{<T>{" "}</T>}
                              {formatBytes(result.size)}<T>{", saving"}</T>{<T>{" "}</T>}
                              {formatBytes(savedBytes)}<T>{".\n                            "}</T></p>)}
                        </div>
                      </div>

                      <a href={result.url} download={result.fileName} className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs">
                        <Download size={14}/><T>{"Download video\n                      "}</T></a>
                    </div>)}
                </div>)}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-2" aria-live="polite">
            <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
            <span>{statusText}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button onClick={handleReset} className="px-4 py-2 bg-[#E2E8F0] hover:bg-[#E2E8F0]/80 text-[#0F172A] text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5">
              <RotateCcw size={13}/><T>{"Reset\n            "}</T></button>

            {isCompressing ? (<button onClick={handleCancel} className="px-5 py-2 text-xs font-bold rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors"><T>{"Cancel\n              "}</T></button>) : (<button onClick={handleCompress} disabled={!canCompress} className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-2xs inline-flex items-center gap-2 ${canCompress
                ? "bg-[#2563EB] hover:bg-[#1d4ed8] text-white cursor-pointer"
                : "bg-[#E2E8F0] text-slate-400 cursor-not-allowed"}`}>
                {engineState === "loading" && (<Loader2 size={13} className="animate-spin"/>)}
                {result ? <T>{"Compress again"}</T> : <T>{"Compress video"}</T>}
              </button>)}
          </div>
        </div>

        {/* HOW TO USE DROPDOWN */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
          <button onClick={() => setShowHowToUse(!showHowToUse)} aria-expanded={showHowToUse} className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-[#0F172A] hover:bg-[#F8FAFC] transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              <span><T>{"How to use"}</T></span>
            </div>
            {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>

          {showHowToUse && (<div className="p-4 pt-4 text-xs text-slate-600 space-y-2 border-t border-[#E2E8F0] font-medium leading-relaxed">
              <p><T>{"1. Upload or drag and drop your video file into the input box on\n                the left.\n              "}</T></p>
              <p><T>{"2. Preview the original file details and select your target\n                quality and resolution.\n              "}</T></p>
              <p><T>{"3. Click &quot;Compress video&quot; to process, then download\n                your reduced file.\n              "}</T></p>
            </div>)}
        </div>

        {/* TOOLS IN THE SAME CATEGORY */}
        <div className="pt-4 space-y-3">
          <h2 className="text-sm font-bold text-[#0F172A] tracking-tight"><T>{"Tools in the same category\n          "}</T></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool) => {
            const ToolIcon = tool.icon;
            return (<Link key={tool.href} href={tool.href} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-[#2563EB]/40 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="w-9 h-9 bg-blue-50 text-[#2563EB] rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                      <ToolIcon size={18}/>
                    </div>
                    <h3 className="text-xs font-bold text-[#0F172A] mb-1 group-hover:text-[#2563EB] transition-colors">
                      {<T>{tool.title}</T>}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {<T>{tool.description}</T>}
                    </p>
                  </div>
                </Link>);
        })}
          </div>
        </div>
      </div>
    </div>);
}
