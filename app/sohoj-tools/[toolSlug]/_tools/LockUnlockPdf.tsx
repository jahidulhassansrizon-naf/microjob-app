"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Lock,
  Star,
  Share2,
  Upload,
  FileText,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Combine,
  FilePlus,
  ArrowLeft,
  X,
  Plus,
  KeyRound,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
// ---------------------------------------------------------------------------
// Lock / Unlock engine (@jspawn/qpdf-wasm)
// ---------------------------------------------------------------------------
// @jspawn/qpdf-wasm doesn't expose the qpdf C++ library directly — it's the
// qpdf *CLI* compiled with Emscripten. So instead of a JS API for encryption,
// we write the uploaded file into the module's in-memory filesystem, run it
// like you would on a terminal (`qpdf --encrypt ... in.pdf out.pdf`), then
// read the result back out. Everything happens in the browser; nothing is
// uploaded anywhere.
//
// IMPORTANT — why this loads via a <script> tag instead of `import`:
// qpdf.js is Emscripten's CommonJS glue, and it contains a guarded
// `require("fs")` / `require("path")` for the case where it's running in
// Node. That branch never executes in a browser, but bundlers (Turbopack
// and webpack alike) statically scan every `require()`/`import()` they can
// see and try to resolve it at build time — which is exactly the
// "Module not found: Can't resolve 'fs'" error. Loading the script as a
// plain <script> tag at runtime keeps it completely outside the bundler's
// module graph, so it's never parsed or resolved at build time.
//
// SETUP REQUIRED: copy `qpdf.js` and `qpdf.wasm` from
// `node_modules/@jspawn/qpdf-wasm` into `public/qpdf-wasm/` in your
// project (adjust the paths below if you serve them from elsewhere).
//
// The exact global name this glue file assigns itself to when loaded as a
// plain script (no module system present) depends on how the package was
// built. Emscripten's default is `Module`. If neither `Module` nor the
// fallbacks below are defined after the script loads, open
// `node_modules/@jspawn/qpdf-wasm/tests` (the package's own README points
// here for usage examples) and check what name/pattern it actually uses,
// then update `resolveQpdfFactory` accordingly.
type QpdfModule = {
  FS: {
    writeFile: (path: string, data: Uint8Array) => void;
    readFile: (path: string) => Uint8Array;
    unlink: (path: string) => void;
  };
  callMain: (args: string[]) => number | void;
};
type QpdfFactory = (opts: {
  locateFile: (path: string) => string;
}) => Promise<QpdfModule>;
const QPDF_SCRIPT_ID = "qpdf-wasm-script";
const QPDF_SCRIPT_SRC = "/qpdf-wasm/qpdf.js";
function loadQpdfScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(QPDF_SCRIPT_ID)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = QPDF_SCRIPT_ID;
    script.src = QPDF_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(
        new Error(
          `Couldn't load ${QPDF_SCRIPT_SRC}. Make sure qpdf.js and qpdf.wasm from @jspawn/qpdf-wasm are copied into your public/qpdf-wasm/ folder.`,
        ),
      );
    document.body.appendChild(script);
  });
}
function resolveQpdfFactory(): QpdfFactory {
  const w = window as any;
  const factory = w.Module ?? w.QPDF ?? w.createQPDFModule ?? w.qpdf;
  if (typeof factory !== "function") {
    throw new Error(
      "qpdf.js loaded, but no factory function was found on window (checked Module, QPDF, createQPDFModule, qpdf). Check node_modules/@jspawn/qpdf-wasm/tests for the real export name and update resolveQpdfFactory().",
    );
  }
  return factory;
}
async function createQpdfInstance(): Promise<QpdfModule> {
  if (typeof window === "undefined") {
    throw new Error("qpdf can only run in the browser.");
  }
  await loadQpdfScript();
  const factory = resolveQpdfFactory();
  return factory({
    locateFile: (path: string) => `/qpdf-wasm/${path}`,
  });
}
async function runQpdf(
  bytes: Uint8Array,
  buildArgs: (input: string, output: string) => string[],
): Promise<Uint8Array> {
  const qpdf = await createQpdfInstance();
  const inputPath = "/input.pdf";
  const outputPath = "/output.pdf";
  qpdf.FS.writeFile(inputPath, bytes);
  try {
    qpdf.callMain(buildArgs(inputPath, outputPath));
  } catch (err) {
    // Emscripten CLI builds typically throw an "ExitStatus" for a non-zero
    // exit code rather than returning one — qpdf's own stderr (logged to
    // the console by default) usually explains the underlying reason.
    console.error("qpdf exited with an error:", err);
  }
  try {
    return qpdf.FS.readFile(outputPath);
  } catch {
    throw new Error(
      "qpdf couldn't produce an output file — the password may be wrong, or this PDF isn't supported.",
    );
  }
}
async function lockPdfBytes(
  bytes: Uint8Array,
  password: string,
): Promise<Uint8Array> {
  return runQpdf(bytes, (input, output) => [
    "--encrypt",
    password,
    password,
    "256",
    "--",
    input,
    output,
  ]);
}
async function unlockPdfBytes(
  bytes: Uint8Array,
  password: string,
): Promise<Uint8Array> {
  return runQpdf(bytes, (input, output) => [
    `--password=${password}`,
    "--decrypt",
    input,
    output,
  ]);
}
function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
}
interface ActionResult {
  bytes: Uint8Array;
  size: number;
}
type Mode = "lock" | "unlock";

/**
 * Exact, page-specific English ↔ Bangla translations.
 * Avoid the shared word-by-word translator here: it can create mixed strings
 * such as "Drop a PDF এখানে or click to আপলোড". In Bangla mode, authored UI
 * strings are translated as complete phrases; unknown text is left intact.
 */
const LOCK_UNLOCK_PDF_BN: Record<string, string> = {
  "back to tools": "টুলসের তালিকায় ফিরে যান",
  "/": "/",
  "pdf tools": "PDF টুলস",
  "lock / unlock pdf": "PDF লক / আনলক",
  free: "বিনামূল্যে",
  "add a password to protect your pdf or remove an existing password.":
    "PDF-এ পাসওয়ার্ড যোগ করে সুরক্ষিত করুন অথবা আগে থেকে থাকা পাসওয়ার্ড সরিয়ে ফেলুন।",
  "add to favorites": "পছন্দের তালিকায় যোগ করুন",
  "share this tool": "এই টুলটি শেয়ার করুন",
  "files (": "ফাইল (",
  ")": ")",
  add: "যোগ করুন",
  "drop a pdf here or click to upload":
    "এখানে PDF টেনে আনুন অথবা আপলোড করতে ক্লিক করুন",
  "1 pdf file, max 500 mb": "১টি PDF ফাইল, সর্বোচ্চ ৫০০ MB",
  mb: "MB",
  "remove selected pdf": "নির্বাচিত PDF সরিয়ে ফেলুন",
  "password settings": "পাসওয়ার্ড সেটিংস",
  lock: "লক",
  unlock: "আনলক",
  "new password": "নতুন পাসওয়ার্ড",
  "at least 4 characters": "কমপক্ষে ৪টি অক্ষর",
  "hide password": "পাসওয়ার্ড আড়াল করুন",
  "show password": "পাসওয়ার্ড দেখান",
  "confirm password": "পাসওয়ার্ড নিশ্চিত করুন",
  "re-enter password": "পাসওয়ার্ড আবার লিখুন",
  "passwords don't match.": "পাসওয়ার্ড দুটি মিলছে না।",
  "this password will be required to open the pdf. anyone without it won't be able to view the document.":
    "PDF খুলতে এই পাসওয়ার্ডটি লাগবে। পাসওয়ার্ড ছাড়া কেউ নথিটি দেখতে পারবেন না।",
  "current password": "বর্তমান পাসওয়ার্ড",
  "enter the pdf's password": "PDF-এর পাসওয়ার্ড লিখুন",
  "we'll use this to remove the password and produce an open-access copy of your pdf.":
    "এই পাসওয়ার্ড দিয়ে PDF-এর সুরক্ষা সরিয়ে একটি পাসওয়ার্ডবিহীন কপি তৈরি করা হবে।",
  preview: "পূর্বরূপ",
  error: "ত্রুটি",
  done: "সম্পন্ন",
  locking: "লক করা হচ্ছে",
  unlocking: "আনলক করা হচ্ছে",
  "locking…": "লক করা হচ্ছে…",
  "unlocking…": "আনলক করা হচ্ছে…",
  ready: "প্রস্তুত",
  empty: "খালি",
  "encrypting your pdf…": "আপনার PDF-এ পাসওয়ার্ড যোগ করা হচ্ছে…",
  "decrypting your pdf…": "আপনার PDF থেকে পাসওয়ার্ড সরানো হচ্ছে…",
  "everything runs in your browser — larger files take a little longer.":
    "সব কাজ আপনার ব্রাউজারেই হয়—বড় ফাইলের ক্ষেত্রে একটু বেশি সময় লাগতে পারে।",
  "locking failed": "PDF লক করা যায়নি",
  "unlocking failed": "PDF আনলক করা যায়নি",
  "your pdf is password-protected":
    "আপনার PDF পাসওয়ার্ড দিয়ে সুরক্ষিত হয়েছে",
  "your pdf is unlocked": "আপনার PDF-এর পাসওয়ার্ড সরানো হয়েছে",
  "download locked pdf": "পাসওয়ার্ডযুক্ত PDF ডাউনলোড করুন",
  "download unlocked pdf": "পাসওয়ার্ডবিহীন PDF ডাউনলোড করুন",
  "enter a password to continue": "এগিয়ে যেতে পাসওয়ার্ড লিখুন",
  "add files to get started": "শুরু করতে ফাইল যোগ করুন",
  "your result will appear here after you run the tool.":
    "টুলটি চালালে ফলাফল এখানে দেখা যাবে।",
  reset: "রিসেট করুন",
  "lock pdf": "PDF লক করুন",
  "unlock pdf": "PDF আনলক করুন",
  "your files are processed in the browser — they are not uploaded to any server.":
    "আপনার ফাইলগুলো ব্রাউজারেই প্রক্রিয়াকরণ করা হয়—কোনো সার্ভারে আপলোড করা হয় না।",
  "?": "?",
  "how to use": "ব্যবহারের নিয়ম",
  "upload your pdf, choose lock to add a password or unlock to remove one, enter the password, then run the tool to download the result.":
    "আপনার PDF আপলোড করুন। পাসওয়ার্ড যোগ করতে লক, আর সরাতে আনলক নির্বাচন করুন। পাসওয়ার্ড লিখে টুলটি চালান, তারপর ফলাফল ডাউনলোড করুন।",
  "tools in the same category": "একই বিভাগের অন্যান্য টুল",
  "compress pdf": "PDF-এর আকার কমান",
  "shrink embedded photos and scans inside a pdf — text stays sharp.":
    "PDF-এর ভেতরের ছবি ও স্ক্যানের আকার কমান—লেখার স্পষ্টতা বজায় থাকবে।",
  "merge pdfs": "একাধিক PDF একত্র করুন",
  "combine multiple pdf files into one document in your chosen order.":
    "একাধিক PDF আপনার পছন্দের ক্রমে একটি নথিতে একত্র করুন।",
  "couldn't load the pdf processing files. please refresh the page and try again.":
    "PDF প্রক্রিয়াকরণের ফাইলগুলো লোড করা যায়নি। পৃষ্ঠাটি রিফ্রেশ করে আবার চেষ্টা করুন।",
  "the pdf processing tool couldn't start. please refresh the page and try again.":
    "PDF প্রক্রিয়াকরণের টুলটি চালু করা যায়নি। পৃষ্ঠাটি রিফ্রেশ করে আবার চেষ্টা করুন।",
  "this tool can only run in your browser.":
    "এই টুলটি শুধু আপনার ব্রাউজারেই চালানো যায়।",
  "couldn't protect this pdf. please check the file and try again.":
    "এই PDF-টি সুরক্ষিত করা যায়নি। ফাইলটি পরীক্ষা করে আবার চেষ্টা করুন।",
  "couldn't unlock this pdf. check that the password is correct and the pdf is supported.":
    "এই PDF-এর পাসওয়ার্ড সরানো যায়নি। পাসওয়ার্ড সঠিক কি না দেখুন এবং PDF-টি সমর্থিত কি না নিশ্চিত করুন।",
  "something went wrong while protecting this pdf. please try again.":
    "PDF সুরক্ষিত করার সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।",
  "something went wrong while unlocking this pdf. check the password and try again.":
    "PDF আনলক করার সময় সমস্যা হয়েছে। পাসওয়ার্ড যাচাই করে আবার চেষ্টা করুন।",
  "locking failed — try again": "PDF লক করা যায়নি—আবার চেষ্টা করুন",
  "unlocking failed — try again": "PDF আনলক করা যায়নি—আবার চেষ্টা করুন",
  "add an input to get started": "শুরু করতে একটি ফাইল যোগ করুন",
};

function translateLockUnlockPdfText(
  value: string,
  locale: string | undefined,
): string {
  const raw = String(value ?? "");
  if (
    !String(locale ?? "")
      .toLowerCase()
      .startsWith("bn")
  )
    return raw;

  const normalized = raw.replace(/\s+/g, " ").trim().toLowerCase();
  const exact = LOCK_UNLOCK_PDF_BN[normalized];
  if (exact !== undefined) return exact;

  // Keep dynamic filenames and file sizes intact while translating the UI.
  const doneMatch = raw.trim().match(/^Done:\s*(.+?)\s+ready to download$/i);
  if (doneMatch) return `সম্পন্ন: ${doneMatch[1]} — ডাউনলোডের জন্য প্রস্তুত`;

  const readyMatch = raw.trim().match(/^Ready to process:\s*(.+)$/i);
  if (readyMatch) return `প্রক্রিয়াকরণের জন্য প্রস্তুত: ${readyMatch[1]}`;

  return raw;
}

function PdfT({ children }: { children: React.ReactNode }) {
  const { locale } = useSohozI18n();
  if (typeof children !== "string") return <>{children}</>;
  return <>{translateLockUnlockPdfText(children, locale)}</>;
}

function getUserFacingErrorMessage(error: unknown, mode: Mode): string {
  const message = error instanceof Error ? error.message : "";

  if (
    message.includes("Couldn't load") ||
    message.includes("Make sure qpdf.js")
  ) {
    return "Couldn't load the PDF processing files. Please refresh the page and try again.";
  }
  if (message.includes("no factory function was found")) {
    return "The PDF processing tool couldn't start. Please refresh the page and try again.";
  }
  if (message.includes("qpdf can only run in the browser.")) {
    return "This tool can only run in your browser.";
  }
  if (message.includes("qpdf couldn't produce an output file")) {
    return mode === "lock"
      ? "Couldn't protect this PDF. Please check the file and try again."
      : "Couldn't unlock this PDF. Check that the password is correct and the PDF is supported.";
  }

  return mode === "lock"
    ? "Something went wrong while protecting this PDF. Please try again."
    : "Something went wrong while unlocking this PDF. Check the password and try again.";
}
// ---------------------------------------------------------------------------
// Vercel / TypeScript Blob compatibility helper
// ---------------------------------------------------------------------------
//
// Newer TypeScript lib.dom typings can infer Uint8Array as
// Uint8Array<ArrayBufferLike>. Blob expects a BlobPart whose underlying
// ArrayBuffer is a concrete ArrayBuffer.
//
// We explicitly allocate a real ArrayBuffer and copy the bytes into it.
// This does not change the PDF bytes or any application functionality.
// ---------------------------------------------------------------------------
function toRealArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  const view = new Uint8Array(buffer);
  view.set(bytes);
  return buffer;
}
export default function LockUnlockPdf() {
  const { locale } = useSohozI18n();
  const tx = (value: string) => translateLockUnlockPdfText(value, locale);
  const pageRef = useRef<HTMLDivElement>(null);
  // Measure the real bottom edge of the site header so the page starts
  // exactly under it (no white gap, no overlap), whatever its height is.
  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const measure = () => {
      const header = document.querySelector("header") as HTMLElement | null;
      if (!header) return;
      const bottom = header.getBoundingClientRect().bottom;
      if (bottom > 30 && bottom < 140) {
        // 1px overlap hides any hairline seam under the header
        page.style.setProperty(
          "--lu-header-h",
          `${Math.max(0, Math.round(bottom) - 1)}px`,
        );
      }
    };
    measure();
    window.addEventListener("resize", measure);
    const header = document.querySelector("header");
    const ro =
      header && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    if (header && ro) ro.observe(header);
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, []);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [mode, setMode] = useState<Mode>("lock");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setResult(null);
      setErrorMessage(null);
    }
  };
  const handleReset = () => {
    setSelectedFile(null);
    setPassword("");
    setConfirmPassword("");
    setUnlockPassword("");
    setIsProcessing(false);
    setErrorMessage(null);
    setResult(null);
  };
  const handleModeChange = (next: Mode) => {
    setMode(next);
    setResult(null);
    setErrorMessage(null);
  };
  const passwordsMismatch =
    mode === "lock" &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;
  const canSubmit =
    !!selectedFile &&
    !isProcessing &&
    (mode === "lock"
      ? password.length >= 4 && password === confirmPassword
      : unlockPassword.length > 0);
  const handleSubmit = async () => {
    if (!selectedFile) {
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    setResult(null);
    try {
      const bytes = new Uint8Array(await selectedFile.arrayBuffer());
      const outputBytes =
        mode === "lock"
          ? await lockPdfBytes(bytes, password)
          : await unlockPdfBytes(bytes, unlockPassword);
      setResult({
        bytes: outputBytes,
        size: outputBytes.byteLength,
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(getUserFacingErrorMessage(err, mode));
    } finally {
      setIsProcessing(false);
    }
  };
  const handleDownload = () => {
    if (!result || !selectedFile) {
      return;
    }
    // IMPORTANT:
    // Convert the Uint8Array into a concrete ArrayBuffer before
    // passing it to Blob. This fixes Vercel's TS2322 BlobPart error
    // without changing the actual PDF contents.
    const pdfBuffer = toRealArrayBuffer(result.bytes);
    const blob = new Blob([pdfBuffer], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = selectedFile.name.replace(/\.pdf$/i, "");
    a.download = `${baseName}-${mode === "lock" ? "locked" : "unlocked"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <div
      ref={pageRef}
      className="lock-unlock-pdf-page relative -mt-5 left-1/2 -ml-[50vw] w-screen max-w-[100vw] min-w-0 min-h-[calc(100dvh-72px)] bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] px-4 py-5 sm:px-6"
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .lock-unlock-pdf-font.lock-unlock-pdf-font, .lock-unlock-pdf-font.lock-unlock-pdf-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        .lock-unlock-pdf-font h1, .lock-unlock-pdf-font h2, .lock-unlock-pdf-font h3, .lock-unlock-pdf-font h4 { letter-spacing: -0.01em; }

        /* Prevent the full-bleed background from creating the unwanted bottom horizontal scrollbar. */
        html, body { overflow-x: clip !important; }
        .lock-unlock-pdf-page { box-sizing: border-box; }
        .lock-unlock-pdf-content { min-width: 0; }

        /* Compact desktop layout: keep the complete default tool view in one viewport. */
        @media (min-width: 1200px) and (min-height: 760px) {
          /* One-screen mode: the page is pinned exactly between the site header
             and the bottom of the viewport. This removes the white strip above
             the page and the white band that appeared below it when scrolling,
             regardless of padding/margins from the parent layout.
             The real header height is measured in JS (see useEffect); 64px is only the fallback. */
          html, body { overflow: hidden !important; }
          .lock-unlock-pdf-page {
            --lu-header-h: 64px;
            position: fixed !important;
            top: var(--lu-header-h) !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: auto !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            z-index: 1;
            min-height: 0 !important;
            padding-top: 14px !important;
            padding-bottom: 8px !important;
            overflow: hidden;
          }
          .lock-unlock-pdf-content {
            display: flex;
            flex-direction: column;
            gap: 8px;
            height: 100%;
            min-height: 0;
            overflow: hidden;
          }
          .lock-unlock-pdf-content > :not([hidden]) ~ :not([hidden]) { margin-top: 0 !important; }
          .lock-unlock-pdf-breadcrumb { flex: 0 0 auto; min-height: 16px; line-height: 1.2; white-space: nowrap; overflow: hidden; }
          .lock-unlock-pdf-hero { flex: 0 0 auto; min-height: 0; padding: 10px 14px !important; }
          .lock-unlock-pdf-hero .w-12.h-12 { width: 2.25rem !important; height: 2.25rem !important; }
          .lock-unlock-pdf-main { flex: 1 1 0%; min-height: 0; max-height: 100%; gap: 10px !important; align-items: stretch !important; }
          .lock-unlock-pdf-controls { min-width: 0; min-height: 0; max-height: 100%; overflow-y: auto; overflow-x: hidden; gap: 8px !important; }
          .lock-unlock-pdf-controls > div { padding: 12px !important; gap: 10px !important; }
          .lock-unlock-pdf-controls > div:first-child > div > div:first-child { margin-bottom: 8px !important; }
          .lock-unlock-pdf-dropzone { min-height: 118px !important; padding: 12px !important; }
          .lock-unlock-pdf-preview { min-width: 0; min-height: 0 !important; max-height: 100%; padding: 12px !important; overflow: hidden; }
          .lock-unlock-pdf-preview > div:first-child { padding-bottom: 4px !important; }
          .lock-unlock-pdf-preview > div:nth-child(2) { flex: 1 1 0%; min-height: 0 !important; margin: 8px 0 !important; padding: 10px !important; overflow: hidden; }
          .lock-unlock-pdf-actions { flex: 0 0 auto; padding: 8px 12px !important; gap: 8px !important; }
          .lock-unlock-pdf-notice { flex: 0 0 auto; padding: 8px 12px !important; }
          .lock-unlock-pdf-howto { flex: 0 0 auto; }
          .lock-unlock-pdf-howto > button { padding-top: 8px !important; padding-bottom: 8px !important; }
          .lock-unlock-pdf-related { flex: 0 0 auto; padding-top: 0 !important; }
          .lock-unlock-pdf-related > div { gap: 8px !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .lock-unlock-pdf-related > div > a { min-width: 0; padding: 8px 10px !important; gap: 8px !important; }
          .lock-unlock-pdf-related > div > a p { line-height: 1.3 !important; }
        }
      `}</style>
      <div className="lock-unlock-pdf-content mx-auto w-full max-w-[1440px] space-y-5 text-[#3B2F1E] font-sans lock-unlock-pdf-font">
        {/* Breadcrumb Navigation */}
        <div className="lock-unlock-pdf-breadcrumb flex items-center gap-2 text-sm text-[#6B5A40]">
          <Link
            href="/sohoj-tools"
            className="flex items-center gap-1 hover:text-[#3B2F1E] transition-colors"
          >
            <ArrowLeft size={14} />

            <span>
              <PdfT>{"Back to Tools"}</PdfT>
            </span>
          </Link>

          <span>
            <PdfT>{"/"}</PdfT>
          </span>

          <span>
            <PdfT>{"PDF Tools"}</PdfT>
          </span>

          <span>
            <PdfT>{"/"}</PdfT>
          </span>

          <span className="font-semibold text-[#3B2F1E]">
            <PdfT>{"Lock / Unlock PDF"}</PdfT>
          </span>
        </div>

        {/* Header Card */}
        <div className="lock-unlock-pdf-hero bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-[#F6EEDB] text-[#DC2626] rounded-xl flex items-center justify-center shrink-0 border border-[#E3D6B8]">
              <Lock size={24} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-[#3B2F1E]">
                  <PdfT>{"Lock / Unlock PDF\n              "}</PdfT>
                </h1>

                <span className="bg-emerald-100 text-emerald-700 text-[12px] font-bold px-2 py-0.5 rounded-full">
                  <PdfT>{"Free\n              "}</PdfT>
                </span>
              </div>

              <p className="text-sm text-[#6B5A40] font-medium mt-0.5">
                <PdfT>
                  {
                    "Add a password to protect your PDF or remove an existing password.\n            "
                  }
                </PdfT>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={tx("Add to favorites")}
              title={tx("Add to favorites")}
              className="p-2 text-[#7A6A50] hover:text-[#5A4A32] bg-[#F6EEDB] hover:bg-[#EFE3C8] rounded-xl transition-all border border-[#E3D6B8]"
            >
              <Star size={16} />
            </button>

            <button
              type="button"
              aria-label={tx("Share this tool")}
              title={tx("Share this tool")}
              className="p-2 text-[#7A6A50] hover:text-[#5A4A32] bg-[#F6EEDB] hover:bg-[#EFE3C8] rounded-xl transition-all border border-[#E3D6B8]"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="lock-unlock-pdf-main grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Side: Upload Box + Password Settings */}
          <div className="lock-unlock-pdf-controls lg:col-span-4 space-y-4">
            <div className="bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-[#3B2F1E]">
                    <PdfT>{"Files ("}</PdfT>
                    {selectedFile ? 1 : 0}
                    <PdfT>{")\n                "}</PdfT>
                  </h2>

                  <label className="inline-flex items-center gap-1 text-[13px] font-bold text-[#DC2626] bg-[#F6EEDB] hover:bg-[#EFE3C8] px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-[#E3D6B8]">
                    <Plus size={12} />

                    <span>
                      <PdfT>{"Add"}</PdfT>
                    </span>

                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {!selectedFile ? (
                  <label className="lock-unlock-pdf-dropzone border-2 border-dashed border-[#B0A080] bg-[#F6EEDB]/50 hover:bg-[#EFE3C8] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group min-h-[220px]">
                    <div className="w-10 h-10 bg-[#FEE9E9]/80 text-[#DC2626] rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Upload size={20} />
                    </div>

                    <span className="text-sm font-bold text-[#3B2F1E]">
                      <PdfT>
                        {
                          "Drop a PDF here or click to upload\n                  "
                        }
                      </PdfT>
                    </span>

                    <span className="text-[12px] text-[#7A6A50] font-medium mt-1">
                      <PdfT>
                        {"1 PDF file, max 500 MB\n                  "}
                      </PdfT>
                    </span>

                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="bg-[#F6EEDB] border border-[#E3D6B8] rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 bg-[#FEE9E9] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>

                      <div className="truncate">
                        <p className="text-sm font-bold text-[#3B2F1E] truncate">
                          {selectedFile.name}
                        </p>

                        <p className="text-[12px] text-[#7A6A50]">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)}
                          <PdfT>{"MB\n                      "}</PdfT>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleReset}
                      aria-label={tx("Remove selected PDF")}
                      title={tx("Remove selected PDF")}
                      className="p-1 text-[#7A6A50] hover:text-[#B91C1C] rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Password Settings Card */}
            {selectedFile && (
              <div className="bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-[#3B2F1E]">
                  <PdfT>{"Password settings\n              "}</PdfT>
                </h2>

                {/* Toggle Tabs */}
                <div className="bg-[#F3E9D2] p-1 rounded-xl flex items-center gap-1">
                  <button
                    onClick={() => handleModeChange("lock")}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                      mode === "lock"
                        ? "bg-[#F6D9A8] text-[#B91C1C] shadow-sm border border-[#DC2626] ring-2 ring-[#DC2626]/20"
                        : "text-[#6B5A40] hover:text-[#3B2F1E]"
                    }`}
                  >
                    <Lock size={12} />
                    <PdfT>{"Lock\n                "}</PdfT>
                  </button>

                  <button
                    onClick={() => handleModeChange("unlock")}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                      mode === "unlock"
                        ? "bg-[#F6D9A8] text-[#B91C1C] shadow-sm border border-[#DC2626] ring-2 ring-[#DC2626]/20"
                        : "text-[#6B5A40] hover:text-[#3B2F1E]"
                    }`}
                  >
                    <KeyRound size={12} />
                    <PdfT>{"Unlock\n                "}</PdfT>
                  </button>
                </div>

                {mode === "lock" ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-[#5A4A32] block">
                        <PdfT>{"New password\n                    "}</PdfT>
                      </label>

                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={tx("At least 4 characters")}
                          className="w-full bg-[#FBF6E8] border border-[#E3D6B8] rounded-xl pl-3 pr-9 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={tx(
                            showPassword ? "Hide password" : "Show password",
                          )}
                          title={tx(
                            showPassword ? "Hide password" : "Show password",
                          )}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A6A50] hover:text-[#5A4A32]"
                        >
                          {showPassword ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-[#5A4A32] block">
                        <PdfT>{"Confirm password\n                    "}</PdfT>
                      </label>

                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={tx("Re-enter password")}
                        className={`w-full bg-[#FBF6E8] border rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 ${
                          passwordsMismatch
                            ? "border-[#FBB6B6] focus:ring-[#DC2626]/20"
                            : "border-[#E3D6B8] focus:ring-[#DC2626]/20"
                        }`}
                      />

                      {passwordsMismatch && (
                        <p className="text-[12px] text-[#DC2626] font-medium">
                          <PdfT>
                            {"Passwords don't match.\n                      "}
                          </PdfT>
                        </p>
                      )}
                    </div>

                    <p className="text-[12px] text-[#7A6A50] leading-relaxed">
                      <PdfT>
                        {
                          "This password will be required to open the PDF. Anyone\n                    without it won't be able to view the document.\n                  "
                        }
                      </PdfT>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#5A4A32] block">
                      <PdfT>{"Current password\n                  "}</PdfT>
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={unlockPassword}
                        onChange={(e) => setUnlockPassword(e.target.value)}
                        placeholder={tx("Enter the PDF's password")}
                        className="w-full bg-[#FBF6E8] border border-[#E3D6B8] rounded-xl pl-3 pr-9 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={tx(
                          showPassword ? "Hide password" : "Show password",
                        )}
                        title={tx(
                          showPassword ? "Hide password" : "Show password",
                        )}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A6A50] hover:text-[#5A4A32]"
                      >
                        {showPassword ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>
                    </div>

                    <p className="text-[12px] text-[#7A6A50] leading-relaxed pt-1">
                      <PdfT>
                        {
                          "We'll use this to remove the password and produce an\n                    open-access copy of your PDF.\n                  "
                        }
                      </PdfT>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Lock Preview Box */}
          <div className="lock-unlock-pdf-preview lg:col-span-8 bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs flex flex-col justify-between min-h-[380px]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#3B2F1E]">
                <PdfT>{"Preview"}</PdfT>
              </h2>

              <span
                className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
                  errorMessage
                    ? "bg-red-100 text-red-600"
                    : result
                      ? "bg-emerald-100 text-emerald-700"
                      : isProcessing
                        ? "bg-[#F3E9D2] text-[#B91C1C]"
                        : selectedFile
                          ? "bg-[#FEE9E9] text-[#B91C1C]"
                          : "bg-[#F3E9D2] text-[#6B5A40]"
                }`}
              >
                {errorMessage ? (
                  <PdfT>{"Error"}</PdfT>
                ) : result ? (
                  <PdfT>{"Done"}</PdfT>
                ) : isProcessing ? (
                  mode === "lock" ? (
                    <PdfT>{"Locking"}</PdfT>
                  ) : (
                    <PdfT>{"Unlocking"}</PdfT>
                  )
                ) : selectedFile ? (
                  <PdfT>{"Ready"}</PdfT>
                ) : (
                  <PdfT>{"Empty"}</PdfT>
                )}
              </span>
            </div>

            {isProcessing ? (
              <div className="bg-[#FFFCF4] rounded-2xl border border-dashed border-[#E3D6B8] p-8 flex flex-col items-center justify-center my-auto text-center py-20">
                <Loader2
                  size={28}
                  className="text-[#DC2626] animate-spin mb-3"
                />

                <p className="text-sm font-bold text-[#3B2F1E]">
                  {mode === "lock" ? (
                    <PdfT>{"Encrypting your PDF…"}</PdfT>
                  ) : (
                    <PdfT>{"Decrypting your PDF…"}</PdfT>
                  )}
                </p>

                <p className="text-[13px] text-[#7A6A50] mt-1">
                  <PdfT>
                    {
                      "Everything runs in your browser \u2014 larger files take a little\n                longer.\n              "
                    }
                  </PdfT>
                </p>
              </div>
            ) : errorMessage ? (
              <div className="bg-[#FEE9E9]/80 rounded-2xl border border-dashed border-[#FBB6B6] p-8 flex flex-col items-center justify-center my-auto text-center py-20">
                <div className="w-10 h-10 bg-red-100 text-red-500 rounded-xl flex items-center justify-center mb-3 border border-red-200">
                  <AlertCircle size={20} />
                </div>

                <p className="text-sm font-bold text-[#B91C1C]">
                  {mode === "lock" ? (
                    <PdfT>{"Locking failed"}</PdfT>
                  ) : (
                    <PdfT>{"Unlocking failed"}</PdfT>
                  )}
                </p>

                <p className="text-[13px] text-red-500 mt-1 max-w-xs">
                  <PdfT>{errorMessage}</PdfT>
                </p>
              </div>
            ) : result ? (
              <div className="my-auto py-8 flex flex-col items-center gap-5">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 size={24} />
                </div>

                <div className="text-center">
                  <p className="text-sm font-bold text-[#3B2F1E]">
                    {mode === "lock" ? (
                      <PdfT>{"Your PDF is password-protected"}</PdfT>
                    ) : (
                      <PdfT>{"Your PDF is unlocked"}</PdfT>
                    )}
                  </p>

                  <p className="text-[13px] text-[#7A6A50] mt-1">
                    {formatBytes(result.size)}
                  </p>
                </div>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#DC2626] text-white text-sm font-bold rounded-xl shadow-xs hover:bg-[#B91C1C] transition-all"
                >
                  <Download size={14} />

                  {mode === "lock" ? (
                    <PdfT>{"Download locked PDF"}</PdfT>
                  ) : (
                    <PdfT>{"Download unlocked PDF"}</PdfT>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-[#FFFCF4] rounded-2xl border border-dashed border-[#E3D6B8] p-8 flex flex-col items-center justify-center my-auto text-center py-20">
                <div className="w-10 h-10 bg-[#F6EEDB] text-[#DC2626] rounded-xl flex items-center justify-center mb-3 border border-[#E3D6B8]">
                  <KeyRound size={20} />
                </div>

                <p className="text-sm font-bold text-[#3B2F1E]">
                  {selectedFile ? (
                    <PdfT>{"Enter a password to continue"}</PdfT>
                  ) : (
                    <PdfT>{"Add files to get started"}</PdfT>
                  )}
                </p>

                <p className="text-[13px] text-[#7A6A50] mt-1">
                  <PdfT>
                    {
                      "Your result will appear here after you run the tool.\n              "
                    }
                  </PdfT>
                </p>
              </div>
            )}

            <div />
          </div>
        </div>

        {/* Bottom Action Controls Bar */}
        <div className="lock-unlock-pdf-actions bg-[#FBF6E8] p-3.5 rounded-2xl border border-[#E3D6B8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[#6B5A40]">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                errorMessage
                  ? "bg-[#DC2626]"
                  : result
                    ? "bg-emerald-500"
                    : isProcessing
                      ? "bg-[#DC2626] animate-pulse"
                      : "bg-[#B0A080]"
              }`}
            />

            <span>
              {errorMessage ? (
                <PdfT>{`${mode === "lock" ? "Locking" : "Unlocking"} failed — try again`}</PdfT>
              ) : result ? (
                <PdfT>{`Done: ${formatBytes(result.size)} ready to download`}</PdfT>
              ) : isProcessing ? (
                mode === "lock" ? (
                  <PdfT>{"Locking…"}</PdfT>
                ) : (
                  <PdfT>{"Unlocking…"}</PdfT>
                )
              ) : selectedFile ? (
                <PdfT>{`Ready to process: ${selectedFile.name}`}</PdfT>
              ) : (
                <PdfT>{"Add an input to get started"}</PdfT>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-[#E3D6B8] text-[#3B2F1E] text-sm font-bold rounded-xl hover:bg-[#EFE3C8] transition-all"
            >
              <PdfT>{"Reset\n          "}</PdfT>
            </button>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`px-5 py-2 text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                canSubmit
                  ? "bg-[#DC2626] text-white shadow-xs hover:bg-[#B91C1C]"
                  : "bg-[#F3E9D2] text-[#7A6A50] cursor-not-allowed"
              }`}
            >
              {isProcessing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : mode === "lock" ? (
                <Lock size={14} />
              ) : (
                <KeyRound size={14} />
              )}

              <span>
                {isProcessing ? (
                  mode === "lock" ? (
                    <PdfT>{"Locking…"}</PdfT>
                  ) : (
                    <PdfT>{"Unlocking…"}</PdfT>
                  )
                ) : mode === "lock" ? (
                  <PdfT>{"Lock PDF"}</PdfT>
                ) : (
                  <PdfT>{"Unlock PDF"}</PdfT>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Browser Security Processing Notice */}
        <div className="lock-unlock-pdf-notice bg-emerald-50/60 border border-emerald-100 p-3 rounded-2xl flex items-center gap-2 text-sm text-emerald-800 font-medium">
          <Lock size={15} className="text-emerald-600 shrink-0" />

          <span>
            <PdfT>
              {
                "Your files are processed in the browser \u2014 they are not uploaded to any\n          server.\n        "
              }
            </PdfT>
          </span>
        </div>

        {/* How to use Accordion */}
        <div className="lock-unlock-pdf-howto bg-[#FBF6E8] rounded-2xl border border-[#E3D6B8] shadow-xs overflow-hidden">
          <button
            onClick={() => setShowHowToUse(!showHowToUse)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-sm font-bold text-[#3B2F1E] hover:bg-[#EFE3C8]/70 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-[#DC2626] font-bold">
                <PdfT>{"?"}</PdfT>
              </span>

              <span>
                <PdfT>{"How to use"}</PdfT>
              </span>
            </div>

            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse && (
            <div className="px-5 pb-4 text-sm text-[#6B5A40] leading-relaxed border-t border-[#E3D6B8]/60 pt-3">
              <PdfT>
                {
                  "Upload your PDF, choose Lock to add a password or Unlock to remove\n            one, enter the password, then run the tool to download the result.\n          "
                }
              </PdfT>
            </div>
          )}
        </div>

        {/* Same Category Tools */}
        <div className="lock-unlock-pdf-related space-y-3 pt-2">
          <h3 className="text-sm font-bold text-[#3B2F1E]">
            <PdfT>{"Tools in the same category\n        "}</PdfT>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/sohoj-tools/compress-pdf"
              className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs hover:border-[#DC2626]/60 transition-all flex items-start gap-3 group"
            >
              <div className="w-8 h-8 bg-[#F6EEDB] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0">
                <Minimize2 size={16} />
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#3B2F1E] group-hover:text-[#B91C1C] transition-colors">
                  <PdfT>{"Compress PDF\n              "}</PdfT>
                </h4>

                <p className="text-[12px] text-[#7A6A50] mt-0.5 line-clamp-1">
                  <PdfT>
                    {
                      "Shrink embedded photos and scans inside a PDF \u2014 text stays\n                sharp.\n              "
                    }
                  </PdfT>
                </p>
              </div>
            </Link>

            <Link
              href="/sohoj-tools/merge-pdfs"
              className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs hover:border-[#DC2626]/60 transition-all flex items-start gap-3 group"
            >
              <div className="w-8 h-8 bg-[#F6EEDB] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0">
                <Combine size={16} />
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#3B2F1E] group-hover:text-[#B91C1C] transition-colors">
                  <PdfT>{"Merge PDFs\n              "}</PdfT>
                </h4>

                <p className="text-[12px] text-[#7A6A50] mt-0.5 line-clamp-1">
                  <PdfT>
                    {
                      "Combine multiple PDF files into one document in your chosen\n                order.\n              "
                    }
                  </PdfT>
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
