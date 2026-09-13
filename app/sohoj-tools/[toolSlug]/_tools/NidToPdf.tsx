"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import NidSettingsPanel from "@/components/nidToPdfComponent/NidSettingsPanel";

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
  const [autoCrop, setAutoCrop] = useState(true);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );
  const [layout, setLayout] = useState<"side-by-side" | "stacked">(
    "side-by-side",
  );
  const [position, setPosition] = useState<"top" | "center" | "bottom">("top");
  const [copies, setCopies] = useState<number>(1);
  const [roundedCorners, setRoundedCorners] = useState(false);

  // গ্লোবাল রোটেশন (সেটিংস প্যানেল এবং ফ্লোটিং গ্লোবাল বাটনের জন্য)
  const [rotation, setRotation] = useState<number>(0);

  // পৃথক কার্ড রোটেশন স্টেট (সিঙ্গেল কার্ডের হোভার মেনু দিয়ে ঘোরানোর জন্য)
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

  const imageCount = (frontImage ? 1 : 0) + (backImage ? 1 : 0);

  const frontImageUrl = useMemo(
    () => (frontImage ? URL.createObjectURL(frontImage) : null),
    [frontImage],
  );
  const backImageUrl = useMemo(
    () => (backImage ? URL.createObjectURL(backImage) : null),
    [backImage],
  );

  const handleFrontImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFrontImage(e.target.files[0]);
    }
  };

  const handleBackImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBackImage(e.target.files[0]);
    }
  };

  const handleSwap = () => {
    const temp = frontImage;
    setFrontImage(backImage);
    setBackImage(temp);

    // সোয়াপ করার সময় রোটেশনও এক্সচেঞ্জ করে দিতে পারেন চাইলে
    const tempRot = frontRotation;
    setFrontRotation(backRotation);
    setBackRotation(tempRot);
  };

  const handleReset = () => {
    setFrontImage(null);
    setBackImage(null);
    setRotation(0);
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

  // সেটিংস প্যানেল থেকে গ্লোবাল রোটেশন চেঞ্জ হলে ফ্রন্ট ও ব্যাক উভয়ের রোটেশন সিঙ্ক করে দেওয়া যায় অথবা গ্লোবাল রাখা যায়
  const handleGlobalRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
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

  const handlePrint = () => {
    const sheet = document.getElementById("printable-sheet");

    if (!sheet) return;

    const originalParent = sheet.parentNode;
    const originalNextSibling = sheet.nextSibling;

    document.body.classList.add("nid-print-mode");
    document.body.appendChild(sheet);

    const restoreSheet = () => {
      document.body.classList.remove("nid-print-mode");

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
    }, 100);

    setTimeout(restoreSheet, 3000);
  };

  const handleCreatePdf = async () => {
    const sheet = document.getElementById("printable-sheet");
    if (!sheet) return;

    try {
      const canvas = await html2canvas(sheet, {
        scale: 2,
        useCORS: true,
        logging: false,
        ignoreElements: (element) => {
          return (
            element.classList.contains("print:hidden") ||
            element.tagName === "BUTTON"
          );
        },
        onclone: (clonedDoc) => {
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
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("nid-card.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="w-full space-y-5 text-gray-800 font-sans">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body.nid-print-mode {
            overflow: hidden !important;
          }

          body.nid-print-mode > *:not(#printable-sheet) {
            display: none !important;
          }

          body.nid-print-mode #printable-sheet,
          body.nid-print-mode #printable-sheet * {
            visibility: visible !important;
          }

          body.nid-print-mode #printable-sheet .absolute.left-1\\/2.-translate-x-1\\/2,
          body.nid-print-mode #printable-sheet .absolute.z-20 {
            display: none !important;
          }

          body.nid-print-mode #printable-sheet {
            position: static !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;

            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;

            margin: 0 !important;
            padding: 20mm !important;
            box-sizing: border-box !important;

            overflow: hidden !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;

            transform: none !important;
            transform-origin: top left !important;

            page-break-before: avoid !important;
            page-break-after: avoid !important;
            break-before: avoid-page !important;
            break-after: avoid-page !important;
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
            setFrontImage(croppedFile);
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
            setBackImage(croppedFile);
            setCroppingSide(null);
          }}
        />
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
          setAutoCrop={setAutoCrop}
          orientation={orientation}
          setOrientation={setOrientation}
          layout={layout}
          setLayout={setLayout}
          rotation={rotation}
          setRotation={(val) => {
            setRotation(val);
            setFrontRotation(val);
            setBackRotation(val);
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
                    className={`relative w-full ${
                      layout === "side-by-side"
                        ? "grid grid-cols-2 gap-3 items-center"
                        : "flex flex-col items-center gap-4"
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
                      className={`aspect-[85.6/53.98] overflow-hidden ${
                        roundedCorners ? "rounded-[14px]" : "rounded-none"
                      } ${
                        layout === "side-by-side"
                          ? "w-full"
                          : "w-[260px] max-w-full"
                      }`}
                    >
                      {frontImageUrl ? (
                        <div className="relative group w-full h-full overflow-hidden flex justify-center items-center bg-transparent border border-gray-200">
                          <img
                            src={frontImageUrl}
                            alt="Front NID"
                            className="w-full h-full object-cover transition-all duration-200"
                            style={{
                              transform: `rotate(${frontRotation}deg)`,
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
                                setFrontRotation((r) => (r + 90) % 360)
                              }
                              className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                              title="Rotate Front 90°"
                            >
                              <RotateCw size={13} />
                            </button>
                            <button
                              onClick={() => setFrontImage(null)}
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
                        <label className="border-2 border-dashed border-amber-300 bg-amber-50/20 hover:bg-amber-50/50 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer h-full transition-all">
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

                    {/* BACK CARD CONTAINER */}
                    <div
                      className={`aspect-[85.6/53.98] overflow-hidden ${
                        roundedCorners ? "rounded-[14px]" : "rounded-none"
                      } ${
                        layout === "side-by-side"
                          ? "w-full"
                          : "w-[260px] max-w-full"
                      }`}
                    >
                      {backImageUrl ? (
                        <div className="relative group w-full h-full overflow-hidden flex justify-center items-center bg-transparent border border-gray-200">
                          <img
                            src={backImageUrl}
                            alt="Back NID"
                            className="w-full h-full object-cover transition-all duration-200"
                            style={{
                              transform: `rotate(${backRotation}deg)`,
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
                                setBackRotation((r) => (r + 90) % 360)
                              }
                              className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                              title="Rotate Back 90°"
                            >
                              <RotateCw size={13} />
                            </button>
                            <button
                              onClick={() => setBackImage(null)}
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
                        <label className="border-2 border-dashed border-amber-300 bg-amber-50/20 hover:bg-amber-50/50 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer h-full transition-all">
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
            disabled={!frontImage && !backImage}
            className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              frontImage || backImage
                ? "bg-amber-500 text-white shadow-xs hover:bg-amber-600 cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <span>Create PDF</span>
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
