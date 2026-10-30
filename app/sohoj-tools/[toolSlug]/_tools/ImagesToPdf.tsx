"use client";
import { useSebaLagbeToolsI18n } from "@/app/sohoj-tools/_i18n";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import { FileImage, Star, Share2, ArrowLeft, RotateCcw, Image as ImageIcon, CreditCard, SlidersHorizontal, FileText, RectangleHorizontal, RectangleVertical, Compass, UploadCloud, Trash2, MoveLeft, MoveRight, Loader2, Plus, Download, } from "lucide-react";
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface UploadedImage {
    id: string;
    file: File;
    previewUrl: string;
    name: string;
    width: number;
    height: number;
}
type Orientation = "auto" | "portrait" | "landscape";
type ImageFit = "contain" | "cover";
type ActiveTab = "page" | "image" | "effects";
// Page Dimensions in MM (portrait baseline — swapped automatically for landscape)
type PageSizeDef = {
    width: number;
    height: number;
    label: string;
};
const PAGE_SIZES: Record<string, PageSizeDef> = {
    a4: { width: 210, height: 297, label: "A4" },
    letter: { width: 215.9, height: 279.4, label: "Letter" },
    a3: { width: 297, height: 420, label: "A3" },
    legal: { width: 215.9, height: 355.6, label: "Legal" },
    a5: { width: 148, height: 210, label: "A5" },
};
// Margins in MM
const MARGIN_SIZES: Record<string, number> = {
    none: 0,
    small: 5,
    medium: 10,
    large: 15,
};
// Reserve vertical space (mm) for the "Page X / Y" caption when enabled
const PAGE_NUMBER_RESERVED_HEIGHT_MM = 8;
// Guard rail so a single very large photo can't blow the canvas/memory budget
const MAX_CANVAS_DIMENSION_PX = 3000;
// JPEG encode quality used when flattening images for jsPDF (high quality —
// this is the exact data that gets embedded in the PDF, so keep it sharp)
const JPEG_QUALITY = 0.95;
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
// Resolves the actual page width/height (mm) and orientation for a given
// image + the current sidebar settings. This is the SINGLE source of truth
// used by both the live preview (right panel) and the real PDF export, so
// the two can never drift apart.
function resolvePageDimensions(imgObj: Pick<UploadedImage, "width" | "height">, orientation: Orientation, pageSize: string): {
    pdfWidth: number;
    pdfHeight: number;
    pageOrientation: "portrait" | "landscape";
} {
    const selectedSize = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
    const pageOrientation: "portrait" | "landscape" = orientation === "auto"
        ? imgObj.width > imgObj.height
            ? "landscape"
            : "portrait"
        : orientation;
    let pdfWidth = selectedSize.width;
    let pdfHeight = selectedSize.height;
    if ((pageOrientation === "landscape" && pdfWidth < pdfHeight) ||
        (pageOrientation === "portrait" && pdfWidth > pdfHeight)) {
        pdfWidth = selectedSize.height;
        pdfHeight = selectedSize.width;
    }
    return { pdfWidth, pdfHeight, pageOrientation };
}
type ImagesToPdfTranslator = (value: string) => string;

const IMAGES_TO_PDF_BN: Record<string, string> = {
    "seba lagbe tools": "সেবা লাগবে টুলস",
    "/": "/",
    "image tools": "ছবির টুলস",
    "images to pdf": "ছবি থেকে PDF",
    "free": "বিনামূল্যে",
    "combine jpg, png, webp, and more into one pdf — reorder pages in your browser.": "JPG, PNG, WebPসহ বিভিন্ন ছবি একটিমাত্র PDF-এ যুক্ত করুন—ব্রাউজারেই পৃষ্ঠাগুলোর ক্রম সাজান।",
    "settings": "সেটিংস",
    "customize pdf output": "PDF-এর আউটপুট নিজের মতো সাজান",
    "page": "পৃষ্ঠা",
    "image": "ছবি",
    "effects": "প্রভাব",
    "orientation": "পাতার দিক",
    "auto": "স্বয়ংক্রিয়",
    "portrait": "উল্লম্ব",
    "landscape": "আড়াআড়ি",
    "auto orientation": "স্বয়ংক্রিয়ভাবে পাতার দিক নির্ধারণ",
    "portrait mode": "উল্লম্ব মোড",
    "landscape mode": "আড়াআড়ি মোড",
    "(output)": "(আউটপুট)",
    "page size": "পাতার মাপ",
    "letter": "লেটার",
    "legal": "লিগ্যাল",
    "margin": "মার্জিন",
    "none": "কোনোটি নয়",
    "small": "ছোট",
    "medium": "মাঝারি",
    "large": "বড়",
    "page numbers": "পৃষ্ঠা নম্বর",
    "add page numbers": "পৃষ্ঠা নম্বর যোগ করুন",
    "image fit": "ছবি বসানোর ধরন",
    "fit to page": "পাতার মধ্যে সম্পূর্ণ ছবি",
    "maintain full image aspect ratio": "ছবির আসল অনুপাত ঠিক রাখুন",
    "fill page": "পুরো পৃষ্ঠা ভরুন",
    "stretch to fill full page printable area": "প্রিন্ট করার উপযোগী পুরো জায়গা ছবিতে ভরুন",
    "grayscale mode": "সাদাকালো মোড",
    "convert color images to black & white pdf": "রঙিন ছবিগুলো সাদাকালো PDF-এ রূপান্তর করুন",
    "reset": "পুনরায় সেট করুন",
    "generating pdf...": "PDF তৈরি হচ্ছে...",
    "create pdf": "PDF তৈরি করুন",
    "pdf preview": "PDF-এর পূর্বরূপ",
    "pages": "পৃষ্ঠা",
    "add more": "আরও ছবি যোগ করুন",
    "empty": "খালি",
    "add images to get started": "শুরু করতে ছবি যোগ করুন",
    "drag and drop jpg, png, or webp images here": "JPG, PNG বা WebP ছবি এখানে টেনে এনে ছেড়ে দিন",
    "or press ctrl+v to paste a copied image": "অথবা কপি করা ছবি পেস্ট করতে Ctrl+V চাপুন",
    "page ": "পৃষ্ঠা ",
    "p.": "পৃষ্ঠা",
    "tools in the same category": "একই বিভাগের টুলগুলো",
    "image size reducer": "ছবির আকার কমান",
    "shrink jpg, png, and webp photos in your browser — quality stays sharp.": "ব্রাউজারেই JPG, PNG ও WebP ছবির আকার কমান—ছবির মানও থাকবে ভালো।",
    "nid joiner": "NID-এর ছবি একত্র করুন",
    "turn nid card front and back photos into a clean a4 pdf — all in your browser.": "NID কার্ডের সামনের ও পেছনের ছবি মিলিয়ে পরিচ্ছন্ন A4 PDF তৈরি করুন—সবই ব্রাউজারে।",
    "remove background": "ছবির পটভূমি সরান",
    "erase portrait, product, or logo backgrounds in your browser — download a transparent png.": "ব্রাউজারেই ব্যক্তি, পণ্য বা লোগোর পটভূমি সরিয়ে স্বচ্ছ PNG ডাউনলোড করুন।",
    "only jpg, png, and webp images are supported.": "শুধু JPG, PNG ও WebP ছবি ব্যবহার করা যাবে।",
    "canvas 2d context is not available.": "ছবি প্রক্রিয়াকরণের সুবিধা চালু করা যায়নি।",
    "something went wrong while generating the pdf. please try again.": "PDF তৈরি করার সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।",
    "remove page": "পৃষ্ঠা সরান",
    "move left": "বাঁয়ে সরান",
    "move right": "ডানে সরান",
    "save to favourites": "পছন্দের তালিকায় যোগ করুন",
    "save to favorites": "পছন্দের তালিকায় যোগ করুন",
    "favorite": "পছন্দের তালিকায় যোগ করুন",
    "share": "শেয়ার করুন",
    "share this tool": "টুলটি শেয়ার করুন",
};

function normalizeImagesToPdfText(value: string): string {
    return value.replace(/\r\n/g, " ").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function toImagesPdfBanglaDigits(value: string): string {
    return value.replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

function translateImagesToPdfText(
    value: string,
    locale: string | undefined,
    baseL?: ImagesToPdfTranslator,
): string {
    const raw = String(value ?? "");
    if (!locale || !locale.toLowerCase().startsWith("bn") || !/[A-Za-z]/.test(raw)) return raw;

    const leading = raw.match(/^\s*/)?.[0] ?? "";
    const trailing = raw.match(/\s*$/)?.[0] ?? "";
    const trimmed = raw.trim();
    const key = normalizeImagesToPdfText(raw);
    const exact = IMAGES_TO_PDF_BN[key];
    if (exact !== undefined) return `${leading}${exact}${trailing}`;

    let match = trimmed.match(/^page\s+(\d+)$/i);
    if (match) return `${leading}পৃষ্ঠা ${toImagesPdfBanglaDigits(match[1])}${trailing}`;

    match = trimmed.match(/^p\.\s*(\d+)$/i);
    if (match) return `${leading}পৃষ্ঠা ${toImagesPdfBanglaDigits(match[1])}${trailing}`;

    match = trimmed.match(/^(\d+)\s+pages?$/i);
    if (match) return `${leading}${toImagesPdfBanglaDigits(match[1])}টি পৃষ্ঠা${trailing}`;

    match = trimmed.match(/^failed to load\s+(.+)$/i);
    if (match) return `${leading}\"${match[1]}\" ছবিটি লোড করা যায়নি।${trailing}`;

    // Use the shared dictionary only if it returns a fully Bengali translation;
    // never allow a partially translated English sentence to leak into this page.
    if (baseL) {
        const fallback = baseL(raw);
        if (fallback && fallback !== raw && /[\u0980-\u09FF]/.test(fallback) && !/[A-Za-z]/.test(fallback)) {
            return fallback;
        }
    }
    return raw;
}

function ImagePdfT({ children }: { children: React.ReactNode }) {
    const { locale, L: baseL } = useSebaLagbeToolsI18n();
    if (typeof children !== "string") return <>{children}</>;
    return <>{translateImagesToPdfText(children, locale, baseL)}</>;
}

function formatImagesToPdfNumber(value: number, locale: string | undefined): string {
    return value.toLocaleString(locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US");
}

export default function ImagesToPdf() {
    const { locale, L: baseL } = useSebaLagbeToolsI18n();
    const L = useCallback((value: string) => translateImagesToPdfText(value, locale, baseL), [locale, baseL]);
    // Navigation & Customization State
    const [activeTab, setActiveTab] = useState<ActiveTab>("page");
    const [orientation, setOrientation] = useState<Orientation>("auto");
    const [pageSize, setPageSize] = useState<string>("a4");
    const [margin, setMargin] = useState<string>("medium");
    const [pageNumbers, setPageNumbers] = useState<boolean>(false);
    // Image Settings State
    const [imageFit, setImageFit] = useState<ImageFit>("contain");
    const [grayscale, setGrayscale] = useState<boolean>(false);
    // Images & App State
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // Cache of the actual canvas-processed (flattened + optionally grayscaled)
    // data URL for each image, keyed by image id. This is the exact pixel data
    // that gets embedded into the PDF — the preview grid renders these same
    // URLs (never the raw upload) so "what you see is what you export".
    const [processedPreviews, setProcessedPreviews] = useState<Record<string, {
        url: string;
        grayscale: boolean;
    }>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Always-current snapshot of `images`, used only for unmount cleanup so we
    // don't have to depend on `images` inside the cleanup effect (see below).
    const imagesRef = useRef<UploadedImage[]>([]);
    useEffect(() => {
        imagesRef.current = images;
    }, [images]);
    // --- 1. Memory Leak Cleanup (unmount only) ---
    // Important: this effect intentionally has an EMPTY dependency array. If it
    // depended on `images`, React would run the previous render's cleanup every
    // time a new image was added, revoking the object URLs of images still
    // being displayed. We only want to revoke everything once, when the
    // component actually unmounts — individual removals are already handled by
    // removeImage() and handleReset() below.
    useEffect(() => {
        return () => {
            imagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
        };
    }, []);
    // --- 2. Process and Add Files ---
    const processFiles = useCallback((files: FileList | File[]) => {
        const incoming = Array.from(files);
        const validImageFiles = incoming.filter((file) => file.type.startsWith("image/"));
        if (validImageFiles.length === 0) {
            if (incoming.length > 0) {
                setErrorMessage("Only JPG, PNG, and WebP images are supported.");
            }
            return;
        }
        setErrorMessage(null);
        const newImagesPromises = validImageFiles.map((file) => {
            return new Promise<UploadedImage>((resolve) => {
                const previewUrl = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => {
                    resolve({
                        id: generateId(),
                        file,
                        previewUrl,
                        name: file.name,
                        width: img.naturalWidth || 800,
                        height: img.naturalHeight || 600,
                    });
                };
                img.onerror = () => {
                    resolve({
                        id: generateId(),
                        file,
                        previewUrl,
                        name: file.name,
                        width: 800,
                        height: 600,
                    });
                };
                img.src = previewUrl;
            });
        });
        Promise.all(newImagesPromises).then((loadedImages) => {
            setImages((prev) => [...prev, ...loadedImages]);
        });
    }, []);
    // --- 3. Clipboard Paste (Ctrl + V) Handler ---
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (e.clipboardData && e.clipboardData.files.length > 0) {
                processFiles(e.clipboardData.files);
            }
        };
        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [processFiles]);
    // --- 4. Drag & Drop Handlers ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };
    // --- 5. Image List Manipulations ---
    const removeImage = (id: string) => {
        setImages((prev) => {
            const target = prev.find((img) => img.id === id);
            if (target)
                URL.revokeObjectURL(target.previewUrl);
            return prev.filter((img) => img.id !== id);
        });
    };
    const moveImage = (index: number, direction: "left" | "right") => {
        setImages((prev) => {
            const targetIndex = direction === "left" ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= prev.length)
                return prev;
            const newImages = [...prev];
            const temp = newImages[index];
            newImages[index] = newImages[targetIndex];
            newImages[targetIndex] = temp;
            return newImages;
        });
    };
    const handleReset = () => {
        setActiveTab("page");
        setOrientation("auto");
        setPageSize("a4");
        setMargin("medium");
        setPageNumbers(false);
        setImageFit("contain");
        setGrayscale(false);
        setErrorMessage(null);
        setImages((prev) => {
            prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
            return [];
        });
        if (fileInputRef.current)
            fileInputRef.current.value = "";
    };
    // --- 6. Helper: Convert an image to a flattened, JPEG-encoded data URL ---
    // Handles: downscaling oversized photos, filling transparent (PNG/WebP)
    // backgrounds with white before JPEG encoding (JPEG has no alpha channel,
    // so skipping this turns transparent areas black), and an optional
    // luminance-based grayscale pass done per-pixel for consistent results
    // across browsers (CSS canvas filters are not reliably supported
    // everywhere, notably older Safari).
    const processImageForPDF = (imgObj: UploadedImage): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const naturalWidth = img.naturalWidth || imgObj.width;
                    const naturalHeight = img.naturalHeight || imgObj.height;
                    const scale = Math.min(1, MAX_CANVAS_DIMENSION_PX / Math.max(naturalWidth, naturalHeight));
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.max(1, Math.round(naturalWidth * scale));
                    canvas.height = Math.max(1, Math.round(naturalHeight * scale));
                    const ctx = canvas.getContext("2d");
                    if (!ctx) {
                        reject(new Error("Canvas 2D context is not available."));
                        return;
                    }
                    // Flatten transparency onto a white background.
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    if (grayscale) {
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;
                        for (let p = 0; p < data.length; p += 4) {
                            const luminance = data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114;
                            data[p] = luminance;
                            data[p + 1] = luminance;
                            data[p + 2] = luminance;
                        }
                        ctx.putImageData(imageData, 0, 0);
                    }
                    resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
                }
                catch (err) {
                    reject(err);
                }
            };
            img.onerror = () => reject(new Error(`Failed to load ${imgObj.name}`));
            img.src = imgObj.previewUrl;
        });
    };
    // --- 6b. Keep processedPreviews in sync so the preview updates live ---
    // Runs the exact same canvas pipeline used for PDF export whenever the
    // image list changes or the grayscale toggle flips, so the right-hand
    // preview always shows the true processed pixels instantly — no need to
    // click "Create PDF" to see the effect.
    useEffect(() => {
        let cancelled = false;
        const needsProcessing = images.filter((img) => {
            const cached = processedPreviews[img.id];
            return !cached || cached.grayscale !== grayscale;
        });
        if (needsProcessing.length > 0) {
            Promise.all(needsProcessing.map(async (img) => {
                try {
                    const url = await processImageForPDF(img);
                    return [img.id, { url, grayscale }] as const;
                }
                catch (err) {
                    console.error(`Failed to process ${img.name} for preview:`, err);
                    return null;
                }
            })).then((results) => {
                if (cancelled)
                    return;
                setProcessedPreviews((prev) => {
                    const next = { ...prev };
                    results.forEach((entry) => {
                        if (entry)
                            next[entry[0]] = entry[1];
                    });
                    return next;
                });
            });
        }
        // Prune cache entries for images that were removed, so it never grows
        // unbounded across add/remove cycles.
        setProcessedPreviews((prev) => {
            const liveIds = new Set(images.map((img) => img.id));
            let changed = false;
            const next: typeof prev = {};
            for (const id of Object.keys(prev)) {
                if (liveIds.has(id)) {
                    next[id] = prev[id];
                }
                else {
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images, grayscale]);
    // --- 7. Core PDF Generator Logic using jsPDF ---
    const handleCreatePdf = async () => {
        if (images.length === 0 || isGenerating)
            return;
        setIsGenerating(true);
        setErrorMessage(null);
        try {
            const marginMm = MARGIN_SIZES[margin] ?? 10;
            let doc: jsPDF | null = null;
            for (let i = 0; i < images.length; i++) {
                const imgObj = images[i];
                // Reuse the already-processed (flattened + grayscaled) canvas output
                // shown in the live preview whenever it's still valid for the
                // current grayscale setting — this is what guarantees the exported
                // PDF contains the EXACT pixels the user just previewed, instead of
                // silently re-deriving them and risking any drift between the two.
                const cached = processedPreviews[imgObj.id];
                const imageDataUrl = cached && cached.grayscale === grayscale
                    ? cached.url
                    : await processImageForPDF(imgObj);
                // Resolve page width/height/orientation for this page — the SAME
                // helper the live preview uses, so pagination can never disagree.
                const { pdfWidth, pdfHeight, pageOrientation } = resolvePageDimensions(imgObj, orientation, pageSize);
                // Initialize jsPDF on the first page, then append subsequent pages.
                if (i === 0) {
                    doc = new jsPDF({
                        orientation: pageOrientation,
                        unit: "mm",
                        format: [pdfWidth, pdfHeight],
                        compress: true,
                    });
                }
                else if (doc) {
                    doc.addPage([pdfWidth, pdfHeight], pageOrientation);
                }
                if (!doc)
                    continue;
                // Printable area after margins (and the page-number caption strip).
                const printableWidth = Math.max(1, pdfWidth - marginMm * 2);
                const printableHeight = Math.max(1, pdfHeight -
                    marginMm * 2 -
                    (pageNumbers ? PAGE_NUMBER_RESERVED_HEIGHT_MM : 0));
                const imgAspect = imgObj.width / imgObj.height;
                const printAspect = printableWidth / printableHeight;
                let renderWidth = printableWidth;
                let renderHeight = printableHeight;
                if (imageFit === "contain") {
                    if (imgAspect > printAspect) {
                        renderHeight = printableWidth / imgAspect;
                    }
                    else {
                        renderWidth = printableHeight * imgAspect;
                    }
                }
                // "cover" (Fill Page) intentionally leaves render dimensions equal to
                // the full printable area, stretching the image to fill it exactly.
                // Center the image inside the printable area.
                const xPos = marginMm + (printableWidth - renderWidth) / 2;
                const yPos = marginMm + (printableHeight - renderHeight) / 2;
                doc.addImage(imageDataUrl, "JPEG", xPos, yPos, renderWidth, renderHeight, undefined, "FAST");
                if (pageNumbers) {
                    doc.setFontSize(9);
                    doc.setTextColor(120, 120, 120);
                    const pageStr = `Page ${i + 1} / ${images.length}`;
                    doc.text(pageStr, pdfWidth / 2, pdfHeight - Math.max(marginMm / 2, 5), {
                        align: "center",
                    });
                }
            }
            if (doc) {
                doc.save("sebalagbe-images.pdf");
            }
        }
        catch (error) {
            console.error("PDF Generation Error:", error);
            setErrorMessage("Something went wrong while generating the PDF. Please try again.");
        }
        finally {
            setIsGenerating(false);
        }
    };
    const orientationItems: {
        id: Orientation;
        label: string;
        icon: typeof Compass;
    }[] = [
        { id: "auto", label: "Auto", icon: Compass },
        { id: "portrait", label: "Portrait", icon: RectangleVertical },
        { id: "landscape", label: "Landscape", icon: RectangleHorizontal },
    ];
    const pageSizeItems = [
        { id: "a4", label: "A4" },
        { id: "letter", label: "Letter" },
        { id: "a3", label: "A3" },
        { id: "legal", label: "Legal" },
        { id: "a5", label: "A5" },
    ];
    const marginItems = [
        { id: "none", label: "None" },
        { id: "small", label: "Small" },
        { id: "medium", label: "Medium" },
        { id: "large", label: "Large" },
    ];
    return (<div id="images-to-pdf-tool" className="relative isolate min-h-screen w-full space-y-5 text-[#3B2F1E] font-sans">
      {/* Pointer cursor on every clickable element of this tool */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        #images-to-pdf-tool {
          position: relative;
          isolation: isolate;
          color: #3B2F1E;
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        #images-to-pdf-tool::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: linear-gradient(to bottom, #E9DDC3, #EFE5CE);
        }
        #images-to-pdf-tool *, #images-to-pdf-tool *::before, #images-to-pdf-tool *::after {
          font-family: inherit;
          font-optical-sizing: auto;
        }
        #images-to-pdf-tool h1, #images-to-pdf-tool h2, #images-to-pdf-tool h3, #images-to-pdf-tool h4 {
          letter-spacing: -0.01em;
        }
        #images-to-pdf-tool :is(input:not([type="file"]):not([type="range"]):not([type="checkbox"]):not([type="radio"]), select, textarea) {
          background-color: #FBF6E8;
          color: #3B2F1E;
          border-color: #E3D6B8;
          font-size: max(15px, 1em);
          transition: color 180ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }
        #images-to-pdf-tool input[type="range"] { accent-color: #DC2626; }
        #images-to-pdf-tool :is(button, a, [role="button"], input, select, textarea):focus-visible {
          outline: 2px solid rgba(220, 38, 38, 0.4);
          outline-offset: 2px;
        }
        #images-to-pdf-tool .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: #F87171 transparent;
        }
        #images-to-pdf-tool .overflow-y-auto::-webkit-scrollbar { width: 12px; }
        #images-to-pdf-tool .overflow-y-auto::-webkit-scrollbar-track { background: rgba(148, 113, 67, 0.12); border-radius: 999px; }
        #images-to-pdf-tool .overflow-y-auto::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #F87171, #DC2626); border-radius: 999px; border: 3px solid #F2E8D2; }

        :where(#images-to-pdf-tool) a[href],
        :where(#images-to-pdf-tool) button:not(:disabled),
        :where(#images-to-pdf-tool) label:has(input[type="file"]),
        :where(#images-to-pdf-tool) summary,
        :where(#images-to-pdf-tool) [role="button"],
        :where(#images-to-pdf-tool) select,
        :where(#images-to-pdf-tool) input[type="color"],
        :where(#images-to-pdf-tool) input[type="range"],
        :where(#images-to-pdf-tool) input[type="checkbox"],
        :where(#images-to-pdf-tool) input[type="radio"],
        :where(#images-to-pdf-tool) input[type="file"] {
          cursor: pointer;
        }

        :where(#images-to-pdf-tool) button:disabled {
          cursor: not-allowed;
        }
      `}</style>

      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
                processFiles(e.target.files);
            }
            // Allow re-selecting the same file(s) again later.
            e.target.value = "";
        }} multiple accept="image/png, image/jpeg, image/webp, image/jpg" className="hidden"/>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-[#5A4A32]">
        <Link href="/sohoj-tools" className="flex items-center gap-1 hover:text-[#3B2F1E] transition-colors">
          <ArrowLeft size={14}/>
          <span><ImagePdfT>{"Seba Lagbe Tools"}</ImagePdfT></span>
        </Link>
        <span><ImagePdfT>{"/"}</ImagePdfT></span>
        <span><ImagePdfT>{"Image Tools"}</ImagePdfT></span>
        <span><ImagePdfT>{"/"}</ImagePdfT></span>
        <span className="font-semibold text-[#3B2F1E]"><ImagePdfT>{"Images to PDF"}</ImagePdfT></span>
      </div>

      {/* Header Card */}
      <div className="bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#F6EEDB] text-[#DC2626] rounded-xl flex items-center justify-center shrink-0 border border-[#E3D6B8]">
            <FileImage size={24}/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#3B2F1E]"><ImagePdfT>{"Images to PDF\n              "}</ImagePdfT></h1>
              <span className="bg-emerald-100 text-emerald-700 text-[12px] font-bold px-2 py-0.5 rounded-full"><ImagePdfT>{"Free\n              "}</ImagePdfT></span>
            </div>
            <p className="text-sm text-[#5A4A32] font-medium mt-0.5"><ImagePdfT>{"Combine JPG, PNG, WebP, and more into one PDF \u2014 reorder pages in\n              your browser.\n            "}</ImagePdfT></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" aria-label={L("Save to favourites")} title={L("Save to favourites")} className="p-2 text-[#7A6A50] hover:text-[#5A4A32] bg-[#F6EEDB] hover:bg-[#EFE3C8] rounded-xl transition-all border border-[#E3D6B8]">
            <Star size={16}/>
          </button>
          <button type="button" aria-label={L("Share this tool")} title={L("Share this tool")} className="p-2 text-[#7A6A50] hover:text-[#5A4A32] bg-[#F6EEDB] hover:bg-[#EFE3C8] rounded-xl transition-all border border-[#E3D6B8]">
            <Share2 size={16}/>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (<div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl">
          {translateImagesToPdfText(errorMessage, locale, baseL)}
        </div>)}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side Controls Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs space-y-4">
            {/* Header Title with Subtitle */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#F6EEDB] text-[#DC2626] rounded-md flex items-center justify-center">
                <SlidersHorizontal size={13}/>
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#3B2F1E]"><ImagePdfT>{"Settings"}</ImagePdfT></h2>
                <p className="text-[12px] text-[#7A6A50]"><ImagePdfT>{"Customize PDF output\n                "}</ImagePdfT></p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#F6EEDB] rounded-xl border border-[#E3D6B8] text-sm font-bold">
              <button type="button" onClick={() => setActiveTab("page")} className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === "page"
            ? "border border-[#DC2626] bg-[#F6D9A8] text-[#DC2626] ring-2 ring-[#DC2626]/40 shadow-sm"
            : "text-[#5A4A32] hover:text-[#3B2F1E]"}`}>
                <FileText size={13}/><ImagePdfT>{"Page\n              "}</ImagePdfT></button>
              <button type="button" onClick={() => setActiveTab("image")} className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === "image"
            ? "border border-[#DC2626] bg-[#F6D9A8] text-[#DC2626] ring-2 ring-[#DC2626]/40 shadow-sm"
            : "text-[#5A4A32] hover:text-[#3B2F1E]"}`}>
                <ImageIcon size={13}/><ImagePdfT>{"Image\n              "}</ImagePdfT></button>
              <button type="button" onClick={() => setActiveTab("effects")} className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === "effects"
            ? "border border-[#DC2626] bg-[#F6D9A8] text-[#DC2626] ring-2 ring-[#DC2626]/40 shadow-sm"
            : "text-[#5A4A32] hover:text-[#3B2F1E]"}`}><ImagePdfT>{"Effects\n              "}</ImagePdfT></button>
            </div>

            {/* TAB 1: Page Settings */}
            {activeTab === "page" && (<div className="space-y-4 pt-1">
                {/* Orientation Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-bold text-[#3B2F1E]"><ImagePdfT>{"Orientation\n                    "}</ImagePdfT></span>
                    <span className="text-[12px] font-bold text-[#7A6A50] tracking-wider"><ImagePdfT>{"ORIENTATION\n                    "}</ImagePdfT></span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {orientationItems.map((item) => {
                const IconComp = item.icon;
                return (<button key={item.id} type="button" onClick={() => setOrientation(item.id)} className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${orientation === item.id
                        ? "border-[#DC2626] bg-[#F6D9A8] text-[#DC2626] font-bold ring-2 ring-[#DC2626]/40 shadow-sm"
                        : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:border-[#D8C9A6]"}`}>
                          <IconComp size={15}/>
                          <span className="text-[12px]">{<ImagePdfT>{item.label}</ImagePdfT>}</span>
                        </button>);
            })}
                  </div>
                  <div className="p-2.5 bg-[#F6EEDB] rounded-xl border border-dashed border-[#E3D6B8] text-[12px] text-[#5A4A32]">
                    <span className="font-bold text-[#3B2F1E]">
                      {orientation === "auto"
            ? <ImagePdfT>{"Auto Orientation"}</ImagePdfT> : orientation === "portrait"
            ? <ImagePdfT>{"Portrait Mode"}</ImagePdfT>
            : <ImagePdfT>{"Landscape Mode"}</ImagePdfT>}
                    </span>
                    <br /><ImagePdfT>{"pt \u00B7 "}</ImagePdfT><ImagePdfT>{PAGE_SIZES[pageSize]?.label || "A4"}</ImagePdfT><ImagePdfT>{"(output)\n                  "}</ImagePdfT></div>
                </div>

                {/* Page Size Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-bold text-[#3B2F1E]"><ImagePdfT>{"Page size"}</ImagePdfT></span>
                    <span className="text-[12px] font-bold text-[#7A6A50] tracking-wider"><ImagePdfT>{"PAGE SIZE\n                    "}</ImagePdfT></span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {pageSizeItems.map((item) => (<button key={item.id} type="button" onClick={() => setPageSize(item.id)} className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${pageSize === item.id
                    ? "border-[#DC2626] bg-[#F6D9A8] text-[#DC2626] font-bold ring-2 ring-[#DC2626]/40 shadow-sm"
                    : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:border-[#D8C9A6]"}`}>
                        <div className="w-3.5 h-4 border border-current rounded-xs flex items-center justify-center text-[9px] font-bold">
                          {item.label.charAt(0)}
                        </div>
                        <span className="text-[12px]">{<ImagePdfT>{item.label}</ImagePdfT>}</span>
                      </button>))}
                  </div>
                </div>

                {/* Margin Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-bold text-[#3B2F1E]"><ImagePdfT>{"Margin"}</ImagePdfT></span>
                    <span className="text-[12px] font-bold text-[#7A6A50] tracking-wider"><ImagePdfT>{"MARGIN\n                    "}</ImagePdfT></span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {marginItems.map((item) => (<button key={item.id} type="button" onClick={() => setMargin(item.id)} className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${margin === item.id
                    ? "border-[#DC2626] bg-[#F6D9A8] text-[#DC2626] font-bold ring-2 ring-[#DC2626]/40 shadow-sm"
                    : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:border-[#D8C9A6]"}`}>
                        <div className="w-4 h-4 border border-current rounded-xs border-dashed flex items-center justify-center"/>
                        <span className="text-[12px]">{<ImagePdfT>{item.label}</ImagePdfT>}</span>
                      </button>))}
                  </div>
                </div>

                {/* Page Numbers Switch */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[13px] font-bold text-[#3B2F1E] block"><ImagePdfT>{"Page numbers\n                    "}</ImagePdfT></span>
                    <span className="text-[12px] text-[#7A6A50] block"><ImagePdfT>{"Add page numbers\n                    "}</ImagePdfT></span>
                  </div>
                  <button type="button" onClick={() => setPageNumbers((prev) => !prev)} aria-pressed={pageNumbers} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${pageNumbers ? "bg-[#DC2626]" : "bg-[#F3E9D2]"}`}>
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#FBF6E8] shadow-xs ring-0 transition duration-200 ease-in-out ${pageNumbers ? "translate-x-4" : "translate-x-0"}`}/>
                  </button>
                </div>
              </div>)}

            {/* TAB 2: Image Fit Settings */}
            {activeTab === "image" && (<div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <span className="text-[13px] font-bold text-[#3B2F1E] block"><ImagePdfT>{"Image Fit\n                  "}</ImagePdfT></span>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setImageFit("contain")} className={`p-3 rounded-xl border text-left transition-all ${imageFit === "contain"
                ? "border-[#DC2626] bg-[#F6EEDB]/30 text-[#DC2626] font-bold"
                : "border-[#E3D6B8] text-[#5A4A32]"}`}>
                      <span className="text-sm block font-bold"><ImagePdfT>{"Fit to Page\n                      "}</ImagePdfT></span>
                      <span className="text-[12px] text-[#7A6A50] block mt-0.5"><ImagePdfT>{"Maintain full image aspect ratio\n                      "}</ImagePdfT></span>
                    </button>
                    <button type="button" onClick={() => setImageFit("cover")} className={`p-3 rounded-xl border text-left transition-all ${imageFit === "cover"
                ? "border-[#DC2626] bg-[#F6EEDB]/30 text-[#DC2626] font-bold"
                : "border-[#E3D6B8] text-[#5A4A32]"}`}>
                      <span className="text-sm block font-bold"><ImagePdfT>{"Fill Page"}</ImagePdfT></span>
                      <span className="text-[12px] text-[#7A6A50] block mt-0.5"><ImagePdfT>{"Stretch to fill full page printable area\n                      "}</ImagePdfT></span>
                    </button>
                  </div>
                </div>
              </div>)}

            {/* TAB 3: Effects Settings */}
            {activeTab === "effects" && (<div className="space-y-4 pt-1">
                <div className="flex items-center justify-between p-3 bg-[#F6EEDB] rounded-xl border border-[#E3D6B8]">
                  <div>
                    <span className="text-sm font-bold text-[#3B2F1E] block"><ImagePdfT>{"Grayscale Mode\n                    "}</ImagePdfT></span>
                    <span className="text-[12px] text-[#7A6A50] block"><ImagePdfT>{"Convert color images to black & white PDF\n                    "}</ImagePdfT></span>
                  </div>
                  <button type="button" onClick={() => setGrayscale((prev) => !prev)} aria-pressed={grayscale} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${grayscale ? "bg-[#DC2626]" : "bg-[#F3E9D2]"}`}>
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#FBF6E8] shadow-xs ring-0 transition duration-200 ease-in-out ${grayscale ? "translate-x-4" : "translate-x-0"}`}/>
                  </button>
                </div>
              </div>)}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={handleReset} className="px-4 py-2.5 border border-[#E3D6B8] text-[#5A4A32] hover:text-[#3B2F1E] text-sm font-bold rounded-xl hover:bg-[#EFE3C8] transition-all flex items-center gap-1.5">
              <RotateCcw size={13}/><ImagePdfT>{"Reset\n            "}</ImagePdfT></button>
            <button type="button" onClick={handleCreatePdf} disabled={images.length === 0 || isGenerating} className={`flex-1 py-2.5 text-sm font-bold rounded-xl text-center transition-all flex items-center justify-center gap-2 ${images.length > 0 && !isGenerating
            ? "bg-[#D42020] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white shadow-sm cursor-pointer active:scale-[0.98]"
            : "bg-[#F3E9D2] text-[#7A6A50] cursor-not-allowed"}`}>
              {isGenerating ? (<>
                  <Loader2 size={14} className="animate-spin"/><ImagePdfT>{"Generating PDF...\n                "}</ImagePdfT></>) : (<>
                  <Download size={14}/><ImagePdfT>{"Create PDF\n                "}</ImagePdfT></>)}
            </button>
          </div>
        </div>

        {/* Right Side PDF Preview Panel */}
        <div className="lg:col-span-8">
          <div className="bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs space-y-4 min-h-[460px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#3B2F1E]"><ImagePdfT>{"PDF preview\n                "}</ImagePdfT></h2>
                {images.length > 0 && (<span className="text-[12px] bg-[#E3D6B8] text-[#DC2626] font-bold px-2 py-0.5 rounded-full">
                    {formatImagesToPdfNumber(images.length, locale)} {images.length === 1 ? <ImagePdfT>{"page"}</ImagePdfT> : <ImagePdfT>{"pages"}</ImagePdfT>}
                  </span>)}
              </div>
              {images.length > 0 ? (<button type="button" onClick={() => fileInputRef.current?.click()} className="text-[13px] text-[#DC2626] font-bold hover:text-[#DC2626] flex items-center gap-1">
                  <Plus size={13}/><ImagePdfT>{"Add more\n                "}</ImagePdfT></button>) : (<span className="text-[12px] bg-[#F3E9D2] text-[#7A6A50] px-2 py-0.5 rounded-full font-medium"><ImagePdfT>{"Empty\n                "}</ImagePdfT></span>)}
            </div>

            {/* Dropzone & Preview Container */}
            {images.length === 0 ? (<div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} role="button" aria-label={L("Add images to get started")} tabIndex={0} onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                }
            }} className={`bg-[#F6EEDB] border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center flex-1 text-center my-1 cursor-pointer transition-all ${isDragging
                ? "border-[#DC2626] bg-[#F6EEDB]/30 scale-[0.99]"
                : "border-[#E3D6B8] hover:border-[#DC2626]"}`}>
                <div className="w-14 h-14 bg-[#F6EEDB] text-[#DC2626] rounded-2xl flex items-center justify-center mb-3">
                  <UploadCloud size={28}/>
                </div>
                <span className="text-sm font-bold text-[#3B2F1E] block"><ImagePdfT>{"Add images to get started\n                "}</ImagePdfT></span>
                <span className="text-[12px] text-[#7A6A50] mt-1"><ImagePdfT>{"Drag and drop JPG, PNG, or WebP images here\n                "}</ImagePdfT></span>
                <span className="text-[12px] text-[#7A6A50] mt-4 font-medium bg-[#FBF6E8] px-3 py-1 rounded-full border border-[#E3D6B8] shadow-2xs"><ImagePdfT>{"Or press Ctrl+V to paste a copied image\n                "}</ImagePdfT></span>
              </div>) : (
        /* Grid Display of Uploaded Pages */
        <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto p-1 rounded-xl transition-all ${isDragging ? "ring-2 ring-[#DC2626] ring-offset-2" : ""}`}>
                {images.map((img, index) => {
                // Same resolver used by the real PDF export — the page
                // "shape" the user sees here is exactly what gets produced.
                const { pdfWidth, pdfHeight } = resolvePageDimensions(img, orientation, pageSize);
                const marginMm = MARGIN_SIZES[margin] ?? 10;
                // Percentages for an absolutely-positioned inner box: for
                // an absolutely positioned element, left/right resolve
                // against the containing block's WIDTH and top/bottom
                // against its HEIGHT — so this reproduces the real margin
                // proportions regardless of the page's aspect ratio
                // (unlike padding percentages, which are always
                // width-relative and would distort non-square pages).
                const marginXPercent = (marginMm / pdfWidth) * 100;
                const marginYPercent = (marginMm / pdfHeight) * 100;
                const captionYPercent = pageNumbers
                    ? (PAGE_NUMBER_RESERVED_HEIGHT_MM / pdfHeight) * 100
                    : 0;
                const cached = processedPreviews[img.id];
                const displayUrl = cached && cached.grayscale === grayscale
                    ? cached.url
                    : img.previewUrl;
                const isProcessing = !cached || cached.grayscale !== grayscale;
                return (<div key={img.id} className="group relative bg-[#F6EEDB] border border-[#E3D6B8] rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between">
                      {/* Page simulation — mirrors the real PDF page: exact
                        aspect ratio, proportional margins, chosen fit
                        mode, and processed (flattened/grayscaled) pixels */}
                      <div className="relative bg-white w-full" style={{ aspectRatio: `${pdfWidth} / ${pdfHeight}` }}>
                        <div className="absolute overflow-hidden flex items-center justify-center" style={{
                        left: `${marginXPercent}%`,
                        right: `${marginXPercent}%`,
                        top: `${marginYPercent}%`,
                        bottom: `${marginYPercent + captionYPercent}%`,
                    }}>
                          <img src={displayUrl} alt={img.name} style={{
                        width: "100%",
                        height: "100%",
                        objectFit: imageFit === "contain" ? "contain" : "cover",
                    }}/>
                        </div>

                        {/* Live "Page X / Y" caption preview */}
                        {pageNumbers && (<div className="absolute left-0 right-0 flex items-center justify-center text-[#7A6A50]" style={{
                            bottom: `${marginYPercent / 2}%`,
                            fontSize: "6px",
                        }}><ImagePdfT>{"Page "}</ImagePdfT>{formatImagesToPdfNumber(index + 1, locale)}<ImagePdfT>{"/ "}</ImagePdfT>{formatImagesToPdfNumber(images.length, locale)}
                          </div>)}

                        {/* Processing overlay — shown briefly while the
                        canvas pipeline (re)computes this page, e.g.
                        right after toggling grayscale */}
                        {isProcessing && (<div className="absolute inset-0 flex items-center justify-center bg-[#FBF6E8]/70">
                            <Loader2 size={16} className="animate-spin text-[#DC2626]"/>
                          </div>)}

                        {/* Page Badge */}
                        <span className="absolute top-2 left-2 bg-gray-900/70 text-white text-[12px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs"><ImagePdfT>{"P. "}</ImagePdfT>{formatImagesToPdfNumber(index + 1, locale)}
                        </span>
                        {/* Remove Button */}
                        <button type="button" onClick={() => removeImage(img.id)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xs hover:bg-red-600" title={L("Remove page")}>
                          <Trash2 size={12}/>
                        </button>
                      </div>

                      {/* Reorder & Info Bar */}
                      <div className="p-2 bg-[#FBF6E8] border-t border-[#E3D6B8] flex items-center justify-between">
                        <span className="text-[12px] font-medium text-[#5A4A32] truncate max-w-[70px]">
                          {img.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button type="button" disabled={index === 0} onClick={() => moveImage(index, "left")} className="p-1 text-[#7A6A50] hover:text-[#3B2F1E] disabled:opacity-20" title={L("Move left")}>
                            <MoveLeft size={11}/>
                          </button>
                          <button type="button" disabled={index === images.length - 1} onClick={() => moveImage(index, "right")} className="p-1 text-[#7A6A50] hover:text-[#3B2F1E] disabled:opacity-20" title={L("Move right")}>
                            <MoveRight size={11}/>
                          </button>
                        </div>
                      </div>
                    </div>);
            })}
              </div>)}
          </div>
        </div>
      </div>

      {/* Tools in the same category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-[#3B2F1E]"><ImagePdfT>{"Tools in the same category\n        "}</ImagePdfT></h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/sohoj-tools/image-size-reducer" className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs hover:border-[#DC2626]/50 transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#F6EEDB] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0">
              <ImageIcon size={16}/>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#3B2F1E] group-hover:text-[#DC2626] transition-colors"><ImagePdfT>{"Image Size Reducer\n              "}</ImagePdfT></h4>
              <p className="text-[12px] text-[#7A6A50] mt-0.5 line-clamp-2"><ImagePdfT>{"Shrink JPG, PNG, and WebP photos in your browser \u2014 quality stays\n                sharp.\n              "}</ImagePdfT></p>
            </div>
          </Link>

          <Link href="/sohoj-tools/nid-joiner" className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs hover:border-[#DC2626]/50 transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#F6EEDB] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0">
              <CreditCard size={16}/>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#3B2F1E] group-hover:text-[#DC2626] transition-colors"><ImagePdfT>{"NID Joiner\n              "}</ImagePdfT></h4>
              <p className="text-[12px] text-[#7A6A50] mt-0.5 line-clamp-2"><ImagePdfT>{"Turn NID card front and back photos into a clean A4 PDF \u2014 all in\n                your browser.\n              "}</ImagePdfT></p>
            </div>
          </Link>

          <Link href="/sohoj-tools/remove-background" className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs hover:border-[#DC2626]/50 transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#F6EEDB] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0"></div>
            <div>
              <h4 className="text-sm font-bold text-[#3B2F1E] group-hover:text-[#DC2626] transition-colors"><ImagePdfT>{"Remove Background\n              "}</ImagePdfT></h4>
              <p className="text-[12px] text-[#7A6A50] mt-0.5 line-clamp-2"><ImagePdfT>{"Erase portrait, product, or logo backgrounds in your browser \u2014\n                download a transparent PNG.\n              "}</ImagePdfT></p>
            </div>
          </Link>
        </div>
      </div>
    </div>);
}
