"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Star,
  Share2,
  ArrowLeft,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Printer,
  Upload,
  Image as ImageIcon,
  CreditCard,
  Wand2,
} from "lucide-react";

export default function PassportToPdf() {
  const [orientation, setOrientation] = useState<
    "auto" | "portrait" | "landscape"
  >("auto");
  const [layout, setLayout] = useState<"stacked" | "side-by-side">("stacked");
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<"top" | "center" | "bottom">("top");
  const [copies, setCopies] = useState<number>(1);
  const [roundedCorners, setRoundedCorners] = useState(false);

  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [sharpening, setSharpening] = useState<number>(50);

  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);

  const handleFrontImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFrontImage(e.target.files[0]);
    }
  };

  const handleBackImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBackImage(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setFrontImage(null);
    setBackImage(null);
    setBrightness(100);
    setContrast(100);
    setSharpening(50);
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
        <span className="font-semibold text-gray-900">Passport to PDF</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">
                Passport to PDF
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Turn passport front and back page photos into a clean A4 PDF —
              ICAO 88×125 mm layout, all in your browser.
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
        {/* Left Side: Settings Panel */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4 max-h-[750px] overflow-y-auto">
          <h2 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
            Settings
          </h2>

          {/* Page settings */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-gray-600">
              <span>Page settings</span>
              <span className="text-gray-400 text-[10px]">Page</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button
                onClick={() => setOrientation("auto")}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all flex justify-center items-center ${
                  orientation === "auto"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Auto
              </button>
              <button
                onClick={() => setOrientation("portrait")}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all flex justify-center items-center ${
                  orientation === "portrait"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <div className="w-3 h-4 border-2 border-current rounded-xs" />
              </button>
              <button
                onClick={() => setOrientation("landscape")}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all flex justify-center items-center ${
                  orientation === "landscape"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <div className="w-4 h-3 border-2 border-current rounded-xs" />
              </button>
            </div>
          </div>

          {/* Layout */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-gray-600">
              <span>Layout</span>
              <button className="text-[10px] text-amber-600 font-bold hover:underline flex items-center gap-0.5">
                Switch
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button
                onClick={() => setLayout("side-by-side")}
                className={`py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-1 transition-all ${
                  layout === "side-by-side"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <div className="flex gap-0.5">
                  <div className="w-3 h-4 bg-amber-500 rounded-xs" />
                  <div className="w-3 h-4 bg-amber-500 rounded-xs" />
                </div>
              </button>
              <button
                onClick={() => setLayout("stacked")}
                className={`py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-1 transition-all ${
                  layout === "stacked"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="w-5 h-2 bg-amber-500 rounded-xs" />
                  <div className="w-5 h-2 bg-amber-500 rounded-xs" />
                </div>
              </button>
            </div>
          </div>

          {/* Rotate */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-gray-600">
              <span>Rotate</span>
              <button
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="text-[10px] text-amber-600 font-bold flex items-center gap-1 hover:underline"
              >
                <RotateCw size={10} /> Rotate 90°
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 text-xs font-bold text-gray-600">
              {[0, 90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  onClick={() => setRotation(deg)}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    rotation === deg
                      ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                      : "hover:bg-white/50"
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400">
              Both pages rotate together.
            </p>
          </div>

          {/* Position on page */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-600 block">
              Position on page
            </span>
            <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100 text-xs font-bold text-gray-600">
              <button
                onClick={() => setPosition("top")}
                className={`py-1.5 rounded-lg transition-all ${
                  position === "top"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "hover:bg-white/50"
                }`}
              >
                Top
              </button>
              <button
                onClick={() => setPosition("center")}
                className={`py-1.5 rounded-lg transition-all ${
                  position === "center"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "hover:bg-white/50"
                }`}
              >
                Center
              </button>
              <button
                onClick={() => setPosition("bottom")}
                className={`py-1.5 rounded-lg transition-all ${
                  position === "bottom"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "hover:bg-white/50"
                }`}
              >
                Bottom
              </button>
            </div>
          </div>

          {/* Copies */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-600 block">
              Copies
            </span>
            <div className="grid grid-cols-2 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100 text-xs font-bold text-gray-600">
              {[1, 2].map((num) => (
                <button
                  key={num}
                  onClick={() => setCopies(num)}
                  className={`py-1.5 rounded-lg transition-all ${
                    copies === num
                      ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                      : "hover:bg-white/50"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400">
              A turned passport page fits one copy per sheet.
            </p>
          </div>

          {/* Rounded corners */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-bold text-gray-700 block">
                Rounded corners (14px)
              </span>
              <span className="text-[10px] text-gray-400 block">
                14px round corners on page images
              </span>
            </div>
            <button
              onClick={() => setRoundedCorners(!roundedCorners)}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                roundedCorners
                  ? "bg-amber-500 justify-end"
                  : "bg-gray-300 justify-start"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Adjustments */}
          <div className="space-y-3 border-t border-gray-100 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-800">
                Adjustments
              </span>
              <button
                onClick={() => {
                  setBrightness(100);
                  setContrast(100);
                  setSharpening(50);
                }}
                className="text-[10px] text-amber-600 font-bold hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Brightness */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-gray-600">
                <span>Brightness {brightness}%</span>
                <span className="bg-amber-100 text-amber-700 px-1 rounded">
                  {brightness}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-gray-600">
                <span>Contrast {contrast}%</span>
                <span className="bg-amber-100 text-amber-700 px-1 rounded">
                  {contrast}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Sharpening */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-gray-600">
                <span>Sharpening {sharpening}</span>
                <span className="bg-amber-100 text-amber-700 px-1 rounded">
                  {sharpening}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sharpening}
                onChange={(e) => setSharpening(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Bottom Summary Bar in Controls */}
          <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-[11px] font-bold text-gray-500">
            <span>1 page - A4</span>
            <span>{copies} copy</span>
          </div>

          <button className="w-full py-2.5 border border-amber-500 text-amber-600 text-xs font-bold rounded-xl hover:bg-amber-50 transition-all flex items-center justify-center gap-1.5">
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>

        {/* Right Side: Live A4 Preview Canvas */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-gray-800">Live preview</h2>
              <span className="text-[10px] text-gray-400 font-medium">
                A4 — 794×1122 px
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 font-bold">
              <span>100%</span>
              <button className="hover:text-gray-800">
                <ZoomIn size={14} />
              </button>
              <button className="hover:text-gray-800">
                <RotateCw size={14} />
              </button>
              <button className="hover:text-gray-800">
                <ZoomOut size={14} />
              </button>
              <button className="hover:text-gray-800">
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {/* Canvas Sheet */}
          <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-6 my-4 flex-1 flex justify-center items-start min-h-[580px] overflow-auto">
            <div className="bg-white shadow-md border border-gray-200 w-[480px] min-h-[660px] p-6 flex flex-col items-center justify-start gap-6">
              {/* Stacked Layout Boxes */}
              <div
                className={`w-full flex ${layout === "stacked" ? "flex-col" : "flex-row"} gap-4 items-center justify-center`}
              >
                {/* Front Passport Page Upload Box */}
                <label className="w-full border-2 border-dashed border-amber-300 bg-amber-50/30 hover:bg-amber-50/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all">
                  {frontImage ? (
                    <div className="text-xs font-bold text-emerald-600 flex flex-col items-center gap-1">
                      <BookOpen size={28} />
                      <span className="truncate max-w-[150px]">
                        {frontImage.name}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-2">
                        <Upload size={18} />
                      </div>
                      <span className="text-xs font-bold text-gray-800">
                        Front passport page
                      </span>
                      <span className="text-[9px] text-gray-400 mt-0.5">
                        Upload front page photo
                      </span>
                      <span className="text-[8px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded mt-2">
                        JPG • PNG • HEIC
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFrontImage}
                    className="hidden"
                  />
                </label>

                {/* Back Passport Page Upload Box */}
                <label className="w-full border-2 border-dashed border-amber-300 bg-amber-50/30 hover:bg-amber-50/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all">
                  {backImage ? (
                    <div className="text-xs font-bold text-emerald-600 flex flex-col items-center gap-1">
                      <BookOpen size={28} />
                      <span className="truncate max-w-[150px]">
                        {backImage.name}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-2">
                        <Upload size={18} />
                      </div>
                      <span className="text-xs font-bold text-gray-800">
                        Back passport page
                      </span>
                      <span className="text-[9px] text-gray-400 mt-0.5">
                        Upload back page photo
                      </span>
                      <span className="text-[8px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded mt-2">
                        JPG • PNG • HEIC
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackImage}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Controls Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span>Upload front and back page photos</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all"
          >
            Reset
          </button>
          <button
            disabled={!frontImage && !backImage}
            className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              frontImage || backImage
                ? "bg-amber-500 text-white shadow-xs hover:bg-amber-600"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <span>Create PDF</span>
          </button>
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
