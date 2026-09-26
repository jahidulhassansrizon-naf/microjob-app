"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  Check,
  ChevronDown,
  Crop,
  Download,
  Eraser,
  GraduationCap,
  Image as ImageIcon,
  PenLine,
  RotateCcw,
  Share2,
  ShieldCheck,
  Star,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const PHOTO_WIDTH = 300;
const PHOTO_HEIGHT = 300;
const PHOTO_MAX_BYTES = 100 * 1024; // advisory application target

const SIGNATURE_WIDTH = 300;
const SIGNATURE_HEIGHT = 80;
const SIGNATURE_MAX_BYTES = 60 * 1024; // advisory application target

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type ExportFormat = "jpg" | "png" | "webp";
type ExportMode = "separate" | "zip";
type SignatureMode = "draw" | "type";

type OutputAsset = {
  name: string;
  blob: Blob;
  kind: "photo" | "signature";
  sizeLimit: number;
};

function revokeObjectUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();

      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(new Error("The selected image could not be loaded."));

      element.src = url;
    });

    // Ensure the browser has fully decoded the image before drawing it.
    if (typeof image.decode === "function") {
      try {
        await image.decode();
      } catch {
        // onload already confirms the image is usable; some browsers reject
        // decode() after onload for cached images.
      }
    }

    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Could not create ${mimeType} output.`));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

async function encodeCanvasToFormat(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
): Promise<Blob> {
  const mimeType =
    format === "jpg"
      ? "image/jpeg"
      : format === "png"
        ? "image/png"
        : "image/webp";

  // Export exactly once at maximum browser-supported quality.
  // Do not quantize, palette-reduce, threshold, or run a second compression
  // pass: those were the source of posterization/banding artifacts.
  return canvasToBlob(canvas, mimeType, 1.0);
}

function drawPhotoToCanvas(
  image: CanvasImageSource & {
    width?: number;
    height?: number;
    naturalWidth?: number;
    naturalHeight?: number;
  },
  canvas: HTMLCanvasElement,
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const context = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: true,
    colorSpace: "srgb",
  });
  if (!context) throw new Error("Canvas is not available.");

  const sourceWidth =
    Number(image.naturalWidth ?? image.width ?? 0) || PHOTO_WIDTH;
  const sourceHeight =
    Number(image.naturalHeight ?? image.height ?? 0) || PHOTO_HEIGHT;

  canvas.width = PHOTO_WIDTH;
  canvas.height = PHOTO_HEIGHT;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);

  const sourceSquare = Math.min(sourceWidth, sourceHeight);
  const safeZoom = Math.max(1, Math.min(2.5, zoom));
  const cropSize = sourceSquare / safeZoom;

  const maxX = Math.max(0, sourceWidth - cropSize);
  const maxY = Math.max(0, sourceHeight - cropSize);

  const cropX =
    (sourceWidth - cropSize) / 2 +
    Math.max(-1, Math.min(1, offsetX)) * (maxX / 2);

  const cropY =
    (sourceHeight - cropSize) / 2 +
    Math.max(-1, Math.min(1, offsetY)) * (maxY / 2);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.drawImage(
    image,
    Math.max(0, Math.min(maxX, cropX)),
    Math.max(0, Math.min(maxY, cropY)),
    cropSize,
    cropSize,
    0,
    0,
    PHOTO_WIDTH,
    PHOTO_HEIGHT,
  );
}

function drawSignatureToCanvas(
  image: CanvasImageSource & {
    width?: number;
    height?: number;
    naturalWidth?: number;
    naturalHeight?: number;
  },
  canvas: HTMLCanvasElement,
) {
  const context = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: true,
    colorSpace: "srgb",
  });
  if (!context) throw new Error("Canvas is not available.");

  const sourceWidth =
    Number(image.naturalWidth ?? image.width ?? 0) || SIGNATURE_WIDTH;
  const sourceHeight =
    Number(image.naturalHeight ?? image.height ?? 0) || SIGNATURE_HEIGHT;

  canvas.width = SIGNATURE_WIDTH;
  canvas.height = SIGNATURE_HEIGHT;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, SIGNATURE_WIDTH, SIGNATURE_HEIGHT);

  const scale = Math.min(
    SIGNATURE_WIDTH / sourceWidth,
    SIGNATURE_HEIGHT / sourceHeight,
  );

  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const x = (SIGNATURE_WIDTH - drawWidth) / 2;
  const y = (SIGNATURE_HEIGHT - drawHeight) / 2;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, x, y, drawWidth, drawHeight);
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

async function createZip(
  files: Array<{ name: string; blob: Blob }>,
): Promise<Blob> {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];

  let localOffset = 0;
  const now = new Date();

  const dosTime =
    (now.getHours() << 11) |
    (now.getMinutes() << 5) |
    Math.floor(now.getSeconds() / 2);

  const dosDate =
    ((now.getFullYear() - 1980) << 9) |
    ((now.getMonth() + 1) << 5) |
    now.getDate();

  for (const file of files) {
    const data = new Uint8Array(await file.blob.arrayBuffer());
    const nameBytes = encoder.encode(file.name);
    const checksum = crc32(data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);

    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, localOffset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);

    localOffset += localHeader.length + data.length;
  }

  let centralSize = 0;
  for (const part of centralParts) centralSize += part.length;

  const totalLocalSize = localOffset;

  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);

  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, totalLocalSize, true);
  endView.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, endRecord], {
    type: "application/zip",
  });
}

function extensionFor(format: ExportFormat) {
  if (format === "jpg") return "jpg";
  if (format === "png") return "png";
  return "webp";
}

export default function GovtJobPhotoSignResizer() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoOffsetX, setPhotoOffsetX] = useState(0);
  const [photoOffsetY, setPhotoOffsetY] = useState(0);

  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [isSignatureStudioOpen, setIsSignatureStudioOpen] = useState(false);
  const [signatureMode, setSignatureMode] = useState<SignatureMode>("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [signatureCanvasReady, setSignatureCanvasReady] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);

  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("jpg");
  const [exportMode, setExportMode] = useState<ExportMode>("separate");
  const [printPhotoSrc, setPrintPhotoSrc] = useState<string | null>(null);
  const [printSignatureSrc, setPrintSignatureSrc] = useState<string | null>(
    null,
  );

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      revokeObjectUrl(photoPreview);
      revokeObjectUrl(signaturePreview);
    };
  }, [photoPreview, signaturePreview]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintPhotoSrc((current) => {
        revokeObjectUrl(current);
        return null;
      });
      setPrintSignatureSrc((current) => {
        revokeObjectUrl(current);
        return null;
      });
    };

    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = 600;
    canvas.height = 160;
    canvas.style.width = "100%";
    canvas.style.height = "160px";

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 600, 160);
    context.strokeStyle = "#111827";
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    context.lineJoin = "round";

    setSignatureCanvasReady(true);
  }, [signatureMode]);

  useEffect(() => {
    const context = signatureCanvasRef.current?.getContext("2d");
    if (!context) return;
    context.lineWidth = strokeWidth;
  }, [strokeWidth]);

  const hasInput = photo !== null || signature !== null;
  const canExport = hasInput && !isProcessing;

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED_TYPES.has(file.type)) {
      setStatusMessage("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_SOURCE_BYTES) {
      setStatusMessage("Please choose an image smaller than 10 MB.");
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    revokeObjectUrl(photoPreview);

    setPhoto(file);
    setPhotoPreview(nextPreview);
    setPhotoZoom(1);
    setPhotoOffsetX(0);
    setPhotoOffsetY(0);
    setStatusMessage("Photo updated.");
  };

  const handleSignatureUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED_TYPES.has(file.type)) {
      setStatusMessage("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_SOURCE_BYTES) {
      setStatusMessage("Please choose an image smaller than 10 MB.");
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    revokeObjectUrl(signaturePreview);

    setSignature(file);
    setSignaturePreview(nextPreview);
    setStatusMessage("Signature updated.");
    setIsSignatureStudioOpen(false);
  };

  const clearPhoto = () => {
    revokeObjectUrl(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
    setPhotoZoom(1);
    setPhotoOffsetX(0);
    setPhotoOffsetY(0);
    setStatusMessage(null);
  };

  const clearSignature = () => {
    revokeObjectUrl(signaturePreview);
    setSignature(null);
    setSignaturePreview(null);
    setStatusMessage(null);
  };

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#111827";
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    context.lineJoin = "round";

    setSignatureCanvasReady(false);
  };

  const handleReset = () => {
    clearPhoto();
    clearSignature();
    setTypedSignature("");
    setIsSignatureStudioOpen(false);
    setShowExportOptions(false);
    revokeObjectUrl(printPhotoSrc);
    revokeObjectUrl(printSignatureSrc);
    setPrintPhotoSrc(null);
    setPrintSignatureSrc(null);
    setStatusMessage(null);
    clearSignatureCanvas();
  };

  const beginDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (signatureMode !== "draw") return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

    context.beginPath();
    context.moveTo(x, y);
    canvas.setPointerCapture(event.pointerId);
    setIsDrawing(true);
    setSignatureCanvasReady(true);
  };

  const drawSignature = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signatureMode !== "draw") return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

    context.lineTo(x, y);
    context.stroke();
  };

  const finishDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;

    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    setIsDrawing(false);
  };

  const renderTypedSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return false;

    const context = canvas.getContext("2d");
    if (!context) return false;

    const text = typedSignature.trim();
    if (!text) return false;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    let fontSize = 84;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#111827";
    context.font = `italic ${fontSize}px "Brush Script MT", "Segoe Script", "Comic Sans MS", cursive`;

    while (context.measureText(text).width > 540 && fontSize > 34) {
      fontSize -= 2;
      context.font = `italic ${fontSize}px "Brush Script MT", "Segoe Script", "Comic Sans MS", cursive`;
    }

    context.fillText(text, canvas.width / 2, canvas.height / 2 + 5);
    setSignatureCanvasReady(true);
    return true;
  };

  const useCreatedSignature = async () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    if (signatureMode === "type" && !renderTypedSignature()) {
      setStatusMessage("Type your name first.");
      return;
    }

    if (signatureMode === "draw" && !signatureCanvasReady) {
      setStatusMessage("Draw your signature first.");
      return;
    }

    try {
      const blob = await canvasToBlob(canvas, "image/png");

      const file = new File([blob], "created-signature.png", {
        type: "image/png",
      });

      const nextPreview = URL.createObjectURL(blob);

      revokeObjectUrl(signaturePreview);
      setSignature(file);
      setSignaturePreview(nextPreview);
      setIsSignatureStudioOpen(false);
      setStatusMessage("Signature created and added.");
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not create the signature.");
    }
  };

  const buildPrintPreview = async () => {
    const nextUrls: string[] = [];

    try {
      if (photo) {
        const image = await loadImageFromFile(photo);
        const canvas = document.createElement("canvas");
        drawPhotoToCanvas(image, canvas, photoZoom, photoOffsetX, photoOffsetY);
        const blob = await canvasToBlob(canvas, "image/png", 1.0);
        nextUrls.push(URL.createObjectURL(blob));
      }

      if (signature) {
        const image = await loadImageFromFile(signature);
        const canvas = document.createElement("canvas");
        drawSignatureToCanvas(image, canvas);
        const blob = await canvasToBlob(canvas, "image/png", 1.0);
        nextUrls.push(URL.createObjectURL(blob));
      }

      const nextPhotoUrl = photo ? (nextUrls[0] ?? null) : null;
      const nextSignatureUrl = signature
        ? (nextUrls[photo ? 1 : 0] ?? null)
        : null;

      setPrintPhotoSrc(nextPhotoUrl);
      setPrintSignatureSrc(nextSignatureUrl);

      // Allow React to paint the print sheet before opening the system dialog.
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(() => resolve()),
        );
      });

      window.print();
    } catch (error) {
      nextUrls.forEach((url) => URL.revokeObjectURL(url));
      console.error(
        "[GovtJobPhotoSignResizer] Print preparation failed:",
        error,
      );
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Could not prepare the print preview.",
      );
      setPrintPhotoSrc(null);
      setPrintSignatureSrc(null);
    }
  };

  const handlePrint = async () => {
    if ((!photo && !signature) || isProcessing) {
      setStatusMessage("Add a photo or signature before printing.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      await buildPrintPreview();
    } finally {
      setIsProcessing(false);
    }
  };

  const buildAssets = async (): Promise<OutputAsset[]> => {
    const assets: OutputAsset[] = [];
    const extension = extensionFor(exportFormat);

    if (photo) {
      const image = await loadImageFromFile(photo);
      const canvas = document.createElement("canvas");
      drawPhotoToCanvas(image, canvas, photoZoom, photoOffsetX, photoOffsetY);

      const blob = await encodeCanvasToFormat(canvas, exportFormat);

      assets.push({
        name: `govt-job-photo-300x300.${extension}`,
        blob,
        kind: "photo",
        sizeLimit: PHOTO_MAX_BYTES,
      });
    }

    if (signature) {
      const image = await loadImageFromFile(signature);
      const canvas = document.createElement("canvas");
      drawSignatureToCanvas(image, canvas);

      const blob = await encodeCanvasToFormat(canvas, exportFormat);

      assets.push({
        name: `govt-job-signature-300x80.${extension}`,
        blob,
        kind: "signature",
        sizeLimit: SIGNATURE_MAX_BYTES,
      });
    }

    return assets;
  };

  const performExport = async () => {
    if (!canExport) return;

    setIsProcessing(true);
    setStatusMessage(null);
    setShowExportOptions(false);

    try {
      const assets = await buildAssets();

      if (!assets.length) {
        throw new Error("No exportable files were found.");
      }

      if (exportMode === "zip") {
        const zip = await createZip(
          assets.map((asset) => ({
            name: asset.name,
            blob: asset.blob,
          })),
        );

        downloadBlob(zip, "govt-job-photo-sign-package.zip");
      } else {
        for (const asset of assets) {
          downloadBlob(asset.blob, asset.name);
          await new Promise((resolve) => window.setTimeout(resolve, 120));
        }
      }

      const overLimit = assets.filter(
        (asset) => asset.blob.size > asset.sizeLimit,
      );

      if (overLimit.length) {
        setStatusMessage(
          `${exportMode === "zip" ? "ZIP package ready." : "Files ready."} ` +
            `${overLimit
              .map(
                (item) =>
                  `${item.kind} is ${formatBytes(item.blob.size)} (above the ${formatBytes(
                    item.sizeLimit,
                  )} application target)`,
              )
              .join(
                "; ",
              )}. Dimensions and maximum export quality were preserved.`,
        );
      } else {
        setStatusMessage(
          exportMode === "zip"
            ? "Your ZIP package is ready."
            : "Your files are ready.",
        );
      }
    } catch (error) {
      console.error("[GovtJobPhotoSignResizer] Export failed:", error);

      const message =
        error instanceof Error ? error.message : "Could not export the files.";

      setStatusMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Govt Job Photo & Sign Resizer",
          text: "Free browser-based photo and signature resizer.",
          url: window.location.href,
        });
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setStatusMessage("Tool link copied.");
      }
    } catch {
      // User cancelled the native share sheet.
    }
  };

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          html,
          body {
            width: 210mm !important;
            min-height: 297mm !important;
            background: #ffffff !important;
          }

          body * {
            visibility: hidden !important;
          }

          #govt-job-print-sheet,
          #govt-job-print-sheet * {
            visibility: visible !important;
          }

          #govt-job-print-sheet {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            display: block !important;
            width: 190mm !important;
            min-height: 277mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111827 !important;
          }
        }
      `}</style>

      <div id="govt-job-print-sheet" className="hidden">
        <div className="flex min-h-[277mm] w-[190mm] flex-col p-[4mm] font-sans text-gray-900">
          <div className="border-b border-gray-300 pb-3">
            <h2 className="text-lg font-bold">Govt Job Photo & Sign Resizer</h2>
            <p className="mt-1 text-xs text-gray-500">
              Print and cut using the dashed borders.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-start gap-12">
            {printPhotoSrc ? (
              <div>
                <div className="mb-2 text-xs font-semibold">
                  Photo — 300×300 px / 3cm × 3cm
                </div>
                <div className="flex h-[3cm] w-[3cm] items-center justify-center border-[0.25mm] border-dashed border-gray-500 bg-white p-0">
                  <img
                    src={printPhotoSrc}
                    alt="Printable photo"
                    className="block h-[3cm] w-[3cm] object-cover"
                  />
                </div>
              </div>
            ) : null}

            {printSignatureSrc ? (
              <div>
                <div className="mb-2 text-xs font-semibold">
                  Signature — 300×80 px / 3cm × 0.8cm
                </div>
                <div className="flex h-[0.8cm] w-[3cm] items-center justify-center border-[0.25mm] border-dashed border-gray-500 bg-white p-0">
                  <img
                    src={printSignatureSrc}
                    alt="Printable signature"
                    className="block h-[0.8cm] w-[3cm] object-contain"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-auto border-t border-gray-200 pt-3 text-[9px] leading-relaxed text-gray-500">
            For accurate physical size, print at 100% / Actual Size. Disable
            “Fit to page” or similar scaling in the printer dialog.
          </div>
        </div>
      </div>

      <div className="w-full space-y-6 pb-16 font-sans text-gray-800">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <nav className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
              <Link href="/" className="transition-colors hover:text-gray-800">
                <Crop size={14} className="mr-1 inline" />
              </Link>
              <span>/</span>
              <Link
                href="/sohoj-tools"
                className="transition-colors hover:text-gray-800"
              >
                Sohoj Tools
              </Link>
              <span>/</span>
              <span>Educational Tools</span>
              <span>/</span>
              <span className="font-semibold text-gray-800">
                Govt Job Photo & Sign Resizer
              </span>
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Crop size={20} />
              </div>

              <h1 className="text-xl font-extrabold tracking-tight text-gray-900 md:text-2xl">
                Govt Job Photo & Sign Resizer
              </h1>

              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Free
              </span>
            </div>

            <p className="mt-1 text-xs font-medium text-gray-500">
              Resize your application photo and signature to the required
              dimensions directly in your browser.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFavorite((value) => !value)}
              className={`rounded-xl border bg-white p-2 shadow-sm transition-colors hover:bg-gray-50 ${
                favorite
                  ? "border-amber-300 text-amber-500"
                  : "border-gray-200 text-gray-600"
              }`}
              title="Favorite"
              aria-pressed={favorite}
            >
              <Star size={16} fill={favorite ? "currentColor" : "none"} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
              title="Share"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <div className="space-y-5 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
              <div>
                <h2 className="text-xs font-bold text-gray-900">
                  Position & crop
                </h2>
                <p className="mt-1 text-[10px] text-gray-400">
                  Upload or replace your files anytime.
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">
                    Photo 300×300 px
                  </label>

                  {photo ? (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-700"
                    >
                      Change
                    </button>
                  ) : null}
                </div>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />

                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-4 text-center transition-colors hover:border-amber-400"
                >
                  {photo && photoPreview ? (
                    <div className="flex items-center gap-3 text-left">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <img
                          src={photoPreview}
                          alt="Uploaded photo"
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-gray-800">
                          {photo.name}
                        </div>
                        <div className="mt-0.5 text-[10px] text-gray-400">
                          {formatBytes(photo.size)} · Click to replace
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/80 text-amber-600">
                        <Upload size={16} />
                      </div>
                      <div className="text-xs font-bold text-gray-800">
                        Upload passport photo
                      </div>
                      <div className="mt-0.5 text-[10px] text-gray-400">
                        JPG, PNG, or WebP · up to 10 MB
                      </div>
                    </>
                  )}
                </button>

                {photo ? (
                  <div className="mt-3 space-y-2.5 rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-gray-600">
                      <span>Zoom</span>
                      <span>{photoZoom.toFixed(1)}×</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <ZoomOut size={14} className="text-gray-400" />
                      <input
                        type="range"
                        min="1"
                        max="2.5"
                        step="0.1"
                        value={photoZoom}
                        onChange={(event) =>
                          setPhotoZoom(Number(event.target.value))
                        }
                        className="w-full accent-amber-500"
                      />
                      <ZoomIn size={14} className="text-gray-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[10px] font-semibold text-gray-500">
                        Horizontal
                        <input
                          type="range"
                          min="-1"
                          max="1"
                          step="0.01"
                          value={photoOffsetX}
                          onChange={(event) =>
                            setPhotoOffsetX(Number(event.target.value))
                          }
                          className="mt-1 w-full accent-amber-500"
                        />
                      </label>

                      <label className="text-[10px] font-semibold text-gray-500">
                        Vertical
                        <input
                          type="range"
                          min="-1"
                          max="1"
                          step="0.01"
                          value={photoOffsetY}
                          onChange={(event) =>
                            setPhotoOffsetY(Number(event.target.value))
                          }
                          className="mt-1 w-full accent-amber-500"
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPhotoZoom(1);
                        setPhotoOffsetX(0);
                        setPhotoOffsetY(0);
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 hover:text-gray-800"
                    >
                      <RotateCcw size={12} />
                      Reset crop
                    </button>
                  </div>
                ) : null}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">
                    Signature 300×80 px
                  </label>

                  {signature ? (
                    <button
                      type="button"
                      onClick={() => signatureInputRef.current?.click()}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-700"
                    >
                      Change
                    </button>
                  ) : null}
                </div>

                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleSignatureUpload}
                />

                <button
                  type="button"
                  onClick={() => signatureInputRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-4 text-center transition-colors hover:border-amber-400"
                >
                  {signature && signaturePreview ? (
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white p-1">
                        <img
                          src={signaturePreview}
                          alt="Uploaded signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-gray-800">
                          {signature.name}
                        </div>
                        <div className="mt-0.5 text-[10px] text-gray-400">
                          {formatBytes(signature.size)} · Click to replace
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/80 text-amber-600">
                        <Upload size={16} />
                      </div>
                      <div className="text-xs font-bold text-gray-800">
                        Upload signature
                      </div>
                      <div className="mt-0.5 text-[10px] text-gray-400">
                        JPG, PNG, or WebP · or create one on the right
                      </div>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignatureStudioOpen((value) => !value);
                    setStatusMessage(null);
                  }}
                  className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 hover:text-gray-800"
                >
                  <PenLine size={12} />
                  {signature
                    ? "Create a new signature instead"
                    : "Create a signature without uploading"}
                </button>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-xs font-bold text-gray-900">
                Output specs
              </h2>
              <p className="text-[11px] leading-relaxed text-gray-500">
                Photo: 300×300 pixels, max 100 KB JPEG
              </p>
              <p className="text-[11px] leading-relaxed text-gray-500">
                Signature: 300×80 pixels, max 60 KB JPEG
              </p>
              <p className="pt-1 text-[11px] leading-relaxed text-gray-400">
                PNG and WebP keep the same exact dimensions. JPEG/WebP are
                compressed to the target byte limit.
              </p>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-8">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-xs font-bold text-gray-900">
                  Output preview
                </h2>

                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    hasInput
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {hasInput ? "Ready" : "Empty"}
                </span>
              </div>

              <div className="my-4 min-h-[350px] rounded-xl border border-gray-200/60 bg-gray-50/60 p-6">
                {hasInput ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center gap-8 sm:flex-row">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-xs font-semibold text-gray-600">
                        Photo (300×300)
                      </div>

                      <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Photo crop preview"
                            className="h-full w-full object-cover"
                            style={{
                              objectPosition: `${50 + photoOffsetX * 25}% ${
                                50 + photoOffsetY * 25
                              }%`,
                              transform: `scale(${photoZoom})`,
                            }}
                          />
                        ) : (
                          <div className="text-xs text-gray-400">No photo</div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="text-xs font-semibold text-gray-600">
                        Signature (300×80)
                      </div>

                      <div className="flex h-16 w-56 items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
                        {signaturePreview ? (
                          <img
                            src={signaturePreview}
                            alt="Signature preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-[11px] text-gray-400">
                            Create or upload a signature
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                      <ImageIcon size={24} />
                    </div>

                    <h3 className="mb-1 text-xs font-bold text-gray-800">
                      Upload photo and signature
                    </h3>

                    <p className="max-w-xs text-[11px] leading-relaxed text-gray-400">
                      You can change either file anytime, then export both
                      together or separately.
                    </p>
                  </div>
                )}
              </div>

              {statusMessage ? (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
                  {statusMessage}
                </div>
              ) : null}
            </div>

            {(!signature || isSignatureStudioOpen) && (
              <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                        <PenLine size={18} />
                      </div>

                      <h2 className="text-sm font-bold text-gray-900">
                        Create your signature
                      </h2>
                    </div>

                    <p className="mt-1 text-[10px] text-gray-400">
                      Draw your signature or type your name and use it directly.
                    </p>
                  </div>

                  <div className="flex rounded-lg bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() => setSignatureMode("draw")}
                      className={`rounded-md px-3 py-1.5 text-[10px] font-bold ${
                        signatureMode === "draw"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500"
                      }`}
                    >
                      Draw
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignatureMode("type")}
                      className={`rounded-md px-3 py-1.5 text-[10px] font-bold ${
                        signatureMode === "type"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500"
                      }`}
                    >
                      Type
                    </button>
                  </div>
                </div>

                {signatureMode === "type" ? (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={typedSignature}
                      onChange={(event) =>
                        setTypedSignature(event.target.value)
                      }
                      placeholder="Type your name"
                      className="h-10 flex-1 rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />

                    <button
                      type="button"
                      onClick={renderTypedSignature}
                      disabled={!typedSignature.trim()}
                      className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      Preview
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-gray-500">
                      Pen width
                      <input
                        type="range"
                        min="1"
                        max="7"
                        step="1"
                        value={strokeWidth}
                        onChange={(event) =>
                          setStrokeWidth(Number(event.target.value))
                        }
                        className="ml-2 w-28 accent-violet-500"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={clearSignatureCanvas}
                      className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 hover:text-gray-800"
                    >
                      <Eraser size={12} />
                      Clear
                    </button>
                  </div>
                )}

                <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <canvas
                    ref={signatureCanvasRef}
                    onPointerDown={beginDrawing}
                    onPointerMove={drawSignature}
                    onPointerUp={finishDrawing}
                    onPointerCancel={finishDrawing}
                    className="block w-full touch-none"
                    aria-label="Signature drawing area"
                  />
                </div>

                <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {signature ? (
                    <button
                      type="button"
                      onClick={() => setIsSignatureStudioOpen(false)}
                      className="text-[10px] font-semibold text-gray-500 hover:text-gray-800"
                    >
                      Close signature studio
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-400">
                      Your signature is created locally in the browser.
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={useCreatedSignature}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
                  >
                    <Check size={14} />
                    Use this signature
                  </button>
                </div>
              </div>
            )}

            {showExportOptions ? (
              <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">
                      Export options
                    </h2>
                    <p className="mt-1 text-[10px] text-gray-400">
                      Choose the format and whether to download separately or as
                      one ZIP.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowExportOptions(false)}
                    className="self-start rounded-lg px-2 py-1 text-[10px] font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-800 sm:self-auto"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      File format
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {(["jpg", "png", "webp"] as ExportFormat[]).map(
                        (format) => (
                          <button
                            key={format}
                            type="button"
                            onClick={() => setExportFormat(format)}
                            className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase transition ${
                              exportFormat === format
                                ? "border-amber-400 bg-amber-50 text-amber-700"
                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {format}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      Download
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setExportMode("separate")}
                        className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                          exportMode === "separate"
                            ? "border-amber-400 bg-amber-50 text-amber-700"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        Separate files
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportMode("zip")}
                        className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                          exportMode === "zip"
                            ? "border-amber-400 bg-amber-50 text-amber-700"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        One ZIP
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:flex-row sm:items-center">
                  <div className="text-[10px] font-semibold text-gray-500">
                    {exportFormat.toUpperCase()} ·{" "}
                    {exportMode === "zip"
                      ? "one ZIP package"
                      : "separate files"}
                  </div>

                  <button
                    type="button"
                    onClick={performExport}
                    disabled={!canExport}
                    className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold transition sm:w-auto ${
                      canExport
                        ? "bg-amber-500 text-white hover:bg-amber-600"
                        : "cursor-not-allowed bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Download size={14} />
                    {isProcessing ? "Preparing…" : "Download"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white px-5 py-3.5 shadow-sm sm:flex-row">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span
              className={`h-2 w-2 rounded-full ${
                hasInput ? "bg-emerald-500" : "bg-gray-300"
              }`}
            />
            <span>
              {isProcessing
                ? "Preparing your files…"
                : hasInput
                  ? "Files loaded — choose Export when ready"
                  : "Add a photo or signature to get started"}
            </span>
          </div>

          <div className="flex w-full items-center gap-2.5 sm:w-auto">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 sm:flex-initial"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={!hasInput || isProcessing}
              className={`flex-1 rounded-xl border px-5 py-2 text-xs font-bold transition sm:flex-initial ${
                hasInput && !isProcessing
                  ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  : "cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400"
              }`}
            >
              Print
            </button>

            <button
              type="button"
              onClick={() => {
                setShowExportOptions((value) => !value);
                setStatusMessage(null);
              }}
              disabled={!hasInput}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold transition-all sm:flex-initial ${
                hasInput
                  ? "cursor-pointer bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                  : "cursor-not-allowed bg-gray-100 text-gray-400"
              }`}
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-xs font-medium text-emerald-800 shadow-sm">
          <ShieldCheck size={18} className="shrink-0 text-emerald-600" />
          <span>
            Your files stay in your browser. Nothing is uploaded to a server.
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setIsHowToUseOpen((value) => !value)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-gray-50/60"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-500">?</span>
              <span className="text-xs font-bold text-gray-800">
                How to use
              </span>
            </div>

            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform duration-200 ${
                isHowToUseOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isHowToUseOpen ? (
            <div className="space-y-2 border-t border-gray-100 px-5 pb-4 pt-3 text-xs text-gray-600">
              <p>1. Upload your photo and/or signature.</p>
              <p>2. Use zoom and position controls to set the photo crop.</p>
              <p>3. Replace either image anytime with Change.</p>
              <p>
                4. Without a signature image, draw or type one on the right and
                choose “Use this signature”.
              </p>
              <p>
                5. Click Export, choose JPG, PNG, or WebP, then choose separate
                files or one ZIP package.
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-700">
            Tools in the same category
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link
              href="/sohoj-tools/education-board-result"
              className="group flex items-start gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:border-teal-300"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <GraduationCap size={20} />
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-800 transition-colors group-hover:text-teal-600">
                  Education Board Result
                </h4>

                <p className="mt-0.5 line-clamp-2 text-[10px] text-gray-400">
                  Check education board results from Bangladesh&apos;s official
                  system.
                </p>
              </div>
            </Link>

            <Link
              href="/sohoj-tools/national-university-result"
              className="group flex items-start gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:border-teal-300"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <GraduationCap size={20} />
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-800 transition-colors group-hover:text-teal-600">
                  National University Result
                </h4>

                <p className="mt-0.5 line-clamp-2 text-[10px] text-gray-400">
                  Check Honours, Degree Pass, Master&apos;s and Professional
                  results.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
