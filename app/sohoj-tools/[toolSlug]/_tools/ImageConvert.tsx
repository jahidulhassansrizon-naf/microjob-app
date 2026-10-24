"use client";
import { T as BaseT, useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Image as ImageIcon, Star, Share2, ArrowLeft, Download, FileType, CreditCard, Zap, Scale, Feather, Loader2, CheckCircle2, Trash2 } from "lucide-react";

type OutputFormat = "jpg" | "png" | "webp" | "avif";
type QualityPreset = "high" | "balanced" | "small";
interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  convertedUrl?: string;
  status: "idle" | "converting" | "done";
}
type ImageConvertTextProps = {
  children: React.ReactNode;
  locale: string;
};

// Full-sentence translations are defined locally so this page does not depend
// on the shared translator recognizing every multiline UI string.
const IMAGE_CONVERT_BN: Record<string, string> = {
  "/": "/",
  "sohoj tools": "সহজ টুলস",
  "image tools": "ছবির টুলস",
  "image convert": "ছবি রূপান্তর",
  "free": "বিনামূল্যে",
  "convert jpg, png, webp, heic, and more — batch export in your browser.": "আপনার ব্রাউজারেই JPG, PNG, WebP, HEIC-সহ বিভিন্ন ধরনের ছবি একসঙ্গে রূপান্তর করে ডাউনলোড করুন।",
  "output format": "আউটপুটের ফরম্যাট",
  "jpg": "JPG",
  "png": "PNG",
  "webp": "WebP",
  "avif": "AVIF",
  "quality": "ছবির মান",
  "high": "উচ্চ মান",
  "balanced": "ভারসাম্যপূর্ণ",
  "smaller file": "ছোট ফাইল",
  "reset": "আবার শুরু করুন",
  "converting...": "ছবি রূপান্তর করা হচ্ছে…",
  "convert images": "ছবি রূপান্তর করুন",
  "download all": "সবগুলো ডাউনলোড করুন",
  "conversion preview": "রূপান্তরিত ছবির প্রিভিউ",
  "empty": "খালি",
  "converted": "রূপান্তর সম্পন্ন",
  "ready": "প্রস্তুত",
  "add an image to get started": "শুরু করতে একটি ছবি যোগ করুন",
  "before and after previews will appear here after conversion.": "ছবি রূপান্তর করার পর আগের ও পরের ছবির প্রিভিউ এখানে দেখা যাবে।",
  "or press ctrl+v to paste a copied image": "অথবা কপি করা ছবি পেস্ট করতে Ctrl+V চাপুন",
  "+ add more images": "+ আরও ছবি যোগ করুন",
  "tools in the same category": "একই বিভাগের অন্যান্য টুল",
  "image size reducer": "ছবির আকার কমান",
  "shrink jpg, png, and webp photos in your browser — quality stays sharp.": "ছবির মান স্পষ্ট রেখে ব্রাউজারেই JPG, PNG ও WebP ছবির আকার কমান।",
  "nid joiner": "NID-এর দুই পাশ একত্র করুন",
  "turn nid card front and back photos into a clean a4 pdf — all in your browser.": "NID কার্ডের সামনের ও পেছনের ছবি একত্র করে ব্রাউজারেই পরিষ্কার A4 PDF তৈরি করুন।",
  "remove background": "ছবির পটভূমি সরান",
  "erase portrait, product, or logo backgrounds in your browser — download a transparent png.": "ব্রাউজারেই ব্যক্তি, পণ্য বা লোগোর পটভূমি সরিয়ে স্বচ্ছ ব্যাকগ্রাউন্ডসহ PNG ডাউনলোড করুন।",
  "download converted image": "রূপান্তরিত ছবি ডাউনলোড করুন",
  "remove image": "ছবিটি সরান",
  "save to favorites": "পছন্দের তালিকায় যোগ করুন",
  "share this tool": "এই টুলটি শেয়ার করুন",
};

function normalizeImageConvertText(value: string): string {
  return value
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function translateImageConvertText(value: string, locale: string): string | null {
  if (!locale.toLowerCase().startsWith("bn")) return null;
  const normalized = normalizeImageConvertText(value);
  const translated = IMAGE_CONVERT_BN[normalized];
  if (translated === undefined) return null;
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function ImageConvertText({ children, locale }: ImageConvertTextProps) {
  if (typeof children === "string") {
    const translated = translateImageConvertText(children, locale);
    if (translated !== null) return <>{translated}</>;
  }
  return <BaseT>{children}</BaseT>;
}

export default function ImageConvert() {
  const { locale, L: baseL } = useSohozI18n();
  const L = (value: string) => translateImageConvertText(value, locale) ?? baseL(value);
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
      if (pastedFiles.length > 0) addFiles(pastedFiles);
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
    if (e.target.files && e.target.files.length > 0) addFiles(Array.from(e.target.files));
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (files.length <= 1) setIsDone(false);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsConverting(true);
    const qualityValue = quality === "high" ? 0.92 : quality === "balanced" ? 0.75 : 0.5;
    const updatedFiles = await Promise.all(files.map(async (item) => {
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
            const mimeType = format === "jpg"
              ? "image/jpeg"
              : format === "png"
                ? "image/png"
                : format === "webp"
                  ? "image/webp"
                  : "image/png";
            const convertedUrl = canvas.toDataURL(mimeType, qualityValue);
            resolve({ ...item, convertedUrl, status: "done" });
          } else {
            resolve({ ...item, status: "done" });
          }
        };
      });
    }));
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadSingle = (fileItem: UploadedFile) => {
    if (!fileItem.convertedUrl) return;
    const link = document.createElement("a");
    const nameWithoutExt = fileItem.file.name.substring(0, fileItem.file.name.lastIndexOf(".")) || fileItem.file.name;
    link.download = `${nameWithoutExt}.${format}`;
    link.href = fileItem.convertedUrl;
    link.click();
  };

  const handleDownloadAll = () => {
    files.forEach((fileItem) => {
      if (fileItem.convertedUrl) handleDownloadSingle(fileItem);
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
    <div id="image-convert-tool" className="relative isolate min-h-screen w-full space-y-5 bg-transparent pb-10 font-sans text-[#3B2F1E]">
      <style>{`
        #image-convert-tool::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: linear-gradient(180deg, #E9DDC3 0%, #EFE5CE 100%);
        }
        #image-convert-tool,
        #image-convert-tool *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        #image-convert-tool :where(button, a, input, select, textarea) {
          transition-duration: 180ms;
        }
        #image-convert-tool :where(button, a):focus-visible,
        #image-convert-tool :where(input, select, textarea):focus-visible {
          outline: 2px solid rgba(220, 38, 38, .55);
          outline-offset: 2px;
        }
        #image-convert-tool .image-convert-scroll {
          scrollbar-width: thin;
          scrollbar-color: #F87171 transparent;
        }
        #image-convert-tool .image-convert-scroll::-webkit-scrollbar { width: 12px; }
        #image-convert-tool .image-convert-scroll::-webkit-scrollbar-track {
          background: rgba(148, 113, 67, .12);
          border-radius: 999px;
          margin: 10px 0;
        }
        #image-convert-tool .image-convert-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #F87171, #DC2626);
          border-radius: 999px;
          border: 3px solid #F2E8D2;
          min-height: 48px;
        }
        #image-convert-tool .image-convert-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #EF4444, #B91C1C);
        }
      `}</style>

      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" multiple className="hidden" />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-[#5A4A32]">
        <Link href="/sohoj-tools" className="flex items-center gap-1 transition-colors hover:text-[#DC2626]">
          <ArrowLeft size={14} />
          <span><ImageConvertText locale={locale}>{"Sohoj Tools"}</ImageConvertText></span>
        </Link>
        <span><ImageConvertText locale={locale}>{"/"}</ImageConvertText></span>
        <span><ImageConvertText locale={locale}>{"Image Tools"}</ImageConvertText></span>
        <span><ImageConvertText locale={locale}>{"/"}</ImageConvertText></span>
        <span className="font-semibold text-[#3B2F1E]"><ImageConvertText locale={locale}>{"Image Convert"}</ImageConvertText></span>
      </div>

      {/* Header Card */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] text-[#DC2626]">
            <FileType size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#3B2F1E]"><ImageConvertText locale={locale}>{"Image Convert"}</ImageConvertText></h1>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700"><ImageConvertText locale={locale}>{"Free\n              "}</ImageConvertText></span>
            </div>
            <p className="mt-0.5 text-sm font-medium text-[#5A4A32]"><ImageConvertText locale={locale}>{"Convert JPG, PNG, WebP, HEIC, and more — batch export in your\n              browser.\n            "}</ImageConvertText></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button aria-label={L("Save to favorites")} title={L("Save to favorites")} className="rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] p-2 text-[#7A6A50] transition-all hover:border-[#DC2626]/40 hover:bg-[#FEE9E9] hover:text-[#DC2626]">
            <Star size={16} />
          </button>
          <button aria-label={L("Share this tool")} title={L("Share this tool")} className="rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] p-2 text-[#7A6A50] transition-all hover:border-[#DC2626]/40 hover:bg-[#FEE9E9] hover:text-[#DC2626]">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Side Controls Panel */}
        <div className="flex flex-col justify-between space-y-4 lg:col-span-4">
          <div className="space-y-4">
            {/* Output Format Card */}
            <div className="space-y-3 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-5 shadow-sm">
              <h2 className="text-base font-bold text-[#3B2F1E]"><ImageConvertText locale={locale}>{"Output format"}</ImageConvertText></h2>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "jpg", label: "JPG" },
                  { id: "png", label: "PNG" },
                  { id: "webp", label: "WebP" },
                  { id: "avif", label: "AVIF" },
                ].map((item) => (
                  <button key={item.id} onClick={() => {
                    setFormat(item.id as OutputFormat);
                    setIsDone(false);
                  }} className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-3 text-sm font-bold transition-all active:scale-[0.98] ${format === item.id
                    ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C] ring-2 ring-[#DC2626]/40 shadow-sm"
                    : "border-[#E3D6B8] bg-[#F6EEDB] text-[#5A4A32] hover:border-[#D8C9A6] hover:bg-[#EFE3C8]"}`}>
                    <FileType size={16} />
                    {<ImageConvertText locale={locale}>{item.label}</ImageConvertText>}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Preset Card */}
            <div className="space-y-3 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-5 shadow-sm">
              <h2 className="text-base font-bold text-[#3B2F1E]"><ImageConvertText locale={locale}>{"Quality"}</ImageConvertText></h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "high", label: "High", icon: Feather },
                  { id: "balanced", label: "Balanced", icon: Scale },
                  { id: "small", label: "Smaller file", icon: Zap },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => {
                      setQuality(item.id as QualityPreset);
                      setIsDone(false);
                    }} className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-3 text-sm font-bold transition-all active:scale-[0.98] ${quality === item.id
                      ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C] ring-2 ring-[#DC2626]/40 shadow-sm"
                      : "border-[#E3D6B8] bg-[#F6EEDB] text-[#5A4A32] hover:border-[#D8C9A6] hover:bg-[#EFE3C8]"}`}>
                      <Icon size={15} />
                      <span className="text-center leading-tight"><ImageConvertText locale={locale}>{item.label}</ImageConvertText></span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button onClick={handleReset} className="rounded-xl border border-[#FBB6B6] bg-[#FBF6E8] px-4 py-2.5 text-sm font-bold text-[#B91C1C] transition-all hover:bg-[#FEE9E9] active:scale-[0.98]"><ImageConvertText locale={locale}>{"Reset\n            "}</ImageConvertText></button>
            {!isDone ? (
              <button onClick={handleConvert} disabled={files.length === 0 || isConverting} className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.98] ${files.length > 0 && !isConverting
                ? "cursor-pointer bg-[#D42020] text-white shadow-sm hover:bg-[#AE1717]"
                : "cursor-not-allowed bg-[#F3E9D2] text-[#7A6A50] opacity-70"}`}>
                {isConverting ? (<><Loader2 size={14} className="animate-spin" /><ImageConvertText locale={locale}>{"Converting...\n                  "}</ImageConvertText></>) : <ImageConvertText locale={locale}>{"Convert images"}</ImageConvertText>}
              </button>
            ) : (
              <button onClick={handleDownloadAll} className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#D42020] py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#AE1717] active:scale-[0.98]">
                <Download size={14} /><ImageConvertText locale={locale}>{"Download All\n              "}</ImageConvertText>
              </button>
            )}
          </div>
        </div>

        {/* Right Side Preview Panel */}
        <div className="lg:col-span-8">
          <div className="flex min-h-[440px] flex-col justify-between space-y-4 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#3B2F1E]"><ImageConvertText locale={locale}>{"Conversion preview\n              "}</ImageConvertText></h2>
              <span className="rounded-full bg-[#F3E9D2] px-2 py-0.5 text-xs font-medium text-[#5A4A32]">
                {files.length === 0 ? <ImageConvertText locale={locale}>{"Empty"}</ImageConvertText> : isDone ? <ImageConvertText locale={locale}>{"Converted"}</ImageConvertText> : <ImageConvertText locale={locale}>{"Ready"}</ImageConvertText>}
              </span>
            </div>

            {/* Empty State Dropzone Area */}
            {files.length === 0 ? (
              <div onClick={() => fileInputRef.current?.click()} className="my-1 flex min-h-[360px] flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#B0A080] bg-[#F6EEDB] p-10 text-center transition-all hover:border-[#DC2626]/50 hover:bg-[#EFE3C8]">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3E9D2] text-[#DC2626]">
                  <ImageIcon size={28} />
                </div>
                <span className="block text-sm font-bold text-[#3B2F1E]"><ImageConvertText locale={locale}>{"Add an image to get started\n                "}</ImageConvertText></span>
                <span className="mt-1 font-medium text-[#7A6A50] text-sm"><ImageConvertText locale={locale}>{"Before and after previews will appear here after conversion.\n                "}</ImageConvertText></span>
                <span className="mt-5 font-medium text-[#7A6A50] text-sm"><ImageConvertText locale={locale}>{"Or press Ctrl+V to paste a copied image\n                "}</ImageConvertText></span>
              </div>
            ) : (
              /* Active File List & Grid Preview */
              <div className="image-convert-scroll my-1 max-h-[380px] flex-1 space-y-3 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {files.map((fileItem) => (
                    <div key={fileItem.id} className="group flex items-center justify-between gap-3 rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] p-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fileItem.preview} alt={fileItem.file.name} className="h-12 w-12 rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] object-cover" />
                        <div className="overflow-hidden">
                          <p className="truncate text-sm font-bold text-[#3B2F1E]">{fileItem.file.name}</p>
                          <p className="text-xs text-[#7A6A50]">{formatSize(fileItem.file.size)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {fileItem.status === "done" && (
                          <button onClick={() => handleDownloadSingle(fileItem)} className="rounded-lg bg-[#D42020] p-1.5 text-white transition-all hover:bg-[#AE1717] active:scale-[0.98]" title={L("Download Converted Image")}>
                            <Download size={13} />
                          </button>
                        )}
                        <button onClick={() => removeFile(fileItem.id)} className="rounded-lg p-1.5 text-[#7A6A50] transition-all hover:bg-[#FEE9E9] hover:text-[#B91C1C]" title={L("Remove Image")}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add More Button inside Preview Panel */}
                <div className="pt-2 text-center">
                  <button onClick={() => fileInputRef.current?.click()} className="text-sm font-bold text-[#DC2626] underline transition-colors hover:text-[#B91C1C]"><ImageConvertText locale={locale}>{"+ Add more images\n                  "}</ImageConvertText></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tools in the same category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-[#3B2F1E]"><ImageConvertText locale={locale}>{"Tools in the same category\n        "}</ImageConvertText></h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link href="/sohoj-tools/image-size-reducer" className="group flex items-start gap-3 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#DC2626]/40 hover:bg-[#EFE3C8]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3E9D2] text-[#DC2626]"><ImageIcon size={16} /></div>
            <div>
              <h4 className="text-sm font-bold text-[#3B2F1E] transition-colors group-hover:text-[#B91C1C]"><ImageConvertText locale={locale}>{"Image Size Reducer\n              "}</ImageConvertText></h4>
              <p className="mt-0.5 line-clamp-2 text-sm text-[#7A6A50]"><ImageConvertText locale={locale}>{"Shrink JPG, PNG, and WebP photos in your browser — quality stays\n                sharp.\n              "}</ImageConvertText></p>
            </div>
          </Link>

          <Link href="/sohoj-tools/nid-joiner" className="group flex items-start gap-3 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#DC2626]/40 hover:bg-[#EFE3C8]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3E9D2] text-[#DC2626]"><CreditCard size={16} /></div>
            <div>
              <h4 className="text-sm font-bold text-[#3B2F1E] transition-colors group-hover:text-[#B91C1C]"><ImageConvertText locale={locale}>{"NID Joiner\n              "}</ImageConvertText></h4>
              <p className="mt-0.5 line-clamp-2 text-sm text-[#7A6A50]"><ImageConvertText locale={locale}>{"Turn NID card front and back photos into a clean A4 PDF — all in\n                your browser.\n              "}</ImageConvertText></p>
            </div>
          </Link>

          <Link href="/sohoj-tools/remove-background" className="group flex items-start gap-3 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#DC2626]/40 hover:bg-[#EFE3C8]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3E9D2] text-[#DC2626]"></div>
            <div>
              <h4 className="text-sm font-bold text-[#3B2F1E] transition-colors group-hover:text-[#B91C1C]"><ImageConvertText locale={locale}>{"Remove Background\n              "}</ImageConvertText></h4>
              <p className="mt-0.5 line-clamp-2 text-sm text-[#7A6A50]"><ImageConvertText locale={locale}>{"Erase portrait, product, or logo backgrounds in your browser —\n                download a transparent PNG.\n              "}</ImageConvertText></p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
