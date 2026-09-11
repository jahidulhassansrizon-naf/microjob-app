"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Stamp,
  Star,
  Share2,
  ArrowLeft,
  RotateCcw,
  Image as ImageIcon,
  CreditCard,
  Wand2,
  Type,
  LayoutGrid,
} from "lucide-react";

export default function AddWatermark() {
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [watermarkText, setWatermarkText] =
    useState<string>("© Your Watermark");
  const [fontSize, setFontSize] = useState<number>(90);
  const [textColor, setTextColor] = useState<string>("#ffffff");

  const [position, setPosition] = useState<string>("center");
  const [opacity, setOpacity] = useState<number>(90);
  const [rotation, setRotation] = useState<number>(0);
  const [outline, setOutline] = useState<boolean>(false);
  const [tileAcrossImage, setTileAcrossImage] = useState<boolean>(false);

  const handleReset = () => {
    setWatermarkType("text");
    setWatermarkText("© Your Watermark");
    setFontSize(90);
    setTextColor("#ffffff");
    setPosition("center");
    setOpacity(90);
    setRotation(0);
    setOutline(false);
    setTileAcrossImage(false);
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
        <span className="font-semibold text-gray-900">Add Watermark</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <Stamp size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Add Watermark</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Add text or a logo watermark to your images — batch apply in your
              browser.
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
          {/* Watermark Type & Content Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3.5">
            <h2 className="text-xs font-bold text-gray-900">Watermark type</h2>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-100">
              <button
                onClick={() => setWatermarkType("text")}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  watermarkType === "text"
                    ? "bg-white text-amber-500 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Type size={14} />
                Text
              </button>
              <button
                onClick={() => setWatermarkType("image")}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  watermarkType === "image"
                    ? "bg-white text-amber-500 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <ImageIcon size={14} />
                Image / logo
              </button>
            </div>

            {watermarkType === "text" && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 block">
                    Watermark text
                  </label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 transition-all"
                  />
                  <span className="text-[9px] text-gray-400 block font-medium">
                    Applied to every image. Bengali and Latin text are
                    supported.
                  </span>
                </div>

                {/* Font Size Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-gray-600">
                    <span>Font size: {fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Text Color Picker */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 block">
                    Text color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 uppercase"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Style Controls Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3.5">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-900">Style</h2>
              <button
                onClick={handleReset}
                className="text-[10px] font-bold text-amber-500 hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Position Controls */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 block">
                Position
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "center", label: "Center", icon: LayoutGrid },
                  { id: "top-left", label: "Top left", icon: LayoutGrid },
                  { id: "top-right", label: "Top right", icon: LayoutGrid },
                  { id: "bottom-left", label: "Bottom left", icon: LayoutGrid },
                  {
                    id: "bottom-right",
                    label: "Bottom right",
                    icon: LayoutGrid,
                  },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => setPosition(pos.id)}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      position === pos.id
                        ? "border-amber-500 bg-amber-50/40 text-amber-500 font-bold shadow-2xs"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="w-3.5 h-3.5 border border-current rounded-xs flex items-center justify-center text-[7px]" />
                    <span className="text-[9px]">{pos.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-gray-600">
                <span>Opacity: {opacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Rotation Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-gray-600">
                <span>Rotation: {rotation}°</span>
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

            {/* Outline Switch */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-gray-700">
                Outline
              </span>
              <button
                type="button"
                onClick={() => setOutline(!outline)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  outline ? "bg-amber-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    outline ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Tile Switch */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[11px] font-bold text-gray-700 block">
                  Tile across image
                </span>
                <span className="text-[9px] text-gray-400 block font-medium">
                  Repeat the watermark over the whole image
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTileAcrossImage(!tileAcrossImage)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  tileAcrossImage ? "bg-amber-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    tileAcrossImage ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
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
              Add watermark
            </button>
          </div>
        </div>

        {/* Right Side Preview Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 min-h-[520px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-900">
                Watermark preview
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
                Add images to get started
              </span>
              <span className="text-[10px] text-gray-400 mt-1">
                Configure your watermark — live preview updates as you change
                settings.
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
