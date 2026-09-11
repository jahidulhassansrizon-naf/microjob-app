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
  Calendar,
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

export default function DateFormatConverter() {
  const router = useRouter();

  // States
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Date parsing
  const dateObj = new Date(selectedDate || Date.now());
  const isValidDate = !isNaN(dateObj.getTime());

  // Format Helpers
  const day = isValidDate ? dateObj.getDate() : 1;
  const month = isValidDate ? dateObj.getMonth() : 0;
  const year = isValidDate ? dateObj.getFullYear() : 2026;

  // English formats
  const formattedISO = isValidDate ? selectedDate : "2026-09-11";
  const formattedDDMMYYYY = isValidDate
    ? `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`
    : "11/09/2026";
  const formattedMMDDYYYY = isValidDate
    ? `${String(month + 1).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`
    : "09/11/2026";
  const formattedDashed = isValidDate
    ? `${String(day).padStart(2, "0")}-${String(month + 1).padStart(2, "0")}-${year}`
    : "11-09-2026";

  const englishMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const englishMonthsShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const fullEnglishLong = isValidDate
    ? `${day}${day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th"} ${englishMonths[month]} ${year}`
    : "11th September 2026";

  const monthDYear = isValidDate
    ? `${englishMonths[month]} ${day}, ${year}`
    : "September 11, 2026";

  // Bengali numbers converter
  const toBanglaDigits = (str: string | number) => {
    const bnDigits: Record<string, string> = {
      "0": "০",
      "1": "১",
      "2": "২",
      "3": "৩",
      "4": "৪",
      "5": "৫",
      "6": "৬",
      "7": "৭",
      "8": "৮",
      "9": "৯",
    };
    return String(str).replace(/[0-9]/g, (d) => bnDigits[d]);
  };

  const banglaDigitsDate = isValidDate
    ? `${toBanglaDigits(String(day).padStart(2, "0"))}/${toBanglaDigits(String(month + 1).padStart(2, "0"))}/${toBanglaDigits(year)}`
    : "১১/০৯/২০২৬";

  const banglaMonths = [
    "বৈশাখ",
    "জ্যৈষ্ঠ",
    "আষাঢ়",
    "শ্রাবণ",
    "ভাদ্র",
    "আশ্বিন",
    "কার্তিক",
    "অগ্রহায়ণ",
    "পৌষ",
    "মাঘ",
    "ফাল্গুন",
    "চৈত্র",
  ];
  // Simple approximate Bangabda logic for demonstration
  const bnMonthIndex = (month + 8) % 12;
  const bnYear =
    month < 3 || (month === 3 && day < 14) ? year - 594 : year - 593;
  const bnDay = (day % 30) + 1;

  const banglaShort = `${toBanglaDigits(bnDay)} ভাদ্র ${toBanglaDigits(bnYear)}`;
  const banglaFull = `${toBanglaDigits(bnDay)} শে ${banglaMonths[bnMonthIndex]}, ${toBanglaDigits(bnYear)} বঙ্গাব্দ`;
  const banglaEnglishScript = `${day} Bhadra ${bnYear} BS`;

  // Hijri approximate calculation
  const hijriYear = Math.floor((year - 622) * (33 / 32));
  const hijriMonthNames = [
    "Muharram",
    "Safar",
    "Rabi' al-awwal",
    "Rabi' al-thani",
    "Jumada al-ula",
    "Jumada al-thani",
    "Rajab",
    "Sha'ban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qi'dah",
    "Dhu al-Hijjah",
  ];
  const hijriMonthNamesArabic = [
    "محرم",
    "صفر",
    "ربيع الأول",
    "ربيع الثاني",
    "جمادى الأولى",
    "جمادى الآخرة",
    "رجب",
    "شعبان",
    "رمضان",
    "شوال",
    "ذو القعدة",
    "ذو الحجة",
  ];
  const hijriDay = (day % 29) + 1;
  const hijriMonthIdx = month % 12;

  const hijriNumeric = `${toBanglaDigits(String(hijriDay).padStart(2, "0"))}/${toBanglaDigits(String(hijriMonthIdx + 1).padStart(2, "0"))}/${toBanglaDigits(hijriYear + 396)}`;
  const hijriEnglish = `${hijriDay} ${hijriMonthNames[hijriMonthIdx]} ${hijriYear + 396} AH`;
  const hijriArabic = `${hijriDay} ${hijriMonthNamesArabic[hijriMonthIdx]} ${hijriYear + 396} هـ`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
                Date Format Converter
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Calendar size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Date Format Converter
              </h1>
              <span className="bg-indigo-100 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Convert any date into Gregorian, Bengali (Bangabda), and Hijri
              formats instantly in your browser.
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
          {/* LEFT COLUMN: PICK A DATE */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 tracking-wide uppercase">
                  Pick a date
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-700 block">
                  Choose a date
                </span>
                <p className="text-[10px] text-gray-400">
                  Select a date to see formats for all three calendar systems.
                </p>
                <div className="relative pt-1">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SELECTED DATE PREVIEW */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Selected date
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    Done
                  </span>
                </div>

                <div className="pt-16 pb-16 flex flex-col items-center justify-center text-center">
                  <p className="text-xs font-semibold text-gray-400 mb-2">
                    Selected date
                  </p>
                  <h2 className="text-2xl font-bold text-indigo-600 tracking-tight">
                    {formattedISO}
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-2">
                    Scroll below to copy Gregorian, Bangla, and Hijri formats.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: GREGORIAN / INTERNATIONAL FORMATS */}
        <div className="bg-amber-50/30 border border-amber-200/60 rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="border-b border-amber-200/40 pb-2">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
              Gregorian / International formats
            </h3>
            <p className="text-[10px] text-amber-700/80 font-medium">
              Standard date formats used worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "DD/MM/YYYY", val: formattedDDMMYYYY, key: "g1" },
              { label: "DD-MM-YYYY", val: formattedDashed, key: "g2" },
              { label: "YYYY-MM-DD (ISO 8601)", val: formattedISO, key: "g3" },
              { label: "MM/DD/YYYY (US)", val: formattedMMDDYYYY, key: "g4" },
              {
                label: "D MONTH YYYY (ENGLISH)",
                val: fullEnglishLong,
                key: "g5",
              },
              { label: "MONTH D, YYYY", val: monthDYear, key: "g6" },
              {
                label: "DD/MM/YYYY (BENGALI DIGITS)",
                val: banglaDigitsDate,
                key: "g7",
              },
              {
                label: "FULL BENGALI DATE",
                val: `${toBanglaDigits(day)} সেপ্টেম্বর, ${toBanglaDigits(year)} খ্রিস্টাব্দ`,
                key: "g8",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200/80 rounded-xl p-3 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                    {item.label}
                  </p>
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {item.val}
                  </p>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => handleCopy(item.val, item.key)}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    {copiedKey === item.key ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                    <span>{copiedKey === item.key ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: BENGALI CALENDAR (BANGABDA) */}
        <div className="bg-emerald-50/30 border border-emerald-200/60 rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="border-b border-emerald-200/40 pb-2">
            <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
              Bengali calendar (Bangabda)
            </h3>
            <p className="text-[10px] text-emerald-700/80 font-medium">
              Revised Bangla calendar as used in Bangladesh
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "SHORT", val: banglaShort, key: "b1" },
              { label: "FULL BANGABDA", val: banglaFull, key: "b2" },
              {
                label: "ENGLISH (BANGABDA)",
                val: banglaEnglishScript,
                key: "b3",
              },
              {
                label: "NUMERIC",
                val: `${toBanglaDigits(String(bnDay).padStart(2, "0"))}/${toBanglaDigits(String(bnMonthIndex + 1).padStart(2, "0"))}/${toBanglaDigits(bnYear)}`,
                key: "b4",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200/80 rounded-xl p-3 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                    {item.label}
                  </p>
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {item.val}
                  </p>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => handleCopy(item.val, item.key)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    {copiedKey === item.key ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                    <span>{copiedKey === item.key ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: ISLAMIC / HIJRI CALENDAR */}
        <div className="bg-indigo-50/30 border border-indigo-200/60 rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="border-b border-indigo-200/40 pb-2">
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
              Islamic / Hijri calendar
            </h3>
            <p className="text-[10px] text-indigo-700/80 font-medium">
              Umm al-Qura Hijri calendar — local moon sighting can differ by a
              day
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "ARABIC", val: hijriArabic, key: "h1" },
              {
                label: "BENGALI HIJRI",
                val: `${toBanglaDigits(hijriDay)} ${hijriMonthNames[hijriMonthIdx]}, ${toBanglaDigits(hijriYear + 396)} হিজরি`,
                key: "h2",
              },
              { label: "ENGLISH (AH)", val: hijriEnglish, key: "h3" },
              { label: "NUMERIC", val: hijriNumeric, key: "h4" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200/80 rounded-xl p-3 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                    {item.label}
                  </p>
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {item.val}
                  </p>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => handleCopy(item.val, item.key)}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    {copiedKey === item.key ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                    <span>{copiedKey === item.key ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRIVACY NOTICE */}
        <div className="bg-indigo-50/60 border border-indigo-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-indigo-800 font-medium">
          <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
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
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>How to use</span>
            </div>
            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse && (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>1. Pick any date from the date picker box on the left.</p>
              <p>
                2. View instant conversion across international Gregorian
                formats, Bengali Bangabda, and Islamic Hijri calendars.
              </p>
              <p>
                3. Click the &quot;Copy&quot; button next to any format card to
                copy it directly to your clipboard.
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
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
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
