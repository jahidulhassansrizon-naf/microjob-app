"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, { useState, useRef } from "react";
import Link from "next/link";
import { FileImage, Star, Share2, Upload, FileText, Lock, ChevronDown, ChevronUp, Minimize2, Combine, FilePlus, ArrowLeft, X, Plus, Loader2, Download, CheckCircle2, AlertCircle, } from "lucide-react";
// ---------------------------------------------------------------------------
// Rendering engine (pdfjs-dist)
// ---------------------------------------------------------------------------
// pdfjs-dist is imported dynamically, only inside browser event handlers.
// Importing it at module scope can break Next.js's server render pass of
// this "use client" component (pdf.js touches browser-only APIs like
// DOMMatrix/Image on load), so we lazy-load it on first use instead.
type ImageFormat = "JPG" | "PNG" | "WebP" | "AVIF";
type Resolution = "standard" | "high" | "ultra";
const DPI_BY_RESOLUTION: Record<Resolution, number> = {
    standard: 96,
    high: 144,
    ultra: 216,
};
const MIME_BY_FORMAT: Record<ImageFormat, string> = {
    JPG: "image/jpeg",
    PNG: "image/png",
    WebP: "image/webp",
    AVIF: "image/avif",
};
const EXT_BY_FORMAT: Record<ImageFormat, string> = {
    JPG: "jpg",
    PNG: "png",
    WebP: "webp",
    AVIF: "avif",
};
let pdfjsLibPromise: Promise<any> | null = null;
async function getPdfjs(): Promise<any> {
    if (!pdfjsLibPromise) {
        pdfjsLibPromise = import("pdfjs-dist").then((lib) => {
            // Worker file name matches pdfjs-dist v4/v5 (ESM, ".mjs").
            // If your installed version is v3.x, this file is named
            // "pdf.worker.min.js" instead — change the extension below
            // to match.
            lib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
            return lib;
        });
    }
    return pdfjsLibPromise;
}
interface RenderedPage {
    pageNumber: number;
    blob: Blob;
    format: ImageFormat;
    thumbnailUrl: string;
}
// ---------------------------------------------------------------------------
// Blob compatibility helper
// ---------------------------------------------------------------------------
//
// Newer TypeScript/lib.dom typings can infer Uint8Array as
// Uint8Array<ArrayBufferLike>. Blob expects a BlobPart whose underlying
// ArrayBuffer is a concrete ArrayBuffer.
//
// This creates a real ArrayBuffer and copies the existing bytes into it.
// It does not alter the actual image/ZIP data.
// ---------------------------------------------------------------------------
function toRealArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const buffer = new ArrayBuffer(bytes.byteLength);
    const view = new Uint8Array(buffer);
    view.set(bytes);
    return buffer;
}
async function renderPdfToImages(file: File, format: ImageFormat, dpi: number, onProgress: (done: number, total: number) => void): Promise<RenderedPage[]> {
    const pdfjsLib = await getPdfjs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
    }).promise;
    // pdf.js viewports are in PDF points, where 1 unit = 1/72 inch — so a
    // "96 DPI" render is scale = 96 / 72, and so on.
    const scale = dpi / 72;
    const mimeType = MIME_BY_FORMAT[format];
    const quality = format === "PNG" ? undefined : 0.9;
    const results: RenderedPage[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({
            scale,
        });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Couldn't get a 2D canvas context.");
        }
        await page.render({
            canvas,
            canvasContext: ctx,
            viewport,
        }).promise;
        let blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), mimeType, quality));
        // Not every browser can encode WebP/AVIF via canvas — fall back to PNG
        // for that page rather than failing the whole conversion.
        let actualFormat: ImageFormat = format;
        if (!blob) {
            blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
            actualFormat = "PNG";
        }
        if (!blob) {
            throw new Error(`Couldn't encode page ${pageNumber} to an image.`);
        }
        results.push({
            pageNumber,
            blob,
            format: actualFormat,
            thumbnailUrl: URL.createObjectURL(blob),
        });
        onProgress(pageNumber, pdf.numPages);
    }
    return results;
}
// ---------------------------------------------------------------------------
// Minimal dependency-free ZIP writer (STORE / no compression)
// ---------------------------------------------------------------------------
// The images are already compressed (JPEG/PNG/WebP/AVIF), so skipping
// deflate and just storing them raw keeps this simple and fast without
// pulling in a zip library.
let crcTable: Uint32Array | null = null;
function getCrcTable(): Uint32Array {
    if (crcTable) {
        return crcTable;
    }
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[n] = c >>> 0;
    }
    crcTable = table;
    return table;
}
function crc32(data: Uint8Array): number {
    const table = getCrcTable();
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
        crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}
interface ZipEntryInput {
    name: string;
    data: Uint8Array;
}
function createZip(entries: ZipEntryInput[]): Uint8Array {
    const encoder = new TextEncoder();
    const localParts: Uint8Array[] = [];
    const centralParts: Uint8Array[] = [];
    let offset = 0;
    for (const entry of entries) {
        const nameBytes = encoder.encode(entry.name);
        const crc = crc32(entry.data);
        const size = entry.data.length;
        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);
        local.setUint16(6, 0, true);
        // STORE
        local.setUint16(8, 0, true);
        local.setUint16(10, 0, true);
        local.setUint16(12, 0x21, true);
        local.setUint32(14, crc, true);
        local.setUint32(18, size, true);
        local.setUint32(22, size, true);
        local.setUint16(26, nameBytes.length, true);
        local.setUint16(28, 0, true);
        const localEntry = new Uint8Array(30 + nameBytes.length + size);
        localEntry.set(new Uint8Array(local.buffer), 0);
        localEntry.set(nameBytes, 30);
        localEntry.set(entry.data, 30 + nameBytes.length);
        localParts.push(localEntry);
        const central = new DataView(new ArrayBuffer(46));
        central.setUint32(0, 0x02014b50, true);
        central.setUint16(4, 20, true);
        central.setUint16(6, 20, true);
        central.setUint16(8, 0, true);
        // STORE
        central.setUint16(10, 0, true);
        central.setUint16(12, 0, true);
        central.setUint16(14, 0x21, true);
        central.setUint32(16, crc, true);
        central.setUint32(20, size, true);
        central.setUint32(24, size, true);
        central.setUint16(28, nameBytes.length, true);
        central.setUint16(30, 0, true);
        central.setUint16(32, 0, true);
        central.setUint16(34, 0, true);
        central.setUint16(36, 0, true);
        central.setUint32(38, 0, true);
        central.setUint32(42, offset, true);
        const centralEntry = new Uint8Array(46 + nameBytes.length);
        centralEntry.set(new Uint8Array(central.buffer), 0);
        centralEntry.set(nameBytes, 46);
        centralParts.push(centralEntry);
        offset += localEntry.length;
    }
    const centralStart = offset;
    const centralSize = centralParts.reduce((sum, p) => sum + p.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(4, 0, true);
    end.setUint16(6, 0, true);
    end.setUint16(8, entries.length, true);
    end.setUint16(10, entries.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, centralStart, true);
    end.setUint16(20, 0, true);
    const result = new Uint8Array(offset + centralSize + 22);
    let pos = 0;
    for (const part of localParts) {
        result.set(part, pos);
        pos += part.length;
    }
    for (const part of centralParts) {
        result.set(part, pos);
        pos += part.length;
    }
    result.set(new Uint8Array(end.buffer), pos);
    return result;
}
function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    const kb = bytes / 1024;
    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`;
    }
    return `${(kb / 1024).toFixed(2)} MB`;
}
function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
/**
 * Page-specific whole-phrase English ↔ Bangla translations.
 * Do not use the shared word-by-word translator here: it can produce mixed
 * phrases when the language changes. Unknown runtime PDF errors are handled
 * with a friendly, localized message below.
 */
const PDF_TO_IMAGE_BN: Record<string, string> = {
    "back to tools": "টুলসের তালিকায় ফিরে যান",
    "/": "/",
    "pdf tools": "PDF টুলস",
    "pdf to image": "PDF থেকে ছবি",
    "free": "বিনামূল্যে",
    "convert each pdf page to png, jpg, webp, or avif.": "PDF-এর প্রতিটি পৃষ্ঠা PNG, JPG, WebP অথবা AVIF ছবিতে রূপান্তর করুন।",
    "files (": "ফাইল (",
    ")": ")",
    "add": "যোগ করুন",
    "drop pdf files here or click to upload": "PDF ফাইল এখানে টেনে আনুন অথবা আপলোড করতে ক্লিক করুন",
    "pdf files, max 500 mb each": "প্রতিটি PDF ফাইল সর্বোচ্চ ৫০০ MB",
    "mb": "MB",
    "image format": "ছবির ফরম্যাট",
    "resolution": "রেজোলিউশন",
    "standard": "সাধারণ",
    "96 dpi — good for screen and sharing": "96 DPI — স্ক্রিনে দেখা ও শেয়ার করার জন্য উপযোগী",
    "high": "উচ্চ",
    "144 dpi — sharper text and details": "144 DPI — আরও স্পষ্ট লেখা ও বিস্তারিত দেখার জন্য",
    "ultra high": "অতি উচ্চ",
    "216 dpi — best for print": "216 DPI — প্রিন্টের জন্য সর্বোত্তম",
    "preview": "পূর্বরূপ",
    "rendering": "তৈরি হচ্ছে",
    "ready": "প্রস্তুত",
    "empty": "খালি",
    "error": "ত্রুটি",
    "rendering your pdf…": "PDF-এর পৃষ্ঠাগুলো থেকে ছবি তৈরি হচ্ছে…",
    "getting started…": "প্রস্তুত করা হচ্ছে…",
    "conversion failed": "রূপান্তর করা যায়নি",
    "download all (.zip)": "সবগুলো ডাউনলোড করুন (.zip)",
    "· ": "· ",
    "download": "ডাউনলোড",
    "add files to get started": "শুরু করতে ফাইল যোগ করুন",
    "your result will appear here after you run the tool.": "টুলটি চালানোর পর ফলাফল এখানে দেখা যাবে।",
    "conversion failed — try again": "রূপান্তর করা যায়নি—আবার চেষ্টা করুন",
    "reset": "রিসেট করুন",
    "converting…": "রূপান্তর করা হচ্ছে…",
    "convert to images": "ছবিতে রূপান্তর করুন",
    "your files are processed in the browser — they are not uploaded to any server.": "আপনার ফাইলগুলো ব্রাউজারেই প্রক্রিয়াকরণ করা হয়—কোনো সার্ভারে আপলোড করা হয় না।",
    "?": "?",
    "how to use": "ব্যবহারের নিয়ম",
    "upload your pdf, choose your preferred image format (jpg, png, webp, or avif) and resolution quality, then click \"convert to images\" to extract pages as image files.": "আপনার PDF আপলোড করুন। পছন্দের ছবির ফরম্যাট (JPG, PNG, WebP অথবা AVIF) ও রেজোলিউশন বেছে নিয়ে \"ছবিতে রূপান্তর করুন\"-এ ক্লিক করুন। PDF-এর প্রতিটি পৃষ্ঠা আলাদা ছবি হিসেবে তৈরি হবে।",
    "tools in the same category": "একই বিভাগের অন্যান্য টুল",
    "compress pdf": "PDF-এর আকার কমান",
    "shrink embedded photos and scans inside a pdf — text stays sharp.": "PDF-এর ভেতরের ছবি ও স্ক্যানের আকার কমান—লেখার স্পষ্টতা বজায় থাকবে।",
    "merge pdfs": "একাধিক PDF একত্র করুন",
    "combine multiple pdf files into one document in your chosen order.": "একাধিক PDF আপনার পছন্দের ক্রমে একটি নথিতে একত্র করুন।",
    "add to favorites": "পছন্দের তালিকায় যোগ করুন",
    "share this tool": "এই টুলটি শেয়ার করুন",
    "couldn't get a 2d canvas context.": "PDF থেকে ছবি তৈরির জন্য প্রয়োজনীয় ক্যানভাস চালু করা যায়নি। আবার চেষ্টা করুন।",
};

function toBanglaNumerals(value: string): string {
    return value.replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

function translatePdfToImageText(value: string, locale: string | undefined): string {
    const raw = String(value ?? "");
    if (!String(locale ?? "").toLowerCase().startsWith("bn")) return raw;

    const normalized = raw.replace(/\s+/g, " ").trim().toLowerCase();
    const exact = PDF_TO_IMAGE_BN[normalized];
    if (exact !== undefined) return exact;

    let match = normalized.match(/^page (\d+) of (\d+)$/);
    if (match) return `মোট ${toBanglaNumerals(match[2])} পৃষ্ঠার মধ্যে ${toBanglaNumerals(match[1])} নম্বর পৃষ্ঠা`;

    match = normalized.match(/^(\d+) pages?$/);
    if (match) return `${toBanglaNumerals(match[1])} ${match[1] === "1" ? "পৃষ্ঠা" : "পৃষ্ঠা"}`;

    match = normalized.match(/^(\d+) pages? converted$/);
    if (match) return `${toBanglaNumerals(match[1])}টি পৃষ্ঠা রূপান্তর করা হয়েছে`;

    match = normalized.match(/^page (\d+)$/);
    if (match) return `পৃষ্ঠা ${toBanglaNumerals(match[1])}`;

    match = normalized.match(/^done: (\d+) pages? ready to download$/);
    if (match) return `সম্পন্ন: ${toBanglaNumerals(match[1])}টি পৃষ্ঠা ডাউনলোডের জন্য প্রস্তুত`;

    match = normalized.match(/^rendering page (\d+) of (\d+)…$/);
    if (match) return `মোট ${toBanglaNumerals(match[2])} পৃষ্ঠার মধ্যে ${toBanglaNumerals(match[1])} নম্বর পৃষ্ঠা তৈরি হচ্ছে…`;

    match = raw.trim().match(/^Ready to convert: (.+)$/i);
    if (match) return `রূপান্তরের জন্য প্রস্তুত: ${match[1]}`;

    match = normalized.match(/^couldn't encode page (\d+) to an image\.$/);
    if (match) return `PDF-এর ${toBanglaNumerals(match[1])} নম্বর পৃষ্ঠাকে ছবিতে রূপান্তর করা যায়নি। অন্য ফরম্যাট বেছে আবার চেষ্টা করুন।`;

    // Runtime/parser errors from pdf.js may vary by file and version. Keep them
    // understandable in Bangla rather than showing untranslated technical text.
    if (/pdf|invalid|password|encrypt|stream|object|xref|worker|canvas/i.test(raw)) {
        return "PDF ফাইলটি পড়া বা রূপান্তর করা যায়নি। ফাইলটি ঠিক আছে কি না পরীক্ষা করে আবার চেষ্টা করুন।";
    }
    return raw;
}

function PdfT({ children }: { children: React.ReactNode }) {
    const { locale } = useSohozI18n();
    if (typeof children !== "string") return <>{children}</>;
    return <>{translatePdfToImageText(children, locale)}</>;
}

function getPdfToImageErrorMessage(error: unknown, locale: string | undefined): string {
    const message = error instanceof Error ? error.message : "";
    if (String(locale ?? "").toLowerCase().startsWith("bn")) {
        if (message.includes("Couldn't get a 2D canvas context.")) return PDF_TO_IMAGE_BN["couldn't get a 2d canvas context."];
        const encodeMatch = message.match(/Couldn't encode page (\d+) to an image\./i);
        if (encodeMatch) return `PDF-এর ${toBanglaNumerals(encodeMatch[1])} নম্বর পৃষ্ঠাকে ছবিতে রূপান্তর করা যায়নি। অন্য ফরম্যাট বেছে আবার চেষ্টা করুন।`;
        return "PDF ফাইলটি পড়া বা রূপান্তর করা যায়নি। ফাইলটি ঠিক আছে কি না পরীক্ষা করে আবার চেষ্টা করুন।";
    }
    return message || "Something went wrong while converting this PDF.";
}

export default function PdfToImage() {
    const { locale } = useSohozI18n();
    const tx = (value: string) => translatePdfToImageText(value, locale);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imageFormat, setImageFormat] = useState<ImageFormat>("JPG");
    const [resolution, setResolution] = useState<Resolution>("high");
    const [showHowToUse, setShowHowToUse] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<{
        done: number;
        total: number;
    } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [pages, setPages] = useState<RenderedPage[] | null>(null);
    const thumbnailUrlsRef = useRef<string[]>([]);
    const revokeThumbnails = () => {
        thumbnailUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        thumbnailUrlsRef.current = [];
    };
    const clearResults = () => {
        revokeThumbnails();
        setPages(null);
        setErrorMessage(null);
        setProgress(null);
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            clearResults();
        }
    };
    const handleReset = () => {
        setSelectedFile(null);
        setImageFormat("JPG");
        setResolution("high");
        setIsProcessing(false);
        clearResults();
    };
    const handleFormatChange = (fmt: ImageFormat) => {
        setImageFormat(fmt);
        clearResults();
    };
    const handleResolutionChange = (res: Resolution) => {
        setResolution(res);
        clearResults();
    };
    const handleConvert = async () => {
        if (!selectedFile) {
            return;
        }
        revokeThumbnails();
        setIsProcessing(true);
        setErrorMessage(null);
        setPages(null);
        setProgress({
            done: 0,
            total: 0,
        });
        try {
            const dpi = DPI_BY_RESOLUTION[resolution];
            const rendered = await renderPdfToImages(selectedFile, imageFormat, dpi, (done, total) => setProgress({
                done,
                total,
            }));
            thumbnailUrlsRef.current = rendered.map((p) => p.thumbnailUrl);
            setPages(rendered);
        }
        catch (err) {
            console.error(err);
            setErrorMessage(getPdfToImageErrorMessage(err, locale));
        }
        finally {
            setIsProcessing(false);
        }
    };
    const baseName = selectedFile?.name.replace(/\.pdf$/i, "") || "pdf";
    const downloadPage = (page: RenderedPage) => {
        const ext = EXT_BY_FORMAT[page.format];
        triggerDownload(page.blob, `${baseName}-page-${page.pageNumber}.${ext}`);
    };
    const downloadAllAsZip = async () => {
        if (!pages || pages.length === 0) {
            return;
        }
        const entries: ZipEntryInput[] = [];
        for (const page of pages) {
            const buffer = new Uint8Array(await page.blob.arrayBuffer());
            const ext = EXT_BY_FORMAT[page.format];
            entries.push({
                name: `${baseName}-page-${page.pageNumber}.${ext}`,
                data: buffer,
            });
        }
        const zipBytes = createZip(entries);
        // FIX:
        // Never pass Uint8Array<ArrayBufferLike> directly to Blob.
        // Convert to a concrete ArrayBuffer first.
        const zipBuffer = toRealArrayBuffer(zipBytes);
        triggerDownload(new Blob([zipBuffer], {
            type: "application/zip",
        }), `${baseName}-images.zip`);
    };
    const canConvert = !!selectedFile && !isProcessing;
    return (<div id="pdf-to-image-tool" className="w-full space-y-5 bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Pointer cursor on every clickable element of this tool */}
      <style>{`
        #pdf-to-image-tool a[href],
        #pdf-to-image-tool button:not(:disabled),
        #pdf-to-image-tool label,
        #pdf-to-image-tool summary,
        #pdf-to-image-tool [role="button"],
        #pdf-to-image-tool select,
        #pdf-to-image-tool input[type="color"],
        #pdf-to-image-tool input[type="range"],
        #pdf-to-image-tool input[type="checkbox"],
        #pdf-to-image-tool input[type="radio"],
        #pdf-to-image-tool input[type="file"] {
          cursor: pointer;
        }

        #pdf-to-image-tool button:disabled {
          cursor: not-allowed;
        }
      `}</style>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#0F172A]">
        <Link href="/sohoj-tools" className="flex items-center gap-1 hover:text-[#2563EB] transition-colors">
          <ArrowLeft size={14}/>

          <span><PdfT>{"Back to Tools"}</PdfT></span>
        </Link>

        <span><PdfT>{"/"}</PdfT></span>

        <span><PdfT>{"PDF Tools"}</PdfT></span>

        <span><PdfT>{"/"}</PdfT></span>

        <span className="font-semibold text-[#0F172A]"><PdfT>{"PDF to Image"}</PdfT></span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#0F172A]/10 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#4F46E5]/10 text-[#4F46E5] rounded-xl flex items-center justify-center shrink-0 border border-[#4F46E5]/20">
            <FileImage size={24}/>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#0F172A]"><PdfT>{"PDF to Image"}</PdfT></h1>

              <span className="bg-[#10B981]/10 text-[#10B981] text-[10px] font-bold px-2 py-0.5 rounded-full"><PdfT>{"Free\n              "}</PdfT></span>
            </div>

            <p className="text-xs text-[#0F172A] font-medium mt-0.5"><PdfT>{"Convert each PDF page to PNG, JPG, WebP, or AVIF.\n            "}</PdfT></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button aria-label={tx("Add to favorites")} title={tx("Add to favorites")} className="p-2 text-[#0F172A] hover:text-[#2563EB] bg-[#F8FAFC] hover:bg-[#E2E8F0] rounded-xl transition-all border border-[#0F172A]/10">
            <Star size={16}/>
          </button>

          <button aria-label={tx("Share this tool")} title={tx("Share this tool")} className="p-2 text-[#0F172A] hover:text-[#2563EB] bg-[#F8FAFC] hover:bg-[#E2E8F0] rounded-xl transition-all border border-[#0F172A]/10">
            <Share2 size={16}/>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Controls & Upload */}
        <div className="lg:col-span-4 space-y-4">
          {/* Upload Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#0F172A]/10 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#0F172A]"><PdfT>{"Files ("}</PdfT>{String(selectedFile ? 1 : 0).replace(/[0-9]/g, (digit) => String(locale ?? "").toLowerCase().startsWith("bn") ? "০১২৩৪৫৬৭৮৯"[Number(digit)] : digit)}<PdfT>{")\n              "}</PdfT></h2>

              <label className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4F46E5] bg-[#4F46E5]/10 hover:bg-[#2563EB]/10 px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-[#4F46E5]/20">
                <Plus size={12}/>

                <span><PdfT>{"Add"}</PdfT></span>

                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden"/>
              </label>
            </div>

            {!selectedFile ? (<label className="border-2 border-dashed border-[#2563EB]/30 bg-[#2563EB]/5 hover:bg-[#2563EB]/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                <div className="w-10 h-10 bg-[#2563EB]/10 text-[#4F46E5] rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload size={20}/>
                </div>

                <span className="text-xs font-bold text-[#0F172A]"><PdfT>{"Drop PDF files here or click to upload\n                "}</PdfT></span>

                <span className="text-[10px] text-[#0F172A] font-medium mt-1"><PdfT>{"PDF files, max 500 MB each\n                "}</PdfT></span>

                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden"/>
              </label>) : (<div className="bg-[#F8FAFC] border border-[#0F172A]/10 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 bg-[#2563EB]/10 text-[#4F46E5] rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={16}/>
                  </div>

                  <div className="truncate">
                    <p className="text-xs font-bold text-[#0F172A] truncate">
                      {selectedFile.name}
                    </p>

                    <p className="text-[10px] text-[#0F172A]">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)}<PdfT>{"MB\n                    "}</PdfT></p>
                  </div>
                </div>

                <button onClick={handleReset} className="p-1 text-[#0F172A] hover:text-[#4F46E5] rounded-lg transition-colors">
                  <X size={16}/>
                </button>
              </div>)}
          </div>

          {/* Image Format Selector Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#0F172A]/10 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#0F172A]"><PdfT>{"Image format"}</PdfT></h2>

            <div className="grid grid-cols-4 gap-2">
              {(["JPG", "PNG", "WebP", "AVIF"] as const).map((fmt) => (<button key={fmt} onClick={() => handleFormatChange(fmt)} className={`py-2 text-xs font-bold rounded-xl border transition-all ${imageFormat === fmt
                ? "border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB] shadow-2xs"
                : "border-[#0F172A]/10 bg-white text-[#0F172A] hover:bg-white"}`}>
                  {fmt}
                </button>))}
            </div>
          </div>

          {/* Resolution Selector Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#0F172A]/10 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#0F172A]"><PdfT>{"Resolution"}</PdfT></h2>

            <div className="space-y-2">
              {/* Standard */}
              <button onClick={() => handleResolutionChange("standard")} className={`w-full p-3 text-left rounded-xl border transition-all ${resolution === "standard"
            ? "border-[#2563EB] bg-[#2563EB]/5 text-[#0F172A] shadow-2xs"
            : "border-[#0F172A]/10 bg-white hover:bg-white"}`}>
                <p className="text-xs font-bold text-[#0F172A]"><PdfT>{"Standard"}</PdfT></p>

                <p className="text-[10px] text-[#0F172A] font-medium mt-0.5"><PdfT>{"96 DPI \u2014 good for screen and sharing\n                "}</PdfT></p>
              </button>

              {/* High */}
              <button onClick={() => handleResolutionChange("high")} className={`w-full p-3 text-left rounded-xl border transition-all ${resolution === "high"
            ? "border-[#2563EB] bg-[#2563EB]/5 text-[#0F172A] shadow-2xs"
            : "border-[#0F172A]/10 bg-white hover:bg-white"}`}>
                <p className="text-xs font-bold text-[#0F172A]"><PdfT>{"High"}</PdfT></p>

                <p className="text-[10px] text-[#0F172A] font-medium mt-0.5"><PdfT>{"144 DPI \u2014 sharper text and details\n                "}</PdfT></p>
              </button>

              {/* Ultra high */}
              <button onClick={() => handleResolutionChange("ultra")} className={`w-full p-3 text-left rounded-xl border transition-all ${resolution === "ultra"
            ? "border-[#2563EB] bg-[#2563EB]/5 text-[#0F172A] shadow-2xs"
            : "border-[#0F172A]/10 bg-white hover:bg-white"}`}>
                <p className="text-xs font-bold text-[#0F172A]"><PdfT>{"Ultra high"}</PdfT></p>

                <p className="text-[10px] text-[#0F172A] font-medium mt-0.5"><PdfT>{"216 DPI \u2014 best for print\n                "}</PdfT></p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Preview */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-[#0F172A]/10 shadow-xs flex flex-col justify-between min-h-[520px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#0F172A]"><PdfT>{"Preview"}</PdfT></h2>

            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${errorMessage
            ? "bg-[#2563EB]/10 text-[#0F172A]"
            : pages
                ? "bg-[#10B981]/10 text-[#10B981]"
                : isProcessing
                    ? "bg-[#E2E8F0] text-[#2563EB]"
                    : selectedFile
                        ? "bg-blue-100 text-blue-600"
                        : "bg-[#F8FAFC] text-[#0F172A]"}`}>
              <PdfT>{errorMessage ? "Error" : pages
                ? `${pages.length} page${pages.length === 1 ? "" : "s"}`
                : isProcessing
                    ? "Rendering"
                    : selectedFile
                        ? "Ready"
                        : "Empty"}</PdfT>
            </span>
          </div>

          {isProcessing ? (<div className="bg-[#F8FAFC]/60 rounded-2xl border border-dashed border-[#0F172A]/10 p-8 flex flex-col items-center justify-center my-auto text-center py-28">
              <Loader2 size={28} className="text-[#4F46E5] animate-spin mb-3"/>

              <p className="text-xs font-bold text-[#0F172A]"><PdfT>{"Rendering your PDF\u2026\n              "}</PdfT></p>

              <p className="text-[11px] text-[#0F172A] mt-1">
                {progress && progress.total > 0
            ? <PdfT>{`Page ${progress.done} of ${progress.total}`}</PdfT> : <PdfT>{"Getting started…"}</PdfT>}
              </p>
            </div>) : errorMessage ? (<div className="bg-[#0F172A]/5 rounded-2xl border border-dashed border-[#2563EB]/30 p-8 flex flex-col items-center justify-center my-auto text-center py-28">
              <div className="w-10 h-10 bg-[#2563EB]/10 text-[#4F46E5] rounded-xl flex items-center justify-center mb-3 border border-[#2563EB]/30">
                <AlertCircle size={20}/>
              </div>

              <p className="text-xs font-bold text-[#0F172A]"><PdfT>{"Conversion failed\n              "}</PdfT></p>

              <p className="text-[11px] text-[#4F46E5] mt-1 max-w-xs">
                <PdfT>{errorMessage ?? ""}</PdfT>
              </p>
            </div>) : pages ? (<div className="my-auto py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#10B981]/10 text-[#10B981] rounded-lg flex items-center justify-center border border-[#10B981]/20">
                    <CheckCircle2 size={16}/>
                  </div>

                  <p className="text-xs font-bold text-[#0F172A]">
                    <PdfT>{`${pages.length} page${pages.length === 1 ? "" : "s"} converted`}</PdfT>
                  </p>
                </div>

                {pages.length > 1 && (<button onClick={downloadAllAsZip} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] text-white text-[11px] font-bold rounded-lg shadow-xs hover:bg-[#2563EB]/90 transition-all">
                    <Download size={12}/><PdfT>{"Download all (.zip)\n                  "}</PdfT></button>)}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {pages.map((page) => (<div key={page.pageNumber} className="bg-[#F8FAFC] border border-[#0F172A]/10 p-2.5 rounded-xl flex flex-col items-center text-center gap-1.5">
                    <div className="w-full aspect-[3/4] bg-white border border-[#0F172A]/10 rounded-md overflow-hidden flex items-center justify-center">
                      <img src={page.thumbnailUrl} alt={tx(`Page ${page.pageNumber}`)} className="max-w-full max-h-full object-contain"/>
                    </div>

                    <p className="text-[11px] font-bold text-[#0F172A] truncate w-full"><PdfT>{`Page ${page.pageNumber}`}</PdfT></p>

                    <p className="text-[10px] text-[#0F172A]">
                      {formatBytes(page.blob.size)}<PdfT>{"\u00B7 "}</PdfT>{page.format}
                    </p>

                    <button onClick={() => downloadPage(page)} className="mt-1 w-full flex items-center justify-center gap-1 px-2 py-1 border border-[#0F172A]/10 text-[#0F172A] text-[10px] font-bold rounded-lg hover:bg-[#E2E8F0] transition-all">
                      <Download size={11}/><PdfT>{"Download\n                    "}</PdfT></button>
                  </div>))}
              </div>
            </div>) : (<div className="bg-[#F8FAFC]/60 rounded-2xl border border-dashed border-[#0F172A]/10 p-8 flex flex-col items-center justify-center my-auto text-center py-28">
              <div className="w-10 h-10 bg-[#4F46E5]/10 text-[#4F46E5] rounded-xl flex items-center justify-center mb-3 border border-[#4F46E5]/20">
                <FileText size={20}/>
              </div>

              <p className="text-xs font-bold text-[#0F172A]"><PdfT>{"Add files to get started\n              "}</PdfT></p>

              <p className="text-[11px] text-[#0F172A] mt-1"><PdfT>{"Your result will appear here after you run the tool.\n              "}</PdfT></p>
            </div>)}

          <div />
        </div>
      </div>

      {/* Bottom Status & Action Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#0F172A]/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-[#0F172A]">
          <span className={`w-2 h-2 rounded-full shrink-0 ${errorMessage
            ? "bg-[#2563EB]"
            : pages
                ? "bg-[#10B981]"
                : isProcessing
                    ? "bg-[#2563EB] animate-pulse"
                    : "bg-[#0F172A]/40"}`}/>

          <span>
            <PdfT>{errorMessage
              ? "Conversion failed — try again"
              : pages
                  ? `Done: ${pages.length} page${pages.length === 1 ? "" : "s"} ready to download`
                  : isProcessing
                      ? progress && progress.total > 0
                          ? `Rendering page ${progress.done} of ${progress.total}…`
                          : "Rendering…"
                      : selectedFile
                          ? `Ready to convert: ${selectedFile.name}`
                          : "Add an input to get started"}</PdfT>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="px-4 py-2 border border-[#0F172A]/10 text-[#0F172A] text-xs font-bold rounded-xl hover:bg-white transition-all"><PdfT>{"Reset\n          "}</PdfT></button>

          <button onClick={handleConvert} disabled={!canConvert} className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${canConvert
            ? "bg-[#2563EB] text-white shadow-xs hover:bg-[#2563EB]/90"
            : "bg-[#E2E8F0] text-[#0F172A]/45 cursor-not-allowed"}`}>
            {isProcessing ? (<Loader2 size={14} className="animate-spin"/>) : (<FileImage size={14}/>)}

            <span>{isProcessing ? <PdfT>{"Converting…"}</PdfT> : <PdfT>{"Convert to images"}</PdfT>}</span>
          </button>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-[#10B981]/5 border border-[#10B981]/20 p-3 rounded-2xl flex items-center gap-2 text-xs text-[#0F172A] font-medium">
        <Lock size={15} className="text-[#10B981] shrink-0"/>

        <span><PdfT>{"Your files are processed in the browser \u2014 they are not uploaded to any\n          server.\n        "}</PdfT></span>
      </div>

      {/* How to use Accordion */}
      <div className="bg-white rounded-2xl border border-[#0F172A]/10 shadow-xs overflow-hidden">
        <button onClick={() => setShowHowToUse(!showHowToUse)} className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-[#2563EB]"><PdfT>{"?"}</PdfT></span>

            <span><PdfT>{"How to use"}</PdfT></span>
          </div>

          {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>

        {showHowToUse && (<div className="px-5 pb-4 text-xs text-[#0F172A] leading-relaxed border-t border-[#0F172A]/10 pt-3"><PdfT>{"Upload your PDF, choose your preferred image format (JPG, PNG, WebP,\n            or AVIF) and resolution quality, then click \"Convert to images\" to\n            extract pages as image files.\n          "}</PdfT></div>)}
      </div>

      {/* Tools in Same Category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#0F172A]"><PdfT>{"Tools in the same category\n        "}</PdfT></h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/sohoj-tools/compress-pdf" className="bg-[#E2E8F0] p-4 rounded-2xl border border-[#0F172A]/10 shadow-xs hover:border-[#2563EB]/40 transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#4F46E5]/10 text-[#4F46E5] rounded-lg flex items-center justify-center shrink-0">
              <Minimize2 size={16}/>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors"><PdfT>{"Compress PDF\n              "}</PdfT></h4>

              <p className="text-[10px] text-[#0F172A] mt-0.5 line-clamp-1"><PdfT>{"Shrink embedded photos and scans inside a PDF \u2014 text stays\n                sharp.\n              "}</PdfT></p>
            </div>
          </Link>

          <Link href="/sohoj-tools/merge-pdfs" className="bg-[#E2E8F0] p-4 rounded-2xl border border-[#0F172A]/10 shadow-xs hover:border-[#2563EB]/40 transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#4F46E5]/10 text-[#4F46E5] rounded-lg flex items-center justify-center shrink-0">
              <Combine size={16}/>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors"><PdfT>{"Merge PDFs\n              "}</PdfT></h4>

              <p className="text-[10px] text-[#0F172A] mt-0.5 line-clamp-1"><PdfT>{"Combine multiple PDF files into one document in your chosen\n                order.\n              "}</PdfT></p>
            </div>
          </Link>
        </div>
      </div>
    </div>);
}
