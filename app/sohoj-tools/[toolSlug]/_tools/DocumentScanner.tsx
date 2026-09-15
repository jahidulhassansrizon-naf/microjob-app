"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactCompareImage from "react-compare-image";
import {
  ArrowLeft,
  Upload,
  Crop,
  Download,
  Printer,
  FileDown,
  RotateCcw,
  Undo,
  Redo,
  Plus,
  Minus,
  Sparkles,
  X,
  Loader2,
  Columns,
  AlertCircle,
  Palette,
} from "lucide-react";
import jsPDF from "jspdf";

declare global {
  interface Window {
    cv: any;
  }
}

interface Point {
  x: number;
  y: number;
}

const DEFAULT_CORNERS: Point[] = [
  { x: 10, y: 10 },
  { x: 90, y: 10 },
  { x: 90, y: 90 },
  { x: 10, y: 90 },
];

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://microjob-backend-6mxg.onrender.com"
).replace(/\/+$/, "");

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function DocumentScanner() {
  const [images, setImages] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [processedImageSrc, setProcessedImageSrc] = useState<string>("");
  const [uncroppedSrc, setUncroppedSrc] = useState<string>("");

  const [autoCrop, setAutoCrop] = useState<boolean>(false);
  const [isManualCropping, setIsManualCropping] = useState<boolean>(false);
  const [corners, setCorners] = useState<Point[]>(DEFAULT_CORNERS);
  const [draggingCorner, setDraggingCorner] = useState<number | null>(null);

  const [mode, setMode] = useState<string>("normal");

  const [blackness, setBlackness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);

  const debouncedBlackness = useDebounce(blackness, 100);
  const debouncedContrast = useDebounce(contrast, 100);
  const debouncedBrightness = useDebounce(brightness, 100);

  const [zoom, setZoom] = useState<number>(100);
  const [showOriginal] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  const [isCvLoaded, setCvLoaded] = useState<boolean>(false);
  const [cropReady, setCropReady] = useState<boolean>(false);
  const [isPythonLoading, setIsPythonLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingIdRef = useRef<number>(0);

  const createdBlobUrlsRef = useRef<Set<string>>(new Set());

  const createTrackedObjectURL = useCallback((blob: Blob | File): string => {
    const url = URL.createObjectURL(blob);
    createdBlobUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeTrackedObjectURL = useCallback((url: string) => {
    if (url && url.startsWith("blob:") && createdBlobUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      createdBlobUrlsRef.current.delete(url);
    }
  }, []);

  useEffect(() => {
    return () => {
      createdBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      createdBlobUrlsRef.current.clear();
    };
  }, []);

  const resetCorners = useCallback(
    () => setCorners(DEFAULT_CORNERS.map((p) => ({ ...p }))),
    [],
  );

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to load image"));
      img.src = src;
    });
  }, []);

  const createRotatedCanvas = useCallback(
    (
      img: HTMLImageElement,
      angle: number,
      maxSize?: number,
    ): HTMLCanvasElement => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      if (!width || !height) throw new Error("Invalid image dimensions");

      let scale = 1;
      if (maxSize) scale = Math.min(1, maxSize / Math.max(width, height));

      const scaledWidth = Math.max(1, Math.round(width * scale));
      const scaledHeight = Math.max(1, Math.round(height * scale));
      const normalizedAngle = ((angle % 360) + 360) % 360;
      const swap = normalizedAngle === 90 || normalizedAngle === 270;

      const canvas = document.createElement("canvas");
      canvas.width = swap ? scaledHeight : scaledWidth;
      canvas.height = swap ? scaledWidth : scaledHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((normalizedAngle * Math.PI) / 180);
      ctx.drawImage(
        img,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight,
      );
      ctx.restore();
      return canvas;
    },
    [],
  );

  useEffect(() => {
    let active = true;
    if (images.length > 0 && selectedIndex >= 0 && images[selectedIndex]) {
      loadImage(images[selectedIndex]).then((img) => {
        if (!active) return;
        try {
          const rotCanvas = createRotatedCanvas(img, rotation);
          const dataUrl = rotCanvas.toDataURL("image/png");
          setUncroppedSrc(dataUrl);
        } catch (e) {
          console.error("Failed to set uncropped src:", e);
        }
      });
    } else {
      setUncroppedSrc("");
    }
    return () => {
      active = false;
    };
  }, [images, selectedIndex, rotation, loadImage, createRotatedCanvas]);

  const orderPoints = useCallback((points: Point[]): Point[] => {
    if (points.length !== 4) return points;
    let topLeft = points[0],
      topRight = points[0],
      bottomRight = points[0],
      bottomLeft = points[0];
    let minSum = Infinity,
      maxSum = -Infinity,
      minDiff = Infinity,
      maxDiff = -Infinity;

    for (const point of points) {
      const sum = point.x + point.y;
      const diff = point.x - point.y;
      if (sum < minSum) {
        minSum = sum;
        topLeft = point;
      }
      if (sum > maxSum) {
        maxSum = sum;
        bottomRight = point;
      }
      if (diff > maxDiff) {
        maxDiff = diff;
        topRight = point;
      }
      if (diff < minDiff) {
        minDiff = diff;
        bottomLeft = point;
      }
    }
    return [topLeft, topRight, bottomRight, bottomLeft];
  }, []);

  const uiPointsToImage = useCallback(
    (uiPoints: Point[], imageWidth: number, imageHeight: number): Point[] => {
      if (!containerRef.current) return uiPoints;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      if (!containerWidth || !containerHeight || !imageWidth || !imageHeight) {
        return uiPoints;
      }

      const containerAspect = containerWidth / containerHeight;
      const imageAspect = imageWidth / imageHeight;

      let renderWidth = containerWidth;
      let renderHeight = containerHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (imageAspect > containerAspect) {
        renderHeight = containerWidth / imageAspect;
        offsetY = (containerHeight - renderHeight) / 2;
      } else {
        renderWidth = containerHeight * imageAspect;
        offsetX = (containerWidth - renderWidth) / 2;
      }

      return uiPoints.map((point) => {
        const px = (point.x / 100) * containerWidth;
        const py = (point.y / 100) * containerHeight;

        const imgPx = px - offsetX;
        const imgPy = py - offsetY;

        const normX = Math.max(0, Math.min(1, imgPx / renderWidth));
        const normY = Math.max(0, Math.min(1, imgPy / renderHeight));

        return {
          x: normX * imageWidth,
          y: normY * imageHeight,
        };
      });
    },
    [],
  );

  useEffect(() => {
    let mounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const waitForOpenCV = () => {
      intervalId = setInterval(() => {
        if (window.cv && window.cv.Mat && mounted) {
          if (intervalId) clearInterval(intervalId);
          setCvLoaded(true);
        }
      }, 100);
    };

    if (window.cv && window.cv.Mat) {
      setCvLoaded(true);
      return () => {
        mounted = false;
      };
    }

    const existingScript = document.getElementById(
      "opencv-js",
    ) as HTMLScriptElement | null;
    if (existingScript) {
      waitForOpenCV();
      return () => {
        mounted = false;
        if (intervalId) clearInterval(intervalId);
      };
    }

    const script = document.createElement("script");
    script.id = "opencv-js";
    script.src = "https://docs.opencv.org/4.8.0/opencv.js";
    script.async = true;
    script.onload = () => waitForOpenCV();
    script.onerror = () =>
      setErrorMessage("OpenCV স্ক্রিপ্ট লোড করতে সমস্যা হয়েছে।");
    document.body.appendChild(script);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const newImages = filesArray.map((file) => createTrackedObjectURL(file));
      setImages((prev) => {
        const updated = [...prev, ...newImages];
        if (prev.length === 0) setSelectedIndex(0);
        return updated;
      });
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    const removedUrl = images[index];
    if (removedUrl) revokeTrackedObjectURL(removedUrl);
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    if (selectedIndex >= updated.length)
      setSelectedIndex(Math.max(0, updated.length - 1));
    if (updated.length === 0) {
      setProcessedImageSrc("");
      setUncroppedSrc("");
      resetCorners();
      setCropReady(false);
      setAutoCrop(false);
      setIsComparing(false);
      setIsManualCropping(false);
    }
  };

  const applyPerspectiveWarp = useCallback(
    (
      sourceCanvas: HTMLCanvasElement,
      uiCorners: Point[],
    ): HTMLCanvasElement | null => {
      if (!isCvLoaded || !window.cv || uiCorners.length !== 4) return null;
      const cv = window.cv;
      let src: any = null,
        srcTri: any = null,
        dstTri: any = null,
        matrix: any = null,
        warped: any = null;

      try {
        src = cv.imread(sourceCanvas);
        const targetCorners = uiPointsToImage(
          uiCorners,
          sourceCanvas.width,
          sourceCanvas.height,
        );
        const ordered = orderPoints(targetCorners);

        const distance = (a: Point, b: Point) =>
          Math.hypot(b.x - a.x, b.y - a.y);
        const widthTop = distance(ordered[0], ordered[1]);
        const widthBottom = distance(ordered[3], ordered[2]);
        const heightLeft = distance(ordered[0], ordered[3]);
        const heightRight = distance(ordered[1], ordered[2]);

        let outputWidth = Math.max(
          100,
          Math.round(Math.max(widthTop, widthBottom)),
        );
        let outputHeight = Math.max(
          100,
          Math.round(Math.max(heightLeft, heightRight)),
        );
        const maxOutputSize = 2500;
        const outputScale = Math.min(
          1,
          maxOutputSize / Math.max(outputWidth, outputHeight),
        );
        outputWidth = Math.max(100, Math.round(outputWidth * outputScale));
        outputHeight = Math.max(100, Math.round(outputHeight * outputScale));

        srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
          ordered[0].x,
          ordered[0].y,
          ordered[1].x,
          ordered[1].y,
          ordered[2].x,
          ordered[2].y,
          ordered[3].x,
          ordered[3].y,
        ]);
        dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0,
          0,
          outputWidth,
          0,
          outputWidth,
          outputHeight,
          0,
          outputHeight,
        ]);
        matrix = cv.getPerspectiveTransform(srcTri, dstTri);
        warped = new cv.Mat();

        cv.warpPerspective(
          src,
          warped,
          matrix,
          new cv.Size(outputWidth, outputHeight),
          cv.INTER_CUBIC,
          cv.BORDER_REPLICATE,
        );

        const resultCanvas = document.createElement("canvas");
        resultCanvas.width = outputWidth;
        resultCanvas.height = outputHeight;
        cv.imshow(resultCanvas, warped);
        return resultCanvas;
      } catch (error) {
        console.error("Perspective warp failed:", error);
        return null;
      } finally {
        if (src) src.delete();
        if (srcTri) srcTri.delete();
        if (dstTri) dstTri.delete();
        if (matrix) matrix.delete();
        if (warped) warped.delete();
      }
    },
    [isCvLoaded, uiPointsToImage, orderPoints],
  );

  const processWithPythonAutoCrop = useCallback(
    async (canvas: HTMLCanvasElement): Promise<HTMLCanvasElement | null> => {
      try {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/png"),
        );
        if (!blob) return null;

        const formData = new FormData();
        formData.append("file", blob, "crop.png");

        const response = await fetch(`${API_BASE_URL}/api/auto-crop`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) return null;

        const responseBlob = await response.blob();
        const url = createTrackedObjectURL(responseBlob);
        const img = await loadImage(url);

        const newCanvas = document.createElement("canvas");
        newCanvas.width = img.width;
        newCanvas.height = img.height;
        const ctx = newCanvas.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0);
        revokeTrackedObjectURL(url);
        return newCanvas;
      } catch (error) {
        console.error("Python Auto Crop Error:", error);
        return null;
      }
    },
    [loadImage, createTrackedObjectURL, revokeTrackedObjectURL],
  );

  const processWithPythonBackend = useCallback(
    async (
      canvas: HTMLCanvasElement,
      endpoint: string = "/api/clean-document",
    ): Promise<string | null> => {
      try {
        setErrorMessage(null);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/png"),
        );

        if (!blob) throw new Error("Canvas blob conversion failed");

        const formData = new FormData();
        formData.append("file", blob, "document.png");

        const cleanEndpoint = endpoint.startsWith("/")
          ? endpoint
          : `/${endpoint}`;
        const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Python API error: ${response.statusText}`);
        }

        const responseBlob = await response.blob();
        return createTrackedObjectURL(responseBlob);
      } catch (error) {
        console.error("Python Backend Integration Error:", error);
        setErrorMessage(
          "পাইথন সার্ভারের সাথে কানেক্ট করা যায়নি। সার্ভারটি সঠিকভাবে চালু আছে কিনা তা নিশ্চিত করুন।",
        );
        return null;
      }
    },
    [createTrackedObjectURL],
  );

  const applyFilters = useCallback(async () => {
    if (images.length === 0 || selectedIndex < 0 || !images[selectedIndex]) {
      setProcessedImageSrc("");
      return;
    }

    // ম্যানুয়াল ক্রপের পয়েন্ট ড্র্যাগ করা অবস্থায় ব্যাকএন্ড API কল স্থগিত রাখা হবে
    if (draggingCorner !== null) return;

    const currentProcessingId = ++processingIdRef.current;
    try {
      const img = await loadImage(images[selectedIndex]);
      if (currentProcessingId !== processingIdRef.current) return;
      let workingCanvas = createRotatedCanvas(img, rotation);

      if (autoCrop && !isManualCropping) {
        setIsPythonLoading(true);
        const croppedCanvas = await processWithPythonAutoCrop(workingCanvas);
        setIsPythonLoading(false);
        if (currentProcessingId !== processingIdRef.current) return;
        if (croppedCanvas) workingCanvas = croppedCanvas;
      } else if (cropReady && corners.length === 4) {
        const warpedCanvas = applyPerspectiveWarp(workingCanvas, corners);
        if (warpedCanvas) workingCanvas = warpedCanvas;
      }

      if (currentProcessingId !== processingIdRef.current) return;

      if (mode === "python-clean") {
        setIsPythonLoading(true);
        const cleanedUrl = await processWithPythonBackend(
          workingCanvas,
          "/api/clean-document",
        );
        setIsPythonLoading(false);
        if (currentProcessingId !== processingIdRef.current) return;
        if (cleanedUrl) {
          setProcessedImageSrc(cleanedUrl);
          return;
        }
      }

      if (mode === "python-color") {
        setIsPythonLoading(true);
        const colorUrl = await processWithPythonBackend(
          workingCanvas,
          "/api/color-document",
        );
        setIsPythonLoading(false);
        if (currentProcessingId !== processingIdRef.current) return;
        if (colorUrl) {
          setProcessedImageSrc(colorUrl);
          return;
        }
      }

      const canvas = processedCanvasRef.current;
      if (!canvas) return;
      canvas.width = workingCanvas.width;
      canvas.height = workingCanvas.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(workingCanvas, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      if (mode === "magic-color") {
        const cFactor =
          (259 * (debouncedContrast + 255)) / (255 * (259 - debouncedContrast));
        const bOffset = debouncedBrightness * 1.25;
        const blackFactor = debouncedBlackness * 1.8;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          r += bOffset;
          g += bOffset;
          b += bOffset;

          r = cFactor * (r - 128) + 128;
          g = cFactor * (g - 128) + 128;
          b = cFactor * (b - 128) + 128;

          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          const shadowWeight = Math.pow(Math.max(0, 1 - luminance / 255), 1.5);

          r -= shadowWeight * blackFactor;
          g -= shadowWeight * blackFactor;
          b -= shadowWeight * blackFactor;

          data[i] = Math.min(255, Math.max(0, Math.round(r)));
          data[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
          data[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      if (currentProcessingId !== processingIdRef.current) return;
      setProcessedImageSrc(canvas.toDataURL("image/png", 1));
    } catch (error) {
      console.error("Image processing failed:", error);
    } finally {
      setIsPythonLoading(false);
    }
  }, [
    images,
    selectedIndex,
    mode,
    debouncedBlackness,
    debouncedContrast,
    debouncedBrightness,
    rotation,
    autoCrop,
    cropReady,
    corners,
    isManualCropping,
    draggingCorner,
    loadImage,
    createRotatedCanvas,
    applyPerspectiveWarp,
    processWithPythonAutoCrop,
    processWithPythonBackend,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleMouseDown = (index: number) => setDraggingCorner(index);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingCorner === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
    );
    const y = Math.max(
      0,
      Math.min(100, ((e.clientY - rect.top) / rect.height) * 100),
    );
    setCorners((prev) => {
      const updated = [...prev];
      updated[draggingCorner] = { x, y };
      return updated;
    });
    setCropReady(true);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (draggingCorner === null || !containerRef.current || !e.touches[0])
      return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(
      0,
      Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100),
    );
    const y = Math.max(
      0,
      Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100),
    );
    setCorners((prev) => {
      const updated = [...prev];
      updated[draggingCorner] = { x, y };
      return updated;
    });
    setCropReady(true);
  };
  const handlePointerRelease = () => {
    if (draggingCorner !== null) {
      setDraggingCorner(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (!processedImageSrc) return;
    try {
      const img = await loadImage(processedImageSrc);
      const pdf = new jsPDF({
        orientation: img.width > img.height ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgRatio = img.width / img.height;
      const pageRatio = pageWidth / pageHeight;

      let renderWidth = pageWidth;
      let renderHeight = pageHeight;
      let xOffset = 0;
      let yOffset = 0;

      if (imgRatio > pageRatio) {
        renderHeight = pageWidth / imgRatio;
        yOffset = (pageHeight - renderHeight) / 2;
      } else {
        renderWidth = pageHeight * imgRatio;
        xOffset = (pageWidth - renderWidth) / 2;
      }

      pdf.addImage(
        processedImageSrc,
        "PNG",
        xOffset,
        yOffset,
        renderWidth,
        renderHeight,
      );
      pdf.save("scanned-document.pdf");
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    }
  };

  const handlePrint = () => {
    if (!processedImageSrc) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Print Document</title></head>
        <body style="margin:0; display:flex; justify-content:center; align-items:center;">
          <img src="${processedImageSrc}" style="max-width:100%; max-height:100vh;" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleReset = () => {
    setBlackness(0);
    setContrast(0);
    setBrightness(0);
    setMode("normal");
    setRotation(0);
    setAutoCrop(false);
    setIsManualCropping(false);
    setCropReady(false);
    setZoom(100);
    setIsComparing(false);
    setErrorMessage(null);
    resetCorners();
  };

  const handleTriggerAutoCrop = () => {
    setIsManualCropping(false);
    setCropReady(false);
    setAutoCrop(true);
  };

  const handleTriggerManualCrop = () => {
    setAutoCrop(false);
    setIsManualCropping((prev) => !prev);
    setCropReady(true);
  };

  const handleApplyMagic = () => {
    setMode("python-clean");
  };

  const handleApplyColorMagic = () => {
    setMode("python-color");
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 font-sans p-4 lg:p-6 select-none flex flex-col justify-between">
      <canvas ref={processedCanvasRef} className="hidden" />

      <div>
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between text-xs font-medium shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-red-100 rounded-lg cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/sohoj-tools"
              className="p-2 text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              title="Back to Tools"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold shadow-xs">
              <Printer size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Document Print
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                All kind of documents print ready.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-xs mr-2">
              <button
                onClick={handleReset}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                title="Reset"
              >
                <Undo size={16} />
              </button>
              <button
                className="p-1.5 text-slate-300 rounded-md cursor-not-allowed"
                title="Redo"
              >
                <Redo size={16} />
              </button>
              <button
                onClick={handleReset}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                title="Reload"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setIsComparing(!isComparing)}
                disabled={images.length === 0}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  isComparing
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title="Compare Original & Cleaned"
              >
                <Columns size={16} />
              </button>
            </div>

            <button
              onClick={handlePrint}
              disabled={images.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={15} />
              Print
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={images.length === 0 || isPythonLoading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown size={15} />
              PDF download
            </button>

            <button
              onClick={() => {
                if (!processedImageSrc) return;
                const link = document.createElement("a");
                link.href = processedImageSrc;
                link.download = "scanned-image.png";
                link.click();
              }}
              disabled={images.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={15} />
              Download
            </button>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between min-h-[720px] shadow-xs">
            <div className="flex gap-4 h-full flex-1">
              {/* Thumbnails */}
              <div className="flex flex-col gap-3 shrink-0">
                <label className="w-16 h-20 border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center cursor-pointer transition-colors">
                  <Plus size={24} className="text-slate-600" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                  />
                </label>

                {images.map((imgSrc, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedIndex(idx)}
                    className={`w-16 h-20 rounded-xl border-2 overflow-hidden relative cursor-pointer shadow-xs transition-all ${
                      selectedIndex === idx
                        ? "border-emerald-600 ring-2 ring-emerald-500/20 scale-102"
                        : "border-slate-200 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imgSrc}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 shadow cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="flex-1 bg-slate-200/60 border border-slate-200 rounded-xl flex items-center justify-center p-4 relative overflow-hidden min-h-[640px]">
                {images.length === 0 ? (
                  <label className="flex flex-col items-center justify-center gap-3 cursor-pointer text-slate-500 hover:text-slate-700 transition-colors">
                    <Upload size={32} className="text-emerald-600" />
                    <span className="text-xs font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs cursor-pointer">
                      Upload Document
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                    />
                  </label>
                ) : (
                  <div
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handlePointerRelease}
                    onMouseLeave={handlePointerRelease}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handlePointerRelease}
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transition: "transform 0.1s ease",
                    }}
                    className="bg-white w-full h-full max-h-[620px] aspect-[1/1.414] shadow-md border border-slate-300 rounded relative flex items-center justify-center overflow-hidden"
                  >
                    {isPythonLoading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center gap-2">
                        <Loader2
                          size={32}
                          className="text-emerald-600 animate-spin"
                        />
                        <span className="text-xs font-bold text-slate-900">
                          Processing Image...
                        </span>
                      </div>
                    )}

                    {isComparing && processedImageSrc ? (
                      <div className="w-full h-full relative flex items-center justify-center cursor-ew-resize">
                        <ReactCompareImage
                          leftImage={processedImageSrc || images[selectedIndex]}
                          rightImage={images[selectedIndex]}
                          leftImageLabel="Cleaned"
                          rightImageLabel="Original"
                          sliderLineWidth={3}
                          sliderLineColor="#059669"
                          handleSize={34}
                        />
                      </div>
                    ) : (
                      <img
                        src={
                          showOriginal
                            ? images[selectedIndex]
                            : isManualCropping
                              ? uncroppedSrc || images[selectedIndex]
                              : processedImageSrc || images[selectedIndex]
                        }
                        alt="Preview"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    )}

                    {isManualCropping && !isComparing && (
                      <div className="absolute inset-0 bg-black/30 pointer-events-auto z-20">
                        <svg
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                          className="w-full h-full pointer-events-none absolute inset-0"
                        >
                          <polygon
                            points={corners
                              .map((point) => `${point.x},${point.y}`)
                              .join(" ")}
                            className="fill-emerald-500/20 stroke-emerald-500 stroke-2"
                            strokeDasharray="4"
                          />
                        </svg>
                        {corners.map((corner, index) => (
                          <div
                            key={index}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMouseDown(index);
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDraggingCorner(index);
                            }}
                            style={{
                              left: `${corner.x}%`,
                              top: `${corner.y}%`,
                              touchAction: "none",
                            }}
                            className="w-6 h-6 bg-emerald-600 border-2 border-white rounded-full absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing shadow-lg flex items-center justify-center z-30"
                          >
                            <span className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls Bar for Zoom */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom((z) => Math.max(50, z - 10))}
                  className="w-7 h-7 bg-white rounded-md border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.min(200, z + 10))}
                  className="w-7 h-7 bg-white rounded-md border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="px-2.5 py-1 bg-white rounded-md border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  Reset view
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                {(zoom / 100).toFixed(1)}x - scroll to zoom, drag to pan
              </span>
            </div>
          </div>

          {/* Right Sidebar Controls */}
          <div className="w-full lg:w-[320px] shrink-0 space-y-4">
            {/* CROP CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="w-1.5 h-3 bg-emerald-600 rounded-xs" />
                Crop
              </div>
              <div className="space-y-2">
                <button
                  onClick={handleTriggerAutoCrop}
                  disabled={isPythonLoading || images.length === 0}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed ${
                    autoCrop && !isManualCropping
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  <Crop size={14} />
                  Auto crop
                </button>
                <button
                  onClick={handleTriggerManualCrop}
                  disabled={images.length === 0}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${
                    isManualCropping
                      ? "bg-slate-800 text-white"
                      : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Crop size={14} />
                  Manual crop
                </button>
              </div>
            </div>

            {/* MAGIC CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="w-1.5 h-3 bg-emerald-600 rounded-xs" />
                Magic
              </div>
              <button
                onClick={handleApplyColorMagic}
                disabled={isPythonLoading || images.length === 0}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === "python-color"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Palette size={14} />
                Color Document
              </button>
              <button
                onClick={handleApplyMagic}
                disabled={isPythonLoading || images.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={14} />
                Document Clean
              </button>
            </div>

            {/* MODE CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="w-1.5 h-3 bg-emerald-600 rounded-xs" />
                Mode
              </div>
              <div className="space-y-1.5">
                {[
                  { id: "normal", label: "Normal (original)" },
                  { id: "magic-color", label: "Color" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`w-full text-center py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                      mode === m.id
                        ? "bg-slate-800 text-white shadow-xs"
                        : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ADJUSTMENTS CARD */}
            <div
              className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 transition-all ${
                mode !== "magic-color" ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-xs" />
                  Adjustments
                </div>
                {mode !== "magic-color" && (
                  <span className="text-[10px] text-slate-500 font-normal">
                    (MODE-এ Color সিলেক্ট করুন)
                  </span>
                )}
              </div>
              <div className="space-y-3 text-xs">
                {/* Black */}
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Black</span>
                    <span>{blackness}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={blackness}
                    disabled={mode !== "magic-color"}
                    onChange={(e) => setBlackness(Number(e.target.value))}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Color/Brightness */}
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Color</span>
                    <span>{brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={brightness}
                    disabled={mode !== "magic-color"}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Contrast</span>
                    <span>{contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={contrast}
                    disabled={mode !== "magic-color"}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2 text-xs text-slate-600 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-600" />
        <span>
          Document Clean দিয়ে Document আরও সুন্দর ও Clean করুন A4 Print Ready
        </span>
      </div>
    </div>
  );
}
