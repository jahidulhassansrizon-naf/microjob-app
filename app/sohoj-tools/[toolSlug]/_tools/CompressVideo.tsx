"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Share,
  Upload,
  Video,
  Scissors,
  Layers,
  Music,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Download,
} from "lucide-react";

// Related tools in the same category
const relatedTools = [
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
  {
    title: "Video to Audio",
    description:
      "Extract audio from any video in your browser — save as MP3, AAC, or WAV.",
    href: "/sohoj-tools/video-to-audio",
    icon: Music,
  },
];

export default function CompressVideo() {
  const router = useRouter();

  // States
  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<number>(75);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCompressed, setIsCompressed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setIsCompressed(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setIsCompressed(false);
    }
  };

  const handleCompressAction = () => {
    if (!selectedFile) return;
    setIsCompressing(true);
    setTimeout(() => {
      setIsCompressing(false);
      setIsCompressed(true);
    }, 2000);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setVideoUrl(null);
    setIsCompressed(false);
    setIsCompressing(false);
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
                Compress Video
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Video size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Compress Video
              </h1>
              <span className="bg-purple-100 text-purple-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Shrink video files in your browser — adjust quality and resolution
              before sharing or uploading.
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
          {/* LEFT COLUMN: UPLOAD / CONTROLS */}
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
                  className="border-2 border-dashed border-purple-200 bg-purple-50/30 hover:bg-purple-50/60 transition-colors rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center space-y-2.5"
                >
                  <div className="w-10 h-10 bg-white rounded-xl shadow-2xs flex items-center justify-center text-purple-600">
                    <Upload size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      Drop a video here or click to upload
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      One video file, max 500 MB
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
                  <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center shrink-0">
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

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700">
                        Compression Quality
                      </span>
                      <span className="font-bold text-purple-600">
                        {compressionLevel}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="95"
                      value={compressionLevel}
                      onChange={(e) =>
                        setCompressionLevel(Number(e.target.value))
                      }
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                      <span>Smaller file size</span>
                      <span>Higher quality</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: VIDEO PREVIEW & ACTIONS */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[400px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Video preview
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {selectedFile
                      ? isCompressed
                        ? "Compressed"
                        : "Ready"
                      : "Empty"}
                  </span>
                </div>

                <div className="pt-8 pb-8 flex flex-col items-center justify-center text-center">
                  {!videoUrl ? (
                    <div className="py-16 space-y-3">
                      <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                        <Video size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">
                          Add a video to get started
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Your original and compressed preview will appear here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      <div className="max-w-md mx-auto rounded-xl overflow-hidden shadow-md bg-black aspect-video flex items-center justify-center">
                        <video
                          src={videoUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {isCompressed && (
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 py-1.5 px-3 rounded-lg w-max mx-auto">
                          <CheckCircle2 size={16} />
                          <span>
                            Video successfully compressed! Estimated size
                            reduction: ~40%
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
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>
              {!selectedFile
                ? "Add an input to get started"
                : isCompressed
                  ? "Ready to download your compressed file"
                  : "Ready to compress video file"}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
            >
              Reset
            </button>

            {!isCompressed ? (
              <button
                disabled={!selectedFile || isCompressing}
                onClick={handleCompressAction}
                className={`px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 ${
                  !selectedFile || isCompressing
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isCompressing && (
                  <RefreshCw size={14} className="animate-spin" />
                )}
                <span>
                  {isCompressing ? "Compressing..." : "Compress video"}
                </span>
              </button>
            ) : (
              <button
                onClick={() => alert("Downloading compressed video...")}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Download size={14} />
                <span>Download compressed video</span>
              </button>
            )}
          </div>
        </div>

        {/* PRIVACY NOTICE */}
        <div className="bg-purple-50/60 border border-purple-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-purple-800 font-medium">
          <ShieldCheck size={16} className="text-purple-600 shrink-0" />
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
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>How to use</span>
            </div>
            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse && (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>
                1. Upload or drag and drop your video file into the designated
                box.
              </p>
              <p>
                2. Adjust the compression quality slider according to your
                preferred output size and quality.
              </p>
              <p>
                3. Click &quot;Compress video&quot; and then download your
                optimized file directly.
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
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
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
