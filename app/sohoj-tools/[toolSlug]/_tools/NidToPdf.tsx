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
  Eye,
  CheckCircle2,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createPortal } from "react-dom";
import NidSettingsPanel from "@/components/nidToPdfComponent/NidSettingsPanel";

const PYTHON_API_BASE_URL = (
  process.env.NEXT_PUBLIC_PYTHON_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

const AUTO_CROP_ERROR =
  "Auto crop is temporarily unavailable. You can turn Auto crop off and use manual Crop instead.";

const NID_CROP_WIDTH = 856;
const NID_CROP_HEIGHT = 540;
const NID_CROP_ASPECT_RATIO = NID_CROP_WIDTH / NID_CROP_HEIGHT;

async function canvasToPngFile(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<File> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((value) => resolve(value), "image/png"),
  );

  if (!blob) {
    throw new Error("Could not prepare the image for manual crop.");
  }

  return new File([blob], filename, {
    type: "image/png",
    lastModified: Date.now(),
  });
}

function normalizeCropResultToCardRatio(
  blob: Blob,
  filename: string,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      try {
        if (!image.naturalWidth || !image.naturalHeight) {
          throw new Error("Auto crop returned an invalid image.");
        }

        const canvas = document.createElement("canvas");
        canvas.width = NID_CROP_WIDTH;
        canvas.height = NID_CROP_HEIGHT;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Could not prepare the auto-cropped image.");
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // The NID card frame is fixed to CR80 (85.6 × 54 mm).
        // Normalizing the backend result here keeps Auto Crop visually
        // identical to Manual Crop and makes the whole card fill the frame.
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((normalizedBlob) => {
          if (!normalizedBlob) {
            reject(new Error("Could not finalize the auto-cropped image."));
            return;
          }

          resolve(
            new File([normalizedBlob], filename, {
              type: "image/png",
              lastModified: Date.now(),
            }),
          );
        }, "image/png");
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("Could not normalize the auto-cropped image."),
        );
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Auto crop returned an unreadable image."));
    };

    image.src = url;
  });
}

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [file]);

  return url;
}

async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Unable to load image for auto crop."));

    img.src = src;
  });
}

function normalizeRotation(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function createRotatedCanvas(
  img: HTMLImageElement,
  angle: number,
): HTMLCanvasElement {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (!width || !height) {
    throw new Error("Invalid image dimensions.");
  }

  const normalizedAngle = normalizeRotation(angle);
  const swap = normalizedAngle === 90 || normalizedAngle === 270;

  const canvas = document.createElement("canvas");
  canvas.width = swap ? height : width;
  canvas.height = swap ? width : height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context unavailable.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((normalizedAngle * Math.PI) / 180);
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  ctx.restore();

  return canvas;
}

async function autoCropCanvas(
  canvas: HTMLCanvasElement,
  filename = "crop.png",
  signal?: AbortSignal,
): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((value) => resolve(value), "image/png"),
  );

  if (!blob) {
    throw new Error("Canvas blob conversion failed.");
  }

  const formData = new FormData();
  formData.append("file", blob, filename);

  let response: Response;

  try {
    response = await fetch(`${PYTHON_API_BASE_URL}/api/auto-crop`, {
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

  const responseBlob = await response.blob();

  if (!responseBlob.size) {
    throw new Error("Auto crop returned an empty image.");
  }

  return responseBlob;
}

// --- PERSPECTIVE WARP HELPER FUNCTIONS ---
type CropPoint = { x: number; y: number };

function solveLinearSystem(A: number[][], B: number[]): number[] {
  const n = A.length;
  if (n === 0 || B.length !== n || A.some((row) => row.length !== n)) {
    throw new Error("Invalid homography system.");
  }

  const augmented = A.map((row, rowIndex) => [...row, B[rowIndex]]);
  const EPSILON = 1e-10;

  for (let column = 0; column < n; column++) {
    let pivotRow = column;
    let pivotValue = Math.abs(augmented[column][column]);

    for (let row = column + 1; row < n; row++) {
      const value = Math.abs(augmented[row][column]);
      if (value > pivotValue) {
        pivotValue = value;
        pivotRow = row;
      }
    }

    if (pivotValue < EPSILON) {
      throw new Error("Crop points do not form a valid perspective shape.");
    }

    if (pivotRow !== column) {
      [augmented[column], augmented[pivotRow]] = [
        augmented[pivotRow],
        augmented[column],
      ];
    }

    const pivot = augmented[column][column];
    for (let j = column; j <= n; j++) {
      augmented[column][j] /= pivot;
    }

    for (let row = 0; row < n; row++) {
      if (row === column) continue;

      const factor = augmented[row][column];
      if (Math.abs(factor) < EPSILON) continue;

      for (let j = column; j <= n; j++) {
        augmented[row][j] -= factor * augmented[column][j];
      }
    }
  }

  return augmented.map((row) => row[n]);
}

function getHomographyMatrix(src: CropPoint[], dst: CropPoint[]): number[] {
  if (src.length !== 4 || dst.length !== 4) {
    throw new Error("Exactly four crop points are required.");
  }

  const A: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];

    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    B.push(u);

    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    B.push(v);
  }

  return [...solveLinearSystem(A, B), 1];
}

function polygonArea(points: CropPoint[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) / 2;
}

function crossProduct(a: CropPoint, b: CropPoint, c: CropPoint): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function validateCropPoints(
  points: CropPoint[],
  width: number,
  height: number,
): void {
  if (
    points.length !== 4 ||
    !width ||
    !height ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    throw new Error("Invalid crop image dimensions or points.");
  }

  const ordered = points.map((point) => ({
    x: Math.max(0, Math.min(width, point.x)),
    y: Math.max(0, Math.min(height, point.y)),
  }));

  const area = polygonArea(ordered);
  const minimumArea = width * height * 0.003;

  if (area < minimumArea) {
    throw new Error(
      "Crop area is too small. Move the corner handles farther apart.",
    );
  }

  const crossValues = [
    crossProduct(ordered[0], ordered[1], ordered[2]),
    crossProduct(ordered[1], ordered[2], ordered[3]),
    crossProduct(ordered[2], ordered[3], ordered[0]),
    crossProduct(ordered[3], ordered[0], ordered[1]),
  ];

  const positive = crossValues.filter((value) => value > 1e-7);
  const negative = crossValues.filter((value) => value < -1e-7);

  if (positive.length > 0 && negative.length > 0) {
    throw new Error(
      "Crop corners crossed. Keep the four corners in clockwise or counter-clockwise order.",
    );
  }

  const edgeLengths = ordered.map((point, index) => {
    const next = ordered[(index + 1) % ordered.length];
    return Math.hypot(next.x - point.x, next.y - point.y);
  });

  const minimumEdge = Math.max(8, Math.min(width, height) * 0.02);
  if (edgeLengths.some((length) => length < minimumEdge)) {
    throw new Error(
      "Crop corners are too close together. Move each handle to a different card corner.",
    );
  }
}

function warpPerspective(
  img: HTMLImageElement,
  corners: CropPoint[],
  outWidth = 856,
  outHeight = 540,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    try {
      validateCropPoints(corners, naturalWidth, naturalHeight);

      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = naturalWidth;
      sourceCanvas.height = naturalHeight;

      const sourceCtx = sourceCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!sourceCtx) {
        throw new Error("Could not create source crop canvas.");
      }

      sourceCtx.imageSmoothingEnabled = true;
      sourceCtx.imageSmoothingQuality = "high";
      sourceCtx.drawImage(img, 0, 0, naturalWidth, naturalHeight);

      const srcData = sourceCtx.getImageData(0, 0, naturalWidth, naturalHeight);

      const destinationCanvas = document.createElement("canvas");
      destinationCanvas.width = outWidth;
      destinationCanvas.height = outHeight;

      const destinationCtx = destinationCanvas.getContext("2d");
      if (!destinationCtx) {
        throw new Error("Could not create destination crop canvas.");
      }

      const dstCorners: CropPoint[] = [
        { x: 0, y: 0 },
        { x: outWidth - 1, y: 0 },
        { x: outWidth - 1, y: outHeight - 1 },
        { x: 0, y: outHeight - 1 },
      ];

      // Inverse mapping: output rectangle -> selected quadrilateral.
      const H = getHomographyMatrix(dstCorners, corners);

      const outData = destinationCtx.createImageData(outWidth, outHeight);
      const outPixels = outData.data;
      const srcPixels = srcData.data;

      const sample = (x: number, y: number, channel: number): number => {
        const clampedX = Math.max(0, Math.min(naturalWidth - 1, x));
        const clampedY = Math.max(0, Math.min(naturalHeight - 1, y));

        const x0 = Math.floor(clampedX);
        const y0 = Math.floor(clampedY);
        const x1 = Math.min(x0 + 1, naturalWidth - 1);
        const y1 = Math.min(y0 + 1, naturalHeight - 1);
        const dx = clampedX - x0;
        const dy = clampedY - y0;

        const i00 = (y0 * naturalWidth + x0) * 4 + channel;
        const i10 = (y0 * naturalWidth + x1) * 4 + channel;
        const i01 = (y1 * naturalWidth + x0) * 4 + channel;
        const i11 = (y1 * naturalWidth + x1) * 4 + channel;

        return (
          srcPixels[i00] * (1 - dx) * (1 - dy) +
          srcPixels[i10] * dx * (1 - dy) +
          srcPixels[i01] * (1 - dx) * dy +
          srcPixels[i11] * dx * dy
        );
      };

      for (let y = 0; y < outHeight; y++) {
        for (let x = 0; x < outWidth; x++) {
          const denominator = H[6] * x + H[7] * y + H[8];
          if (Math.abs(denominator) < 1e-10) continue;

          const sourceX = (H[0] * x + H[1] * y + H[2]) / denominator;
          const sourceY = (H[3] * x + H[4] * y + H[5]) / denominator;

          const outputIndex = (y * outWidth + x) * 4;
          outPixels[outputIndex] = Math.round(sample(sourceX, sourceY, 0));
          outPixels[outputIndex + 1] = Math.round(sample(sourceX, sourceY, 1));
          outPixels[outputIndex + 2] = Math.round(sample(sourceX, sourceY, 2));
          outPixels[outputIndex + 3] = Math.round(sample(sourceX, sourceY, 3));
        }
      }

      destinationCtx.putImageData(outData, 0, 0);

      destinationCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not create cropped image."));
        }
      }, "image/png");
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Manual crop failed."));
    }
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
  const imgRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);
  const [points, setPoints] = useState<CropPoint[]>([
    { x: 0.05, y: 0.05 },
    { x: 0.95, y: 0.05 },
    { x: 0.95, y: 0.95 },
    { x: 0.05, y: 0.95 },
  ]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dispSize, setDispSize] = useState({ width: 0, height: 0 });
  const [cropError, setCropError] = useState<string | null>(null);
  const imageUrl = useObjectUrl(file);

  useEffect(() => {
    setIsImageLoading(true);
    setImageError(null);
    setCropError(null);
    setActiveIdx(null);
    activePointerIdRef.current = null;
    setPoints([
      { x: 0.05, y: 0.05 },
      { x: 0.95, y: 0.05 },
      { x: 0.95, y: 0.95 },
      { x: 0.05, y: 0.95 },
    ]);
  }, [file]);

  const updateDisplaySize = useCallback(() => {
    const image = imgRef.current;
    if (!image) return;

    const rect = image.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDispSize({ width: rect.width, height: rect.height });
    }
  }, []);

  useEffect(() => {
    if (!imageUrl) return;

    const image = imgRef.current;
    if (!image) return;

    let observer: ResizeObserver | null = null;

    const handleLoaded = () => {
      setIsImageLoading(false);
      setImageError(null);
      updateDisplaySize();

      observer = new ResizeObserver(updateDisplaySize);
      observer.observe(image);
    };

    const handleError = () => {
      setIsImageLoading(false);
      setImageError("The image could not be loaded for manual crop.");
    };

    image.addEventListener("load", handleLoaded);
    image.addEventListener("error", handleError);

    if (image.complete) {
      if (image.naturalWidth > 0) {
        handleLoaded();
      } else {
        handleError();
      }
    }

    window.addEventListener("resize", updateDisplaySize);

    return () => {
      image.removeEventListener("load", handleLoaded);
      image.removeEventListener("error", handleError);
      observer?.disconnect();
      window.removeEventListener("resize", updateDisplaySize);
    };
  }, [imageUrl, updateDisplaySize]);

  const getPointFromClientPosition = useCallback(
    (clientX: number, clientY: number): CropPoint => {
      const image = imgRef.current;
      if (!image) return { x: 0, y: 0 };

      const rect = image.getBoundingClientRect();
      if (!rect.width || !rect.height) return { x: 0, y: 0 };

      return {
        x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
      };
    },
    [],
  );

  const updatePoint = useCallback(
    (idx: number, clientX: number, clientY: number) => {
      const nextPoint = getPointFromClientPosition(clientX, clientY);

      setPoints((prev) => {
        const next = [...prev];
        next[idx] = nextPoint;
        return next;
      });
    },
    [getPointFromClientPosition],
  );

  const handlePointerDown = (
    idx: number,
    e: React.PointerEvent<SVGCircleElement>,
  ) => {
    if (isProcessing || isImageLoading || imageError) return;

    e.preventDefault();
    e.stopPropagation();

    activePointerIdRef.current = e.pointerId;
    setActiveIdx(idx);
    setCropError(null);

    const stage = stageRef.current;
    if (stage) {
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture is not available in every embedded browser.
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      activeIdx === null ||
      activePointerIdRef.current !== e.pointerId ||
      isProcessing
    ) {
      return;
    }

    e.preventDefault();
    updatePoint(activeIdx, e.clientX, e.clientY);
  };

  const releasePointer = useCallback(() => {
    const stage = stageRef.current;
    const pointerId = activePointerIdRef.current;

    if (stage && pointerId !== null) {
      try {
        if (stage.hasPointerCapture(pointerId)) {
          stage.releasePointerCapture(pointerId);
        }
      } catch {
        // Ignore browsers that do not expose pointer-capture state.
      }
    }

    activePointerIdRef.current = null;
    setActiveIdx(null);
  }, []);

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      activePointerIdRef.current !== null &&
      e.pointerId !== activePointerIdRef.current
    ) {
      return;
    }
    releasePointer();
  };

  const handlePointerCancel = () => {
    releasePointer();
  };

  const handleResetPoints = () => {
    if (isProcessing) return;
    setPoints([
      { x: 0.05, y: 0.05 },
      { x: 0.95, y: 0.05 },
      { x: 0.95, y: 0.95 },
      { x: 0.05, y: 0.95 },
    ]);
    setCropError(null);
  };

  const handleApplyCrop = async () => {
    const image = imgRef.current;
    if (!image || !image.naturalWidth || !image.naturalHeight || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setCropError(null);

    const actualCorners = points.map((point) => ({
      x: point.x * image.naturalWidth,
      y: point.y * image.naturalHeight,
    }));

    try {
      const blob = await warpPerspective(
        image,
        actualCorners,
        NID_CROP_WIDTH,
        NID_CROP_HEIGHT,
      );
      const croppedFile = new File(
        [blob],
        file.name.replace(/\.[^.]+$/, ".png"),
        {
          type: "image/png",
          lastModified: Date.now(),
        },
      );

      onApply(croppedFile);
    } catch (error) {
      console.error("Manual crop failed:", error);
      setCropError(
        error instanceof Error
          ? error.message
          : "Manual crop could not be completed. Please adjust the corners and try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const pPx = points.map((point) => ({
    x: point.x * dispSize.width,
    y: point.y * dispSize.height,
  }));

  const modal = (
    <div className="fixed inset-0 z-[9998] w-screen h-[100dvh] min-h-[100svh] bg-[#f8f9fa] flex flex-col font-sans select-none overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs shrink-0">
        <div className="min-w-0 pr-3">
          <div className="flex items-center gap-2">
            <Crop size={16} className="text-amber-500 shrink-0" />
            <h2 className="text-sm font-bold text-gray-950 truncate">
              Crop — {sideTitle}
            </h2>
          </div>
          <p className="text-[11px] text-gray-400 font-medium ml-6 truncate">
            {file.name}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="p-1.5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          aria-label="Close manual crop"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-4 sm:px-6 py-2 bg-gray-50/50 text-[11px] text-gray-500 font-medium border-b border-gray-100 shrink-0">
        Drag all four orange corner handles onto the card edges. The selected
        area will be straightened to a CR80-sized rectangle.
      </div>

      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={() => {
          // Pointer capture keeps an active drag alive even after leaving the stage.
        }}
        className="flex-1 min-h-0 w-full flex items-center justify-center p-3 sm:p-4 relative overflow-auto touch-none"
      >
        <div className="relative inline-block max-w-full max-h-full shadow-lg rounded-sm bg-white touch-none">
          {imageUrl && (
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop target"
              draggable={false}
              onLoad={updateDisplaySize}
              className="max-w-[calc(100vw-24px)] sm:max-w-[calc(100vw-48px)] max-h-[calc(100vh-170px)] object-contain block pointer-events-none select-none"
            />
          )}

          {!isImageLoading && !imageError && dispSize.width > 0 && (
            <svg
              className="absolute inset-0 w-full h-full touch-none"
              width={dispSize.width}
              height={dispSize.height}
              viewBox={`0 0 ${dispSize.width} ${dispSize.height}`}
              preserveAspectRatio="none"
            >
              <polygon
                points={pPx.map((point) => `${point.x},${point.y}`).join(" ")}
                fill="rgba(59, 130, 246, 0.12)"
                stroke="#0088ff"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />

              {pPx.map((point, idx) => (
                <g key={idx}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="15"
                    fill="transparent"
                    stroke="transparent"
                    className="cursor-grab active:cursor-grabbing pointer-events-auto"
                    onPointerDown={(e) => handlePointerDown(idx, e)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${sideTitle} crop corner ${idx + 1}`}
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="8"
                    fill="#ff9800"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                    className="cursor-grab active:cursor-grabbing pointer-events-none"
                  />
                </g>
              ))}
            </svg>
          )}

          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white text-[11px] font-semibold text-gray-500 min-w-[280px] min-h-[180px]">
              Loading image…
            </div>
          )}

          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white p-6 text-center text-[11px] font-semibold text-red-600 min-w-[280px] min-h-[180px]">
              {imageError}
            </div>
          )}

          {isProcessing && !imageError && (
            <div className="absolute inset-0 bg-white/45 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <div className="rounded-full bg-slate-900 text-white px-3 py-1.5 text-[10px] font-bold shadow-lg">
                Cropping…
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-3 shrink-0">
        {cropError && (
          <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
            {cropError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleResetPoints}
            disabled={isProcessing || isImageLoading || !!imageError}
            className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reset corners
          </button>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={
                isProcessing ||
                isImageLoading ||
                !!imageError ||
                dispSize.width === 0
              }
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Cropping…" : "Apply crop"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// --- CROPPED RESULT REVIEW MODAL ---
interface CropReviewModalProps {
  file: File;
  sideTitle: string;
  onClose: () => void;
  onManualCrop: () => void;
}

function CropReviewModal({
  file,
  sideTitle,
  onClose,
  onManualCrop,
}: CropReviewModalProps) {
  const imageUrl = useObjectUrl(file);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setImageLoading(true);
    setImageError(null);
    setDimensions({ width: 0, height: 0 });
  }, [file]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    setDimensions({ width: image.naturalWidth, height: image.naturalHeight });
    setImageLoading(false);
    setImageError(null);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError("The cropped image could not be loaded for preview.");
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] w-screen h-[100dvh] min-h-[100svh] bg-slate-950/95 backdrop-blur-md flex flex-col font-sans overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nid-crop-review-title"
    >
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg shrink-0">
        <div className="min-w-0 pr-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <Eye size={16} />
            </div>
            <div className="min-w-0">
              <h2
                id="nid-crop-review-title"
                className="text-sm sm:text-base font-extrabold text-gray-950 truncate"
              >
                Crop Preview — {sideTitle}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium truncate mt-0.5">
                This is the exact cropped image that will be used in your PDF.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors cursor-pointer shrink-0"
          aria-label="Close crop preview"
        >
          <X size={17} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-4 py-5 sm:px-6 sm:py-7">
        <div className="w-full min-h-full flex flex-col items-center justify-center">
          <div className="w-full max-w-7xl rounded-3xl border border-white/15 bg-white/10 p-2 sm:p-4 shadow-2xl">
            <div className="w-full rounded-2xl bg-[#f3f4f6] border border-white/20 flex items-center justify-center overflow-hidden relative [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]">
              <div
                className="relative w-[min(96vw,1240px)] max-h-[74vh] aspect-[856/540] rounded-xl bg-white overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
                style={{
                  aspectRatio: `${NID_CROP_WIDTH} / ${NID_CROP_HEIGHT}`,
                }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={`Final cropped ${sideTitle}`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    draggable={false}
                    className="absolute inset-0 block w-full h-full max-w-none max-h-none object-fill select-none bg-white"
                  />
                )}

                {imageLoading && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                    <div className="rounded-full bg-slate-900/90 text-white px-4 py-2 text-[11px] font-bold shadow-xl">
                      Loading final crop…
                    </div>
                  </div>
                )}

                {imageError && (
                  <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs sm:text-sm font-semibold text-red-600 bg-white">
                    {imageError}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full max-w-7xl mt-4 rounded-2xl border border-white/10 bg-white/95 shadow-xl px-4 py-3.5 sm:px-5 sm:py-4 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    className="text-emerald-600 shrink-0"
                  />
                  <p className="text-xs sm:text-sm font-extrabold text-gray-900">
                    Review the final crop
                  </p>
                </div>
                <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-1.5 leading-relaxed">
                  Check that the full NID card is visible, all four corners are
                  included, and no important text or edge is cut off.
                </p>
                {dimensions.width > 0 && dimensions.height > 0 && (
                  <p className="text-[10px] text-gray-400 font-semibold mt-1">
                    Output size: {dimensions.width} × {dimensions.height} px
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full lg:w-auto lg:min-w-[430px] shrink-0">
                <button
                  type="button"
                  onClick={onManualCrop}
                  disabled={imageLoading || !!imageError}
                  className="group rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-white text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-xs">
                      <Crop size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-extrabold text-amber-900">
                        Not correct? Crop manually
                      </span>
                      <span className="block text-[9px] font-semibold text-amber-700/80 mt-0.5">
                        Adjust all 4 card corners yourself
                      </span>
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={imageLoading || !!imageError}
                  className="group rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3 text-left transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-white/15 text-white border border-white/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-extrabold text-white">
                        Looks correct — use this crop
                      </span>
                      <span className="block text-[9px] font-semibold text-emerald-50/90 mt-0.5">
                        Keep this image and continue to PDF
                      </span>
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
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

  const [frontCropSource, setFrontCropSource] = useState<File | null>(null);
  const [backCropSource, setBackCropSource] = useState<File | null>(null);

  const [croppingSide, setCroppingSide] = useState<"front" | "back" | null>(
    null,
  );
  const [cropReviewSide, setCropReviewSide] = useState<"front" | "back" | null>(
    null,
  );
  const [autoCropChoiceOpen, setAutoCropChoiceOpen] = useState(false);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [processingSide, setProcessingSide] = useState<"front" | "back" | null>(
    null,
  );
  const [processingBoth, setProcessingBoth] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [frontAutoCropped, setFrontAutoCropped] = useState(false);
  const [backAutoCropped, setBackAutoCropped] = useState(false);
  const [frontCropReviewReady, setFrontCropReviewReady] = useState(false);
  const [backCropReviewReady, setBackCropReviewReady] = useState(false);

  const autoCropAbortRef = useRef<AbortController | null>(null);
  const autoCropRequestIdRef = useRef(0);

  const imageCount = (frontImage ? 1 : 0) + (backImage ? 1 : 0);

  const frontImageUrl = useObjectUrl(frontImage);
  const backImageUrl = useObjectUrl(backImage);

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
      if (sides.length === 0) return;

      const requestId = ++autoCropRequestIdRef.current;

      if (autoCropAbortRef.current) {
        autoCropAbortRef.current.abort();
      }

      const controller = new AbortController();
      autoCropAbortRef.current = controller;
      const timeoutId = window.setTimeout(() => controller.abort(), 30000);

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

          setProcessingSide(side);

          const sourceFile =
            sourceOverrides?.[side] ??
            (side === "front" ? frontImage : backImage);

          if (!sourceFile) continue;

          const sourceUrl = URL.createObjectURL(sourceFile);

          try {
            const img = await loadImageElement(sourceUrl);

            if (
              requestId !== autoCropRequestIdRef.current ||
              controller.signal.aborted
            ) {
              return;
            }

            const sideRotation =
              side === "front" ? frontRotation : backRotation;

            // Match the Document Editor pipeline exactly:
            // File -> Image -> baked rotation canvas -> PNG -> /api/auto-crop.
            const workingCanvas = createRotatedCanvas(img, sideRotation);
            const rotatedSourceFile = await canvasToPngFile(
              workingCanvas,
              `${side}-manual-source.png`,
            );
            const responseBlob = await autoCropCanvas(
              workingCanvas,
              `${side}-crop.png`,
              controller.signal,
            );
            const croppedFile = await normalizeCropResultToCardRatio(
              responseBlob,
              sourceFile.name.replace(/\.[^.]+$/, ".png"),
            );

            if (
              requestId !== autoCropRequestIdRef.current ||
              controller.signal.aborted
            ) {
              return;
            }

            if (side === "front") {
              setFrontImage(croppedFile);
              setFrontCropSource(rotatedSourceFile);
              setFrontAutoCropped(true);
              setFrontCropReviewReady(true);
              // Rotation was baked into the image before the request.
              setFrontRotation(0);
            } else {
              setBackImage(croppedFile);
              setBackCropSource(rotatedSourceFile);
              setBackAutoCropped(true);
              setBackCropReviewReady(true);
              // Rotation was baked into the image before the request.
              setBackRotation(0);
            }
          } finally {
            URL.revokeObjectURL(sourceUrl);
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          if (requestId === autoCropRequestIdRef.current) {
            setProcessingError(
              "Auto crop was cancelled or timed out. Please try again.",
            );
          }
          return;
        }

        if (requestId === autoCropRequestIdRef.current) {
          console.error("Auto crop failed:", error);

          setProcessingError(
            error instanceof Error ? error.message : AUTO_CROP_ERROR,
          );

          if (sides.includes("front")) setFrontAutoCropped(false);
          if (sides.includes("back")) setBackAutoCropped(false);
        }
      } finally {
        window.clearTimeout(timeoutId);

        if (autoCropAbortRef.current === controller) {
          autoCropAbortRef.current = null;
        }

        if (requestId === autoCropRequestIdRef.current) {
          setProcessingSide(null);
          setProcessingBoth(false);
        }
      }
    },
    [frontImage, backImage, frontRotation, backRotation],
  );

  const openAutoCropChoice = useCallback(() => {
    if (imageCount < 2) return;

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

      if (!frontImage && !backImage) return;

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

      if (frontImage) sides.push("front");
      if (backImage) sides.push("back");

      void processAutoCropSides(sides);
    },
    [frontImage, backImage, processAutoCropSides],
  );

  const handleFrontImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setProcessingError(null);
    setCropReviewSide(null);
    setFrontAutoCropped(false);
    setFrontCropReviewReady(false);
    setFrontCropSource(file);
    setFrontImage(file);

    if (autoCrop) {
      void processAutoCropSides(["front"], { front: file });
    }
  };

  const handleBackImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setProcessingError(null);
    setCropReviewSide(null);
    setBackAutoCropped(false);
    setBackCropReviewReady(false);
    setBackCropSource(file);
    setBackImage(file);

    if (autoCrop) {
      void processAutoCropSides(["back"], { back: file });
    }
  };

  const handleSwap = () => {
    cancelAutoCropProcessing();
    setAutoCropChoiceOpen(false);
    setProcessingError(null);

    const temp = frontImage;
    const tempCropSource = frontCropSource;
    setFrontImage(backImage);
    setBackImage(temp);
    setFrontCropSource(backCropSource);
    setBackCropSource(tempCropSource);

    const tempRot = frontRotation;
    setFrontRotation(backRotation);
    setBackRotation(tempRot);

    const tempAutoCropped = frontAutoCropped;
    setFrontAutoCropped(backAutoCropped);
    setBackAutoCropped(tempAutoCropped);

    const tempCropReviewReady = frontCropReviewReady;
    setFrontCropReviewReady(backCropReviewReady);
    setBackCropReviewReady(tempCropReviewReady);
    setCropReviewSide(null);
  };

  const openManualCropFromReview = useCallback((side: "front" | "back") => {
    setCropReviewSide(null);
    setCroppingSide(side);
  }, []);

  const handleReset = () => {
    cancelAutoCropProcessing();
    setAutoCropChoiceOpen(false);
    setProcessingError(null);
    setProcessingSide(null);
    setCropReviewSide(null);
    setFrontImage(null);
    setBackImage(null);
    setFrontCropSource(null);
    setBackCropSource(null);
    setFrontAutoCropped(false);
    setBackAutoCropped(false);
    setFrontCropReviewReady(false);
    setBackCropReviewReady(false);
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

  const cardDim = useMemo(() => {
    if (layout === "stacked") {
      return { width: 260, height: 260 / NID_CROP_ASPECT_RATIO };
    }

    if (orientation === "portrait") {
      return { width: 232, height: 232 / NID_CROP_ASPECT_RATIO };
    }

    return { width: 342, height: 342 / NID_CROP_ASPECT_RATIO };
  }, [layout, orientation]);

  const isFrontPortrait = frontRotation % 180 !== 0;
  const isBackPortrait = backRotation % 180 !== 0;

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

    const pageWidthPx = orientation === "portrait" ? 793.7008 : 1122.5197;
    const pageHeightPx = orientation === "portrait" ? 1122.5197 : 793.7008;
    const printPaddingPx = (20 / 25.4) * 96;
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
      printContent.style.transform = "none";
      printContent.style.transformOrigin = "top center";
      printContent.style.height = "auto";
      printContent.style.width = "100%";
    }

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

    let restored = false;

    const restoreSheet = () => {
      if (restored) return;
      restored = true;

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

    setTimeout(() => window.print(), 150);
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
            clonedSheet.style.transform = "none";
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

          body.nid-print-mode #printable-sheet > div:first-child > div {
            page-break-inside: avoid !important;
            break-inside: avoid-page !important;
          }

          body.nid-print-mode #printable-sheet button,
          body.nid-print-mode #printable-sheet input,
          body.nid-print-mode #printable-sheet label,
          body.nid-print-mode #printable-sheet .group-hover\\:opacity-100 {
            display: none !important;
          }
        }
      `}</style>

      {croppingSide === "front" && frontImage && (
        <CropModal
          file={frontCropSource ?? frontImage}
          sideTitle="Front of NID card"
          onClose={() => setCroppingSide(null)}
          onApply={(croppedFile) => {
            cancelAutoCropProcessing();
            setAutoCropChoiceOpen(false);
            setProcessingError(null);
            setCropReviewSide(null);
            setFrontImage(croppedFile);
            setFrontCropSource((current) => current ?? frontImage);
            setFrontAutoCropped(false);
            setFrontCropReviewReady(true);
            setCroppingSide(null);
          }}
        />
      )}

      {croppingSide === "back" && backImage && (
        <CropModal
          file={backCropSource ?? backImage}
          sideTitle="Back of NID card"
          onClose={() => setCroppingSide(null)}
          onApply={(croppedFile) => {
            cancelAutoCropProcessing();
            setAutoCropChoiceOpen(false);
            setProcessingError(null);
            setCropReviewSide(null);
            setBackImage(croppedFile);
            setBackCropSource((current) => current ?? backImage);
            setBackAutoCropped(false);
            setBackCropReviewReady(true);
            setCroppingSide(null);
          }}
        />
      )}

      {cropReviewSide === "front" && frontImage && (
        <CropReviewModal
          file={frontImage}
          sideTitle="Front of NID card"
          onClose={() => setCropReviewSide(null)}
          onManualCrop={() => openManualCropFromReview("front")}
        />
      )}

      {cropReviewSide === "back" && backImage && (
        <CropReviewModal
          file={backImage}
          sideTitle="Back of NID card"
          onClose={() => setCropReviewSide(null)}
          onManualCrop={() => openManualCropFromReview("back")}
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
        <span className="font-semibold text-gray-900">NID Joiner</span>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            <CreditCard size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">NID Joiner</h1>
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
                          <div
                            className={`relative group w-full h-full overflow-hidden flex justify-center items-center bg-transparent border border-gray-200 ${
                              frontCropReviewReady && processingSide !== "front"
                                ? "cursor-zoom-in hover:ring-2 hover:ring-emerald-400/70"
                                : ""
                            }`}
                            role={frontCropReviewReady ? "button" : undefined}
                            tabIndex={frontCropReviewReady ? 0 : undefined}
                            title={
                              frontCropReviewReady
                                ? "Click to verify this cropped image"
                                : undefined
                            }
                            onClick={() => {
                              if (
                                frontCropReviewReady &&
                                processingSide !== "front"
                              ) {
                                setCropReviewSide("front");
                              }
                            }}
                            onKeyDown={(event) => {
                              if (
                                frontCropReviewReady &&
                                processingSide !== "front" &&
                                (event.key === "Enter" || event.key === " ")
                              ) {
                                event.preventDefault();
                                setCropReviewSide("front");
                              }
                            }}
                          >
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

                            {frontCropReviewReady &&
                              processingSide !== "front" && (
                                <span className="absolute top-2 left-2 z-10 rounded-full bg-emerald-600 text-white px-2 py-1 text-[9px] font-bold shadow-md print:hidden flex items-center gap-1">
                                  <Eye size={10} />
                                  {frontAutoCropped
                                    ? "Auto crop applied · Click to verify"
                                    : "Manual crop applied · Click to verify"}
                                </span>
                              )}

                            <img
                              src={frontImageUrl}
                              alt="Front NID"
                              className={`block w-full h-full max-w-none max-h-none bg-white ${
                                frontCropReviewReady
                                  ? "object-cover"
                                  : "object-contain"
                              }`}
                              style={{ filter: imageFilterStyle }}
                            />

                            <div
                              className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white rounded-full px-2.5 py-1 flex items-center gap-2 shadow-xl border border-slate-700/50 z-30 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-200 print:hidden"
                              onClick={(event) => event.stopPropagation()}
                              onMouseDown={(event) => event.stopPropagation()}
                            >
                              <button
                                onClick={() => setCroppingSide("front")}
                                className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                                title="Crop"
                              >
                                <Crop size={13} />
                              </button>
                              <label
                                htmlFor="front-change-input"
                                onClick={(event) => event.stopPropagation()}
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
                                  setCropReviewSide(null);
                                  setFrontImage(null);
                                  setFrontCropSource(null);
                                  setFrontAutoCropped(false);
                                  setFrontCropReviewReady(false);
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
                          <div
                            className={`relative group w-full h-full overflow-hidden flex justify-center items-center bg-transparent border border-gray-200 ${
                              backCropReviewReady && processingSide !== "back"
                                ? "cursor-zoom-in hover:ring-2 hover:ring-emerald-400/70"
                                : ""
                            }`}
                            role={backCropReviewReady ? "button" : undefined}
                            tabIndex={backCropReviewReady ? 0 : undefined}
                            title={
                              backCropReviewReady
                                ? "Click to verify this cropped image"
                                : undefined
                            }
                            onClick={() => {
                              if (
                                backCropReviewReady &&
                                processingSide !== "back"
                              ) {
                                setCropReviewSide("back");
                              }
                            }}
                            onKeyDown={(event) => {
                              if (
                                backCropReviewReady &&
                                processingSide !== "back" &&
                                (event.key === "Enter" || event.key === " ")
                              ) {
                                event.preventDefault();
                                setCropReviewSide("back");
                              }
                            }}
                          >
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

                            {backCropReviewReady &&
                              processingSide !== "back" && (
                                <span className="absolute top-2 left-2 z-10 rounded-full bg-emerald-600 text-white px-2 py-1 text-[9px] font-bold shadow-md print:hidden flex items-center gap-1">
                                  <Eye size={10} />
                                  {backAutoCropped
                                    ? "Auto crop applied · Click to verify"
                                    : "Manual crop applied · Click to verify"}
                                </span>
                              )}

                            <img
                              src={backImageUrl}
                              alt="Back NID"
                              className={`block w-full h-full max-w-none max-h-none bg-white ${
                                backCropReviewReady
                                  ? "object-cover"
                                  : "object-contain"
                              }`}
                              style={{ filter: imageFilterStyle }}
                            />

                            <div
                              className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white rounded-full px-2.5 py-1 flex items-center gap-2 shadow-xl border border-slate-700/50 z-30 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-200 print:hidden"
                              onClick={(event) => event.stopPropagation()}
                              onMouseDown={(event) => event.stopPropagation()}
                            >
                              <button
                                onClick={() => setCroppingSide("back")}
                                className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                                title="Crop"
                              >
                                <Crop size={13} />
                              </button>
                              <label
                                htmlFor="back-change-input"
                                onClick={(event) => event.stopPropagation()}
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
                                  setCropReviewSide(null);
                                  setBackImage(null);
                                  setBackCropSource(null);
                                  setBackAutoCropped(false);
                                  setBackCropReviewReady(false);
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
