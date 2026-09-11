"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Star,
  Share2,
  ArrowLeft,
  Upload,
  Download,
  Printer,
  Wand2,
  Palette,
  SunMedium,
  FileSpreadsheet,
  Image as ImageIcon,
  CreditCard,
  RefreshCw,
} from "lucide-react";

export default function DocumentCleanup() {
  const [selectedPreset, setSelectedPreset] = useState<
    "normal" | "magic" | "color" | "bw"
  >("magic");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Paste image directly from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            setImageFile(blob);
            setPreviewUrl(URL.createObjectURL(blob));
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setSelectedPreset("magic");
  };

  return (
    <div className="w-full space-y-5 text-gray-800 font-sans">
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
        <span className="font-semibold text-gray-900">Document Cleanup</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-teal-50 text-teal-500 rounded-xl flex items-center justify-center shrink-0 border border-teal-100">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">
                Document Cleanup
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Enhance, clean background shadows, and clarify scanned document
              photos instantly in your browser.
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
        {/* Left Side Controls */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
              Presets & Filters
            </h2>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
              <button
                onClick={() => setSelectedPreset("normal")}
                className={`p-3 rounded-lg flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  selectedPreset === "normal"
                    ? "bg-white text-teal-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <SunMedium size={18} />
                <span>Normal</span>
              </button>

              <button
                onClick={() => setSelectedPreset("magic")}
                className={`p-3 rounded-lg flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  selectedPreset === "magic"
                    ? "bg-white text-teal-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Wand2 size={18} />
                <span>Magic Clean</span>
              </button>

              <button
                onClick={() => setSelectedPreset("color")}
                className={`p-3 rounded-lg flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  selectedPreset === "color"
                    ? "bg-white text-teal-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Palette size={18} />
                <span>Color Boost</span>
              </button>

              <button
                onClick={() => setSelectedPreset("bw")}
                className={`p-3 rounded-lg flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  selectedPreset === "bw"
                    ? "bg-white text-teal-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <FileSpreadsheet size={18} />
                <span>B & W</span>
              </button>
            </div>

            <p className="text-[10px] text-gray-400">
              Select Magic Clean to automatically remove background shadows and
              clarify text readability.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleReset}
                className="py-2.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-1"
              >
                <RefreshCw size={14} />
                <span>Reset</span>
              </button>

              <button
                disabled={!imageFile}
                className={`py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  imageFile
                    ? "bg-teal-500 text-white shadow-xs hover:bg-teal-600"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>

            <button
              disabled={!imageFile}
              className={`w-full py-2.5 border text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                imageFile
                  ? "border-teal-500 text-teal-600 hover:bg-teal-50"
                  : "border-gray-200 text-gray-300 cursor-not-allowed"
              }`}
            >
              <Printer size={14} />
              <span>Print Document</span>
            </button>
          </div>
        </div>

        {/* Right Side Preview Area */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[500px]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-xs font-bold text-gray-800">Preview</h2>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              {imageFile ? imageFile.name : "Empty"}
            </span>
          </div>

          {/* Canvas or Drag/Drop Target */}
          <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-6 my-4 flex-1 flex flex-col justify-center items-center relative overflow-hidden min-h-[380px]">
            {previewUrl ? (
              <div className="relative max-w-full max-h-[420px] flex justify-center items-center">
                {/* Visual filter applied dynamically based on selected preset */}
                <img
                  src={previewUrl}
                  alt="Document Preview"
                  className={`max-h-[400px] object-contain rounded-lg transition-all ${
                    selectedPreset === "magic"
                      ? "contrast-125 brightness-110 grayscale-25"
                      : selectedPreset === "color"
                        ? "saturate-150 contrast-110"
                        : selectedPreset === "bw"
                          ? "grayscale contrast-200"
                          : ""
                  }`}
                />
              </div>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-10">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3 border border-amber-100">
                  <ImageIcon size={24} />
                </div>
                <span className="text-sm font-bold text-gray-800">
                  Upload document image
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  Drag and drop photo here, or click to browse
                </span>
                <span className="text-[11px] text-gray-400 mt-3 font-medium bg-white px-3 py-1 rounded-full border border-gray-200 shadow-2xs">
                  Or press <kbd className="font-sans font-bold">Ctrl+V</kbd> to
                  paste a copied image
                </span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
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
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-teal-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-teal-50 text-teal-500 rounded-lg flex items-center justify-center shrink-0">
              <ImageIcon size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-teal-500 transition-colors">
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
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-teal-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-teal-50 text-teal-500 rounded-lg flex items-center justify-center shrink-0">
              <CreditCard size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-teal-500 transition-colors">
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
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-teal-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-teal-50 text-teal-500 rounded-lg flex items-center justify-center shrink-0">
              <Wand2 size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-teal-500 transition-colors">
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
