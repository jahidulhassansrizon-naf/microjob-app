"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, Image as ImageIcon, Loader2, RotateCcw, Share2, Sparkles, Star, Upload, X, Zap, } from "lucide-react";
import type * as Ort from "onnxruntime-web";
/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */
type ScaleOption = "2x" | "4x";
type OutputFormat = "Original" | "PNG" | "JPG" | "WebP";
type InferenceDevice = "webgpu" | "wasm";
interface Dimensions {
    width: number;
    height: number;
}
interface ExportTarget {
    mime: string;
    extension: string;
    label: string;
}
interface UpscaleResult {
    url: string;
    width: number;
    height: number;
    scale: ScaleOption;
    durationMs: number;
    hasAlpha: boolean;
}
type OrtModule = typeof Ort;
/** Planar RGB float output of the model: [R..., G..., B...], values 0..1. */
interface TileResult {
    data: Float32Array;
    width: number;
    height: number;
}
interface OrtSessionBundle {
    ort: OrtModule;
    session: Ort.InferenceSession;
}
interface PipelineEntry {
    promise: Promise<OrtSessionBundle>;
}
/* -------------------------------------------------------------------------- */
/*                                 Constants                                  */
/* -------------------------------------------------------------------------- */
const ACCEPTED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/bmp",
    "image/avif",
];
const ACCEPT_ATTRIBUTE = ACCEPTED_TYPES.join(",");
/** Max upload size (bytes). */
const MAX_FILE_SIZE = 25 * 1024 * 1024;
/**
 * Browser-safe output limits. 4096 x 4096 is the canvas area limit on
 * iOS Safari, so it is a safe ceiling for every modern browser.
 */
const MAX_OUTPUT_PIXELS = 4096 * 4096;
const MAX_OUTPUT_SIDE = 16384;
/**
 * AI model: Real-ESRGAN "realesr-general-x4v3" (ONNX, fp32) running in the
 * browser with onnxruntime-web. It is a true 4x model that also removes noise
 * and compression artifacts. A 2x request runs the 4x model and shrinks the
 * result, which keeps the cleanup and gives a sharper image than a native 2x.
 * Input  : float32 [1, 3, H, W], RGB, 0..1
 * Output : float32 [1, 3, 4H, 4W], RGB, 0..1
 */
const MODEL_URL = "/models/realesr-general-x4v3.onnx";
const MODEL_CACHE_NAME = "sohoj-upscaler-models-v1";
/** Used for the progress bar when the server sends no Content-Length. */
const MODEL_APPROX_BYTES = 4.6 * 1024 * 1024;
const MODEL_MIN_BYTES = 512 * 1024;
/** Images up to this size (longest side, px) run in one piece: no tile seams. */
const WHOLE_IMAGE_MAX_SIDE = 256;
/**
 * Bigger images are processed in tiles so memory stays low on any device.
 * The network only "sees" about 17 px around a pixel, so 20 px of context on
 * each side of a tile makes the joints invisible.
 */
const TILE_SIZE = 128;
const TILE_OVERLAP = 20;
const EXPORT_QUALITY = 0.92;
const TARGET_PNG: ExportTarget = {
    mime: "image/png",
    extension: "png",
    label: "PNG",
};
const TARGET_JPG: ExportTarget = {
    mime: "image/jpeg",
    extension: "jpg",
    label: "JPG",
};
const TARGET_WEBP: ExportTarget = {
    mime: "image/webp",
    extension: "webp",
    label: "WebP",
};
/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */
const formatFileSize = (bytes: number) => {
    if (!bytes)
        return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024)
        return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
};
const formatDuration = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const nextTick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
    img.src = src;
});
const canvasToBlob = (canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
        if (blob)
            resolve(blob);
        else
            reject(new Error("EXPORT_FAILED"));
    }, mime, quality);
});
/**
 * Fetches the ONNX model once (reporting download progress) and stores it in
 * the Cache API, so later visits load it from disk instead of the network.
 */
const loadModelBytes = async (url: string, onProgress?: (percent: number) => void): Promise<Uint8Array> => {
    const cache = typeof caches !== "undefined"
        ? await caches.open(MODEL_CACHE_NAME).catch(() => null)
        : null;
    if (cache) {
        const hit = await cache.match(url).catch(() => undefined);
        if (hit)
            return new Uint8Array(await hit.arrayBuffer());
    }
    const response = await fetch(url);
    if (!response.ok || !response.body)
        throw new Error("MODEL_FETCH_FAILED");
    const total = Number(response.headers.get("content-length")) || MODEL_APPROX_BYTES;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done)
            break;
        chunks.push(value);
        received += value.length;
        onProgress?.(Math.min(99, Math.round((received / total) * 100)));
    }
    // A real model is MBs. A tiny body is an error page, never cache that.
    if (received < MODEL_MIN_BYTES)
        throw new Error("MODEL_FETCH_FAILED");
    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
    }
    if (cache) {
        await cache
            .put(url, new Response(bytes.buffer as ArrayBuffer, {
            headers: { "Content-Type": "application/octet-stream" },
        }))
            .catch(() => undefined);
    }
    return bytes;
};
/** Canvas RGBA pixels -> planar RGB floats [R..., G..., B...], range 0..1. */
const imageDataToPlanarRgb = (image: ImageData): Float32Array => {
    const { data, width, height } = image;
    const plane = width * height;
    const out = new Float32Array(3 * plane);
    for (let i = 0; i < plane; i += 1) {
        const s = i * 4;
        out[i] = data[s] / 255;
        out[plane + i] = data[s + 1] / 255;
        out[2 * plane + i] = data[s + 2] / 255;
    }
    return out;
};
/** Model float (0..1) -> byte (0..255), clamped. */
const toByte = (value: number): number => {
    const n = Math.round(value * 255);
    return n < 0 ? 0 : n > 255 ? 255 : n;
};
const getExportTarget = (format: OutputFormat, sourceMime: string): ExportTarget => {
    switch (format) {
        case "PNG":
            return TARGET_PNG;
        case "JPG":
            return TARGET_JPG;
        case "WebP":
            return TARGET_WEBP;
        default:
            // "Original": keep the source format when the browser can encode it,
            // otherwise fall back to lossless PNG (BMP, AVIF, ...).
            if (sourceMime === "image/jpeg")
                return TARGET_JPG;
            if (sourceMime === "image/webp")
                return TARGET_WEBP;
            return TARGET_PNG;
    }
};
const buildFileName = (originalName: string, scale: ScaleOption, extension: string) => {
    const base = originalName
        .replace(/\.[^/.]+$/, "")
        .replace(/[\\/:*?"<>|]+/g, "_")
        .trim() || "image";
    return `${base}-upscaled-${scale}.${extension}`;
};
const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
};
/** True when any pixel of the image is not fully opaque. */
const hasTransparency = (img: HTMLImageElement, mime: string): boolean => {
    if (mime === "image/jpeg" || mime === "image/bmp")
        return false;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx)
        return false;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, width, height);
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255)
            return true;
    }
    return false;
};
/**
 * The AI model only sees RGB, so transparency is restored afterwards by
 * scaling the original alpha channel to the output size.
 */
const restoreAlpha = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, sourceImg: HTMLImageElement) => {
    const { width, height } = canvas;
    const alphaCanvas = document.createElement("canvas");
    alphaCanvas.width = width;
    alphaCanvas.height = height;
    const alphaCtx = alphaCanvas.getContext("2d", { willReadFrequently: true });
    if (!alphaCtx)
        throw new Error("EXPORT_FAILED");
    alphaCtx.imageSmoothingEnabled = true;
    alphaCtx.imageSmoothingQuality = "high";
    alphaCtx.drawImage(sourceImg, 0, 0, width, height);
    const colorData = ctx.getImageData(0, 0, width, height);
    const alphaData = alphaCtx.getImageData(0, 0, width, height);
    for (let i = 3; i < colorData.data.length; i += 4) {
        colorData.data[i] = alphaData.data[i];
    }
    ctx.putImageData(colorData, 0, 0);
};
const encodeForExport = async (resultUrl: string, pngBlob: Blob, target: ExportTarget): Promise<Blob> => {
    // The stored result is already a PNG, no need to re-encode.
    if (target.mime === TARGET_PNG.mime)
        return pngBlob;
    const img = await loadImage(resultUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx)
        throw new Error("EXPORT_FAILED");
    // JPG has no alpha channel: paint white so transparent areas are not black.
    if (target.mime === TARGET_JPG.mime) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    const blob = await canvasToBlob(canvas, target.mime, EXPORT_QUALITY);
    // Browsers silently fall back to PNG when they can't encode a format.
    if (blob.type !== target.mime) {
        throw new Error(`FORMAT_UNSUPPORTED:${target.label}`);
    }
    return blob;
};
const isMemoryError = (err: unknown): boolean => {
    if (err instanceof RangeError)
        return true;
    const message = err instanceof Error ? err.message : String(err ?? "");
    return /out of memory|\boom\b|memory|allocate|allocation|context lost|context_lost/i.test(message);
};
const getFriendlyError = (err: unknown): string => {
    const message = err instanceof Error ? err.message : String(err ?? "");
    if (message === "IMAGE_LOAD_FAILED") {
        return "This image couldn't be read. The file may be corrupted or in an unsupported format.";
    }
    if (message === "EXPORT_FAILED") {
        return "The result couldn't be exported. It may be larger than your browser's canvas limit. Try 2x or a smaller image.";
    }
    if (message.startsWith("FORMAT_UNSUPPORTED:")) {
        const label = message.split(":")[1] ?? "this format";
        return `Your browser can't export ${label}. Choose PNG or JPG instead.`;
    }
    if (isMemoryError(err)) {
        return "Your device ran out of memory while upscaling. Try 2x, use a smaller image, or close other tabs and try again.";
    }
    if (/failed to fetch|networkerror|load failed|could not locate|unauthorized|http|fetch/i.test(message)) {
        return "The AI model couldn't be downloaded. Check your internet connection and try again.";
    }
    if (/webgpu|wasm|backend|execution provider/i.test(message)) {
        return "Your browser couldn't start the AI engine. Update your browser or try another one (Chrome or Edge work best).";
    }
    return "Something went wrong while upscaling this image. Please try again or use a different image.";
};
/* -------------------------------------------------------------------------- */
/* Page-specific English ↔ Bangla translations                                */
/* -------------------------------------------------------------------------- */
const IMAGE_UPSCALER_BN: Record<string, string> = {
    "sohoj tools": "সহজ টুলস",
    "image tools": "ছবির টুলস",
    "image upscaler": "ছবির রেজোলিউশন বাড়ান",
    "free": "বিনামূল্যে",
    "enlarge images up to 4x while keeping your workflow simple and clean.": "সহজেই ছবির আকার ৪ গুণ পর্যন্ত বাড়ান এবং ছবির মান আরও উন্নত করুন।",
    "upscale by": "ছবির আকার বাড়ান",
    "choose output size": "আউটপুটের আকার বেছে নিন",
    "output format": "আউটপুট ফরম্যাট",
    "original will download as": "মূল ফরম্যাটে ডাউনলোড হবে: ",
    "jpg doesn't support transparency. transparent areas will turn white. choose png or webp to keep them.": "JPG-তে স্বচ্ছ অংশ রাখা যায় না। তাই স্বচ্ছ অংশগুলো সাদা হয়ে যাবে। স্বচ্ছতা বজায় রাখতে PNG বা WebP বেছে নিন।",
    "private & on-device": "ব্যক্তিগত ও আপনার ডিভাইসেই প্রক্রিয়াকরণ",
    "your image is processed in your browser and is never uploaded. the ai model downloads once on first use and is cached after that. it also removes noise and jpeg blockiness, so larger images take more time.": "আপনার ছবিটি ব্রাউজারেই প্রক্রিয়াকরণ করা হয়, কোথাও আপলোড করা হয় না। AI মডেলটি প্রথমবার ব্যবহারের সময় একবার ডাউনলোড হয় এবং পরে ব্যবহারের জন্য সংরক্ষিত থাকে। এটি ছবির দাগ ও JPEG-এর ব্লকজাতীয় বিকৃতিও কমায়, তাই বড় ছবিতে বেশি সময় লাগতে পারে।",
    "reset": "পুনরায় শুরু করুন",
    "loading ai model…": "AI মডেল লোড হচ্ছে…",
    "downloading ai model… (first time only)": "প্রথমবার ব্যবহারের জন্য AI মডেল ডাউনলোড হচ্ছে…",
    "enhancing image…": "ছবির মান উন্নত করা হচ্ছে…",
    "finalizing image…": "ছবির ফলাফল প্রস্তুত করা হচ্ছে…",
    "upscaling…": "ছবির মান ও আকার বাড়ানো হচ্ছে…",
    "upscale again": "আবার ছবির মান বাড়ান",
    "upscale image": "ছবির মান বাড়ান",
    "preparing download…": "ডাউনলোডের জন্য প্রস্তুত করা হচ্ছে…",
    "download": "ডাউনলোড",
    "image preview": "ছবির পূর্বরূপ",
    "compare the source and enlarged result here.": "এখানে মূল ছবি ও আকার বাড়ানো ছবির তুলনা দেখুন।",
    "change image": "ছবি পরিবর্তন করুন",
    "click or drag an image here": "এখানে ক্লিক করুন অথবা ছবি টেনে এনে ছেড়ে দিন",
    "upload a jpg, png, or webp image up to": "সর্বোচ্চ এই আকারের JPG, PNG বা WebP ছবি দিন: ",
    "and enlarge it 2x or 4x right in your browser.": "। এরপর ব্রাউজারেই ছবির আকার ২ বা ৪ গুণ বাড়াতে পারবেন।",
    "choose image": "ছবি বেছে নিন",
    "or press ctrl+v to paste a copied image": "অথবা কপি করা ছবি পেস্ট করতে Ctrl+V চাপুন",
    "before": "আগে",
    "after": "পরে",
    "original": "মূল ছবি",
    "starting…": "শুরু হচ্ছে…",
    "cancel": "বাতিল করুন",
    "your": "আপনার ",
    "result will appear here": "ছবির ফলাফল এখানে দেখা যাবে",
    "press \"upscale image\" to enlarge it, then download it as": "ছবির আকার বাড়াতে “ছবির মান বাড়ান” চাপুন, তারপর এই ফরম্যাটে ডাউনলোড করুন: ",
    "this result is": "এই ফলাফলটি ",
    ". press \"upscale again\" to create a": "। নতুন সংস্করণ তৈরি করতে আবার ছবির আকার বাড়িয়ে ",
    "version.": "সংস্করণ তৈরি করুন।",
    "tools in the same category": "একই বিভাগের অন্যান্য টুল",
    "image size reducer": "ছবির আকার কমানোর টুল",
    "shrink jpg, png, and webp photos in your browser while keeping the result clear.": "ছবির মান ঠিক রেখে ব্রাউজারেই JPG, PNG ও WebP ছবির আকার কমান।",
    "image convert": "ছবির ফরম্যাট পরিবর্তন",
    "convert images between popular formats with a simple browser workflow.": "সহজেই ব্রাউজারে ছবিকে বিভিন্ন জনপ্রিয় ফরম্যাটে রূপান্তর করুন।",
    "crop image": "ছবি ক্রপ করুন",
    "crop images to a custom area or a fixed aspect ratio directly in the browser.": "ব্রাউজারেই ছবির পছন্দের অংশ বা নির্দিষ্ট অনুপাত অনুযায়ী ক্রপ করুন।",
    "add to favorites": "পছন্দের তালিকায় যোগ করুন",
    "share tool": "টুলটি শেয়ার করুন",
    "dismiss error": "ত্রুটির বার্তা বন্ধ করুন",
    "selected image preview": "নির্বাচিত ছবির পূর্বরূপ",
    "open full size in a new tab": "নতুন ট্যাবে পূর্ণ আকারে খুলুন",
    "success": "সফল হয়েছে",
    "unable to complete": "সম্পন্ন করা যায়নি",
    "working…": "কাজ চলছে…",
    "empty": "খালি",
    "ready": "প্রস্তুত",
    "processing": "প্রক্রিয়াকরণ চলছে",
    "done": "সম্পন্ন",
    "unsupported file type. please upload a jpg, png, webp, bmp, or avif image.": "অসমর্থিত ফাইলের ধরন। JPG, PNG, WebP, BMP অথবা AVIF ছবি আপলোড করুন।",
    "this file is empty. please choose another image.": "এই ফাইলটি খালি। অনুগ্রহ করে অন্য ছবি বেছে নিন।",
    "this image couldn't be read. the file may be corrupted or in an unsupported format.": "ছবিটি পড়া যায়নি। ফাইলটি নষ্ট হতে পারে অথবা এর ফরম্যাট সমর্থিত নয়।",
    "the result couldn't be exported. it may be larger than your browser's canvas limit. try 2x or a smaller image.": "ফলাফলটি তৈরি করে সংরক্ষণ করা যায়নি। এটি ব্রাউজারের ক্যানভাস সীমার চেয়ে বড় হতে পারে। 2x বেছে নিন অথবা ছোট ছবি ব্যবহার করুন।",
    "your device ran out of memory while upscaling. try 2x, use a smaller image, or close other tabs and try again.": "ছবির আকার বাড়ানোর সময় আপনার ডিভাইসের মেমোরি শেষ হয়ে গেছে। 2x বেছে নিন, ছোট ছবি ব্যবহার করুন অথবা অন্য ট্যাব বন্ধ করে আবার চেষ্টা করুন।",
    "the ai model couldn't be downloaded. check your internet connection and try again.": "AI মডেল ডাউনলোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।",
    "your browser couldn't start the ai engine. update your browser or try another one (chrome or edge work best).": "আপনার ব্রাউজারে AI ইঞ্জিন চালু করা যায়নি। ব্রাউজার আপডেট করুন অথবা অন্য ব্রাউজার ব্যবহার করুন (Chrome বা Edge ভালো কাজ করে)।",
    "something went wrong while upscaling this image. please try again or use a different image.": "ছবির আকার বাড়ানোর সময় সমস্যা হয়েছে। আবার চেষ্টা করুন অথবা অন্য ছবি ব্যবহার করুন।",
    "the image couldn't be downloaded.": "ছবিটি ডাউনলোড করা যায়নি।",
};

function normalizeUpscalerText(value: string): string {
    return value
        .replace(/&quot;/gi, '"')
        .replace(/&apos;/gi, "'")
        .replace(/&#39;/gi, "'")
        .replace(/&amp;/gi, "&")
        .replace(/\\r\\n/g, " ")
        .replace(/[\r\n]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function translateUpscalerText(value: unknown, locale: string | undefined, baseL?: (value: string) => string): string {
    const raw = String(value ?? "");
    if (!locale || !String(locale).toLowerCase().startsWith("bn") || !/[A-Za-z]/.test(raw)) return raw;

    const normalized = normalizeUpscalerText(raw);
    const exact = IMAGE_UPSCALER_BN[normalized];
    if (exact !== undefined) {
        const leading = raw.match(/^\s*/)?.[0] ?? "";
        const trailing = raw.match(/\s*$/)?.[0] ?? "";
        return `${leading}${exact}${trailing}`;
    }

    let match = /^(\d+)\s*[×x]\s*(\d+)\s*px$/.exec(normalized);
    if (match) return `${match[1]} × ${match[2]} পিক্সেল`;

    match = /^output size:\s*(\d+\s*[×x]\s*\d+\s*px)$/.exec(normalized);
    if (match) return `আউটপুটের আকার: ${translateUpscalerText(match[1], locale, baseL)}`;

    match = /^(\d+)\s*×\s*(\d+)\s*px is over the 4096\s*×\s*4096\s*px browser limit\. choose 2x or use a smaller image\.$/.exec(normalized);
    if (match) return `ছবির মাপ ${match[1]} × ${match[2]} পিক্সেল, যা ব্রাউজারের 4096 × 4096 পিক্সেল সীমার চেয়ে বড়। 2x বেছে নিন অথবা ছোট ছবি ব্যবহার করুন।`;

    match = /^this file is (.+)\. the maximum size is (.+)\.$/.exec(normalized);
    if (match) return `এই ফাইলটির আকার ${match[1]}। সর্বোচ্চ অনুমোদিত আকার ${match[2]}।`;

    match = /^download (png|jpg|webp)$/.exec(normalized);
    if (match) return `${match[1].toUpperCase()} ডাউনলোড করুন`;

    match = /^(\d+)%$/.exec(normalized);
    if (match) return `${match[1]}%`;

    match = /^your browser can't export (.+)\. choose png or jpg instead\.$/.exec(normalized);
    if (match) return `আপনার ব্রাউজারে ${match[1].toUpperCase()} ফরম্যাটে ছবি তৈরি করা যায় না। PNG অথবা JPG বেছে নিন।`;

    // Use the shared dictionary only when it produces a clean Bangla sentence;
    // otherwise keep the original rather than showing a mixed/partial translation.
    if (baseL) {
        const translated = baseL(raw);
        const withoutTechnicalTerms = translated.replace(/AI|PDF|JPG|PNG|WebP|AVIF|JPEG|BMP|ONNX|WebGPU|WASM|Ctrl\+V|px|KB|MB|GB/gi, "");
        if (/[\u0980-\u09FF]/.test(translated) && !/[A-Za-z]/.test(withoutTechnicalTerms)) return translated;
    }
    return raw;
}

function UpscalerText({ children }: { children: React.ReactNode }) {
    const { locale, L: baseL } = useSohozI18n();
    if (typeof children !== "string" && typeof children !== "number") return <>{children}</>;
    return <>{translateUpscalerText(children, locale, baseL)}</>;
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */
export default function ImageUpscaler() {
    const { L: baseL, locale } = useSohozI18n();
    const UL = (value: string) => translateUpscalerText(value, locale, baseL);
    const [scale, setScale] = useState<ScaleOption>("2x");
    const [outputFormat, setOutputFormat] = useState<OutputFormat>("Original");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [sourceDims, setSourceDims] = useState<Dimensions | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [statusText, setStatusText] = useState<string>("");
    const [result, setResult] = useState<UpscaleResult | null>(null);
    const [error, setError] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const objectUrlRef = useRef<string>("");
    const sourceImageRef = useRef<HTMLImageElement | null>(null);
    const resultRef = useRef<{
        url: string;
        blob: Blob;
    } | null>(null);
    const mountedRef = useRef<boolean>(false);
    const runIdRef = useRef<number>(0);
    const loadTokenRef = useRef<number>(0);
    const lastPercentRef = useRef<number>(-1);
    const isProcessingRef = useRef<boolean>(false);
    const abortRef = useRef<AbortController | null>(null);
    const pipelineRef = useRef<PipelineEntry | null>(null);
    const deviceRef = useRef<InferenceDevice | null>(null);
    const handleFileRef = useRef<(file: File) => Promise<void>>(async () => undefined);
    /* ------------------------------ Object URLs ------------------------------ */
    const clearObjectUrl = () => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = "";
        }
    };
    const clearResult = () => {
        if (resultRef.current) {
            URL.revokeObjectURL(resultRef.current.url);
            resultRef.current = null;
        }
        setResult(null);
    };
    /* --------------------------- AI engine (client only) --------------------- */
    const disposePipeline = () => {
        const current = pipelineRef.current;
        pipelineRef.current = null;
        current?.promise
            .then((bundle) => bundle.session.release())
            .catch(() => undefined);
    };
    /**
     * Lazily loads the dedicated 1.30.x onnxruntime-web runtime and the
     * Real-ESRGAN model in the browser only.
     * - The dynamic import keeps ORT out of SSR.
     * - The model is fetched once (with progress) and kept in the Cache API.
     * - WebGPU is tried first; if it can't start, we fall back to WASM (CPU).
     */
    const getPipeline = (onDownload?: (percent: number) => void): Promise<OrtSessionBundle> => {
        const current = pipelineRef.current;
        if (current)
            return current.promise;
        const promise: Promise<OrtSessionBundle> = (async () => {
            // The npm alias points to onnxruntime-web@1.30.0 at runtime.
            // Its generated types.d.ts is not exposed as a TS module, so TypeScript
            // cannot type-check this package name directly on Vercel. The runtime
            // module is still valid and is bundled normally by Next.js.
            // @ts-ignore onnxruntime-web-upscaler is an npm alias whose generated
            // types.d.ts is not recognized as an external TS module by Vercel TS.
            const ort = await import("onnxruntime-web-upscaler");
            // Next.js does not ship ORT's .wasm/.mjs runtime files, so tell ORT where
            // to load them from. This is the dedicated 1.30.x Upscaler runtime.
            // To self-host instead: copy the alias package
            // node_modules/onnxruntime-web-upscaler/dist/*.wasm and *.mjs into
            // /public/ort/ and use ort.env.wasm.wasmPaths = "/ort/".
            // Hide ORT's harmless internal warnings (they show up as red "Console
            // Error" overlays in Next.js dev mode). Real errors are still reported.
            ort.env.logLevel = "error";
            const version = ort.env.versions.web;
            if (version) {
                ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${version}/dist/`;
            }
            // Multi-threaded WASM only works on cross-origin isolated pages.
            if (typeof crossOriginIsolated !== "undefined" && crossOriginIsolated) {
                ort.env.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency || 2);
            }
            const bytes = await loadModelBytes(MODEL_URL, onDownload);
            const createSession = (provider: InferenceDevice) => ort.InferenceSession.create(bytes, {
                executionProviders: [provider],
                graphOptimizationLevel: "all",
                logSeverityLevel: 3, // 3 = errors only (no "nodes not assigned" warning)
            });
            const preferred: InferenceDevice = deviceRef.current ??
                (typeof navigator !== "undefined" && "gpu" in navigator
                    ? "webgpu"
                    : "wasm");
            try {
                const session = await createSession(preferred);
                deviceRef.current = preferred;
                return { ort, session };
            }
            catch (err) {
                if (preferred === "webgpu") {
                    // WebGPU could not start: fall back to WASM automatically.
                    deviceRef.current = "wasm";
                    return { ort, session: await createSession("wasm") };
                }
                throw err;
            }
        })().catch((err) => {
            if (pipelineRef.current?.promise === promise) {
                pipelineRef.current = null;
            }
            throw err;
        });
        pipelineRef.current = { promise };
        return promise;
    };
    /** Runs the model on one planar RGB input [1, 3, h, w] (0..1). */
    const runModel = async ({ ort, session }: OrtSessionBundle, input: Float32Array, width: number, height: number): Promise<TileResult> => {
        const tensor = new ort.Tensor("float32", input, [1, 3, height, width]);
        const outputs = await session.run({ [session.inputNames[0]]: tensor });
        const output = outputs[session.outputNames[0]];
        const data = (await output.getData()) as Float32Array;
        const [, , outH, outW] = output.dims;
        return { data, width: outW, height: outH };
    };
    /** Runs one tile. If WebGPU fails, retries once on the CPU (WASM). */
    const runTile = async (input: Float32Array, width: number, height: number): Promise<TileResult> => {
        try {
            return await runModel(await getPipeline(), input, width, height);
        }
        catch (err) {
            if (deviceRef.current === "webgpu") {
                deviceRef.current = "wasm";
                disposePipeline();
                return runModel(await getPipeline(), input, width, height);
            }
            throw err;
        }
    };
    /* ------------------------------ File handling ---------------------------- */
    const handleFile = async (file: File) => {
        if (isProcessingRef.current)
            return;
        setError("");
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setError("Unsupported file type. Please upload a JPG, PNG, WebP, BMP, or AVIF image.");
            return;
        }
        if (file.size === 0) {
            setError("This file is empty. Please choose another image.");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setError(`This file is ${formatFileSize(file.size)}. The maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`);
            return;
        }
        const token = (loadTokenRef.current += 1);
        const url = URL.createObjectURL(file);
        try {
            const img = await loadImage(url);
            if (token !== loadTokenRef.current || !mountedRef.current) {
                URL.revokeObjectURL(url);
                return;
            }
            if (!img.naturalWidth || !img.naturalHeight) {
                throw new Error("IMAGE_LOAD_FAILED");
            }
            clearObjectUrl();
            clearResult();
            objectUrlRef.current = url;
            sourceImageRef.current = img;
            setSelectedFile(file);
            setPreviewUrl(url);
            setSourceDims({ width: img.naturalWidth, height: img.naturalHeight });
            setProgress(0);
        }
        catch (err) {
            URL.revokeObjectURL(url);
            if (token === loadTokenRef.current && mountedRef.current) {
                setError(getFriendlyError(err));
            }
        }
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Allow selecting the same file again after a reset.
        e.target.value = "";
        if (file)
            void handleFile(file);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file)
            void handleFile(file);
    };
    // Keep the paste listener pointed at the latest handler.
    useEffect(() => {
        handleFileRef.current = handleFile;
    });
    useEffect(() => {
        mountedRef.current = true;
        const handlePaste = (e: ClipboardEvent) => {
            const file = e.clipboardData?.files?.[0];
            if (file && file.type.startsWith("image/")) {
                void handleFileRef.current(file);
            }
        };
        window.addEventListener("paste", handlePaste);
        return () => {
            mountedRef.current = false;
            window.removeEventListener("paste", handlePaste);
            abortRef.current?.abort();
            abortRef.current = null;
            runIdRef.current += 1;
            loadTokenRef.current += 1;
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = "";
            }
            if (resultRef.current) {
                URL.revokeObjectURL(resultRef.current.url);
                resultRef.current = null;
            }
            disposePipeline();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    /* -------------------------------- Actions -------------------------------- */
    const handleCancel = () => {
        abortRef.current?.abort();
        abortRef.current = null;
        runIdRef.current += 1;
        isProcessingRef.current = false;
        setIsProcessing(false);
        setStatusText("");
        setProgress(0);
    };
    const handleReset = () => {
        handleCancel();
        loadTokenRef.current += 1;
        clearObjectUrl();
        clearResult();
        sourceImageRef.current = null;
        setSelectedFile(null);
        setPreviewUrl("");
        setSourceDims(null);
        setScale("2x");
        setOutputFormat("Original");
        setError("");
        setIsDownloading(false);
        setIsDragging(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    const factor = scale === "4x" ? 4 : 2;
    const outputDims: Dimensions | null = sourceDims
        ? { width: sourceDims.width * factor, height: sourceDims.height * factor }
        : null;
    const exceedsLimit = outputDims
        ? outputDims.width * outputDims.height > MAX_OUTPUT_PIXELS ||
            Math.max(outputDims.width, outputDims.height) > MAX_OUTPUT_SIDE
        : false;
    const handleUpscale = async () => {
        const sourceImg = sourceImageRef.current;
        if (!selectedFile || !sourceImg || isProcessingRef.current)
            return;
        if (exceedsLimit) {
            setError(`The ${scale} result would be too large for your browser. Choose a smaller scale or a smaller image.`);
            return;
        }
        setError("");
        const runId = (runIdRef.current += 1);
        const controller = new AbortController();
        abortRef.current = controller;
        isProcessingRef.current = true;
        lastPercentRef.current = -1;
        setIsProcessing(true);
        setProgress(0);
        setStatusText("Loading AI model…");
        const startedAt = performance.now();
        const targetFactor = scale === "4x" ? 4 : 2;
        const sourceWidth = sourceImg.naturalWidth;
        const sourceHeight = sourceImg.naturalHeight;
        const targetWidth = sourceWidth * targetFactor;
        const targetHeight = sourceHeight * targetFactor;
        const isStale = () => controller.signal.aborted ||
            runId !== runIdRef.current ||
            !mountedRef.current;
        const assertActive = () => {
            if (isStale())
                throw new DOMException("Upscale cancelled", "AbortError");
        };
        try {
            // 1) Load (and on first use, download) the model.
            await getPipeline((percent) => {
                if (isStale())
                    return;
                setStatusText("Downloading AI model… (first time only)");
                setProgress(percent);
            });
            assertActive();
            const keepAlpha = hasTransparency(sourceImg, selectedFile.type);
            // 2) Prepare the output canvas.
            const outCanvas = document.createElement("canvas");
            outCanvas.width = targetWidth;
            outCanvas.height = targetHeight;
            const outCtx = outCanvas.getContext("2d", {
                willReadFrequently: keepAlpha,
            });
            if (!outCtx)
                throw new Error("EXPORT_FAILED");
            outCtx.imageSmoothingEnabled = true;
            outCtx.imageSmoothingQuality = "high";
            const tileInCanvas = document.createElement("canvas");
            const tileInCtx = tileInCanvas.getContext("2d", {
                willReadFrequently: true,
            });
            const tileOutCanvas = document.createElement("canvas");
            const tileOutCtx = tileOutCanvas.getContext("2d");
            if (!tileInCtx || !tileOutCtx)
                throw new Error("EXPORT_FAILED");
            // 3) Enhance the image. Small images run in ONE piece (no seams at all),
            //    bigger ones are processed tile by tile with extra context around
            //    each tile so the joints stay invisible.
            const wholeImage = Math.max(sourceWidth, sourceHeight) <= WHOLE_IMAGE_MAX_SIDE;
            const tileSize = wholeImage
                ? Math.max(sourceWidth, sourceHeight)
                : TILE_SIZE;
            const tileOverlap = wholeImage ? 0 : TILE_OVERLAP;
            const cols = Math.ceil(sourceWidth / tileSize);
            const rows = Math.ceil(sourceHeight / tileSize);
            const totalTiles = cols * rows;
            let doneTiles = 0;
            lastPercentRef.current = -1;
            setProgress(0);
            setStatusText("Enhancing image…");
            for (let row = 0; row < rows; row += 1) {
                for (let col = 0; col < cols; col += 1) {
                    assertActive();
                    const x = col * tileSize;
                    const y = row * tileSize;
                    const coreW = Math.min(tileSize, sourceWidth - x);
                    const coreH = Math.min(tileSize, sourceHeight - y);
                    // Extra context around the tile avoids visible seams.
                    const sx0 = Math.max(0, x - tileOverlap);
                    const sy0 = Math.max(0, y - tileOverlap);
                    const sx1 = Math.min(sourceWidth, x + coreW + tileOverlap);
                    const sy1 = Math.min(sourceHeight, y + coreH + tileOverlap);
                    const sw = sx1 - sx0;
                    const sh = sy1 - sy0;
                    tileInCanvas.width = sw;
                    tileInCanvas.height = sh;
                    tileInCtx.drawImage(sourceImg, sx0, sy0, sw, sh, 0, 0, sw, sh);
                    // Canvas RGBA -> planar RGB float tensor input [1, 3, H, W] (0..1).
                    const input = imageDataToPlanarRgb(tileInCtx.getImageData(0, 0, sw, sh));
                    const tile = await runTile(input, sw, sh);
                    assertActive();
                    // Model output (planar RGB, 0..1) -> canvas ImageData (0..255).
                    const { width: tw, height: th, data } = tile;
                    const imageData = tileOutCtx.createImageData(tw, th);
                    const out = imageData.data;
                    const plane = tw * th;
                    for (let i = 0; i < plane; i += 1) {
                        const d = i * 4;
                        out[d] = toByte(data[i]);
                        out[d + 1] = toByte(data[plane + i]);
                        out[d + 2] = toByte(data[2 * plane + i]);
                        out[d + 3] = 255;
                    }
                    tileOutCanvas.width = tw;
                    tileOutCanvas.height = th;
                    tileOutCtx.putImageData(imageData, 0, 0);
                    // Copy only the tile core (without the context margin) to the result,
                    // scaled to the requested size (4x stays 1:1, 2x is shrunk by half).
                    const modelScale = tw / sw;
                    outCtx.drawImage(tileOutCanvas, (x - sx0) * modelScale, (y - sy0) * modelScale, coreW * modelScale, coreH * modelScale, x * targetFactor, y * targetFactor, coreW * targetFactor, coreH * targetFactor);
                    doneTiles += 1;
                    const percent = Math.min(99, Math.round((doneTiles / totalTiles) * 100));
                    if (percent !== lastPercentRef.current) {
                        lastPercentRef.current = percent;
                        setProgress(percent);
                    }
                    // Let the browser paint progress between tiles.
                    await nextTick();
                }
            }
            // 4) Finish: restore transparency and encode.
            setStatusText("Finalizing image…");
            setProgress(99);
            if (keepAlpha)
                restoreAlpha(outCanvas, outCtx, sourceImg);
            const blob = await canvasToBlob(outCanvas, "image/png");
            assertActive();
            const url = URL.createObjectURL(blob);
            clearResult();
            resultRef.current = { url, blob };
            setResult({
                url,
                width: targetWidth,
                height: targetHeight,
                scale,
                durationMs: performance.now() - startedAt,
                hasAlpha: keepAlpha,
            });
            setProgress(100);
        }
        catch (err) {
            const wasCancelled = isStale() ||
                (err instanceof DOMException && err.name === "AbortError") ||
                (err instanceof Error && /abort|cancel/i.test(err.message));
            if (!wasCancelled) {
                console.error("Image upscale failed:", err);
                // Rebuild the engine next time if memory / GPU state may be corrupted.
                if (isMemoryError(err))
                    disposePipeline();
                if (mountedRef.current)
                    setError(getFriendlyError(err));
            }
        }
        finally {
            if (runId === runIdRef.current && mountedRef.current) {
                isProcessingRef.current = false;
                abortRef.current = null;
                setIsProcessing(false);
                setStatusText("");
            }
        }
    };
    const handleDownload = async () => {
        const stored = resultRef.current;
        if (!stored || !result || !selectedFile || isDownloading)
            return;
        setError("");
        setIsDownloading(true);
        try {
            const target = getExportTarget(outputFormat, selectedFile.type);
            const blob = await encodeForExport(stored.url, stored.blob, target);
            triggerDownload(blob, buildFileName(selectedFile.name, result.scale, target.extension));
        }
        catch (err) {
            console.error("Image export failed:", err);
            if (mountedRef.current)
                setError(getFriendlyError(err));
        }
        finally {
            if (mountedRef.current)
                setIsDownloading(false);
        }
    };
    /* --------------------------------- Derived ------------------------------- */
    const exportTarget = getExportTarget(outputFormat, selectedFile?.type ?? "");
    const canUpscale = Boolean(selectedFile) && !isProcessing && !exceedsLimit;
    const canDownload = Boolean(result) && !isProcessing && !isDownloading;
    const scaleChangedSinceResult = Boolean(result) && result?.scale !== scale;
    const statusPill = isProcessing
        ? {
            label: "Processing",
            className: "bg-amber-50 text-amber-600 font-semibold",
        }
        : result
            ? {
                label: "Done",
                className: "bg-emerald-50 text-emerald-600 font-semibold",
            }
            : selectedFile
                ? {
                    label: "Ready",
                    className: "bg-emerald-50 text-emerald-600 font-semibold",
                }
                : { label: "Empty", className: "bg-gray-100 text-gray-400" };
    /* ---------------------------------- Render -------------------------------- */
    return (<div id="image-upscaler-tool" className="w-full space-y-5 text-[#0F172A] font-sans">
      {/* Pointer cursor on every clickable element of this tool */}
      <style>{`
        #image-upscaler-tool a[href],
        #image-upscaler-tool button:not(:disabled),
        #image-upscaler-tool label:has(input[type="file"]),
        #image-upscaler-tool summary,
        #image-upscaler-tool [role="button"],
        #image-upscaler-tool select,
        #image-upscaler-tool input[type="color"],
        #image-upscaler-tool input[type="range"],
        #image-upscaler-tool input[type="checkbox"],
        #image-upscaler-tool input[type="radio"],
        #image-upscaler-tool input[type="file"] {
          cursor: pointer;
        }

        #image-upscaler-tool button:disabled {
          cursor: not-allowed;
        }
      `}</style>

      <input ref={fileInputRef} type="file" accept={ACCEPT_ATTRIBUTE} className="hidden" onChange={handleFileChange}/>

      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <Link href="/sohoj-tools" className="flex items-center gap-1 hover:text-[#0F172A] transition-colors">
          <ArrowLeft size={14}/>
          <span><UpscalerText>{"Sohoj Tools"}</UpscalerText></span>
        </Link>
        <span><UpscalerText>{"/"}</UpscalerText></span>
        <span><UpscalerText>{"Image Tools"}</UpscalerText></span>
        <span><UpscalerText>{"/"}</UpscalerText></span>
        <span className="font-semibold text-[#0F172A]"><UpscalerText>{"Image Upscaler"}</UpscalerText></span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 bg-[#F8FAFC] text-[#2563EB] rounded-xl flex items-center justify-center shrink-0 border border-[#E2E8F0]">
            <Sparkles size={24}/>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-[#0F172A]"><UpscalerText>{"Image Upscaler\n              "}</UpscalerText></h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full"><UpscalerText>{"Free\n              "}</UpscalerText></span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5"><UpscalerText>{"Enlarge images up to 4x while keeping your workflow simple and\n              clean.\n            "}</UpscalerText></p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button type="button" className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100" aria-label={UL("Add to favorites")}>
            <Star size={16}/>
          </button>
          <button type="button" className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100" aria-label={UL("Share tool")}>
            <Share2 size={16}/>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Controls */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-5 self-start">
          {/* Scale Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold text-[#0F172A]"><UpscalerText>{"Upscale by"}</UpscalerText></h2>
              <span className="text-[10px] font-medium text-gray-400"><UpscalerText>{"Choose output size\n              "}</UpscalerText></span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(["2x", "4x"] as ScaleOption[]).map((option) => (<button key={option} type="button" disabled={isProcessing} onClick={() => setScale(option)} className={`py-3 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${scale === option
                ? "border-[#2563EB] bg-[#F8FAFC]/40 text-[#2563EB] shadow-2xs"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                  <div className="w-6 h-6 rounded-lg border border-current/30 flex items-center justify-center">
                    <Zap size={13}/>
                  </div>
                  <span>{option}</span>
                </button>))}
            </div>

            {outputDims && (<p className={`text-[10px] leading-relaxed ${exceedsLimit ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                {exceedsLimit
            ? <UpscalerText>{`${outputDims.width} × ${outputDims.height} px is over the 4096 × 4096 px browser limit. Choose 2x or use a smaller image.`}</UpscalerText> : <UpscalerText>{`Output size: ${outputDims.width} × ${outputDims.height} px`}</UpscalerText>}
              </p>)}
          </div>

          {/* Output Format Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#0F172A]"><UpscalerText>{"Output format"}</UpscalerText></h2>
            <div className="grid grid-cols-4 gap-2">
              {(["Original", "PNG", "JPG", "WebP"] as OutputFormat[]).map((format) => (<button key={format} type="button" onClick={() => setOutputFormat(format)} className={`py-2.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${outputFormat === format
                ? "border-[#2563EB] bg-[#F8FAFC]/40 text-[#2563EB] font-bold shadow-2xs"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                    <span className="text-[10px] font-bold leading-tight">
                      {format === "Original" ? <UpscalerText>{format}</UpscalerText> : format}
                    </span>
                  </button>))}
            </div>
            {selectedFile && outputFormat === "Original" && (<p className="text-[10px] text-gray-400 leading-relaxed"><UpscalerText>{"Original will download as "}</UpscalerText>{exportTarget.label}<UpscalerText>{".\n              "}</UpscalerText></p>)}
            {result?.hasAlpha && exportTarget.mime === TARGET_JPG.mime && (<p className="text-[10px] text-amber-600 leading-relaxed"><UpscalerText>{"JPG doesn&apos;t support transparency. Transparent areas will\n                turn white. Choose PNG or WebP to keep them.\n              "}</UpscalerText></p>)}
          </div>

          {/* Quick Info Card */}
          <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-gray-100 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white border border-gray-100 text-[#2563EB] flex items-center justify-center shrink-0">
                <CheckCircle2 size={15}/>
              </div>
              <p className="text-[10px] font-bold text-[#0F172A]"><UpscalerText>{"Private &amp; on-device\n              "}</UpscalerText></p>
            </div>
            <p className="text-[10px] leading-relaxed text-gray-500"><UpscalerText>{"Your image is processed in your browser and is never uploaded. The\n              AI model downloads once on first use and is cached after that. It\n              also removes noise and JPEG blockiness, so larger images take more\n              time.\n            "}</UpscalerText></p>
          </div>

          {/* Error Banner */}
          {error && (<div role="alert" className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-3.5 py-3 flex items-start gap-2.5">
              <AlertTriangle size={15} className="shrink-0 mt-0.5"/>
              <p className="text-[10px] leading-relaxed font-medium flex-1">
                {translateUpscalerText(error, locale, baseL)}
              </p>
              <button type="button" onClick={() => setError("")} className="shrink-0 text-red-400 hover:text-red-600 transition-colors" aria-label={UL("Dismiss error")}>
                <X size={14}/>
              </button>
            </div>)}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={handleReset} className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5">
              <RotateCcw size={13}/><UpscalerText>{"Reset\n            "}</UpscalerText></button>
            <button type="button" disabled={!canUpscale} onClick={() => void handleUpscale()} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${canUpscale
            ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs cursor-pointer"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              {isProcessing ? (<>
                  <Loader2 size={14} className="animate-spin"/><UpscalerText>{"Upscaling\u2026"}</UpscalerText>{<UpscalerText>{" "}</UpscalerText>}
                  {progress > 0 ? <UpscalerText>{`${progress}%`}</UpscalerText> : <UpscalerText>{""}</UpscalerText>}
                </>) : (<>
                  <Sparkles size={14}/>{<UpscalerText>{" "}</UpscalerText>}
                  {result ? <UpscalerText>{"Upscale again"}</UpscalerText> : <UpscalerText>{"Upscale image"}</UpscalerText>}
                </>)}
            </button>
          </div>

          <button type="button" disabled={!canDownload} onClick={() => void handleDownload()} className={`w-full py-2.5 border text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${canDownload
            ? "border-[#2563EB] bg-white text-[#2563EB] hover:bg-blue-50/50 cursor-pointer"
            : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"}`}>
            {isDownloading ? (<>
                <Loader2 size={14} className="animate-spin"/><UpscalerText>{"Preparing\n                download\u2026\n              "}</UpscalerText></>) : (<>
                <Download size={14}/>{<UpscalerText>{" "}</UpscalerText>}
                {result ? <UpscalerText>{`Download ${exportTarget.label}`}</UpscalerText> : <UpscalerText>{"Download"}</UpscalerText>}
              </>)}
          </button>
        </div>

        {/* Right Preview */}
        <div className="lg:col-span-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 min-h-[520px] flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold text-[#0F172A]"><UpscalerText>{"Image preview\n                "}</UpscalerText></h2>
                <p className="text-[10px] text-gray-400 mt-0.5"><UpscalerText>{"Compare the source and enlarged result here.\n                "}</UpscalerText></p>
              </div>

              <div className="flex items-center gap-2">
                {selectedFile && (<button type="button" disabled={isProcessing} onClick={() => fileInputRef.current?.click()} className="text-[10px] bg-[#F8FAFC] text-[#2563EB] hover:bg-blue-50 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all border border-gray-100 disabled:opacity-60 disabled:cursor-not-allowed">
                    <Upload size={12}/><UpscalerText>{"Change Image\n                  "}</UpscalerText></button>)}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusPill.className}`}>
                  {translateUpscalerText(statusPill.label, locale, baseL)}
                </span>
              </div>
            </div>

            {!selectedFile ? (<div onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} role="button" tabIndex={0} onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                }
            }} className={`bg-[#F8FAFC] border border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center flex-1 min-h-[430px] cursor-pointer transition-all ${isDragging
                ? "border-[#2563EB] bg-blue-50/60 scale-[0.99]"
                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/20"}`}>
                <div className="w-16 h-16 bg-white text-[#2563EB] rounded-2xl flex items-center justify-center mb-4 border border-gray-100 shadow-xs">
                  <ImageIcon size={30}/>
                </div>
                <span className="text-sm font-bold text-[#0F172A] block"><UpscalerText>{"Click or drag an image here\n                "}</UpscalerText></span>
                <span className="text-[10px] text-gray-400 mt-1.5 max-w-sm leading-relaxed"><UpscalerText>{"Upload a JPG, PNG, or WebP image up to"}</UpscalerText>{<UpscalerText>{" "}</UpscalerText>}
                  {formatFileSize(MAX_FILE_SIZE)}<UpscalerText>{"and enlarge it 2x or 4x right\n                  in your browser.\n                "}</UpscalerText></span>
                <button type="button" onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
            }} className="mt-4 px-4 py-2 bg-white border border-gray-200 text-[#2563EB] hover:border-blue-200 hover:bg-blue-50/40 text-[10px] font-bold rounded-xl transition-all flex items-center gap-1.5">
                  <Upload size={13}/><UpscalerText>{"Choose image\n                "}</UpscalerText></button>
                <span className="text-[10px] text-gray-400 mt-4 font-medium"><UpscalerText>{"Or press Ctrl+V to paste a copied image\n                "}</UpscalerText></span>
              </div>) : (<div className="flex-1 min-h-[430px] flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  {/* Before */}
                  <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-3 flex flex-col min-h-[280px]">
                    <div className="flex items-center justify-between gap-2 mb-3 px-1">
                      <span className="text-[10px] font-bold text-[#0F172A]"><UpscalerText>{"Before\n                      "}</UpscalerText></span>
                      <span className="text-[9px] font-medium text-gray-400 px-2 py-0.5 rounded-full bg-white border border-gray-100">
                        {sourceDims
            ? <UpscalerText>{`${sourceDims.width} × ${sourceDims.height} px`}</UpscalerText> : <UpscalerText>{"Original"}</UpscalerText>}
                      </span>
                    </div>
                    <div className="flex-1 bg-white border border-gray-100 rounded-xl p-2 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt={UL("Selected image preview")} className="max-h-[320px] max-w-full w-auto object-contain rounded-lg"/>
                    </div>
                  </div>

                  {/* After */}
                  <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-3 flex flex-col min-h-[280px]">
                    <div className="flex items-center justify-between gap-2 mb-3 px-1">
                      <span className="text-[10px] font-bold text-[#0F172A]"><UpscalerText>{"After\n                      "}</UpscalerText></span>
                      <span className="text-[9px] font-bold text-[#2563EB] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100">
                        {result
            ? <UpscalerText>{`${result.width} × ${result.height} px`}</UpscalerText> : <UpscalerText>{`${scale} Preview`}</UpscalerText>}
                      </span>
                    </div>

                    <div className="flex-1 bg-white border border-gray-100 rounded-xl flex flex-col items-center justify-center px-3 py-2 text-center overflow-hidden">
                      {isProcessing ? (<div className="w-full max-w-[240px] flex flex-col items-center" aria-live="polite">
                          <Loader2 size={28} className="animate-spin text-[#2563EB] mb-3"/>
                          <p className="text-xs font-bold text-[#0F172A]">
                            {translateUpscalerText(statusText || "Working…", locale, baseL)}
                          </p>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                            <div className="h-full bg-[#2563EB] rounded-full transition-all duration-300" style={{ width: `${Math.max(progress, 3)}%` }}/>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 font-medium">
                            {progress > 0 ? <UpscalerText>{`${progress}%`}</UpscalerText> : <UpscalerText>{"Starting…"}</UpscalerText>}
                          </p>
                          <button type="button" onClick={handleCancel} className="mt-3 px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1">
                            <X size={12}/><UpscalerText>{"Cancel\n                          "}</UpscalerText></button>
                        </div>) : result ? (<div className="w-full flex flex-col items-center gap-2">
                          <a href={result.url} target="_blank" rel="noreferrer" title={UL("Open full size in a new tab")} className="block max-w-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={result.url} alt={`Upscaled ${result.scale} result`} className="max-h-[300px] max-w-full w-auto object-contain rounded-lg"/>
                          </a>
                          <p className="text-[9px] text-gray-400 font-medium">
                            {result.scale}<UpscalerText>{"\u00B7 done in"}</UpscalerText>{<UpscalerText>{" "}</UpscalerText>}
                            {formatDuration(result.durationMs)}<UpscalerText>{"\u00B7 click to open\n                            full size\n                          "}</UpscalerText></p>
                        </div>) : (<div className="flex flex-col items-center px-3">
                          <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] text-[#2563EB] flex items-center justify-center mb-3 border border-gray-100">
                            <Sparkles size={22}/>
                          </div>
                          <p className="text-xs font-bold text-[#0F172A]"><UpscalerText>{"Your "}</UpscalerText>{scale}<UpscalerText>{"result will appear here\n                          "}</UpscalerText></p>
                          <p className="text-[10px] text-gray-400 mt-1 max-w-[220px] leading-relaxed"><UpscalerText>{"Press &quot;Upscale image&quot; to enlarge it, then\n                            download it as "}</UpscalerText>{exportTarget.label}<UpscalerText>{".\n                          "}</UpscalerText></p>
                        </div>)}
                    </div>

                    {scaleChangedSinceResult && !isProcessing && (<p className="text-[9px] text-amber-600 font-medium mt-2 px-1"><UpscalerText>{"This result is "}</UpscalerText>{result?.scale}<UpscalerText>{". Press &quot;Upscale\n                        again&quot; to create a "}</UpscalerText>{scale}<UpscalerText>{"version.\n                      "}</UpscalerText></p>)}
                  </div>
                </div>

                {/* Selected file details */}
                <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#0F172A] truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-0.5">
                      {formatFileSize(selectedFile.size)}<UpscalerText>{"\u00B7"}</UpscalerText>{<UpscalerText>{" "}</UpscalerText>}
                      {selectedFile.type || "Image"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg"><UpscalerText>{"Scale: "}</UpscalerText>{scale}
                    </span>
                    <span className="text-[9px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg"><UpscalerText>{"Format: "}</UpscalerText>{outputFormat}
                    </span>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </div>

      {/* Tools in the same category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#0F172A]"><UpscalerText>{"Tools in the same category\n        "}</UpscalerText></h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/sohoj-tools/image-size-reducer" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-[#E2E8F0] transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#F8FAFC] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
              <ImageIcon size={16}/>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors"><UpscalerText>{"Image Size Reducer\n              "}</UpscalerText></h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2"><UpscalerText>{"Shrink JPG, PNG, and WebP photos in your browser while keeping\n                the result clear.\n              "}</UpscalerText></p>
            </div>
          </Link>

          <Link href="/sohoj-tools/image-convert" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-[#E2E8F0] transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#F8FAFC] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
              <ImageIcon size={16}/>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors"><UpscalerText>{"Image Convert\n              "}</UpscalerText></h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2"><UpscalerText>{"Convert images between popular formats with a simple browser\n                workflow.\n              "}</UpscalerText></p>
            </div>
          </Link>

          <Link href="/sohoj-tools/crop-image" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-[#E2E8F0] transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#F8FAFC] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
              <ImageIcon size={16}/>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors"><UpscalerText>{"Crop Image\n              "}</UpscalerText></h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2"><UpscalerText>{"Crop images to a custom area or a fixed aspect ratio directly in\n                the browser.\n              "}</UpscalerText></p>
            </div>
          </Link>
        </div>
      </div>
    </div>);
}
