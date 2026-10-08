"use client";
import { T, useSohozI18n, L } from "@/app/sohoj-tools/_i18n";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Share, Copy, Check, ChevronDown, ChevronUp, ScanText, RotateCcw, ShieldCheck, Upload, Languages, Keyboard, AlertTriangle, } from "lucide-react";
import { createWorker } from "tesseract.js";
/* ========================================================================== */
/* Constants                                                                  */
/* ========================================================================== */
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB hard limit (matches UI copy)
// PROD FIX: strict allow-list instead of `image/*` (which admits SVG, TIFF, HEIC...)
const ACCEPTED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/x-ms-bmp",
    "image/gif",
]);
const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,.bmp,.gif,image/jpeg,image/png,image/webp,image/bmp,image/gif";
const EXTENSION_RE = /\.(jpe?g|png|webp|bmp|gif)$/i;
// Longest side sent to Tesseract. ~A4 @ 300 DPI; anything bigger only costs time/RAM.
const MAX_OCR_DIMENSION = 2500;
// Small JPEG/PNG files are passed through untouched (no re-encode needed).
const SKIP_COMPRESSION_BELOW_BYTES = 1.5 * 1024 * 1024;
const ENGINE_INIT_TIMEOUT_MS = 60000; // engine + traineddata download budget
const WORKER_IDLE_TTL_MS = 2 * 60000; // free WASM/model memory after 2 idle minutes
const LOW_CONFIDENCE_THRESHOLD = 60;
const COPY_FEEDBACK_MS = 2000;
// Matches tesseract.js / fetch failures caused by the network or the CDN.
const NETWORK_ERROR_RE = /network|fetch|traineddata|importscripts|xhr|cors|internet|failed to load/i;
const PROGRESS_LABELS: Record<string, string> = {
    "loading tesseract core": "Loading OCR engine",
    "initializing tesseract": "Loading OCR engine",
    "loading language traineddata": "Downloading language data",
    "loading language traineddata (from cache)": "Loading language data",
    "initializing api": "Preparing OCR engine",
    "recognizing text": "Recognizing text",
};
// Related tools in the same category
const relatedTools = [
    {
        title: "Bijoy ↔ Unicode",
        description: "Convert Bangla text between Bijoy ANSI and Unicode directly in your browser.",
        href: "/sohoj-tools/bijoy-unicode",
        icon: Languages,
    },
    {
        title: "Banglish Typing",
        description: "Type Bangla with an English keyboard — live Banglish to Bangla and Bangla to Banglish conversion in your browser.",
        href: "/sohoj-tools/banglish-typing",
        icon: Keyboard,
    },
];
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40";
/* ========================================================================== */
/* Types & small pure helpers                                                 */
/* ========================================================================== */
type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;
type OcrLogMessage = {
    status: string;
    progress: number;
};
type OcrErrorKind = "network" | "timeout" | "image" | "engine";
class OcrFailure extends Error {
    kind: OcrErrorKind;
    constructor(kind: OcrErrorKind, message: string) {
        super(message);
        this.name = "OcrFailure";
        this.kind = kind;
    }
}
const ERROR_TITLES: Record<OcrErrorKind, string> = {
    network: "Couldn't load language data",
    timeout: "Loading took too long",
    image: "Couldn't read this image",
    engine: "Text extraction failed",
};
const abortError = () => new DOMException("Aborted", "AbortError");
/** Rejects as soon as `signal` aborts, without waiting for `promise`. */
function raceAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        if (signal.aborted)
            return reject(abortError());
        const onAbort = () => reject(abortError());
        signal.addEventListener("abort", onAbort, { once: true });
        promise.then((value) => {
            signal.removeEventListener("abort", onAbort);
            resolve(value);
        }, (err) => {
            signal.removeEventListener("abort", onAbort);
            reject(err);
        });
    });
}
function withTimeout<T>(promise: Promise<T>, ms: number, makeError: () => Error): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(makeError()), ms);
        promise.then((v) => {
            clearTimeout(timer);
            resolve(v);
        }, (e) => {
            clearTimeout(timer);
            reject(e);
        });
    });
}
function toOcrFailure(err: unknown): OcrFailure {
    if (err instanceof OcrFailure)
        return err;
    // tesseract.js sometimes rejects with plain strings, not Error objects
    const message = err instanceof Error ? err.message : String(err);
    if ((typeof navigator !== "undefined" && !navigator.onLine) ||
        NETWORK_ERROR_RE.test(message)) {
        return new OcrFailure("network", "The OCR language data couldn't be downloaded. Check your internet connection and try again.");
    }
    return new OcrFailure("engine", "Something went wrong while reading this image. Try again, or use a clearer image.");
}
function formatProgress(m: OcrLogMessage): string {
    const label = PROGRESS_LABELS[m.status] ?? "Working";
    const showPercent = m.status === "recognizing text" ||
        m.status.startsWith("loading language traineddata");
    return showPercent && typeof m.progress === "number"
        ? `${label}… ${Math.round(m.progress * 100)}%`
        : `${label}…`;
}
/** Returns an error message, or null when the file is acceptable. */
function validateFile(file: File): string | null {
    const typeOk = ACCEPTED_MIME_TYPES.has(file.type) ||
        (!file.type && EXTENSION_RE.test(file.name)); // some OSes give an empty MIME type
    if (!typeOk) {
        return "Unsupported file type. Please upload a JPG, PNG, WebP, BMP, or GIF image.";
    }
    if (file.size === 0)
        return "This file is empty. Please choose another image.";
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return `This file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The maximum allowed size is 50 MB.`;
    }
    return null;
}
/**
 * PROD FIX (performance): downscale + flatten the image before OCR.
 * - Caps the longest side, so a 50MB photo doesn't stall the browser.
 * - Re-encodes WebP/GIF/BMP as PNG (safest formats for Tesseract).
 * - Paints a white background so transparent PNGs don't turn black.
 */
async function prepareImageForOcr(file: File): Promise<Blob> {
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    }
    catch {
        throw new OcrFailure("image", "This image couldn't be decoded. It may be corrupted or too large for your browser.");
    }
    try {
        const scale = Math.min(1, MAX_OCR_DIMENSION / Math.max(bitmap.width, bitmap.height));
        const passThrough = scale === 1 &&
            file.size <= SKIP_COMPRESSION_BELOW_BYTES &&
            (file.type === "image/jpeg" || file.type === "image/png");
        if (passThrough)
            return file;
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Canvas 2D context unavailable");
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(bitmap, 0, 0, width, height);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        canvas.width = canvas.height = 0; // release the canvas backing store immediately
        if (!blob)
            throw new Error("Canvas export failed");
        return blob;
    }
    catch (err) {
        if (err instanceof OcrFailure)
            throw err;
        throw new OcrFailure("image", "This image couldn't be prepared for scanning. Try a smaller or different image.");
    }
    finally {
        bitmap.close(); // PROD FIX: free the decoded pixels right away
    }
}
/** Clipboard fallback for non-secure contexts / older browsers. */
function legacyCopy(text: string): boolean {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    let ok = false;
    try {
        ok = document.execCommand("copy");
    }
    catch {
        ok = false;
    }
    document.body.removeChild(el);
    return ok;
}
/* ========================================================================== */
/* Hooks                                                                      */
/* ========================================================================== */
/**
 * PROD FIX (memory): the object URL is created and revoked in one effect, so it
 * is released on every file change AND on unmount (also safe in Strict Mode).
 */
function useObjectUrl(file: File | null): string | null {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        if (!file) {
            setUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);
    return url;
}
/** Copy with visible + screen-reader feedback; timers are cleared on unmount. */
function useCopyFeedback() {
    const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => {
        if (timerRef.current)
            clearTimeout(timerRef.current);
    }, []);
    const copy = useCallback(async (text: string) => {
        let ok = false;
        try {
            await navigator.clipboard.writeText(text);
            ok = true;
        }
        catch {
            ok = legacyCopy(text);
        }
        setStatus(ok ? "copied" : "failed");
        if (timerRef.current)
            clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setStatus("idle"), COPY_FEEDBACK_MS);
    }, []);
    return { status, copy };
}
/**
 * All OCR/worker lifecycle logic lives here:
 * - one Tesseract worker is reused while the language stays the same
 * - cancel / new run / unmount terminate the worker (the only way to stop recognize())
 * - idle workers are terminated after WORKER_IDLE_TTL_MS
 * - a run id guards against stale async results updating state
 */
function useOcr() {
    const [text, setText] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [progressMessage, setProgressMessage] = useState<string>("");
    const [error, setError] = useState<OcrFailure | null>(null);
    const [noTextFound, setNoTextFound] = useState<boolean>(false);
    const [confidence, setConfidence] = useState<number | null>(null);
    const workerRef = useRef<{
        key: string;
        worker: TesseractWorker;
    } | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const runIdRef = useRef<number>(0);
    // Worker logger is bound once at creation, so it forwards to this swappable ref.
    const progressRef = useRef<(m: OcrLogMessage) => void>(() => { });
    const clearIdleTimer = () => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
    };
    const disposeWorker = useCallback(async () => {
        clearIdleTimer();
        const current = workerRef.current;
        workerRef.current = null;
        if (!current)
            return;
        try {
            await current.worker.terminate();
        }
        catch {
            /* already terminated */
        }
    }, []);
    const scheduleIdleDispose = () => {
        clearIdleTimer();
        idleTimerRef.current = setTimeout(() => void disposeWorker(), WORKER_IDLE_TTL_MS);
    };
    const getWorker = async (lang: string, signal: AbortSignal) => {
        const cached = workerRef.current;
        if (cached && cached.key === lang)
            return cached.worker; // PROD FIX: reuse
        await disposeWorker(); // language changed: drop the old worker
        const langs = lang.split("+");
        // Self-hosting the language files removes the CDN dependency entirely:
        //   { langPath: "/tessdata", ... } (put eng/ben .traineddata.gz in /public/tessdata)
        const creation = createWorker(langs, 1, {
            logger: (m: OcrLogMessage) => progressRef.current(m),
        });
        try {
            const worker = await withTimeout(raceAbort(creation, signal), ENGINE_INIT_TIMEOUT_MS, () => new OcrFailure("timeout", "Downloading the OCR language data is taking too long. Check your connection and try again."));
            workerRef.current = { key: lang, worker };
            return worker;
        }
        catch (err) {
            // PROD FIX: if creation finishes after a cancel/timeout, don't leak the worker
            creation.then((w) => w.terminate()).catch(() => { });
            throw err;
        }
    };
    const cancel = useCallback(() => {
        runIdRef.current += 1; // invalidates the in-flight run
        abortRef.current?.abort();
        abortRef.current = null;
        void disposeWorker(); // actually stops recognition inside the worker
        setIsProcessing(false);
        setProgressMessage("");
    }, [disposeWorker]);
    const reset = useCallback(() => {
        cancel();
        setText("");
        setError(null);
        setNoTextFound(false);
        setConfidence(null);
    }, [cancel]);
    const run = useCallback(async (file: File, lang: string) => {
        if (abortRef.current)
            cancel(); // never run two jobs on one worker
        const runId = ++runIdRef.current;
        const isCurrent = () => runIdRef.current === runId;
        const controller = new AbortController();
        abortRef.current = controller;
        clearIdleTimer();
        setIsProcessing(true);
        setError(null);
        setNoTextFound(false);
        setConfidence(null);
        setText("");
        setProgressMessage("Preparing image…");
        try {
            const image = await raceAbort(prepareImageForOcr(file), controller.signal);
            progressRef.current = (m) => {
                if (isCurrent())
                    setProgressMessage(formatProgress(m));
            };
            setProgressMessage("Loading OCR engine…");
            const worker = await getWorker(lang, controller.signal);
            const { data } = await raceAbort(worker.recognize(image), controller.signal);
            if (!isCurrent())
                return;
            // Normalise line endings and trim stray whitespace
            const cleaned = (data.text ?? "").replace(/\r\n/g, "\n").trim();
            if (!cleaned) {
                setNoTextFound(true); // PROD FIX: friendly empty state, not a blank box
            }
            else {
                setText(cleaned);
                if (typeof data.confidence === "number")
                    setConfidence(data.confidence);
            }
            scheduleIdleDispose();
        }
        catch (err) {
            // Cancelled or superseded: cancel() already cleaned up, stay silent
            if (!isCurrent() || controller.signal.aborted)
                return;
            console.error("[ImageToText] OCR failed:", err);
            void disposeWorker(); // worker may be in a bad state after a failure
            setError(toOcrFailure(err)); // PROD FIX: error state, not text in the result box
        }
        finally {
            if (isCurrent()) {
                abortRef.current = null;
                setIsProcessing(false);
                setProgressMessage("");
            }
        }
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cancel, disposeWorker]);
    // PROD FIX: on unmount abort the job and terminate the worker
    useEffect(() => () => {
        runIdRef.current += 1;
        abortRef.current?.abort();
        if (idleTimerRef.current)
            clearTimeout(idleTimerRef.current);
        const current = workerRef.current;
        workerRef.current = null;
        void current?.worker.terminate().catch(() => { });
    }, []);
    return {
        text,
        setText,
        isProcessing,
        progressMessage,
        error,
        noTextFound,
        confidence,
        run,
        cancel,
        reset,
    };
}
/* ========================================================================== */
/* Component                                                                  */
/* ========================================================================== */
export default function ImageToText() {
    const { L } = useSohozI18n();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const resultRef = useRef<HTMLTextAreaElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isFavorite, setIsFavorite] = useState<boolean>(false);
    const [showHowToUse, setShowHowToUse] = useState<boolean>(false);
    const [selectedLanguage, setSelectedLanguage] = useState<string>("eng+ben");
    const previewUrl = useObjectUrl(selectedFile);
    const ocr = useOcr();
    const copyFeedback = useCopyFeedback();
    const shareFeedback = useCopyFeedback();
    const { isProcessing } = ocr;
    const canFallbackToEnglish = ocr.error?.kind === "network" && selectedLanguage !== "eng";
    // Validate, then swap the file. Any running job is cancelled by ocr.reset().
    const acceptFile = (file: File | undefined) => {
        if (!file || isProcessing)
            return;
        const problem = validateFile(file);
        if (problem) {
            setFileError(problem);
            return;
        }
        setFileError(null);
        ocr.reset();
        setSelectedFile(file);
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        acceptFile(e.target.files?.[0]);
        e.target.value = ""; // allow re-selecting the same file after a reset
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        acceptFile(e.dataTransfer.files?.[0]);
    };
    const handleExtractText = () => {
        if (!selectedFile || isProcessing)
            return;
        void ocr.run(selectedFile, selectedLanguage);
    };
    const handleRetryEnglishOnly = () => {
        if (!selectedFile)
            return;
        setSelectedLanguage("eng");
        void ocr.run(selectedFile, "eng");
    };
    const handleReset = () => {
        ocr.reset();
        setSelectedFile(null); // preview URL is revoked by useObjectUrl
        setFileError(null);
        if (fileInputRef.current)
            fileInputRef.current.value = "";
    };
    const handleCopyText = () => {
        if (!ocr.text)
            return;
        void copyFeedback.copy(ocr.text);
    };
    const handleSelectAll = () => {
        resultRef.current?.focus();
        resultRef.current?.select();
    };
    const handleShare = async () => {
        const url = window.location.href;
        if (typeof navigator.share === "function") {
            try {
                await navigator.share({ title: "Image to Text — Sohoj Tools", url });
            }
            catch {
                /* user dismissed the share sheet */
            }
            return;
        }
        await shareFeedback.copy(url);
    };
    // Status badge in the card header
    const badge = isProcessing
        ? { label: "Processing", cls: "text-[#1D4ED8] bg-[#EFF6FF]" }
        : ocr.error
            ? { label: "Failed", cls: "text-red-600 bg-red-50" }
            : ocr.noTextFound
                ? { label: "No text found", cls: "text-amber-700 bg-amber-50" }
                : ocr.text
                    ? { label: "Completed", cls: "text-[#059669] bg-[#ECFDF5]" }
                    : selectedFile
                        ? { label: "Ready", cls: "text-gray-400 bg-gray-100" }
                        : { label: "Empty", cls: "text-gray-400 bg-gray-100" };
    return (<div className="w-full text-[#0F172A] font-sans pb-16">
      <div className="w-full space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
              <button type="button" onClick={() => router.back()} className={`p-1 hover:bg-[#E2E8F0]/70 rounded-md transition-colors text-[#0F172A] flex items-center justify-center -ml-1 ${focusRing}`} title={L("Go back")} aria-label={L("Go back")}>
                <ArrowLeft size={16}/>
              </button>
              <Link href="/sohoj-tools" className="hover:text-[#0F172A]"><T>{"Sohoj Tools\n              "}</T></Link>
              <span aria-hidden="true"><T>{"/"}</T></span>
              <span className="hover:text-[#0F172A] cursor-pointer"><T>{"Text Tools\n              "}</T></span>
              <span aria-hidden="true"><T>{"/"}</T></span>
              <span className="text-[#0F172A] font-semibold" aria-current="page"><T>{"Image to Text\n              "}</T></span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#EEF2FF] text-[#4F46E5] rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <ScanText size={18}/>
              </div>
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight"><T>{"Image to Text\n              "}</T></h1>
              <span className="bg-[#D1FAE5] text-[#047857] text-[11px] font-bold px-2 py-0.5 rounded-full"><T>{"Free\n              "}</T></span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1"><T>{"Extract text from images with OCR in your browser \u2014 supports\n              English and Bengali.\n            "}</T></p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button type="button" onClick={() => setIsFavorite(!isFavorite)} aria-pressed={isFavorite} aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"} className={`p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-2xs ${focusRing}`}>
              <Star size={16} className={isFavorite ? "fill-[#2563EB] text-[#2563EB]" : ""}/>
            </button>
            <button type="button" onClick={handleShare} aria-label={shareFeedback.status === "copied"
            ? "Link copied"
            : "Share this tool"} className={`p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-[#0F172A] transition-all shadow-2xs ${focusRing}`}>
              {shareFeedback.status === "copied" ? (<Check size={16} className="text-emerald-600"/>) : (<Share size={16}/>)}
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: FILE UPLOAD & OPTIONS */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A] tracking-wide uppercase"><T>{"Files "}</T>{selectedFile ? <T>{"(1)"}</T> : <T>{"(0)"}</T>}
                </span>
                {selectedFile && (<button type="button" onClick={handleReset} disabled={isProcessing} aria-label={L("Remove uploaded file")} className={`text-[11px] font-semibold text-[#64748B] hover:text-[#2563EB] flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-[#64748B] ${focusRing}`}>
                    <RotateCcw size={12}/>
                    <span><T>{"Remove"}</T></span>
                  </button>)}
              </div>

              {/* Hidden input lives outside the conditional so refs and resets always work */}
              <input ref={fileInputRef} type="file" accept={ACCEPT_ATTR} className="hidden" onChange={handleFileChange} disabled={isProcessing} tabIndex={-1} aria-label={L("Upload image file")}/>

              {/* Upload Box */}
              {!selectedFile ? (<div role="button" tabIndex={0} aria-label={`Upload an image. Drop a file here or press Enter to browse. Maximum size 50 megabytes.`} onClick={() => fileInputRef.current?.click()} onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                }
            }} onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
            }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`border-2 border-dashed border-[#93C5FD] transition-all rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center group ${focusRing} ${isDragging
                ? "bg-[#EFF6FF] border-[#2563EB]"
                : "bg-[#EFF6FF]/30 hover:bg-[#EFF6FF]/60"}`}>
                  <div className="w-10 h-10 bg-[#DBEAFE] text-[#2563EB] rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Upload size={20}/>
                  </div>
                  <span className="text-xs font-bold text-[#0F172A] mb-1"><T>{"Drop an image here or click to upload\n                  "}</T></span>
                  <span className="text-[10px] text-gray-400 font-medium"><T>{"JPG, PNG, WebP, BMP, or GIF \u2014 max 50MB\n                  "}</T></span>
                </div>) : (<div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- blob: URLs can't use next/image
            <img src={previewUrl} alt={L("")} decoding="async" className="w-full h-full object-cover"/>)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#0F172A] truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)}<T>{"MB\n                    "}</T></p>
                  </div>
                </div>)}

              {/* PROD FIX: validation feedback (type / size / empty file) */}
              {fileError && (<p role="alert" className="text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 leading-relaxed">
                  {fileError}
                </p>)}

              {/* Language Selection */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <label htmlFor="ocr-language" className="text-[11px] font-bold text-[#0F172A] block"><T>{"OCR Language\n                "}</T></label>
                <select id="ocr-language" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} disabled={isProcessing} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] disabled:opacity-60 disabled:cursor-not-allowed">
                  <option value="eng+ben"><T>{"English + Bengali (\u0989\u09AD\u09AF\u09BC\u0987)"}</T></option>
                  <option value="eng"><T>{"English Only"}</T></option>
                  <option value="ben"><T>{"Bengali Only (\u09AC\u09BE\u0982\u09B2\u09BE)"}</T></option>
                </select>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PREVIEW & RESULT */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[420px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider"><T>{"Image preview & Extracted text\n                  "}</T></span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="pt-4">
                  {!selectedFile ? (<div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-12 h-12 bg-[#EEF2FF] text-[#4F46E5] rounded-xl flex items-center justify-center mb-3">
                        <ScanText size={24}/>
                      </div>
                      <h3 className="text-xs font-bold text-[#0F172A] mb-1"><T>{"Upload an image to extract text\n                      "}</T></h3>
                      <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed"><T>{"Your image preview and extracted text will appear here.\n                      "}</T></p>
                    </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Image Preview */}
                      <div className="p-3 bg-gray-50/50 border border-gray-200/60 rounded-xl flex flex-col items-center justify-center min-h-[250px]">
                        {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- blob: URLs can't use next/image
            <img src={previewUrl} alt={`Preview of ${selectedFile.name}`} decoding="async" className="max-h-[220px] object-contain rounded-lg shadow-2xs"/>)}
                      </div>

                      {/* Right: Extracted Result Area */}
                      <div className="p-3 bg-[#FDFCFB] border border-gray-200/60 rounded-xl flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide"><T>{"Result\n                          "}</T></span>
                          {ocr.text && !isProcessing && (<div className="flex items-center gap-1.5">
                              <button type="button" onClick={handleSelectAll} aria-label={L("Select all extracted text")} className={`text-[11px] font-bold text-gray-500 hover:text-[#0F172A] bg-gray-100 px-2 py-1 rounded-lg transition-colors ${focusRing}`}><T>{"Select all\n                              "}</T></button>
                              <button type="button" onClick={handleCopyText} aria-label={L("Copy extracted text to clipboard")} className={`text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${focusRing} ${copyFeedback.status === "failed"
                    ? "text-red-600 bg-red-50"
                    : "text-emerald-600 hover:text-[#1D4ED8] bg-emerald-50"}`}>
                                {copyFeedback.status === "copied" ? (<Check size={12}/>) : (<Copy size={12}/>)}
                                <span>
                                  {copyFeedback.status === "copied"
                ? <T>{"Copied!"}</T> : copyFeedback.status === "failed"
                ? "Copy failed"
                : "Copy"}
                                </span>
                              </button>
                            </div>)}
                        </div>

                        {/* Screen-reader announcement for copy result */}
                        <span className="sr-only" role="status" aria-live="polite">
                          {copyFeedback.status === "copied"
            ? <T>{"Text copied to clipboard"}</T> : copyFeedback.status === "failed"
            ? "Copy failed. Select the text and copy it manually."
            : ""}
                        </span>

                        <div className="flex-1 overflow-y-auto max-h-[200px]">
                          {isProcessing ? (<div role="status" aria-live="polite" className="flex flex-col items-center justify-center h-full py-12 text-center">
                              <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-2" aria-hidden="true"></div>
                              <p className="text-xs font-semibold text-[#1D4ED8]">
                                {ocr.progressMessage}
                              </p>
                            </div>) : ocr.error ? (
            // PROD FIX: dedicated failure UI with recovery actions
            <div role="alert" className="flex flex-col items-center justify-center h-full py-6 text-center">
                              <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-2">
                                <AlertTriangle size={20}/>
                              </div>
                              <h3 className="text-xs font-bold text-[#0F172A] mb-1">
                                {ERROR_TITLES[ocr.error.kind]}
                              </h3>
                              <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed mb-3">
                                {ocr.error.message}
                              </p>
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                <button type="button" onClick={handleExtractText} className={`px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-[11px] font-bold transition-colors ${focusRing}`}><T>{"Try again\n                                "}</T></button>
                                {canFallbackToEnglish && (<button type="button" onClick={handleRetryEnglishOnly} className={`px-3 py-1.5 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] rounded-lg text-[11px] font-bold transition-colors ${focusRing}`}><T>{"Use English only\n                                  "}</T></button>)}
                              </div>
                            </div>) : ocr.noTextFound ? (
            // PROD FIX: friendly empty-result state
            <div role="status" className="flex flex-col items-center justify-center h-full py-8 text-center">
                              <h3 className="text-xs font-bold text-[#0F172A] mb-1"><T>{"No text found in this image\n                              "}</T></h3>
                              <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed"><T>{"Try a sharper, well-lit image with dark text on\n                                a plain background, and check that the OCR\n                                language matches the text.\n                              "}</T></p>
                            </div>) : ocr.text ? (<textarea ref={resultRef} value={ocr.text} onChange={(e) => ocr.setText(e.target.value)} aria-label={L("Extracted text (editable)")} spellCheck={false} className="w-full h-full min-h-[160px] bg-transparent text-xs font-medium text-[#0F172A] focus:outline-none resize-none leading-relaxed"/>) : (<div className="flex flex-col items-center justify-center h-full py-12 text-center text-gray-400">
                              <p className="text-xs font-medium"><T>{"Click &quot;Extract text&quot; button below to\n                                start OCR conversion.\n                              "}</T></p>
                            </div>)}
                        </div>

                        {ocr.text &&
                !isProcessing &&
                ocr.confidence !== null &&
                ocr.confidence < LOW_CONFIDENCE_THRESHOLD && (<p className="mt-2 text-[10px] font-medium text-amber-700 leading-relaxed"><T>{"Low confidence \u2014 please review the text for\n                              mistakes.\n                            "}</T></p>)}
                      </div>
                    </div>)}
                </div>
              </div>

              {/* Action Button Bar inside the card */}
              {selectedFile && (<div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-500">
                    {isProcessing ? <T>{"Scanning image…"}</T> : <T>{"Ready to scan text"}</T>}
                  </span>
                  <div className="flex items-center gap-2">
                    {isProcessing ? (
            // PROD FIX: user can cancel mid-run (terminates the worker)
            <button type="button" onClick={ocr.cancel} className={`px-3 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] rounded-xl text-xs font-bold transition-colors ${focusRing}`}><T>{"Cancel\n                      "}</T></button>) : (<button type="button" onClick={handleReset} className={`px-3 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] rounded-xl text-xs font-bold transition-colors ${focusRing}`}><T>{"Reset\n                      "}</T></button>)}
                    <button type="button" onClick={handleExtractText} disabled={isProcessing} aria-busy={isProcessing} aria-label={isProcessing
                ? "Extracting text"
                : "Extract text from image"} className={`px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#2563EB] ${focusRing}`}>
                      {isProcessing ? (<span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>) : (<ScanText size={14}/>)}
                      <span>
                        {isProcessing ? <T>{"Extracting…"}</T> : <T>{"Extract text"}</T>}
                      </span>
                    </button>
                  </div>
                </div>)}
            </div>
          </div>
        </div>

        {/* PRIVACY NOTICE */}
        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
          <ShieldCheck size={16} className="text-[#10B981] shrink-0"/>
          <span><T>{"Your files are processed in the browser \u2014 they are not uploaded to\n            any server.\n          "}</T></span>
        </div>

        {/* HOW TO USE DROPDOWN */}
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <button type="button" onClick={() => setShowHowToUse(!showHowToUse)} aria-expanded={showHowToUse} aria-controls="how-to-use-panel" className={`w-full p-4 text-left flex items-center justify-between font-bold text-xs text-[#0F172A] hover:bg-[#F8FAFC]/70 transition-colors ${focusRing}`}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              <span><T>{"How to use"}</T></span>
            </div>
            {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>

          {showHowToUse && (<div id="how-to-use-panel" className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p><T>{"1. Upload an image containing English or Bengali text using the\n                upload box.\n              "}</T></p>
              <p><T>{"2. Select your target OCR language (English, Bengali, or Both).\n              "}</T></p>
              <p><T>{"3. Click the &quot;Extract text&quot; button to scan the image.\n              "}</T></p>
              <p><T>{"4. Copy the recognized text or edit it directly from the result\n                box.\n              "}</T></p>
            </div>)}
        </div>

        {/* TOOLS IN THE SAME CATEGORY */}
        <div className="pt-4 space-y-3">
          <h2 className="text-sm font-bold text-[#0F172A] tracking-tight"><T>{"Tools in the same category\n          "}</T></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool) => {
            const ToolIcon = tool.icon;
            return (<Link key={tool.href} href={tool.href} className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-[#93C5FD] transition-all flex flex-col justify-between group">
                  <div>
                    <div className="w-9 h-9 bg-[#EEF2FF] text-[#4F46E5] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#E0E7FF] transition-colors">
                      <ToolIcon size={18}/>
                    </div>
                    <h3 className="text-xs font-bold text-[#0F172A] mb-1 group-hover:text-[#2563EB] transition-colors">
                      {<T>{tool.title}</T>}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
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
