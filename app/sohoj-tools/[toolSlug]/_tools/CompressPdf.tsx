"use client";

import React, { useState } from "react";

import Link from "next/link";

import {
  Minimize2,
  Star,
  Share2,
  Upload,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  Combine,
  FilePlus,
  FileCode,
  ArrowLeft,
  X,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFArray,
  PDFRawStream,
  PDFNumber,
} from "pdf-lib";

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

async function decodeXObjectToBitmap(
  stream: PDFRawStream,
): Promise<ImageBitmap | null> {
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
    } catch {
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

      const colorSpace =
        colorSpaceObj instanceof PDFName ? colorSpaceObj.asString() : "";

      const isRGB = colorSpace.includes("DeviceRGB");

      const isGray = colorSpace.includes("DeviceGray");

      if (
        !width ||
        !height ||
        bitsPerComponent !== 8 ||
        hasSMask ||
        (!isRGB && !isGray)
      ) {
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

      for (
        let src = 0, dst = 0;
        src < expectedLength;
        src += channels, dst += 4
      ) {
        if (isRGB) {
          imageData.data[dst] = contents[src];

          imageData.data[dst + 1] = contents[src + 1];

          imageData.data[dst + 2] = contents[src + 2];
        } else {
          const v = contents[src];

          imageData.data[dst] = v;

          imageData.data[dst + 1] = v;

          imageData.data[dst + 2] = v;
        }

        imageData.data[dst + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);

      return await createImageBitmap(canvas);
    } catch {
      return null;
    }
  }

  return null;
}

async function recompressBitmap(
  bitmap: ImageBitmap,
  settings: CompressionSettings,
): Promise<Uint8Array | null> {
  const scale = Math.min(
    1,
    settings.maxDimension / Math.max(bitmap.width, bitmap.height),
  );

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

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", settings.quality),
  );

  if (!blob) {
    return null;
  }

  return new Uint8Array(await blob.arrayBuffer());
}

async function compressImagesInDocument(
  pdfDoc: PDFDocument,
  settings: CompressionSettings,
): Promise<void> {
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

        const isImage =
          subtype instanceof PDFName && subtype.asString().includes("Image");

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
        } finally {
          bitmap.close?.();
        }
      } catch {
        // Leave this image untouched if anything goes wrong decoding it.
        continue;
      }
    }
  }
}

async function compressPdfFile(
  file: File,
  settings: CompressionSettings,
): Promise<Uint8Array> {
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

async function compressPdfToTarget(
  file: File,
  targetBytes: number,
): Promise<Uint8Array> {
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

export default function CompressPdf() {
  const [tabMode, setTabMode] = useState<"preset" | "target">("preset");

  const [compressionLevel, setCompressionLevel] =
    useState<CompressionLevel>("balanced");

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
      } else {
        bytes = await compressPdfFile(
          selectedFile,
          PRESET_SETTINGS[compressionLevel],
        );
      }

      setResult({
        bytes,
        originalSize: selectedFile.size,
        compressedSize: bytes.byteLength,
      });
    } catch (err) {
      console.error(err);

      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong while compressing this PDF.",
      );
    } finally {
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
    ? Math.max(
        0,
        Math.round((1 - result.compressedSize / result.originalSize) * 100),
      )
    : 0;

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

        <span className="font-semibold text-gray-900">Compress PDF</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
            <Minimize2 size={24} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Compress PDF</h1>

              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>

            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Shrink embedded photos and scans inside a PDF — text stays sharp.
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
        {/* Left Side: Upload & Options */}
        <div className="lg:col-span-4 space-y-4">
          {/* Upload Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900">
              Files ({selectedFile ? 1 : 0})
            </h2>

            {!selectedFile ? (
              <label className="border-2 border-dashed border-red-200 bg-red-50/30 hover:bg-red-50/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                <div className="w-10 h-10 bg-red-100/80 text-red-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload size={20} />
                </div>

                <span className="text-xs font-bold text-gray-800">
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
                    <p className="text-xs font-bold text-gray-800 truncate">
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

          {/* Compression Settings Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-900">
              Compression settings
            </h2>

            {/* Toggle Tabs */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setTabMode("preset")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tabMode === "preset"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Quality preset
              </button>

              <button
                onClick={() => setTabMode("target")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tabMode === "target"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Target file size
              </button>
            </div>

            {tabMode === "preset" ? (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-gray-600 block">
                  Compression level
                </span>

                {/* Level 1: Balanced */}
                <button
                  onClick={() => setCompressionLevel("balanced")}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    compressionLevel === "balanced"
                      ? "border-red-400 bg-red-50/40"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="text-xs font-bold text-gray-800">
                    Balanced
                  </div>

                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Good balance for mixed text and images
                  </div>
                </button>

                {/* Level 2: Light */}
                <button
                  onClick={() => setCompressionLevel("light")}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    compressionLevel === "light"
                      ? "border-red-400 bg-red-50/40"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="text-xs font-bold text-gray-800">
                    Light compression
                  </div>

                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Gentle image reduction, best for text-heavy PDFs
                  </div>
                </button>

                {/* Level 3: Strong */}
                <button
                  onClick={() => setCompressionLevel("strong")}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    compressionLevel === "strong"
                      ? "border-red-400 bg-red-50/40"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="text-xs font-bold text-gray-800">
                    Strong compression
                  </div>

                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Smaller images, ideal for scans and photos
                  </div>
                </button>
              </div>
            ) : (
              <div className="pt-2 space-y-2">
                <label className="text-[11px] font-bold text-gray-600 block">
                  Target size (MB)
                </label>

                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={targetSizeMB}
                  onChange={(e) => setTargetSizeMB(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />

                <p className="text-[10px] text-gray-400">
                  We'll try a few quality levels and use the closest match at or
                  under your target.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Compression Preview */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-700">
              Compression preview
            </h2>

            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                errorMessage
                  ? "bg-red-100 text-red-600"
                  : result
                    ? "bg-emerald-100 text-emerald-700"
                    : isProcessing
                      ? "bg-amber-100 text-amber-700"
                      : selectedFile
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-500"
              }`}
            >
              {errorMessage
                ? "Error"
                : result
                  ? "Done"
                  : isProcessing
                    ? "Compressing"
                    : selectedFile
                      ? "Ready"
                      : "Empty"}
            </span>
          </div>

          {isProcessing ? (
            <div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <Loader2 size={28} className="text-red-400 animate-spin mb-3" />

              <p className="text-xs font-bold text-gray-800">
                Compressing your PDF…
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

              <p className="text-xs font-bold text-red-700">
                Compression failed
              </p>

              <p className="text-[11px] text-red-500 mt-1 max-w-xs">
                {errorMessage}
              </p>
            </div>
          ) : result ? (
            <div className="my-auto py-10 flex flex-col items-center gap-5">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-100">
                <CheckCircle2 size={24} />
              </div>

              <div className="flex items-center gap-4 sm:gap-8">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    Original
                  </p>

                  <p className="text-sm font-bold text-gray-800">
                    {formatBytes(result.originalSize)}
                  </p>
                </div>

                <span className="text-gray-300 text-lg">→</span>

                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    Compressed
                  </p>

                  <p className="text-sm font-bold text-emerald-600">
                    {formatBytes(result.compressedSize)}
                  </p>
                </div>
              </div>

              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                {reductionPercent > 0
                  ? `${reductionPercent}% smaller`
                  : "Already well optimized"}
              </span>

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-red-600 transition-all"
              >
                <Download size={14} />
                Download compressed PDF
              </button>
            </div>
          ) : (
            <div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <div className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center mb-3 border border-red-100">
                <FileText size={20} />
              </div>

              <p className="text-xs font-bold text-gray-800">
                Add a PDF to get started
              </p>

              <p className="text-[11px] text-gray-400 mt-1">
                The compressed file will appear here after processing.
              </p>
            </div>
          )}

          <div />
        </div>
      </div>

      {/* Bottom Status & Actions */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              errorMessage
                ? "bg-red-500"
                : result
                  ? "bg-emerald-500"
                  : isProcessing
                    ? "bg-amber-400 animate-pulse"
                    : "bg-gray-400"
            }`}
          />

          <span>
            {errorMessage
              ? "Compression failed — try again"
              : result
                ? `Done: ${formatBytes(
                    result.compressedSize,
                  )} (${reductionPercent}% smaller)`
                : isProcessing
                  ? "Compressing…"
                  : selectedFile
                    ? `Ready to compress: ${selectedFile.name}`
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
            onClick={handleCompress}
            disabled={!selectedFile || isProcessing}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              selectedFile && !isProcessing
                ? "bg-red-500 text-white shadow-xs hover:bg-red-600"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isProcessing && <Loader2 size={14} className="animate-spin" />}

            {isProcessing ? "Compressing…" : "Compress PDF"}
          </button>
        </div>
      </div>

      {/* Security Info Banner */}
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
            Drag and drop your PDF file into the upload box or click to select a
            file. Choose your preferred compression quality or target file size,
            then click "Compress PDF" to start shrinking your document.
          </div>
        )}
      </div>

      {/* Related Tools Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-gray-900">
          Tools in the same category
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <Link
            href="/sohoj-tools/split-pdf"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-red-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
              <FileCode size={16} />
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-red-500 transition-colors">
                Split PDF
              </h4>

              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                Extract specific pages or split every page into separate files.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
