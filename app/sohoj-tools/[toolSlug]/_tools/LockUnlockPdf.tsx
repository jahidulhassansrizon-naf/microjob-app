"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, { useState } from "react";
import Link from "next/link";
import { Lock, Star, Share2, Upload, FileText, ChevronDown, ChevronUp, Minimize2, Combine, FilePlus, ArrowLeft, X, Plus, KeyRound, Loader2, Download, CheckCircle2, AlertCircle, Eye, EyeOff, } from "lucide-react";
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
        script.onerror = () => reject(new Error(`Couldn't load ${QPDF_SCRIPT_SRC}. Make sure qpdf.js and qpdf.wasm from @jspawn/qpdf-wasm are copied into your public/qpdf-wasm/ folder.`));
        document.body.appendChild(script);
    });
}
function resolveQpdfFactory(): QpdfFactory {
    const w = window as any;
    const factory = w.Module ?? w.QPDF ?? w.createQPDFModule ?? w.qpdf;
    if (typeof factory !== "function") {
        throw new Error("qpdf.js loaded, but no factory function was found on window (checked Module, QPDF, createQPDFModule, qpdf). Check node_modules/@jspawn/qpdf-wasm/tests for the real export name and update resolveQpdfFactory().");
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
async function runQpdf(bytes: Uint8Array, buildArgs: (input: string, output: string) => string[]): Promise<Uint8Array> {
    const qpdf = await createQpdfInstance();
    const inputPath = "/input.pdf";
    const outputPath = "/output.pdf";
    qpdf.FS.writeFile(inputPath, bytes);
    try {
        qpdf.callMain(buildArgs(inputPath, outputPath));
    }
    catch (err) {
        // Emscripten CLI builds typically throw an "ExitStatus" for a non-zero
        // exit code rather than returning one — qpdf's own stderr (logged to
        // the console by default) usually explains the underlying reason.
        console.error("qpdf exited with an error:", err);
    }
    try {
        return qpdf.FS.readFile(outputPath);
    }
    catch {
        throw new Error("qpdf couldn't produce an output file — the password may be wrong, or this PDF isn't supported.");
    }
}
async function lockPdfBytes(bytes: Uint8Array, password: string): Promise<Uint8Array> {
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
async function unlockPdfBytes(bytes: Uint8Array, password: string): Promise<Uint8Array> {
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
    "free": "বিনামূল্যে",
    "add a password to protect your pdf or remove an existing password.": "PDF-এ পাসওয়ার্ড যোগ করে সুরক্ষিত করুন অথবা আগে থেকে থাকা পাসওয়ার্ড সরিয়ে ফেলুন।",
    "add to favorites": "পছন্দের তালিকায় যোগ করুন",
    "share this tool": "এই টুলটি শেয়ার করুন",
    "files (": "ফাইল (",
    ")": ")",
    "add": "যোগ করুন",
    "drop a pdf here or click to upload": "এখানে PDF টেনে আনুন অথবা আপলোড করতে ক্লিক করুন",
    "1 pdf file, max 500 mb": "১টি PDF ফাইল, সর্বোচ্চ ৫০০ MB",
    "mb": "MB",
    "remove selected pdf": "নির্বাচিত PDF সরিয়ে ফেলুন",
    "password settings": "পাসওয়ার্ড সেটিংস",
    "lock": "লক",
    "unlock": "আনলক",
    "new password": "নতুন পাসওয়ার্ড",
    "at least 4 characters": "কমপক্ষে ৪টি অক্ষর",
    "hide password": "পাসওয়ার্ড আড়াল করুন",
    "show password": "পাসওয়ার্ড দেখান",
    "confirm password": "পাসওয়ার্ড নিশ্চিত করুন",
    "re-enter password": "পাসওয়ার্ড আবার লিখুন",
    "passwords don't match.": "পাসওয়ার্ড দুটি মিলছে না।",
    "this password will be required to open the pdf. anyone without it won't be able to view the document.": "PDF খুলতে এই পাসওয়ার্ডটি লাগবে। পাসওয়ার্ড ছাড়া কেউ নথিটি দেখতে পারবেন না।",
    "current password": "বর্তমান পাসওয়ার্ড",
    "enter the pdf's password": "PDF-এর পাসওয়ার্ড লিখুন",
    "we'll use this to remove the password and produce an open-access copy of your pdf.": "এই পাসওয়ার্ড দিয়ে PDF-এর সুরক্ষা সরিয়ে একটি পাসওয়ার্ডবিহীন কপি তৈরি করা হবে।",
    "preview": "পূর্বরূপ",
    "error": "ত্রুটি",
    "done": "সম্পন্ন",
    "locking": "লক করা হচ্ছে",
    "unlocking": "আনলক করা হচ্ছে",
    "locking…": "লক করা হচ্ছে…",
    "unlocking…": "আনলক করা হচ্ছে…",
    "ready": "প্রস্তুত",
    "empty": "খালি",
    "encrypting your pdf…": "আপনার PDF-এ পাসওয়ার্ড যোগ করা হচ্ছে…",
    "decrypting your pdf…": "আপনার PDF থেকে পাসওয়ার্ড সরানো হচ্ছে…",
    "everything runs in your browser — larger files take a little longer.": "সব কাজ আপনার ব্রাউজারেই হয়—বড় ফাইলের ক্ষেত্রে একটু বেশি সময় লাগতে পারে।",
    "locking failed": "PDF লক করা যায়নি",
    "unlocking failed": "PDF আনলক করা যায়নি",
    "your pdf is password-protected": "আপনার PDF পাসওয়ার্ড দিয়ে সুরক্ষিত হয়েছে",
    "your pdf is unlocked": "আপনার PDF-এর পাসওয়ার্ড সরানো হয়েছে",
    "download locked pdf": "পাসওয়ার্ডযুক্ত PDF ডাউনলোড করুন",
    "download unlocked pdf": "পাসওয়ার্ডবিহীন PDF ডাউনলোড করুন",
    "enter a password to continue": "এগিয়ে যেতে পাসওয়ার্ড লিখুন",
    "add files to get started": "শুরু করতে ফাইল যোগ করুন",
    "your result will appear here after you run the tool.": "টুলটি চালালে ফলাফল এখানে দেখা যাবে।",
    "reset": "রিসেট করুন",
    "lock pdf": "PDF লক করুন",
    "unlock pdf": "PDF আনলক করুন",
    "your files are processed in the browser — they are not uploaded to any server.": "আপনার ফাইলগুলো ব্রাউজারেই প্রক্রিয়াকরণ করা হয়—কোনো সার্ভারে আপলোড করা হয় না।",
    "?": "?",
    "how to use": "ব্যবহারের নিয়ম",
    "upload your pdf, choose lock to add a password or unlock to remove one, enter the password, then run the tool to download the result.": "আপনার PDF আপলোড করুন। পাসওয়ার্ড যোগ করতে লক, আর সরাতে আনলক নির্বাচন করুন। পাসওয়ার্ড লিখে টুলটি চালান, তারপর ফলাফল ডাউনলোড করুন।",
    "tools in the same category": "একই বিভাগের অন্যান্য টুল",
    "compress pdf": "PDF-এর আকার কমান",
    "shrink embedded photos and scans inside a pdf — text stays sharp.": "PDF-এর ভেতরের ছবি ও স্ক্যানের আকার কমান—লেখার স্পষ্টতা বজায় থাকবে।",
    "merge pdfs": "একাধিক PDF একত্র করুন",
    "combine multiple pdf files into one document in your chosen order.": "একাধিক PDF আপনার পছন্দের ক্রমে একটি নথিতে একত্র করুন।",
    "couldn't load the pdf processing files. please refresh the page and try again.": "PDF প্রক্রিয়াকরণের ফাইলগুলো লোড করা যায়নি। পৃষ্ঠাটি রিফ্রেশ করে আবার চেষ্টা করুন।",
    "the pdf processing tool couldn't start. please refresh the page and try again.": "PDF প্রক্রিয়াকরণের টুলটি চালু করা যায়নি। পৃষ্ঠাটি রিফ্রেশ করে আবার চেষ্টা করুন।",
    "this tool can only run in your browser.": "এই টুলটি শুধু আপনার ব্রাউজারেই চালানো যায়।",
    "couldn't protect this pdf. please check the file and try again.": "এই PDF-টি সুরক্ষিত করা যায়নি। ফাইলটি পরীক্ষা করে আবার চেষ্টা করুন।",
    "couldn't unlock this pdf. check that the password is correct and the pdf is supported.": "এই PDF-এর পাসওয়ার্ড সরানো যায়নি। পাসওয়ার্ড সঠিক কি না দেখুন এবং PDF-টি সমর্থিত কি না নিশ্চিত করুন।",
    "something went wrong while protecting this pdf. please try again.": "PDF সুরক্ষিত করার সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।",
    "something went wrong while unlocking this pdf. check the password and try again.": "PDF আনলক করার সময় সমস্যা হয়েছে। পাসওয়ার্ড যাচাই করে আবার চেষ্টা করুন।",
    "locking failed — try again": "PDF লক করা যায়নি—আবার চেষ্টা করুন",
    "unlocking failed — try again": "PDF আনলক করা যায়নি—আবার চেষ্টা করুন",
    "add an input to get started": "শুরু করতে একটি ফাইল যোগ করুন",
};

function translateLockUnlockPdfText(value: string, locale: string | undefined): string {
    const raw = String(value ?? "");
    if (!String(locale ?? "").toLowerCase().startsWith("bn")) return raw;

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

    if (message.includes("Couldn't load") || message.includes("Make sure qpdf.js")) {
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
    const passwordsMismatch = mode === "lock" &&
        confirmPassword.length > 0 &&
        password !== confirmPassword;
    const canSubmit = !!selectedFile &&
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
            const outputBytes = mode === "lock"
                ? await lockPdfBytes(bytes, password)
                : await unlockPdfBytes(bytes, unlockPassword);
            setResult({
                bytes: outputBytes,
                size: outputBytes.byteLength,
            });
        }
        catch (err) {
            console.error(err);
            setErrorMessage(getUserFacingErrorMessage(err, mode));
        }
        finally {
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
    return (<div className="w-full space-y-5 text-[#0F172A] font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/sohoj-tools" className="flex items-center gap-1 hover:text-[#0F172A] transition-colors">
          <ArrowLeft size={14}/>

          <span><PdfT>{"Back to Tools"}</PdfT></span>
        </Link>

        <span><PdfT>{"/"}</PdfT></span>

        <span><PdfT>{"PDF Tools"}</PdfT></span>

        <span><PdfT>{"/"}</PdfT></span>

        <span className="font-semibold text-[#0F172A]"><PdfT>{"Lock / Unlock PDF"}</PdfT></span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#EEF2FF] text-[#4F46E5] rounded-xl flex items-center justify-center shrink-0 border border-[#C7D2FE]">
            <Lock size={24}/>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#0F172A]"><PdfT>{"Lock / Unlock PDF\n              "}</PdfT></h1>

              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full"><PdfT>{"Free\n              "}</PdfT></span>
            </div>

            <p className="text-xs text-gray-500 font-medium mt-0.5"><PdfT>{"Add a password to protect your PDF or remove an existing password.\n            "}</PdfT></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={tx("Add to favorites")}
            title={tx("Add to favorites")}
            className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100"
          >
            <Star size={16}/>
          </button>

          <button
            type="button"
            aria-label={tx("Share this tool")}
            title={tx("Share this tool")}
            className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100"
          >
            <Share2 size={16}/>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Upload Box + Password Settings */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-[#0F172A]"><PdfT>{"Files ("}</PdfT>{selectedFile ? 1 : 0}<PdfT>{")\n                "}</PdfT></h2>

                <label className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-[#DBEAFE]">
                  <Plus size={12}/>

                  <span><PdfT>{"Add"}</PdfT></span>

                  <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden"/>
                </label>
              </div>

              {!selectedFile ? (<label className="border-2 border-dashed border-[#BFDBFE] bg-[#EFF6FF]/30 hover:bg-[#EFF6FF]/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group min-h-[220px]">
                  <div className="w-10 h-10 bg-[#DBEAFE]/80 text-[#2563EB] rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Upload size={20}/>
                  </div>

                  <span className="text-xs font-bold text-[#0F172A]"><PdfT>{"Drop a PDF here or click to upload\n                  "}</PdfT></span>

                  <span className="text-[10px] text-gray-400 font-medium mt-1"><PdfT>{"1 PDF file, max 500 MB\n                  "}</PdfT></span>

                  <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden"/>
                </label>) : (<div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 bg-[#DBEAFE] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
                      <FileText size={16}/>
                    </div>

                    <div className="truncate">
                      <p className="text-xs font-bold text-[#0F172A] truncate">
                        {selectedFile.name}
                      </p>

                      <p className="text-[10px] text-gray-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)}<PdfT>{"MB\n                      "}</PdfT></p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    aria-label={tx("Remove selected PDF")}
                    title={tx("Remove selected PDF")}
                    className="p-1 text-gray-400 hover:text-[#2563EB] rounded-lg transition-colors"
                  >
                    <X size={16}/>
                  </button>
                </div>)}
            </div>
          </div>

          {/* Password Settings Card */}
          {selectedFile && (<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-[#0F172A]"><PdfT>{"Password settings\n              "}</PdfT></h2>

              {/* Toggle Tabs */}
              <div className="bg-[#E2E8F0] p-1 rounded-xl flex items-center gap-1">
                <button onClick={() => handleModeChange("lock")} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${mode === "lock"
                ? "bg-white text-[#0F172A] shadow-xs"
                : "text-gray-500 hover:text-[#0F172A]"}`}>
                  <Lock size={12}/><PdfT>{"Lock\n                "}</PdfT></button>

                <button onClick={() => handleModeChange("unlock")} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${mode === "unlock"
                ? "bg-white text-[#0F172A] shadow-xs"
                : "text-gray-500 hover:text-[#0F172A]"}`}>
                  <KeyRound size={12}/><PdfT>{"Unlock\n                "}</PdfT></button>
              </div>

              {mode === "lock" ? (<div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 block"><PdfT>{"New password\n                    "}</PdfT></label>

                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tx("At least 4 characters")} className="w-full bg-white border border-gray-200 rounded-xl pl-3 pr-9 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"/>

                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={tx(showPassword ? "Hide password" : "Show password")}
                        title={tx(showPassword ? "Hide password" : "Show password")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (<EyeOff size={14}/>) : (<Eye size={14}/>)}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 block"><PdfT>{"Confirm password\n                    "}</PdfT></label>

                    <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={tx("Re-enter password")} className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 ${passwordsMismatch
                    ? "border-[#93C5FD] focus:ring-[#2563EB]/20"
                    : "border-gray-200 focus:ring-[#2563EB]/20"}`}/>

                    {passwordsMismatch && (<p className="text-[10px] text-[#2563EB] font-medium"><PdfT>{"Passwords don't match.\n                      "}</PdfT></p>)}
                  </div>

                  <p className="text-[10px] text-gray-400 leading-relaxed"><PdfT>{"This password will be required to open the PDF. Anyone\n                    without it won't be able to view the document.\n                  "}</PdfT></p>
                </div>) : (<div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 block"><PdfT>{"Current password\n                  "}</PdfT></label>

                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} placeholder={tx("Enter the PDF's password")} className="w-full bg-white border border-gray-200 rounded-xl pl-3 pr-9 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"/>

                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={tx(showPassword ? "Hide password" : "Show password")}
                      title={tx(showPassword ? "Hide password" : "Show password")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>

                  <p className="text-[10px] text-gray-400 leading-relaxed pt-1"><PdfT>{"We'll use this to remove the password and produce an\n                    open-access copy of your PDF.\n                  "}</PdfT></p>
                </div>)}
            </div>)}
        </div>

        {/* Right Side: Lock Preview Box */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#0F172A]"><PdfT>{"Preview"}</PdfT></h2>

            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${errorMessage
            ? "bg-red-100 text-red-600"
            : result
                ? "bg-emerald-100 text-emerald-700"
                : isProcessing
                    ? "bg-[#E2E8F0] text-[#2563EB]"
                    : selectedFile
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-500"}`}>
              {errorMessage
        ? <PdfT>{"Error"}</PdfT> : result
        ? <PdfT>{"Done"}</PdfT>
        : isProcessing
            ? mode === "lock"
                ? <PdfT>{"Locking"}</PdfT>
                : <PdfT>{"Unlocking"}</PdfT>
            : selectedFile
                ? <PdfT>{"Ready"}</PdfT>
                : <PdfT>{"Empty"}</PdfT>}
            </span>
          </div>

          {isProcessing ? (<div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-20">
              <Loader2 size={28} className="text-[#4F46E5] animate-spin mb-3"/>

              <p className="text-xs font-bold text-[#0F172A]">
                {mode === "lock"
            ? <PdfT>{"Encrypting your PDF…"}</PdfT> : <PdfT>{"Decrypting your PDF…"}</PdfT>}
              </p>

              <p className="text-[11px] text-gray-400 mt-1"><PdfT>{"Everything runs in your browser \u2014 larger files take a little\n                longer.\n              "}</PdfT></p>
            </div>) : errorMessage ? (<div className="bg-[#EFF6FF]/60 rounded-2xl border border-dashed border-[#BFDBFE] p-8 flex flex-col items-center justify-center my-auto text-center py-20">
              <div className="w-10 h-10 bg-red-100 text-red-500 rounded-xl flex items-center justify-center mb-3 border border-red-200">
                <AlertCircle size={20}/>
              </div>

              <p className="text-xs font-bold text-[#1E3A8A]">
                {mode === "lock" ? <PdfT>{"Locking failed"}</PdfT> : <PdfT>{"Unlocking failed"}</PdfT>}
              </p>

              <p className="text-[11px] text-red-500 mt-1 max-w-xs">
                <PdfT>{errorMessage}</PdfT>
              </p>
            </div>) : result ? (<div className="my-auto py-8 flex flex-col items-center gap-5">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-100">
                <CheckCircle2 size={24}/>
              </div>

              <div className="text-center">
                <p className="text-xs font-bold text-[#0F172A]">
                  {mode === "lock"
            ? <PdfT>{"Your PDF is password-protected"}</PdfT> : <PdfT>{"Your PDF is unlocked"}</PdfT>}
                </p>

                <p className="text-[11px] text-gray-400 mt-1">
                  {formatBytes(result.size)}
                </p>
              </div>

              <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1D4ED8] transition-all">
                <Download size={14}/>

                {mode === "lock"
            ? <PdfT>{"Download locked PDF"}</PdfT> : <PdfT>{"Download unlocked PDF"}</PdfT>}
              </button>
            </div>) : (<div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-20">
              <div className="w-10 h-10 bg-[#EFF6FF] text-[#4F46E5] rounded-xl flex items-center justify-center mb-3 border border-[#DBEAFE]">
                <KeyRound size={20}/>
              </div>

              <p className="text-xs font-bold text-[#0F172A]">
                {selectedFile
            ? <PdfT>{"Enter a password to continue"}</PdfT> : <PdfT>{"Add files to get started"}</PdfT>}
              </p>

              <p className="text-[11px] text-gray-400 mt-1"><PdfT>{"Your result will appear here after you run the tool.\n              "}</PdfT></p>
            </div>)}

          <div />
        </div>
      </div>

      {/* Bottom Action Controls Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className={`w-2 h-2 rounded-full shrink-0 ${errorMessage
            ? "bg-[#2563EB]"
            : result
                ? "bg-emerald-500"
                : isProcessing
                    ? "bg-[#2563EB] animate-pulse"
                    : "bg-gray-400"}`}/>

          <span>
            {errorMessage
        ? <PdfT>{`${mode === "lock" ? "Locking" : "Unlocking"} failed — try again`}</PdfT> : result
        ? <PdfT>{`Done: ${formatBytes(result.size)} ready to download`}</PdfT>
        : isProcessing
            ? mode === "lock"
                ? <PdfT>{"Locking…"}</PdfT>
                : <PdfT>{"Unlocking…"}</PdfT>
            : selectedFile
                ? <PdfT>{`Ready to process: ${selectedFile.name}`}</PdfT>
                : <PdfT>{"Add an input to get started"}</PdfT>}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="px-4 py-2 border border-gray-200 text-[#0F172A] text-xs font-bold rounded-xl hover:bg-gray-50 transition-all"><PdfT>{"Reset\n          "}</PdfT></button>

          <button onClick={handleSubmit} disabled={!canSubmit} className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${canSubmit
            ? "bg-[#2563EB] text-white shadow-xs hover:bg-[#1D4ED8]"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
            {isProcessing ? (<Loader2 size={14} className="animate-spin"/>) : mode === "lock" ? (<Lock size={14}/>) : (<KeyRound size={14}/>)}

            <span>
              {isProcessing
            ? mode === "lock"
                ? <PdfT>{"Locking…"}</PdfT>
                : <PdfT>{"Unlocking…"}</PdfT>
            : mode === "lock"
                ? <PdfT>{"Lock PDF"}</PdfT>
                : <PdfT>{"Unlock PDF"}</PdfT>}
            </span>
          </button>
        </div>
      </div>

      {/* Browser Security Processing Notice */}
      <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
        <Lock size={15} className="text-emerald-600 shrink-0"/>

        <span><PdfT>{"Your files are processed in the browser \u2014 they are not uploaded to any\n          server.\n        "}</PdfT></span>
      </div>

      {/* How to use Accordion */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <button onClick={() => setShowHowToUse(!showHowToUse)} className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-[#0F172A] hover:bg-[#F8FAFC]/70 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-[#2563EB] font-bold"><PdfT>{"?"}</PdfT></span>

            <span><PdfT>{"How to use"}</PdfT></span>
          </div>

          {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>

        {showHowToUse && (<div className="px-5 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3"><PdfT>{"Upload your PDF, choose Lock to add a password or Unlock to remove\n            one, enter the password, then run the tool to download the result.\n          "}</PdfT></div>)}
      </div>

      {/* Same Category Tools */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#0F172A]"><PdfT>{"Tools in the same category\n        "}</PdfT></h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/sohoj-tools/compress-pdf" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-[#BFDBFE] transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#EFF6FF] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
              <Minimize2 size={16}/>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors"><PdfT>{"Compress PDF\n              "}</PdfT></h4>

              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1"><PdfT>{"Shrink embedded photos and scans inside a PDF \u2014 text stays\n                sharp.\n              "}</PdfT></p>
            </div>
          </Link>

          <Link href="/sohoj-tools/merge-pdfs" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-[#BFDBFE] transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#EFF6FF] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
              <Combine size={16}/>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors"><PdfT>{"Merge PDFs\n              "}</PdfT></h4>

              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1"><PdfT>{"Combine multiple PDF files into one document in your chosen\n                order.\n              "}</PdfT></p>
            </div>
          </Link>
        </div>
      </div>
    </div>);
}
