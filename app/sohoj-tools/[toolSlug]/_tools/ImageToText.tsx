"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Share, Copy, Check, ChevronDown, ChevronUp, ScanText, RotateCcw, ShieldCheck, Upload, Languages, Keyboard, AlertTriangle } from "lucide-react";
import { createWorker } from "tesseract.js";

/* ========================================================================== */
/* Page-local English ↔ Bangla UI translation                                 */
/* ========================================================================== */
const IMAGE_TO_TEXT_BN: Record<string, string> = {
    "sohoj tools": "সহজ টুলস",
    "text tools": "লেখার টুলস",
    "image to text": "ছবি থেকে লেখা",
    "free": "বিনামূল্যে",
    "extract text from images with ocr in your browser — supports english and bengali.": "আপনার ব্রাউজারেই OCR প্রযুক্তির সাহায্যে ছবি থেকে লেখা বের করুন—ইংরেজি ও বাংলা সমর্থিত।",
    "remove from favorites": "পছন্দের তালিকা থেকে সরান",
    "add to favorites": "পছন্দের তালিকায় যোগ করুন",
    "link copied": "লিংক কপি হয়েছে",
    "share this tool": "এই টুলটি শেয়ার করুন",
    "image to text — sohoj tools": "ছবি থেকে লেখা — Sohoj Tools",
    "go back": "পেছনে যান",
    "files": "ফাইল",
    "files ": "ফাইল ",
    "(0)": "(০)",
    "(1)": "(১)",
    "remove": "সরান",
    "remove uploaded file": "আপলোড করা ফাইল সরান",
    "download converted image": "রূপান্তরিত ছবি ডাউনলোড করুন",
    "remove image": "ছবি সরান",
    "extracted text (editable)": "বের করা লেখা (সম্পাদনাযোগ্য)",
    "upload image file": "ছবির ফাইল আপলোড করুন",
    "upload an image. drop a file here or press enter to browse. maximum size 50 megabytes.": "একটি ছবি আপলোড করুন। ফাইল এখানে টেনে আনুন অথবা ফাইল বাছাই করতে Enter চাপুন। সর্বোচ্চ আকার ৫০ MB।",
    "drop an image here or click to upload": "ছবি এখানে টেনে আনুন অথবা আপলোড করতে ক্লিক করুন",
    "jpg, png, webp, bmp, or gif — max 50mb": "JPG, PNG, WebP, BMP অথবা GIF — সর্বোচ্চ ৫০ MB",
    "ocr language": "OCR-এর ভাষা",
    "english + bengali (উভয়ই)": "ইংরেজি + বাংলা (উভয়ই)",
    "english only": "শুধু ইংরেজি",
    "bengali only (বাংলা)": "শুধু বাংলা",
    "image preview & extracted text": "ছবির প্রিভিউ ও বের করা লেখা",
    "processing": "প্রক্রিয়াকরণ চলছে",
    "failed": "ব্যর্থ হয়েছে",
    "no text found": "কোনো লেখা পাওয়া যায়নি",
    "completed": "সম্পন্ন",
    "ready": "প্রস্তুত",
    "converted": "রূপান্তর সম্পন্ন",
    "empty": "খালি",
    "upload an image to extract text": "লেখা বের করতে একটি ছবি আপলোড করুন",
    "your image preview and extracted text will appear here.": "এখানে ছবির প্রিভিউ ও বের করা লেখা দেখা যাবে।",
    "result": "ফলাফল",
    "select all extracted text": "বের করা সব লেখা নির্বাচন করুন",
    "copy extracted text to clipboard": "বের করা লেখা ক্লিপবোর্ডে কপি করুন",
    "select all": "সব নির্বাচন করুন",
    "copied!": "কপি হয়েছে!",
    "copy failed": "কপি করা যায়নি",
    "copy": "কপি করুন",
    "text copied to clipboard": "লেখা ক্লিপবোর্ডে কপি করা হয়েছে",
    "copy failed. select the text and copy it manually.": "কপি করা যায়নি। লেখাটি নির্বাচন করে নিজে কপি করুন।",
    "couldn't load language data": "ভাষার ডেটা লোড করা যায়নি",
    "loading took too long": "লোড হতে অতিরিক্ত সময় লেগেছে",
    "couldn't read this image": "ছবিটি পড়া যায়নি",
    "text extraction failed": "লেখা বের করা যায়নি",
    "the ocr language data couldn't be downloaded. check your internet connection and try again.": "OCR-এর ভাষার ডেটা ডাউনলোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।",
    "downloading the ocr language data is taking too long. check your connection and try again.": "OCR-এর ভাষার ডেটা ডাউনলোড হতে অনেক সময় লাগছে। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।",
    "something went wrong while reading this image. try again, or use a clearer image.": "ছবিটি পড়ার সময় সমস্যা হয়েছে। আবার চেষ্টা করুন অথবা আরও স্পষ্ট ছবি ব্যবহার করুন।",
    "unsupported file type. please upload a jpg, png, webp, bmp, or gif image.": "এই ফাইলের ধরন সমর্থিত নয়। JPG, PNG, WebP, BMP অথবা GIF ছবি আপলোড করুন।",
    "this file is empty. please choose another image.": "ফাইলটি খালি। অন্য একটি ছবি বেছে নিন।",
    "this image couldn't be decoded. it may be corrupted or too large for your browser.": "ছবিটি খোলা যায়নি। ফাইলটি নষ্ট হতে পারে অথবা আপনার ব্রাউজারের জন্য অতিরিক্ত বড় হতে পারে।",
    "this image couldn't be prepared for scanning. try a smaller or different image.": "ছবিটি স্ক্যানের জন্য প্রস্তুত করা যায়নি। ছোট আকারের বা অন্য একটি ছবি দিয়ে চেষ্টা করুন।",
    "preparing image…": "ছবি প্রস্তুত করা হচ্ছে…",
    "loading ocr engine…": "OCR ব্যবস্থা চালু হচ্ছে…",
    "try again": "আবার চেষ্টা করুন",
    "use english only": "শুধু ইংরেজি ব্যবহার করুন",
    "no text found in this image": "এই ছবিতে কোনো লেখা পাওয়া যায়নি",
    "try a sharper, well-lit image with dark text on a plain background, and check that the ocr language matches the text.": "আরও স্পষ্ট ও ভালো আলোতে তোলা ছবি ব্যবহার করুন, যেখানে সাদামাটা পটভূমিতে গাঢ় লেখা রয়েছে। OCR-এর ভাষা ছবির লেখার ভাষার সঙ্গে মিলছে কি না, সেটিও দেখে নিন।",
    "click \"extract text\" button below to start ocr conversion.": "OCR শুরু করতে নিচের “লেখা বের করুন” বাটনে ক্লিক করুন।",
    "low confidence — please review the text for mistakes.": "লেখা শনাক্ত করার নির্ভরযোগ্যতা কম—ভুল আছে কি না, দয়া করে লেখাটি দেখে নিন।",
    "scanning image…": "ছবি স্ক্যান করা হচ্ছে…",
    "ready to scan text": "লেখা স্ক্যানের জন্য প্রস্তুত",
    "extracting text": "লেখা বের করা হচ্ছে",
    "extract text from image": "ছবি থেকে লেখা বের করুন",
    "extracting…": "লেখা বের করা হচ্ছে…",
    "extract text": "লেখা বের করুন",
    "cancel": "বাতিল করুন",
    "reset": "পুনরায় সেট করুন",
    "your files are processed in the browser — they are not uploaded to any server.": "আপনার ফাইল ব্রাউজারেই প্রক্রিয়াকরণ করা হয়—কোনো সার্ভারে আপলোড করা হয় না।",
    "how to use": "ব্যবহারের নিয়ম",
    "1. upload an image containing english or bengali text using the upload box.": "১. আপলোড বক্স ব্যবহার করে ইংরেজি বা বাংলা লেখা থাকা একটি ছবি আপলোড করুন।",
    "2. select your target ocr language (english, bengali, or both).": "২. লেখা শনাক্ত করার ভাষা বেছে নিন—ইংরেজি, বাংলা অথবা উভয়ই।",
    "3. click the \"extract text\" button to scan the image.": "৩. ছবির লেখা স্ক্যান করতে “লেখা বের করুন” বাটনে ক্লিক করুন।",
    "4. copy the recognized text or edit it directly from the result box.": "৪. শনাক্ত করা লেখা কপি করুন অথবা ফলাফলের বাক্সে সরাসরি সম্পাদনা করুন।",
    "tools in the same category": "একই ধরনের টুল",
    "bijoy ↔ unicode": "বিজয় ↔ ইউনিকোড",
    "convert bangla text between bijoy ansi and unicode directly in your browser.": "ব্রাউজারেই বিজয় ANSI ও ইউনিকোডের মধ্যে বাংলা লেখা রূপান্তর করুন।",
    "banglish typing": "বাংলিশ টাইপিং",
    "type bangla with an english keyboard — live banglish to bangla and bangla to banglish conversion in your browser.": "ইংরেজি কিবোর্ডে বাংলা লিখুন—ব্রাউজারেই বাংলিশ থেকে বাংলা এবং বাংলা থেকে বাংলিশে তাৎক্ষণিক রূপান্তর করুন।",
};

function normalizeImageToTextText(value: string): string {
    return value.replace(/&quot;/gi, '"').replace(/&amp;/gi, "&").replace(/&#39;|&apos;/gi, "'").replace(/\\r\\n/g, " ").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}
function toBanglaImageDigits(value: string): string { return value.replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]); }
function translateImageToTextText(value: unknown, locale?: string, fallback?: (value: string) => string): string {
    const raw = String(value ?? "");
    const currentLocale = locale ?? (typeof document !== "undefined" ? document.documentElement.getAttribute("data-locale") ?? "en" : "en");
    if (!currentLocale.toLowerCase().startsWith("bn") || !/[A-Za-z]/.test(raw)) return raw;
    const normalized = normalizeImageToTextText(raw);
    const exact = IMAGE_TO_TEXT_BN[normalized];
    if (exact !== undefined) return exact;
    let match = raw.trim().match(/^this file is ([\d.]+)\s*mb\. the maximum allowed size is 50\s*mb\.?$/i);
    if (match) return `ফাইলটির আকার ${toBanglaImageDigits(match[1])} MB। সর্বোচ্চ অনুমোদিত আকার ৫০ MB।`;
    match = raw.trim().match(/^(loading ocr engine|downloading language data|preparing ocr engine|recognizing text|working)(?:…|\.\.\.)\s*(\d+%?)?$/i);
    if (match) {
        const labels: Record<string, string> = { "loading ocr engine": "OCR ব্যবস্থা চালু হচ্ছে", "downloading language data": "ভাষার ডেটা ডাউনলোড হচ্ছে", "preparing ocr engine": "OCR ব্যবস্থা প্রস্তুত করা হচ্ছে", "recognizing text": "লেখা শনাক্ত করা হচ্ছে", "working": "কাজ চলছে" };
        const percent = match[2] ? ` ${toBanglaImageDigits(match[2])}` : "";
        return `${labels[match[1].toLowerCase()]}…${percent}`;
    }
    match = raw.trim().match(/^preview of (.+)$/i);
    if (match) return `ছবির প্রিভিউ: ${match[1]}`;
    if (fallback) {
        const translated = fallback(raw);
        if (translated && translated !== raw && /[\u0980-\u09FF]/.test(translated)) {
            const withoutKnownTerms = translated.replace(/\b(?:OCR|JPG|PNG|WebP|BMP|GIF|MB|Sohoj Tools|ANSI|Unicode|Banglish|Enter)\b/gi, "");
            if (!/[A-Za-z]{3,}/.test(withoutKnownTerms)) return translated;
        }
    }
    return raw;
}
function ImageToTextT({ children }: { children: React.ReactNode }) {
    const { locale, L: baseL } = useSohozI18n();
    if (typeof children !== "string") return <>{children}</>;
    return <>{translateImageToTextText(children, locale, baseL)}</>;
}

/* ========================================================================== */
/* Constants                                                                  */
/* ========================================================================== */
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/bmp", "image/x-ms-bmp", "image/gif"]);
const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,.bmp,.gif,image/jpeg,image/png,image/webp,image/bmp,image/gif";
const EXTENSION_RE = /\.(jpe?g|png|webp|bmp|gif)$/i;
const MAX_OCR_DIMENSION = 2500;
const SKIP_COMPRESSION_BELOW_BYTES = 1.5 * 1024 * 1024;
const ENGINE_INIT_TIMEOUT_MS = 60000;
const WORKER_IDLE_TTL_MS = 2 * 60000;
const LOW_CONFIDENCE_THRESHOLD = 60;
const COPY_FEEDBACK_MS = 2000;
const NETWORK_ERROR_RE = /network|fetch|traineddata|importscripts|xhr|cors|internet|failed to load/i;
const PROGRESS_LABELS: Record<string, string> = {
    "loading tesseract core": "Loading OCR engine", "initializing tesseract": "Loading OCR engine", "loading language traineddata": "Downloading language data", "loading language traineddata (from cache)": "Loading language data", "initializing api": "Preparing OCR engine", "recognizing text": "Recognizing text",
};
const relatedTools = [
    { title: "Bijoy ↔ Unicode", description: "Convert Bangla text between Bijoy ANSI and Unicode directly in your browser.", href: "/sohoj-tools/bijoy-unicode", icon: Languages },
    { title: "Banglish Typing", description: "Type Bangla with an English keyboard — live Banglish to Bangla and Bangla to Banglish conversion in your browser.", href: "/sohoj-tools/banglish-typing", icon: Keyboard },
];
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/35";

type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;
type OcrLogMessage = { status: string; progress: number };
type OcrErrorKind = "network" | "timeout" | "image" | "engine";
class OcrFailure extends Error {
    kind: OcrErrorKind;
    constructor(kind: OcrErrorKind, message: string) { super(message); this.name = "OcrFailure"; this.kind = kind; }
}
const ERROR_TITLES: Record<OcrErrorKind, string> = { network: "Couldn't load language data", timeout: "Loading took too long", image: "Couldn't read this image", engine: "Text extraction failed" };
const abortError = () => new DOMException("Aborted", "AbortError");
function raceAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        if (signal.aborted) return reject(abortError());
        const onAbort = () => reject(abortError());
        signal.addEventListener("abort", onAbort, { once: true });
        promise.then((value) => { signal.removeEventListener("abort", onAbort); resolve(value); }, (err) => { signal.removeEventListener("abort", onAbort); reject(err); });
    });
}
function withTimeout<T>(promise: Promise<T>, ms: number, makeError: () => Error): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(makeError()), ms);
        promise.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
    });
}
function toOcrFailure(err: unknown): OcrFailure {
    if (err instanceof OcrFailure) return err;
    const message = err instanceof Error ? err.message : String(err);
    if ((typeof navigator !== "undefined" && !navigator.onLine) || NETWORK_ERROR_RE.test(message)) return new OcrFailure("network", "The OCR language data couldn't be downloaded. Check your internet connection and try again.");
    return new OcrFailure("engine", "Something went wrong while reading this image. Try again, or use a clearer image.");
}
function formatProgress(m: OcrLogMessage): string {
    const label = PROGRESS_LABELS[m.status] ?? "Working";
    const showPercent = m.status === "recognizing text" || m.status.startsWith("loading language traineddata");
    return showPercent && typeof m.progress === "number" ? `${label}… ${Math.round(m.progress * 100)}%` : `${label}…`;
}
function validateFile(file: File): string | null {
    const typeOk = ACCEPTED_MIME_TYPES.has(file.type) || (!file.type && EXTENSION_RE.test(file.name));
    if (!typeOk) return "Unsupported file type. Please upload a JPG, PNG, WebP, BMP, or GIF image.";
    if (file.size === 0) return "This file is empty. Please choose another image.";
    if (file.size > MAX_FILE_SIZE_BYTES) return `This file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The maximum allowed size is 50 MB.`;
    return null;
}
async function prepareImageForOcr(file: File): Promise<Blob> {
    let bitmap: ImageBitmap;
    try { bitmap = await createImageBitmap(file); }
    catch { throw new OcrFailure("image", "This image couldn't be decoded. It may be corrupted or too large for your browser."); }
    try {
        const scale = Math.min(1, MAX_OCR_DIMENSION / Math.max(bitmap.width, bitmap.height));
        const passThrough = scale === 1 && file.size <= SKIP_COMPRESSION_BELOW_BYTES && (file.type === "image/jpeg" || file.type === "image/png");
        if (passThrough) return file;
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D context unavailable");
        ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, width, height); ctx.imageSmoothingQuality = "high"; ctx.drawImage(bitmap, 0, 0, width, height);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        canvas.width = canvas.height = 0;
        if (!blob) throw new Error("Canvas export failed");
        return blob;
    } catch (err) {
        if (err instanceof OcrFailure) throw err;
        throw new OcrFailure("image", "This image couldn't be prepared for scanning. Try a smaller or different image.");
    } finally { bitmap.close(); }
}
function legacyCopy(text: string): boolean {
    const el = document.createElement("textarea"); el.value = text; el.setAttribute("readonly", ""); el.style.position = "fixed"; el.style.opacity = "0"; document.body.appendChild(el); el.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch { ok = false; }
    document.body.removeChild(el); return ok;
}
function useObjectUrl(file: File | null): string | null {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        if (!file) { setUrl(null); return; }
        const objectUrl = URL.createObjectURL(file); setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);
    return url;
}
function useCopyFeedback() {
    const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
    const copy = useCallback(async (text: string) => {
        let ok = false; try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = legacyCopy(text); }
        setStatus(ok ? "copied" : "failed"); if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setStatus("idle"), COPY_FEEDBACK_MS);
    }, []);
    return { status, copy };
}
function useOcr() {
    const [text, setText] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [progressMessage, setProgressMessage] = useState<string>("");
    const [error, setError] = useState<OcrFailure | null>(null);
    const [noTextFound, setNoTextFound] = useState<boolean>(false);
    const [confidence, setConfidence] = useState<number | null>(null);
    const workerRef = useRef<{ key: string; worker: TesseractWorker } | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const runIdRef = useRef<number>(0);
    const progressRef = useRef<(m: OcrLogMessage) => void>(() => {});
    const clearIdleTimer = () => { if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; } };
    const disposeWorker = useCallback(async () => {
        clearIdleTimer(); const current = workerRef.current; workerRef.current = null; if (!current) return;
        try { await current.worker.terminate(); } catch { /* already terminated */ }
    }, []);
    const scheduleIdleDispose = () => { clearIdleTimer(); idleTimerRef.current = setTimeout(() => void disposeWorker(), WORKER_IDLE_TTL_MS); };
    const getWorker = async (lang: string, signal: AbortSignal) => {
        const cached = workerRef.current; if (cached && cached.key === lang) return cached.worker;
        await disposeWorker();
        const langs = lang.split("+");
        const creation = createWorker(langs, 1, { logger: (m: OcrLogMessage) => progressRef.current(m) });
        try {
            const worker = await withTimeout(raceAbort(creation, signal), ENGINE_INIT_TIMEOUT_MS, () => new OcrFailure("timeout", "Downloading the OCR language data is taking too long. Check your connection and try again."));
            workerRef.current = { key: lang, worker }; return worker;
        } catch (err) { creation.then((w) => w.terminate()).catch(() => {}); throw err; }
    };
    const cancel = useCallback(() => {
        runIdRef.current += 1; abortRef.current?.abort(); abortRef.current = null; void disposeWorker(); setIsProcessing(false); setProgressMessage("");
    }, [disposeWorker]);
    const reset = useCallback(() => { cancel(); setText(""); setError(null); setNoTextFound(false); setConfidence(null); }, [cancel]);
    const run = useCallback(async (file: File, lang: string) => {
        if (abortRef.current) cancel();
        const runId = ++runIdRef.current; const isCurrent = () => runIdRef.current === runId;
        const controller = new AbortController(); abortRef.current = controller; clearIdleTimer();
        setIsProcessing(true); setError(null); setNoTextFound(false); setConfidence(null); setText(""); setProgressMessage("Preparing image…");
        try {
            const image = await raceAbort(prepareImageForOcr(file), controller.signal);
            progressRef.current = (m) => { if (isCurrent()) setProgressMessage(formatProgress(m)); };
            setProgressMessage("Loading OCR engine…");
            const worker = await getWorker(lang, controller.signal);
            const { data } = await raceAbort(worker.recognize(image), controller.signal);
            if (!isCurrent()) return;
            const cleaned = (data.text ?? "").replace(/\r\n/g, "\n").trim();
            if (!cleaned) setNoTextFound(true);
            else { setText(cleaned); if (typeof data.confidence === "number") setConfidence(data.confidence); }
            scheduleIdleDispose();
        } catch (err) {
            if (!isCurrent() || controller.signal.aborted) return;
            console.error("[ImageToText] OCR failed:", err); void disposeWorker(); setError(toOcrFailure(err));
        } finally {
            if (isCurrent()) { abortRef.current = null; setIsProcessing(false); setProgressMessage(""); }
        }
    }, [cancel, disposeWorker]);
    useEffect(() => () => {
        runIdRef.current += 1; abortRef.current?.abort(); if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        const current = workerRef.current; workerRef.current = null; void current?.worker.terminate().catch(() => {});
    }, []);
    return { text, setText, isProcessing, progressMessage, error, noTextFound, confidence, run, cancel, reset };
}

/* ========================================================================== */
/* Component                                                                  */
/* ========================================================================== */
export default function ImageToText() {
    const { locale, L: baseL } = useSohozI18n();
    const tx = useCallback((value: string) => translateImageToTextText(value, locale, baseL), [locale, baseL]);
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
    const acceptFile = (file: File | undefined) => {
        if (!file || isProcessing) return;
        const problem = validateFile(file);
        if (problem) { setFileError(problem); return; }
        setFileError(null); ocr.reset(); setSelectedFile(file);
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { acceptFile(e.target.files?.[0]); e.target.value = ""; };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); acceptFile(e.dataTransfer.files?.[0]); };
    const handleExtractText = () => { if (!selectedFile || isProcessing) return; void ocr.run(selectedFile, selectedLanguage); };
    const handleRetryEnglishOnly = () => { if (!selectedFile) return; setSelectedLanguage("eng"); void ocr.run(selectedFile, "eng"); };
    const handleReset = () => {
        ocr.reset(); setSelectedFile(null); setFileError(null); if (fileInputRef.current) fileInputRef.current.value = "";
    };
    const handleCopyText = () => { if (!ocr.text) return; void copyFeedback.copy(ocr.text); };
    const handleSelectAll = () => { resultRef.current?.focus(); resultRef.current?.select(); };
    const handleShare = async () => {
        const url = window.location.href;
        if (typeof navigator.share === "function") {
            try { await navigator.share({ title: tx("Image to Text — Sohoj Tools"), url }); } catch { /* user dismissed the share sheet */ }
            return;
        }
        await shareFeedback.copy(url);
    };
    const badge = isProcessing
        ? { label: "Processing", cls: "text-[#92400E] bg-[#F6D9A8]" }
        : ocr.error
            ? { label: "Failed", cls: "text-[#B91C1C] bg-[#FEE2E2]" }
            : ocr.noTextFound
                ? { label: "No text found", cls: "text-[#92400E] bg-[#F6D9A8]" }
                : ocr.text
                    ? { label: "Completed", cls: "text-[#166534] bg-[#DCFCE7]" }
                    : selectedFile
                        ? { label: "Ready", cls: "text-[#7A6A50] bg-[#F3E9D2]" }
                        : { label: "Empty", cls: "text-[#7A6A50] bg-[#F3E9D2]" };

    return (
      <div id="image-to-text-tool" style={{ fontFamily: '"Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }} className="relative isolate w-full pb-16 text-[#3B2F1E] before:pointer-events-none before:fixed before:inset-0 before:-z-10 before:bg-gradient-to-b before:from-[#E9DDC3] before:to-[#EFE5CE]">
        <div className="w-full space-y-6">
          {/* Top Header & Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-col xs:flex-row xs:items-center gap-2 text-sm text-[#7A6A50] font-medium mb-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => router.back()} className={`p-1 hover:bg-[#EFE3C8] rounded-md transition-colors text-[#3B2F1E] flex items-center justify-center -ml-1 ${focusRing}`} title={tx("Go back")} aria-label={tx("Go back")}>
                    <ArrowLeft size={18}/>
                  </button>
                  <Link href="/sohoj-tools" className="hover:text-[#DC2626]"><ImageToTextT>{"Sohoj Tools\n              "}</ImageToTextT></Link>
                  <span aria-hidden="true"><ImageToTextT>{"/"}</ImageToTextT></span>
                  <span className="hover:text-[#DC2626] cursor-pointer"><ImageToTextT>{"Text Tools\n              "}</ImageToTextT></span>
                  <span aria-hidden="true"><ImageToTextT>{"/"}</ImageToTextT></span>
                  <span className="text-[#3B2F1E] font-semibold" aria-current="page"><ImageToTextT>{"Image to Text\n              "}</ImageToTextT></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F6D9A8] text-[#DC2626] rounded-xl flex items-center justify-center font-bold shadow-sm">
                  <ScanText size={21}/>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#3B2F1E] tracking-tight"><ImageToTextT>{"Image to Text\n              "}</ImageToTextT></h1>
                <span className="bg-[#F6D9A8] text-[#8F1D1D] text-xs font-bold px-3 py-1 rounded-full"><ImageToTextT>{"Free\n              "}</ImageToTextT></span>
              </div>
              <p className="text-sm text-[#5A4A32] font-medium mt-2"><ImageToTextT>{"Extract text from images with OCR in your browser — supports\n              English and Bengali.\n            "}</ImageToTextT></p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button type="button" onClick={() => setIsFavorite(!isFavorite)} aria-pressed={isFavorite} aria-label={isFavorite ? tx("Remove from favorites") : tx("Add to favorites")} className={`p-2.5 bg-[#FBF6E8] rounded-xl border border-[#E3D6B8] text-[#7A6A50] hover:text-[#DC2626] hover:border-[#DC2626] transition-all shadow-sm ${focusRing}`}>
                <Star size={19} className={isFavorite ? "fill-[#DC2626] text-[#DC2626]" : ""}/>
              </button>
              <button type="button" onClick={handleShare} aria-label={shareFeedback.status === "copied" ? tx("Link copied") : tx("Share this tool")} className={`p-2.5 bg-[#FBF6E8] rounded-xl border border-[#E3D6B8] text-[#7A6A50] hover:text-[#DC2626] hover:border-[#DC2626] transition-all shadow-sm ${focusRing}`}>
                {shareFeedback.status === "copied" ? (<Check size={19} className="text-[#166534]"/>) : (<Share size={19}/>) }
              </button>
            </div>
          </div>

          {/* Main Workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: FILE UPLOAD & OPTIONS */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#F2E8D2] border border-[#E3D6B8] rounded-2xl p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#3B2F1E] tracking-wide uppercase"><ImageToTextT>{"Files "}</ImageToTextT>{selectedFile ? <ImageToTextT>{"(1)"}</ImageToTextT> : <ImageToTextT>{"(0)"}</ImageToTextT>}</span>
                  {selectedFile && (<button type="button" onClick={handleReset} disabled={isProcessing} aria-label={tx("Remove uploaded file")} className={`text-sm font-semibold text-[#7A6A50] hover:text-[#DC2626] flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`}>
                    <RotateCcw size={15}/><span><ImageToTextT>{"Remove"}</ImageToTextT></span>
                  </button>)}
                </div>

                <input ref={fileInputRef} type="file" accept={ACCEPT_ATTR} className="hidden" onChange={handleFileChange} disabled={isProcessing} tabIndex={-1} aria-label={tx("Upload image file")}/>

                {!selectedFile ? (
                  <div role="button" tabIndex={0} aria-label={tx("Upload an image. Drop a file here or press Enter to browse. Maximum size 50 megabytes.")} onClick={() => fileInputRef.current?.click()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer flex flex-col items-center justify-center group transition-all ${focusRing} ${isDragging ? "bg-[#F6D9A8] border-[#DC2626]" : "bg-[#FBF6E8] border-[#D8BBA0] hover:bg-[#EFE3C8] hover:border-[#DC2626]"}`}>
                    <div className="w-12 h-12 bg-[#F6D9A8] text-[#DC2626] rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Upload size={23}/>
                    </div>
                    <span className="text-sm font-bold text-[#3B2F1E] mb-1.5"><ImageToTextT>{"Drop an image here or click to upload\n                  "}</ImageToTextT></span>
                    <span className="text-xs text-[#7A6A50] font-medium"><ImageToTextT>{"JPG, PNG, WebP, BMP, or GIF — max 50MB\n                  "}</ImageToTextT></span>
                  </div>
                ) : (
                  <div className="p-3.5 bg-[#FBF6E8] border border-[#E3D6B8] rounded-xl flex items-center gap-3">
                    <div className="w-14 h-14 bg-[#FBF6E8] rounded-lg border border-[#E3D6B8] overflow-hidden shrink-0 flex items-center justify-center">
                      {previewUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- blob: URLs can't use next/image
                        <img src={previewUrl} alt="" decoding="async" className="w-full h-full object-cover"/>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#3B2F1E] truncate">{selectedFile.name}</p>
                      <p className="text-xs text-[#7A6A50]">{(locale?.toLowerCase().startsWith("bn") ? toBanglaImageDigits((selectedFile.size / (1024 * 1024)).toFixed(2)) : (selectedFile.size / (1024 * 1024)).toFixed(2))}<ImageToTextT>{"MB\n                    "}</ImageToTextT></p>
                    </div>
                  </div>
                )}

                {fileError && (<p role="alert" className="text-sm font-medium text-[#B91C1C] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2.5 leading-relaxed"><ImageToTextT>{fileError}</ImageToTextT></p>)}

                <div className="space-y-2 pt-4 border-t border-[#E3D6B8]">
                  <label htmlFor="ocr-language" className="text-sm font-bold text-[#3B2F1E] block"><ImageToTextT>{"OCR Language\n                "}</ImageToTextT></label>
                  <select id="ocr-language" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} disabled={isProcessing} className="w-full bg-[#FBF6E8] border border-[#D8C8A8] rounded-xl px-3.5 py-3 text-sm font-medium text-[#3B2F1E] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/25 focus:border-[#DC2626] disabled:opacity-60 disabled:cursor-not-allowed">
                    <option value="eng+ben"><ImageToTextT>{"English + Bengali (উভয়ই)"}</ImageToTextT></option>
                    <option value="eng"><ImageToTextT>{"English Only"}</ImageToTextT></option>
                    <option value="ben"><ImageToTextT>{"Bengali Only (বাংলা)"}</ImageToTextT></option>
                  </select>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PREVIEW & RESULT */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-[#F2E8D2] border border-[#E3D6B8] rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[440px]">
                <div>
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E3D6B8]">
                    <span className="text-sm font-bold text-[#3B2F1E] uppercase tracking-wider"><ImageToTextT>{"Image preview & Extracted text\n                  "}</ImageToTextT></span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${badge.cls}`}><ImageToTextT>{badge.label}</ImageToTextT></span>
                  </div>

                  <div className="pt-5">
                    {!selectedFile ? (
                      <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-14 h-14 bg-[#F6D9A8] text-[#DC2626] rounded-xl flex items-center justify-center mb-4"><ScanText size={26}/></div>
                        <h3 className="text-base font-bold text-[#3B2F1E] mb-1.5"><ImageToTextT>{"Upload an image to extract text\n                      "}</ImageToTextT></h3>
                        <p className="text-sm text-[#7A6A50] max-w-xs leading-relaxed"><ImageToTextT>{"Your image preview and extracted text will appear here.\n                      "}</ImageToTextT></p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Image Preview: keep source pixels/colors unchanged */}
                        <div className="p-3.5 bg-[#FBF6E8] border border-[#E3D6B8] rounded-xl flex flex-col items-center justify-center min-h-[250px]">
                          {previewUrl && (
                            // eslint-disable-next-line @next/next/no-img-element -- blob: URLs can't use next/image
                            <img src={previewUrl} alt={tx(`Preview of ${selectedFile.name}`)} decoding="async" className="max-h-[220px] object-contain rounded-lg shadow-sm"/>
                          )}
                        </div>

                        {/* Extracted Result Area */}
                        <div className="p-3.5 bg-[#FBF6E8] border border-[#E3D6B8] rounded-xl flex flex-col justify-between">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-sm font-bold text-[#5A4A32] uppercase tracking-wide"><ImageToTextT>{"Result\n                          "}</ImageToTextT></span>
                            {ocr.text && !isProcessing && (<div className="flex items-center gap-1.5">
                              <button type="button" onClick={handleSelectAll} aria-label={tx("Select all extracted text")} className={`text-xs font-bold text-[#5A4A32] hover:text-[#DC2626] bg-[#F3E9D2] hover:bg-[#EFE3C8] px-2.5 py-1.5 rounded-lg transition-colors ${focusRing}`}><ImageToTextT>{"Select all\n                              "}</ImageToTextT></button>
                              <button type="button" onClick={handleCopyText} aria-label={tx("Copy extracted text to clipboard")} className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${focusRing} ${copyFeedback.status === "failed" ? "text-[#B91C1C] bg-[#FEE2E2]" : "text-[#166534] hover:text-[#DC2626] bg-[#DCFCE7]"}`}>
                                {copyFeedback.status === "copied" ? (<Check size={14}/>) : (<Copy size={14}/>)}
                                <span>{copyFeedback.status === "copied" ? <ImageToTextT>{"Copied!"}</ImageToTextT> : copyFeedback.status === "failed" ? <ImageToTextT>{"Copy failed"}</ImageToTextT> : <ImageToTextT>{"Copy"}</ImageToTextT>}</span>
                              </button>
                            </div>)}
                          </div>

                          <span className="sr-only" role="status" aria-live="polite">
                            {copyFeedback.status === "copied" ? <ImageToTextT>{"Text copied to clipboard"}</ImageToTextT> : copyFeedback.status === "failed" ? <ImageToTextT>{"Copy failed. Select the text and copy it manually."}</ImageToTextT> : ""}
                          </span>

                          <div className="flex-1 overflow-y-auto max-h-[200px]">
                            {isProcessing ? (
                              <div role="status" aria-live="polite" className="flex flex-col items-center justify-center h-full py-12 text-center">
                                <div className="w-7 h-7 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin mb-3" aria-hidden="true"></div>
                                <p className="text-sm font-semibold text-[#8F1D1D]"><ImageToTextT>{ocr.progressMessage}</ImageToTextT></p>
                              </div>
                            ) : ocr.error ? (
                              <div role="alert" className="flex flex-col items-center justify-center h-full py-6 text-center">
                                <div className="w-11 h-11 bg-[#FEE2E2] text-[#B91C1C] rounded-xl flex items-center justify-center mb-2.5"><AlertTriangle size={21}/></div>
                                <h3 className="text-sm font-bold text-[#3B2F1E] mb-1.5"><ImageToTextT>{ERROR_TITLES[ocr.error.kind]}</ImageToTextT></h3>
                                <p className="text-sm text-[#5A4A32] max-w-xs leading-relaxed mb-3"><ImageToTextT>{ocr.error.message}</ImageToTextT></p>
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                  <button type="button" onClick={handleExtractText} className={`px-3.5 py-2 bg-[#D42020] hover:bg-[#AE1717] text-white rounded-lg text-sm font-bold transition-colors ${focusRing}`}><ImageToTextT>{"Try again\n                                "}</ImageToTextT></button>
                                  {canFallbackToEnglish && (<button type="button" onClick={handleRetryEnglishOnly} className={`px-3.5 py-2 bg-[#F3E9D2] hover:bg-[#EFE3C8] text-[#3B2F1E] border border-[#E3D6B8] rounded-lg text-sm font-bold transition-colors ${focusRing}`}><ImageToTextT>{"Use English only\n                                  "}</ImageToTextT></button>)}
                                </div>
                              </div>
                            ) : ocr.noTextFound ? (
                              <div role="status" className="flex flex-col items-center justify-center h-full py-8 text-center">
                                <h3 className="text-sm font-bold text-[#3B2F1E] mb-1.5"><ImageToTextT>{"No text found in this image\n                              "}</ImageToTextT></h3>
                                <p className="text-sm text-[#5A4A32] max-w-xs leading-relaxed"><ImageToTextT>{"Try a sharper, well-lit image with dark text on\n                                a plain background, and check that the OCR\n                                language matches the text.\n                              "}</ImageToTextT></p>
                              </div>
                            ) : ocr.text ? (
                              <textarea ref={resultRef} value={ocr.text} onChange={(e) => ocr.setText(e.target.value)} aria-label={tx("Extracted text (editable)")} spellCheck={false} className="w-full h-full min-h-[160px] bg-transparent text-sm font-medium text-[#3B2F1E] focus:outline-none resize-none leading-relaxed"/>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full py-12 text-center text-[#7A6A50]"><p className="text-sm font-medium"><ImageToTextT>{"Click &quot;Extract text&quot; button below to\n                                start OCR conversion.\n                              "}</ImageToTextT></p></div>
                            )}
                          </div>

                          {ocr.text && !isProcessing && ocr.confidence !== null && ocr.confidence < LOW_CONFIDENCE_THRESHOLD && (<p className="mt-2 text-xs font-medium text-[#92400E] leading-relaxed"><ImageToTextT>{"Low confidence — please review the text for\n                              mistakes.\n                            "}</ImageToTextT></p>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedFile && (<div className="pt-4 mt-4 border-t border-[#E3D6B8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[#7A6A50]">{isProcessing ? <ImageToTextT>{"Scanning image…"}</ImageToTextT> : <ImageToTextT>{"Ready to scan text"}</ImageToTextT>}</span>
                  <div className="flex items-center gap-2">
                    {isProcessing ? (
                      <button type="button" onClick={ocr.cancel} className={`px-3.5 py-2.5 bg-[#F3E9D2] hover:bg-[#EFE3C8] border border-[#E3D6B8] text-[#3B2F1E] rounded-xl text-sm font-bold transition-colors ${focusRing}`}><ImageToTextT>{"Cancel\n                      "}</ImageToTextT></button>
                    ) : (
                      <button type="button" onClick={handleReset} className={`px-3.5 py-2.5 bg-[#F3E9D2] hover:bg-[#EFE3C8] border border-[#E3D6B8] text-[#3B2F1E] rounded-xl text-sm font-bold transition-colors ${focusRing}`}><ImageToTextT>{"Reset\n                      "}</ImageToTextT></button>
                    )}
                    <button type="button" onClick={handleExtractText} disabled={isProcessing} aria-busy={isProcessing} aria-label={isProcessing ? tx("Extracting text") : tx("Extract text from image")} className={`px-4 py-2.5 bg-[#D42020] hover:bg-[#AE1717] active:bg-[#991B1B] text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#D42020] ${focusRing}`}>
                      {isProcessing ? (<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>) : (<ScanText size={17}/>)}
                      <span>{isProcessing ? <ImageToTextT>{"Extracting…"}</ImageToTextT> : <ImageToTextT>{"Extract text"}</ImageToTextT>}</span>
                    </button>
                  </div>
                </div>)}
              </div>
            </div>
          </div>

          {/* PRIVACY NOTICE */}
          <div className="bg-[#F2E8D2] border border-[#E3D6B8] rounded-2xl p-4 flex items-start sm:items-center gap-3 text-sm text-[#5A4A32] font-medium shadow-sm">
            <ShieldCheck size={19} className="text-[#8F1D1D] shrink-0 mt-0.5 sm:mt-0"/>
            <span><ImageToTextT>{"Your files are processed in the browser — they are not uploaded to\n            any server.\n          "}</ImageToTextT></span>
          </div>

          {/* HOW TO USE DROPDOWN */}
          <div className="bg-[#F2E8D2] border border-[#E3D6B8] rounded-2xl overflow-hidden shadow-sm">
            <button type="button" onClick={() => setShowHowToUse(!showHowToUse)} aria-expanded={showHowToUse} aria-controls="how-to-use-panel" className={`w-full p-4 sm:p-5 text-left flex items-center justify-between font-bold text-base text-[#3B2F1E] hover:bg-[#EFE3C8] transition-colors ${focusRing}`}>
              <div className="flex items-center gap-2.5"><span className="w-2 h-2 rounded-full bg-[#DC2626]"></span><span><ImageToTextT>{"How to use"}</ImageToTextT></span></div>
              {showHowToUse ? <ChevronUp size={19}/> : <ChevronDown size={19}/>}
            </button>
            {showHowToUse && (<div id="how-to-use-panel" className="p-4 sm:p-5 pt-0 text-sm text-[#5A4A32] space-y-2.5 border-t border-[#E3D6B8] font-medium leading-relaxed">
              <p><ImageToTextT>{"1. Upload an image containing English or Bengali text using the\n                upload box.\n              "}</ImageToTextT></p>
              <p><ImageToTextT>{"2. Select your target OCR language (English, Bengali, or Both).\n              "}</ImageToTextT></p>
              <p><ImageToTextT>{"3. Click the &quot;Extract text&quot; button to scan the image.\n              "}</ImageToTextT></p>
              <p><ImageToTextT>{"4. Copy the recognized text or edit it directly from the result\n                box.\n              "}</ImageToTextT></p>
            </div>)}
          </div>

          {/* TOOLS IN THE SAME CATEGORY */}
          <div className="pt-4 space-y-3.5">
            <h2 className="text-lg font-bold text-[#3B2F1E] tracking-tight"><ImageToTextT>{"Tools in the same category\n          "}</ImageToTextT></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedTools.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <Link key={tool.href} href={tool.href} className="bg-[#F2E8D2] border border-[#E3D6B8] rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#DC2626] transition-all flex flex-col justify-between group">
                    <div>
                      <div className="w-10 h-10 bg-[#F6D9A8] text-[#DC2626] rounded-xl flex items-center justify-center mb-3 group-hover:bg-[#EFE3C8] transition-colors"><ToolIcon size={20}/></div>
                      <h3 className="text-base font-bold text-[#3B2F1E] mb-1.5 group-hover:text-[#DC2626] transition-colors">{<ImageToTextT>{tool.title}</ImageToTextT>}</h3>
                      <p className="text-sm text-[#5A4A32] font-medium leading-relaxed">{<ImageToTextT>{tool.description}</ImageToTextT>}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
}
