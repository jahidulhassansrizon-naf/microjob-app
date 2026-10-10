"use client";
import { useSohozI18n, L } from "@/app/sohoj-tools/_i18n";
import { Check, ChevronDown, FileDown, FileText, Maximize, Minus, Plus, Printer, RotateCcw, Search, Share2, Star, X, } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { createPortal, flushSync } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject, } from "react";

/* Fuel Card Form UI translations. The application sheet itself stays in Bangla. */
const FUEL_UI_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["Sohoz Tools", "সহজ টুলস"],
  ["General Tools", "সাধারণ টুলস"],
  ["Fuel Card Form", "জ্বালানি তেলের আবেদনপত্র"],
  ["Free", "বিনামূল্যে"],
  ["✓ Used ", "✓ ব্যবহৃত: "],
  ["time", "বার"],
  ["times", "বার"],
  ["Fill in your details on the left — see the application letter on the right and download it as PDF.", "বাম পাশে আপনার তথ্য পূরণ করুন—ডান পাশে আবেদনপত্রের পূর্বরূপ দেখুন এবং PDF হিসেবে ডাউনলোড করুন।"],
  ["Remove from favorites", "প্রিয় তালিকা থেকে সরান"],
  ["Add to favorites", "প্রিয় তালিকায় যোগ করুন"],
  ["Share", "শেয়ার করুন"],
  ["Form progress", "ফর্ম পূরণের অগ্রগতি"],
  ["fields", "টি ঘর"],
  ["Personal & organization details", "ব্যক্তিগত ও প্রতিষ্ঠানের তথ্য"],
  ["ব্যক্তিগত ও প্রতিষ্ঠানের তথ্য", "Personal & organization details"],
  ["Applicant", "আবেদনকারী"],
  ["আবেদনকারী", "Applicant"],
  ["Father / proprietor", "পিতা / স্বত্বাধিকারী"],
  ["পিতা / স্বত্বাধিকারীর নাম", "Father / proprietor name"],
  ["NID / trade license", "এনআইডি / ট্রেড লাইসেন্স"],
  ["Mobile", "মোবাইল"],
  ["Address & pump details", "ঠিকানা ও পাম্পের তথ্য"],
  ["ঠিকানা ও পাম্পের তথ্য", "Address & pump details"],
  ["Village / road", "গ্রাম / রাস্তা"],
  ["Pump name", "পাম্পের নাম"],
  ["Machine & usage details", "যন্ত্রপাতি ও ব্যবহারের তথ্য"],
  ["মেশিন ও ব্যবহারের তথ্য", "Machine & usage details"],
  ["Machine / equipment", "মেশিন / যন্ত্রপাতি"],
  ["Fuel type", "জ্বালানির ধরন"],
  ["জ্বালানি তেলের ধরন", "Fuel type"],
  ["Fuel quantity", "জ্বালানি তেলের পরিমাণ"],
  ["Purpose of use", "ব্যবহারের উদ্দেশ্য"],
  ["Applicant / organization name", "আবেদনকারী / প্রতিষ্ঠানের নাম"],
  ["আবেদনকারীর / প্রতিষ্ঠানের নাম", "Applicant / organization name"],
  ["Father / proprietor name", "পিতা / স্বত্বাধিকারীর নাম"],
  ["পিতা / প্রোপাইটরের নাম", "Father / proprietor name"],
  ["NID / trade license number", "এনআইডি / ট্রেড লাইসেন্স নম্বর"],
  ["এনআইডি / ট্রেড লাইসেন্স নম্বর", "NID / trade license number"],
  ["মোবাইল নম্বর", "Mobile number"],
  ["Mobile number", "মোবাইল নম্বর"],
  ["গ্রাম / রাস্তা", "Village / road"],
  ["Village or road name", "গ্রাম অথবা রাস্তার নাম"],
  ["গ্রাম অথবা রাস্তার নাম", "Village or road name"],
  ["ইউনিয়ন", "Union"],
  ["Union", "ইউনিয়ন"],
  ["ইউনিয়নের নাম", "Union name"],
  ["Union name", "ইউনিয়নের নাম"],
  ["ডাকঘর", "Post office"],
  ["Post office", "ডাকঘর"],
  ["ডাকঘরের নাম", "Post office name"],
  ["Post office name", "ডাকঘরের নাম"],
  ["থানা / উপজেলা", "Police station / upazila"],
  ["Police station / upazila", "থানা / উপজেলা"],
  ["জেলা", "District"],
  ["District", "জেলা"],
  ["জেলা বাছাই করুন", "Choose a district"],
  ["Choose a district", "জেলা বাছাই করুন"],
  ["যে পাম্প থেকে তেল নেবেন", "Name of the fuel pump"],
  ["Name of the fuel pump", "যে পাম্প থেকে তেল নেবেন"],
  ["মেশিন / যন্ত্রপাতির নাম", "Machine / equipment name"],
  ["Machine / equipment name", "মেশিন / যন্ত্রপাতির নাম"],
  ["যেমন: জেনারেটর", "e.g. generator"],
  ["e.g. generator", "যেমন: জেনারেটর"],
  ["যেমন: 50", "e.g. 50"],
  ["e.g. 50", "যেমন: ৫০"],
  ["ব্যবহারের উদ্দেশ্য", "Purpose of use"],
  ["যেমন: জেনারেটর চালানো", "e.g. operating a generator"],
  ["e.g. operating a generator", "যেমন: জেনারেটর চালানো"],
  ["Enter a valid 11-digit mobile number.", "সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন।"],
  ["e.g. 01XXXXXXXXX", "যেমন: ০১XXXXXXXXX"],
  ["Preview", "পূর্বরূপ"],
  ["Live preview", "লাইভ পূর্বরূপ"],
  ["Update preview", "পূর্বরূপ হালনাগাদ করুন"],
  ["Bangla digits (০১২৩)", "বাংলা অঙ্ক (০১২৩)"],
  ["Zoom out", "ছোট করে দেখুন"],
  ["Zoom in", "বড় করে দেখুন"],
  ["Actual size (100%)", "প্রকৃত আকার (১০০%)"],
  ["100%", "১০০%"],
  ["Fit to width", "প্রস্থ অনুযায়ী মানানসই করুন"],
  ["Filled", "পূরণ করা হয়েছে"],
  ["Empty", "ফাঁকা"],
  ["Page 1 of 1", "পৃষ্ঠা ১ / ১"],
  ["A4 · 210 × 297 mm — print & PDF use this exact layout", "A4 · ২১০ × ২৯৭ মিমি — প্রিন্ট ও PDF-এ এই একই বিন্যাস থাকবে"],
  ["Reset view", "পূর্বরূপের অবস্থান ঠিক করুন"],
  ["Important Information and Instructions:", "গুরুত্বপূর্ণ তথ্য ও নির্দেশনা:"],
  ["The following documents must be attached:", "আবেদনপত্রের সঙ্গে নিচের কাগজপত্র সংযুক্ত করতে হবে:"],
  ["Attach a passport-size photo to the application with glue or stapler.", "আবেদনপত্রে আঠা বা স্ট্যাপলার দিয়ে পাসপোর্ট সাইজের ছবি সংযুক্ত করুন।"],
  ["Submit a photocopy of National ID (NID) or trade license.", "জাতীয় পরিচয়পত্র (এনআইডি) অথবা ট্রেড লাইসেন্সের ফটোকপি জমা দিন।"],
  ["Attach copies of required organization/equipment documents.", "প্রতিষ্ঠান বা যন্ত্রপাতির প্রয়োজনীয় কাগজপত্রের কপি সংযুক্ত করুন।"],
  ["An active mobile number must be provided.", "সচল মোবাইল নম্বর দিতে হবে।"],
  ["Fill in all information correctly and accurately. The application may be cancelled for incorrect information.", "সব তথ্য সঠিক ও নির্ভুলভাবে পূরণ করুন। ভুল তথ্য দিলে আবেদন বাতিল হতে পারে।"],
  ["After printing, obtain signature and approval from a respectable person, ward representative or relevant officer before submitting at the pump.", "প্রিন্ট করার পর পাম্পে জমা দেওয়ার আগে গণ্যমান্য ব্যক্তি, ওয়ার্ড প্রতিনিধি বা সংশ্লিষ্ট কর্মকর্তার স্বাক্ষর ও অনুমোদন নিন।"],
  ["Collect only the approved quantity of fuel oil as per distribution policy; apply again for additional quantity.", "বণ্টন নীতি অনুযায়ী অনুমোদিত পরিমাণ জ্বালানি তেলই সংগ্রহ করুন। অতিরিক্ত পরিমাণের জন্য পুনরায় আবেদন করুন।"],
  ["Add an input to get started", "শুরু করতে তথ্য পূরণ করুন"],
  ["Clear all", "সব মুছে ফেলুন"],
  ["Restore last form", "আগের ফর্ম ফিরিয়ে আনুন"],
  ["Print", "প্রিন্ট করুন"],
  ["Processing...", "প্রস্তুত করা হচ্ছে..."],
  ["Download PDF", "PDF ডাউনলোড করুন"],
  ["Dismiss", "বার্তাটি বন্ধ করুন"],
  ["Cleared", "সব মুছে ফেলা হয়েছে"],
  ["All fields have been reset.", "সব ঘরের তথ্য মুছে ফেলা হয়েছে।"],
  ["Nothing to restore", "ফিরিয়ে আনার মতো কোনো তথ্য নেই"],
  ["There is no previously saved form on this device.", "এই ডিভাইসে আগে সংরক্ষিত কোনো ফর্ম নেই।"],
  ["Restored", "আগের তথ্য ফিরিয়ে আনা হয়েছে"],
  ["Your last form has been loaded.", "আপনার সর্বশেষ ফর্মের তথ্য ফিরিয়ে আনা হয়েছে।"],
  ["Link copied", "লিংক কপি হয়েছে"],
  ["The page link is on your clipboard.", "পেজের লিংক ক্লিপবোর্ডে কপি করা হয়েছে।"],
  ["Could not share", "শেয়ার করা যায়নি"],
  ["Sharing is not supported in this browser.", "এই ব্রাউজারে শেয়ার করার সুবিধা নেই।"],
  ["Sharing was blocked by the browser.", "ব্রাউজার শেয়ার করার অনুমতি দেয়নি।"],
  ["PDF ready", "PDF তৈরি হয়েছে"],
  ["Your Fuel Card Form has been downloaded.", "জ্বালানি তেলের আবেদনপত্র PDF হিসেবে ডাউনলোড হয়েছে।"],
  ["PDF failed", "PDF তৈরি করা যায়নি"],
  ["The PDF could not be created. Please try again or use Print → Save as PDF.", "PDF তৈরি করা যায়নি। আবার চেষ্টা করুন অথবা প্রিন্ট অপশন থেকে ‘PDF হিসেবে সংরক্ষণ করুন’ বেছে নিন।"],
  ["Fuel Oil Application", "জ্বালানি তেলের আবেদনপত্র"],
  ["Fill in the Fuel Card Form online.", "অনলাইনে জ্বালানি তেলের আবেদনপত্র পূরণ করুন।"],
  ["Fuel type", "জ্বালানির ধরন"],
  ["Actual size (100%)", "প্রকৃত আকার (১০০%)"],
  ["fields filled", "টি ঘর পূরণ হয়েছে"],
  ["of", "এর মধ্যে"],
]

function normalizeFuelUiText(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

const containsBangla = (value: string) => /[\u0980-\u09E5\u09F0-\u09FF]/.test(value);

// The table intentionally includes English→Bangla rows for English UI labels
// and Bangla→English rows for places where the source JSX already has Bangla.
// Keep those directions separate so one row cannot accidentally reverse the
// translation of a title in Bangla mode.
const FUEL_UI_BN: Record<string, string> = Object.fromEntries(
  FUEL_UI_PAIRS
    .filter(([source, target]) => !containsBangla(source) && containsBangla(target))
    .map(([en, bn]) => [normalizeFuelUiText(en), bn]),
);
const FUEL_UI_EN: Record<string, string> = Object.fromEntries([
  ...FUEL_UI_PAIRS
    .filter(([source, target]) => containsBangla(source) && !containsBangla(target))
    .map(([bn, en]) => [normalizeFuelUiText(bn), en] as const),
  ...FUEL_UI_PAIRS
    .filter(([source, target]) => !containsBangla(source) && containsBangla(target))
    .map(([en, bn]) => [normalizeFuelUiText(bn), en] as const),
]);

function isFuelBanglaLocale(locale: unknown): boolean {
  return String(locale ?? "en").toLowerCase().startsWith("bn");
}

function translateFuelUiText(value: string, locale: unknown, fallback?: (value: string) => string): string {
  const key = normalizeFuelUiText(value);
  if (!key) return value;

  const dynamicFilled = key.match(/^(\d+) of (\d+) fields filled$/i);
  if (dynamicFilled) {
    if (isFuelBanglaLocale(locale)) {
      return `${toBnDigits(dynamicFilled[1])} / ${toBnDigits(dynamicFilled[2])}টি ঘর পূরণ হয়েছে`;
    }
    return `${dynamicFilled[1]} of ${dynamicFilled[2]} fields filled`;
  }

  if (isFuelBanglaLocale(locale)) {
    // Do not send already-Bangla copy through the global fallback translator.
    if (containsBangla(key)) return value;
    return FUEL_UI_BN[key] ?? fallback?.(key) ?? value;
  }
  return FUEL_UI_EN[key] ?? value;
}

function T({ children }: { children: ReactNode }) {
  const { locale, L } = useSohozI18n();
  if (typeof children !== "string") return <>{children}</>;
  return <>{translateFuelUiText(children, locale, L)}</>;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Types & constants                                                         */
/* ────────────────────────────────────────────────────────────────────────── */
type FuelCardFormState = {
    applicantOrganization: string;
    fatherProprietor: string;
    nidLicenseNumber: string;
    mobileNumber: string;
    villageRoad: string;
    unionName: string;
    postOffice: string;
    district: string;
    thanaUpazila: string;
    pumpName: string;
    machineEquipment: string;
    fuelType: "Petrol" | "Octane" | "Diesel" | "";
    fuelQuantity: string;
    purposeOfUse: string;
};
type FuelType = Exclude<FuelCardFormState["fuelType"], "">;
type FormKey = keyof FuelCardFormState;
type StringKey = {
    [K in FormKey]: FuelCardFormState[K] extends string ? K : never;
}[FormKey];
type ToastKind = "success" | "info" | "error";
type Toast = {
    id: number;
    kind: ToastKind;
    title: string;
    message: string;
};
type RenderMode = "print" | "pdf" | null;
const STORAGE_KEY = "sohoj-fuel-card-form";
const LAST_KEY = "sohoj-fuel-card-form-last";
const FAVORITE_KEY = "sohoj-fuel-card-form-favorite";
const USED_KEY = "sohoj-fuel-card-form-used";
const EMPTY_FORM: FuelCardFormState = {
    applicantOrganization: "",
    fatherProprietor: "",
    nidLicenseNumber: "",
    mobileNumber: "",
    villageRoad: "",
    unionName: "",
    postOffice: "",
    district: "",
    thanaUpazila: "",
    pumpName: "",
    machineEquipment: "",
    fuelType: "Diesel",
    fuelQuantity: "",
    purposeOfUse: "",
};
/** The 14 numbered fields of the official form, in official order. */
const FIELD_KEYS: FormKey[] = [
    "applicantOrganization", // ১
    "fatherProprietor", // ২
    "villageRoad", // ৩
    "unionName", // ৪
    "postOffice", // ৫
    "thanaUpazila", // ৬
    "district", // ৭
    "nidLicenseNumber", // ৮
    "pumpName", // ৯
    "machineEquipment", // ১০
    "fuelType", // ১১
    "fuelQuantity", // ১২
    "purposeOfUse", // ১৩
    "mobileNumber", // ১৪
];
const FUEL_TYPES: FuelType[] = ["Petrol", "Octane", "Diesel"];
const FUEL_BN: Record<FuelType, string> = {
    Petrol: "পেট্রোল",
    Octane: "অকটেন",
    Diesel: "ডিজেল",
};
/** [value stored in the form, Bangla name shown on the application] */
const DISTRICTS: ReadonlyArray<readonly [
    string,
    string
]> = [
    ["Barishal", "বরিশাল"],
    ["Barguna", "বরগুনা"],
    ["Bhola", "ভোলা"],
    ["Jhalokathi", "ঝালকাঠি"],
    ["Patuakhali", "পটুয়াখালী"],
    ["Pirojpur", "পিরোজপুর"],
    ["Chattogram", "চট্টগ্রাম"],
    ["Cox's Bazar", "কক্সবাজার"],
    ["Cumilla", "কুমিল্লা"],
    ["Feni", "ফেনী"],
    ["Brahmanbaria", "ব্রাহ্মণবাড়িয়া"],
    ["Rangamati", "রাঙ্গামাটি"],
    ["Noakhali", "নোয়াখালী"],
    ["Chandpur", "চাঁদপুর"],
    ["Lakshmipur", "লক্ষ্মীপুর"],
    ["Khagrachhari", "খাগড়াছড়ি"],
    ["Bandarban", "বান্দরবান"],
    ["Dhaka", "ঢাকা"],
    ["Gazipur", "গাজীপুর"],
    ["Kishoreganj", "কিশোরগঞ্জ"],
    ["Madaripur", "মাদারীপুর"],
    ["Munshiganj", "মুন্সীগঞ্জ"],
    ["Narsingdi", "নরসিংদী"],
    ["Narayanganj", "নারায়ণগঞ্জ"],
    ["Rajbari", "রাজবাড়ী"],
    ["Shariatpur", "শরীয়তপুর"],
    ["Tangail", "টাঙ্গাইল"],
    ["Faridpur", "ফরিদপুর"],
    ["Gopalganj", "গোপালগঞ্জ"],
    ["Manikganj", "মানিকগঞ্জ"],
    ["Khulna", "খুলনা"],
    ["Bagerhat", "বাগেরহাট"],
    ["Chuadanga", "চুয়াডাঙ্গা"],
    ["Jashore", "যশোর"],
    ["Jhenaidah", "ঝিনাইদহ"],
    ["Kushtia", "কুষ্টিয়া"],
    ["Magura", "মাগুরা"],
    ["Meherpur", "মেহেরপুর"],
    ["Narail", "নড়াইল"],
    ["Satkhira", "সাতক্ষীরা"],
    ["Mymensingh", "ময়মনসিংহ"],
    ["Jamalpur", "জামালপুর"],
    ["Netrokona", "নেত্রকোণা"],
    ["Sherpur", "শেরপুর"],
    ["Rajshahi", "রাজশাহী"],
    ["Bogura", "বগুড়া"],
    ["Joypurhat", "জয়পুরহাট"],
    ["Naogaon", "নওগাঁ"],
    ["Natore", "নাটোর"],
    ["Chapainawabganj", "চাঁপাইনবাবগঞ্জ"],
    ["Pabna", "পাবনা"],
    ["Sirajganj", "সিরাজগঞ্জ"],
    ["Rangpur", "রংপুর"],
    ["Dinajpur", "দিনাজপুর"],
    ["Gaibandha", "গাইবান্ধা"],
    ["Kurigram", "কুড়িগ্রাম"],
    ["Lalmonirhat", "লালমনিরহাট"],
    ["Nilphamari", "নীলফামারী"],
    ["Panchagarh", "পঞ্চগড়"],
    ["Thakurgaon", "ঠাকুরগাঁও"],
    ["Sylhet", "সিলেট"],
    ["Habiganj", "হবিগঞ্জ"],
    ["Moulvibazar", "মৌলভীবাজার"],
    ["Sunamganj", "সুনামগঞ্জ"],
];
const DISTRICT_BN: Record<string, string> = Object.fromEntries(DISTRICTS.map(([en, bn]) => [en, bn]));
const INK = "#0F172A";
const PAPER = "#FFFFFF";
/** A4 in CSS px (96dpi) – used only for the on-screen preview scaling. */
const PX_PER_MM = 96 / 25.4;
const PAGE_W_PX = 210 * PX_PER_MM;
const PAGE_H_PX = 297 * PX_PER_MM;
/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */
function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const toBnDigits = (v: string) => v.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
const toEnDigits = (v: string) => v.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
/** Accepts English or Bangla digits, stores English digits only. */
const digitString = (value: string, max = 32) => toEnDigits(value).replace(/[^\d]/g, "").slice(0, max);
const decimalString = (value: string, max = 7) => toEnDigits(value)
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1")
    .slice(0, max);
const validateMobile = (v: string) => v && !/^01[3-9]\d{8}$/.test(v) ? "Enter a valid 11-digit mobile number." : "";
function isFormEmpty(form: FuelCardFormState) {
    return (Object.keys(EMPTY_FORM) as FormKey[]).every((key) => {
        const value = form[key];
        return String(value ?? "").trim() === "" || key === "fuelType";
    });
}
function sanitizeForm(raw: unknown): FuelCardFormState {
    const result: FuelCardFormState = { ...EMPTY_FORM };
    if (!raw || typeof raw !== "object")
        return result;
    const source = raw as Record<string, unknown>;
    const target = result as Record<string, unknown>;
    (Object.keys(EMPTY_FORM) as FormKey[]).forEach((key) => {
        const fallback = EMPTY_FORM[key];
        const value = source[key];
        target[key] = typeof value === "string" ? value : fallback;
    });
    if (!(FUEL_TYPES as readonly string[]).includes(result.fuelType)) {
        result.fuelType = "Diesel";
    }
    return result;
}
function safeReadJson(key: string): FuelCardFormState | null {
    if (typeof window === "undefined")
        return null;
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? sanitizeForm(JSON.parse(raw)) : null;
    }
    catch {
        return null;
    }
}
function nextFrames(count: number) {
    return new Promise<void>((resolve) => {
        const step = (left: number) => {
            if (left <= 0)
                resolve();
            else
                requestAnimationFrame(() => step(left - 1));
        };
        step(count);
    });
}
/* ── Bangla font ─────────────────────────────────────────────────────────── */
const FONT_LINK_ID = "fuel-form-bangla-font";
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap";
/** Font used inside the A4 paper (preview, print and PDF). */
const PRINT_FONT = '"Noto Sans Bengali", "Hind Siliguri", "Kalpurush", "SolaimanLipi", "Nirmala UI", "Vrinda", sans-serif';
/** Font used for the app UI: keeps your Latin font, adds Bangla fallbacks. */
const UI_FONT = 'ui-sans-serif, system-ui, "Segoe UI", "Noto Sans Bengali", "Hind Siliguri", "Nirmala UI", sans-serif';
function ensureBanglaFont() {
    if (typeof document === "undefined")
        return;
    if (document.getElementById(FONT_LINK_ID))
        return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
}
/**
 * Waits until the Bangla font is really usable before print / html2canvas,
 * otherwise the first PDF can be rendered with a fallback font.
 */
async function waitForFonts() {
    try {
        if (typeof document !== "undefined" && document.fonts) {
            const sample = "অআকখ১২৩৪ abc ABC 0123";
            await Promise.race([
                Promise.all(["400", "500", "600", "700"].map((weight) => document.fonts.load(`${weight} 16px "Noto Sans Bengali"`, sample))),
                new Promise((resolve) => setTimeout(resolve, 4000)),
            ]);
            await document.fonts.ready;
        }
    }
    catch { }
    await nextFrames(2);
}
/* ────────────────────────────────────────────────────────────────────────── */
/*  A4 application paper  (preview = print = PDF, same component)             */
/* ────────────────────────────────────────────────────────────────────────── */
// @@PREVIEW_START
const ROW_H = 8.6; // mm – rows 5 to 14
const TOP_ROW_H = 10.5; // mm – rows 1 to 4 (sit beside the photo box)
const BASE = 3.6; // mm – base font size on paper
const DOT = "0.3mm dotted #334155";
const FUEL_CARD_TEXT = {
    title: "জ্বালানি তেলের আবেদনপত্র",
    subtitle: "(জ্বালানি তেলের আবেদনপত্র)",
    photo: ["পাসপোর্ট সাইজ", "ছবি", "আঠা / স্ট্যাপল দিয়ে", "সংযুক্ত করুন"],
    submissionHead: "বিনীত নিবেদন:",
    submission: "উপরোক্ত বিষয়ের প্রেক্ষিতে বিনীত নিবেদন এই যে, আমার প্রতিষ্ঠান/কাজের জন্য নিয়মিত জ্বালানি তেলের প্রয়োজন হয়। অতএব, উল্লিখিত পরিমাণ জ্বালানি তেল সংগ্রহের অনুমতি প্রদানে প্রয়োজনীয় ব্যবস্থা গ্রহণের জন্য বিনীত অনুরোধ করছি।",
    declarationHead: "ঘোষণা:",
    declaration: "আমি এই মর্মে ঘোষণা করছি যে, উপরে প্রদত্ত সকল তথ্য সত্য ও সঠিক। কোনো তথ্য অসত্য প্রমাণিত হলে আমার আবেদন বাতিলসহ প্রচলিত বিধি অনুযায়ী ব্যবস্থা গ্রহণ করা যাবে। সংগৃহীত জ্বালানি তেল আমি কেবল উল্লিখিত উদ্দেশ্যেই ব্যবহার করব।",
    attachmentsHead: "সংযুক্তি:",
    attachments: [
        "সদ্য তোলা পাসপোর্ট সাইজ ছবি",
        "জাতীয় পরিচয়পত্র (এনআইডি) অথবা ট্রেড লাইসেন্সের ফটোকপি",
        "প্রতিষ্ঠান / যন্ত্রপাতির প্রয়োজনীয় কাগজপত্র",
    ],
    attachmentMarks: ["(ক)", "(খ)", "(গ)"],
    permissionTitle: "গণ্যমান্য ব্যক্তি ও ওয়ার্ড প্রতিনিধির অনুমতি",
};
/** Shrinks the font a little for long values so text never gets cut. */
function fitSize(value: string, capacity: number, base = BASE + 0.1) {
    const len = Array.from(value).length;
    if (len <= capacity)
        return base;
    return Math.max(2.8, Number(((base * capacity) / len).toFixed(2)));
}
function DotValue({ value, capacity, width, }: {
    value: string;
    capacity: number;
    width?: number; // mm – fixed width instead of filling the row
}) {
    return (<div style={{
            flex: width ? "0 0 auto" : 1,
            width: width ? `${width}mm` : undefined,
            minWidth: 0,
            marginLeft: "2mm",
            minHeight: "5.6mm",
            paddingTop: "0.3mm",
            borderBottom: DOT,
            fontWeight: 600,
            fontSize: `${fitSize(value, capacity)}mm`,
            lineHeight: 1.5,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
        }}>
      {value}
    </div>);
}
function FormRow({ no, label, height = ROW_H, children, }: {
    no: number;
    label: string;
    height?: number;
    children: ReactNode;
}) {
    return (<div style={{
            display: "flex",
            alignItems: "flex-end",
            height: `${height}mm`,
            fontSize: `${BASE}mm`,
            lineHeight: 1.5,
        }}>
      <div style={{ width: "8mm", flexShrink: 0, fontWeight: 700 }}>
        {toBnDigits(String(no))}।</div>
      <div style={{ flexShrink: 0, whiteSpace: "nowrap", paddingBottom: "0.3mm" }}>
        {label}
      </div>
      {children}
    </div>);
}
function PaperCheckBox({ checked }: {
    checked: boolean;
}) {
    return (<span style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            width: "4.4mm",
            height: "4.4mm",
            flexShrink: 0,
            border: "0.35mm solid #1E293B",
        }}>
      {checked ? (<svg viewBox="0 0 24 24" width="3.4mm" height="3.4mm" fill="none" stroke="#1E293B" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7"/>
        </svg>) : null}
    </span>);
}
function PhotoBox() {
    return (<div style={{
            boxSizing: "border-box",
            width: "35mm",
            height: `${TOP_ROW_H * 4}mm`,
            flexShrink: 0,
            border: "0.35mm dashed #475569",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "2mm",
            color: "#64748B",
            fontSize: "2.9mm",
            lineHeight: 1.45,
        }}>
      <div style={{ fontWeight: 600 }}>{FUEL_CARD_TEXT.photo[0]}</div>
      <div style={{ fontWeight: 600 }}>{FUEL_CARD_TEXT.photo[1]}</div>
      <div style={{ marginTop: "3mm" }}>{FUEL_CARD_TEXT.photo[2]}</div>
      <div>{FUEL_CARD_TEXT.photo[3]}</div>
    </div>);
}
function SignLine({ label, width }: {
    label: string;
    width: number;
}) {
    return (<div style={{
            display: "flex",
            alignItems: "flex-end",
            whiteSpace: "nowrap",
            fontSize: `${BASE - 0.1}mm`,
        }}>
      <span style={{ paddingBottom: "0.3mm" }}>{label}</span>
      <span style={{
            display: "inline-block",
            width: `${width}mm`,
            height: "4.6mm",
            marginLeft: "1.5mm",
            borderBottom: DOT,
        }}/>
    </div>);
}
const SECTION_HEAD: CSSProperties = {
    fontWeight: 700,
    fontSize: `${BASE + 0.1}mm`,
    lineHeight: 1.4,
    marginBottom: "0.8mm",
};
const PARA: CSSProperties = {
    margin: 0,
    fontSize: `${BASE - 0.15}mm`,
    lineHeight: 1.6,
};
function FuelCardPreview({ form, bnDigits = false, flat = false, documentRef, id, }: {
    form: FuelCardFormState;
    bnDigits?: boolean;
    flat?: boolean;
    documentRef?: RefObject<HTMLDivElement | null>;
    id?: string;
}) {
    const d = (v: string) => (bnDigits ? toBnDigits(v) : v);
    const districtBn = form.district
        ? (DISTRICT_BN[form.district] ?? form.district)
        : "";
    return (<div id={id} ref={documentRef} style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            width: "210mm",
            height: "297mm",
            flexShrink: 0,
            padding: "10mm 12mm 9mm",
            overflow: "hidden",
            background: PAPER,
            color: INK,
            fontFamily: PRINT_FONT,
            fontSize: `${BASE}mm`,
            lineHeight: 1.5,
            boxShadow: flat ? "none" : "0 10px 26px -8px rgba(15,23,42,.28)",
        }}>
      {/* page frame */}
      <div aria-hidden="true" style={{
            position: "absolute",
            top: "5mm",
            left: "5mm",
            right: "5mm",
            bottom: "5mm",
            border: "0.35mm solid #1E293B",
            pointerEvents: "none",
        }}/>

      {/* title */}
      <div style={{ textAlign: "center", marginBottom: "3mm" }}>
        <span style={{
            display: "inline-block",
            fontSize: "5.4mm",
            fontWeight: 700,
            lineHeight: 1.4,
            paddingBottom: "0.4mm",
            borderBottom: `0.4mm solid ${INK}`,
        }}>
          {FUEL_CARD_TEXT.title}
        </span>
        <div style={{
            fontSize: "3.1mm",
            color: "#475569",
            lineHeight: 1.3,
            marginTop: "0.8mm",
        }}>
          {FUEL_CARD_TEXT.subtitle}
        </div>
      </div>

      {/* rows 1–4 + photo box */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "6mm" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <FormRow no={1} label="আবেদনকারীর / প্রতিষ্ঠানের নাম:" height={TOP_ROW_H}>
            <DotValue value={d(form.applicantOrganization)} capacity={44}/>
          </FormRow>
          <FormRow no={2} label="পিতা / প্রোপাইটরের নাম:" height={TOP_ROW_H}>
            <DotValue value={d(form.fatherProprietor)} capacity={49}/>
          </FormRow>
          <FormRow no={3} label="গ্রাম / রাস্তা:" height={TOP_ROW_H}>
            <DotValue value={d(form.villageRoad)} capacity={54}/>
          </FormRow>
          <FormRow no={4} label="ইউনিয়ন:" height={TOP_ROW_H}>
            <DotValue value={d(form.unionName)} capacity={60}/>
          </FormRow>
        </div>
        <PhotoBox />
      </div>

      {/* rows 5–14 */}
      <FormRow no={5} label="ডাকঘর:">
        <DotValue value={d(form.postOffice)} capacity={70}/>
      </FormRow>
      <FormRow no={6} label="থানা / উপজেলা:">
        <DotValue value={d(form.thanaUpazila)} capacity={62}/>
      </FormRow>
      <FormRow no={7} label="জেলা:">
        <DotValue value={districtBn} capacity={70}/>
      </FormRow>
      <FormRow no={8} label="এনআইডি / ট্রেড লাইসেন্স নম্বর:">
        <DotValue value={d(form.nidLicenseNumber)} capacity={54}/>
      </FormRow>
      <FormRow no={9} label="পাম্পের নাম:">
        <DotValue value={d(form.pumpName)} capacity={72}/>
      </FormRow>
      <FormRow no={10} label="মেশিন / যন্ত্রপাতির নাম:">
        <DotValue value={d(form.machineEquipment)} capacity={60}/>
      </FormRow>

      <FormRow no={11} label="জ্বালানি তেলের ধরন:">
        <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "9mm",
            marginLeft: "4mm",
            paddingBottom: "1.2mm",
        }}>
          {FUEL_TYPES.map((type) => (<div key={type} style={{
                display: "flex",
                alignItems: "center",
                gap: "2mm",
                whiteSpace: "nowrap",
            }}>
              <PaperCheckBox checked={form.fuelType === type}/>
              <span>{FUEL_BN[type]}</span>
            </div>))}
        </div>
      </FormRow>

      <FormRow no={12} label="জ্বালানি তেলের পরিমাণ:">
        <DotValue value={d(form.fuelQuantity)} capacity={14} width={44}/>
        <div style={{ flexShrink: 0, marginLeft: "1.5mm", paddingBottom: "0.3mm" }}>লিটার</div>
      </FormRow>
      <FormRow no={13} label="ব্যবহারের উদ্দেশ্য:">
        <DotValue value={d(form.purposeOfUse)} capacity={68}/>
      </FormRow>
      <FormRow no={14} label="মোবাইল নম্বর:">
        <DotValue value={d(form.mobileNumber)} capacity={40}/>
      </FormRow>

      {/* বিনীত নিবেদন */}
      <div style={{ marginTop: "5mm" }}>
        <div style={SECTION_HEAD}>{FUEL_CARD_TEXT.submissionHead}</div>
        <p style={PARA}>{FUEL_CARD_TEXT.submission}</p>
      </div>

      {/* ঘোষণা */}
      <div style={{ marginTop: "4mm" }}>
        <div style={SECTION_HEAD}>{FUEL_CARD_TEXT.declarationHead}</div>
        <p style={PARA}>{FUEL_CARD_TEXT.declaration}</p>
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: "6mm",
        }}>
          <SignLine label="তারিখ:" width={38}/>
          <SignLine label="আবেদনকারীর স্বাক্ষর:" width={52}/>
        </div>
      </div>

      {/* সংযুক্তি */}
      <div style={{ marginTop: "4mm" }}>
        <div style={SECTION_HEAD}>{FUEL_CARD_TEXT.attachmentsHead}</div>
        <div style={{ paddingLeft: "4mm" }}>
          {FUEL_CARD_TEXT.attachments.map((text, i) => (<div key={text} style={{ display: "flex", ...PARA }}>
              <span style={{ width: "8mm", flexShrink: 0 }}>
                {FUEL_CARD_TEXT.attachmentMarks[i]}
              </span>
              <span>{text}</span>
            </div>))}
        </div>
      </div>

      {/* Permission box – always pinned to the bottom of the page */}
      <div style={{
            marginTop: "auto",
            boxSizing: "border-box",
            border: "0.4mm solid #1E293B",
            padding: "2.5mm 4mm 3mm",
        }}>
        <div style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: `${BASE + 0.1}mm`,
            lineHeight: 1.4,
            paddingBottom: "1.6mm",
            borderBottom: "0.3mm solid #1E293B",
        }}>
          {FUEL_CARD_TEXT.permissionTitle}
        </div>

        <div style={{
            display: "flex",
            alignItems: "flex-end",
            marginTop: "2.4mm",
            fontSize: `${BASE - 0.1}mm`,
            whiteSpace: "nowrap",
        }}>
          <span style={{ paddingBottom: "0.3mm" }}>অনুমোদিত জ্বালানি তেলের পরিমাণ:</span>
          <span style={{
            display: "inline-block",
            width: "34mm",
            height: "4.6mm",
            margin: "0 1.5mm",
            borderBottom: DOT,
        }}/>
          <span style={{ paddingBottom: "0.3mm" }}>লিটার (কথায়:</span>
          <span style={{
            display: "inline-block",
            flex: 1,
            height: "4.6mm",
            margin: "0 1.5mm",
            borderBottom: DOT,
        }}/>
          <span style={{ paddingBottom: "0.3mm" }}>)</span>
        </div>

        <div style={{ display: "flex", gap: "10mm", marginTop: "11mm" }}>
          {[
            "গণ্যমান্য ব্যক্তির নাম, স্বাক্ষর ও তারিখ",
            "ওয়ার্ড প্রতিনিধি / সংশ্লিষ্ট কর্মকর্তার স্বাক্ষর ও সিল",
        ].map((caption) => (<div key={caption} style={{
                flex: 1,
                borderTop: DOT,
                paddingTop: "1mm",
                textAlign: "center",
                fontSize: "3.05mm",
                lineHeight: 1.4,
            }}>
              {caption}
            </div>))}
        </div>
      </div>
    </div>);
}
// @@PREVIEW_END
/* ────────────────────────────────────────────────────────────────────────── */
/*  Left-panel form UI                                                        */
/* ────────────────────────────────────────────────────────────────────────── */
function FieldLabel({ no, children, hint, }: {
    no?: number;
    children: ReactNode;
    hint?: string;
}) {
    return (<div className="mb-1.5 flex items-center justify-between gap-2 text-[11.5px] font-semibold text-[#0F172A]">
      <span className="flex min-w-0 items-center gap-1.5">
        {no ? (<span className="inline-flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded bg-[#EFF6FF] px-1 text-[9.5px] font-bold text-[#2563EB]">
            {toBnDigits(String(no))}
          </span>) : null}
        <span className="truncate">{children}</span>
      </span>
      {hint ? (<span className="shrink-0 text-[9.5px] font-normal text-[#64748B]">
          {hint}
        </span>) : null}
    </div>);
}
const INPUT_BASE = "h-10 w-full rounded-md border bg-white px-3 text-[12px] text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE]";
function TextField({ no, label, hint, value, placeholder, onChange, inputMode, maxLength, suffix, validate, }: {
    no?: number;
    label: string;
    hint?: string;
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
    inputMode?: "text" | "numeric" | "decimal" | "tel";
    maxLength?: number;
    suffix?: string;
    validate?: (value: string) => string;
}) {
    const { locale, L } = useSohozI18n();
    const [touched, setTouched] = useState(false);
    const message = validate ? validate(value) : "";
    const showError = Boolean(message) && touched;
    return (<label className="block">
      <FieldLabel no={no} hint={hint}>
        {label}
      </FieldLabel>
      <div className="relative">
        <input type="text" value={value} maxLength={maxLength} placeholder={placeholder} inputMode={inputMode} autoComplete="off" spellCheck={false} aria-invalid={showError} onBlur={() => setTouched(true)} onChange={(event) => onChange(event.target.value)} className={cx(INPUT_BASE, suffix && "pr-14", showError
            ? "border-[#FCA5A5] focus:border-[#DC2626] focus:ring-[#FEE2E2]"
            : "border-[#CBD5E1]")}/>
        {suffix ? (<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] font-medium text-[#64748B]">
            {suffix}
          </span>) : null}
      </div>
      {showError ? (<p role="alert" className="mt-1 text-[10px] leading-3 text-[#B91C1C]">
          {translateFuelUiText(message, locale, L)}
        </p>) : null}
    </label>);
}
function SelectField({ no, label, hint, value, placeholder, options, onChange, }: {
    no?: number;
    label: string;
    hint?: string;
    value: string;
    placeholder: string;
    options: Array<{
        value: string;
        label: string;
    }>;
    onChange: (value: string) => void;
}) {
    return (<label className="block">
      <FieldLabel no={no} hint={hint}>
        {label}
      </FieldLabel>
      <div className="relative">
        <select value={value} onChange={(event) => onChange(event.target.value)} className={cx(INPUT_BASE, "cursor-pointer appearance-none pr-8", "border-[#CBD5E1]")}>
          <option value="">{placeholder}</option>
          {options.map((option) => (<option key={option.value} value={option.value}>
              {<T>{option.label}</T>}
            </option>))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]"/>
      </div>
    </label>);
}
function FuelTypeField({ no, value, onChange, }: {
    no: number;
    value: FuelCardFormState["fuelType"];
    onChange: (value: FuelType) => void;
}) {
    const { locale, L } = useSohozI18n();
    return (<div>
      <FieldLabel no={no} hint={translateFuelUiText("Fuel type", locale, L)}><T>{"জ্বালানি তেলের ধরন"}</T></FieldLabel>
      <div role="radiogroup" aria-label={translateFuelUiText("Fuel type", locale, L)} className="grid grid-cols-3 gap-2">
        {FUEL_TYPES.map((type) => {
            const active = value === type;
            return (<button key={type} type="button" role="radio" aria-checked={active} onClick={() => onChange(type)} className={cx("flex h-11 flex-col items-center justify-center rounded-md border leading-tight transition", active
                    ? "border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] ring-2 ring-[#DBEAFE]"
                    : "border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F8FAFC]")}>
              <span className="text-[12px] font-semibold">{isFuelBanglaLocale(locale) ? FUEL_BN[type] : type}</span>
            </button>);
        })}
      </div>
    </div>);
}
function SectionCard({ number, title, subtitle, children, }: {
    number: number;
    title: string;
    subtitle: string;
    children: ReactNode;
}) {
    return (<section className="rounded-xl border border-[#BFDBFE] bg-white p-4 shadow-[0_3px_12px_rgba(15,23,42,0.05)]">
      <div className="mb-3.5 flex items-center gap-2.5 border-b border-[#EFF6FF] pb-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-[12px] font-bold text-white">
          {toBnDigits(String(number))}
        </span>
        <div className="min-w-0">
          <h2 className="text-[13px] font-bold leading-tight text-[#0F172A]">
            {title}
          </h2>
          <p className="text-[10px] leading-tight text-[#64748B]">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>);
}
function PreviewToolbar({ zoom, onZoomBy, onZoom100, onFit, hasData, live, onLive, onRefresh, bnDigits, onBnDigits, }: {
    zoom: number;
    onZoomBy: (delta: number) => void;
    onZoom100: () => void;
    onFit: () => void;
    hasData: boolean;
    live: boolean;
    onLive: (value: boolean) => void;
    onRefresh: () => void;
    bnDigits: boolean;
    onBnDigits: (value: boolean) => void;
}) {
    const { locale, L } = useSohozI18n();
    const iconBtn = "flex h-7 w-7 items-center justify-center rounded-md border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#0F172A]";
    return (<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[#E2E8F0] px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="text-[11px] font-semibold text-[#475569]"><T>{"Preview\n        "}</T></span>
        <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-medium text-[#475569]">
          <input type="checkbox" checked={live} onChange={(event) => onLive(event.target.checked)} className="accent-[#2563EB]"/><T>{"Live preview\n        "}</T></label>
        {!live ? (<button type="button" onClick={onRefresh} className="rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-1 text-[9.5px] font-semibold text-[#1D4ED8] hover:bg-[#DBEAFE]"><T>{"Update preview\n          "}</T></button>) : null}
        <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-medium text-[#475569]">
          <input type="checkbox" checked={bnDigits} onChange={(event) => onBnDigits(event.target.checked)} className="accent-[#2563EB]"/><T>{"Bangla digits (\u09E6\u09E7\u09E8\u09E9)\n        "}</T></label>
      </div>

      <div className="flex items-center gap-1.5">
        <button type="button" aria-label={translateFuelUiText("Zoom out", locale, L)} onClick={() => onZoomBy(-0.1)} className={iconBtn}>
          <Minus className="h-3.5 w-3.5"/>
        </button>
        <span className="min-w-[44px] text-center text-[10px] font-semibold text-[#475569]">
          {Math.round(zoom * 100)}<T>{"%\n        "}</T></span>
        <button type="button" aria-label={translateFuelUiText("Zoom in", locale, L)} onClick={() => onZoomBy(0.1)} className={iconBtn}>
          <Plus className="h-3.5 w-3.5"/>
        </button>
        <button type="button" aria-label={translateFuelUiText("Actual size (100%)", locale, L)} title={translateFuelUiText("100%", locale, L)} onClick={onZoom100} className={iconBtn}>
          <Search className="h-3.5 w-3.5"/>
        </button>
        <button type="button" aria-label={translateFuelUiText("Fit to width", locale, L)} title={translateFuelUiText("Fit to width", locale, L)} onClick={onFit} className={iconBtn}>
          <Maximize className="h-3.5 w-3.5"/>
        </button>
        <span className={cx("ml-1 rounded-full px-2 py-1 text-[9px] font-bold", hasData
            ? "bg-[#D1FAE5] text-[#047857]"
            : "bg-[#E2E8F0] text-[#475569]")}>
          {hasData ? <T>{"Filled"}</T> : <T>{"Empty"}</T>}
        </span>
      </div>
    </div>);
}
/* ────────────────────────────────────────────────────────────────────────── */
/*  Off-screen print / PDF root                                               */
/* ────────────────────────────────────────────────────────────────────────── */
function PrintRoot({ form, mode, bnDigits, }: {
    form: FuelCardFormState;
    mode: "print" | "pdf";
    bnDigits: boolean;
}) {
    const page = (<div id="fuel-print-root" data-mode={mode} aria-hidden="true">
      <div id="fuel-print-page" style={{ width: "210mm", height: "297mm" }}>
        <FuelCardPreview form={form} bnDigits={bnDigits} flat/>
      </div>
    </div>);
    return typeof document !== "undefined"
        ? createPortal(page, document.body)
        : null;
}
/* ────────────────────────────────────────────────────────────────────────── */
/*  Main component                                                            */
/* ────────────────────────────────────────────────────────────────────────── */
export default function FuelCardForm() {
    const { locale, L } = useSohozI18n();
    const FL = useCallback((value: string) => translateFuelUiText(value, locale, L), [locale, L]);
    const [form, setForm] = useState<FuelCardFormState>(EMPTY_FORM);
    const [hydrated, setHydrated] = useState(false);
    const [favorite, setFavorite] = useState(false);
    const [usedCount, setUsedCount] = useState(0);
    const [mode, setMode] = useState<RenderMode>(null);
    const [zoom, setZoom] = useState(1);
    const [autoFit, setAutoFit] = useState(true);
    const [dragging, setDragging] = useState(false);
    const [live, setLive] = useState(true);
    const [frozen, setFrozen] = useState<FuelCardFormState | null>(null);
    const [bnDigits, setBnDigits] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const previewRef = useRef<HTMLDivElement | null>(null);
    const dragRef = useRef({ x: 0, y: 0, left: 0, top: 0 });
    const toastId = useRef(0);
    const toastTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
    const hasData = useMemo(() => !isFormEmpty(form), [form]);
    const pdfBusy = mode === "pdf";
    const previewForm = live ? form : (frozen ?? form);
    const filledCount = useMemo(() => FIELD_KEYS.filter((key) => String(form[key] ?? "").trim() !== "").length, [form]);
    const districtOptions = useMemo(() => DISTRICTS.map(([en, bn]) => ({ value: en, label: isFuelBanglaLocale(locale) ? bn : en })), [locale]);
    const dismissToast = useCallback((toastKey: number) => {
        const timer = toastTimers.current.get(toastKey);
        if (timer)
            clearTimeout(timer);
        toastTimers.current.delete(toastKey);
        setToasts((current) => current.filter((toast) => toast.id !== toastKey));
    }, []);
    const pushToast = useCallback((kind: ToastKind, title: string, message: string) => {
        toastId.current += 1;
        const newId = toastId.current;
        const localizedTitle = translateFuelUiText(title, locale, L);
        const localizedMessage = translateFuelUiText(message, locale, L);
        setToasts((current) => [
            ...current.slice(-3),
            { id: newId, kind, title: localizedTitle, message: localizedMessage },
        ]);
        toastTimers.current.set(newId, setTimeout(() => dismissToast(newId), 4000));
    }, [dismissToast, locale, L]);
    /* load the Bangla font once */
    useEffect(() => {
        ensureBanglaFont();
    }, []);
    /* hydrate from localStorage */
    useEffect(() => {
        const saved = safeReadJson(STORAGE_KEY);
        if (saved)
            setForm(saved);
        try {
            setFavorite(window.localStorage.getItem(FAVORITE_KEY) === "1");
            setUsedCount(Math.max(0, Number(window.localStorage.getItem(USED_KEY)) || 0));
        }
        catch { }
        setHydrated(true);
    }, []);
    /* persist */
    useEffect(() => {
        if (!hydrated)
            return;
        try {
            if (isFormEmpty(form)) {
                window.localStorage.removeItem(STORAGE_KEY);
            }
            else {
                const json = JSON.stringify(form);
                window.localStorage.setItem(STORAGE_KEY, json);
                window.localStorage.setItem(LAST_KEY, json);
            }
        }
        catch { }
    }, [form, hydrated]);
    useEffect(() => {
        const timers = toastTimers.current;
        return () => {
            timers.forEach((timer) => clearTimeout(timer));
            timers.clear();
        };
    }, []);
    /* fit-to-width preview */
    useEffect(() => {
        const el = viewportRef.current;
        if (!el || !autoFit)
            return;
        const apply = () => {
            const fit = Math.floor(((el.clientWidth - 32) / PAGE_W_PX) * 100) / 100;
            setZoom(Math.min(1, Math.max(0.4, fit)));
        };
        apply();
        const observer = new ResizeObserver(apply);
        observer.observe(el);
        return () => observer.disconnect();
    }, [autoFit]);
    const setField = useCallback(<K extends FormKey>(key: K, value: FuelCardFormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    }, []);
    const setText = useCallback((key: StringKey, value: string) => setField(key, value), [setField]);
    const toggleFavorite = () => {
        setFavorite((value) => {
            const next = !value;
            try {
                window.localStorage.setItem(FAVORITE_KEY, next ? "1" : "0");
            }
            catch { }
            return next;
        });
    };
    const bumpUsage = () => {
        setUsedCount((count) => {
            const next = count + 1;
            try {
                window.localStorage.setItem(USED_KEY, String(next));
            }
            catch { }
            return next;
        });
    };
    const clearAll = () => {
        if (!hasData)
            return;
        try {
            window.localStorage.setItem(LAST_KEY, JSON.stringify(form));
            window.localStorage.removeItem(STORAGE_KEY);
        }
        catch { }
        setForm({ ...EMPTY_FORM });
        setFrozen(null);
        setLive(true);
        setAutoFit(true);
        pushToast("info", "Cleared", "All fields have been reset.");
    };
    const restoreLast = () => {
        const saved = safeReadJson(LAST_KEY);
        if (!saved || isFormEmpty(saved)) {
            pushToast("info", "Nothing to restore", "There is no previously saved form on this device.");
            return;
        }
        setForm(saved);
        pushToast("success", "Restored", "Your last form has been loaded.");
    };
    const share = async () => {
        const payload = {
            title: FL("Fuel Card Form"),
            text: FL("Fill in the Fuel Card Form online."),
            url: window.location.href,
        };
        try {
            if (typeof navigator.share === "function") {
                await navigator.share(payload);
            }
            else if (navigator.clipboard) {
                await navigator.clipboard.writeText(window.location.href);
                pushToast("success", "Link copied", "The page link is on your clipboard.");
            }
            else {
                pushToast("error", "Could not share", "Sharing is not supported in this browser.");
            }
        }
        catch (error) {
            if (error instanceof DOMException && error.name === "AbortError")
                return;
            pushToast("error", "Could not share", "Sharing was blocked by the browser.");
        }
    };
    /* Ctrl+P / browser menu print also gets the clean A4 page */
    useEffect(() => {
        const before = () => flushSync(() => setMode((current) => current ?? "print"));
        const after = () => flushSync(() => setMode((current) => (current === "print" ? null : current)));
        window.addEventListener("beforeprint", before);
        window.addEventListener("afterprint", after);
        return () => {
            window.removeEventListener("beforeprint", before);
            window.removeEventListener("afterprint", after);
        };
    }, []);
    const print = async () => {
        if (mode === "pdf")
            return;
        flushSync(() => setMode("print"));
        await waitForFonts();
        bumpUsage();
        window.print();
    };
    const downloadPdf = async () => {
        if (mode === "pdf")
            return;
        flushSync(() => setMode("pdf"));
        try {
            await waitForFonts();
            const page = document.getElementById("fuel-print-page");
            if (!page)
                throw new Error("Printable page was not found.");
            const canvas = await html2canvas(page, {
                backgroundColor: PAPER,
                scale: 3, // ≈ 288 dpi on A4
                useCORS: true,
                logging: false,
                // The print root lives off-screen. Reposition it inside the clone only,
                // and neutralise page scroll, so the capture is never blank or shifted.
                scrollX: 0,
                scrollY: 0,
                windowWidth: 1280,
                windowHeight: 1400,
                onclone: (clonedDoc: Document) => {
                    const root = clonedDoc.getElementById("fuel-print-root");
                    if (root) {
                        root.style.position = "fixed";
                        root.style.left = "0";
                        root.style.top = "0";
                        root.style.opacity = "1";
                        root.style.visibility = "visible";
                    }
                },
            });
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
                compress: true,
            });
            pdf.setProperties({
                title: FL("Fuel Oil Application"),
                subject: FL("Fuel Oil Application"),
            });
            // Keep the captured aspect ratio; never exceed the A4 page.
            const imgW = 210;
            const imgH = Math.min(297, (canvas.height * imgW) / canvas.width);
            pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgW, imgH, undefined, "FAST");
            const slug = form.applicantOrganization
                .trim()
                .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
                .replace(/^-+|-+$/g, "")
                .slice(0, 40);
            pdf.save(slug ? `fuel-card-form-${slug}.pdf` : "fuel-card-form.pdf");
            bumpUsage();
            pushToast("success", "PDF ready", "Your Fuel Card Form has been downloaded.");
        }
        catch {
            pushToast("error", "PDF failed", "The PDF could not be created. Please try again or use Print → Save as PDF.");
        }
        finally {
            setMode(null);
        }
    };
    /* preview controls */
    const zoomBy = (delta: number) => {
        setAutoFit(false);
        setZoom((value) => Math.min(1.6, Math.max(0.4, Number((value + delta).toFixed(1)))));
    };
    const zoom100 = () => {
        setAutoFit(false);
        setZoom(1);
    };
    const fitPreview = () => {
        setAutoFit(true);
        const el = viewportRef.current;
        if (el)
            el.scrollTo({ left: 0, top: 0 });
    };
    const onLiveChange = (value: boolean) => {
        setLive(value);
        setFrozen(value ? null : form);
    };
    const onPreviewPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        const el = viewportRef.current;
        if (!el)
            return;
        if (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight)
            return;
        // Prevent browser text/image selection while using click-and-drag
        // to pan the A4 preview. The custom pointer-drag scrolling still works.
        event.preventDefault();
        setDragging(true);
        dragRef.current = {
            x: event.clientX,
            y: event.clientY,
            left: el.scrollLeft,
            top: el.scrollTop,
        };
        el.setPointerCapture(event.pointerId);
    };
    const onPreviewPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const el = viewportRef.current;
        if (!dragging || !el)
            return;
        el.scrollLeft = dragRef.current.left - (event.clientX - dragRef.current.x);
        el.scrollTop = dragRef.current.top - (event.clientY - dragRef.current.y);
    };
    const onPreviewPointerUp = () => setDragging(false);
    const viewportStyle: CSSProperties = {
        height: "calc(100vh - 215px)",
        minHeight: 460,
        cursor: dragging ? "grabbing" : "grab",
    };
    return (<div className="-mx-4 -mt-6 min-h-[calc(100vh-72px)] bg-[#F8FAFC] px-4 pb-28 pt-5 text-[#0F172A] print:bg-white" style={{ marginBottom: "-24px", fontFamily: UI_FONT }}>
      <style>{`
        /* Off-screen on screen; the PDF capture repositions it inside html2canvas' clone. */
        #fuel-print-root {
          position: fixed;
          left: -10000px;
          top: 0;
          width: 210mm;
          height: 297mm;
          background: #fff;
          pointer-events: none;
        }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: #fff !important;
          }
          body > *:not(#fuel-print-root) { display: none !important; }
          #fuel-print-root {
            display: block !important;
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: 210mm !important;
            /* 1mm shorter than A4 so rounding never spills onto a 2nd page */
            height: 296mm !important;
            margin: 0 !important;
            overflow: hidden !important;
            break-after: avoid !important;
            page-break-after: avoid !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          #fuel-print-root, #fuel-print-root * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1320px]">
        <div className="mb-2 flex items-center gap-2 px-1 text-[9px] text-[#64748B]">
          <span><T>{"\u2302"}</T></span>
          <span><T>{"/"}</T></span>
          <span><T>{"Sohoz Tools"}</T></span>
          <span><T>{"/"}</T></span>
          <span><T>{"General Tools"}</T></span>
          <span><T>{"/"}</T></span>
          <span className="font-semibold text-[#475569]"><T>{"Fuel Card Form"}</T></span>
        </div>

        <div className="mb-4 flex items-start justify-between gap-4 px-1">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#2563EB]">
                <FileText className="h-4 w-4"/>
              </span>
              <h1 className="text-[23px] font-bold tracking-[-0.02em] text-[#0F172A]"><T>{"Fuel Card Form\n              "}</T></h1>
              <span className="rounded-full bg-[#D1FAE5] px-2 py-1 text-[9px] font-bold text-[#047857]"><T>{"Free\n              "}</T></span>
              <span className="text-[9px] text-[#64748B]"><T>{"\u2713 Used "}</T>{usedCount} {usedCount === 1 ? <T>{"time"}</T> : <T>{"times"}</T>}
              </span>
            </div>
            <p className="mt-1 pl-10 text-[10px] text-[#475569]"><T>{"Fill in your details on the left \u2014 see the application letter on\n              the right and download it as PDF.\n            "}</T></p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button type="button" title={favorite ? FL("Remove from favorites") : FL("Add to favorites")} aria-pressed={favorite} onClick={toggleFavorite} className={cx("flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition", favorite
            ? "border-[#93C5FD] text-[#2563EB]"
            : "border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]")}>
              <Star className={cx("h-4 w-4", favorite && "fill-current")}/>
            </button>
            <button type="button" title={FL("Share")} aria-label={FL("Share")} onClick={share} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white text-[#64748B] transition hover:bg-[#F8FAFC]">
              <Share2 className="h-4 w-4"/>
            </button>
          </div>
        </div>

        <div className="grid items-start gap-3.5 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* ───────────── Left: form panel ───────────── */}
          <div className="space-y-3.5">
            <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-[0_3px_12px_rgba(15,23,42,0.05)]">
              <div className="mb-1.5 flex items-center justify-between text-[10.5px] font-semibold text-[#475569]">
                <span><T>{"Form progress"}</T></span>
                <span>
                  {filledCount}<T>{"/ "}</T>{FIELD_KEYS.length}<T>{"fields\n                "}</T></span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]">
                <div className="h-full rounded-full bg-[#10B981] transition-all" style={{
            width: `${(filledCount / FIELD_KEYS.length) * 100}%`,
        }}/>
              </div>
            </div>

            <SectionCard number={1} title={FL("ব্যক্তিগত ও প্রতিষ্ঠানের তথ্য")} subtitle={FL("Personal & organization details")}>
              <div className="space-y-3.5">
                <TextField no={1} label={FL("আবেদনকারী / প্রতিষ্ঠানের নাম")} hint={FL("Applicant")} placeholder={FL("নাম অথবা প্রতিষ্ঠানের নাম")} maxLength={60} value={form.applicantOrganization} onChange={(v) => setText("applicantOrganization", v)}/>
                <TextField no={2} label={FL("পিতা / প্রোপাইটরের নাম")} hint={FL("Father / proprietor")} placeholder={FL("পিতা অথবা প্রোপাইটরের নাম")} maxLength={50} value={form.fatherProprietor} onChange={(v) => setText("fatherProprietor", v)}/>
                <TextField no={8} label={FL("এনআইডি / ট্রেড লাইসেন্স নম্বর")} hint={FL("NID / trade license")} placeholder={FL("এনআইডি অথবা লাইসেন্স নম্বর")} maxLength={25} value={form.nidLicenseNumber} onChange={(v) => setText("nidLicenseNumber", v)}/>
                <TextField no={14} label={FL("মোবাইল নম্বর")} hint={FL("Mobile")} placeholder={FL("e.g. 01XXXXXXXXX")} inputMode="tel" maxLength={11} value={form.mobileNumber} validate={validateMobile} onChange={(v) => setText("mobileNumber", digitString(v, 11))}/>
              </div>
            </SectionCard>

            <SectionCard number={2} title={FL("ঠিকানা ও পাম্পের তথ্য")} subtitle={FL("Address & pump details")}>
              <div className="space-y-3.5">
                <TextField no={3} label={FL("গ্রাম / রাস্তা")} hint={FL("Village / road")} placeholder={FL("গ্রাম অথবা রাস্তার নাম")} maxLength={50} value={form.villageRoad} onChange={(v) => setText("villageRoad", v)}/>
                <div className="grid grid-cols-2 gap-3">
                  <TextField no={4} label={FL("ইউনিয়ন")} placeholder={FL("ইউনিয়নের নাম")} maxLength={30} value={form.unionName} onChange={(v) => setText("unionName", v)}/>
                  <TextField no={5} label={FL("ডাকঘর")} placeholder={FL("ডাকঘরের নাম")} maxLength={30} value={form.postOffice} onChange={(v) => setText("postOffice", v)}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField no={6} label={FL("থানা / উপজেলা")} placeholder={FL("থানা / উপজেলা")} maxLength={30} value={form.thanaUpazila} onChange={(v) => setText("thanaUpazila", v)}/>
                  <SelectField no={7} label={FL("জেলা")} value={form.district} placeholder={FL("জেলা বাছাই করুন")} options={districtOptions} onChange={(v) => setText("district", v)}/>
                </div>
                <TextField no={9} label={FL("পাম্পের নাম")} hint={FL("Pump name")} placeholder={FL("যে পাম্প থেকে তেল নেবেন")} maxLength={60} value={form.pumpName} onChange={(v) => setText("pumpName", v)}/>
              </div>
            </SectionCard>

            <SectionCard number={3} title={FL("মেশিন ও ব্যবহারের তথ্য")} subtitle={FL("Machine & usage details")}>
              <div className="space-y-3.5">
                <TextField no={10} label={FL("মেশিন / যন্ত্রপাতির নাম")} hint={FL("Machine / equipment")} placeholder={FL("যেমন: জেনারেটর")} maxLength={50} value={form.machineEquipment} onChange={(v) => setText("machineEquipment", v)}/>
                <FuelTypeField no={11} value={form.fuelType} onChange={(v) => setField("fuelType", v)}/>
                <TextField no={12} label={FL("জ্বালানি তেলের পরিমাণ")} hint={FL("Fuel quantity")} placeholder={FL("যেমন: 50")} inputMode="decimal" suffix="লিটার" value={form.fuelQuantity} onChange={(v) => setText("fuelQuantity", decimalString(v))}/>
                <TextField no={13} label={FL("ব্যবহারের উদ্দেশ্য")} hint={FL("Purpose of use")} placeholder={FL("যেমন: জেনারেটর চালানো")} maxLength={90} value={form.purposeOfUse} onChange={(v) => setText("purposeOfUse", v)}/>
              </div>
            </SectionCard>
          </div>

          {/* ───────────── Right: live preview ───────────── */}
          <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_3px_12px_rgba(15,23,42,0.05)] lg:sticky lg:top-3">
            <PreviewToolbar zoom={zoom} onZoomBy={zoomBy} onZoom100={zoom100} onFit={fitPreview} hasData={hasData} live={live} onLive={onLiveChange} onRefresh={() => setFrozen(form)} bnDigits={bnDigits} onBnDigits={setBnDigits}/>

            <div className="relative">
              <div className="pointer-events-none absolute right-5 top-3 z-10 rounded-full bg-[#0F172A] px-3 py-1.5 text-[9px] font-bold text-white shadow"><T>{"Page 1 of 1\n              "}</T></div>

              <div ref={viewportRef} className="relative overflow-auto bg-[#334155] select-none touch-none" style={viewportStyle} onPointerDown={onPreviewPointerDown} onPointerMove={onPreviewPointerMove} onPointerUp={onPreviewPointerUp} onPointerCancel={onPreviewPointerUp}>
                <div style={{
            width: "max-content",
            minWidth: "100%",
            padding: 16,
        }}>
                  <div style={{
            width: PAGE_W_PX * zoom,
            height: PAGE_H_PX * zoom,
            margin: "0 auto",
        }}>
                    <div style={{
            width: "210mm",
            height: "297mm",
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
        }}>
                      <FuelCardPreview form={previewForm} bnDigits={bnDigits} documentRef={previewRef} id="fuel-preview-page"/>
                    </div>
                  </div>
                </div>
              </div>

              {dragging ? (<div className="pointer-events-none absolute inset-0 border-2 border-[#60A5FA]"/>) : null}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[#E2E8F0] px-3 py-2">
              <span className="text-[9.5px] text-[#64748B]"><T>{"A4 \u00B7 210 \u00D7 297 mm \u2014 print &amp; PDF use this exact layout\n              "}</T></span>
              <button type="button" onClick={fitPreview} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-white px-3 text-[10px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">
                <RotateCcw className="h-3.5 w-3.5"/><T>{"Reset view\n              "}</T></button>
            </div>
          </div>
        </div>

        <section className="mt-3.5 rounded-xl border border-[#34D399] bg-white p-4 shadow-[0_3px_12px_rgba(15,23,42,0.05)]">
          <h2 className="text-[11px] font-bold text-[#065F46]"><T>{"Important Information and Instructions:\n          "}</T></h2>
          <div className="my-3 border-t border-[#A7F3D0]"/>
          <p className="text-[10px] leading-5 text-[#334155]"><T>{"The following documents must be attached:\n          "}</T></p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[10px] leading-5 text-[#334155]">
            <li><T>{"Attach a passport-size photo to the application with glue or\n              stapler.\n            "}</T></li>
            <li><T>{"Submit a photocopy of National ID (NID) or trade license."}</T></li>
            <li><T>{"Attach copies of required organization/equipment documents."}</T></li>
            <li><T>{"An active mobile number must be provided."}</T></li>
          </ul>
          <p className="mt-4 text-[10px] leading-5 text-[#DC2626]"><T>{"Fill in all information correctly and accurately. The application\n            may be cancelled for incorrect information.\n          "}</T></p>
          <p className="mt-4 text-[10px] leading-5 text-[#0F766E]"><T>{"After printing, obtain signature and approval from a respectable\n            person, ward representative or relevant officer before submitting at\n            the pump.\n          "}</T></p>
          <p className="mt-4 text-[10px] leading-5 text-[#047857]"><T>{"Collect only the approved quantity of fuel oil as per distribution\n            policy; apply again for additional quantity.\n          "}</T></p>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E2E8F0] bg-white/95 px-4 py-2 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[9px] text-[#64748B]">
            <span className={cx("h-1.5 w-1.5 rounded-full", hasData ? "bg-[#10B981]" : "bg-[#94A3B8]")}/>
            {hasData
        ? <T>{`${filledCount} of ${FIELD_KEYS.length} fields filled`}</T> : <T>{"Add an input to get started"}</T>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={clearAll} disabled={!hasData} className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[10px] font-semibold text-[#94A3B8] hover:bg-[#F8FAFC] disabled:cursor-not-allowed">
              <X className="h-3.5 w-3.5"/><T>{"Clear all\n            "}</T></button>
            <button type="button" onClick={restoreLast} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-white px-3 text-[10px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">
              <RotateCcw className="h-3.5 w-3.5"/><T>{"Restore last form\n            "}</T></button>
            <button type="button" disabled={pdfBusy} onClick={print} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-white px-3 text-[10px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC] disabled:cursor-wait disabled:opacity-60">
              <Printer className="h-3.5 w-3.5"/><T>{"Print\n            "}</T></button>
            <button type="button" disabled={pdfBusy} onClick={downloadPdf} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#10B981] px-3.5 text-[10px] font-bold text-white shadow-sm hover:bg-[#059669] disabled:cursor-wait disabled:opacity-70">
              <FileDown className="h-3.5 w-3.5"/>
              {pdfBusy ? <T>{"Processing..."}</T> : <T>{"Download PDF"}</T>}
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[min(320px,calc(100vw-2rem))] flex-col gap-2 print:hidden" aria-live="polite">
        {toasts.map((toast) => (<div key={toast.id} role="status" className={cx("pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 shadow-lg", toast.kind === "success" && "border-[#A7F3D0] bg-[#ECFDF5]", toast.kind === "info" && "border-[#CBD5E1] bg-[#F8FAFC]", toast.kind === "error" && "border-[#FCA5A5] bg-[#FEF2F2]")}>
            {toast.kind === "success" ? (<Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#059669]"/>) : null}
            <div className="min-w-0 flex-1">
              <p className={cx("text-[10px] font-bold", toast.kind === "success"
                ? "text-[#047857]"
                : toast.kind === "error"
                    ? "text-[#B91C1C]"
                    : "text-[#475569]")}>
                {toast.title}
              </p>
              <p className="mt-0.5 text-[9.5px] leading-4 text-[#475569]">
                {toast.message}
              </p>
            </div>
            <button type="button" aria-label={FL("Dismiss")} onClick={() => dismissToast(toast.id)} className="text-[#64748B] hover:text-[#0F172A]">
              <X className="h-3 w-3"/>
            </button>
          </div>))}
      </div>

      {mode ? <PrintRoot form={form} mode={mode} bnDigits={bnDigits}/> : null}
    </div>);
}
