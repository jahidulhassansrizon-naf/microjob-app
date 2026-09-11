"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Star,
  Share2,
  ArrowLeft,
  SlidersHorizontal,
  Target,
  Feather,
  Scale,
  Zap,
  Globe,
  FileType,
  CreditCard,
  Wand2,
  BookOpen,
} from "lucide-react";

export default function ImageSizeReducer() {
  const [compressionSetting, setCompressionSetting] = useState<
    "preset" | "target"
  >("preset");
  const [compressionLevel, setCompressionLevel] = useState<
    "light" | "balanced" | "strong"
  >("balanced");
  const [outputFormat, setOutputFormat] = useState<
    "current" | "webp" | "jpg" | "png"
  >("current");

  return (
    <div className="w-full space-y-5 text-gray-800 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link
          href="/sohoj-tools"
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Tools</span>
        </Link>
        <span>/</span>
        <span>Image Tools</span>
        <span>/</span>
        <span className="font-semibold text-gray-900">Image Size Reducer</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <ImageIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">
                Image Size Reducer
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Shrink JPG, PNG, and WebP photos in your browser — quality stays
              sharp.
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
        {/* Left Side: Controls Box */}
        <div className="lg:col-span-4 space-y-4">
          {/* Compression Settings Card */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <label className="text-xs font-bold text-gray-700 block">
              Compression settings
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50/80 p-1 rounded-xl border border-gray-100">
              <button
                onClick={() => setCompressionSetting("preset")}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  compressionSetting === "preset"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Quality preset</span>
              </button>
              <button
                onClick={() => setCompressionSetting("target")}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  compressionSetting === "target"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Target size={14} />
                <span>Target file size</span>
              </button>
            </div>
          </div>

          {/* Compression Level Card */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <label className="text-xs font-bold text-gray-700 block">
              Compression level
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-100">
              <button
                onClick={() => setCompressionLevel("light")}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  compressionLevel === "light"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Feather size={14} />
                <span className="text-center">Light compression</span>
              </button>
              <button
                onClick={() => setCompressionLevel("balanced")}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  compressionLevel === "balanced"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Scale size={14} />
                <span>Balanced</span>
              </button>
              <button
                onClick={() => setCompressionLevel("strong")}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  compressionLevel === "strong"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Zap size={14} />
                <span className="text-center">Strong compression</span>
              </button>
            </div>
          </div>

          {/* Output Format Card */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <label className="text-xs font-bold text-gray-700 block">
              Output format
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-100">
              <button
                onClick={() => setOutputFormat("current")}
                className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  outputFormat === "current"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Current</span>
              </button>
              <button
                onClick={() => setOutputFormat("webp")}
                className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  outputFormat === "webp"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Globe size={14} />
                <span>WebP</span>
              </button>
              <button
                onClick={() => setOutputFormat("jpg")}
                className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  outputFormat === "jpg"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <FileType size={14} />
                <span>JPG</span>
              </button>
              <button
                onClick={() => setOutputFormat("png")}
                className={`py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  outputFormat === "png"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <ImageIcon size={14} />
                <span>PNG</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-2">
            <button className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all">
              Reset
            </button>
            <button
              disabled
              className="px-5 py-2 text-xs font-bold rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed transition-all"
            >
              Compress images
            </button>
          </div>
        </div>

        {/* Right Side: Compression Preview Box */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[420px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-700">
              Compression preview
            </h2>
            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Empty
            </span>
          </div>

          {/* Empty State */}
          <div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
            <div className="w-10 h-10 bg-amber-50 text-amber-400 rounded-xl flex items-center justify-center mb-3 border border-amber-100">
              <ImageIcon size={20} />
            </div>
            <p className="text-xs font-bold text-gray-800">
              Add an image to get started
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Before and after previews will appear here after processing.
            </p>
            <p className="text-[10px] text-gray-400 mt-3 font-medium">
              Or press Ctrl+V to paste a copied image
            </p>
          </div>

          <div />
        </div>
      </div>

      {/* Tools in the same category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-gray-900">
          Tools in the same category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
