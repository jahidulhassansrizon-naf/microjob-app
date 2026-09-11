"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  PenTool,
  Star,
  Share2,
  ArrowLeft,
  QrCode,
  Eraser,
  Download,
  Image as ImageIcon,
  CreditCard,
  Wand2,
  Minus,
} from "lucide-react";

export default function DigitalSignaturePad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);
  const [penColor, setPenColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(3); // 2: Thin, 3: Medium, 5: Thick
  const [bgType, setBgType] = useState<"transparent" | "white">("transparent");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(2, 2);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);

    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

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
    link.download = `signature-${Date.now()}.png`;
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
          Digital Signature Pad
        </span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <PenTool size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">
                Digital Signature Pad
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Draw your signature with mouse or touch — or scan a QR code to
              sign on your phone.
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
          {/* Signature Pad Actions Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900">Signature pad</h2>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-gray-600 block">
                Actions
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-3 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-indigo-600 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1">
                  <QrCode size={16} />
                  Sign on phone
                </button>
                <button
                  onClick={handleClear}
                  className="py-3 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-500 hover:text-gray-800 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1"
                >
                  <Eraser size={16} />
                  Clear signature
                </button>
              </div>
            </div>
          </div>

          {/* Pen Settings Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-900">Pen settings</h2>

            {/* Color Selection Swatches */}
            <div className="flex items-center gap-2">
              {[
                { color: "#000000", label: "Black" },
                { color: "#1D4ED8", label: "Blue" },
                { color: "#334155", label: "Dark Slate" },
              ].map((item) => (
                <button
                  key={item.color}
                  onClick={() => setPenColor(item.color)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    penColor === item.color
                      ? "ring-2 ring-amber-500 ring-offset-2 scale-105"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: item.color }}
                />
              ))}
              <div className="relative w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 hover:bg-gray-100">
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <PenTool size={14} className="text-gray-500" />
              </div>
            </div>

            {/* Stroke Thickness Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 block">
                Stroke thickness
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { width: 2, label: "Thin", iconHeight: "h-0.5" },
                  { width: 3, label: "Medium", iconHeight: "h-1" },
                  { width: 5, label: "Thick", iconHeight: "h-1.5" },
                ].map((stroke) => (
                  <button
                    key={stroke.width}
                    onClick={() => setStrokeWidth(stroke.width)}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                      strokeWidth === stroke.width
                        ? "border-amber-500 bg-amber-50/40 text-amber-500 font-bold"
                        : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-5 ${stroke.iconHeight} bg-current rounded-full`}
                    />
                    <span className="text-[10px]">{stroke.label}</span>
                  </button>
                ))}
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
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed pt-1">
              The pad shows a checkerboard for transparency preview. Your
              download uses the option above.
            </p>
          </div>
        </div>

        {/* Right Side Signature Canvas Panel */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex-1 flex flex-col justify-between min-h-[460px]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-bold text-gray-900">Draw here</h2>
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                {hasSignature ? "Signed" : "Empty"}
              </span>
            </div>

            {/* Interactive Canvas Area */}
            <div
              className="relative flex-1 rounded-2xl border border-gray-200 overflow-hidden min-h-[360px] flex items-center justify-center cursor-crosshair select-none"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
              }}
            >
              {!hasSignature && (
                <span className="absolute text-xs text-gray-400 pointer-events-none font-medium">
                  Draw your signature here
                </span>
              )}
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full touch-none block"
              />
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium pl-2">
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  hasSignature ? "bg-emerald-500" : "bg-gray-300"
                }`}
              />
              <span>
                {hasSignature
                  ? "Signature ready"
                  : "Add an input to get started"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl transition-all"
              >
                Reset
              </button>
              <button
                onClick={handleDownload}
                disabled={!hasSignature}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  hasSignature
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
