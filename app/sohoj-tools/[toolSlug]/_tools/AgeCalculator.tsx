"use client";
import { T as BaseT, useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Share, Calculator, FileText, CreditCard, ChevronDown, ChevronUp, Cake, Users, Copy, Check, AlertCircle, CheckCircle2, Clock3, } from "lucide-react";
// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------
const relatedTools = [
    {
        title: "Family Card Form",
        description: "Fill in your details on the left — see a live application letter on the right and download as PDF.",
        href: "/sohoj-tools/family-card-form",
        icon: CreditCard,
    },
    {
        title: "Voter Migration Form",
        description: "Fill in your details on the left — see a live Form-13 on the right and download it as PDF.",
        href: "/sohoj-tools/voter-migration-form",
        icon: FileText,
    },
];
const MONTHS = [
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
// Milestones relevant to everyday life in Bangladesh — ties this tool to the
// same real-world paperwork the neighbouring tools (NID / voter / family
// card) are for, instead of only showing an abstract number.
const MILESTONES: {
    label: string;
    age: number;
}[] = [
    { label: "Eligible for NID & voter registration", age: 18 },
    { label: "Legal driving age (non-heavy vehicle)", age: 18 },
    { label: "Legal marriage age (women)", age: 18 },
    { label: "Legal marriage age (men)", age: 21 },
    { label: "Standard government retirement age", age: 59 },
];
const AGE_CALCULATOR_BN: Record<string, string> = {
    "Sohoj Tools": "সহজ টুলস",
    "General Tools": "সাধারণ টুলস",
    "Age Calculator": "বয়স গণনা",
    "Free": "বিনামূল্যে",
    "Pick your date of birth from the dropdowns — your exact age appears instantly, no typing needed.": "ড্রপডাউন থেকে জন্মতারিখ বেছে নিন—কিছু টাইপ করতে হবে না, সঙ্গে সঙ্গেই সঠিক বয়স দেখতে পাবেন।",
    "Day": "দিন",
    "Month": "মাস",
    "Year": "বছর",
    "Eligible for NID & voter registration": "এনআইডি ও ভোটার নিবন্ধনের উপযুক্ত বয়স",
    "Legal driving age (non-heavy vehicle)": "হালকা যানবাহন চালানোর আইনগত বয়স",
    "Legal marriage age (women)": "নারীদের আইনগত বিয়ের বয়স",
    "Legal marriage age (men)": "পুরুষদের আইনগত বিয়ের বয়স",
    "Standard government retirement age": "সরকারি চাকরি থেকে অবসরের প্রচলিত বয়স",
    "Infant": "শিশু",
    "Toddler": "হাঁটতে শেখা ছোট শিশু",
    "Child": "শিশু-কিশোর",
    "Teenager": "কিশোর-কিশোরী",
    "Adult": "প্রাপ্তবয়স্ক",
    "Senior citizen": "জ্যেষ্ঠ নাগরিক",
    "Go back": "আগের পাতায় যান",
    "Save to favourites": "পছন্দের তালিকায় রাখুন",
    "Share this tool": "এই টুল শেয়ার করুন",
    "Enter dates": "তারিখ দিন",
    "Date of birth": "জন্মতারিখ",
    "Choose the day, month and year — cannot be a future date": "দিন, মাস ও বছর বেছে নিন—ভবিষ্যতের তারিখ দেওয়া যাবে না।",
    "Calculate age on a different date": "অন্য একটি তারিখ অনুযায়ী বয়স গণনা করুন",
    "Off = calculate as of today": "বন্ধ থাকলে আজকের তারিখ অনুযায়ী বয়স গণনা হবে",
    "Compare with another person": "অন্য একজনের সঙ্গে বয়সের তুলনা করুন",
    "Enter their birth date to see who is older": "কে বেশি বয়সী তা জানতে অন্য ব্যক্তির জন্মতারিখ দিন।",
    "That date doesn't exist.": "এই তারিখটি সঠিক নয়।",
    "That date can't be in the future.": "তারিখটি ভবিষ্যতের হতে পারে না।",
    "That date of birth doesn't exist. Please check the day and month.": "এই জন্মতারিখটি সঠিক নয়। দিন ও মাস ঠিক আছে কি না দেখুন।",
    "Date of birth can't be in the future.": "জন্মতারিখ ভবিষ্যতের হতে পারে না।",
    "That date doesn't exist. Please check the day and month.": "এই তারিখটি সঠিক নয়। দিন ও মাস ঠিক আছে কি না দেখুন।",
    "This date is earlier than the date of birth — pick a later date.": "এই তারিখটি জন্মতারিখের আগের। অনুগ্রহ করে এর পরের কোনো তারিখ বেছে নিন।",
    "Your age": "আপনার বয়স",
    "Calculated": "গণনা সম্পন্ন",
    "Empty": "ফাঁকা",
    "Exact age today": "আজকের হিসাবে সঠিক বয়স",
    "Years": "বছর",
    "Months": "মাস",
    "Days": "দিন",
    "Total Months": "মোট মাস",
    "Total Weeks": "মোট সপ্তাহ",
    "Total Days": "মোট দিন",
    "Milestones": "বয়সের গুরুত্বপূর্ণ ধাপ",
    "Both people are exactly the same age.": "দুজনের বয়স একদম সমান।",
    "The first date of birth is": "প্রথম ব্যক্তির জন্মতারিখ",
    "older": "বয়সে বড়",
    "younger": "বয়সে ছোট",
    "than the second.": "দ্বিতীয় ব্যক্তির তুলনায়।",
    "Copied": "কপি করা হয়েছে",
    "Copy result": "ফলাফল কপি করুন",
    "Choose a date of birth on the left to see the age instantly.": "সঙ্গে সঙ্গে বয়স দেখতে বাঁ পাশ থেকে জন্মতারিখ বেছে নিন।",
    "No typing required — just pick the day, month and year from the dropdown lists.": "কিছু টাইপ করতে হবে না—ড্রপডাউন তালিকা থেকে শুধু দিন, মাস ও বছর বেছে নিন।",
    "Everything is calculated in your browser — nothing is uploaded to any server.": "সব হিসাব আপনার ব্রাউজারেই হয়—কোনো তথ্য সার্ভারে আপলোড করা হয় না।",
    "Reset": "নতুন করে শুরু করুন",
    "Print / Save": "প্রিন্ট / সংরক্ষণ",
    "How to use": "ব্যবহারের নিয়ম",
    "1. Pick the day, month and year of birth from the three dropdown lists — no typing needed.": "১. তিনটি ড্রপডাউন তালিকা থেকে জন্মতারিখের দিন, মাস ও বছর বেছে নিন—কিছু টাইপ করতে হবে না।",
    "2. Your exact age, next birthday and total days lived appear immediately on the right.": "২. ডান পাশে সঙ্গে সঙ্গেই আপনার সঠিক বয়স, পরবর্তী জন্মদিন এবং মোট কত দিন বেঁচেছেন তা দেখা যাবে।",
    "3. Turn on \"Calculate age on a different date\" to see the age as of a past or future date.": "৩. অতীত বা ভবিষ্যতের কোনো নির্দিষ্ট তারিখে বয়স জানতে ‘অন্য একটি তারিখ অনুযায়ী বয়স গণনা করুন’ চালু করুন।",
    "4. Turn on \"Compare with another person\" to see who is older and by how much.": "৪. কে কতটা বড় তা জানতে ‘অন্য একজনের সঙ্গে বয়সের তুলনা করুন’ চালু করুন।",
    "Tools in the same category": "একই বিভাগের টুলস",
    "Family Card Form": "পারিবারিক কার্ডের ফরম",
    "Fill in your details on the left — see a live application letter on the right and download as PDF.": "বাঁ পাশে তথ্য পূরণ করুন—ডান পাশে আবেদনপত্রের পূর্বরূপ দেখুন এবং PDF হিসেবে ডাউনলোড করুন।",
    "Voter Migration Form": "ভোটার স্থানান্তর ফরম",
    "Fill in your details on the left — see a live Form-13 on the right and download it as PDF.": "বাঁ পাশে তথ্য পূরণ করুন—ডান পাশে ফরম-১৩-এর পূর্বরূপ দেখুন এবং PDF হিসেবে ডাউনলোড করুন।",
    "Birthday today — turning": "আজ জন্মদিন—বয়স হচ্ছে",
    "Turns": "বছর পূর্ণ হবে",
    "In": "বাকি",
    "Since": "তারিখ:",
    "Age on": "এই তারিখে বয়স:",
};

const AGE_MONTHS_BN = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

function normalizeAgeText(text: string): string {
    return text.replace(/\s+/g, " ").trim();
}

function formatAgeNumber(value: number, locale: string): string {
    return value.toLocaleString(locale === "bn" ? "bn-BD" : "en-GB");
}

function translateAgeText(text: string): string | undefined {
    const normalized = normalizeAgeText(text);
    const exact = AGE_CALCULATOR_BN[normalized];
    if (exact) return exact;
    if (normalized.startsWith("Age on ")) return `এই তারিখে বয়স: ${normalized.slice(7)}`;
    if (normalized.startsWith("Since ")) return `তারিখ: ${normalized.slice(6)}`;
    if (normalized.startsWith("In ")) return `বাকি ${normalized.slice(3)}`;
    return undefined;
}

function AgeText({ children }: { children: React.ReactNode }) {
    const { locale } = useSohozI18n();
    if (locale === "bn" && typeof children === "string") {
        const translated = translateAgeText(children);
        if (translated) return <>{translated}</>;
    }
    return <BaseT>{children}</BaseT>;
}

// ---------------------------------------------------------------------------
// Small date helpers
// ---------------------------------------------------------------------------
type YMD = {
    years: number;
    months: number;
    days: number;
};
function daysInMonth(month1to12: number, year: number) {
    return new Date(year, month1to12, 0).getDate();
}
function isValidDate(day: number, month1to12: number, year: number) {
    if (!day || !month1to12 || !year)
        return false;
    if (year < 1000 || year > 9999)
        return false;
    return day >= 1 && day <= daysInMonth(month1to12, year);
}
function makeDate(day: number, month1to12: number, year: number) {
    return new Date(year, month1to12 - 1, day);
}
function stripTime(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
/** Calendar-accurate difference between two dates, `to` assumed >= `from`. */
function diffYMD(from: Date, to: Date): YMD & {
    totalDays: number;
    totalWeeks: number;
    totalMonths: number;
} {
    let years = to.getFullYear() - from.getFullYear();
    let months = to.getMonth() - from.getMonth();
    let days = to.getDate() - from.getDate();
    if (days < 0) {
        months -= 1;
        const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years -= 1;
        months += 12;
    }
    const totalDays = Math.round((to.getTime() - from.getTime()) / 86400000);
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;
    return { years, months, days, totalDays, totalWeeks, totalMonths };
}
function formatDate(d: Date, locale: string = "en") {
    return d.toLocaleDateString(locale === "bn" ? "bn-BD-u-ca-gregory" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}
function lifeStage(years: number) {
    if (years < 2)
        return "Infant";
    if (years < 4)
        return "Toddler";
    if (years < 13)
        return "Child";
    if (years < 20)
        return "Teenager";
    if (years < 60)
        return "Adult";
    return "Senior citizen";
}
function plural(n: number, unit: string, locale: string = "en") {
    if (locale === "bn") {
        const units: Record<string, string> = { year: "বছর", month: "মাস", day: "দিন" };
        return `${formatAgeNumber(n, locale)} ${units[unit] ?? unit}`;
    }
    return `${n} ${unit}${n === 1 ? "" : "s"}`;
}
function shortDuration(ymd: YMD, locale: string = "en") {
    const parts: string[] = [];
    if (ymd.years)
        parts.push(plural(ymd.years, "year", locale));
    if (ymd.months)
        parts.push(plural(ymd.months, "month", locale));
    if (ymd.days || parts.length === 0)
        parts.push(plural(ymd.days, "day", locale));
    return parts.join(", ");
}
// ---------------------------------------------------------------------------
// Reusable Day / Month / Year picker — plain, labelled dropdowns instead of
// a native <input type="date">, so there's no mm/dd vs dd/mm ambiguity and
// nothing to type. Works the same for anyone, regardless of reading level.
// ---------------------------------------------------------------------------
function DatePicker({ idPrefix, day, month, year, onDay, onMonth, onYear, yearFrom, yearTo, }: {
    idPrefix: string;
    day: string;
    month: string;
    year: string;
    onDay: (v: string) => void;
    onMonth: (v: string) => void;
    onYear: (v: string) => void;
    yearFrom: number;
    yearTo: number;
}) {
    const { locale } = useSohozI18n();
    const maxDay = month && year ? daysInMonth(Number(month), Number(year)) : 31;
    const days = Array.from({ length: maxDay }, (_, i) => i + 1);
    const years: number[] = [];
    if (yearFrom <= yearTo) {
        for (let y = yearTo; y >= yearFrom; y--)
            years.push(y);
    }
    else {
        for (let y = yearFrom; y >= yearTo; y--)
            years.push(y);
    }
    const selectClass = "w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB] cursor-pointer";
    return (<div className="grid grid-cols-3 gap-2">
      <div>
        <label htmlFor={`${idPrefix}-day`} className="sr-only"><AgeText>{"Day\n        "}</AgeText></label>
        <select id={`${idPrefix}-day`} value={day} onChange={(e) => onDay(e.target.value)} className={selectClass}>
          <option value=""><AgeText>{"Day"}</AgeText></option>
          {days.map((d) => (<option key={d} value={d}>
              {formatAgeNumber(d, locale)}
            </option>))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-month`} className="sr-only"><AgeText>{"Month\n        "}</AgeText></label>
        <select id={`${idPrefix}-month`} value={month} onChange={(e) => onMonth(e.target.value)} className={selectClass}>
          <option value=""><AgeText>{"Month"}</AgeText></option>
          {MONTHS.map((m, i) => (<option key={m} value={i + 1}>
              {locale === "bn" ? AGE_MONTHS_BN[i] : m}
            </option>))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-year`} className="sr-only"><AgeText>{"Year\n        "}</AgeText></label>
        <select id={`${idPrefix}-year`} value={year} onChange={(e) => onYear(e.target.value)} className={selectClass}>
          <option value=""><AgeText>{"Year"}</AgeText></option>
          {years.map((y) => (<option key={y} value={y}>
              {formatAgeNumber(y, locale)}
            </option>))}
        </select>
      </div>
    </div>);
}
// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function AgeCalculator() {
    const { locale, L: baseL } = useSohozI18n();
    const L = (text: string) => locale === "bn"
        ? translateAgeText(text) ?? baseL(text)
        : baseL(text);
    const router = useRouter();
    const today = useMemo(() => stripTime(new Date()), []);
    const currentYear = today.getFullYear();
    // Date of birth
    const [dobDay, setDobDay] = useState("");
    const [dobMonth, setDobMonth] = useState("");
    const [dobYear, setDobYear] = useState("");
    // "Age at date" — off by default (= today)
    const [useCustomTargetDate, setUseCustomTargetDate] = useState(false);
    const [targetDay, setTargetDay] = useState("");
    const [targetMonth, setTargetMonth] = useState("");
    const [targetYear, setTargetYear] = useState("");
    // Compare with someone else
    const [compareOn, setCompareOn] = useState(false);
    const [cmpDay, setCmpDay] = useState("");
    const [cmpMonth, setCmpMonth] = useState("");
    const [cmpYear, setCmpYear] = useState("");
    const [isFavorite, setIsFavorite] = useState(false);
    const [showHowToUse, setShowHowToUse] = useState(true);
    const [copied, setCopied] = useState(false);
    // --- Parse & validate DOB -------------------------------------------------
    const dobComplete = !!(dobDay && dobMonth && dobYear);
    const dobValid = dobComplete &&
        isValidDate(Number(dobDay), Number(dobMonth), Number(dobYear));
    const birthDate = dobValid
        ? makeDate(Number(dobDay), Number(dobMonth), Number(dobYear))
        : null;
    const dobIsFuture = birthDate ? birthDate > today : false;
    // --- Parse & validate target date ("age at date") ------------------------
    const targetComplete = !useCustomTargetDate || !!(targetDay && targetMonth && targetYear);
    const targetValid = !useCustomTargetDate ||
        (targetComplete &&
            isValidDate(Number(targetDay), Number(targetMonth), Number(targetYear)));
    const targetDate = useCustomTargetDate
        ? targetValid && targetComplete
            ? makeDate(Number(targetDay), Number(targetMonth), Number(targetYear))
            : null
        : today;
    const targetBeforeBirth = birthDate && targetDate ? targetDate < birthDate : false;
    // --- Error messages, plain language, one at a time ------------------------
    let errorMessage = "";
    if (dobComplete && !dobValid)
        errorMessage =
            "That date of birth doesn't exist. Please check the day and month.";
    else if (dobIsFuture)
        errorMessage = "Date of birth can't be in the future.";
    else if (useCustomTargetDate && targetComplete && !targetValid)
        errorMessage = "That date doesn't exist. Please check the day and month.";
    else if (targetBeforeBirth)
        errorMessage =
            "This date is earlier than the date of birth — pick a later date.";
    const canCalculate = dobValid &&
        !dobIsFuture &&
        targetValid &&
        targetComplete &&
        !targetBeforeBirth;
    const age = canCalculate && birthDate && targetDate
        ? diffYMD(birthDate, targetDate)
        : null;
    // --- Next birthday --------------------------------------------------------
    const nextBirthday = useMemo(() => {
        if (!canCalculate || !birthDate || !targetDate)
            return null;
        let next = new Date(targetDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if (next < targetDate)
            next = new Date(targetDate.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
        const untilNext = diffYMD(targetDate, next);
        const turningAge = next.getFullYear() - birthDate.getFullYear();
        const isToday = untilNext.totalDays === 0;
        return { date: next, untilNext, turningAge, isToday };
    }, [canCalculate, birthDate, targetDate]);
    // --- Milestones -------------------------------------------------------------
    const milestones = useMemo(() => {
        if (!canCalculate || !birthDate || !targetDate)
            return [];
        return MILESTONES.map((m) => {
            const milestoneDate = new Date(birthDate);
            milestoneDate.setFullYear(birthDate.getFullYear() + m.age);
            const reached = targetDate >= milestoneDate;
            return {
                ...m,
                date: milestoneDate,
                reached,
                remaining: reached ? null : diffYMD(targetDate, milestoneDate),
            };
        });
    }, [canCalculate, birthDate, targetDate]);
    // --- Compare with a second person -------------------------------------------
    const cmpComplete = !!(cmpDay && cmpMonth && cmpYear);
    const cmpValid = cmpComplete &&
        isValidDate(Number(cmpDay), Number(cmpMonth), Number(cmpYear));
    const cmpDate = cmpValid
        ? makeDate(Number(cmpDay), Number(cmpMonth), Number(cmpYear))
        : null;
    const cmpFuture = cmpDate ? cmpDate > today : false;
    const comparison = useMemo(() => {
        if (!compareOn ||
            !canCalculate ||
            !birthDate ||
            !targetDate ||
            !cmpDate ||
            cmpFuture)
            return null;
        const olderIsBirth = birthDate <= cmpDate;
        const diff = olderIsBirth
            ? diffYMD(birthDate, cmpDate)
            : diffYMD(cmpDate, birthDate);
        const isSame = diff.years === 0 && diff.months === 0 && diff.days === 0;
        return { diff, personOneOlder: !olderIsBirth, isSame };
    }, [compareOn, canCalculate, birthDate, targetDate, cmpDate, cmpFuture]);
    // --- Actions ---------------------------------------------------------------
    const handleReset = () => {
        setDobDay("");
        setDobMonth("");
        setDobYear("");
        setUseCustomTargetDate(false);
        setTargetDay("");
        setTargetMonth("");
        setTargetYear("");
        setCompareOn(false);
        setCmpDay("");
        setCmpMonth("");
        setCmpYear("");
        setCopied(false);
    };
    const handleCopy = async () => {
        if (!age || !birthDate)
            return;
        const text = locale === "bn"
            ? `জন্মতারিখ: ${formatDate(birthDate, locale)}\nসঠিক বয়স: ${formatAgeNumber(age.years, locale)} বছর, ${formatAgeNumber(age.months, locale)} মাস, ${formatAgeNumber(age.days, locale)} দিন\nমোট দিন: ${formatAgeNumber(age.totalDays, locale)}`
            : `Date of birth: ${formatDate(birthDate, locale)}\nExact age: ${age.years} years, ${age.months} months, ${age.days} days\nTotal days: ${age.totalDays.toLocaleString()}`;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch {
            // Clipboard may be unavailable — fail silently, nothing else to do here.
        }
    };
    return (<div className="w-full text-[#0F172A] font-sans pb-16 print:pb-0">
      <div className="w-full space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
              <button onClick={() => router.back()} className="p-1 hover:bg-gray-200/60 rounded-md transition-colors text-[#0F172A] flex items-center justify-center -ml-1 cursor-pointer" title={L("Go back")}>
                <ArrowLeft size={16}/>
              </button>
              <Link href="/sohoj-tools" className="hover:text-[#0F172A]"><AgeText>{"Sohoj Tools\n              "}</AgeText></Link>
              <span><AgeText>{"/"}</AgeText></span>
              <span className="hover:text-[#0F172A] cursor-pointer"><AgeText>{"General Tools\n              "}</AgeText></span>
              <span><AgeText>{"/"}</AgeText></span>
              <span className="text-[#0F172A] font-semibold"><AgeText>{"Age Calculator\n              "}</AgeText></span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#EEF2FF] text-[#4F46E5] rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Calculator size={18}/>
              </div>
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight"><AgeText>{"Age Calculator\n              "}</AgeText></h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full"><AgeText>{"Free\n              "}</AgeText></span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1"><AgeText>{"Pick your date of birth from the dropdowns \u2014 your exact age\n              appears instantly, no typing needed.\n            "}</AgeText></p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button onClick={() => setIsFavorite(!isFavorite)} aria-pressed={isFavorite} aria-label={L("Save to favourites")} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-[#2563EB] hover:border-[#93C5FD] transition-all shadow-2xs cursor-pointer">
              <Star size={16} className={isFavorite ? "fill-[#2563EB] text-[#2563EB]" : ""}/>
            </button>
            <button aria-label={L("Share this tool")} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-[#0F172A] transition-all shadow-2xs cursor-pointer">
              <Share size={16}/>
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: ENTER DATES FORM */}
          <div className="lg:col-span-5 space-y-4 print:hidden">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider"><AgeText>{"Enter dates\n                "}</AgeText></span>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                  <Cake size={13} className="text-[#4F46E5]"/><AgeText>{"Date of birth "}</AgeText><span className="text-red-500"><AgeText>{"*"}</AgeText></span>
                </label>
                <p className="text-[11px] text-gray-400 font-medium"><AgeText>{"Choose the day, month and year \u2014 cannot be a future date\n                "}</AgeText></p>
                <DatePicker idPrefix="dob" day={dobDay} month={dobMonth} year={dobYear} onDay={setDobDay} onMonth={setDobMonth} onYear={setDobYear} yearFrom={currentYear - 120} yearTo={currentYear}/>
              </div>

              {/* Age at date toggle */}
              <div className="border border-gray-200 rounded-xl p-3.5 space-y-3 bg-[#F8FAFC]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#EFF6FF] text-[#2563EB] rounded-lg flex items-center justify-center font-bold">
                      <Clock3 size={14}/>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]"><AgeText>{"Calculate age on a different date\n                      "}</AgeText></h4>
                      <p className="text-[10px] text-gray-500 font-medium"><AgeText>{"Off = calculate as of today\n                      "}</AgeText></p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={useCustomTargetDate} onChange={() => setUseCustomTargetDate((v) => !v)} aria-label={L("Calculate age on a different date")} className="sr-only peer"/>
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"/>
                  </label>
                </div>
                {useCustomTargetDate && (<div className="pt-1">
                    <DatePicker idPrefix="target" day={targetDay} month={targetMonth} year={targetYear} onDay={setTargetDay} onMonth={setTargetMonth} onYear={setTargetYear} yearFrom={currentYear - 120} yearTo={currentYear + 5}/>
                  </div>)}
              </div>

              {/* Compare Age Toggle Box */}
              <div className="border border-gray-200 rounded-xl p-3.5 space-y-3 bg-[#F8FAFC]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#EEF2FF] text-[#4F46E5] rounded-lg flex items-center justify-center font-bold">
                      <Users size={14}/>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]"><AgeText>{"Compare with another person\n                      "}</AgeText></h4>
                      <p className="text-[10px] text-gray-500 font-medium"><AgeText>{"Enter their birth date to see who is older\n                      "}</AgeText></p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={compareOn} onChange={() => setCompareOn((v) => !v)} aria-label={L("Compare with another person")} className="sr-only peer"/>
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F46E5]"/>
                  </label>
                </div>
                {compareOn && (<div className="pt-1 space-y-2">
                    <DatePicker idPrefix="cmp" day={cmpDay} month={cmpMonth} year={cmpYear} onDay={setCmpDay} onMonth={setCmpMonth} onYear={setCmpYear} yearFrom={currentYear - 120} yearTo={currentYear}/>
                    {cmpComplete && !cmpValid && (<p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle size={12}/><AgeText>{"That date doesn't exist.\n                      "}</AgeText></p>)}
                    {cmpFuture && (<p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle size={12}/><AgeText>{"That date can't be in the\n                        future.\n                      "}</AgeText></p>)}
                  </div>)}
              </div>

              {/* Inline error */}
              {errorMessage && (<div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-3.5 py-2.5">
                  <AlertCircle size={15} className="mt-0.5 shrink-0"/>
                  <p className="text-xs font-semibold leading-relaxed">
                    <AgeText>{errorMessage}</AgeText>
                  </p>
                </div>)}
            </div>
          </div>

          {/* RIGHT COLUMN: RESULTS */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[480px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 print:hidden">
                  <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4F46E5]"/>
                    <span><AgeText>{"Your age"}</AgeText></span>
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {age ? <AgeText>{"Calculated"}</AgeText> : <AgeText>{"Empty"}</AgeText>}
                  </span>
                </div>

                {age && birthDate && targetDate ? (<div className="mt-6 space-y-6">
                    {/* Headline result */}
                    <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl p-6 text-center space-y-2">
                      <p className="text-xs font-bold text-[#4338CA] uppercase tracking-widest">
                        {useCustomTargetDate
            ? <AgeText>{`Age on ${formatDate(targetDate, locale)}`}</AgeText> : <AgeText>{"Exact age today"}</AgeText>}
                      </p>
                      <h2 className="text-3xl font-extrabold text-[#312E81]">
                        {formatAgeNumber(age.years, locale)}{<AgeText>{" "}</AgeText>}
                        <span className="text-base font-normal"><AgeText>{"Years"}</AgeText></span><AgeText>{","}</AgeText>{<AgeText>{" "}</AgeText>}
                        {formatAgeNumber(age.months, locale)}{<AgeText>{" "}</AgeText>}
                        <span className="text-base font-normal"><AgeText>{"Months"}</AgeText></span><AgeText>{","}</AgeText>{<AgeText>{" "}</AgeText>}
                        {formatAgeNumber(age.days, locale)}{<AgeText>{" "}</AgeText>}
                        <span className="text-base font-normal"><AgeText>{"Days"}</AgeText></span>
                      </h2>
                      <span className="inline-block bg-white text-[#4338CA] border border-[#C7D2FE] text-[11px] font-bold px-3 py-1 rounded-full">
                        <AgeText>{lifeStage(age.years)}</AgeText>
                      </span>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-center space-y-1">
                        <p className="text-[11px] text-gray-500 font-medium"><AgeText>{"Total Months\n                        "}</AgeText></p>
                        <p className="text-base font-bold text-[#0F172A]">
                          {formatAgeNumber(age.totalMonths, locale)}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-center space-y-1">
                        <p className="text-[11px] text-gray-500 font-medium"><AgeText>{"Total Weeks\n                        "}</AgeText></p>
                        <p className="text-base font-bold text-[#0F172A]">
                          {formatAgeNumber(age.totalWeeks, locale)}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-center space-y-1 col-span-2 sm:col-span-1">
                        <p className="text-[11px] text-gray-500 font-medium"><AgeText>{"Total Days\n                        "}</AgeText></p>
                        <p className="text-base font-bold text-[#0F172A]">
                          {formatAgeNumber(age.totalDays, locale)}
                        </p>
                      </div>
                    </div>

                    {/* Next birthday */}
                    {nextBirthday && (<div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#E2E8F0] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0"></div>
                        <p className="text-xs font-semibold text-[#0F172A] leading-relaxed">
                          {nextBirthday.isToday ? (locale === "bn" ? <>
                              🎉 আজ জন্মদিন—আপনার বয়স এখন <b>{formatAgeNumber(nextBirthday.turningAge, locale)} বছর</b>!
                            </> : <>
                              🎉 Birthday today — turning <b>{nextBirthday.turningAge}</b>!
                            </>) : (locale === "bn" ? <>
                              আর <b>{shortDuration(nextBirthday.untilNext, locale)}</b> পর <b>{formatAgeNumber(nextBirthday.turningAge, locale)}</b> বছর পূর্ণ হবে, তারিখ {formatDate(nextBirthday.date, locale)}
                            </> : <>
                              Turns <b>{nextBirthday.turningAge}</b> in <b>{shortDuration(nextBirthday.untilNext, locale)}</b>, on {formatDate(nextBirthday.date, locale)}
                            </>)}
                        </p>
                      </div>)}

                    {/* Milestones relevant to daily life / paperwork in BD */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[#0F172A]"><AgeText>{"Milestones\n                      "}</AgeText></p>
                      <div className="space-y-1.5">
                        {milestones.map((m) => (<div key={m.label} className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200/80 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {m.reached ? (<CheckCircle2 size={15} className="text-emerald-500 shrink-0"/>) : (<AlertCircle size={15} className="text-gray-300 shrink-0"/>)}
                              <span className="text-[11px] font-semibold text-[#0F172A] truncate">
                                <AgeText>{m.label}</AgeText>
                              </span>
                            </div>
                            <span className={`text-[11px] font-bold whitespace-nowrap ${m.reached ? "text-emerald-600" : "text-gray-400"}`}>
                              {m.reached
                ? <AgeText>{`Since ${formatDate(m.date, locale)}`}</AgeText> : <AgeText>{`In ${shortDuration(m.remaining as YMD, locale)}`}</AgeText>}
                            </span>
                          </div>))}
                      </div>
                    </div>

                    {/* Comparison result */}
                    {compareOn && comparison && (<div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#DBEAFE] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
                          <Users size={17}/>
                        </div>
                        <p className="text-xs font-semibold text-[#1E40AF] leading-relaxed">
                          {comparison.isSame ? <AgeText>{"Both people are exactly the same age."}</AgeText> : (locale === "bn" ? <>
                              প্রথম ব্যক্তি দ্বিতীয় ব্যক্তির চেয়ে <b>{shortDuration(comparison.diff, locale)}</b> বয়সে {comparison.personOneOlder ? "বড়" : "ছোট"}।
                            </> : <>
                              The first date of birth is <b>{shortDuration(comparison.diff, locale)}</b> {comparison.personOneOlder ? "older" : "younger"} than the second.
                            </>)}
                        </p>
                      </div>)}

                    {/* Actions */}
                    <div className="flex items-center gap-2 print:hidden">
                      <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] text-xs font-bold rounded-xl transition-colors cursor-pointer">
                        {copied ? (<Check size={14} className="text-emerald-600"/>) : (<Copy size={14}/>)}
                        {copied ? <AgeText>{"Copied"}</AgeText> : <AgeText>{"Copy result"}</AgeText>}
                      </button>
                    </div>
                  </div>) : (<div className="mt-16 flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-12 h-12 bg-[#EEF2FF] text-[#4F46E5] rounded-2xl flex items-center justify-center shadow-2xs">
                      <Calculator size={22}/>
                    </div>
                    <h3 className="text-xs font-bold text-[#0F172A]"><AgeText>{"Choose a date of birth on the left to see the age\n                      instantly.\n                    "}</AgeText></h3>
                    <p className="text-[11px] text-gray-400 font-medium max-w-xs leading-relaxed"><AgeText>{"No typing required \u2014 just pick the day, month and year\n                      from the dropdown lists.\n                    "}</AgeText></p>
                  </div>)}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs print:hidden">
          <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4F46E5]"/>
            <span><AgeText>{"Everything is calculated in your browser \u2014 nothing is uploaded to\n              any server.\n            "}</AgeText></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button onClick={handleReset} className="px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] text-xs font-bold rounded-xl transition-colors cursor-pointer"><AgeText>{"Reset\n            "}</AgeText></button>
            <button onClick={() => window.print()} disabled={!age} className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer">
              <Calculator size={14}/>
              <span><AgeText>{"Print / Save"}</AgeText></span>
            </button>
          </div>
        </div>

        {/* HOW TO USE */}
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs print:hidden">
          <button onClick={() => setShowHowToUse(!showHowToUse)} className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]"/>
              <span><AgeText>{"How to use"}</AgeText></span>
            </div>
            {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>

          {showHowToUse && (<div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p><AgeText>{"1. Pick the day, month and year of birth from the three dropdown\n                lists \u2014 no typing needed.\n              "}</AgeText></p>
              <p><AgeText>{"2. Your exact age, next birthday and total days lived appear\n                immediately on the right.\n              "}</AgeText></p>
              <p><AgeText>{"3. Turn on \"Calculate age on a different date\" to see the age as\n                of a past or future date.\n              "}</AgeText></p>
              <p><AgeText>{"4. Turn on \"Compare with another person\" to see who is older and\n                by how much.\n              "}</AgeText></p>
            </div>)}
        </div>

        {/* TOOLS IN THE SAME CATEGORY */}
        <div className="pt-4 space-y-3 print:hidden">
          <h2 className="text-sm font-bold text-[#0F172A] tracking-tight"><AgeText>{"Tools in the same category\n          "}</AgeText></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool, idx) => {
            const ToolIcon = tool.icon;
            return (<Link key={idx} href={tool.href} className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-[#93C5FD] transition-all flex flex-col justify-between group">
                  <div>
                    <div className="w-9 h-9 bg-[#EEF2FF] text-[#4F46E5] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#E0E7FF] transition-colors">
                      <ToolIcon size={18}/>
                    </div>
                    <h3 className="text-xs font-bold text-[#0F172A] mb-1 group-hover:text-[#4F46E5] transition-colors">
                      {<AgeText>{tool.title}</AgeText>}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      {<AgeText>{tool.description}</AgeText>}
                    </p>
                  </div>
                </Link>);
        })}
          </div>
        </div>
      </div>
    </div>);
}
