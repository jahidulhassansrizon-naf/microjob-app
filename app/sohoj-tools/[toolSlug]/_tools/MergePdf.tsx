"use client";

import React, { useState } from "react";
import Link from "next/link";

import {
  Combine,
  Star,
  Share2,
  Upload,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  Minimize2,
  FilePlus,
  FileCode,
  ArrowLeft,
  X,
  GripVertical,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { PDFDocument } from "pdf-lib";

// ---------------------------------------------------------------------------
// Merge engine (pdf-lib)
// ---------------------------------------------------------------------------
// Creates a fresh PDFDocument, then copies every page from each uploaded
// file into it, in the order the files appear in the list. Everything runs
// in the browser — no file ever leaves the device.

interface MergeResult {
  bytes: Uint8Array;
  fileCount: number;
  pageCount: number;
  size: number;
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

// ---------------------------------------------------------------------------
// TypeScript / Blob compatibility helper
// ---------------------------------------------------------------------------
//
// Newer TypeScript/lib.dom typings can treat Uint8Array as
// Uint8Array<ArrayBufferLike>. Blob requires a BlobPart whose backing buffer
// is a concrete ArrayBuffer.
//
// We explicitly create a new ArrayBuffer and copy the bytes into it.
// This does not change the PDF data or any existing functionality.
// ---------------------------------------------------------------------------

function toRealArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);

  const view = new Uint8Array(buffer);

  view.set(bytes);

  return buffer;
}

async function mergePdfFiles(files: File[]): Promise<MergeResult> {
  const mergedDoc = await PDFDocument.create();

  let pageCount = 0;

  for (const file of files) {
    const bytes = await file.arrayBuffer();

    const srcDoc = await PDFDocument.load(bytes, {
      updateMetadata: false,
    });

    const copiedPages = await mergedDoc.copyPages(
      srcDoc,
      srcDoc.getPageIndices(),
    );

    copiedPages.forEach((page) => {
      mergedDoc.addPage(page);
    });

    pageCount += copiedPages.length;
  }

  const mergedBytes = await mergedDoc.save({
    useObjectStreams: true,
  });

  return {
    bytes: mergedBytes,
    fileCount: files.length,
    pageCount,
    size: mergedBytes.byteLength,
  };
}

export default function MergePdf() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [showHowToUse, setShowHowToUse] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [result, setResult] = useState<MergeResult | null>(null);

  const [isDraggingOverZone, setIsDraggingOverZone] = useState(false);

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addFiles = (files: File[]) => {
    const pdfFiles = files.filter(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );

    if (pdfFiles.length === 0) {
      return;
    }

    setSelectedFiles((prev) => [...prev, ...pdfFiles]);

    setResult(null);
    setErrorMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));

      e.target.value = "";
    }
  };

  const handleDropOnZone = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();

    setIsDraggingOverZone(false);

    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOverZone = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();

    setIsDraggingOverZone(true);
  };

  const handleDragLeaveZone = () => setIsDraggingOverZone(false);

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

    setResult(null);
    setErrorMessage(null);
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setResult(null);
    setErrorMessage(null);
    setIsProcessing(false);
  };

  // Drag-to-reorder the file list
  const handleItemDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  };

  const handleItemDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    setSelectedFiles((prev) => {
      const updated = [...prev];

      const [moved] = updated.splice(dragIndex, 1);

      updated.splice(index, 0, moved);

      return updated;
    });

    setDragIndex(null);
    setDragOverIndex(null);
    setResult(null);
  };

  const handleItemDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleMerge = async () => {
    if (selectedFiles.length < 2) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const merged = await mergePdfFiles(selectedFiles);

      setResult(merged);
    } catch (err) {
      console.error(err);

      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong while merging these PDFs.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) {
      return;
    }

    // FIX:
    // Convert Uint8Array<ArrayBufferLike> into a concrete ArrayBuffer
    // before passing it to Blob. This fixes the Vercel TS2322 error.
    const pdfBuffer = toRealArrayBuffer(result.bytes);

    const blob = new Blob([pdfBuffer], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "merged.pdf";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-5 bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#0F172A]">
        <Link
          href="/sohoj-tools"
          className="flex items-center gap-1 hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft size={14} />

          <span>Back to Tools</span>
        </Link>

        <span>/</span>

        <span>PDF Tools</span>

        <span>/</span>

        <span className="font-semibold text-[#0F172A]">Merge PDFs</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#0F172A]/10 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#4F46E5]/10 text-[#4F46E5] rounded-xl flex items-center justify-center shrink-0 border border-[#4F46E5]/20">
            <Combine size={24} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#0F172A]">Merge PDFs</h1>

              <span className="bg-[#10B981]/10 text-[#10B981] text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>

            <p className="text-xs text-[#0F172A] font-medium mt-0.5">
              Combine multiple PDF files into one document in your chosen order.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-[#0F172A] hover:text-[#2563EB] bg-[#F8FAFC] hover:bg-[#E2E8F0] rounded-xl transition-all border border-[#0F172A]/10">
            <Star size={16} />
          </button>

          <button className="p-2 text-[#0F172A] hover:text-[#2563EB] bg-[#F8FAFC] hover:bg-[#E2E8F0] rounded-xl transition-all border border-[#0F172A]/10">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Upload Zone */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#0F172A]/10 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#0F172A]">
              Files ({selectedFiles.length})
            </h2>

            <label
              onDrop={handleDropOnZone}
              onDragOver={handleDragOverZone}
              onDragLeave={handleDragLeaveZone}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
                isDraggingOverZone
                  ? "border-[#2563EB] bg-[#2563EB]/10"
                  : "border-[#2563EB]/30 bg-[#2563EB]/5 hover:bg-[#2563EB]/10"
              }`}
            >
              <div className="w-10 h-10 bg-[#2563EB]/10 text-[#4F46E5] rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Upload size={20} />
              </div>

              <span className="text-xs font-bold text-[#0F172A]">
                Drop PDF files here or click to upload
              </span>

              <span className="text-[10px] text-[#0F172A] font-medium mt-1">
                PDF files, max 500 MB each (at least 2)
              </span>

              <input
                type="file"
                multiple
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* List of uploaded files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${file.lastModified}-${idx}`}
                    draggable
                    onDragStart={() => handleItemDragStart(idx)}
                    onDragOver={(e) => handleItemDragOver(e, idx)}
                    onDrop={() => handleItemDrop(idx)}
                    onDragEnd={handleItemDragEnd}
                    className={`bg-[#F8FAFC] border rounded-xl p-2.5 flex items-center justify-between group transition-all ${
                      dragOverIndex === idx && dragIndex !== idx
                        ? "border-[#2563EB] bg-[#2563EB]/5"
                        : "border-[#0F172A]/10"
                    } ${dragIndex === idx ? "opacity-50" : "opacity-100"}`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <GripVertical
                        size={14}
                        className="text-[#0F172A] cursor-grab"
                      />

                      <div className="w-7 h-7 bg-[#2563EB]/10 text-[#4F46E5] rounded-lg flex items-center justify-center shrink-0">
                        <FileText size={14} />
                      </div>

                      <div className="truncate">
                        <p className="text-xs font-bold text-[#0F172A] truncate">
                          {file.name}
                        </p>

                        <p className="text-[10px] text-[#0F172A]">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveFile(idx)}
                      className="p-1 text-[#0F172A] hover:text-[#4F46E5] rounded-lg transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Merge Preview */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-[#0F172A]/10 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#0F172A]">Merge preview</h2>

            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                errorMessage
                  ? "bg-[#2563EB]/10 text-[#0F172A]"
                  : result
                    ? "bg-[#10B981]/10 text-[#10B981]"
                    : isProcessing
                      ? "bg-[#E2E8F0] text-[#2563EB]"
                      : "bg-[#F8FAFC] text-[#0F172A]"
              }`}
            >
              {errorMessage
                ? "Error"
                : result
                  ? "Done"
                  : isProcessing
                    ? "Merging"
                    : selectedFiles.length < 2
                      ? "Empty"
                      : `${selectedFiles.length} files`}
            </span>
          </div>

          {/* Empty / Preview / Processing / Result state */}
          {isProcessing ? (
            <div className="bg-[#F8FAFC]/60 rounded-2xl border border-dashed border-[#0F172A]/10 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <Loader2 size={28} className="text-[#4F46E5] animate-spin mb-3" />

              <p className="text-xs font-bold text-[#0F172A]">
                Merging your PDFs…
              </p>

              <p className="text-[11px] text-[#0F172A] mt-1">
                Everything runs in your browser — larger files take a little
                longer.
              </p>
            </div>
          ) : errorMessage ? (
            <div className="bg-[#0F172A]/5 rounded-2xl border border-dashed border-[#2563EB]/30 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <div className="w-10 h-10 bg-[#2563EB]/10 text-[#4F46E5] rounded-xl flex items-center justify-center mb-3 border border-[#2563EB]/30">
                <AlertCircle size={20} />
              </div>

              <p className="text-xs font-bold text-[#0F172A]">Merge failed</p>

              <p className="text-[11px] text-[#4F46E5] mt-1 max-w-xs">
                {errorMessage}
              </p>
            </div>
          ) : result ? (
            <div className="my-auto py-10 flex flex-col items-center gap-5">
              <div className="w-12 h-12 bg-[#10B981]/5 text-[#10B981] rounded-xl flex items-center justify-center border border-[#10B981]/20">
                <CheckCircle2 size={24} />
              </div>

              <div className="flex items-center gap-4 sm:gap-8">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wide">
                    Files merged
                  </p>

                  <p className="text-sm font-bold text-[#0F172A]">
                    {result.fileCount}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wide">
                    Total pages
                  </p>

                  <p className="text-sm font-bold text-[#0F172A]">
                    {result.pageCount}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wide">
                    File size
                  </p>

                  <p className="text-sm font-bold text-[#10B981]">
                    {formatBytes(result.size)}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#2563EB]/90 transition-all"
              >
                <Download size={14} />
                Download merged PDF
              </button>
            </div>
          ) : selectedFiles.length < 2 ? (
            <div className="bg-[#F8FAFC]/60 rounded-2xl border border-dashed border-[#0F172A]/10 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <div className="w-10 h-10 bg-[#4F46E5]/10 text-[#4F46E5] rounded-xl flex items-center justify-center mb-3 border border-[#4F46E5]/20">
                <FileText size={20} />
              </div>

              <p className="text-xs font-bold text-[#0F172A]">
                Add at least two PDFs
              </p>

              <p className="text-[11px] text-[#0F172A] mt-1">
                Arrange them in order, then merge into one file.
              </p>
            </div>
          ) : (
            <div className="my-auto py-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="bg-[#F8FAFC] border border-[#0F172A]/10 p-3 rounded-xl flex flex-col items-center text-center relative group"
                >
                  <span className="absolute top-2 left-2 bg-[#2563EB] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>

                  <div className="w-12 h-16 bg-white border border-[#0F172A]/10 rounded-md shadow-2xs flex items-center justify-center my-2 text-[#4F46E5]">
                    <FileText size={20} />
                  </div>

                  <p className="text-[11px] font-bold text-[#0F172A] truncate w-full">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div />
        </div>
      </div>

      {/* Bottom Status & Actions */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#0F172A]/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-[#0F172A]">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              errorMessage
                ? "bg-[#2563EB]"
                : result
                  ? "bg-[#10B981]"
                  : isProcessing
                    ? "bg-[#2563EB] animate-pulse"
                    : "bg-[#0F172A]/40"
            }`}
          />

          <span>
            {errorMessage
              ? "Merge failed — try again"
              : result
                ? `Done: ${result.fileCount} files merged into ${result.pageCount} pages (${formatBytes(
                    result.size,
                  )})`
                : isProcessing
                  ? "Merging…"
                  : selectedFiles.length >= 2
                    ? `${selectedFiles.length} PDFs ready to merge`
                    : "Add at least two PDFs"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-[#0F172A]/10 text-[#0F172A] text-xs font-bold rounded-xl hover:bg-[#F8FAFC] transition-all"
          >
            Reset
          </button>

          <button
            onClick={handleMerge}
            disabled={selectedFiles.length < 2 || isProcessing}
            className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              selectedFiles.length >= 2 && !isProcessing
                ? "bg-[#2563EB] text-white shadow-xs hover:bg-[#2563EB]/90"
                : "bg-[#E2E8F0] text-[#0F172A]/45 cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Combine size={14} />
            )}

            <span>{isProcessing ? "Merging…" : "Merge PDFs"}</span>
          </button>
        </div>
      </div>

      {/* Security Info Banner */}
      <div className="bg-[#10B981]/5 border border-[#10B981]/20 p-3 rounded-2xl flex items-center gap-2 text-xs text-[#0F172A] font-medium">
        <Lock size={15} className="text-[#10B981] shrink-0" />

        <span>
          Your files are processed in the browser — they are not uploaded to any
          server.
        </span>
      </div>

      {/* How to use Accordion */}
      <div className="bg-white rounded-2xl border border-[#0F172A]/10 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowHowToUse(!showHowToUse)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[#2563EB]">?</span>

            <span>How to use</span>
          </div>

          {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showHowToUse && (
          <div className="px-5 pb-4 text-xs text-[#0F172A] leading-relaxed border-t border-[#0F172A]/10 pt-3">
            Drag and drop multiple PDF files into the upload box. Reorder them
            as needed, then click "Merge PDFs" to combine all pages into a
            single document.
          </div>
        )}
      </div>

      {/* Related Tools Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#0F172A]">
          Tools in the same category
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/sohoj-tools/compress-pdf"
            className="bg-[#E2E8F0] p-4 rounded-2xl border border-[#0F172A]/10 shadow-xs hover:border-[#2563EB]/40 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-[#4F46E5]/10 text-[#4F46E5] rounded-lg flex items-center justify-center shrink-0">
              <Minimize2 size={16} />
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors">
                Compress PDF
              </h4>

              <p className="text-[10px] text-[#0F172A] mt-0.5 line-clamp-1">
                Shrink embedded photos and scans inside a PDF — text stays
                sharp.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/split-pdf"
            className="bg-[#E2E8F0] p-4 rounded-2xl border border-[#0F172A]/10 shadow-xs hover:border-[#2563EB]/40 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-[#4F46E5]/10 text-[#4F46E5] rounded-lg flex items-center justify-center shrink-0">
              <FileCode size={16} />
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors">
                Split PDF
              </h4>

              <p className="text-[10px] text-[#0F172A] mt-0.5 line-clamp-1">
                Extract specific pages or split every page into separate files.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
