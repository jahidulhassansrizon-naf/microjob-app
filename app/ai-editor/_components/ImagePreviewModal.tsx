"use client";
import { AiT, useAiEditorText } from "./aiEditorI18n";
import React, { useEffect, useRef, useState } from "react";
import { X, RotateCw, Download, Printer, Trash2, Edit3, Share2, Eye, Loader2, Save, Info, ChevronDown, FileImage, Grid, } from "lucide-react";
import ImageEditSidebar, { ASPECT_RATIOS, DEFAULT_FILTERS, FilterState, } from "./ImageEditSidebar";
export interface PreviewImage {
    id?: string;
    url: string;
    originalUrl?: string;
    bgColor?: string;
    size?: string;
    clothingStyle?: string;
    clothingColor?: string;
    editingGuides?: string[];
    sizeType?: string;
    widthPx?: number;
    heightPx?: number;
    dpi?: number;
    [key: string]: unknown;
}
interface ImagePreviewModalProps {
    image: PreviewImage | null;
    onClose: () => void;
    onDelete?: (image: PreviewImage) => void;
    onRegenerate?: (image: PreviewImage) => void | Promise<void>;
    onSaveImage?: (updatedId: string, newImageUrl: string) => Promise<void>;
}
function filterString(filters: FilterState) {
    return [
        `brightness(${filters.brightness}%)`,
        `contrast(${filters.contrast}%)`,
        `saturate(${filters.saturate}%)`,
        `blur(${filters.blur}px)`,
        `grayscale(${filters.grayscale}%)`,
        `sepia(${filters.sepia}%)`,
    ].join(" ");
}
const EXPORT_DPI = 300;
const TRANSPARENT_BACKGROUND_STYLE: React.CSSProperties = {
    backgroundImage: "linear-gradient(45deg, #d1d5db 25%, transparent 25%), linear-gradient(-45deg, #d1d5db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d1d5db 75%), linear-gradient(-45deg, transparent 75%, #d1d5db 75%)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
    backgroundColor: "#ffffff",
};
type PhysicalSize = {
    width: number;
    height: number;
    unit: "mm" | "in";
};
function parsePhysicalSizeLabel(label: string): PhysicalSize {
    const normalized = String(label || "").trim();
    const inchMatch = normalized.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*inch/i);
    if (inchMatch) {
        return {
            width: Number(inchMatch[1]),
            height: Number(inchMatch[2]),
            unit: "in",
        };
    }
    const mmMatch = normalized.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*mm/i);
    if (mmMatch) {
        return {
            width: Number(mmMatch[1]),
            height: Number(mmMatch[2]),
            unit: "mm",
        };
    }
    return {
        width: 45,
        height: 55,
        unit: "mm",
    };
}
function getExportPhysicalSize(label: string, aspectOption: string, aspectRatio?: number): PhysicalSize {
    const base = parsePhysicalSizeLabel(label);
    if (aspectOption === "original" ||
        !aspectRatio ||
        !Number.isFinite(aspectRatio) ||
        aspectRatio <= 0) {
        return base;
    }
    return {
        width: base.width,
        height: base.width / aspectRatio,
        unit: base.unit,
    };
}
function physicalToPixels(physical: PhysicalSize, dpi = EXPORT_DPI) {
    return {
        widthPx: Math.max(1, Math.round(physical.unit === "in"
            ? physical.width * dpi
            : (physical.width / 25.4) * dpi)),
        heightPx: Math.max(1, Math.round(physical.unit === "in"
            ? physical.height * dpi
            : (physical.height / 25.4) * dpi)),
        dpi,
    };
}
function crc32(bytes: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i += 1) {
        crc ^= bytes[i];
        for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}
async function addJpegDpi(blob: Blob, dpi: number): Promise<Blob> {
    const input = new Uint8Array(await blob.arrayBuffer());
    if (input.length < 2 || input[0] !== 0xff || input[1] !== 0xd8) {
        return blob;
    }
    const density = Math.max(1, Math.min(65535, Math.round(dpi)));
    let offset = 2;
    while (offset + 4 <= input.length) {
        if (input[offset] !== 0xff) {
            offset += 1;
            continue;
        }
        const marker = input[offset + 1];
        if (marker === 0xda || marker === 0xd9) {
            break;
        }
        if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) {
            offset += 2;
            continue;
        }
        const segmentLength = (input[offset + 2] << 8) | input[offset + 3];
        if (segmentLength < 2 || offset + 2 + segmentLength > input.length) {
            break;
        }
        const isJfif = marker === 0xe0 &&
            segmentLength >= 16 &&
            input[offset + 4] === 0x4a &&
            input[offset + 5] === 0x46 &&
            input[offset + 6] === 0x49 &&
            input[offset + 7] === 0x46 &&
            input[offset + 8] === 0x00;
        if (isJfif) {
            input[offset + 11] = 1;
            input[offset + 12] = (density >> 8) & 0xff;
            input[offset + 13] = density & 0xff;
            input[offset + 14] = (density >> 8) & 0xff;
            input[offset + 15] = density & 0xff;
            return new Blob([input], {
                type: "image/jpeg",
            });
        }
        offset += 2 + segmentLength;
    }
    const app0 = new Uint8Array(18);
    app0[0] = 0xff;
    app0[1] = 0xe0;
    app0[2] = 0x00;
    app0[3] = 0x10;
    app0[4] = 0x4a;
    app0[5] = 0x46;
    app0[6] = 0x49;
    app0[7] = 0x46;
    app0[8] = 0x00;
    app0[9] = 0x01;
    app0[10] = 0x02;
    app0[11] = 0x01;
    app0[12] = (density >> 8) & 0xff;
    app0[13] = density & 0xff;
    app0[14] = (density >> 8) & 0xff;
    app0[15] = density & 0xff;
    app0[16] = 0x00;
    app0[17] = 0x00;
    const output = new Uint8Array(input.length + app0.length);
    output.set(input.slice(0, 2), 0);
    output.set(app0, 2);
    output.set(input.slice(2), 2 + app0.length);
    return new Blob([output], {
        type: "image/jpeg",
    });
}
async function addPngDpi(blob: Blob, dpi: number): Promise<Blob> {
    const input = new Uint8Array(await blob.arrayBuffer());
    const pngSignature = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    if (input.length < 33 ||
        !pngSignature.every((value, index) => input[index] === value)) {
        return blob;
    }
    const ihdrType = String.fromCharCode(input[12], input[13], input[14], input[15]);
    if (ihdrType !== "IHDR") {
        return blob;
    }
    const pixelsPerMeter = Math.max(1, Math.round(dpi / 0.0254));
    const physData = new Uint8Array(9);
    physData[0] = (pixelsPerMeter >>> 24) & 0xff;
    physData[1] = (pixelsPerMeter >>> 16) & 0xff;
    physData[2] = (pixelsPerMeter >>> 8) & 0xff;
    physData[3] = pixelsPerMeter & 0xff;
    physData[4] = (pixelsPerMeter >>> 24) & 0xff;
    physData[5] = (pixelsPerMeter >>> 16) & 0xff;
    physData[6] = (pixelsPerMeter >>> 8) & 0xff;
    physData[7] = pixelsPerMeter & 0xff;
    physData[8] = 1;
    const chunkData = new Uint8Array(13);
    chunkData.set(new Uint8Array([0x70, 0x48, 0x59, 0x73]), 0);
    chunkData.set(physData, 4);
    const crc = crc32(chunkData);
    const chunk = new Uint8Array(21);
    chunk[0] = 0x00;
    chunk[1] = 0x00;
    chunk[2] = 0x00;
    chunk[3] = 0x09;
    chunk.set(chunkData, 4);
    chunk[17] = (crc >>> 24) & 0xff;
    chunk[18] = (crc >>> 16) & 0xff;
    chunk[19] = (crc >>> 8) & 0xff;
    chunk[20] = crc & 0xff;
    const insertAt = 8 + 25;
    const output = new Uint8Array(input.length + chunk.length);
    output.set(input.slice(0, insertAt), 0);
    output.set(chunk, insertAt);
    output.set(input.slice(insertAt), insertAt + chunk.length);
    return new Blob([output], {
        type: "image/png",
    });
}
async function addDpiMetadata(blob: Blob, format: "jpg" | "png", dpi: number): Promise<Blob> {
    return format === "jpg" ? addJpegDpi(blob, dpi) : addPngDpi(blob, dpi);
}
async function canvasToBlob(canvas: HTMLCanvasElement, format: "jpg" | "png"): Promise<Blob> {
    const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
    const quality = format === "jpg" ? 0.95 : undefined;
    let exportCanvas = canvas;
    if (format === "jpg") {
        const flattened = document.createElement("canvas");
        flattened.width = canvas.width;
        flattened.height = canvas.height;
        const context = flattened.getContext("2d");
        if (!context) {
            throw new Error("Could not create JPG export canvas.");
        }
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, flattened.width, flattened.height);
        context.drawImage(canvas, 0, 0);
        exportCanvas = flattened;
    }
    const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, mimeType, quality);
    });
    if (!blob) {
        throw new Error("Could not encode the image for export.");
    }
    return blob;
}
function downloadBlob(blob: Blob, filename: string) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
export default function ImagePreviewModal({
    image, onClose, onDelete, onRegenerate, onSaveImage,
}: ImagePreviewModalProps) {
    const { t } = useAiEditorText();
    const [previewZoom, setPreviewZoom] = useState(100);
    const [previewRotate, setPreviewRotate] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [showMobileInfo, setShowMobileInfo] = useState(false);
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [selectedAspect, setSelectedAspect] = useState("original");
    const [isComparing, setIsComparing] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const downloadMenuRef = useRef<HTMLDivElement>(null);
    const compareTimerRef = useRef<number | null>(null);
    const longPressRef = useRef(false);
    useEffect(() => {
        if (!image)
            return;
        setPreviewZoom(100);
        setPreviewRotate(0);
        setIsEditOpen(false);
        setShowMobileInfo(false);
        setFilters(DEFAULT_FILTERS);
        setSelectedAspect("original");
        setIsComparing(false);
        setShowDownloadMenu(false);
        setActionError(null);
    }, [image?.id, image?.url]);
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                if (showDownloadMenu)
                    setShowDownloadMenu(false);
                else if (isEditOpen)
                    setIsEditOpen(false);
                else
                    onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isEditOpen, onClose, showDownloadMenu]);
    useEffect(() => {
        if (!image)
            return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
            if (compareTimerRef.current)
                window.clearTimeout(compareTimerRef.current);
        };
    }, [image]);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (downloadMenuRef.current &&
                !downloadMenuRef.current.contains(event.target as Node)) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    if (!image)
        return null;
    const displayOriginalUrl = image.originalUrl || image.url;
    const photoSizeLabel = image.size || "35×45 mm";
    const bgHexColor = image.bgColor || "#FFFFFF";
    const isTransparentBackground = bgHexColor === "transparent";
    const clothingInfo = image.clothingStyle || "Default Clothing";
    const currentAspectOption = ASPECT_RATIOS.find((option) => option.value === selectedAspect);
    const handleResetAll = () => {
        setFilters(DEFAULT_FILTERS);
        setSelectedAspect("original");
        setPreviewZoom(100);
        setPreviewRotate(0);
        setIsComparing(false);
        setActionError(null);
    };
    const loadImage = async (src: string): Promise<HTMLImageElement> => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.decoding = "async";
        img.src = src;
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Unable to load image for editing."));
        });
        return img;
    };
    const generateEditedCanvas = async (): Promise<HTMLCanvasElement> => {
        const img = await loadImage(image.url);
        const sourceWidth = img.naturalWidth || img.width;
        const sourceHeight = img.naturalHeight || img.height;
        if (!sourceWidth || !sourceHeight)
            throw new Error("Invalid image dimensions.");
        let srcX = 0;
        let srcY = 0;
        let srcWidth = sourceWidth;
        let srcHeight = sourceHeight;
        if (currentAspectOption?.ratio) {
            const targetRatio = currentAspectOption.ratio;
            const sourceRatio = sourceWidth / sourceHeight;
            if (sourceRatio > targetRatio) {
                srcWidth = sourceHeight * targetRatio;
                srcX = (sourceWidth - srcWidth) / 2;
            }
            else {
                srcHeight = sourceWidth / targetRatio;
                srcY = (sourceHeight - srcHeight) / 2;
            }
        }
        const normalizedRotation = ((previewRotate % 360) + 360) % 360;
        const swapDimensions = normalizedRotation === 90 || normalizedRotation === 270;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(swapDimensions ? srcHeight : srcWidth));
        canvas.height = Math.max(1, Math.round(swapDimensions ? srcWidth : srcHeight));
        const ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Canvas is not supported by this browser.");
        ctx.filter = filterString(filters);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((normalizedRotation * Math.PI) / 180);
        ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, -srcWidth / 2, -srcHeight / 2, srcWidth, srcHeight);
        return canvas;
    };
    const getCurrentExportSize = () => {
        const physical = getExportPhysicalSize(photoSizeLabel, selectedAspect, currentAspectOption?.ratio);
        return {
            physical,
            ...physicalToPixels(physical, image.dpi || EXPORT_DPI),
        };
    };
    const renderCanvasToExactExportSize = async () => {
        const sourceCanvas = await generateEditedCanvas();
        const target = getCurrentExportSize();
        const scale = Math.min(target.widthPx / sourceCanvas.width, target.heightPx / sourceCanvas.height);
        const drawWidth = Math.max(1, Math.round(sourceCanvas.width * scale));
        const drawHeight = Math.max(1, Math.round(sourceCanvas.height * scale));
        const drawX = Math.round((target.widthPx - drawWidth) / 2);
        const drawY = Math.max(0, target.heightPx - drawHeight);
        const outputCanvas = document.createElement("canvas");
        outputCanvas.width = target.widthPx;
        outputCanvas.height = target.heightPx;
        const context = outputCanvas.getContext("2d");
        if (!context) {
            throw new Error("Could not create exact-size export canvas.");
        }
        const fill = image.bgColor || "#FFFFFF";
        if (fill === "transparent") {
            context.clearRect(0, 0, target.widthPx, target.heightPx);
        }
        else {
            context.fillStyle = /^#[0-9A-F]{6}$/i.test(fill) ? fill : "#FFFFFF";
            context.fillRect(0, 0, target.widthPx, target.heightPx);
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, drawX, drawY, drawWidth, drawHeight);
        return {
            canvas: outputCanvas,
            widthPx: target.widthPx,
            heightPx: target.heightPx,
            dpi: target.dpi,
            physical: target.physical,
        };
    };
    const generateExactEditedImageDataUrl = async (format: "jpeg" | "png" = "jpeg") => {
        const result = await renderCanvasToExactExportSize();
        return format === "png"
            ? result.canvas.toDataURL("image/png")
            : result.canvas.toDataURL("image/jpeg", 0.95);
    };
    const handleSaveEditedImage = async () => {
        if (!onSaveImage || !image.id)
            return;
        setIsSaving(true);
        setActionError(null);
        try {
            const editedUrl = await generateExactEditedImageDataUrl(image.bgColor === "transparent" ? "png" : "jpeg");
            await onSaveImage(image.id, editedUrl);
            setIsEditOpen(false);
        }
        catch (error) {
            console.error("Save image error:", error);
            setActionError(error instanceof Error
                ? error.message
                : "Failed to save image changes.");
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleRegenerateClick = async () => {
        if (!onRegenerate)
            return;
        setIsRegenerating(true);
        setActionError(null);
        try {
            const editedUrl = await generateExactEditedImageDataUrl(image.bgColor === "transparent" ? "png" : "jpeg");
            await onRegenerate({
                ...image,
                url: editedUrl,
                originalUrl: displayOriginalUrl,
            });
            onClose();
        }
        catch (error) {
            console.error("Regenerate error:", error);
            setActionError(error instanceof Error ? error.message : "Failed to prepare the photo.");
        }
        finally {
            setIsRegenerating(false);
        }
    };
    const handleDownloadFormat = async (format: "jpg" | "png") => {
        setShowDownloadMenu(false);
        setIsDownloading(true);
        setActionError(null);
        try {
            const exported = await renderCanvasToExactExportSize();
            const rawBlob = await canvasToBlob(exported.canvas, format);
            const finalBlob = await addDpiMetadata(rawBlob, format, exported.dpi);
            const sizeToken = image.size
                ?.replace(/[×x]/g, "x")
                .replace(/\s+/g, "")
                .replace(/[^a-zA-Z0-9._-]/g, "") || "photo";
            downloadBlob(finalBlob, `${sizeToken}-${exported.widthPx}x${exported.heightPx}-${exported.dpi}dpi-${Date.now()}.${format}`);
        }
        catch (error) {
            console.error("Download failed:", error);
            setActionError(error instanceof Error
                ? error.message
                : "The image could not be exported.");
        }
        finally {
            setIsDownloading(false);
        }
    };
    const drawContain = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, width: number, height: number) => {
        const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
        const drawWidth = img.naturalWidth * scale;
        const drawHeight = img.naturalHeight * scale;
        ctx.drawImage(img, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
    };
    const handleDownloadPrintSheet = async () => {
        setShowDownloadMenu(false);
        setIsDownloading(true);
        setActionError(null);
        try {
            const editedCanvas = await generateEditedCanvas();
            const source = new Image();
            source.src = editedCanvas.toDataURL("image/png");
            await new Promise<void>((resolve, reject) => {
                source.onload = () => resolve();
                source.onerror = () => reject(new Error("Unable to build print sheet."));
            });
            const printCanvas = document.createElement("canvas");
            printCanvas.width = 1800;
            printCanvas.height = 1200;
            const ctx = printCanvas.getContext("2d");
            if (!ctx)
                throw new Error("Canvas is not supported by this browser.");
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, printCanvas.width, printCanvas.height);
            const cols = 4;
            const rows = 2;
            const gap = 24;
            const cellWidth = (printCanvas.width - gap * (cols + 1)) / cols;
            const cellHeight = (printCanvas.height - gap * (rows + 1)) / rows;
            for (let row = 0; row < rows; row += 1) {
                for (let col = 0; col < cols; col += 1) {
                    const x = gap + col * (cellWidth + gap);
                    const y = gap + row * (cellHeight + gap);
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(x, y, cellWidth, cellHeight);
                    drawContain(ctx, source, x, y, cellWidth, cellHeight);
                    ctx.strokeStyle = "#D1D5DB";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, cellWidth, cellHeight);
                }
            }
            const rawBlob = await canvasToBlob(printCanvas, "jpg");
            const finalBlob = await addDpiMetadata(rawBlob, "jpg", 300);
            downloadBlob(finalBlob, `print-sheet-4x6in-1800x1200-300dpi-${Date.now()}.jpg`);
        }
        catch (error) {
            console.error("Print sheet generation failed:", error);
            setActionError("Could not create the print sheet. Please retry with a directly accessible image.");
        }
        finally {
            setIsDownloading(false);
        }
    };
    const handlePrint = async () => {
        setActionError(null);
        let printRoot: HTMLDivElement | null = null;
        let printStyle: HTMLStyleElement | null = null;
        let cleanupTimer: number | null = null;
        let cleanedUp = false;
        const cleanupPrintDocument = () => {
            if (cleanedUp)
                return;
            cleanedUp = true;
            if (cleanupTimer !== null) {
                window.clearTimeout(cleanupTimer);
                cleanupTimer = null;
            }
            window.removeEventListener("afterprint", cleanupPrintDocument);
            if (printRoot?.parentNode) {
                printRoot.parentNode.removeChild(printRoot);
            }
            if (printStyle?.parentNode) {
                printStyle.parentNode.removeChild(printStyle);
            }
        };
        try {
            const exported = await renderCanvasToExactExportSize();
            const imageData = exported.canvas.toDataURL("image/jpeg", 0.95);
            const unit = exported.physical.unit;
            const widthText = `${exported.physical.width}${unit}`;
            const heightText = `${exported.physical.height}${unit}`;
            printStyle = document.createElement("style");
            printStyle.setAttribute("data-sohoz-print-style", "true");
            printStyle.textContent = `
@page {
  size: ${widthText} ${heightText};
  margin: 0;
}

@media screen {
  #__sohoz_print_root {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(15, 23, 42, 0.96);
  }

  #__sohoz_print_preview {
    width: min(92vw, 520px);
    height: min(92vh, 720px);
    display: flex;
    align-items: center;
    justify-content: center;
    background: #111827;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  }
}

@media print {
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    width: ${widthText} !important;
    height: ${heightText} !important;
    background: #fff !important;
    overflow: hidden !important;
  }

  body > *:not(#__sohoz_print_root) {
    display: none !important;
  }

  #__sohoz_print_root {
    position: static !important;
    display: block !important;
    width: ${widthText} !important;
    height: ${heightText} !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    overflow: hidden !important;
  }

  #__sohoz_print_preview {
    width: ${widthText} !important;
    height: ${heightText} !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    overflow: hidden !important;
  }

  #__sohoz_print_image {
    display: block !important;
    width: ${widthText} !important;
    height: ${heightText} !important;
    max-width: none !important;
    max-height: none !important;
    object-fit: fill !important;
    margin: 0 !important;
    padding: 0 !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}
`;
            document.head.appendChild(printStyle);
            printRoot = document.createElement("div");
            printRoot.id = "__sohoz_print_root";
            printRoot.setAttribute("aria-hidden", "true");
            const printPreview = document.createElement("div");
            printPreview.id = "__sohoz_print_preview";
            const printImage = document.createElement("img");
            printImage.id = "__sohoz_print_image";
            printImage.src = imageData;
            printImage.alt = "Photo for printing";
            printImage.decoding = "sync";
            printImage.style.width = widthText;
            printImage.style.height = heightText;
            printImage.style.objectFit = "fill";
            printPreview.appendChild(printImage);
            printRoot.appendChild(printPreview);
            document.body.appendChild(printRoot);
            window.addEventListener("afterprint", cleanupPrintDocument);
            cleanupTimer = window.setTimeout(cleanupPrintDocument, 120000);
            const printImageReady = () => {
                window.setTimeout(() => {
                    window.print();
                }, 50);
            };
            if (printImage.complete) {
                printImageReady();
            }
            else {
                printImage.addEventListener("load", printImageReady, { once: true });
                printImage.addEventListener("error", () => {
                    cleanupPrintDocument();
                    throw new Error("Unable to prepare the photo for printing.");
                }, { once: true });
            }
        }
        catch (error) {
            cleanupPrintDocument();
            console.error("Print failed:", error);
            setActionError(error instanceof Error ? error.message : "Could not print this image.");
        }
    };
    const handleShare = async () => {
        setActionError(null);
        try {
            if (navigator.share) {
                await navigator.share({
                    title: "Generated photo",
                    url: image.url,
                });
                return;
            }
            await navigator.clipboard.writeText(image.url);
            setActionError("Image link copied to clipboard.");
        }
        catch (error) {
            if ((error as DOMException)?.name === "AbortError")
                return;
            try {
                await navigator.clipboard.writeText(image.url);
                setActionError("Image link copied to clipboard.");
            }
            catch {
                setActionError("Sharing is not available in this browser.");
            }
        }
    };
    const handleDelete = () => {
        if (onDelete)
            onDelete(image);
    };
    const startCompare = () => {
        if (compareTimerRef.current)
            window.clearTimeout(compareTimerRef.current);
        longPressRef.current = false;
        compareTimerRef.current = window.setTimeout(() => {
            longPressRef.current = true;
            setIsComparing(true);
        }, 450);
    };
    const endCompare = () => {
        if (compareTimerRef.current) {
            window.clearTimeout(compareTimerRef.current);
            compareTimerRef.current = null;
        }
        if (longPressRef.current) {
            setIsComparing(false);
            longPressRef.current = false;
        }
        else {
            setIsComparing((previous) => !previous);
        }
    };
    return (<div className="fixed inset-0 z-[999] bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between overflow-hidden select-none">
      {/* Header Toolbar */}
      <div className="min-h-[56px] py-2 sm:py-0 sm:h-16 bg-[#E2E8F0] border-b border-slate-300 flex items-center justify-between px-2 sm:px-6 shrink-0 z-30 overflow-visible relative">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <button type="button" onPointerDown={startCompare} onPointerUp={endCompare} onPointerCancel={() => {
            if (compareTimerRef.current)
                window.clearTimeout(compareTimerRef.current);
            setIsComparing(false);
            longPressRef.current = false;
        }} className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 sm:gap-1.5 transition cursor-pointer border ${isComparing
            ? "bg-[#10B981] text-white border-[#10B981] font-bold"
            : "bg-slate-200 hover:bg-slate-300 text-[#0F172A] border-transparent"}`} title={t("Click to toggle original photo. Press and hold to preview it.")}>
            <Eye size={14}/>
            <span className="hidden sm:inline">
              {isComparing ? <AiT>{"Original Photo"}</AiT> : <AiT>{"Compare"}</AiT>}
            </span>
            <span className="sm:hidden">{isComparing ? <AiT>{"Orig"}</AiT> : <AiT>{"Comp"}</AiT>}</span>
          </button>

          <button type="button" onClick={() => setShowMobileInfo((previous) => !previous)} className="lg:hidden bg-slate-200 hover:bg-slate-300 text-[#0F172A] px-2 py-1.5 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer" aria-label={t("Show image details")}>
            <Info size={14}/>
          </button>

          <button type="button" onClick={handleShare} className="hidden md:flex bg-slate-200 hover:bg-slate-300 text-[#0F172A] px-3 py-1.5 rounded-lg text-xs items-center gap-1.5 transition cursor-pointer">
            <Share2 size={14}/><AiT>{"Share\r\n          "}</AiT></button>

          {onSaveImage && image.id && (<button type="button" onClick={handleSaveEditedImage} disabled={isSaving} className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white px-2 sm:px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 sm:gap-1.5 transition cursor-pointer">
              {isSaving ? (<Loader2 size={14} className="animate-spin"/>) : (<Save size={14}/>)}
              <span className="hidden sm:inline">
                {isSaving ? <AiT>{"Saving..."}</AiT> : <AiT>{"Save Changes"}</AiT>}
              </span>
              <span className="sm:hidden"><AiT>{"Save"}</AiT></span>
            </button>)}

          {onRegenerate && (<button type="button" onClick={handleRegenerateClick} disabled={isRegenerating} className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white px-2 sm:px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 sm:gap-1.5 transition cursor-pointer">
              {isRegenerating ? (<Loader2 size={14} className="animate-spin"/>) : (<RotateCw size={14}/>)}
              <span className="hidden sm:inline">
                {isRegenerating ? <AiT>{"Processing..."}</AiT> : <AiT>{"Regenerate"}</AiT>}
              </span>
              <span className="sm:hidden"><AiT>{"Retry"}</AiT></span>
            </button>)}

          {/* Download Dropdown */}
          <div className="relative z-50" ref={downloadMenuRef}>
            <button type="button" onClick={() => setShowDownloadMenu((previous) => !previous)} disabled={isDownloading} className="bg-[#10B981] hover:bg-emerald-600 disabled:opacity-50 text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer shadow-md">
              {isDownloading ? (<Loader2 size={14} className="animate-spin"/>) : (<Download size={14}/>)}
              <span>{isDownloading ? <AiT>{"Downloading..."}</AiT> : <AiT>{"Download"}</AiT>}</span>
              <ChevronDown size={14}/>
            </button>

            {showDownloadMenu && (<div className="absolute left-0 top-full mt-2 w-60 sm:w-64 bg-[#F8FAFC] text-[#0F172A] rounded-xl shadow-2xl border border-slate-300 py-2 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-slate-200 font-semibold text-slate-500 text-[10px] uppercase"><AiT>{"Select Format\r\n                "}</AiT></div>
                <button type="button" onClick={() => handleDownloadFormat("jpg")} className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-slate-100 flex items-center gap-2.5 transition cursor-pointer">
                  <div className="p-1.5 bg-[#10B981]/20 text-[#10B981] rounded-lg shrink-0">
                    <FileImage size={16}/>
                  </div>
                  <div>
                    <div className="font-semibold text-[#0F172A]"><AiT>{"Standard JPG\r\n                    "}</AiT></div>
                    <div className="text-[10px] text-slate-500"><AiT>{"Recommended for Passport &amp; Visa\r\n                    "}</AiT></div>
                  </div>
                </button>
                <button type="button" onClick={() => handleDownloadFormat("png")} className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-slate-100 flex items-center gap-2.5 transition cursor-pointer">
                  <div className="p-1.5 bg-[#2563EB]/20 text-[#2563EB] rounded-lg shrink-0">
                    <FileImage size={16}/>
                  </div>
                  <div>
                    <div className="font-semibold text-[#0F172A]"><AiT>{"HD PNG Image\r\n                    "}</AiT></div>
                    <div className="text-[10px] text-slate-500">
                      {isTransparentBackground
            ? <AiT>{"Lossless PNG • keeps transparency"}</AiT> : <AiT>{"Lossless High Quality"}</AiT>}
                    </div>
                  </div>
                </button>
                <div className="my-1 border-t border-slate-200"/>
                <button type="button" onClick={handleDownloadPrintSheet} className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-slate-100 flex items-center gap-2.5 transition cursor-pointer">
                  <div className="p-1.5 bg-[#2563EB]/20 text-[#2563EB] rounded-lg shrink-0">
                    <Grid size={16}/>
                  </div>
                  <div>
                    <div className="font-semibold text-[#0F172A]"><AiT>{"Print Sheet (4\u00D76&quot;)\r\n                    "}</AiT></div>
                    <div className="text-[10px] text-slate-500"><AiT>{"8-copy grid layout\r\n                    "}</AiT></div>
                  </div>
                </button>
              </div>)}
          </div>

          <button type="button" onClick={handlePrint} className="hidden md:flex bg-slate-200 hover:bg-slate-300 text-[#0F172A] px-3 py-1.5 rounded-lg text-xs items-center gap-1.5 transition cursor-pointer">
            <Printer size={14}/><AiT>{"Print\r\n          "}</AiT></button>

          <button type="button" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer">
            <Trash2 size={14}/>
            <span className="hidden sm:inline"><AiT>{"Delete"}</AiT></span>
          </button>

          <button type="button" onClick={() => setIsEditOpen((previous) => !previous)} className={`${isEditOpen ? "bg-[#2563EB] text-white" : "bg-slate-200 hover:bg-slate-300 text-[#0F172A]"} px-2.5 sm:px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer`}>
            <Edit3 size={14}/><AiT>{"Edit\r\n          "}</AiT></button>
        </div>

        <button type="button" onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white p-1.5 sm:p-2 rounded-lg transition cursor-pointer shrink-0 ml-1" aria-label={t("Close preview")}>
          <X size={18}/>
        </button>
      </div>

      {actionError && (<div className="absolute top-20 left-1/2 z-[70] -translate-x-1/2 max-w-[min(92vw,680px)] rounded-xl border border-slate-300 bg-[#E2E8F0] px-4 py-2.5 text-xs font-medium text-[#0F172A] shadow-xl">
          {actionError}
        </div>)}

      {/* Main Preview Container */}
      <div className="flex-1 w-full flex flex-col lg:flex-row items-center justify-between overflow-hidden relative bg-[#F8FAFC] p-2 sm:p-4 gap-3">
        {/* Info Sidebar */}
        <div className={`w-full lg:w-64 bg-[#E2E8F0] border border-slate-300 rounded-xl p-3 sm:p-4 text-[#0F172A] flex-col gap-3 shadow-xl shrink-0 ${showMobileInfo ? "flex" : "hidden lg:flex"}`}>
          <div className="flex items-center justify-between border-b border-slate-300 pb-2">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-[#2563EB]"/>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A]"><AiT>{"Generation Info\r\n              "}</AiT></h3>
            </div>
            <button type="button" onClick={() => setShowMobileInfo(false)} className="lg:hidden text-slate-500 hover:text-[#0F172A]">
              <X size={16}/>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 text-xs text-slate-700">
            <div className="flex justify-between items-center bg-white/60 px-3 py-2 rounded-lg border border-slate-200">
              <span className="text-slate-500"><AiT>{"Photo Size:"}</AiT></span>
              <span className="font-bold text-[#2563EB]">{photoSizeLabel}</span>
            </div>
            <div className="flex justify-between items-center bg-white/60 px-3 py-2 rounded-lg border border-slate-200">
              <span className="text-slate-500"><AiT>{"Background:"}</AiT></span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: bgHexColor }}/>
                <span className="font-medium text-[#0F172A]">
                  {isTransparentBackground ? <AiT>{"Transparent"}</AiT> : bgHexColor}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center bg-white/60 px-3 py-2 rounded-lg border border-slate-200">
              <span className="text-slate-500"><AiT>{"Clothing:"}</AiT></span>
              <span className="font-medium text-[#0F172A] truncate max-w-[100px]">
                {clothingInfo}
              </span>
            </div>
          </div>
        </div>

        {/* Center Canvas Preview */}
        <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden relative p-2">
          <div className="max-h-[55vh] sm:max-h-[75vh] max-w-[90vw] lg:max-w-[80vw] flex items-center justify-center transition-all duration-200 ease-out overflow-hidden rounded-lg shadow-2xl relative" style={{
            ...(isTransparentBackground
                ? TRANSPARENT_BACKGROUND_STYLE
                : { backgroundColor: bgHexColor }),
            transform: `scale(${previewZoom / 100}) rotate(${isComparing ? 0 : previewRotate}deg)`,
        }}>
            {isComparing && (<div className="absolute top-3 left-3 bg-[#10B981] text-white text-[10px] px-2.5 py-1 rounded-md z-10 uppercase tracking-wider font-bold border border-emerald-400 shadow-lg"><AiT>{"Original Photo\r\n              "}</AiT></div>)}
            <img src={isComparing ? displayOriginalUrl : image.url} alt={t("Full Preview")} className="max-h-[55vh] sm:max-h-[75vh] max-w-[90vw] lg:max-w-[80vw] object-contain block transition-[filter] duration-150" style={{ filter: isComparing ? "none" : filterString(filters) }}/>
          </div>
        </div>

        <ImageEditSidebar isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} filters={filters} setFilters={setFilters} selectedAspect={selectedAspect} setSelectedAspect={setSelectedAspect} onReset={handleResetAll}/>
      </div>

      {/* Bottom Controls Bar */}
      <div className="h-12 sm:h-14 bg-[#E2E8F0] border-t border-slate-300 flex items-center justify-center gap-2 sm:gap-3 shrink-0 text-[#0F172A] text-xs select-none z-10 px-2">
        <button type="button" onClick={() => setPreviewZoom((previous) => Math.max(previous - 10, 50))} className="bg-slate-200 hover:bg-slate-300 text-[#0F172A] px-2.5 py-1 rounded font-bold transition cursor-pointer"><AiT>{"-\r\n        "}</AiT></button>
        <span className="w-10 text-center font-medium text-xs">
          {previewZoom}<AiT>{"%\r\n        "}</AiT></span>
        <button type="button" onClick={() => setPreviewZoom((previous) => Math.min(previous + 10, 300))} className="bg-slate-200 hover:bg-slate-300 text-[#0F172A] px-2.5 py-1 rounded font-bold transition cursor-pointer"><AiT>{"+\r\n        "}</AiT></button>
        <button type="button" onClick={() => setPreviewRotate((previous) => (previous + 90) % 360)} className="bg-slate-200 hover:bg-slate-300 text-[#0F172A] p-1.5 rounded transition cursor-pointer" title={t("Rotate")}>
          <RotateCw size={14}/>
        </button>
        <button type="button" onClick={handleResetAll} className="bg-slate-200 hover:bg-slate-300 text-[#0F172A] px-2 py-1 rounded text-[11px] transition ml-1 cursor-pointer"><AiT>{"Reset All\r\n        "}</AiT></button>
      </div>
    </div>);
}
