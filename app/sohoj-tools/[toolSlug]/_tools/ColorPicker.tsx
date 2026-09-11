"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Pipette,
  Palette,
  Star,
  Share2,
  ArrowLeft,
  Upload,
  Copy,
  Check,
  Image as ImageIcon,
  CreditCard,
  Wand2,
  RotateCcw,
} from "lucide-react";

interface ColorData {
  hex: string;
  rgb: string;
  hsl: string;
}

export default function ColorPicker() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<ColorData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setSelectedImage(null);
    setPickedColor(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="w-full space-y-5 text-gray-800 font-sans">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

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
        <span className="font-semibold text-gray-900">Color Picker</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <Palette size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Color Picker</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Pick any color from an image — get HEX, RGB, and HSL codes
              instantly in your browser.
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
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Picked Color Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3 min-h-[140px]">
              <h2 className="text-xs font-bold text-gray-900">Picked color</h2>

              {!pickedColor ? (
                <p className="text-xs text-gray-400 font-medium pt-1">
                  Upload an image to start picking colors.
                </p>
              ) : (
                <div className="space-y-3 pt-1">
                  {/* Color Preview & HEX */}
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <div
                      className="w-10 h-10 rounded-lg shadow-inner border border-black/10"
                      style={{ backgroundColor: pickedColor.hex }}
                    />
                    <div className="flex-1">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">
                        HEX
                      </span>
                      <span className="text-xs font-bold text-gray-800">
                        {pickedColor.hex}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(pickedColor.hex, "hex")}
                      className="p-2 text-gray-500 hover:text-amber-500 transition-colors"
                    >
                      {copiedField === "hex" ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>

                  {/* RGB */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">
                        RGB
                      </span>
                      <span className="text-xs font-bold text-gray-800">
                        {pickedColor.rgb}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(pickedColor.rgb, "rgb")}
                      className="p-2 text-gray-500 hover:text-amber-500 transition-colors"
                    >
                      {copiedField === "rgb" ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>

                  {/* HSL */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">
                        HSL
                      </span>
                      <span className="text-xs font-bold text-gray-800">
                        {pickedColor.hsl}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(pickedColor.hsl, "hsl")}
                      className="p-2 text-gray-500 hover:text-amber-500 transition-colors"
                    >
                      {copiedField === "hsl" ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl transition-all"
            >
              Reset
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Upload size={14} />
              Upload image
            </button>
          </div>
        </div>

        {/* Right Side Preview Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 min-h-[440px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-900">Image</h2>
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                {selectedImage ? "Loaded" : "Empty"}
              </span>
            </div>

            {/* Canvas / Dropzone Area */}
            {!selectedImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center flex-1 text-center my-1 border-dashed cursor-pointer hover:bg-gray-100/50 transition-all"
              >
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
                  <ImageIcon size={28} />
                </div>
                <span className="text-xs font-bold text-gray-800 block">
                  No image yet
                </span>
                <span className="text-[10px] text-gray-400 mt-1">
                  Upload an image, then click any spot to grab its color.
                </span>
                <span className="text-[10px] text-gray-400 mt-4 font-medium">
                  Or press Ctrl+V to paste a copied image
                </span>
              </div>
            ) : (
              <div className="relative flex-1 bg-gray-900/5 rounded-2xl overflow-hidden flex items-center justify-center min-h-[360px] p-4">
                <img
                  src={selectedImage}
                  alt="Color picker preview"
                  className="max-h-[380px] max-w-full object-contain cursor-crosshair rounded-lg"
                />
              </div>
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
