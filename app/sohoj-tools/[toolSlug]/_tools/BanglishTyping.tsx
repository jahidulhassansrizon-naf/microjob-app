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
  Keyboard,
  ArrowLeftRight,
  RotateCcw,
  ShieldCheck,
  Languages,
  FileSpreadsheet,
  ScanText,
} from "lucide-react";

// Quick reference mapping data for Banglish typing helper
const quickReferences = [
  { en: "ksh", bn: "ক্ষ" },
  { en: "GY / gy", bn: "জ্ঞ" },
  { en: "tr", bn: "ত্র" },
  { en: "dr", bn: "দ্র" },
  { en: "pr", bn: "প্র" },
  { en: "br", bn: "ব্র" },
  { en: "gr", bn: "গ্র" },
  { en: "kr", bn: "ক্র" },
  { en: "shr", bn: "শ্র" },
  { en: "str", bn: "স্ট্র" },
  { en: "st", bn: "স্ট" },
  { en: "sht / ShT", bn: "ষ্ট" },
  { en: "rd", bn: "র্ড" },
  { en: "sp", bn: "স্প" },
  { en: "sk", bn: "স্ক" },
  { en: "sn", bn: "স্ন" },
  { en: "nd", bn: "ন্দ" },
  { en: "nb", bn: "ম্ব" },
  { en: "nj", bn: "ঞ্জ" },
  { en: "nk", bn: "ঙ্ক" },
  { en: "tt", bn: "ত্ত" },
  { en: "nn", bn: "ন্ন" },
  { en: "ll", bn: "ল্ল" },
  { en: "mm", bn: "ম্ম" },
  { en: "k", bn: "ক" },
  { en: "kh", bn: "খ" },
  { en: "g", bn: "গ" },
  { en: "gh", bn: "ঘ" },
  { en: "ch", bn: "চ" },
  { en: "chh", bn: "ছ" },
  { en: "j", bn: "জ" },
  { en: "jh", bn: "ঝ" },
  { en: "T", bn: "ট" },
  { en: "Th", bn: "ঠ" },
  { en: "D", bn: "ড" },
  { en: "Dh", bn: "ঢ" },
  { en: "t", bn: "ত" },
  { en: "th", bn: "থ" },
  { en: "d", bn: "দ" },
  { en: "dh", bn: "ধ" },
  { en: "n", bn: "ন" },
  { en: "N", bn: "ণ" },
  { en: "p", bn: "প" },
  { en: "ph/f", bn: "ফ" },
  { en: "b", bn: "ব" },
  { en: "bh/v", bn: "ভ" },
  { en: "m", bn: "ম" },
  { en: "r", bn: "র" },
  { en: "rr", bn: "ড়" },
  { en: "l", bn: "ল" },
  { en: "sh/S", bn: "শ" },
  { en: "Sh", bn: "ষ" },
  { en: "s", bn: "স" },
  { en: "h", bn: "হ" },
  { en: "y", bn: "য়" },
  { en: "z", bn: "য" },
  { en: "ng", bn: "ঙ" },
  { en: "a", bn: "আ" },
  { en: "i", bn: "ই" },
  { en: "u", bn: "উ" },
  { en: "e", bn: "এ" },
  { en: "o", bn: "ও" },
  { en: "O", bn: "ও" },
  { en: "oi", bn: "ঐ" },
  { en: "ou", bn: "ঔ" },
];

// Tools in the same category data
const relatedTools = [
  {
    title: "Bijoy ↔ Unicode",
    description:
      "Convert Bangla text between Bijoy ANSI and Unicode directly in your browser.",
    href: "/sohoj-tools/bijoy-unicode",
    icon: Languages,
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

export default function BanglishTyping() {
  const router = useRouter();

  // States
  const [mode, setMode] = useState<"banglishToBangla" | "banglaToBanglish">(
    "banglishToBangla",
  );
  const [inputText, setInputText] = useState("");
  const [convertedText, setConvertedText] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  // Typing conversion placeholder logic
  const handleConversion = (text: string) => {
    setInputText(text);
    if (!text.trim()) {
      setConvertedText("");
      return;
    }
    // Live conversion simulation
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
                Banglish Typing
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-lime-100 text-lime-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Keyboard size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Banglish Typing
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Type Bangla with an English keyboard — live Banglish to Bangla and
              Bangla to Banglish conversion in your browser.
            </p>
          </div>

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
          {/* LEFT COLUMN: CONTROLS & INPUT */}
          <div className="lg:col-span-4 space-y-4">
            {/* Conversion Mode Card */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-gray-900 tracking-wide uppercase block">
                Type here
              </span>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-gray-500 block">
                  Conversion mode
                </span>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setMode("banglishToBangla");
                      handleConversion(inputText);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      mode === "banglishToBangla"
                        ? "border-sky-500 bg-sky-50/50 text-sky-600 ring-1 ring-sky-500"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ArrowLeftRight size={14} />
                    <span>Banglish to Bangla</span>
                  </button>

                  <button
                    onClick={() => {
                      setMode("banglaToBanglish");
                      handleConversion(inputText);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      mode === "banglaToBanglish"
                        ? "border-sky-500 bg-sky-50/50 text-sky-600 ring-1 ring-sky-500"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ArrowLeftRight size={14} />
                    <span>Bangla to Banglish</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Input Text Box */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-900 tracking-wide uppercase">
                  Banglish — type here
                </span>
              </div>

              <textarea
                rows={9}
                placeholder="ekhane likhun..."
                value={inputText}
                onChange={(e) => handleConversion(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 placeholder:text-gray-400 leading-relaxed resize-none"
              />

              <div className="text-right">
                <span className="text-[10px] font-medium text-gray-400">
                  {inputText.length} chars •{" "}
                  {inputText.trim() ? inputText.trim().split(/\s+/).length : 0}{" "}
                  words
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: OUTPUT DISPLAY */}
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

                <div className="pt-4">
                  {!convertedText ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center mb-3">
                        <Keyboard size={24} />
                      </div>
                      <h3 className="text-xs font-bold text-gray-900 mb-1">
                        Start typing to convert
                      </h3>
                      <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                        Choose a mode, type in the left panel, and the converted
                        text appears instantly.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#FDFCFB] border border-gray-200/60 rounded-xl text-xs text-gray-800 leading-relaxed min-h-[220px] whitespace-pre-wrap break-words font-medium">
                      {convertedText}
                    </div>
                  )}
                </div>
              </div>

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

        {/* QUICK REFERENCE SECTION */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold text-gray-900 tracking-wide uppercase">
            Quick reference
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {quickReferences.map((ref, idx) => (
              <div
                key={idx}
                className="bg-[#F8F7F5] border border-gray-200/60 rounded-xl p-2 flex items-center justify-between text-[11px]"
              >
                <span className="text-amber-800 font-semibold truncate pr-1">
                  {ref.en}
                </span>
                <span className="text-gray-800 font-bold">{ref.bn}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 pt-1">
            This tool supports pure Banglish. Examples: sonar &rarr; সোনার, amil
            valo achi &rarr; আমি ভালো আছি. Common words like onek and ekhon work
            directly.
          </p>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>
              {inputText
                ? "Text ready to convert"
                : "Start typing in the box above"}
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
              <span>Convert text</span>
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
                1. Select the conversion mode (Banglish to Bangla or Bangla to
                Banglish).
              </p>
              <p>
                2. Type phonetically in the input text area using your English
                keyboard.
              </p>
              <p>
                3. Review the live converted Bangla or Banglish output on the
                right.
              </p>
              <p>
                4. Use the Quick Reference grid below for specific conjunct
                letters.
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
