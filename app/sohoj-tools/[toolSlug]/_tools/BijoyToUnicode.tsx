"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Share, Copy, Check, ChevronDown, ChevronUp, Languages, ArrowLeftRight, RotateCcw, ShieldCheck, Keyboard, ScanText, } from "lucide-react";
// ---------------------------------------------------------------------------
// Bijoy ↔ Unicode converter
// ---------------------------------------------------------------------------
// The package's index.d.ts is not recognized by TypeScript as a valid module.
// Using require() here avoids the broken declaration-file import while keeping
// the same package and the same runtime conversion functions.
// ---------------------------------------------------------------------------
type BijoyConverterModule = {
    ConvertToUnicode: (type: string, text: string) => string;
    ConvertToASCII: (type: string, text: string) => string;
};
declare const require: (moduleName: string) => BijoyConverterModule;
const { ConvertToUnicode, ConvertToASCII, }: BijoyConverterModule = require("bijoy-to-unicode-bengali-conversion");
// Tools in same category data
const BIJOY_BN: Record<string, string> = {
    "Go back": "পেছনে যান",
    "Sohoj Tools": "সহজ টুলস",
    "/": "/",
    "Text Tools": "লেখার টুলস",
    "Bijoy ↔ Unicode": "বিজয় ↔ Unicode",
    "Bijoy": "বিজয়",
    "Convert to Unicode": "Unicode-এ রূপান্তর করুন",
    "Convert to Bijoy": "বিজয়ে রূপান্তর করুন",
    "Free": "বিনামূল্যে",
    "Convert Bangla text between Bijoy ANSI and Unicode directly in your browser.": "ব্রাউজারেই সরাসরি বিজয় ANSI ও Unicode-এর মধ্যে বাংলা লেখা রূপান্তর করুন।",
    "Add to favorites": "প্রিয় তালিকায় যোগ করুন",
    "Remove from favorites": "প্রিয় তালিকা থেকে সরান",
    "Share this tool": "এই টুলটি শেয়ার করুন",
    "Conversion input": "রূপান্তরের ইনপুট",
    "Conversion direction": "রূপান্তরের দিক",
    "Bijoy to Unicode": "বিজয় থেকে Unicode",
    "Unicode to Bijoy": "Unicode থেকে বিজয়",
    "Bijoy (ANSI)": "বিজয় (ANSI)",
    "Unicode": "Unicode",
    "Paste Bijoy font text here...": "এখানে বিজয় ফন্টের লেখা পেস্ট করুন...",
    "Paste Unicode Bangla text here...": "এখানে Unicode বাংলা লেখা পেস্ট করুন...",
    "characters": "টি অক্ষর",
    "Converted text": "রূপান্তরিত লেখা",
    "Ready ·": "প্রস্তুত · ",
    "Empty": "খালি",
    "Paste text to get started": "শুরু করতে লেখা পেস্ট করুন",
    "Choose a direction, paste your text, then convert it in the browser.": "প্রথমে রূপান্তরের দিক বেছে নিয়ে লেখা পেস্ট করুন। এরপর ব্রাউজারেই লেখাটি রূপান্তরিত হবে।",
    "Copied!": "কপি হয়েছে!",
    "Copy Converted Text": "রূপান্তরিত লেখা কপি করুন",
    "Converted": "রূপান্তর সম্পন্ন",
    "Text ready to convert": "লেখা রূপান্তরের জন্য প্রস্তুত",
    "Add an input to get started": "শুরু করতে লেখা যোগ করুন",
    "Reset": "সব মুছে ফেলুন",
    "Your files are processed in the browser — they are not uploaded to any server.": "আপনার লেখা ব্রাউজারেই প্রক্রিয়াকরণ করা হয়—এটি কোনো সার্ভারে আপলোড করা হয় না।",
    "How to use": "ব্যবহারের নিয়ম",
    "1. Select the conversion direction (Bijoy to Unicode or Unicode to Bijoy).": "১. রূপান্তরের দিক বেছে নিন (বিজয় থেকে Unicode অথবা Unicode থেকে বিজয়)।",
    "2. Paste your input text into the text area on the left.": "২. বাম পাশের লেখার ঘরে আপনার লেখা পেস্ট করুন।",
    "3. The converted output will automatically generate on the right box.": "৩. রূপান্তরিত লেখা স্বয়ংক্রিয়ভাবে ডান পাশের ঘরে দেখা যাবে।",
    "4. Click 'Copy Converted Text' to copy your result instantly.": "৪. ফলাফল কপি করতে ‘রূপান্তরিত লেখা কপি করুন’ বাটনে চাপ দিন।",
    "Tools in the same category": "একই বিভাগের অন্যান্য টুল",
    "Banglish Typing": "বাংলিশ টাইপিং",
    "Type Bangla with an English keyboard — live Banglish to Bangla and Bangla to Banglish conversion in your browser.": "ইংরেজি কিবোর্ডে বাংলা লিখুন—ব্রাউজারেই বাংলিশ থেকে বাংলা এবং বাংলা থেকে বাংলিশে সরাসরি রূপান্তর করুন।",
    "Image to Text": "ছবি থেকে লেখা",
    "Extract text from images with OCR in your browser — supports English and Bengali.": "ব্রাউজারে OCR প্রযুক্তি ব্যবহার করে ছবি থেকে লেখা বের করুন—ইংরেজি ও বাংলা দুটিই সমর্থিত।",
    "Text to convert": "রূপান্তরের জন্য লেখা",
    "Couldn't convert this text. Please check the input.": "লেখাটি রূপান্তর করা যায়নি। অনুগ্রহ করে ইনপুটটি পরীক্ষা করুন।",
};

function normalizeBijoyText(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function translateBijoyText(value: string, locale: string, baseL?: (text: string) => string): string {
    const key = normalizeBijoyText(value);
    if (!key) return value;
    if (!/^bn(?:-|$)/i.test(String(locale))) {
        return baseL ? baseL(value) : value;
    }
    return BIJOY_BN[key] ?? (baseL ? baseL(value) : value);
}

function BijoyText({ children }: { children: React.ReactNode }) {
    const { locale, L } = useSohozI18n();
    if (typeof children !== "string") return <>{children}</>;
    return <>{translateBijoyText(children, locale, L)}</>;
}

const relatedTools = [
    {
        title: "Banglish Typing",
        description: "Type Bangla with an English keyboard — live Banglish to Bangla and Bangla to Banglish conversion in your browser.",
        href: "/sohoj-tools/banglish-typing",
        icon: Keyboard,
    },
    {
        title: "Image to Text",
        description: "Extract text from images with OCR in your browser — supports English and Bengali.",
        href: "/sohoj-tools/image-to-text",
        icon: ScanText,
    },
];
export default function BijoyToUnicode() {
    const { locale, L } = useSohozI18n();
    const EL = useCallback((value: string) => translateBijoyText(value, locale, L), [locale, L]);
    const router = useRouter();
    // States
    const [direction, setDirection] = useState<"bijoyToUnicode" | "unicodeToBijoy">("bijoyToUnicode");
    const [inputText, setInputText] = useState("");
    const [convertedText, setConvertedText] = useState("");
    const [isFavorite, setIsFavorite] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showHowToUse, setShowHowToUse] = useState(false);
    const [conversionError, setConversionError] = useState("");
    // Core conversion logic — runs the right converter for the active direction
    const convert = useCallback((text: string, dir: "bijoyToUnicode" | "unicodeToBijoy") => {
        if (!text.trim())
            return "";
        try {
            if (dir === "bijoyToUnicode") {
                return ConvertToUnicode("bijoy", text);
            }
            return ConvertToASCII("bijoy", text);
        }
        catch (err) {
            console.error("Bijoy/Unicode conversion failed:", err);
            return "";
        }
    }, []);
    // Live conversion — re-runs whenever the input text or direction changes
    useEffect(() => {
        if (!inputText.trim()) {
            setConvertedText("");
            setConversionError("");
            return;
        }
        try {
            setConvertedText(convert(inputText, direction));
            setConversionError("");
        }
        catch {
            setConvertedText("");
            setConversionError(EL("Couldn't convert this text. Please check the input."));
        }
    }, [inputText, direction, convert, EL]);
    // Input change handler (typing / pasting)
    const handleConversion = (text: string) => {
        setInputText(text);
    };
    // Explicit "Convert" button — re-runs conversion immediately
    // useful if the user pastes text without triggering onChange
    const handleConvertClick = () => {
        setConvertedText(convert(inputText, direction));
    };
    const handleReset = () => {
        setInputText("");
        setConvertedText("");
        setConversionError("");
    };
    const handleDirectionChange = (newDirection: "bijoyToUnicode" | "unicodeToBijoy") => {
        if (newDirection === direction)
            return;
        setDirection(newDirection);
        // Recompute immediately with the new direction rather than waiting on
        // the effect, so the UI feels instantaneous.
        setConvertedText(convert(inputText, newDirection));
    };
    const handleCopy = () => {
        if (!convertedText)
            return;
        navigator.clipboard.writeText(convertedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (<div className="w-full text-[#0F172A] font-sans pb-16">
      <div className="w-full space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* Breadcrumb with Back Button */}
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
              <button onClick={() => router.back()} className="p-1 hover:bg-gray-200/60 rounded-md transition-colors text-[#0F172A] flex items-center justify-center -ml-1" title={EL("Go back")} aria-label={EL("Go back")}>
                <ArrowLeft size={16}/>
              </button>

              <Link href="/sohoj-tools" className="hover:text-[#0F172A]"><BijoyText>{"Sohoj Tools\n              "}</BijoyText></Link>

              <span><BijoyText>{"/"}</BijoyText></span>

              <span className="hover:text-[#0F172A] cursor-pointer"><BijoyText>{"Text Tools\n              "}</BijoyText></span>

              <span><BijoyText>{"/"}</BijoyText></span>

              <span className="text-[#0F172A] font-semibold"><BijoyText>{"Bijoy \u2194 Unicode\n              "}</BijoyText></span>
            </div>

            {/* Title & Badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Languages size={18}/>
              </div>

              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight"><BijoyText>{"Bijoy \u2194 Unicode\n              "}</BijoyText></h1>

              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full"><BijoyText>{"Free\n              "}</BijoyText></span>
            </div>

            <p className="text-xs text-gray-500 font-medium mt-1"><BijoyText>{"Convert Bangla text between Bijoy ANSI and Unicode directly in\n              your browser.\n            "}</BijoyText></p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button onClick={() => setIsFavorite(!isFavorite)} title={EL(isFavorite ? "Remove from favorites" : "Add to favorites")} aria-label={EL(isFavorite ? "Remove from favorites" : "Add to favorites")} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-2xs">
              <Star size={16} className={isFavorite ? "fill-amber-400 text-[#2563EB]" : ""}/>
            </button>

            <button title={EL("Share this tool")} aria-label={EL("Share this tool")} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-[#0F172A] transition-all shadow-2xs">
              <Share size={16}/>
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: INPUT CONTROLS */}
          <div className="lg:col-span-4 space-y-4">
            {/* Conversion Direction Card */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-[#0F172A] tracking-wide uppercase block"><BijoyText>{"Conversion input\n              "}</BijoyText></span>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-gray-500 block"><BijoyText>{"Conversion direction\n                "}</BijoyText></span>

                <div className="space-y-2">
                  <button onClick={() => handleDirectionChange("bijoyToUnicode")} className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${direction === "bijoyToUnicode"
            ? "border-sky-500 bg-sky-50/50 text-sky-600 ring-1 ring-sky-500"
            : "border-gray-200 bg-white text-[#0F172A] hover:bg-gray-50"}`}>
                    <ArrowLeftRight size={14}/>
                    <span><BijoyText>{"Bijoy to Unicode"}</BijoyText></span>
                  </button>

                  <button onClick={() => handleDirectionChange("unicodeToBijoy")} className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${direction === "unicodeToBijoy"
            ? "border-sky-500 bg-sky-50/50 text-sky-600 ring-1 ring-sky-500"
            : "border-gray-200 bg-white text-[#0F172A] hover:bg-gray-50"}`}>
                    <ArrowLeftRight size={14}/>
                    <span><BijoyText>{"Unicode to Bijoy"}</BijoyText></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Input Text Box */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#0F172A] tracking-wide uppercase">
                  {direction === "bijoyToUnicode" ? <BijoyText>{"Bijoy (ANSI)"}</BijoyText> : <BijoyText>{"Unicode"}</BijoyText>}
                </span>
              </div>

              <textarea rows={9} aria-label={EL("Text to convert")} placeholder={direction === "bijoyToUnicode"
            ? EL("Paste Bijoy font text here...")
            : EL("Paste Unicode Bangla text here...")} value={inputText} onChange={(e) => handleConversion(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 placeholder:text-gray-400 leading-relaxed resize-none"/>

              <div className="flex items-center justify-between">
                {conversionError ? (<span className="text-[10px] font-semibold text-red-500">
                    {conversionError}
                  </span>) : (<span />)}

                <span className="text-[10px] font-medium text-gray-400">
                  {inputText.length}<BijoyText>{"characters\n                "}</BijoyText></span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CONVERTED TEXT OUTPUT */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider"><BijoyText>{"Converted text\n                  "}</BijoyText></span>

                  {convertedText ? (<span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md"><BijoyText>{"Ready \u00B7 "}</BijoyText>{convertedText.length}<BijoyText>{"characters\n                    "}</BijoyText></span>) : (<span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md"><BijoyText>{"Empty\n                    "}</BijoyText></span>)}
                </div>

                {/* Output Display Area */}
                <div className="pt-4">
                  {!convertedText ? (<div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center mb-3">
                        <Languages size={24}/>
                      </div>

                      <h3 className="text-xs font-bold text-[#0F172A] mb-1"><BijoyText>{"Paste text to get started\n                      "}</BijoyText></h3>

                      <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed"><BijoyText>{"Choose a direction, paste your text, then convert it in\n                        the browser.\n                      "}</BijoyText></p>
                    </div>) : (<div className="p-3 bg-[#FDFCFB] border border-gray-200/60 rounded-xl text-xs text-[#0F172A] leading-relaxed min-h-[220px] whitespace-pre-wrap break-words font-medium">
                      {convertedText}
                    </div>)}
                </div>
              </div>

              {/* Copy Button */}
              {convertedText && (<div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button onClick={handleCopy} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-2xs">
                    {copied ? <Check size={14}/> : <Copy size={14}/>}

                    <span>{copied ? <BijoyText>{"Copied!"}</BijoyText> : <BijoyText>{"Copy Converted Text"}</BijoyText>}</span>
                  </button>
                </div>)}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span className={`w-2 h-2 rounded-full ${conversionError
            ? "bg-red-400"
            : convertedText
                ? "bg-emerald-400"
                : "bg-[#2563EB]"}`}/>

            <span>
              {conversionError
            ? conversionError
            : convertedText
                ? EL("Converted")
                : inputText
                    ? EL("Text ready to convert")
                    : EL("Add an input to get started")}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button onClick={handleReset} className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0F172A] font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
              <RotateCcw size={13}/>
              <span><BijoyText>{"Reset"}</BijoyText></span>
            </button>

            <button onClick={handleConvertClick} disabled={!inputText.trim()} className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs">
              <span>{direction === "bijoyToUnicode" ? EL("Convert to Unicode") : EL("Convert to Bijoy")}</span>
            </button>
          </div>
        </div>

        {/* PRIVACY NOTICE */}
        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0"/>

          <span><BijoyText>{"Your files are processed in the browser \u2014 they are not uploaded to\n            any server.\n          "}</BijoyText></span>
        </div>

        {/* HOW TO USE DROPDOWN */}
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <button onClick={() => setShowHowToUse(!showHowToUse)} className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-[#0F172A] hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"/>
              <span><BijoyText>{"How to use"}</BijoyText></span>
            </div>

            {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>

          {showHowToUse && (<div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p><BijoyText>{"1. Select the conversion direction (Bijoy to Unicode or Unicode\n                to Bijoy).\n              "}</BijoyText></p>

              <p><BijoyText>{"2. Paste your input text into the text area on the left."}</BijoyText></p>

              <p><BijoyText>{"3. The converted output will automatically generate on the right\n                box.\n              "}</BijoyText></p>

              <p><BijoyText>{"4. Click 'Copy Converted Text' to copy your result instantly.\n              "}</BijoyText></p>
            </div>)}
        </div>

        {/* TOOLS IN THE SAME CATEGORY */}
        <div className="pt-4 space-y-3">
          <h2 className="text-sm font-bold text-[#0F172A] tracking-tight"><BijoyText>{"Tools in the same category\n          "}</BijoyText></h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool, idx) => {
            const ToolIcon = tool.icon;
            return (<Link key={idx} href={tool.href} className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="w-9 h-9 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-sky-100 transition-colors">
                      <ToolIcon size={18}/>
                    </div>

                    <h3 className="text-xs font-bold text-[#0F172A] mb-1 group-hover:text-sky-600 transition-colors">
                      {<BijoyText>{tool.title}</BijoyText>}
                    </h3>

                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      {<BijoyText>{tool.description}</BijoyText>}
                    </p>
                  </div>
                </Link>);
        })}
          </div>
        </div>
      </div>
    </div>);
}
