"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  CreditCard,
  Star,
  Share2,
  ArrowLeft,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Upload,
  Trash2,
  ArrowLeftRight,
  Copy,
  RefreshCw,
  Wand2,
  FileText,
  Crop,
  X,
  Minimize2,
  ChevronRight,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import NidSettingsPanel from "@/components/nidToPdfComponent/NidSettingsPanel";

const PYTHON_API_BASE_URL = (
  process.env.NEXT_PUBLIC_PYTHON_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

const AUTO_CROP_ERROR =
  "Auto crop is temporarily unavailable. You can turn Auto crop off and use manual Crop instead.";

async function autoCropFile(file: File, signal?: AbortSignal): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  const formData = new FormData();
  formData.append("file", file, file.name);

  let response: Response;

  try {
    response = await fetch(`${PYTHON_API_BASE_URL}/api/nid-auto-crop`, {
      method: "POST",
      body: formData,
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    const detail =
      error instanceof Error && error.message ? ` (${error.message})` : "";

    throw new Error(`${AUTO_CROP_ERROR}${detail}`);
  }

  if (!response.ok) {
    const message = await response.text().catch(() => "");

    throw new Error(
      message.trim() ? `Auto crop failed: ${message.trim()}` : AUTO_CROP_ERROR,
    );
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error("Auto crop returned an empty image.");
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, ".png"), {
    type: "image/png",
    lastModified: Date.now(),
  });
}

// --- PERSPECTIVE WARP HELPER FUNCTIONS ---
function solveLinearSystem(A: number[][], B: number[]): number[] {
  const n = A.length;
  for (let i = 0; i < n; i++) A[i].push(B[i]);
  for (let i = 0; i < n; i++) {
    let maxEl = Math.abs(A[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) {
        maxEl = Math.abs(A[k][i]);
        maxRow = k;
      }
    }
    for (let k = i; k < n + 1; k++) {
      const tmp = A[maxRow][k];
      A[maxRow][k] = A[i][k];
      A[i][k] = tmp;
    }
    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n + 1; j++) {
        if (i === j) A[k][j] = 0;
        else A[k][j] += c * A[i][j];
      }
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = A[i][n] / A[i][i];
    for (let k = i - 1; k >= 0; k--) {
      A[k][n] -= A[k][i] * x[i];
    }
  }
  return x;
}

function getHomographyMatrix(
  src: { x: number; y: number }[],
  dst: { x: number; y: number }[],
): number[] {
  const A: number[][] = [];
  const B: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    B.push(u);
    B.push(v);
  }
  const h = solveLinearSystem(A, B);
  h.push(1);
  return h;
}

function warpPerspective(
  img: HTMLImageElement,
  corners: { x: number; y: number }[],
  outWidth = 856,
  outHeight = 540,
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext("2d")!;

    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = img.naturalWidth;
    srcCanvas.height = img.naturalHeight;
    const srcCtx = srcCanvas.getContext("2d")!;
    srcCtx.drawImage(img, 0, 0);
    const srcData = srcCtx.getImageData(
      0,
      0,
      img.naturalWidth,
      img.naturalHeight,
    );

    const dstCorners = [
      { x: 0, y: 0 },
      { x: outWidth, y: 0 },
      { x: outWidth, y: outHeight },
      { x: 0, y: outHeight },
    ];

    const H = getHomographyMatrix(dstCorners, corners);

    const outData = ctx.createImageData(outWidth, outHeight);
    const outPixels = outData.data;
    const srcPixels = srcData.data;
    const sw = img.naturalWidth;
    const sh = img.naturalHeight;

    for (let v = 0; v < outHeight; v++) {
      for (let u = 0; u < outWidth; u++) {
        const Z = H[6] * u + H[7] * v + H[8];
        const X = (H[0] * u + H[1] * v + H[2]) / Z;
        const Y = (H[3] * u + H[4] * v + H[5]) / Z;

        const px = Math.floor(X);
        const py = Math.floor(Y);

        if (px >= 0 && px < sw - 1 && py >= 0 && py < sh - 1) {
          const dx = X - px;
          const dy = Y - py;

          const idx00 = (py * sw + px) * 4;
          const idx10 = (py * sw + (px + 1)) * 4;
          const idx01 = ((py + 1) * sw + px) * 4;
          const idx11 = ((py + 1) * sw + (px + 1)) * 4;

          for (let c = 0; c < 4; c++) {
            const val =
              (1 - dx) * (1 - dy) * srcPixels[idx00 + c] +
              dx * (1 - dy) * srcPixels[idx10 + c] +
              (1 - dx) * dy * srcPixels[idx01 + c] +
              dx * dy * srcPixels[idx11 + c];
            outPixels[(v * outWidth + u) * 4 + c] = Math.round(val);
          }
        }
      }
    }

    ctx.putImageData(outData, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, "image/png");
  });
}

// --- FULLSCREEN INTERACTIVE CROP MODAL COMPONENT ---
interface CropModalProps {
  file: File;
  sideTitle: string;
  onClose: () => void;
  onApply: (croppedFile: File) => void;
}

function CropModal({ file, sideTitle, onClose, onApply }: CropModalProps) {
  const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const imgRef = useRef<HTMLImageElement>(null);

  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([
    { x: 0.05, y: 0.05 },
    { x: 0.95, y: 0.05 },
    { x: 0.95, y: 0.95 },
    { x: 0.05, y: 0.95 },
  ]);

  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dispSize, setDispSize] = useState({ width: 0, height: 0 });

  const updateDisplaySize = () => {
    if (imgRef.current) {
      setDispSize({
        width: imgRef.current.clientWidth,
        height: imgRef.current.clientHeight,
      });
    }
  };

  useEffect(() => {
    window.addEventListener("resize", updateDisplaySize);
    return () => window.removeEventListener("resize", updateDisplaySize);
  }, []);

  const handlePointerDown = (idx: number, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveIdx(idx);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeIdx === null || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;

    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    setPoints((prev) => {
      const next = [...prev];
      next[activeIdx] = { x, y };
      return next;
    });
  };

  const handlePointerUp = () => {
    setActiveIdx(null);
  };

  const handleApplyCrop = async () => {
    if (!imgRef.current) return;
    setIsProcessing(true);

    const naturalWidth = imgRef.current.naturalWidth;
    const naturalHeight = imgRef.current.naturalHeight;

    const actualCorners = points.map((p) => ({
      x: p.x * naturalWidth,
      y: p.y * naturalHeight,
    }));

    try {
      const blob = await warpPerspective(
        imgRef.current,
        actualCorners,
        856,
        540,
      );
      const croppedFile = new File([blob], file.name, {
        type: "image/png",
        lastModified: Date.now(),
      });
      onApply(croppedFile);
    } catch (err) {
      console.error("Cropping error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const pPx = points.map((p) => ({
    x: p.x * dispSize.width,
    y: p.y * dispSize.height,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f9fa] flex flex-col justify-between font-sans select-none overflow-hidden h-screen w-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-xs shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Crop size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-gray-950">
              Crop — {sideTitle}
            </h2>
          </div>
          <p className="text-[11px] text-gray-400 font-medium ml-6">
            {file.name}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-6 py-2 bg-gray-50/50 text-[11px] text-gray-500 font-medium border-b border-gray-100 shrink-0">
        Drag the orange corner handles to match the card edges. The result is a
        flat rectangle at CR80 print size.
      </div>

      <div
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 w-full h-full flex items-center justify-center p-4 relative overflow-hidden"
      >
        <div className="relative inline-block max-w-full max-h-[calc(100vh-140px)] shadow-lg rounded-sm">
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Crop target"
            onLoad={updateDisplaySize}
            className="max-w-full max-h-[calc(100vh-140px)] object-contain block pointer-events-none"
          />

          {dispSize.width > 0 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ width: dispSize.width, height: dispSize.height }}
            >
              <polygon
                points={`${pPx[0].x},${pPx[0].y} ${pPx[1].x},${pPx[1].y} ${pPx[2].x},${pPx[2].y} ${pPx[3].x},${pPx[3].y}`}
                fill="rgba(59, 130, 246, 0.12)"
                stroke="#0088ff"
                strokeWidth="2"
              />
              {pPx.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r="7"
                  fill="#ff9800"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="cursor-grab active:cursor-grabbing pointer-events-auto shadow-md"
                  onPointerDown={(e) => handlePointerDown(idx, e)}
                />
              ))}
            </svg>
          )}
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-end gap-3 shadow-xs shrink-0">
        <button
          onClick={onClose}
          className="px-5 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleApplyCrop}
          disabled={isProcessing}
          className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
        >
          {isProcessing ? "Cropping..." : "Apply crop"}
        </button>
      </div>
    </div>
  );
}

// --- MAIN NID TO PDF PAGE ---
export default function NidToPdf() {
  const [autoCrop, setAutoCrop] = useState(false);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );
  const [layout, setLayout] = useState<"side-by-side" | "stacked">(
    "side-by-side",
  );
  const [position, setPosition] = useState<"top" | "center" | "bottom">("top");
  const [copies, setCopies] = useState<number>(1);
  const [roundedCorners, setRoundedCorners] = useState(false);

  const [frontRotation, setFrontRotation] = useState<number>(0);
  const [backRotation, setBackRotation] = useState<number>(0);

  const [zoom, setZoom] = useState<number>(100);

  const [filterPreset, setFilterPreset] = useState<
    "plain" | "color" | "scan" | "bw"
  >("plain");
  const [shadowRemoval, setShadowRemoval] = useState<number>(0);
  const [blackBoost, setBlackBoost] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(0);
  const [textDeepen, setTextDeepen] = useState<number>(0);

  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);

  const [croppingSide, setCroppingSide] = useState<"front" | "back" | null>(
    null,
  );

  const [autoCropChoiceOpen, setAutoCropChoiceOpen] = useState(false);

  // State for loading state while downloading PDF on Mobile/Desktop
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [processingSide, setProcessingSide] = useState<"front" | "back" | null>(
    null,
  );
  const [processingBoth, setProcessingBoth] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [frontAutoCropped, setFrontAutoCropped] = useState(false);
  const [backAutoCropped, setBackAutoCropped] = useState(false);

  const autoCropAbortRef = useRef<AbortController | null>(null);
  const autoCropRequestIdRef = useRef(0);

  const imageCount = (frontImage ? 1 : 0) + (backImage ? 1 : 0);

  const frontImageUrl = useMemo(
    () => (frontImage ? URL.createObjectURL(frontImage) : null),
    [frontImage],
  );
  const backImageUrl = useMemo(
    () => (backImage ? URL.createObjectURL(backImage) : null),
    [backImage],
  );

  useEffect(() => {
    return () => {
      if (frontImageUrl) {
        URL.revokeObjectURL(frontImageUrl);
      }
    };
  }, [frontImageUrl]);

  useEffect(() => {
    return () => {
      if (backImageUrl) {
        URL.revokeObjectURL(backImageUrl);
      }
    };
  }, [backImageUrl]);

  const cancelAutoCropProcessing = useCallback(() => {
    autoCropRequestIdRef.current += 1;

    if (autoCropAbortRef.current) {
      autoCropAbortRef.current.abort();
      autoCropAbortRef.current = null;
    }

    setProcessingSide(null);
    setProcessingBoth(false);
  }, []);

  useEffect(() => {
    return () => {
      if (autoCropAbortRef.current) {
        autoCropAbortRef.current.abort();
        autoCropAbortRef.current = null;
      }
    };
  }, []);

  const processAutoCropSides = useCallback(
    async (
      sides: Array<"front" | "back">,
      sourceOverrides?: Partial<Record<"front" | "back", File | null>>,
    ) => {
      if (sides.length === 0) {
        return;
      }

      const requestId = ++autoCropRequestIdRef.current;

      if (autoCropAbortRef.current) {
        autoCropAbortRef.current.abort();
      }

      const controller = new AbortController();
      autoCropAbortRef.current = controller;

      setProcessingError(null);
      setProcessingBoth(sides.length === 2);
      setProcessingSide(sides[0]);

      try {
        for (const side of sides) {
          if (
            requestId !== autoCropRequestIdRef.current ||
            controller.signal.aborted
          ) {
            return;
          }

          const sourceFile =
            sourceOverrides?.[side] ??
            (side === "front" ? frontImage : backImage);

          if (!sourceFile) {
            continue;
          }

          const croppedFile = await autoCropFile(sourceFile, controller.signal);

          if (
            requestId !== autoCropRequestIdRef.current ||
            controller.signal.aborted
          ) {
            return;
          }

          if (side === "front") {
            setFrontImage(croppedFile);
            setFrontAutoCropped(true);
          } else {
            setBackImage(croppedFile);
            setBackAutoCropped(true);
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (requestId === autoCropRequestIdRef.current) {
          console.error("NID auto-crop failed:", error);

          setProcessingError(
            error instanceof Error ? error.message : AUTO_CROP_ERROR,
          );

          if (sides.includes("front")) {
            setFrontAutoCropped(false);
          }

          if (sides.includes("back")) {
            setBackAutoCropped(false);
          }
        }
      } finally {
        if (autoCropAbortRef.current === controller) {
          autoCropAbortRef.current = null;
        }

        if (requestId === autoCropRequestIdRef.current) {
          setProcessingSide(null);
          setProcessingBoth(false);
        }
      }
    },
    [frontImage, backImage],
  );

  const openAutoCropChoice = useCallback(() => {
    if (imageCount < 2) {
      return;
    }

    setProcessingError(null);
    setAutoCropChoiceOpen(true);
  }, [imageCount]);

  const handleAutoCropToggle = useCallback(
    (enabled: boolean) => {
      setProcessingError(null);

      if (!enabled) {
        setAutoCrop(false);
        setAutoCropChoiceOpen(false);
        cancelAutoCropProcessing();
        return;
      }

      setAutoCrop(true);

      if (!frontImage && !backImage) {
        return;
      }

      if (frontImage && backImage) {
        openAutoCropChoice();
        return;
      }

      void processAutoCropSides([frontImage ? "front" : "back"]);
    },
    [
      frontImage,
      backImage,
      openAutoCropChoice,
      processAutoCropSides,
      cancelAutoCropProcessing,
    ],
  );

  const handleAutoCropChoice = useCallback(
    (choice: "front" | "back" | "both") => {
      setAutoCropChoiceOpen(false);
      setProcessingError(null);

      if (choice === "front") {
        if (!frontImage) {
          setProcessingError("Front NID image is not available.");
          return;
        }

        void processAutoCropSides(["front"]);
        return;
      }

      if (choice === "back") {
        if (!backImage) {
          setProcessingError("Back NID image is not available.");
          return;
        }

        void processAutoCropSides(["back"]);
        return;
      }

      const sides: Array<"front" | "back"> = [];

      if (frontImage) {
        sides.push("front");
      }

      if (backImage) {
        sides.push("back");
      }

      void processAutoCropSides(sides);
    },
    [frontImage, backImage, processAutoCropSides],
  );

  const handleFrontImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setProcessingError(null);

    // A newly selected image replaces the current front image.
    setFrontAutoCropped(false);
    setFrontImage(file);

    // Preserve the existing toggle behavior for uploads:
    // when Auto Crop is already enabled, process the new image.
    if (autoCrop) {
      void processAutoCropSides(["front"], {
        front: file,
      });
    }
  };

  const handleBackImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setProcessingError(null);

    // A newly selected image replaces the current back image.
    setBackAutoCropped(false);
    setBackImage(file);

    // Preserve the existing toggle behavior for uploads:
    // when Auto Crop is already enabled, process the new image.
    if (autoCrop) {
      void processAutoCropSides(["back"], {
        back: file,
      });
    }
  };

  const handleSwap = () => {
    cancelAutoCropProcessing();
    setAutoCropChoiceOpen(false);
    setProcessingError(null);

    const temp = frontImage;
    setFrontImage(backImage);
    setBackImage(temp);

    const tempRot = frontRotation;
    setFrontRotation(backRotation);
    setBackRotation(tempRot);

    const tempAutoCropped = frontAutoCropped;
    setFrontAutoCropped(backAutoCropped);
    setBackAutoCropped(tempAutoCropped);
  };

  const handleReset = () => {
    cancelAutoCropProcessing();
    setAutoCropChoiceOpen(false);
    setProcessingError(null);
    setProcessingSide(null);
    setFrontImage(null);
    setBackImage(null);
    setFrontAutoCropped(false);
    setBackAutoCropped(false);
    setFrontRotation(0);
    setBackRotation(0);
    setFilterPreset("plain");
    setShadowRemoval(0);
    setBlackBoost(0);
    setSaturation(0);
    setTextDeepen(0);
    setOrientation("portrait");
    setLayout("side-by-side");
    setPosition("top");
    setCopies(1);
    setRoundedCorners(false);
    setZoom(100);
  };

  const handleGlobalRotate = () => {
    const nextRot = (frontRotation + 90) % 360;
    setFrontRotation(nextRot);
    setBackRotation(nextRot);
  };

  const imageFilterStyle = useMemo(() => {
    let brightness = 100 + shadowRemoval * 0.4;
    let contrast = 100 + blackBoost * 0.6 + textDeepen * 0.5;
    let sat = 100 + saturation;
    let gray = 0;

    if (filterPreset === "bw") {
      gray = 100;
      contrast += 40;
      sat = 0;
    }

    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${sat}%) grayscale(${gray}%)`;
  }, [shadowRemoval, blackBoost, saturation, textDeepen, filterPreset]);

  // Exact dimensions mapping to simulate perfect rotation bounds
  const cardDim = useMemo(() => {
    if (layout === "stacked") {
      return { width: 260, height: 260 / (85.6 / 53.98) };
    }
    // Portrait sheet width logic
    if (orientation === "portrait") {
      return { width: 232, height: 232 / (85.6 / 53.98) };
    }
    // Landscape sheet width logic
    return { width: 342, height: 342 / (85.6 / 53.98) };
  }, [layout, orientation]);

  const isFrontPortrait = frontRotation % 180 !== 0;
  const isBackPortrait = backRotation % 180 !== 0;

  // Swap width and height for bounding box depending on rotation
  const frontWrapperWidth = isFrontPortrait ? cardDim.height : cardDim.width;
  const frontWrapperHeight = isFrontPortrait ? cardDim.width : cardDim.height;

  const backWrapperWidth = isBackPortrait ? cardDim.height : cardDim.width;
  const backWrapperHeight = isBackPortrait ? cardDim.width : cardDim.height;

  const handlePrint = () => {
    const sheet = document.getElementById("printable-sheet");

    if (!sheet) return;

    const originalParent = sheet.parentNode;
    const originalNextSibling = sheet.nextSibling;
    const printContent = sheet.firstElementChild as HTMLElement | null;

    // Print uses the real card dimensions instead of scaling the entire
    // document down. The browser is then free to paginate naturally: as many
    // complete copies as fit on one A4 sheet stay on that page, and the next
    // copy starts on the following page.
    const pageWidthPx = orientation === "portrait" ? 793.7008 : 1122.5197;
    const pageHeightPx = orientation === "portrait" ? 1122.5197 : 793.7008;
    const printPaddingPx = (20 / 25.4) * 96; // 20mm print padding
    const availableHeightPx = Math.max(1, pageHeightPx - printPaddingPx * 2);

    const rowGapPx = 24;
    const cardGapPx = layout === "stacked" ? 16 : 12;

    const naturalRowHeight =
      layout === "stacked"
        ? frontWrapperHeight + backWrapperHeight + cardGapPx
        : Math.max(frontWrapperHeight, backWrapperHeight);

    const naturalContentHeight =
      copies * naturalRowHeight + Math.max(0, copies - 1) * rowGapPx;

    const fitsOnSinglePage = naturalContentHeight <= availableHeightPx;

    const previousTransform = printContent?.style.transform ?? "";
    const previousTransformOrigin = printContent?.style.transformOrigin ?? "";
    const previousHeight = printContent?.style.height ?? "";
    const previousWidth = printContent?.style.width ?? "";
    const previousSheetJustify = sheet.style.justifyContent;

    if (printContent) {
      // No print scaling. Keep the real layout size so pagination remains
      // readable and predictable.
      printContent.style.transform = "none";
      printContent.style.transformOrigin = "top center";
      printContent.style.height = "auto";
      printContent.style.width = "100%";
    }

    // Position control is preserved when everything fits on one page. When
    // the content needs multiple pages, start from the top so every page is
    // packed naturally without creating a large blank area before page 2.
    if (fitsOnSinglePage) {
      sheet.style.justifyContent =
        position === "top"
          ? "flex-start"
          : position === "center"
            ? "center"
            : "flex-end";
    } else {
      sheet.style.justifyContent = "flex-start";
    }

    document.body.classList.add("nid-print-mode");
    document.body.appendChild(sheet);

    const restoreSheet = () => {
      document.body.classList.remove("nid-print-mode");

      if (printContent) {
        printContent.style.transform = previousTransform;
        printContent.style.transformOrigin = previousTransformOrigin;
        printContent.style.height = previousHeight;
        printContent.style.width = previousWidth;
      }

      sheet.style.justifyContent = previousSheetJustify;

      if (originalParent) {
        if (originalNextSibling) {
          originalParent.insertBefore(sheet, originalNextSibling);
        } else {
          originalParent.appendChild(sheet);
        }
      }

      window.removeEventListener("afterprint", restoreSheet);
    };

    window.addEventListener("afterprint", restoreSheet);

    setTimeout(() => {
      window.print();
    }, 150);

    // Fallback for browsers that do not fire afterprint.
    setTimeout(restoreSheet, 5000);
  };

  const handleCreatePdf = async () => {
    const sheet = document.getElementById("printable-sheet");
    if (!sheet) return;

    setIsGeneratingPdf(true);

    try {
      const canvas = await html2canvas(sheet, {
        scale: 2,
        useCORS: true,
        logging: false,
        // মোবাইল স্ক্রিনের লিমিটেশন ইগনোর করার জন্য ফোর্সড রেজুলেশন উইন্ডো
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200,
        windowHeight: 1200,
        ignoreElements: (element) => {
          return (
            element.classList.contains("print:hidden") ||
            element.tagName === "BUTTON"
          );
        },
        onclone: (clonedDoc) => {
          const clonedSheet = clonedDoc.getElementById("printable-sheet");
          if (clonedSheet) {
            // ১. ক্লোন করা ডকুমেন্টের জুম (transform) রিমুভ করে দিচ্ছি যাতে ঠিকমতো ক্যাপচার হয়
            clonedSheet.style.transform = "none";

            // ২. মোবাইলে যেন উইডথ/হাইট স্ক্রিনের মাপে ছোট না হয়ে যায় তাই ফিক্সড সাইজ দেওয়া হচ্ছে
            clonedSheet.style.maxWidth = "none";
            clonedSheet.style.maxHeight = "none";

            if (orientation === "portrait") {
              clonedSheet.style.width = "540px";
              clonedSheet.style.minWidth = "540px";
              clonedSheet.style.height = "760px";
              clonedSheet.style.minHeight = "760px";
            } else {
              clonedSheet.style.width = "760px";
              clonedSheet.style.minWidth = "760px";
              clonedSheet.style.height = "540px";
              clonedSheet.style.minHeight = "540px";
            }

            // ৩. প্যারেন্ট এলিমেন্টগুলোর রেস্ট্রিকশন সরাচ্ছি যাতে স্ক্রিনের বাইরে থাকলেও ক্যাপচার হয়
            let parent = clonedSheet.parentElement;
            while (parent && parent.tagName !== "BODY") {
              parent.style.overflow = "visible";
              parent.style.transform = "none";
              parent.style.maxWidth = "none";
              parent.style.maxHeight = "none";
              parent = parent.parentElement;
            }
          }

          const elements = clonedDoc.querySelectorAll("*");
          elements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const computed = window.getComputedStyle(htmlEl);
            if (
              computed.color.includes("oklab") ||
              computed.backgroundColor.includes("oklab")
            ) {
              htmlEl.style.color = "#000000";
              htmlEl.style.backgroundColor = "#ffffff";
            }
          });
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF(orientation === "portrait" ? "p" : "l", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgRatio = canvas.width / canvas.height;
      const pageRatio = pdfWidth / pdfHeight;

      let finalWidth = pdfWidth;
      let finalHeight = pdfHeight;

      if (imgRatio > pageRatio) {
        finalWidth = pdfWidth;
        finalHeight = pdfWidth / imgRatio;
      } else {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * imgRatio;
      }

      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
      pdf.save("nid-card.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="w-full space-y-5 text-gray-800 font-sans">
      <style>{`
        @media print {
          @page {
            size: A4 ${orientation};
            margin: 0;
          }

          html,
          body {
            width: auto !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body.nid-print-mode {
            overflow: visible !important;
          }

          body.nid-print-mode > *:not(#printable-sheet) {
            display: none !important;
          }

          body.nid-print-mode #printable-sheet,
          body.nid-print-mode #printable-sheet * {
            visibility: visible !important;
          }

          body.nid-print-mode #printable-sheet .absolute.left-1\/2.-translate-x-1\/2,
          body.nid-print-mode #printable-sheet .absolute.z-20 {
            display: none !important;
          }

          /*
           * Keep the sheet at the real A4 width but let its height grow.
           * This is the key to natural browser pagination.
           */
          body.nid-print-mode #printable-sheet {
            position: static !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;

            width: ${orientation === "portrait" ? "210mm" : "297mm"} !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;

            margin: 0 !important;
            padding: 20mm !important;
            box-sizing: border-box !important;

            overflow: visible !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;

            transform: none !important;
            transform-origin: top center !important;

            page-break-before: auto !important;
            page-break-after: auto !important;
            page-break-inside: auto !important;
            break-before: auto !important;
            break-after: auto !important;
            break-inside: auto !important;
          }

          body.nid-print-mode #printable-sheet > div:first-child {
            transform: none !important;
            transform-origin: top center !important;
            height: auto !important;
            width: 100% !important;
            min-height: 0 !important;
            overflow: visible !important;
            flex: 0 0 auto !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          /*
           * Each copy is atomic: front + back must stay together. The browser
           * may place 1, 2, 3, or 4 complete copies on a page depending on
           * the selected layout/orientation and the available A4 space.
           */
          body.nid-print-mode #printable-sheet > div:first-child > div {
            page-break-inside: avoid !important;
            break-inside: avoid-page !important;
          }

          body.nid-print-mode #printable-sheet button,
          body.nid-print-mode #printable-sheet input,
          body.nid-print-mode #printable-sheet label,
          body.nid-print-mode #printable-sheet .group-hover\:opacity-100 {
            display: none !important;
          }
        }
      `}</style>

      {croppingSide === "front" && frontImage && (
        <CropModal
          file={frontImage}
          sideTitle="Front of NID card"
          onClose={() => setCroppingSide(null)}
          onApply={(croppedFile) => {
            cancelAutoCropProcessing();
            setAutoCropChoiceOpen(false);
            setProcessingError(null);
            setFrontImage(croppedFile);
            setFrontAutoCropped(false);
            setCroppingSide(null);
          }}
        />
      )}

      {croppingSide === "back" && backImage && (
        <CropModal
          file={backImage}
          sideTitle="Back of NID card"
          onClose={() => setCroppingSide(null)}
          onApply={(croppedFile) => {
            cancelAutoCropProcessing();
            setAutoCropChoiceOpen(false);
            setProcessingError(null);
            setBackImage(croppedFile);
            setBackAutoCropped(false);
            setCroppingSide(null);
          }}
        />
      )}

      {autoCropChoiceOpen && imageCount === 2 && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nid-auto-crop-choice-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setAutoCropChoiceOpen(false);
              setAutoCrop(false);
              cancelAutoCropProcessing();
            }
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                    <Crop size={16} />
                  </div>
                  <div>
                    <h2
                      id="nid-auto-crop-choice-title"
                      className="text-sm font-extrabold text-gray-900"
                    >
                      Choose Auto Crop
                    </h2>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                      You uploaded both sides. Which image should be
                      auto-cropped?
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAutoCropChoiceOpen(false);
                  setAutoCrop(false);
                  cancelAutoCropProcessing();
                }}
                className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                aria-label="Close auto crop selection"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-2.5">
              <button
                type="button"
                onClick={() => handleAutoCropChoice("front")}
                disabled={processingSide !== null || !frontImage}
                className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 text-xs font-extrabold">
                    F
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      Front only
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Auto-crop only the front side.
                    </p>
                  </div>
                </div>

                <ChevronRight size={15} className="text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => handleAutoCropChoice("back")}
                disabled={processingSide !== null || !backImage}
                className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 text-xs font-extrabold">
                    B
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Back only</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Auto-crop only the back side.
                    </p>
                  </div>
                </div>

                <ChevronRight size={15} className="text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => handleAutoCropChoice("both")}
                disabled={processingSide !== null}
                className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-extrabold">
                    FB
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      Both sides
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Auto-crop front and back sequentially.
                    </p>
                  </div>
                </div>

                <ChevronRight size={15} className="text-amber-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setAutoCropChoiceOpen(false);
                  setAutoCrop(false);
                  cancelAutoCropProcessing();
                }}
                className="w-full py-2.5 mt-1 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link
          href="/sohoj-tools"
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Tools</span>
        </Link>
        <span>/</span>
        <span>Image Tools</span>
        <span>/</span>
        <span className="font-semibold text-gray-900">NID to PDF</span>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            <CreditCard size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">NID to PDF</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Turn NID card front and back photos into a clean A4 PDF — all in
              your browser.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <NidSettingsPanel
          autoCrop={autoCrop}
          setAutoCrop={handleAutoCropToggle}
          processingSide={processingSide}
          processingError={processingError}
          orientation={orientation}
          setOrientation={setOrientation}
          layout={layout}
          setLayout={setLayout}
          rotation={frontRotation}
          setRotation={(val) => {
            if (typeof val === "function") {
              setFrontRotation(val);
              setBackRotation(val);
            } else {
              setFrontRotation(val);
              setBackRotation(val);
            }
          }}
          position={position}
          setPosition={setPosition}
          copies={copies}
          setCopies={setCopies}
          roundedCorners={roundedCorners}
          setRoundedCorners={setRoundedCorners}
          filterPreset={filterPreset}
          setFilterPreset={setFilterPreset}
          shadowRemoval={shadowRemoval}
          setShadowRemoval={setShadowRemoval}
          blackBoost={blackBoost}
          setBlackBoost={setBlackBoost}
          saturation={saturation}
          setSaturation={setSaturation}
          textDeepen={textDeepen}
          setTextDeepen={setTextDeepen}
          handlePrint={handlePrint}
        />

        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-gray-800">Live preview</h2>
              <span className="text-[10px] text-gray-400 font-medium">
                A4 — 794×1123 px
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 font-bold">
              <span>{zoom}%</span>
              <button
                onClick={() => setZoom((prev) => Math.min(prev + 10, 150))}
                className="hover:text-gray-800 p-1 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={handleGlobalRotate}
                className="hover:text-gray-800 p-1 cursor-pointer"
                title="Rotate Canvas"
              >
                <RefreshCw size={13} />
              </button>
              <button
                onClick={() => setZoom((prev) => Math.max(prev - 10, 50))}
                className="hover:text-gray-800 p-1 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={() => setZoom(100)}
                className="hover:text-gray-800 p-1 cursor-pointer"
                title="Reset Zoom"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {(processingSide || processingError) && (
            <div className="mt-3 space-y-2">
              {processingSide && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
                  <RefreshCw size={13} className="animate-spin shrink-0" />
                  <span>
                    Auto cropping{" "}
                    {processingBoth
                      ? "front and back"
                      : processingSide === "front"
                        ? "front"
                        : "back"}{" "}
                    NID photo…
                  </span>
                </div>
              )}

              {processingError && !processingSide && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700"
                >
                  {processingError}
                </div>
              )}
            </div>
          )}

          <div className="relative bg-[#f3f4f6] border border-gray-200/80 rounded-2xl p-8 my-4 flex-1 flex justify-center items-start min-h-[620px] overflow-auto [background-image:radial-gradient(#94a3b8_1.2px,transparent_1.2px)] [background-size:16px_16px]">
            <div
              id="printable-sheet"
              className={`bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-gray-200/60 transition-all duration-300 p-8 flex flex-col items-center ${
                orientation === "portrait"
                  ? "w-[540px] min-h-[760px]"
                  : "w-[760px] min-h-[540px]"
              } ${
                position === "top"
                  ? "justify-start pt-10"
                  : position === "center"
                    ? "justify-center"
                    : "justify-end pb-10"
              }`}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <div className="w-full space-y-6 flex flex-col items-center">
                {Array.from({ length: copies }).map((_, copyIndex) => (
                  <div
                    key={copyIndex}
                    className={`relative w-full flex justify-center items-center ${
                      layout === "side-by-side"
                        ? "flex-row gap-3"
                        : "flex-col gap-4"
                    }`}
                  >
                    {copyIndex === 0 && imageCount > 0 && (
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 text-white rounded-full p-1 flex items-center gap-1 shadow-xl border border-slate-700/50 z-20 backdrop-blur-xs print:hidden">
                        {imageCount === 2 && (
                          <>
                            <button
                              onClick={handleSwap}
                              className="w-6 h-6 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                              title="Swap Front and Back"
                            >
                              <ArrowLeftRight size={12} />
                            </button>
                            <button
                              onClick={() =>
                                setCopies((c) => Math.min(c + 1, 4))
                              }
                              className="w-6 h-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                              title="Add Copy"
                            >
                              <Copy size={12} />
                            </button>
                          </>
                        )}

                        <button
                          onClick={handleGlobalRotate}
                          className="w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                          title="Rotate All 90°"
                        >
                          <RotateCw size={12} />
                        </button>
                      </div>
                    )}

                    {/* FRONT CARD CONTAINER */}
                    <div
                      className="relative flex justify-center items-center shrink-0 transition-all duration-300"
                      style={{
                        width: frontWrapperWidth,
                        height: frontWrapperHeight,
                      }}
                    >
                      <div
                        className={`absolute overflow-hidden transition-all duration-300 ${
                          roundedCorners ? "rounded-[14px]" : "rounded-none"
                        }`}
                        style={{
                          width: cardDim.width,
                          height: cardDim.height,
                          transform: `rotate(${frontRotation}deg)`,
                        }}
                      >
                        {frontImageUrl ? (
                          <div className="relative group w-full h-full overflow-hidden flex justify-center items-center bg-transparent border border-gray-200">
                            {(processingSide === "front" || processingBoth) && (
                              <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                                <div className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-1.5 text-[10px] font-bold shadow-lg">
                                  <RefreshCw
                                    size={12}
                                    className="animate-spin"
                                  />
                                  Auto cropping front…
                                </div>
                              </div>
                            )}
                            {frontAutoCropped && processingSide !== "front" && (
                              <span className="absolute top-2 left-2 z-10 rounded-full bg-emerald-600 text-white px-2 py-1 text-[9px] font-bold shadow-md print:hidden">
                                Auto crop applied
                              </span>
                            )}
                            <img
                              src={frontImageUrl}
                              alt="Front NID"
                              className="w-full h-full object-contain bg-white"
                              style={{
                                filter: imageFilterStyle,
                              }}
                            />
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white rounded-full px-2.5 py-1 flex items-center gap-2 shadow-xl border border-slate-700/50 z-30 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-200 print:hidden">
                              <button
                                onClick={() => setCroppingSide("front")}
                                className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                                title="Crop"
                              >
                                <Crop size={13} />
                              </button>
                              <label
                                htmlFor="front-change-input"
                                className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                                title="Change Image"
                              >
                                <Upload size={13} />
                              </label>
                              <button
                                onClick={() =>
                                  setFrontRotation((prev) => (prev + 90) % 360)
                                }
                                className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                                title="Rotate 90°"
                              >
                                <RotateCw size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  cancelAutoCropProcessing();
                                  setAutoCropChoiceOpen(false);
                                  setFrontImage(null);
                                  setFrontAutoCropped(false);
                                }}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <input
                              id="front-change-input"
                              type="file"
                              accept="image/jpeg, image/jpg, image/png, image/heic, image/heif"
                              onChange={handleFrontImage}
                              className="hidden"
                            />
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-amber-300 bg-amber-50/20 hover:bg-amber-50/50 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer w-full h-full transition-all">
                            <div className="w-8 h-8 bg-amber-100/80 text-amber-600 rounded-full flex items-center justify-center mb-2">
                              <Upload size={16} />
                            </div>
                            <span className="text-xs font-bold text-gray-900">
                              Front of NID card
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5">
                              Upload front side photo
                            </span>
                            <span className="bg-amber-100/60 text-amber-700 font-semibold text-[9px] px-2 py-0.5 rounded-full mt-2">
                              JPG · PNG · HEIC
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg, image/jpg, image/png, image/heic, image/heif"
                              onChange={handleFrontImage}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* BACK CARD CONTAINER */}
                    <div
                      className="relative flex justify-center items-center shrink-0 transition-all duration-300"
                      style={{
                        width: backWrapperWidth,
                        height: backWrapperHeight,
                      }}
                    >
                      <div
                        className={`absolute overflow-hidden transition-all duration-300 ${
                          roundedCorners ? "rounded-[14px]" : "rounded-none"
                        }`}
                        style={{
                          width: cardDim.width,
                          height: cardDim.height,
                          transform: `rotate(${backRotation}deg)`,
                        }}
                      >
                        {backImageUrl ? (
                          <div className="relative group w-full h-full overflow-hidden flex justify-center items-center bg-transparent border border-gray-200">
                            {(processingSide === "back" || processingBoth) && (
                              <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                                <div className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-1.5 text-[10px] font-bold shadow-lg">
                                  <RefreshCw
                                    size={12}
                                    className="animate-spin"
                                  />
                                  Auto cropping back…
                                </div>
                              </div>
                            )}
                            {backAutoCropped && processingSide !== "back" && (
                              <span className="absolute top-2 left-2 z-10 rounded-full bg-emerald-600 text-white px-2 py-1 text-[9px] font-bold shadow-md print:hidden">
                                Auto crop applied
                              </span>
                            )}
                            <img
                              src={backImageUrl}
                              alt="Back NID"
                              className="w-full h-full object-contain bg-white"
                              style={{
                                filter: imageFilterStyle,
                              }}
                            />
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white rounded-full px-2.5 py-1 flex items-center gap-2 shadow-xl border border-slate-700/50 z-30 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-200 print:hidden">
                              <button
                                onClick={() => setCroppingSide("back")}
                                className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                                title="Crop"
                              >
                                <Crop size={13} />
                              </button>
                              <label
                                htmlFor="back-change-input"
                                className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                                title="Change Image"
                              >
                                <Upload size={13} />
                              </label>
                              <button
                                onClick={() =>
                                  setBackRotation((prev) => (prev + 90) % 360)
                                }
                                className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                                title="Rotate 90°"
                              >
                                <RotateCw size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  cancelAutoCropProcessing();
                                  setAutoCropChoiceOpen(false);
                                  setBackImage(null);
                                  setBackAutoCropped(false);
                                }}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <input
                              id="back-change-input"
                              type="file"
                              accept="image/jpeg, image/jpg, image/png, image/heic, image/heif"
                              onChange={handleBackImage}
                              className="hidden"
                            />
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-amber-300 bg-amber-50/20 hover:bg-amber-50/50 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer w-full h-full transition-all">
                            <div className="w-8 h-8 bg-amber-100/80 text-amber-600 rounded-full flex items-center justify-center mb-2">
                              <Upload size={16} />
                            </div>
                            <span className="text-xs font-bold text-gray-900">
                              Back of NID card
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5">
                              Upload back side photo
                            </span>
                            <span className="bg-amber-100/60 text-amber-700 font-semibold text-[9px] px-2 py-0.5 rounded-full mt-2">
                              JPG · PNG · HEIC
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg, image/jpg, image/png, image/heic, image/heif"
                              onChange={handleBackImage}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              frontImage && backImage ? "bg-amber-500" : "bg-red-500"
            }`}
          />
          <span>
            {frontImage && backImage
              ? "Both card photos added — ready to create PDF"
              : "Upload front and back photos to create PDF"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={handleCreatePdf}
            disabled={
              (!frontImage && !backImage) ||
              isGeneratingPdf ||
              processingSide !== null
            }
            className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              frontImage || backImage
                ? "bg-amber-500 text-white shadow-xs hover:bg-amber-600 cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            } ${isGeneratingPdf ? "opacity-75 !cursor-wait" : ""}`}
          >
            {isGeneratingPdf ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create PDF</span>
            )}
          </button>
        </div>
      </div>

      <div className="pt-3 space-y-3">
        <h3 className="text-xs font-bold text-gray-900">
          Tools in the same category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/sohoj-tools/image-size-reducer"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-amber-200 transition-all flex flex-col gap-3 group"
          >
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
              <Minimize2 size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                Image Size Reducer
              </h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Shrink JPG, PNG, and WebP photos in your browser.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/remove-background"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-amber-200 transition-all flex flex-col gap-3 group"
          >
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
              <Wand2 size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                Remove Background
              </h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Erase portrait, product, or logo backgrounds easily.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/passport-to-pdf"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-amber-200 transition-all flex flex-col gap-3 group"
          >
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
              <FileText size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                Passport to PDF
              </h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Turn passport photos into a clean A4 PDF.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
