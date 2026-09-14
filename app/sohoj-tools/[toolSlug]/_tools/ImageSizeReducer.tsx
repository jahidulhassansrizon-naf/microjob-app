"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import JSZip from "jszip";
import piexif from "piexifjs";
import {
  Image as ImageIcon,
  Star,
  Share2,
  ArrowLeft,
  ChevronDown,
  CreditCard,
  Wand2,
  BookOpen,
  QrCode,
  Crop,
  FileText,
  X,
  Upload,
  Plus,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Pencil,
  LogOut,
  Archive,
} from "lucide-react";

interface CompressedResult {
  file: File;
  blob: Blob;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  width: number;
  height: number;
  name: string;
  mimeType: string;
}

export default function ImageSizeReducer() {
  const [quality, setQuality] = useState<number>(75);
  const [maxDimension, setMaxDimension] =
    useState<string>("Keep original size");
  const [isDimensionOpen, setIsDimensionOpen] = useState<boolean>(false);
  const [preserveExif, setPreserveExif] = useState<boolean>(false);
  const [keepOriginalName, setKeepOriginalName] = useState<boolean>(false);
  const [outputFormat, setOutputFormat] = useState<string>("Original");

  // Image Upload States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Compression & Zip Processing States
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [compressedResults, setCompressedResults] = useState<
    CompressedResult[]
  >([]);
  const [isCompressed, setIsCompressed] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

  // Lightbox / Editing State
  const [activeCompareIndex, setActiveCompareIndex] = useState<number | null>(
    null,
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editSettings, setEditSettings] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dimensionOptions = [
    "Keep original size",
    "3840px (4K)",
    "2560px (2K)",
    "1920px (Full HD)",
    "1280px (HD)",
    "1024px",
    "800px",
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper: Revoke Object URL safely
  const safeRevoke = (url: string) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDimensionOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clean up Object URLs on component unmount
  useEffect(() => {
    return () => {
      previews.forEach(safeRevoke);
      compressedResults.forEach((res) => safeRevoke(res.previewUrl));
    };
  }, []);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (validFiles.length === 0) return;

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setIsCompressed(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files) {
        handleFiles(e.clipboardData.files);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFiles]);

  const handleRemoveImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    safeRevoke(previews[index]);
    if (compressedResults[index]) {
      safeRevoke(compressedResults[index].previewUrl);
    }

    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setCompressedResults((prev) => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1) setIsCompressed(false);
  };

  const handleReset = () => {
    previews.forEach(safeRevoke);
    compressedResults.forEach((res) => safeRevoke(res.previewUrl));

    setSelectedFiles([]);
    setPreviews([]);
    setCompressedResults([]);
    setIsCompressed(false);
    setQuality(75);
    setMaxDimension("Keep original size");
    setShowToast(false);
  };

  const closeCompareModal = () => {
    setActiveCompareIndex(null);
    setIsEditing(false);
    setEditSettings({ brightness: 100, contrast: 100, saturation: 100 });
  };

  const getMaxDimensionLimit = (dimStr: string): number => {
    if (dimStr.includes("3840")) return 3840;
    if (dimStr.includes("2560")) return 2560;
    if (dimStr.includes("1920")) return 1920;
    if (dimStr.includes("1280")) return 1280;
    if (dimStr.includes("1024")) return 1024;
    if (dimStr.includes("800")) return 800;
    return Infinity;
  };

  // Convert Data URL to Blob
  const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const compressSingleImage = (
    file: File,
    appliedFilters?: {
      brightness: number;
      contrast: number;
      saturation: number;
    },
  ): Promise<CompressedResult> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const maxLimit = getMaxDimensionLimit(maxDimension);

        if (maxLimit < Infinity && (width > maxLimit || height > maxLimit)) {
          if (width > height) {
            height = Math.round((height * maxLimit) / width);
            width = maxLimit;
          } else {
            width = Math.round((width * maxLimit) / height);
            height = maxLimit;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        let mimeType = file.type;
        if (outputFormat === "JPG") mimeType = "image/jpeg";
        else if (outputFormat === "PNG") mimeType = "image/png";
        else if (outputFormat === "WebP") mimeType = "image/webp";
        else if (outputFormat === "AVIF") mimeType = "image/avif";

        if (ctx) {
          // Clear background for PNG/WebP transparency preservation
          ctx.clearRect(0, 0, width, height);

          // Solid background fill for JPG
          if (mimeType === "image/jpeg") {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
          }

          // Apply CSS-equivalent editing filters directly into canvas
          if (appliedFilters) {
            ctx.filter = `brightness(${appliedFilters.brightness}%) contrast(${appliedFilters.contrast}%) saturate(${appliedFilters.saturation}%)`;
          } else {
            ctx.filter = "none";
          }

          ctx.drawImage(img, 0, 0, width, height);
        }

        const compQuality = quality / 100;

        const processBlobResult = (blob: Blob) => {
          const extMap: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/avif": ".avif",
          };
          const ext = extMap[blob.type] || extMap[mimeType] || ".jpg";

          const nameWithoutExt =
            file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
          const newName = keepOriginalName
            ? `${nameWithoutExt}${ext}`
            : `${nameWithoutExt}-compressed${ext}`;

          let finalBlob = blob;

          // Preserve EXIF metadata (only applicable for JPEG to JPEG conversion)
          if (
            preserveExif &&
            file.type === "image/jpeg" &&
            (mimeType === "image/jpeg" || blob.type === "image/jpeg") &&
            typeof reader.result === "string"
          ) {
            try {
              const originalDataUrl = reader.result;
              const compressedDataUrl = canvas.toDataURL(
                "image/jpeg",
                compQuality,
              );
              const exifObj = piexif.load(originalDataUrl);
              const exifBytes = piexif.dump(exifObj);
              const withExifDataUrl = piexif.insert(
                exifBytes,
                compressedDataUrl,
              );
              finalBlob = dataURLtoBlob(withExifDataUrl);
            } catch (exifErr) {
              console.warn("Could not preserve EXIF data:", exifErr);
            }
          }

          const previewUrl = URL.createObjectURL(finalBlob);
          const reductionPercentage = Math.max(
            0,
            Math.round(((file.size - finalBlob.size) / file.size) * 100),
          );

          resolve({
            file,
            blob: finalBlob,
            previewUrl,
            originalSize: file.size,
            compressedSize: finalBlob.size,
            reductionPercentage,
            width,
            height,
            name: newName,
            mimeType: finalBlob.type,
          });
        };

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback to webp if browser doesn't natively render AVIF on canvas
              if (mimeType === "image/avif") {
                canvas.toBlob(
                  (fallbackBlob) => {
                    if (fallbackBlob) processBlobResult(fallbackBlob);
                    else reject(new Error("Compression failed"));
                  },
                  "image/webp",
                  compQuality,
                );
              } else {
                reject(new Error("Compression failed"));
              }
              return;
            }
            processBlobResult(blob);
          },
          mimeType,
          compQuality,
        );
      };

      img.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleCompress = async () => {
    if (selectedFiles.length === 0) return;
    setIsCompressing(true);

    try {
      // Clear previous blob URLs
      compressedResults.forEach((res) => safeRevoke(res.previewUrl));

      const results = await Promise.all(
        selectedFiles.map((file) => compressSingleImage(file)),
      );
      setCompressedResults(results);
      setIsCompressed(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (error) {
      console.error("Compression Error:", error);
    } finally {
      setIsCompressing(false);
    }
  };

  // Re-bake editing filter into the active compressed image
  const handleApplyEditing = async () => {
    if (activeCompareIndex === null || !selectedFiles[activeCompareIndex])
      return;

    try {
      const updatedResult = await compressSingleImage(
        selectedFiles[activeCompareIndex],
        editSettings,
      );

      // Safe revoke old preview URL
      if (compressedResults[activeCompareIndex]) {
        safeRevoke(compressedResults[activeCompareIndex].previewUrl);
      }

      setCompressedResults((prev) => {
        const next = [...prev];
        next[activeCompareIndex] = updatedResult;
        return next;
      });
    } catch (err) {
      console.error("Editing save error:", err);
    }
  };

  const handleDownloadSingle = (res: CompressedResult) => {
    const a = document.createElement("a");
    a.href = res.previewUrl;
    a.download = res.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ZIP Batch Download Fix
  const handleDownloadAll = async () => {
    if (compressedResults.length === 0) return;

    if (compressedResults.length === 1) {
      handleDownloadSingle(compressedResults[0]);
      return;
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();
      compressedResults.forEach((res) => {
        zip.file(res.name, res.blob);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);

      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = "compressed_images.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      safeRevoke(zipUrl);
    } catch (err) {
      console.error("Zip generation error:", err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="w-full space-y-5 text-gray-800 font-sans pb-24 relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-5 right-5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-xs font-bold">Success</p>
            <p className="text-[11px] text-emerald-600 font-medium">
              Images compressed successfully.
            </p>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link
          className="flex items-center gap-1 hover:text-gray-900 transition-colors cursor-pointer"
          href="/sohoj-tools"
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
          <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100 cursor-pointer">
            <Star size={16} />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100 cursor-pointer">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Controls Box */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">Quality</label>
              <span className="text-xs font-bold text-gray-800">
                {quality}%
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => {
                setQuality(Number(e.target.value));
                setIsCompressed(false);
              }}
              className="w-full accent-amber-500 bg-gray-200 rounded-lg h-2 cursor-pointer"
            />
            <p className="text-[10px] text-gray-400 font-medium">
              Lower quality = smaller file size
            </p>
          </div>

          <div
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2 relative"
            ref={dropdownRef}
          >
            <label className="text-xs font-bold text-gray-700 block">
              Max dimension
            </label>
            <div
              onClick={() => setIsDimensionOpen(!isDimensionOpen)}
              className="w-full flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 cursor-pointer hover:border-amber-400 transition-all shadow-xs"
            >
              <span>{maxDimension}</span>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${
                  isDimensionOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {isDimensionOpen && (
              <div className="absolute left-4 right-4 top-20 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden py-1">
                {dimensionOptions.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => {
                      setMaxDimension(opt);
                      setIsDimensionOpen(false);
                      setIsCompressed(false);
                    }}
                    className={`px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                      maxDimension === opt
                        ? "bg-amber-50 text-amber-600 font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-gray-400 font-medium">
              Images larger than this will be resized
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-gray-700 block">
                Preserve EXIF
              </label>
              <p className="text-[10px] text-gray-400 font-medium">
                Keep camera & location data
              </p>
            </div>
            <button
              onClick={() => {
                setPreserveExif(!preserveExif);
                setIsCompressed(false);
              }}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                preserveExif ? "bg-amber-500" : "bg-gray-200"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  preserveExif ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-gray-700 block">
                Keep original name
              </label>
              <p className="text-[10px] text-gray-400 font-medium">
                Don't add the "-compressed" suffix
              </p>
            </div>
            <button
              onClick={() => {
                setKeepOriginalName(!keepOriginalName);
                setIsCompressed(false);
              }}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                keepOriginalName ? "bg-amber-500" : "bg-gray-200"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  keepOriginalName ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <label className="text-xs font-bold text-gray-700 block">
              Output format
            </label>
            <div className="grid grid-cols-5 gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-100">
              {[
                { name: "Original", icon: Crop },
                { name: "JPG", icon: FileText },
                { name: "PNG", icon: ImageIcon },
                { name: "WebP", icon: GlobeIconWrapper },
                { name: "AVIF", icon: ZapIconWrapper },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setOutputFormat(item.name);
                      setIsCompressed(false);
                    }}
                    className={`py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      outputFormat === item.name
                        ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <IconComponent />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Compression Preview Box */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[460px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-gray-700">
              Compression preview
            </h2>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                isCompressed
                  ? "bg-emerald-100 text-emerald-700"
                  : selectedFiles.length > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              {isCompressed
                ? "Done"
                : selectedFiles.length > 0
                  ? `${selectedFiles.length} file(s) added`
                  : "Empty"}
            </span>
          </div>

          {previews.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-2xl border border-dashed p-8 flex flex-col items-center justify-center my-auto text-center py-24 cursor-pointer transition-all ${
                isDragging
                  ? "border-amber-500 bg-amber-50/40"
                  : "border-gray-200 bg-gray-50/60 hover:border-amber-400 hover:bg-amber-50/20"
              }`}
            >
              <div className="w-10 h-10 bg-amber-50 text-amber-400 rounded-xl flex items-center justify-center mb-3 border border-amber-100">
                <Upload size={20} />
              </div>
              <p className="text-xs font-bold text-gray-800">
                Add an image to get started
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Before and after previews will appear here after processing.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 items-start justify-start overflow-y-auto max-h-[420px] p-1">
              {previews.map((src, index) => {
                const file = selectedFiles[index];
                const compRes = compressedResults[index];
                const displaySrc =
                  isCompressed && compRes ? compRes.previewUrl : src;

                return (
                  <div
                    key={index}
                    onClick={() => {
                      setZoomLevel(100);
                      setActiveCompareIndex(index);
                    }}
                    className={`w-44 bg-white rounded-2xl border overflow-hidden shadow-xs relative group flex flex-col transition-all cursor-pointer hover:shadow-md ${
                      isCompressed ? "border-emerald-300" : "border-gray-200"
                    }`}
                  >
                    <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                      <img
                        src={displaySrc}
                        alt={file?.name || "preview"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {isCompressed && compRes && (
                        <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          -{compRes.reductionPercentage}%
                        </span>
                      )}

                      <button
                        onClick={(e) => handleRemoveImage(index, e)}
                        className="absolute top-2 left-2 bg-black/50 hover:bg-black/80 text-white p-1 rounded-md backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100 z-10 cursor-pointer"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <div className="p-3 bg-white flex flex-col justify-center">
                      <p
                        className="text-xs font-bold text-gray-800 truncate"
                        title={
                          isCompressed && compRes ? compRes.name : file?.name
                        }
                      >
                        {isCompressed && compRes ? compRes.name : file?.name}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        {isCompressed && compRes ? (
                          <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            <span>
                              {formatFileSize(compRes.compressedSize)}
                            </span>
                            <span className="text-emerald-400">•</span>
                            <span>
                              {compRes.width}x{compRes.height}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-medium">
                            {file ? formatFileSize(file.size) : "0 B"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="w-44 h-52 rounded-2xl border-2 border-dashed border-gray-200 hover:border-amber-400 bg-gray-50/40 hover:bg-amber-50/20 flex flex-col items-center justify-center text-gray-400 hover:text-amber-500 cursor-pointer transition-all shrink-0"
              >
                <Plus className="text-gray-400" size={22} />
                <span className="text-xs font-semibold text-gray-500 mt-2">
                  Add more images
                </span>
              </div>
            </div>
          )}

          <div />
        </div>
      </div>

      {/* Tools in the same category */}
      <div className="space-y-3 pt-4">
        <h3 className="text-xs font-bold text-gray-900">
          Tools in the same category
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            {
              name: "NID to PDF",
              href: "/sohoj-tools/nid-to-pdf",
              icon: CreditCard,
              bg: "bg-emerald-500",
            },
            {
              name: "Remove Background",
              href: "/sohoj-tools/remove-background",
              icon: Wand2,
              bg: "bg-emerald-500",
            },
            {
              name: "Passport to PDF",
              href: "/sohoj-tools/passport-to-pdf",
              icon: BookOpen,
              bg: "bg-emerald-500",
            },
            {
              name: "Magic Eraser",
              href: "/sohoj-tools/magic-eraser",
              icon: Wand2,
              bg: "bg-emerald-500",
            },
            {
              name: "QR Generator",
              href: "/sohoj-tools/qr-generator",
              icon: QrCode,
              bg: "bg-teal-500",
            },
            {
              name: "Image Resizer",
              href: "/sohoj-tools/image-resizer",
              icon: Crop,
              bg: "bg-teal-500",
            },
          ].map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <Link
                key={idx}
                href={tool.href}
                className={`${tool.bg} aspect-square flex flex-col items-center justify-center p-6 rounded-3xl shadow-sm text-center text-white hover:opacity-95 transition-all group cursor-pointer`}
              >
                <div className="w-10 h-10 mb-2 flex items-center justify-center">
                  <Icon className="text-white" size={28} />
                </div>
                <span className="text-[11px] font-bold leading-tight">
                  {tool.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 p-3 px-6 flex items-center justify-between z-30 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span
            className={`w-2 h-2 rounded-full ${
              isCompressed
                ? "bg-emerald-500"
                : selectedFiles.length > 0
                  ? "bg-amber-400"
                  : "bg-gray-300"
            }`}
          ></span>
          <span>
            {isCompressed
              ? "Images compressed successfully"
              : selectedFiles.length > 0
                ? `${selectedFiles.length} image(s) ready for compression`
                : "Add an input to get started"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
          >
            Reset
          </button>

          {isCompressed ? (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>Compress more images</span>
              </button>

              <button
                disabled={isZipping}
                onClick={handleDownloadAll}
                className="px-5 py-2 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {isZipping ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : compressedResults.length > 1 ? (
                  <Archive size={14} />
                ) : (
                  <Download size={14} />
                )}
                <span>
                  {isZipping
                    ? "Zipping..."
                    : compressedResults.length > 1
                      ? "Download ZIP"
                      : "Download"}
                </span>
              </button>
            </>
          ) : (
            <button
              disabled={selectedFiles.length === 0 || isCompressing}
              onClick={handleCompress}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                selectedFiles.length > 0 && !isCompressing
                  ? "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-md"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isCompressing && <Loader2 className="animate-spin" size={14} />}
              <span>
                {isCompressing ? "Compressing..." : "Compress images"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* BEFORE / AFTER SIDE-BY-SIDE LIGHTBOX MODAL */}
      {activeCompareIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200 select-none">
          {/* Top Close Button Bar */}
          <div className="p-4 flex justify-between items-center z-20">
            <div className="text-white text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
              {selectedFiles[activeCompareIndex]?.name}
            </div>
            <button
              onClick={closeCompareModal}
              className="w-10 h-10 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Split Screen Image Container */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-1 px-4 overflow-hidden relative">
            {/* Left Column: Before */}
            <div className="relative flex flex-col items-center justify-center border-r border-white/10 overflow-hidden bg-black/40 rounded-l-2xl">
              <span className="absolute top-4 left-4 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-md border border-white/20 backdrop-blur-md z-10">
                Before
              </span>

              <div
                className="w-full h-full flex items-center justify-center p-6 overflow-auto"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transition: "transform 0.15s ease-out",
                }}
              >
                <img
                  src={previews[activeCompareIndex]}
                  alt="Before"
                  className="max-h-[75vh] max-w-full object-contain shadow-2xl"
                />
              </div>

              {/* Zoom Controls */}
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs z-10">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="font-mono text-[11px] font-bold">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>

            {/* Right Column: After */}
            <div className="relative flex flex-col items-center justify-center overflow-hidden bg-black/40 rounded-r-2xl">
              {/* Controls Bar on top right pane */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={closeCompareModal}
                    className="bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 backdrop-blur-md transition-all border border-indigo-400/30 cursor-pointer"
                  >
                    <LogOut size={12} />
                    <span>Exit</span>
                  </button>

                  {compressedResults[activeCompareIndex] && (
                    <button
                      onClick={() =>
                        handleDownloadSingle(
                          compressedResults[activeCompareIndex],
                        )
                      }
                      className="bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 backdrop-blur-md transition-all border border-emerald-400/30 cursor-pointer"
                    >
                      <Download size={12} />
                      <span>Download</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 backdrop-blur-md transition-all border cursor-pointer ${
                      isEditing
                        ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-400"
                        : "bg-white/10 hover:bg-white/20 text-white border-white/20"
                    }`}
                  >
                    <Pencil size={12} />
                    <span>Edit</span>
                  </button>
                </div>

                <span className="bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-md border border-white/20 backdrop-blur-md">
                  After
                </span>
              </div>

              <div
                className="w-full h-full flex items-center justify-center p-6 overflow-auto"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transition: "transform 0.15s ease-out",
                }}
              >
                <img
                  src={
                    compressedResults[activeCompareIndex]?.previewUrl ||
                    previews[activeCompareIndex]
                  }
                  alt="After"
                  className="max-h-[75vh] max-w-full object-contain shadow-2xl transition-all duration-100"
                />
              </div>

              {/* EDITING SIDEBAR */}
              {isEditing && (
                <div className="absolute top-0 right-0 h-full w-64 bg-white shadow-2xl z-20 flex flex-col animate-in slide-in-from-right-8 duration-300">
                  <div className="p-6 flex flex-col mt-14 overflow-y-auto flex-1">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                        Image Editing
                      </h3>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-6 flex-1">
                      {/* Brightness */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-700 uppercase">
                          <span>Brightness</span>
                          <span>{editSettings.brightness}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={editSettings.brightness}
                          onChange={(e) =>
                            setEditSettings({
                              ...editSettings,
                              brightness: Number(e.target.value),
                            })
                          }
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>

                      {/* Contrast */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-700 uppercase">
                          <span>Contrast</span>
                          <span>{editSettings.contrast}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={editSettings.contrast}
                          onChange={(e) =>
                            setEditSettings({
                              ...editSettings,
                              contrast: Number(e.target.value),
                            })
                          }
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>

                      {/* Saturation */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-700 uppercase">
                          <span>Saturation</span>
                          <span>{editSettings.saturation}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={editSettings.saturation}
                          onChange={(e) =>
                            setEditSettings({
                              ...editSettings,
                              saturation: Number(e.target.value),
                            })
                          }
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleApplyEditing}
                      className="mt-6 w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      Save & Apply Edits
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-3" />
        </div>
      )}
    </div>
  );
}

function GlobeIconWrapper() {
  return <ImageIcon size={14} />;
}
function ZapIconWrapper() {
  return <ImageIcon size={14} />;
}
