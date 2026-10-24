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
    return (<div className="page-font relative isolate w-full text-[#3B2F1E] pb-16">
      {/* Viewport-sized page background: independent of the tool's centered/max-width parent. */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE]" />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .page-font.page-font,
        .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        .page-font h1, .page-font h2, .page-font h3, .page-font h4 { letter-spacing: -0.01em; }
        .page-font p { font-size: max(15px, 1em); line-height: 1.7; }
        .page-font button, .page-font textarea, .page-font input, .page-font select, .page-font label { font-size: max(15px, 1em); line-height: 1.45; }
        .page-font button:focus-visible, .page-font a:focus-visible, .page-font textarea:focus-visible, .page-font input:focus-visible, .page-font select:focus-visible {
          outline: 2px solid #DC2626; outline-offset: 2px;
        }
        .page-font button:disabled { opacity: 0.7; cursor: not-allowed; }
        .page-font button:active:not(:disabled) { transform: scale(0.98); }
        .page-font .scroll { scrollbar-width: thin; scrollbar-color: #F87171 transparent; }
        .page-font .scroll::-webkit-scrollbar { width: 12px; }
        .page-font .scroll::-webkit-scrollbar-track { background: rgba(148, 113, 67, 0.12); border-radius: 999px; margin: 10px 0; }
        .page-font .scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #F87171, #DC2626); border-radius: 999px; border: 3px solid #F2E8D2; min-height: 48px; }
        .page-font .scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #EF4444, #B91C1C); }
      `}</style>
      <div className="relative z-0 w-full space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* Breadcrumb with Back Button */}
            <div className="flex items-center gap-2 text-sm text-[#7A6A50] font-medium mb-2">
              <button onClick={() => router.back()} className="p-1 hover:bg-[#EFE3C8] rounded-md transition-colors text-[#3B2F1E] flex items-center justify-center -ml-1" title={EL("Go back")} aria-label={EL("Go back")}>
                <ArrowLeft size={16}/>
              </button>

              <Link href="/sohoj-tools" className="hover:text-[#DC2626]"><BijoyText>{"Sohoj Tools\n              "}</BijoyText></Link>

              <span><BijoyText>{"/"}</BijoyText></span>

              <span className="hover:text-[#3B2F1E] cursor-pointer"><BijoyText>{"Text Tools\n              "}</BijoyText></span>

              <span><BijoyText>{"/"}</BijoyText></span>

              <span className="text-[#3B2F1E] font-semibold"><BijoyText>{"Bijoy \u2194 Unicode\n              "}</BijoyText></span>
            </div>

            {/* Title & Badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#FEE9E9] text-[#DC2626] rounded-lg flex items-center justify-center font-bold shadow-sm">
                <Languages size={18}/>
              </div>

              <h1 className="text-2xl font-bold text-[#3B2F1E] tracking-tight"><BijoyText>{"Bijoy \u2194 Unicode\n              "}</BijoyText></h1>

              <span className="bg-[#F6EEDB] text-[#5A4A32] text-[13px] font-bold px-2 py-0.5 rounded-full"><BijoyText>{"Free\n              "}</BijoyText></span>
            </div>

            <p className="text-sm text-[#7A6A50] font-medium mt-1"><BijoyText>{"Convert Bangla text between Bijoy ANSI and Unicode directly in\n              your browser.\n            "}</BijoyText></p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button onClick={() => setIsFavorite(!isFavorite)} title={EL(isFavorite ? "Remove from favorites" : "Add to favorites")} aria-label={EL(isFavorite ? "Remove from favorites" : "Add to favorites")} className="p-2 bg-[#FBF6E8] rounded-lg border border-[#E3D6B8] text-[#7A6A50] hover:text-[#DC2626] hover:border-[#DC2626] transition-all shadow-sm">
              <Star size={16} className={isFavorite ? "fill-[#DC2626] text-[#DC2626]" : ""}/>
            </button>

            <button title={EL("Share this tool")} aria-label={EL("Share this tool")} className="p-2 bg-[#FBF6E8] rounded-lg border border-[#E3D6B8] text-[#7A6A50] hover:text-[#DC2626] transition-all shadow-sm">
              <Share size={16}/>
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: INPUT CONTROLS */}
          <div className="lg:col-span-4 space-y-4">
            {/* Conversion Direction Card */}
            <div className="bg-[#FBF6E8] border border-[#E3D6B8]/80 rounded-2xl p-4 shadow-sm space-y-3">
              <span className="text-sm font-bold text-[#3B2F1E] tracking-wide uppercase block"><BijoyText>{"Conversion input\n              "}</BijoyText></span>

              <div className="space-y-2">
                <span className="text-[13px] font-semibold text-[#7A6A50] block"><BijoyText>{"Conversion direction\n                "}</BijoyText></span>

                <div className="space-y-2">
                  <button onClick={() => handleDirectionChange("bijoyToUnicode")} className={`w-full py-2.5 px-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${direction === "bijoyToUnicode"
            ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C] ring-2 ring-[#DC2626]/40"
            : "border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8]"}`}>
                    <ArrowLeftRight size={14}/>
                    <span><BijoyText>{"Bijoy to Unicode"}</BijoyText></span>
                  </button>

                  <button onClick={() => handleDirectionChange("unicodeToBijoy")} className={`w-full py-2.5 px-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${direction === "unicodeToBijoy"
            ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C] ring-2 ring-[#DC2626]/40"
            : "border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8]"}`}>
                    <ArrowLeftRight size={14}/>
                    <span><BijoyText>{"Unicode to Bijoy"}</BijoyText></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Input Text Box */}
            <div className="bg-[#FBF6E8] border border-[#E3D6B8]/80 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-[#3B2F1E] tracking-wide uppercase">
                  {direction === "bijoyToUnicode" ? <BijoyText>{"Bijoy (ANSI)"}</BijoyText> : <BijoyText>{"Unicode"}</BijoyText>}
                </span>
              </div>

              <textarea rows={9} aria-label={EL("Text to convert")} placeholder={direction === "bijoyToUnicode"
            ? EL("Paste Bijoy font text here...")
            : EL("Paste Unicode Bangla text here...")} value={inputText} onChange={(e) => handleConversion(e.target.value)} className="w-full bg-[#FBF6E8] border border-[#E3D6B8] rounded-xl p-3 text-sm font-medium text-[#3B2F1E] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] placeholder:text-[#B0A080] leading-relaxed resize-none"/>

              <div className="flex items-center justify-between">
                {conversionError ? (<span className="text-[12px] font-semibold text-[#DC2626]">
                    {conversionError}
                  </span>) : (<span />)}

                <span className="text-[12px] font-medium text-[#7A6A50]">
                  {inputText.length}<BijoyText>{"characters\n                "}</BijoyText></span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CONVERTED TEXT OUTPUT */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-[#FBF6E8] border border-[#E3D6B8]/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E3D6B8]/70">
                  <span className="text-sm font-bold text-[#3B2F1E] uppercase tracking-wider"><BijoyText>{"Converted text\n                  "}</BijoyText></span>

                  {convertedText ? (<span className="text-[13px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md"><BijoyText>{"Ready \u00B7 "}</BijoyText>{convertedText.length}<BijoyText>{"characters\n                    "}</BijoyText></span>) : (<span className="text-[13px] font-semibold text-[#7A6A50] bg-[#F3E9D2] px-2 py-0.5 rounded-md"><BijoyText>{"Empty\n                    "}</BijoyText></span>)}
                </div>

                {/* Output Display Area */}
                <div className="pt-4">
                  {!convertedText ? (<div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-12 h-12 bg-[#FEE9E9] text-[#DC2626] rounded-xl flex items-center justify-center mb-3">
                        <Languages size={24}/>
                      </div>

                      <h3 className="text-sm font-bold text-[#3B2F1E] mb-1"><BijoyText>{"Paste text to get started\n                      "}</BijoyText></h3>

                      <p className="text-[13px] text-[#7A6A50] max-w-xs leading-relaxed"><BijoyText>{"Choose a direction, paste your text, then convert it in\n                        the browser.\n                      "}</BijoyText></p>
                    </div>) : (<div className="p-3 bg-[#F6EEDB] border border-[#E3D6B8]/60 rounded-xl text-sm text-[#3B2F1E] leading-relaxed min-h-[220px] whitespace-pre-wrap break-words font-medium">
                      {convertedText}
                    </div>)}
                </div>
              </div>

              {/* Copy Button */}
              {convertedText && (<div className="pt-4 border-t border-[#E3D6B8]/70 flex justify-end">
                  <button onClick={handleCopy} className="px-4 py-2 bg-[#D42020] hover:bg-[#AE1717] text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow-sm">
                    {copied ? <Check size={14}/> : <Copy size={14}/>}

                    <span>{copied ? <BijoyText>{"Copied!"}</BijoyText> : <BijoyText>{"Copy Converted Text"}</BijoyText>}</span>
                  </button>
                </div>)}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-[#FBF6E8] border border-[#E3D6B8]/80 rounded-2xl p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[#7A6A50]">
            <span className={`w-2 h-2 rounded-full ${conversionError
            ? "bg-red-400"
            : convertedText
                ? "bg-emerald-400"
                : "bg-[#DC2626]"}`}/>

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
            <button onClick={handleReset} className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#FBF6E8] hover:bg-[#FEE9E9] text-[#B91C1C] border border-[#FBB6B6] font-bold text-sm transition-colors flex items-center justify-center gap-1.5">
              <RotateCcw size={13}/>
              <span><BijoyText>{"Reset"}</BijoyText></span>
            </button>

            <button onClick={handleConvertClick} disabled={!inputText.trim()} className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-[#D42020] hover:bg-[#AE1717] disabled:bg-[#D8C9A6] disabled:text-[#7A6A50] disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5 shadow-sm">
              <span>{direction === "bijoyToUnicode" ? EL("Convert to Unicode") : EL("Convert to Bijoy")}</span>
            </button>
          </div>
        </div>

        {/* PRIVACY NOTICE */}
        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-sm text-emerald-800 font-medium">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0"/>

          <span><BijoyText>{"Your files are processed in the browser \u2014 they are not uploaded to\n            any server.\n          "}</BijoyText></span>
        </div>

        {/* HOW TO USE DROPDOWN */}
        <div className="bg-[#FBF6E8] border border-[#E3D6B8]/80 rounded-2xl overflow-hidden shadow-sm">
          <button onClick={() => setShowHowToUse(!showHowToUse)} className="w-full p-4 text-left flex items-center justify-between font-bold text-sm text-[#3B2F1E] hover:bg-[#EFE3C8]/70 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D42020]"/>
              <span><BijoyText>{"How to use"}</BijoyText></span>
            </div>

            {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>

          {showHowToUse && (<div className="p-4 pt-0 text-sm text-[#5A4A32] space-y-2 border-t border-[#E3D6B8]/70 font-medium leading-relaxed">
              <p><BijoyText>{"1. Select the conversion direction (Bijoy to Unicode or Unicode\n                to Bijoy).\n              "}</BijoyText></p>

              <p><BijoyText>{"2. Paste your input text into the text area on the left."}</BijoyText></p>

              <p><BijoyText>{"3. The converted output will automatically generate on the right\n                box.\n              "}</BijoyText></p>

              <p><BijoyText>{"4. Click 'Copy Converted Text' to copy your result instantly.\n              "}</BijoyText></p>
            </div>)}
        </div>

        {/* TOOLS IN THE SAME CATEGORY */}
        <div className="pt-4 space-y-3">
          <h2 className="text-base font-bold text-[#3B2F1E] tracking-tight"><BijoyText>{"Tools in the same category\n          "}</BijoyText></h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool, idx) => {
            const ToolIcon = tool.icon;
            return (<Link key={idx} href={tool.href} className="bg-[#FBF6E8] border border-[#E3D6B8]/80 rounded-2xl p-5 shadow-sm hover:shadow-sm hover:border-[#DC2626] transition-all flex flex-col justify-between group">
                  <div>
                    <div className="w-9 h-9 bg-[#FEE9E9] text-[#DC2626] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#FEE9E9] transition-colors">
                      <ToolIcon size={18}/>
                    </div>

                    <h3 className="text-sm font-bold text-[#3B2F1E] mb-1 group-hover:text-[#DC2626] transition-colors">
                      {<BijoyText>{tool.title}</BijoyText>}
                    </h3>

                    <p className="text-[13px] text-[#7A6A50] font-medium leading-relaxed">
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
