"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FileSignature,
  Star,
  Share2,
  ArrowLeft,
  Download,
  Image as ImageIcon,
  CreditCard,
  Wand2,
  PenTool,
} from "lucide-react";

interface FontOption {
  name: string;
  family: string;
  category?: string;
}

const FONTS: FontOption[] = [
  { name: "Dancing Script", family: "'Dancing Script', cursive" },
  { name: "Great Vibes", family: "'Great Vibes', cursive" },
  { name: "Allura", family: "'Allura', cursive" },
  { name: "Sacramento", family: "'Sacramento', cursive" },
  { name: "Caveat", family: "'Caveat', cursive" },
  { name: "Galada (Bengali)", family: "'Galada', cursive" },
  { name: "Tiro Bangla (Bengali)", family: "'Tiro Bangla', serif" },
];

export default function TextSignatureGenerator() {
  const [text, setText] = useState<string>("");
  const [selectedFont, setSelectedFont] = useState<FontOption>(FONTS[0]);
  const [fontSize, setFontSize] = useState<number>(64);
  const [inkColor, setInkColor] = useState<string>("#000000");
  const [bgType, setBgType] = useState<"transparent" | "white">("transparent");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamically load Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Allura&family=Caveat:wght@600&family=Dancing+Script:wght@600&family=Galada&family=Great+Vibes&family=Sacramento&family=Tiro+Bangla:italic&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // Draw signature on canvas whenever parameters change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, rect.width, rect.height);

    if (text.trim()) {
      ctx.font = `${fontSize}px ${selectedFont.family}`;
      ctx.fillStyle = inkColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, rect.width / 2, rect.height / 2);
    }
  }, [text, selectedFont, fontSize, inkColor]);

  const handleReset = () => {
    setText("");
    setSelectedFont(FONTS[0]);
    setFontSize(64);
    setInkColor("#000000");
    setBgType("transparent");
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) return;

    if (bgType === "white") {
      tempCtx.fillStyle = "#FFFFFF";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    tempCtx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `signature-${text.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
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
        <span className="font-semibold text-gray-900">
          Text Signature Generator
        </span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <FileSignature size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">
                Text Signature Generator
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Turn your name into a handwritten-style signature — preview live
              and download PNG in your browser.
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
          {/* Signature Text Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2.5">
            <h2 className="text-xs font-bold text-gray-900">Signature text</h2>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-600 block">
                Your name
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 50))}
                placeholder="e.g. Akash Rahman"
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 transition-all font-medium text-gray-800"
              />
              <span className="text-[10px] text-gray-400 block pt-0.5">
                {text.length} / 50 characters
              </span>
            </div>
          </div>

          {/* Signature Font Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900">Signature font</h2>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map((font) => (
                <button
                  key={font.name}
                  onClick={() => setSelectedFont(font)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-center min-h-[48px] ${
                    selectedFont.name === font.name
                      ? "border-amber-500 bg-amber-50/30 text-amber-600 font-bold shadow-2xs"
                      : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200"
                  }`}
                >
                  <span
                    className="text-base truncate"
                    style={{ fontFamily: font.family }}
                  >
                    {font.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Style Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-900">Style</h2>

            {/* Font Size Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 block">
                Font size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { size: 48, label: "48px" },
                  { size: 64, label: "64px" },
                  { size: 80, label: "80px" },
                  { size: 96, label: "96px" },
                ].map((item) => (
                  <button
                    key={item.size}
                    onClick={() => setFontSize(item.size)}
                    className={`py-2 text-center rounded-xl border transition-all ${
                      fontSize === item.size
                        ? "border-amber-500 bg-amber-50/40 text-amber-500 font-bold"
                        : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                    }`}
                  >
                    <span className="text-[10px] block font-semibold">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ink Color Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 block">
                Ink color
              </label>
              <div className="flex items-center gap-2">
                {[
                  { color: "#000000", label: "Black" },
                  { color: "#1D4ED8", label: "Blue" },
                  { color: "#334155", label: "Dark Slate" },
                ].map((item) => (
                  <button
                    key={item.color}
                    onClick={() => setInkColor(item.color)}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      inkColor === item.color
                        ? "ring-2 ring-amber-500 ring-offset-2 scale-105"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: item.color }}
                  />
                ))}
                <div className="relative w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 hover:bg-gray-100">
                  <input
                    type="color"
                    value={inkColor}
                    onChange={(e) => setInkColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <PenTool size={14} className="text-gray-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Download Background Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900">
              Download background
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBgType("transparent")}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  bgType === "transparent"
                    ? "border-amber-500 bg-white text-amber-500 shadow-2xs"
                    : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                }`}
              >
                <div className="w-3.5 h-3.5 border border-dashed border-current rounded-xs" />
                Transparent
              </button>
              <button
                onClick={() => setBgType("white")}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  bgType === "white"
                    ? "border-amber-500 bg-white text-amber-500 shadow-2xs"
                    : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                }`}
              >
                <div className="w-3.5 h-3.5 bg-white border border-gray-400 rounded-xs" />
                White
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Live Preview Panel */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex-1 flex flex-col justify-between min-h-[460px]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-bold text-gray-900">Live preview</h2>
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                {text.trim() ? "Ready" : "Empty"}
              </span>
            </div>

            {/* Checkerboard Preview Area */}
            <div
              className="relative flex-1 rounded-2xl border border-gray-200 overflow-hidden min-h-[360px] flex items-center justify-center select-none"
              style={{
                backgroundImage:
                  bgType === "transparent"
                    ? "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)"
                    : "none",
                backgroundColor: bgType === "white" ? "#ffffff" : "transparent",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
              }}
            >
              {!text.trim() ? (
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-3 border border-amber-100">
                    <ImageIcon size={24} />
                  </div>
                  <span className="text-xs font-bold text-gray-800 block">
                    Enter your name to preview
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1 font-medium">
                    Your signature preview will update as you type.
                  </span>
                </div>
              ) : (
                <canvas ref={canvasRef} className="w-full h-full block" />
              )}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium pl-2">
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  text.trim() ? "bg-emerald-500" : "bg-gray-300"
                }`}
              />
              <span>
                {text.trim()
                  ? "Signature ready"
                  : "Add an input to get started"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl transition-all"
              >
                Reset
              </button>
              <button
                onClick={handleDownload}
                disabled={!text.trim()}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  text.trim()
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Download size={13} />
                Download signature
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
