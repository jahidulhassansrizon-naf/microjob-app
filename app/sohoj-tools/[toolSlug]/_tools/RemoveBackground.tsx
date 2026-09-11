"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wand2,
  Star,
  Share2,
  ArrowLeft,
  Image as ImageIcon,
  Palette,
  CreditCard,
  BookOpen,
  Upload,
  Droplet,
  Layers,
} from "lucide-react";

export default function RemoveBackground() {
  const [bgType, setBgType] = useState<"transparent" | "solid" | "photo">(
    "transparent",
  );
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setIsProcessing(false);
  };

  const handleRemoveBg = () => {
    if (!imageFile) return;
    setIsProcessing(true);
    // ব্যাকগ্রাউন্ড রিমুভ করার প্রসেসিং লজিক এখানে যুক্ত হবে
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
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
        <span className="font-semibold text-gray-900">Remove Background</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <Wand2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">
                Remove Background
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Erase portrait, product, or logo backgrounds in your browser —
              download a transparent PNG.
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
        {/* Left Side: Controls Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
              New background
            </h2>

            {/* Background Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button
                onClick={() => setBgType("transparent")}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  bgType === "transparent"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Layers size={14} />
                <span>Transparent</span>
              </button>

              <button
                onClick={() => setBgType("solid")}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  bgType === "solid"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Palette size={14} />
                <span>Solid color</span>
              </button>

              <button
                onClick={() => setBgType("photo")}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  bgType === "photo"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <ImageIcon size={14} />
                <span>Photo</span>
              </button>
            </div>

            {/* Solid Color Options (Only when 'Solid color' is chosen) */}
            {bgType === "solid" && (
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-600 block">
                  Select Color
                </span>
                <div className="flex items-center gap-2">
                  {[
                    "#ffffff",
                    "#000000",
                    "#f3f4f6",
                    "#ef4444",
                    "#3b82f6",
                    "#10b981",
                    "#f59e0b",
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-6 h-6 rounded-full border border-gray-200 transition-transform ${
                        selectedColor === color
                          ? "scale-110 ring-2 ring-amber-500"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Box */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-2">
            <button
              onClick={handleReset}
              className="w-1/3 py-2.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all"
            >
              Reset
            </button>

            <button
              onClick={handleRemoveBg}
              disabled={!imageFile || isProcessing}
              className={`w-2/3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                imageFile && !isProcessing
                  ? "bg-amber-500 text-white shadow-xs hover:bg-amber-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isProcessing ? "Processing..." : "Remove background"}
            </button>
          </div>
        </div>

        {/* Right Side: Canvas / Preview Area */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-xs font-bold text-gray-800">Preview</h2>
            <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2.5 py-1 rounded-full">
              {imageFile ? "Ready" : "Empty"}
            </span>
          </div>

          {/* Preview Container */}
          <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-6 my-4 flex-1 flex flex-col justify-center items-center relative overflow-hidden">
            {previewUrl ? (
              <div className="relative max-w-full max-h-[380px] flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Cutout Preview"
                  className="max-h-[360px] object-contain rounded-lg"
                  style={{
                    backgroundColor:
                      bgType === "solid"
                        ? selectedColor
                        : bgType === "transparent"
                          ? "transparent"
                          : "#ffffff",
                  }}
                />
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center text-center cursor-pointer p-8 w-full h-full">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3 border border-amber-100">
                  <ImageIcon size={22} />
                </div>
                <h3 className="text-xs font-bold text-gray-800 mb-1">
                  Add an image to get started
                </h3>
                <p className="text-[11px] text-gray-400 max-w-xs">
                  The cut-out preview will appear here after processing.
                </p>
                <span className="text-[10px] text-gray-400 mt-4 block">
                  Or press Ctrl+V to paste a copied image
                </span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
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
            href="/sohoj-tools/passport-to-pdf"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-amber-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
              <BookOpen size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-amber-500 transition-colors">
                Passport to PDF
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Turn passport front and back page photos into a clean A4 PDF —
                ICAO 88×125 mm layout, all in your browser.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
