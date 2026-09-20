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
  RotateCw,
  RotateCcw,
  ImagePlus,
  Plus,
  Minus,
  Sparkles,
  X,
  Loader2,
  Columns,
  AlertCircle,
  Palette,
  Eye,
  Edit,
  Save,
  ChevronLeft,
  ChevronRight,
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

interface SavedDocument {
  id: string;
  name: string;
  src: string;
  publicId: string;
  createdAt: string;
  updatedAt?: string;
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

const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;

export default function DocumentScanner() {
  const [images, setImages] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [processedImageSrc, setProcessedImageSrc] = useState<string>("");
  const [cleanBaseSrc, setCleanBaseSrc] = useState<string>("");
  const [uncroppedSrc, setUncroppedSrc] = useState<string>("");
  const [croppedOriginalSrc, setCroppedOriginalSrc] = useState<string>("");
  const [rotatedOriginalSrc, setRotatedOriginalSrc] = useState<string>("");

  const [autoCrop, setAutoCrop] = useState<boolean>(false);
  const [isManualCropping, setIsManualCropping] = useState<boolean>(false);
  const [corners, setCorners] = useState<Point[]>(DEFAULT_CORNERS);
  const [draggingCorner, setDraggingCorner] = useState<number | null>(null);

  const [mode, setMode] = useState<string>("normal");

  const [blackness, setBlackness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [bakedRotation, setBakedRotation] = useState<number>(0);
  const [manualCropSourceSrc, setManualCropSourceSrc] = useState<string>("");
  const [manualCropSourceBakedRotation, setManualCropSourceBakedRotation] =
    useState<number>(0);

  const debouncedBlackness = useDebounce(blackness, 30);
  const debouncedContrast = useDebounce(contrast, 30);
  const debouncedBrightness = useDebounce(brightness, 30);
  const debouncedCorners = useDebounce(corners, 40);

  const [zoom, setZoom] = useState<number>(100);
  const [isHoldingOriginal, setIsHoldingOriginal] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [isLoadingSavedDocuments, setIsLoadingSavedDocuments] =
    useState<boolean>(true);
  const savedDocumentCounterRef = useRef<number>(0);

  const [isSavingDocument, setIsSavingDocument] = useState<boolean>(false);
  const [deletingSavedDocumentId, setDeletingSavedDocumentId] = useState<
    string | null
  >(null);
  const [previewSavedDocument, setPreviewSavedDocument] =
    useState<SavedDocument | null>(null);
  const [editingSavedDocumentId, setEditingSavedDocumentId] = useState<
    string | null
  >(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [pendingNavigationIndex, setPendingNavigationIndex] = useState<
    number | null
  >(null);

  const [isCvLoaded, setCvLoaded] = useState<boolean>(false);
  const [cropReady, setCropReady] = useState<boolean>(false);
  const [isPythonLoading, setIsPythonLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const processingIdRef = useRef<number>(0);
  const activeServerRequestRef = useRef<AbortController | null>(null);
  const cloudinarySaveRequestRef = useRef<AbortController | null>(null);
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

  const cancelActiveServerRequest = useCallback(() => {
    const controller = activeServerRequestRef.current;
    if (controller) {
      controller.abort();
      activeServerRequestRef.current = null;
    }
  }, []);

  const cancelCloudinarySaveRequest = useCallback(() => {
    const controller = cloudinarySaveRequestRef.current;
    if (controller) {
      controller.abort();
      cloudinarySaveRequestRef.current = null;
    }
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
      const normalizedAngle = normalizeAngle(angle);
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

  const selectedImageSrc = images[selectedIndex] || "";

  const loadSavedDocuments = useCallback(async () => {
    setIsLoadingSavedDocuments(true);

    try {
      const response = await fetch("/api/scanned-documents", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to fetch saved documents.");
      }

      const documents = Array.isArray(result.data) ? result.data : [];

      const normalized: SavedDocument[] = documents.map((item: any) => ({
        id: String(item.id || item._id),
        name: item.title || "Scanned Document",
        src: item.imageUrl,
        publicId: item.publicId || "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      const highestNumber = normalized.reduce((max, item) => {
        const match = item.name.match(/(\d+)$/);
        const number = match ? Number(match[1]) : 0;
        return Number.isFinite(number) ? Math.max(max, number) : max;
      }, 0);

      savedDocumentCounterRef.current = highestNumber;
      setSavedDocuments(normalized);
    } catch (error) {
      console.error("Failed to load saved documents:", error);
      setErrorMessage("Saved documents লোড করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsLoadingSavedDocuments(false);
    }
  }, []);

  useEffect(() => {
    void loadSavedDocuments();
  }, [loadSavedDocuments]);

  useEffect(() => {
    if (!previewSavedDocument) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewSavedDocument(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [previewSavedDocument]);

  useEffect(() => {
    return () => {
      activeServerRequestRef.current?.abort();
      activeServerRequestRef.current = null;
      cloudinarySaveRequestRef.current?.abort();
      cloudinarySaveRequestRef.current = null;
      createdBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      createdBlobUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    let active = true;
    processingIdRef.current += 1;
    cancelActiveServerRequest();
    cancelCloudinarySaveRequest();

    setIsPythonLoading(false);
    setErrorMessage(null);
    setRotation(0);
    setBakedRotation(0);
    setMode("normal");
    setBlackness(0);
    setContrast(0);
    setBrightness(0);
    setZoom(100);
    setIsComparing(false);
    setIsHoldingOriginal(false);
    setHasUnsavedChanges(false);
    setPendingNavigationIndex(null);
    setAutoCrop(false);
    setIsManualCropping(false);
    setCropReady(false);
    setManualCropSourceSrc("");
    setManualCropSourceBakedRotation(0);
    resetCorners();

    if (!selectedImageSrc) {
      setUncroppedSrc("");
      setCroppedOriginalSrc("");
      setCleanBaseSrc("");
      setRotatedOriginalSrc("");
      setProcessedImageSrc("");
      return () => {
        active = false;
      };
    }

    loadImage(selectedImageSrc)
      .then((img) => {
        if (!active) return;
        const canvas = createRotatedCanvas(img, 0);
        const src = canvas.toDataURL("image/png");
        setUncroppedSrc(src);
        setCroppedOriginalSrc(src);
        setCleanBaseSrc(src);
        setRotatedOriginalSrc(src);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to initialize selected image:", error);
        setErrorMessage("ছবিটি লোড করা যায়নি। আবার চেষ্টা করুন।");
      });

    return () => {
      active = false;
    };
  }, [
    selectedIndex,
    selectedImageSrc,
    loadImage,
    createRotatedCanvas,
    cancelActiveServerRequest,
    cancelCloudinarySaveRequest,
    resetCorners,
  ]);

  useEffect(() => {
    let active = true;

    if (!selectedImageSrc || isManualCropping) {
      return () => {
        active = false;
      };
    }

    loadImage(selectedImageSrc)
      .then((img) => {
        if (!active) return;
        const rotatedCanvas = createRotatedCanvas(img, rotation);
        setUncroppedSrc(rotatedCanvas.toDataURL("image/png"));
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to update rotated preview:", error);
      });

    return () => {
      active = false;
    };
  }, [
    selectedImageSrc,
    rotation,
    isManualCropping,
    loadImage,
    createRotatedCanvas,
  ]);

  const orderPoints = useCallback((points: Point[]): Point[] => {
    if (points.length !== 4) return points;

    let topLeft = points[0];
    let topRight = points[0];
    let bottomRight = points[0];
    let bottomLeft = points[0];
    let minSum = Infinity;
    let maxSum = -Infinity;
    let minDiff = Infinity;
    let maxDiff = -Infinity;

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
      setEditingSavedDocumentId(null);
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

  const handleReplaceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newUrl = createTrackedObjectURL(file);
      const oldUrl = images[selectedIndex];

      setImages((prev) => {
        const updated = [...prev];
        updated[selectedIndex] = newUrl;
        return updated;
      });

      if (oldUrl) revokeTrackedObjectURL(oldUrl);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    cancelActiveServerRequest();
    cancelCloudinarySaveRequest();
    processingIdRef.current += 1;

    const removedUrl = images[index];
    if (removedUrl) revokeTrackedObjectURL(removedUrl);

    const updated = images.filter((_, i) => i !== index);
    setImages(updated);

    if (selectedIndex >= updated.length) {
      setSelectedIndex(Math.max(0, updated.length - 1));
    }

    if (updated.length === 0) {
      setProcessedImageSrc("");
      setCleanBaseSrc("");
      setUncroppedSrc("");
      setCroppedOriginalSrc("");
      setRotatedOriginalSrc("");
      setManualCropSourceSrc("");
      setManualCropSourceBakedRotation(0);
      setBakedRotation(0);
      setRotation(0);
      setMode("normal");
      setBlackness(0);
      setContrast(0);
      setBrightness(0);
      setZoom(100);
      resetCorners();
      setCropReady(false);
      setAutoCrop(false);
      setIsComparing(false);
      setIsManualCropping(false);
      setIsHoldingOriginal(false);
      setIsPythonLoading(false);
      setHasUnsavedChanges(false);
    }
  };

  const applyPerspectiveWarp = useCallback(
    (
      sourceCanvas: HTMLCanvasElement,
      uiCorners: Point[],
    ): HTMLCanvasElement | null => {
      if (!isCvLoaded || !window.cv || uiCorners.length !== 4) return null;

      const cv = window.cv;
      let src: any = null;
      let srcTri: any = null;
      let dstTri: any = null;
      let matrix: any = null;
      let warped: any = null;

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

  const processCanvasWithServer = useCallback(
    async (
      canvas: HTMLCanvasElement,
      endpoint: string,
      filename: string,
    ): Promise<string | null> => {
      cancelActiveServerRequest();

      const controller = new AbortController();
      activeServerRequestRef.current = controller;
      const timeoutId = window.setTimeout(() => controller.abort(), 30000);

      try {
        setErrorMessage(null);
        setIsPythonLoading(true);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((value) => resolve(value), "image/png"),
        );

        if (!blob) throw new Error("Canvas blob conversion failed");

        const formData = new FormData();
        formData.append("file", blob, filename);

        const cleanEndpoint = endpoint.startsWith("/")
          ? endpoint
          : `/${endpoint}`;

        const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Python API error: ${response.status} ${response.statusText}`,
          );
        }

        const responseBlob = await response.blob();
        if (!responseBlob.size)
          throw new Error("Server returned an empty image");

        return createTrackedObjectURL(responseBlob);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Python Backend Integration Error:", error);
          setErrorMessage(
            "পাইথন সার্ভারে কাজটি সম্পন্ন করা যায়নি। কয়েক সেকেন্ড পর আবার চেষ্টা করুন।",
          );
        }
        return null;
      } finally {
        window.clearTimeout(timeoutId);

        if (activeServerRequestRef.current === controller) {
          activeServerRequestRef.current = null;
          setIsPythonLoading(false);
        }
      }
    },
    [cancelActiveServerRequest, createTrackedObjectURL],
  );

  const processWithPythonAutoCrop = useCallback(
    (canvas: HTMLCanvasElement) =>
      processCanvasWithServer(canvas, "/api/auto-crop", "crop.png"),
    [processCanvasWithServer],
  );

  const processWithPythonBackend = useCallback(
    (canvas: HTMLCanvasElement, endpoint: string) =>
      processCanvasWithServer(canvas, endpoint, "document.png"),
    [processCanvasWithServer],
  );

  useEffect(() => {
    if (!isManualCropping || !selectedImageSrc) return;

    let active = true;
    const currentProcessingId = ++processingIdRef.current;
    const sourceSrc = manualCropSourceSrc || selectedImageSrc;
    const sourceBakedRotation = manualCropSourceSrc
      ? manualCropSourceBakedRotation
      : 0;

    loadImage(sourceSrc)
      .then((img) => {
        if (!active || currentProcessingId !== processingIdRef.current) return;

        const displayCanvas = createRotatedCanvas(
          img,
          normalizeAngle(rotation - sourceBakedRotation),
        );

        setUncroppedSrc(displayCanvas.toDataURL("image/png"));

        if (!cropReady || debouncedCorners.length !== 4) return;

        const warpedCanvas = applyPerspectiveWarp(
          displayCanvas,
          debouncedCorners,
        );

        if (
          !warpedCanvas ||
          !active ||
          currentProcessingId !== processingIdRef.current
        ) {
          return;
        }

        const cropUrl = warpedCanvas.toDataURL("image/png");
        setCroppedOriginalSrc(cropUrl);
        setCleanBaseSrc(cropUrl);
        setRotatedOriginalSrc(cropUrl);
        setBakedRotation(rotation);
        setAutoCrop(false);
        setHasUnsavedChanges(true);
      })
      .catch((error) => {
        if (active) console.error("Manual crop preview failed:", error);
      });

    return () => {
      active = false;
    };
  }, [
    isManualCropping,
    cropReady,
    debouncedCorners,
    selectedImageSrc,
    manualCropSourceSrc,
    manualCropSourceBakedRotation,
    rotation,
    loadImage,
    createRotatedCanvas,
    applyPerspectiveWarp,
  ]);

  const applyAdjustments = useCallback(async () => {
    if (!cleanBaseSrc) {
      setProcessedImageSrc("");
      setRotatedOriginalSrc("");
      return;
    }

    try {
      const baseImg = await loadImage(cleanBaseSrc);
      const pendingRotation = normalizeAngle(rotation - bakedRotation);
      const rotatedCanvas = createRotatedCanvas(baseImg, pendingRotation);

      const sourceOriginal = croppedOriginalSrc || selectedImageSrc;

      if (sourceOriginal) {
        try {
          const originalImg = await loadImage(sourceOriginal);
          const originalCanvas = createRotatedCanvas(
            originalImg,
            pendingRotation,
          );
          setRotatedOriginalSrc(originalCanvas.toDataURL("image/png"));
        } catch (error) {
          console.error("Failed to update original comparison image:", error);
        }
      }

      const canvas = processedCanvasRef.current;
      if (!canvas) return;

      canvas.width = rotatedCanvas.width;
      canvas.height = rotatedCanvas.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(rotatedCanvas, 0, 0);

      if (
        debouncedBlackness !== 0 ||
        debouncedContrast !== 0 ||
        debouncedBrightness !== 0
      ) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

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

        ctx.putImageData(imageData, 0, 0);
      }

      setProcessedImageSrc(canvas.toDataURL("image/png", 1));
    } catch (error) {
      console.error("Local image processing failed:", error);
    }
  }, [
    cleanBaseSrc,
    croppedOriginalSrc,
    selectedImageSrc,
    rotation,
    bakedRotation,
    debouncedBlackness,
    debouncedContrast,
    debouncedBrightness,
    loadImage,
    createRotatedCanvas,
  ]);

  useEffect(() => {
    void applyAdjustments();
  }, [applyAdjustments]);

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
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
  };

  const handlePointerRelease = () => {
    if (draggingCorner !== null) setDraggingCorner(null);
  };

  const handleRotate = () => {
    if (
      !selectedImageSrc ||
      isPythonLoading ||
      isManualCropping ||
      isSavingDocument
    )
      return;

    cancelActiveServerRequest();
    cancelCloudinarySaveRequest();
    processingIdRef.current += 1;
    setErrorMessage(null);
    setHasUnsavedChanges(true);
    setRotation((prev) => normalizeAngle(prev + 90));
  };

  const continueToPage = useCallback(
    (index: number) => {
      if (
        images.length === 0 ||
        isPythonLoading ||
        isManualCropping ||
        isSavingDocument ||
        index < 0 ||
        index >= images.length ||
        index === selectedIndex
      ) {
        return;
      }

      cancelActiveServerRequest();
      cancelCloudinarySaveRequest();
      processingIdRef.current += 1;
      setDraggingCorner(null);
      setPendingNavigationIndex(null);
      setEditingSavedDocumentId(null);
      setSelectedIndex(index);
    },
    [
      images.length,
      isPythonLoading,
      isManualCropping,
      isSavingDocument,
      selectedIndex,
      cancelActiveServerRequest,
      cancelCloudinarySaveRequest,
    ],
  );

  const requestPageNavigation = useCallback(
    (index: number) => {
      if (
        images.length === 0 ||
        isPythonLoading ||
        isManualCropping ||
        isSavingDocument ||
        index < 0 ||
        index >= images.length ||
        index === selectedIndex
      ) {
        return;
      }

      if (hasUnsavedChanges) {
        setPendingNavigationIndex(index);
        return;
      }

      continueToPage(index);
    },
    [
      images.length,
      isPythonLoading,
      isManualCropping,
      isSavingDocument,
      selectedIndex,
      hasUnsavedChanges,
      continueToPage,
    ],
  );

  const handlePageNavigation = useCallback(
    (direction: -1 | 1) => {
      requestPageNavigation(selectedIndex + direction);
    },
    [selectedIndex, requestPageNavigation],
  );

  const createProcessedSnapshot = useCallback(async (): Promise<string> => {
    if (!cleanBaseSrc) throw new Error("No processed document available");

    const baseImg = await loadImage(cleanBaseSrc);
    const pendingRotation = normalizeAngle(rotation - bakedRotation);
    const rotatedCanvas = createRotatedCanvas(baseImg, pendingRotation);

    const canvas = document.createElement("canvas");
    canvas.width = rotatedCanvas.width;
    canvas.height = rotatedCanvas.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(rotatedCanvas, 0, 0);

    if (blackness !== 0 || contrast !== 0 || brightness !== 0) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const bOffset = brightness * 1.25;
      const blackFactor = blackness * 1.8;

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

      ctx.putImageData(imageData, 0, 0);
    }

    return canvas.toDataURL("image/png", 1);
  }, [
    cleanBaseSrc,
    rotation,
    bakedRotation,
    blackness,
    contrast,
    brightness,
    loadImage,
    createRotatedCanvas,
  ]);

  const handleSaveDocument = async (): Promise<boolean> => {
    if (
      !selectedImageSrc ||
      isPythonLoading ||
      isManualCropping ||
      isSavingDocument
    ) {
      return false;
    }

    cancelCloudinarySaveRequest();

    const controller = new AbortController();
    cloudinarySaveRequestRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 45000);

    setIsSavingDocument(true);
    setErrorMessage(null);

    let uploadedPublicId = "";

    try {
      const snapshotSrc = await createProcessedSnapshot();

      if (!snapshotSrc) {
        throw new Error("Final document image could not be generated.");
      }

      const blobResponse = await fetch(snapshotSrc);

      if (!blobResponse.ok) {
        throw new Error("Could not prepare the document image for upload.");
      }

      const blob = await blobResponse.blob();

      if (!blob.size) {
        throw new Error("Final document image is empty.");
      }

      const formData = new FormData();
      formData.append("file", blob, `scanned-document-${Date.now()}.png`);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
        cache: "no-store",
        credentials: "include",
      });

      let uploadResult: any = null;

      try {
        uploadResult = await uploadResponse.json();
      } catch {
        throw new Error("Cloudinary upload API returned an invalid response.");
      }

      if (!uploadResponse.ok || !uploadResult?.success) {
        throw new Error(uploadResult?.error || "Cloudinary upload failed.");
      }

      const cloudinaryUrl =
        typeof uploadResult?.imageUrl === "string"
          ? uploadResult.imageUrl
          : typeof uploadResult?.url === "string"
            ? uploadResult.url
            : "";

      const cloudinaryPublicId =
        typeof uploadResult?.publicId === "string" ? uploadResult.publicId : "";

      if (!cloudinaryUrl) {
        throw new Error("Cloudinary did not return a secure image URL.");
      }

      if (!cloudinaryPublicId) {
        throw new Error("Cloudinary did not return a public_id.");
      }

      uploadedPublicId = cloudinaryPublicId;

      const currentEditingId = editingSavedDocumentId;
      const currentSavedDocument = currentEditingId
        ? savedDocuments.find((item) => item.id === currentEditingId)
        : null;

      if (currentEditingId && !currentSavedDocument) {
        throw new Error("The saved document being edited could not be found.");
      }

      if (currentEditingId) {
        const databaseResponse = await fetch(
          `/api/scanned-documents?id=${encodeURIComponent(currentEditingId)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: currentSavedDocument?.name || "Scanned Document",
              imageUrl: cloudinaryUrl,
              publicId: cloudinaryPublicId,
              adjustments: {
                blackness,
                contrast,
                brightness,
                rotation: normalizeAngle(rotation),
              },
            }),
            signal: controller.signal,
            cache: "no-store",
            credentials: "include",
          },
        );

        let databaseResult: any = null;

        try {
          databaseResult = await databaseResponse.json();
        } catch {
          throw new Error(
            "Saved document update API returned an invalid response.",
          );
        }

        if (
          !databaseResponse.ok ||
          !databaseResult?.success ||
          !databaseResult?.data
        ) {
          throw new Error(
            databaseResult?.error || "Document record could not be updated.",
          );
        }

        const updated = databaseResult.data;

        const updatedDocument: SavedDocument = {
          id: String(updated.id || updated._id || currentEditingId),
          name:
            updated.title || currentSavedDocument?.name || "Scanned Document",
          src: updated.imageUrl || cloudinaryUrl,
          publicId: updated.publicId || cloudinaryPublicId,
          createdAt:
            updated.createdAt ||
            currentSavedDocument?.createdAt ||
            new Date().toISOString(),
          updatedAt: updated.updatedAt,
        };

        setSavedDocuments((prev) =>
          prev.map((item) =>
            item.id === currentEditingId ? updatedDocument : item,
          ),
        );

        setEditingSavedDocumentId(currentEditingId);
        setHasUnsavedChanges(false);
        setErrorMessage(null);

        return true;
      }

      savedDocumentCounterRef.current += 1;

      const title = `Document ${String(
        savedDocumentCounterRef.current,
      ).padStart(2, "0")}`;

      const databaseResponse = await fetch("/api/scanned-documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          imageUrl: cloudinaryUrl,
          publicId: cloudinaryPublicId,
          adjustments: {
            blackness,
            contrast,
            brightness,
            rotation: normalizeAngle(rotation),
          },
        }),
        signal: controller.signal,
        cache: "no-store",
        credentials: "include",
      });

      let databaseResult: any = null;

      try {
        databaseResult = await databaseResponse.json();
      } catch {
        throw new Error("Saved document API returned an invalid response.");
      }

      if (
        !databaseResponse.ok ||
        !databaseResult?.success ||
        !databaseResult?.data
      ) {
        throw new Error(
          databaseResult?.error || "Document record could not be saved.",
        );
      }

      const saved = databaseResult.data;

      const newDocument: SavedDocument = {
        id: String(saved.id || saved._id),
        name: saved.title || title,
        src: saved.imageUrl || cloudinaryUrl,
        publicId: saved.publicId || cloudinaryPublicId,
        createdAt: saved.createdAt || new Date().toISOString(),
        updatedAt: saved.updatedAt,
      };

      setSavedDocuments((prev) => [newDocument, ...prev]);

      setEditingSavedDocumentId(null);
      setHasUnsavedChanges(false);
      setErrorMessage(null);

      return true;
    } catch (error: any) {
      // If a new Cloudinary image was created but MongoDB save/update failed,
      // remove that new image so an orphan is not left behind.
      if (uploadedPublicId) {
        try {
          await fetch("/api/delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              publicId: uploadedPublicId,
            }),
            cache: "no-store",
            credentials: "include",
          });
        } catch (cleanupError) {
          console.error(
            "Cloudinary rollback from client failed:",
            cleanupError,
          );
        }
      }

      if (error?.name === "AbortError") {
        setErrorMessage(
          "Document save বাতিল করা হয়েছে বা সময় শেষ হয়ে গেছে। আবার চেষ্টা করুন।",
        );
      } else {
        console.error("Failed to save/update document:", error);
        setErrorMessage("Document save করা যায়নি। আবার চেষ্টা করুন।");
      }

      return false;
    } finally {
      window.clearTimeout(timeoutId);

      if (cloudinarySaveRequestRef.current === controller) {
        cloudinarySaveRequestRef.current = null;
      }

      setIsSavingDocument(false);
    }
  };

  const handleConfirmNavigationSave = async () => {
    if (pendingNavigationIndex === null) return;

    const targetIndex = pendingNavigationIndex;
    const saved = await handleSaveDocument();

    if (saved) continueToPage(targetIndex);
  };

  const handleConfirmNavigationWithoutSave = () => {
    if (pendingNavigationIndex === null) return;

    const targetIndex = pendingNavigationIndex;
    setHasUnsavedChanges(false);
    continueToPage(targetIndex);
  };

  const handleDownloadSavedDocument = (savedDocument: SavedDocument) => {
    if (!savedDocument.src) {
      setErrorMessage("Saved document URL পাওয়া যায়নি।");
      return;
    }

    const link = document.createElement("a");
    link.href = savedDocument.src;
    link.download = `${savedDocument.name
      .toLowerCase()
      .replace(/\s+/g, "-")}.png`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDownloadPDFForSource = async (
    imageSrc: string,
    fileName = "scanned-document.pdf",
  ) => {
    if (!imageSrc || isPythonLoading || isSavingDocument) {
      return;
    }

    try {
      const img = await loadImage(imageSrc);

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
        img,
        "PNG",
        xOffset,
        yOffset,
        renderWidth,
        renderHeight,
        undefined,
        "FAST",
      );

      pdf.save(fileName);
    } catch (error) {
      console.error("Failed to generate PDF:", error);

      setErrorMessage("PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।");
    }
  };

  const handleDownloadPDF = async () => {
    await handleDownloadPDFForSource(processedImageSrc, "scanned-document.pdf");
  };

  const handlePrintSource = (imageSrc: string) => {
    if (!imageSrc || isPythonLoading || isSavingDocument) {
      return;
    }

    const printFrame = document.createElement("iframe");

    printFrame.setAttribute("aria-hidden", "true");

    printFrame.style.position = "fixed";
    printFrame.style.left = "-10000px";
    printFrame.style.top = "0";
    printFrame.style.width = "100vw";
    printFrame.style.height = "100vh";
    printFrame.style.border = "0";
    printFrame.style.opacity = "0";
    printFrame.style.pointerEvents = "none";

    const cleanup = () => {
      window.setTimeout(() => {
        if (printFrame.parentNode) {
          printFrame.parentNode.removeChild(printFrame);
        }
      }, 500);
    };

    let printTriggered = false;

    const triggerPrint = () => {
      if (printTriggered) return;
      printTriggered = true;

      const printWindow = printFrame.contentWindow;

      if (!printWindow) {
        cleanup();
        setErrorMessage("Print preview খোলা যায়নি। আবার চেষ্টা করুন।");
        return;
      }

      printWindow.focus();
      printWindow.onafterprint = cleanup;

      window.setTimeout(() => {
        try {
          printWindow.print();
        } catch (error) {
          console.error("Print failed:", error);
          cleanup();
          setErrorMessage("Print করা যায়নি। আবার চেষ্টা করুন।");
        }
      }, 50);
    };

    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentDocument;

    if (!printDocument) {
      cleanup();
      setErrorMessage("Print preview তৈরি করা যায়নি। আবার চেষ্টা করুন।");
      return;
    }

    printDocument.open();
    printDocument.close();

    const style = printDocument.createElement("style");

    style.textContent = `
      @page {
        size: auto;
        margin: 0;
      }
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: #fff;
        overflow: hidden;
      }
      .print-page {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        break-after: avoid;
        page-break-after: avoid;
      }
      .print-page img {
        display: block;
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
      }
    `;

    const page = printDocument.createElement("div");
    page.className = "print-page";

    const image = printDocument.createElement("img");

    image.alt = "Document to print";
    image.src = imageSrc;
    image.onload = triggerPrint;

    image.onerror = () => {
      cleanup();
      setErrorMessage(
        "Print preview-তে document load করা যায়নি। আবার চেষ্টা করুন।",
      );
    };

    page.appendChild(image);
    printDocument.head.appendChild(style);
    printDocument.body.appendChild(page);

    if (image.complete) {
      triggerPrint();
    }
  };

  const handlePrint = () => {
    handlePrintSource(processedImageSrc);
  };

  const handleEditSavedDocument = async (savedDocument: SavedDocument) => {
    if (isPythonLoading || isSavingDocument || deletingSavedDocumentId) {
      return;
    }

    if (hasUnsavedChanges) {
      const proceed = window.confirm(
        "Current document-এ unsaved changes আছে। এগুলো বাদ দিয়ে saved document edit করতে চান?",
      );

      if (!proceed) return;
    }

    cancelActiveServerRequest();
    cancelCloudinarySaveRequest();

    processingIdRef.current += 1;

    // Release only locally-created blob URLs; Cloudinary URLs are untouched.
    images.forEach((src) => {
      revokeTrackedObjectURL(src);
    });

    setPreviewSavedDocument(null);
    setEditingSavedDocumentId(savedDocument.id);
    setImages([savedDocument.src]);
    setSelectedIndex(0);

    setIsPythonLoading(false);
    setErrorMessage(null);
    setRotation(0);
    setBakedRotation(0);
    setMode("normal");
    setBlackness(0);
    setContrast(0);
    setBrightness(0);
    setZoom(100);
    setIsComparing(false);
    setIsHoldingOriginal(false);
    setHasUnsavedChanges(false);
    setPendingNavigationIndex(null);
    setAutoCrop(false);
    setIsManualCropping(false);
    setCropReady(false);
    setManualCropSourceSrc("");
    setManualCropSourceBakedRotation(0);
    resetCorners();

    try {
      const img = await loadImage(savedDocument.src);

      const canvas = createRotatedCanvas(img, 0);

      const source = canvas.toDataURL("image/png");

      setUncroppedSrc(source);
      setCroppedOriginalSrc(source);
      setCleanBaseSrc(source);
      setRotatedOriginalSrc(source);
    } catch (error) {
      console.error("Failed to load saved document for editing:", error);

      setErrorMessage("Saved document edit করার জন্য image load করা যায়নি।");
    }
  };

  const handleOpenSavedPreview = (savedDocument: SavedDocument) => {
    if (!savedDocument.src) {
      setErrorMessage("Saved document URL পাওয়া যায়নি।");
      return;
    }

    setPreviewSavedDocument(savedDocument);
  };

  const handleRemoveSavedDocument = async (savedDocument: SavedDocument) => {
    if (!savedDocument?.id || deletingSavedDocumentId) return;

    const shouldDelete = window.confirm(
      `Are you sure you want to delete ${savedDocument.name}?`,
    );

    if (!shouldDelete) return;

    setDeletingSavedDocumentId(savedDocument.id);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/scanned-documents?id=${encodeURIComponent(savedDocument.id)}`,
        {
          method: "DELETE",
          cache: "no-store",
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Document delete failed.");
      }

      setSavedDocuments((prev) =>
        prev.filter((item) => item.id !== savedDocument.id),
      );

      if (previewSavedDocument?.id === savedDocument.id) {
        setPreviewSavedDocument(null);
      }

      if (editingSavedDocumentId === savedDocument.id) {
        setEditingSavedDocumentId(null);
      }
    } catch (error) {
      console.error("Failed to delete saved document:", error);
      setErrorMessage("Document delete করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setDeletingSavedDocumentId(null);
    }
  };

  const createCurrentWorkingCanvas =
    useCallback(async (): Promise<HTMLCanvasElement | null> => {
      if (!selectedImageSrc) return null;

      const source = croppedOriginalSrc || selectedImageSrc;
      const img = await loadImage(source);

      return createRotatedCanvas(img, normalizeAngle(rotation - bakedRotation));
    }, [
      selectedImageSrc,
      croppedOriginalSrc,
      rotation,
      bakedRotation,
      loadImage,
      createRotatedCanvas,
    ]);

  const handleResetAdjustments = () => {
    setBlackness(0);
    setContrast(0);
    setBrightness(0);
  };

  const handleReset = () => {
    cancelActiveServerRequest();
    cancelCloudinarySaveRequest();
    processingIdRef.current += 1;

    const src = selectedImageSrc;

    setBlackness(0);
    setContrast(0);
    setBrightness(0);
    setMode("normal");
    setRotation(0);
    setBakedRotation(0);
    setAutoCrop(false);
    setIsManualCropping(false);
    setCropReady(false);
    setManualCropSourceSrc("");
    setManualCropSourceBakedRotation(0);
    setZoom(100);
    setIsComparing(false);
    setIsHoldingOriginal(false);
    setHasUnsavedChanges(false);
    setPendingNavigationIndex(null);
    setErrorMessage(null);
    resetCorners();

    if (src) {
      setUncroppedSrc(src);
      setCroppedOriginalSrc(src);
      setCleanBaseSrc(src);
      setRotatedOriginalSrc(src);
    }
  };

  const handleTriggerAutoCrop = async () => {
    if (!selectedImageSrc || isPythonLoading || isSavingDocument) return;

    cancelActiveServerRequest();
    cancelCloudinarySaveRequest();

    const currentProcessingId = ++processingIdRef.current;
    const rotationAtStart = rotation;
    const modeAtStart = mode;

    setIsManualCropping(false);
    setCropReady(false);
    resetCorners();
    setErrorMessage(null);

    try {
      const img = await loadImage(selectedImageSrc);
      if (currentProcessingId !== processingIdRef.current) return;

      const workingCanvas = createRotatedCanvas(img, rotationAtStart);
      const resultUrl = await processWithPythonAutoCrop(workingCanvas);

      if (!resultUrl || currentProcessingId !== processingIdRef.current) return;

      try {
        const resultImg = await loadImage(resultUrl);
        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = resultImg.naturalWidth || resultImg.width;
        croppedCanvas.height = resultImg.naturalHeight || resultImg.height;

        const ctx = croppedCanvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable");

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(resultImg, 0, 0);

        const cropUrl = croppedCanvas.toDataURL("image/png");

        setHasUnsavedChanges(true);
        setCroppedOriginalSrc(cropUrl);
        setCleanBaseSrc(cropUrl);
        setRotatedOriginalSrc(cropUrl);
        setBakedRotation(rotationAtStart);
        setAutoCrop(true);
        setIsManualCropping(false);

        if (modeAtStart === "python-clean" || modeAtStart === "python-color") {
          const endpoint =
            modeAtStart === "python-clean"
              ? "/api/clean-document"
              : "/api/color-document";

          const cleanUrl = await processWithPythonBackend(
            croppedCanvas,
            endpoint,
          );
          if (!cleanUrl || currentProcessingId !== processingIdRef.current)
            return;

          try {
            const cleanImg = await loadImage(cleanUrl);
            const cleanCanvas = document.createElement("canvas");
            cleanCanvas.width = cleanImg.naturalWidth || cleanImg.width;
            cleanCanvas.height = cleanImg.naturalHeight || cleanImg.height;

            const cleanCtx = cleanCanvas.getContext("2d");
            if (!cleanCtx) throw new Error("Canvas context unavailable");

            cleanCtx.drawImage(cleanImg, 0, 0);
            setCleanBaseSrc(cleanCanvas.toDataURL("image/png"));
          } finally {
            revokeTrackedObjectURL(cleanUrl);
          }
        }
      } finally {
        revokeTrackedObjectURL(resultUrl);
      }
    } catch (error) {
      if (currentProcessingId === processingIdRef.current) {
        console.error("Auto crop failed:", error);
        setErrorMessage("Auto crop সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।");
      }
    }
  };

  const handleTriggerManualCrop = () => {
    if (!selectedImageSrc || isPythonLoading || isSavingDocument) return;

    cancelActiveServerRequest();
    cancelCloudinarySaveRequest();
    processingIdRef.current += 1;

    if (isManualCropping) {
      setIsManualCropping(false);
      setManualCropSourceSrc("");
      setHasUnsavedChanges(true);
      return;
    }

    setMode("normal");
    setAutoCrop(false);
    setCropReady(false);
    resetCorners();
    setManualCropSourceSrc(croppedOriginalSrc || selectedImageSrc);
    setManualCropSourceBakedRotation(bakedRotation);
    setIsManualCropping(true);
  };

  const handleApplyServerMode = async (
    requestedMode: "python-clean" | "python-color",
  ) => {
    if (
      !selectedImageSrc ||
      isPythonLoading ||
      isManualCropping ||
      isSavingDocument
    )
      return;

    cancelActiveServerRequest();
    cancelCloudinarySaveRequest();

    const currentProcessingId = ++processingIdRef.current;

    try {
      const workingCanvas = await createCurrentWorkingCanvas();
      if (!workingCanvas || currentProcessingId !== processingIdRef.current)
        return;

      const endpoint =
        requestedMode === "python-clean"
          ? "/api/clean-document"
          : "/api/color-document";
      const resultUrl = await processWithPythonBackend(workingCanvas, endpoint);

      if (!resultUrl || currentProcessingId !== processingIdRef.current) return;

      try {
        const resultImg = await loadImage(resultUrl);
        const resultCanvas = document.createElement("canvas");
        resultCanvas.width = resultImg.naturalWidth || resultImg.width;
        resultCanvas.height = resultImg.naturalHeight || resultImg.height;

        const ctx = resultCanvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable");

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(resultImg, 0, 0);

        const resultSrc = resultCanvas.toDataURL("image/png");
        const workingSrc = workingCanvas.toDataURL("image/png");

        setMode(requestedMode);
        setHasUnsavedChanges(true);
        setCroppedOriginalSrc(workingSrc);
        setCleanBaseSrc(resultSrc);
        setRotatedOriginalSrc(workingSrc);
        setBakedRotation(rotation);
      } finally {
        revokeTrackedObjectURL(resultUrl);
      }
    } catch (error) {
      if (currentProcessingId === processingIdRef.current) {
        console.error("Magic processing failed:", error);
        setErrorMessage(
          "Document processing সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।",
        );
      }
    }
  };

  const handleApplyMagic = () => void handleApplyServerMode("python-clean");
  const handleApplyColorMagic = () =>
    void handleApplyServerMode("python-color");

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 font-sans p-3 sm:p-4 lg:p-6 select-none flex flex-col justify-between">
      <canvas ref={processedCanvasRef} className="hidden" />

      <input
        ref={replaceFileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleReplaceImage}
      />

      <div>
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between text-xs font-medium shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-red-100 rounded-lg cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/sohoj-tools"
              className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              title="Back to Tools"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </Link>

            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold shadow-xs shrink-0">
              <Printer size={18} className="sm:w-5 sm:h-5" />
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Document Print
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                All kind of documents print ready.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 sm:p-1 shadow-xs mr-1 sm:mr-2">
              <button
                onClick={() => handlePageNavigation(-1)}
                disabled={
                  images.length === 0 ||
                  selectedIndex === 0 ||
                  isPythonLoading ||
                  isManualCropping ||
                  isSavingDocument
                }
                className="p-1 sm:p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous document page"
                aria-label="Previous document page"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="min-w-[34px] px-1 text-center text-[10px] sm:text-[11px] font-bold text-slate-500 tabular-nums">
                {images.length > 0
                  ? `${selectedIndex + 1}/${images.length}`
                  : "0/0"}
              </div>

              <button
                onClick={() => handlePageNavigation(1)}
                disabled={
                  images.length === 0 ||
                  selectedIndex >= images.length - 1 ||
                  isPythonLoading ||
                  isManualCropping ||
                  isSavingDocument
                }
                className="p-1 sm:p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next document page"
                aria-label="Next document page"
              >
                <ChevronRight size={18} />
              </button>

              <button
                onClick={() => setIsComparing(!isComparing)}
                disabled={images.length === 0}
                className={`p-1 sm:p-1.5 rounded-md transition-colors cursor-pointer ${isComparing ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"} disabled:opacity-40 disabled:cursor-not-allowed`}
                title="Compare Original & Cleaned"
              >
                <Columns size={15} />
              </button>
            </div>

            <button
              onClick={() => void handleSaveDocument()}
              disabled={
                images.length === 0 ||
                !cleanBaseSrc ||
                isPythonLoading ||
                isManualCropping ||
                isSavingDocument
              }
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save the current final document to Cloudinary and MongoDB"
            >
              {isSavingDocument ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>
                {isSavingDocument
                  ? editingSavedDocumentId
                    ? "Updating..."
                    : "Saving..."
                  : editingSavedDocumentId
                    ? "Save changes"
                    : "Save document"}
              </span>
            </button>

            <button
              onClick={handlePrint}
              disabled={
                images.length === 0 || isPythonLoading || isSavingDocument
              }
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={
                images.length === 0 || isPythonLoading || isSavingDocument
              }
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown size={14} />
              <span>PDF download</span>
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
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              <span>Download</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs min-h-[500px] sm:min-h-[600px] lg:min-h-[720px]">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4 h-full flex-1">
              <div className="flex md:flex-col gap-2.5 shrink-0 overflow-x-auto md:overflow-y-auto max-h-none md:max-h-[600px] pb-2 md:pb-0 scrollbar-thin">
                <label className="w-14 h-18 sm:w-16 sm:h-20 shrink-0 border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center cursor-pointer transition-colors">
                  <Plus size={20} className="text-slate-600 sm:w-6 sm:h-6" />
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
                    key={`${imgSrc}-${idx}`}
                    onClick={() => requestPageNavigation(idx)}
                    className={`w-14 h-18 sm:w-16 sm:h-20 shrink-0 rounded-xl border-2 overflow-hidden relative cursor-pointer shadow-xs transition-all ${selectedIndex === idx ? "border-emerald-600 ring-2 ring-emerald-500/20 scale-102" : "border-slate-200 opacity-80 hover:opacity-100"}`}
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

              <div className="flex-1 bg-slate-200/60 border border-slate-200 rounded-xl flex items-center justify-center p-2 sm:p-4 relative overflow-hidden min-h-[380px] sm:min-h-[480px] lg:min-h-[620px]">
                {images.length > 0 && (
                  <div className="absolute top-3 right-3 z-30 flex items-center gap-1 sm:gap-1.5 bg-white/90 backdrop-blur-xs p-1 sm:p-1.5 rounded-xl shadow-md border border-slate-200">
                    <button
                      onClick={handleReset}
                      disabled={isPythonLoading || isSavingDocument}
                      className="p-1.5 sm:p-2 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-semibold"
                      title="Reset all edits, crops, and adjustments to original state"
                    >
                      <RotateCcw size={15} />
                      <span className="hidden sm:inline">Full Reset</span>
                    </button>

                    <button
                      onClick={() => replaceFileInputRef.current?.click()}
                      disabled={isPythonLoading || isSavingDocument}
                      className="p-1.5 sm:p-2 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-semibold"
                      title="Replace current image with a new file"
                    >
                      <ImagePlus size={15} />
                      <span className="hidden sm:inline">Replace</span>
                    </button>

                    <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

                    <button
                      onClick={handleRotate}
                      disabled={
                        isPythonLoading || isManualCropping || isSavingDocument
                      }
                      className="p-1.5 sm:p-2 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-semibold"
                      title={
                        isManualCropping
                          ? "Finish manual crop first"
                          : "Rotate Document 90°"
                      }
                    >
                      <RotateCw size={15} />
                      <span className="hidden sm:inline">Rotate</span>
                    </button>
                  </div>
                )}

                {images.length === 0 ? (
                  <label className="flex flex-col items-center justify-center gap-3 cursor-pointer text-slate-500 hover:text-slate-700 transition-colors p-6 text-center">
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
                    className="bg-white w-full max-w-full h-full max-h-[450px] sm:max-h-[580px] lg:max-h-[620px] aspect-[1/1.414] shadow-md border border-slate-300 rounded relative flex items-center justify-center overflow-hidden"
                  >
                    {isPythonLoading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <Loader2
                          size={32}
                          className="text-emerald-600 animate-spin"
                        />
                        <span className="text-xs font-bold text-slate-900">
                          Processing Image...
                        </span>
                      </div>
                    )}

                    {isSavingDocument && (
                      <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] z-40 flex flex-col items-center justify-center gap-2 p-4 text-center pointer-events-none">
                        <Loader2
                          size={30}
                          className="text-emerald-600 animate-spin"
                        />
                        <span className="text-xs font-bold text-slate-900">
                          Saving document...
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Uploading image and saving your record
                        </span>
                      </div>
                    )}

                    {isComparing && processedImageSrc ? (
                      <div className="w-full h-full relative flex items-center justify-center cursor-ew-resize">
                        <ReactCompareImage
                          leftImage={processedImageSrc}
                          rightImage={
                            rotatedOriginalSrc ||
                            croppedOriginalSrc ||
                            uncroppedSrc ||
                            images[selectedIndex]
                          }
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
                          isHoldingOriginal
                            ? rotatedOriginalSrc ||
                              croppedOriginalSrc ||
                              uncroppedSrc ||
                              images[selectedIndex]
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
                            className="w-7 h-7 sm:w-6 sm:h-6 bg-emerald-600 border-2 border-white rounded-full absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing shadow-lg flex items-center justify-center z-30"
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

            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-1.5 sm:gap-2">
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
                  <span>Reset view</span>
                </button>
              </div>

              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                {(zoom / 100).toFixed(1)}x - use + / − to zoom
              </span>
            </div>
          </div>

          <div className="w-full lg:w-[320px] shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="w-1.5 h-3 bg-emerald-600 rounded-xs" />
                Crop
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleTriggerAutoCrop}
                  disabled={
                    isPythonLoading || images.length === 0 || isSavingDocument
                  }
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed ${autoCrop && !isManualCropping ? "bg-emerald-600 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
                >
                  <Crop size={14} />
                  Auto crop
                </button>

                <button
                  onClick={handleTriggerManualCrop}
                  disabled={images.length === 0 || isSavingDocument}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${isManualCropping ? "bg-slate-800 text-white" : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                >
                  <Crop size={14} />
                  Manual crop
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="w-1.5 h-3 bg-emerald-600 rounded-xs" />
                Magic
              </div>

              <button
                onClick={handleApplyColorMagic}
                disabled={
                  isPythonLoading || images.length === 0 || isSavingDocument
                }
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${mode === "python-color" ? "bg-slate-800 text-white" : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"}`}
              >
                <Palette size={14} />
                Color Document
              </button>

              <button
                onClick={handleApplyMagic}
                disabled={
                  isPythonLoading || images.length === 0 || isSavingDocument
                }
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={14} />
                Document Clean
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="w-1.5 h-3 bg-emerald-600 rounded-xs" />
                Mode
              </div>

              <div className="space-y-2">
                <button
                  onMouseDown={() => setIsHoldingOriginal(true)}
                  onMouseUp={() => setIsHoldingOriginal(false)}
                  onMouseLeave={() => setIsHoldingOriginal(false)}
                  onTouchStart={() => setIsHoldingOriginal(true)}
                  onTouchEnd={() => setIsHoldingOriginal(false)}
                  disabled={images.length === 0}
                  className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer select-none active:scale-98 ${isHoldingOriginal ? "bg-slate-800 text-white shadow-xs" : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Eye size={14} />
                  <span>
                    {isHoldingOriginal
                      ? "Showing Original..."
                      : "Hold for Normal (original)"}
                  </span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 transition-all sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-xs" />
                  Adjustments
                </div>

                <button
                  type="button"
                  onClick={handleResetAdjustments}
                  disabled={
                    images.length === 0 ||
                    (blackness === 0 && contrast === 0 && brightness === 0)
                  }
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Reset only adjustments"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-3 text-xs">
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
                    onChange={(e) => {
                      setBlackness(Number(e.target.value));
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

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
                    onChange={(e) => {
                      setBrightness(Number(e.target.value));
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

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
                    onChange={(e) => {
                      setContrast(Number(e.target.value));
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewSavedDocument && (
        <div
          className="fixed inset-0 z-[95] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="saved-document-preview-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPreviewSavedDocument(null);
            }
          }}
        >
          <div className="w-full max-w-6xl h-[min(92vh,900px)] bg-slate-100 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col">
            <div className="px-3 sm:px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">
                  Saved document preview
                </p>
                <h2
                  id="saved-document-preview-title"
                  className="text-sm sm:text-base font-bold text-slate-900 truncate"
                >
                  {previewSavedDocument.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setPreviewSavedDocument(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Close preview"
              >
                <X size={17} />
              </button>
            </div>

            <div className="flex-1 min-h-0 p-3 sm:p-5 flex items-center justify-center overflow-auto bg-slate-200/70">
              <div className="max-w-full max-h-full bg-white rounded-xl shadow-xl border border-slate-300 p-2 sm:p-3 flex items-center justify-center">
                <img
                  src={previewSavedDocument.src}
                  alt={previewSavedDocument.name}
                  className="block max-w-full max-h-[calc(92vh-190px)] object-contain"
                />
              </div>
            </div>

            <div className="px-3 sm:px-5 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleEditSavedDocument(previewSavedDocument)}
                disabled={isPythonLoading || isSavingDocument}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit size={14} />
                Modify document
              </button>

              <button
                type="button"
                onClick={() => handlePrintSource(previewSavedDocument.src)}
                disabled={isPythonLoading || isSavingDocument}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={14} />
                Print
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleDownloadPDFForSource(
                    previewSavedDocument.src,
                    `${previewSavedDocument.name
                      .toLowerCase()
                      .replace(/\s+/g, "-")}.pdf`,
                  )
                }
                disabled={isPythonLoading || isSavingDocument}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown size={14} />
                PDF download
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDownloadSavedDocument(previewSavedDocument)
                }
                disabled={isPythonLoading || isSavingDocument}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={14} />
                Download image
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingNavigationIndex !== null && hasUnsavedChanges && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-document-title"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <Save size={19} />
              </div>

              <div className="min-w-0">
                <h2
                  id="unsaved-document-title"
                  className="text-sm font-bold text-slate-900"
                >
                  Save current document?
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-5">
                  You can save your current work before switching to another
                  document.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <button
                type="button"
                onClick={handleConfirmNavigationWithoutSave}
                disabled={isPythonLoading || isSavingDocument}
                className="py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmNavigationSave}
                disabled={isPythonLoading || isSavingDocument}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingDocument ? "Saving..." : "Yes, Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="mt-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Saved Documents
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Saved documents are linked to your account.
            </p>
          </div>

          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
            {savedDocuments.length} saved
          </span>
        </div>

        {isLoadingSavedDocuments ? (
          <div className="border border-slate-200 rounded-xl bg-slate-50 p-6 text-center">
            <Loader2
              size={22}
              className="mx-auto text-emerald-600 animate-spin mb-2"
            />
            <p className="text-xs font-semibold text-slate-600">
              Saved documents load হচ্ছে...
            </p>
          </div>
        ) : savedDocuments.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl bg-slate-50 p-6 text-center">
            <Save size={22} className="mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-600">
              এখনো কোনো document save করা হয়নি।
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Crop, clean এবং adjustment শেষ করে উপরের Save document চাপো।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {savedDocuments.map((savedDocument, index) => {
              const isDeleting = deletingSavedDocumentId === savedDocument.id;

              return (
                <div
                  key={savedDocument.id}
                  className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 group"
                >
                  <div
                    className="aspect-[1/1.414] bg-white flex items-center justify-center overflow-hidden border-b border-slate-200 relative cursor-pointer"
                    onClick={() => handleOpenSavedPreview(savedDocument)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpenSavedPreview(savedDocument);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Preview ${savedDocument.name}`}
                  >
                    <img
                      src={savedDocument.src}
                      alt={savedDocument.name}
                      className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                      loading="lazy"
                    />

                    {isDeleting && (
                      <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-md">
                          <Loader2
                            size={15}
                            className="text-emerald-600 animate-spin"
                          />
                          <span className="text-[10px] font-semibold text-slate-700">
                            Deleting...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">
                          {savedDocument.name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Saved{" "}
                          {index === 0
                            ? "just now"
                            : new Date(
                                savedDocument.createdAt,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                        </p>
                      </div>

                      <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 shrink-0">
                        Saved
                      </span>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDownloadSavedDocument(savedDocument);
                        }}
                        disabled={isDeleting}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={12} />
                        Download
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleRemoveSavedDocument(savedDocument);
                        }}
                        disabled={isDeleting}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Remove ${savedDocument.name}`}
                        title="Delete saved document"
                      >
                        {isDeleting ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <X size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-4 pt-2 text-xs text-slate-600 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
        <span>
          Document Clean দিয়ে Document আরও সুন্দর ও Clean করুন A4 Print Ready
        </span>
      </div>
    </div>
  );
}
