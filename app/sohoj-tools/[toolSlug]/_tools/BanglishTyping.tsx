"use client";
import { T, useSohozI18n, L } from "@/app/sohoj-tools/_i18n";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toBangla } from "@subhesadek/avro-phonetic";
import { ArrowLeft, Star, Share, Copy, Check, ChevronDown, ChevronUp, Keyboard, ArrowLeftRight, RotateCcw, ShieldCheck, Languages, ScanText, } from "lucide-react";
/**
 * ---- Custom Bangla -> Banglish reverse transliteration ----
 *
 * Avro Phonetic (and Bangla script generally) is many-to-one: several
 * different Banglish spellings can produce the same Bangla glyph (e.g. both
 * "sh" and "S" give শ). That means there is no single "correct" inverse —
 * this is a best-effort phonetic rendering of the Bangla text, not a
 * guaranteed round-trip of whatever the user originally typed.
 */
// Bangla consonants -> base phonetic spelling
const CONSONANT_MAP: Record<string, string> = {
    ক: "k",
    খ: "kh",
    গ: "g",
    ঘ: "gh",
    ঙ: "ng",
    চ: "ch",
    ছ: "chh",
    জ: "j",
    ঝ: "jh",
    ঞ: "NG",
    ট: "T",
    ঠ: "Th",
    ড: "D",
    ঢ: "Dh",
    ণ: "N",
    ত: "t",
    থ: "th",
    দ: "d",
    ধ: "dh",
    ন: "n",
    প: "p",
    ফ: "ph",
    ব: "b",
    ভ: "bh",
    ম: "m",
    য: "z",
    র: "r",
    ল: "l",
    শ: "sh",
    ষ: "Sh",
    স: "s",
    হ: "h",
    ড়: "rr",
    ঢ়: "rh",
    য়: "y",
};
// Independent (standalone) vowels
const INDEPENDENT_VOWEL_MAP: Record<string, string> = {
    অ: "o",
    আ: "a",
    ই: "i",
    ঈ: "ee",
    উ: "u",
    ঊ: "oo",
    ঋ: "rri",
    এ: "e",
    ঐ: "oi",
    ও: "o",
    ঔ: "ou",
};
// Dependent vowel signs (kar) that attach to a preceding consonant
const VOWEL_SIGN_MAP: Record<string, string> = {
    "া": "a",
    "ি": "i",
    "ী": "ee",
    "ু": "u",
    "ূ": "oo",
    "ৃ": "ri",
    "ে": "e",
    "ৈ": "oi",
    "ো": "o",
    "ৌ": "ou",
};
// Nasalization / aspiration marks
const OTHER_MARK_MAP: Record<string, string> = {
    "ং": "ng",
    "ঃ": ":",
    "ঁ": "^",
};
// Bangla digits -> Arabic digits
const BANGLA_DIGIT_MAP: Record<string, string> = {
    "০": "0",
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4",
    "৫": "5",
    "৬": "6",
    "৭": "7",
    "৮": "8",
    "৯": "9",
};
const HASANTA = "্";
const BANGLA_CHAR_REGEX = /[\u0980-\u09FF]/;
function banglaToBanglish(text: string): string {
    if (!text)
        return "";
    const chars = Array.from(text.normalize("NFC"));
    let output = "";
    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        const next = chars[i + 1];
        // The hasanta joins two consonants into a conjunct; the consonant
        // letters already carry the sound, so it needs no output of its own.
        if (ch === HASANTA)
            continue;
        if (ch === "৷" || ch === "।") {
            output += ".";
            continue;
        }
        if (ch in CONSONANT_MAP) {
            output += CONSONANT_MAP[ch];
            const nextIsVowelSign = next !== undefined && next in VOWEL_SIGN_MAP;
            const nextIsHasanta = next === HASANTA;
            const nextIsBangla = next !== undefined && BANGLA_CHAR_REGEX.test(next);
            // A bare consonant carries an implicit "o" sound unless a vowel sign
            // or hasanta follows, or it's the last letter of the word — where the
            // inherent vowel is conventionally dropped (মন -> "mon", not "mono").
            if (!nextIsVowelSign && !nextIsHasanta && nextIsBangla) {
                output += "o";
            }
            continue;
        }
        if (ch in VOWEL_SIGN_MAP) {
            output += VOWEL_SIGN_MAP[ch];
            continue;
        }
        if (ch in INDEPENDENT_VOWEL_MAP) {
            output += INDEPENDENT_VOWEL_MAP[ch];
            continue;
        }
        if (ch in OTHER_MARK_MAP) {
            output += OTHER_MARK_MAP[ch];
            continue;
        }
        if (ch in BANGLA_DIGIT_MAP) {
            output += BANGLA_DIGIT_MAP[ch];
            continue;
        }
        // Anything else (spaces, Latin text, punctuation) passes through as-is.
        output += ch;
    }
    return output;
}
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
        description: "Convert Bangla text between Bijoy ANSI and Unicode directly in your browser.",
        href: "/sohoj-tools/bijoy-unicode",
        icon: Languages,
    },
    {
        title: "Image to Text",
        description: "Extract text from images with OCR in your browser — supports English and Bengali.",
        href: "/sohoj-tools/image-to-text",
        icon: ScanText,
    },
];
export default function BanglishTyping() {
    const { L } = useSohozI18n();
    const router = useRouter();
    // States
    const [mode, setMode] = useState<"banglishToBangla" | "banglaToBanglish">("banglishToBangla");
    const [inputText, setInputText] = useState("");
    const [convertedText, setConvertedText] = useState("");
    const [isFavorite, setIsFavorite] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showHowToUse, setShowHowToUse] = useState(false);
    const [conversionError, setConversionError] = useState("");
    // Core conversion logic for the active mode
    const convert = useCallback((text: string, currentMode: "banglishToBangla" | "banglaToBanglish") => {
        if (!text.trim())
            return "";
        try {
            if (currentMode === "banglishToBangla") {
                return toBangla(text);
            }
            return banglaToBanglish(text);
        }
        catch (err) {
            console.error("Banglish/Bangla conversion failed:", err);
            return "";
        }
    }, []);
    // Live conversion — re-runs whenever the input text or mode changes
    useEffect(() => {
        if (!inputText.trim()) {
            setConvertedText("");
            setConversionError("");
            return;
        }
        try {
            setConvertedText(convert(inputText, mode));
            setConversionError("");
        }
        catch {
            setConvertedText("");
            setConversionError("Couldn't convert this text. Please check the input.");
        }
    }, [inputText, mode, convert]);
    // Input change handler (typing / pasting)
    const handleConversion = (text: string) => {
        setInputText(text);
    };
    // Explicit "Convert text" button — re-runs conversion immediately
    const handleConvertClick = () => {
        setConvertedText(convert(inputText, mode));
    };
    const handleReset = () => {
        setInputText("");
        setConvertedText("");
        setConversionError("");
    };
    const handleModeChange = (newMode: "banglishToBangla" | "banglaToBanglish") => {
        if (newMode === mode)
            return;
        setMode(newMode);
        // Recompute immediately with the new mode rather than waiting on the
        // effect, so switching direction feels instantaneous.
        setConvertedText(convert(inputText, newMode));
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
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
              <button onClick={() => router.back()} className="p-1 hover:bg-gray-200/60 rounded-md transition-colors text-[#0F172A] flex items-center justify-center -ml-1" title={L("Go back")}>
                <ArrowLeft size={16}/>
              </button>
              <Link href="/sohoj-tools" className="hover:text-[#0F172A]"><T>{"Sohoj Tools\n              "}</T></Link>
              <span><T>{"/"}</T></span>
              <span className="hover:text-[#0F172A] cursor-pointer"><T>{"Text Tools\n              "}</T></span>
              <span><T>{"/"}</T></span>
              <span className="text-[#0F172A] font-semibold"><T>{"Banglish Typing\n              "}</T></span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-lime-100 text-lime-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Keyboard size={18}/>
              </div>
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight"><T>{"Banglish Typing\n              "}</T></h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full"><T>{"Free\n              "}</T></span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1"><T>{"Type Bangla with an English keyboard \u2014 live Banglish to Bangla and\n              Bangla to Banglish conversion in your browser.\n            "}</T></p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button onClick={() => setIsFavorite(!isFavorite)} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-2xs">
              <Star size={16} className={isFavorite ? "fill-amber-400 text-[#2563EB]" : ""}/>
            </button>
            <button className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-[#0F172A] transition-all shadow-2xs">
              <Share size={16}/>
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: CONTROLS & INPUT */}
          <div className="lg:col-span-4 space-y-4">
            {/* Conversion Mode Card */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-[#0F172A] tracking-wide uppercase block"><T>{"Type here\n              "}</T></span>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-gray-500 block"><T>{"Conversion mode\n                "}</T></span>

                <div className="space-y-2">
                  <button onClick={() => handleModeChange("banglishToBangla")} className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === "banglishToBangla"
            ? "border-sky-500 bg-sky-50/50 text-sky-600 ring-1 ring-sky-500"
            : "border-gray-200 bg-white text-[#0F172A] hover:bg-gray-50"}`}>
                    <ArrowLeftRight size={14}/>
                    <span><T>{"Banglish to Bangla"}</T></span>
                  </button>

                  <button onClick={() => handleModeChange("banglaToBanglish")} className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === "banglaToBanglish"
            ? "border-sky-500 bg-sky-50/50 text-sky-600 ring-1 ring-sky-500"
            : "border-gray-200 bg-white text-[#0F172A] hover:bg-gray-50"}`}>
                    <ArrowLeftRight size={14}/>
                    <span><T>{"Bangla to Banglish"}</T></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Input Text Box */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#0F172A] tracking-wide uppercase">
                  {mode === "banglishToBangla"
        ? <T>{"Banglish — type here"}</T> : <T>{"Bangla — paste here"}</T>}
                </span>
              </div>

              <textarea rows={9} placeholder={mode === "banglishToBangla"
            ? "ekhane likhun..."
            : "এখানে বাংলা লিখুন বা পেস্ট করুন..."} value={inputText} onChange={(e) => handleConversion(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 placeholder:text-gray-400 leading-relaxed resize-none"/>

              <div className="flex items-center justify-between">
                {conversionError ? (<span className="text-[10px] font-semibold text-red-500">
                    {conversionError}
                  </span>) : (<span />)}
                <span className="text-[10px] font-medium text-gray-400">
                  {inputText.length}<T>{"chars \u2022"}</T>{<T>{" "}</T>}
                  {inputText.trim() ? inputText.trim().split(/\s+/).length : 0}{<T>{" "}</T>}<T>{"words\n                "}</T></span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: OUTPUT DISPLAY */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider"><T>{"Converted text\n                  "}</T></span>
                  {convertedText ? (<span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md"><T>{"Ready \u00B7 "}</T>{convertedText.length}<T>{"characters\n                    "}</T></span>) : (<span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md"><T>{"Empty\n                    "}</T></span>)}
                </div>

                <div className="pt-4">
                  {!convertedText ? (<div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center mb-3">
                        <Keyboard size={24}/>
                      </div>
                      <h3 className="text-xs font-bold text-[#0F172A] mb-1"><T>{"Start typing to convert\n                      "}</T></h3>
                      <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed"><T>{"Choose a mode, type in the left panel, and the converted\n                        text appears instantly.\n                      "}</T></p>
                    </div>) : (<div className="p-3 bg-[#FDFCFB] border border-gray-200/60 rounded-xl text-xs text-[#0F172A] leading-relaxed min-h-[220px] whitespace-pre-wrap break-words font-medium">
                      {convertedText}
                    </div>)}
                </div>
              </div>

              {convertedText && (<div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button onClick={handleCopy} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-2xs">
                    {copied ? <Check size={14}/> : <Copy size={14}/>}
                    <span>{copied ? <T>{"Copied!"}</T> : <T>{"Copy Converted Text"}</T>}</span>
                  </button>
                </div>)}
            </div>
          </div>
        </div>

        {/* QUICK REFERENCE SECTION */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold text-[#0F172A] tracking-wide uppercase"><T>{"Quick reference\n          "}</T></h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {quickReferences.map((ref, idx) => (<div key={idx} className="bg-[#F8FAFC] border border-gray-200/60 rounded-xl p-2 flex items-center justify-between text-[11px]">
                <span className="text-[#0F172A] font-semibold truncate pr-1">
                  {ref.en}
                </span>
                <span className="text-[#0F172A] font-bold">{ref.bn}</span>
              </div>))}
          </div>
          <p className="text-[11px] text-gray-500 pt-1"><T>{"This tool supports pure Banglish. Examples: sonar &rarr; \u09B8\u09CB\u09A8\u09BE\u09B0, amil\n            valo achi &rarr; \u0986\u09AE\u09BF \u09AD\u09BE\u09B2\u09CB \u0986\u099B\u09BF. Common words like onek and ekhon work\n            directly.\n          "}</T></p>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span className={`w-2 h-2 rounded-full ${conversionError
            ? "bg-red-400"
            : convertedText
                ? "bg-emerald-400"
                : "bg-[#2563EB]"}`}></span>
            <span>
              {conversionError
            ? conversionError
            : convertedText
                ? "Converted"
                : inputText
                    ? "Text ready to convert"
                    : "Start typing in the box above"}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button onClick={handleReset} className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0F172A] font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
              <RotateCcw size={13}/>
              <span><T>{"Reset"}</T></span>
            </button>

            <button onClick={handleConvertClick} disabled={!inputText.trim()} className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs">
              <span><T>{"Convert text"}</T></span>
            </button>
          </div>
        </div>

        {/* PRIVACY NOTICE */}
        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0"/>
          <span><T>{"Your files are processed in the browser \u2014 they are not uploaded to\n            any server.\n          "}</T></span>
        </div>

        {/* HOW TO USE DROPDOWN */}
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <button onClick={() => setShowHowToUse(!showHowToUse)} className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-[#0F172A] hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              <span><T>{"How to use"}</T></span>
            </div>
            {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>

          {showHowToUse && (<div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p><T>{"1. Select the conversion mode (Banglish to Bangla or Bangla to\n                Banglish).\n              "}</T></p>
              <p><T>{"2. Type phonetically in the input text area using your English\n                keyboard.\n              "}</T></p>
              <p><T>{"3. Review the live converted Bangla or Banglish output on the\n                right.\n              "}</T></p>
              <p><T>{"4. Use the Quick Reference grid below for specific conjunct\n                letters.\n              "}</T></p>
            </div>)}
        </div>

        {/* TOOLS IN THE SAME CATEGORY */}
        <div className="pt-4 space-y-3">
          <h2 className="text-sm font-bold text-[#0F172A] tracking-tight"><T>{"Tools in the same category\n          "}</T></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool, idx) => {
            const ToolIcon = tool.icon;
            return (<Link key={idx} href={tool.href} className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="w-9 h-9 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-sky-100 transition-colors">
                      <ToolIcon size={18}/>
                    </div>
                    <h3 className="text-xs font-bold text-[#0F172A] mb-1 group-hover:text-sky-600 transition-colors">
                      {<T>{tool.title}</T>}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      {<T>{tool.description}</T>}
                    </p>
                  </div>
                </Link>);
        })}
          </div>
        </div>
      </div>
    </div>);
}
