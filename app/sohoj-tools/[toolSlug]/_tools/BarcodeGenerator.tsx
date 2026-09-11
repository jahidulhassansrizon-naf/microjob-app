"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Barcode,
  Star,
  Share2,
  ArrowLeft,
  RotateCcw,
  Download,
  Image as ImageIcon,
  CreditCard,
  Wand2,
  Tag,
  FileType,
} from "lucide-react";

export default function BarcodeGenerator() {
  const [barcodeType, setBarcodeType] = useState<
    "code128" | "code39" | "ean13" | "upc"
  >("code128");
  const [barcodeValue, setBarcodeValue] = useState<string>("");
  const [barColor, setBarColor] = useState<string>("#000000");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [barHeight, setBarHeight] = useState<number>(100);
  const [barWidth, setBarWidth] = useState<number>(2);
  const [margin, setMargin] = useState<number>(10);
  const [showText, setShowText] = useState<boolean>(true);
  const [downloadFormat, setDownloadFormat] = useState<"png" | "svg">("png");

  const handleReset = () => {
    setBarcodeType("code128");
    setBarcodeValue("");
    setBarColor("#000000");
    setBgColor("#ffffff");
    setBarHeight(100);
    setBarWidth(2);
    setMargin(10);
    setShowText(true);
    setDownloadFormat("png");
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
        <span className="font-semibold text-gray-900">Barcode Generator</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <Barcode size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">
                Barcode Generator
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Create CODE128, CODE39, EAN-13, and UPC barcodes — customize and
              download in your browser.
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
          {/* Barcode Data Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3.5">
            <h2 className="text-xs font-bold text-gray-900">Barcode data</h2>

            {/* Barcode Type Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 block">
                Barcode type
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-gray-50 rounded-xl border border-gray-100">
                {[
                  { id: "code128", sub: "Abc", label: "CODE128" },
                  { id: "code39", sub: "Aa", label: "CODE39" },
                  { id: "ean13", sub: "½ 3", label: "EAN-13" },
                  { id: "upc", sub: "", label: "UPC", icon: Tag },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setBarcodeType(type.id as any)}
                    className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      barcodeType === type.id
                        ? "bg-white text-amber-500 shadow-xs border border-gray-100"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {type.sub ? (
                      <span className="text-[10px] font-semibold">
                        {type.sub}
                      </span>
                    ) : (
                      <Tag size={12} />
                    )}
                    <span className="text-[9px] font-bold">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Barcode Value Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-600 block">
                Barcode value
              </label>
              <input
                type="text"
                placeholder="e.g. SKU-12345"
                value={barcodeValue}
                onChange={(e) => setBarcodeValue(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 transition-all placeholder:text-gray-300"
              />
              <span className="text-[9px] text-gray-400 block font-medium mt-1">
                Supports letters, numbers, and common symbols.
              </span>
            </div>
          </div>

          {/* Appearance Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-900">Appearance</h2>

            {/* Colors Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 block">
                  Bar color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={barColor}
                    onChange={(e) => setBarColor(e.target.value)}
                    className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={barColor}
                    onChange={(e) => setBarColor(e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500 uppercase text-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 block">
                  Background
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500 uppercase text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Bar Height Option Grid */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 block">
                Bar height
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[60, 80, 100, 120, 160].map((h) => (
                  <button
                    key={h}
                    onClick={() => setBarHeight(h)}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      barHeight === h
                        ? "border-amber-500 bg-amber-50/40 text-amber-500 font-bold shadow-2xs"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="w-2.5 bg-current rounded-xs"
                      style={{ height: `${Math.min(h / 8, 16)}px` }}
                    />
                    <span className="text-[9px]">{h}px</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bar Width Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-gray-600">
                <span>Bar width: {barWidth}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={barWidth}
                onChange={(e) => setBarWidth(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Margin Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-gray-600">
                <span>Margin: {margin}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Show text checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="showText"
                checked={showText}
                onChange={(e) => setShowText(e.target.checked)}
                className="w-4 h-4 text-amber-500 bg-white border-gray-300 rounded focus:ring-amber-500 accent-amber-500 cursor-pointer"
              />
              <label
                htmlFor="showText"
                className="text-[11px] font-bold text-gray-700 cursor-pointer"
              >
                Show text below barcode
              </label>
            </div>
          </div>

          {/* Download Format Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900">Download format</h2>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-100">
              <button
                onClick={() => setDownloadFormat("png")}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  downloadFormat === "png"
                    ? "bg-white text-amber-500 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <ImageIcon size={14} />
                PNG
              </button>
              <button
                onClick={() => setDownloadFormat("svg")}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  downloadFormat === "svg"
                    ? "bg-white text-amber-500 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <FileType size={14} />
                SVG
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Barcode Preview Panel */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex-1 flex flex-col justify-between min-h-[480px]">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-900">
                Barcode preview
              </h2>
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                Empty
              </span>
            </div>

            {/* Empty Dropzone Container */}
            <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center flex-1 text-center my-3 border-dashed">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
                <ImageIcon size={28} />
              </div>
              <span className="text-xs font-bold text-gray-800 block">
                Enter a value to get started
              </span>
              <span className="text-[10px] text-gray-400 mt-1">
                Your barcode preview will appear here after generation.
              </span>
            </div>
          </div>

          {/* Bottom Action / Status Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium pl-2">
              <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
              <span>Add an input to get started</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl transition-all"
              >
                Reset
              </button>
              <button
                disabled={!barcodeValue}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  barcodeValue
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Download size={13} />
                Download
              </button>
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
