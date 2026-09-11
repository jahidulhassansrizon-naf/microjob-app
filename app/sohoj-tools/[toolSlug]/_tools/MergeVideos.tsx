"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Share,
  Upload,
  Layers,
  Video,
  Scissors,
  Music,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RefreshCw,
  Download,
  X,
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
    title: "Video to Audio",
    description:
      "Extract audio from any video in your browser — save as MP3, AAC, or WAV.",
    href: "/sohoj-tools/video-to-audio",
    icon: Music,
  },
];

export default function MergeVideos() {
  const router = useRouter();

  // States
  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [isMerged, setIsMerged] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
      setIsMerged(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
      setIsMerged(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setIsMerged(false);
  };

  const handleMergeAction = () => {
    if (selectedFiles.length < 2) return;
    setIsMerging(true);
    setTimeout(() => {
      setIsMerging(false);
      setIsMerged(true);
    }, 2000);
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setIsMerged(false);
    setIsMerging(false);
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
              <span className="text-gray-900 font-semibold">Merge Videos</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Layers size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Merge Videos
              </h1>
              <span className="bg-purple-100 text-purple-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Join multiple video clips into one MP4 — upload, reorder, and
              merge in your browser.
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
          {/* LEFT COLUMN: UPLOAD / FILES LIST */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 tracking-wide uppercase">
                  Files ({selectedFiles.length})
                </span>
                {selectedFiles.length > 0 && (
                  <button
                    onClick={handleReset}
                    className="text-[11px] font-semibold text-red-600 hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-200 bg-purple-50/30 hover:bg-purple-50/60 transition-colors rounded-2xl p-5 text-center cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-9 h-9 bg-white rounded-xl shadow-2xs flex items-center justify-center text-purple-600">
                  <Upload size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    Drop video files here or click to upload
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Videos, max 200 MB each (at least 2)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="bg-purple-50/50 border border-purple-100 rounded-xl p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-7 h-7 bg-purple-100 text-purple-700 rounded-md flex items-center justify-center shrink-0 text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
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
                    Merge preview
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {selectedFiles.length >= 2
                      ? isMerged
                        ? "Merged"
                        : "Ready"
                      : "Empty"}
                  </span>
                </div>

                <div className="pt-8 pb-8 flex flex-col items-center justify-center text-center">
                  {selectedFiles.length < 2 ? (
                    <div className="py-16 space-y-3">
                      <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                        <Video size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">
                          Add at least two videos
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Arrange them in order, then merge into one file.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      <div className="max-w-md mx-auto rounded-xl overflow-hidden shadow-md bg-gray-900 p-6 text-white text-center space-y-2">
                        <Layers size={32} className="mx-auto text-purple-400" />
                        <p className="text-xs font-bold">
                          {selectedFiles.length} video files selected for
                          merging
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Sequence ready to be combined into a single continuous
                          MP4 file.
                        </p>
                      </div>
                      {isMerged && (
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 py-1.5 px-3 rounded-lg w-max mx-auto">
                          <CheckCircle2 size={16} />
                          <span>
                            Videos successfully merged into a single file!
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
              {selectedFiles.length < 2
                ? "Add at least two videos"
                : isMerged
                  ? "Ready to download your merged file"
                  : "Ready to merge video files"}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
            >
              Reset
            </button>

            {!isMerged ? (
              <button
                disabled={selectedFiles.length < 2 || isMerging}
                onClick={handleMergeAction}
                className={`px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 ${
                  selectedFiles.length < 2 || isMerging
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isMerging && <RefreshCw size={14} className="animate-spin" />}
                <span>{isMerging ? "Merging..." : "Merge videos"}</span>
              </button>
            ) : (
              <button
                onClick={() => alert("Downloading merged video...")}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Download size={14} />
                <span>Download merged video</span>
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
                1. Upload two or more video files using the file selection box.
              </p>
              <p>2. Verify the list and order of your added video files.</p>
              <p>
                3. Click &quot;Merge videos&quot; and download your combined
                output file instantly.
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
