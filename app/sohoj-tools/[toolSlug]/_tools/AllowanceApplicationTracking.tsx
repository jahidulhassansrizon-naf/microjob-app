"use client";
import { T as BaseT, useSohozI18n, L as baseL } from "@/app/sohoj-tools/_i18n";
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
function formatBytes(bytes: number, locale: string = "en"): string {
    const numberLocale = locale === "bn" ? "bn-BD" : "en-US";
    if (bytes < 1024)
        return `${bytes.toLocaleString(numberLocale)} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toLocaleString(numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GB`;
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
/*                     English / Bangla UI translations                       */
/* -------------------------------------------------------------------------- */
const REDUCE_VIDEO_BN: Record<string, string> = {
    "Video Converter": "ভিডিও কনভার্টার",
    "Convert video formats easily between MP4, WebM, AVI, and MKV.": "সহজেই MP4, WebM, AVI ও MKV ফরম্যাটের মধ্যে ভিডিও রূপান্তর করুন।",
    "Trim Video": "ভিডিও ট্রিম করুন",
    "Cut and trim unwanted parts of your video quickly in browser.": "ব্রাউজারেই দ্রুত ভিডিওর অপ্রয়োজনীয় অংশ কেটে বাদ দিন।",
    "High quality": "উচ্চ মান",
    "Larger file": "ফাইলের আকার বেশি হবে",
    "Balanced": "ভারসাম্যপূর্ণ",
    "Recommended": "প্রস্তাবিত",
    "Smallest file": "সবচেয়ে ছোট ফাইল",
    "Lower quality": "মান কিছুটা কম হবে",
    "Original": "মূল ভিডিও",
    "Sohoj Tools": "সহজ টুলস",
    "Video Tools": "ভিডিও টুলস",
    "Reduce Video File Size": "ভিডিওর ফাইলের আকার কমান",
    "Free": "বিনামূল্যে",
    "Shrink video files in your browser — adjust quality and resolution before sharing or uploading. Your video never leaves your device.": "ব্রাউজারেই ভিডিওর ফাইলের আকার কমান—শেয়ার বা আপলোড করার আগে মান ও রেজোলিউশন ঠিক করুন। আপনার ভিডিও ডিভাইসের বাইরে পাঠানো হয় না।",
    "Go back": "আগের পাতায় যান",
    "Toggle favorite": "পছন্দের তালিকায় যোগ বা বাদ দিন",
    "Share": "শেয়ার করুন",
    "Dismiss error": "ত্রুটি বার্তাটি বন্ধ করুন",
    "That doesn't look like a video. Choose an MP4, MOV, MKV, WebM or AVI file.": "এটি ভিডিও ফাইল বলে মনে হচ্ছে না। MP4, MOV, MKV, WebM অথবা AVI ফাইল বেছে নিন।",
    "Loading the video engine (about 30 MB, only downloaded once)…": "ভিডিও প্রক্রিয়াকরণ ব্যবস্থা লোড হচ্ছে (প্রায় ৩০ MB; একবারই ডাউনলোড হবে)…",
    "Couldn't download the video engine. Check your connection and try again.": "ভিডিও প্রক্রিয়াকরণ ব্যবস্থা ডাউনলোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।",
    "Retry": "আবার চেষ্টা করুন",
    "Files (": "ফাইল (",
    ")": ")",
    "Drop another video or click to replace": "অন্য ভিডিও টেনে আনুন অথবা বদলাতে ক্লিক করুন",
    "Drop a video here or click to upload": "এখানে ভিডিও টেনে আনুন অথবা আপলোড করতে ক্লিক করুন",
    "One video file, max 500 MB": "একটি ভিডিও ফাইল; সর্বোচ্চ ৫০০ MB",
    "Or press Ctrl+V to paste a copied video": "অথবা কপি করা ভিডিও পেস্ট করতে Ctrl+V চাপুন",
    "Quality": "ভিডিওর মান",
    "Resolution": "রেজোলিউশন",
    "Videos are only scaled down, never enlarged.": "ভিডিওর রেজোলিউশন শুধু কমানো হবে, কখনো বাড়ানো হবে না।",
    "Video preview": "ভিডিওর পূর্বরূপ",
    "Compressing": "সংকুচিত হচ্ছে",
    "Compressed": "সংকুচিত ভিডিও",
    "Loaded": "লোড হয়েছে",
    "Empty": "ফাঁকা",
    "Add a video to get started": "শুরু করতে একটি ভিডিও যোগ করুন",
    "Your original and compressed preview will appear here.": "এখানে মূল ও সংকুচিত ভিডিওর পূর্বরূপ দেখা যাবে।",
    "Compressing your video…": "আপনার ভিডিও সংকুচিত করা হচ্ছে…",
    "This runs on your device, so large files can take a few minutes. Keep this tab open.": "এই কাজটি আপনার ডিভাইসেই হচ্ছে, তাই বড় ফাইলে কয়েক মিনিট লাগতে পারে। এই ট্যাবটি খোলা রাখুন।",
    "This video was already well compressed, so the result isn't smaller. Try \"Smallest file\" or a lower resolution.": "ভিডিওটি আগে থেকেই ভালোভাবে সংকুচিত, তাই নতুন ফাইলটি আরও ছোট হয়নি। ‘সবচেয়ে ছোট ফাইল’ মানটি অথবা কম রেজোলিউশন বেছে দেখুন।",
    "% smaller.": "% ছোট হয়েছে।",
    ", saving": ", সাশ্রয় হয়েছে",
    "Download video": "ভিডিও ডাউনলোড করুন",
    "Loading video engine…": "ভিডিও প্রক্রিয়াকরণ ব্যবস্থা লোড হচ্ছে…",
    "Video engine failed to load": "ভিডিও প্রক্রিয়াকরণ ব্যবস্থা লোড করা যায়নি",
    "Ready to compress": "সংকুচিত করার জন্য প্রস্তুত",
    "Done. Your compressed video is ready": "কাজ শেষ। আপনার সংকুচিত ভিডিও প্রস্তুত",
    "Compressing…": "সংকুচিত হচ্ছে…",
    "Reset": "নতুন করে শুরু করুন",
    "Cancel": "বাতিল করুন",
    "Compress again": "আবার সংকুচিত করুন",
    "Compress video": "ভিডিও সংকুচিত করুন",
    "How to use": "ব্যবহারের নিয়ম",
    "1. Upload or drag and drop your video file into the input box on the left.": "১. বাঁ পাশের ঘরে ভিডিও ফাইল আপলোড করুন অথবা টেনে এনে ছেড়ে দিন।",
    "2. Preview the original file details and select your target quality and resolution.": "২. মূল ভিডিওর তথ্য ও পূর্বরূপ দেখুন, তারপর পছন্দের মান ও রেজোলিউশন বেছে নিন।",
    "3. Click \"Compress video\" to process, then download your reduced file.": "৩. ভিডিও প্রক্রিয়া করতে ‘ভিডিও সংকুচিত করুন’ ক্লিক করুন, এরপর ছোট করা ফাইলটি ডাউনলোড করুন।",
    "Tools in the same category": "একই বিভাগের টুলস",
};

function normalizeReduceVideoText(text: string): string {
    return text
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function toReduceVideoBanglaDigits(value: string | number): string {
    return String(value).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

function translateReduceVideoText(text: string): string | undefined {
    const normalized = normalizeReduceVideoText(text);
    const exact = REDUCE_VIDEO_BN[normalized];
    if (exact) return exact;

    const oversized = normalized.match(/^This file is (.+)\. The limit is (.+)\. Trim the video first, then try again\.$/);
    if (oversized) {
        return `ফাইলটির আকার ${oversized[1]}। সর্বোচ্চ সীমা ${oversized[2]}। আগে ভিডিওটি ট্রিম করে ছোট করুন, তারপর আবার চেষ্টা করুন।`;
    }

    const progressStatus = normalized.match(/^Compressing…\s*(\d+)%$/);
    if (progressStatus) return `সংকুচিত হচ্ছে… ${toReduceVideoBanglaDigits(progressStatus[1])}%`;

    if (normalized.startsWith("Compression failed.")) {
        const details = normalized.slice("Compression failed.".length).trim();
        if (!details || details === "Unknown error") return "ভিডিও সংকুচিত করা যায়নি। আবার চেষ্টা করুন।";
        return `ভিডিও সংকুচিত করা যায়নি। ${details}`;
    }
    if (normalized === "The browser ran out of memory. Try a smaller file, a lower resolution, or close other tabs.") {
        return "ব্রাউজারের মেমোরি শেষ হয়ে গেছে। ছোট ফাইল বা কম রেজোলিউশন বেছে নিন, অথবা অন্য ট্যাবগুলো বন্ধ করে আবার চেষ্টা করুন।";
    }
    return undefined;
}

function T({ children }: { children: React.ReactNode }) {
    const { locale } = useSohozI18n();
    if (locale === "bn" && typeof children === "string") {
        const translated = translateReduceVideoText(children);
        if (translated) return <>{translated}</>;
    }
    return <BaseT>{children}</BaseT>;
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */
export default function ReduceVideoFileSize() {
    const { locale } = useSohozI18n();
    const L = (text: string) => locale === "bn" ? translateReduceVideoText(text) ?? baseL(text) : baseL(text);
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
            setError(`This file is ${formatBytes(selected.size, locale)}. The limit is ${formatBytes(MAX_FILE_SIZE, locale)}. Trim the video first, then try again.`);
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
    }, [isCompressing, clearResult, locale]);
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
    let statusDot = "bg-[#D42020]";
    if (engineState === "loading") {
        statusText = "Loading video engine…";
        statusDot = "bg-[#D42020]";
    }
    else if (engineState === "error") {
        statusText = "Video engine failed to load";
        statusDot = "bg-red-500";
    }
    else if (isCompressing) {
        statusText = `Compressing… ${progress}%`;
        statusDot = "bg-[#D42020]";
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
    return (<div id="reduce-video-tool" className="page-font relative isolate w-full min-h-screen text-[#3B2F1E] font-sans pb-16">
      {/* Pointer cursor on every clickable element of this tool */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        #reduce-video-tool {
          position: relative;
          isolation: isolate;
          background: transparent !important;
          color: #3B2F1E;
        }
        #reduce-video-tool::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: linear-gradient(to bottom, #E9DDC3, #EFE5CE);
        }
        #reduce-video-tool.page-font,
        #reduce-video-tool.page-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        #reduce-video-tool h1,
        #reduce-video-tool h2,
        #reduce-video-tool h3,
        #reduce-video-tool h4 { letter-spacing: -0.01em; }
        #reduce-video-tool :where(input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), select, textarea) {
          color: #3B2F1E;
          background-color: #FBF6E8;
          border-color: #E3D6B8;
          font-size: max(15px, 1em);
          transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
        }
        #reduce-video-tool :where(input, select, textarea):focus-visible {
          outline: none;
          border-color: #DC2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.16);
        }
        #reduce-video-tool :where(button, a) {
          transition-duration: 180ms;
        }
        #reduce-video-tool button:active:not(:disabled) { transform: scale(0.98); }
        #reduce-video-tool button:disabled { opacity: 0.7; cursor: not-allowed; }
        #reduce-video-tool .scroll {
          scrollbar-width: thin;
          scrollbar-color: #F87171 transparent;
        }
        #reduce-video-tool .scroll::-webkit-scrollbar { width: 12px; }
        #reduce-video-tool .scroll::-webkit-scrollbar-track { background: rgba(148, 113, 67, 0.12); border-radius: 999px; margin: 10px 0; }
        #reduce-video-tool .scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #F87171, #DC2626); border-radius: 999px; border: 3px solid #F2E8D2; min-height: 48px; }
        #reduce-video-tool .scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #EF4444, #B91C1C); }

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
            <div className="flex items-center gap-2 text-sm text-[#5A4A32] font-medium mb-2">
              <button onClick={() => router.back()} className="p-1 hover:bg-[#F3E9D2] rounded-md transition-colors text-[#3B2F1E] flex items-center justify-center -ml-1" title={L("Go back")}>
                <ArrowLeft size={16}/>
              </button>
              <Link href="/sohoj-tools" className="hover:text-[#3B2F1E]"><T>{"Sohoj Tools\n              "}</T></Link>
              <span><T>{"/"}</T></span>
              <span className="hover:text-[#3B2F1E] cursor-pointer"><T>{"Video Tools\n              "}</T></span>
              <span><T>{"/"}</T></span>
              <span className="text-[#3B2F1E] font-semibold"><T>{"Reduce Video File Size\n              "}</T></span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#FEE9E9] text-[#DC2626] rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Video size={18}/>
              </div>
              <h1 className="text-2xl font-bold text-[#3B2F1E] tracking-tight"><T>{"Reduce Video File Size\n              "}</T></h1>
              <span className="bg-[#10B981]/10 text-[#10B981] text-[13px] font-bold px-2 py-0.5 rounded-full"><T>{"Free\n              "}</T></span>
            </div>
            <p className="text-sm text-[#5A4A32] font-medium mt-1"><T>{"Shrink video files in your browser \u2014 adjust quality and resolution\n              before sharing or uploading. Your video never leaves your device.\n            "}</T></p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button onClick={() => setIsFavorite(!isFavorite)} aria-label={L("Toggle favorite")} className="p-2 bg-[#FBF6E8] rounded-lg border border-[#E3D6B8] text-[#5A4A32] hover:text-[#DC2626] hover:border-[#DC2626]/50 transition-all shadow-2xs">
              <Star size={16} className={isFavorite ? "fill-[#DC2626] text-[#DC2626]" : ""}/>
            </button>
            <button aria-label={L("Share")} className="p-2 bg-[#FBF6E8] rounded-lg border border-[#E3D6B8] text-[#5A4A32] hover:text-[#3B2F1E] transition-all shadow-2xs">
              <Share size={16}/>
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (<div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4">
            <AlertTriangle size={16} className="mt-0.5 shrink-0"/>
            <p className="text-sm font-medium leading-relaxed flex-1">
              <T>{error}</T>
            </p>
            <button onClick={() => setError(null)} aria-label={L("Dismiss error")} className="p-0.5 hover:bg-red-100 rounded-md transition-colors">
              <X size={14}/>
            </button>
          </div>)}

        {/* Engine status */}
        {engineState === "loading" && (<div className="flex items-center gap-2 bg-[#FEE9E9] border border-[#FBB6B6] text-[#DC2626] rounded-2xl px-4 py-3 text-sm font-medium">
            <Loader2 size={14} className="animate-spin"/><T>{"Loading the video engine (about 30 MB, only downloaded once)\u2026\n          "}</T></div>)}
        {engineState === "error" && (<div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl px-4 py-3 text-sm font-medium">
            <span><T>{"Couldn&apos;t download the video engine. Check your connection and\n              try again.\n            "}</T></span>
            <button onClick={() => void loadEngine()} className="px-3 py-1.5 bg-[#FBF6E8] border border-red-200 hover:bg-red-100 rounded-lg font-bold transition-colors"><T>{"Retry\n            "}</T></button>
          </div>)}

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: UPLOAD + SETTINGS */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-bold text-[#3B2F1E]"><T>{"Files ("}</T>{file ? 1 : 0}<T>{")\n                "}</T></span>
              </div>

              {/* Upload Dropzone */}
              <label onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`border-2 border-dashed transition-all rounded-2xl p-6 flex flex-col items-center justify-center text-center group ${file ? "min-h-[120px]" : "min-h-[220px]"} ${isCompressing
            ? "opacity-50 cursor-not-allowed border-[#E3D6B8]"
            : "cursor-pointer"} ${isDragging
            ? "border-[#DC2626] bg-[#FEE9E9]"
            : "border-[#DC2626]/50 bg-[#FEE9E9] hover:bg-[#FEE9E9] hover:border-[#DC2626]/50"}`}>
                <input ref={fileInputRef} type="file" accept="video/*,.mkv" onChange={handleFileChange} disabled={isCompressing} className="hidden"/>
                <div className="w-10 h-10 bg-[#FEE9E9] text-[#DC2626] rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Upload size={20}/>
                </div>
                <h3 className="text-sm font-bold text-[#3B2F1E] mb-1">
                  {file
        ? <T>{"Drop another video or click to replace"}</T> : <T>{"Drop a video here or click to upload"}</T>}
                </h3>
                <p className="text-[13px] text-[#7A6A50] font-medium"><T>{"One video file, max 500 MB\n                "}</T></p>
                {!file && (<p className="text-[12px] text-[#7A6A50] font-medium mt-3"><T>{"Or press Ctrl+V to paste a copied video\n                  "}</T></p>)}
              </label>

              {/* Selected file card */}
              {file && (<div className="p-3 bg-[#F6EEDB] border border-[#E3D6B8] rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 shrink-0 bg-[#FEE9E9] text-[#DC2626] rounded-lg flex items-center justify-center">
                    <FileVideo size={18}/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#3B2F1E] truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[13px] text-[#7A6A50]">
                      {formatBytes(file.size, locale)}
                    </p>
                  </div>
                </div>)}
            </div>

            {/* Settings */}
            <div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-5 shadow-2xs space-y-5">
              <fieldset disabled={isCompressing} className="space-y-2">
                <legend className="text-sm font-bold text-[#3B2F1E] mb-2"><T>{"Quality\n                "}</T></legend>
                {(Object.keys(QUALITY_PRESETS) as QualityKey[]).map((key) => {
            const preset = QUALITY_PRESETS[key];
            const active = quality === key;
            return (<button key={key} type="button" onClick={() => setQuality(key)} aria-pressed={active} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-colors disabled:opacity-50 ${active
                    ? "border-[#DC2626] bg-[#FEE9E9] text-[#DC2626]"
                    : "border-[#E3D6B8] hover:border-[#DC2626]/50 hover:bg-[#F6EEDB]"}`}>
                      <span className="text-sm font-bold"><T>{preset.label}</T></span>
                      <span className="text-[13px] text-[#5A4A32] font-medium">
                        <T>{preset.hint}</T>
                      </span>
                    </button>);
        })}
              </fieldset>

              <fieldset disabled={isCompressing}>
                <legend className="text-sm font-bold text-[#3B2F1E] mb-2"><T>{"Resolution\n                "}</T></legend>
                <div className="grid grid-cols-4 gap-2">
                  {RESOLUTION_OPTIONS.map((opt) => {
            const active = resolution === opt.key;
            return (<button key={opt.key} type="button" onClick={() => setResolution(opt.key)} aria-pressed={active} className={`px-2 py-2 rounded-xl border text-[13px] font-bold transition-colors disabled:opacity-50 ${active
                    ? "border-[#DC2626] bg-[#FEE9E9] text-[#DC2626]"
                    : "border-[#E3D6B8] hover:border-[#DC2626]/50 hover:bg-[#F6EEDB]"}`}>
                        <T>{opt.label}</T>
                      </button>);
        })}
                </div>
                <p className="text-[13px] text-[#7A6A50] font-medium mt-2"><T>{"Videos are only scaled down, never enlarged.\n                "}</T></p>
              </fieldset>
            </div>
          </div>

          {/* RIGHT COLUMN: PREVIEW / RESULT */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-5 shadow-2xs flex flex-col min-h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E3D6B8]">
                <span className="text-sm font-bold text-[#3B2F1E]"><T>{"Video preview\n                "}</T></span>
                <span className="text-[13px] font-semibold text-[#5A4A32] bg-[#F3E9D2]/70 px-2.5 py-0.5 rounded-md">
                  {isCompressing
        ? <T>{"Compressing"}</T> : result
        ? <T>{"Compressed"}</T>
        : file
            ? <T>{"Loaded"}</T>
            : <T>{"Empty"}</T>}
                </span>
              </div>

              {!file && (<div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2">
                  <div className="w-10 h-10 bg-[#FEE9E9] text-[#DC2626] rounded-xl flex items-center justify-center">
                    <Video size={20}/>
                  </div>
                  <h3 className="text-sm font-bold text-[#3B2F1E]"><T>{"Add a video to get started\n                  "}</T></h3>
                  <p className="text-[13px] text-[#7A6A50] font-medium max-w-xs leading-relaxed"><T>{"Your original and compressed preview will appear here.\n                  "}</T></p>
                </div>)}

              {file && inputUrl && (<div className="mt-4 space-y-5">
                  <div className={`grid gap-4 ${result ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                    {/* Original */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-[#5A4A32]"><T>{"Original\n                        "}</T></span>
                        <span className="text-[13px] font-semibold text-[#5A4A32]">
                          {formatBytes(file.size, locale)}
                        </span>
                      </div>
                      <video src={inputUrl} controls preload="metadata" className="w-full max-h-[340px] rounded-xl bg-black"/>
                    </div>

                    {/* Compressed */}
                    {result && (<div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-bold text-[#10B981]"><T>{"Compressed\n                          "}</T></span>
                          <span className="text-[13px] font-semibold text-[#10B981]">
                            {formatBytes(result.size, locale)}
                          </span>
                        </div>
                        <video src={result.url} controls preload="metadata" className="w-full max-h-[340px] rounded-xl bg-black"/>
                      </div>)}
                  </div>

                  {/* Progress */}
                  {isCompressing && (<div className="p-4 bg-[#FEE9E9] border border-[#FBB6B6] rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-sm font-bold text-[#3B2F1E]">
                        <span className="flex items-center gap-2 text-[#DC2626]">
                          <Loader2 size={14} className="animate-spin"/><T>{"Compressing your video\u2026\n                        "}</T></span>
                        <span className="text-[#DC2626]">{(progress).toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}<T>{"%"}</T></span>
                      </div>
                      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2 w-full bg-[#F3E9D2] rounded-full overflow-hidden">
                        <div className="h-full bg-[#D42020] rounded-full transition-[width] duration-300" style={{ width: `${Math.max(progress, 2)}%` }}/>
                      </div>
                      <p className="text-[13px] text-[#5A4A32] font-medium"><T>{"This runs on your device, so large files can take a few\n                        minutes. Keep this tab open.\n                      "}</T></p>
                    </div>)}

                  {/* Result summary */}
                  {result && (<div className={`p-4 rounded-2xl border space-y-3 ${gotLarger
                    ? "bg-amber-50 border-amber-200"
                    : "bg-emerald-50/60 border-[#10B981]/30"}`}>
                      <div className="flex items-start gap-2">
                        {gotLarger ? (<AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0"/>) : (<CheckCircle2 size={16} className="text-[#10B981] mt-0.5 shrink-0"/>)}
                        <div className="text-sm font-medium leading-relaxed">
                          {gotLarger ? (<p className="text-amber-900"><T>{"This video was already well compressed, so the\n                              result isn&apos;t smaller. Try &quot;Smallest\n                              file&quot; or a lower resolution.\n                            "}</T></p>) : (<p className="text-[#3B2F1E]">
                              <span className="font-bold text-[#10B981]">
                                {savedPercent.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}<T>{"% smaller.\n                              "}</T></span>{<T>{" "}</T>}
                              {formatBytes(file.size, locale)}<T>{"\u2192"}</T>{<T>{" "}</T>}
                              {formatBytes(result.size, locale)}<T>{", saving"}</T>{<T>{" "}</T>}
                              {formatBytes(savedBytes, locale)}<T>{".\n                            "}</T></p>)}
                        </div>
                      </div>

                      <a href={result.url} download={result.fileName} className="inline-flex items-center gap-2 px-4 py-2 bg-[#D42020] hover:bg-[#AE1717] text-white text-sm font-bold rounded-xl transition-colors shadow-2xs">
                        <Download size={14}/><T>{"Download video\n                      "}</T></a>
                    </div>)}
                </div>)}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="text-sm font-medium text-[#5A4A32] flex items-center gap-2" aria-live="polite">
            <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
            <span><T>{statusText}</T></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button onClick={handleReset} className="px-4 py-2 bg-[#F3E9D2] hover:bg-[#EFE3C8] text-[#3B2F1E] text-sm font-bold rounded-xl transition-colors inline-flex items-center gap-1.5">
              <RotateCcw size={13}/><T>{"Reset\n            "}</T></button>

            {isCompressing ? (<button onClick={handleCancel} className="px-5 py-2 text-sm font-bold rounded-xl bg-[#FBF6E8] border border-red-200 text-red-600 hover:bg-red-50 transition-colors"><T>{"Cancel\n              "}</T></button>) : (<button onClick={handleCompress} disabled={!canCompress} className={`px-5 py-2 text-sm font-bold rounded-xl transition-all shadow-2xs inline-flex items-center gap-2 ${canCompress
                ? "bg-[#D42020] hover:bg-[#AE1717] text-white cursor-pointer"
                : "bg-[#F3E9D2] text-[#7A6A50] cursor-not-allowed"}`}>
                {engineState === "loading" && (<Loader2 size={13} className="animate-spin"/>)}
                {result ? <T>{"Compress again"}</T> : <T>{"Compress video"}</T>}
              </button>)}
          </div>
        </div>

        {/* HOW TO USE DROPDOWN */}
        <div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl overflow-hidden shadow-2xs">
          <button onClick={() => setShowHowToUse(!showHowToUse)} aria-expanded={showHowToUse} className="w-full p-4 text-left flex items-center justify-between font-bold text-sm text-[#3B2F1E] hover:bg-[#F6EEDB] transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D42020]"></span>
              <span><T>{"How to use"}</T></span>
            </div>
            {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>

          {showHowToUse && (<div className="p-4 pt-4 text-sm text-[#5A4A32] space-y-2 border-t border-[#E3D6B8] font-medium leading-relaxed">
              <p><T>{"1. Upload or drag and drop your video file into the input box on\n                the left.\n              "}</T></p>
              <p><T>{"2. Preview the original file details and select your target\n                quality and resolution.\n              "}</T></p>
              <p><T>{"3. Click &quot;Compress video&quot; to process, then download\n                your reduced file.\n              "}</T></p>
            </div>)}
        </div>

        {/* TOOLS IN THE SAME CATEGORY */}
        <div className="pt-4 space-y-3">
          <h2 className="text-base font-bold text-[#3B2F1E] tracking-tight"><T>{"Tools in the same category\n          "}</T></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool) => {
            const ToolIcon = tool.icon;
            return (<Link key={tool.href} href={tool.href} className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-[#DC2626]/50 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="w-9 h-9 bg-[#FEE9E9] text-[#DC2626] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#FEE9E9] transition-colors">
                      <ToolIcon size={18}/>
                    </div>
                    <h3 className="text-sm font-bold text-[#3B2F1E] mb-1 group-hover:text-[#DC2626] transition-colors">
                      {<T>{tool.title}</T>}
                    </h3>
                    <p className="text-[13px] text-[#5A4A32] font-medium leading-relaxed">
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
