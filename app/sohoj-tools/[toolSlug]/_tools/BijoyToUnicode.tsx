"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Share,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Languages,
  ArrowLeftRight,
  RotateCcw,
  ShieldCheck,
  Keyboard,
  FileSpreadsheet,
  ScanText,
} from "lucide-react";

// Tools in same category data
const relatedTools = [
  {
    title: "Banglish Typing",
    description:
      "Type Bangla with an English keyboard — live Banglish to Bangla and Bangla to Banglish conversion in your browser.",
    href: "/sohoj-tools/banglish-typing",
    icon: Keyboard,
  },
  {
    title: "Number to Words",
    description:
      "Convert any number into English and Bengali words instantly in your browser.",
    href: "/sohoj-tools/number-to-words",
    icon: FileSpreadsheet,
  },
  {
    title: "Image to Text",
    description:
      "Extract text from images with OCR in your browser — supports English and Bengali.",
    href: "/sohoj-tools/image-to-text",
    icon: ScanText,
  },
];

export default function BijoyToUnicode() {
  const router = useRouter();

  // States
  const [direction, setDirection] = useState<
    "bijoyToUnicode" | "unicodeToBijoy"
  >("bijoyToUnicode");
  const [inputText, setInputText] = useState("");
  const [convertedText, setConvertedText] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  // Conversion Handler
  const handleConversion = (text: string) => {
    setInputText(text);

    if (!text.trim()) {
      setConvertedText("");
      return;
    }

    // Processing input text
    setConvertedText(text);
  };

  const handleReset = () => {
    setInputText("");
    setConvertedText("");
  };

  const handleCopy = () => {
    if (!convertedText) return;
    navigator.clipboard.writeText(convertedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full text-gray-800 font-sans pb-16">
      <div className="w-full space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* Breadcrumb with Back Button */}
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-gray-200/60 rounded-md transition-colors text-gray-700 flex items-center justify-center -ml-1"
                title="Go back"
              >
                <ArrowLeft size={16} />
              </button>
              <Link href="/sohoj-tools" className="hover:text-gray-700">
                Sohoj Tools
              </Link>
              <span>/</span>
              <span className="hover:text-gray-700 cursor-pointer">
                Text Tools
              </span>
              <span>/</span>
              <span className="text-gray-900 font-semibold">
                Bijoy ↔ Unicode
              </span>
            </div>

            {/* Title & Badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Languages size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Bijoy ↔ Unicode
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Convert Bangla text between Bijoy ANSI and Unicode directly in
              your browser.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-amber-500 hover:border-amber-300 transition-all shadow-2xs"
            >
              <Star
                size={16}
                className={isFavorite ? "fill-amber-400 text-amber-400" : ""}
              />
            </button>
            <button className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 transition-all shadow-2xs">
              <Share size={16} />
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: INPUT CONTROLS */}
          <div className="lg:col-span-4 space-y-4">
            {/* Conversion Direction Card */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-gray-900 tracking-wide uppercase block">
                Conversion input
              </span>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-gray-500 block">
                  Conversion direction
                </span>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setDirection("bijoyToUnicode");
                      handleConversion(inputText);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      direction === "bijoyToUnicode"
                        ? "border-sky-500 bg-sky-50/50 text-sky-600 ring-1 ring-sky-500"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ArrowLeftRight size={14} />
                    <span>Bijoy to Unicode</span>
                  </button>

                  <button
                    onClick={() => {
                      setDirection("unicodeToBijoy");
                      handleConversion(inputText);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      direction === "unicodeToBijoy"
                        ? "border-sky-500 bg-sky-50/50 text-sky-600 ring-1 ring-sky-500"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ArrowLeftRight size={14} />
                    <span>Unicode to Bijoy</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Input Text Box */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-900 tracking-wide uppercase">
                  {direction === "bijoyToUnicode" ? "Bijoy (ANSI)" : "Unicode"}
                </span>
              </div>

              <textarea
                rows={9}
                placeholder={
                  direction === "bijoyToUnicode"
                    ? "Paste Bijoy font text here..."
                    : "Paste Unicode Bangla text here..."
                }
                value={inputText}
                onChange={(e) => handleConversion(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 placeholder:text-gray-400 leading-relaxed resize-none"
              />

              <div className="text-right">
                <span className="text-[10px] font-medium text-gray-400">
                  {inputText.length} characters
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CONVERTED TEXT OUTPUT */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Converted text
                  </span>
                  {convertedText ? (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Ready
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                      Empty
                    </span>
                  )}
                </div>

                {/* Output Display Area */}
                <div className="pt-4">
                  {!convertedText ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center mb-3">
                        <Languages size={24} />
                      </div>
                      <h3 className="text-xs font-bold text-gray-900 mb-1">
                        Paste text to get started
                      </h3>
                      <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                        Choose a direction, paste your text, then convert it in
                        the browser.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#FDFCFB] border border-gray-200/60 rounded-xl text-xs text-gray-800 leading-relaxed min-h-[220px] whitespace-pre-wrap break-words font-medium">
                      {convertedText}
                    </div>
                  )}
                </div>
              </div>

              {/* Copy Button */}
              {convertedText && (
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-2xs"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? "Copied!" : "Copy Converted Text"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>
              {inputText
                ? "Text ready to convert"
                : "Add an input to get started"}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleReset}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>

            <button
              onClick={() => handleConversion(inputText)}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>
                Convert to{" "}
                {direction === "bijoyToUnicode" ? "Unicode" : "Bijoy"}
              </span>
            </button>
          </div>
        </div>

        {/* PRIVACY NOTICE */}
        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>
            Your files are processed in the browser — they are not uploaded to
            any server.
          </span>
        </div>

        {/* HOW TO USE DROPDOWN */}
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <button
            onClick={() => setShowHowToUse(!showHowToUse)}
            className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-gray-900 hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              <span>How to use</span>
            </div>
            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse && (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>
                1. Select the conversion direction (Bijoy to Unicode or Unicode
                to Bijoy).
              </p>
              <p>2. Paste your input text into the text area on the left.</p>
              <p>
                3. The converted output will automatically generate on the right
                box.
              </p>
              <p>
                4. Click 'Copy Converted Text' to copy your result instantly.
              </p>
            </div>
          )}
        </div>

        {/* TOOLS IN THE SAME CATEGORY */}
        <div className="pt-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Tools in the same category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool, idx) => {
              const ToolIcon = tool.icon;
              return (
                <Link
                  key={idx}
                  href={tool.href}
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-sky-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-sky-600 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
