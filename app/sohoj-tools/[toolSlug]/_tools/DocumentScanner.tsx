"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
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
  X,
  Loader2,
  Columns,
  AlertCircle,
  Palette,
  Sparkles,
  Wand2,
  Check,
  Eye,
  Edit,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import jsPDF from "jspdf";
import {
  enhanceCanvas,
  isEnhanceAbort,
  type EnhanceProgress,
} from "./realEsrganEngine";
import { cleanDocumentCanvas, isCleanAbort } from "./documentClean";
import { colorDocumentCanvas, isColorAbort } from "./colorDocument";
import { detectDocumentCornersCv } from "./documentCorners";
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
const OPENCV_SCRIPT_ID = "opencv-js";
const OPENCV_SCRIPT_URL = "https://docs.opencv.org/4.8.0/opencv.js";
// How long Auto crop waits for OpenCV.js (a few MB) before giving up.
const OPENCV_WAIT_TIMEOUT_MS = 60000;
function injectOpenCvScript(onLoad: () => void, onError: () => void) {
  const script = document.createElement("script");
  script.id = OPENCV_SCRIPT_ID;
  script.src = OPENCV_SCRIPT_URL;
  script.async = true;
  script.onload = onLoad;
  script.onerror = onError;
  document.body.appendChild(script);
}
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;
// The editor works as a CHAIN: every action (Color, Magic Clean, Document
// Clean, Auto crop, Manual crop) is applied on top of the image that is on
// screen right now, exactly once. Nothing is re-processed just because a later
// step happened (e.g. cropping after Magic Clean does NOT run Magic Clean
// again). Each step remembers the state before it, so it can be undone.
// Document Clean is only available after Magic Clean, so it always works on
// the Magic Clean image. It runs fully in the browser (see documentClean.ts).
// `enhance` (Magic Clean) is a pass counter: 0 = off, 1 = applied once,
// 2 = "Again Magic Clean" pressed once more on top of the previous result...
type EffectKey = "color" | "clean" | "enhance";
type Effects = {
  color: boolean;
  clean: boolean;
  enhance: number;
};
type StepKind = EffectKey | "autoCrop" | "manualCrop";
// The state right before a step ran. Restoring it undoes that step.
type Snapshot = {
  original: string; // effect-free image ("Normal" in the compare view)
  processed: string; // image with every effect so far
  effects: Effects;
  bakedRotation: number;
  autoCrop: boolean;
};
type HistoryEntry = {
  step: StepKind;
  prev: Snapshot;
};
const MAX_HISTORY = 8;
const STEP_LABELS: Record<StepKind, string> = {
  color: "Color Document",
  enhance: "Magic Clean",
  clean: "Document Clean",
  autoCrop: "Auto crop",
  manualCrop: "Manual crop",
};
const NO_EFFECTS: Effects = { color: false, clean: false, enhance: 0 };
// Every effect (Color Document, Magic Clean, Document Clean) and both crops run
// in the browser. No image is ever sent to a server for processing.
const ENHANCE_LABEL = "Magic Clean";
// How many times Magic Clean can be stacked with "Again Magic Clean".
const MAX_ENHANCE_PASSES = 3;
// Every pass upscales 2x; keep the result at A4 @300dpi size at most so
// repeated passes do not run the device out of memory.
const MAX_ENHANCE_SIDE = 3508;
const capCanvasSize = (
  canvas: HTMLCanvasElement,
  maxSide: number,
): HTMLCanvasElement => {
  const longest = Math.max(canvas.width, canvas.height);
  if (longest <= maxSide) return canvas;
  const ratio = maxSide / longest;
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(canvas.width * ratio));
  out.height = Math.max(1, Math.round(canvas.height * ratio));
  const ctx = out.getContext("2d");
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
};
const hasAnyEffect = (e: Effects): boolean =>
  e.color || e.clean || e.enhance > 0;

/* -------------------------------------------------------------------------- */
/*            Page-specific natural Bangla translation layer                 */
/* -------------------------------------------------------------------------- */
const DOCUMENT_EXACT: Record<string, string> = {
  "document print": "ডকুমেন্ট প্রিন্ট",
  "document clean": "ডকুমেন্ট পরিষ্কার করুন",
  "color document": "ডকুমেন্টে রঙ দিন",
  "scanned document": "স্ক্যান করা ডকুমেন্ট",
  "remove the last magic clean step.": "সর্বশেষ ম্যাজিক ক্লিন ধাপটি সরান।",
  "this cannot be removed separately after cropping — press undo.":
    "ক্রপ করার পর এটি আলাদাভাবে সরানো যাবে না—পূর্বাবস্থায় ফিরতে আনডু চাপুন।",

  "all kind of documents print ready.":
    "বিভিন্ন ধরনের ডকুমেন্ট প্রিন্টের জন্য প্রস্তুত করুন।",
  print: "প্রিন্ট করুন",
  "pdf download": "PDF ডাউনলোড করুন",
  download: "ডাউনলোড করুন",
  "full reset": "সবকিছু পুনরায় সেট করুন",
  replace: "ছবি পরিবর্তন করুন",
  rotate: "ঘোরান",
  "upload document": "ডকুমেন্ট আপলোড করুন",
  cancel: "বাতিল করুন",
  "saving document...": "ডকুমেন্ট সেভ করা হচ্ছে...",
  "uploading image and saving your record":
    "ছবি আপলোড ও আপনার তথ্য সেভ করা হচ্ছে",
  "reset view": "দৃশ্য পুনরায় সেট করুন",
  "x - use + / − to zoom": "× — + / − দিয়ে জুম করুন",
  crop: "ক্রপ",
  "auto crop": "স্বয়ংক্রিয় ক্রপ",
  "manual crop": "ম্যানুয়াল ক্রপ",
  magic: "ম্যাজিক ক্লিন",
  undo: "পূর্বাবস্থায় ফিরুন",
  mode: "মোড",
  "showing original...": "মূল ছবি দেখানো হচ্ছে...",
  "hold for normal (original)": "মূল ছবি দেখতে চেপে ধরে রাখুন",
  adjustments: "ছবির সমন্বয়",
  reset: "পুনরায় সেট করুন",
  black: "কালচে ভাব",
  color: "রঙ",
  contrast: "কনট্রাস্ট",
  "saved document preview": "সেভ করা ডকুমেন্টের পূর্বরূপ",
  "modify document": "ডকুমেন্ট পরিবর্তন করুন",
  "save current document?": "বর্তমান ডকুমেন্টটি সেভ করবেন?",
  "you can save your current work before switching to another document.":
    "অন্য ডকুমেন্টে যাওয়ার আগে আপনার বর্তমান কাজটি সেভ করে নিতে পারেন।",
  no: "না",
  "saving...": "সেভ করা হচ্ছে...",
  "yes, save": "হ্যাঁ, সেভ করুন",
  "saved documents": "সেভ করা ডকুমেন্ট",
  "saved documents are linked to your account.":
    "সেভ করা ডকুমেন্ট আপনার অ্যাকাউন্টের সঙ্গে যুক্ত থাকে।",
  saved: "সেভ করা হয়েছে",
  "saved documents load হচ্ছে...": "সেভ করা ডকুমেন্ট লোড হচ্ছে...",
  "এখনও কোনো document save করা হয়নি।": "এখনও কোনো ডকুমেন্ট সেভ করা হয়নি।",
  "crop, clean এবং adjustment শেষ করে উপরের save document চাপো।":
    "ক্রপ, পরিষ্কার ও ছবির সমন্বয় শেষ করে উপরের “ডকুমেন্ট সেভ করুন” বোতামে চাপুন।",
  "deleting...": "মুছে ফেলা হচ্ছে...",
  "just now": "এইমাত্র",
  "document clean দিয়ে document আরও সুন্দর ও clean করুন a4 print ready":
    "ডকুমেন্ট ক্লিন ব্যবহার করে ডকুমেন্ট আরও পরিষ্কার করে A4 প্রিন্টের জন্য প্রস্তুত করুন।",
  "download image": "ছবি ডাউনলোড করুন",
  "again magic clean": "ম্যাজিক ক্লিন আবার করুন",
  "magic clean": "ম্যাজিক ক্লিন",
  "magic clean has reached the maximum.":
    "ম্যাজিক ক্লিনের সর্বোচ্চ সীমায় পৌঁছে গেছে।",
  "reset only adjustments": "শুধু ছবির সমন্বয়গুলো পুনরায় সেট করুন",
  "back to tools": "টুলস-এ ফিরে যান",
  "close preview": "পূর্বরূপ বন্ধ করুন",
  "compare original & cleaned": "মূল ছবি ও পরিষ্কার করা ছবির তুলনা করুন",
  "delete saved document": "সেভ করা ডকুমেন্ট মুছুন",
  "next document page": "পরের ডকুমেন্টে যান",
  preview: "পূর্বরূপ",
  "previous document page": "আগের ডকুমেন্টে যান",
  "replace current image with a new file": "বর্তমান ছবির পরিবর্তে নতুন ছবি দিন",
  "reset all edits, crops, and adjustments to original state":
    "সব সম্পাদনা, ক্রপ ও সমন্বয় মূল অবস্থায় ফিরিয়ে দিন",
  "save the current final document to cloudinary and mongodb":
    "বর্তমান চূড়ান্ত ডকুমেন্টটি সেভ করুন",
  thumbnail: "ছবির ক্ষুদ্র পূর্বরূপ",
  "document to print": "প্রিন্ট করার ডকুমেন্ট",
  cleaned: "পরিষ্কার করা ছবি",
  original: "মূল ছবি",
  "finish manual crop first": "আগে ম্যানুয়াল ক্রপ শেষ করুন",
  "rotate document 90°": "ডকুমেন্ট ৯০° ঘোরান",
  "save changes": "পরিবর্তন সেভ করুন",
  "save document": "ডকুমেন্ট সেভ করুন",
  process: "প্রক্রিয়া",
  "processing image...": "ছবি প্রক্রিয়াকরণ করা হচ্ছে...",
  "starting ai engine…": "AI ইঞ্জিন চালু হচ্ছে…",
  "loading opencv… auto crop will start as soon as it is ready.":
    "OpenCV লোড হচ্ছে… প্রস্তুত হলেই স্বয়ংক্রিয় ক্রপ শুরু হবে।",
  "auto crop is running…": "স্বয়ংক্রিয় ক্রপ চলছে…",
  "cleaning document…": "ডকুমেন্ট পরিষ্কার করা হচ্ছে…",
  "coloring document…": "ডকুমেন্টে রঙ প্রয়োগ করা হচ্ছে…",
  "saved.": "সেভ করা হয়েছে।",
};

const DOCUMENT_EXTRA: Record<string, string> = {
  "saved documents could not be loaded. please try again.":
    "সেভ করা ডকুমেন্ট লোড করা যায়নি। আবার চেষ্টা করুন।",
  "there was a problem loading the opencv script.":
    "OpenCV স্ক্রিপ্ট লোড করতে সমস্যা হয়েছে।",
  "document saving was cancelled or timed out. please try again.":
    "ডকুমেন্ট সেভ বাতিল হয়েছে বা সময় শেষ হয়ে গেছে। আবার চেষ্টা করুন।",
  "the document could not be saved. please try again.":
    "ডকুমেন্ট সেভ করা যায়নি। আবার চেষ্টা করুন।",
  "the saved document url could not be found.":
    "সেভ করা ডকুমেন্টের URL পাওয়া যায়নি।",
  "the pdf could not be created. please try again.":
    "PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।",
  "the print preview could not be opened. please try again.":
    "প্রিন্টের পূর্বরূপ খোলা যায়নি। আবার চেষ্টা করুন।",
  "printing failed. please try again.": "প্রিন্ট করা যায়নি। আবার চেষ্টা করুন।",
  "the print preview could not be created. please try again.":
    "প্রিন্টের পূর্বরূপ তৈরি করা যায়নি। আবার চেষ্টা করুন।",
  "the document could not be loaded in the print preview. please try again.":
    "প্রিন্টের পূর্বরূপে ডকুমেন্ট লোড করা যায়নি। আবার চেষ্টা করুন।",
  "the image could not be loaded for editing the saved document.":
    "সেভ করা ডকুমেন্ট এডিট করার জন্য ছবিটি লোড করা যায়নি।",
  "the document could not be deleted. please try again.":
    "ডকুমেন্ট মুছে ফেলা যায়নি। আবার চেষ্টা করুন।",
  "opencv could not be loaded. check your internet connection and try again, or use manual crop.":
    "OpenCV লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন, অথবা ম্যানুয়াল ক্রপ ব্যবহার করুন।",
  "the document edges could not be detected. use manual crop.":
    "ডকুমেন্টের কিনারা শনাক্ত করা যায়নি। ম্যানুয়াল ক্রপ ব্যবহার করুন।",
  "auto crop could not be completed. please try again.":
    "স্বয়ংক্রিয় ক্রপ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।",
  "the ai model could not be loaded. check your internet connection and try again.":
    "AI মডেল লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।",
  "document processing could not be completed. please try again.":
    "ডকুমেন্ট প্রক্রিয়াকরণ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।",
  "the current document has unsaved changes. do you want to discard them and edit the saved document?":
    "বর্তমান ডকুমেন্টে সেভ না করা পরিবর্তন আছে। এগুলো বাদ দিয়ে সেভ করা ডকুমেন্টটি এডিট করতে চান?",
  "updating...": "আপডেট করা হচ্ছে...",
  "save changes": "পরিবর্তন সেভ করুন",
  "save document": "ডকুমেন্ট সেভ করুন",
  delete: "মুছুন",
  view: "দেখুন",
  download: "ডাউনলোড করুন",
  remove: "সরান",
  add: "যোগ করুন",
  close: "বন্ধ করুন",
  "are you sure you want to delete": "আপনি কি এই ডকুমেন্টটি মুছতে চান",
  "use magic clean first, then color document will become available.":
    "আগে ম্যাজিক ক্লিন করুন, তারপর ডকুমেন্টে রঙ দেওয়ার অপশনটি ব্যবহার করা যাবে।",
  "use magic clean first, then document clean will become available.":
    "আগে ম্যাজিক ক্লিন করুন, তারপর ডকুমেন্ট পরিষ্কার করার অপশনটি ব্যবহার করা যাবে।",
  "the image could not be loaded. please try again.":
    "ছবিটি লোড করা যায়নি। আবার চেষ্টা করুন।",
  "the device is out of memory. close other tabs and try again.":
    "ডিভাইসের মেমোরি শেষ হয়ে গেছে। অন্য ট্যাব বন্ধ করে আবার চেষ্টা করুন।",
};

const normalizeDocumentText = (value: string) =>
  value.replace(/\s+/g, " ").trim().toLowerCase();

const translateDocumentText = (
  source: string,
  fallback: (value: string) => string,
  locale: "en" | "bn",
): string => {
  // English must always render the original English source text.
  if (locale === "en") return source;
  const compact = normalizeDocumentText(source);
  if (!compact) return source;

  const exact = DOCUMENT_EXACT[compact] ?? DOCUMENT_EXTRA[compact];
  if (exact) {
    const leading = source.match(/^\s*/)?.[0] ?? "";
    const trailing = source.match(/\s*$/)?.[0] ?? "";
    return `${leading}${exact}${trailing}`;
  }

  let match = compact.match(/^again magic clean$/i);
  if (match)
    return source.replace(/again magic clean/i, "ম্যাজিক ক্লিন আবার করুন");

  match = compact.match(/^magic clean has reached the maximum\.?$/i);
  if (match)
    return source.replace(
      /magic clean has reached the maximum\.?/i,
      "ম্যাজিক ক্লিনের সর্বোচ্চ সীমায় পৌঁছে গেছে।",
    );

  match = source.match(/^Undo:\s*(.+)$/i);
  if (match) {
    const label = match[1].trim();
    const labels: Record<string, string> = {
      "Color Document": "ডকুমেন্টে রঙ দিন",
      "Magic Clean": "ম্যাজিক ক্লিন",
      "Document Clean": "ডকুমেন্ট পরিষ্কার",
      "Auto crop": "স্বয়ংক্রিয় ক্রপ",
      "Manual crop": "ম্যানুয়াল ক্রপ",
    };
    return `পূর্বাবস্থায় ফিরুন: ${labels[label] ?? fallback(label)}`;
  }

  match = source.match(/^Downloading AI model…\s*(\d+)%\s*\(first run\)$/i);
  if (match) return `AI মডেল ডাউনলোড হচ্ছে… ${match[1]}% (প্রথমবার)`;

  match = source.match(/^Magic Clean in progress…\s*(\d+)%$/i);
  if (match) return `ম্যাজিক ক্লিন চলছে… ${match[1]}%`;

  // Common action phrases used in dynamically generated labels/titles.
  match = source.match(/^Remove (.+)$/i);
  if (match)
    return `সরান: ${translateDocumentText(match[1], fallback, locale)}`;

  match = source.match(/^Add (.+)$/i);
  if (match)
    return `যোগ করুন: ${translateDocumentText(match[1], fallback, locale)}`;

  match = source.match(
    /^Use Magic Clean first, then (.+) will become available\.$/i,
  );
  if (match)
    return `আগে ম্যাজিক ক্লিন করুন, তারপর ${match[1]} ব্যবহার করা যাবে।`;

  // Keep unknown backend/file names as-is rather than producing awkward mixed text.
  return fallback(source);
};

function DocumentText({ children }: { children: React.ReactNode }) {
  const { L, locale } = useSohozI18n();
  if (typeof children !== "string") return <>{children}</>;
  return <>{translateDocumentText(children, L, locale)}</>;
}

export default function DocumentScanner() {
  const { L, locale } = useSohozI18n();
  const DL = useCallback(
    (value: string) => translateDocumentText(value, L, locale),
    [L, locale],
  );
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
  const [effects, setEffects] = useState<Effects>(NO_EFFECTS);
  const [activeStage, setActiveStage] = useState<EffectKey | null>(null);
  const [blackness, setBlackness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [bakedRotation, setBakedRotation] = useState<number>(0);
  const [manualCropSourceSrc, setManualCropSourceSrc] = useState<string>("");
  // Effect-free twin of manualCropSourceSrc, cropped with the same corners.
  const [manualCropOriginalSrc, setManualCropOriginalSrc] =
    useState<string>("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
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
  const [cropReady, setCropReady] = useState<boolean>(false);
  // "Busy" flag for every canvas job (Color Document, Magic Clean, Document
  // Clean, Auto crop): disables the buttons and shows the overlay.
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isWaitingForOpenCv, setIsWaitingForOpenCv] = useState<boolean>(false);
  const [isAutoCropping, setIsAutoCropping] = useState<boolean>(false);
  // Only carries the Magic Clean progress text / percent.
  const [enhanceProgress, setEnhanceProgress] =
    useState<EnhanceProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const processingIdRef = useRef<number>(0);
  const openCvFailedRef = useRef<boolean>(false);
  const enhanceAbortRef = useRef<AbortController | null>(null);
  const cloudinarySaveRequestRef = useRef<AbortController | null>(null);
  const createdBlobUrlsRef = useRef<Set<string>>(new Set());
  useEffect(() => () => enhanceAbortRef.current?.abort(), []);
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
  // Stops the running canvas job (if any).
  const cancelActiveProcessing = useCallback(() => {
    enhanceAbortRef.current?.abort();
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
      setErrorMessage("Saved documents could not be loaded. Please try again.");
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
      cloudinarySaveRequestRef.current?.abort();
      cloudinarySaveRequestRef.current = null;
      createdBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      createdBlobUrlsRef.current.clear();
    };
  }, []);
  useEffect(() => {
    let active = true;
    processingIdRef.current += 1;
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    enhanceAbortRef.current?.abort();
    setIsProcessing(false);
    setErrorMessage(null);
    setRotation(0);
    setBakedRotation(0);
    setEffects(NO_EFFECTS);
    setHistory([]);
    setManualCropOriginalSrc("");
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
        setErrorMessage("The image could not be loaded. Please try again.");
      });
    return () => {
      active = false;
    };
  }, [
    selectedIndex,
    selectedImageSrc,
    loadImage,
    createRotatedCanvas,
    cancelActiveProcessing,
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
  // Starts downloading OpenCV.js as soon as the page opens, so it is usually
  // ready by the time Auto crop / Manual crop is used.
  useEffect(() => {
    if (window.cv && window.cv.Mat) return;
    if (document.getElementById(OPENCV_SCRIPT_ID)) return;
    openCvFailedRef.current = false;
    injectOpenCvScript(
      () => undefined,
      () => {
        openCvFailedRef.current = true;
        setErrorMessage("There was a problem loading the OpenCV script.");
      },
    );
  }, []);
  // Auto crop never falls back to a server: if OpenCV.js is still loading, we
  // show the loading state and continue as soon as it is ready.
  const ensureOpenCvReady = useCallback(
    async (signal: AbortSignal): Promise<boolean> => {
      const isReady = () => !!(window.cv && window.cv.Mat);
      if (isReady()) return true;
      setIsWaitingForOpenCv(true);
      try {
        if (openCvFailedRef.current) {
          // The first download failed: try once more.
          document.getElementById(OPENCV_SCRIPT_ID)?.remove();
          openCvFailedRef.current = false;
          injectOpenCvScript(
            () => undefined,
            () => {
              openCvFailedRef.current = true;
            },
          );
        }
        const startedAt = Date.now();
        while (!isReady()) {
          if (signal.aborted) return false;
          if (
            openCvFailedRef.current ||
            Date.now() - startedAt > OPENCV_WAIT_TIMEOUT_MS
          ) {
            return false;
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return true;
      } finally {
        setIsWaitingForOpenCv(false);
      }
    },
    [],
  );
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
    cancelActiveProcessing();
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
      setEffects(NO_EFFECTS);
      setHistory([]);
      setManualCropOriginalSrc("");
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
      setIsProcessing(false);
      setHasUnsavedChanges(false);
    }
  };
  // Core warp: `imagePoints` are already in pixel coordinates of sourceCanvas.
  const warpByImagePoints = useCallback(
    (
      sourceCanvas: HTMLCanvasElement,
      imagePoints: Point[],
      maxOutputSize: number = 2500,
    ): HTMLCanvasElement | null => {
      if (!window.cv || !window.cv.Mat || imagePoints.length !== 4) return null;
      const cv = window.cv;
      let src: any = null;
      let srcTri: any = null;
      let dstTri: any = null;
      let matrix: any = null;
      let warped: any = null;
      try {
        src = cv.imread(sourceCanvas);
        const ordered = orderPoints(imagePoints);
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
    [orderPoints],
  );
  // Warp using corner handles that live in UI (container %) coordinates.
  const applyPerspectiveWarp = useCallback(
    (
      sourceCanvas: HTMLCanvasElement,
      uiCorners: Point[],
      maxOutputSize: number = 2500,
    ): HTMLCanvasElement | null => {
      if (uiCorners.length !== 4) return null;
      return warpByImagePoints(
        sourceCanvas,
        uiPointsToImage(uiCorners, sourceCanvas.width, sourceCanvas.height),
        maxOutputSize,
      );
    },
    [warpByImagePoints, uiPointsToImage],
  );
  /**
   * Finds the document corners in the browser with OpenCV.js (see
   * documentCorners.ts). Returns 0..1 fractions of the image so the corners
   * fit an image of ANY size (e.g. the 2x Magic Clean image).
   */
  const detectDocumentCorners = useCallback(
    (source: HTMLCanvasElement): Point[] | null =>
      detectDocumentCornersCv(window.cv, source),
    [],
  );
  useEffect(() => {
    if (!isManualCropping || !selectedImageSrc) return;
    let active = true;
    const currentProcessingId = ++processingIdRef.current;
    const sourceSrc = manualCropSourceSrc || selectedImageSrc;
    const originalSrc = manualCropOriginalSrc || sourceSrc;
    const sourceBakedRotation = manualCropSourceSrc
      ? manualCropSourceBakedRotation
      : 0;
    loadImage(sourceSrc)
      .then(async (img) => {
        if (!active || currentProcessingId !== processingIdRef.current) return;
        const angle = normalizeAngle(rotation - sourceBakedRotation);
        const displayCanvas = createRotatedCanvas(img, angle);
        setUncroppedSrc(displayCanvas.toDataURL("image/png"));
        if (!cropReady || debouncedCorners.length !== 4) return;
        // Effects are already baked into the source, so allow the larger size.
        const warpedCanvas = applyPerspectiveWarp(
          displayCanvas,
          debouncedCorners,
          MAX_ENHANCE_SIDE,
        );
        if (
          !warpedCanvas ||
          !active ||
          currentProcessingId !== processingIdRef.current
        ) {
          return;
        }
        const cropUrl = warpedCanvas.toDataURL("image/png");
        let originalCropUrl = cropUrl;
        // Crop the effect-free "Normal" twin with the same corners so the
        // compare / hold view stays aligned.
        if (originalSrc !== sourceSrc) {
          try {
            const originalImg = await loadImage(originalSrc);
            if (!active || currentProcessingId !== processingIdRef.current)
              return;
            const originalCanvas = createRotatedCanvas(originalImg, angle);
            const sameShape =
              Math.abs(
                originalCanvas.width / originalCanvas.height -
                  displayCanvas.width / displayCanvas.height,
              ) < 0.02;
            const warpedOriginal = sameShape
              ? applyPerspectiveWarp(
                  originalCanvas,
                  debouncedCorners,
                  MAX_ENHANCE_SIDE,
                )
              : null;
            if (warpedOriginal)
              originalCropUrl = warpedOriginal.toDataURL("image/png");
          } catch (error) {
            console.error("Manual crop original preview failed:", error);
          }
        }
        if (!active || currentProcessingId !== processingIdRef.current) return;
        setCroppedOriginalSrc(originalCropUrl);
        setCleanBaseSrc(cropUrl);
        setRotatedOriginalSrc(originalCropUrl);
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
    manualCropOriginalSrc,
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
      isProcessing ||
      isManualCropping ||
      isSavingDocument
    )
      return;
    cancelActiveProcessing();
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
        isProcessing ||
        isManualCropping ||
        isSavingDocument ||
        index < 0 ||
        index >= images.length ||
        index === selectedIndex
      ) {
        return;
      }
      cancelActiveProcessing();
      cancelCloudinarySaveRequest();
      processingIdRef.current += 1;
      setDraggingCorner(null);
      setPendingNavigationIndex(null);
      setEditingSavedDocumentId(null);
      setSelectedIndex(index);
    },
    [
      images.length,
      isProcessing,
      isManualCropping,
      isSavingDocument,
      selectedIndex,
      cancelActiveProcessing,
      cancelCloudinarySaveRequest,
    ],
  );
  const requestPageNavigation = useCallback(
    (index: number) => {
      if (
        images.length === 0 ||
        isProcessing ||
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
      isProcessing,
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
      isProcessing ||
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
      const title = `Document ${String(savedDocumentCounterRef.current).padStart(2, "0")}`;
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
          "Document saving was cancelled or timed out. Please try again.",
        );
      } else {
        console.error("Failed to save/update document:", error);
        setErrorMessage("The document could not be saved. Please try again.");
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
      setErrorMessage("The saved document URL could not be found.");
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
    if (!imageSrc || isProcessing || isSavingDocument) {
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
      setErrorMessage("The PDF could not be created. Please try again.");
    }
  };
  const handleDownloadPDF = async () => {
    await handleDownloadPDFForSource(processedImageSrc, "scanned-document.pdf");
  };
  const handlePrintSource = (imageSrc: string) => {
    if (!imageSrc || isProcessing || isSavingDocument) {
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
        setErrorMessage(
          "The print preview could not be opened. Please try again.",
        );
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
          setErrorMessage("Printing failed. Please try again.");
        }
      }, 50);
    };
    document.body.appendChild(printFrame);
    const printDocument = printFrame.contentDocument;
    if (!printDocument) {
      cleanup();
      setErrorMessage(
        "The print preview could not be created. Please try again.",
      );
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
    image.alt = DL("Document to print");
    image.src = imageSrc;
    image.onload = triggerPrint;
    image.onerror = () => {
      cleanup();
      setErrorMessage(
        "The document could not be loaded in the print preview. Please try again.",
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
    if (isProcessing || isSavingDocument || deletingSavedDocumentId) {
      return;
    }
    if (hasUnsavedChanges) {
      const proceed = window.confirm(
        DL(
          "The current document has unsaved changes. Do you want to discard them and edit the saved document?",
        ),
      );
      if (!proceed) return;
    }
    cancelActiveProcessing();
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
    setIsProcessing(false);
    setErrorMessage(null);
    setRotation(0);
    setBakedRotation(0);
    setEffects(NO_EFFECTS);
    setHistory([]);
    setManualCropOriginalSrc("");
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
      setErrorMessage(
        "The image could not be loaded for editing the saved document.",
      );
    }
  };
  const handleOpenSavedPreview = (savedDocument: SavedDocument) => {
    if (!savedDocument.src) {
      setErrorMessage("The saved document URL could not be found.");
      return;
    }
    setPreviewSavedDocument(savedDocument);
  };
  const handleRemoveSavedDocument = async (savedDocument: SavedDocument) => {
    if (!savedDocument?.id || deletingSavedDocumentId) return;
    const shouldDelete = window.confirm(
      `${DL("Are you sure you want to delete")} ${savedDocument.name}?`,
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
      setErrorMessage("The document could not be deleted. Please try again.");
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
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    processingIdRef.current += 1;
    const src = selectedImageSrc;
    setBlackness(0);
    setContrast(0);
    setBrightness(0);
    setEffects(NO_EFFECTS);
    setHistory([]);
    setManualCropOriginalSrc("");
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
  const describeEffectError = (error: unknown): string => {
    const message = error instanceof Error ? error.message : "";
    return /MODEL_FETCH_FAILED|failed to fetch|network/i.test(message)
      ? "The AI model could not be loaded. Check your internet connection and try again."
      : /memory|allocate|RangeError/i.test(message)
        ? "The device is out of memory. Close other tabs and try again."
        : "Document processing could not be completed. Please try again.";
  };
  const canChangeImage = (): boolean =>
    !!selectedImageSrc &&
    !!cleanBaseSrc &&
    !isProcessing &&
    !isManualCropping &&
    !isSavingDocument;
  // ---- history (undo) -------------------------------------------------------
  const takeSnapshot = (): Snapshot => ({
    original: croppedOriginalSrc || selectedImageSrc,
    processed: cleanBaseSrc,
    effects,
    bakedRotation,
    autoCrop,
  });
  const pushHistory = (step: StepKind) => {
    const entry: HistoryEntry = { step, prev: takeSnapshot() };
    setHistory((prev) => [...prev, entry].slice(-MAX_HISTORY));
  };
  // Index of the newest history entry for this effect, or -1 when it cannot
  // be removed any more (a crop happened after it, or it is not applied).
  const findEffectUndoIndex = (stage: EffectKey): number => {
    for (let i = history.length - 1; i >= 0; i--) {
      const step = history[i].step;
      if (step === stage) return i;
      if (step === "autoCrop" || step === "manualCrop") return -1;
    }
    return -1;
  };
  // Go back to the state before history[index] (and drop everything after it).
  const undoTo = (index: number) => {
    const entry = history[index];
    if (!entry || !canChangeImage()) return;
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    processingIdRef.current += 1;
    setErrorMessage(null);
    setCroppedOriginalSrc(entry.prev.original);
    setRotatedOriginalSrc(entry.prev.original);
    setCleanBaseSrc(entry.prev.processed);
    setEffects(entry.prev.effects);
    setBakedRotation(entry.prev.bakedRotation);
    setAutoCrop(entry.prev.autoCrop);
    setHasUnsavedChanges(true);
    setHistory((prev) => prev.slice(0, index));
  };
  const handleUndoLast = () => undoTo(history.length - 1);
  const handleUndoEffect = (stage: EffectKey) => {
    const index = findEffectUndoIndex(stage);
    if (index >= 0) undoTo(index);
  };
  // ---- effects ------------------------------------------------------------
  /**
   * Applies ONE effect step on top of the image that is on screen now.
   * (Magic Clean pressed again = one more pass on the previous result.)
   */
  const applyEffectStep = async (stage: EffectKey) => {
    if (!canChangeImage()) return;
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    enhanceAbortRef.current?.abort();
    const currentProcessingId = ++processingIdRef.current;
    const controller = new AbortController();
    enhanceAbortRef.current = controller;
    const rotationAtStart = rotation;
    const pendingRotation = normalizeAngle(rotation - bakedRotation);
    const isStale = () =>
      controller.signal.aborted ||
      currentProcessingId !== processingIdRef.current;
    try {
      setErrorMessage(null);
      setActiveStage(stage);
      setIsProcessing(true);
      // Input = what the person sees now (all earlier steps included).
      const inputImg = await loadImage(cleanBaseSrc);
      if (isStale()) return;
      const input = createRotatedCanvas(inputImg, pendingRotation);
      let stageSrc: string;
      if (stage === "enhance") {
        setEnhanceProgress({ stage: "load", percent: 0 });
        const enhanced = await enhanceCanvas(input, {
          scale: 2,
          signal: controller.signal,
          onProgress: (progress) => {
            if (!isStale()) setEnhanceProgress(progress);
          },
        });
        if (isStale()) return;
        setEnhanceProgress(null);
        stageSrc = capCanvasSize(enhanced, MAX_ENHANCE_SIDE).toDataURL(
          "image/png",
        );
      } else if (stage === "clean") {
        // Client-side shadow / background clean + text sharpening.
        const cleaned = await cleanDocumentCanvas(input, {
          signal: controller.signal,
        });
        if (isStale()) return;
        stageSrc = cleaned.toDataURL("image/png");
      } else {
        // Color Document: client-side shadow removal + colour boost.
        const colored = await colorDocumentCanvas(input, {
          signal: controller.signal,
        });
        if (isStale()) return;
        stageSrc = colored.toDataURL("image/png");
      }
      // The effect-free twin only gets the pending rotation baked in.
      let originalSrc = croppedOriginalSrc || selectedImageSrc;
      if (pendingRotation !== 0) {
        const originalImg = await loadImage(originalSrc);
        originalSrc = createRotatedCanvas(
          originalImg,
          pendingRotation,
        ).toDataURL("image/png");
      }
      if (isStale()) return;
      pushHistory(stage);
      setEffects({
        ...effects,
        color: stage === "color" ? true : effects.color,
        clean: stage === "clean" ? true : effects.clean,
        enhance:
          stage === "enhance"
            ? Math.min(MAX_ENHANCE_PASSES, effects.enhance + 1)
            : effects.enhance,
      });
      setHasUnsavedChanges(true);
      setCroppedOriginalSrc(originalSrc);
      setRotatedOriginalSrc(originalSrc);
      setCleanBaseSrc(stageSrc);
      setBakedRotation(rotationAtStart);
    } catch (error) {
      if (
        isEnhanceAbort(error) ||
        isCleanAbort(error) ||
        isColorAbort(error) ||
        currentProcessingId !== processingIdRef.current
      )
        return;
      console.error("Applying effect failed:", error);
      setErrorMessage(describeEffectError(error));
    } finally {
      if (enhanceAbortRef.current === controller) {
        enhanceAbortRef.current = null;
        setIsProcessing(false);
        setEnhanceProgress(null);
        setActiveStage(null);
      }
    }
  };
  const handleApplyEffect = (stage: EffectKey) => {
    if (!canChangeImage()) return;
    // Already applied -> never run it a second time by accident.
    if (stage === "color" && effects.color) return;
    if (stage === "clean" && effects.clean) return;
    // Document Clean needs a Magic Clean image first.
    if (stage === "clean" && effects.enhance === 0) return;
    if (stage === "enhance" && effects.enhance >= MAX_ENHANCE_PASSES) return;
    void applyEffectStep(stage);
  };
  // ---- crop -----------------------------------------------------------------
  const handleTriggerAutoCrop = async () => {
    if (!canChangeImage()) return;
    // The current image was already auto-cropped and nothing changed since:
    // there is nothing left to crop.
    if (autoCrop && history[history.length - 1]?.step === "autoCrop") return;
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    enhanceAbortRef.current?.abort();
    const currentProcessingId = ++processingIdRef.current;
    const controller = new AbortController();
    enhanceAbortRef.current = controller;
    const rotationAtStart = rotation;
    const pendingRotation = normalizeAngle(rotation - bakedRotation);
    const hasEffects = hasAnyEffect(effects);
    const isStale = () =>
      controller.signal.aborted ||
      currentProcessingId !== processingIdRef.current;
    setIsManualCropping(false);
    setCropReady(false);
    resetCorners();
    setErrorMessage(null);
    setActiveStage(null);
    try {
      setIsProcessing(true);
      setIsAutoCropping(true);
      // OpenCV.js can take a moment on the first visit: show the loading
      // state and carry on as soon as it is ready (never a server call).
      const cvReady = await ensureOpenCvReady(controller.signal);
      if (isStale()) return;
      if (!cvReady) {
        setErrorMessage(
          "OpenCV could not be loaded. Check your internet connection and try again, or use Manual crop.",
        );
        return;
      }
      // Let the loading overlay paint before the heavy work starts.
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (isStale()) return;
      // Crop exactly what is on screen (Magic Clean etc. stay as they are).
      const processedImg = await loadImage(cleanBaseSrc);
      if (isStale()) return;
      const processedCanvas = createRotatedCanvas(
        processedImg,
        pendingRotation,
      );
      let originalCanvas: HTMLCanvasElement | null = null;
      let sameShape = false;
      if (hasEffects) {
        const originalImg = await loadImage(
          croppedOriginalSrc || selectedImageSrc,
        );
        if (isStale()) return;
        originalCanvas = createRotatedCanvas(originalImg, pendingRotation);
        sameShape =
          Math.abs(
            originalCanvas.width / originalCanvas.height -
              processedCanvas.width / processedCanvas.height,
          ) < 0.02;
      }
      // With effects on, the corners are found on the effect-free twin (a
      // plain photo) and applied to BOTH images.
      const corners = detectDocumentCorners(
        originalCanvas && sameShape ? originalCanvas : processedCanvas,
      );
      if (!corners) {
        setErrorMessage(
          "The document edges could not be detected. Use Manual crop.",
        );
        return;
      }
      const toPixels = (c: HTMLCanvasElement): Point[] =>
        corners.map((pt) => ({ x: pt.x * c.width, y: pt.y * c.height }));
      const processedCrop = warpByImagePoints(
        processedCanvas,
        toPixels(processedCanvas),
        MAX_ENHANCE_SIDE,
      );
      if (!processedCrop) throw new Error("Crop warp failed");
      const croppedProcessed = processedCrop.toDataURL("image/png");
      let croppedOriginal = croppedProcessed;
      if (originalCanvas && sameShape) {
        const originalCrop = warpByImagePoints(
          originalCanvas,
          toPixels(originalCanvas),
        );
        if (originalCrop) {
          croppedOriginal = originalCrop.toDataURL("image/png");
        }
      }
      if (isStale()) return;
      pushHistory("autoCrop");
      setHasUnsavedChanges(true);
      setCroppedOriginalSrc(croppedOriginal);
      setRotatedOriginalSrc(croppedOriginal);
      setCleanBaseSrc(croppedProcessed);
      setBakedRotation(rotationAtStart);
      setAutoCrop(true);
      setIsManualCropping(false);
    } catch (error) {
      if (currentProcessingId !== processingIdRef.current) return;
      console.error("Auto crop failed:", error);
      setErrorMessage("Auto crop could not be completed. Please try again.");
    } finally {
      setIsAutoCropping(false);
      if (enhanceAbortRef.current === controller) {
        enhanceAbortRef.current = null;
        setIsProcessing(false);
        setEnhanceProgress(null);
        setActiveStage(null);
      }
    }
  };
  const handleTriggerManualCrop = () => {
    if (!selectedImageSrc || !cleanBaseSrc || isProcessing || isSavingDocument)
      return;
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    processingIdRef.current += 1;
    if (isManualCropping) {
      setIsManualCropping(false);
      setManualCropSourceSrc("");
      setManualCropOriginalSrc("");
      setHasUnsavedChanges(true);
      // The crop preview already works on the finished (Magic Clean etc.)
      // image, so nothing has to be re-applied. If the corners were never
      // moved, the step that was recorded when cropping started is dropped.
      if (!cropReady) setHistory((prev) => prev.slice(0, -1));
      return;
    }
    // Crop the image that is on screen now, effects included.
    pushHistory("manualCrop");
    setAutoCrop(false);
    setCropReady(false);
    resetCorners();
    setManualCropSourceSrc(cleanBaseSrc || selectedImageSrc);
    setManualCropOriginalSrc(croppedOriginalSrc || selectedImageSrc);
    setManualCropSourceBakedRotation(bakedRotation);
    setIsManualCropping(true);
  };
  const renderEffectRow = (
    key: "color" | "clean",
    label: string,
    icon: React.ReactNode,
  ) => {
    const active = effects[key];
    const busy =
      isProcessing ||
      images.length === 0 ||
      !cleanBaseSrc ||
      isSavingDocument ||
      isManualCropping;
    // Document Clean stays locked until Magic Clean has been applied.
    const waitingForMagic = key === "clean" && effects.enhance === 0;
    const canRemove = findEffectUndoIndex(key) >= 0;
    return (
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => handleApplyEffect(key)}
          disabled={busy || waitingForMagic}
          aria-pressed={active}
          title={
            waitingForMagic
              ? DL(
                  `Use ${ENHANCE_LABEL} first, then ${label} will become available.`,
                )
              : undefined
          }
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${active ? "bg-[#DC2626] text-white" : "bg-[#F6EEDB] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
        >
          {active ? <Check size={14} /> : icon}
          {DL(label)}
        </button>

        <button
          type="button"
          onClick={() =>
            active ? handleUndoEffect(key) : handleApplyEffect(key)
          }
          disabled={busy || (active ? !canRemove : waitingForMagic)}
          title={
            active
              ? canRemove
                ? DL(`Remove ${label}`)
                : DL(
                    "This cannot be removed separately after cropping — press Undo.",
                  )
              : DL(`Add ${label}`)
          }
          aria-label={active ? DL(`Remove ${label}`) : DL(`Add ${label}`)}
          className={`w-9 shrink-0 flex items-center justify-center rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${active ? "bg-[#FBF6E8] border-[#FBB6B6] text-[#B91C1C] hover:bg-[#FEE9E9]" : "bg-[#FBF6E8] border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
        >
          {active ? <Minus size={14} /> : <Plus size={14} />}
        </button>
      </div>
    );
  };
  const renderMagicCleanRow = () => {
    const passes = effects.enhance;
    const active = passes > 0;
    const atMax = passes >= MAX_ENHANCE_PASSES;
    const canRemove = findEffectUndoIndex("enhance") >= 0;
    const busy =
      isProcessing ||
      images.length === 0 ||
      !cleanBaseSrc ||
      isSavingDocument ||
      isManualCropping;
    return (
      <div className="space-y-2">
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => {
              if (!active) handleApplyEffect("enhance");
            }}
            disabled={busy}
            aria-pressed={active}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${active ? "bg-[#DC2626] text-white" : "bg-[#F6EEDB] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
          >
            {active ? <Check size={14} /> : <Sparkles size={14} />}
            {DL(ENHANCE_LABEL)}
            {passes > 1 && (
              <span className="px-1.5 py-0.5 rounded-md bg-[#FBF6E8]/25 text-[12px] font-bold">
                <DocumentText>{"\u00D7"}</DocumentText>
                {passes}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              active
                ? handleUndoEffect("enhance")
                : handleApplyEffect("enhance")
            }
            disabled={busy || (active && !canRemove)}
            title={
              active
                ? canRemove
                  ? DL("Remove the last Magic Clean step.")
                  : DL(
                      "This cannot be removed separately after cropping — press Undo.",
                    )
                : DL(`Add ${ENHANCE_LABEL}`)
            }
            aria-label={
              active
                ? DL(`Remove ${ENHANCE_LABEL}`)
                : DL(`Add ${ENHANCE_LABEL}`)
            }
            className={`w-9 shrink-0 flex items-center justify-center rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${active ? "bg-[#FBF6E8] border-[#FBB6B6] text-[#B91C1C] hover:bg-[#FEE9E9]" : "bg-[#FBF6E8] border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
          >
            {active ? <Minus size={14} /> : <Plus size={14} />}
          </button>
        </div>

        {active && (
          <button
            type="button"
            onClick={() => handleApplyEffect("enhance")}
            disabled={busy || atMax}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer bg-[#D42020] border border-[#DC2626] text-white hover:bg-[#AE1717] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCw size={14} />
            {atMax ? (
              <DocumentText>{`${ENHANCE_LABEL} has reached the maximum.`}</DocumentText>
            ) : (
              <DocumentText>{`Again ${ENHANCE_LABEL}`}</DocumentText>
            )}
          </button>
        )}
      </div>
    );
  };
  return (
    <div className="page-font scanner-page relative isolate w-full min-h-screen bg-transparent text-[#3B2F1E] font-sans p-3 sm:p-4 lg:p-6 select-none flex flex-col justify-between">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* Keep the warm sand page background visible across the entire viewport,
           including gutters outside the app-shell's centered content column. */
        html:has(.page-font),
        body:has(.page-font) {
          min-height: 100%;
          background-color: #EFE5CE !important;
          background-image: linear-gradient(to bottom, #E9DDC3, #EFE5CE) !important;
          background-attachment: fixed;
        }

        /* Some app shells paint a cool-gray background behind page content.
           Make only the ancestors of this page transparent so the sand canvas
           shows through; individual cards and the navbar keep their own surfaces. */
        body:has(.page-font) > div,
        body:has(.page-font) :is(main, section, article, div):has(.page-font) {
          background: transparent !important;
        }

        .page-font.page-font,
        .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali",
            ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          line-height: 1.45;
        }

        .page-font h1,
        .page-font h2,
        .page-font h3,
        .page-font h4 {
          letter-spacing: -0.01em;
        }

        .page-font p {
          line-height: 1.7;
        }

        .page-font button {
          font-size: max(15px, 1em);
          transition:
            color 180ms ease,
            background-color 180ms ease,
            border-color 180ms ease,
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .page-font button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .page-font button:not(:disabled):active,
        .page-font [role="button"]:active {
          transform: scale(0.98);
        }

        .page-font button:hover:not(:disabled) {
          border-color: #FBB6B6;
        }

        .page-font button:not([class*="bg-[#DC2626]"]):not([class*="bg-[#D42020]"]):not([class*="bg-emerald"]):hover:not(:disabled) {
          color: #B91C1C;
        }

        .page-font .group {
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .page-font .group:hover {
          transform: translateY(-2px);
          box-shadow: 0 1px 4px rgba(59, 47, 30, 0.12);
        }

        .page-font div[class*="cursor-pointer"]:hover {
          transform: translateY(-1px);
          box-shadow: 0 1px 4px rgba(59, 47, 30, 0.12);
        }

        .page-font button[class*="bg-[#DC2626]"]:hover:not(:disabled) {
          background-color: #B91C1C;
        }

        .page-font button[class*="bg-[#DC2626]"]:active:not(:disabled) {
          background-color: #991B1B;
        }

        .page-font button[class*="bg-[#FBF6E8]"],
        .page-font button[class*="bg-[#F6EEDB]"],
        .page-font button[class*="bg-[#F3E9D2]"] {
          color: #B91C1C;
          border-color: #FBB6B6;
        }

        .page-font button[class*="bg-[#FBF6E8]"]:hover:not(:disabled),
        .page-font button[class*="bg-[#F6EEDB]"]:hover:not(:disabled),
        .page-font button[class*="bg-[#F3E9D2]"]:hover:not(:disabled) {
          background-color: #FEE9E9;
        }

        .page-font button[aria-pressed="true"] {
          background-color: #F6D9A8;
          color: #B91C1C;
          border-color: #DC2626;
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.4);
        }

        .page-font div[class*="ring-[#DC2626]/40"]::after {
          content: "✓";
          position: absolute;
          top: 3px;
          right: 3px;
          z-index: 31;
          display: flex;
          width: 16px;
          height: 16px;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: #DC2626;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
          pointer-events: none;
        }

        .page-font div[class*="ring-[#DC2626]/40"] > button {
          top: auto;
          right: 3px;
          bottom: 3px;
        }

        .page-font :is(a, button, label, [role="button"], input, select, textarea):focus-visible {
          outline: 2px solid #DC2626;
          outline-offset: 2px;
        }

        .page-font a {
          color: #B91C1C;
          transition: color 180ms ease;
        }

        .page-font a:hover {
          color: #991B1B;
        }

        .page-font input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]),
        .page-font select,
        .page-font textarea {
          background-color: #FBF6E8;
          border-color: #E3D6B8;
          color: #3B2F1E;
          font-size: max(15px, 1em);
        }

        .page-font input::placeholder,
        .page-font textarea::placeholder {
          color: #B0A080;
        }

        .page-font .scroll {
          scrollbar-width: thin;
          scrollbar-color: #F87171 transparent;
        }

        .page-font .scroll::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        .page-font .scroll::-webkit-scrollbar-track {
          background: rgba(216, 201, 166, 0.32);
          border-radius: 999px;
          margin: 10px 0;
        }

        .page-font .scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #F87171, #DC2626);
          border-radius: 999px;
          border: 3px solid #F2E8D2;
          min-height: 48px;
        }

        .page-font .scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #EF4444, #B91C1C);
        }

        /* Desktop fit mode: keep the scanner, all editing controls, saved area,
           and helper note visible inside one viewport without page scrolling. */
        @media (min-width: 1280px) and (min-height: 720px) {
          html:has(.scanner-page),
          body:has(.scanner-page) {
            height: 100%;
            overflow: hidden;
          }

          .scanner-page {
            box-sizing: border-box;
            width: 100vw !important;
            max-width: 100vw !important;
            /* The fixed site navbar is 60px tall; use the remaining viewport. */
            height: calc(100dvh - 60px);
            max-height: calc(100dvh - 60px);
            min-height: 0 !important;
            margin-left: calc(50% - 50vw);
            padding: 8px 16px !important;
            gap: 8px !important;
            justify-content: flex-start !important;
            overflow: hidden;
          }

          .scanner-main-content {
            width: 100%;
            max-width: 1540px;
            min-width: 0;
            min-height: 0;
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 0 auto;
          }

          .scanner-page-header {
            flex: 0 0 auto;
            min-height: 48px;
            margin-bottom: 0 !important;
            gap: 8px !important;
          }

          .scanner-workspace {
            flex: 1 1 auto;
            min-height: 0 !important;
            align-items: stretch !important;
            gap: 10px !important;
          }

          .scanner-workspace-panel {
            min-width: 0;
            min-height: 0 !important;
            height: 100%;
            padding: 10px !important;
            justify-content: space-between;
          }

          .scanner-workspace-inner {
            min-height: 0;
            gap: 10px !important;
          }

          .scanner-preview-canvas {
            min-height: 0 !important;
            height: auto;
            padding: 8px !important;
          }

          .scanner-paper-frame {
            width: auto !important;
            height: 100% !important;
            max-height: min(100%, 420px) !important;
            max-width: 100% !important;
            flex: 0 1 auto;
          }

          .scanner-tools-sidebar {
            width: 480px !important;
            min-width: 0;
            min-height: 0;
            flex: 0 0 480px;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            align-content: start;
            gap: 8px !important;
          }

          .scanner-tool-card {
            min-width: 0;
            padding: 9px !important;
            gap: 7px !important;
            border-radius: 14px !important;
          }

          .scanner-tool-card .space-y-2 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 5px !important;
          }

          .scanner-tool-card .space-y-3 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 6px !important;
          }

          .scanner-tool-card button {
            padding-top: 5px !important;
            padding-bottom: 5px !important;
          }

          .scanner-adjustments-card {
            grid-column: auto !important;
          }

          .scanner-adjustments-card > .space-y-3 {
            gap: 6px !important;
          }

          .scanner-saved-section {
            width: 100%;
            max-width: 1540px;
            box-sizing: border-box;
            /* Keep the title and the full empty-state / saved-document row visible. */
            flex: 0 0 138px;
            height: 138px;
            max-height: 138px;
            min-height: 0;
            overflow: hidden;
            margin: 0 auto !important;
            padding: 7px 10px !important;
          }

          .scanner-saved-section > div:first-child {
            margin-bottom: 4px !important;
            gap: 8px !important;
          }

          .scanner-saved-section h2 {
            font-size: 14px !important;
            line-height: 1.2 !important;
          }

          .scanner-saved-section > div:first-child p {
            font-size: 12px !important;
            line-height: 1.2 !important;
            margin-top: 2px !important;
          }

          .scanner-saved-section > div:nth-child(2),
          .scanner-saved-section > div:nth-child(3) {
            padding: 7px !important;
          }

          .scanner-saved-section .grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 6px !important;
            max-height: 74px;
            overflow: auto;
          }

          .scanner-saved-section .grid > div {
            display: grid;
            grid-template-columns: 44px minmax(0, 1fr);
            align-items: center;
            gap: 6px;
            min-width: 0;
          }

          .scanner-saved-section .grid > div > div:first-child {
            height: 42px;
            min-height: 42px;
            aspect-ratio: auto;
            border: 0;
            border-radius: 6px;
          }

          .scanner-saved-section .grid > div > div:last-child {
            min-width: 0;
            padding: 0 !important;
          }

          .scanner-saved-section .grid > div > div:last-child > div:last-child {
            margin-top: 3px !important;
          }

          .scanner-saved-section .grid button {
            min-height: 22px;
            padding: 2px 5px !important;
            font-size: 11px !important;
          }

          .scanner-footer-note {
            width: 100%;
            max-width: 1540px;
            flex: 0 0 auto;
            margin: 0 auto !important;
            padding: 0 !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
          }
        }
      `}</style>
      <canvas ref={processedCanvasRef} className="hidden" />

      <input
        ref={replaceFileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleReplaceImage}
      />

      <div className="scanner-main-content">
        {errorMessage && (
          <div className="mb-4 p-3 bg-[#FEE9E9] border border-[#FBB6B6] text-red-700 rounded-xl flex items-center justify-between text-sm font-medium shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-[#B91C1C] shrink-0" />
              <span>{DL(errorMessage)}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-[#FEE9E9] rounded-lg cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="scanner-page-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/sohoj-tools"
              className="p-1.5 sm:p-2 text-[#5A4A32] hover:bg-[#EFE3C8]/60 rounded-lg transition-colors cursor-pointer"
              title={DL("Back to Tools")}
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </Link>

            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#FEE9E9] text-[#DC2626] rounded-lg flex items-center justify-center font-bold shadow-xs shrink-0">
              <Printer size={18} className="sm:w-5 sm:h-5" />
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#3B2F1E] leading-tight">
                <DocumentText>{"Document Print\n              "}</DocumentText>
              </h1>
              <p className="text-[13px] sm:text-sm text-[#6B5A40] font-medium">
                <DocumentText>
                  {"All kind of documents print ready.\n              "}
                </DocumentText>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center bg-[#FBF6E8] border border-[#E3D6B8] rounded-lg p-0.5 sm:p-1 shadow-xs mr-1 sm:mr-2">
              <button
                onClick={() => handlePageNavigation(-1)}
                disabled={
                  images.length === 0 ||
                  selectedIndex === 0 ||
                  isProcessing ||
                  isManualCropping ||
                  isSavingDocument
                }
                className="p-1 sm:p-1.5 text-[#5A4A32] hover:bg-[#EFE3C8] rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title={DL("Previous document page")}
                aria-label={DL("Previous document page")}
              >
                <ChevronLeft size={18} />
              </button>

              <div className="min-w-[34px] px-1 text-center text-[12px] sm:text-[13px] font-bold text-[#6B5A40] tabular-nums">
                {images.length > 0 ? (
                  <DocumentText>{`${selectedIndex + 1}/${images.length}`}</DocumentText>
                ) : (
                  <DocumentText>{"0/0"}</DocumentText>
                )}
              </div>

              <button
                onClick={() => handlePageNavigation(1)}
                disabled={
                  images.length === 0 ||
                  selectedIndex >= images.length - 1 ||
                  isProcessing ||
                  isManualCropping ||
                  isSavingDocument
                }
                className="p-1 sm:p-1.5 text-[#5A4A32] hover:bg-[#EFE3C8] rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title={DL("Next document page")}
                aria-label={DL("Next document page")}
              >
                <ChevronRight size={18} />
              </button>

              <button
                onClick={() => setIsComparing(!isComparing)}
                disabled={images.length === 0}
                className={`p-1 sm:p-1.5 rounded-md transition-colors cursor-pointer ${isComparing ? "bg-[#DC2626] text-white" : "text-[#5A4A32] hover:bg-[#EFE3C8]"} disabled:opacity-40 disabled:cursor-not-allowed`}
                title={DL("Compare Original & Cleaned")}
              >
                <Columns size={15} />
              </button>
            </div>

            <button
              onClick={() => void handleSaveDocument()}
              disabled={
                images.length === 0 ||
                !cleanBaseSrc ||
                isProcessing ||
                isManualCropping ||
                isSavingDocument
              }
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[13px] sm:text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] border border-[#DC2626] rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={DL(
                "Save the current final document to Cloudinary and MongoDB",
              )}
            >
              {isSavingDocument ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>
                {isSavingDocument
                  ? editingSavedDocumentId
                    ? DL("Updating...")
                    : DL("Saving...")
                  : editingSavedDocumentId
                    ? DL("Save changes")
                    : DL("Save document")}
              </span>
            </button>

            <button
              onClick={handlePrint}
              disabled={images.length === 0 || isProcessing || isSavingDocument}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[13px] sm:text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] border border-[#DC2626] rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={14} />
              <span>
                <DocumentText>{"Print"}</DocumentText>
              </span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={images.length === 0 || isProcessing || isSavingDocument}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-[13px] sm:text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown size={14} />
              <span>
                <DocumentText>{"PDF download"}</DocumentText>
              </span>
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
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-[13px] sm:text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              <span>
                <DocumentText>{"Download"}</DocumentText>
              </span>
            </button>
          </div>
        </div>

        <div className="scanner-workspace flex flex-col lg:flex-row gap-4 items-start">
          <div className="scanner-workspace-panel flex-1 w-full bg-[#F2E8D2] border border-[#E3D6B8] rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs min-h-[500px] sm:min-h-[600px] lg:min-h-[720px]">
            <div className="scanner-workspace-inner flex flex-col md:flex-row gap-3 sm:gap-4 h-full flex-1">
              <div className="flex md:flex-col gap-2.5 shrink-0 overflow-x-auto md:overflow-y-auto max-h-none md:max-h-[600px] pb-2 md:pb-0 scrollbar-thin scroll">
                <label className="w-14 h-18 sm:w-16 sm:h-20 shrink-0 border-2 border-dashed border-[#D8C9A6] bg-[#F6EEDB] hover:bg-[#EFE3C8] rounded-xl flex items-center justify-center cursor-pointer transition-colors">
                  <Plus size={20} className="text-[#5A4A32] sm:w-6 sm:h-6" />
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
                    className={`w-14 h-18 sm:w-16 sm:h-20 shrink-0 rounded-xl border-2 overflow-hidden relative cursor-pointer shadow-xs transition-all ${selectedIndex === idx ? "border-[#DC2626] ring-2 ring-[#DC2626]/40 bg-[#F6D9A8] scale-102" : "border-[#E3D6B8] opacity-80 hover:opacity-100"}`}
                  >
                    <img
                      src={imgSrc}
                      alt={DL("Thumbnail")}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="absolute top-1 right-1 bg-[#DC2626] text-white p-0.5 rounded-full hover:bg-[#B91C1C] shadow cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="scanner-preview-canvas flex-1 bg-[#FBF6E8] border border-[#E3D6B8] rounded-xl flex items-center justify-center p-2 sm:p-4 relative overflow-hidden min-h-[380px] sm:min-h-[480px] lg:min-h-[620px]">
                {images.length > 0 && (
                  <div className="absolute top-3 right-3 z-30 flex items-center gap-1 sm:gap-1.5 bg-[#FBF6E8]/90 backdrop-blur-xs p-1 sm:p-1.5 rounded-xl shadow-md border border-[#E3D6B8]">
                    <button
                      onClick={handleReset}
                      disabled={isProcessing || isSavingDocument}
                      className="p-1.5 sm:p-2 bg-[#FBF6E8] hover:bg-[#EFE3C8] text-[#5A4A32] hover:text-[#3B2F1E] rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-semibold"
                      title={DL(
                        "Reset all edits, crops, and adjustments to original state",
                      )}
                    >
                      <RotateCcw size={15} />
                      <span className="hidden sm:inline">
                        <DocumentText>{"Full Reset"}</DocumentText>
                      </span>
                    </button>

                    <button
                      onClick={() => replaceFileInputRef.current?.click()}
                      disabled={isProcessing || isSavingDocument}
                      className="p-1.5 sm:p-2 bg-[#FBF6E8] hover:bg-[#EFE3C8] text-[#5A4A32] hover:text-[#3B2F1E] rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-semibold"
                      title={DL("Replace current image with a new file")}
                    >
                      <ImagePlus size={15} />
                      <span className="hidden sm:inline">
                        <DocumentText>{"Replace"}</DocumentText>
                      </span>
                    </button>

                    <div className="w-[1px] h-4 bg-[#F3E9D2] mx-0.5" />

                    <button
                      onClick={handleRotate}
                      disabled={
                        isProcessing || isManualCropping || isSavingDocument
                      }
                      className="p-1.5 sm:p-2 bg-[#FBF6E8] hover:bg-[#EFE3C8] text-[#5A4A32] hover:text-[#3B2F1E] rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-semibold"
                      title={
                        isManualCropping
                          ? DL("Finish manual crop first")
                          : DL("Rotate Document 90°")
                      }
                    >
                      <RotateCw size={15} />
                      <span className="hidden sm:inline">
                        <DocumentText>{"Rotate"}</DocumentText>
                      </span>
                    </button>
                  </div>
                )}

                {images.length === 0 ? (
                  <label className="flex flex-col items-center justify-center gap-3 cursor-pointer text-[#6B5A40] hover:text-[#5A4A32] transition-colors p-6 text-center">
                    <Upload size={32} className="text-[#DC2626]" />
                    <span className="text-sm font-semibold px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg shadow-xs cursor-pointer">
                      <DocumentText>
                        {"Upload Document\n                    "}
                      </DocumentText>
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
                    className="scanner-paper-frame bg-white w-full max-w-full h-full max-h-[450px] sm:max-h-[580px] lg:max-h-[620px] aspect-[1/1.414] shadow-md border border-[#D8C9A6] rounded relative flex items-center justify-center overflow-hidden"
                  >
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <Loader2
                          size={32}
                          className="text-[#DC2626] animate-spin"
                        />
                        <span className="text-sm font-bold text-[#3B2F1E]">
                          {enhanceProgress
                            ? enhanceProgress.stage === "download"
                              ? DL(
                                  `Downloading AI model… ${enhanceProgress.percent}% (first run)`,
                                )
                              : enhanceProgress.stage === "load"
                                ? DL("Starting AI engine…")
                                : DL(
                                    `${DL(ENHANCE_LABEL)} in progress… ${enhanceProgress.percent}%`,
                                  )
                            : isWaitingForOpenCv
                              ? DL(
                                  "Loading OpenCV… Auto crop will start as soon as it is ready.",
                                )
                              : isAutoCropping
                                ? DL("Auto crop is running…")
                                : activeStage === "clean"
                                  ? DL("Cleaning document…")
                                  : activeStage === "color"
                                    ? DL("Coloring document…")
                                    : DL("Processing Image...")}
                        </span>
                        {(enhanceProgress || isWaitingForOpenCv) && (
                          <button
                            type="button"
                            onClick={() => enhanceAbortRef.current?.abort()}
                            className="mt-1 px-3 py-1.5 border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8] text-[12px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            <X size={12} />
                            <DocumentText>
                              {"Cancel\n                          "}
                            </DocumentText>
                          </button>
                        )}
                      </div>
                    )}

                    {isSavingDocument && (
                      <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] z-40 flex flex-col items-center justify-center gap-2 p-4 text-center pointer-events-none">
                        <Loader2
                          size={30}
                          className="text-[#DC2626] animate-spin"
                        />
                        <span className="text-sm font-bold text-[#3B2F1E]">
                          <DocumentText>
                            {"Saving document...\n                        "}
                          </DocumentText>
                        </span>
                        <span className="text-[13px] text-[#6B5A40]">
                          <DocumentText>
                            {
                              "Uploading image and saving your record\n                        "
                            }
                          </DocumentText>
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
                          leftImageLabel={DL("Cleaned")}
                          rightImageLabel={DL("Original")}
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
                        alt={DL("Preview")}
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
                            className="fill-[#2563EB]/20 stroke-[#2563EB] stroke-2"
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
                            <span className="w-2 h-2 bg-[#FBF6E8] rounded-full" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#E3D6B8] flex flex-wrap gap-2 items-center justify-between text-sm text-[#5A4A32]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setZoom((z) => Math.max(50, z - 10))}
                  className="w-7 h-7 bg-[#FBF6E8] rounded-md border border-[#E3D6B8] flex items-center justify-center font-bold text-[#5A4A32] hover:bg-[#EFE3C8] cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.min(200, z + 10))}
                  className="w-7 h-7 bg-[#FBF6E8] rounded-md border border-[#E3D6B8] flex items-center justify-center font-bold text-[#5A4A32] hover:bg-[#EFE3C8] cursor-pointer"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="px-2.5 py-1 bg-[#FBF6E8] rounded-md border border-[#E3D6B8] font-medium text-[#5A4A32] hover:bg-[#EFE3C8] flex items-center gap-1 cursor-pointer"
                >
                  <span>
                    <DocumentText>{"Reset view"}</DocumentText>
                  </span>
                </button>
              </div>

              <span className="text-[12px] sm:text-[13px] text-[#6B5A40] font-medium">
                {(zoom / 100).toFixed(1)}
                <DocumentText>
                  {"x - use + / \u2212 to zoom\n              "}
                </DocumentText>
              </span>
            </div>
          </div>

          <div className="scanner-tools-sidebar w-full lg:w-[320px] shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
            <div className="scanner-tool-card bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 text-sm font-bold text-[#3B2F1E] uppercase tracking-wider">
                <span className="w-1.5 h-3 bg-[#DC2626] rounded-xs" />
                <DocumentText>{"Crop\n              "}</DocumentText>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleTriggerAutoCrop}
                  disabled={
                    isProcessing || images.length === 0 || isSavingDocument
                  }
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed ${autoCrop && !isManualCropping ? "bg-[#DC2626] text-white" : "bg-[#DC2626] hover:bg-[#B91C1C] text-white"}`}
                >
                  <Crop size={14} />
                  <DocumentText>{"Auto crop\n                "}</DocumentText>
                </button>

                <button
                  onClick={handleTriggerManualCrop}
                  disabled={images.length === 0 || isSavingDocument}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${isManualCropping ? "bg-[#DC2626] text-white" : "bg-[#F6EEDB] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
                >
                  <Crop size={14} />
                  <DocumentText>{"Manual crop\n                "}</DocumentText>
                </button>
              </div>
            </div>

            <div className="scanner-tool-card bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 text-sm font-bold text-[#3B2F1E] uppercase tracking-wider">
                <span className="w-1.5 h-3 bg-[#DC2626] rounded-xs" />
                <DocumentText>{"Magic\n              "}</DocumentText>
              </div>

              {renderEffectRow(
                "color",
                "Color Document",
                <Palette size={14} />,
              )}
              {renderMagicCleanRow()}
              {renderEffectRow("clean", "Document Clean", <Wand2 size={14} />)}
              <button
                type="button"
                onClick={handleUndoLast}
                disabled={
                  history.length === 0 ||
                  isProcessing ||
                  isManualCropping ||
                  isSavingDocument
                }
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-semibold border border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:bg-[#EFE3C8] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw size={12} />
                {history.length > 0 ? (
                  <DocumentText>{`Undo: ${STEP_LABELS[history[history.length - 1].step]}`}</DocumentText>
                ) : (
                  <DocumentText>{"Undo"}</DocumentText>
                )}
              </button>
            </div>

            <div className="scanner-tool-card bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 text-sm font-bold text-[#3B2F1E] uppercase tracking-wider">
                <span className="w-1.5 h-3 bg-[#DC2626] rounded-xs" />
                <DocumentText>{"Mode\n              "}</DocumentText>
              </div>

              <div className="space-y-2">
                <button
                  onMouseDown={() => setIsHoldingOriginal(true)}
                  onMouseUp={() => setIsHoldingOriginal(false)}
                  onMouseLeave={() => setIsHoldingOriginal(false)}
                  onTouchStart={() => setIsHoldingOriginal(true)}
                  onTouchEnd={() => setIsHoldingOriginal(false)}
                  disabled={images.length === 0}
                  className={`w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer select-none active:scale-98 ${isHoldingOriginal ? "bg-[#DC2626] text-white shadow-xs" : "bg-[#F6EEDB] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Eye size={14} />
                  <span>
                    {isHoldingOriginal ? (
                      <DocumentText>{"Showing Original..."}</DocumentText>
                    ) : (
                      <DocumentText>
                        {"Hold for Normal (original)"}
                      </DocumentText>
                    )}
                  </span>
                </button>
              </div>
            </div>

            <div className="scanner-tool-card scanner-adjustments-card bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 shadow-xs space-y-3 transition-all sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#3B2F1E] uppercase tracking-wider">
                  <span className="w-1.5 h-3 bg-[#DC2626] rounded-xs" />
                  <DocumentText>{"Adjustments\n                "}</DocumentText>
                </div>

                <button
                  type="button"
                  onClick={handleResetAdjustments}
                  disabled={
                    images.length === 0 ||
                    (blackness === 0 && contrast === 0 && brightness === 0)
                  }
                  className="px-2 py-1 rounded-lg border border-[#E3D6B8] bg-[#F6EEDB] text-[#5A4A32] hover:bg-[#EFE3C8] hover:text-[#3B2F1E] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title={DL("Reset only adjustments")}
                >
                  <DocumentText>{"Reset\n                "}</DocumentText>
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between font-semibold text-[#5A4A32] mb-1">
                    <span>
                      <DocumentText>{"Black"}</DocumentText>
                    </span>
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
                    className="w-full accent-[#DC2626] h-1.5 bg-[#F3E9D2] rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-[#5A4A32] mb-1">
                    <span>
                      <DocumentText>{"Color"}</DocumentText>
                    </span>
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
                    className="w-full accent-[#DC2626] h-1.5 bg-[#F3E9D2] rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-[#5A4A32] mb-1">
                    <span>
                      <DocumentText>{"Contrast"}</DocumentText>
                    </span>
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
                    className="w-full accent-[#DC2626] h-1.5 bg-[#F3E9D2] rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewSavedDocument && (
        <div
          className="fixed inset-0 z-[95] bg-[#0F172A]/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="saved-document-preview-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPreviewSavedDocument(null);
            }
          }}
        >
          <div className="w-full max-w-6xl h-[min(92vh,900px)] bg-[#F3E9D2] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#D8C9A6] overflow-hidden flex flex-col">
            <div className="px-3 sm:px-5 py-3 bg-[#FBF6E8] border-b border-[#E3D6B8] flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <p className="text-[13px] uppercase tracking-[0.16em] text-[#6B5A40] font-bold">
                  <DocumentText>
                    {"Saved document preview\n                "}
                  </DocumentText>
                </p>
                <h2
                  id="saved-document-preview-title"
                  className="text-base sm:text-lg font-bold text-[#3B2F1E] truncate"
                >
                  {previewSavedDocument.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setPreviewSavedDocument(null)}
                className="w-9 h-9 rounded-xl bg-[#F3E9D2] hover:bg-[#EFE3C8] text-[#5A4A32] flex items-center justify-center cursor-pointer shrink-0"
                aria-label={DL("Close preview")}
              >
                <X size={17} />
              </button>
            </div>

            <div className="flex-1 min-h-0 p-3 sm:p-5 flex items-center justify-center overflow-auto scroll bg-[#F3E9D2]/70">
              <div className="max-w-full max-h-full bg-white rounded-xl shadow-xl border border-[#D8C9A6] p-2 sm:p-3 flex items-center justify-center">
                <img
                  src={previewSavedDocument.src}
                  alt={previewSavedDocument.name}
                  className="block max-w-full max-h-[calc(92vh-190px)] object-contain"
                />
              </div>
            </div>

            <div className="px-3 sm:px-5 py-3 bg-[#FBF6E8] border-t border-[#E3D6B8] flex flex-wrap items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleEditSavedDocument(previewSavedDocument)}
                disabled={isProcessing || isSavingDocument}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit size={14} />
                <DocumentText>{"Modify document\n              "}</DocumentText>
              </button>

              <button
                type="button"
                onClick={() => handlePrintSource(previewSavedDocument.src)}
                disabled={isProcessing || isSavingDocument}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FBF6E8] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8] text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={14} />
                <DocumentText>{"Print\n              "}</DocumentText>
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
                disabled={isProcessing || isSavingDocument}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FBF6E8] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8] text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown size={14} />
                <DocumentText>{"PDF download\n              "}</DocumentText>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDownloadSavedDocument(previewSavedDocument)
                }
                disabled={isProcessing || isSavingDocument}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={14} />
                <DocumentText>{"Download image\n              "}</DocumentText>
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingNavigationIndex !== null && hasUnsavedChanges && (
        <div
          className="fixed inset-0 z-[100] bg-[#0F172A]/40 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-document-title"
        >
          <div className="w-full max-w-sm bg-[#F0DDB5] rounded-2xl border-2 border-[#DC2626] shadow-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F6EEDB] text-[#DC2626] border border-[#E3D6B8] flex items-center justify-center shrink-0">
                <Save size={19} />
              </div>

              <div className="min-w-0">
                <h2
                  id="unsaved-document-title"
                  className="text-base font-bold text-[#3B2F1E]"
                >
                  <DocumentText>
                    {"Save current document?\n                "}
                  </DocumentText>
                </h2>
                <p className="text-sm text-[#6B5A40] mt-1.5 leading-5">
                  <DocumentText>
                    {
                      "You can save your current work before switching to another\n                  document.\n                "
                    }
                  </DocumentText>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <button
                type="button"
                onClick={handleConfirmNavigationWithoutSave}
                disabled={isProcessing || isSavingDocument}
                className="py-2.5 rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] text-[#5A4A32] hover:bg-[#EFE3C8] text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DocumentText>{"No\n              "}</DocumentText>
              </button>
              <button
                type="button"
                onClick={handleConfirmNavigationSave}
                disabled={isProcessing || isSavingDocument}
                className="py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingDocument ? (
                  <DocumentText>{"Saving..."}</DocumentText>
                ) : (
                  <DocumentText>{"Yes, Save"}</DocumentText>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="scanner-saved-section mt-4 bg-[#F2E8D2] border border-[#E3D6B8] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-bold text-[#3B2F1E]">
              <DocumentText>{"Saved Documents\n            "}</DocumentText>
            </h2>
            <p className="text-[13px] text-[#6B5A40] mt-0.5">
              <DocumentText>
                {"Saved documents are linked to your account.\n            "}
              </DocumentText>
            </p>
          </div>

          <span className="text-[12px] sm:text-[13px] font-semibold text-[#6B5A40] bg-[#F3E9D2] rounded-full px-2.5 py-1">
            {savedDocuments.length}
            <DocumentText>{"saved\n          "}</DocumentText>
          </span>
        </div>

        {isLoadingSavedDocuments ? (
          <div className="border border-[#E3D6B8] rounded-xl bg-[#F6EEDB] p-6 text-center">
            <Loader2
              size={22}
              className="mx-auto text-[#DC2626] animate-spin mb-2"
            />
            <p className="text-sm font-semibold text-[#5A4A32]">
              <DocumentText>
                {
                  "Saved documents load \u09B9\u099A\u09CD\u099B\u09C7...\n            "
                }
              </DocumentText>
            </p>
          </div>
        ) : savedDocuments.length === 0 ? (
          <div className="border border-dashed border-[#E3D6B8] rounded-xl bg-[#F6EEDB] p-6 text-center">
            <Save size={22} className="mx-auto text-[#7A6A50] mb-2" />
            <p className="text-sm font-semibold text-[#5A4A32]">
              <DocumentText>
                {
                  "\u098F\u0996\u09A8\u09CB \u0995\u09CB\u09A8\u09CB document save \u0995\u09B0\u09BE \u09B9\u09DF\u09A8\u09BF\u0964\n            "
                }
              </DocumentText>
            </p>
            <p className="text-[13px] text-[#6B5A40] mt-1">
              <DocumentText>
                {
                  "Crop, clean \u098F\u09AC\u0982 adjustment \u09B6\u09C7\u09B7 \u0995\u09B0\u09C7 \u0989\u09AA\u09B0\u09C7\u09B0 Save document \u099A\u09BE\u09AA\u09CB\u0964\n            "
                }
              </DocumentText>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {savedDocuments.map((savedDocument, index) => {
              const isDeleting = deletingSavedDocumentId === savedDocument.id;
              return (
                <div
                  key={savedDocument.id}
                  className="border border-[#E3D6B8] rounded-xl overflow-hidden bg-[#F6EEDB] group"
                >
                  <div
                    className="aspect-[1/1.414] bg-white flex items-center justify-center overflow-hidden border-b border-[#E3D6B8] relative cursor-pointer"
                    onClick={() => handleOpenSavedPreview(savedDocument)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpenSavedPreview(savedDocument);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${DL("Preview")} ${savedDocument.name}`}
                  >
                    <img
                      src={savedDocument.src}
                      alt={savedDocument.name}
                      className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                      loading="lazy"
                    />

                    {isDeleting && (
                      <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FBF6E8] border border-[#E3D6B8] shadow-md">
                          <Loader2
                            size={15}
                            className="text-[#DC2626] animate-spin"
                          />
                          <span className="text-[13px] font-semibold text-[#5A4A32]">
                            <DocumentText>
                              {"Deleting...\n                          "}
                            </DocumentText>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#3B2F1E] truncate">
                          {savedDocument.name}
                        </p>
                        <p className="text-[13px] text-[#6B5A40] mt-0.5">
                          <DocumentText>{"Saved"}</DocumentText>
                          {<DocumentText> </DocumentText>}
                          {index === 0 ? (
                            <DocumentText>{"just now"}</DocumentText>
                          ) : (
                            new Date(
                              savedDocument.createdAt,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          )}
                        </p>
                      </div>

                      <span className="text-[11px] font-semibold text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] rounded-full px-2 py-0.5 shrink-0">
                        <DocumentText>
                          {"Saved\n                      "}
                        </DocumentText>
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
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#DC2626] text-white hover:bg-[#B91C1C] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={12} />
                        <DocumentText>
                          {"Download\n                      "}
                        </DocumentText>
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleRemoveSavedDocument(savedDocument);
                        }}
                        disabled={isDeleting}
                        className="px-2.5 py-1.5 rounded-lg bg-[#FBF6E8] border border-[#E3D6B8] text-[#6B5A40] hover:bg-[#FEE9E9] hover:text-[#991B1B] hover:border-[#FBB6B6] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`${DL("Remove")} ${savedDocument.name}`}
                        title={DL("Delete saved document")}
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

      <div className="scanner-footer-note mt-4 pt-2 text-sm text-[#5A4A32] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
        <span>
          <DocumentText>
            {
              "Document Clean \u09A6\u09BF\u09DF\u09C7 Document \u0986\u09B0\u0993 \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u0993 Clean \u0995\u09B0\u09C1\u09A8 A4 Print Ready\n        "
            }
          </DocumentText>
        </span>
      </div>
    </div>
  );
}
