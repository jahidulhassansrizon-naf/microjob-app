"use client";
import { useSebaLagbeToolsI18n } from "@/app/sohoj-tools/_i18n";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SyntheticEvent,
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
  Crop,
  X,
  ChevronRight,
  Eye,
  CheckCircle2,
} from "lucide-react";
import jsPDF from "jspdf";
import { createPortal } from "react-dom";
import NidSettingsPanel from "@/components/nidToPdfComponent/NidSettingsPanel";
// Same client-side card/document corner detection (OpenCV.js) that the
// Document Scanner page uses. If this file lives in another folder, change the
// path below (or copy documentCorners.ts next to this file).
import { detectDocumentCornersCv } from "./documentCorners";

/* -------------------------------------------------------------------------- */
/* Page-specific, hydration-safe English ↔ Bangla translation                */
/* -------------------------------------------------------------------------- */
const NID_TRANSLATIONS: Record<string, string> = {
  "crop —": "ক্রপ —",
  "drag all four orange corner handles onto the card edges. the selected area will be straightened to a cr80-sized rectangle.":
    "কমলার চারটি কোণার হ্যান্ডেল কার্ডের প্রান্তে টেনে বসান। নির্বাচিত অংশটি CR80 আকারের একটি সোজা আয়তক্ষেত্রে রূপান্তরিত হবে।",
  "loading image…": "ছবি লোড হচ্ছে…",
  "cropping…": "ক্রপ করা হচ্ছে…",
  "reset corners": "কোণাগুলো রিসেট করুন",
  cancel: "বাতিল করুন",
  "apply crop": "ক্রপ প্রয়োগ করুন",
  "crop preview —": "ক্রপের পূর্বরূপ —",
  "this is the exact cropped image that will be used in your pdf.":
    "আপনার PDF-এ যে ক্রপ করা ছবিটি ব্যবহার হবে, এটি সেটির হুবহু পূর্বরূপ।",
  "loading final crop…": "চূড়ান্ত ক্রপ লোড হচ্ছে…",
  "review the final crop": "চূড়ান্ত ক্রপটি যাচাই করুন",
  "check that the full nid card is visible, all four corners are included, and no important text or edge is cut off.":
    "পুরো NID কার্ডটি দেখা যাচ্ছে কি না, চারটি কোণই আছে কি না এবং গুরুত্বপূর্ণ কোনো লেখা বা প্রান্ত কেটে গেছে কি না তা যাচাই করুন।",
  "output size:": "আউটপুটের আকার:",
  px: "পিক্সেল",
  "not correct? crop manually": "ঠিক হয়নি? নিজে ক্রপ করুন",
  "adjust all 4 card corners yourself": "চারটি কার্ডের কোণা নিজে ঠিক করুন",
  "looks correct — use this crop": "ঠিক আছে — এই ক্রপটি ব্যবহার করুন",
  "keep this image and continue to pdf": "এই ছবিটি রেখে PDF তৈরিতে এগিয়ে যান",
  "choose auto crop": "স্বয়ংক্রিয় ক্রপ বেছে নিন",
  "you uploaded both sides. which image should be auto-cropped?":
    "আপনি কার্ডের দুই পাশের ছবি আপলোড করেছেন। কোন ছবিটিতে স্বয়ংক্রিয় ক্রপ করা হবে?",
  "front only": "শুধু সামনের পাশ",
  "auto-crop only the front side.":
    "শুধু সামনের পাশের ছবিতে স্বয়ংক্রিয় ক্রপ করুন।",
  "back only": "শুধু পেছনের পাশ",
  "auto-crop only the back side.":
    "শুধু পেছনের পাশের ছবিতে স্বয়ংক্রিয় ক্রপ করুন।",
  "both sides": "দুই পাশই",
  "auto-crop front and back sequentially.":
    "সামনের ও পেছনের ছবি ধারাবাহিকভাবে স্বয়ংক্রিয় ক্রপ করুন।",
  "back to tools": "টুলসে ফিরে যান",
  "image tools": "ছবি সংক্রান্ত টুল",
  "nid joiner": "NID সংযুক্তকারী",
  free: "বিনামূল্যে",
  "turn nid card front and back photos into a clean a4 pdf — all in your browser.":
    "NID কার্ডের সামনের ও পেছনের ছবি একত্র করে ব্রাউজারেই পরিষ্কার A4 PDF তৈরি করুন।",
  "live preview": "লাইভ পূর্বরূপ",
  "a4 — 210 × 297 mm": "A4 — 210 × 297 মিমি",
  pages: "পৃষ্ঠা",
  "auto cropping": "স্বয়ংক্রিয়ভাবে ক্রপ করা হচ্ছে",
  "front and back": "সামনে ও পেছনে",
  "nid photo…": "NID ছবির প্রক্রিয়া চলছে…",
  "auto cropping front…": "সামনের ছবি স্বয়ংক্রিয়ভাবে ক্রপ করা হচ্ছে…",
  "auto crop applied · click to verify":
    "স্বয়ংক্রিয় ক্রপ প্রয়োগ হয়েছে · যাচাই করতে ক্লিক করুন",
  "manual crop applied · click to verify":
    "ম্যানুয়াল ক্রপ প্রয়োগ হয়েছে · যাচাই করতে ক্লিক করুন",
  "front of nid card": "NID কার্ডের সামনের অংশ",
  "upload front side photo": "সামনের পাশের ছবি আপলোড করুন",
  "jpg · png · heic": "JPG · PNG · HEIC",
  "auto cropping back…": "পেছনের ছবি স্বয়ংক্রিয়ভাবে ক্রপ করা হচ্ছে…",
  "back of nid card": "NID কার্ডের পেছনের অংশ",
  "upload back side photo": "পেছনের পাশের ছবি আপলোড করুন",
  "both card photos added — ready to create pdf":
    "দুই পাশের কার্ডের ছবি যোগ করা হয়েছে — PDF তৈরির জন্য প্রস্তুত",
  "upload front and back photos to create pdf":
    "PDF তৈরি করতে সামনের ও পেছনের ছবি আপলোড করুন",
  reset: "রিসেট করুন",
  "creating...": "তৈরি করা হচ্ছে...",
  "create pdf": "PDF তৈরি করুন",
  "close manual crop": "ম্যানুয়াল ক্রপ বন্ধ করুন",
  "crop target": "ক্রপ করার ছবি",
  "close crop preview": "ক্রপের পূর্বরূপ বন্ধ করুন",
  "close auto crop selection": "স্বয়ংক্রিয় ক্রপ নির্বাচন বন্ধ করুন",
  "zoom in": "জুম বাড়ান",
  "rotate canvas": "ক্যানভাস ঘোরান",
  "zoom out": "জুম কমান",
  "reset zoom": "জুম রিসেট করুন",
  "swap front and back": "সামনের ও পেছনের ছবি অদলবদল করুন",
  "add copy": "আরেকটি কপি যোগ করুন",
  "rotate all 90°": "সবগুলো ৯০° ঘোরান",
  "front nid": "সামনের NID",
  crop: "ক্রপ",
  "change image": "ছবি পরিবর্তন করুন",
  "rotate 90°": "৯০° ঘোরান",
  delete: "মুছে দিন",
  "click to verify this cropped image": "ক্রপ করা ছবিটি যাচাই করতে ক্লিক করুন",
  "auto crop could not find the nid card edges. you can turn auto crop off and use manual crop instead.":
    "স্বয়ংক্রিয় ক্রপ NID কার্ডের প্রান্ত খুঁজে পায়নি। Auto crop বন্ধ করে ম্যানুয়াল Crop ব্যবহার করুন।",
  "opencv could not be loaded. check your internet connection or use manual crop.":
    "OpenCV লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন অথবা ম্যানুয়াল Crop ব্যবহার করুন।",
  "auto crop was cancelled or timed out. please try again.":
    "স্বয়ংক্রিয় ক্রপ বাতিল হয়েছে বা নির্ধারিত সময় পেরিয়ে গেছে। আবার চেষ্টা করুন।",
  "front nid image is not available.": "সামনের NID ছবিটি পাওয়া যাচ্ছে না।",
  "back nid image is not available.": "পেছনের NID ছবিটি পাওয়া যাচ্ছে না।",
  "could not prepare the print job. please try again.":
    "প্রিন্টের কাজ প্রস্তুত করা যায়নি। আবার চেষ্টা করুন।",
  "could not generate the pdf. please try again.":
    "PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।",
  "could not load card image.": "কার্ডের ছবি লোড করা যায়নি।",
  "canvas context unavailable.": "ক্যানভাস প্রসেসিং সুবিধা পাওয়া যায়নি।",
  "canvas export failed.": "ক্যানভাস থেকে ফাইল তৈরি ব্যর্থ হয়েছে।",
  "could not create cropped image.": "ক্রপ করা ছবি তৈরি করা যায়নি।",
  "could not create destination crop canvas.":
    "চূড়ান্ত ক্রপের ক্যানভাস তৈরি করা যায়নি।",
  "could not create source crop canvas.":
    "উৎস ছবির ক্রপ ক্যানভাস তৈরি করা যায়নি।",
  "could not finalize the auto-cropped image.":
    "স্বয়ংক্রিয়ভাবে ক্রপ করা ছবিটি চূড়ান্ত করা যায়নি।",
  "could not normalize the auto-cropped image.":
    "স্বয়ংক্রিয়ভাবে ক্রপ করা ছবির অনুপাত ঠিক করা যায়নি।",
  "could not prepare the auto-cropped image.":
    "স্বয়ংক্রিয়ভাবে ক্রপ করা ছবি প্রস্তুত করা যায়নি।",
  "could not prepare the image for manual crop.":
    "ম্যানুয়াল ক্রপের জন্য ছবি প্রস্তুত করা যায়নি।",
  "crop area is too small. move the corner handles farther apart.":
    "ক্রপের এলাকা খুব ছোট। চারটি কোণার হ্যান্ডেল আরও দূরে সরান।",
  "crop corners are too close together. move each handle to a different card corner.":
    "ক্রপের কোণাগুলো খুব কাছাকাছি। প্রতিটি হ্যান্ডেল আলাদা কার্ডের কোণায় সরান।",
  "crop corners crossed. keep the four corners in clockwise or counter-clockwise order.":
    "ক্রপের কোণাগুলো পরস্পর অতিক্রম করেছে। চারটি কোণ ঘড়ির কাঁটার দিকে বা বিপরীত দিকে সঠিক ক্রমে রাখুন।",
  "crop points do not form a valid perspective shape.":
    "ক্রপের পয়েন্টগুলো বৈধ পার্সপেক্টিভ আকৃতি তৈরি করছে না।",
  "exactly four crop points are required.":
    "ক্রপের জন্য ঠিক চারটি পয়েন্ট প্রয়োজন।",
  "nid card": "NID কার্ড",
  "print frame unavailable.": "প্রিন্ট ফ্রেম পাওয়া যায়নি।",
  "unable to load image for auto crop.":
    "স্বয়ংক্রিয় ক্রপের জন্য ছবি লোড করা যায়নি।",
  "invalid crop image dimensions or points.": "ক্রপ ছবির আকার বা পয়েন্ট অবৈধ।",
  "invalid homography system.": "পার্সপেক্টিভ গণনার তথ্য অবৈধ।",
  "invalid image dimensions.": "ছবির আকার অবৈধ।",
  "manual crop could not be completed. please adjust the corners and try again.":
    "ম্যানুয়াল ক্রপ সম্পন্ন করা যায়নি। কোণাগুলো ঠিক করে আবার চেষ্টা করুন।",
  "manual crop failed.": "ম্যানুয়াল ক্রপ ব্যর্থ হয়েছে।",
  "auto crop returned an invalid image.":
    "স্বয়ংক্রিয় ক্রপ থেকে একটি অবৈধ ছবি পাওয়া গেছে।",
  "auto crop returned an unreadable image.":
    "স্বয়ংক্রিয় ক্রপ থেকে পড়া যায় না এমন ছবি পাওয়া গেছে।",
  "final cropped front of nid card": "NID কার্ডের সামনের চূড়ান্ত ক্রপ করা ছবি",
  "final cropped back of nid card": "NID কার্ডের পেছনের চূড়ান্ত ক্রপ করা ছবি",
};

function normalizeNidText(value: string) {
  return value.replace(/\\n/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function translateNidText(
  value: string,
  locale: string | undefined,
  baseL: (value: string) => string,
): string {
  const raw = value ?? "";
  const normalized = normalizeNidText(raw);
  if (!locale || !String(locale).toLowerCase().startsWith("bn")) return raw;

  const exact = NID_TRANSLATIONS[normalized];
  if (exact) {
    const lead = raw.match(/^\s*/)?.[0] ?? "";
    const trail = raw.match(/\s*$/)?.[0] ?? "";
    return `${lead}${exact}${trail}`;
  }

  const finalCrop = /^final cropped (front|back) of nid card$/i.exec(
    normalized,
  );
  if (finalCrop) {
    return finalCrop[1] === "front"
      ? "NID কার্ডের সামনের চূড়ান্ত ক্রপ করা ছবি"
      : "NID কার্ডের পেছনের চূড়ান্ত ক্রপ করা ছবি";
  }

  const dynamicAuto = /^detecting (front|back) card edges…$/i.exec(normalized);
  if (dynamicAuto) {
    return dynamicAuto[1] === "front"
      ? "সামনের কার্ডের প্রান্ত শনাক্ত করা হচ্ছে…"
      : "পেছনের কার্ডের প্রান্ত শনাক্ত করা হচ্ছে…";
  }

  const pages = /^· (\d+) pages$/i.exec(normalized);
  if (pages) return `· ${pages[1]} পৃষ্ঠা`;

  // Use the shared translator only when it returns a complete translation.
  const translated = baseL(raw);
  if (translated && translated !== raw) {
    const hasBangla = /[\u0980-\u09FF]/.test(translated);
    const hasLatin = /[A-Za-z]/.test(translated);
    if (!hasBangla || !hasLatin) return translated;
  }
  return raw;
}

function useNidText() {
  const { locale, L: baseL } = useSebaLagbeToolsI18n();
  const t = useCallback(
    (value: string) => translateNidText(value, locale, baseL),
    [locale, baseL],
  );
  return { t, locale };
}

function NidT({ children }: { children: ReactNode }) {
  const { t } = useNidText();
  if (typeof children !== "string") return <>{children}</>;
  return <>{t(children)}</>;
}

const AUTO_CROP_ERROR =
  "Auto crop could not find the NID card edges. You can turn Auto crop off and use manual Crop instead.";
// Auto crop runs fully in the browser with OpenCV.js (no backend request).
// Same script id / URL as the Document Scanner page, so it is shared.
const OPENCV_SCRIPT_ID = "opencv-js";
const OPENCV_SCRIPT_URL = "https://docs.opencv.org/4.8.0/opencv.js";
const OPENCV_WAIT_TIMEOUT_MS = 80000;
// Auto crop gives up after this long (covers a slow first OpenCV download).
const AUTO_CROP_TIMEOUT_MS = 90000;
let openCvScriptFailed = false;
const getOpenCv = () =>
  (
    window as unknown as {
      cv?: {
        Mat?: unknown;
      };
    }
  ).cv;
const isOpenCvReady = () => Boolean(getOpenCv()?.Mat);
function injectOpenCvScript() {
  openCvScriptFailed = false;
  const script = document.createElement("script");
  script.id = OPENCV_SCRIPT_ID;
  script.src = OPENCV_SCRIPT_URL;
  script.async = true;
  script.onerror = () => {
    openCvScriptFailed = true;
  };
  document.body.appendChild(script);
}
/** Loads OpenCV.js if needed and waits until it is ready to use. */
async function waitForOpenCv(signal?: AbortSignal): Promise<void> {
  if (isOpenCvReady()) return;
  const existing = document.getElementById(OPENCV_SCRIPT_ID);
  if (!existing) {
    injectOpenCvScript();
  } else if (openCvScriptFailed) {
    // The first download failed: try once more.
    existing.remove();
    injectOpenCvScript();
  }
  const startedAt = Date.now();
  while (!isOpenCvReady()) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    if (openCvScriptFailed || Date.now() - startedAt > OPENCV_WAIT_TIMEOUT_MS) {
      throw new Error(
        "OpenCV could not be loaded. Check your internet connection or use manual Crop.",
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
const NID_CROP_WIDTH = 856;
const NID_CROP_HEIGHT = 540;
const NID_CROP_ASPECT_RATIO = NID_CROP_WIDTH / NID_CROP_HEIGHT;
// ============================================================================
// PRINT / PDF ENGINE — shared by handlePrint and handleCreatePdf
// ============================================================================
/* -------------------------------------------------------------------------- */
/* Warm Sand + Red page styles (font + scrollbars). Injected once by the page */
/* root; portal modals carry the same `page-font` class.                      */
/* -------------------------------------------------------------------------- */
const NID_PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.page-font.page-font, .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
  font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-optical-sizing: auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
.page-font h1, .page-font h2, .page-font h3, .page-font h4 { letter-spacing: -0.01em; }
.scroll { scrollbar-width: thin; scrollbar-color: #F87171 transparent; }
.scroll::-webkit-scrollbar { width: 12px; height: 12px; }
.scroll::-webkit-scrollbar-track { background: rgba(148,163,184,0.18); border-radius: 999px; margin: 10px 0; }
.scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#F87171,#DC2626); border-radius: 999px; border: 3px solid #F2E8D2; min-height: 48px; }
.scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,#EF4444,#B91C1C); }

/* NID Joiner: keep the complete desktop page inside one viewport. */
.nid-joiner-fit-screen {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.nid-joiner-fit-screen > div { min-width: 0; }
.nid-joiner-breadcrumb { flex: 0 0 auto; min-height: 18px; line-height: 1.2; }
.nid-joiner-hero { flex: 0 0 auto; }
.nid-joiner-main { min-width: 0; }
.nid-joiner-settings { min-width: 0; min-height: 0; }
.nid-joiner-preview { min-width: 0; min-height: 0; }
.nid-preview-stage { min-width: 0; min-height: 0; }
.nid-sheet-fit-wrap { position: relative; display: block; flex: 0 0 auto; }
.nid-sheet-fit-wrap > #printable-sheet { position: absolute; top: 0; left: 0; }
.nid-joiner-status { flex: 0 0 auto; }

/* Compact settings while keeping every control available. */
.nid-joiner-settings .p-5 { padding: 0.7rem !important; }
.nid-joiner-settings .p-4 { padding: 0.55rem !important; }
.nid-joiner-settings .px-4 { padding-left: 0.6rem !important; padding-right: 0.6rem !important; }
.nid-joiner-settings .py-3 { padding-top: 0.35rem !important; padding-bottom: 0.35rem !important; }
.nid-joiner-settings .gap-4 { gap: 0.5rem !important; }
.nid-joiner-settings .gap-3 { gap: 0.4rem !important; }
.nid-joiner-settings .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.55rem !important; }
.nid-joiner-settings .space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.4rem !important; }
.nid-joiner-settings .mt-4 { margin-top: 0.5rem !important; }
.nid-joiner-settings .mt-3 { margin-top: 0.4rem !important; }
.nid-joiner-settings .text-\\[10px\\],
.nid-joiner-settings .text-\\[11px\\] { font-size: 12px !important; }
.nid-joiner-settings button { transition-duration: 150ms; }

@media (min-width: 1200px) and (min-height: 760px) {
  .nid-joiner-fit-screen {
    width: min(96vw, 1440px) !important;
    max-width: none !important;
    margin-left: calc((100% - min(96vw, 1440px)) / 2) !important;
    height: calc(100dvh - 80px);
    max-height: calc(100dvh - 80px);
    min-height: 0;
    overflow: hidden;
    gap: 8px;
  }
  .nid-joiner-fit-screen > div { margin-block: 0 !important; }
  .nid-joiner-breadcrumb { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }
  .nid-joiner-hero { padding: 10px 14px !important; }
  .nid-joiner-hero .w-12.h-12 { width: 2.25rem; height: 2.25rem; }
  .nid-joiner-main { flex: 1 1 0%; min-height: 0; max-height: 100%; gap: 12px !important; }

  /* The settings no longer have their own scrollbar on the desktop target. */
  .nid-joiner-settings { grid-column: span 4 / span 4; height: 100%; overflow: hidden; }
  .nid-joiner-settings > * { min-height: 0; }
  .nid-settings-panel {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-content: start;
    gap: 6px 8px !important;
    height: 100%;
    padding: 8px !important;
    overflow: hidden;
  }
  .nid-joiner-settings .nid-settings-panel.space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 0 !important; }
  .nid-settings-heading,
  .nid-settings-auto-crop,
  .nid-settings-cleanup,
  .nid-settings-print { grid-column: 1 / -1; min-width: 0; }
  .nid-settings-heading { padding-bottom: 4px !important; font-size: 14px !important; }
  .nid-settings-auto-crop { padding: 7px !important; }
  .nid-settings-auto-crop .mt-2 { margin-top: 4px !important; }
  .nid-settings-auto-crop .text-\\[15px\\] { font-size: 12px !important; }
  .nid-settings-auto-crop .text-\\[13px\\] { font-size: 11px !important; line-height: 1.25 !important; }
  .nid-settings-panel .nid-settings-page,
  .nid-settings-panel .nid-settings-layout,
  .nid-settings-panel .nid-settings-rotate,
  .nid-settings-panel .nid-settings-position,
  .nid-settings-panel .nid-settings-copies,
  .nid-settings-panel .nid-settings-rounded { min-width: 0; margin-top: 0 !important; }
  .nid-settings-panel .nid-settings-page > div:first-child,
  .nid-settings-panel .nid-settings-layout > div:first-child,
  .nid-settings-panel .nid-settings-rotate > div:first-child { font-size: 11px !important; }
  .nid-settings-panel .nid-settings-page button,
  .nid-settings-panel .nid-settings-layout button,
  .nid-settings-panel .nid-settings-rotate button,
  .nid-settings-panel .nid-settings-position button,
  .nid-settings-panel .nid-settings-copies button { padding-top: 4px !important; padding-bottom: 4px !important; font-size: 11px !important; }
  .nid-settings-panel .nid-settings-rounded { padding-top: 0 !important; }
  .nid-settings-rounded > div > span { font-size: 11px !important; }
  .nid-settings-rounded button { width: 36px !important; height: 20px !important; }
  .nid-settings-rounded button > div { width: 16px !important; height: 16px !important; }

  .nid-settings-cleanup { padding-top: 6px !important; border-top-width: 1px; }
  .nid-settings-cleanup > div:first-child { margin-bottom: 4px; }
  .nid-settings-cleanup > div:first-child > span { font-size: 12px !important; }
  .nid-settings-cleanup .nid-settings-presets { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; gap: 4px !important; padding: 4px !important; }
  .nid-settings-cleanup .nid-settings-presets button { padding: 6px 3px !important; gap: 4px !important; min-width: 0; }
  .nid-settings-cleanup .nid-settings-presets button > span:last-child { font-size: 10px !important; overflow-wrap: anywhere; }
  .nid-settings-cleanup .nid-settings-presets svg { width: 14px; height: 14px; }
  .nid-settings-fine-tuning { padding-top: 5px !important; margin-top: 5px !important; }
  .nid-settings-fine-tuning > span { font-size: 12px !important; margin-bottom: 4px; }
  .nid-settings-cleanup .nid-settings-range-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px 10px !important; }
  .nid-joiner-settings .nid-settings-range-grid.space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0 !important; }
  .nid-settings-range-grid > div { min-width: 0; }
  .nid-settings-range-grid > div > div:first-child { gap: 4px; font-size: 10px !important; line-height: 1.2; }
  .nid-settings-range-grid input[type="range"] { height: 5px; }
  .nid-settings-print { padding-top: 6px !important; padding-bottom: 6px !important; margin-top: 0 !important; }

  .nid-joiner-preview { grid-column: span 8 / span 8; height: 100%; padding: 10px !important; overflow: hidden; }
  .nid-joiner-preview > :first-child { flex: 0 0 auto; padding-bottom: 7px !important; }
  .nid-preview-stage { flex: 1 1 0%; margin: 7px 0 !important; padding: 10px !important; overflow: hidden; align-items: center !important; }
  .nid-joiner-status { padding: 8px 10px !important; gap: 8px !important; }
  .nid-joiner-status button { padding-top: 6px !important; padding-bottom: 6px !important; }
}

@media (max-width: 1199px), (max-height: 759px) {
  .nid-joiner-settings { overflow: visible; }
  .nid-joiner-main { flex: initial; }
}
`;

type SheetOrientation = "portrait" | "landscape";
type SheetLayoutMode = "side-by-side" | "stacked";
type SheetPosition = "top" | "center" | "bottom";
type CardSide = "front" | "back";
type CardFit = "cover" | "contain";
const MM_PER_INCH = 25.4;
const PAGE_SIZE_MM = { width: 210, height: 297 } as const; // A4 portrait
// 856x540 px crop == ISO/IEC 7810 ID-1 (85.6 x 54 mm), so cards print at real size.
const CARD_SIZE_MM = {
  width: NID_CROP_WIDTH / 10,
  height: NID_CROP_HEIGHT / 10,
} as const;
const PAGE_MARGIN_MM = 15; // safe for printers' unprintable edge
const CARD_GAP_MM = 6; // front <-> back
const ROW_GAP_MM = 8; // between copies
const CARD_RADIUS_MM = 3.2; // real ID-1 corner radius
const CARD_BORDER_MM = 0.2;
const CARD_BORDER_COLOR = "#d1d5db";
const EXPORT_DPI = 300;
const JPEG_QUALITY = 0.95;
// The on-screen sheet stays 540px wide (portrait); everything scales from this.
const PREVIEW_PX_PER_MM = 540 / PAGE_SIZE_MM.width;
interface CardFilter {
  brightness: number; // percentages, same meaning as the CSS filter functions
  contrast: number;
  saturate: number;
  grayscale: number;
}
interface CardInput {
  file: File;
  rotation: number;
  fit: CardFit;
}
interface SheetExportOptions {
  orientation: SheetOrientation;
  layout: SheetLayoutMode;
  position: SheetPosition;
  copies: number;
  roundedCorners: boolean;
  filter: CardFilter;
  front: CardInput | null;
  back: CardInput | null;
}
interface Placement {
  side: CardSide;
  x: number; // mm from page top-left
  y: number;
  width: number;
  height: number;
}
interface SheetLayout {
  pageWidth: number;
  pageHeight: number;
  pages: Placement[][];
  scale: number;
}
const normalizeSheetRotation = (deg: number) => ((deg % 360) + 360) % 360;
const isQuarterTurn = (deg: number) => normalizeSheetRotation(deg) % 180 !== 0;
/** Pure layout: where every card goes on every page, in millimetres. */
function computeSheetLayout(
  o: Pick<
    SheetExportOptions,
    "orientation" | "layout" | "position" | "copies"
  > & {
    frontRotation: number;
    backRotation: number;
  },
): SheetLayout {
  const landscape = o.orientation === "landscape";
  const pageWidth = landscape ? PAGE_SIZE_MM.height : PAGE_SIZE_MM.width;
  const pageHeight = landscape ? PAGE_SIZE_MM.width : PAGE_SIZE_MM.height;
  const availW = pageWidth - PAGE_MARGIN_MM * 2;
  const availH = pageHeight - PAGE_MARGIN_MM * 2;
  const dims = (rot: number) =>
    isQuarterTurn(rot)
      ? { w: CARD_SIZE_MM.height, h: CARD_SIZE_MM.width }
      : { w: CARD_SIZE_MM.width, h: CARD_SIZE_MM.height };
  const f = dims(o.frontRotation);
  const b = dims(o.backRotation);
  const stacked = o.layout === "stacked";
  const rowW = stacked ? Math.max(f.w, b.w) : f.w + CARD_GAP_MM + b.w;
  const rowH = stacked ? f.h + CARD_GAP_MM + b.h : Math.max(f.h, b.h);
  // Uniform shrink only if a single row can't fit the printable area.
  const s = Math.min(1, availW / rowW, availH / rowH);
  const gap = CARD_GAP_MM * s;
  const rowGap = ROW_GAP_MM * s;
  const rowHs = rowH * s;
  const rowWs = rowW * s;
  const copies = Math.max(1, Math.floor(o.copies));
  const rowsPerPage = Math.max(
    1,
    Math.floor((availH + rowGap) / (rowHs + rowGap) + 1e-9),
  );
  const singlePage = copies <= rowsPerPage;
  const pages: Placement[][] = [];
  for (let start = 0; start < copies; start += rowsPerPage) {
    const rows = Math.min(rowsPerPage, copies - start);
    const contentH = rows * rowHs + (rows - 1) * rowGap;
    // Vertical position is honoured only when everything fits on one page.
    let top = PAGE_MARGIN_MM;
    if (singlePage && o.position === "center") {
      top += (availH - contentH) / 2;
    }
    if (singlePage && o.position === "bottom") {
      top += availH - contentH;
    }
    const placements: Placement[] = [];
    for (let r = 0; r < rows; r++) {
      const y0 = top + r * (rowHs + rowGap);
      const x0 = PAGE_MARGIN_MM + (availW - rowWs) / 2;
      if (stacked) {
        placements.push({
          side: "front",
          x: PAGE_MARGIN_MM + (availW - f.w * s) / 2,
          y: y0,
          width: f.w * s,
          height: f.h * s,
        });
        placements.push({
          side: "back",
          x: PAGE_MARGIN_MM + (availW - b.w * s) / 2,
          y: y0 + f.h * s + gap,
          width: b.w * s,
          height: b.h * s,
        });
      } else {
        placements.push({
          side: "front",
          x: x0,
          y: y0 + (rowHs - f.h * s) / 2,
          width: f.w * s,
          height: f.h * s,
        });
        placements.push({
          side: "back",
          x: x0 + f.w * s + gap,
          y: y0 + (rowHs - b.h * s) / 2,
          width: b.w * s,
          height: b.h * s,
        });
      }
    }
    pages.push(placements);
  }
  return { pageWidth, pageHeight, pages, scale: s };
}
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load card image."));
    };
    img.src = url;
  });
}
/**
 * Same maths as the CSS brightness/contrast/saturate/grayscale functions.
 * Done per-pixel because ctx.filter is missing in Safari and html2canvas
 * ignores CSS filters.
 */
function applyCardFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  f: CardFilter,
) {
  const b = f.brightness / 100;
  const k = f.contrast / 100;
  const s = f.saturate / 100;
  const g = Math.min(1, Math.max(0, f.grayscale / 100));
  if (b === 1 && k === 1 && s === 1 && g === 0) return;
  const image = ctx.getImageData(0, 0, width, height);
  const d = image.data;
  const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
  const gi = 1 - g;
  for (let i = 0; i < d.length; i += 4) {
    let r = clamp(d[i] * b);
    let gr = clamp(d[i + 1] * b);
    let bl = clamp(d[i + 2] * b);
    r = clamp((r - 127.5) * k + 127.5);
    gr = clamp((gr - 127.5) * k + 127.5);
    bl = clamp((bl - 127.5) * k + 127.5);
    const sr = clamp(
      (0.213 + 0.787 * s) * r +
        (0.715 - 0.715 * s) * gr +
        (0.072 - 0.072 * s) * bl,
    );
    const sg = clamp(
      (0.213 - 0.213 * s) * r +
        (0.715 + 0.285 * s) * gr +
        (0.072 - 0.072 * s) * bl,
    );
    const sb = clamp(
      (0.213 - 0.213 * s) * r +
        (0.715 - 0.715 * s) * gr +
        (0.072 + 0.928 * s) * bl,
    );
    d[i] = clamp(
      (0.2126 + 0.7874 * gi) * sr +
        (0.7152 - 0.7152 * gi) * sg +
        (0.0722 - 0.0722 * gi) * sb,
    );
    d[i + 1] = clamp(
      (0.2126 - 0.2126 * gi) * sr +
        (0.7152 + 0.2848 * gi) * sg +
        (0.0722 - 0.0722 * gi) * sb,
    );
    d[i + 2] = clamp(
      (0.2126 - 0.2126 * gi) * sr +
        (0.7152 - 0.7152 * gi) * sg +
        (0.0722 + 0.9278 * gi) * sb,
    );
  }
  ctx.putImageData(image, 0, 0);
}
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function createWhiteCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas context unavailable.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  return { canvas, ctx };
}
/** Renders ONE card at print resolution: fit -> filter -> rounded corners -> border -> rotation. */
async function renderCardCanvas(
  input: CardInput,
  filter: CardFilter,
  rounded: boolean,
): Promise<HTMLCanvasElement> {
  const img = await loadImageFromFile(input.file);
  const pxPerMm = EXPORT_DPI / MM_PER_INCH;
  const w = Math.round(CARD_SIZE_MM.width * pxPerMm);
  const h = Math.round(CARD_SIZE_MM.height * pxPerMm);
  // 1) image fitted like the preview (object-cover / object-contain)
  const base = createWhiteCanvas(w, h);
  base.ctx.imageSmoothingEnabled = true;
  base.ctx.imageSmoothingQuality = "high";
  const k =
    input.fit === "cover"
      ? Math.max(w / img.naturalWidth, h / img.naturalHeight)
      : Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * k;
  const dh = img.naturalHeight * k;
  base.ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  // 2) filters
  applyCardFilter(base.ctx, w, h, filter);
  // 3) rounded clip + border on a white card
  const radius = rounded ? CARD_RADIUS_MM * pxPerMm : 0;
  const borderPx = Math.max(1, Math.round(CARD_BORDER_MM * pxPerMm));
  const card = createWhiteCanvas(w, h);
  card.ctx.save();
  roundedRectPath(card.ctx, 0, 0, w, h, radius);
  card.ctx.clip();
  card.ctx.drawImage(base.canvas, 0, 0);
  card.ctx.restore();
  card.ctx.lineWidth = borderPx;
  card.ctx.strokeStyle = CARD_BORDER_COLOR;
  roundedRectPath(
    card.ctx,
    borderPx / 2,
    borderPx / 2,
    w - borderPx,
    h - borderPx,
    Math.max(0, radius - borderPx / 2),
  );
  card.ctx.stroke();
  // 4) rotation (multiples of 90)
  const rot = normalizeSheetRotation(input.rotation);
  if (rot === 0) return card.canvas;
  const swap = rot % 180 !== 0;
  const out = createWhiteCanvas(swap ? h : w, swap ? w : h);
  out.ctx.translate(out.canvas.width / 2, out.canvas.height / 2);
  out.ctx.rotate((rot * Math.PI) / 180);
  out.ctx.drawImage(card.canvas, -w / 2, -h / 2);
  return out.canvas;
}
async function renderCards(o: SheetExportOptions) {
  const [front, back] = await Promise.all([
    o.front ? renderCardCanvas(o.front, o.filter, o.roundedCorners) : null,
    o.back ? renderCardCanvas(o.back, o.filter, o.roundedCorners) : null,
  ]);
  return { front, back } as Record<CardSide, HTMLCanvasElement | null>;
}
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Canvas export failed.")),
      type,
      quality,
    ),
  );
}
/** PDF: exact A4, 300 DPI cards at mm coordinates, multi-page, images embedded once per side. */
async function exportSheetToPdf(
  o: SheetExportOptions,
  filename = "nid-card.pdf",
) {
  const layout = computeSheetLayout({
    ...o,
    frontRotation: o.front?.rotation ?? 0,
    backRotation: o.back?.rotation ?? 0,
  });
  const cards = await renderCards(o);
  const pdf = new jsPDF({
    orientation: o.orientation,
    unit: "mm",
    format: "a4",
    compress: true,
  });
  pdf.setProperties({ title: "NID Card" });
  const dataUrls: Partial<Record<CardSide, string>> = {};
  (["front", "back"] as const).forEach((side) => {
    const c = cards[side];
    if (c) {
      dataUrls[side] = c.toDataURL("image/jpeg", JPEG_QUALITY);
    }
  });
  layout.pages.forEach((placements, pageIndex) => {
    if (pageIndex > 0) {
      pdf.addPage("a4", o.orientation);
    }
    placements.forEach((placement) => {
      const url = dataUrls[placement.side];
      if (!url) return;
      // Same alias => jsPDF stores the JPEG once, however many copies are placed.
      pdf.addImage(
        url,
        "JPEG",
        placement.x,
        placement.y,
        placement.width,
        placement.height,
        `nid-${placement.side}`,
        "NONE",
      );
    });
  });
  pdf.save(filename);
}
/** Print: isolated hidden iframe, @page A4, mm-positioned images. Never touches the React tree. */
async function printSheet(o: SheetExportOptions) {
  const layout = computeSheetLayout({
    ...o,
    frontRotation: o.front?.rotation ?? 0,
    backRotation: o.back?.rotation ?? 0,
  });
  const cards = await renderCards(o);
  const blobUrls: Partial<Record<CardSide, string>> = {};
  for (const side of ["front", "back"] as const) {
    const c = cards[side];
    if (c) {
      blobUrls[side] = URL.createObjectURL(
        await canvasToBlob(c, "image/jpeg", JPEG_QUALITY),
      );
    }
  }
  const mm = (v: number) => `${v.toFixed(3)}mm`;
  const pagesHtml = layout.pages
    .map(
      (placements) =>
        `<section class="page">${placements
          .filter((placement) => blobUrls[placement.side])
          .map(
            (placement) =>
              `<img class="card" alt={t("")} src="${blobUrls[placement.side]}" style="left:${mm(placement.x)};top:${mm(placement.y)};width:${mm(placement.width)};height:${mm(placement.height)}">`,
          )
          .join("")}</section>`,
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>NID Card</title>
<style>
  @page { size: A4 ${o.orientation}; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  /* 1mm shorter than the sheet so sub-pixel rounding never spawns a blank extra page */
  .page { position: relative; width: ${mm(layout.pageWidth)}; height: ${mm(layout.pageHeight - 1)};
          overflow: hidden; break-after: page; page-break-after: always; }
  .page:last-child { break-after: auto; page-break-after: auto; }
  .card { position: absolute; display: block; }
</style></head><body>${pagesHtml}</body></html>`;
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.tabIndex = -1;
  Object.assign(iframe.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: mm(layout.pageWidth),
    height: mm(layout.pageHeight),
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
    Object.values(blobUrls).forEach((url) => url && URL.revokeObjectURL(url));
  };
  try {
    // srcdoc + onload are set BEFORE attaching (avoids the about:blank load quirk in Firefox)
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = html;
      document.body.appendChild(iframe);
    });
    const win = iframe.contentWindow;
    const doc = iframe.contentDocument;
    if (!win || !doc) {
      throw new Error("Print frame unavailable.");
    }
    await Promise.all(
      Array.from(doc.images).map((img) => img.decode().catch(() => undefined)),
    );
    win.addEventListener("afterprint", cleanup, { once: true });
    window.setTimeout(cleanup, 5 * 60 * 1000); // Safari may not fire afterprint
    win.focus();
    win.print();
  } catch (error) {
    cleanup();
    throw error;
  }
}
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
        // Normalizing the auto-crop result here keeps Auto Crop visually
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
/**
 * Puts four detected corners in top-left, top-right, bottom-right,
 * bottom-left order. The NID frame is landscape (CR80), so if the card is
 * lying upright in the photo the order is turned by 90 degrees (clockwise) to
 * get a landscape result instead of a stretched one.
 */
function orderCardCorners(points: CropPoint[]): CropPoint[] {
  const bySum = [...points].sort((a, b) => a.x + a.y - (b.x + b.y));
  const byDiff = [...points].sort((a, b) => a.x - a.y - (b.x - b.y));
  const tl = bySum[0];
  const br = bySum[bySum.length - 1];
  const bl = byDiff[0];
  const tr = byDiff[byDiff.length - 1];
  const width =
    (Math.hypot(tr.x - tl.x, tr.y - tl.y) +
      Math.hypot(br.x - bl.x, br.y - bl.y)) /
    2;
  const height =
    (Math.hypot(bl.x - tl.x, bl.y - tl.y) +
      Math.hypot(br.x - tr.x, br.y - tr.y)) /
    2;
  return width >= height ? [tl, tr, br, bl] : [bl, tl, tr, br];
}
/**
 * Auto crop, 100% client-side: finds the card corners with OpenCV.js
 * (documentCorners.ts) and straightens the card to the fixed NID frame.
 * Returns the cropped PNG, like the old backend call did.
 */
async function autoCropCanvas(
  canvas: HTMLCanvasElement,
  signal?: AbortSignal,
): Promise<Blob> {
  await waitForOpenCv(signal);
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  // Let the processing indicator paint before the heavy work starts.
  await new Promise((resolve) => setTimeout(resolve, 0));
  const detected = detectDocumentCornersCv(getOpenCv(), canvas);
  if (!detected) throw new Error(AUTO_CROP_ERROR);
  const corners = orderCardCorners(
    detected.map((point: { x: number; y: number }) => ({
      x: point.x * canvas.width,
      y: point.y * canvas.height,
    })),
  );
  try {
    return await warpPerspective(canvas, corners);
  } catch {
    throw new Error(AUTO_CROP_ERROR);
  }
}
// --- PERSPECTIVE WARP HELPER FUNCTIONS ---
type CropPoint = {
  x: number;
  y: number;
};
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
  img: HTMLImageElement | HTMLCanvasElement,
  corners: CropPoint[],
  outWidth = 856,
  outHeight = 540,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const isCanvas = img instanceof HTMLCanvasElement;
    const naturalWidth = isCanvas ? img.width : img.naturalWidth;
    const naturalHeight = isCanvas ? img.height : img.naturalHeight;
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
  const { t } = useNidText();
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
    e: ReactPointerEvent<SVGCircleElement>,
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
  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
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
  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
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
    <div className="fixed inset-0 z-[9998] w-screen h-[100dvh] min-h-[100svh] bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] flex flex-col font-sans page-font select-none overflow-hidden">
      <div className="bg-[#FBF6E8] border-b border-[#E3D6B8] px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="min-w-0 pr-3">
          <div className="flex items-center gap-2">
            <Crop size={16} className="text-[#DC2626] shrink-0" />
            <h2 className="text-[17px] font-bold text-[#3B2F1E] truncate">
              <NidT>{"Crop \u2014 "}</NidT>
              {sideTitle}
            </h2>
          </div>
          <p className="text-[13px] text-[#6B5A40] font-medium ml-6 truncate">
            {file.name}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="p-1.5 text-[#7A6A50] hover:text-[#3B2F1E] bg-[#F6EEDB] hover:bg-[#EFE3C8] rounded-lg border border-[#E3D6B8] transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
          aria-label={t("Close manual crop")}
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-4 sm:px-6 py-2 bg-[#F6EEDB]/50 text-[13px] text-[#6B5A40] font-medium border-b border-[#E3D6B8] shrink-0">
        <NidT>
          {
            "Drag all four orange corner handles onto the card edges. The selected\n        area will be straightened to a CR80-sized rectangle.\n      "
          }
        </NidT>
      </div>

      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={() => {
          // Pointer capture keeps an active drag alive even after leaving the stage.
        }}
        className="flex-1 min-h-0 w-full flex items-center justify-center p-3 sm:p-4 relative overflow-auto scroll touch-none"
      >
        <div className="relative inline-block max-w-full max-h-full shadow-lg rounded-sm bg-white touch-none">
          {imageUrl && (
            <img
              ref={imgRef}
              src={imageUrl}
              alt={t("Crop target")}
              draggable={false}
              onLoad={updateDisplaySize}
              className="max-w-[calc(100vw-24px)] sm:max-w-[calc(100vw-48px)] max-h-[calc(100vh-190px)] object-contain block pointer-events-none select-none"
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
                    fill="#2563EB"
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
            <div className="absolute inset-0 flex items-center justify-center bg-[#FBF6E8] text-[13px] font-semibold text-[#6B5A40] min-w-[280px] min-h-[180px]">
              <NidT>{"Loading image\u2026\n            "}</NidT>
            </div>
          )}

          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#FBF6E8] p-6 text-center text-[13px] font-semibold text-[#B91C1C] min-w-[280px] min-h-[180px]">
              <NidT>{imageError}</NidT>
            </div>
          )}

          {isProcessing && !imageError && (
            <div className="absolute inset-0 bg-[#FBF6E8]/45 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <div className="rounded-full bg-[#3B2F1E] text-white px-3 py-1.5 text-[12px] font-bold shadow-lg">
                <NidT>{"Cropping\u2026\n              "}</NidT>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#FBF6E8] border-t border-[#E3D6B8] px-4 sm:px-6 py-3 shrink-0">
        {cropError && (
          <div className="mb-2 rounded-xl border border-[#FBB6B6] bg-[#FEE9E9] px-3 py-2 text-[13px] font-semibold text-[#B91C1C]">
            <NidT>{cropError}</NidT>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleResetPoints}
            disabled={isProcessing || isImageLoading || !!imageError}
            className="px-4 py-2 border border-[#E3D6B8] text-[#3B2F1E] text-[15px] font-bold rounded-xl hover:bg-[#EFE3C8] transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <NidT>{"Reset corners\n          "}</NidT>
          </button>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 py-2 border border-[#E3D6B8] text-[#3B2F1E] text-[15px] font-bold rounded-xl hover:bg-[#EFE3C8] transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <NidT>{"Cancel\n            "}</NidT>
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
              className="px-5 py-2 bg-[#D42020] hover:bg-[#AE1717] text-white text-[15px] font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <NidT>{"Cropping…"}</NidT>
              ) : (
                <NidT>{"Apply crop"}</NidT>
              )}
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
  const { t } = useNidText();
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
  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
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
      className="fixed inset-0 z-[9999] w-screen h-[100dvh] min-h-[100svh] bg-[#3B2F1E]/95 backdrop-blur-md flex flex-col font-sans page-font overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nid-crop-review-title"
    >
      <div className="bg-[#FBF6E8] border-b border-[#E3D6B8] px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg shrink-0">
        <div className="min-w-0 pr-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <Eye size={16} />
            </div>
            <div className="min-w-0">
              <h2
                id="nid-crop-review-title"
                className="text-[17px] sm:text-[18px] font-extrabold text-[#3B2F1E] truncate"
              >
                <NidT>{"Crop Preview \u2014 "}</NidT>
                {sideTitle}
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[#6B5A40] font-medium truncate mt-0.5">
                <NidT>
                  {
                    "This is the exact cropped image that will be used in your PDF.\n              "
                  }
                </NidT>
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 text-[#7A6A50] hover:text-[#3B2F1E] bg-[#F6EEDB] hover:bg-[#EFE3C8] rounded-xl border border-[#E3D6B8] transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 shrink-0"
          aria-label={t("Close crop preview")}
        >
          <X size={17} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto scroll px-4 py-5 sm:px-6 sm:py-7">
        <div className="w-full min-h-full flex flex-col items-center justify-center">
          <div className="w-full max-w-7xl rounded-3xl border border-[#FBF6E8]/15 bg-[#FBF6E8]/10 p-2 sm:p-4 shadow-xl">
            <div className="w-full rounded-2xl bg-[#F3E9D2] border border-[#FBF6E8]/20 flex items-center justify-center overflow-hidden relative [background-image:radial-gradient(#B0A080_1px,transparent_1px)] [background-size:16px_16px]">
              <div
                className="relative w-[min(96vw,1240px)] max-h-[74vh] aspect-[856/540] rounded-xl bg-white overflow-hidden shadow-[0_18px_50px_rgba(59,47,30,0.3)]"
                style={{
                  aspectRatio: `${NID_CROP_WIDTH} / ${NID_CROP_HEIGHT}`,
                }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={t(`Final cropped ${sideTitle}`)}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    draggable={false}
                    className="absolute inset-0 block w-full h-full max-w-none max-h-none object-fill select-none bg-white"
                  />
                )}

                {imageLoading && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#FBF6E8]/90">
                    <div className="rounded-full bg-[#3B2F1E]/90 text-white px-4 py-2 text-[13px] font-bold shadow-xl">
                      <NidT>
                        {"Loading final crop\u2026\n                    "}
                      </NidT>
                    </div>
                  </div>
                )}

                {imageError && (
                  <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-[15px] sm:text-[16px] font-semibold text-[#B91C1C] bg-[#FBF6E8]">
                    <NidT>{imageError}</NidT>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full max-w-7xl mt-4 rounded-2xl border border-[#FBF6E8]/10 bg-[#FBF6E8]/95 shadow-xl px-4 py-3.5 sm:px-5 sm:py-4 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    className="text-emerald-600 shrink-0"
                  />
                  <p className="text-[15px] sm:text-[17px] font-extrabold text-[#3B2F1E]">
                    <NidT>{"Review the final crop\n                  "}</NidT>
                  </p>
                </div>
                <p className="text-[13px] sm:text-[14px] text-[#6B5A40] font-medium mt-1.5 leading-relaxed">
                  <NidT>
                    {
                      "Check that the full NID card is visible, all four corners are\n                  included, and no important text or edge is cut off.\n                "
                    }
                  </NidT>
                </p>
                {dimensions.width > 0 && dimensions.height > 0 && (
                  <p className="text-[13px] text-[#6B5A40] font-semibold mt-1">
                    <NidT>{"Output size: "}</NidT>
                    {dimensions.width}
                    <NidT>{"\u00D7 "}</NidT>
                    {dimensions.height}
                    <NidT>{"px\n                  "}</NidT>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full lg:w-auto lg:min-w-[430px] shrink-0">
                <button
                  type="button"
                  onClick={onManualCrop}
                  disabled={imageLoading || !!imageError}
                  className="group rounded-2xl border border-[#E3D6B8] bg-[#F6EEDB] px-4 py-3 text-left hover:bg-[#EFE3C8] hover:border-[#DC2626] transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-[#FBF6E8] text-[#DC2626] border border-[#E3D6B8] flex items-center justify-center shrink-0 shadow-sm">
                      <Crop size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-extrabold text-[#3B2F1E]">
                        <NidT>
                          {"Not correct? Crop manually\n                      "}
                        </NidT>
                      </span>
                      <span className="block text-[13px] font-semibold text-[#DC2626]/80 mt-0.5">
                        <NidT>
                          {
                            "Adjust all 4 card corners yourself\n                      "
                          }
                        </NidT>
                      </span>
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={imageLoading || !!imageError}
                  className="group rounded-2xl bg-[#D42020] hover:bg-[#AE1717] px-4 py-3 text-left transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-[#FBF6E8]/15 text-white border border-[#FBF6E8]/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-extrabold text-white">
                        <NidT>
                          {
                            "Looks correct \u2014 use this crop\n                      "
                          }
                        </NidT>
                      </span>
                      <span className="block text-[13px] font-semibold text-white/90 mt-0.5">
                        <NidT>
                          {
                            "Keep this image and continue to PDF\n                      "
                          }
                        </NidT>
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
  const { t } = useNidText();
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
  const previewStageRef = useRef<HTMLDivElement>(null);
  const [previewFitScale, setPreviewFitScale] = useState<number>(1);
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
  const isPrintingRef = useRef(false);
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
  // Start downloading OpenCV.js as soon as Auto crop is switched on, so the
  // first crop does not have to wait for it.
  useEffect(() => {
    if (!autoCrop) return;
    const controller = new AbortController();
    void waitForOpenCv(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [autoCrop]);
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
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        AUTO_CROP_TIMEOUT_MS,
      );
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
            // File -> Image -> baked rotation canvas -> OpenCV corners -> warp.
            const workingCanvas = createRotatedCanvas(img, sideRotation);
            const rotatedSourceFile = await canvasToPngFile(
              workingCanvas,
              `${side}-manual-source.png`,
            );
            const responseBlob = await autoCropCanvas(
              workingCanvas,
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
              // Rotation was baked into the image before auto crop.
              setFrontRotation(0);
            } else {
              setBackImage(croppedFile);
              setBackCropSource(rotatedSourceFile);
              setBackAutoCropped(true);
              setBackCropReviewReady(true);
              // Rotation was baked into the image before auto crop.
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
  const handleFrontImage = (e: ChangeEvent<HTMLInputElement>) => {
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
  const handleBackImage = (e: ChangeEvent<HTMLInputElement>) => {
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
  const imageFilterParams = useMemo<CardFilter>(() => {
    let brightness = 100 + shadowRemoval * 0.4;
    let contrast = 100 + blackBoost * 0.6 + textDeepen * 0.5;
    let saturate = 100 + saturation;
    let grayscale = 0;
    if (filterPreset === "bw") {
      grayscale = 100;
      contrast += 40;
      saturate = 0;
    }
    return { brightness, contrast, saturate, grayscale };
  }, [shadowRemoval, blackBoost, saturation, textDeepen, filterPreset]);
  // Preview still uses the CSS string, so the JSX using imageFilterStyle keeps working.
  const imageFilterStyle = useMemo(
    () =>
      `brightness(${imageFilterParams.brightness}%) contrast(${imageFilterParams.contrast}%) saturate(${imageFilterParams.saturate}%) grayscale(${imageFilterParams.grayscale}%)`,
    [imageFilterParams],
  );
  // Real 85.6x54mm card at the preview scale. Identical in print and PDF.
  const cardDim = useMemo(
    () => ({
      width: CARD_SIZE_MM.width * PREVIEW_PX_PER_MM,
      height: CARD_SIZE_MM.height * PREVIEW_PX_PER_MM,
    }),
    [],
  );
  // A4-exact preview sheet metrics.
  const sheetPx = useMemo(() => {
    const landscape = orientation === "landscape";
    return {
      width:
        (landscape ? PAGE_SIZE_MM.height : PAGE_SIZE_MM.width) *
        PREVIEW_PX_PER_MM,
      height:
        (landscape ? PAGE_SIZE_MM.width : PAGE_SIZE_MM.height) *
        PREVIEW_PX_PER_MM,
      margin: PAGE_MARGIN_MM * PREVIEW_PX_PER_MM,
      rowGap: ROW_GAP_MM * PREVIEW_PX_PER_MM,
      cardGap: CARD_GAP_MM * PREVIEW_PX_PER_MM,
    };
  }, [orientation]);
  // Fit the A4 preview to the available panel height so the whole sheet is visible.
  useEffect(() => {
    const stage = previewStageRef.current;
    if (!stage) return;

    const updateFitScale = () => {
      const availableWidth = Math.max(1, stage.clientWidth - 24);
      const availableHeight = Math.max(1, stage.clientHeight - 24);
      const nextScale = Math.min(
        availableWidth / sheetPx.width,
        availableHeight / sheetPx.height,
        1,
      );
      if (Number.isFinite(nextScale) && nextScale > 0) {
        setPreviewFitScale((current) =>
          Math.abs(current - nextScale) > 0.003 ? nextScale : current,
        );
      }
    };

    updateFitScale();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateFitScale);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [sheetPx.height, sheetPx.width]);
  // Page count for the preview badge when many copies overflow.
  const sheetLayout = useMemo(
    () =>
      computeSheetLayout({
        orientation,
        layout,
        position,
        copies,
        frontRotation,
        backRotation,
      }),
    [orientation, layout, position, copies, frontRotation, backRotation],
  );
  const isFrontPortrait = frontRotation % 180 !== 0;
  const isBackPortrait = backRotation % 180 !== 0;
  const frontWrapperWidth = isFrontPortrait ? cardDim.height : cardDim.width;
  const frontWrapperHeight = isFrontPortrait ? cardDim.width : cardDim.height;
  const backWrapperWidth = isBackPortrait ? cardDim.height : cardDim.width;
  const backWrapperHeight = isBackPortrait ? cardDim.width : cardDim.height;
  const buildSheetExportOptions = (): SheetExportOptions => ({
    orientation,
    layout,
    position,
    copies,
    roundedCorners,
    filter: imageFilterParams,
    front: frontImage
      ? {
          file: frontImage,
          rotation: frontRotation,
          fit: frontCropReviewReady ? "cover" : "contain",
        }
      : null,
    back: backImage
      ? {
          file: backImage,
          rotation: backRotation,
          fit: backCropReviewReady ? "cover" : "contain",
        }
      : null,
  });
  const handlePrint = async () => {
    if (isPrintingRef.current || (!frontImage && !backImage)) return;
    isPrintingRef.current = true;
    try {
      await printSheet(buildSheetExportOptions());
    } catch (error) {
      console.error("Error preparing print:", error);
      setProcessingError("Could not prepare the print job. Please try again.");
    } finally {
      isPrintingRef.current = false;
    }
  };
  const handleCreatePdf = async () => {
    if (isGeneratingPdf || (!frontImage && !backImage)) return;
    setIsGeneratingPdf(true);
    try {
      await exportSheetToPdf(buildSheetExportOptions());
    } catch (error) {
      console.error("Error generating PDF:", error);
      setProcessingError("Could not generate the PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  return (
    <div className="nid-joiner-fit-screen w-full text-[#3B2F1E] font-sans page-font">
      <style>{NID_PAGE_CSS}</style>
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
          className="fixed inset-0 z-[60] bg-[#3B2F1E]/45 backdrop-blur-[2px] flex items-center justify-center p-4"
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
            className="w-full max-w-md bg-[#FBF6E8] rounded-2xl border border-[#E3D6B8] shadow-xl overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#E3D6B8] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#F6EEDB] text-[#DC2626] border border-[#E3D6B8] flex items-center justify-center shrink-0">
                    <Crop size={16} />
                  </div>
                  <div>
                    <h2
                      id="nid-auto-crop-choice-title"
                      className="text-[17px] font-extrabold text-[#3B2F1E]"
                    >
                      <NidT>{"Choose Auto Crop\n                    "}</NidT>
                    </h2>
                    <p className="text-[13px] text-[#6B5A40] font-medium mt-0.5">
                      <NidT>
                        {
                          "You uploaded both sides. Which image should be\n                      auto-cropped?\n                    "
                        }
                      </NidT>
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
                className="p-1.5 rounded-lg bg-[#F6EEDB] border border-[#E3D6B8] text-[#7A6A50] hover:text-[#3B2F1E] hover:bg-[#EFE3C8] transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 shrink-0"
                aria-label={t("Close auto crop selection")}
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-2.5">
              <button
                type="button"
                onClick={() => handleAutoCropChoice("front")}
                disabled={processingSide !== null || !frontImage}
                className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] hover:border-[#DC2626] hover:bg-[#EFE3C8] hover:-translate-y-0.5 hover:shadow-sm transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 disabled:opacity-70 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F3E9D2] flex items-center justify-center text-[#3B2F1E] text-[15px] font-extrabold">
                    <NidT>{"F\n                  "}</NidT>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-[#3B2F1E]">
                      <NidT>{"Front only\n                    "}</NidT>
                    </p>
                    <p className="text-[13px] text-[#6B5A40] mt-0.5">
                      <NidT>
                        {"Auto-crop only the front side.\n                    "}
                      </NidT>
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-[#7A6A50]" />
              </button>

              <button
                type="button"
                onClick={() => handleAutoCropChoice("back")}
                disabled={processingSide !== null || !backImage}
                className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] hover:border-[#DC2626] hover:bg-[#EFE3C8] hover:-translate-y-0.5 hover:shadow-sm transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 disabled:opacity-70 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F3E9D2] flex items-center justify-center text-[#3B2F1E] text-[15px] font-extrabold">
                    <NidT>{"B\n                  "}</NidT>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-[#3B2F1E]">
                      <NidT>{"Back only\n                    "}</NidT>
                    </p>
                    <p className="text-[13px] text-[#6B5A40] mt-0.5">
                      <NidT>
                        {"Auto-crop only the back side.\n                    "}
                      </NidT>
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-[#7A6A50]" />
              </button>

              <button
                type="button"
                onClick={() => handleAutoCropChoice("both")}
                disabled={processingSide !== null}
                className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E3D6B8] bg-[#F6EEDB]/60 hover:bg-[#EFE3C8]/70 transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 disabled:opacity-70 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FEE9E9] text-[#DC2626] flex items-center justify-center text-[15px] font-extrabold">
                    <NidT>{"FB\n                  "}</NidT>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-[#3B2F1E]">
                      <NidT>{"Both sides\n                    "}</NidT>
                    </p>
                    <p className="text-[13px] text-[#6B5A40] mt-0.5">
                      <NidT>
                        {
                          "Auto-crop front and back sequentially.\n                    "
                        }
                      </NidT>
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-[#DC2626]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setAutoCropChoiceOpen(false);
                  setAutoCrop(false);
                  cancelAutoCropProcessing();
                }}
                className="w-full py-2.5 mt-1 rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] text-[#3B2F1E] hover:bg-[#EFE3C8] text-[15px] font-bold transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
              >
                <NidT>{"Cancel\n              "}</NidT>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="nid-joiner-breadcrumb flex items-center gap-2 text-[15px] text-[#7A6A50]">
        <Link
          href="/sohoj-tools"
          className="flex items-center gap-1 hover:text-[#3B2F1E] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>
            <NidT>{"Back to Tools"}</NidT>
          </span>
        </Link>
        <span>
          <NidT>{"/"}</NidT>
        </span>
        <span>
          <NidT>{"Image Tools"}</NidT>
        </span>
        <span>
          <NidT>{"/"}</NidT>
        </span>
        <span className="font-semibold text-[#3B2F1E]">
          <NidT>{"NID Joiner"}</NidT>
        </span>
      </div>

      <div className="nid-joiner-hero bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            <CreditCard size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-bold text-[#3B2F1E]">
                <NidT>{"NID Joiner"}</NidT>
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[12px] font-bold px-2 py-0.5 rounded-full">
                <NidT>{"Free\n              "}</NidT>
              </span>
            </div>
            <p className="text-[15px] text-[#7A6A50] font-medium mt-0.5">
              <NidT>
                {
                  "Turn NID card front and back photos into a clean A4 PDF \u2014 all in\n              your browser.\n            "
                }
              </NidT>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-[#7A6A50] hover:text-[#5A4A32] bg-[#F6EEDB] hover:bg-[#EFE3C8] rounded-xl transition-all border border-[#E3D6B8] cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40">
            <Star size={16} />
          </button>
          <button className="p-2 text-[#7A6A50] hover:text-[#5A4A32] bg-[#F6EEDB] hover:bg-[#EFE3C8] rounded-xl transition-all border border-[#E3D6B8] cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="nid-joiner-main grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="nid-joiner-settings lg:col-span-4 scroll">
        <NidSettingsPanel
          autoCrop={autoCrop}
          setAutoCrop={handleAutoCropToggle}
          processingSide={processingSide}
          processingError={processingError ? t(processingError) : null}
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
        </div>

        <div className="nid-joiner-preview lg:col-span-8 bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#E3D6B8] pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold text-[#3B2F1E]">
                <NidT>{"Live preview"}</NidT>
              </h2>
              <span className="text-[13px] text-[#6B5A40] font-medium">
                <NidT>{"A4 \u2014 210 \u00D7 297 mm\n                "}</NidT>
                {sheetLayout.pages.length > 1 ? (
                  <NidT>{` · ${sheetLayout.pages.length} pages`}</NidT>
                ) : (
                  <NidT>{""}</NidT>
                )}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[15px] text-[#7A6A50] font-bold">
              <span>
                {zoom}
                <NidT>{"%"}</NidT>
              </span>
              <button
                onClick={() => setZoom((prev) => Math.min(prev + 10, 150))}
                className="hover:text-[#3B2F1E] p-1 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
                title={t("Zoom In")}
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={handleGlobalRotate}
                className="hover:text-[#3B2F1E] p-1 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
                title={t("Rotate Canvas")}
              >
                <RefreshCw size={13} />
              </button>
              <button
                onClick={() => setZoom((prev) => Math.max(prev - 10, 50))}
                className="hover:text-[#3B2F1E] p-1 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
                title={t("Zoom Out")}
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={() => setZoom(100)}
                className="hover:text-[#3B2F1E] p-1 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
                title={t("Reset Zoom")}
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {(processingSide || processingError) && (
            <div className="mt-3 space-y-2">
              {processingSide && (
                <div className="flex items-center gap-2 rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] px-3 py-2 text-[14px] font-semibold text-[#DC2626]">
                  <RefreshCw size={13} className="animate-spin shrink-0" />
                  <span>
                    <NidT>{"Auto cropping"}</NidT>
                    {<NidT> </NidT>}
                    {processingBoth ? (
                      <NidT>{"front and back"}</NidT>
                    ) : (
                      <NidT>
                        {processingSide === "front" ? "front" : "back"}
                      </NidT>
                    )}
                    {<NidT> </NidT>}
                    <NidT>{"NID photo\u2026\n                  "}</NidT>
                  </span>
                </div>
              )}

              {processingError && !processingSide && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#FBB6B6] bg-[#FEE9E9] px-3 py-2 text-[14px] font-semibold text-[#B91C1C]"
                >
                  <NidT>{processingError}</NidT>
                </div>
              )}
            </div>
          )}

          <div ref={previewStageRef} className="nid-preview-stage relative bg-[#F3E9D2] border border-[#E3D6B8]/80 rounded-2xl p-8 my-4 flex-1 flex justify-center items-start min-h-0 overflow-auto scroll [background-image:radial-gradient(#B0A080_1.2px,transparent_1.2px)] [background-size:16px_16px]">
            <div
              className="nid-sheet-fit-wrap shrink-0"
              style={{
                width: sheetPx.width * previewFitScale * (zoom / 100),
                height: sheetPx.height * previewFitScale * (zoom / 100),
              }}
            >
            <div
              id="printable-sheet"
              className="bg-white shadow-[0_10px_30px_rgba(59,47,30,0.12)] border border-[#E3D6B8]/60 transition-all duration-300 flex flex-col items-center shrink-0"
              style={{
                width: sheetPx.width,
                minHeight: sheetPx.height,
                padding: sheetPx.margin,
                boxSizing: "border-box",
                justifyContent:
                  position === "top"
                    ? "flex-start"
                    : position === "center"
                      ? "center"
                      : "flex-end",
                transform: `scale(${(zoom / 100) * previewFitScale})`,
                transformOrigin: "top left",
              }}
            >
              <div
                className="w-full flex flex-col items-center"
                style={{ rowGap: sheetPx.rowGap }}
              >
                {Array.from({ length: copies }).map((_, copyIndex) => (
                  <div
                    key={copyIndex}
                    className={`relative w-full flex justify-center items-center ${layout === "side-by-side" ? "flex-row" : "flex-col"}`}
                    style={{ gap: sheetPx.cardGap }}
                  >
                    {copyIndex === 0 && imageCount > 0 && (
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#3B2F1E]/90 text-white rounded-full p-1 flex items-center gap-1 shadow-xl border border-[#4A3B26]/50 z-20 backdrop-blur-xs print:hidden">
                        {imageCount === 2 && (
                          <>
                            <button
                              onClick={handleSwap}
                              className="w-6 h-6 rounded-full bg-[#DC2626] hover:bg-[#EF4444] text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                              title={t("Swap Front and Back")}
                            >
                              <ArrowLeftRight size={12} />
                            </button>
                            <button
                              onClick={() =>
                                setCopies((c) => Math.min(c + 1, 4))
                              }
                              className="w-6 h-6 rounded-full bg-[#DC2626] hover:bg-[#EF4444] text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                              title={t("Add Copy")}
                            >
                              <Copy size={12} />
                            </button>
                          </>
                        )}

                        <button
                          onClick={handleGlobalRotate}
                          className="w-6 h-6 rounded-full bg-[#DC2626] hover:bg-[#EF4444] text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                          title={t("Rotate All 90°")}
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
                        className={`absolute overflow-hidden transition-all duration-300 ${roundedCorners ? "rounded-[8px]" : "rounded-none"}`}
                        style={{
                          width: cardDim.width,
                          height: cardDim.height,
                          transform: `rotate(${frontRotation}deg)`,
                        }}
                      >
                        {frontImageUrl ? (
                          <div
                            className={`relative group w-full h-full overflow-hidden flex justify-center items-center bg-transparent border border-[#E3D6B8] ${
                              frontCropReviewReady && processingSide !== "front"
                                ? "cursor-zoom-in hover:ring-2 hover:ring-[#DC2626]/40"
                                : ""
                            }`}
                            role={frontCropReviewReady ? "button" : undefined}
                            tabIndex={frontCropReviewReady ? 0 : undefined}
                            title={
                              frontCropReviewReady
                                ? t("Click to verify this cropped image")
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
                              <div className="absolute inset-0 z-20 bg-[#FBF6E8]/70 backdrop-blur-[1px] flex items-center justify-center">
                                <div className="flex items-center gap-2 rounded-full bg-[#3B2F1E] text-white px-3 py-1.5 text-[12px] font-bold shadow-lg">
                                  <RefreshCw
                                    size={12}
                                    className="animate-spin"
                                  />
                                  <NidT>
                                    {
                                      "Auto cropping front\u2026\n                                "
                                    }
                                  </NidT>
                                </div>
                              </div>
                            )}

                            {frontCropReviewReady &&
                              processingSide !== "front" && (
                                <span className="absolute top-2 left-2 z-10 rounded-full bg-emerald-600 text-white px-2 py-1 text-[11px] font-bold shadow-md print:hidden flex items-center gap-1">
                                  <Eye size={10} />
                                  {frontAutoCropped ? (
                                    <NidT>
                                      {"Auto crop applied · Click to verify"}
                                    </NidT>
                                  ) : (
                                    <NidT>
                                      {"Manual crop applied · Click to verify"}
                                    </NidT>
                                  )}
                                </span>
                              )}

                            <img
                              src={frontImageUrl}
                              alt={t("Front NID")}
                              className={`block w-full h-full max-w-none max-h-none bg-white ${
                                frontCropReviewReady
                                  ? "object-cover"
                                  : "object-contain"
                              }`}
                              style={{ filter: imageFilterStyle }}
                            />

                            <div
                              className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#3B2F1E]/90 text-white rounded-full px-2.5 py-1 flex items-center gap-2 shadow-xl border border-[#4A3B26]/50 z-30 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-200 print:hidden"
                              onClick={(event) => event.stopPropagation()}
                              onMouseDown={(event) => event.stopPropagation()}
                            >
                              <button
                                onClick={() => setCroppingSide("front")}
                                className="p-1 hover:text-[#F87171] transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
                                title={t("Crop")}
                              >
                                <Crop size={13} />
                              </button>
                              <label
                                htmlFor="front-change-input"
                                onClick={(event) => event.stopPropagation()}
                                className="p-1 hover:text-[#F87171] transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
                                title={t("Change Image")}
                              >
                                <Upload size={13} />
                              </label>
                              <button
                                onClick={() =>
                                  setFrontRotation((prev) => (prev + 90) % 360)
                                }
                                className="p-1 hover:text-[#F87171] transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
                                title={t("Rotate 90°")}
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
                                className="p-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
                                title={t("Delete")}
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
                          <label className="border-2 border-dashed border-[#B0A080] hover:border-[#DC2626]/50 bg-[#F6EEDB]/40 hover:bg-[#EFE3C8]/70 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer w-full h-full transition-all">
                            <div className="w-8 h-8 bg-[#FEE9E9]/80 text-[#DC2626] rounded-full flex items-center justify-center mb-2">
                              <Upload size={16} />
                            </div>
                            <span className="text-[15px] font-bold text-[#3B2F1E]">
                              <NidT>
                                {
                                  "Front of NID card\n                            "
                                }
                              </NidT>
                            </span>
                            <span className="text-[13px] text-[#6B5A40] mt-0.5">
                              <NidT>
                                {
                                  "Upload front side photo\n                            "
                                }
                              </NidT>
                            </span>
                            <span className="bg-[#FEE9E9]/60 text-[#DC2626] font-semibold text-[12px] px-2 py-0.5 rounded-full mt-2">
                              <NidT>
                                {
                                  "JPG \u00B7 PNG \u00B7 HEIC\n                            "
                                }
                              </NidT>
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
                        className={`absolute overflow-hidden transition-all duration-300 ${roundedCorners ? "rounded-[8px]" : "rounded-none"}`}
                        style={{
                          width: cardDim.width,
                          height: cardDim.height,
                          transform: `rotate(${backRotation}deg)`,
                        }}
                      >
                        {backImageUrl ? (
                          <div
                            className={`relative group w-full h-full overflow-hidden flex justify-center items-center bg-transparent border border-[#E3D6B8] ${
                              backCropReviewReady && processingSide !== "back"
                                ? "cursor-zoom-in hover:ring-2 hover:ring-[#DC2626]/40"
                                : ""
                            }`}
                            role={backCropReviewReady ? "button" : undefined}
                            tabIndex={backCropReviewReady ? 0 : undefined}
                            title={
                              backCropReviewReady
                                ? t("Click to verify this cropped image")
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
                              <div className="absolute inset-0 z-20 bg-[#FBF6E8]/70 backdrop-blur-[1px] flex items-center justify-center">
                                <div className="flex items-center gap-2 rounded-full bg-[#3B2F1E] text-white px-3 py-1.5 text-[12px] font-bold shadow-lg">
                                  <RefreshCw
                                    size={12}
                                    className="animate-spin"
                                  />
                                  <NidT>
                                    {
                                      "Auto cropping back\u2026\n                                "
                                    }
                                  </NidT>
                                </div>
                              </div>
                            )}

                            {backCropReviewReady &&
                              processingSide !== "back" && (
                                <span className="absolute top-2 left-2 z-10 rounded-full bg-emerald-600 text-white px-2 py-1 text-[11px] font-bold shadow-md print:hidden flex items-center gap-1">
                                  <Eye size={10} />
                                  {backAutoCropped ? (
                                    <NidT>
                                      {"Auto crop applied · Click to verify"}
                                    </NidT>
                                  ) : (
                                    <NidT>
                                      {"Manual crop applied · Click to verify"}
                                    </NidT>
                                  )}
                                </span>
                              )}

                            <img
                              src={backImageUrl}
                              alt={t("Back NID")}
                              className={`block w-full h-full max-w-none max-h-none bg-white ${
                                backCropReviewReady
                                  ? "object-cover"
                                  : "object-contain"
                              }`}
                              style={{ filter: imageFilterStyle }}
                            />

                            <div
                              className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#3B2F1E]/90 text-white rounded-full px-2.5 py-1 flex items-center gap-2 shadow-xl border border-[#4A3B26]/50 z-30 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-200 print:hidden"
                              onClick={(event) => event.stopPropagation()}
                              onMouseDown={(event) => event.stopPropagation()}
                            >
                              <button
                                onClick={() => setCroppingSide("back")}
                                className="p-1 hover:text-[#F87171] transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
                                title={t("Crop")}
                              >
                                <Crop size={13} />
                              </button>
                              <label
                                htmlFor="back-change-input"
                                onClick={(event) => event.stopPropagation()}
                                className="p-1 hover:text-[#F87171] transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
                                title={t("Change Image")}
                              >
                                <Upload size={13} />
                              </label>
                              <button
                                onClick={() =>
                                  setBackRotation((prev) => (prev + 90) % 360)
                                }
                                className="p-1 hover:text-[#F87171] transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
                                title={t("Rotate 90°")}
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
                                className="p-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
                                title={t("Delete")}
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
                          <label className="border-2 border-dashed border-[#B0A080] hover:border-[#DC2626]/50 bg-[#F6EEDB]/40 hover:bg-[#EFE3C8]/70 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer w-full h-full transition-all">
                            <div className="w-8 h-8 bg-[#FEE9E9]/80 text-[#DC2626] rounded-full flex items-center justify-center mb-2">
                              <Upload size={16} />
                            </div>
                            <span className="text-[15px] font-bold text-[#3B2F1E]">
                              <NidT>
                                {
                                  "Back of NID card\n                            "
                                }
                              </NidT>
                            </span>
                            <span className="text-[13px] text-[#6B5A40] mt-0.5">
                              <NidT>
                                {
                                  "Upload back side photo\n                            "
                                }
                              </NidT>
                            </span>
                            <span className="bg-[#FEE9E9]/60 text-[#DC2626] font-semibold text-[12px] px-2 py-0.5 rounded-full mt-2">
                              <NidT>
                                {
                                  "JPG \u00B7 PNG \u00B7 HEIC\n                            "
                                }
                              </NidT>
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
      </div>

      <div className="nid-joiner-status bg-[#FBF6E8] p-3.5 rounded-2xl border border-[#E3D6B8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[15px] font-medium text-[#5A4A32]">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${frontImage && backImage ? "bg-emerald-600" : "bg-red-500"}`}
          />
          <span>
            {frontImage && backImage ? (
              <NidT>{"Both card photos added — ready to create PDF"}</NidT>
            ) : (
              <NidT>{"Upload front and back photos to create PDF"}</NidT>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-[#E3D6B8] text-[#3B2F1E] text-[15px] font-bold rounded-xl hover:bg-[#EFE3C8] transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
          >
            <NidT>{"Reset\n          "}</NidT>
          </button>

          <button
            onClick={handleCreatePdf}
            disabled={
              (!frontImage && !backImage) ||
              isGeneratingPdf ||
              processingSide !== null
            }
            className={`px-5 py-2 text-[15px] font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              frontImage || backImage
                ? "bg-[#DC2626] text-white shadow-sm hover:bg-[#DC2626] cursor-pointer"
                : "bg-[#D42020] text-white opacity-70 cursor-not-allowed"
            } ${isGeneratingPdf ? "opacity-75 !cursor-wait" : ""}`}
          >
            {isGeneratingPdf ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>
                  <NidT>{"Creating..."}</NidT>
                </span>
              </>
            ) : (
              <span>
                <NidT>{"Create PDF"}</NidT>
              </span>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
