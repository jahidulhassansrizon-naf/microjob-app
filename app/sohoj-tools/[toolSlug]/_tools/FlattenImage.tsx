"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Star,
  Share2,
  ArrowLeft,
  RotateCcw,
  Image as ImageIcon,
  CreditCard,
  Wand2,
  Wand,
  FileImage,
} from "lucide-react";

export default function FlattenImage() {
  const [outputFormat, setOutputFormat] = useState<
    "jpg" | "png" | "webp" | "avif"
  >("jpg");
  const [rotation, setRotation] = useState<number>(0);

  const handleReset = () => {
    setOutputFormat("jpg");
    setRotation(0);
  };

  const handleResetCorners = () => {
    // Reset corners logic
  };

  const handleAutoDetect = () => {
    // Auto detect corners logic
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
        <span className="font-semibold text-gray-900">Flatten Image</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <Layers size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Flatten Image</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Straighten a photographed page — drag the four corners and get a
              flat, square-on document, all in your browser.
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
          {/* Output Format Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900">Output format</h2>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-100">
              {[
                { id: "jpg", label: "JPG" },
                { id: "png", label: "PNG" },
                { id: "webp", label: "WebP" },
                { id: "avif", label: "AVIF" },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setOutputFormat(fmt.id as any)}
                  className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    outputFormat === fmt.id
                      ? "bg-white text-amber-500 shadow-xs border border-gray-100"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <FileImage size={14} />
                  <span className="text-[10px]">{fmt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rotate & Corners Controls Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-900">Rotate</h2>

            {/* Rotation Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-gray-600">
                <span>Rotation</span>
                <span className="text-amber-500">{rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Auto Detect and Reset Corners */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleAutoDetect}
                className="py-2.5 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Wand size={13} />
                Auto detect
              </button>
              <button
                onClick={handleResetCorners}
                className="py-2.5 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={13} />
                Reset corners
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 border border-gray-200 text-gray-500 hover:text-gray-800 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5"
            >
              Reset
            </button>
            <button className="flex-1 py-2.5 bg-gray-200 text-gray-400 text-xs font-bold rounded-xl cursor-not-allowed text-center transition-all">
              Flatten image
            </button>
          </div>
        </div>

        {/* Right Side Preview Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 min-h-[440px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-900">
                Flatten preview
              </h2>
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                Empty
              </span>
            </div>

            {/* Dropzone Container */}
            <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center flex-1 text-center my-1 border-dashed">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
                <ImageIcon size={28} />
              </div>
              <span className="text-xs font-bold text-gray-800 block">
                Add an image to get started
              </span>
              <span className="text-[10px] text-gray-400 mt-1">
                Drag the four corners onto the page edges, then flatten.
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
