"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Share,
  Upload,
  Music,
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

export default function VideoToAudio() {
  const router = useRouter();

  // States
  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioFormat, setAudioFormat] = useState<string>("MP3");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtracted, setIsExtracted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setIsExtracted(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setIsExtracted(false);
    }
  };

  const handleExtractAction = () => {
    if (!selectedFile) return;
    setIsExtracting(true);
    setTimeout(() => {
      setIsExtracting(false);
      setIsExtracted(true);
    }, 2000);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setIsExtracted(false);
    setIsExtracting(false);
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
              <span className="text-gray-900 font-semibold">
                Video to Audio
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Music size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Video to Audio
              </h1>
              <span className="bg-orange-100 text-orange-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Extract audio from any video in your browser — save as MP3, AAC,
              or WAV.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-amber-500 hover:border-amber-300 transition-all shadow-2xs"
            >
              <Star
                size={16}
                className={isFavorite ? "fill-amber-400 text-amber-400" : ""}
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
                  className="border-2 border-dashed border-orange-200 bg-orange-50/30 hover:bg-orange-50/60 transition-colors rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center space-y-2.5"
                >
                  <div className="w-10 h-10 bg-white rounded-xl shadow-2xs flex items-center justify-center text-orange-600">
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
                  <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center shrink-0">
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

                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <label className="text-xs font-bold text-gray-700">
                      Output Audio Format
                    </label>
                    <select
                      value={audioFormat}
                      onChange={(e) => setAudioFormat(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:border-orange-500"
                    >
                      <option value="MP3">MP3</option>
                      <option value="AAC">AAC</option>
                      <option value="WAV">WAV</option>
                    </select>
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
                    Preview
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {selectedFile
                      ? isExtracted
                        ? "Extracted"
                        : "Ready"
                      : "Empty"}
                  </span>
                </div>

                <div className="pt-8 pb-8 flex flex-col items-center justify-center text-center">
                  {!selectedFile ? (
                    <div className="py-16 space-y-3">
                      <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                        <Video size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">
                          Add a video to get started
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Your video preview and extracted audio will appear
                          here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      <div className="max-w-md mx-auto rounded-xl overflow-hidden shadow-md bg-gray-900 p-6 text-white text-center space-y-2">
                        <Music size={32} className="mx-auto text-orange-400" />
                        <p className="text-xs font-bold">
                          Audio track ready to be extracted as {audioFormat}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {selectedFile.name}
                        </p>
                      </div>
                      {isExtracted && (
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 py-1.5 px-3 rounded-lg w-max mx-auto">
                          <CheckCircle2 size={16} />
                          <span>
                            Audio extracted successfully as {audioFormat}!
                          </span>
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
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span>
              {!selectedFile
                ? "Add an input to get started"
                : isExtracted
                  ? "Ready to download your extracted audio"
                  : "Ready to extract audio"}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
            >
              Reset
            </button>

            {!isExtracted ? (
              <button
                disabled={!selectedFile || isExtracting}
                onClick={handleExtractAction}
                className={`px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 ${
                  !selectedFile || isExtracting
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isExtracting && (
                  <RefreshCw size={14} className="animate-spin" />
                )}
                <span>
                  {isExtracting
                    ? "Extracting..."
                    : `Extract audio (${audioFormat})`}
                </span>
              </button>
            ) : (
              <button
                onClick={() => alert("Downloading extracted audio file...")}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Download size={14} />
                <span>Download audio file</span>
              </button>
            )}
          </div>
        </div>

        {/* PRIVACY NOTICE */}
        <div className="bg-orange-50/60 border border-orange-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-orange-800 font-medium">
          <ShieldCheck size={16} className="text-orange-600 shrink-0" />
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
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
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
                2. Choose your preferred output audio format (MP3, AAC, or WAV).
              </p>
              <p>
                3. Click &quot;Extract audio&quot; and download your audio track
                instantly.
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
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-orange-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
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
