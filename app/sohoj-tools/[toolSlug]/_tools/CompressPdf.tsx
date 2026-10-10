"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, { useState } from "react";
import Link from "next/link";
import { Minimize2, Star, Share2, Upload, FileText, Lock, ChevronDown, ChevronUp, Combine, FilePlus, FileCode, ArrowLeft, X, Loader2, Download, CheckCircle2, AlertCircle, } from "lucide-react";
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRawStream, PDFNumber, } from "pdf-lib";
// ---------------------------------------------------------------------------
// Compression engine (pdf-lib + Canvas)
// ---------------------------------------------------------------------------
// pdf-lib has no built-in "compress" API. The actual size reduction comes
// from walking every page's image XObjects, decoding them, redrawing them
// onto a canvas at a lower resolution/quality, and re-embedding them as
// JPEGs. Text and vector content are left untouched, so text stays sharp.
type CompressionLevel = "balanced" | "light" | "strong";
interface CompressionSettings {
    quality: number; // JPEG quality 0-1
    maxDimension: number; // longest side, in px
}
const PRESET_SETTINGS: Record<CompressionLevel, CompressionSettings> = {
    light: {
        quality: 0.82,
        maxDimension: 2200,
    },
    balanced: {
        quality: 0.62,
        maxDimension: 1600,
    },
    strong: {
        quality: 0.38,
        maxDimension: 1100,
    },
};
// Settings tried in order when the user asks for a target file size.
const TARGET_SIZE_LADDER: CompressionSettings[] = [
    {
        quality: 0.85,
        maxDimension: 2200,
    },
    {
        quality: 0.7,
        maxDimension: 1800,
    },
    {
        quality: 0.55,
        maxDimension: 1500,
    },
    {
        quality: 0.4,
        maxDimension: 1200,
    },
    {
        quality: 0.28,
        maxDimension: 1000,
    },
    {
        quality: 0.18,
        maxDimension: 800,
    },
];
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
// ---------------------------------------------------------------------------
// TypeScript Blob compatibility fix
// ---------------------------------------------------------------------------
//
// Newer TypeScript/lib.dom typings may treat Uint8Array as
// Uint8Array<ArrayBufferLike>, which is not directly accepted as BlobPart.
//
// This helper creates a real ArrayBuffer explicitly.
// This keeps the rest of the original functionality unchanged.
//
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const buffer = new ArrayBuffer(bytes.byteLength);
    const view = new Uint8Array(buffer);
    view.set(bytes);
    return buffer;
}
function getFilterName(dict: PDFDict): string {
    // Use get() instead of lookupMaybe() here because
    // newer pdf-lib typings can narrow the generic overload
    // to never for PDFName/PDFArray combinations.
    const filter = dict.get(PDFName.of("Filter"));
    if (filter instanceof PDFName) {
        return filter.asString();
    }
    if (filter instanceof PDFArray) {
        const values = filter.asArray();
        const last = values[values.length - 1];
        return last instanceof PDFName ? last.asString() : "";
    }
    return "";
}
function getNumber(dict: PDFDict, key: string): number | undefined {
    const value = dict.lookupMaybe(PDFName.of(key), PDFNumber);
    return value instanceof PDFNumber ? value.asNumber() : undefined;
}
// ---------------------------------------------------------------------------
// Decodes a raw image XObject stream into a bitmap we can redraw. Handles
// plain JPEGs (the overwhelming majority of scans/photos in PDFs) and
// simple uncompressed/Flate RGB or grayscale samples. Anything more exotic
// (JPEG2000, CMYK, indexed color, soft masks) is left untouched rather than
// risking a broken image.
// ---------------------------------------------------------------------------
async function decodeXObjectToBitmap(stream: PDFRawStream): Promise<ImageBitmap | null> {
    const { dict } = stream;
    const filterName = getFilterName(dict);
    const contents = stream.getContents();
    if (filterName.includes("DCTDecode")) {
        try {
            // FIX:
            // Do not pass Uint8Array<ArrayBufferLike>
            // directly to Blob.
            const blob = new Blob([toArrayBuffer(contents)], {
                type: "image/jpeg",
            });
            return await createImageBitmap(blob);
        }
        catch {
            return null;
        }
    }
    const isRawOrFlate = filterName === "" || filterName.includes("FlateDecode");
    if (isRawOrFlate) {
        try {
            const width = getNumber(dict, "Width");
            const height = getNumber(dict, "Height");
            const bitsPerComponent = getNumber(dict, "BitsPerComponent");
            const hasSMask = !!dict.get(PDFName.of("SMask"));
            const colorSpaceObj = dict.lookupMaybe(PDFName.of("ColorSpace"), PDFName);
            const colorSpace = colorSpaceObj instanceof PDFName ? colorSpaceObj.asString() : "";
            const isRGB = colorSpace.includes("DeviceRGB");
            const isGray = colorSpace.includes("DeviceGray");
            if (!width ||
                !height ||
                bitsPerComponent !== 8 ||
                hasSMask ||
                (!isRGB && !isGray)) {
                return null;
            }
            const channels = isRGB ? 3 : 1;
            const expectedLength = width * height * channels;
            if (contents.length < expectedLength) {
                return null;
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                return null;
            }
            const imageData = ctx.createImageData(width, height);
            for (let src = 0, dst = 0; src < expectedLength; src += channels, dst += 4) {
                if (isRGB) {
                    imageData.data[dst] = contents[src];
                    imageData.data[dst + 1] = contents[src + 1];
                    imageData.data[dst + 2] = contents[src + 2];
                }
                else {
                    const v = contents[src];
                    imageData.data[dst] = v;
                    imageData.data[dst + 1] = v;
                    imageData.data[dst + 2] = v;
                }
                imageData.data[dst + 3] = 255;
            }
            ctx.putImageData(imageData, 0, 0);
            return await createImageBitmap(canvas);
        }
        catch {
            return null;
        }
    }
    return null;
}
async function recompressBitmap(bitmap: ImageBitmap, settings: CompressionSettings): Promise<Uint8Array | null> {
    const scale = Math.min(1, settings.maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return null;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", settings.quality));
    if (!blob) {
        return null;
    }
    return new Uint8Array(await blob.arrayBuffer());
}
async function compressImagesInDocument(pdfDoc: PDFDocument, settings: CompressionSettings): Promise<void> {
    const pages = pdfDoc.getPages();
    for (const page of pages) {
        const resources = page.node.Resources();
        if (!resources) {
            continue;
        }
        const xObjects = resources.lookupMaybe(PDFName.of("XObject"), PDFDict);
        if (!xObjects) {
            continue;
        }
        for (const [name, ref] of xObjects.entries()) {
            try {
                const obj = pdfDoc.context.lookup(ref);
                if (!(obj instanceof PDFRawStream)) {
                    continue;
                }
                const subtype = obj.dict.get(PDFName.of("Subtype"));
                const isImage = subtype instanceof PDFName && subtype.asString().includes("Image");
                if (!isImage) {
                    continue;
                }
                const originalBytes = obj.getContents();
                // Skip tiny images (icons, bullets) — re-encoding rarely helps
                // and JPEG overhead can make them bigger.
                if (originalBytes.length < 3000) {
                    continue;
                }
                const bitmap = await decodeXObjectToBitmap(obj);
                if (!bitmap) {
                    continue;
                }
                try {
                    const newBytes = await recompressBitmap(bitmap, settings);
                    if (!newBytes || newBytes.length >= originalBytes.length) {
                        continue;
                    }
                    const embedded = await pdfDoc.embedJpg(newBytes);
                    xObjects.set(name, embedded.ref);
                }
                finally {
                    bitmap.close?.();
                }
            }
            catch {
                // Leave this image untouched if anything goes wrong decoding it.
                continue;
            }
        }
    }
}
async function compressPdfFile(file: File, settings: CompressionSettings): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(bytes, {
        updateMetadata: false,
    });
    await compressImagesInDocument(pdfDoc, settings);
    return pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
    });
}
async function compressPdfToTarget(file: File, targetBytes: number): Promise<Uint8Array> {
    let best: Uint8Array | null = null;
    for (const settings of TARGET_SIZE_LADDER) {
        const output = await compressPdfFile(file, settings);
        best = output;
        if (output.byteLength <= targetBytes) {
            break;
        }
    }
    return best as Uint8Array;
}
interface CompressionResult {
    bytes: Uint8Array;
    originalSize: number;
    compressedSize: number;
}
/**
 * Page-specific whole-phrase English ↔ Bangla translations.
 * Translate complete UI phrases rather than word-by-word fragments, so language
 * switching never leaves half-translated sentences. PDF names, file names,
 * units, formats and technical identifiers are kept intact where appropriate.
 */
const COMPRESS_PDF_BN: Record<string, string> = {
    "back to tools": "টুলসের তালিকায় ফিরে যান",
    "/": "/",
    "pdf tools": "PDF টুলস",
    "compress pdf": "PDF-এর আকার কমান",
    "free": "বিনামূল্যে",
    "shrink embedded photos and scans inside a pdf — text stays sharp.": "PDF-এর ভেতরের ছবি ও স্ক্যানের আকার কমান—লেখার স্পষ্টতা বজায় থাকবে।",
    "files (": "ফাইল (",
    "add an input to get started": "শুরু করতে একটি ফাইল যোগ করুন",
    ")": ")",
    "drop pdf files here or click to upload": "PDF ফাইল এখানে টেনে আনুন অথবা আপলোড করতে ক্লিক করুন",
    "pdf files, max 500 mb each": "প্রতিটি PDF ফাইল সর্বোচ্চ ৫০০ MB",
    "mb": "MB",
    "compression settings": "সংকোচনের সেটিংস",
    "quality preset": "মানের পূর্বনির্ধারিত সেটিংস",
    "target file size": "লক্ষ্য ফাইলের আকার",
    "compression level": "সংকোচনের মাত্রা",
    "balanced": "ভারসাম্যপূর্ণ",
    "good balance for mixed text and images": "লেখা ও ছবির জন্য মান ও আকারের মধ্যে ভালো ভারসাম্য",
    "light compression": "হালকা সংকোচন",
    "gentle image reduction, best for text-heavy pdfs": "ছবির আকার অল্প কমায়; বেশি লেখা থাকা PDF-এর জন্য উপযোগী",
    "strong compression": "জোরালো সংকোচন",
    "smaller images, ideal for scans and photos": "ছবির আকার আরও কমায়; স্ক্যান ও ছবির জন্য উপযোগী",
    "target size (mb)": "লক্ষ্য আকার (MB)",
    "we'll try a few quality levels and use the closest match at or under your target.": "আমরা কয়েকটি মানের সেটিংস পরীক্ষা করে আপনার নির্ধারিত আকারের সমান বা তার চেয়ে ছোট সবচেয়ে কাছের ফলটি বেছে নেব।",
    "e.g. 2": "যেমন: ২",
    "compression preview": "সংকোচনের পূর্বরূপ",
    "error": "ত্রুটি",
    "done": "সম্পন্ন",
    "compressing": "সংকোচন করা হচ্ছে",
    "ready": "প্রস্তুত",
    "empty": "খালি",
    "compressing your pdf…": "আপনার PDF সংকুচিত করা হচ্ছে…",
    "everything runs in your browser — larger files take a little longer.": "সব কাজ আপনার ব্রাউজারেই হয়—বড় ফাইলের ক্ষেত্রে একটু বেশি সময় লাগতে পারে।",
    "compression failed": "PDF সংকুচিত করা যায়নি",
    "original": "আগের আকার",
    "compressed": "সংকুচিত আকার",
    "already well optimized": "ফাইলটি আগে থেকেই ভালোভাবে অপ্টিমাইজ করা আছে",
    "download compressed pdf": "সংকুচিত PDF ডাউনলোড করুন",
    "add a pdf to get started": "শুরু করতে একটি PDF যোগ করুন",
    "the compressed file will appear here after processing.": "প্রক্রিয়াকরণ শেষ হলে সংকুচিত ফাইলটি এখানে দেখা যাবে।",
    "compression failed — try again": "PDF সংকুচিত করা যায়নি—আবার চেষ্টা করুন",
    "reset": "রিসেট করুন",
    "compressing…": "সংকোচন করা হচ্ছে…",
    "your files are processed in the browser — they are not uploaded to any server.": "আপনার ফাইলগুলো ব্রাউজারেই প্রক্রিয়াকরণ করা হয়—কোনো সার্ভারে আপলোড করা হয় না।",
    "how to use": "ব্যবহারের নিয়ম",
    "drag and drop your pdf file into the upload box or click to select a file. choose your preferred compression quality or target file size, then click \"compress pdf\" to start shrinking your document.": "আপনার PDF ফাইলটি আপলোডের ঘরে টেনে আনুন অথবা ক্লিক করে নির্বাচন করুন। পছন্দের সংকোচনের মান বা লক্ষ্য ফাইলের আকার বেছে নিয়ে নথির আকার কমাতে “PDF-এর আকার কমান” বাটনে ক্লিক করুন।",
    "tools in the same category": "একই বিভাগের অন্যান্য টুল",
    "merge pdfs": "একাধিক PDF একত্র করুন",
    "combine multiple pdf files into one document in your chosen order.": "একাধিক PDF আপনার পছন্দের ক্রমে একটি নথিতে একত্র করুন।",
    "split pdf": "PDF ভাগ করুন",
    "extract specific pages or split every page into separate files.": "নির্দিষ্ট পৃষ্ঠাগুলো বের করুন অথবা প্রতিটি পৃষ্ঠা আলাদা ফাইলে ভাগ করুন।",
    "add to favorites": "পছন্দের তালিকায় যোগ করুন",
    "share this tool": "এই টুলটি শেয়ার করুন",
};

function toBanglaCompressDigits(value: string): string {
    return value.replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

function translateCompressPdfText(value: string, locale: string | undefined): string {
    const raw = String(value ?? "");
    if (!String(locale ?? "").toLowerCase().startsWith("bn")) return raw;

    const normalized = raw.replace(/\s+/g, " ").trim().toLowerCase();
    const exact = COMPRESS_PDF_BN[normalized];
    if (exact !== undefined) return exact;

    let match = normalized.match(/^files \((\d+)\)$/);
    if (match) return `ফাইল (${toBanglaCompressDigits(match[1])})`;

    match = normalized.match(/^(\d+)% smaller$/);
    if (match) return `ফাইলের আকার ${toBanglaCompressDigits(match[1])}% কমেছে`;

    match = raw.trim().match(/^Done: (.+) \((\d+)% smaller\)$/i);
    if (match) return `সম্পন্ন: সংকুচিত ফাইলের আকার ${match[1]} (${toBanglaCompressDigits(match[2])}% কমেছে)`;

    match = raw.trim().match(/^Ready to compress: (.+)$/i);
    if (match) return `সংকোচনের জন্য প্রস্তুত: ${match[1]}`;

    match = normalized.match(/^enter a valid target size in mb first\.$/i);
    if (match) return "প্রথমে MB-তে একটি বৈধ লক্ষ্য আকার লিখুন।";

    match = normalized.match(/^something went wrong while compressing this pdf\.$/i);
    if (match) return "PDF সংকুচিত করার সময় একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।";

    // Known runtime errors may differ by pdf-lib/browser version. Avoid exposing
    // untranslated parser messages in Bangla mode; show a clear localized error.
    if (/pdf|image|stream|object|parse|invalid|unsupported|encrypt|decode|canvas/i.test(raw)) {
        return "PDF ফাইলটি প্রক্রিয়াকরণ করা যায়নি। ফাইলটি ঠিক আছে কি না পরীক্ষা করে আবার চেষ্টা করুন।";
    }
    return raw;
}

function CompressT({ children }: { children: React.ReactNode }) {
    const { locale } = useSohozI18n();
    if (typeof children !== "string") return <>{children}</>;
    return <>{translateCompressPdfText(children, locale)}</>;
}

function getCompressPdfErrorMessage(error: unknown, locale: string | undefined): string {
    const message = error instanceof Error ? error.message : "";
    if (String(locale ?? "").toLowerCase().startsWith("bn")) {
        if (message.includes("Enter a valid target size in MB first.")) {
            return "প্রথমে MB-তে একটি বৈধ লক্ষ্য আকার লিখুন।";
        }
        return "PDF সংকুচিত করার সময় একটি সমস্যা হয়েছে। ফাইলটি ঠিক আছে কি না পরীক্ষা করে আবার চেষ্টা করুন।";
    }
    return message || "Something went wrong while compressing this PDF.";
}

export default function CompressPdf() {
    const { locale } = useSohozI18n();
    const tx = (value: string) => translateCompressPdfText(value, locale);
    const [tabMode, setTabMode] = useState<"preset" | "target">("preset");
    const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>("balanced");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showHowToUse, setShowHowToUse] = useState(false);
    const [targetSizeMB, setTargetSizeMB] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [result, setResult] = useState<CompressionResult | null>(null);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setResult(null);
            setErrorMessage(null);
        }
    };
    const handleReset = () => {
        setSelectedFile(null);
        setResult(null);
        setErrorMessage(null);
        setIsProcessing(false);
    };
    const handleCompress = async () => {
        if (!selectedFile) {
            return;
        }
        setIsProcessing(true);
        setErrorMessage(null);
        setResult(null);
        try {
            let bytes: Uint8Array;
            if (tabMode === "target") {
                const targetMB = parseFloat(targetSizeMB);
                if (!targetMB || targetMB <= 0) {
                    throw new Error("Enter a valid target size in MB first.");
                }
                bytes = await compressPdfToTarget(selectedFile, targetMB * 1024 * 1024);
            }
            else {
                bytes = await compressPdfFile(selectedFile, PRESET_SETTINGS[compressionLevel]);
            }
            setResult({
                bytes,
                originalSize: selectedFile.size,
                compressedSize: bytes.byteLength,
            });
        }
        catch (err) {
            console.error(err);
            setErrorMessage(getCompressPdfErrorMessage(err, locale));
        }
        finally {
            setIsProcessing(false);
        }
    };
    const handleDownload = () => {
        if (!result || !selectedFile) {
            return;
        }
        // FIX:
        // Explicitly create a true ArrayBuffer so the
        // value is always accepted as BlobPart.
        const blob = new Blob([toArrayBuffer(result.bytes)], {
            type: "application/pdf",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const baseName = selectedFile.name.replace(/\.pdf$/i, "");
        a.download = `${baseName}-compressed.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    const reductionPercent = result
        ? Math.max(0, Math.round((1 - result.compressedSize / result.originalSize) * 100))
        : 0;
    return (<div id="compress-pdf-tool" className="w-full space-y-5 bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Pointer cursor on every clickable element of this tool */}
      <style>{`
        #compress-pdf-tool a[href],
        #compress-pdf-tool button:not(:disabled),
        #compress-pdf-tool label:has(input[type="file"]),
        #compress-pdf-tool summary,
        #compress-pdf-tool [role="button"],
        #compress-pdf-tool select,
        #compress-pdf-tool input[type="color"],
        #compress-pdf-tool input[type="range"],
        #compress-pdf-tool input[type="checkbox"],
        #compress-pdf-tool input[type="radio"],
        #compress-pdf-tool input[type="file"] {
          cursor: pointer;
        }

        #compress-pdf-tool button:disabled {
          cursor: not-allowed;
        }
      `}</style>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#0F172A]">
        <Link href="/sohoj-tools" className="flex items-center gap-1 hover:text-[#0F172A] transition-colors">
          <ArrowLeft size={14}/>
          <span><CompressT>{"Back to Tools"}</CompressT></span>
        </Link>

        <span><CompressT>{"/"}</CompressT></span>

        <span><CompressT>{"PDF Tools"}</CompressT></span>

        <span><CompressT>{"/"}</CompressT></span>

        <span className="font-semibold text-[#0F172A]"><CompressT>{"Compress PDF"}</CompressT></span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#0F172A]/10 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#4F46E5]/10 text-[#4F46E5] rounded-xl flex items-center justify-center shrink-0 border border-[#4F46E5]/20">
            <Minimize2 size={24}/>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#0F172A]"><CompressT>{"Compress PDF"}</CompressT></h1>

              <span className="bg-[#10B981]/10 text-[#10B981] text-[10px] font-bold px-2 py-0.5 rounded-full"><CompressT>{"Free\n              "}</CompressT></span>
            </div>

            <p className="text-xs text-[#0F172A] font-medium mt-0.5"><CompressT>{"Shrink embedded photos and scans inside a PDF \u2014 text stays sharp.\n            "}</CompressT></p>
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
        {/* Left Side: Upload & Options */}
        <div className="lg:col-span-4 space-y-4">
          {/* Upload Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#0F172A]/10 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#0F172A]">{tx(`Files (${selectedFile ? 1 : 0})`)}</h2>

            {!selectedFile ? (<label className="border-2 border-dashed border-[#2563EB]/30 bg-[#2563EB]/5 hover:bg-[#2563EB]/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                <div className="w-10 h-10 bg-[#2563EB]/10 text-[#2563EB] rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload size={20}/>
                </div>

                <span className="text-xs font-bold text-[#0F172A]"><CompressT>{"Drop PDF files here or click to upload\n                "}</CompressT></span>

                <span className="text-[10px] text-[#0F172A] font-medium mt-1"><CompressT>{"PDF files, max 500 MB each\n                "}</CompressT></span>

                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden"/>
              </label>) : (<div className="bg-[#F8FAFC] border border-[#0F172A]/10 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 bg-[#2563EB]/10 text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={16}/>
                  </div>

                  <div className="truncate">
                    <p className="text-xs font-bold text-[#0F172A] truncate">
                      {selectedFile.name}
                    </p>

                    <p className="text-[10px] text-[#0F172A]">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)}<CompressT>{"MB\n                    "}</CompressT></p>
                  </div>
                </div>

                <button onClick={handleReset} className="p-1 text-[#0F172A] hover:text-[#2563EB] rounded-lg transition-colors">
                  <X size={16}/>
                </button>
              </div>)}
          </div>

          {/* Compression Settings Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#0F172A]/10 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#0F172A]"><CompressT>{"Compression settings\n            "}</CompressT></h2>

            {/* Toggle Tabs */}
            <div className="bg-[#F8FAFC] p-1 rounded-xl flex items-center gap-1">
              <button onClick={() => setTabMode("preset")} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tabMode === "preset"
            ? "bg-white text-[#0F172A] shadow-xs"
            : "text-[#0F172A] hover:text-[#2563EB]"}`}><CompressT>{"Quality preset\n              "}</CompressT></button>

              <button onClick={() => setTabMode("target")} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tabMode === "target"
            ? "bg-white text-[#0F172A] shadow-xs"
            : "text-[#0F172A] hover:text-[#2563EB]"}`}><CompressT>{"Target file size\n              "}</CompressT></button>
            </div>

            {tabMode === "preset" ? (<div className="space-y-2">
                <span className="text-[11px] font-bold text-[#0F172A] block"><CompressT>{"Compression level\n                "}</CompressT></span>

                {/* Level 1: Balanced */}
                <button onClick={() => setCompressionLevel("balanced")} className={`w-full text-left p-3 rounded-xl border transition-all ${compressionLevel === "balanced"
                ? "border-[#2563EB] bg-[#2563EB]/5"
                : "border-[#0F172A]/10 bg-[#F8FAFC] hover:bg-white"}`}>
                  <div className="text-xs font-bold text-[#0F172A]"><CompressT>{"Balanced\n                  "}</CompressT></div>

                  <div className="text-[10px] text-[#0F172A] mt-0.5"><CompressT>{"Good balance for mixed text and images\n                  "}</CompressT></div>
                </button>

                {/* Level 2: Light */}
                <button onClick={() => setCompressionLevel("light")} className={`w-full text-left p-3 rounded-xl border transition-all ${compressionLevel === "light"
                ? "border-[#2563EB] bg-[#2563EB]/5"
                : "border-[#0F172A]/10 bg-[#F8FAFC] hover:bg-white"}`}>
                  <div className="text-xs font-bold text-[#0F172A]"><CompressT>{"Light compression\n                  "}</CompressT></div>

                  <div className="text-[10px] text-[#0F172A] mt-0.5"><CompressT>{"Gentle image reduction, best for text-heavy PDFs\n                  "}</CompressT></div>
                </button>

                {/* Level 3: Strong */}
                <button onClick={() => setCompressionLevel("strong")} className={`w-full text-left p-3 rounded-xl border transition-all ${compressionLevel === "strong"
                ? "border-[#2563EB] bg-[#2563EB]/5"
                : "border-[#0F172A]/10 bg-[#F8FAFC] hover:bg-white"}`}>
                  <div className="text-xs font-bold text-[#0F172A]"><CompressT>{"Strong compression\n                  "}</CompressT></div>

                  <div className="text-[10px] text-[#0F172A] mt-0.5"><CompressT>{"Smaller images, ideal for scans and photos\n                  "}</CompressT></div>
                </button>
              </div>) : (<div className="pt-2 space-y-2">
                <label className="text-[11px] font-bold text-[#0F172A] block"><CompressT>{"Target size (MB)\n                "}</CompressT></label>

                <input type="number" min="0.1" step="0.1" value={targetSizeMB} onChange={(e) => setTargetSizeMB(e.target.value)} placeholder={tx("e.g. 2")} className="w-full bg-[#F8FAFC] border border-[#0F172A]/10 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"/>

                <p className="text-[10px] text-[#0F172A]"><CompressT>{"We'll try a few quality levels and use the closest match at or\n                  under your target.\n                "}</CompressT></p>
              </div>)}
          </div>
        </div>

        {/* Right Side: Compression Preview */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-[#0F172A]/10 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#0F172A]"><CompressT>{"Compression preview\n            "}</CompressT></h2>

            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${errorMessage
            ? "bg-[#0F172A]/5 text-[#0F172A]"
            : result
                ? "bg-[#10B981]/10 text-[#10B981]"
                : isProcessing
                    ? "bg-[#E2E8F0] text-[#2563EB]"
                    : selectedFile
                        ? "bg-[#2563EB]/10 text-[#2563EB]"
                        : "bg-[#F8FAFC] text-[#0F172A]"}`}>
              {errorMessage
        ? <CompressT>{"Error"}</CompressT> : result
        ? tx("Done")
        : isProcessing
            ? tx("Compressing")
            : selectedFile
                ? tx("Ready")
                : tx("Empty")}
            </span>
          </div>

          {isProcessing ? (<div className="bg-[#F8FAFC] rounded-2xl border border-dashed border-[#0F172A]/10 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <Loader2 size={28} className="text-[#4F46E5] animate-spin mb-3"/>

              <p className="text-xs font-bold text-[#0F172A]"><CompressT>{"Compressing your PDF\u2026\n              "}</CompressT></p>

              <p className="text-[11px] text-[#0F172A] mt-1"><CompressT>{"Everything runs in your browser \u2014 larger files take a little\n                longer.\n              "}</CompressT></p>
            </div>) : errorMessage ? (<div className="bg-[#0F172A]/5 rounded-2xl border border-dashed border-[#0F172A]/15 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <div className="w-10 h-10 bg-[#4F46E5]/10 text-[#4F46E5] rounded-xl flex items-center justify-center mb-3 border border-[#4F46E5]/20">
                <AlertCircle size={20}/>
              </div>

              <p className="text-xs font-bold text-[#0F172A]"><CompressT>{"Compression failed\n              "}</CompressT></p>

              <p className="text-[11px] text-[#0F172A] mt-1 max-w-xs">
                {errorMessage}
              </p>
            </div>) : result ? (<div className="my-auto py-10 flex flex-col items-center gap-5">
              <div className="w-12 h-12 bg-[#10B981]/10 text-[#10B981] rounded-xl flex items-center justify-center border border-[#10B981]/20">
                <CheckCircle2 size={24}/>
              </div>

              <div className="flex items-center gap-4 sm:gap-8">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wide"><CompressT>{"Original\n                  "}</CompressT></p>

                  <p className="text-sm font-bold text-[#0F172A]">
                    {formatBytes(result.originalSize)}
                  </p>
                </div>

                <span className="text-[#0F172A]/40 text-lg"><CompressT>{"\u2192"}</CompressT></span>

                <div className="text-center">
                  <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wide"><CompressT>{"Compressed\n                  "}</CompressT></p>

                  <p className="text-sm font-bold text-[#10B981]">
                    {formatBytes(result.compressedSize)}
                  </p>
                </div>
              </div>

              <span className="bg-[#10B981]/10 text-[#10B981] text-xs font-bold px-3 py-1 rounded-full">
                {reductionPercent > 0
            ? <CompressT>{`${reductionPercent}% smaller`}</CompressT> : <CompressT>{"Already well optimized"}</CompressT>}
              </span>

              <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#2563EB]/90 transition-all">
                <Download size={14}/><CompressT>{"Download compressed PDF\n              "}</CompressT></button>
            </div>) : (<div className="bg-[#F8FAFC] rounded-2xl border border-dashed border-[#0F172A]/10 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <div className="w-10 h-10 bg-[#4F46E5]/10 text-[#4F46E5] rounded-xl flex items-center justify-center mb-3 border border-[#4F46E5]/20">
                <FileText size={20}/>
              </div>

              <p className="text-xs font-bold text-[#0F172A]"><CompressT>{"Add a PDF to get started\n              "}</CompressT></p>

              <p className="text-[11px] text-[#0F172A] mt-1"><CompressT>{"The compressed file will appear here after processing.\n              "}</CompressT></p>
            </div>)}

          <div />
        </div>
      </div>

      {/* Bottom Status & Actions */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#0F172A]/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-[#0F172A]">
          <span className={`w-2 h-2 rounded-full shrink-0 ${errorMessage
            ? "bg-[#2563EB]"
            : result
                ? "bg-[#10B981]"
                : isProcessing
                    ? "bg-[#2563EB] animate-pulse"
                    : "bg-[#0F172A]/40"}`}/>

          <span>
            {errorMessage
        ? <CompressT>{"Compression failed — try again"}</CompressT> : result
        ? tx(`Done: ${formatBytes(result.compressedSize)} (${reductionPercent}% smaller)`)
        : isProcessing
            ? tx("Compressing…")
            : selectedFile
                ? tx(`Ready to compress: ${selectedFile.name}`)
                : tx("Add an input to get started")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="px-4 py-2 border border-[#0F172A]/15 text-[#0F172A] text-xs font-bold rounded-xl hover:bg-[#F8FAFC] transition-all"><CompressT>{"Reset\n          "}</CompressT></button>

          <button onClick={handleCompress} disabled={!selectedFile || isProcessing} className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${selectedFile && !isProcessing
            ? "bg-[#2563EB] text-white shadow-xs hover:bg-[#2563EB]/90"
            : "bg-[#E2E8F0] text-[#0F172A]/45 cursor-not-allowed"}`}>
            {isProcessing && <Loader2 size={14} className="animate-spin"/>}

            {isProcessing ? <CompressT>{"Compressing…"}</CompressT> : <CompressT>{"Compress PDF"}</CompressT>}
          </button>
        </div>
      </div>

      {/* Security Info Banner */}
      <div className="bg-[#10B981]/5 border border-[#10B981]/20 p-3 rounded-2xl flex items-center gap-2 text-xs text-[#0F172A] font-medium">
        <Lock size={15} className="text-[#10B981] shrink-0"/>

        <span><CompressT>{"Your files are processed in the browser \u2014 they are not uploaded to any\n          server.\n        "}</CompressT></span>
      </div>

      {/* How to use Accordion */}
      <div className="bg-white rounded-2xl border border-[#0F172A]/10 shadow-xs overflow-hidden">
        <button onClick={() => setShowHowToUse(!showHowToUse)} className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-[#0F172A] hover:bg-white/60 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-[#2563EB]"><CompressT>{"?"}</CompressT></span>

            <span><CompressT>{"How to use"}</CompressT></span>
          </div>

          {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>

        {showHowToUse && (<div className="px-5 pb-4 text-xs text-[#0F172A] leading-relaxed border-t border-[#0F172A]/10 pt-3"><CompressT>{"Drag and drop your PDF file into the upload box or click to select a\n            file. Choose your preferred compression quality or target file size,\n            then click \"Compress PDF\" to start shrinking your document.\n          "}</CompressT></div>)}
      </div>

      {/* Related Tools Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#0F172A]"><CompressT>{"Tools in the same category\n        "}</CompressT></h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/sohoj-tools/merge-pdfs" className="bg-[#E2E8F0] p-4 rounded-2xl border border-[#0F172A]/10 shadow-xs hover:border-[#2563EB]/40 transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#4F46E5]/10 text-[#4F46E5] rounded-lg flex items-center justify-center shrink-0">
              <Combine size={16}/>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors"><CompressT>{"Merge PDFs\n              "}</CompressT></h4>

              <p className="text-[10px] text-[#0F172A] mt-0.5 line-clamp-1"><CompressT>{"Combine multiple PDF files into one document in your chosen\n                order.\n              "}</CompressT></p>
            </div>
          </Link>

          <Link href="/sohoj-tools/split-pdf" className="bg-[#E2E8F0] p-4 rounded-2xl border border-[#0F172A]/10 shadow-xs hover:border-[#2563EB]/40 transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#4F46E5]/10 text-[#4F46E5] rounded-lg flex items-center justify-center shrink-0">
              <FileCode size={16}/>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors"><CompressT>{"Split PDF\n              "}</CompressT></h4>

              <p className="text-[10px] text-[#0F172A] mt-0.5 line-clamp-1"><CompressT>{"Extract specific pages or split every page into separate files.\n              "}</CompressT></p>
            </div>
          </Link>
        </div>
      </div>
    </div>);
}
