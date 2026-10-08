"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal, flushSync } from "react-dom";
import {
  ArrowLeft,
  Star,
  Share,
  CreditCard,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Printer,
  RotateCcw,
  RefreshCw,
  Download,
  X,
  Minus,
  Plus,
  Maximize,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  DISTRICTS,
  upazilasForDistrict,
  districtBnById,
  upazilaBnById,
} from "./bd-geo-data";

const FAMILY_CARD_BN: Record<string, string> = {
  "no results found": "কোনো ফলাফল পাওয়া যায়নি",
  "family card application preview": "ফ্যামিলি কার্ডের আবেদনপত্রের পূর্বরূপ",
  "family card application": "ফ্যামিলি কার্ডের আবেদনপত্র",
  "attach passport": "পাসপোর্ট সাইজের ছবি সংযুক্ত করুন",
  "photo with stapler": "স্ট্যাপলার দিয়ে ছবি লাগান",
  "to,": "বরাবর,",
  "[union/municipality name]": "[ইউনিয়ন/পৌরসভার নাম]",
  "subject: regarding family card / application for family card.":
    "বিষয়: ফ্যামিলি কার্ড / ফ্যামিলি কার্ডের জন্য আবেদন।",
  "sir,": "জনাব,",
  "i hereby certify that i am a permanent resident of the said ward/union/municipality area. due to socio-economic reasons and to receive government benefits and vgf/ration-related services, i need a family card. detailed information about me and my family is provided below:":
    "আমি এই মর্মে প্রত্যয়ন করছি যে, আমি উল্লিখিত ওয়ার্ড/ইউনিয়ন/পৌরসভা এলাকার স্থায়ী বাসিন্দা। আর্থ-সামাজিক কারণে এবং সরকারি সহায়তা ও VGF/রেশন-সংক্রান্ত সুবিধা গ্রহণের জন্য আমার একটি ফ্যামিলি কার্ড প্রয়োজন। আমার ও আমার পরিবারের বিস্তারিত তথ্য নিচে দেওয়া হলো:",
  "applicant name:": "আবেদনকারীর নাম:",
  "father/husband name:": "পিতা/স্বামীর নাম:",
  "mother name:": "মাতার নাম:",
  "national id number:": "জাতীয় পরিচয়পত্র নম্বর:",
  "mobile number:": "মোবাইল নম্বর:",
  "current and permanent address:": "বর্তমান ও স্থায়ী ঠিকানা:",
  "village/neighbourhood:": "গ্রাম/মহল্লা:",
  "post office:": "ডাকঘর:",
  "ward no.:": "ওয়ার্ড নম্বর:",
  "upazila:": "উপজেলা:",
  "district:": "জেলা:",
  "family member details:": "পরিবারের সদস্যদের তথ্য:",
  "therefore, after verifying the above information, i kindly request you to take the necessary steps to issue me a family card.":
    "অতএব, উপরোক্ত তথ্য যাচাই করে আমাকে একটি ফ্যামিলি কার্ড ইস্যুর জন্য প্রয়োজনীয় ব্যবস্থা গ্রহণের অনুরোধ করছি।",
  "signature (recipient / ward representative)":
    "স্বাক্ষর (প্রাপক / ওয়ার্ড প্রতিনিধি)",
  "yours faithfully,": "বিনীত,",
  "applicant signature": "আবেদনকারীর স্বাক্ষর",
  "sohoj tools": "সহজ টুলস",
  "general tools": "সাধারণ টুলস",
  "family card form": "ফ্যামিলি কার্ড ফর্ম",
  free: "বিনামূল্যে",
  used: "ব্যবহৃত",
  times: "বার",
  "fill in your details on the left — see a live application letter on the right and download as pdf.":
    "বাম পাশে আপনার তথ্য পূরণ করুন — ডান পাশে আবেদনপত্রের সরাসরি পূর্বরূপ দেখুন এবং PDF হিসেবে ডাউনলোড করুন।",
  settings: "সেটিংস",
  "preview updates as you type.": "আপনি লিখলে পূর্বরূপ সঙ্গে সঙ্গে আপডেট হবে।",
  "general information": "সাধারণ তথ্য",
  "recipient, applicant and contact details":
    "প্রাপক, আবেদনকারী ও যোগাযোগের তথ্য",
  "select recipient": "প্রাপক নির্বাচন করুন",
  "union / municipality name": "ইউনিয়ন / পৌরসভার নাম",
  "e.g. 1st union parishad": "যেমন: ১ম ইউনিয়ন পরিষদ",
  "applicant full name": "আবেদনকারীর পূর্ণ নাম",
  "applicant name": "আবেদনকারীর নাম",
  "father / husband name": "পিতা / স্বামীর নাম",
  "mother name": "মাতার নাম",
  "national id (nid) number": "জাতীয় পরিচয়পত্র (NID) নম্বর",
  "national id number": "জাতীয় পরিচয়পত্র নম্বর",
  "mobile number": "মোবাইল নম্বর",
  "full address": "সম্পূর্ণ ঠিকানা",
  "current and permanent address": "বর্তমান ও স্থায়ী ঠিকানা",
  "village / neighbourhood": "গ্রাম / মহল্লা",
  "village name": "গ্রামের নাম",
  "post office name": "ডাকঘরের নাম",
  "ward number": "ওয়ার্ড নম্বর",
  "e.g. 05": "যেমন: ০৫",
  "district name": "জেলার নাম",
  "upazila name": "উপজেলার নাম",
  "family details (children)": "পরিবারের তথ্য (সন্তান)",
  "number of sons and daughters": "ছেলে ও মেয়ে সন্তানের সংখ্যা",
  "number of sons": "ছেলে সন্তানের সংখ্যা",
  "e.g. 2": "যেমন: ২",
  "number of daughters": "মেয়ে সন্তানের সংখ্যা",
  "e.g. 1": "যেমন: ১",
  "clear all": "সব পরিষ্কার করুন",
  "processing...": "প্রক্রিয়াকরণ চলছে...",
  print: "প্রিন্ট করুন",
  preview: "পূর্বরূপ",
  empty: "খালি",
  "zoom out": "ছোট করে দেখুন",
  "zoom in": "বড় করে দেখুন",
  "fit page": "পুরো পৃষ্ঠা দেখুন",
  "live preview": "সরাসরি পূর্বরূপ",
  "update preview": "পূর্বরূপ আপডেট করুন",
  "bangla digits (০১২৩)": "বাংলা সংখ্যা (০১২৩)",
  "• drag to move": "• সরাতে টেনে নিন",
  "zoomed form preview. drag to move the page.":
    "বড় করে দেখা ফর্মের পূর্বরূপ। পৃষ্ঠাটি সরাতে টেনে নিন।",
  "form preview": "ফর্মের পূর্বরূপ",
  "a4 · 210 × 297 mm — print and pdf use this exact layout.":
    "A4 · 210 × 297 মিমি — প্রিন্ট ও PDF-এ ঠিক এই বিন্যাস ব্যবহার করা হবে।",
  "important information and instructions:": "গুরুত্বপূর্ণ তথ্য ও নির্দেশনা:",
  "the following documents must be attached:":
    "নিম্নলিখিত কাগজপত্র সংযুক্ত করতে হবে:",
  "attach one colour passport-size photo to the application form with a stapler.":
    "আবেদনপত্রের সঙ্গে একটি রঙিন পাসপোর্ট সাইজের ছবি স্ট্যাপলার দিয়ে সংযুক্ত করুন।",
  "submit a photocopy of the national id (nid) with the application form.":
    "আবেদনপত্রের সঙ্গে জাতীয় পরিচয়পত্রের (NID) একটি ফটোকপি জমা দিন।",
  "submit photocopies of national ids of other family members (if any).":
    "প্রয়োজনে পরিবারের অন্যান্য সদস্যদের জাতীয় পরিচয়পত্রের ফটোকপি জমা দিন।",
  "an active mobile number must be provided.":
    "একটি সচল মোবাইল নম্বর দিতে হবে।",
  "fill in all information correctly and accurately. the application may be cancelled for incorrect information.":
    "সব তথ্য সঠিক ও নির্ভুলভাবে পূরণ করুন। ভুল তথ্য দেওয়া হলে আবেদন বাতিল হতে পারে।",
  "submit this form to a respectable person in your area — member, chairman, councillor or mayor. there is no online system to apply for a family card.":
    "এই ফর্মটি আপনার এলাকার সম্মানিত ব্যক্তি—সদস্য, চেয়ারম্যান, কাউন্সিলর বা মেয়রের কাছে জমা দিন। ফ্যামিলি কার্ডের জন্য আবেদন করার কোনো অনলাইন ব্যবস্থা নেই।",
  "you do not need to pay anyone or use a broker to get this government benefit — the family card is distributed free of charge by the government.":
    "এই সরকারি সুবিধা পেতে কাউকে টাকা দিতে বা কোনো দালাল ব্যবহার করতে হবে না—সরকার বিনামূল্যে ফ্যামিলি কার্ড বিতরণ করে।",
  "your files are processed in the browser — they are not uploaded to any server.":
    "আপনার ফাইলগুলো ব্রাউজারেই প্রক্রিয়াকরণ করা হয়—কোনো সার্ভারে আপলোড করা হয় না।",
  "how to use": "যেভাবে ব্যবহার করবেন",
  "1. fill in your personal details, address, and family information on the left panel.":
    "১. বাম পাশের অংশে আপনার ব্যক্তিগত তথ্য, ঠিকানা ও পরিবারের তথ্য পূরণ করুন।",
  "2. watch the application letter update live on the right panel.":
    "২. ডান পাশের অংশে আবেদনপত্রটি কীভাবে সঙ্গে সঙ্গে আপডেট হচ্ছে তা দেখুন।",
  "3. print or download the form as a pdf to submit.":
    "৩. জমা দেওয়ার জন্য ফর্মটি প্রিন্ট করুন অথবা PDF হিসেবে ডাউনলোড করুন।",
  "tools in the same category": "একই ক্যাটাগরির টুলস",
  "print or download a blank form now, then fill it in by hand later.":
    "এখনই একটি খালি ফর্ম প্রিন্ট বা ডাউনলোড করুন, পরে হাতে পূরণ করুন।",
  "restore last application": "সর্বশেষ আবেদন পুনরুদ্ধার করুন",
  "download pdf": "PDF ডাউনলোড করুন",
  "voter migration form": "ভোটার স্থানান্তর ফর্ম",
  "fill in your details on the left — see a live form-13 on the right and download it as pdf.":
    "বাম পাশে আপনার তথ্য পূরণ করুন — ডান পাশে ফর্ম-১৩-এর সরাসরি পূর্বরূপ দেখুন এবং PDF হিসেবে ডাউনলোড করুন।",
  "reduce video file size": "ভিডিওর আকার কমান",
  "check status of department of social services allowance application status — by tracking id or nid — and print the result.":
    "ট্র্যাকিং আইডি বা NID দিয়ে সমাজসেবা অধিদপ্তরের ভাতা আবেদনের অবস্থা দেখুন এবং ফলাফল প্রিন্ট করুন।",
  "go back": "পিছনে যান",
  favorite: "পছন্দের তালিকায় রাখুন",
  share: "শেয়ার করুন",
  clear: "পরিষ্কার করুন",
  "no saved application found yet.": "এখনও কোনো সংরক্ষিত আবেদন পাওয়া যায়নি।",
  "last application restored.": "সর্বশেষ আবেদন পুনরুদ্ধার করা হয়েছে।",
  "couldn't restore the last application.":
    "সর্বশেষ আবেদন পুনরুদ্ধার করা যায়নি।",
  "all fields cleared.": "সব ঘর পরিষ্কার করা হয়েছে।",
  "page link copied.": "পেজের লিংক কপি হয়েছে।",
  "sharing is not supported in this browser.":
    "এই ব্রাউজারে শেয়ার করার সুবিধা নেই।",
  "sharing was blocked by the browser.": "ব্রাউজার শেয়ারিং বন্ধ করে দিয়েছে।",
  "couldn't open the print dialog. please try again.":
    "প্রিন্ট ডায়ালগ খোলা যায়নি। আবার চেষ্টা করুন।",
  "printable page is not available.": "প্রিন্ট করার পৃষ্ঠা পাওয়া যায়নি।",
  "pdf downloaded.": "PDF ডাউনলোড হয়েছে।",
  "couldn't generate the pdf. please try again.":
    "PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।",
  "fill in the family card application online.":
    "অনলাইনে ফ্যামিলি কার্ডের আবেদনপত্র পূরণ করুন।",
  "enter a valid bangladesh mobile number (starts with 01, e.g. 01783666743).":
    "সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (০১ দিয়ে শুরু, যেমন: ০১৭৮৩৬৬৬৭৪৩)।",
  "nid number must be 10, 13 or 17 digits.":
    "NID নম্বর ১০, ১৩ অথবা ১৭ সংখ্যার হতে হবে।",
  "chairman/mayor": "চেয়ারম্যান/মেয়র",
  chairman: "চেয়ারম্যান",
  mayor: "মেয়র",
  "ward member": "ওয়ার্ড সদস্য",
  "ward representative": "ওয়ার্ড প্রতিনিধি",
};

function normalizeFamilyText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function familyTranslate(value: string, locale: "en" | "bn") {
  if (locale === "en") return value;
  if (!/[A-Za-z]/.test(value)) return value;
  return FAMILY_CARD_BN[normalizeFamilyText(value)] ?? value;
}

function FamilyT({ children }: { children: React.ReactNode }) {
  const { locale } = useSohozI18n();
  if (typeof children !== "string" && typeof children !== "number")
    return <>{children}</>;
  return <>{familyTranslate(String(children), locale)}</>;
}

const STORAGE_KEY = "sohojkaj:family-card-form:last-application";
const USAGE_KEY = "sohojkaj:family-card-form:usage-count";
const relatedTools = [
  {
    title: "Voter Migration Form",
    description:
      "Fill in your details on the left — see a live Form-13 on the right and download it as PDF.",
    href: "/sohoj-tools/voter-migration-form",
    icon: FileText,
  },
  {
    title: "Reduce Video File Size",
    description:
      "Check status of Department of Social Services allowance application status — by tracking id or NID — and print the result.",
    href: "/sohoj-tools/reduce-video-file-size",
    icon: FileText,
  },
];
interface FormState {
  recipient: string;
  unionName: string;
  applicantName: string;
  fatherHusband: string;
  motherName: string;
  nidNumber: string;
  mobileNumber: string;
  village: string;
  postOffice: string;
  wardNo: string;
  upazila: string;
  district: string;
  numSons: string;
  numDaughters: string;
}
const DEFAULT_RECIPIENT = "Chairman/Mayor";
const RECIPIENT_OPTIONS = [
  "Chairman/Mayor",
  "Chairman",
  "Mayor",
  "Ward Member",
  "Ward Representative",
];
const EMPTY_STATE: FormState = {
  recipient: DEFAULT_RECIPIENT,
  unionName: "",
  applicantName: "",
  fatherHusband: "",
  motherName: "",
  nidNumber: "",
  mobileNumber: "",
  village: "",
  postOffice: "",
  wardNo: "",
  upazila: "",
  district: "",
  numSons: "",
  numDaughters: "",
};
/** Every field that counts towards the progress bar (recipient has a default). */
const PROGRESS_KEYS: Array<keyof FormState> = [
  "unionName",
  "applicantName",
  "fatherHusband",
  "motherName",
  "nidNumber",
  "mobileNumber",
  "village",
  "postOffice",
  "wardNo",
  "district",
  "upazila",
  "numSons",
  "numDaughters",
];
interface GeoOption {
  id: string;
  bn: string;
}
/* ────────────────────────────────────────────────────────────────────────── */
/*  Bangla font (paper uses Times for Latin + Noto Serif Bengali for Bangla)  */
/* ────────────────────────────────────────────────────────────────────────── */
const FONT_LINK_ID = "family-card-paper-fonts";
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;700&family=Tinos:wght@400;700&display=swap";
function ensurePaperFonts() {
  if (typeof document === "undefined") return;
  if (document.getElementById(FONT_LINK_ID)) return;
  const link = document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href = FONT_HREF;
  document.head.appendChild(link);
}
function nextFrames(count: number) {
  return new Promise<void>((resolve) => {
    const step = (left: number) => {
      if (left <= 0) resolve();
      else requestAnimationFrame(() => step(left - 1));
    };
    step(count);
  });
}
/**
 * Print / PDF must wait until the Bangla font is really usable,
 * otherwise the first export can be rendered with a fallback font.
 */
async function waitForPaperFonts() {
  try {
    if (typeof document !== "undefined" && document.fonts) {
      const sample = "অআকখ ছেলে সন্তান ১২৩৪ Family Card 0123";
      await Promise.race([
        Promise.all([
          document.fonts.load('400 16px "Noto Serif Bengali"', sample),
          document.fonts.load('700 16px "Noto Serif Bengali"', sample),
          document.fonts.load('400 16px "Tinos"', sample),
          document.fonts.load('700 16px "Tinos"', sample),
        ]),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);
      await document.fonts.ready;
    }
  } catch {
    // Font readiness is best-effort.
  }
  await nextFrames(2);
}
/* ────────────────────────────────────────────────────────────────────────── */
/*  Left-panel UI                                                             */
/* ────────────────────────────────────────────────────────────────────────── */
function GeoCombobox({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (id: string) => void;
  options: GeoOption[];
  placeholder: string;
  disabled?: boolean;
}) {
  const { L: geoL } = useSohozI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);
  const selected = options.find((option) => option.id === value);
  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return options;
    return options.filter((option) => option.bn.includes(q));
  }, [options, query]);
  return (
    <div ref={rootRef} className="relative">
      <div
        onClick={() => {
          if (disabled) return;
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className={`w-full bg-white border rounded-lg px-2.5 py-1.5 min-h-[34px] text-xs flex items-center gap-1.5 transition-colors ${
          disabled
            ? "border-[#EEE7D4] bg-gray-50 cursor-not-allowed"
            : "border-gray-200 cursor-text focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
        }`}
      >
        {selected ? (
          <span className="inline-flex items-center gap-1 bg-[#E8EEFF] text-[#3C5FCA] rounded-md pl-1.5 pr-1 py-0.5 font-semibold max-w-full">
            <span className="truncate">{selected.bn}</span>

            {!disabled && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange("");
                  setQuery("");
                }}
                className="text-[#6C83D4] hover:text-[#3C5FCA] shrink-0"
                aria-label={`${geoL("Clear")} ${placeholder}`}
              >
                <X size={11} />
              </button>
            )}
          </span>
        ) : null}

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
          }}
          placeholder={selected ? "" : placeholder}
          className="flex-1 min-w-[2rem] outline-none bg-transparent text-xs text-[#42382C] placeholder:text-[#9A907F] disabled:cursor-not-allowed"
        />

        <ChevronDown
          size={13}
          className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          {filtered.length === 0 ? (
            <p className="text-[11px] text-gray-400 px-2 py-2 text-center">
              <FamilyT>{"No results found\n            "}</FamilyT>
            </p>
          ) : (
            <div
              className={
                filtered.length > 12
                  ? "grid grid-cols-2 gap-x-2"
                  : "flex flex-col"
              }
            >
              {filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`text-left text-xs px-2 py-1.5 rounded-md hover:bg-[#F0F3FF] transition-colors truncate ${
                    option.id === value
                      ? "bg-[#E8EEFF] text-[#3C5FCA] font-semibold"
                      : "text-[#42382C]"
                  }`}
                >
                  {option.bn}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
/** Label with the small Bangla "paper number" chip that links a field to the preview. */
function Field({
  label,
  no,
  children,
}: {
  label: string;
  no?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        {no ? (
          <span className="inline-flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded bg-[#E8EEFF] px-1 text-[10px] font-bold text-[#3C5FCA]">
            {no}
          </span>
        ) : null}
        <label className="text-[11px] font-semibold text-[#665D4F]">
          <FamilyT>{label}</FamilyT>
        </label>
      </div>

      {children}
    </div>
  );
}
const INPUT_CLASS =
  "w-full bg-white border rounded-lg px-2.5 py-1.5 min-h-[34px] text-xs text-[#42382C] placeholder:text-[#9A907F] focus:outline-none focus:border-[#3C5FCA] focus:ring-2 focus:ring-[#E8EEFF]";
function TextInput({
  value,
  onChange,
  placeholder,
  inputMode,
  maxLength,
  validate,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: "text" | "numeric" | "tel";
  maxLength?: number;
  validate?: (value: string) => string;
}) {
  const [touched, setTouched] = useState(false);
  const message = validate ? validate(value) : "";
  const showError = touched && Boolean(message);
  return (
    <>
      <input
        type="text"
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={showError}
        onBlur={() => setTouched(true)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${INPUT_CLASS} ${showError ? "border-red-300 focus:border-red-500" : "border-gray-200"}`}
      />

      {showError ? (
        <p
          role="alert"
          className="text-[10px] text-red-600 font-semibold leading-snug"
        >
          <FamilyT>{message}</FamilyT>
        </p>
      ) : null}
    </>
  );
}
function Section({
  no,
  title,
  subtitle,
  children,
}: {
  no: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3.5 border border-[#E8D9A8] rounded-xl p-3.5 bg-white">
      <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#F1E7C8]">
        <span className="w-6 h-6 shrink-0 rounded-md bg-[#3C5FCA] text-white text-[11px] font-bold flex items-center justify-center">
          {no}
        </span>

        <div className="min-w-0">
          <h3 className="text-xs font-bold text-[#42382C] leading-tight">
            {title}
          </h3>
          <p className="text-[10px] text-[#786D5B] leading-tight">
            <FamilyT>{subtitle}</FamilyT>
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}
const validateMobile = (v: string) =>
  v && !/^01[3-9]\d{8}$/.test(v)
    ? "Enter a valid Bangladesh mobile number (starts with 01, e.g. 01783666743)."
    : "";
const validateNid = (v: string) =>
  v && ![10, 13, 17].includes(v.length)
    ? "NID number must be 10, 13 or 17 digits."
    : "";
/* ────────────────────────────────────────────────────────────────────────── */
/*  A4 application paper  (preview = print = PDF, one single component)       */
/* ────────────────────────────────────────────────────────────────────────── */
// @@PAPER_START
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const toBnDigits = (v: string) => v.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
const toEnDigits = (v: string) =>
  v.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
/** Accepts English or Bangla digits, keeps English digits only. */
const digitsOnly = (v: string, max: number) =>
  toEnDigits(v)
    .replace(/[^0-9]/g, "")
    .slice(0, max);
const PAPER_FONT_STACK = `"Times New Roman", "Tinos", Times, "Noto Serif Bengali", "Kalpurush", "Nirmala UI", "Vrinda", serif`;
const FAMILY_CARD_PRINT_CSS = `
  .family-card-page {
    --fc-ink: #111111;
    --fc-muted: #5a5a5a;
    --fc-line: #4b4b4b;

    box-sizing: border-box;
    position: relative;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 210mm;
    height: 297mm;
    margin: 0;
    padding: 14mm 16mm 13mm;
    overflow: hidden;
    background: #ffffff;
    color: var(--fc-ink);
    text-align: left;

    font-family: ${PAPER_FONT_STACK};
    font-size: 13px;
    line-height: 1.5;
    font-weight: 400;

    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .family-card-page *,
  .family-card-page *::before,
  .family-card-page *::after {
    box-sizing: border-box;
  }

  .family-card-page:not(.family-card-flat) {
    box-shadow: 0 4px 14px -10px rgba(20, 20, 30, 0.35);
  }

  /* ── header: title + recipient (left) + photo box (right) ── */
  .fc-head {
    position: relative;
    min-height: 45mm;
  }

  .fc-title {
    margin: 0;
    padding: 0;
    text-align: center;
    font-size: 17px;
    line-height: 1.3;
    font-weight: 700;
    text-decoration-line: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }

  .fc-photo {
    position: absolute;
    top: 0;
    right: 0;
    width: 35mm;
    height: 45mm;
    padding: 2.5mm;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    border: 1px dashed #777777;
    color: var(--fc-muted);
    font-size: 11px;
    line-height: 1.35;
  }

  .fc-recipient {
    margin-top: 8mm;
    width: calc(100% - 42mm);
    min-width: 0;
    line-height: 1.5;
  }

  .fc-placeholder {
    color: #9a9a9a;
  }

  .fc-union-line {
    display: inline-block;
    width: 70mm;
    height: 5mm;
    vertical-align: bottom;
    border-bottom: 1px dotted var(--fc-line);
  }

  /* ── subject + salutation + paragraphs ── */
  .fc-subject {
    margin: 7mm 0 0;
    font-weight: 700;
  }

  .fc-para {
    margin: 0;
    line-height: 1.55;
  }

  /* ── numbered list ১। – ৭। ── */
  .fc-list {
    display: grid;
    gap: 5.6mm;
    margin-top: 6mm;
  }

  .fc-item {
    display: grid;
    grid-template-columns: 8mm 46mm minmax(0, 1fr);
    column-gap: 1mm;
    align-items: start;
    min-width: 0;
  }

  .fc-item.single {
    align-items: end;
  }

  .fc-no {
    white-space: nowrap;
  }

  .fc-label {
    min-width: 0;
    padding-bottom: 0.4mm;
    line-height: 1.4;
  }

  .fc-content {
    min-width: 0;
  }

  /* dotted line with the live value sitting on it */
  .fc-rule {
    flex: 1 1 auto;
    min-width: 8mm;
    min-height: 6.6mm;
    display: flex;
    align-items: flex-end;
    border-bottom: 1px dotted var(--fc-line);
    overflow: hidden;
  }

  .fc-value {
    display: block;
    width: 100%;
    min-width: 0;
    padding: 0 1mm 0.5mm;
    font-weight: 700;
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fc-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    column-gap: 7mm;
    row-gap: 3.6mm;
    min-width: 0;
  }

  .fc-cell {
    display: flex;
    align-items: flex-end;
    gap: 1.5mm;
    min-width: 0;
    line-height: 1.4;
  }

  .fc-cell.wide {
    grid-column: 1 / -1;
  }

  .fc-cell-label {
    flex: 0 0 auto;
    padding-bottom: 0.4mm;
    white-space: nowrap;
  }

  .fc-cell-suffix {
    flex: 0 0 auto;
    padding-bottom: 0.4mm;
  }

  /* ── closing + signatures (pinned to the bottom) ── */
  .fc-closing {
    margin-top: 8mm;
  }

  .fc-signatures {
    margin-top: auto;
    padding-top: 8mm;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-size: 11.5px;
    line-height: 1.35;
    text-align: center;
  }

  .fc-sign {
    width: 68mm;
    min-width: 0;
  }

  .fc-sign-line {
    height: 12mm;
    border-bottom: 1px solid var(--fc-ink);
    margin-bottom: 1.6mm;
  }

  .fc-sign-note {
    margin-bottom: 1.5mm;
    font-size: 12.5px;
    text-align: center;
  }

  /* ── off-screen print / PDF host ── */
  #family-card-print-host {
    position: fixed;
    left: -10000px;
    top: 0;
    width: 210mm;
    height: 297mm;
    background: #ffffff;
    pointer-events: none;
  }

  @media print {
    @page {
      size: A4 portrait;
      margin: 0;
    }

    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      background: #ffffff !important;
    }

    body > *:not(#family-card-print-host) {
      display: none !important;
    }

    #family-card-print-host {
      display: block !important;
      position: static !important;
      left: auto !important;
      top: auto !important;
      width: 210mm !important;
      /* 1mm shorter than A4 so rounding never spills onto a 2nd page */
      height: 296mm !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      break-after: avoid !important;
      page-break-after: avoid !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    #family-card-print-host,
    #family-card-print-host * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;
/** Shrinks the font slightly for long values so text never gets cut. */
function fitPx(value: string, basePx: number, maxChars: number) {
  const length = Array.from(value.trim()).length;
  if (length <= maxChars) return basePx;
  const ratio = Math.max(0.6, maxChars / length);
  return Math.round(basePx * ratio * 10) / 10;
}
function Rule({
  value,
  basePx = 13,
  maxChars = 46,
}: {
  value: string;
  basePx?: number;
  maxChars?: number;
}) {
  const trimmed = value.trim();
  return (
    <span className="fc-rule">
      <span
        className="fc-value"
        style={{ fontSize: `${fitPx(trimmed, basePx, maxChars)}px` }}
      >
        {trimmed || "\u00A0"}
      </span>
    </span>
  );
}
function Item({
  no,
  label,
  single = true,
  children,
}: {
  no: number;
  label: string;
  single?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`fc-item${single ? " single" : ""}`}>
      <span className="fc-no">
        {toBnDigits(String(no))}
        <FamilyT>{"\u0964"}</FamilyT>
      </span>
      <span className="fc-label">
        <FamilyT>{label}</FamilyT>
      </span>
      <div className="fc-content">{children}</div>
    </div>
  );
}
function Cell({
  label,
  suffix,
  wide = false,
  children,
}: {
  label: string;
  suffix?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`fc-cell${wide ? " wide" : ""}`}>
      <span className="fc-cell-label">
        <FamilyT>{label}</FamilyT>
      </span>
      {children}
      {suffix ? (
        <span className="fc-cell-suffix">
          <FamilyT>{suffix}</FamilyT>
        </span>
      ) : null}
    </div>
  );
}
function FamilyCardPreview({
  values,
  districtLabel,
  upazilaLabel,
  bnDigits = false,
  flat = false,
  documentRef,
  id,
}: {
  values: FormState;
  districtLabel: string;
  upazilaLabel: string;
  bnDigits?: boolean;
  flat?: boolean;
  documentRef?: React.RefObject<HTMLDivElement | null>;
  id?: string;
}) {
  // Only numeric fields switch to Bangla digits; free text is left untouched.
  const d = (v: string) => (bnDigits ? toBnDigits(v) : v);
  const recipient = values.recipient.trim() || DEFAULT_RECIPIENT;
  const union = values.unionName.trim();
  const district = districtLabel || values.district;
  const upazila = upazilaLabel || values.upazila;
  return (
    <div
      id={id}
      ref={documentRef}
      className={`family-card-page${flat ? " family-card-flat" : ""}`}
      role={flat ? undefined : "document"}
      aria-label={
        flat
          ? undefined
          : familyTranslate(
              "Family Card Application preview",
              typeof document === "undefined"
                ? "en"
                : document.documentElement.getAttribute("data-locale") === "bn"
                  ? "bn"
                  : "en",
            )
      }
    >
      <header className="fc-head">
        <h2 className="fc-title">
          <FamilyT>{"Family Card Application"}</FamilyT>
        </h2>

        <div className="fc-photo">
          <span>
            <FamilyT>{"Attach passport\n            "}</FamilyT>
            <br />
            <FamilyT>{"photo with stapler\n          "}</FamilyT>
          </span>
        </div>

        <div className="fc-recipient">
          <div>
            <strong>
              <FamilyT>{"To,"}</FamilyT>
            </strong>
          </div>
          <div>
            <strong>
              <FamilyT>{recipient}</FamilyT>
            </strong>
          </div>
          <div>
            {union ? (
              union
            ) : flat ? (
              <span className="fc-union-line" />
            ) : (
              <span className="fc-placeholder">
                <FamilyT>{"[Union/municipality name]"}</FamilyT>
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="fc-subject">
        <FamilyT>
          {
            "Subject: Regarding Family Card / application for Family Card.\n      "
          }
        </FamilyT>
      </div>

      <div style={{ marginTop: "6mm" }}>
        <p className="fc-para">
          <strong>
            <FamilyT>{"Sir,"}</FamilyT>
          </strong>
        </p>
        <p className="fc-para" style={{ marginTop: "2.5mm" }}>
          <FamilyT>
            {
              "I hereby certify that I am a permanent resident of the said\n          ward/union/municipality area. Due to socio-economic reasons and to\n          receive government benefits and VGF/ration-related services, I need a\n          family card. Detailed information about me and my family is provided\n          below:\n        "
            }
          </FamilyT>
        </p>
      </div>

      <div className="fc-list">
        <Item no={1} label="Applicant name:">
          <Rule value={values.applicantName} maxChars={46} />
        </Item>

        <Item no={2} label="Father/husband name:">
          <Rule value={values.fatherHusband} maxChars={46} />
        </Item>

        <Item no={3} label="Mother name:">
          <Rule value={values.motherName} maxChars={46} />
        </Item>

        <Item no={4} label="National ID number:">
          <Rule value={d(values.nidNumber)} maxChars={30} />
        </Item>

        <Item no={5} label="Mobile number:">
          <Rule value={d(values.mobileNumber)} maxChars={30} />
        </Item>

        <Item no={6} label="Current and permanent address:" single={false}>
          <div className="fc-grid">
            <Cell label="Village/neighbourhood:" wide>
              <Rule value={values.village} maxChars={40} />
            </Cell>

            <Cell label="Post office:">
              <Rule value={values.postOffice} maxChars={18} />
            </Cell>

            <Cell label="Ward no.:">
              <Rule value={d(values.wardNo)} maxChars={10} />
            </Cell>

            <Cell label="Upazila:">
              <Rule value={upazila} maxChars={20} />
            </Cell>

            <Cell label="District:">
              <Rule value={district} maxChars={20} />
            </Cell>
          </div>
        </Item>

        <Item no={7} label="Family member details:">
          <div className="fc-grid">
            <Cell label="ছেলে সন্তান:" suffix="জন">
              <Rule value={d(values.numSons)} maxChars={6} />
            </Cell>

            <Cell label="মেয়ে সন্তান:" suffix="জন">
              <Rule value={d(values.numDaughters)} maxChars={6} />
            </Cell>
          </div>
        </Item>
      </div>

      <div className="fc-closing">
        <p className="fc-para">
          <FamilyT>
            {
              "Therefore, after verifying the above information, I kindly request you\n          to take the necessary steps to issue me a Family Card.\n        "
            }
          </FamilyT>
        </p>
      </div>

      <div className="fc-signatures">
        <div className="fc-sign">
          <div className="fc-sign-line" />
          <div>
            <FamilyT>{"Signature (recipient / ward representative)"}</FamilyT>
          </div>
        </div>

        <div className="fc-sign">
          <div className="fc-sign-note">
            <FamilyT>{"Yours faithfully,"}</FamilyT>
          </div>
          <div className="fc-sign-line" />
          <div>
            <FamilyT>{"Applicant signature"}</FamilyT>
          </div>
        </div>
      </div>
    </div>
  );
}
// @@PAPER_END
/** Off-screen host used for both Print and PDF (mounted only on demand). */
function PrintHost({
  values,
  districtLabel,
  upazilaLabel,
  bnDigits,
}: {
  values: FormState;
  districtLabel: string;
  upazilaLabel: string;
  bnDigits: boolean;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div id="family-card-print-host" aria-hidden="true">
      <FamilyCardPreview
        id="family-card-print-page"
        values={values}
        districtLabel={districtLabel}
        upazilaLabel={upazilaLabel}
        bnDigits={bnDigits}
        flat
      />
    </div>,
    document.body,
  );
}
/* ────────────────────────────────────────────────────────────────────────── */
/*  Main component                                                            */
/* ────────────────────────────────────────────────────────────────────────── */
export default function FamilyCardForm() {
  const { locale } = useSohozI18n();
  const router = useRouter();
  const familyL = useCallback(
    (value: string) => familyTranslate(value, locale),
    [locale],
  );
  const [form, setForm] = useState<FormState>(EMPTY_STATE);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isProcessing, setIsProcessing] = useState<"print" | "download" | null>(
    null,
  );
  const [renderHost, setRenderHost] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [frozen, setFrozen] = useState<FormState | null>(null);
  const [bnDigits, setBnDigits] = useState(false);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const panStateRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [previewFitScale, setPreviewFitScale] = useState(0.62);
  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );
  /* load paper fonts once */
  useEffect(() => {
    ensurePaperFonts();
  }, []);
  /* fit the whole A4 page into the preview viewport */
  useEffect(() => {
    const container = previewScrollRef.current;
    if (!container) return;
    const updateFitScale = () => {
      const availableWidth = Math.max(280, container.clientWidth - 40);
      const availableHeight = Math.max(420, container.clientHeight - 40);
      const a4CssWidth = (210 / 25.4) * 96;
      const a4CssHeight = (297 / 25.4) * 96;
      setPreviewFitScale(
        Math.min(1, availableWidth / a4CssWidth, availableHeight / a4CssHeight),
      );
    };
    updateFitScale();
    const observer = new ResizeObserver(updateFitScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    try {
      const rawUsage = window.localStorage.getItem(USAGE_KEY);
      if (rawUsage) setUsageCount(Number(rawUsage) || 0);
    } catch {
      // Ignore storage errors.
    }
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);
  /* Ctrl+P / browser-menu print also gets the clean A4 page */
  useEffect(() => {
    const before = () => flushSync(() => setRenderHost(true));
    const after = () => flushSync(() => setRenderHost(false));
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
  const allUpazilaOptions = useMemo<GeoOption[]>(() => {
    const seen = new Set<string>();
    const result: GeoOption[] = [];
    for (const districtOption of DISTRICTS) {
      for (const option of upazilasForDistrict(districtOption.id)) {
        if (seen.has(option.id)) continue;
        seen.add(option.id);
        result.push(option);
      }
    }
    return result;
  }, []);
  const upazilaOptions = useMemo(
    () =>
      form.district ? upazilasForDistrict(form.district) : allUpazilaOptions,
    [allUpazilaOptions, form.district],
  );
  const previewValues = live ? form : (frozen ?? form);
  const districtLabel = (state: FormState) =>
    state.district ? (districtBnById(state.district) ?? "") : "";
  const upazilaLabel = (state: FormState) =>
    state.upazila ? (upazilaBnById(state.upazila) ?? "") : "";
  const filledCount = PROGRESS_KEYS.filter(
    (key) => form[key].trim() !== "",
  ).length;
  const anyFieldFilled = filledCount > 0;
  /* ── persistence ── */
  const saveLastApplication = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      // Ignore storage errors.
    }
  };
  const bumpUsageCount = () => {
    try {
      const next = usageCount + 1;
      window.localStorage.setItem(USAGE_KEY, String(next));
      setUsageCount(next);
    } catch {
      // Ignore storage errors.
    }
  };
  const handleRestoreLastApplication = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setToast(familyL("No saved application found yet."));
        return;
      }
      const parsed = JSON.parse(raw) as Partial<FormState>;
      const next: FormState = { ...EMPTY_STATE };
      (Object.keys(EMPTY_STATE) as Array<keyof FormState>).forEach((key) => {
        const value = parsed[key];
        if (typeof value === "string") next[key] = value;
      });
      if (!next.recipient) next.recipient = DEFAULT_RECIPIENT;
      setForm(next);
      setFrozen(null);
      setToast(familyL("Last application restored."));
    } catch {
      setToast(familyL("Couldn't restore the last application."));
    }
  };
  const handleClear = () => {
    setForm({ ...EMPTY_STATE });
    setFrozen(null);
    setToast(familyL("All fields cleared."));
  };
  const handleShare = async () => {
    const payload = {
      title: familyL("Family Card Form"),
      text: familyL("Fill in the Family Card application online."),
      url: window.location.href,
    };
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(payload);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setToast(familyL("Page link copied."));
      } else {
        setToast(familyL("Sharing is not supported in this browser."));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setToast(familyL("Sharing was blocked by the browser."));
    }
  };
  /* ── print & PDF (both render the same off-screen A4 host) ── */
  const handlePrint = async () => {
    // Printing a blank form is intentionally allowed.
    if (isProcessing) return;
    setIsProcessing("print");
    saveLastApplication();
    try {
      flushSync(() => setRenderHost(true));
      await waitForPaperFonts();
      bumpUsageCount();
      window.print(); // host is removed again by the "afterprint" listener
    } catch (error) {
      console.error(error);
      setRenderHost(false);
      setToast(familyL("Couldn't open the print dialog. Please try again."));
    } finally {
      setIsProcessing(null);
    }
  };
  const handleDownloadPdf = async () => {
    // PDF download of a blank form is allowed too.
    if (isProcessing) return;
    setIsProcessing("download");
    saveLastApplication();
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      flushSync(() => setRenderHost(true));
      await waitForPaperFonts();
      const page = document.getElementById("family-card-print-page");
      if (!page) throw new Error("Printable page is not available.");
      const canvas = await html2canvas(page, {
        backgroundColor: "#ffffff",
        scale: 3, // ≈ 288 dpi on A4
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1280,
        windowHeight: 1400,
        // The host lives off-screen. Move it into view inside the clone only,
        // so the capture is never blank or shifted by page scroll.
        onclone: (clonedDoc: Document) => {
          const host = clonedDoc.getElementById("family-card-print-host");
          if (host) {
            host.style.position = "fixed";
            host.style.left = "0";
            host.style.top = "0";
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
        title: "Family Card Application",
        subject: "Family Card Application",
      });
      // Keep the captured aspect ratio; never exceed the A4 page.
      const imgW = 210;
      const imgH = Math.min(297, (canvas.height * imgW) / canvas.width);
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        imgW,
        imgH,
        undefined,
        "FAST",
      );
      const safeName = form.applicantName
        .trim()
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40)
        .toLowerCase();
      pdf.save(
        safeName
          ? `family-card-${safeName}.pdf`
          : "family-card-application.pdf",
      );
      bumpUsageCount();
      setToast(familyL("PDF downloaded."));
    } catch (error) {
      console.error(error);
      setToast(familyL("Couldn't generate the PDF. Please try again."));
    } finally {
      setRenderHost(false);
      setIsProcessing(null);
    }
  };
  /* ── preview zoom / pan ── */
  const zoomFactor = zoom / 100;
  const previewScale = previewFitScale * zoomFactor;
  const scaledPreviewWidth = 210 * previewScale;
  const scaledPreviewHeight = 297 * previewScale;
  const isZoomedBeyondFit = zoomFactor > 1.001;
  const handlePreviewPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!isZoomedBeyondFit) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const container = previewScrollRef.current;
    if (!container) return;
    panStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: container.scrollLeft,
      startScrollTop: container.scrollTop,
    };
    container.setPointerCapture(event.pointerId);
    setIsPanning(true);
    event.preventDefault();
  };
  const handlePreviewPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const pan = panStateRef.current;
    if (!pan.active || pan.pointerId !== event.pointerId) return;
    const container = previewScrollRef.current;
    if (!container) return;
    container.scrollLeft = pan.startScrollLeft - (event.clientX - pan.startX);
    container.scrollTop = pan.startScrollTop - (event.clientY - pan.startY);
    event.preventDefault();
  };
  const endPreviewPan = (event?: React.PointerEvent<HTMLDivElement>) => {
    const pan = panStateRef.current;
    if (!pan.active) return;
    const container = previewScrollRef.current;
    if (container && event && container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
    panStateRef.current = {
      active: false,
      pointerId: -1,
      startX: 0,
      startY: 0,
      startScrollLeft: 0,
      startScrollTop: 0,
    };
    setIsPanning(false);
  };
  const resetPreview = () => {
    setZoom(100);
    previewScrollRef.current?.scrollTo({ left: 0, top: 0 });
  };
  const onLiveChange = (value: boolean) => {
    setLive(value);
    setFrozen(value ? null : form);
  };
  return (
    <div className="family-card-root w-full text-[#0F172A] font-sans pb-28">
      <style>{FAMILY_CARD_PRINT_CSS}</style>

      {toast ? (
        <div className="print-hide fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" />

          {toast}
        </div>
      ) : null}

      <div className="family-card-screen w-full space-y-6">
        <div className="print-hide flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-gray-200/60 rounded-md transition-colors text-[#0F172A] flex items-center justify-center -ml-1"
                title={familyL("Go back")}
                type="button"
              >
                <ArrowLeft size={16} />
              </button>

              <Link href="/sohoj-tools" className="hover:text-[#0F172A]">
                <FamilyT>{"Sohoj Tools\n              "}</FamilyT>
              </Link>

              <span>
                <FamilyT>{"/"}</FamilyT>
              </span>

              <span>
                <FamilyT>{"General Tools"}</FamilyT>
              </span>

              <span>
                <FamilyT>{"/"}</FamilyT>
              </span>

              <span className="text-[#0F172A] font-semibold">
                <FamilyT>{"Family Card Form\n              "}</FamilyT>
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <CreditCard size={18} />
              </div>

              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
                <FamilyT>{"Family Card Form\n              "}</FamilyT>
              </h1>

              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                <FamilyT>{"Free\n              "}</FamilyT>
              </span>

              <span className="flex items-center gap-1 text-[11px] text-gray-400 font-semibold">
                <CheckCircle2 size={12} className="text-gray-300" />
                <FamilyT>{"Used "}</FamilyT>
                {usageCount}
                <FamilyT>{"times\n              "}</FamilyT>
              </span>
            </div>

            <p className="text-xs text-gray-500 font-medium mt-1">
              <FamilyT>
                {
                  "Fill in your details on the left \u2014 see a live application letter\n              on the right and download as PDF.\n            "
                }
              </FamilyT>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsFavorite((favorite) => !favorite)}
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-blue-500 hover:border-blue-300 transition-all shadow-2xs"
              type="button"
              aria-label={familyL("Favorite")}
              aria-pressed={isFavorite}
            >
              <Star
                size={16}
                className={isFavorite ? "fill-blue-400 text-blue-400" : ""}
              />
            </button>

            <button
              onClick={handleShare}
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-[#0F172A] transition-all shadow-2xs"
              type="button"
              aria-label={familyL("Share")}
            >
              <Share size={16} />
            </button>
          </div>
        </div>

        <div className="print-hide grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ───────────── Left: settings ───────────── */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-[#E8D9A8] rounded-2xl p-4 shadow-2xs space-y-5">
              <div className="space-y-2 pb-3 border-b border-[#F1E7C8]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#42382C] uppercase tracking-wider">
                    <FamilyT>{"Settings\n                  "}</FamilyT>
                  </span>

                  <span className="text-[11px] text-gray-400 font-medium">
                    <FamilyT>
                      {"Preview updates as you type.\n                  "}
                    </FamilyT>
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F1E7C8]">
                    <div
                      className="h-full rounded-full bg-[#3C5FCA] transition-all"
                      style={{
                        width: `${(filledCount / PROGRESS_KEYS.length) * 100}%`,
                      }}
                    />
                  </div>

                  <span className="text-[10px] font-semibold text-[#786D5B] tabular-nums">
                    {filledCount}
                    <FamilyT>{"/ "}</FamilyT>
                    {PROGRESS_KEYS.length}
                  </span>
                </div>
              </div>

              <Section
                no={1}
                title={familyL("General information")}
                subtitle={familyL("Recipient, applicant and contact details")}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Select recipient">
                    <div className="relative">
                      <select
                        value={form.recipient}
                        onChange={(event) =>
                          setField("recipient", event.target.value)
                        }
                        className={`${INPUT_CLASS} appearance-none pr-8 cursor-pointer border-gray-200`}
                      >
                        {RECIPIENT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            <FamilyT>{option}</FamilyT>
                          </option>
                        ))}
                      </select>

                      <ChevronDown
                        size={13}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                    </div>
                  </Field>

                  <Field label="Union / municipality name">
                    <TextInput
                      value={form.unionName}
                      onChange={(v) => setField("unionName", v)}
                      placeholder={familyL("e.g. 1st Union Parishad")}
                      maxLength={50}
                    />
                  </Field>
                </div>

                <Field label="Applicant full name" no="১">
                  <TextInput
                    value={form.applicantName}
                    onChange={(v) => setField("applicantName", v)}
                    placeholder={familyL("Applicant name")}
                    maxLength={60}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Father / husband name" no="২">
                    <TextInput
                      value={form.fatherHusband}
                      onChange={(v) => setField("fatherHusband", v)}
                      placeholder={familyL("Father / husband name")}
                      maxLength={60}
                    />
                  </Field>

                  <Field label="Mother name" no="৩">
                    <TextInput
                      value={form.motherName}
                      onChange={(v) => setField("motherName", v)}
                      placeholder={familyL("Mother name")}
                      maxLength={60}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="National ID (NID) number" no="৪">
                    <TextInput
                      value={form.nidNumber}
                      onChange={(v) => setField("nidNumber", digitsOnly(v, 17))}
                      placeholder={familyL("National ID number")}
                      inputMode="numeric"
                      maxLength={17}
                      validate={validateNid}
                    />
                  </Field>

                  <Field label="Mobile number" no="৫">
                    <TextInput
                      value={form.mobileNumber}
                      onChange={(v) =>
                        setField("mobileNumber", digitsOnly(v, 11))
                      }
                      placeholder={familyL("01783666743")}
                      inputMode="tel"
                      maxLength={11}
                      validate={validateMobile}
                    />
                  </Field>
                </div>
              </Section>

              <Section
                no={2}
                title={familyL("Full address")}
                subtitle={familyL("Current and permanent address")}
              >
                <Field label="Village / neighbourhood" no="৬">
                  <TextInput
                    value={form.village}
                    onChange={(v) => setField("village", v)}
                    placeholder={familyL("Village name")}
                    maxLength={50}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Post office">
                    <TextInput
                      value={form.postOffice}
                      onChange={(v) => setField("postOffice", v)}
                      placeholder={familyL("Post office name")}
                      maxLength={30}
                    />
                  </Field>

                  <Field label="Ward number">
                    <TextInput
                      value={form.wardNo}
                      onChange={(v) => setField("wardNo", digitsOnly(v, 3))}
                      placeholder={familyL("e.g. 05")}
                      inputMode="numeric"
                      maxLength={3}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="District">
                    <GeoCombobox
                      value={form.district}
                      onChange={(id) => {
                        setForm((current) => ({
                          ...current,
                          district: id,
                          upazila: "",
                        }));
                      }}
                      options={DISTRICTS}
                      placeholder={familyL("District name")}
                    />
                  </Field>

                  <Field label="Upazila">
                    <GeoCombobox
                      value={form.upazila}
                      onChange={(id) => setField("upazila", id)}
                      options={upazilaOptions}
                      placeholder={familyL("Upazila name")}
                    />
                  </Field>
                </div>
              </Section>

              <Section
                no={3}
                title={familyL("Family details (children)")}
                subtitle={familyL("Number of sons and daughters")}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Number of sons" no="৭">
                    <TextInput
                      value={form.numSons}
                      onChange={(v) => setField("numSons", digitsOnly(v, 2))}
                      placeholder={familyL("e.g. 2")}
                      inputMode="numeric"
                      maxLength={2}
                    />
                  </Field>

                  <Field label="Number of daughters" no="৭">
                    <TextInput
                      value={form.numDaughters}
                      onChange={(v) =>
                        setField("numDaughters", digitsOnly(v, 2))
                      }
                      placeholder={familyL("e.g. 1")}
                      inputMode="numeric"
                      maxLength={2}
                    />
                  </Field>
                </div>
              </Section>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleClear}
                  className="w-full py-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                  type="button"
                >
                  <RotateCcw size={14} />

                  <span>
                    <FamilyT>{"Clear all"}</FamilyT>
                  </span>
                </button>

                <button
                  onClick={handlePrint}
                  disabled={isProcessing !== null}
                  className="w-full py-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60"
                  type="button"
                >
                  {isProcessing === "print" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Printer size={14} />
                  )}

                  <span>
                    {isProcessing === "print" ? (
                      <FamilyT>{"Processing..."}</FamilyT>
                    ) : (
                      <FamilyT>{"Print"}</FamilyT>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ───────────── Right: live preview ───────────── */}
          <div className="lg:col-span-7 lg:sticky lg:top-3">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />

                  <span>
                    <FamilyT>{"Preview"}</FamilyT>
                  </span>
                </span>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-1 py-0.5 border border-gray-200">
                    <button
                      onClick={() =>
                        setZoom((currentZoom) => Math.max(60, currentZoom - 10))
                      }
                      className="p-1 hover:bg-white rounded-md text-gray-500"
                      type="button"
                      aria-label={familyL("Zoom out")}
                    >
                      <Minus size={12} />
                    </button>

                    <span className="text-[11px] font-bold text-gray-600 w-9 text-center">
                      {zoom}
                      <FamilyT>{"%\n                    "}</FamilyT>
                    </span>

                    <button
                      onClick={() =>
                        setZoom((currentZoom) =>
                          Math.min(200, currentZoom + 10),
                        )
                      }
                      className="p-1 hover:bg-white rounded-md text-gray-500"
                      type="button"
                      aria-label={familyL("Zoom in")}
                    >
                      <Plus size={12} />
                    </button>

                    <button
                      onClick={resetPreview}
                      className="p-1 hover:bg-white rounded-md text-gray-400 hover:text-[#0F172A]"
                      type="button"
                      aria-label={familyL("Fit page")}
                      title={familyL("Fit page")}
                    >
                      <Maximize size={11} />
                    </button>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
                      anyFieldFilled
                        ? "text-[#2563EB] bg-[#F8FAFC]"
                        : "text-gray-400 bg-gray-100"
                    }`}
                  >
                    {anyFieldFilled ? (
                      <FamilyT>{"Preview"}</FamilyT>
                    ) : (
                      <FamilyT>{"Empty"}</FamilyT>
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-3 mb-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-gray-500">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={live}
                    onChange={(event) => onLiveChange(event.target.checked)}
                    className="accent-blue-600"
                  />

                  <span>
                    <FamilyT>{"Live preview"}</FamilyT>
                  </span>
                </label>

                {!live ? (
                  <button
                    type="button"
                    onClick={() => setFrozen(form)}
                    className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <FamilyT>{"Update preview\n                  "}</FamilyT>
                  </button>
                ) : null}

                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={bnDigits}
                    onChange={(event) => setBnDigits(event.target.checked)}
                    className="accent-blue-600"
                  />

                  <span>
                    <FamilyT>
                      {"Bangla digits (\u09E6\u09E7\u09E8\u09E9)"}
                    </FamilyT>
                  </span>
                </label>

                {isZoomedBeyondFit ? (
                  <span className="text-[10px] text-gray-400">
                    <FamilyT>
                      {"\u2022 Drag to move\n                  "}
                    </FamilyT>
                  </span>
                ) : null}
              </div>

              <div
                ref={previewScrollRef}
                onPointerDown={handlePreviewPointerDown}
                onPointerMove={handlePreviewPointerMove}
                onPointerUp={endPreviewPan}
                onPointerCancel={endPreviewPan}
                onLostPointerCapture={() => endPreviewPan()}
                aria-label={
                  isZoomedBeyondFit
                    ? familyL("Zoomed form preview. Drag to move the page.")
                    : familyL("Form preview")
                }
                className={`bg-[#3d3934] rounded-xl overflow-auto h-[min(80vh,860px)] min-h-[520px] p-4 sm:p-5 flex items-start select-none ${
                  isZoomedBeyondFit
                    ? isPanning
                      ? "cursor-grabbing"
                      : "cursor-grab"
                    : "cursor-default"
                } ${isZoomedBeyondFit ? "justify-start" : "justify-center"}`}
                style={{
                  touchAction: isZoomedBeyondFit ? "none" : "auto",
                }}
              >
                <div
                  aria-hidden="true"
                  className="shrink-0"
                  style={{
                    width: `${scaledPreviewWidth}mm`,
                    height: `${scaledPreviewHeight}mm`,
                  }}
                >
                  <div
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <FamilyCardPreview
                      id="family-card-preview-page"
                      values={previewValues}
                      districtLabel={districtLabel(previewValues)}
                      upazilaLabel={upazilaLabel(previewValues)}
                      bnDigits={bnDigits}
                      documentRef={pageRef}
                    />
                  </div>
                </div>
              </div>

              <p className="mt-2 text-[10px] text-gray-400">
                <FamilyT>
                  {
                    "A4 \u00B7 210 \u00D7 297 mm \u2014 print and PDF use this exact layout.\n              "
                  }
                </FamilyT>
              </p>
            </div>
          </div>
        </div>

        <div className="print-hide bg-sky-50/40 border border-sky-200/80 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wide">
            <FamilyT>
              {"Important Information and Instructions:\n          "}
            </FamilyT>
          </h3>

          <p className="text-xs text-[#0F172A] font-medium">
            <FamilyT>
              {"The following documents must be attached:\n          "}
            </FamilyT>
          </p>

          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1.5 font-medium">
            <li>
              <FamilyT>
                {
                  "Attach one colour passport-size photo to the application form with\n              a stapler.\n            "
                }
              </FamilyT>
            </li>

            <li>
              <FamilyT>
                {
                  "Submit a photocopy of the National ID (NID) with the application\n              form.\n            "
                }
              </FamilyT>
            </li>

            <li>
              <FamilyT>
                {
                  "Submit photocopies of National IDs of other family members (if\n              any).\n            "
                }
              </FamilyT>
            </li>

            <li>
              <FamilyT>{"An active mobile number must be provided."}</FamilyT>
            </li>
          </ul>

          <p className="text-[11px] font-bold text-red-600 pt-1">
            <FamilyT>
              {
                "Fill in all information correctly and accurately. The application\n            may be cancelled for incorrect information.\n          "
              }
            </FamilyT>
          </p>

          <p className="text-[11px] font-medium text-gray-600">
            <FamilyT>
              {
                "Submit this form to a respectable person in your area \u2014 Member,\n            Chairman, Councillor or Mayor. There is no online system to apply\n            for a Family Card.\n          "
              }
            </FamilyT>
          </p>

          <p className="text-[11px] font-medium text-gray-600">
            <FamilyT>
              {
                "You do not need to pay anyone or use a broker to get this government\n            benefit \u2014 the Family Card is distributed free of charge by the\n            government.\n          "
              }
            </FamilyT>
          </p>
        </div>

        <div className="print-hide bg-blue-50/60 border border-blue-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-blue-900 font-medium">
          <ShieldCheck size={16} className="text-blue-600 shrink-0" />

          <span>
            <FamilyT>
              {
                "Your files are processed in the browser \u2014 they are not uploaded to\n            any server.\n          "
              }
            </FamilyT>
          </span>
        </div>

        <div className="print-hide bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <button
            onClick={() => setShowHowToUse((open) => !open)}
            className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-[#0F172A] hover:bg-gray-50/50 transition-colors"
            type="button"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />

              <span>
                <FamilyT>{"How to use"}</FamilyT>
              </span>
            </div>

            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse ? (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>
                <FamilyT>
                  {
                    "1. Fill in your personal details, address, and family\n                information on the left panel.\n              "
                  }
                </FamilyT>
              </p>

              <p>
                <FamilyT>
                  {
                    "2. Watch the application letter update live on the right panel.\n              "
                  }
                </FamilyT>
              </p>

              <p>
                <FamilyT>
                  {"3. Print or download the form as a PDF to submit."}
                </FamilyT>
              </p>
            </div>
          ) : null}
        </div>

        <div className="print-hide pt-4 space-y-3">
          <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
            <FamilyT>{"Tools in the same category\n          "}</FamilyT>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool) => {
              const ToolIcon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>

                    <h3 className="text-xs font-bold text-[#0F172A] mb-1 group-hover:text-blue-600 transition-colors">
                      {<FamilyT>{tool.title}</FamilyT>}
                    </h3>

                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      {<FamilyT>{tool.description}</FamilyT>}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="print-hide fixed bottom-0 left-0 right-0 z-40 px-3 sm:px-4 pb-3 pointer-events-none">
          <div className="w-full pointer-events-auto bg-[#F8FAFC]/95 backdrop-blur-md border border-gray-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_-8px_28px_rgba(30,30,30,.12)]">
            <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />

              <span>
                <FamilyT>
                  {
                    "Print or download a blank form now, then fill it in by hand\n                later.\n              "
                  }
                </FamilyT>
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#0F172A] text-xs font-bold rounded-xl transition-colors"
                type="button"
              >
                <FamilyT>{"Clear all\n              "}</FamilyT>
              </button>

              <button
                onClick={handleRestoreLastApplication}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#0F172A] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                type="button"
              >
                <RefreshCw size={13} />

                <span>
                  <FamilyT>{"Restore last application"}</FamilyT>
                </span>
              </button>

              <button
                onClick={handlePrint}
                disabled={isProcessing !== null}
                className="px-5 py-2 bg-white hover:bg-gray-50 text-[#0F172A] border border-gray-200 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-60"
                type="button"
              >
                {isProcessing === "print" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Printer size={14} />
                )}

                <span>
                  {isProcessing === "print" ? (
                    <FamilyT>{"Processing..."}</FamilyT>
                  ) : (
                    <FamilyT>{"Print"}</FamilyT>
                  )}
                </span>
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isProcessing !== null}
                className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-60"
                type="button"
              >
                {isProcessing === "download" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}

                <span>
                  {isProcessing === "download" ? (
                    <FamilyT>{"Processing..."}</FamilyT>
                  ) : (
                    <FamilyT>{"Download PDF"}</FamilyT>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {renderHost ? (
        <PrintHost
          values={form}
          districtLabel={districtLabel(form)}
          upazilaLabel={upazilaLabel(form)}
          bnDigits={bnDigits}
        />
      ) : null}
    </div>
  );
}
