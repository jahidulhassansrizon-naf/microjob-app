"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  Check,
  ChevronDown,
  Crop,
  Download,
  Eraser,
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
/* -------------------------------------------------------------------------- */
/* Page-specific, hydration-safe English ↔ Bangla translation                */
/* -------------------------------------------------------------------------- */

const GOVT_JOB_BN: Record<string, string> = {
  "Govt Job Photo & Sign Resizer": "সরকারি চাকরির ছবি ও স্বাক্ষর রিসাইজার",
  "Print and cut using the dashed borders.":
    "ড্যাশযুক্ত সীমানা অনুযায়ী প্রিন্ট করে কেটে নিন।",
  "Photo — 300×300 px / 3cm × 3cm": "ছবি — ৩০০×৩০০ পিক্সেল / ৩ সেমি × ৩ সেমি",
  "Signature — 300×80 px / 3cm × 0.8cm":
    "স্বাক্ষর — ৩০০×৮০ পিক্সেল / ৩ সেমি × ০.৮ সেমি",
  "For accurate physical size, print at 100% / Actual Size. Disable “Fit to page” or similar scaling in the printer dialog.":
    "সঠিক শারীরিক মাপ পেতে ১০০% / প্রকৃত আকারে প্রিন্ট করুন। প্রিন্টার ডায়ালগে “পাতায় ফিট করুন” বা অনুরূপ স্কেলিং বন্ধ রাখুন।",
  "Sohoj Tools": "সহজ টুলস",
  "Educational Tools": "শিক্ষা বিষয়ক টুলস",
  Free: "বিনামূল্যে",
  "Resize your application photo and signature to the required dimensions directly in your browser.":
    "আবেদনপত্রের নির্ধারিত মাপ অনুযায়ী ছবি ও স্বাক্ষরের আকার সরাসরি ব্রাউজারেই পরিবর্তন করুন।",
  "Position & crop": "অবস্থান ও ক্রপ",
  "Upload or replace your files anytime.":
    "যেকোনো সময় ফাইল আপলোড বা পরিবর্তন করুন।",
  "Photo 300×300 px": "ছবি ৩০০×৩০০ পিক্সেল",
  Change: "পরিবর্তন",
  "· Click to replace": "· পরিবর্তন করতে ক্লিক করুন",
  "Upload passport photo": "পাসপোর্ট সাইজের ছবি আপলোড করুন",
  "JPG, PNG, or WebP · up to 10 MB": "JPG, PNG বা WebP · সর্বোচ্চ ১০ MB",
  Zoom: "জুম",
  Horizontal: "অনুভূমিক",
  Vertical: "উল্লম্ব",
  "Reset crop": "ক্রপ পুনরায় সেট করুন",
  "Signature 300×80 px": "স্বাক্ষর ৩০০×৮০ পিক্সেল",
  "Upload signature": "স্বাক্ষর আপলোড করুন",
  "JPG, PNG, or WebP · or create one on the right":
    "JPG, PNG বা WebP · অথবা ডান পাশে নতুন তৈরি করুন",
  "Create a new signature instead": "এর পরিবর্তে নতুন স্বাক্ষর তৈরি করুন",
  "Create a signature without uploading": "আপলোড না করে স্বাক্ষর তৈরি করুন",
  "Output specs": "আউটপুটের মাপ",
  "Photo: 300×300 pixels, max 100 KB JPEG":
    "ছবি: ৩০০×৩০০ পিক্সেল, JPEG সর্বোচ্চ ১০০ KB",
  "Signature: 300×80 pixels, max 60 KB JPEG":
    "স্বাক্ষর: ৩০০×৮০ পিক্সেল, JPEG সর্বোচ্চ ৬০ KB",
  "PNG and WebP keep the same exact dimensions. JPEG/WebP are compressed to the target byte limit.":
    "PNG ও WebP-তে একই নির্ভুল মাপ বজায় থাকে। JPEG/WebP নির্ধারিত বাইট সীমার মধ্যে সংকুচিত করা হয়।",
  "Output preview": "আউটপুটের পূর্বরূপ",
  Ready: "প্রস্তুত",
  Empty: "খালি",
  "Photo (300×300)": "ছবি (৩০০×৩০০)",
  "No photo": "কোনো ছবি নেই",
  "Signature (300×80)": "স্বাক্ষর (৩০০×৮০)",
  "Create or upload a signature": "স্বাক্ষর তৈরি করুন বা আপলোড করুন",
  "Upload photo and signature": "ছবি ও স্বাক্ষর আপলোড করুন",
  "You can change either file anytime, then export both together or separately.":
    "যেকোনো একটি ফাইল যেকোনো সময় পরিবর্তন করতে পারবেন, তারপর দুটো একসাথে বা আলাদাভাবে এক্সপোর্ট করুন।",
  "Create your signature": "আপনার স্বাক্ষর তৈরি করুন",
  "Draw your signature or type your name and use it directly.":
    "স্বাক্ষর আঁকুন অথবা আপনার নাম লিখে সরাসরি ব্যবহার করুন।",
  Draw: "আঁকুন",
  Type: "লিখুন",
  Preview: "পূর্বরূপ",
  "Pen width": "কলমের প্রস্থ",
  Clear: "মুছে ফেলুন",
  "Close signature studio": "স্বাক্ষর স্টুডিও বন্ধ করুন",
  "Your signature is created locally in the browser.":
    "আপনার স্বাক্ষর এই ব্রাউজারেই স্থানীয়ভাবে তৈরি হয়।",
  "Use this signature": "এই স্বাক্ষর ব্যবহার করুন",
  "Export options": "এক্সপোর্টের বিকল্প",
  "Choose the format and whether to download separately or as one ZIP.":
    "ফাইলের ফরম্যাট এবং আলাদাভাবে নাকি একটি ZIP হিসেবে ডাউনলোড করবেন তা নির্বাচন করুন।",
  Close: "বন্ধ করুন",
  "File format": "ফাইলের ফরম্যাট",
  Download: "ডাউনলোড",
  "Separate files": "আলাদা ফাইল",
  "One ZIP": "একটি ZIP",
  "one ZIP package": "একটি ZIP প্যাকেজ",
  "separate files": "আলাদা ফাইল",
  "Preparing…": "প্রস্তুত করা হচ্ছে…",
  "Preparing your files…": "আপনার ফাইল প্রস্তুত করা হচ্ছে…",
  Reset: "রিসেট",
  Print: "প্রিন্ট",
  Export: "এক্সপোর্ট",
  "Your files stay in your browser. Nothing is uploaded to a server.":
    "আপনার ফাইলগুলো এই ব্রাউজারেই থাকে। কোনো সার্ভারে আপলোড করা হয় না।",
  "How to use": "কীভাবে ব্যবহার করবেন",
  "1. Upload your photo and/or signature.":
    "১. আপনার ছবি এবং/অথবা স্বাক্ষর আপলোড করুন।",
  "2. Use zoom and position controls to set the photo crop.":
    "২. জুম ও অবস্থান নিয়ন্ত্রণ ব্যবহার করে ছবির ক্রপ ঠিক করুন।",
  "3. Replace either image anytime with Change.":
    "৩. ‘পরিবর্তন’ ব্যবহার করে যেকোনো ছবি যেকোনো সময় বদলান।",
  "4. Without a signature image, draw or type one on the right and choose “Use this signature”.":
    "৪. স্বাক্ষরের ছবি না থাকলে ডান পাশে স্বাক্ষর আঁকুন বা লিখুন এবং ‘এই স্বাক্ষর ব্যবহার করুন’ নির্বাচন করুন।",
  "5. Click Export, choose JPG, PNG, or WebP, then choose separate files or one ZIP package.":
    "৫. ‘এক্সপোর্ট’ ক্লিক করুন, JPG, PNG অথবা WebP নির্বাচন করুন, তারপর আলাদা ফাইল বা একটি ZIP প্যাকেজ বেছে নিন।",

  "Printable photo": "প্রিন্টযোগ্য ছবি",
  "Printable signature": "প্রিন্টযোগ্য স্বাক্ষর",
  Favorite: "পছন্দের তালিকায় যোগ করুন",
  Share: "শেয়ার করুন",
  "Uploaded photo": "আপলোড করা ছবি",
  "Uploaded signature": "আপলোড করা স্বাক্ষর",
  "Photo crop preview": "ছবির ক্রপের পূর্বরূপ",
  "Signature preview": "স্বাক্ষরের পূর্বরূপ",
  "Type your name": "আপনার নাম লিখুন",
  "Signature drawing area": "স্বাক্ষর আঁকার স্থান",

  "Please choose a JPG, PNG, or WebP image.":
    "অনুগ্রহ করে JPG, PNG অথবা WebP ছবি নির্বাচন করুন।",
  "Please choose an image smaller than 10 MB.":
    "অনুগ্রহ করে ১০ MB-এর কম আকারের ছবি নির্বাচন করুন।",
  "Photo updated.": "ছবি আপডেট হয়েছে।",
  "Signature updated.": "স্বাক্ষর আপডেট হয়েছে।",
  "Type your name first.": "প্রথমে আপনার নাম লিখুন।",
  "Draw your signature first.": "প্রথমে আপনার স্বাক্ষর আঁকুন।",
  "Signature created and added.": "স্বাক্ষর তৈরি করে যোগ করা হয়েছে।",
  "Could not create the signature.": "স্বাক্ষর তৈরি করা যায়নি।",
  "Add a photo or signature before printing.":
    "প্রিন্ট করার আগে একটি ছবি বা স্বাক্ষর যোগ করুন।",
  "Tool link copied.": "টুলের লিংক কপি হয়েছে।",
  "Canvas is not available.": "ক্যানভাস উপলব্ধ নয়।",
  "No exportable files were found.":
    "এক্সপোর্ট করার মতো কোনো ফাইল পাওয়া যায়নি।",
  "ZIP package ready.": "ZIP প্যাকেজ প্রস্তুত।",
  "Files ready.": "ফাইলগুলো প্রস্তুত।",
  "Your ZIP package is ready.": "আপনার ZIP প্যাকেজ প্রস্তুত।",
  "Your files are ready.": "আপনার ফাইলগুলো প্রস্তুত।",
  "Free browser-based photo and signature resizer.":
    "ব্রাউজারেই বিনামূল্যে ছবি ও স্বাক্ষরের আকার পরিবর্তন করুন।",
  "Files loaded — choose Export when ready":
    "ফাইল লোড হয়েছে — প্রস্তুত হলে এক্সপোর্ট নির্বাচন করুন",
  "Add a photo or signature to get started":
    "শুরু করতে একটি ছবি বা স্বাক্ষর যোগ করুন",
};

function normalizeGovtJobText(value: string) {
  return value
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toBanglaDigits(value: string) {
  const digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return value.replace(/\d/g, (d) => digits[Number(d)]);
}

function preserveGovtWhitespace(source: string, translated: string) {
  return `${source.match(/^\s*/)?.[0] ?? ""}${translated}${source.match(/\s*$/)?.[0] ?? ""}`;
}

function translateGovtDynamicText(value: string) {
  const key = normalizeGovtJobText(value);

  const overLimitMatch = key.match(
    /^(ZIP package ready\.|Files ready\.)\s+(.+)\.\s+Dimensions and maximum export quality were preserved\.$/i,
  );
  if (overLimitMatch) {
    const prefix =
      overLimitMatch[1].toLowerCase() === "zip package ready."
        ? "ZIP প্যাকেজ প্রস্তুত।"
        : "ফাইলগুলো প্রস্তুত।";
    const items = overLimitMatch[2].split(/\s*;\s*/).map((item) => {
      const match = item.match(
        /^(photo|signature) is (.+?) \(above the (.+?) application target\)$/i,
      );
      if (!match) return item;
      const kind =
        match[1].toLowerCase() === "photo" ? "ছবির আকার" : "স্বাক্ষরের আকার";
      return `${kind} ${match[2]} (আবেদনপত্রের নির্ধারিত ${match[3]} সীমার চেয়ে বেশি)`;
    });
    return `${prefix} ${items.join("; ")}। ছবির মাপ ও সর্বোচ্চ এক্সপোর্ট মান অপরিবর্তিত রাখা হয়েছে।`;
  }

  return null;
}

function translateGovtJobText(
  value: string,
  locale: string | undefined,
  baseL: (value: string) => string,
): string {
  const raw = String(value ?? "");
  if (
    !String(locale ?? "")
      .toLowerCase()
      .startsWith("bn")
  ) {
    return raw;
  }

  const key = normalizeGovtJobText(raw);
  const exact = GOVT_JOB_BN[key];
  if (exact) return preserveGovtWhitespace(raw, toBanglaDigits(exact));

  const dynamic = translateGovtDynamicText(raw);
  if (dynamic) return preserveGovtWhitespace(raw, toBanglaDigits(dynamic));

  // Keep unexpected external/browser error text readable rather than creating
  // partial mixed-language strings. Authored UI text above is fully mapped.
  const global = baseL(raw);
  if (global && global !== raw && !/[A-Za-z]/.test(global)) {
    return preserveGovtWhitespace(raw, global);
  }

  return raw;
}

function useGovtJobText() {
  const { locale, L: baseL } = useSohozI18n();
  const t = useCallback(
    (value: string) => translateGovtJobText(value, locale, baseL),
    [locale, baseL],
  );
  return { t, locale };
}

function GovtT({ children }: { children: ReactNode }) {
  const { t } = useGovtJobText();
  if (typeof children !== "string") return <>{children}</>;
  return <>{t(children)}</>;
}

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
function uint8ArrayToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  // Copy into a non-shared ArrayBuffer so TypeScript/DOM BlobPart typing is
  // stable across TS versions where Uint8Array.buffer is ArrayBufferLike.
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer as ArrayBuffer;
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
  files: Array<{
    name: string;
    blob: Blob;
  }>,
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
  const blobParts: BlobPart[] = [
    ...localParts.map(uint8ArrayToArrayBuffer),
    ...centralParts.map(uint8ArrayToArrayBuffer),
    uint8ArrayToArrayBuffer(endRecord),
  ];
  return new Blob(blobParts, { type: "application/zip" });
}
function extensionFor(format: ExportFormat) {
  if (format === "jpg") return "jpg";
  if (format === "png") return "png";
  return "webp";
}
export default function GovtJobPhotoSignResizer() {
  const { t } = useGovtJobText();
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
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
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
                  `${item.kind} is ${formatBytes(item.blob.size)} (above the ${formatBytes(item.sizeLimit)} application target)`,
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
          title: t("Govt Job Photo & Sign Resizer"),
          text: t("Free browser-based photo and signature resizer."),
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
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .page-font.page-font, .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        .page-font h1, .page-font h2, .page-font h3, .page-font h4 { letter-spacing: -0.01em; }

        /* Extend the Warm Sand canvas beyond the centred content wrapper.
           The rule is scoped to this tool so other pages keep their own theme. */
        html:has(#govt-job-tool),
        body:has(#govt-job-tool) {
          min-height: 100vh !important;
          background: linear-gradient(180deg, #E9DDC3 0%, #EFE5CE 100%) !important;
        }
        body:has(#govt-job-tool) *:has(#govt-job-tool) {
          background-color: transparent !important;
          background-image: none !important;
        }

        #govt-job-tool h2 { font-size: 18px; }
        #govt-job-tool h3 { font-size: 17px; }
        #govt-job-tool button { font-size: 15px; }
        #govt-job-tool p { font-size: max(13px, 1em); line-height: 1.7; }
        #govt-job-tool button, #govt-job-tool a, #govt-job-tool input, #govt-job-tool select { transition-duration: 160ms; }
        #govt-job-tool button:not(:disabled):active { transform: scale(0.98); }
        #govt-job-tool button:disabled { cursor: not-allowed; opacity: 0.7; }
        #govt-job-tool button:focus-visible, #govt-job-tool a:focus-visible, #govt-job-tool input:focus-visible, #govt-job-tool select:focus-visible { outline: 2px solid rgba(220, 38, 38, 0.45); outline-offset: 2px; }
        #govt-job-tool input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), #govt-job-tool select, #govt-job-tool textarea { background-color: #FBF6E8; border-color: #E3D6B8; color: #3B2F1E; font-size: 15px; }
        #govt-job-tool input::placeholder, #govt-job-tool textarea::placeholder { color: #B0A080; }

        @page {
          size: A4;
          margin: 10mm;
        }

        /* Pointer cursor on every clickable element of this tool */
        #govt-job-tool a[href],
        #govt-job-tool button:not(:disabled),
        #govt-job-tool label[for],
        #govt-job-tool summary,
        #govt-job-tool [role="button"],
        #govt-job-tool select,
        #govt-job-tool input[type="range"],
        #govt-job-tool input[type="checkbox"],
        #govt-job-tool input[type="radio"],
        #govt-job-tool input[type="file"] {
          cursor: pointer;
        }

        #govt-job-tool button:disabled {
          cursor: not-allowed;
        }

        #govt-job-tool canvas {
          cursor: crosshair;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            background: #ffffff !important;
          }

          /* Remove the whole website from the print layout so it cannot
             create extra blank pages. Only the print sheet stays. */
          body > *:not(#govt-job-print-sheet) {
            display: none !important;
          }

          #govt-job-print-sheet {
            display: block !important;
            position: static !important;
            width: 190mm !important;
            height: 270mm !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111827 !important;
          }
        }
      `}</style>

      {isMounted
        ? createPortal(
            <div id="govt-job-print-sheet" className="hidden">
              <div className="flex h-[270mm] w-[190mm] flex-col overflow-hidden p-[4mm] font-sans text-[#0F172A]">
                <div className="border-b border-gray-300 pb-3">
                  <h2 className="text-lg font-bold">
                    <GovtT>
                      {"Govt Job Photo & Sign Resizer\n                  "}
                    </GovtT>
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    <GovtT>
                      {
                        "Print and cut using the dashed borders.\n                  "
                      }
                    </GovtT>
                  </p>
                </div>

                <div className="mt-8 flex flex-col items-start gap-12">
                  {printPhotoSrc ? (
                    <div>
                      <div className="mb-2 text-xs font-semibold">
                        <GovtT>
                          {
                            "Photo \u2014 300\u00D7300 px / 3cm \u00D7 3cm\n                      "
                          }
                        </GovtT>
                      </div>
                      <div className="flex h-[3cm] w-[3cm] items-center justify-center border-[0.25mm] border-dashed border-gray-500 bg-white p-0">
                        <img
                          src={printPhotoSrc}
                          alt={t("Printable photo")}
                          className="block h-[3cm] w-[3cm] object-cover"
                        />
                      </div>
                    </div>
                  ) : null}

                  {printSignatureSrc ? (
                    <div>
                      <div className="mb-2 text-xs font-semibold">
                        <GovtT>
                          {
                            "Signature \u2014 300\u00D780 px / 3cm \u00D7 0.8cm\n                      "
                          }
                        </GovtT>
                      </div>
                      <div className="flex h-[0.8cm] w-[3cm] items-center justify-center border-[0.25mm] border-dashed border-gray-500 bg-white p-0">
                        <img
                          src={printSignatureSrc}
                          alt={t("Printable signature")}
                          className="block h-[0.8cm] w-[3cm] object-contain"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-auto border-t border-gray-200 pt-3 text-[9px] leading-relaxed text-gray-500">
                  <GovtT>
                    {
                      "For accurate physical size, print at 100% / Actual Size.\n                  Disable \u201CFit to page\u201D or similar scaling in the printer\n                  dialog.\n                "
                    }
                  </GovtT>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <div
        id="govt-job-tool"
        className="page-font w-full space-y-6 bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] pb-16 text-[#3B2F1E]"
      >
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <nav className="mb-2 flex items-center gap-1.5 text-sm text-[#6B5A40]">
              <Link href="/" className="transition-colors hover:text-[#B91C1C]">
                <Crop size={14} className="mr-1 inline" />
              </Link>
              <span>
                <GovtT>{"/"}</GovtT>
              </span>
              <Link
                href="/sohoj-tools"
                className="transition-colors hover:text-[#B91C1C]"
              >
                <GovtT>{"Sohoj Tools\n              "}</GovtT>
              </Link>
              <span>
                <GovtT>{"/"}</GovtT>
              </span>
              <span>
                <GovtT>{"Educational Tools"}</GovtT>
              </span>
              <span>
                <GovtT>{"/"}</GovtT>
              </span>
              <span className="font-semibold text-[#3B2F1E]">
                <GovtT>{"Govt Job Photo & Sign Resizer\n              "}</GovtT>
              </span>
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F6EEDB] text-[#DC2626]">
                <Crop size={20} />
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-[#3B2F1E] md:text-3xl">
                <GovtT>{"Govt Job Photo & Sign Resizer\n              "}</GovtT>
              </h1>

              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider text-emerald-700">
                <GovtT>{"Free\n              "}</GovtT>
              </span>
            </div>

            <p className="mt-1 text-sm font-medium text-[#6B5A40]">
              <GovtT>
                {
                  "Resize your application photo and signature to the required\n              dimensions directly in your browser.\n            "
                }
              </GovtT>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFavorite((value) => !value)}
              className={`rounded-xl border bg-[#FBF6E8] p-2 shadow-sm transition-colors hover:bg-[#EFE3C8] ${
                favorite
                  ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C] ring-2 ring-[#DC2626]/40"
                  : "border-[#E3D6B8] text-[#5A4A32]"
              }`}
              title={t("Favorite")}
              aria-pressed={favorite}
            >
              <Star size={16} fill={favorite ? "currentColor" : "none"} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#5A4A32] shadow-sm transition-colors hover:bg-[#EFE3C8]"
              title={t("Share")}
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <div className="space-y-5 rounded-2xl border border-[#E3D6B8]/80 bg-[#FBF6E8] p-5 shadow-sm">
              <div>
                <h2 className="text-sm font-bold text-[#3B2F1E]">
                  <GovtT>{"Position & crop\n                "}</GovtT>
                </h2>
                <p className="mt-1 text-[12px] text-[#6B5A40]">
                  <GovtT>
                    {"Upload or replace your files anytime.\n                "}
                  </GovtT>
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#3B2F1E]">
                    <GovtT>{"Photo 300\u00D7300 px\n                  "}</GovtT>
                  </label>

                  {photo ? (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="text-[12px] font-bold text-[#DC2626] hover:text-[#B91C1C]"
                    >
                      <GovtT>{"Change\n                    "}</GovtT>
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
                  className="w-full rounded-xl border-2 border-dashed border-[#DC2626] bg-[#F6EEDB]/40 p-4 text-center transition-colors hover:border-[#B91C1C]"
                >
                  {photo && photoPreview ? (
                    <div className="flex items-center gap-3 text-left">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#E3D6B8] bg-white">
                        <img
                          src={photoPreview}
                          alt={t("Uploaded photo")}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-[#3B2F1E]">
                          {photo.name}
                        </div>
                        <div className="mt-0.5 text-[12px] text-[#6B5A40]">
                          {formatBytes(photo.size)}
                          <GovtT>
                            {
                              "\u00B7 Click to replace\n                        "
                            }
                          </GovtT>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6EEDB] text-[#DC2626]">
                        <Upload size={16} />
                      </div>
                      <div className="text-sm font-bold text-[#3B2F1E]">
                        <GovtT>
                          {"Upload passport photo\n                      "}
                        </GovtT>
                      </div>
                      <div className="mt-0.5 text-[12px] text-[#6B5A40]">
                        <GovtT>
                          {
                            "JPG, PNG, or WebP \u00B7 up to 10 MB\n                      "
                          }
                        </GovtT>
                      </div>
                    </>
                  )}
                </button>

                {photo ? (
                  <div className="mt-3 space-y-2.5 rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] p-3">
                    <div className="flex items-center justify-between text-[12px] font-semibold text-[#5A4A32]">
                      <span>
                        <GovtT>{"Zoom"}</GovtT>
                      </span>
                      <span>
                        {photoZoom.toFixed(1)}
                        <GovtT>{"\u00D7"}</GovtT>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <ZoomOut size={14} className="text-[#6B5A40]" />
                      <input
                        type="range"
                        min="1"
                        max="2.5"
                        step="0.1"
                        value={photoZoom}
                        onChange={(event) =>
                          setPhotoZoom(Number(event.target.value))
                        }
                        className="w-full accent-[#DC2626]"
                      />
                      <ZoomIn size={14} className="text-[#6B5A40]" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[12px] font-semibold text-[#6B5A40]">
                        <GovtT>{"Horizontal\n                        "}</GovtT>
                        <input
                          type="range"
                          min="-1"
                          max="1"
                          step="0.01"
                          value={photoOffsetX}
                          onChange={(event) =>
                            setPhotoOffsetX(Number(event.target.value))
                          }
                          className="mt-1 w-full accent-[#DC2626]"
                        />
                      </label>

                      <label className="text-[12px] font-semibold text-[#6B5A40]">
                        <GovtT>{"Vertical\n                        "}</GovtT>
                        <input
                          type="range"
                          min="-1"
                          max="1"
                          step="0.01"
                          value={photoOffsetY}
                          onChange={(event) =>
                            setPhotoOffsetY(Number(event.target.value))
                          }
                          className="mt-1 w-full accent-[#DC2626]"
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
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6B5A40] hover:text-[#B91C1C]"
                    >
                      <RotateCcw size={12} />
                      <GovtT>{"Reset crop\n                    "}</GovtT>
                    </button>
                  </div>
                ) : null}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#3B2F1E]">
                    <GovtT>
                      {"Signature 300\u00D780 px\n                  "}
                    </GovtT>
                  </label>

                  {signature ? (
                    <button
                      type="button"
                      onClick={() => signatureInputRef.current?.click()}
                      className="text-[12px] font-bold text-[#DC2626] hover:text-[#B91C1C]"
                    >
                      <GovtT>{"Change\n                    "}</GovtT>
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
                  className="w-full rounded-xl border-2 border-dashed border-[#DC2626] bg-[#F6EEDB]/40 p-4 text-center transition-colors hover:border-[#B91C1C]"
                >
                  {signature && signaturePreview ? (
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E3D6B8] bg-white p-1">
                        <img
                          src={signaturePreview}
                          alt={t("Uploaded signature")}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-[#3B2F1E]">
                          {signature.name}
                        </div>
                        <div className="mt-0.5 text-[12px] text-[#6B5A40]">
                          {formatBytes(signature.size)}
                          <GovtT>
                            {
                              "\u00B7 Click to replace\n                        "
                            }
                          </GovtT>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6EEDB] text-[#DC2626]">
                        <Upload size={16} />
                      </div>
                      <div className="text-sm font-bold text-[#3B2F1E]">
                        <GovtT>
                          {"Upload signature\n                      "}
                        </GovtT>
                      </div>
                      <div className="mt-0.5 text-[12px] text-[#6B5A40]">
                        <GovtT>
                          {
                            "JPG, PNG, or WebP \u00B7 or create one on the right\n                      "
                          }
                        </GovtT>
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
                  className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#6B5A40] hover:text-[#B91C1C]"
                >
                  <PenLine size={12} />
                  {signature ? (
                    <GovtT>{"Create a new signature instead"}</GovtT>
                  ) : (
                    <GovtT>{"Create a signature without uploading"}</GovtT>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-[#E3D6B8]/80 bg-[#FBF6E8] p-5 shadow-sm">
              <h2 className="mb-2 text-sm font-bold text-[#3B2F1E]">
                <GovtT>{"Output specs\n              "}</GovtT>
              </h2>
              <p className="text-[13px] leading-relaxed text-[#6B5A40]">
                <GovtT>
                  {
                    "Photo: 300\u00D7300 pixels, max 100 KB JPEG\n              "
                  }
                </GovtT>
              </p>
              <p className="text-[13px] leading-relaxed text-[#6B5A40]">
                <GovtT>
                  {
                    "Signature: 300\u00D780 pixels, max 60 KB JPEG\n              "
                  }
                </GovtT>
              </p>
              <p className="pt-1 text-[13px] leading-relaxed text-[#6B5A40]">
                <GovtT>
                  {
                    "PNG and WebP keep the same exact dimensions. JPEG/WebP are\n                compressed to the target byte limit.\n              "
                  }
                </GovtT>
              </p>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-8">
            <div className="rounded-2xl border border-[#E3D6B8]/80 bg-[#FBF6E8] p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E3D6B8] pb-3">
                <h2 className="text-sm font-bold text-[#3B2F1E]">
                  <GovtT>{"Output preview\n                "}</GovtT>
                </h2>

                <span
                  className={`rounded-md px-2 py-0.5 text-[12px] font-medium ${
                    hasInput
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-[#F3E9D2] text-[#6B5A40]"
                  }`}
                >
                  {hasInput ? (
                    <GovtT>{"Ready"}</GovtT>
                  ) : (
                    <GovtT>{"Empty"}</GovtT>
                  )}
                </span>
              </div>

              <div className="my-4 min-h-[350px] rounded-xl border border-[#E3D6B8]/60 bg-[#F6EEDB]/60 p-6">
                {hasInput ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center gap-8 sm:flex-row">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-sm font-semibold text-[#5A4A32]">
                        <GovtT>
                          {"Photo (300\u00D7300)\n                      "}
                        </GovtT>
                      </div>

                      <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-xl border border-[#D8C9A6] bg-white shadow-sm">
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt={t("Photo crop preview")}
                            className="h-full w-full object-cover"
                            style={{
                              objectPosition: `${50 + photoOffsetX * 25}% ${50 + photoOffsetY * 25}%`,
                              transform: `scale(${photoZoom})`,
                            }}
                          />
                        ) : (
                          <div className="text-sm text-[#6B5A40]">
                            <GovtT>{"No photo"}</GovtT>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="text-sm font-semibold text-[#5A4A32]">
                        <GovtT>
                          {"Signature (300\u00D780)\n                      "}
                        </GovtT>
                      </div>

                      <div className="flex h-16 w-56 items-center justify-center overflow-hidden rounded-lg border border-[#D8C9A6] bg-white shadow-sm">
                        {signaturePreview ? (
                          <img
                            src={signaturePreview}
                            alt={t("Signature preview")}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-[13px] text-[#6B5A40]">
                            <GovtT>
                              {
                                "Create or upload a signature\n                          "
                              }
                            </GovtT>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6EEDB] text-[#DC2626]">
                      <ImageIcon size={24} />
                    </div>

                    <h3 className="mb-1 text-sm font-bold text-[#3B2F1E]">
                      <GovtT>
                        {"Upload photo and signature\n                    "}
                      </GovtT>
                    </h3>

                    <p className="max-w-xs text-[13px] leading-relaxed text-[#6B5A40]">
                      <GovtT>
                        {
                          "You can change either file anytime, then export both\n                      together or separately.\n                    "
                        }
                      </GovtT>
                    </p>
                  </div>
                )}
              </div>

              {statusMessage ? (
                <div className="rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] px-3 py-2 text-[13px] font-semibold text-[#DC2626]">
                  <GovtT>{statusMessage}</GovtT>
                </div>
              ) : null}
            </div>

            {(!signature || isSignatureStudioOpen) && (
              <div className="rounded-2xl border border-[#E3D6B8]/80 bg-[#FBF6E8] p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                        <PenLine size={18} />
                      </div>

                      <h2 className="text-base font-bold text-[#3B2F1E]">
                        <GovtT>
                          {"Create your signature\n                      "}
                        </GovtT>
                      </h2>
                    </div>

                    <p className="mt-1 text-[12px] text-[#6B5A40]">
                      <GovtT>
                        {
                          "Draw your signature or type your name and use it directly.\n                    "
                        }
                      </GovtT>
                    </p>
                  </div>

                  <div className="flex rounded-lg bg-[#F3E9D2] p-1">
                    <button
                      type="button"
                      onClick={() => setSignatureMode("draw")}
                      className={`rounded-md px-3 py-1.5 text-[12px] font-bold ${
                        signatureMode === "draw"
                          ? "bg-[#F6D9A8] text-[#B91C1C] shadow-sm ring-2 ring-[#DC2626]/40"
                          : "text-[#6B5A40]"
                      }`}
                    >
                      <GovtT>{"Draw\n                    "}</GovtT>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignatureMode("type")}
                      className={`rounded-md px-3 py-1.5 text-[12px] font-bold ${
                        signatureMode === "type"
                          ? "bg-[#F6D9A8] text-[#B91C1C] shadow-sm ring-2 ring-[#DC2626]/40"
                          : "text-[#6B5A40]"
                      }`}
                    >
                      <GovtT>{"Type\n                    "}</GovtT>
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
                      placeholder={t("Type your name")}
                      className="h-10 flex-1 rounded-xl border border-[#E3D6B8] px-3 text-base outline-none transition focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
                    />

                    <button
                      type="button"
                      onClick={renderTypedSignature}
                      disabled={!typedSignature.trim()}
                      className="rounded-xl bg-[#D42020] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#991B1B] disabled:cursor-not-allowed disabled:bg-[#D8C9A6] disabled:text-[#6B5A40]"
                    >
                      <GovtT>{"Preview\n                    "}</GovtT>
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-[#6B5A40]">
                      <GovtT>{"Pen width\n                      "}</GovtT>
                      <input
                        type="range"
                        min="1"
                        max="7"
                        step="1"
                        value={strokeWidth}
                        onChange={(event) =>
                          setStrokeWidth(Number(event.target.value))
                        }
                        className="ml-2 w-28 accent-[#DC2626]"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={clearSignatureCanvas}
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#6B5A40] hover:text-[#B91C1C]"
                    >
                      <Eraser size={12} />
                      <GovtT>{"Clear\n                    "}</GovtT>
                    </button>
                  </div>
                )}

                <div className="mt-3 overflow-hidden rounded-xl border border-[#E3D6B8] bg-white">
                  <canvas
                    ref={signatureCanvasRef}
                    onPointerDown={beginDrawing}
                    onPointerMove={drawSignature}
                    onPointerUp={finishDrawing}
                    onPointerCancel={finishDrawing}
                    className="block w-full touch-none"
                    aria-label={t("Signature drawing area")}
                  />
                </div>

                <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {signature ? (
                    <button
                      type="button"
                      onClick={() => setIsSignatureStudioOpen(false)}
                      className="text-[12px] font-semibold text-[#6B5A40] hover:text-[#B91C1C]"
                    >
                      <GovtT>
                        {"Close signature studio\n                    "}
                      </GovtT>
                    </button>
                  ) : (
                    <span className="text-[12px] text-[#6B5A40]">
                      <GovtT>
                        {
                          "Your signature is created locally in the browser.\n                    "
                        }
                      </GovtT>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={useCreatedSignature}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D42020] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#AE1717]"
                  >
                    <Check size={14} />
                    <GovtT>{"Use this signature\n                  "}</GovtT>
                  </button>
                </div>
              </div>
            )}

            {showExportOptions ? (
              <div className="rounded-2xl border border-[#E3D6B8]/80 bg-[#FBF6E8] p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-base font-bold text-[#3B2F1E]">
                      <GovtT>{"Export options\n                    "}</GovtT>
                    </h2>
                    <p className="mt-1 text-[12px] text-[#6B5A40]">
                      <GovtT>
                        {
                          "Choose the format and whether to download separately or as\n                      one ZIP.\n                    "
                        }
                      </GovtT>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowExportOptions(false)}
                    className="self-start rounded-lg px-2 py-1 text-[12px] font-semibold text-[#6B5A40] hover:bg-[#EFE3C8] hover:text-[#B91C1C] sm:self-auto"
                  >
                    <GovtT>{"Close\n                  "}</GovtT>
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#6B5A40]">
                      <GovtT>{"File format\n                    "}</GovtT>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {(["jpg", "png", "webp"] as ExportFormat[]).map(
                        (format) => (
                          <button
                            key={format}
                            type="button"
                            onClick={() => setExportFormat(format)}
                            className={`rounded-xl border px-3 py-2 text-sm font-bold uppercase transition ${
                              exportFormat === format
                                ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C] ring-2 ring-[#DC2626]/40"
                                : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:bg-[#EFE3C8]"
                            }`}
                          >
                            {format}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#6B5A40]">
                      <GovtT>{"Download\n                    "}</GovtT>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setExportMode("separate")}
                        className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                          exportMode === "separate"
                            ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C] ring-2 ring-[#DC2626]/40"
                            : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:bg-[#EFE3C8]"
                        }`}
                      >
                        <GovtT>
                          {"Separate files\n                      "}
                        </GovtT>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportMode("zip")}
                        className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                          exportMode === "zip"
                            ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C] ring-2 ring-[#DC2626]/40"
                            : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:bg-[#EFE3C8]"
                        }`}
                      >
                        <GovtT>{"One ZIP\n                      "}</GovtT>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] p-3 sm:flex-row sm:items-center">
                  <div className="text-[12px] font-semibold text-[#6B5A40]">
                    {exportFormat.toUpperCase()}
                    <GovtT>{"\u00B7"}</GovtT>
                    {<GovtT> </GovtT>}
                    {exportMode === "zip" ? (
                      <GovtT>{"one ZIP package"}</GovtT>
                    ) : (
                      <GovtT>{"separate files"}</GovtT>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={performExport}
                    disabled={!canExport}
                    className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold transition sm:w-auto ${
                      canExport
                        ? "bg-[#D42020] text-white hover:bg-[#AE1717]"
                        : "cursor-not-allowed bg-[#D8C9A6] text-[#6B5A40]"
                    }`}
                  >
                    <Download size={14} />
                    {isProcessing ? (
                      <GovtT>{"Preparing…"}</GovtT>
                    ) : (
                      <GovtT>{"Download"}</GovtT>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#E3D6B8]/80 bg-[#FBF6E8] px-5 py-3.5 shadow-sm sm:flex-row">
          <div className="flex items-center gap-2 text-sm font-medium text-[#6B5A40]">
            <span
              className={`h-2 w-2 rounded-full ${hasInput ? "bg-emerald-500" : "bg-[#D8C9A6]"}`}
            />
            <span>
              {isProcessing ? (
                <GovtT>{"Preparing your files…"}</GovtT>
              ) : hasInput ? (
                <GovtT>{"Files loaded — choose Export when ready"}</GovtT>
              ) : (
                <GovtT>{"Add a photo or signature to get started"}</GovtT>
              )}
            </span>
          </div>

          <div className="flex w-full items-center gap-2.5 sm:w-auto">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded-xl border border-[#E3D6B8] px-4 py-2 text-sm font-semibold text-[#5A4A32] transition-colors hover:bg-[#EFE3C8] sm:flex-initial"
            >
              <GovtT>{"Reset\n            "}</GovtT>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={!hasInput || isProcessing}
              className={`flex-1 rounded-xl border px-5 py-2 text-sm font-bold transition sm:flex-initial ${
                hasInput && !isProcessing
                  ? "border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8]"
                  : "cursor-not-allowed border-[#E3D6B8] bg-[#F3E9D2] text-[#6B5A40]"
              }`}
            >
              <GovtT>{"Print\n            "}</GovtT>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowExportOptions((value) => !value);
                setStatusMessage(null);
              }}
              disabled={!hasInput}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold transition-all sm:flex-initial ${
                hasInput
                  ? "cursor-pointer bg-[#D42020] text-white shadow-sm hover:bg-[#AE1717]"
                  : "cursor-not-allowed bg-[#F3E9D2] text-[#6B5A40]"
              }`}
            >
              <Download size={14} />
              <GovtT>{"Export\n            "}</GovtT>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm">
          <ShieldCheck size={18} className="shrink-0 text-emerald-600" />
          <span>
            <GovtT>
              {
                "Your files stay in your browser. Nothing is uploaded to a server.\n          "
              }
            </GovtT>
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E3D6B8]/80 bg-[#FBF6E8] shadow-sm">
          <button
            type="button"
            onClick={() => setIsHowToUseOpen((value) => !value)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-[#EFE3C8]/60"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#DC2626]">
                <GovtT>{"?"}</GovtT>
              </span>
              <span className="text-sm font-bold text-[#3B2F1E]">
                <GovtT>{"How to use\n              "}</GovtT>
              </span>
            </div>

            <ChevronDown
              size={16}
              className={`text-[#6B5A40] transition-transform duration-200 ${isHowToUseOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isHowToUseOpen ? (
            <div className="space-y-2 border-t border-[#E3D6B8] px-5 pb-4 pt-3 text-sm text-[#5A4A32]">
              <p>
                <GovtT>{"1. Upload your photo and/or signature."}</GovtT>
              </p>
              <p>
                <GovtT>
                  {"2. Use zoom and position controls to set the photo crop."}
                </GovtT>
              </p>
              <p>
                <GovtT>{"3. Replace either image anytime with Change."}</GovtT>
              </p>
              <p>
                <GovtT>
                  {
                    "4. Without a signature image, draw or type one on the right and\n                choose \u201CUse this signature\u201D.\n              "
                  }
                </GovtT>
              </p>
              <p>
                <GovtT>
                  {
                    "5. Click Export, choose JPG, PNG, or WebP, then choose separate\n                files or one ZIP package.\n              "
                  }
                </GovtT>
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
