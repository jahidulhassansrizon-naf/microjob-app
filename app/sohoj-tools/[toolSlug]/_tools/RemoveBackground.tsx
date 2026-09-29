"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Star,
  Share2,
  ArrowLeft,
  Image as ImageIcon,
  Palette,
  CreditCard,
  BookOpen,
  Download,
  Layers,
  RefreshCw,
} from "lucide-react";

export default function RemoveBackground() {
  const [bgType, setBgType] = useState<"transparent" | "solid" | "photo">(
    "transparent",
  );
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs keep the latest object URLs so the paste listener (registered once)
  // and the unmount cleanup never work with stale values.
  const previewUrlRef = useRef<string | null>(null);
  const processedUrlRef = useRef<string | null>(null);
  // Incremented on every new file / reset so an in-flight job can be ignored.
  const jobIdRef = useRef(0);

  const revokeUrls = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (processedUrlRef.current) {
      URL.revokeObjectURL(processedUrlRef.current);
      processedUrlRef.current = null;
    }
  }, []);

  const handleNewFile = useCallback(
    (file: File) => {
      jobIdRef.current += 1;
      revokeUrls();

      const newPreviewUrl = URL.createObjectURL(file);
      previewUrlRef.current = newPreviewUrl;

      setImageFile(file);
      setPreviewUrl(newPreviewUrl);
      setProcessedUrl(null);
      setIsProcessing(false);
      setProgress(null);
      setErrorMessage(null);
    },
    [revokeUrls],
  );

  // Ctrl+V দিয়ে ইমেজ পেস্ট হ্যান্ডলার
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleNewFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleNewFile]);

  // কম্পোনেন্ট আনমাউন্ট হলে মেমোরি ক্লিনআপ
  useEffect(() => {
    return () => {
      jobIdRef.current += 1;
      revokeUrls();
    };
  }, [revokeUrls]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleNewFile(e.target.files[0]);
    }
    // একই ফাইল আবার সিলেক্ট করা যাবে
    e.target.value = "";
  };

  const handleReset = () => {
    jobIdRef.current += 1;
    revokeUrls();

    setImageFile(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
    setIsProcessing(false);
    setProgress(null);
    setErrorMessage(null);
  };

  // ক্লায়েন্ট-সাইড ব্যাকগ্রাউন্ড রিমুভাল (@imgly/background-removal)
  // This package uses the root onnxruntime-web@1.21.0 peer dependency.
  const handleRemoveBg = async () => {
    if (!imageFile || isProcessing) return;

    const jobId = ++jobIdRef.current;

    setIsProcessing(true);
    setProgress(null);
    setErrorMessage(null);

    try {
      // Dynamic import: the library only ever loads in the browser (no SSR issues)
      const { removeBackground } = await import("@imgly/background-removal");

      const resultBlob = await removeBackground(imageFile, {
        output: { format: "image/png" },
        progress: (_key: string, current: number, total: number) => {
          if (jobId !== jobIdRef.current) return;
          if (total > 0) {
            setProgress(Math.min(100, Math.round((current / total) * 100)));
          }
        },
      });

      // ইউজার ইতিমধ্যে নতুন ইমেজ দিলে বা রিসেট করলে এই রেজাল্ট বাদ
      if (jobId !== jobIdRef.current) return;

      if (processedUrlRef.current) {
        URL.revokeObjectURL(processedUrlRef.current);
      }
      const outputUrl = URL.createObjectURL(resultBlob);
      processedUrlRef.current = outputUrl;
      setProcessedUrl(outputUrl);
    } catch (error: unknown) {
      if (jobId !== jobIdRef.current) return;
      console.error("[Remove Background Error]:", error);
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong while removing background.",
      );
    } finally {
      if (jobId === jobIdRef.current) {
        setIsProcessing(false);
        setProgress(null);
      }
    }
  };

  // ইমেজ ডাউনলোড হ্যান্ডলার (Transparent বা Solid Background সহ)
  const handleDownload = () => {
    if (!processedUrl) return;

    if (bgType === "transparent") {
      const a = document.createElement("a");
      a.href = processedUrl;
      a.download = `remove-bg-${Date.now()}.png`;
      a.click();
    } else {
      // Solid Color বা অন্য ব্যাকগ্রাউন্ড ক্যানভাসে ড্র করে ডাউনলোড
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          if (bgType === "solid") {
            ctx.fillStyle = selectedColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (!blob) {
              setErrorMessage("Could not create the download file.");
              return;
            }
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `remove-bg-${Date.now()}.png`;
            a.click();
            // ডাউনলোড শুরু হওয়ার পর টেম্পোরারি URL মুছে ফেলা
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
          }, "image/png");
        }
      };
      img.onerror = () => {
        setErrorMessage("Could not load the processed image for download.");
      };
      img.src = processedUrl;
    }
  };

  return (
    <div className="w-full space-y-5 text-[#0F172A] font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link
          href="/sohoj-tools"
          className="flex items-center gap-1 hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Sohoj Tools</span>
        </Link>
        <span>/</span>
        <span>Image Tools</span>
        <span>/</span>
        <span className="font-semibold text-[#0F172A]">Remove Background</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#F8FAFC] text-[#2563EB] rounded-xl flex items-center justify-center shrink-0 border border-[#E2E8F0]"></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#0F172A]">
                Remove Background
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Erase portrait, product, or logo backgrounds in your browser —
              download a transparent PNG.
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
        {/* Left Side: Controls Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#0F172A] border-b border-gray-100 pb-2">
              New background
            </h2>

            {/* Background Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button
                onClick={() => setBgType("transparent")}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  bgType === "transparent"
                    ? "bg-white text-[#2563EB] shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-[#0F172A]"
                }`}
              >
                <Layers size={14} />
                <span>Transparent</span>
              </button>

              <button
                onClick={() => setBgType("solid")}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  bgType === "solid"
                    ? "bg-white text-[#2563EB] shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-[#0F172A]"
                }`}
              >
                <Palette size={14} />
                <span>Solid color</span>
              </button>

              <button
                onClick={() => setBgType("photo")}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  bgType === "photo"
                    ? "bg-white text-[#2563EB] shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-[#0F172A]"
                }`}
              >
                <ImageIcon size={14} />
                <span>Photo</span>
              </button>
            </div>

            {/* Solid Color Options */}
            {bgType === "solid" && (
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-600 block">
                  Select Color
                </span>
                <div className="flex items-center gap-2">
                  {[
                    "#ffffff",
                    "#000000",
                    "#f3f4f6",
                    "#ef4444",
                    "#3b82f6",
                    "#10b981",
                    "#2563EB",
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-6 h-6 rounded-full border border-gray-200 transition-transform ${
                        selectedColor === color
                          ? "scale-110 ring-2 ring-[#2563EB]"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Box */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col gap-2">
            {errorMessage && (
              <p className="text-[11px] text-red-500 font-medium">
                {errorMessage}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="w-1/3 py-2.5 border border-gray-200 text-[#0F172A] text-xs font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-1"
              >
                <RefreshCw size={12} />
                <span>Reset</span>
              </button>

              <button
                onClick={handleRemoveBg}
                disabled={!imageFile || isProcessing}
                className={`w-2/3 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  imageFile && !isProcessing
                    ? "bg-[#2563EB] text-white shadow-xs hover:bg-[#2563EB]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>
                      Processing...{progress !== null ? ` ${progress}%` : ""}
                    </span>
                  </>
                ) : (
                  <>
                    <span>Remove background</span>
                  </>
                )}
              </button>
            </div>

            {processedUrl && (
              <button
                onClick={handleDownload}
                className="w-full mt-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download size={14} />
                <span>Download Result</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Canvas / Preview Area */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-xs font-bold text-[#0F172A]">Preview</h2>
            <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2.5 py-1 rounded-full">
              {processedUrl ? "Processed" : imageFile ? "Uploaded" : "Empty"}
            </span>
          </div>

          {/* Preview Container */}
          <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-6 my-4 flex-1 flex flex-col justify-center items-center relative overflow-hidden">
            {processedUrl || previewUrl ? (
              <div
                className="relative max-w-full max-h-[380px] flex items-center justify-center rounded-lg overflow-hidden p-2"
                style={{
                  backgroundColor:
                    bgType === "solid"
                      ? selectedColor
                      : bgType === "transparent"
                        ? "transparent"
                        : "#ffffff",
                  backgroundImage:
                    bgType === "transparent" && processedUrl
                      ? "radial-gradient(#e5e7eb 1px, transparent 1px)"
                      : "none",
                  backgroundSize: "12px 12px",
                }}
              >
                <img
                  src={processedUrl || previewUrl!}
                  alt="Cutout Preview"
                  className="max-h-[360px] object-contain rounded-lg transition-all"
                />
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center text-center cursor-pointer p-8 w-full h-full">
                <div className="w-12 h-12 bg-[#F8FAFC] text-[#2563EB] rounded-2xl flex items-center justify-center mb-3 border border-[#E2E8F0]">
                  <ImageIcon size={22} />
                </div>
                <h3 className="text-xs font-bold text-[#0F172A] mb-1">
                  Add an image to get started
                </h3>
                <p className="text-[11px] text-gray-400 max-w-xs">
                  The cut-out preview will appear here after processing.
                </p>
                <span className="text-[10px] text-gray-400 mt-4 block">
                  Or press Ctrl+V to paste a copied image
                </span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Tools in the same category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#0F172A]">
          Tools in the same category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/sohoj-tools/image-size-reducer"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-[#E2E8F0] transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-[#F8FAFC] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
              <ImageIcon size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                Image Size Reducer
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Shrink JPG, PNG, and WebP photos in your browser — quality stays
                sharp.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/nid-joiner"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-[#E2E8F0] transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-[#F8FAFC] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
              <CreditCard size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                NID Joiner
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Turn NID card front and back photos into a clean A4 PDF — all in
                your browser.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/passport-joiner"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-[#E2E8F0] transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-[#F8FAFC] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
              <BookOpen size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                Passport Joiner
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
