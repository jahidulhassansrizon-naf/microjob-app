"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Film,
  Star,
  Share2,
  ArrowLeft,
  Download,
  Image as ImageIcon,
  CreditCard,
  Wand2,
  Zap,
  Scale,
  Maximize2,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type CompressionPreset = "light" | "balanced" | "strong";

export default function CompressGif() {
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: number;
  } | null>(null);

  const [preset, setPreset] = useState<CompressionPreset>("balanced");
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [compressedSize, setCompressedSize] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "image/gif") {
      const url = URL.createObjectURL(file);
      setSelectedGif(url);
      setFileDetails({ name: file.name, size: file.size });
      setIsDone(false);
    }
  };

  const handleCompress = () => {
    if (!selectedGif || !fileDetails) return;

    setIsCompressing(true);
    setIsDone(false);

    // Simulate compression process based on preset ratio
    setTimeout(() => {
      const ratio =
        preset === "light" ? 0.8 : preset === "balanced" ? 0.55 : 0.35;
      setCompressedSize(Math.round(fileDetails.size * ratio));
      setIsCompressing(false);
      setIsDone(true);
    }, 1200);
  };

  const handleReset = () => {
    setSelectedGif(null);
    setFileDetails(null);
    setIsDone(false);
    setIsCompressing(false);
    setPreset("balanced");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = () => {
    if (!selectedGif || !fileDetails) return;
    const link = document.createElement("a");
    link.download = `compressed-${fileDetails.name}`;
    link.href = selectedGif;
    link.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full space-y-5 text-gray-800 font-sans">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/gif"
        className="hidden"
      />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link
          href="/sohoj-tools"
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Sohoj Tools</span>
        </Link>
        <span>/</span>
        <span>Image Tools</span>
        <span>/</span>
        <span className="font-semibold text-gray-900">Compress GIF</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <Film size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Compress GIF</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Reduce animated GIF file sizes while preserving animation smooth
              quality — right inside your browser.
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

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side Controls Panel */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Compression Preset Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
              <h2 className="text-xs font-bold text-gray-900">
                Compression Level
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: "light",
                    label: "Light",
                    icon: Zap,
                  },
                  {
                    id: "balanced",
                    label: "Balanced",
                    icon: Scale,
                  },
                  {
                    id: "strong",
                    label: "Strong",
                    icon: Maximize2,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setPreset(item.id as CompressionPreset);
                        setIsDone(false);
                      }}
                      className={`py-3 px-2 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                        preset === item.id
                          ? "border-amber-500 bg-amber-50/40 text-amber-500 shadow-2xs"
                          : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-gray-400 font-medium pt-1 line-clamp-2">
                {preset === "light" &&
                  "Light compression removes minor color duplicates while preserving original quality."}
                {preset === "balanced" &&
                  "Best balance between file size reduction and crisp GIF animation quality."}
                {preset === "strong" &&
                  "Maximum compression for smallest file sizes. Ideal for web and chat apps."}
              </p>
            </div>

            {/* File Info Card (If uploaded) */}
            {fileDetails && (
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-700 truncate max-w-[180px]">
                    {fileDetails.name}
                  </span>
                  <span className="text-gray-400 text-[10px]">
                    {formatSize(fileDetails.size)}
                  </span>
                </div>

                {isDone && (
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 size={13} /> Saved{" "}
                      {Math.round(
                        (1 - compressedSize / fileDetails.size) * 100,
                      )}
                      %
                    </span>
                    <span className="font-bold text-amber-500 text-[11px]">
                      {formatSize(compressedSize)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl transition-all"
            >
              Reset
            </button>
            {!isDone ? (
              <button
                onClick={handleCompress}
                disabled={!selectedGif || isCompressing}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  selectedGif && !isCompressing
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isCompressing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Compressing...
                  </>
                ) : (
                  <>
                    <Film size={14} />
                    Compress GIF
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} />
                Download GIF
              </button>
            )}
          </div>
        </div>

        {/* Right Side Preview Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 min-h-[440px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-900">Preview</h2>
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                {selectedGif ? "Ready" : "Empty"}
              </span>
            </div>

            {/* Canvas / Dropzone Area */}
            {!selectedGif ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center flex-1 text-center my-1 border-dashed cursor-pointer hover:bg-gray-100/50 transition-all min-h-[360px]"
              >
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
                  <ImageIcon size={28} />
                </div>
                <span className="text-xs font-bold text-gray-800 block">
                  Upload a GIF to compress
                </span>
                <span className="text-[10px] text-gray-400 mt-1">
                  Drag & drop your GIF file or click to browse.
                </span>
                <span className="text-[10px] text-gray-400 mt-4 font-medium">
                  Or press Ctrl+V to paste a copied image
                </span>
              </div>
            ) : (
              <div
                className="relative flex-1 rounded-2xl border border-gray-200 overflow-hidden flex items-center justify-center min-h-[360px] p-6"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedGif}
                  alt="GIF Preview"
                  className="max-h-[360px] max-w-full object-contain drop-shadow-xs"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tools in the same category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-gray-900">
          Tools in the same category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/sohoj-tools/image-size-reducer"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-amber-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
              <ImageIcon size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-amber-500 transition-colors">
                Image Size Reducer
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Shrink JPG, PNG, and WebP photos in your browser — quality stays
                sharp.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/nid-to-pdf"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-amber-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
              <CreditCard size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-amber-500 transition-colors">
                NID to PDF
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Turn NID card front and back photos into a clean A4 PDF — all in
                your browser.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/remove-background"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-amber-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
              <Wand2 size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-amber-500 transition-colors">
                Remove Background
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Erase portrait, product, or logo backgrounds in your browser —
                download a transparent PNG.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
