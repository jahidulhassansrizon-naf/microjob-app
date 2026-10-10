"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, { useState } from "react";
import Link from "next/link";
import { FileCode, Star, Share2, Upload, FileText, Lock, ChevronDown, ChevronUp, Minimize2, Combine, ArrowLeft, X, Plus, Loader2, Download, CheckCircle2, AlertCircle, } from "lucide-react";
import { PDFDocument } from "pdf-lib";
// ---------------------------------------------------------------------------
// Page-specific, context-aware translations. Keep format names such as PDF,
// MB and KB intact, but translate complete UI sentences and dynamic statuses.
// ---------------------------------------------------------------------------
function normalizeSplitPdfText(value: string): string {
    return String(value ?? "")
        .replace(/[’‘]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[–—]/g, "-")
        .replace(/\r\n/g, " ")
        .replace(/[\r\n]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function splitPdfDigits(value: number | string): string {
    return String(value).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

const SPLIT_PDF_BN: Record<string, string> = Object.fromEntries(Object.entries({
    "back to tools": "টুলসমূহে ফিরে যান",
    "pdf tools": "PDF টুলস",
    "split pdf": "PDF ভাগ করুন",
    "free": "বিনামূল্যে",
    "extract specific pages or split every page into separate files.": "নির্দিষ্ট পৃষ্ঠাগুলো আলাদা করুন অথবা প্রতিটি পৃষ্ঠাকে পৃথক PDF ফাইলে ভাগ করুন।",
    "add": "যোগ করুন",
    "drop a pdf here or click to upload": "এখানে PDF ফাইল টেনে আনুন অথবা আপলোড করতে ক্লিক করুন",
    "1 pdf file, max 500 mb": "সর্বোচ্চ ৫০০ MB আকারের ১টি PDF ফাইল",
    "split options": "ভাগ করার বিকল্প",
    "all pages": "সব পৃষ্ঠা",
    "page ranges": "পৃষ্ঠার পরিসর",
    "pages or ranges": "পৃষ্ঠা বা পৃষ্ঠার পরিসর",
    "preview": "প্রিভিউ",
    "error": "ত্রুটি",
    "splitting": "ভাগ করা হচ্ছে",
    "reading": "পড়া হচ্ছে",
    "ready": "প্রস্তুত",
    "empty": "খালি",
    "splitting your pdf…": "PDF ভাগ করা হচ্ছে…",
    "reading your pdf…": "PDF পড়া হচ্ছে…",
    "everything runs in your browser - larger files take a little longer.": "সব কাজ আপনার ব্রাউজারেই হয়—বড় ফাইলের ক্ষেত্রে একটু বেশি সময় লাগতে পারে।",
    "split failed": "PDF ভাগ করা যায়নি",
    "download all": "সবগুলো ডাউনলোড করুন",
    "download": "ডাউনলোড করুন",
    "choose your split options": "PDF ভাগ করার বিকল্প বেছে নিন",
    "add files to get started": "শুরু করতে PDF ফাইল যোগ করুন",
    "your result will appear here after you run the tool.": "টুলটি চালানোর পর ফলাফল এখানে দেখা যাবে।",
    "split failed - try again": "PDF ভাগ করা যায়নি—আবার চেষ্টা করুন",
    "splitting…": "ভাগ করা হচ্ছে…",
    "reading pdf…": "PDF পড়া হচ্ছে…",
    "add an input to get started": "শুরু করতে একটি PDF ফাইল যোগ করুন",
    "reset": "রিসেট করুন",
    "your files are processed in the browser - they are not uploaded to any server.": "আপনার ফাইলগুলো ব্রাউজারেই প্রক্রিয়াকরণ করা হয়—কোনো সার্ভারে আপলোড করা হয় না।",
    "how to use": "ব্যবহারের নিয়ম",
    'upload your pdf file, choose the pages you want to extract or select page ranges, then click "split pdf" to save them as separate files.': 'আপনার PDF ফাইল আপলোড করুন, আলাদা করতে চান এমন পৃষ্ঠা বা পৃষ্ঠার পরিসর বেছে নিন, তারপর “PDF ভাগ করুন” চাপুন। পৃষ্ঠাগুলো আলাদা ফাইল হিসেবে সংরক্ষিত হবে।',
    "tools in the same category": "একই বিভাগের অন্যান্য টুল",
    "compress pdf": "PDF সংকুচিত করুন",
    "shrink embedded photos and scans inside a pdf - text stays sharp.": "PDF-এর ভেতরের ছবি ও স্ক্যানের আকার কমান—লেখা থাকবে স্পষ্ট।",
    "merge pdfs": "PDF ফাইল একত্র করুন",
    "combine multiple pdf files into one document in your chosen order.": "আপনার পছন্দের ক্রমে একাধিক PDF ফাইল এক নথিতে একত্র করুন।",
    " · reading…": " · পড়া হচ্ছে…",
    "enter at least one page or range, e.g. 1-3, 5": "কমপক্ষে একটি পৃষ্ঠা বা পৃষ্ঠার পরিসর লিখুন, যেমন 1-3, 5।",
    "couldn't read this pdf - it may be encrypted or corrupted.": "এই PDF ফাইলটি পড়া যায়নি। এটি পাসওয়ার্ড-সুরক্ষিত বা নষ্ট হয়ে থাকতে পারে।",
    "something went wrong while splitting this pdf.": "PDF ভাগ করার সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।",
    "add to favorites": "পছন্দের তালিকায় যোগ করুন",
    "share this tool": "এই টুলটি শেয়ার করুন",
    "remove pdf": "PDF সরান",
}).map(([key, translated]) => [normalizeSplitPdfText(key), translated]));

function translateSplitPdfText(value: string, locale: string | undefined): string {
    const raw = String(value ?? "");
    if (!String(locale ?? "en").toLowerCase().startsWith("bn")) return raw;

    const key = normalizeSplitPdfText(raw);
    const exact = SPLIT_PDF_BN[key];
    if (exact !== undefined) return exact;

    let match = raw.trim().match(/^range\s+"(.+)"\s+is out of bounds\s+[-—]\s+this PDF has (\d+) pages?\.?$/i);
    if (match) return `পৃষ্ঠা ${match[1]}-এর পরিসর এই PDF-এর সীমার বাইরে। ফাইলটিতে মোট ${splitPdfDigits(match[2])}টি পৃষ্ঠা আছে।`;

    match = raw.trim().match(/^page\s+(\d+)\s+is out of bounds\s+[-—]\s+this PDF has (\d+) pages?\.?$/i);
    if (match) return `পৃষ্ঠা ${splitPdfDigits(match[1])} এই PDF-এর সীমার বাইরে। ফাইলটিতে মোট ${splitPdfDigits(match[2])}টি পৃষ্ঠা আছে।`;

    match = raw.trim().match(/^"(.+)" isn't a valid page or range\.?$/i);
    if (match) return `“${match[1]}” বৈধ পৃষ্ঠা বা পৃষ্ঠার পরিসর নয়।`;

    match = raw.trim().match(/^page\s+(\d+)$/i);
    if (match) return `পৃষ্ঠা ${splitPdfDigits(match[1])}`;

    match = raw.trim().match(/^pages\s+(\d+)\s*-\s*(\d+)$/i);
    if (match) return `পৃষ্ঠা ${splitPdfDigits(match[1])}–${splitPdfDigits(match[2])}`;

    match = raw.trim().match(/^files\s*\((\d+)\)$/i);
    if (match) return `ফাইল (${splitPdfDigits(match[1])})`;

    match = raw.trim().match(/^(\d+)\s+pages?$/i);
    if (match) return `${splitPdfDigits(match[1])}টি পৃষ্ঠা`;

    match = raw.trim().match(/^(\d+)\s+files?$/i);
    if (match) return `${splitPdfDigits(match[1])}টি ফাইল`;

    match = raw.trim().match(/^(\d+)\s+files?\s+ready$/i);
    if (match) return `ডাউনলোডের জন্য ${splitPdfDigits(match[1])}টি ফাইল প্রস্তুত`;

    match = raw.trim().match(/^done:\s*(\d+)\s+files?\s+ready to download$/i);
    if (match) return `কাজ শেষ: ডাউনলোডের জন্য ${splitPdfDigits(match[1])}টি ফাইল প্রস্তুত`;

    match = raw.trim().match(/^ready to split:\s*(.+)$/i);
    if (match) return `ভাগ করার জন্য প্রস্তুত: ${match[1]}`;

    match = raw.trim().match(/^this PDF has (\d+) pages?\.\s*separate multiple ranges with commas\s*[-—]\s*each one becomes its own file\.?$/i);
    if (match) return `এই PDF-এ ${splitPdfDigits(match[1])}টি পৃষ্ঠা আছে। একাধিক পরিসর কমা দিয়ে আলাদা করুন—প্রতিটি পরিসরের জন্য আলাদা ফাইল তৈরি হবে।`;

    // If an unexpected PDF parsing message reaches the UI, prefer a clear
    // Bengali recovery message rather than exposing a half-translated error.
    if (/pdf|page|range|encrypt|corrupt|invalid|split|object|stream|parser|parse|unexpected|failed|error/i.test(raw)) {
        return "PDF ফাইলটি ভাগ করা যায়নি। ফাইলটি ঠিক আছে কি না পরীক্ষা করে আবার চেষ্টা করুন।";
    }
    return raw;
}

function T({ children }: { children: React.ReactNode }) {
    const { locale } = useSohozI18n();
    if (typeof children !== "string") return <>{children}</>;
    return <>{translateSplitPdfText(children, locale)}</>;
}

// ---------------------------------------------------------------------------
// Split engine (pdf-lib)
// ---------------------------------------------------------------------------
// Each requested group of pages (either a single page in "all pages" mode, or
// a comma-separated range/page in "page ranges" mode) becomes its own new
// PDFDocument, built by copying the relevant pages out of the source file.
// Everything runs in the browser.
type SplitMode = "all" | "ranges";
interface PageGroup {
    label: string;
    pages: number[]; // 1-indexed page numbers
}
interface SplitResult {
    label: string;
    bytes: Uint8Array;
    size: number;
    pageCount: number;
}
function formatBytes(bytes: number, locale: string | undefined = "en"): string {
    const numberLocale = String(locale ?? "en").toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
    if (bytes < 1024)
        return `${bytes.toLocaleString(numberLocale)} B`;
    const kb = bytes / 1024;
    if (kb < 1024)
        return `${kb.toLocaleString(numberLocale, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} KB`;
    return `${(kb / 1024).toLocaleString(numberLocale, { maximumFractionDigits: 2, minimumFractionDigits: 2 })} MB`;
}
function slugify(label: string): string {
    return label.toLowerCase().replace(/\s+/g, "-");
}
// ---------------------------------------------------------------------------
// Convert Uint8Array to a concrete ArrayBuffer.
//
// Newer TypeScript/lib definitions can type Uint8Array as
// Uint8Array<ArrayBufferLike>, while Blob expects a BlobPart backed by an
// ArrayBuffer. Copying into a fresh ArrayBuffer keeps the runtime behavior
// unchanged and satisfies the stricter Vercel TypeScript check.
// ---------------------------------------------------------------------------
function toRealArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const buffer = new ArrayBuffer(bytes.byteLength);
    const view = new Uint8Array(buffer);
    view.set(bytes);
    return buffer;
}
function parsePageRanges(input: string, pageCount: number): PageGroup[] {
    const segments = input
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    if (segments.length === 0) {
        throw new Error("Enter at least one page or range, e.g. 1-3, 5");
    }
    return segments.map((segment) => {
        const rangeMatch = segment.match(/^(\d+)\s*-\s*(\d+)$/);
        if (rangeMatch) {
            const start = parseInt(rangeMatch[1], 10);
            const end = parseInt(rangeMatch[2], 10);
            if (start < 1 || end > pageCount || start > end) {
                throw new Error(`Range "${segment}" is out of bounds — this PDF has ${pageCount} page${pageCount === 1 ? "" : "s"}.`);
            }
            const pages: number[] = [];
            for (let p = start; p <= end; p++) {
                pages.push(p);
            }
            return {
                label: start === end ? `Page ${start}` : `Pages ${start}-${end}`,
                pages,
            };
        }
        if (/^\d+$/.test(segment)) {
            const p = parseInt(segment, 10);
            if (p < 1 || p > pageCount) {
                throw new Error(`Page ${p} is out of bounds — this PDF has ${pageCount} page${pageCount === 1 ? "" : "s"}.`);
            }
            return {
                label: `Page ${p}`,
                pages: [p],
            };
        }
        throw new Error(`"${segment}" isn't a valid page or range.`);
    });
}
async function buildSplitFiles(file: File, groups: PageGroup[]): Promise<SplitResult[]> {
    const bytes = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(bytes, {
        updateMetadata: false,
    });
    const outputs: SplitResult[] = [];
    for (const group of groups) {
        const newDoc = await PDFDocument.create();
        const indices = group.pages.map((p) => p - 1);
        const copiedPages = await newDoc.copyPages(srcDoc, indices);
        copiedPages.forEach((page) => newDoc.addPage(page));
        const outBytes = await newDoc.save({
            useObjectStreams: true,
        });
        outputs.push({
            label: group.label,
            bytes: outBytes,
            size: outBytes.byteLength,
            pageCount: group.pages.length,
        });
    }
    return outputs;
}
export default function SplitPdf() {
    const { locale } = useSohozI18n();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showHowToUse, setShowHowToUse] = useState(false);
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [isLoadingFile, setIsLoadingFile] = useState(false);
    const [splitMode, setSplitMode] = useState<SplitMode>("all");
    const [rangesInput, setRangesInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [results, setResults] = useState<SplitResult[] | null>(null);
    const loadFile = async (file: File) => {
        setSelectedFile(file);
        setResults(null);
        setErrorMessage(null);
        setRangesInput("");
        setPageCount(null);
        setIsLoadingFile(true);
        try {
            const bytes = await file.arrayBuffer();
            const doc = await PDFDocument.load(bytes, {
                updateMetadata: false,
            });
            setPageCount(doc.getPageCount());
        }
        catch (err) {
            console.error(err);
            setErrorMessage("Couldn't read this PDF — it may be encrypted or corrupted.");
            setSelectedFile(null);
        }
        finally {
            setIsLoadingFile(false);
        }
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = "";
        if (file) {
            loadFile(file);
        }
    };
    const handleReset = () => {
        setSelectedFile(null);
        setPageCount(null);
        setIsLoadingFile(false);
        setSplitMode("all");
        setRangesInput("");
        setIsProcessing(false);
        setErrorMessage(null);
        setResults(null);
    };
    const handleSplit = async () => {
        if (!selectedFile || !pageCount)
            return;
        setIsProcessing(true);
        setErrorMessage(null);
        setResults(null);
        try {
            const groups: PageGroup[] = splitMode === "all"
                ? Array.from({ length: pageCount }, (_, i) => ({
                    label: `Page ${i + 1}`,
                    pages: [i + 1],
                }))
                : parsePageRanges(rangesInput, pageCount);
            const outputs = await buildSplitFiles(selectedFile, groups);
            setResults(outputs);
        }
        catch (err) {
            console.error(err);
            setErrorMessage(err instanceof Error
                ? err.message
                : "Something went wrong while splitting this PDF.");
        }
        finally {
            setIsProcessing(false);
        }
    };
    const downloadResult = (result: SplitResult) => {
        // Convert Uint8Array<ArrayBufferLike> to a concrete ArrayBuffer
        // before passing it to Blob to satisfy strict TypeScript typings.
        const pdfBuffer = toRealArrayBuffer(result.bytes);
        const blob = new Blob([pdfBuffer], {
            type: "application/pdf",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const baseName = selectedFile?.name.replace(/\.pdf$/i, "") || "split";
        a.download = `${baseName}-${slugify(result.label)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    const handleDownloadAll = async () => {
        if (!results)
            return;
        for (const result of results) {
            downloadResult(result);
            // Small gap so browsers don't block back-to-back downloads.
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
    };
    const canSplit = !!selectedFile &&
        !!pageCount &&
        !isLoadingFile &&
        !isProcessing &&
        (splitMode === "all" || rangesInput.trim().length > 0);
    return (<div className="w-full space-y-5 text-[#0F172A] font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/sohoj-tools" className="flex items-center gap-1 hover:text-[#0F172A] transition-colors">
          <ArrowLeft size={14}/>
          <span><T>{"Back to Tools"}</T></span>
        </Link>

        <span><T>{"/"}</T></span>
        <span><T>{"PDF Tools"}</T></span>
        <span><T>{"/"}</T></span>

        <span className="font-semibold text-[#0F172A]"><T>{"Split PDF"}</T></span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#EEF2FF] text-[#4F46E5] rounded-xl flex items-center justify-center shrink-0 border border-[#C7D2FE]">
            <FileCode size={24}/>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#0F172A]"><T>{"Split PDF"}</T></h1>

              <span className="bg-[#D1FAE5] text-[#047857] text-[10px] font-bold px-2 py-0.5 rounded-full"><T>{"Free\n              "}</T></span>
            </div>

            <p className="text-xs text-gray-500 font-medium mt-0.5"><T>{"Extract specific pages or split every page into separate files.\n            "}</T></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button aria-label={translateSplitPdfText("Add to favorites", locale)} title={translateSplitPdfText("Add to favorites", locale)} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
            <Star size={16}/>
          </button>

          <button aria-label={translateSplitPdfText("Share this tool", locale)} title={translateSplitPdfText("Share this tool", locale)} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
            <Share2 size={16}/>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Upload Box */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#0F172A]"><T>{`Files (${selectedFile ? 1 : 0})`}</T></h2>

              <label className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-[#DBEAFE]">
                <Plus size={12}/>
                <span><T>{"Add"}</T></span>

                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden"/>
              </label>
            </div>

            {!selectedFile ? (<label className="border-2 border-dashed border-[#BFDBFE] bg-[#EFF6FF]/30 hover:bg-[#EFF6FF]/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                <div className="w-10 h-10 bg-[#DBEAFE]/80 text-[#2563EB] rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload size={20}/>
                </div>

                <span className="text-xs font-bold text-[#0F172A]"><T>{"Drop a PDF here or click to upload\n                "}</T></span>

                <span className="text-[10px] text-gray-400 font-medium mt-1"><T>{"1 PDF file, max 500 MB\n                "}</T></span>

                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden"/>
              </label>) : (<div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 bg-[#DBEAFE] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={16}/>
                  </div>

                  <div className="truncate">
                    <p className="text-xs font-bold text-[#0F172A] truncate">
                      {selectedFile.name}
                    </p>

                    <p className="text-[10px] text-gray-400">
                      {(selectedFile.size / (1024 * 1024)).toLocaleString(String(locale ?? "en").toLowerCase().startsWith("bn") ? "bn-BD" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<T>{" MB"}</T>{isLoadingFile
            ? <T>{" · reading…"}</T> : pageCount
            ? ` · ${translateSplitPdfText(`${pageCount} page${pageCount === 1 ? "" : "s"}`, locale)}`
            : ""}
                    </p>
                  </div>
                </div>

                <button onClick={handleReset} aria-label={translateSplitPdfText("Remove PDF", locale)} title={translateSplitPdfText("Remove PDF", locale)} className="p-1 text-gray-400 hover:text-[#2563EB] rounded-lg transition-colors">
                  <X size={16}/>
                </button>
              </div>)}
          </div>

          {/* Split Options Card */}
          {selectedFile && pageCount && (<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-[#0F172A]"><T>{"Split options\n              "}</T></h2>

              {/* Toggle Tabs */}
              <div className="bg-[#E2E8F0] p-1 rounded-xl flex items-center gap-1">
                <button onClick={() => setSplitMode("all")} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${splitMode === "all"
                ? "bg-white text-[#0F172A] shadow-xs"
                : "text-gray-500 hover:text-[#0F172A]"}`}><T>{"All pages\n                "}</T></button>

                <button onClick={() => setSplitMode("ranges")} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${splitMode === "ranges"
                ? "bg-white text-[#0F172A] shadow-xs"
                : "text-gray-500 hover:text-[#0F172A]"}`}><T>{"Page ranges\n                "}</T></button>
              </div>

              {splitMode === "all" ? (<p className="text-[11px] text-gray-400 leading-relaxed">{String(locale ?? "en").toLowerCase().startsWith("bn") ? `প্রতিটি পৃষ্ঠা আলাদা PDF ফাইল হবে—মোট ${splitPdfDigits(pageCount)}টি ফাইল তৈরি হবে।` : `Every page becomes its own PDF — ${pageCount} file${pageCount === 1 ? "" : "s"} in total.`}</p>) : (<div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-600 block"><T>{"Pages or ranges\n                  "}</T></label>

                  <input type="text" value={rangesInput} onChange={(e) => setRangesInput(e.target.value)} placeholder={String(locale ?? "en").toLowerCase().startsWith("bn") ? "যেমন: 1-3, 5" : "e.g. 1-3, 5"} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"/>

                  <p className="text-[10px] text-gray-400">{String(locale ?? "en").toLowerCase().startsWith("bn") ? `এই PDF-এ ${splitPdfDigits(pageCount)}টি পৃষ্ঠা আছে। একাধিক পরিসর কমা দিয়ে আলাদা করুন—প্রতিটি পরিসরের জন্য আলাদা ফাইল তৈরি হবে।` : `This PDF has ${pageCount} page${pageCount === 1 ? "" : "s"}. Separate multiple ranges with commas — each one becomes its own file.`}</p>
                </div>)}
            </div>)}
        </div>

        {/* Right Side: Split Preview */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#0F172A]"><T>{"Preview"}</T></h2>

            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${errorMessage
            ? "bg-red-100 text-red-600"
            : results
                ? "bg-[#D1FAE5] text-[#047857]"
                : isProcessing || isLoadingFile
                    ? "bg-[#E2E8F0] text-[#2563EB]"
                    : selectedFile
                        ? "bg-[#DBEAFE] text-[#2563EB]"
                        : "bg-gray-100 text-gray-500"}`}>
              {errorMessage
        ? <T>{"Error"}</T> : results
        ? translateSplitPdfText(`${results.length} file${results.length === 1 ? "" : "s"}`, locale)
        : isProcessing
            ? <T>{"Splitting"}</T>
            : isLoadingFile
                ? <T>{"Reading"}</T>
                : selectedFile
                    ? <T>{"Ready"}</T>
                    : <T>{"Empty"}</T>}
            </span>
          </div>

          {isProcessing || isLoadingFile ? (<div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <Loader2 size={28} className="text-[#4F46E5] animate-spin mb-3"/>

              <p className="text-xs font-bold text-[#0F172A]">
                {isProcessing ? <T>{"Splitting your PDF…"}</T> : <T>{"Reading your PDF…"}</T>}
              </p>

              <p className="text-[11px] text-gray-400 mt-1"><T>{"Everything runs in your browser \u2014 larger files take a little\n                longer.\n              "}</T></p>
            </div>) : errorMessage ? (<div className="bg-red-50/60 rounded-2xl border border-dashed border-red-200 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <div className="w-10 h-10 bg-red-100 text-red-500 rounded-xl flex items-center justify-center mb-3 border border-red-200">
                <AlertCircle size={20}/>
              </div>

              <p className="text-xs font-bold text-red-700"><T>{"Split failed"}</T></p>

              <p className="text-[11px] text-red-500 mt-1 max-w-xs">
                {translateSplitPdfText(errorMessage, locale)}
              </p>
            </div>) : results ? (<div className="my-auto py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#ECFDF5] text-[#10B981] rounded-lg flex items-center justify-center border border-[#A7F3D0]">
                    <CheckCircle2 size={16}/>
                  </div>

                  <p className="text-xs font-bold text-[#0F172A]">
                    {translateSplitPdfText(`${results.length} file${results.length === 1 ? "" : "s"} ready`, locale)}</p>
                </div>

                {results.length > 1 && (<button onClick={handleDownloadAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] text-white text-[11px] font-bold rounded-lg shadow-xs hover:bg-[#1D4ED8] transition-all">
                    <Download size={12}/><T>{"Download all\n                  "}</T></button>)}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {results.map((result, index) => (<div key={`${result.label}-${index}`} className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex flex-col items-center text-center gap-1.5">
                    <div className="w-11 h-14 bg-white border border-gray-200 rounded-md shadow-2xs flex items-center justify-center text-[#2563EB]">
                      <FileText size={18}/>
                    </div>

                    <p className="text-[11px] font-bold text-[#0F172A] truncate w-full">
                      {<T>{result.label}</T>}
                    </p>

                    <p className="text-[10px] text-gray-400">
                      {formatBytes(result.size, locale)}
                    </p>

                    <button onClick={() => downloadResult(result)} className="mt-1 w-full flex items-center justify-center gap-1 px-2 py-1 border border-gray-200 text-[#0F172A] text-[10px] font-bold rounded-lg hover:bg-gray-100 transition-all">
                      <Download size={11}/><T>{"Download\n                    "}</T></button>
                  </div>))}
              </div>
            </div>) : (<div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <div className="w-10 h-10 bg-[#EFF6FF] text-[#4F46E5] rounded-xl flex items-center justify-center mb-3 border border-[#DBEAFE]">
                <FileText size={20}/>
              </div>

              <p className="text-xs font-bold text-[#0F172A]">
                {selectedFile
            ? <T>{"Choose your split options"}</T> : <T>{"Add files to get started"}</T>}
              </p>

              <p className="text-[11px] text-gray-400 mt-1"><T>{"Your result will appear here after you run the tool.\n              "}</T></p>
            </div>)}

          <div />
        </div>
      </div>

      {/* Bottom Status & Actions Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className={`w-2 h-2 rounded-full shrink-0 ${errorMessage
            ? "bg-[#2563EB]"
            : results
                ? "bg-[#10B981]"
                : isProcessing || isLoadingFile
                    ? "bg-[#2563EB] animate-pulse"
                    : "bg-gray-400"}`}/>

          <span>
            {errorMessage
        ? <T>{"Split failed — try again"}</T> : results
        ? translateSplitPdfText(`Done: ${results.length} file${results.length === 1 ? "" : "s"} ready to download`, locale)
        : isProcessing
            ? <T>{"Splitting…"}</T>
            : isLoadingFile
                ? <T>{"Reading PDF…"}</T>
                : selectedFile
                    ? translateSplitPdfText(`Ready to split: ${selectedFile.name}`, locale)
                    : <T>{"Add an input to get started"}</T>}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="px-4 py-2 border border-gray-200 text-[#0F172A] text-xs font-bold rounded-xl hover:bg-[#F8FAFC] transition-all"><T>{"Reset\n          "}</T></button>

          <button onClick={handleSplit} disabled={!canSplit} className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${canSplit
            ? "bg-[#2563EB] text-white shadow-xs hover:bg-[#1D4ED8]"
            : "bg-[#E2E8F0] text-[#64748B] cursor-not-allowed"}`}>
            {isProcessing ? (<Loader2 size={14} className="animate-spin"/>) : (<FileCode size={14}/>)}

            <span>{isProcessing ? <T>{"Splitting…"}</T> : <T>{"Split PDF"}</T>}</span>
          </button>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-[#ECFDF5]/70 border border-[#A7F3D0] p-3 rounded-2xl flex items-center gap-2 text-xs text-[#065F46] font-medium">
        <Lock size={15} className="text-[#10B981] shrink-0"/>

        <span><T>{"Your files are processed in the browser \u2014 they are not uploaded to any\n          server.\n        "}</T></span>
      </div>

      {/* How to use Accordion */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <button onClick={() => setShowHowToUse(!showHowToUse)} className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-[#0F172A] hover:bg-[#F8FAFC]/50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-[#2563EB]"><T>{"?"}</T></span>
            <span><T>{"How to use"}</T></span>
          </div>

          {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>

        {showHowToUse && (<div className="px-5 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3"><T>{"Upload your PDF file, choose the pages you want to extract or select\n            page ranges, then click \"Split PDF\" to save them as separate files.\n          "}</T></div>)}
      </div>

      {/* Tools in Same Category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#0F172A]"><T>{"Tools in the same category\n        "}</T></h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/sohoj-tools/compress-pdf" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-[#BFDBFE] transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#EEF2FF] text-[#4F46E5] rounded-lg flex items-center justify-center shrink-0">
              <Minimize2 size={16}/>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors"><T>{"Compress PDF\n              "}</T></h4>

              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1"><T>{"Shrink embedded photos and scans inside a PDF \u2014 text stays\n                sharp.\n              "}</T></p>
            </div>
          </Link>

          <Link href="/sohoj-tools/merge-pdfs" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-[#BFDBFE] transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#EEF2FF] text-[#4F46E5] rounded-lg flex items-center justify-center shrink-0">
              <Combine size={16}/>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors"><T>{"Merge PDFs\n              "}</T></h4>

              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1"><T>{"Combine multiple PDF files into one document in your chosen\n                order.\n              "}</T></p>
            </div>
          </Link>
        </div>
      </div>
    </div>);
}
