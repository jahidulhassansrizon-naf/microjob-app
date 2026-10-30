"use client";
import { useSebaLagbeToolsI18n } from "@/app/sohoj-tools/_i18n";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import JSZip from "jszip";
import imageCompression from "browser-image-compression";
import { Image as ImageIcon, Star, Share2, ArrowLeft, ChevronDown, CreditCard, BookOpen, Crop, FileText, X, Upload, Plus, CheckCircle2, Download, Loader2, RefreshCw, ZoomIn, ZoomOut, Pencil, LogOut, Archive, Globe, Zap, } from "lucide-react";
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
/* -------------------------------------------------------------------------- */
/* Page-specific English ↔ Bangla translation                                */
/* -------------------------------------------------------------------------- */
const IMAGE_SIZE_BN: Record<string, string> = {
  "success": "সফল হয়েছে",
  "unable to complete": "কাজটি সম্পন্ন করা যায়নি",
  "close notification": "বিজ্ঞপ্তি বন্ধ করুন",
  "back to tools": "টুলসের তালিকায় ফিরে যান",
  "image tools": "ছবির টুলস",
  "image size reducer": "ছবির ফাইলের আকার কমান",
  "free": "বিনামূল্যে",
  "shrink jpg, png, and webp photos in your browser — quality stays sharp.": "ব্রাউজারেই JPG, PNG ও WebP ছবির ফাইলের আকার কমান—ছবির মানও স্পষ্ট থাকবে।",
  "quality": "ছবির মান",
  "png is lossless; quality has little effect on size.": "PNG ফরম্যাটে ছবির মানের ক্ষতি হয় না; তাই মানের সেটিং বদলালেও ফাইলের আকার খুব একটা কমে না।",
  "lower quality = smaller file size": "ছবির মান কমালে ফাইলের আকারও কমে",
  "max dimension": "সর্বোচ্চ মাত্রা",
  "keep original size": "মূল আকার অপরিবর্তিত রাখুন",
  "3840px (4k)": "৩৮৪০ পিক্সেল (4K)",
  "2560px (2k)": "২৫৬০ পিক্সেল (2K)",
  "1920px (full hd)": "১৯২০ পিক্সেল (Full HD)",
  "1280px (hd)": "১২৮০ পিক্সেল (HD)",
  "1024px": "১০২৪ পিক্সেল",
  "800px": "৮০০ পিক্সেল",
  "images larger than this will be resized": "এর চেয়ে বড় ছবিগুলো নির্ধারিত মাত্রা অনুযায়ী ছোট করা হবে।",
  "preserve exif": "EXIF তথ্য সংরক্ষণ করুন",
  "keep camera & location data": "ক্যামেরা ও অবস্থানের তথ্য রেখে দিন",
  "keep original name": "মূল নাম অপরিবর্তিত রাখুন",
  "don't add the \"-compressed\" suffix": "ফাইলের নামের শেষে “-compressed” যোগ করবেন না",
  "output format": "আউটপুট ফরম্যাট",
  "original": "মূল ফরম্যাট",
  "compression preview": "সংকুচিত ছবির পূর্বরূপ",
  "done": "সম্পন্ন",
  "empty": "এখনও কোনো ছবি যোগ করা হয়নি",
  "add an image to get started": "শুরু করতে একটি ছবি যোগ করুন",
  "before and after previews will appear here after processing.": "প্রক্রিয়াকরণ শেষ হলে এখানে আগের ও পরের ছবির পূর্বরূপ দেখা যাবে।",
  "click to compare": "তুলনা করতে ক্লিক করুন",
  "add more images": "আরও ছবি যোগ করুন",
  "tools in the same category": "একই বিভাগের অন্যান্য টুল",
  "reset": "রিসেট করুন",
  "compress more images": "আরও ছবি সংকুচিত করুন",
  "zipping...": "ZIP ফাইল তৈরি হচ্ছে...",
  "compressing...": "ছবি সংকুচিত হচ্ছে...",
  "compress images": "ছবি সংকুচিত করুন",
  "before": "আগের ছবি",
  "exit": "বন্ধ করুন",
  "download": "ডাউনলোড",
  "download zip": "ZIP ডাউনলোড করুন",
  "edit": "সম্পাদনা করুন",
  "after": "পরের ছবি",
  "image editing": "ছবি সম্পাদনা",
  "brightness": "উজ্জ্বলতা",
  "contrast": "কনট্রাস্ট",
  "saturation": "রঙের গাঢ়ত্ব",
  "saving...": "সংরক্ষণ করা হচ্ছে...",
  "save & apply edits": "সম্পাদনা সংরক্ষণ ও প্রয়োগ করুন",
  "share this tool": "এই টুলটি শেয়ার করুন",
  "remove image": "ছবি সরান",
  "before and after image comparison": "আগের ও পরের ছবির তুলনা",
  "please wait until the current processing is finished.": "বর্তমান প্রক্রিয়াকরণ শেষ হওয়া পর্যন্ত অপেক্ষা করুন।",
  "please select jpg, png, or webp image files.": "অনুগ্রহ করে JPG, PNG অথবা WebP ফাইল নির্বাচন করুন।",
  "unable to determine image dimensions.": "ছবির মাত্রা নির্ধারণ করা যায়নি।",
  "the processed image could not be decoded.": "প্রক্রিয়াকরণ করা ছবিটি খোলা যায়নি।",
  "canvas rendering is not available in this browser.": "এই ব্রাউজারে ক্যানভাস রেন্ডারিং সুবিধা নেই।",
  "the browser could not encode the edited image.": "ব্রাউজারটি সম্পাদিত ছবিটি তৈরি করতে পারেনি।",
  "the source image could not be loaded for editing.": "সম্পাদনার জন্য মূল ছবিটি লোড করা যায়নি।",
  "the image could not be downloaded.": "ছবিটি ডাউনলোড করা যায়নি।",
  "edits applied successfully.": "ছবির সম্পাদনাগুলো সফলভাবে প্রয়োগ করা হয়েছে।",
  "the edited image could not be saved.": "সম্পাদিত ছবিটি সংরক্ষণ করা যায়নি।",
  "zip downloaded successfully.": "ZIP ফাইল সফলভাবে ডাউনলোড হয়েছে।",
  "the zip file could not be generated.": "ZIP ফাইল তৈরি করা যায়নি।",
  "tool link copied to clipboard.": "টুলের লিংক কপি করা হয়েছে।",
  "sharing is not available in this browser.": "এই ব্রাউজারে শেয়ার করার সুবিধা নেই।",
  "the tool link could not be shared.": "টুলের লিংক শেয়ার করা যায়নি।",
  "images compressed successfully": "ছবিগুলো সফলভাবে সংকুচিত হয়েছে",
  "one or more images could not be processed.": "এক বা একাধিক ছবি প্রক্রিয়াকরণ করা যায়নি।",
  "compress images quickly in your browser.": "ব্রাউজারেই দ্রুত ছবির আকার কমান।",
  "add an input to get started": "শুরু করতে একটি ছবি যোগ করুন",
  "nid joiner": "NID ছবি একত্র করার টুল",
  "turn nid card front and back photos into a clean a4 pdf — all in your browser.": "NID কার্ডের সামনের ও পেছনের ছবি একসঙ্গে সাজিয়ে A4 PDF তৈরি করুন—সব কাজই হবে আপনার ব্রাউজারে।",
  "remove background": "ছবির ব্যাকগ্রাউন্ড সরান",
  "erase portrait, product, or logo backgrounds in your browser — download a transparent png.": "ব্রাউজারেই ব্যক্তি, পণ্য বা লোগোর ছবির ব্যাকগ্রাউন্ড সরিয়ে স্বচ্ছ PNG ডাউনলোড করুন।",
  "passport joiner": "পাসপোর্টের ছবি একত্র করার টুল",
  "turn passport front and back page photos into a clean a4 pdf — icao 88×125 mm layout, all in your browser.": "পাসপোর্টের সামনের ও পেছনের পৃষ্ঠার ছবি এক পাতার পরিষ্কার A4 PDF-এ সাজান—ICAO-এর ৮৮×১২৫ মিমি বিন্যাসে, ব্রাউজারেই।",
  "saving": "সংরক্ষণ করা হচ্ছে",
};

function normalizeImageSizeText(value: string): string {
  return value.replace(/\\r\\n/g, " ").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function translateImageSizeText(
  value: unknown,
  locale: string | undefined,
  baseL?: (value: string) => string,
): string {
  const raw = String(value ?? "");
  if (!locale || !String(locale).toLowerCase().startsWith("bn") || !/[A-Za-z]/.test(raw)) return raw;
  const key = normalizeImageSizeText(raw);
  const exact = IMAGE_SIZE_BN[key];
  if (exact !== undefined) return exact;

  let match = /^(\d+)\s+file\(s\) added$/i.exec(key);
  if (match) return `${match[1]}টি ফাইল যোগ করা হয়েছে`;
  match = /^(\d+)\s+image\(s\) ready for compression$/i.exec(key);
  if (match) return `${match[1]}টি ছবি সংকুচিত করার জন্য প্রস্তুত`;
  match = /^processing images…\s*(\d+)%$/i.exec(raw.trim());
  if (match) return `ছবি প্রক্রিয়াকরণ হচ্ছে… ${match[1]}%`;
  match = /^processing images\.\.\.\s*(\d+)%$/i.exec(raw.trim());
  if (match) return `ছবি প্রক্রিয়াকরণ হচ্ছে… ${match[1]}%`;
  match = /^(\d+)\s+image\(s\) compressed successfully\.$/i.exec(key);
  if (match) return `${match[1]}টি ছবি সফলভাবে সংকুচিত হয়েছে।`;
  match = /^(\d+) image\(s\) added\. (\d+) unsupported file\(s\) were skipped\.$/i.exec(key);
  if (match) return `${match[1]}টি ছবি যোগ করা হয়েছে। সমর্থিত নয় এমন ${match[2]}টি ফাইল বাদ দেওয়া হয়েছে।`;
  match = /^click or scan qr code to upload \((.+)\)$/i.exec(key);
  if (match) return `আপলোড করতে ক্লিক করুন অথবা QR কোড স্ক্যান করুন (${match[1]})`;

  // Prefer a complete translation from the shared dictionary; reject mixed-language results.
  const translated = baseL ? baseL(raw) : raw;
  if (translated && translated !== raw && /[\u0980-\u09FF]/.test(translated)) {
    const technicalStripped = translated.replace(/JPG|PNG|WebP|AVIF|EXIF|ZIP|NID|MB|GB|KB|B|px|4K|2K|HD|Full HD/gi, "");
    if (!/[A-Za-z]/.test(technicalStripped)) return translated.trim();
  }
  return raw;
}

function ImageSizeT({ children }: { children: React.ReactNode }) {
  const { locale, L } = useSebaLagbeToolsI18n();
  if (typeof children !== "string") return <>{children}</>;
  return <>{translateImageSizeText(children, locale, L)}</>;
}

export default function ImageSizeReducer() {
    const { L, locale } = useSebaLagbeToolsI18n();
    const IL = useCallback((value: string) => translateImageSizeText(value, locale, L), [locale, L]);
    const [quality, setQuality] = useState<number>(75);
    const [maxDimension, setMaxDimension] = useState<string>("Keep original size");
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
    const [compressedResults, setCompressedResults] = useState<CompressedResult[]>([]);
    const [isCompressed, setIsCompressed] = useState<boolean>(false);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>("");
    const [toastType, setToastType] = useState<"success" | "error">("success");
    const [compressionProgress, setCompressionProgress] = useState<number>(0);
    const [isApplyingEdit, setIsApplyingEdit] = useState<boolean>(false);
    // Lightbox / Editing State
    const [activeCompareIndex, setActiveCompareIndex] = useState<number | null>(null);
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editSettings, setEditSettings] = useState({
        brightness: 100,
        contrast: 100,
        saturation: 100,
    });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Production safety refs:
    // - Track every Object URL we create so nothing is leaked.
    // - Abort long-running compression on reset/unmount.
    // - Prevent files from being changed while a batch is processing.
    // - Keep result state in sync when new files are added.
    const objectUrlsRef = useRef<Set<string>>(new Set());
    const compressionAbortControllerRef = useRef<AbortController | null>(null);
    const isCompressingRef = useRef<boolean>(false);
    const compressedResultsRef = useRef<CompressedResult[]>([]);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const outputMimeSupportCacheRef = useRef<Map<string, boolean>>(new Map());
    const dimensionOptions = [
        "Keep original size",
        "3840px (4K)",
        "2560px (2K)",
        "1920px (Full HD)",
        "1280px (HD)",
        "1024px",
        "800px",
    ];
    const formatFileSize = useCallback((bytes: number): string => {
        if (!Number.isFinite(bytes) || bytes <= 0)
            return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }, []);
    const safeRevoke = useCallback((url: string | undefined | null) => {
        if (!url || !url.startsWith("blob:"))
            return;
        try {
            URL.revokeObjectURL(url);
        }
        finally {
            objectUrlsRef.current.delete(url);
        }
    }, []);
    const createPreviewUrl = useCallback((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        objectUrlsRef.current.add(url);
        return url;
    }, []);
    const showNotification = useCallback((message: string, type: "success" | "error" = "success") => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        toastTimerRef.current = setTimeout(() => {
            setShowToast(false);
            toastTimerRef.current = null;
        }, type === "error" ? 6000 : 4000);
    }, []);
    useEffect(() => {
        compressedResultsRef.current = compressedResults;
    }, [compressedResults]);
    useEffect(() => {
        isCompressingRef.current = isCompressing;
    }, [isCompressing]);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)) {
                setIsDimensionOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    // Keep browser resources clean even if the user leaves the page mid-process.
    useEffect(() => {
        return () => {
            compressionAbortControllerRef.current?.abort();
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
            objectUrlsRef.current.forEach((url) => {
                try {
                    URL.revokeObjectURL(url);
                }
                catch {
                    // Ignore browser cleanup errors.
                }
            });
            objectUrlsRef.current.clear();
        };
    }, []);
    // Lock page scrolling while the before/after viewer is open and support Escape.
    useEffect(() => {
        if (activeCompareIndex === null)
            return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeCompareModal();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [activeCompareIndex]);
    const getMaxDimensionLimit = useCallback((dimStr: string): number => {
        if (dimStr.includes("3840"))
            return 3840;
        if (dimStr.includes("2560"))
            return 2560;
        if (dimStr.includes("1920"))
            return 1920;
        if (dimStr.includes("1280"))
            return 1280;
        if (dimStr.includes("1024"))
            return 1024;
        if (dimStr.includes("800"))
            return 800;
        return Infinity;
    }, []);
    const getFileMimeType = useCallback((file: File): string => {
        const normalizedType = file.type.toLowerCase();
        if (normalizedType === "image/jpg")
            return "image/jpeg";
        if (normalizedType === "image/jpeg")
            return "image/jpeg";
        if (normalizedType === "image/png")
            return "image/png";
        if (normalizedType === "image/webp")
            return "image/webp";
        const extension = file.name.split(".").pop()?.toLowerCase();
        if (extension === "jpg" || extension === "jpeg")
            return "image/jpeg";
        if (extension === "png")
            return "image/png";
        if (extension === "webp")
            return "image/webp";
        return normalizedType;
    }, []);
    const normalizeInputFile = useCallback((file: File): File => {
        const detectedType = getFileMimeType(file);
        if (detectedType && detectedType !== file.type) {
            return new File([file], file.name, {
                type: detectedType,
                lastModified: file.lastModified,
            });
        }
        return file;
    }, [getFileMimeType]);
    const sanitizeFilename = useCallback((name: string): string => {
        const sanitized = name
            .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/[. ]+$/g, "");
        return sanitized || "image";
    }, []);
    const getExtensionForMimeType = useCallback((mimeType: string): string => {
        const extMap: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/avif": ".avif",
        };
        return extMap[mimeType] || ".jpg";
    }, []);
    const getOutputFormatMimeType = useCallback((file: File, format: string): string => {
        if (format === "JPG")
            return "image/jpeg";
        if (format === "PNG")
            return "image/png";
        if (format === "WebP")
            return "image/webp";
        if (format === "AVIF")
            return "image/avif";
        const originalMimeType = getFileMimeType(file);
        if (originalMimeType === "image/jpeg" ||
            originalMimeType === "image/png" ||
            originalMimeType === "image/webp") {
            return originalMimeType;
        }
        return "image/jpeg";
    }, [getFileMimeType]);
    const canEncodeMimeType = useCallback(async (mimeType: string): Promise<boolean> => {
        if (outputMimeSupportCacheRef.current.has(mimeType)) {
            return outputMimeSupportCacheRef.current.get(mimeType) ?? false;
        }
        if (mimeType === "image/jpeg" || mimeType === "image/png") {
            outputMimeSupportCacheRef.current.set(mimeType, true);
            return true;
        }
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const supported = await new Promise<boolean>((resolve) => {
            canvas.toBlob((blob) => {
                resolve(Boolean(blob && blob.type === mimeType));
            }, mimeType, 0.8);
        });
        outputMimeSupportCacheRef.current.set(mimeType, supported);
        return supported;
    }, []);
    const resolveOutputMimeType = useCallback(async (file: File, format: string): Promise<string> => {
        const requestedMimeType = getOutputFormatMimeType(file, format);
        if (await canEncodeMimeType(requestedMimeType)) {
            return requestedMimeType;
        }
        // AVIF encoding is not available in every browser. WebP is the safest
        // modern fallback and is widely supported.
        if (requestedMimeType === "image/avif" &&
            (await canEncodeMimeType("image/webp"))) {
            return "image/webp";
        }
        return "image/jpeg";
    }, [canEncodeMimeType, getOutputFormatMimeType]);
    const getImageDimensions = useCallback((fileOrBlob: Blob): Promise<{
        width: number;
        height: number;
    }> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(fileOrBlob);
            img.decoding = "async";
            img.onload = () => {
                const width = img.naturalWidth || img.width;
                const height = img.naturalHeight || img.height;
                URL.revokeObjectURL(url);
                if (!width || !height) {
                    reject(new Error("Unable to determine image dimensions."));
                    return;
                }
                resolve({ width, height });
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("The processed image could not be decoded."));
            };
            img.src = url;
        });
    }, []);
    const applyCanvasFiltersToFile = useCallback((file: File, filters: {
        brightness: number;
        contrast: number;
        saturation: number;
    }, targetMimeType: string, qualityPercent: number, signal?: AbortSignal): Promise<File> => {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) {
                reject(new DOMException("Operation aborted.", "AbortError"));
                return;
            }
            const img = new Image();
            const url = URL.createObjectURL(file);
            const cleanup = () => {
                URL.revokeObjectURL(url);
            };
            img.decoding = "async";
            img.onload = () => {
                if (signal?.aborted) {
                    cleanup();
                    reject(new DOMException("Operation aborted.", "AbortError"));
                    return;
                }
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    cleanup();
                    reject(new Error("Canvas rendering is not available in this browser."));
                    return;
                }
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                // JPEG does not support transparency, so use a white background.
                if (targetMimeType === "image/jpeg") {
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    cleanup();
                    if (!blob) {
                        reject(new Error("The browser could not encode the edited image."));
                        return;
                    }
                    if (signal?.aborted) {
                        reject(new DOMException("Operation aborted.", "AbortError"));
                        return;
                    }
                    resolve(new File([blob], file.name, {
                        type: blob.type || targetMimeType,
                        lastModified: Date.now(),
                    }));
                }, targetMimeType, targetMimeType === "image/png"
                    ? undefined
                    : Math.min(1, Math.max(0.01, qualityPercent / 100)));
            };
            img.onerror = () => {
                cleanup();
                reject(new Error("The source image could not be loaded for editing."));
            };
            img.src = url;
        });
    }, []);
    const compressSingleImage = useCallback(async (file: File, settings: {
        quality: number;
        maxDimension: string;
        preserveExif: boolean;
        keepOriginalName: boolean;
        outputFormat: string;
        signal: AbortSignal;
    }, appliedFilters?: {
        brightness: number;
        contrast: number;
        saturation: number;
    }, onProgress?: (progress: number) => void): Promise<CompressedResult> => {
        if (settings.signal.aborted) {
            throw new DOMException("Compression cancelled.", "AbortError");
        }
        const normalizedFile = normalizeInputFile(file);
        const mimeType = await resolveOutputMimeType(normalizedFile, settings.outputFormat);
        let fileToCompress = normalizedFile;
        if (appliedFilters) {
            fileToCompress = await applyCanvasFiltersToFile(normalizedFile, appliedFilters, mimeType, settings.quality, settings.signal);
        }
        if (settings.signal.aborted) {
            throw new DOMException("Compression cancelled.", "AbortError");
        }
        const maxLimit = getMaxDimensionLimit(settings.maxDimension);
        const options = {
            // This is a safety ceiling, not the quality control itself.
            // Quality and optional max dimensions still drive the actual output.
            maxSizeMB: 20,
            ...(maxLimit < Infinity ? { maxWidthOrHeight: maxLimit } : {}),
            initialQuality: mimeType === "image/png"
                ? 1
                : Math.min(1, Math.max(0.01, settings.quality / 100)),
            useWebWorker: true,
            preserveExif: settings.preserveExif &&
                mimeType === "image/jpeg" &&
                getFileMimeType(normalizedFile) === "image/jpeg",
            fileType: mimeType,
            alwaysKeepResolution: maxLimit === Infinity,
            maxIteration: 10,
            signal: settings.signal,
            // Keep this explicitly defined for worker compatibility.
            onProgress: (progress: number) => {
                onProgress?.(Math.max(0, Math.min(100, progress)));
            },
        };
        const compressedFile = await imageCompression(fileToCompress, options);
        if (settings.signal.aborted) {
            throw new DOMException("Compression cancelled.", "AbortError");
        }
        const actualMimeType = compressedFile.type || mimeType;
        const dimensions = await getImageDimensions(compressedFile);
        const lastDotIndex = normalizedFile.name.lastIndexOf(".");
        const nameWithoutExt = lastDotIndex > 0
            ? normalizedFile.name.substring(0, lastDotIndex)
            : normalizedFile.name;
        const safeBaseName = sanitizeFilename(nameWithoutExt);
        const ext = getExtensionForMimeType(actualMimeType);
        const newName = settings.keepOriginalName
            ? `${safeBaseName}${ext}`
            : `${safeBaseName}-compressed${ext}`;
        const finalFile = new File([compressedFile], newName, {
            type: actualMimeType,
            lastModified: Date.now(),
        });
        const previewUrl = createPreviewUrl(finalFile);
        const reductionPercentage = normalizedFile.size > 0
            ? Math.round(((normalizedFile.size - finalFile.size) / normalizedFile.size) *
                100)
            : 0;
        return {
            file: finalFile,
            blob: finalFile,
            previewUrl,
            originalSize: normalizedFile.size,
            compressedSize: finalFile.size,
            reductionPercentage: Math.max(0, reductionPercentage),
            width: dimensions.width,
            height: dimensions.height,
            name: newName,
            mimeType: actualMimeType,
        };
    }, [
        applyCanvasFiltersToFile,
        createPreviewUrl,
        getExtensionForMimeType,
        getFileMimeType,
        getMaxDimensionLimit,
        normalizeInputFile,
        resolveOutputMimeType,
        sanitizeFilename,
        getImageDimensions,
    ]);
    const handleFiles = useCallback((files: FileList | File[]) => {
        if (isCompressingRef.current || isApplyingEdit) {
            showNotification("Please wait until the current processing is finished.", "error");
            return;
        }
        const incomingFiles = Array.from(files);
        const validFiles: File[] = [];
        let rejectedCount = 0;
        incomingFiles.forEach((file) => {
            const detectedType = getFileMimeType(file);
            if (file.size <= 0 ||
                !["image/jpeg", "image/png", "image/webp"].includes(detectedType)) {
                rejectedCount += 1;
                return;
            }
            validFiles.push(normalizeInputFile(file));
        });
        if (validFiles.length === 0) {
            showNotification("Please select JPG, PNG, or WebP image files.", "error");
            return;
        }
        // Adding new files invalidates the current compressed result set.
        compressedResultsRef.current.forEach((res) => safeRevoke(res.previewUrl));
        compressedResultsRef.current = [];
        setCompressedResults([]);
        setIsCompressed(false);
        setCompressionProgress(0);
        setSelectedFiles((prev) => [...prev, ...validFiles]);
        setPreviews((prev) => [
            ...prev,
            ...validFiles.map((file) => createPreviewUrl(file)),
        ]);
        if (rejectedCount > 0) {
            showNotification(`${validFiles.length} image(s) added. ${rejectedCount} unsupported file(s) were skipped.`, "error");
        }
    }, [
        createPreviewUrl,
        getFileMimeType,
        normalizeInputFile,
        safeRevoke,
        showNotification,
    ]);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            handleFiles(e.target.files);
        }
        // Allows selecting the same file again after removing it.
        e.target.value = "";
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length) {
            handleFiles(e.dataTransfer.files);
        }
    };
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (e.clipboardData?.files?.length) {
                handleFiles(e.clipboardData.files);
            }
        };
        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [handleFiles]);
    const handleRemoveImage = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (isCompressingRef.current || isApplyingEdit)
            return;
        safeRevoke(previews[index]);
        const resultToRemove = compressedResultsRef.current[index];
        if (resultToRemove) {
            safeRevoke(resultToRemove.previewUrl);
        }
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
        setCompressedResults((prev) => {
            const next = prev.filter((_, i) => i !== index);
            compressedResultsRef.current = next;
            return next;
        });
        if (selectedFiles.length <= 1) {
            setIsCompressed(false);
            setCompressionProgress(0);
        }
    };
    const handleReset = useCallback(() => {
        compressionAbortControllerRef.current?.abort();
        compressionAbortControllerRef.current = null;
        isCompressingRef.current = false;
        previews.forEach(safeRevoke);
        compressedResultsRef.current.forEach((res) => safeRevoke(res.previewUrl));
        objectUrlsRef.current.forEach((url) => safeRevoke(url));
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
            toastTimerRef.current = null;
        }
        setSelectedFiles([]);
        setPreviews([]);
        setCompressedResults([]);
        compressedResultsRef.current = [];
        setIsCompressed(false);
        setIsDragging(false);
        setIsCompressing(false);
        setIsApplyingEdit(false);
        setCompressionProgress(0);
        setQuality(75);
        setMaxDimension("Keep original size");
        setPreserveExif(false);
        setKeepOriginalName(false);
        setOutputFormat("Original");
        setIsDimensionOpen(false);
        setShowToast(false);
        setToastMessage("");
    }, [previews, safeRevoke]);
    const closeCompareModal = useCallback(() => {
        setActiveCompareIndex(null);
        setIsEditing(false);
        setEditSettings({ brightness: 100, contrast: 100, saturation: 100 });
    }, []);
    const runCompression = useCallback(async (files: File[], settings: {
        quality: number;
        maxDimension: string;
        preserveExif: boolean;
        keepOriginalName: boolean;
        outputFormat: string;
        signal: AbortSignal;
    }) => {
        const results: CompressedResult[] = [];
        for (let index = 0; index < files.length; index += 1) {
            if (settings.signal.aborted) {
                throw new DOMException("Compression cancelled.", "AbortError");
            }
            const currentFile = files[index];
            setCompressionProgress(Math.round((index / Math.max(1, files.length)) * 100));
            try {
                const result = await compressSingleImage(currentFile, settings, undefined, (fileProgress) => {
                    const overallProgress = ((index + fileProgress / 100) / files.length) * 100;
                    setCompressionProgress(Math.round(Math.max(0, Math.min(100, overallProgress))));
                });
                results.push(result);
            }
            catch (error) {
                // Prevent already-generated previews from leaking when the batch fails.
                results.forEach((result) => safeRevoke(result.previewUrl));
                throw error;
            }
        }
        setCompressionProgress(100);
        return results;
    }, [compressSingleImage, safeRevoke]);
    const handleCompress = async () => {
        if (selectedFiles.length === 0 || isCompressingRef.current)
            return;
        const filesToCompress = [...selectedFiles];
        // Abort an old operation before starting a new one.
        compressionAbortControllerRef.current?.abort();
        const controller = new AbortController();
        compressionAbortControllerRef.current = controller;
        setIsCompressing(true);
        isCompressingRef.current = true;
        setCompressionProgress(0);
        setShowToast(false);
        compressedResultsRef.current.forEach((res) => safeRevoke(res.previewUrl));
        compressedResultsRef.current = [];
        setCompressedResults([]);
        setIsCompressed(false);
        const settingsSnapshot = {
            quality,
            maxDimension,
            preserveExif,
            keepOriginalName,
            outputFormat,
            signal: controller.signal,
        };
        try {
            const results = await runCompression(filesToCompress, settingsSnapshot);
            if (controller.signal.aborted)
                return;
            compressedResultsRef.current = results;
            setCompressedResults(results);
            setIsCompressed(true);
            setCompressionProgress(100);
            showNotification(`${results.length} image(s) compressed successfully.`, "success");
        }
        catch (error) {
            if (controller.signal.aborted)
                return;
            console.error("Compression error:", error);
            setCompressionProgress(0);
            const message = error instanceof Error && error.message
                ? error.message
                : "One or more images could not be processed.";
            showNotification(message, "error");
        }
        finally {
            if (compressionAbortControllerRef.current === controller) {
                compressionAbortControllerRef.current = null;
            }
            if (!controller.signal.aborted) {
                setIsCompressing(false);
                isCompressingRef.current = false;
            }
        }
    };
    const handleApplyEditing = async () => {
        if (activeCompareIndex === null ||
            !selectedFiles[activeCompareIndex] ||
            isApplyingEdit ||
            isCompressingRef.current) {
            return;
        }
        const fileIndex = activeCompareIndex;
        const sourceFile = selectedFiles[fileIndex];
        compressionAbortControllerRef.current?.abort();
        const controller = new AbortController();
        compressionAbortControllerRef.current = controller;
        setIsApplyingEdit(true);
        setIsCompressing(true);
        isCompressingRef.current = true;
        setCompressionProgress(0);
        try {
            const updatedResult = await compressSingleImage(sourceFile, {
                quality,
                maxDimension,
                preserveExif,
                keepOriginalName,
                outputFormat,
                signal: controller.signal,
            }, editSettings, (progress) => setCompressionProgress(progress));
            if (controller.signal.aborted)
                return;
            const previousResult = compressedResultsRef.current[fileIndex];
            if (previousResult) {
                safeRevoke(previousResult.previewUrl);
            }
            setCompressedResults((prev) => {
                const next = [...prev];
                next[fileIndex] = updatedResult;
                compressedResultsRef.current = next;
                return next;
            });
            setIsCompressed(true);
            setIsEditing(false);
            setCompressionProgress(100);
            setEditSettings({ brightness: 100, contrast: 100, saturation: 100 });
            showNotification("Edits applied successfully.", "success");
        }
        catch (error) {
            if (controller.signal.aborted)
                return;
            console.error("Editing error:", error);
            const message = error instanceof Error && error.message
                ? error.message
                : "The edited image could not be saved.";
            showNotification(message, "error");
        }
        finally {
            if (compressionAbortControllerRef.current === controller) {
                compressionAbortControllerRef.current = null;
            }
            setIsApplyingEdit(false);
            setIsCompressing(false);
            isCompressingRef.current = false;
            setCompressionProgress(0);
        }
    };
    const handleDownloadSingle = useCallback((res: CompressedResult) => {
        try {
            const downloadUrl = URL.createObjectURL(res.file);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = res.name;
            a.rel = "noopener";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
        }
        catch (error) {
            console.error("Download error:", error);
            showNotification("The image could not be downloaded.", "error");
        }
    }, [showNotification]);
    const getUniqueZipName = useCallback((name: string, usedNames: Set<string>): string => {
        const safeName = sanitizeFilename(name);
        if (!usedNames.has(safeName)) {
            usedNames.add(safeName);
            return safeName;
        }
        const dotIndex = safeName.lastIndexOf(".");
        const base = dotIndex > 0 ? safeName.slice(0, dotIndex) : safeName;
        const extension = dotIndex > 0 ? safeName.slice(dotIndex) : "";
        let counter = 2;
        let candidate = `${base} (${counter})${extension}`;
        while (usedNames.has(candidate)) {
            counter += 1;
            candidate = `${base} (${counter})${extension}`;
        }
        usedNames.add(candidate);
        return candidate;
    }, [sanitizeFilename]);
    const handleDownloadAll = async () => {
        if (compressedResults.length === 0 || isZipping)
            return;
        if (compressedResults.length === 1) {
            handleDownloadSingle(compressedResults[0]);
            return;
        }
        setIsZipping(true);
        try {
            const zip = new JSZip();
            const usedNames = new Set<string>();
            compressedResults.forEach((res) => {
                const zipName = getUniqueZipName(res.name, usedNames);
                zip.file(zipName, res.file, {
                    binary: true,
                });
            });
            const zipBlob = await zip.generateAsync({
                type: "blob",
                compression: "STORE",
            });
            const zipUrl = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = zipUrl;
            a.download = "compressed_images.zip";
            a.rel = "noopener";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.setTimeout(() => URL.revokeObjectURL(zipUrl), 1500);
            showNotification("ZIP downloaded successfully.", "success");
        }
        catch (error) {
            console.error("ZIP generation error:", error);
            showNotification("The ZIP file could not be generated.", "error");
        }
        finally {
            setIsZipping(false);
        }
    };
    const handleShare = useCallback(async () => {
        try {
            const shareData = {
                title: IL("Image Size Reducer"),
                text: IL("Compress images quickly in your browser."),
                url: window.location.href,
            };
            if (navigator.share) {
                await navigator.share(shareData);
                return;
            }
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(window.location.href);
                showNotification("Tool link copied to clipboard.", "success");
                return;
            }
            showNotification("Sharing is not available in this browser.", "error");
        }
        catch (error) {
            // Browsers throw AbortError when the user closes the native share sheet.
            if (error instanceof DOMException && error.name === "AbortError")
                return;
            console.error("Share error:", error);
            showNotification("The tool link could not be shared.", "error");
        }
    }, [showNotification, IL]);
    return (<div id="image-size-reducer-tool" className="w-full space-y-5 text-[#3B2F1E] font-sans pb-32 sm:pb-24 relative isolate">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        #image-size-reducer-tool {
          isolation: isolate;
          color: #3B2F1E;
        }
        #image-size-reducer-tool::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: linear-gradient(180deg, #E9DDC3 0%, #EFE5CE 100%);
        }
        #image-size-reducer-tool,
        #image-size-reducer-tool *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        #image-size-reducer-tool h1,
        #image-size-reducer-tool h2,
        #image-size-reducer-tool h3,
        #image-size-reducer-tool h4 {
          letter-spacing: -0.01em;
        }
        #image-size-reducer-tool h1 { font-size: 24px; line-height: 1.3; }
        #image-size-reducer-tool h2 { font-size: 18px; line-height: 1.4; }
        #image-size-reducer-tool h3 { font-size: 17px; line-height: 1.4; }
        #image-size-reducer-tool h4 { font-size: 16px; line-height: 1.4; }
        #image-size-reducer-tool button:not(:disabled) { font-size: max(15px, 1em); }
        #image-size-reducer-tool label { font-size: max(15px, 1em); }
        #image-size-reducer-tool p { font-size: max(13px, 0.92em); line-height: 1.55; }
        #image-size-reducer-tool .font-mono,
        #image-size-reducer-tool .font-mono * {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
          font-size: max(14px, 1em);
        }
        #image-size-reducer-tool a[href],
        #image-size-reducer-tool button:not(:disabled),
        #image-size-reducer-tool label:has(input[type="file"]),
        #image-size-reducer-tool [role="button"],
        #image-size-reducer-tool select,
        #image-size-reducer-tool input[type="color"],
        #image-size-reducer-tool input[type="range"],
        #image-size-reducer-tool input[type="checkbox"],
        #image-size-reducer-tool input[type="radio"],
        #image-size-reducer-tool input[type="file"] {
          cursor: pointer;
        }
        #image-size-reducer-tool button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        #image-size-reducer-tool input[type="range"] { accent-color: #DC2626; }
        #image-size-reducer-tool button:not(:disabled),
        #image-size-reducer-tool a[href] {
          transition-duration: 180ms;
        }
        #image-size-reducer-tool button:not(:disabled):active,
        #image-size-reducer-tool a[href]:active {
          transform: scale(0.98);
        }
        #image-size-reducer-tool button:focus-visible,
        #image-size-reducer-tool a[href]:focus-visible,
        #image-size-reducer-tool [role="button"]:focus-visible {
          outline: 2px solid rgba(220, 38, 38, 0.45);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          #image-size-reducer-tool *,
          #image-size-reducer-tool *::before,
          #image-size-reducer-tool *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
      {/* Toast Notification */}
      {showToast && (<div className={`fixed top-5 right-5 max-w-sm px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 z-[70] animate-in fade-in slide-in-from-top-2 ${toastType === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"}`} role="status" aria-live="polite">
          <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 ${toastType === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
            {toastType === "success" ? (<CheckCircle2 size={16}/>) : (<X size={16}/>)}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold">
              {toastType === "success" ? <ImageSizeT>{"Success"}</ImageSizeT> : <ImageSizeT>{"Unable to complete"}</ImageSizeT>}
            </p>
            <p className={`text-[13px] font-medium break-words ${toastType === "success" ? "text-emerald-600" : "text-red-600"}`}>
              <ImageSizeT>{toastMessage}</ImageSizeT>
            </p>
          </div>

          <button onClick={() => setShowToast(false)} className="ml-2 text-[#7A6A50] hover:text-[#5A4A32] cursor-pointer shrink-0" aria-label={IL("Close notification")}>
            <X size={14}/>
          </button>
        </div>)}

      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="hidden"/>

      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-[#7A6A50]">
        <Link className="flex items-center gap-1 hover:text-[#3B2F1E] transition-colors cursor-pointer" href="/sohoj-tools">
          <ArrowLeft size={14}/>
          <span><ImageSizeT>{"Back to Tools"}</ImageSizeT></span>
        </Link>
        <span><ImageSizeT>{"/"}</ImageSizeT></span>
        <span><ImageSizeT>{"Image Tools"}</ImageSizeT></span>
        <span><ImageSizeT>{"/"}</ImageSizeT></span>
        <span className="font-semibold text-[#3B2F1E]"><ImageSizeT>{"Image Size Reducer"}</ImageSizeT></span>
      </div>

      {/* Header Card */}
      <div className="bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#F6EEDB] text-[#DC2626] rounded-xl flex items-center justify-center shrink-0 border border-[#E3D6B8]">
            <ImageIcon size={24}/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#3B2F1E] min-w-0"><ImageSizeT>{"Image Size Reducer\n              "}</ImageSizeT></h1>
              <span className="bg-emerald-100 text-emerald-700 text-[12px] font-bold px-2 py-0.5 rounded-full"><ImageSizeT>{"Free\n              "}</ImageSizeT></span>
            </div>
            <p className="text-sm text-[#7A6A50] font-medium mt-0.5"><ImageSizeT>{"Shrink JPG, PNG, and WebP photos in your browser \u2014 quality stays\n              sharp.\n            "}</ImageSizeT></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-[#7A6A50] hover:text-[#5A4A32] bg-[#F6EEDB] hover:bg-[#F3E9D2] rounded-xl transition-all border border-[#E3D6B8] cursor-pointer">
            <Star size={16}/>
          </button>
          <button onClick={handleShare} title={IL("Share this tool")} aria-label={IL("Share this tool")} className="p-2 text-[#7A6A50] hover:text-[#5A4A32] bg-[#F6EEDB] hover:bg-[#F3E9D2] rounded-xl transition-all border border-[#E3D6B8] cursor-pointer">
            <Share2 size={16}/>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Controls Box */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quality Slider */}
          <div className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#3B2F1E]"><ImageSizeT>{"Quality"}</ImageSizeT></label>
              <span className="text-sm font-bold text-[#3B2F1E]">
                {quality}<ImageSizeT>{"%\n              "}</ImageSizeT></span>
            </div>
            <input type="range" min="1" max="100" value={quality} onChange={(e) => {
            setQuality(Number(e.target.value));
            setIsCompressed(false);
        }} className="w-full accent-[#DC2626] bg-[#E3D6B8] rounded-lg h-2 cursor-pointer"/>
            <p className="text-[12px] text-[#7A6A50] font-medium">
              {outputFormat === "PNG"
        ? <ImageSizeT>{"PNG is lossless; quality has little effect on size."}</ImageSizeT> : <ImageSizeT>{"Lower quality = smaller file size"}</ImageSizeT>}
            </p>
          </div>

          {/* Max Dimension Dropdown */}
          <div className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs space-y-2 relative" ref={dropdownRef}>
            <label className="text-sm font-bold text-[#3B2F1E] block"><ImageSizeT>{"Max dimension\n            "}</ImageSizeT></label>
            <div onClick={() => setIsDimensionOpen(!isDimensionOpen)} className="w-full flex items-center justify-between p-2.5 bg-[#FBF6E8] border border-[#E3D6B8] rounded-xl text-sm font-medium text-[#3B2F1E] cursor-pointer hover:border-[#DC2626] transition-all shadow-xs">
              <span><ImageSizeT>{maxDimension}</ImageSizeT></span>
              <ChevronDown size={16} className={`text-[#7A6A50] transition-transform ${isDimensionOpen ? "rotate-180" : ""}`}/>
            </div>

            {isDimensionOpen && (<div className="absolute left-4 right-4 top-20 bg-[#FBF6E8] border border-[#E3D6B8] rounded-xl shadow-lg z-20 overflow-hidden py-1">
                {dimensionOptions.map((opt) => (<div key={opt} onClick={() => {
                    setMaxDimension(opt);
                    setIsDimensionOpen(false);
                    setIsCompressed(false);
                }} className={`px-3 py-2 text-sm font-medium cursor-pointer transition-colors ${maxDimension === opt
                    ? "bg-[#F6EEDB] text-[#DC2626] font-bold"
                    : "text-[#3B2F1E] hover:bg-[#F6EEDB]"}`}>
                    <ImageSizeT>{opt}</ImageSizeT>
                  </div>))}
              </div>)}

            <p className="text-[12px] text-[#7A6A50] font-medium"><ImageSizeT>{"Images larger than this will be resized\n            "}</ImageSizeT></p>
          </div>

          {/* Preserve EXIF */}
          <div className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-bold text-[#3B2F1E] block"><ImageSizeT>{"Preserve EXIF\n              "}</ImageSizeT></label>
              <p className="text-[12px] text-[#7A6A50] font-medium"><ImageSizeT>{"Keep camera & location data\n              "}</ImageSizeT></p>
            </div>
            <button onClick={() => {
            setPreserveExif(!preserveExif);
            setIsCompressed(false);
        }} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${preserveExif ? "bg-[#DC2626]" : "bg-[#E3D6B8]"}`}>
              <div className={`bg-[#FBF6E8] w-4 h-4 rounded-full shadow-md transform transition-transform ${preserveExif ? "translate-x-5" : "translate-x-0"}`}/>
            </button>
          </div>

          {/* Keep original name */}
          <div className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-bold text-[#3B2F1E] block"><ImageSizeT>{"Keep original name\n              "}</ImageSizeT></label>
              <p className="text-[12px] text-[#7A6A50] font-medium"><ImageSizeT>{"Don't add the \"-compressed\" suffix\n              "}</ImageSizeT></p>
            </div>
            <button onClick={() => {
            setKeepOriginalName(!keepOriginalName);
            setIsCompressed(false);
        }} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${keepOriginalName ? "bg-[#DC2626]" : "bg-[#E3D6B8]"}`}>
              <div className={`bg-[#FBF6E8] w-4 h-4 rounded-full shadow-md transform transition-transform ${keepOriginalName ? "translate-x-5" : "translate-x-0"}`}/>
            </button>
          </div>

          {/* Output Format */}
          <div className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs space-y-2">
            <label className="text-sm font-bold text-[#3B2F1E] block"><ImageSizeT>{"Output format\n            "}</ImageSizeT></label>
            <div className="grid grid-cols-5 gap-1.5 bg-[#F6EEDB]/80 p-1 rounded-xl border border-[#E3D6B8]">
              {[
            { name: "Original", icon: Crop },
            { name: "JPG", icon: FileText },
            { name: "PNG", icon: ImageIcon },
            { name: "WebP", icon: Globe },
            { name: "AVIF", icon: Zap },
        ].map((item) => {
            const IconComponent = item.icon;
            return (<button key={item.name} onClick={() => {
                    setOutputFormat(item.name);
                    setIsCompressed(false);
                }} className={`py-2 px-1 rounded-lg text-[12px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${outputFormat === item.name
                    ? "bg-[#FBF6E8] text-[#DC2626] shadow-xs border border-[#E3D6B8]"
                    : "text-[#7A6A50] hover:text-[#3B2F1E]"}`}>
                    <IconComponent size={14}/>
                    <span>{<ImageSizeT>{item.name}</ImageSizeT>}</span>
                  </button>);
        })}
            </div>
          </div>
        </div>

        {/* Right Side: Compression Preview Box */}
        <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`lg:col-span-8 bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs flex flex-col justify-between min-h-[460px] transition-colors ${isDragging ? "bg-[#FEE9E9]/35 border-[#DC2626]" : ""}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#3B2F1E]"><ImageSizeT>{"Compression preview\n            "}</ImageSizeT></h2>
            <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${isCompressed
            ? "bg-emerald-100 text-emerald-700"
            : selectedFiles.length > 0
                ? "bg-[#E3D6B8] text-[#DC2626]"
                : "bg-[#F3E9D2] text-[#7A6A50]"}`}>
              {isCompressed
        ? <ImageSizeT>{"Done"}</ImageSizeT> : selectedFiles.length > 0
        ? <ImageSizeT>{`${selectedFiles.length} file(s) added`}</ImageSizeT>
        : <ImageSizeT>{"Empty"}</ImageSizeT>}
            </span>
          </div>

          {previews.length === 0 ? (<div onClick={() => fileInputRef.current?.click()} className={`rounded-2xl border border-dashed p-8 flex flex-col items-center justify-center my-auto text-center py-24 cursor-pointer transition-all ${isDragging
                ? "border-[#DC2626] bg-[#FEE9E9]/40"
                : "border-[#E3D6B8] bg-[#F6EEDB]/60 hover:border-[#DC2626] hover:bg-[#FEE9E9]/20"}`}>
              <div className="w-10 h-10 bg-[#F6EEDB] text-[#DC2626] rounded-xl flex items-center justify-center mb-3 border border-[#E3D6B8]">
                <Upload size={20}/>
              </div>
              <p className="text-sm font-bold text-[#3B2F1E]"><ImageSizeT>{"Add an image to get started\n              "}</ImageSizeT></p>
              <p className="text-[13px] text-[#7A6A50] mt-1"><ImageSizeT>{"Before and after previews will appear here after processing.\n              "}</ImageSizeT></p>
            </div>) : (<div className="flex flex-wrap gap-4 items-start justify-start overflow-y-auto max-h-[420px] p-1">
              {previews.map((src, index) => {
                const file = selectedFiles[index];
                const compRes = compressedResults[index];
                const displaySrc = isCompressed && compRes ? compRes.previewUrl : src;
                const isClickableForCompare = isCompressed && compRes;
                return (<div key={index} onClick={() => {
                        if (isClickableForCompare) {
                            setZoomLevel(100);
                            setActiveCompareIndex(index);
                        }
                    }} className={`w-44 bg-[#FBF6E8] rounded-2xl border overflow-hidden shadow-xs relative group flex flex-col transition-all ${isCompressed && compRes
                        ? "border-emerald-300 cursor-pointer hover:shadow-md"
                        : "border-[#E3D6B8] cursor-default"}`}>
                    <div className="relative w-full h-40 bg-[#F3E9D2] overflow-hidden">
                      <img src={displaySrc} alt={file?.name || "preview"} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>

                      {isCompressed && compRes && (<>
                          <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[12px] font-bold px-2 py-0.5 rounded-md shadow-xs"><ImageSizeT>{"-"}</ImageSizeT>{compRes.reductionPercentage}<ImageSizeT>{"%\n                          "}</ImageSizeT></span>

                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="bg-black/75 text-white text-[12px] font-bold px-2 py-1 rounded-md backdrop-blur-xs"><ImageSizeT>{"Click to compare\n                            "}</ImageSizeT></span>
                          </div>
                        </>)}

                      <button onClick={(e) => handleRemoveImage(index, e)} disabled={isCompressing} className="absolute top-2 left-2 bg-black/50 hover:bg-black/80 text-white p-1 rounded-md backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100 z-10 cursor-pointer" title={IL("Remove image")}>
                        <X size={12}/>
                      </button>
                    </div>

                    <div className="p-3 bg-[#FBF6E8] flex flex-col justify-center">
                      <p className="text-sm font-bold text-[#3B2F1E] truncate" title={isCompressed && compRes ? compRes.name : file?.name}>
                        {isCompressed && compRes ? compRes.name : file?.name}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        {isCompressed && compRes ? (<div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[12px] font-bold">
                            <span>
                              {formatFileSize(compRes.compressedSize)}
                            </span>
                            <span className="text-emerald-400"><ImageSizeT>{"\u2022"}</ImageSizeT></span>
                            <span>
                              {compRes.width}<ImageSizeT>{"x"}</ImageSizeT>{compRes.height}
                            </span>
                          </div>) : (<span className="text-[12px] text-[#7A6A50] font-medium">
                            {file ? formatFileSize(file.size) : <ImageSizeT>{"0 B"}</ImageSizeT>}
                          </span>)}
                      </div>
                    </div>
                  </div>);
            })}

              <div onClick={() => fileInputRef.current?.click()} className="w-44 h-52 rounded-2xl border-2 border-dashed border-[#E3D6B8] hover:border-[#DC2626] bg-[#FEE9E9]/40 hover:bg-[#FEE9E9]/20 flex flex-col items-center justify-center text-[#7A6A50] hover:text-[#DC2626] cursor-pointer transition-all shrink-0">
                <Plus className="text-[#7A6A50]" size={22}/>
                <span className="text-sm font-semibold text-[#7A6A50] mt-2"><ImageSizeT>{"Add more images\n                "}</ImageSizeT></span>
              </div>
            </div>)}

          <div />
        </div>
      </div>

      {/* Related tools: clear titles and descriptions help users understand each tool */}
      <div className="space-y-3 pt-4">
        <h3 className="text-base font-bold text-[#3B2F1E]"><ImageSizeT>{"Tools in the same category"}</ImageSizeT></h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            {
              name: "NID Joiner",
              description: "Turn NID card front and back photos into a clean A4 PDF — all in your browser.",
              href: "/sohoj-tools/nid-joiner",
              icon: CreditCard,
            },
            {
              name: "Remove Background",
              description: "Erase portrait, product, or logo backgrounds in your browser — download a transparent PNG.",
              href: "/sohoj-tools/remove-background",
              icon: ImageIcon,
            },
            {
              name: "Passport Joiner",
              description: "Turn passport front and back page photos into a clean A4 PDF — ICAO 88×125 mm layout, all in your browser.",
              href: "/sohoj-tools/passport-joiner",
              icon: BookOpen,
            },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.name}
                href={tool.href}
                className="group flex items-start gap-3 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-xs transition-all hover:border-[#D8C9A6] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] text-[#DC2626] transition-colors group-hover:bg-[#FEE9E9]">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#3B2F1E] transition-colors group-hover:text-[#DC2626]">
                    <ImageSizeT>{tool.name}</ImageSizeT>
                  </h4>
                  <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-[#7A6A50]">
                    <ImageSizeT>{tool.description}</ImageSizeT>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FBF6E8]/95 backdrop-blur-md border-t border-[#E3D6B8] p-3 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-30 shadow-lg">
        <div className="flex items-center gap-2 text-sm text-[#7A6A50] min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${isCompressing
            ? "bg-[#DC2626] animate-pulse"
            : isCompressed
                ? "bg-emerald-500"
                : selectedFiles.length > 0
                    ? "bg-[#DC2626]"
                    : "bg-[#D8C9A6]"}`}></span>

          <span className="truncate">
            {isCompressing
        ? <ImageSizeT>{`Processing images… ${compressionProgress}%`}</ImageSizeT> : isCompressed
        ? <ImageSizeT>{"Images compressed successfully"}</ImageSizeT>
        : selectedFiles.length > 0
            ? <ImageSizeT>{`${selectedFiles.length} image(s) ready for compression`}</ImageSizeT>
            : <ImageSizeT>{"Add an input to get started"}</ImageSizeT>}
          </span>

          {isCompressing && (<span className="hidden sm:block w-24 h-1.5 bg-[#E3D6B8] rounded-full overflow-hidden shrink-0">
              <span className="block h-full bg-[#DC2626] transition-all duration-200" style={{ width: `${compressionProgress}%` }}/>
            </span>)}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button onClick={handleReset} className="px-4 py-2 border border-[#E3D6B8] text-[#3B2F1E] text-sm font-bold rounded-xl hover:bg-[#F6EEDB] transition-all cursor-pointer"><ImageSizeT>{"Reset\n          "}</ImageSizeT></button>

          {isCompressed ? (<>
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-[#E3D6B8] text-[#3B2F1E] text-sm font-bold rounded-xl hover:bg-[#F6EEDB] transition-all cursor-pointer flex items-center gap-1.5">
                <RefreshCw size={14}/>
                <span><ImageSizeT>{"Compress more images"}</ImageSizeT></span>
              </button>

              <button disabled={isZipping} onClick={handleDownloadAll} className="px-5 py-2 text-sm font-bold bg-[#DC2626] text-white rounded-xl hover:bg-[#B91C1C] transition-all cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50">
                {isZipping ? (<Loader2 className="animate-spin" size={14}/>) : compressedResults.length > 1 ? (<Archive size={14}/>) : (<Download size={14}/>)}
                <span>
                  {isZipping
            ? <ImageSizeT>{"Zipping..."}</ImageSizeT> : compressedResults.length > 1
            ? <ImageSizeT>{"Download ZIP"}</ImageSizeT>
            : <ImageSizeT>{"Download"}</ImageSizeT>}
                </span>
              </button>
            </>) : (<button disabled={selectedFiles.length === 0 || isCompressing} onClick={handleCompress} className={`px-5 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${selectedFiles.length > 0 && !isCompressing
                ? "bg-[#DC2626] text-white hover:bg-[#B91C1C] cursor-pointer shadow-md"
                : "bg-[#F3E9D2] text-[#7A6A50] cursor-not-allowed"}`}>
              {isCompressing && <Loader2 className="animate-spin" size={14}/>}
              <span>
                {isCompressing ? <ImageSizeT>{"Compressing..."}</ImageSizeT> : <ImageSizeT>{"Compress images"}</ImageSizeT>}
              </span>
            </button>)}
        </div>
      </div>

      {/* BEFORE / AFTER SIDE-BY-SIDE LIGHTBOX MODAL */}
      {activeCompareIndex !== null &&
            isCompressed &&
            compressedResults[activeCompareIndex] && (<div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200 select-none" role="dialog" aria-modal="true" aria-label={IL("Before and after image comparison")} onMouseDown={(e) => {
                if (e.target === e.currentTarget)
                    closeCompareModal();
            }}>
            {/* Top Close Button Bar */}
            <div className="p-4 flex justify-between items-center z-20">
              <div className="text-white text-sm font-bold bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                {selectedFiles[activeCompareIndex]?.name}
              </div>
              <button onClick={closeCompareModal} className="w-10 h-10 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg cursor-pointer">
                <X size={20}/>
              </button>
            </div>

            {/* Split Screen Image Container */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-1 px-4 overflow-hidden relative">
              {/* Left Column: Before */}
              <div className="relative flex flex-col items-center justify-center border-r border-white/10 overflow-hidden bg-black/40 rounded-l-2xl">
                <span className="absolute top-4 left-4 bg-black/60 text-white text-sm font-bold px-3 py-1 rounded-md border border-white/20 backdrop-blur-md z-10"><ImageSizeT>{"Before\n                "}</ImageSizeT></span>

                <div className="w-full h-full flex items-center justify-center p-6 overflow-auto" style={{
                transform: `scale(${zoomLevel / 100})`,
                transition: "transform 0.15s ease-out",
            }}>
                  <img src={previews[activeCompareIndex]} alt={IL("Before")} className="max-h-[75vh] max-w-full object-contain shadow-2xl"/>
                </div>

                {/* Zoom Controls */}
                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center gap-3 px-3 py-1.5 rounded-xl text-sm z-10">
                  <button onClick={() => setZoomLevel((z) => Math.max(50, z - 25))} className="hover:text-[#DC2626] transition-colors cursor-pointer">
                    <ZoomOut size={14}/>
                  </button>
                  <span className="font-mono text-[13px] font-bold">
                    {zoomLevel}<ImageSizeT>{"%\n                  "}</ImageSizeT></span>
                  <button onClick={() => setZoomLevel((z) => Math.min(200, z + 25))} className="hover:text-[#DC2626] transition-colors cursor-pointer">
                    <ZoomIn size={14}/>
                  </button>
                </div>
              </div>

              {/* Right Column: After */}
              <div className="relative flex flex-col items-center justify-center overflow-hidden bg-black/40 rounded-r-2xl">
                {/* Controls Bar on top right pane */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <button onClick={closeCompareModal} className="bg-[#DC2626]/90 hover:bg-[#B91C1C] text-white text-sm font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 backdrop-blur-md transition-all border border-[#DC2626]/30 cursor-pointer">
                      <LogOut size={12}/>
                      <span><ImageSizeT>{"Exit"}</ImageSizeT></span>
                    </button>

                    {compressedResults[activeCompareIndex] && (<button onClick={() => handleDownloadSingle(compressedResults[activeCompareIndex])} className="bg-emerald-600/90 hover:bg-emerald-600 text-white text-sm font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 backdrop-blur-md transition-all border border-emerald-400/30 cursor-pointer">
                        <Download size={12}/>
                        <span><ImageSizeT>{"Download"}</ImageSizeT></span>
                      </button>)}

                    <button onClick={() => setIsEditing(!isEditing)} className={`text-sm font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 backdrop-blur-md transition-all border cursor-pointer ${isEditing
                ? "bg-[#DC2626] hover:bg-[#B91C1C] text-white border-[#DC2626]"
                : "bg-white/10 hover:bg-white/20 text-white border-white/20"}`}>
                      <Pencil size={12}/>
                      <span><ImageSizeT>{"Edit"}</ImageSizeT></span>
                    </button>
                  </div>

                  <span className="bg-black/60 text-white text-sm font-bold px-3 py-1 rounded-md border border-white/20 backdrop-blur-md"><ImageSizeT>{"After\n                  "}</ImageSizeT></span>
                </div>

                <div className="w-full h-full flex items-center justify-center p-6 overflow-auto" style={{
                transform: `scale(${zoomLevel / 100})`,
                transition: "transform 0.15s ease-out",
            }}>
                  <img src={compressedResults[activeCompareIndex].previewUrl} alt={IL("After")} className="max-h-[75vh] max-w-full object-contain shadow-2xl transition-all duration-100" style={{
                filter: `brightness(${editSettings.brightness}%) contrast(${editSettings.contrast}%) saturate(${editSettings.saturation}%)`,
            }}/>
                </div>

                {/* EDITING SIDEBAR */}
                {isEditing && (<div className="absolute top-0 right-0 h-full w-64 bg-[#FBF6E8] shadow-2xl z-20 flex flex-col animate-in slide-in-from-right-8 duration-300">
                    <div className="p-6 flex flex-col mt-14 overflow-y-auto flex-1">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-base font-bold text-[#3B2F1E] uppercase tracking-wider"><ImageSizeT>{"Image Editing\n                        "}</ImageSizeT></h3>
                        <button onClick={() => setIsEditing(false)} className="text-[#7A6A50] hover:text-[#5A4A32] p-1 rounded-md transition-colors cursor-pointer">
                          <X size={16}/>
                        </button>
                      </div>

                      <div className="space-y-6 flex-1">
                        {/* Brightness */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[12px] font-bold text-[#3B2F1E] uppercase">
                            <span><ImageSizeT>{"Brightness"}</ImageSizeT></span>
                            <span>{editSettings.brightness}<ImageSizeT>{"%"}</ImageSizeT></span>
                          </div>
                          <input type="range" min="0" max="200" value={editSettings.brightness} onChange={(e) => setEditSettings({
                    ...editSettings,
                    brightness: Number(e.target.value),
                })} className="w-full h-1.5 bg-[#E3D6B8] rounded-lg appearance-none cursor-pointer accent-[#DC2626]"/>
                        </div>

                        {/* Contrast */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[12px] font-bold text-[#3B2F1E] uppercase">
                            <span><ImageSizeT>{"Contrast"}</ImageSizeT></span>
                            <span>{editSettings.contrast}<ImageSizeT>{"%"}</ImageSizeT></span>
                          </div>
                          <input type="range" min="0" max="200" value={editSettings.contrast} onChange={(e) => setEditSettings({
                    ...editSettings,
                    contrast: Number(e.target.value),
                })} className="w-full h-1.5 bg-[#E3D6B8] rounded-lg appearance-none cursor-pointer accent-[#DC2626]"/>
                        </div>

                        {/* Saturation */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[12px] font-bold text-[#3B2F1E] uppercase">
                            <span><ImageSizeT>{"Saturation"}</ImageSizeT></span>
                            <span>{editSettings.saturation}<ImageSizeT>{"%"}</ImageSizeT></span>
                          </div>
                          <input type="range" min="0" max="200" value={editSettings.saturation} onChange={(e) => setEditSettings({
                    ...editSettings,
                    saturation: Number(e.target.value),
                })} className="w-full h-1.5 bg-[#E3D6B8] rounded-lg appearance-none cursor-pointer accent-[#DC2626]"/>
                        </div>
                      </div>

                      <button onClick={handleApplyEditing} disabled={isApplyingEdit} className="mt-6 w-full py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {isApplyingEdit && (<Loader2 className="animate-spin" size={14}/>)}
                        <span>
                          {isApplyingEdit ? <ImageSizeT>{"Saving..."}</ImageSizeT> : <ImageSizeT>{"Save & Apply Edits"}</ImageSizeT>}
                        </span>
                      </button>
                    </div>
                  </div>)}
              </div>
            </div>

            <div className="p-3"/>
          </div>)}
    </div>);
}
