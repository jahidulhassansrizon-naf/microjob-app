"use client";

import React, { useState } from "react";
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

      setErrorMessage(
        err instanceof Error
          ? err.message
          : `Something went wrong while ${
              mode === "lock" ? "locking" : "unlocking"
            } this PDF.`,
      );
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
    <div className="w-full space-y-5 text-gray-800 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link
          href="/sohoj-tools"
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />

          <span>Back to Tools</span>
        </Link>

        <span>/</span>

        <span>PDF Tools</span>

        <span>/</span>

        <span className="font-semibold text-gray-900">Lock / Unlock PDF</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
            <Lock size={24} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">
                Lock / Unlock PDF
              </h1>

              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>

            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Add a password to protect your PDF or remove an existing password.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
            <Star size={16} />
          </button>

          <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
            <Share2 size={16} />
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
                <h2 className="text-xs font-bold text-gray-900">
                  Files ({selectedFile ? 1 : 0})
                </h2>

                <label className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-red-100">
                  <Plus size={12} />

                  <span>Add</span>

                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {!selectedFile ? (
                <label className="border-2 border-dashed border-red-200 bg-red-50/30 hover:bg-red-50/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group min-h-[220px]">
                  <div className="w-10 h-10 bg-red-100/80 text-red-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Upload size={20} />
                  </div>

                  <span className="text-xs font-bold text-gray-800">
                    Drop a PDF here or click to upload
                  </span>

                  <span className="text-[10px] text-gray-400 font-medium mt-1">
                    1 PDF file, max 500 MB
                  </span>

                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 bg-red-100 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>

                    <div className="truncate">
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {selectedFile.name}
                      </p>

                      <p className="text-[10px] text-gray-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Password Settings Card */}
          {selectedFile && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-gray-900">
                Password settings
              </h2>

              {/* Toggle Tabs */}
              <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1">
                <button
                  onClick={() => handleModeChange("lock")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mode === "lock"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Lock size={12} />
                  Lock
                </button>

                <button
                  onClick={() => handleModeChange("unlock")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mode === "unlock"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <KeyRound size={12} />
                  Unlock
                </button>
              </div>

              {mode === "lock" ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 block">
                      New password
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 4 characters"
                        className="w-full bg-white border border-gray-200 rounded-xl pl-3 pr-9 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                    <label className="text-[11px] font-bold text-gray-600 block">
                      Confirm password
                    </label>

                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 ${
                        passwordsMismatch
                          ? "border-red-300 focus:ring-red-500/20"
                          : "border-gray-200 focus:ring-red-500/20"
                      }`}
                    />

                    {passwordsMismatch && (
                      <p className="text-[10px] text-red-500 font-medium">
                        Passwords don't match.
                      </p>
                    )}
                  </div>

                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    This password will be required to open the PDF. Anyone
                    without it won't be able to view the document.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 block">
                    Current password
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={unlockPassword}
                      onChange={(e) => setUnlockPassword(e.target.value)}
                      placeholder="Enter the PDF's password"
                      className="w-full bg-white border border-gray-200 rounded-xl pl-3 pr-9 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  <p className="text-[10px] text-gray-400 leading-relaxed pt-1">
                    We'll use this to remove the password and produce an
                    open-access copy of your PDF.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Lock Preview Box */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-700">Preview</h2>

            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                errorMessage
                  ? "bg-red-100 text-red-600"
                  : result
                    ? "bg-emerald-100 text-emerald-700"
                    : isProcessing
                      ? "bg-amber-100 text-amber-700"
                      : selectedFile
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-500"
              }`}
            >
              {errorMessage
                ? "Error"
                : result
                  ? "Done"
                  : isProcessing
                    ? mode === "lock"
                      ? "Locking"
                      : "Unlocking"
                    : selectedFile
                      ? "Ready"
                      : "Empty"}
            </span>
          </div>

          {isProcessing ? (
            <div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-20">
              <Loader2 size={28} className="text-red-400 animate-spin mb-3" />

              <p className="text-xs font-bold text-gray-800">
                {mode === "lock"
                  ? "Encrypting your PDF…"
                  : "Decrypting your PDF…"}
              </p>

              <p className="text-[11px] text-gray-400 mt-1">
                Everything runs in your browser — larger files take a little
                longer.
              </p>
            </div>
          ) : errorMessage ? (
            <div className="bg-red-50/60 rounded-2xl border border-dashed border-red-200 p-8 flex flex-col items-center justify-center my-auto text-center py-20">
              <div className="w-10 h-10 bg-red-100 text-red-500 rounded-xl flex items-center justify-center mb-3 border border-red-200">
                <AlertCircle size={20} />
              </div>

              <p className="text-xs font-bold text-red-700">
                {mode === "lock" ? "Locking failed" : "Unlocking failed"}
              </p>

              <p className="text-[11px] text-red-500 mt-1 max-w-xs">
                {errorMessage}
              </p>
            </div>
          ) : result ? (
            <div className="my-auto py-8 flex flex-col items-center gap-5">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-100">
                <CheckCircle2 size={24} />
              </div>

              <div className="text-center">
                <p className="text-xs font-bold text-gray-800">
                  {mode === "lock"
                    ? "Your PDF is password-protected"
                    : "Your PDF is unlocked"}
                </p>

                <p className="text-[11px] text-gray-400 mt-1">
                  {formatBytes(result.size)}
                </p>
              </div>

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-red-600 transition-all"
              >
                <Download size={14} />

                {mode === "lock"
                  ? "Download locked PDF"
                  : "Download unlocked PDF"}
              </button>
            </div>
          ) : (
            <div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-20">
              <div className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center mb-3 border border-red-100">
                <KeyRound size={20} />
              </div>

              <p className="text-xs font-bold text-gray-800">
                {selectedFile
                  ? "Enter a password to continue"
                  : "Add files to get started"}
              </p>

              <p className="text-[11px] text-gray-400 mt-1">
                Your result will appear here after you run the tool.
              </p>
            </div>
          )}

          <div />
        </div>
      </div>

      {/* Bottom Action Controls Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              errorMessage
                ? "bg-red-500"
                : result
                  ? "bg-emerald-500"
                  : isProcessing
                    ? "bg-amber-400 animate-pulse"
                    : "bg-gray-400"
            }`}
          />

          <span>
            {errorMessage
              ? `${
                  mode === "lock" ? "Locking" : "Unlocking"
                } failed — try again`
              : result
                ? `Done: ${formatBytes(result.size)} ready to download`
                : isProcessing
                  ? mode === "lock"
                    ? "Locking…"
                    : "Unlocking…"
                  : selectedFile
                    ? `Ready to process: ${selectedFile.name}`
                    : "Add an input to get started"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all"
          >
            Reset
          </button>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              canSubmit
                ? "bg-red-500 text-white shadow-xs hover:bg-red-600"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
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
              {isProcessing
                ? mode === "lock"
                  ? "Locking…"
                  : "Unlocking…"
                : mode === "lock"
                  ? "Lock PDF"
                  : "Unlock PDF"}
            </span>
          </button>
        </div>
      </div>

      {/* Browser Security Processing Notice */}
      <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
        <Lock size={15} className="text-emerald-600 shrink-0" />

        <span>
          Your files are processed in the browser — they are not uploaded to any
          server.
        </span>
      </div>

      {/* How to use Accordion */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowHowToUse(!showHowToUse)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-gray-800 hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-orange-500 font-bold">?</span>

            <span>How to use</span>
          </div>

          {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showHowToUse && (
          <div className="px-5 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
            Upload your PDF, choose Lock to add a password or Unlock to remove
            one, enter the password, then run the tool to download the result.
          </div>
        )}
      </div>

      {/* Same Category Tools */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-gray-900">
          Tools in the same category
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/sohoj-tools/compress-pdf"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-red-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
              <Minimize2 size={16} />
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-red-500 transition-colors">
                Compress PDF
              </h4>

              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                Shrink embedded photos and scans inside a PDF — text stays
                sharp.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/merge-pdfs"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-red-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
              <Combine size={16} />
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-red-500 transition-colors">
                Merge PDFs
              </h4>

              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                Combine multiple PDF files into one document in your chosen
                order.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
