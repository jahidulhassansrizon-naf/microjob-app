"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Star,
  Share2,
  ArrowLeft,
  Download,
  FileType,
  CreditCard,
  Wand2,
  Zap,
  Scale,
  Feather,
  Loader2,
  CheckCircle2,
  Trash2,
} from "lucide-react";

type OutputFormat = "jpg" | "png" | "webp" | "avif";
type QualityPreset = "high" | "balanced" | "small";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  convertedUrl?: string;
  status: "idle" | "converting" | "done";
}

export default function ImageConvert() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [format, setFormat] = useState<OutputFormat>("jpg");
  const [quality, setQuality] = useState<QualityPreset>("high");
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Support Clipboard Paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }
      if (pastedFiles.length > 0) {
        addFiles(pastedFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const fileList: UploadedFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: "idle",
    }));
    setFiles((prev) => [...prev, ...fileList]);
    setIsDone(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (files.length <= 1) setIsDone(false);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsConverting(true);
    const qualityValue =
      quality === "high" ? 0.92 : quality === "balanced" ? 0.75 : 0.5;

    const updatedFiles = await Promise.all(
      files.map(async (item) => {
        return new Promise<UploadedFile>((resolve) => {
          const img = new Image();
          img.src = item.preview;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");

            if (ctx) {
              if (format === "jpg") {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
              ctx.drawImage(img, 0, 0);

              const mimeType =
                format === "jpg"
                  ? "image/jpeg"
                  : format === "png"
                    ? "image/png"
                    : format === "webp"
                      ? "image/webp"
                      : "image/png";

              const convertedUrl = canvas.toDataURL(mimeType, qualityValue);
              resolve({
                ...item,
                convertedUrl,
                status: "done",
              });
            } else {
              resolve({ ...item, status: "done" });
            }
          };
        });
      }),
    );

    setFiles(updatedFiles);
    setIsConverting(false);
    setIsDone(true);
  };

  const handleReset = () => {
    setFiles([]);
    setIsDone(false);
    setIsConverting(false);
    setFormat("jpg");
    setQuality("high");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadSingle = (fileItem: UploadedFile) => {
    if (!fileItem.convertedUrl) return;
    const link = document.createElement("a");
    const nameWithoutExt =
      fileItem.file.name.substring(0, fileItem.file.name.lastIndexOf(".")) ||
      fileItem.file.name;
    link.download = `${nameWithoutExt}.${format}`;
    link.href = fileItem.convertedUrl;
    link.click();
  };

  const handleDownloadAll = () => {
    files.forEach((fileItem) => {
      if (fileItem.convertedUrl) {
        handleDownloadSingle(fileItem);
      }
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full space-y-5 text-gray-800 font-sans">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        multiple
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
        <span className="font-semibold text-gray-900">Image Convert</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <FileType size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Image Convert</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Convert JPG, PNG, WebP, HEIC, and more — batch export in your
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
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Output Format Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
              <h2 className="text-xs font-bold text-gray-900">Output format</h2>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "jpg", label: "JPG" },
                  { id: "png", label: "PNG" },
                  { id: "webp", label: "WebP" },
                  { id: "avif", label: "AVIF" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setFormat(item.id as OutputFormat);
                      setIsDone(false);
                    }}
                    className={`py-3 px-1 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      format === item.id
                        ? "border-amber-500 bg-amber-50/40 text-amber-500 shadow-2xs"
                        : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                    }`}
                  >
                    <FileType size={16} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Preset Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
              <h2 className="text-xs font-bold text-gray-900">Quality</h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: "high",
                    label: "High",
                    icon: Feather,
                  },
                  {
                    id: "balanced",
                    label: "Balanced",
                    icon: Scale,
                  },
                  {
                    id: "small",
                    label: "Smaller file",
                    icon: Zap,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setQuality(item.id as QualityPreset);
                        setIsDone(false);
                      }}
                      className={`py-3 px-1 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                        quality === item.id
                          ? "border-amber-500 bg-amber-50/40 text-amber-500 shadow-2xs"
                          : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                      }`}
                    >
                      <Icon size={15} />
                      <span className="text-center leading-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
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
            {!isDone ? (
              <button
                onClick={handleConvert}
                disabled={files.length === 0 || isConverting}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  files.length > 0 && !isConverting
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isConverting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Converting...
                  </>
                ) : (
                  "Convert images"
                )}
              </button>
            ) : (
              <button
                onClick={handleDownloadAll}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} />
                Download All
              </button>
            )}
          </div>
        </div>

        {/* Right Side Preview Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 min-h-[440px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-900">
                Conversion preview
              </h2>
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                {files.length === 0 ? "Empty" : isDone ? "Converted" : "Ready"}
              </span>
            </div>

            {/* Empty State Dropzone Area */}
            {files.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center flex-1 text-center my-1 border-dashed cursor-pointer hover:bg-gray-100/50 transition-all min-h-[360px]"
              >
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
                  <ImageIcon size={28} />
                </div>
                <span className="text-xs font-bold text-gray-800 block">
                  Add an image to get started
                </span>
                <span className="text-[10px] text-gray-400 mt-1 font-medium">
                  Before and after previews will appear here after conversion.
                </span>
                <span className="text-[10px] text-gray-400 mt-5 font-medium">
                  Or press Ctrl+V to paste a copied image
                </span>
              </div>
            ) : (
              /* Active File List & Grid Preview */
              <div className="flex-1 my-1 overflow-y-auto max-h-[380px] space-y-3 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {files.map((fileItem) => (
                    <div
                      key={fileItem.id}
                      className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={fileItem.preview}
                          alt={fileItem.file.name}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-white"
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {fileItem.file.name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {formatSize(fileItem.file.size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {fileItem.status === "done" && (
                          <button
                            onClick={() => handleDownloadSingle(fileItem)}
                            className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all"
                            title="Download Converted Image"
                          >
                            <Download size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => removeFile(fileItem.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Remove Image"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add More Button inside Preview Panel */}
                <div className="pt-2 text-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-amber-500 hover:text-amber-600 underline"
                  >
                    + Add more images
                  </button>
                </div>
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
