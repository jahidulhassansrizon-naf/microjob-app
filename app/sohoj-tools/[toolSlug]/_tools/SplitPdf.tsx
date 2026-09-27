"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileCode,
  Star,
  Share2,
  Upload,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Combine,
  FilePlus,
  ArrowLeft,
  X,
  Plus,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function slugify(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "-");
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
        throw new Error(
          `Range "${segment}" is out of bounds — this PDF has ${pageCount} page${
            pageCount === 1 ? "" : "s"
          }.`,
        );
      }
      const pages: number[] = [];
      for (let p = start; p <= end; p++) pages.push(p);
      return {
        label: start === end ? `Page ${start}` : `Pages ${start}-${end}`,
        pages,
      };
    }

    if (/^\d+$/.test(segment)) {
      const p = parseInt(segment, 10);
      if (p < 1 || p > pageCount) {
        throw new Error(
          `Page ${p} is out of bounds — this PDF has ${pageCount} page${
            pageCount === 1 ? "" : "s"
          }.`,
        );
      }
      return { label: `Page ${p}`, pages: [p] };
    }

    throw new Error(`"${segment}" isn't a valid page or range.`);
  });
}

async function buildSplitFiles(
  file: File,
  groups: PageGroup[],
): Promise<SplitResult[]> {
  const bytes = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(bytes, { updateMetadata: false });

  const outputs: SplitResult[] = [];
  for (const group of groups) {
    const newDoc = await PDFDocument.create();
    const indices = group.pages.map((p) => p - 1);
    const copiedPages = await newDoc.copyPages(srcDoc, indices);
    copiedPages.forEach((page) => newDoc.addPage(page));
    const outBytes = await newDoc.save({ useObjectStreams: true });
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
      const doc = await PDFDocument.load(bytes, { updateMetadata: false });
      setPageCount(doc.getPageCount());
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Couldn't read this PDF — it may be encrypted or corrupted.",
      );
      setSelectedFile(null);
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (file) loadFile(file);
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
    if (!selectedFile || !pageCount) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setResults(null);

    try {
      const groups: PageGroup[] =
        splitMode === "all"
          ? Array.from({ length: pageCount }, (_, i) => ({
              label: `Page ${i + 1}`,
              pages: [i + 1],
            }))
          : parsePageRanges(rangesInput, pageCount);

      const outputs = await buildSplitFiles(selectedFile, groups);
      setResults(outputs);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong while splitting this PDF.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = (result: SplitResult) => {
    const blob = new Blob([result.bytes], { type: "application/pdf" });
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
    if (!results) return;
    for (const result of results) {
      downloadResult(result);
      // Small gap so browsers don't block back-to-back downloads.
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  };

  const canSplit =
    !!selectedFile &&
    !!pageCount &&
    !isLoadingFile &&
    !isProcessing &&
    (splitMode === "all" || rangesInput.trim().length > 0);

  return (
    <div className="w-full space-y-5 text-gray-800 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link
          href="/sohoj-tools"
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Tools</span>
        </Link>
        <span>/</span>
        <span>PDF Tools</span>
        <span>/</span>
        <span className="font-semibold text-gray-900">Split PDF</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
            <FileCode size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Split PDF</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Extract specific pages or split every page into separate files.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
            <Star size={16} />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Upload Box */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-900">
                Files ({selectedFile ? 1 : 0})
              </h2>
              <label className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-red-100">
                <Plus size={12} />
                <span>Add</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {!selectedFile ? (
              <label className="border-2 border-dashed border-red-200 bg-red-50/30 hover:bg-red-50/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                <div className="w-10 h-10 bg-red-100/80 text-red-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload size={20} />
                </div>
                <span className="text-xs font-bold text-gray-800">
                  Drop a PDF here or click to upload
                </span>
                <span className="text-[10px] text-gray-400 font-medium mt-1">
                  1 PDF file, max 500 MB
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 bg-red-100 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-800 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      {isLoadingFile
                        ? " · reading…"
                        : pageCount
                          ? ` · ${pageCount} page${pageCount === 1 ? "" : "s"}`
                          : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Split Options Card */}
          {selectedFile && pageCount && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-gray-900">Split options</h2>

              {/* Toggle Tabs */}
              <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1">
                <button
                  onClick={() => setSplitMode("all")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    splitMode === "all"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  All pages
                </button>
                <button
                  onClick={() => setSplitMode("ranges")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    splitMode === "ranges"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Page ranges
                </button>
              </div>

              {splitMode === "all" ? (
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Every page becomes its own PDF — {pageCount} file
                  {pageCount === 1 ? "" : "s"} in total.
                </p>
              ) : (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-600 block">
                    Pages or ranges
                  </label>
                  <input
                    type="text"
                    value={rangesInput}
                    onChange={(e) => setRangesInput(e.target.value)}
                    placeholder="e.g. 1-3, 5"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  <p className="text-[10px] text-gray-400">
                    This PDF has {pageCount} page{pageCount === 1 ? "" : "s"}.
                    Separate multiple ranges with commas — each one becomes its
                    own file.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Split Preview */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-700">Preview</h2>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                errorMessage
                  ? "bg-red-100 text-red-600"
                  : results
                    ? "bg-emerald-100 text-emerald-700"
                    : isProcessing || isLoadingFile
                      ? "bg-amber-100 text-amber-700"
                      : selectedFile
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-500"
              }`}
            >
              {errorMessage
                ? "Error"
                : results
                  ? `${results.length} file${results.length === 1 ? "" : "s"}`
                  : isProcessing
                    ? "Splitting"
                    : isLoadingFile
                      ? "Reading"
                      : selectedFile
                        ? "Ready"
                        : "Empty"}
            </span>
          </div>

          {isProcessing || isLoadingFile ? (
            <div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <Loader2 size={28} className="text-red-400 animate-spin mb-3" />
              <p className="text-xs font-bold text-gray-800">
                {isProcessing ? "Splitting your PDF…" : "Reading your PDF…"}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Everything runs in your browser — larger files take a little
                longer.
              </p>
            </div>
          ) : errorMessage ? (
            <div className="bg-red-50/60 rounded-2xl border border-dashed border-red-200 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <div className="w-10 h-10 bg-red-100 text-red-500 rounded-xl flex items-center justify-center mb-3 border border-red-200">
                <AlertCircle size={20} />
              </div>
              <p className="text-xs font-bold text-red-700">Split failed</p>
              <p className="text-[11px] text-red-500 mt-1 max-w-xs">
                {errorMessage}
              </p>
            </div>
          ) : results ? (
            <div className="my-auto py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center border border-emerald-100">
                    <CheckCircle2 size={16} />
                  </div>
                  <p className="text-xs font-bold text-gray-800">
                    {results.length} file{results.length === 1 ? "" : "s"} ready
                  </p>
                </div>
                {results.length > 1 && (
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-[11px] font-bold rounded-lg shadow-xs hover:bg-red-600 transition-all"
                  >
                    <Download size={12} />
                    Download all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {results.map((result, index) => (
                  <div
                    key={`${result.label}-${index}`}
                    className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex flex-col items-center text-center gap-1.5"
                  >
                    <div className="w-11 h-14 bg-white border border-gray-200 rounded-md shadow-2xs flex items-center justify-center text-red-500">
                      <FileText size={18} />
                    </div>
                    <p className="text-[11px] font-bold text-gray-800 truncate w-full">
                      {result.label}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {formatBytes(result.size)}
                    </p>
                    <button
                      onClick={() => downloadResult(result)}
                      className="mt-1 w-full flex items-center justify-center gap-1 px-2 py-1 border border-gray-200 text-gray-700 text-[10px] font-bold rounded-lg hover:bg-gray-100 transition-all"
                    >
                      <Download size={11} />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <div className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center mb-3 border border-red-100">
                <FileText size={20} />
              </div>
              <p className="text-xs font-bold text-gray-800">
                {selectedFile
                  ? "Choose your split options"
                  : "Add files to get started"}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Your result will appear here after you run the tool.
              </p>
            </div>
          )}

          <div />
        </div>
      </div>

      {/* Bottom Status & Actions Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              errorMessage
                ? "bg-red-500"
                : results
                  ? "bg-emerald-500"
                  : isProcessing || isLoadingFile
                    ? "bg-amber-400 animate-pulse"
                    : "bg-gray-400"
            }`}
          />
          <span>
            {errorMessage
              ? "Split failed — try again"
              : results
                ? `Done: ${results.length} file${results.length === 1 ? "" : "s"} ready to download`
                : isProcessing
                  ? "Splitting…"
                  : isLoadingFile
                    ? "Reading PDF…"
                    : selectedFile
                      ? `Ready to split: ${selectedFile.name}`
                      : "Add an input to get started"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all"
          >
            Reset
          </button>
          <button
            onClick={handleSplit}
            disabled={!canSplit}
            className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              canSplit
                ? "bg-red-500 text-white shadow-xs hover:bg-red-600"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileCode size={14} />
            )}
            <span>{isProcessing ? "Splitting…" : "Split PDF"}</span>
          </button>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
        <Lock size={15} className="text-emerald-600 shrink-0" />
        <span>
          Your files are processed in the browser — they are not uploaded to any
          server.
        </span>
      </div>

      {/* How to use Accordion */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowHowToUse(!showHowToUse)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-gray-800 hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-orange-500">?</span>
            <span>How to use</span>
          </div>
          {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showHowToUse && (
          <div className="px-5 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
            Upload your PDF file, choose the pages you want to extract or select
            page ranges, then click "Split PDF" to save them as separate files.
          </div>
        )}
      </div>

      {/* Tools in Same Category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-gray-900">
          Tools in the same category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/sohoj-tools/compress-pdf"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-red-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
              <Minimize2 size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-red-500 transition-colors">
                Compress PDF
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                Shrink embedded photos and scans inside a PDF — text stays
                sharp.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/merge-pdfs"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-red-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
              <Combine size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-red-500 transition-colors">
                Merge PDFs
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                Combine multiple PDF files into one document in your chosen
                order.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
