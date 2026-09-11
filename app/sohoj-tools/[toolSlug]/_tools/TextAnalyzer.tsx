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
  FileText,
  RotateCcw,
  ShieldCheck,
  Languages,
  Keyboard,
  Hash,
} from "lucide-react";

// Related tools in the same category
const relatedTools = [
  {
    title: "Bijoy ↔ Unicode",
    description:
      "Convert Bangla text between Bijoy ANSI and Unicode directly in your browser.",
    href: "/sohoj-tools/bijoy-unicode",
    icon: Languages,
  },
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
    icon: Hash,
  },
];

export default function TextAnalyzer() {
  const router = useRouter();

  // States
  const [text, setText] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  // Calculations
  const characters = text.length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const sentences =
    text.trim() === "" ? 0 : text.split(/[.!?]+/).filter(Boolean).length;
  const paragraphs =
    text.trim() === "" ? 0 : text.split(/\n+/).filter(Boolean).length;
  const readingTime = Math.ceil(words / 200); // Average reading speed 200 words/min

  // Word frequency calculation
  const getWordFrequency = () => {
    if (!text.trim()) return [];
    const cleanWords = text
      .toLowerCase()
      .replace(/[^\w\sа-яёәғқңөұүh–]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2); // Filter out tiny words

    const freq: Record<string, number> = {};
    cleanWords.forEach((w) => {
      freq[w] = (freq[w] || 0) + 1;
    });

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  };

  const wordFreqs = getWordFrequency();

  // Transform actions
  const handleTransform = (type: string) => {
    if (!text) return;
    let newText = text;
    if (type === "lower") newText = text.toLowerCase();
    else if (type === "upper") newText = text.toUpperCase();
    else if (type === "capitalize") {
      newText = text
        .toLowerCase()
        .replace(/(^\w{1}|\.\s*\w{1})/g, (match) => match.toUpperCase());
    } else if (type === "sentence") {
      newText = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    } else if (type === "spaces") {
      newText = text.replace(/\s+/g, " ").trim();
    } else if (type === "duplicates") {
      const lines = text.split("\n");
      newText = Array.from(new Set(lines)).join("\n");
    } else if (type === "empty") {
      newText = text
        .split("\n")
        .filter((line) => line.trim() !== "")
        .join("\n");
    }
    setText(newText);
  };

  const handleCopyText = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setText("");
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
              <span className="text-gray-900 font-semibold">Text Analyzer</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-sky-100 text-sky-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <FileText size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Text Analyzer
              </h1>
              <span className="bg-sky-100 text-sky-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Count words, characters, sentences, and reading time — plus quick
              text transforms in your browser.
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
          {/* LEFT COLUMN: INPUT & TRANSFORMS */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 tracking-wide uppercase">
                  Analyze text
                </span>
                {text && (
                  <button
                    onClick={handleReset}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <RotateCcw size={12} />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-700 block">
                  Your text
                </span>
                <div className="relative">
                  <textarea
                    rows={8}
                    placeholder="Type or paste your text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 placeholder:text-gray-400 resize-y"
                  />
                  <div className="absolute bottom-2.5 right-3 text-[10px] text-gray-400 font-medium bg-white/80 px-1">
                    {characters} characters
                  </div>
                </div>
              </div>
            </div>

            {/* Transform Box */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-gray-900 tracking-wide uppercase block">
                Transform
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleTransform("lower")}
                  className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 rounded-lg text-[11px] font-medium transition-colors"
                >
                  lowercase
                </button>
                <button
                  onClick={() => handleTransform("upper")}
                  className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 rounded-lg text-[11px] font-medium transition-colors"
                >
                  UPPERCASE
                </button>
                <button
                  onClick={() => handleTransform("capitalize")}
                  className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 rounded-lg text-[11px] font-medium transition-colors"
                >
                  Capitalize Words
                </button>
                <button
                  onClick={() => handleTransform("sentence")}
                  className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 rounded-lg text-[11px] font-medium transition-colors"
                >
                  Sentence case
                </button>
                <button
                  onClick={() => handleTransform("spaces")}
                  className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 rounded-lg text-[11px] font-medium transition-colors"
                >
                  Remove Extra Spaces
                </button>
                <button
                  onClick={() => handleTransform("duplicates")}
                  className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 rounded-lg text-[11px] font-medium transition-colors"
                >
                  Remove Duplicate Lines
                </button>
                <button
                  onClick={() => handleTransform("empty")}
                  className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 rounded-lg text-[11px] font-medium transition-colors"
                >
                  Remove Empty Lines
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: METRICS & FREQUENCY */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[440px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Word frequency & Statistics
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${text ? "text-sky-600 bg-sky-50" : "text-gray-400 bg-gray-100"}`}
                  >
                    {text ? "Analyzed" : "Empty"}
                  </span>
                </div>

                <div className="pt-4">
                  {!text ? (
                    <div className="flex flex-col items-center justify-center py-28 text-center">
                      <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-3">
                        <FileText size={24} />
                      </div>
                      <h3 className="text-xs font-bold text-gray-900 mb-1">
                        Paste text to analyze
                      </h3>
                      <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                        Word counts, reading time, and top words will appear as
                        you type.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Top Metric Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="bg-gray-50/70 border border-gray-200/60 rounded-xl p-3 text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Words
                          </p>
                          <p className="text-base font-bold text-gray-900">
                            {words}
                          </p>
                        </div>
                        <div className="bg-gray-50/70 border border-gray-200/60 rounded-xl p-3 text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Characters
                          </p>
                          <p className="text-base font-bold text-gray-900">
                            {characters}
                          </p>
                        </div>
                        <div className="bg-gray-50/70 border border-gray-200/60 rounded-xl p-3 text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Sentences
                          </p>
                          <p className="text-base font-bold text-gray-900">
                            {sentences}
                          </p>
                        </div>
                        <div className="bg-gray-50/70 border border-gray-200/60 rounded-xl p-3 text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Paragraphs
                          </p>
                          <p className="text-base font-bold text-gray-900">
                            {paragraphs}
                          </p>
                        </div>
                        <div className="bg-gray-50/70 border border-gray-200/60 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Read Time
                          </p>
                          <p className="text-base font-bold text-gray-900">
                            {readingTime} min
                          </p>
                        </div>
                      </div>

                      {/* Word Frequency List */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                            Top Word Frequency
                          </span>
                          <button
                            onClick={handleCopyText}
                            className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-sky-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copied ? "Copied Text!" : "Copy Text"}</span>
                          </button>
                        </div>

                        {wordFreqs.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">
                            Type more words to see frequency stats.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {wordFreqs.map(([word, count], idx) => (
                              <div
                                key={idx}
                                className="bg-gray-50/50 border border-gray-200/60 rounded-xl p-2.5 flex items-center justify-between"
                              >
                                <span className="text-xs font-semibold text-gray-800 truncate pr-2">
                                  {word}
                                </span>
                                <span className="text-[11px] font-bold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-md shrink-0">
                                  {count}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRIVACY NOTICE */}
        <div className="bg-sky-50/60 border border-sky-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-sky-800 font-medium">
          <ShieldCheck size={16} className="text-sky-600 shrink-0" />
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
              <p>1. Type or paste your text into the input box on the left.</p>
              <p>
                2. View instant word counts, character limits, sentence
                breakdowns, and estimated reading time.
              </p>
              <p>
                3. Use the transform buttons to quickly convert text case or
                remove duplicate/empty lines.
              </p>
              <p>
                4. Check the top word frequency list to analyze keyword density.
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
