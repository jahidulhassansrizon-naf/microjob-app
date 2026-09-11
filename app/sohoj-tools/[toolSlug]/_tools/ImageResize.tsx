"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Scaling,
  Star,
  Share2,
  ArrowLeft,
  Ruler,
  Percent,
  Lock,
  Unlock,
  RotateCcw,
  Image as ImageIcon,
  CreditCard,
  Wand2,
} from "lucide-react";

export default function ImageResize() {
  const [resizeMode, setResizeMode] = useState<"pixels" | "percentage">(
    "pixels",
  );
  const [width, setWidth] = useState<number>(1280);
  const [height, setHeight] = useState<number>(720);
  const [percentage, setPercentage] = useState<number>(50);
  const [isLocked, setIsLocked] = useState<boolean>(true);

  // Auto maintain 16:9 ratio if locked
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setWidth(val);
    if (isLocked) {
      setHeight(Math.round((val * 9) / 16));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setHeight(val);
    if (isLocked) {
      setWidth(Math.round((val * 16) / 9));
    }
  };

  const handleReset = () => {
    setWidth(1280);
    setHeight(720);
    setPercentage(50);
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
        <span className="font-semibold text-gray-900">Image Resize</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <Scaling size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Image Resize</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Change image dimensions by pixels or percentage — batch resize in
              your browser.
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
        <div className="lg:col-span-4 space-y-4">
          {/* Resize mode Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900">Resize mode</h2>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-100">
              <button
                onClick={() => setResizeMode("pixels")}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  resizeMode === "pixels"
                    ? "bg-white text-amber-500 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Ruler size={14} />
                Pixels
              </button>
              <button
                onClick={() => setResizeMode("percentage")}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  resizeMode === "percentage"
                    ? "bg-white text-amber-500 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Percent size={14} />
                Percentage
              </button>
            </div>
          </div>

          {/* Target Dimensions Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900">
              Target dimensions
            </h2>

            {resizeMode === "pixels" ? (
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 block">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={handleWidthChange}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 block">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={handleHeightChange}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                {/* Aspect Ratio Lock Button */}
                <button
                  onClick={() => setIsLocked(!isLocked)}
                  title={isLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isLocked
                      ? "bg-amber-50 border-amber-200 text-amber-500"
                      : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-gray-600">
                  <span>Scale factor</span>
                  <span>{percentage}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                  <span>10% (Smaller)</span>
                  <span>200% (Larger)</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 border border-gray-200 text-gray-500 hover:text-gray-800 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button className="flex-1 py-2.5 bg-gray-200 text-gray-400 text-xs font-bold rounded-xl cursor-not-allowed text-center transition-all">
              Resize images
            </button>
          </div>
        </div>

        {/* Right Side Resize Preview Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 min-h-[420px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-900">
                Resize preview
              </h2>
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                Empty
              </span>
            </div>

            {/* Empty Upload Dropzone */}
            <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center flex-1 text-center my-1 border-dashed">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
                <ImageIcon size={28} />
              </div>
              <span className="text-xs font-bold text-gray-800 block">
                Add an image to get started
              </span>
              <span className="text-[10px] text-gray-400 mt-1">
                Before and after previews will appear here after resizing.
              </span>
              <span className="text-[10px] text-gray-400 mt-4 font-medium">
                Or press Ctrl+V to paste a copied image
              </span>
            </div>
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
