"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toBangla } from "@subhesadek/avro-phonetic";
import { ArrowLeft, Star, Share, Copy, Check, ChevronDown, ChevronUp, Keyboard, ArrowLeftRight, RotateCcw, ShieldCheck, Languages, ScanText, } from "lucide-react";

// Page-specific English → Bangla UI translations. User-entered and converted
// content is deliberately left untouched.
const BANGLISH_TYPING_BN: Record<string, string> = {
  "Go back": "ফিরে যান",
  "Sohoj Tools": "সহজ টুলস",
  "Text Tools": "লেখার সরঞ্জাম",
  "Banglish Typing": "বাংলিশ টাইপিং",
  "Free": "বিনামূল্যে",
  "Type Bangla with an English keyboard — live Banglish to Bangla and Bangla to Banglish conversion in your browser.": "ইংরেজি কিবোর্ডে লিখুন—ব্রাউজারেই সঙ্গে সঙ্গে বাংলিশ থেকে বাংলা এবং বাংলা থেকে বাংলিশে রূপান্তর করুন।",
  "Add to favorites": "প্রিয় তালিকায় যোগ করুন",
  "Remove from favorites": "প্রিয় তালিকা থেকে সরান",
  "Share this tool": "এই টুলটি শেয়ার করুন",
  "Type here": "এখানে লিখুন",
  "Conversion mode": "রূপান্তরের ধরন",
  "Banglish to Bangla": "বাংলিশ থেকে বাংলা",
  "Bangla to Banglish": "বাংলা থেকে বাংলিশ",
  "Banglish — type here": "বাংলিশ—এখানে লিখুন",
  "Bangla — paste here": "বাংলা—এখানে লিখুন বা পেস্ট করুন",
  "Type in Banglish using English letters...": "ইংরেজি অক্ষরে বাংলিশ লিখুন...",
  "Write or paste Bangla text here...": "এখানে বাংলা লিখুন বা পেস্ট করুন...",
  "Banglish input text": "বাংলিশ লেখার ঘর",
  "Bangla input text": "বাংলা লেখার ঘর",
  "chars •": "অক্ষর •",
  "words": "শব্দ",
  "Converted text": "রূপান্তরিত লেখা",
  "Ready ·": "প্রস্তুত ·",
  "characters": "অক্ষর",
  "Empty": "খালি",
  "Start typing to convert": "রূপান্তর দেখতে লেখা শুরু করুন",
  "Choose a mode, type in the left panel, and the converted text appears instantly.": "রূপান্তরের ধরন বেছে নিয়ে বাঁ পাশের ঘরে লিখুন—রূপান্তরিত লেখা সঙ্গে সঙ্গেই দেখা যাবে।",
  "Copied!": "কপি হয়েছে!",
  "Copy Converted Text": "রূপান্তরিত লেখা কপি করুন",
  "Quick reference": "দ্রুত নির্দেশিকা",
  "This tool supports pure Banglish. Examples: sonar &rarr; সোনার, amil valo achi &rarr; আমি ভালো আছি. Common words like onek and ekhon work directly.": "এই টুলে সরাসরি বাংলিশ লিখে বাংলা করা যায়। উদাহরণ: sonar → সোনার, amil valo achi → আমি ভালো আছি। onek ও ekhon-এর মতো সাধারণ শব্দও সরাসরি কাজ করে।",
  "Converted": "রূপান্তর সম্পন্ন",
  "Text ready to convert": "রূপান্তরের জন্য লেখা প্রস্তুত",
  "Start typing in the box above": "ওপরের ঘরে লেখা শুরু করুন",
  "Reset": "মুছে ফেলুন",
  "Convert text": "রূপান্তর করুন",
  "Couldn't convert this text. Please check the input.": "লেখাটি রূপান্তর করা যায়নি। ইনপুটটি পরীক্ষা করুন।",
  "Your files are processed in the browser — they are not uploaded to any server.": "আপনার লেখা ব্রাউজারেই প্রক্রিয়াকরণ করা হয়—কোনো সার্ভারে আপলোড করা হয় না।",
  "How to use": "ব্যবহারের নিয়ম",
  "1. Select the conversion mode (Banglish to Bangla or Bangla to Banglish).": "১. রূপান্তরের ধরন বেছে নিন (বাংলিশ থেকে বাংলা অথবা বাংলা থেকে বাংলিশ)।",
  "2. Type phonetically in the input text area using your English keyboard.": "২. ইনপুট ঘরে ইংরেজি কিবোর্ড ব্যবহার করে উচ্চারণ অনুযায়ী লিখুন।",
  "3. Review the live converted Bangla or Banglish output on the right.": "৩. ডান পাশের ঘরে সঙ্গে সঙ্গে তৈরি হওয়া বাংলা বা বাংলিশ ফলাফল দেখুন।",
  "4. Use the Quick Reference grid below for specific conjunct letters.": "৪. যুক্তাক্ষরের নির্দিষ্ট রূপ দেখতে নিচের দ্রুত নির্দেশিকা ব্যবহার করুন।",
  "Tools in the same category": "একই ধরনের অন্যান্য টুল",
  "Bijoy ↔ Unicode": "বিজয় ↔ ইউনিকোড",
  "Convert Bangla text between Bijoy ANSI and Unicode directly in your browser.": "ব্রাউজারেই বাংলা লেখা বিজয় ANSI ও ইউনিকোডের মধ্যে রূপান্তর করুন।",
  "Image to Text": "ছবি থেকে লেখা",
  "Extract text from images with OCR in your browser — supports English and Bengali.": "ব্রাউজারেই OCR প্রযুক্তি ব্যবহার করে ছবি থেকে লেখা বের করুন—ইংরেজি ও বাংলা দুটোই সমর্থিত।",
};

function normalizeBanglishTypingText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function translateBanglishTypingText(value: string, locale: string | undefined): string {
  if (!locale || !locale.toLowerCase().startsWith("bn")) return value;
  const normalized = normalizeBanglishTypingText(value);
  if (!normalized) return value;
  const translated = BANGLISH_TYPING_BN[normalized];
  if (!translated) return value;
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function BanglishTypingText({ children, locale }: { children: React.ReactNode; locale: string | undefined }) {
  if (typeof children !== "string") return <>{children}</>;
  return <>{translateBanglishTypingText(children, locale)}</>;
}

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
    const { locale } = useSohozI18n();
    const BL = useCallback((value: string) => translateBanglishTypingText(value, locale), [locale]);
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
    return (<div className="relative isolate min-h-screen w-full text-[#3B2F1E] font-sans pb-16 page-font">
      <style>{`
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
        .page-font .scroll { scrollbar-width: thin; scrollbar-color: #F87171 transparent; }
        .page-font .scroll::-webkit-scrollbar { width: 12px; }
        .page-font .scroll::-webkit-scrollbar-track { background: rgba(148, 113, 67, 0.12); border-radius: 999px; margin: 10px 0; }
        .page-font .scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #F87171, #DC2626); border-radius: 999px; border: 3px solid #F2E8D2; min-height: 48px; }
        .page-font .scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #EF4444, #B91C1C); }

      `}</style>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE]" />
      <div className="relative w-full space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-[#7A6A50] font-medium mb-2">
              <button onClick={() => router.back()} className="p-1 hover:bg-[#EFE3C8] rounded-md transition-colors text-[#3B2F1E] flex items-center justify-center -ml-1 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40" title={BL("Go back")}>
                <ArrowLeft size={16}/>
              </button>
              <Link href="/sohoj-tools" className="hover:text-[#3B2F1E]"><BanglishTypingText locale={locale}>{"Sohoj Tools\n              "}</BanglishTypingText></Link>
              <span><BanglishTypingText locale={locale}>{"/"}</BanglishTypingText></span>
              <span className="hover:text-[#3B2F1E] cursor-pointer"><BanglishTypingText locale={locale}>{"Text Tools\n              "}</BanglishTypingText></span>
              <span><BanglishTypingText locale={locale}>{"/"}</BanglishTypingText></span>
              <span className="text-[#3B2F1E] font-semibold"><BanglishTypingText locale={locale}>{"Banglish Typing\n              "}</BanglishTypingText></span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#F6D9A8] text-[#DC2626] rounded-lg flex items-center justify-center font-bold shadow-sm">
                <Keyboard size={18}/>
              </div>
              <h1 className="text-2xl font-bold text-[#3B2F1E] tracking-tight"><BanglishTypingText locale={locale}>{"Banglish Typing\n              "}</BanglishTypingText></h1>
              <span className="bg-emerald-100 text-emerald-700 text-[13px] font-bold px-2 py-0.5 rounded-full"><BanglishTypingText locale={locale}>{"Free\n              "}</BanglishTypingText></span>
            </div>
            <p className="text-sm text-[#7A6A50] font-medium mt-1"><BanglishTypingText locale={locale}>{"Type Bangla with an English keyboard \u2014 live Banglish to Bangla and\n              Bangla to Banglish conversion in your browser.\n            "}</BanglishTypingText></p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button onClick={() => setIsFavorite(!isFavorite)} title={BL(isFavorite ? "Remove from favorites" : "Add to favorites")} aria-label={BL(isFavorite ? "Remove from favorites" : "Add to favorites")} className="p-2 bg-[#FBF6E8] rounded-lg border border-[#E3D6B8] text-[#7A6A50] hover:text-[#DC2626] hover:border-[#DC2626] transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 shadow-sm">
              <Star size={16} className={isFavorite ? "fill-[#DC2626] text-[#DC2626]" : ""}/>
            </button>
            <button title={BL("Share this tool")} aria-label={BL("Share this tool")} className="p-2 bg-[#FBF6E8] rounded-lg border border-[#E3D6B8] text-[#7A6A50] hover:text-[#3B2F1E] transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 shadow-sm">
              <Share size={16}/>
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: CONTROLS & INPUT */}
          <div className="lg:col-span-4 space-y-4">
            {/* Conversion Mode Card */}
            <div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 shadow-sm space-y-3">
              <span className="text-sm font-bold text-[#3B2F1E] tracking-wide uppercase block"><BanglishTypingText locale={locale}>{"Type here\n              "}</BanglishTypingText></span>

              <div className="space-y-2">
                <span className="text-[13px] font-semibold text-[#7A6A50] block"><BanglishTypingText locale={locale}>{"Conversion mode\n                "}</BanglishTypingText></span>

                <div className="space-y-2">
                  <button onClick={() => handleModeChange("banglishToBangla")} className={`w-full py-2.5 px-3 rounded-xl border text-sm font-bold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 flex items-center justify-center gap-2 ${mode === "banglishToBangla"
            ? "border-[#DC2626] bg-[#F6D9A8] text-[#DC2626] ring-2 ring-[#DC2626]/40"
            : "border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#F6EEDB]"}`}>
                    <ArrowLeftRight size={14}/>
                    <span><BanglishTypingText locale={locale}>{"Banglish to Bangla"}</BanglishTypingText></span>
                  </button>

                  <button onClick={() => handleModeChange("banglaToBanglish")} className={`w-full py-2.5 px-3 rounded-xl border text-sm font-bold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 flex items-center justify-center gap-2 ${mode === "banglaToBanglish"
            ? "border-[#DC2626] bg-[#F6D9A8] text-[#DC2626] ring-2 ring-[#DC2626]/40"
            : "border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#F6EEDB]"}`}>
                    <ArrowLeftRight size={14}/>
                    <span><BanglishTypingText locale={locale}>{"Bangla to Banglish"}</BanglishTypingText></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Input Text Box */}
            <div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-[#3B2F1E] tracking-wide uppercase">
                  {mode === "banglishToBangla"
        ? <BanglishTypingText locale={locale}>{"Banglish — type here"}</BanglishTypingText> : <BanglishTypingText locale={locale}>{"Bangla — paste here"}</BanglishTypingText>}
                </span>
              </div>

              <textarea rows={9} aria-label={BL(mode === "banglishToBangla" ? "Banglish input text" : "Bangla input text")} placeholder={mode === "banglishToBangla"
            ? BL("Type in Banglish using English letters...")
            : BL("Write or paste Bangla text here...")} value={inputText} onChange={(e) => handleConversion(e.target.value)} className="w-full bg-[#FBF6E8] border border-[#E3D6B8] rounded-xl p-3 text-sm font-medium text-[#3B2F1E] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] placeholder:text-[#B0A080] leading-relaxed resize-none transition-colors duration-200 focus-visible:outline-none"/>

              <div className="flex items-center justify-between">
                {conversionError ? (<span className="text-[12px] font-semibold text-red-500">
                    {BL(conversionError)}
                  </span>) : (<span />)}
                <span className="text-[12px] font-medium text-[#7A6A50]">
                  {inputText.length}<BanglishTypingText locale={locale}>{"chars \u2022"}</BanglishTypingText>{<BanglishTypingText locale={locale}>{" "}</BanglishTypingText>}
                  {inputText.trim() ? inputText.trim().split(/\s+/).length : 0}{<BanglishTypingText locale={locale}>{" "}</BanglishTypingText>}<BanglishTypingText locale={locale}>{"words\n                "}</BanglishTypingText></span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: OUTPUT DISPLAY */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E3D6B8]/70">
                  <span className="text-sm font-bold text-[#3B2F1E] uppercase tracking-wider"><BanglishTypingText locale={locale}>{"Converted text\n                  "}</BanglishTypingText></span>
                  {convertedText ? (<span className="text-[13px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md"><BanglishTypingText locale={locale}>{"Ready \u00B7 "}</BanglishTypingText>{convertedText.length}<BanglishTypingText locale={locale}>{"characters\n                    "}</BanglishTypingText></span>) : (<span className="text-[13px] font-semibold text-[#7A6A50] bg-[#F3E9D2] px-2 py-0.5 rounded-md"><BanglishTypingText locale={locale}>{"Empty\n                    "}</BanglishTypingText></span>)}
                </div>

                <div className="pt-4">
                  {!convertedText ? (<div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-12 h-12 bg-[#FEE9E9] text-[#DC2626] rounded-xl flex items-center justify-center mb-3">
                        <Keyboard size={24}/>
                      </div>
                      <h3 className="text-sm font-bold text-[#3B2F1E] mb-1"><BanglishTypingText locale={locale}>{"Start typing to convert\n                      "}</BanglishTypingText></h3>
                      <p className="text-[13px] text-[#7A6A50] max-w-xs leading-relaxed"><BanglishTypingText locale={locale}>{"Choose a mode, type in the left panel, and the converted\n                        text appears instantly.\n                      "}</BanglishTypingText></p>
                    </div>) : (<div className="p-3 bg-[#FBF6E8] border border-[#E3D6B8]/70 rounded-xl text-sm text-[#3B2F1E] leading-relaxed min-h-[220px] whitespace-pre-wrap break-words font-medium">
                      {convertedText}
                    </div>)}
                </div>
              </div>

              {convertedText && (<div className="pt-4 border-t border-[#E3D6B8]/70 flex justify-end">
                  <button onClick={handleCopy} className="px-4 py-2 bg-[#D42020] hover:bg-[#AE1717] text-white font-bold text-sm rounded-xl transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 flex items-center gap-2 shadow-sm">
                    {copied ? <Check size={14}/> : <Copy size={14}/>}
                    <span>{copied ? <BanglishTypingText locale={locale}>{"Copied!"}</BanglishTypingText> : <BanglishTypingText locale={locale}>{"Copy Converted Text"}</BanglishTypingText>}</span>
                  </button>
                </div>)}
            </div>
          </div>
        </div>

        {/* QUICK REFERENCE SECTION */}
        <div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-[#3B2F1E] tracking-wide uppercase"><BanglishTypingText locale={locale}>{"Quick reference\n          "}</BanglishTypingText></h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {quickReferences.map((ref, idx) => (<div key={idx} className="bg-[#F6EEDB] border border-[#E3D6B8]/70 rounded-xl p-2 flex items-center justify-between text-[13px]">
                <span className="text-[#3B2F1E] font-semibold truncate pr-1">
                  {ref.en}
                </span>
                <span className="text-[#3B2F1E] font-bold">{ref.bn}</span>
              </div>))}
          </div>
          <p className="text-[13px] text-[#7A6A50] pt-1"><BanglishTypingText locale={locale}>{"This tool supports pure Banglish. Examples: sonar &rarr; \u09B8\u09CB\u09A8\u09BE\u09B0, amil\n            valo achi &rarr; \u0986\u09AE\u09BF \u09AD\u09BE\u09B2\u09CB \u0986\u099B\u09BF. Common words like onek and ekhon work\n            directly.\n          "}</BanglishTypingText></p>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[#7A6A50]">
            <span className={`w-2 h-2 rounded-full ${conversionError
            ? "bg-red-400"
            : convertedText
                ? "bg-emerald-400"
                : "bg-[#DC2626]"}`}></span>
            <span>
              {conversionError
            ? BL(conversionError)
            : convertedText
                ? BL("Converted")
                : inputText
                    ? BL("Text ready to convert")
                    : BL("Start typing in the box above")}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button onClick={handleReset} className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#F3E9D2] hover:bg-[#EFE3C8] text-[#3B2F1E] font-bold text-sm transition-colors duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 flex items-center justify-center gap-1.5">
              <RotateCcw size={13}/>
              <span><BanglishTypingText locale={locale}>{"Reset"}</BanglishTypingText></span>
            </button>

            <button onClick={handleConvertClick} disabled={!inputText.trim()} className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-[#D42020] hover:bg-[#AE1717] disabled:bg-[#E3D6B8] disabled:text-[#7A6A50] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5 shadow-sm">
              <span><BanglishTypingText locale={locale}>{"Convert text"}</BanglishTypingText></span>
            </button>
          </div>
        </div>

        {/* PRIVACY NOTICE */}
        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-sm text-emerald-800 font-medium">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0"/>
          <span><BanglishTypingText locale={locale}>{"Your files are processed in the browser \u2014 they are not uploaded to\n            any server.\n          "}</BanglishTypingText></span>
        </div>

        {/* HOW TO USE DROPDOWN */}
        <div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl overflow-hidden shadow-sm">
          <button onClick={() => setShowHowToUse(!showHowToUse)} className="w-full p-4 text-left flex items-center justify-between font-bold text-sm text-[#3B2F1E] hover:bg-[#EFE3C8] transition-colors duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D42020]"></span>
              <span><BanglishTypingText locale={locale}>{"How to use"}</BanglishTypingText></span>
            </div>
            {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>

          {showHowToUse && (<div className="p-4 pt-0 text-sm text-[#5A4A32] space-y-2 border-t border-[#E3D6B8]/70 font-medium leading-relaxed">
              <p><BanglishTypingText locale={locale}>{"1. Select the conversion mode (Banglish to Bangla or Bangla to\n                Banglish).\n              "}</BanglishTypingText></p>
              <p><BanglishTypingText locale={locale}>{"2. Type phonetically in the input text area using your English\n                keyboard.\n              "}</BanglishTypingText></p>
              <p><BanglishTypingText locale={locale}>{"3. Review the live converted Bangla or Banglish output on the\n                right.\n              "}</BanglishTypingText></p>
              <p><BanglishTypingText locale={locale}>{"4. Use the Quick Reference grid below for specific conjunct\n                letters.\n              "}</BanglishTypingText></p>
            </div>)}
        </div>

        {/* TOOLS IN THE SAME CATEGORY */}
        <div className="pt-4 space-y-3">
          <h2 className="text-base font-bold text-[#3B2F1E] tracking-tight"><BanglishTypingText locale={locale}>{"Tools in the same category\n          "}</BanglishTypingText></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool, idx) => {
            const ToolIcon = tool.icon;
            return (<Link key={idx} href={tool.href} className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#DC2626]/50 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40">
                  <div>
                    <div className="w-9 h-9 bg-[#FEE9E9] text-[#DC2626] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#FEE9E9] transition-colors duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40">
                      <ToolIcon size={18}/>
                    </div>
                    <h3 className="text-sm font-bold text-[#3B2F1E] mb-1 group-hover:text-[#DC2626] transition-colors duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40">
                      {<BanglishTypingText locale={locale}>{tool.title}</BanglishTypingText>}
                    </h3>
                    <p className="text-[13px] text-[#7A6A50] font-medium leading-relaxed">
                      {<BanglishTypingText locale={locale}>{tool.description}</BanglishTypingText>}
                    </p>
                  </div>
                </Link>);
        })}
          </div>
        </div>
      </div>
    </div>);
}
