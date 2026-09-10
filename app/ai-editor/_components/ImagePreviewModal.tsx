"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  RotateCw,
  Download,
  Printer,
  Trash2,
  Edit3,
  Share2,
  Eye,
  Loader2,
  Save,
  Info,
  ChevronDown,
  FileImage,
  Grid,
} from "lucide-react";
import ImageEditSidebar, {
  FilterState,
  ASPECT_RATIOS,
} from "./ImageEditSidebar";

interface ImagePreviewModalProps {
  image: {
    id?: string;
    url: string;
    originalUrl?: string;
    bgColor?: string;
    size?: string;
    clothingStyle?: string;
  } | null;
  onClose: () => void;
  onDelete?: (image: any) => void;
  onRegenerate?: (image: any) => void;
  onSaveImage?: (updatedId: string, newImageUrl: string) => Promise<void>;
}

const defaultFilters: FilterState = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
};

export default function ImagePreviewModal({
  image,
  onClose,
  onDelete,
  onRegenerate,
  onSaveImage,
}: ImagePreviewModalProps) {
  const [previewZoom, setPreviewZoom] = useState(100);
  const [previewRotate, setPreviewRotate] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedAspect, setSelectedAspect] = useState<string>("original");

  const [isComparing, setIsComparing] = useState(false);

  // Download Dropdown State & Ref
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(e.target as Node)
      ) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!image) return null;

  const displayOriginalUrl = image.originalUrl || image.url;
  const photoSizeLabel = image.size || "35×45 mm";
  const bgHexColor = image.bgColor || "#FFFFFF";
  const clothingInfo = image.clothingStyle || "Default Clothing";

  const handleDelete = () => {
    if (onDelete && image) {
      onDelete(image);
    }
  };

  const handleResetAll = () => {
    setFilters(defaultFilters);
    setSelectedAspect("original");
    setPreviewZoom(100);
    setPreviewRotate(0);
  };

  const filterStyleString = isComparing
    ? "none"
    : `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) blur(${filters.blur}px) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%)`;

  const currentAspectOption = ASPECT_RATIOS.find(
    (a) => a.value === selectedAspect,
  );

  // Helper to get edited image canvas
  const generateEditedCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!image?.url) return null;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image.url;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    let srcX = 0;
    let srcY = 0;
    let srcWidth = img.naturalWidth;
    let srcHeight = img.naturalHeight;

    if (currentAspectOption && currentAspectOption.ratio) {
      const targetRatio = currentAspectOption.ratio;
      const currentRatio = srcWidth / srcHeight;

      if (currentRatio > targetRatio) {
        srcWidth = srcHeight * targetRatio;
        srcX = (img.naturalWidth - srcWidth) / 2;
      } else {
        srcHeight = srcWidth / targetRatio;
        srcY = (img.naturalHeight - srcHeight) / 2;
      }
    }

    if (previewRotate % 180 !== 0) {
      canvas.width = srcHeight;
      canvas.height = srcWidth;
    } else {
      canvas.width = srcWidth;
      canvas.height = srcHeight;
    }

    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) blur(${filters.blur}px) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%)`;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((previewRotate * Math.PI) / 180);

    ctx.drawImage(
      img,
      srcX,
      srcY,
      srcWidth,
      srcHeight,
      -srcWidth / 2,
      -srcHeight / 2,
      srcWidth,
      srcHeight,
    );

    return canvas;
  };

  const generateEditedImageDataUrl = async (): Promise<string> => {
    try {
      const canvas = await generateEditedCanvas();
      if (!canvas) return image.url;
      return canvas.toDataURL("image/jpeg", 0.95);
    } catch (error) {
      console.error("Canvas image generation error:", error);
      return image.url;
    }
  };

  const handleSaveEditedImage = async () => {
    if (!onSaveImage || !image?.id) return;

    setIsSaving(true);
    try {
      const editedDataUrl = await generateEditedImageDataUrl();
      await onSaveImage(image.id, editedDataUrl);
      setIsEditOpen(false);
    } catch (error) {
      console.error("Save image error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateClick = async () => {
    if (onRegenerate && image) {
      setIsRegenerating(true);
      const editedUrl = await generateEditedImageDataUrl();
      const realOriginalUrl = image.originalUrl || image.url;

      onRegenerate({
        ...image,
        url: editedUrl,
        originalUrl: realOriginalUrl,
      });
      setIsRegenerating(false);
      onClose();
    }
  };

  // Download JPG/PNG Handler
  const handleDownloadFormat = async (format: "jpg" | "png") => {
    setShowDownloadMenu(false);
    setIsDownloading(true);

    try {
      const editedCanvas = await generateEditedCanvas();
      let downloadUrl = image.url;

      if (editedCanvas) {
        if (format === "jpg") {
          const jpgCanvas = document.createElement("canvas");
          jpgCanvas.width = editedCanvas.width;
          jpgCanvas.height = editedCanvas.height;
          const ctx = jpgCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
            ctx.drawImage(editedCanvas, 0, 0);
            downloadUrl = jpgCanvas.toDataURL("image/jpeg", 0.95);
          }
        } else {
          downloadUrl = editedCanvas.toDataURL("image/png");
        }
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `photo_${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(image.url, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  // Download 4x6" Print Sheet Handler
  const handleDownloadPrintSheet = async () => {
    setShowDownloadMenu(false);
    setIsDownloading(true);

    try {
      const editedCanvas = await generateEditedCanvas();

      const imgToDraw = new Image();
      imgToDraw.crossOrigin = "anonymous";
      imgToDraw.src = editedCanvas
        ? editedCanvas.toDataURL("image/png")
        : image.url;

      await new Promise((resolve, reject) => {
        imgToDraw.onload = resolve;
        imgToDraw.onerror = reject;
      });

      const printCanvas = document.createElement("canvas");
      printCanvas.width = 1200;
      printCanvas.height = 1800;
      const ctx = printCanvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, printCanvas.width, printCanvas.height);

        const rows = 4;
        const cols = 2;
        const photoWidth = 500;
        const photoHeight = 380;

        const startX = (printCanvas.width - cols * photoWidth) / 3;
        const startY = (printCanvas.height - rows * photoHeight) / 5;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = startX + c * (photoWidth + startX);
            const y = startY + r * (photoHeight + startY / 2);

            ctx.drawImage(imgToDraw, x, y, photoWidth, photoHeight);

            ctx.strokeStyle = "#D1D5DB";
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, photoWidth, photoHeight);
          }
        }

        const dataUrl = printCanvas.toDataURL("image/jpeg", 0.95);
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `print_sheet_4x6_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Print sheet generation failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#111827] flex flex-col justify-between overflow-hidden select-none">
      {/* Top Bar Actions */}
      <div className="min-h-[56px] py-2 sm:py-0 sm:h-16 bg-[#1f2937] border-b border-gray-700 flex items-center justify-between px-2 sm:px-6 shrink-0 z-30 overflow-visible relative">
        {/* Action Buttons Row */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <button
            onMouseDown={() => setIsComparing(true)}
            onMouseUp={() => setIsComparing(false)}
            onMouseLeave={() => setIsComparing(false)}
            onTouchStart={() => setIsComparing(true)}
            onTouchEnd={() => setIsComparing(false)}
            onClick={() => setIsComparing((prev) => !prev)}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 sm:gap-1.5 transition cursor-pointer border ${
              isComparing
                ? "bg-amber-500 text-black border-amber-400 font-bold"
                : "bg-white/10 hover:bg-white/20 text-white border-transparent"
            }`}
            title="Press & hold or click to view original photo"
          >
            <Eye size={14} />
            <span className="hidden sm:inline">
              {isComparing ? "Original Photo" : "Compare"}
            </span>
            <span className="sm:hidden">{isComparing ? "Orig" : "Comp"}</span>
          </button>

          <button
            onClick={() => setShowMobileInfo((prev) => !prev)}
            className="lg:hidden bg-white/10 hover:bg-white/20 text-white px-2 py-1.5 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
          >
            <Info size={14} />
          </button>

          <button className="hidden md:flex bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs items-center gap-1.5 transition cursor-pointer">
            <Share2 size={14} /> Share
          </button>

          {onSaveImage && image.id && (
            <button
              onClick={handleSaveEditedImage}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2 sm:px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 sm:gap-1.5 transition cursor-pointer"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span className="hidden sm:inline">
                {isSaving ? "Saving..." : "Save Changes"}
              </span>
              <span className="sm:hidden">Save</span>
            </button>
          )}

          <button
            onClick={handleRegenerateClick}
            disabled={isRegenerating}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-2 sm:px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 sm:gap-1.5 transition cursor-pointer"
          >
            {isRegenerating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RotateCw size={14} />
            )}
            <span className="hidden sm:inline">
              {isRegenerating ? "Processing..." : "Regenerate"}
            </span>
            <span className="sm:hidden">Retry</span>
          </button>

          {/* DOWNLOAD DROPDOWN BUTTON (Pointers & Overflow fixed) */}
          <div className="relative z-50" ref={downloadMenuRef}>
            <button
              onClick={() => setShowDownloadMenu((prev) => !prev)}
              disabled={isDownloading}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer shadow-md"
            >
              {isDownloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span>{isDownloading ? "Downloading..." : "Download"}</span>
              <ChevronDown size={14} />
            </button>

            {/* DOWNLOAD OPTIONS POPUP DROPDOWN */}
            {showDownloadMenu && (
              <div className="absolute left-0 top-full mt-2 w-60 sm:w-64 bg-[#1f2937] text-gray-200 rounded-xl shadow-2xl border border-gray-700 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-gray-700 font-semibold text-gray-400 text-[10px] uppercase">
                  Select Format
                </div>

                <button
                  onClick={() => handleDownloadFormat("jpg")}
                  className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                    <FileImage size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Standard JPG</div>
                    <div className="text-[10px] text-gray-400">
                      Recommended for Passport & Visa
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleDownloadFormat("png")}
                  className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg shrink-0">
                    <FileImage size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">HD PNG Image</div>
                    <div className="text-[10px] text-gray-400">
                      Lossless High Quality
                    </div>
                  </div>
                </button>

                <div className="my-1 border-t border-gray-700"></div>

                <button
                  onClick={handleDownloadPrintSheet}
                  className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="p-1.5 bg-orange-500/20 text-orange-400 rounded-lg shrink-0">
                    <Grid size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      Print Sheet (4×6")
                    </div>
                    <div className="text-[10px] text-gray-400">
                      8 Copies Grid Layout
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => window.print()}
            className="hidden md:flex bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs items-center gap-1.5 transition cursor-pointer"
          >
            <Printer size={14} /> Print
          </button>

          <button
            onClick={handleDelete}
            className="bg-red-600/80 hover:bg-red-600 text-white px-2 sm:px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Delete</span>
          </button>

          <button
            onClick={() => setIsEditOpen((prev) => !prev)}
            className={`${
              isEditOpen
                ? "bg-orange-500 text-white"
                : "bg-white/10 hover:bg-white/20 text-white"
            } px-2.5 sm:px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer`}
          >
            <Edit3 size={14} /> Edit
          </button>
        </div>

        <button
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white p-1.5 sm:p-2 rounded-lg transition cursor-pointer shrink-0 ml-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col lg:flex-row items-center justify-between overflow-hidden relative bg-[#111827] p-2 sm:p-4 gap-3">
        {/* Left Generation Info Panel */}
        <div
          className={`w-full lg:w-64 bg-[#1f2937]/90 border border-gray-700 rounded-xl p-3 sm:p-4 text-white flex-col gap-3 shadow-xl shrink-0 ${
            showMobileInfo ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-700 pb-2">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-orange-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-200">
                Generation Info
              </h3>
            </div>
            <button
              onClick={() => setShowMobileInfo(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 text-xs text-gray-300">
            <div className="flex justify-between items-center bg-black/20 px-3 py-2 rounded-lg">
              <span className="text-gray-400">Photo Size:</span>
              <span className="font-bold text-orange-400">
                {photoSizeLabel}
              </span>
            </div>

            <div className="flex justify-between items-center bg-black/20 px-3 py-2 rounded-lg">
              <span className="text-gray-400">Background:</span>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/30"
                  style={{ backgroundColor: bgHexColor }}
                ></span>
                <span className="font-medium text-white">{bgHexColor}</span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-black/20 px-3 py-2 rounded-lg">
              <span className="text-gray-400">Clothing:</span>
              <span className="font-medium text-white truncate max-w-[100px]">
                {clothingInfo}
              </span>
            </div>
          </div>
        </div>

        {/* Center Image Display */}
        <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden relative p-2">
          <div
            className="max-h-[55vh] sm:max-h-[75vh] max-w-[90vw] lg:max-w-[80vw] flex items-center justify-center transition-all duration-200 ease-out overflow-hidden rounded-lg shadow-2xl relative"
            style={{
              backgroundColor: bgHexColor,
              transform: `scale(${previewZoom / 100}) rotate(${
                isComparing ? 0 : previewRotate
              }deg)`,
            }}
          >
            {isComparing && (
              <div className="absolute top-3 left-3 bg-amber-500 text-black text-[10px] px-2.5 py-1 rounded-md z-10 uppercase tracking-wider font-bold border border-amber-300 animate-pulse shadow-lg">
                Original Photo
              </div>
            )}

            <img
              src={isComparing ? displayOriginalUrl : image.url}
              alt="Full Preview"
              className="max-h-[55vh] sm:max-h-[75vh] max-w-[90vw] lg:max-w-[80vw] object-contain block transition-[filter] duration-150"
              style={{
                filter: filterStyleString,
              }}
            />
          </div>
        </div>

        {/* Right Edit Sidebar */}
        <ImageEditSidebar
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          filters={filters}
          setFilters={setFilters}
          selectedAspect={selectedAspect}
          setSelectedAspect={setSelectedAspect}
          onReset={handleResetAll}
        />
      </div>

      {/* Bottom Zoom Control Bar */}
      <div className="h-12 sm:h-14 bg-[#1f2937] border-t border-gray-700 flex items-center justify-center gap-2 sm:gap-3 shrink-0 text-white text-xs select-none z-10 px-2">
        <button
          onClick={() => setPreviewZoom((prev) => Math.max(prev - 10, 100))}
          className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded font-bold transition cursor-pointer"
        >
          -
        </button>
        <span className="w-10 text-center font-medium text-xs">
          {previewZoom}%
        </span>
        <button
          onClick={() => setPreviewZoom((prev) => Math.min(prev + 10, 300))}
          className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded font-bold transition cursor-pointer"
        >
          +
        </button>
        <button
          onClick={() => setPreviewRotate((prev) => (prev + 90) % 360)}
          className="bg-white/10 hover:bg-white/20 p-1.5 rounded transition cursor-pointer"
          title="Rotate"
        >
          <RotateCw size={14} />
        </button>
        <button
          onClick={handleResetAll}
          className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-[11px] transition ml-1 cursor-pointer"
        >
          Reset All
        </button>
      </div>
    </div>
  );
}
