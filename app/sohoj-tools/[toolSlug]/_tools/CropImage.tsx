"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Crop,
  Star,
  Share2,
  ArrowLeft,
  RotateCcw,
  Image as ImageIcon,
  CreditCard,
  Wand2,
} from "lucide-react";

export default function CropImage() {
  const [aspectRatio, setAspectRatio] = useState<string>("free");
  const [outputFormat, setOutputFormat] = useState<string>("JPG");

  const handleReset = () => {
    setAspectRatio("free");
    setOutputFormat("JPG");
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
        <span className="font-semibold text-gray-900">Crop Image</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center shrink-0 border border-sky-100">
            <Crop size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Crop Image</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Trim images to the area you need — free or fixed aspect ratios,
              all in your browser.
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
          {/* Aspect Ratio Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900">Aspect ratio</h2>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: "Free", value: "free" },
                { label: "1:1", value: "1:1" },
                { label: "4:3", value: "4:3" },
                { label: "16:9", value: "16:9" },
                { label: "3:2", value: "3:2" },
              ].map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => setAspectRatio(ratio.value)}
                  className={`py-2.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    aspectRatio === ratio.value
                      ? "border-sky-500 bg-sky-50/40 text-sky-600 font-bold shadow-2xs"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <div className="w-4 h-4 border border-current rounded-xs flex items-center justify-center text-[8px]">
                    {ratio.value === "free" ? "..." : ratio.label.charAt(0)}
                  </div>
                  <span className="text-[10px]">{ratio.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Output Format Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900">Output format</h2>
            <div className="grid grid-cols-4 gap-2">
              {["JPG", "PNG", "WebP", "AVIF"].map((format) => (
                <button
                  key={format}
                  onClick={() => setOutputFormat(format)}
                  className={`py-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    outputFormat === format
                      ? "border-sky-500 bg-sky-50/40 text-sky-600 font-bold shadow-2xs"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-[10px] font-bold">{format}</span>
                </button>
              ))}
            </div>
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
              Crop images
            </button>
          </div>
        </div>

        {/* Right Side Crop Preview Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 min-h-[420px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-900">Crop preview</h2>
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                Empty
              </span>
            </div>

            {/* Empty Upload Dropzone */}
            <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center flex-1 text-center my-1 border-dashed">
              <div className="w-14 h-14 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center mb-3">
                <ImageIcon size={28} />
              </div>
              <span className="text-xs font-bold text-gray-800 block">
                Add an image to get started
              </span>
              <span className="text-[10px] text-gray-400 mt-1">
                Drag the crop handles to select the area you want to keep.
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
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-sky-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center shrink-0">
              <ImageIcon size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-sky-500 transition-colors">
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
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-sky-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center shrink-0">
              <CreditCard size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-sky-500 transition-colors">
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
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-sky-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center shrink-0">
              <Wand2 size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-sky-500 transition-colors">
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
