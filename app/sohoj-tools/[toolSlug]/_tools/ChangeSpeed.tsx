"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Share,
  Upload,
  Gauge,
  Video,
  Scissors,
  Layers,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RefreshCw,
  Download,
} from "lucide-react";

// Related tools in the same category
const relatedTools = [
  {
    title: "Compress Video",
    description:
      "Shrink video files in your browser — adjust quality and resolution before sharing or uploading.",
    href: "/sohoj-tools/compress-video",
    icon: Video,
  },
  {
    title: "Trim/Cut Video",
    description:
      "Cut unwanted sections from a video — set start and end times, then export the clip as MP4.",
    href: "/sohoj-tools/trim-cut-video",
    icon: Scissors,
  },
  {
    title: "Merge Videos",
    description:
      "Join multiple video clips into one MP4 — upload, reorder, and merge in your browser.",
    href: "/sohoj-tools/merge-videos",
    icon: Layers,
  },
];

export default function ChangeSpeed() {
  const router = useRouter();

  // States
  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setIsProcessed(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setIsProcessed(false);
    }
  };

  const handleProcessAction = () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsProcessed(true);
    }, 2000);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setIsProcessed(false);
    setIsProcessing(false);
    setSpeedMultiplier(1.0);
  };

  return (
    <div className="w-full text-gray-800 font-sans pb-16">
      <div className="w-full space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-gray-200/60 rounded-md transition-colors text-gray-700 flex items-center justify-center -ml-1"
                title="Go back"
              >
                <ArrowLeft size={16} />
              </button>
              <Link href="/sohoj-tools" className="hover:text-gray-700">
                Sohoj Tools
              </Link>
              <span>/</span>
              <span className="hover:text-gray-700 cursor-pointer">
                Video Tools
              </span>
              <span>/</span>
              <span className="text-gray-900 font-semibold">Change Speed</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Gauge size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Change Speed
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Speed up or slow down your video files easily in your browser.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-emerald-500 hover:border-emerald-300 transition-all shadow-2xs"
            >
              <Star
                size={16}
                className={
                  isFavorite ? "fill-emerald-400 text-emerald-400" : ""
                }
              />
            </button>
            <button className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 transition-all shadow-2xs">
              <Share size={16} />
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: UPLOAD / OPTIONS */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 tracking-wide uppercase">
                  Files {selectedFile ? "(1)" : "(0)"}
                </span>
                {selectedFile && (
                  <button
                    onClick={handleReset}
                    className="text-[11px] font-semibold text-red-600 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              {!selectedFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center space-y-2.5"
                >
                  <div className="w-10 h-10 bg-white rounded-xl shadow-2xs flex items-center justify-center text-emerald-600">
                    <Upload size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      Drop a video here or click to upload
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      One video file, max 200 MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center shrink-0">
                      <Video size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-gray-700">
                          Speed multiplier
                        </label>
                        <span className="font-semibold text-emerald-600">
                          {speedMultiplier}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.25"
                        max="3.0"
                        step="0.25"
                        value={speedMultiplier}
                        onChange={(e) =>
                          setSpeedMultiplier(Number(e.target.value))
                        }
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setSpeedMultiplier(spd)}
                          className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                            speedMultiplier === spd
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: PREVIEW & ACTIONS */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[400px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Video preview
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {selectedFile
                      ? isProcessed
                        ? "Processed"
                        : "Ready"
                      : "Empty"}
                  </span>
                </div>

                <div className="pt-8 pb-8 flex flex-col items-center justify-center text-center">
                  {!selectedFile ? (
                    <div className="py-16 space-y-3">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                        <Video size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">
                          Add a video to get started
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Select your desired speed multiplier, then apply
                          changes.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      <div className="max-w-md mx-auto rounded-xl overflow-hidden shadow-md bg-gray-900 p-6 text-white text-center space-y-2">
                        <Gauge size={32} className="mx-auto text-emerald-400" />
                        <p className="text-xs font-bold">
                          Target Speed: {speedMultiplier}x
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {selectedFile.name}
                        </p>
                      </div>
                      {isProcessed && (
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 py-1.5 px-3 rounded-lg w-max mx-auto">
                          <CheckCircle2 size={16} />
                          <span>Speed adjusted successfully!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              {!selectedFile
                ? "Add an input to get started"
                : isProcessed
                  ? "Ready to download your modified file"
                  : "Ready to change speed"}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
            >
              Reset
            </button>

            {!isProcessed ? (
              <button
                disabled={!selectedFile || isProcessing}
                onClick={handleProcessAction}
                className={`px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 ${
                  !selectedFile || isProcessing
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isProcessing && (
                  <RefreshCw size={14} className="animate-spin" />
                )}
                <span>{isProcessing ? "Processing..." : "Change speed"}</span>
              </button>
            ) : (
              <button
                onClick={() => alert("Downloading speed-adjusted video...")}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Download size={14} />
                <span>Download video file</span>
              </button>
            )}
          </div>
        </div>

        {/* PRIVACY NOTICE */}
        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>
            Your files are processed in the browser — they are not uploaded to
            any server.
          </span>
        </div>

        {/* HOW TO USE DROPDOWN */}
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <button
            onClick={() => setShowHowToUse(!showHowToUse)}
            className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-gray-900 hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>How to use</span>
            </div>
            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse && (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>
                1. Upload your video file using the file selector or drag and
                drop.
              </p>
              <p>
                2. Select the desired speed multiplier using the slider or
                preset buttons.
              </p>
              <p>
                3. Click &quot;Change speed&quot; and download your modified
                video instantly.
              </p>
            </div>
          )}
        </div>

        {/* TOOLS IN THE SAME CATEGORY */}
        <div className="pt-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Tools in the same category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool, idx) => {
              const ToolIcon = tool.icon;
              return (
                <Link
                  key={idx}
                  href={tool.href}
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      {tool.description}
                    </p>
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
