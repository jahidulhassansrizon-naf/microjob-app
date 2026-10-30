"use client";
import { AiT, useAiEditorText } from "./aiEditorI18n";
import React, { useEffect, useRef, useState } from "react";
import { X, RotateCw, Download, Printer, Trash2, Edit3, Share2, Eye, Loader2, Save, Info, ChevronDown, FileImage, Grid, } from "lucide-react";
import { CLOTHING_NAMES } from "./clothingStyles";
import AiPrintStudioModal from "./AiPrintStudioModal";
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
    /** Open the Edit sidebar immediately when the modal opens. */
    startWithEdit?: boolean;
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
import { EXPORT_DPI, addDpiMetadata, canvasToBlob, downloadBlob, getExportPhysicalSize, isOriginalSizeLabel, physicalToPixels, printSinglePhoto, } from "./photoExport";
const TRANSPARENT_BACKGROUND_STYLE: React.CSSProperties = {
    backgroundImage: "linear-gradient(45deg, #d1d5db 25%, transparent 25%), linear-gradient(-45deg, #d1d5db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d1d5db 75%), linear-gradient(-45deg, transparent 75%, #d1d5db 75%)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
    backgroundColor: "#ffffff",
};
export default function ImagePreviewModal({
    image, onClose, onDelete, onRegenerate, onSaveImage, startWithEdit,
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
    const [printStudioOpen, setPrintStudioOpen] = useState(false);
    const [printStudioImage, setPrintStudioImage] = useState<string | null>(null);
    const [printStudioPreset, setPrintStudioPreset] = useState<{ id: string; label: string; widthMm: number; heightMm: number } | null>(null);
    const downloadMenuRef = useRef<HTMLDivElement>(null);
    const compareTimerRef = useRef<number | null>(null);
    const longPressRef = useRef(false);
    useEffect(() => {
        if (!image)
            return;
        setPreviewZoom(100);
        setPreviewRotate(0);
        setIsEditOpen(!!startWithEdit);
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
    const styleMatch = /^Style (\d+)$/.exec(image.clothingStyle || "");
    const clothingInfo = styleMatch
        ? (CLOTHING_NAMES[Number(styleMatch[1])] || "Default Clothing")
        : (image.clothingStyle || "Default Clothing");
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
        // "Original Size" means the user generated without choosing a photo size.
        // Export exactly what they generated (its own pixels and ratio) instead of
        // forcing it into a passport-size canvas. The label alone decides this,
        // because a saved record may carry a non-empty sizeType.
        if (isOriginalSizeLabel(photoSizeLabel)) {
            const dpi = image.dpi || EXPORT_DPI;
            return {
                canvas: sourceCanvas,
                widthPx: sourceCanvas.width,
                heightPx: sourceCanvas.height,
                dpi,
                physical: {
                    width: (sourceCanvas.width / dpi) * 25.4,
                    height: (sourceCanvas.height / dpi) * 25.4,
                    unit: "mm" as const,
                },
            };
        }
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
        try {
            const editedCanvas = await generateEditedCanvas();
            const dataUrl = editedCanvas.toDataURL("image/png");
            const dpi = Number(image?.dpi) || 0;
            const wPx = Number(image?.widthPx) || 0;
            const hPx = Number(image?.heightPx) || 0;
            let widthMm: number;
            let heightMm: number;
            if (dpi > 0 && wPx > 0 && hPx > 0) {
                widthMm = (wPx / dpi) * 25.4;
                heightMm = (hPx / dpi) * 25.4;
            }
            else {
                widthMm = 100;
                heightMm = (100 * editedCanvas.height) / Math.max(1, editedCanvas.width);
            }
            setPrintStudioPreset({ id: "ai-photo", label: "Photo", widthMm, heightMm });
            setPrintStudioImage(dataUrl);
            setPrintStudioOpen(true);
        }
        catch (error) {
            console.error("Opening print studio failed:", error);
            setActionError(error instanceof Error ? error.message : "Could not open the print studio.");
        }
    };
    const handlePrintSingle = async () => {
        setActionError(null);
        try {
            const exported = await renderCanvasToExactExportSize();
            await printSinglePhoto(image, exported);
        }
        catch (error) {
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
    return (<div className="fixed inset-0 z-[999] bg-[#F2E8D2] text-[#3B2F1E] flex flex-col justify-between overflow-hidden select-none">
      {/* Header Toolbar */}
      <div className="min-h-[56px] py-2 sm:py-0 sm:h-16 bg-[#E3D6B8] border-b border-stone-300 flex items-center justify-between px-2 sm:px-6 shrink-0 z-30 overflow-visible relative">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <button type="button" onPointerDown={startCompare} onPointerUp={endCompare} onPointerCancel={() => {
            if (compareTimerRef.current)
                window.clearTimeout(compareTimerRef.current);
            setIsComparing(false);
            longPressRef.current = false;
        }} className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 sm:gap-1.5 transition cursor-pointer border ${isComparing
            ? "bg-[#10B981] text-white border-[#10B981] font-bold"
            : "bg-stone-200 hover:bg-stone-300 text-[#3B2F1E] border-transparent"}`} title={t("Click to toggle original photo. Press and hold to preview it.")}>
            <Eye size={14}/>
            <span className="hidden sm:inline">
              {isComparing ? <AiT>{"Original Photo"}</AiT> : <AiT>{"Compare"}</AiT>}
            </span>
            <span className="sm:hidden">{isComparing ? <AiT>{"Orig"}</AiT> : <AiT>{"Comp"}</AiT>}</span>
          </button>

          <button type="button" onClick={() => setShowMobileInfo((previous) => !previous)} className="lg:hidden bg-stone-200 hover:bg-stone-300 text-[#3B2F1E] px-2 py-1.5 rounded-lg text-sm flex items-center gap-1 transition cursor-pointer" aria-label={t("Show image details")}>
            <Info size={14}/>
          </button>

          <button type="button" onClick={handleShare} className="hidden md:flex bg-stone-200 hover:bg-stone-300 text-[#3B2F1E] px-3 py-1.5 rounded-lg text-sm items-center gap-1.5 transition cursor-pointer">
            <Share2 size={14}/><AiT>{"Share\r\n          "}</AiT></button>

          {onSaveImage && image.id && (<button type="button" onClick={handleSaveEditedImage} disabled={isSaving} className="bg-[#DC2626] hover:bg-red-700 disabled:opacity-50 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 sm:gap-1.5 transition cursor-pointer">
              {isSaving ? (<Loader2 size={14} className="animate-spin"/>) : (<Save size={14}/>)}
              <span className="hidden sm:inline">
                {isSaving ? <AiT>{"Saving..."}</AiT> : <AiT>{"Save Changes"}</AiT>}
              </span>
              <span className="sm:hidden"><AiT>{"Save"}</AiT></span>
            </button>)}

          {onRegenerate && (<button type="button" onClick={handleRegenerateClick} disabled={isRegenerating} className="bg-[#DC2626] hover:bg-red-700 disabled:opacity-50 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 sm:gap-1.5 transition cursor-pointer">
              {isRegenerating ? (<Loader2 size={14} className="animate-spin"/>) : (<RotateCw size={14}/>)}
              <span className="hidden sm:inline">
                {isRegenerating ? <AiT>{"Processing..."}</AiT> : <AiT>{"Regenerate"}</AiT>}
              </span>
              <span className="sm:hidden"><AiT>{"Retry"}</AiT></span>
            </button>)}

          {/* Download Dropdown */}
          <div className="relative z-50" ref={downloadMenuRef}>
            <button type="button" onClick={() => setShowDownloadMenu((previous) => !previous)} disabled={isDownloading} className="bg-[#10B981] hover:bg-emerald-600 disabled:opacity-50 text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition cursor-pointer shadow-md">
              {isDownloading ? (<Loader2 size={14} className="animate-spin"/>) : (<Download size={14}/>)}
              <span>{isDownloading ? <AiT>{"Downloading..."}</AiT> : <AiT>{"Download"}</AiT>}</span>
              <ChevronDown size={14}/>
            </button>

            {showDownloadMenu && (<div className="absolute left-0 top-full mt-2 w-60 sm:w-64 bg-[#F2E8D2] text-[#3B2F1E] rounded-xl shadow-2xl border border-stone-300 py-2 z-50 text-sm">
                <div className="px-3 py-1.5 border-b border-stone-200 font-semibold text-stone-500 text-[12px] uppercase"><AiT>{"Select Format\r\n                "}</AiT></div>
                <button type="button" onClick={() => handleDownloadFormat("jpg")} className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-stone-100 flex items-center gap-2.5 transition cursor-pointer">
                  <div className="p-1.5 bg-[#10B981]/20 text-[#10B981] rounded-lg shrink-0">
                    <FileImage size={16}/>
                  </div>
                  <div>
                    <div className="font-semibold text-[#3B2F1E]"><AiT>{"Standard JPG\r\n                    "}</AiT></div>
                    <div className="text-[12px] text-stone-500"><AiT>{"Recommended for Passport &amp; Visa\r\n                    "}</AiT></div>
                  </div>
                </button>
                <button type="button" onClick={() => handleDownloadFormat("png")} className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-stone-100 flex items-center gap-2.5 transition cursor-pointer">
                  <div className="p-1.5 bg-[#DC2626]/20 text-[#DC2626] rounded-lg shrink-0">
                    <FileImage size={16}/>
                  </div>
                  <div>
                    <div className="font-semibold text-[#3B2F1E]"><AiT>{"HD PNG Image\r\n                    "}</AiT></div>
                    <div className="text-[12px] text-stone-500">
                      {isTransparentBackground
            ? <AiT>{"Lossless PNG • keeps transparency"}</AiT> : <AiT>{"Lossless High Quality"}</AiT>}
                    </div>
                  </div>
                </button>
                <div className="my-1 border-t border-stone-200"/>
                <button type="button" onClick={handleDownloadPrintSheet} className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-stone-100 flex items-center gap-2.5 transition cursor-pointer">
                  <div className="p-1.5 bg-[#DC2626]/20 text-[#DC2626] rounded-lg shrink-0">
                    <Grid size={16}/>
                  </div>
                  <div>
                    <div className="font-semibold text-[#3B2F1E]"><AiT>{"Print Sheet (4\u00D76&quot;)\r\n                    "}</AiT></div>
                    <div className="text-[12px] text-stone-500"><AiT>{"8-copy grid layout\r\n                    "}</AiT></div>
                  </div>
                </button>
              </div>)}
          </div>

          <button type="button" onClick={handlePrint} className="hidden md:flex bg-stone-200 hover:bg-stone-300 text-[#3B2F1E] px-3 py-1.5 rounded-lg text-sm items-center gap-1.5 transition cursor-pointer">
            <Printer size={14}/><AiT>{"Print\r\n          "}</AiT></button>

          <button type="button" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition cursor-pointer">
            <Trash2 size={14}/>
            <span className="hidden sm:inline"><AiT>{"Delete"}</AiT></span>
          </button>

          <button type="button" onClick={() => setIsEditOpen((previous) => !previous)} className={`${isEditOpen ? "bg-[#DC2626] text-white" : "bg-stone-200 hover:bg-stone-300 text-[#3B2F1E]"} px-2.5 sm:px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition cursor-pointer`}>
            <Edit3 size={14}/><AiT>{"Edit\r\n          "}</AiT></button>
        </div>

        <button type="button" onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white p-1.5 sm:p-2 rounded-lg transition cursor-pointer shrink-0 ml-1" aria-label={t("Close preview")}>
          <X size={18}/>
        </button>
      </div>

      {actionError && (<div className="absolute top-20 left-1/2 z-[70] -translate-x-1/2 max-w-[min(92vw,680px)] rounded-xl border border-stone-300 bg-[#E3D6B8] px-4 py-2.5 text-sm font-medium text-[#3B2F1E] shadow-xl">
          {actionError}
        </div>)}

      {/* Main Preview Container */}
      <div className="flex-1 w-full flex flex-col lg:flex-row items-center justify-between overflow-hidden relative bg-[#F2E8D2] p-2 sm:p-4 gap-3">
        {/* Info Sidebar */}
        <div className={`w-full lg:w-64 bg-[#E3D6B8] border border-stone-300 rounded-xl p-3 sm:p-4 text-[#3B2F1E] flex-col gap-3 shadow-xl shrink-0 ${showMobileInfo ? "flex" : "hidden lg:flex"}`}>
          <div className="flex items-center justify-between border-b border-stone-300 pb-2">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-[#DC2626]"/>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#3B2F1E]"><AiT>{"Generation Info\r\n              "}</AiT></h3>
            </div>
            <button type="button" onClick={() => setShowMobileInfo(false)} className="lg:hidden text-stone-500 hover:text-[#3B2F1E]">
              <X size={16}/>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 text-sm text-stone-700">
            <div className="flex justify-between items-center bg-white/60 px-3 py-2 rounded-lg border border-stone-200">
              <span className="text-stone-500"><AiT>{"Photo Size:"}</AiT></span>
              <span className="font-bold text-[#DC2626]">{photoSizeLabel}</span>
            </div>
            <div className="flex justify-between items-center bg-white/60 px-3 py-2 rounded-lg border border-stone-200">
              <span className="text-stone-500"><AiT>{"Background:"}</AiT></span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border border-stone-300" style={{ backgroundColor: bgHexColor }}/>
                <span className="font-medium text-[#3B2F1E]">
                  {isTransparentBackground ? <AiT>{"Transparent"}</AiT> : bgHexColor}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center bg-white/60 px-3 py-2 rounded-lg border border-stone-200">
              <span className="text-stone-500"><AiT>{"Clothing:"}</AiT></span>
              <span className="font-medium text-[#3B2F1E] truncate max-w-[100px]">
                <AiT>{clothingInfo}</AiT>
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
            {isComparing && (<div className="absolute top-3 left-3 bg-[#10B981] text-white text-[12px] px-2.5 py-1 rounded-md z-10 uppercase tracking-wider font-bold border border-emerald-400 shadow-lg"><AiT>{"Original Photo\r\n              "}</AiT></div>)}
            <img src={isComparing ? displayOriginalUrl : image.url} alt={t("Full Preview")} className="max-h-[55vh] sm:max-h-[75vh] max-w-[90vw] lg:max-w-[80vw] object-contain block transition-[filter] duration-150" style={{ filter: isComparing ? "none" : filterString(filters) }}/>
          </div>
        </div>

        <ImageEditSidebar isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} filters={filters} setFilters={setFilters} selectedAspect={selectedAspect} setSelectedAspect={setSelectedAspect} onReset={handleResetAll}/>
      </div>

      {/* Bottom Controls Bar */}
      <div className="h-12 sm:h-14 bg-[#E3D6B8] border-t border-stone-300 flex items-center justify-center gap-2 sm:gap-3 shrink-0 text-[#3B2F1E] text-sm select-none z-10 px-2">
        <button type="button" onClick={() => setPreviewZoom((previous) => Math.max(previous - 10, 50))} className="bg-stone-200 hover:bg-stone-300 text-[#3B2F1E] px-2.5 py-1 rounded font-bold transition cursor-pointer"><AiT>{"-\r\n        "}</AiT></button>
        <span className="w-10 text-center font-medium text-sm">
          {previewZoom}<AiT>{"%\r\n        "}</AiT></span>
        <button type="button" onClick={() => setPreviewZoom((previous) => Math.min(previous + 10, 300))} className="bg-stone-200 hover:bg-stone-300 text-[#3B2F1E] px-2.5 py-1 rounded font-bold transition cursor-pointer"><AiT>{"+\r\n        "}</AiT></button>
        <button type="button" onClick={() => setPreviewRotate((previous) => (previous + 90) % 360)} className="bg-stone-200 hover:bg-stone-300 text-[#3B2F1E] p-1.5 rounded transition cursor-pointer" title={t("Rotate")}>
          <RotateCw size={14}/>
        </button>
        <button type="button" onClick={handleResetAll} className="bg-stone-200 hover:bg-stone-300 text-[#3B2F1E] px-2 py-1 rounded text-[13px] transition ml-1 cursor-pointer"><AiT>{"Reset All\r\n        "}</AiT></button>
      </div>
      <AiPrintStudioModal open={printStudioOpen} image={printStudioImage} preset={printStudioPreset} onClose={() => setPrintStudioOpen(false)} onPrintSingle={handlePrintSingle}/>
    </div>);
}
