"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Share,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ScanText,
  RotateCcw,
  ShieldCheck,
  Upload,
  Languages,
  Keyboard,
  Hash,
} from "lucide-react";
import { createWorker } from "tesseract.js";

// Related tools in the same category
const relatedTools = [
  {
    title: "Bijoy ↔ Unicode",
    description:
      "Convert Bangla text between Bijoy ANSI and Unicode directly in your browser.",
    href: "/sohoj-tools/bijoy-unicode",
    icon: Languages,
  },
  {
    title: "Banglish Typing",
    description:
      "Type Bangla with an English keyboard — live Banglish to Bangla and Bangla to Banglish conversion in your browser.",
    href: "/sohoj-tools/banglish-typing",
    icon: Keyboard,
  },
  {
    title: "Number to Words",
    description:
      "Convert any number into English and Bengali words instantly in your browser.",
    href: "/sohoj-tools/number-to-words",
    icon: Hash,
  },
];

export default function ImageToText() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showHowToUse, setShowHowToUse] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("eng+ben");

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedText("");
    }
  };

  // Run OCR Extraction
  const handleExtractText = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgressMessage("Initializing OCR engine...");

    try {
      const worker = await createWorker(
        selectedLanguage === "eng+ben" ? ["eng", "ben"] : selectedLanguage,
      );

      setProgressMessage("Recognizing text from image...");
      const ret = await worker.recognize(selectedFile);

      setExtractedText(ret.data.text);
      await worker.terminate();
    } catch (error) {
      console.error(error);
      setExtractedText(
        "Error extracting text. Please try with a clearer image.",
      );
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopyText = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                Text Tools
              </span>
              <span>/</span>
              <span className="text-gray-900 font-semibold">Image to Text</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <ScanText size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Image to Text
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Extract text from images with OCR in your browser — supports
              English and Bengali.
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
          {/* LEFT COLUMN: FILE UPLOAD & OPTIONS */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 tracking-wide uppercase">
                  Files {selectedFile ? "(1)" : "(0)"}
                </span>
                {selectedFile && (
                  <button
                    onClick={handleReset}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <RotateCcw size={12} />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Upload Box */}
              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300/80 bg-emerald-50/30 hover:bg-emerald-50/60 transition-all rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center group"
                >
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Upload size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-800 mb-1">
                    Drop an image here or click to upload
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    JPG, PNG, WebP, BMP, or GIF — max 50MB
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-800 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}

              {/* Language Selection */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-700 block">
                  OCR Language
                </span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="eng+ben">English + Bengali (উভয়ই)</option>
                  <option value="eng">English Only</option>
                  <option value="ben">Bengali Only (বাংলা)</option>
                </select>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PREVIEW & RESULT */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[420px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Image preview & Extracted text
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${extractedText ? "text-emerald-600 bg-emerald-50" : "text-gray-400 bg-gray-100"}`}
                  >
                    {extractedText
                      ? "Completed"
                      : selectedFile
                        ? "Ready"
                        : "Empty"}
                  </span>
                </div>

                <div className="pt-4">
                  {!selectedFile ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                        <ScanText size={24} />
                      </div>
                      <h3 className="text-xs font-bold text-gray-900 mb-1">
                        Upload an image to extract text
                      </h3>
                      <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                        Your image preview and extracted text will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Image Preview */}
                      <div className="p-3 bg-gray-50/50 border border-gray-200/60 rounded-xl flex flex-col items-center justify-center min-h-[250px]">
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt="Uploaded Image"
                            className="max-h-[220px] object-contain rounded-lg shadow-2xs"
                          />
                        )}
                      </div>

                      {/* Right: Extracted Result Area */}
                      <div className="p-3 bg-[#FDFCFB] border border-gray-200/60 rounded-xl flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                            Result
                          </span>
                          {extractedText && (
                            <button
                              onClick={handleCopyText}
                              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                            >
                              {copied ? (
                                <Check size={12} />
                              ) : (
                                <Copy size={12} />
                              )}
                              <span>{copied ? "Copied!" : "Copy"}</span>
                            </button>
                          )}
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[200px]">
                          {isProcessing ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                              <p className="text-xs font-semibold text-emerald-700">
                                {progressMessage}
                              </p>
                            </div>
                          ) : extractedText ? (
                            <textarea
                              value={extractedText}
                              onChange={(e) => setExtractedText(e.target.value)}
                              className="w-full h-full min-h-[160px] bg-transparent text-xs font-medium text-gray-800 focus:outline-none resize-none leading-relaxed"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-gray-400">
                              <p className="text-xs font-medium">
                                Click "Extract text" button below to start OCR
                                conversion.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button Bar inside the card */}
              {selectedFile && !isProcessing && (
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-500">
                    Ready to scan text
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReset}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleExtractText}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <ScanText size={14} />
                      <span>Extract text</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                1. Upload an image containing English or Bengali text using the
                upload box.
              </p>
              <p>
                2. Select your target OCR language (English, Bengali, or Both).
              </p>
              <p>
                3. Click the &quot;Extract text&quot; button to scan the image.
              </p>
              <p>
                4. Copy the recognized text or edit it directly from the result
                box.
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
