"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";

import {
  FileImage,
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
      lib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();

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

async function renderPdfToImages(
  file: File,
  format: ImageFormat,
  dpi: number,
  onProgress: (done: number, total: number) => void,
): Promise<RenderedPage[]> {
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

    let blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), mimeType, quality),
    );

    // Not every browser can encode WebP/AVIF via canvas — fall back to PNG
    // for that page rather than failing the whole conversion.
    let actualFormat: ImageFormat = format;

    if (!blob) {
      blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png"),
      );

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

export default function PdfToImage() {
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

      const rendered = await renderPdfToImages(
        selectedFile,
        imageFormat,
        dpi,
        (done, total) =>
          setProgress({
            done,
            total,
          }),
      );

      thumbnailUrlsRef.current = rendered.map((p) => p.thumbnailUrl);

      setPages(rendered);
    } catch (err) {
      console.error(err);

      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong while converting this PDF.",
      );
    } finally {
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

    triggerDownload(
      new Blob([zipBuffer], {
        type: "application/zip",
      }),
      `${baseName}-images.zip`,
    );
  };

  const canConvert = !!selectedFile && !isProcessing;

  return (
    <div className="w-full space-y-5 text-[#0F172A] font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link
          href="/sohoj-tools"
          className="flex items-center gap-1 hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft size={14} />

          <span>Back to Tools</span>
        </Link>

        <span>/</span>

        <span>PDF Tools</span>

        <span>/</span>

        <span className="font-semibold text-[#0F172A]">PDF to Image</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
            <FileImage size={24} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#0F172A]">PDF to Image</h1>

              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>

            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Convert each PDF page to PNG, JPG, WebP, or AVIF.
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
        {/* Left Side: Controls & Upload */}
        <div className="lg:col-span-4 space-y-4">
          {/* Upload Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#0F172A]">
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

                <span className="text-xs font-bold text-[#0F172A]">
                  Drop PDF files here or click to upload
                </span>

                <span className="text-[10px] text-gray-400 font-medium mt-1">
                  PDF files, max 500 MB each
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
                    <p className="text-xs font-bold text-[#0F172A] truncate">
                      {selectedFile.name}
                    </p>

                    <p className="text-[10px] text-gray-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
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

          {/* Image Format Selector Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#0F172A]">Image format</h2>

            <div className="grid grid-cols-4 gap-2">
              {(["JPG", "PNG", "WebP", "AVIF"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleFormatChange(fmt)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    imageFormat === fmt
                      ? "border-[#2563EB] bg-[#F8FAFC]/40 text-[#2563EB] shadow-2xs"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Selector Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#0F172A]">Resolution</h2>

            <div className="space-y-2">
              {/* Standard */}
              <button
                onClick={() => handleResolutionChange("standard")}
                className={`w-full p-3 text-left rounded-xl border transition-all ${
                  resolution === "standard"
                    ? "border-[#2563EB] bg-[#F8FAFC]/40 text-[#0F172A] shadow-2xs"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <p className="text-xs font-bold text-[#0F172A]">Standard</p>

                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                  96 DPI — good for screen and sharing
                </p>
              </button>

              {/* High */}
              <button
                onClick={() => handleResolutionChange("high")}
                className={`w-full p-3 text-left rounded-xl border transition-all ${
                  resolution === "high"
                    ? "border-[#2563EB] bg-[#F8FAFC]/40 text-[#0F172A] shadow-2xs"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <p className="text-xs font-bold text-[#0F172A]">High</p>

                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                  144 DPI — sharper text and details
                </p>
              </button>

              {/* Ultra high */}
              <button
                onClick={() => handleResolutionChange("ultra")}
                className={`w-full p-3 text-left rounded-xl border transition-all ${
                  resolution === "ultra"
                    ? "border-[#2563EB] bg-[#F8FAFC]/40 text-[#0F172A] shadow-2xs"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <p className="text-xs font-bold text-[#0F172A]">Ultra high</p>

                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                  216 DPI — best for print
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Preview */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[520px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#0F172A]">Preview</h2>

            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                errorMessage
                  ? "bg-red-100 text-red-600"
                  : pages
                    ? "bg-emerald-100 text-emerald-700"
                    : isProcessing
                      ? "bg-[#E2E8F0] text-[#2563EB]"
                      : selectedFile
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-500"
              }`}
            >
              {errorMessage
                ? "Error"
                : pages
                  ? `${pages.length} page${pages.length === 1 ? "" : "s"}`
                  : isProcessing
                    ? "Rendering"
                    : selectedFile
                      ? "Ready"
                      : "Empty"}
            </span>
          </div>

          {isProcessing ? (
            <div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-28">
              <Loader2 size={28} className="text-red-400 animate-spin mb-3" />

              <p className="text-xs font-bold text-[#0F172A]">
                Rendering your PDF…
              </p>

              <p className="text-[11px] text-gray-400 mt-1">
                {progress && progress.total > 0
                  ? `Page ${progress.done} of ${progress.total}`
                  : "Getting started…"}
              </p>
            </div>
          ) : errorMessage ? (
            <div className="bg-red-50/60 rounded-2xl border border-dashed border-red-200 p-8 flex flex-col items-center justify-center my-auto text-center py-28">
              <div className="w-10 h-10 bg-red-100 text-red-500 rounded-xl flex items-center justify-center mb-3 border border-red-200">
                <AlertCircle size={20} />
              </div>

              <p className="text-xs font-bold text-red-700">
                Conversion failed
              </p>

              <p className="text-[11px] text-red-500 mt-1 max-w-xs">
                {errorMessage}
              </p>
            </div>
          ) : pages ? (
            <div className="my-auto py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center border border-emerald-100">
                    <CheckCircle2 size={16} />
                  </div>

                  <p className="text-xs font-bold text-[#0F172A]">
                    {pages.length} page
                    {pages.length === 1 ? "" : "s"} converted
                  </p>
                </div>

                {pages.length > 1 && (
                  <button
                    onClick={downloadAllAsZip}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-[11px] font-bold rounded-lg shadow-xs hover:bg-red-600 transition-all"
                  >
                    <Download size={12} />
                    Download all (.zip)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {pages.map((page) => (
                  <div
                    key={page.pageNumber}
                    className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl flex flex-col items-center text-center gap-1.5"
                  >
                    <div className="w-full aspect-[3/4] bg-white border border-gray-200 rounded-md overflow-hidden flex items-center justify-center">
                      <img
                        src={page.thumbnailUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>

                    <p className="text-[11px] font-bold text-[#0F172A] truncate w-full">
                      Page {page.pageNumber}
                    </p>

                    <p className="text-[10px] text-gray-400">
                      {formatBytes(page.blob.size)} · {page.format}
                    </p>

                    <button
                      onClick={() => downloadPage(page)}
                      className="mt-1 w-full flex items-center justify-center gap-1 px-2 py-1 border border-gray-200 text-[#0F172A] text-[10px] font-bold rounded-lg hover:bg-gray-100 transition-all"
                    >
                      <Download size={11} />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-28">
              <div className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center mb-3 border border-red-100">
                <FileText size={20} />
              </div>

              <p className="text-xs font-bold text-[#0F172A]">
                Add files to get started
              </p>

              <p className="text-[11px] text-gray-400 mt-1">
                Your result will appear here after you run the tool.
              </p>
            </div>
          )}

          <div />
        </div>
      </div>

      {/* Bottom Status & Action Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              errorMessage
                ? "bg-red-500"
                : pages
                  ? "bg-emerald-500"
                  : isProcessing
                    ? "bg-[#2563EB] animate-pulse"
                    : "bg-gray-400"
            }`}
          />

          <span>
            {errorMessage
              ? "Conversion failed — try again"
              : pages
                ? `Done: ${pages.length} page${
                    pages.length === 1 ? "" : "s"
                  } ready to download`
                : isProcessing
                  ? progress && progress.total > 0
                    ? `Rendering page ${progress.done} of ${progress.total}…`
                    : "Rendering…"
                  : selectedFile
                    ? `Ready to convert: ${selectedFile.name}`
                    : "Add an input to get started"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 text-[#0F172A] text-xs font-bold rounded-xl hover:bg-gray-50 transition-all"
          >
            Reset
          </button>

          <button
            onClick={handleConvert}
            disabled={!canConvert}
            className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              canConvert
                ? "bg-red-500 text-white shadow-xs hover:bg-red-600"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileImage size={14} />
            )}

            <span>{isProcessing ? "Converting…" : "Convert to images"}</span>
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
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-[#0F172A] hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[#2563EB]">?</span>

            <span>How to use</span>
          </div>

          {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showHowToUse && (
          <div className="px-5 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
            Upload your PDF, choose your preferred image format (JPG, PNG, WebP,
            or AVIF) and resolution quality, then click "Convert to images" to
            extract pages as image files.
          </div>
        )}
      </div>

      {/* Tools in Same Category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#0F172A]">
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
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-red-500 transition-colors">
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
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-red-500 transition-colors">
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
