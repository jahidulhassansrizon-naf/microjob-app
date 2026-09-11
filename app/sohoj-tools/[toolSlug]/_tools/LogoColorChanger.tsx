"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Palette,
  Star,
  Share2,
  ArrowLeft,
  Upload,
  Download,
  Image as ImageIcon,
  CreditCard,
  Wand2,
  Sparkles,
  PaintBucket,
  RefreshCw,
  Pipette,
} from "lucide-react";

type RecolorMode = "smart" | "fill" | "replace";

export default function LogoColorChanger() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [recolorMode, setRecolorMode] = useState<RecolorMode>("smart");
  const [newColor, setNewColor] = useState<string>("#F59E0B");
  const [hasImage, setHasImage] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Apply color transformation whenever image, mode, or color changes
  useEffect(() => {
    if (!selectedImage) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = selectedImage;
    img.onload = () => {
      imageRef.current = img;
      renderRecoloredImage();
    };
  }, [selectedImage, recolorMode, newColor]);

  const renderRecoloredImage = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (recolorMode === "smart") {
      // Preserve original brightness/alpha gradient while changing hue
      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = newColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = "source-over";
    } else if (recolorMode === "fill") {
      // Solid fill over non-transparent pixels
      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = newColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
    } else {
      // Full pixel recolor keeping original alpha mask
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Convert hex to RGB
      const hex = newColor.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 10) {
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setHasImage(true);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setHasImage(false);
    setRecolorMode("smart");
    setNewColor("#F59E0B");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasImage) return;

    const link = document.createElement("a");
    link.download = `recolored-logo-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
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
        <span className="font-semibold text-gray-900">Logo Color Changer</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <Palette size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">
                Logo Color Changer
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Change logo or icon colors instantly — adjust solid colors,
              replace tints, or recolor transparent PNGs in your browser.
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
            {/* Recolor Mode Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
              <h2 className="text-xs font-bold text-gray-900">Recolor Mode</h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: "smart",
                    label: "Smart",
                    icon: Sparkles,
                  },
                  {
                    id: "fill",
                    label: "Solid",
                    icon: PaintBucket,
                  },
                  {
                    id: "replace",
                    label: "Replace",
                    icon: RefreshCw,
                  },
                ].map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setRecolorMode(mode.id as RecolorMode)}
                      className={`py-3 px-2 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                        recolorMode === mode.id
                          ? "border-amber-500 bg-amber-50/40 text-amber-500 shadow-2xs"
                          : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                      }`}
                    >
                      <Icon size={16} />
                      {mode.label}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-gray-400 font-medium pt-1">
                {recolorMode === "smart" &&
                  "Smart mode blends the new color while retaining logo highlights and shadows."}
                {recolorMode === "fill" &&
                  "Solid mode replaces all non-transparent areas with a flat color fill."}
                {recolorMode === "replace" &&
                  "Replace mode recalculates alpha channels for uniform color coverage."}
              </p>
            </div>

            {/* New Color Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
              <h2 className="text-xs font-bold text-gray-900">New Color</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  "#F59E0B",
                  "#3B82F6",
                  "#10B981",
                  "#EF4444",
                  "#8B5CF6",
                  "#000000",
                  "#FFFFFF",
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={`w-8 h-8 rounded-lg border border-black/10 transition-all ${
                      newColor === color
                        ? "ring-2 ring-amber-500 ring-offset-2 scale-105"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}

                {/* Custom Color Picker */}
                <div className="relative w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 hover:bg-gray-100 cursor-pointer">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Pipette size={14} className="text-gray-500" />
                </div>
              </div>
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
              onClick={handleDownload}
              disabled={!hasImage}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                hasImage
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Download size={14} />
              Download Logo
            </button>
          </div>
        </div>

        {/* Right Side Preview Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 min-h-[440px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-900">Preview</h2>
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                {hasImage ? "Loaded" : "Empty"}
              </span>
            </div>

            {/* Canvas / Dropzone Area */}
            {!hasImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center flex-1 text-center my-1 border-dashed cursor-pointer hover:bg-gray-100/50 transition-all min-h-[360px]"
              >
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
                  <ImageIcon size={28} />
                </div>
                <span className="text-xs font-bold text-gray-800 block">
                  Upload a logo to recolor
                </span>
                <span className="text-[10px] text-gray-400 mt-1">
                  Supports PNG, SVG, JPG, and WebP formats.
                </span>
                <span className="text-[10px] text-gray-400 mt-4 font-medium">
                  Or press Ctrl+V to paste a copied image
                </span>
              </div>
            ) : (
              <div
                className="relative flex-1 rounded-2xl border border-gray-200 overflow-hidden flex items-center justify-center min-h-[360px] p-6"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="max-h-[360px] max-w-full object-contain drop-shadow-xs"
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
