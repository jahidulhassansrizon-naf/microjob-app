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
  Hash,
  RotateCcw,
  ShieldCheck,
  Languages,
  Keyboard,
  ScanText,
} from "lucide-react";

// Helper function to convert number to English words
function numberToEnglishWords(numStr: string): string {
  const num = parseInt(numStr, 10);
  if (isNaN(num)) return "";
  if (num === 0) return "Zero";

  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function getLessThanOneThousand(n: number): string {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    return (
      a[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 !== 0 ? " " + getLessThanOneThousand(n % 100) : "")
    );
  }

  let n = num;
  let str = "";

  if (Math.floor(n / 10000000) > 0) {
    str += getLessThanOneThousand(Math.floor(n / 10000000)) + " Crore ";
    n %= 10000000;
  }
  if (Math.floor(n / 100000) > 0) {
    str += getLessThanOneThousand(Math.floor(n / 100000)) + " Lakh ";
    n %= 100000;
  }
  if (Math.floor(n / 1000) > 0) {
    str += getLessThanOneThousand(Math.floor(n / 1000)) + " Thousand ";
    n %= 1000;
  }
  if (n > 0) {
    str += getLessThanOneThousand(n);
  }

  return str.trim();
}

// Helper function to convert number to Bengali words
function numberToBengaliWords(numStr: string): string {
  const num = parseInt(numStr, 10);
  if (isNaN(num)) return "";
  if (num === 0) return "শূন্য";

  const digits = [
    "",
    "এক",
    "দুই",
    "তিন",
    "চার",
    "পাঁচ",
    "ছয়",
    "সাত",
    "আট",
    "নয়",
    "দশ",
    "এগারো",
    "বারো",
    "তেরো",
    "চৌদ্দ",
    "পনেরো",
    "ষোল",
    "সতেরো",
    "আঠারো",
    "উনিশ",
    "বিশ",
    "একুশ",
    "বাইশ",
    "তেইশ",
    "চৌবিশ",
    "পঁচিশ",
    "ছাব্বিশ",
    "সাতাশ",
    "আটাশ",
    "উনত্রিশ",
    "ত্রিশ",
    "একত্রিশ",
    "বত্রিশ",
    "তেত্রিশ",
    "চৌত্রিশ",
    "পঁয়ত্রিশ",
    "ছত্রিশ",
    "সাঁত্রিশ",
    "আটত্রিশ",
    "উনচল্লিশ",
    "চল্লিশ",
    "একচল্লিশ",
    "বিচল্লিশ",
    "তেচল্লিশ",
    "চৌচল্লিশ",
    "পঁয়চল্লিশ",
    "ছেচল্লিশ",
    "সাতচল্লিশ",
    "আটচল্লিশ",
    "উনপঞ্চাশ",
    "পঞ্চাশ",
    "একপঞ্চাশ",
    "বাহান্ন",
    "তিপ্পান্ন",
    "চুয়ান্ন",
    "পঁচপঞ্চাশ",
    "ছাপ্পান্ন",
    "সাতপঞ্চাশ",
    "আটপঞ্চাশ",
    "উনষাট",
    "ষাট",
    "একষাট",
    "বাষট্টি",
    "তেষট্টি",
    "চৌষট্টি",
    "পঁয়ষট্টি",
    "ছেষট্টি",
    "সাতষাট",
    "আটষাট",
    "উনসত্তর",
    "সত্তর",
    "একসত্তর",
    "বাহাত্তর",
    "তিয়াত্তর",
    "চুয়াত্তর",
    "পঁচাত্তর",
    "ছিয়াত্তর",
    "সাতাত্তর",
    "আটাত্তর",
    "উনআশি",
    "আশি",
    "একআশি",
    "বিরাশি",
    "তিরাশি",
    "চুরাশি",
    "পঁচাশি",
    "ছিয়াশি",
    "সাতাশি",
    "আটাশি",
    "উননব্বই",
    "নব্বই",
    "একনব্বই",
    "বিরানব্বই",
    "তিরানব্বই",
    "চুরানব্বই",
    "পঁচানব্বই",
    "ছিয়ানব্বই",
    "সাতানব্বই",
    "আটানব্বই",
    "নিরানব্বই",
  ];

  function getBnpLessThanOneHundred(n: number): string {
    if (n < 100) return digits[n];
    return "";
  }

  function getBnpLessThanOneThousand(n: number): string {
    if (n === 0) return "";
    if (n < 100) return getBnpLessThanOneHundred(n);
    const hundredPart = Math.floor(n / 100);
    const rest = n % 100;
    return (
      digits[hundredPart] +
      " শত" +
      (rest !== 0 ? " " + getBnpLessThanOneHundred(rest) : "")
    );
  }

  let n = num;
  let str = "";

  if (Math.floor(n / 10000000) > 0) {
    str += getBnpLessThanOneThousand(Math.floor(n / 10000000)) + " কোটি ";
    n %= 10000000;
  }
  if (Math.floor(n / 100000) > 0) {
    str += getBnpLessThanOneThousand(Math.floor(n / 100000)) + " লাখ ";
    n %= 100000;
  }
  if (Math.floor(n / 1000) > 0) {
    str += getBnpLessThanOneThousand(Math.floor(n / 1000)) + " হাজার ";
    n %= 1000;
  }
  if (n > 0) {
    str += getBnpLessThanOneThousand(n);
  }

  return str.trim();
}

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
    title: "Banglish Typing",
    description:
      "Type Bangla with an English keyboard — live Banglish to Bangla and Bangla to Banglish conversion in your browser.",
    href: "/sohoj-tools/banglish-typing",
    icon: Keyboard,
  },
  {
    title: "Image to Text",
    description:
      "Extract text from images with OCR in your browser — supports English and Bengali.",
    href: "/sohoj-tools/image-to-text",
    icon: ScanText,
  },
];

export default function NumberToWords() {
  const router = useRouter();

  // States
  const [inputNumber, setInputNumber] = useState("");
  const [englishResult, setEnglishResult] = useState("");
  const [bengaliResult, setBengaliResult] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedEn, setCopiedEn] = useState(false);
  const [copiedBn, setCopiedBn] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  // Handle Input Change & Conversion
  const handleInputChange = (val: string) => {
    const normalizedVal = val.replace(/[০-৯]/g, (d) =>
      String("০১২৩৪৫৬৭৮৯".indexOf(d)),
    );
    setInputNumber(val);

    if (!val.trim() || isNaN(Number(normalizedVal))) {
      setEnglishResult("");
      setBengaliResult("");
      return;
    }

    setEnglishResult(numberToEnglishWords(normalizedVal));
    setBengaliResult(numberToBengaliWords(normalizedVal));
  };

  const handleReset = () => {
    setInputNumber("");
    setEnglishResult("");
    setBengaliResult("");
  };

  const handleCopyText = (text: string, type: "en" | "bn") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "en") {
      setCopiedEn(true);
      setTimeout(() => setCopiedEn(false), 2000);
    } else {
      setCopiedBn(true);
      setTimeout(() => setCopiedBn(false), 2000);
    }
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
                Number to Words
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Hash size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Number to Words
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Convert any number into English and Bengali words instantly in
              your browser.
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
          {/* LEFT COLUMN: NUMBER INPUT */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-gray-900 tracking-wide uppercase block">
                Number input
              </span>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-gray-500 block">
                  Enter a number
                </span>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Type Bengali (
                  <span className="font-semibold text-gray-600">০-৯</span>) or
                  English (
                  <span className="font-semibold text-gray-600">0-9</span>)
                  digits — both are supported.
                </p>

                <input
                  type="text"
                  placeholder="e.g. 150000 or ১৫০০০০"
                  value={inputNumber}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-400"
                />
              </div>

              {inputNumber && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleReset}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <RotateCcw size={12} />
                    <span>Clear input</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: WORDS OUTPUT */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Words output
                  </span>
                  {englishResult || bengaliResult ? (
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
                  {!englishResult && !bengaliResult ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                        <Hash size={24} />
                      </div>
                      <h3 className="text-xs font-bold text-gray-900 mb-1">
                        Type a number to convert
                      </h3>
                      <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                        English and Bengali words will appear here as you type.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* English Output Box */}
                      <div className="p-3 bg-[#FDFCFB] border border-gray-200/60 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                            English Words
                          </span>
                          <button
                            onClick={() => handleCopyText(englishResult, "en")}
                            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            {copiedEn ? (
                              <Check size={12} />
                            ) : (
                              <Copy size={12} />
                            )}
                            <span>{copiedEn ? "Copied!" : "Copy"}</span>
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                          {englishResult}
                        </p>
                      </div>

                      {/* Bengali Output Box */}
                      <div className="p-3 bg-[#FDFCFB] border border-gray-200/60 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                            Bengali Words (বাংলা কথায়)
                          </span>
                          <button
                            onClick={() => handleCopyText(bengaliResult, "bn")}
                            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            {copiedBn ? (
                              <Check size={12} />
                            ) : (
                              <Copy size={12} />
                            )}
                            <span>{copiedBn ? "Copied!" : "Copy"}</span>
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                          {bengaliResult}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>How to use</span>
            </div>
            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse && (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>
                1. Type or paste your number in the number input box on the
                left.
              </p>
              <p>
                2. You can use standard English digits (0-9) or Bengali digits
                (০-৯).
              </p>
              <p>
                3. View the converted English and Bengali words instantly on the
                right.
              </p>
              <p>
                4. Click the copy button next to either result to copy it to
                your clipboard.
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
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
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
