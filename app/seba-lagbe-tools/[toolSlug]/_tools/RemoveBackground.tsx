"use client";
import { T } from "@/app/seba-lagbe-tools/_i18n";
import { useI18n } from "@/components/i18n/I18nProvider";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Share2,
  ArrowLeft,
  Image as ImageIcon,
  Palette,
  CreditCard,
  BookOpen,
  Download,
  Layers,
  RefreshCw,
  Scissors,
} from "lucide-react";

const jakartaFont = { variable: "", style: { fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' } };
const hindFont = { variable: "", style: { fontFamily: '"Hind Siliguri"' } };

const REMOVE_BG_TEXT: Record<string, string> = {
  "Erase portrait, product, or logo backgrounds in your browser — download a transparent PNG.":
    "আপনার ব্রাউজারেই ছবি, পণ্য বা লোগোর ব্যাকগ্রাউন্ড মুছে ফেলুন—স্বচ্ছ PNG হিসেবে ডাউনলোড করুন।",
  Uploaded: "আপলোড হয়েছে",
  Empty: "খালি",
  "Cutout Preview": "ব্যাকগ্রাউন্ড সরানোর পূর্বরূপ",
  "Remove Background": "ব্যাকগ্রাউন্ড সরান",
  "Downloading AI model...": "AI মডেল ডাউনলোড হচ্ছে…",
  "Preparing...": "প্রস্তুত করা হচ্ছে…",
  "Cleaning edges...": "ধার পরিষ্কার করা হচ্ছে…",
  Cancel: "বাতিল করুন",
  "First time only: the AI model (about 80 MB) is downloaded once and then saved in your browser.":
    "শুধু প্রথমবার: AI মডেল (প্রায় ৮০ MB) একবার ডাউনলোড হয়ে আপনার ব্রাউজারে সংরক্ষিত থাকে।",
  "Choose background photo": "ব্যাকগ্রাউন্ডের ছবি বেছে নিন",
  "Change background photo": "ব্যাকগ্রাউন্ডের ছবি পরিবর্তন করুন",
  "Choose a background photo to see it here. Until then the download stays transparent.":
    "ব্যাকগ্রাউন্ডের ছবি বেছে নিলে এখানে দেখতে পাবেন। তার আগে ডাউনলোড স্বচ্ছ থাকবে।",
  "Or drag and drop an image here": "অথবা ছবিটি এখানে টেনে এনে ছাড়ুন",
  "Tool link copied.": "টুলের লিংক কপি হয়েছে।",
  "Please choose a JPG, PNG, or WebP image.":
    "অনুগ্রহ করে JPG, PNG অথবা WebP ছবি নির্বাচন করুন।",
  "Please choose an image smaller than 25 MB.":
    "অনুগ্রহ করে ২৫ MB-এর কম আকারের ছবি নির্বাচন করুন।",
  "Something went wrong while removing background.":
    "ব্যাকগ্রাউন্ড সরানোর সময় একটি সমস্যা হয়েছে।",
  "Could not create the download file.": "ডাউনলোডের জন্য ফাইল তৈরি করা যায়নি।",
  "Could not load the processed image for download.":
    "ডাউনলোডের জন্য প্রক্রিয়াকৃত ছবি লোড করা যায়নি।",
  "The AI model download is taking too long. Check your internet connection and try again.":
    "AI মডেল ডাউনলোড হতে অনেক সময় লাগছে। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।",
  "Could not download the AI model. Check your internet connection and try again.":
    "AI মডেল ডাউনলোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।",
  "This image is too large for your device. Try a smaller image.":
    "এই ছবিটি আপনার ডিভাইসের জন্য অনেক বড়। ছোট ছবি দিয়ে চেষ্টা করুন।",
};

const removeBgText = (locale: "en" | "bn", text: string): string =>
  locale === "bn" ? (REMOVE_BG_TEXT[text] ?? text) : text;

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const localizeDigits = (locale: "en" | "bn", value: string): string =>
  locale === "bn" ? value.replace(/\d/g, (d) => BN_DIGITS[Number(d)]) : value;

/* -------------------------------------------------------------------------- */
/* Image helpers (no React) — everything runs in the browser                  */
/* -------------------------------------------------------------------------- */
// ---- helpers:start
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
// Photos bigger than this are scaled down before the AI runs: the model works
// at ~1024 px anyway, and huge images can run low-end phones out of memory.
const MAX_INPUT_SIDE = 2400;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

function isAcceptedImage(file: File): boolean {
  if (ACCEPTED_TYPES.has(file.type)) return true;
  // Some Android file managers hand over an empty MIME type.
  return file.type === "" && ACCEPTED_EXTENSIONS.test(file.name);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Could not create the download file.")),
      type,
      quality,
    );
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Could not load the processed image for download."));
    image.src = url;
  });
}

async function prepareInput(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // let the AI library report a proper error
  }
  const longSide = Math.max(bitmap.width, bitmap.height);
  if (longSide <= MAX_INPUT_SIDE) {
    bitmap.close();
    return file;
  }
  const scale = MAX_INPUT_SIDE / longSide;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // Keep transparency for PNG/WebP inputs (logos); JPEG stays JPEG.
  return file.type === "image/jpeg" || /\.jpe?g$/i.test(file.name)
    ? canvasToBlob(canvas, "image/jpeg", 0.95)
    : canvasToBlob(canvas, "image/png");
}

const ALPHA_CUT_LOW = 12;
const ALPHA_CUT_HIGH = 240;
const MAX_FILL_LEVEL = 6; // clean colour is searched up to 2^6 = 64 px away
const GREEN_DOMINANCE = 10; // g - max(r, b) above this = green spill
const GREEN_SUBJECT_LIMIT = 0.04; // skip despill when the subject itself is green

type ColorLevel = {
  w: number;
  h: number;
  weight: Float32Array;
  r: Float32Array;
  g: Float32Array;
  b: Float32Array;
};

function createLevel(w: number, h: number): ColorLevel {
  const size = w * h;
  return {
    w,
    h,
    weight: new Float32Array(size),
    r: new Float32Array(size),
    g: new Float32Array(size),
    b: new Float32Array(size),
  };
}

/** Colour sums built only from fully opaque pixels. Level k has cells of 2^(k+1) px. */
function buildSolidPyramid(data: Uint8ClampedArray, w: number, h: number) {
  const levels: ColorLevel[] = [];
  const first = createLevel((w + 1) >> 1, (h + 1) >> 1);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      if (data[i * 4 + 3] !== 255) continue;
      const j = (y >> 1) * first.w + (x >> 1);
      first.weight[j] += 1;
      first.r[j] += data[i * 4];
      first.g[j] += data[i * 4 + 1];
      first.b[j] += data[i * 4 + 2];
    }
  }
  levels.push(first);
  while (levels.length < MAX_FILL_LEVEL) {
    const prev = levels[levels.length - 1];
    const next = createLevel((prev.w + 1) >> 1, (prev.h + 1) >> 1);
    for (let y = 0; y < prev.h; y += 1) {
      for (let x = 0; x < prev.w; x += 1) {
        const i = y * prev.w + x;
        if (prev.weight[i] === 0) continue;
        const j = (y >> 1) * next.w + (x >> 1);
        next.weight[j] += prev.weight[i];
        next.r[j] += prev.r[i];
        next.g[j] += prev.g[i];
        next.b[j] += prev.b[i];
      }
    }
    levels.push(next);
  }
  return levels;
}

/**
 * Cleans the colour fringe of an AI cut-out (RGBA):
 *  - green background that leaked into hair / edges is neutralised,
 *  - every partly transparent edge pixel takes the colour of the nearest clean
 *    foreground pixels, so it blends correctly over any new background,
 *  - faint ghosting and stray specks are removed.
 */
function cleanCutoutEdges(image: ImageData): void {
  const { width: w, height: h, data } = image;
  const total = w * h;

  // 1. Alpha curve: drop faint ghosting, make "almost solid" truly solid.
  for (let i = 0; i < total; i += 1) {
    const k = i * 4 + 3;
    const a = data[k];
    if (a <= ALPHA_CUT_LOW) data[k] = 0;
    else if (a >= ALPHA_CUT_HIGH) data[k] = 255;
    else
      data[k] = Math.round(
        ((a - ALPHA_CUT_LOW) * 255) / (ALPHA_CUT_HIGH - ALPHA_CUT_LOW),
      );
  }

  // 2. Green despill on the edge band of the subject.
  //    "Deep" = inside a cell that is completely opaque; the band is everything
  //    opaque that is not deep. Skipped when the subject itself is green.
  let levels = buildSolidPyramid(data, w, h);
  const bandIndex = Math.max(w, h) > 3000 ? 4 : 3; // 32 px / 16 px cells
  const band = levels[bandIndex];
  const cell = 2 << bandIndex;
  const isDeepCell = (cx: number, cy: number) => {
    const cw = Math.min(cell, w - cx * cell);
    const ch = Math.min(cell, h - cy * cell);
    return band.weight[cy * band.w + cx] >= cw * ch;
  };
  let deepPixels = 0;
  let deepGreen = 0;
  for (let cy = 0; cy < band.h; cy += 1) {
    for (let cx = 0; cx < band.w; cx += 1) {
      if (!isDeepCell(cx, cy)) continue;
      const j = cy * band.w + cx;
      const n = band.weight[j];
      deepPixels += n;
      const r = band.r[j] / n;
      const g = band.g[j] / n;
      const b = band.b[j] / n;
      if (g - Math.max(r, b) > GREEN_DOMINANCE) deepGreen += n;
    }
  }
  if (deepPixels > 0 && deepGreen / deepPixels < GREEN_SUBJECT_LIMIT) {
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = y * w + x;
        if (data[i * 4 + 3] !== 255) continue;
        if (isDeepCell((x / cell) | 0, (y / cell) | 0)) continue;
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const over = g - Math.max(r, b);
        if (over > GREEN_DOMINANCE) {
          data[i * 4 + 1] = Math.round(Math.max(r, b) + over * 0.1);
        }
      }
    }
    levels = buildSolidPyramid(data, w, h); // rebuild with the cleaned colours
  }

  // 3. Recolour every partly transparent pixel from nearby clean foreground
  //    colour (bilinear between cells, so there is no blockiness).
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      const a = data[i * 4 + 3];
      if (a === 0 || a === 255) continue;
      let filled = false;
      for (let k = 0; k < levels.length; k += 1) {
        const level = levels[k];
        const shift = k + 1;
        const size = 1 << shift;
        const fx = (x + 0.5) / size - 0.5;
        const fy = (y + 0.5) / size - 0.5;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const tx = fx - x0;
        const ty = fy - y0;
        let sw = 0;
        let sr = 0;
        let sg = 0;
        let sb = 0;
        for (let dy = 0; dy < 2; dy += 1) {
          for (let dx = 0; dx < 2; dx += 1) {
            const cx = x0 + dx;
            const cy = y0 + dy;
            if (cx < 0 || cy < 0 || cx >= level.w || cy >= level.h) continue;
            const j = cy * level.w + cx;
            const n = level.weight[j];
            if (n <= 0) continue;
            const bw = (dx ? tx : 1 - tx) * (dy ? ty : 1 - ty);
            sw += bw;
            sr += (level.r[j] / n) * bw;
            sg += (level.g[j] / n) * bw;
            sb += (level.b[j] / n) * bw;
          }
        }
        if (sw > 0) {
          data[i * 4] = Math.round(sr / sw);
          data[i * 4 + 1] = Math.round(sg / sw);
          data[i * 4 + 2] = Math.round(sb / sw);
          filled = true;
          break;
        }
      }
      // No clean foreground nearby: a stray speck, not part of the subject.
      if (!filled) data[i * 4 + 3] = 0;
    }
  }
}

async function cleanCutoutBlob(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    bitmap.close();
    return blob;
  }
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  cleanCutoutEdges(imageData);
  context.putImageData(imageData, 0, 0);
  return canvasToBlob(canvas, "image/png");
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(
    image,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

type NewBackground =
  | { kind: "solid"; color: string }
  | { kind: "photo"; url: string };

async function composeOnBackground(
  cutoutUrl: string,
  background: NewBackground,
): Promise<Blob> {
  const cutout = await loadImage(cutoutUrl);
  const canvas = document.createElement("canvas");
  canvas.width = cutout.naturalWidth;
  canvas.height = cutout.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the download file.");
  if (background.kind === "solid") {
    context.fillStyle = background.color;
    context.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const photo = await loadImage(background.url);
    drawCover(context, photo, canvas.width, canvas.height);
  }
  context.drawImage(cutout, 0, 0);
  return canvasToBlob(canvas, "image/png");
}

function friendlyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/fetch|network|load failed|failed to load|cors|timed? ?out/i.test(message)) {
    return "Could not download the AI model. Check your internet connection and try again.";
  }
  if (/memory|allocation|alloc/i.test(message)) {
    return "This image is too large for your device. Try a smaller image.";
  }
  return "Something went wrong while removing background.";
}
// ---- helpers:end

// Optional: host the model files yourself (see the README note in the chat) and
// set NEXT_PUBLIC_BG_REMOVAL_PUBLIC_PATH, e.g. "/bg-removal/". When it is not
// set the library uses its default CDN.
const MODEL_PUBLIC_PATH =
  process.env.NEXT_PUBLIC_BG_REMOVAL_PUBLIC_PATH || undefined;
// If no download progress arrives for this long, the job is abandoned.
const DOWNLOAD_STALL_MS = 60_000;

const CHECKERBOARD_STYLE: React.CSSProperties = {
  backgroundColor: "#ffffff",
  backgroundImage:
    "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
};

export default function RemoveBackground() {
  const { locale } = useI18n();
  const tx = (text: string) => removeBgText(locale, text);
  const [bgType, setBgType] = useState<"transparent" | "solid" | "photo">(
    "transparent",
  );
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [bgPhotoUrl, setBgPhotoUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [downloadMb, setDownloadMb] = useState<{
    current: number;
    total: number;
  } | null>(null);
  // "download" = model/wasm files are being fetched (real % available)
  // "process"  = the AI is running (no real % exists)
  // "finish"   = edge clean-up
  const [phase, setPhase] = useState<"download" | "process" | "finish" | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Refs keep the latest object URLs so the paste listener (registered once)
  // and the unmount cleanup never work with stale values.
  const previewUrlRef = useRef<string | null>(null);
  const processedUrlRef = useRef<string | null>(null);
  const processedBlobRef = useRef<Blob | null>(null);
  const bgPhotoUrlRef = useRef<string | null>(null);
  const bgPhotoInputRef = useRef<HTMLInputElement | null>(null);
  // Incremented on every new file / reset / cancel so an in-flight job is ignored.
  const jobIdRef = useRef(0);
  const phaseRef = useRef<"download" | "process" | "finish" | null>(null);
  const lastProgressAtRef = useRef(0);
  const stallTimerRef = useRef<number | null>(null);

  const stopStallTimer = useCallback(() => {
    if (stallTimerRef.current !== null) {
      window.clearInterval(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }, []);
  const revokeUrls = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (processedUrlRef.current) {
      URL.revokeObjectURL(processedUrlRef.current);
      processedUrlRef.current = null;
    }
    processedBlobRef.current = null;
  }, []);
  const resetProgress = useCallback(() => {
    stopStallTimer();
    phaseRef.current = null;
    setIsProcessing(false);
    setProgress(null);
    setDownloadMb(null);
    setPhase(null);
  }, [stopStallTimer]);
  const handleNewFile = useCallback(
    (file: File) => {
      jobIdRef.current += 1;
      revokeUrls();
      const newPreviewUrl = URL.createObjectURL(file);
      previewUrlRef.current = newPreviewUrl;
      setImageFile(file);
      setPreviewUrl(newPreviewUrl);
      setProcessedUrl(null);
      resetProgress();
      setErrorMessage(null);
    },
    [revokeUrls, resetProgress],
  );
  const acceptFile = useCallback(
    (file: File) => {
      if (!isAcceptedImage(file)) {
        setErrorMessage("Please choose a JPG, PNG, or WebP image.");
        return;
      }
      if (file.size > MAX_INPUT_BYTES) {
        setErrorMessage("Please choose an image smaller than 25 MB.");
        return;
      }
      handleNewFile(file);
    },
    [handleNewFile],
  );
  // Ctrl+V paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            acceptFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [acceptFile]);
  // Free memory on unmount
  useEffect(() => {
    return () => {
      jobIdRef.current += 1;
      stopStallTimer();
      revokeUrls();
      if (bgPhotoUrlRef.current) {
        URL.revokeObjectURL(bgPhotoUrlRef.current);
        bgPhotoUrlRef.current = null;
      }
    };
  }, [revokeUrls, stopStallTimer]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Allow selecting the same file again
    e.target.value = "";
    if (file) acceptFile(file);
  };
  const handleBgPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isAcceptedImage(file)) {
      setErrorMessage("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setErrorMessage("Please choose an image smaller than 25 MB.");
      return;
    }
    if (bgPhotoUrlRef.current) URL.revokeObjectURL(bgPhotoUrlRef.current);
    const url = URL.createObjectURL(file);
    bgPhotoUrlRef.current = url;
    setBgPhotoUrl(url);
    setErrorMessage(null);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  };
  const handleReset = () => {
    jobIdRef.current += 1;
    revokeUrls();
    setImageFile(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
    resetProgress();
    setErrorMessage(null);
    setNotice(null);
  };
  const handleCancel = () => {
    jobIdRef.current += 1; // the running job's result is ignored
    resetProgress();
  };

  // Client-side background removal (@imgly/background-removal)
  // This package uses the root onnxruntime-web peer dependency.
  const handleRemoveBg = async () => {
    if (!imageFile || isProcessing) return;
    const jobId = ++jobIdRef.current;
    setIsProcessing(true);
    setProgress(null);
    setDownloadMb(null);
    setPhase("download");
    phaseRef.current = "download";
    setErrorMessage(null);
    setNotice(null);
    lastProgressAtRef.current = Date.now();

    // Give up if the model download makes no progress for a long time (e.g. the
    // CDN is blocked or the connection dropped) instead of spinning forever.
    stopStallTimer();
    stallTimerRef.current = window.setInterval(() => {
      if (jobId !== jobIdRef.current) {
        stopStallTimer();
        return;
      }
      if (
        phaseRef.current === "download" &&
        Date.now() - lastProgressAtRef.current > DOWNLOAD_STALL_MS
      ) {
        jobIdRef.current += 1; // abandon the running job
        resetProgress();
        setErrorMessage(
          "The AI model download is taking too long. Check your internet connection and try again.",
        );
      }
    }, 2000);

    // The library reports progress per asset key. "fetch:*" keys are the model /
    // wasm downloads (real byte progress). "compute:*" keys are the inference
    // stages, which have no meaningful percentage.
    const downloads = new Map<string, { current: number; total: number }>();
    let highestProgress = 0;
    try {
      const input = await prepareInput(imageFile);
      if (jobId !== jobIdRef.current) return;
      // Dynamic import: the library only ever loads in the browser (no SSR issues)
      const { removeBackground } = await import("@imgly/background-removal");
      const rawBlob = await removeBackground(input, {
        ...(MODEL_PUBLIC_PATH ? { publicPath: MODEL_PUBLIC_PATH } : {}),
        output: { format: "image/png" },
        progress: (key: string, current: number, total: number) => {
          if (jobId !== jobIdRef.current) return;
          lastProgressAtRef.current = Date.now();
          if (key.startsWith("compute")) {
            phaseRef.current = "process";
            setPhase("process");
            return;
          }
          if (!(total > 0)) return;
          downloads.set(key, { current: Math.min(current, total), total });
          let sumCurrent = 0;
          let sumTotal = 0;
          downloads.forEach((asset) => {
            sumCurrent += asset.current;
            sumTotal += asset.total;
          });
          // Monotonic: new assets raise the total and must not move the bar back.
          const overall = Math.min(
            100,
            Math.floor((sumCurrent / sumTotal) * 100),
          );
          if (overall > highestProgress) {
            highestProgress = overall;
            setProgress(overall);
            setDownloadMb({ current: sumCurrent, total: sumTotal });
          }
        },
      });
      // The user already chose a new image or reset: drop this result.
      if (jobId !== jobIdRef.current) return;

      // Remove green/white colour fringe from the edges. If this ever fails the
      // plain AI result is still used.
      phaseRef.current = "finish";
      setPhase("finish");
      await new Promise((resolve) => window.setTimeout(resolve, 30));
      let finalBlob = rawBlob;
      try {
        finalBlob = await cleanCutoutBlob(rawBlob);
      } catch (cleanError) {
        console.error("[Remove Background] Edge clean-up skipped:", cleanError);
      }
      if (jobId !== jobIdRef.current) return;

      if (processedUrlRef.current) {
        URL.revokeObjectURL(processedUrlRef.current);
      }
      const outputUrl = URL.createObjectURL(finalBlob);
      processedUrlRef.current = outputUrl;
      processedBlobRef.current = finalBlob;
      setProcessedUrl(outputUrl);
    } catch (error: unknown) {
      if (jobId !== jobIdRef.current) return;
      console.error("[Remove Background Error]:", error);
      setErrorMessage(friendlyErrorMessage(error));
    } finally {
      if (jobId === jobIdRef.current) {
        resetProgress();
      }
    }
  };

  const triggerDownload = (blob: Blob) => {
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `remove-bg-${Date.now()}.png`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
  };
  // Download: transparent PNG, or the cut-out placed on the chosen background.
  const handleDownload = async () => {
    const cutout = processedBlobRef.current;
    if (!processedUrl || !cutout) return;
    try {
      if (bgType === "solid") {
        triggerDownload(
          await composeOnBackground(processedUrl, {
            kind: "solid",
            color: selectedColor,
          }),
        );
      } else if (bgType === "photo" && bgPhotoUrl) {
        triggerDownload(
          await composeOnBackground(processedUrl, {
            kind: "photo",
            url: bgPhotoUrl,
          }),
        );
      } else {
        triggerDownload(cutout);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "Could not create the download file.",
      );
    }
  };
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: tx("Remove Background"),
          url: window.location.href,
        });
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setNotice("Tool link copied.");
      }
    } catch {
      // The user cancelled the native share sheet.
    }
  };

  const formatMb = (bytes: number) => `${Math.round(bytes / (1024 * 1024))}`;
  const downloadLabel =
    progress !== null
      ? `${tx("Downloading AI model...")} ${localizeDigits(locale, `${progress}%`)}` +
        (downloadMb && downloadMb.total > 1024 * 1024
          ? ` (${localizeDigits(locale, `${formatMb(downloadMb.current)} / ${formatMb(downloadMb.total)}`)} MB)`
          : "")
      : tx("Preparing...");

  let previewBackground: React.CSSProperties = {};
  if (processedUrl) {
    if (bgType === "solid") {
      previewBackground = { backgroundColor: selectedColor };
    } else if (bgType === "photo" && bgPhotoUrl) {
      previewBackground = {
        backgroundColor: "#ffffff",
        backgroundImage: `url("${bgPhotoUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    } else {
      previewBackground = CHECKERBOARD_STYLE;
    }
  }

  return (
    <div
      id="remove-bg-tool"
      className={`${jakartaFont.variable} ${hindFont.variable} relative isolate z-0 w-full space-y-5 text-[#3B2F1E] page-font`}
    >
      {/* Pointer cursor on every clickable element of this tool */}
      <style>{`
        html:has(#remove-bg-tool),
        body:has(#remove-bg-tool),
        main:has(#remove-bg-tool) {
          background: linear-gradient(to bottom, #E9DDC3, #EFE5CE) !important;
        }
        body:has(#remove-bg-tool) {
          background-attachment: fixed !important;
        }
        #remove-bg-tool, #remove-bg-tool *:not(.font-mono):not(svg):not(svg *) {
          font-family: var(--font-rb-jakarta), var(--font-rb-hind), "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        #remove-bg-tool h1, #remove-bg-tool h2, #remove-bg-tool h3, #remove-bg-tool h4 {
          letter-spacing: -0.01em;
        }
        /* Extend the warm page canvas to both sides even inside a centred layout. */
        #remove-bg-tool::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: linear-gradient(to bottom, #E9DDC3, #EFE5CE);
        }
        #remove-bg-tool a[href],
        #remove-bg-tool button:not(:disabled),
        #remove-bg-tool label,
        #remove-bg-tool summary,
        #remove-bg-tool [role="button"],
        #remove-bg-tool select,
        #remove-bg-tool input[type="color"],
        #remove-bg-tool input[type="range"],
        #remove-bg-tool input[type="checkbox"],
        #remove-bg-tool input[type="radio"],
        #remove-bg-tool input[type="file"] {
          cursor: pointer;
        }

        #remove-bg-tool button:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
        #remove-bg-tool button:not(:disabled),
        #remove-bg-tool a[href],
        #remove-bg-tool input,
        #remove-bg-tool select {
          transition-duration: 150ms;
        }
        #remove-bg-tool input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="color"]),
        #remove-bg-tool select {
          background-color: #FBF6E8;
          border-color: #E3D6B8;
          color: #3B2F1E;
        }
        #remove-bg-tool button:focus-visible,
        #remove-bg-tool a:focus-visible,
        #remove-bg-tool input:focus-visible,
        #remove-bg-tool select:focus-visible {
          outline: 2px solid rgba(220, 38, 38, 0.4);
          outline-offset: 2px;
        }
      `}</style>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-[#6B5A40]">
        <Link
          href="/seba-lagbe-tools"
          className="flex items-center gap-1 hover:text-[#B91C1C] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>
            <T>{"Seba Lagbe Tools"}</T>
          </span>
        </Link>
        <span>
          <T>{"/"}</T>
        </span>
        <span>
          <T>{"Image Tools"}</T>
        </span>
        <span>
          <T>{"/"}</T>
        </span>
        <span className="font-semibold text-[#3B2F1E]">
          <T>{"Remove Background"}</T>
        </span>
      </div>

      {/* Header Card */}
      <div className="bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#F6EEDB] text-[#DC2626] rounded-xl flex items-center justify-center shrink-0 border border-[#E3D6B8]">
            <Scissors size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#3B2F1E]">
                <T>{"Remove Background\n              "}</T>
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[12px] font-bold px-2 py-0.5 rounded-full">
                <T>{"Free\n              "}</T>
              </span>
            </div>
            <p className="text-sm text-[#6B5A40] font-medium mt-0.5">
              <span>
                {tx(
                  "Erase portrait, product, or logo backgrounds in your browser — download a transparent PNG.",
                )}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label={locale === "bn" ? "শেয়ার করুন" : "Share"}
            title={locale === "bn" ? "শেয়ার করুন" : "Share"}
            className="p-2 text-[#6B5A40] hover:text-[#B91C1C] bg-[#F6EEDB] hover:bg-[#EFE3C8] rounded-xl transition-all border border-[#E3D6B8]"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Controls Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#3B2F1E] border-b border-[#E3D6B8] pb-2">
              <T>{"New background\n            "}</T>
            </h2>

            {/* Background Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-[#F6EEDB] p-1 rounded-xl border border-[#E3D6B8]">
              <button
                type="button"
                onClick={() => setBgType("transparent")}
                className={`py-2 text-[13px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  bgType === "transparent"
                    ? "bg-[#FBF6E8] text-[#DC2626] shadow-sm border border-[#E3D6B8]"
                    : "text-[#6B5A40] hover:text-[#B91C1C]"
                }`}
              >
                <Layers size={14} />
                <span>
                  <T>{"Transparent"}</T>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBgType("solid")}
                className={`py-2 text-[13px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  bgType === "solid"
                    ? "bg-[#FBF6E8] text-[#DC2626] shadow-sm border border-[#E3D6B8]"
                    : "text-[#6B5A40] hover:text-[#B91C1C]"
                }`}
              >
                <Palette size={14} />
                <span>
                  <T>{"Solid color"}</T>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBgType("photo")}
                className={`py-2 text-[13px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  bgType === "photo"
                    ? "bg-[#FBF6E8] text-[#DC2626] shadow-sm border border-[#E3D6B8]"
                    : "text-[#6B5A40] hover:text-[#B91C1C]"
                }`}
              >
                <ImageIcon size={14} />
                <span>
                  <T>{"Photo"}</T>
                </span>
              </button>
            </div>

            {/* Solid Color Options */}
            {bgType === "solid" && (
              <div className="space-y-2 pt-1 border-t border-[#E3D6B8]">
                <span className="text-[13px] font-bold text-[#5A4A32] block">
                  <T>{"Select Color\n                "}</T>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    "#ffffff",
                    "#000000",
                    "#f3f4f6",
                    "#ef4444",
                    "#3b82f6",
                    "#10b981",
                    "#2563EB",
                  ].map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      aria-label={color}
                      aria-pressed={selectedColor === color}
                      className={`w-6 h-6 rounded-full border border-[#E3D6B8] transition-transform ${
                        selectedColor === color
                          ? "scale-110 ring-2 ring-[#DC2626]"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    aria-label={
                      locale === "bn"
                        ? "ব্যাকগ্রাউন্ডের রঙ নির্বাচন করুন"
                        : "Choose background color"
                    }
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            )}

            {/* Background photo option */}
            {bgType === "photo" && (
              <div className="space-y-2 pt-1 border-t border-[#E3D6B8]">
                <input
                  ref={bgPhotoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleBgPhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => bgPhotoInputRef.current?.click()}
                  className="w-full py-2.5 border border-dashed border-[#DC2626] text-[#3B2F1E] text-sm font-bold rounded-xl hover:bg-[#EFE3C8] transition-all flex items-center justify-center gap-1.5"
                >
                  <ImageIcon size={14} />
                  <span>
                    {tx(
                      bgPhotoUrl
                        ? "Change background photo"
                        : "Choose background photo",
                    )}
                  </span>
                </button>
                {!bgPhotoUrl && (
                  <p className="text-[12px] text-[#6B5A40]">
                    {tx(
                      "Choose a background photo to see it here. Until then the download stays transparent.",
                    )}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons Box */}
          <div className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-sm flex flex-col gap-2">
            {errorMessage && (
              <p role="alert" className="text-[13px] text-red-500 font-medium">
                {tx(errorMessage)}
              </p>
            )}
            {notice && (
              <p role="status" className="text-[13px] text-emerald-700 font-medium">
                {tx(notice)}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-1/3 py-2.5 border border-[#E3D6B8] text-[#3B2F1E] text-sm font-bold rounded-xl hover:bg-[#EFE3C8] transition-all flex items-center justify-center gap-1"
              >
                <RefreshCw size={12} />
                <span>
                  <T>{"Reset"}</T>
                </span>
              </button>

              <button
                type="button"
                onClick={handleRemoveBg}
                disabled={!imageFile || isProcessing}
                className={`w-2/3 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  imageFile && !isProcessing
                    ? "bg-[#D42020] text-white shadow-sm hover:bg-[#AE1717]"
                    : "bg-[#F3E9D2] text-[#6B5A40] cursor-not-allowed"
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin shrink-0" />
                    <span>
                      {phase === "process" ? (
                        <T>{"Removing background..."}</T>
                      ) : phase === "finish" ? (
                        tx("Cleaning edges...")
                      ) : (
                        downloadLabel
                      )}
                    </span>
                  </>
                ) : (
                  <span>
                    <T>{"Remove background"}</T>
                  </span>
                )}
              </button>
            </div>

            {isProcessing && (
              <>
                {phase === "download" && (
                  <p className="text-[12px] text-[#6B5A40]">
                    {tx(
                      "First time only: the AI model (about 80 MB) is downloaded once and then saved in your browser.",
                    )}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full py-2 text-[13px] font-semibold text-[#6B5A40] hover:text-[#B91C1C] transition-colors"
                >
                  {tx("Cancel")}
                </button>
              </>
            )}

            {processedUrl && !isProcessing && (
              <button
                type="button"
                onClick={handleDownload}
                className="w-full mt-1 py-2.5 bg-[#D42020] hover:bg-[#AE1717] text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download size={14} />
                <span>
                  <T>{"Download Result"}</T>
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Canvas / Preview Area */}
        <div className="lg:col-span-8 bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-sm flex flex-col justify-between min-h-[480px]">
          <div className="flex items-center justify-between border-b border-[#E3D6B8] pb-3">
            <h2 className="text-sm font-bold text-[#3B2F1E]">
              <T>{"Preview"}</T>
            </h2>
            <span className="text-[12px] bg-[#F3E9D2] text-[#6B5A40] font-bold px-2.5 py-1 rounded-full">
              {processedUrl ? (
                <T>{"Processed"}</T>
              ) : imageFile ? (
                tx("Uploaded")
              ) : (
                tx("Empty")
              )}
            </span>
          </div>

          {/* Preview Container (also a drop zone) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`bg-[#F6EEDB] border rounded-2xl p-6 my-4 flex-1 flex flex-col justify-center items-center relative overflow-hidden ${
              isDragging
                ? "border-[#DC2626] ring-2 ring-[#DC2626]/30"
                : "border-[#E3D6B8]"
            }`}
          >
            {processedUrl || previewUrl ? (
              <div
                className="relative max-w-full max-h-[380px] flex items-center justify-center rounded-lg overflow-hidden"
                style={previewBackground}
              >
                <img
                  src={processedUrl || previewUrl!}
                  alt={tx("Cutout Preview")}
                  className="max-h-[380px] max-w-full object-contain transition-all"
                />

                {/* Scan animation while the background is being removed */}
                {isProcessing && (
                  <div className="pointer-events-none absolute inset-0">
                    <style>{`
                      /* transform-only animation: runs on the compositor thread,
                         so it keeps moving even while the main thread is
                         blocked by the model inference. Do NOT animate top/left. */
                      @keyframes rb-scan {
                        0% { transform: translate3d(0, -100%, 0); }
                        100% { transform: translate3d(0, 400%, 0); }
                      }
                      .rb-scan-line {
                        top: 0;
                        height: 25%;
                        will-change: transform;
                        animation: rb-scan 1.6s ease-in-out infinite alternate;
                        background: linear-gradient(
                          to bottom,
                          rgba(220, 38, 38, 0),
                          rgba(220, 38, 38, 0.28)
                        );
                        border-bottom: 2px solid #DC2626;
                        box-shadow: 0 4px 16px rgba(220, 38, 38, 0.32);
                      }
                    `}</style>
                    <div className="absolute inset-0 bg-[#DC2626]/10" />
                    <div className="rb-scan-line absolute left-0 right-0" />
                  </div>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center text-center cursor-pointer p-8 w-full h-full">
                <div className="w-12 h-12 bg-[#F6EEDB] text-[#DC2626] rounded-2xl flex items-center justify-center mb-3 border border-[#E3D6B8]">
                  <ImageIcon size={22} />
                </div>
                <h3 className="text-sm font-bold text-[#3B2F1E] mb-1">
                  <T>{"Add an image to get started\n                "}</T>
                </h3>
                <p className="text-[13px] text-[#6B5A40] max-w-xs">
                  <T>
                    {
                      "The cut-out preview will appear here after processing.\n                "
                    }
                  </T>
                </p>
                <span className="text-[12px] text-[#6B5A40] mt-4 block">
                  <T>
                    {
                      "Or press Ctrl+V to paste a copied image\n                "
                    }
                  </T>
                </span>
                <span className="text-[12px] text-[#6B5A40] mt-1 block">
                  {tx("Or drag and drop an image here")}
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Tools in the same category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-[#3B2F1E]">
          <T>{"Tools in the same category\n        "}</T>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/seba-lagbe-tools/image-size-reducer"
            className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-sm hover:border-[#D8C9A6] transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-[#F6EEDB] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0">
              <ImageIcon size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#3B2F1E] group-hover:text-[#B91C1C] transition-colors">
                <T>{"Image Size Reducer\n              "}</T>
              </h4>
              <p className="text-[12px] text-[#6B5A40] mt-0.5 line-clamp-2">
                <T>
                  {
                    "Shrink JPG, PNG, and WebP photos in your browser — quality stays\n                sharp.\n              "
                  }
                </T>
              </p>
            </div>
          </Link>

          <Link
            href="/seba-lagbe-tools/nid-joiner"
            className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-sm hover:border-[#D8C9A6] transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-[#F6EEDB] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0">
              <CreditCard size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#3B2F1E] group-hover:text-[#B91C1C] transition-colors">
                <T>{"NID Joiner\n              "}</T>
              </h4>
              <p className="text-[12px] text-[#6B5A40] mt-0.5 line-clamp-2">
                <T>
                  {
                    "Turn NID card front and back photos into a clean A4 PDF — all in\n                your browser.\n              "
                  }
                </T>
              </p>
            </div>
          </Link>

          <Link
            href="/seba-lagbe-tools/passport-joiner"
            className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-sm hover:border-[#D8C9A6] transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-[#F6EEDB] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0">
              <BookOpen size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#3B2F1E] group-hover:text-[#B91C1C] transition-colors">
                <T>{"Passport Joiner\n              "}</T>
              </h4>
              <p className="text-[12px] text-[#6B5A40] mt-0.5 line-clamp-2">
                <T>
                  {
                    "Turn passport front and back page photos into a clean A4 PDF —\n                ICAO 88×125 mm layout, all in your browser.\n              "
                  }
                </T>
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
