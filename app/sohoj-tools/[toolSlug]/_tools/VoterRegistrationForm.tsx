"use client";
import { T, useSohozI18n } from "@/app/sohoj-tools/_i18n";
import {
  CalendarDays,
  Check,
  ChevronDown,
  FileDown,
  FileText,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Share2,
  Star,
  X,
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal, flushSync } from "react-dom";
/* -------------------------------------------------------------------------- */
/*  Types & constants                                                          */
/* -------------------------------------------------------------------------- */
type VoterFormState = {
  voterAreaName: string;
  voterAreaNumber: string;
  formNumber: string;
  nameBn: string;
  nameEn: string;
  dateOfBirth: string; // DD-MM-YYYY (partial while typing)
  placeOfBirth: string;
  birthRegistration: string;
  gender: "Male" | "Female" | "";
  maritalStatus:
    | "Unmarried"
    | "Married"
    | "Divorced"
    | "Widow"
    | "Widower"
    | "";
  fatherName: string;
  fatherNid: string;
  fatherVoterNumber: string;
  fatherDeathYear: string;
  fatherNidNotApplicable: boolean;
  motherName: string;
  motherNid: string;
  motherVoterNumber: string;
  motherDeathYear: string;
  motherNidNotApplicable: boolean;
  spouseRelation: "Husband" | "Wife" | "";
  spouseName: string;
  spouseNid: string;
  spouseDeathYear: string;
  spouseNameNotApplicable: boolean;
  spouseNidNotApplicable: boolean;
  spouseDeathNotApplicable: boolean;
  education: string;
  occupation: string;
  identificationMark: string;
  bloodGroup: string;
  religion: string;
  religionOther: string;
  disability: string[];
  currentDivision: string;
  currentDistrict: string;
  currentUpazila: string;
  currentWard: string;
  currentCity: string;
  currentMouza: string;
  currentVillage: string;
  currentHouse: string;
  currentPostOffice: string;
  currentPostCode: string;
  currentRmo: string;
  permanentSameAsCurrent: boolean;
  permanentDivision: string;
  permanentDistrict: string;
  permanentUpazila: string;
  permanentWard: string;
  permanentCity: string;
  permanentMouza: string;
  permanentVillage: string;
  permanentHouse: string;
  permanentPostOffice: string;
  permanentPostCode: string;
  permanentRmo: string;
  mobile: string;
  telephone: string;
  tin: string;
  drivingLicense: string;
  passportNumber: string;
  exclusionReason: string;
  identifierNid: string;
  dataCollectorNid: string;
};
type FormKey = keyof VoterFormState;
type StringKey = {
  [K in FormKey]: VoterFormState[K] extends string ? K : never;
}[FormKey];
type FreeTextKey = Exclude<
  StringKey,
  "gender" | "maritalStatus" | "spouseRelation"
>;
type ToastKind = "success" | "info" | "error";
type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  message: string;
};
type RenderMode = "print" | "pdf" | null;
const STORAGE_KEY = "sohoj-voter-registration-form";
const LAST_KEY = "sohoj-voter-registration-form-last";
const FAVORITE_KEY = "sohoj-voter-registration-form-favorite";
const USED_KEY = "sohoj-voter-registration-form-used";
const FONT_LINK_ID = "voter-form-bengali-fonts";
const EMPTY_FORM: VoterFormState = {
  voterAreaName: "",
  voterAreaNumber: "",
  formNumber: "",
  nameBn: "",
  nameEn: "",
  dateOfBirth: "",
  placeOfBirth: "",
  birthRegistration: "",
  gender: "",
  maritalStatus: "",
  fatherName: "",
  fatherNid: "",
  fatherVoterNumber: "",
  fatherDeathYear: "",
  fatherNidNotApplicable: false,
  motherName: "",
  motherNid: "",
  motherVoterNumber: "",
  motherDeathYear: "",
  motherNidNotApplicable: false,
  spouseRelation: "",
  spouseName: "",
  spouseNid: "",
  spouseDeathYear: "",
  spouseNameNotApplicable: false,
  spouseNidNotApplicable: false,
  spouseDeathNotApplicable: false,
  education: "",
  occupation: "",
  identificationMark: "",
  bloodGroup: "",
  religion: "",
  religionOther: "",
  disability: [],
  currentDivision: "",
  currentDistrict: "",
  currentUpazila: "",
  currentWard: "",
  currentCity: "",
  currentMouza: "",
  currentVillage: "",
  currentHouse: "",
  currentPostOffice: "",
  currentPostCode: "",
  currentRmo: "",
  permanentSameAsCurrent: false,
  permanentDivision: "",
  permanentDistrict: "",
  permanentUpazila: "",
  permanentWard: "",
  permanentCity: "",
  permanentMouza: "",
  permanentVillage: "",
  permanentHouse: "",
  permanentPostOffice: "",
  permanentPostCode: "",
  permanentRmo: "",
  mobile: "",
  telephone: "",
  tin: "",
  drivingLicense: "",
  passportNumber: "",
  exclusionReason: "",
  identifierNid: "",
  dataCollectorNid: "",
};
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RELIGIONS = ["Islam", "Hindu", "Christian", "Buddhist", "Other"];
const DISABILITIES = [
  "Visually impaired",
  "Physically disabled",
  "Hearing impaired",
  "Speech impaired",
  "Other",
];
const RMO_OPTIONS = [
  "Rural",
  "Municipality",
  "City",
  "Other area",
  "City corporation",
];
const GENDERS = ["Male", "Female"] as const;
const MARITAL = [
  "Unmarried",
  "Married",
  "Divorced",
  "Widow",
  "Widower",
] as const;
const SPOUSE_RELATIONS = ["Husband", "Wife"] as const;
/** 64 districts: value is Bangla (as printed on the form), label is English. */
const DISTRICTS: Array<[string, string]> = [
  ["বরিশাল", "Barishal"],
  ["বরগুনা", "Barguna"],
  ["ভোলা", "Bhola"],
  ["ঝালকাঠি", "Jhalokathi"],
  ["পটুয়াখালী", "Patuakhali"],
  ["পিরোজপুর", "Pirojpur"],
  ["চট্টগ্রাম", "Chattogram"],
  ["কক্সবাজার", "Cox's Bazar"],
  ["কুমিল্লা", "Cumilla"],
  ["ফেনী", "Feni"],
  ["ব্রাহ্মণবাড়িয়া", "Brahmanbaria"],
  ["রাঙ্গামাটি", "Rangamati"],
  ["নোয়াখালী", "Noakhali"],
  ["চাঁদপুর", "Chandpur"],
  ["লক্ষ্মীপুর", "Lakshmipur"],
  ["খাগড়াছড়ি", "Khagrachhari"],
  ["বান্দরবান", "Bandarban"],
  ["ঢাকা", "Dhaka"],
  ["গাজীপুর", "Gazipur"],
  ["কিশোরগঞ্জ", "Kishoreganj"],
  ["মাদারীপুর", "Madaripur"],
  ["মুন্সীগঞ্জ", "Munshiganj"],
  ["নরসিংদী", "Narsingdi"],
  ["নারায়ণগঞ্জ", "Narayanganj"],
  ["রাজবাড়ী", "Rajbari"],
  ["শরীয়তপুর", "Shariatpur"],
  ["টাঙ্গাইল", "Tangail"],
  ["ফরিদপুর", "Faridpur"],
  ["গোপালগঞ্জ", "Gopalganj"],
  ["মানিকগঞ্জ", "Manikganj"],
  ["খুলনা", "Khulna"],
  ["বাগেরহাট", "Bagerhat"],
  ["চুয়াডাঙ্গা", "Chuadanga"],
  ["যশোর", "Jashore"],
  ["ঝিনাইদহ", "Jhenaidah"],
  ["কুষ্টিয়া", "Kushtia"],
  ["মাগুরা", "Magura"],
  ["মেহেরপুর", "Meherpur"],
  ["নড়াইল", "Narail"],
  ["সাতক্ষীরা", "Satkhira"],
  ["ময়মনসিংহ", "Mymensingh"],
  ["জামালপুর", "Jamalpur"],
  ["নেত্রকোণা", "Netrokona"],
  ["শেরপুর", "Sherpur"],
  ["রাজশাহী", "Rajshahi"],
  ["বগুড়া", "Bogura"],
  ["জয়পুরহাট", "Joypurhat"],
  ["নওগাঁ", "Naogaon"],
  ["নাটোর", "Natore"],
  ["চাঁপাইনবাবগঞ্জ", "Chapainawabganj"],
  ["পাবনা", "Pabna"],
  ["সিরাজগঞ্জ", "Sirajganj"],
  ["রংপুর", "Rangpur"],
  ["দিনাজপুর", "Dinajpur"],
  ["গাইবান্ধা", "Gaibandha"],
  ["কুড়িগ্রাম", "Kurigram"],
  ["লালমনিরহাট", "Lalmonirhat"],
  ["নীলফামারী", "Nilphamari"],
  ["পঞ্চগড়", "Panchagarh"],
  ["ঠাকুরগাঁও", "Thakurgaon"],
  ["সিলেট", "Sylhet"],
  ["হবিগঞ্জ", "Habiganj"],
  ["মৌলভীবাজার", "Moulvibazar"],
  ["সুনামগঞ্জ", "Sunamganj"],
];
/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const VOTER_BN: Record<string, string> = Object.fromEntries(
  Object.entries({
    "sohoz tools": "সহজ টুলস",
    "general tools": "সাধারণ টুলস",
    "voter registration form": "ভোটার নিবন্ধন ফর্ম",
    free: "বিনামূল্যে",
    "used ": "ব্যবহার হয়েছে ",
    time: "বার",
    times: "বার",
    "fill in your details on the left — see the live form-2 on the right and download it as pdf.":
      "বাম পাশে আপনার তথ্য পূরণ করুন—ডান পাশে Form-2-এর সরাসরি পূর্বরূপ দেখুন এবং PDF হিসেবে ডাউনলোড করুন।",
    "remove from favorites": "পছন্দের তালিকা থেকে সরান",
    "add to favorites": "পছন্দের তালিকায় যোগ করুন",
    share: "শেয়ার করুন",
    "voter area": "ভোটার এলাকা",
    "the election office issues these numbers; leave them blank if you do not have them yet.":
      "এই নম্বরগুলো নির্বাচন অফিস থেকে দেওয়া হয়; এখনো না থাকলে ঘরগুলো খালি রাখুন।",
    "voter area name": "ভোটার এলাকার নাম",
    "voter area number": "ভোটার এলাকার নম্বর",
    "e.g. 0512": "যেমন: ০৫১২",
    "form number": "ফর্ম নম্বর",
    applicant: "আবেদনকারী",
    "name (in bangla)": "নাম (বাংলায়)",
    "name (english, capitals)": "নাম (ইংরেজিতে, বড় হাতের অক্ষরে)",
    "date of birth": "জন্মতারিখ",
    "01-01-1990": "০১-০১-১৯৯০",
    "place of birth (district)": "জন্মস্থান (জেলা)",
    "17-digit birth registration number": "১৭ সংখ্যার জন্ম নিবন্ধন নম্বর",
    gender: "লিঙ্গ",
    male: "পুরুষ",
    female: "নারী",
    "marital status": "বৈবাহিক অবস্থা",
    unmarried: "অবিবাহিত",
    married: "বিবাহিত",
    divorced: "তালাকপ্রাপ্ত",
    widow: "বিধবা",
    widower: "বিপত্নীক",
    parents: "পিতা ও মাতা",
    "if a parent died after 2007, form-12 has to be filled in as well.":
      "কোনো পিতা বা মাতা ২০০৭ সালের পর মারা গেলে Form-12-ও পূরণ করতে হবে।",
    "father's name": "পিতার নাম",
    "father's nid number": "পিতার NID নম্বর",
    "father's voter number": "পিতার ভোটার নম্বর",
    "year of father's death": "পিতার মৃত্যুর বছর",
    "father's nid not applicable": "পিতার NID প্রযোজ্য নয়",
    "mother's name": "মাতার নাম",
    "mother's nid number": "মাতার NID নম্বর",
    "mother's voter number": "মাতার ভোটার নম্বর",
    "year of mother's death": "মাতার মৃত্যুর বছর",
    "mother's nid not applicable": "মাতার NID প্রযোজ্য নয়",
    spouse: "স্বামী/স্ত্রী",
    'unmarried? tick the "not applicable" boxes instead.':
      'অবিবাহিত হলে "প্রযোজ্য নয়" ঘরগুলোতে টিক দিন।',
    "husband or wife": "স্বামী বা স্ত্রী",
    husband: "স্বামী",
    wife: "স্ত্রী",
    "spouse's name": "স্বামী/স্ত্রীর নাম",
    "spouse's nid number": "স্বামী/স্ত্রীর NID নম্বর",
    "year of spouse's death": "স্বামী/স্ত্রীর মৃত্যুর বছর",
    "name not applicable": "নাম প্রযোজ্য নয়",
    "nid not applicable": "NID প্রযোজ্য নয়",
    "year of death not applicable": "মৃত্যুর বছর প্রযোজ্য নয়",
    "personal details": "ব্যক্তিগত তথ্য",
    "educational qualification": "শিক্ষাগত যোগ্যতা",
    occupation: "পেশা",
    "visible identification mark": "দৃশ্যমান শনাক্তকরণ চিহ্ন",
    "blood group": "রক্তের গ্রুপ",
    religion: "ধর্ম",
    islam: "ইসলাম",
    hindu: "হিন্দু",
    christian: "খ্রিস্টান",
    buddhist: "বৌদ্ধ",
    other: "অন্যান্য",
    "other religion": "অন্যান্য ধর্ম",
    "nature of disability": "প্রতিবন্ধিতার ধরন",
    "visually impaired": "দৃষ্টিপ্রতিবন্ধী",
    "physically disabled": "শারীরিক প্রতিবন্ধী",
    "hearing impaired": "শ্রবণপ্রতিবন্ধী",
    "speech impaired": "বাকপ্রতিবন্ধী",
    "present address": "বর্তমান ঠিকানা",
    "permanent address": "স্থায়ী ঠিকানা",
    "same as present address": "বর্তমান ঠিকানার সঙ্গে একই",
    "contact and other numbers": "যোগাযোগ ও অন্যান্য নম্বর",
    "mobile number": "মোবাইল নম্বর",
    "telephone number": "টেলিফোন নম্বর",
    "driving licence number": "ড্রাইভিং লাইসেন্স নম্বর",
    "passport number": "পাসপোর্ট নম্বর",
    "filled in at the centre": "কেন্দ্রে পূরণীয় তথ্য",
    "items 36-46 are completed by the registration centre.":
      "৩৬–৪৬ নম্বর ঘর নিবন্ধন কেন্দ্রে পূরণ করা হবে।",
    "reason for exclusion": "বাদ দেওয়ার কারণ",
    "identifier's nid number": "শনাক্তকারীর NID নম্বর",
    "data collector's nid number": "তথ্য সংগ্রহকারীর NID নম্বর",
    "important notes:": "গুরুত্বপূর্ণ নির্দেশনা:",
    "bring the following with the form:":
      "ফর্মের সঙ্গে নিম্নলিখিত কাগজপত্র আনুন:",
    "a photocopy of the birth registration certificate.":
      "জন্ম নিবন্ধন সনদের একটি ফটোকপি।",
    "photocopies of both parents&apos; nids.": "পিতা ও মাতার NID-এর ফটোকপি।",
    "educational certificates, if any.": "শিক্ষাগত যোগ্যতার সনদপত্র, যদি থাকে।",
    "proof of the present address — a utility bill, or a certificate\n              from the chairman or councillor.\n            ":
      "বর্তমান ঠিকানার প্রমাণ—বিদ্যুৎ/গ্যাস/পানির বিল অথবা চেয়ারম্যান/কাউন্সিলরের সনদ।",
    "fill everything in accurately — wrong information can get the\n            application rejected.\n          ":
      "সব তথ্য নির্ভুলভাবে পূরণ করুন—ভুল তথ্যের কারণে আবেদন বাতিল হতে পারে।",
    "print the filled form and attend the registration centre for your\n            photo, fingerprints and signature. keep the registration slip and\n            the receipt.\n          ":
      "ফর্মটি পূরণ করে প্রিন্ট নিন এবং ছবি, আঙুলের ছাপ ও স্বাক্ষরের জন্য নিবন্ধন কেন্দ্রে উপস্থিত হন। নিবন্ধন স্লিপ ও রসিদ সংরক্ষণ করুন।",
    "form complete — download or print it.":
      "ফর্ম পূরণ হয়েছে—ডাউনলোড অথবা প্রিন্ট করুন।",
    "add an input to get started": "শুরু করতে অন্তত একটি ঘর পূরণ করুন",
    "clear all": "সব পরিষ্কার করুন",
    "restore last form": "সর্বশেষ ফর্ম পুনরুদ্ধার করুন",
    print: "প্রিন্ট করুন",
    "processing...": "প্রক্রিয়াকরণ চলছে...",
    "download pdf": "PDF ডাউনলোড করুন",
    preview: "পূর্বরূপ",
    empty: "খালি",
    "live preview": "সরাসরি পূর্বরূপ",
    "page ": "পৃষ্ঠা ",
    "of 2": "এর মধ্যে ২",
    "zoom out": "ছোট করে দেখুন",
    "zoom in": "বড় করে দেখুন",
    "reset zoom": "জুম পুনরায় সেট করুন",
    "reset zoom to 100%": "জুম ১০০%-এ ফিরিয়ে আনুন",
    "go to page 2": "২য় পৃষ্ঠায় যান",
    "go to page 1": "১ম পৃষ্ঠায় যান",
    cleared: "পরিষ্কার করা হয়েছে",
    "all fields have been reset.": "সব ঘর পুনরায় খালি করা হয়েছে।",
    "nothing to restore": "পুনরুদ্ধার করার মতো কিছু নেই",
    "there is no previously saved form on this device.":
      "এই ডিভাইসে আগে সংরক্ষিত কোনো ফর্ম পাওয়া যায়নি।",
    restored: "পুনরুদ্ধার করা হয়েছে",
    "your last form has been loaded.":
      "আপনার সর্বশেষ ফর্মটি পুনরুদ্ধার করা হয়েছে।",
    "link copied": "লিংক কপি হয়েছে",
    "the page link is on your clipboard.": "পেজের লিংক ক্লিপবোর্ডে কপি হয়েছে।",
    "could not share": "শেয়ার করা যায়নি",
    "sharing is not supported in this browser.":
      "এই ব্রাউজারে শেয়ার করার সুবিধা নেই।",
    "sharing was blocked by the browser.":
      "ব্রাউজার শেয়ার করার অনুমতি দেয়নি।",
    "printable pages were not found.": "প্রিন্ট করার পৃষ্ঠা পাওয়া যায়নি।",
    "voter registration form (form-2)": "ভোটার নিবন্ধন ফর্ম (Form-2)",
    "voter registration application": "ভোটার নিবন্ধনের আবেদন",
    "pdf ready": "PDF প্রস্তুত",
    "your 2-page form-2 has been downloaded.":
      "আপনার ২ পৃষ্ঠার Form-2 ডাউনলোড হয়েছে।",
    "pdf failed": "PDF তৈরি ব্যর্থ",
    "the pdf could not be created. please try again or use print → save as pdf.":
      "PDF তৈরি করা যায়নি। আবার চেষ্টা করুন অথবা Print → Save as PDF নির্বাচন করুন।",
    dismiss: "বন্ধ করুন",
    "clear search": "খোঁজ পরিষ্কার করুন",
    "open calendar": "ক্যালেন্ডার খুলুন",
    "10, 13 or 17-digit nid": "১০, ১৩ বা ১৭ সংখ্যার NID",
    "city corporation / municipality / union / cantonment board":
      "সিটি কর্পোরেশন / পৌরসভা / ইউনিয়ন / ক্যান্টনমেন্ট বোর্ড",
    "village / mahalla / road name and number":
      "গ্রাম / মহল্লা / সড়কের নাম ও নম্বর",
    "house / holding number": "বাড়ি / হোল্ডিং নম্বর",
    "post office": "ডাকঘর",
    "e.g. 1230": "যেমন: ১২৩০",
    "r.m.o.": "আর.এম.ও.",
    rural: "গ্রামীণ",
    municipality: "পৌরসভা",
    city: "সিটি",
    "other area": "অন্যান্য এলাকা",
    "city corporation": "সিটি কর্পোরেশন",
    "e.g. 2015": "যেমন: ২০১৫",
    "n/a": "প্রযোজ্য নয়",
    nID: "NID",
    "nid must be 10, 13 or 17 digits.":
      "NID নম্বর ১০, ১৩ বা ১৭ সংখ্যার হতে হবে।",
    "voter number must be 13 digits.": "ভোটার নম্বর ১৩ সংখ্যার হতে হবে।",
    "birth registration number must be 17 digits.":
      "জন্ম নিবন্ধন নম্বর ১৭ সংখ্যার হতে হবে।",
    "voter area number must be 4 digits.":
      "ভোটার এলাকার নম্বর ৪ সংখ্যার হতে হবে।",
    "post code must be 4 digits.": "পোস্ট কোড ৪ সংখ্যার হতে হবে।",
    "tin must be 12 digits.": "TIN ১২ সংখ্যার হতে হবে।",
    "enter a valid 11-digit mobile number, e.g. 01783666743.":
      "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন, যেমন ০১৭৮৩৬৬৬৭৪৩।",
    "enter a valid telephone number.": "সঠিক টেলিফোন নম্বর দিন।",
    "enter a 4-digit year.": "৪ সংখ্যার বছর লিখুন।",
    "enter the full date as dd-mm-yyyy.":
      "পূর্ণ তারিখ দিন: দিন-মাস-বছর (DD-MM-YYYY)।",
    "this is not a valid date.": "এটি সঠিক তারিখ নয়।",
    "date of birth cannot be in the future.":
      "জন্মতারিখ ভবিষ্যতের হতে পারে না।",
    "enter a year after 1900.": "১৯০০ সালের পরের একটি বছর লিখুন।",
    "the applicant must be at least 18 years old to register.":
      "নিবন্ধনের জন্য আবেদনকারীর বয়স কমপক্ষে ১৮ বছর হতে হবে।",
    "division (current address)": "বিভাগ (বর্তমান ঠিকানা)",
    "district (current address)": "জেলা (বর্তমান ঠিকানা)",
    "upazila / thana (current address)": "উপজেলা / থানা (বর্তমান ঠিকানা)",
    "ward number (current address)": "ওয়ার্ড নম্বর (বর্তমান ঠিকানা)",
    "city corporation / municipality / union / cantonment board (current address)":
      "সিটি কর্পোরেশন / পৌরসভা / ইউনিয়ন / ক্যান্টনমেন্ট বোর্ড (বর্তমান ঠিকানা)",
    "mouza (current address)": "মৌজা (বর্তমান ঠিকানা)",
    "village / mahalla / road name and number (current address)":
      "গ্রাম / মহল্লা / সড়কের নাম ও নম্বর (বর্তমান ঠিকানা)",
    "house / holding number (current address)":
      "বাড়ি / হোল্ডিং নম্বর (বর্তমান ঠিকানা)",
    "post office (current address)": "ডাকঘর (বর্তমান ঠিকানা)",
    "post code (current address)": "পোস্ট কোড (বর্তমান ঠিকানা)",
    "r.m.o. (current address)": "আর.এম.ও. (বর্তমান ঠিকানা)",
    "division (permanent address)": "বিভাগ (স্থায়ী ঠিকানা)",
    "district (permanent address)": "জেলা (স্থায়ী ঠিকানা)",
    "upazila / thana (permanent address)": "উপজেলা / থানা (স্থায়ী ঠিকানা)",
    "ward number (permanent address)": "ওয়ার্ড নম্বর (স্থায়ী ঠিকানা)",
    "city corporation / municipality / union / cantonment board (permanent address)":
      "সিটি কর্পোরেশন / পৌরসভা / ইউনিয়ন / ক্যান্টনমেন্ট বোর্ড (স্থায়ী ঠিকানা)",
    "mouza (permanent address)": "মৌজা (স্থায়ী ঠিকানা)",
    "village / mahalla / road name and number (permanent address)":
      "গ্রাম / মহল্লা / সড়কের নাম ও নম্বর (স্থায়ী ঠিকানা)",
    "house / holding number (permanent address)":
      "বাড়ি / হোল্ডিং নম্বর (স্থায়ী ঠিকানা)",
    "post office (permanent address)": "ডাকঘর (স্থায়ী ঠিকানা)",
    "post code (permanent address)": "পোস্ট কোড (স্থায়ী ঠিকানা)",
    "r.m.o. (permanent address)": "আর.এম.ও. (স্থায়ী ঠিকানা)",
    "✓ used ": "ব্যবহার হয়েছে ",
  }).map(([key, value]) => [
    key.trim().replace(/\s+/g, " ").toLowerCase(),
    value,
  ]),
);

function normalizeVoterText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function translateVoterText(
  value: string,
  locale: "en" | "bn",
  baseL: (value: string) => string,
): string {
  if (locale === "en") return value;
  const mapped = VOTER_BN[normalizeVoterText(value)];
  return mapped ?? baseL(value);
}

function useVoterText() {
  const { locale, L: baseL } = useSohozI18n();
  return useCallback(
    (value: string) => translateVoterText(value, locale, baseL),
    [locale, baseL],
  );
}

function VT({ children }: { children: ReactNode }) {
  const vt = useVoterText();
  if (typeof children !== "string") return <>{children}</>;
  return <>{vt(children)}</>;
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
function toAsciiDigits(value: string) {
  return value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}
function digitString(value: string, max = 17) {
  return toAsciiDigits(value).replace(/\D/g, "").slice(0, max);
}
function formatDobInput(raw: string) {
  const d = digitString(raw, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
}
function parseDob(value: string): Date | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return null;
  return date;
}
function dobToIso(value: string) {
  const date = parseDob(value);
  if (!date) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}
function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function isFormEmpty(form: VoterFormState) {
  return (Object.keys(EMPTY_FORM) as FormKey[]).every((key) => {
    const value = form[key];
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "boolean") return value === false;
    return String(value ?? "").trim() === "";
  });
}
/** Coerce anything read from storage into a well-formed form state. */
function sanitizeForm(raw: unknown): VoterFormState {
  const result: VoterFormState = { ...EMPTY_FORM, disability: [] };
  if (!raw || typeof raw !== "object") return result;
  const source = raw as Record<string, unknown>;
  const target = result as unknown as Record<string, unknown>;
  (Object.keys(EMPTY_FORM) as FormKey[]).forEach((key) => {
    const fallback = EMPTY_FORM[key];
    const value = source[key];
    if (Array.isArray(fallback)) {
      target[key] = Array.isArray(value)
        ? value.filter(
            (item): item is string =>
              typeof item === "string" && DISABILITIES.includes(item),
          )
        : [];
    } else if (typeof fallback === "boolean") {
      target[key] = typeof value === "boolean" ? value : false;
    } else {
      target[key] = typeof value === "string" ? value : fallback;
    }
  });
  if (!(["Male", "Female", ""] as string[]).includes(result.gender))
    result.gender = "";
  if (
    !(
      ["Unmarried", "Married", "Divorced", "Widow", "Widower", ""] as string[]
    ).includes(result.maritalStatus)
  ) {
    result.maritalStatus = "";
  }
  if (!(["Husband", "Wife", ""] as string[]).includes(result.spouseRelation))
    result.spouseRelation = "";
  // Data saved by an earlier version used the ISO format (YYYY-MM-DD).
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(result.dateOfBirth);
  if (iso) result.dateOfBirth = `${iso[3]}-${iso[2]}-${iso[1]}`;
  return result;
}
function safeReadJson(key: string): VoterFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return sanitizeForm(JSON.parse(raw));
  } catch {
    return null;
  }
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
/** Election Commission logo (served from /public/ecLogo/ec-logo.png). */
const LOGO_SRC = "/ecLogo/ec-logo.png";
async function waitForLogo() {
  try {
    if (typeof Image === "undefined") return;
    const img = new Image();
    img.src = LOGO_SRC;
    await Promise.race([
      img.decode(),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch {
    // If the logo cannot load, the form still renders without it.
  }
}
async function waitForFonts() {
  await waitForLogo();
  try {
    if (typeof document !== "undefined" && document.fonts) {
      await Promise.race([
        Promise.all([
          document.fonts.load('400 12px "Noto Serif Bengali"', "অআকখ০১২"),
          document.fonts.load('700 12px "Noto Serif Bengali"', "অআকখ০১২"),
        ]).then(() => document.fonts.ready),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    }
  } catch {
    // Fall back to whatever fonts are available.
  }
  await nextFrames(2);
}
/* ---------------------------- validation rules ---------------------------- */
const CURRENT_YEAR = new Date().getFullYear();
const validateNid = (v: string) =>
  v && ![10, 13, 17].includes(v.length)
    ? "NID must be 10, 13 or 17 digits."
    : "";
const validateVoterNumber = (v: string) =>
  v && v.length !== 13 ? "Voter number must be 13 digits." : "";
const validateBirthReg = (v: string) =>
  v && v.length !== 17 ? "Birth registration number must be 17 digits." : "";
const validateAreaNumber = (v: string) =>
  v && v.length !== 4 ? "Voter area number must be 4 digits." : "";
const validatePostCode = (v: string) =>
  v && v.length !== 4 ? "Post code must be 4 digits." : "";
const validateTin = (v: string) =>
  v && v.length !== 12 ? "TIN must be 12 digits." : "";
const validateMobile = (v: string) =>
  v && !/^01[3-9]\d{8}$/.test(v)
    ? "Enter a valid 11-digit mobile number, e.g. 01783666743."
    : "";
const validatePhone = (v: string) =>
  v && v.length < 6 ? "Enter a valid telephone number." : "";
const validateYear = (v: string) => {
  if (!v) return "";
  if (v.length !== 4) return "Enter a 4-digit year.";
  const year = Number(v);
  return year < 1900 || year > CURRENT_YEAR
    ? `Enter a year between 1900 and ${CURRENT_YEAR}.`
    : "";
};
const validateDob = (v: string) => {
  if (!v) return "";
  if (v.length < 10) return "Enter the full date as DD-MM-YYYY.";
  const date = parseDob(v);
  if (!date) return "This is not a valid date.";
  const now = new Date();
  if (date.getTime() > now.getTime())
    return "Date of birth cannot be in the future.";
  if (date.getFullYear() < 1900) return "Enter a year after 1900.";
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate()))
    age -= 1;
  return age < 18
    ? "The applicant must be at least 18 years old to register."
    : "";
};
/* -------------------------------------------------------------------------- */
/*  Left-side form controls                                                    */
/* -------------------------------------------------------------------------- */
function FieldLabel({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-[#4B5563]">
      <span>{children}</span>
      {hint ? (
        <span className="font-normal text-[10px] text-[#9CA3AF]">{hint}</span>
      ) : null}
    </div>
  );
}
const INPUT_CLASS =
  "h-9 w-full rounded-md border bg-white/60 px-3 text-[11px] text-[#111827] outline-none transition placeholder:text-[#B4B0A5] focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50";
const INPUT_OK = "border-[#EEE5CC] focus:border-[#2563EB] focus:ring-[#BFDBFE]";
const INPUT_BAD =
  "border-[#E3A0A6] focus:border-[#D46A75] focus:ring-[#F2C4C8]";
function FieldError({ message }: { message: string }) {
  const vt = useVoterText();
  return (
    <p role="alert" className="mt-1 text-[9.5px] leading-3 text-[#B4232F]">
      {vt(message)}
    </p>
  );
}
function TextField({
  label,
  value,
  placeholder,
  onChange,
  maxLength,
  hint,
  className,
  disabled,
  validate,
  inputMode,
  list,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  maxLength?: number;
  hint?: string;
  className?: string;
  disabled?: boolean;
  validate?: (value: string) => string;
  inputMode?: "text" | "numeric" | "tel";
  list?: string;
}) {
  const [touched, setTouched] = useState(false);
  const message = validate && !disabled ? validate(value) : "";
  const showError =
    Boolean(message) &&
    (touched || (maxLength !== undefined && value.length >= maxLength));
  return (
    <label className={cx("block", className)}>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        list={list}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={showError}
        onBlur={() => setTouched(true)}
        onChange={(event) => onChange(event.target.value)}
        className={cx(INPUT_CLASS, showError ? INPUT_BAD : INPUT_OK)}
      />
      {showError ? <FieldError message={message} /> : null}
    </label>
  );
}
function DateField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const vt = useVoterText();
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const [touched, setTouched] = useState(false);
  const message = validateDob(value);
  const showError = Boolean(message) && (touched || value.length === 10);
  const openPicker = () => {
    const el = pickerRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
        return;
      }
    } catch {
      // Some browsers refuse showPicker(); fall through to a click.
    }
    el.focus();
    el.click();
  };
  return (
    <div className="block">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <button
          type="button"
          onClick={openPicker}
          aria-label={vt("Open calendar")}
          className="absolute left-2 top-2 z-10 text-[#B8B1A4] hover:text-[#2563EB]"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          inputMode="numeric"
          maxLength={10}
          autoComplete="off"
          aria-label={label}
          aria-invalid={showError}
          onBlur={() => setTouched(true)}
          onChange={(event) => onChange(formatDobInput(event.target.value))}
          className={cx(INPUT_CLASS, "pl-8", showError ? INPUT_BAD : INPUT_OK)}
        />
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          min="1900-01-01"
          max={todayIso()}
          value={dobToIso(value)}
          onChange={(event) => {
            const iso = event.target.value;
            if (!iso) return;
            const [y, m, d] = iso.split("-");
            onChange(`${d}-${m}-${y}`);
          }}
          className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0"
        />
      </div>
      {showError ? <FieldError message={message} /> : null}
    </div>
  );
}
function ChoicePill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "rounded-md border px-3 py-2 text-[10px] font-medium transition",
        active
          ? "border-[#2563EB] bg-[#DBEAFE] text-[#1D4ED8]"
          : "border-[#EEE5CC] bg-white/60 text-[#555048] hover:border-[#D7CBD1] hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}
function CheckBox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-left text-[10px] text-[#555048]"
    >
      <span
        className={cx(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border bg-white transition",
          checked ? "border-[#2563EB] bg-[#DBEAFE]" : "border-[#DCCFB0]",
        )}
      >
        {checked ? <Check className="h-3 w-3 text-[#2563EB]" /> : null}
      </span>
      {label}
    </button>
  );
}
function SectionCard({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#EFE3C5] bg-white p-3.5 shadow-[0_3px_12px_rgba(119,93,41,0.05)]">
      <div className="mb-3">
        <h2 className="text-[12px] font-bold text-[#2563EB]">
          {number}
          <T>{". "}</T>
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[9.5px] leading-4 text-[#7C756A]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
/* -------------------------------------------------------------------------- */
/*  Form-2 paper (rendered with real text so Bengali stays crisp everywhere)   */
/*  1em == 1 layout unit; the paper is 478 x 676 units (A4 proportions).       */
/* -------------------------------------------------------------------------- */
const PAGE_W = 478;
const PAGE_H = 676;
const INK = "#1d1b17";
const PAPER = "#FFFFFF";
const LW = "0.8em";
const FORM_FONT =
  '"SolaimanLipi","Kalpurush","Noto Serif Bengali","Noto Sans Bengali","Nirmala UI","Vrinda","Siyam Rupali",serif';
function fitSize(text: string, width: number, base: number) {
  const capacity = width / (base * 0.62);
  if (text.length <= capacity) return base;
  return Math.max(base * 0.42, base * (capacity / text.length));
}
/** Static label. `a` = which edge of the text sits at `x`; `y` is the vertical centre. */
function Txt({
  x,
  y,
  s = 8,
  a = "l",
  bold = false,
  children,
}: {
  x: number;
  y: number;
  s?: number;
  a?: "l" | "r" | "c";
  bold?: boolean;
  children: ReactNode;
}) {
  const outer: CSSProperties = {
    position: "absolute",
    top: `${y}em`,
    whiteSpace: "nowrap",
    lineHeight: 1,
  };
  if (a === "l") {
    outer.left = `${x}em`;
    outer.transform = "translateY(-50%)";
  } else if (a === "r") {
    outer.right = `${PAGE_W - x}em`;
    outer.transform = "translateY(-50%)";
  } else {
    outer.left = `${x}em`;
    outer.transform = "translate(-50%, -50%)";
  }
  return (
    <div style={outer}>
      <span style={{ fontSize: `${s}em`, fontWeight: bold ? 700 : 400 }}>
        {children}
      </span>
    </div>
  );
}
/** Dotted write-in line; `y` is the line itself. */
function Dots({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${x1}em`,
        top: `${y}em`,
        width: `${x2 - x1}em`,
        borderBottom: `${LW} dotted ${INK}`,
      }}
    />
  );
}
/** Entered text that sits on top of a dotted line at `y`. */
function Val({
  x1,
  x2,
  y,
  text,
  s = 8.4,
  align = "left",
}: {
  x1: number;
  x2: number;
  y: number;
  text: string;
  s?: number;
  align?: "left" | "center";
}) {
  if (!text) return null;
  const width = x2 - x1;
  const size = fitSize(text, width - 3, s);
  return (
    <div
      style={{
        position: "absolute",
        left: `${x1}em`,
        width: `${width}em`,
        top: `${y - 0.6}em`,
        transform: "translateY(-100%)",
        whiteSpace: "nowrap",
        lineHeight: 1,
        textAlign: align,
        paddingLeft: align === "left" ? "1.5em" : 0,
        boxSizing: "border-box",
      }}
    >
      <span style={{ fontSize: `${size}em`, fontWeight: 700 }}>{text}</span>
    </div>
  );
}
/** A row of `n` equal digit cells. Characters fill from the left. */
function Boxes({
  x,
  y,
  w,
  h,
  n,
  value = "",
  fs = 9,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  n: number;
  value?: string;
  fs?: number;
}) {
  const chars = Array.from(value);
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}em`,
        top: `${y}em`,
        width: `${w}em`,
        height: `${h}em`,
        display: "flex",
        border: `${LW} solid ${INK}`,
        boxSizing: "border-box",
      }}
    >
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderLeft: i === 0 ? "none" : `${LW} solid ${INK}`,
          }}
        >
          <span style={{ fontSize: `${fs}em`, fontWeight: 700, lineHeight: 1 }}>
            {chars[i] ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}
/** One wide bordered field with left-aligned text (form number etc.). */
function WideBox({
  x,
  y,
  w,
  h,
  text,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
}) {
  const size = fitSize(text, w - 4, 9);
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}em`,
        top: `${y}em`,
        width: `${w}em`,
        height: `${h}em`,
        border: `${LW} solid ${INK}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        paddingLeft: "2em",
      }}
    >
      {text ? (
        <span
          style={{
            fontSize: `${size}em`,
            fontWeight: 700,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      ) : null}
    </div>
  );
}
/** Square/rectangular tick box with an optional check mark. */
function Tick({
  x,
  y,
  w = 13,
  h = 13,
  on = false,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  on?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}em`,
        top: `${y}em`,
        width: `${w}em`,
        height: `${h}em`,
        border: `${LW} solid ${INK}`,
        boxSizing: "border-box",
      }}
    >
      {on ? (
        <svg
          viewBox="0 0 10 10"
          width="100%"
          height="100%"
          style={{ display: "block" }}
        >
          <path
            d="M1.6 5.4 4 7.8 8.6 2.2"
            fill="none"
            stroke={INK}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </div>
  );
}
/** Small bordered caption such as the "স্বামী" / "স্ত্রী" cells; `ring` circles the chosen one. */
function CaptionBox({
  x,
  y,
  w,
  h,
  ring,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  ring: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: `${x}em`,
          top: `${y}em`,
          width: `${w}em`,
          height: `${h}em`,
          border: `${LW} solid ${INK}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "5.6em",
            lineHeight: 1,
            fontWeight: ring ? 700 : 400,
          }}
        >
          {children}
        </span>
      </div>
      {ring ? (
        <div
          style={{
            position: "absolute",
            left: `${x - 2.5}em`,
            top: `${y - 2.5}em`,
            width: `${w + 5}em`,
            height: `${h + 5}em`,
            border: `${LW} solid ${INK}`,
            borderRadius: "50%",
            boxSizing: "border-box",
          }}
        />
      ) : null}
    </>
  );
}
function Slash({ x, y }: { x: number; y: number }) {
  return (
    <svg
      viewBox="0 0 10 14"
      style={{
        position: "absolute",
        left: `${x}em`,
        top: `${y}em`,
        width: "10em",
        height: "14em",
      }}
    >
      <line x1="1" y1="13" x2="9" y2="1" stroke={INK} strokeWidth="0.9" />
    </svg>
  );
}
function Emblem() {
  const vt = useVoterText();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt={vt("")}
      draggable={false}
      style={{
        position: "absolute",
        left: "48em",
        top: "47em",
        width: "31em",
        height: "31em",
        objectFit: "contain",
      }}
    />
  );
}
/* ------------------------------- PAGE 1 ------------------------------------ */
const MARITAL_TICK_X = [249, 296.5, 339.5, 389.5, 425.5];
const MARITAL_LABEL_X = [267, 316, 359.5, 407, 443];
const MARITAL_LABEL_S = [5.6, 5.8, 5.4, 5.8, 6.4];
const MARITAL_LABEL = [
  "অবিবাহিত",
  "বিবাহিত",
  "তালাকপ্রাপ্ত",
  "বিধবা",
  "বিপত্নীক",
];
const BLOOD_X = [222, 252.7, 282, 312, 341.7, 378, 417, 448];
const BLOOD_W = [22, 20, 22, 20, 28, 27.7, 22, 19];
function Page1({ d }: { d: VoterFormState }) {
  const vt = useVoterText();
  const dob = d.dateOfBirth.replace(/\D/g, "");
  const husband = d.spouseRelation === "Husband";
  const wife = d.spouseRelation === "Wife";
  const fatherNid = d.fatherNidNotApplicable ? "" : d.fatherNid;
  const motherNid = d.motherNidNotApplicable ? "" : d.motherNid;
  const spouseName = d.spouseNameNotApplicable ? "" : d.spouseName;
  const spouseNid = d.spouseNidNotApplicable ? "" : d.spouseNid;
  const spouseDeath = d.spouseDeathNotApplicable ? "" : d.spouseDeathYear;
  const has = (item: string) => d.disability.includes(item);
  return (
    <>
      <Emblem />
      <Txt x={328} y={56} a="r" s={8.2}>
        <T>
          {
            "\u09A8\u09BF\u09AC\u09A8\u09CD\u09A7\u09A8 \u09AB\u09B0\u09AE (\u09AB\u09B0\u09AE-\u09E8) \u09AB\u09B0\u09AE \u09A8\u09AE\u09CD\u09AC\u09B0 :\n      "
          }
        </T>
      </Txt>
      <WideBox x={331.8} y={51} w={134.4} h={12} text={d.formNumber.trim()} />
      <Txt x={261.4} y={73.6} a="c" s={6.8}>
        <T>
          {
            "[\u09AC\u09BF\u09A7\u09BF-\u09E7\u09E6 \u09A6\u09CD\u09B0\u09B7\u09CD\u099F\u09AC\u09CD\u09AF]\n      "
          }
        </T>
      </Txt>
      <Txt x={386} y={92.5} a="r" s={8}>
        <T>
          {
            "\u09E8\u0964 \u09AD\u09CB\u099F\u09BE\u09B0 \u098F\u09B2\u09BE\u0995\u09BE\u09B0 \u09A8\u09AE\u09CD\u09AC\u09B0 :\n      "
          }
        </T>
      </Txt>
      <Boxes
        x={391.9}
        y={84}
        w={74.1}
        h={11.5}
        n={4}
        value={d.voterAreaNumber}
      />

      <Txt x={56} y={107} s={8}>
        <T>
          {
            "\u09E7\u0964 \u09AD\u09CB\u099F\u09BE\u09B0 \u098F\u09B2\u09BE\u0995\u09BE\u09B0 \u09A8\u09BE\u09AE :\n      "
          }
        </T>
      </Txt>
      <Dots x1={143.6} x2={378} y={110.5} />
      <Val x1={143.6} x2={378} y={110.5} text={d.voterAreaName.trim()} />

      <Txt x={56} y={122.2} s={8}>
        <T>
          {
            "\u09E9\u0964 \u09A8\u09BE\u09AE (\u09AC\u09BE\u0982\u09B2\u09BE\u09AF\u09BC):\n      "
          }
        </T>
      </Txt>
      <Dots x1={123} x2={458} y={125.7} />
      <Val x1={123} x2={458} y={125.7} text={d.nameBn.trim()} />

      <Txt x={56} y={139.6} s={8}>
        <T>
          {
            "\u09EA\u0964 \u09A8\u09BE\u09AE (ENGLISH \u09AC\u09A1\u09BC \u0985\u0995\u09CD\u09B7\u09B0\u09C7):\n      "
          }
        </T>
      </Txt>
      <Dots x1={181.6} x2={458} y={143.1} />
      <Val x1={181.6} x2={458} y={143.1} text={d.nameEn.trim()} />

      <Txt x={56} y={155.8} s={8}>
        <T>
          {
            "\u09EB\u0964 \u09AA\u09BF\u09A4\u09BE\u09B0 \u09A8\u09BE\u09AE :\n      "
          }
        </T>
      </Txt>
      <Dots x1={115} x2={458} y={159.3} />
      <Val x1={115} x2={458} y={159.3} text={d.fatherName.trim()} />

      <Txt x={56} y={173.6} s={8}>
        <T>
          {
            "\u09EC\u0964 \u09AA\u09BF\u09A4\u09BE\u09B0 NID \u09A8\u0982\u0983\n      "
          }
        </T>
      </Txt>
      <Boxes x={137} y={165.7} w={270.8} h={15.8} n={17} value={fatherNid} />
      <Txt x={412.5} y={173.6} s={6.4}>
        <T>
          {
            "\u09AA\u09CD\u09B0\u09AF\u09CB\u099C\u09CD\u09AF \u09A8\u09AF\u09BC :\n      "
          }
        </T>
      </Txt>
      <Tick x={454} y={165.7} w={12} h={15.8} on={d.fatherNidNotApplicable} />

      <Txt x={56} y={197.3} s={8}>
        <T>
          {
            "\u0985\u09A5\u09AC\u09BE \u09AD\u09CB\u099F\u09BE\u09B0 \u09A8\u0982\n      "
          }
        </T>
      </Txt>
      <Boxes
        x={117}
        y={189.4}
        w={190.7}
        h={15.8}
        n={13}
        value={d.fatherVoterNumber}
      />
      <Txt x={316.8} y={197.3} s={7}>
        <T>
          {
            "\u09ED\u0964 \u09AA\u09BF\u09A4\u09BE \u09AE\u09C3\u09A4 \u09B9\u09B2\u09C7 \u09AE\u09C3\u09A4\u09CD\u09AF\u09C1\u09B0 \u09B8\u09BE\u09B2 :\n      "
          }
        </T>
      </Txt>
      <Boxes
        x={418.8}
        y={189.4}
        w={47.4}
        h={15.8}
        n={4}
        value={d.fatherDeathYear}
      />

      <Txt x={56} y={218} s={8}>
        <T>
          {
            "\u09EE\u0964 \u09AE\u09BE\u09A4\u09BE\u09B0 \u09A8\u09BE\u09AE :\n      "
          }
        </T>
      </Txt>
      <Dots x1={115} x2={458} y={221.5} />
      <Val x1={115} x2={458} y={221.5} text={d.motherName.trim()} />

      <Txt x={56} y={235.7} s={8}>
        <T>
          {
            "\u09EF\u0964 \u09AE\u09BE\u09A4\u09BE\u09B0 NID \u09A8\u0982\u0983\n      "
          }
        </T>
      </Txt>
      <Boxes x={137} y={227.8} w={270.8} h={15.8} n={17} value={motherNid} />
      <Txt x={412.5} y={235.7} s={6.4}>
        <T>
          {
            "\u09AA\u09CD\u09B0\u09AF\u09CB\u099C\u09CD\u09AF \u09A8\u09AF\u09BC :\n      "
          }
        </T>
      </Txt>
      <Tick x={454} y={227.8} w={12} h={15.8} on={d.motherNidNotApplicable} />

      <Txt x={56} y={256.6} s={8}>
        <T>
          {
            "\u0985\u09A5\u09AC\u09BE \u09AD\u09CB\u099F\u09BE\u09B0 \u09A8\u0982\n      "
          }
        </T>
      </Txt>
      <Boxes
        x={117}
        y={248.7}
        w={190.7}
        h={15.8}
        n={13}
        value={d.motherVoterNumber}
      />
      <Txt x={316.8} y={256.6} s={7}>
        <T>
          {
            "\u09E7\u09E6\u0964 \u09AE\u09BE\u09A4\u09BE \u09AE\u09C3\u09A4 \u09B9\u09B2\u09C7 \u09AE\u09C3\u09A4\u09CD\u09AF\u09C1\u09B0 \u09B8\u09BE\u09B2 :\n      "
          }
        </T>
      </Txt>
      <Boxes
        x={418.8}
        y={248.7}
        w={47.4}
        h={15.8}
        n={4}
        value={d.motherDeathYear}
      />

      <Txt x={56} y={281} s={8}>
        <T>{"\u09E7\u09E7\u0964\n      "}</T>
      </Txt>
      <CaptionBox x={78.7} y={274} w={22.6} h={14} ring={husband}>
        <T>{"\u09B8\u09CD\u09AC\u09BE\u09AE\u09C0\n      "}</T>
      </CaptionBox>
      <Slash x={102} y={274} />
      <CaptionBox x={112} y={274} w={19.7} h={14} ring={wife}>
        <T>{"\u09B8\u09CD\u09A4\u09CD\u09B0\u09C0\n      "}</T>
      </CaptionBox>
      <Txt x={137} y={281} s={8}>
        <T>{"\u09A8\u09BE\u09AE :\n      "}</T>
      </Txt>
      <Dots x1={168.5} x2={405.7} y={284.5} />
      <Val x1={168.5} x2={405.7} y={284.5} text={spouseName.trim()} />
      <Txt x={406.5} y={281} s={6.4}>
        <T>
          {
            "\u09AA\u09CD\u09B0\u09AF\u09CB\u099C\u09CD\u09AF \u09A8\u09AF\u09BC :\n      "
          }
        </T>
      </Txt>
      <Tick x={452.4} y={274} w={14.6} h={14} on={d.spouseNameNotApplicable} />

      <Txt x={56} y={302} s={8}>
        <T>{"\u09E7\u09E8\u0964\n      "}</T>
      </Txt>
      <CaptionBox x={78.7} y={295.6} w={22.6} h={12.8} ring={husband}>
        <T>{"\u09B8\u09CD\u09AC\u09BE\u09AE\u09C0\n      "}</T>
      </CaptionBox>
      <Slash x={102} y={295.2} />
      <CaptionBox x={112} y={295.6} w={19.7} h={12.8} ring={wife}>
        <T>{"\u09B8\u09CD\u09A4\u09CD\u09B0\u09C0\n      "}</T>
      </CaptionBox>
      <Txt x={132} y={302} s={6.8}>
        <T>{"NID \u09A8\u0982\u0983\n      "}</T>
      </Txt>
      <Boxes x={169.7} y={295.4} w={233.3} h={13} n={17} value={spouseNid} />
      <Txt x={405.7} y={302} s={6.2}>
        <T>
          {
            "\u09AA\u09CD\u09B0\u09AF\u09CB\u099C\u09CD\u09AF \u09A8\u09AF\u09BC :\n      "
          }
        </T>
      </Txt>
      <Tick x={453} y={295.4} w={13.5} h={13} on={d.spouseNidNotApplicable} />

      <Txt x={56} y={323.4} s={8}>
        <T>{"\u09E7\u09E9\u0964\n      "}</T>
      </Txt>
      <Tick x={81.5} y={316.6} w={15} h={14} on={husband} />
      <Txt x={102.5} y={323.4} s={7.4}>
        <T>{"\u09B8\u09CD\u09AC\u09BE\u09AE\u09C0\n      "}</T>
      </Txt>
      <Tick x={126} y={316.6} w={15} h={14} on={wife} />
      <Txt x={146.8} y={323.4} s={7.4}>
        <T>
          {
            "\u09B8\u09CD\u09A4\u09CD\u09B0\u09C0 \u09AE\u09C3\u09A4 \u09B9\u09B2\u09C7 \u09AE\u09C3\u09A4\u09CD\u09AF\u09C1\u09B0 \u09B8\u09BE\u09B2\n      "
          }
        </T>
      </Txt>
      <Boxes x={225.8} y={316.4} w={78.2} h={15} n={4} value={spouseDeath} />
      <Txt x={410} y={323.4} s={6.4}>
        <T>
          {
            "\u09AA\u09CD\u09B0\u09AF\u09CB\u099C\u09CD\u09AF \u09A8\u09AF\u09BC :\n      "
          }
        </T>
      </Txt>
      <Tick x={453} y={316.4} w={14} h={15} on={d.spouseDeathNotApplicable} />

      <Txt x={56} y={345} s={8}>
        <T>
          {
            "\u09E7\u09EA\u0964 \u09E7\u09ED \u0985\u0982\u0995\u09C7\u09B0 \u099C\u09A8\u09CD\u09AE \u09A8\u09BF\u09AC\u09A8\u09CD\u09A7\u09A8 \u09A8\u0982\u0983\n      "
          }
        </T>
      </Txt>
      <Boxes
        x={165.7}
        y={337.4}
        w={300.3}
        h={15.2}
        n={17}
        value={d.birthRegistration}
      />

      <Txt x={141} y={365} a="c" s={5.2}>
        <T>{"\u09A6\u09BF\u09A8\n      "}</T>
      </Txt>
      <Txt x={172.5} y={365} a="c" s={5.2}>
        <T>{"\u09AE\u09BE\u09B8\n      "}</T>
      </Txt>
      <Txt x={222.7} y={365} a="c" s={5.2}>
        <T>{"\u09AC\u099B\u09B0\n      "}</T>
      </Txt>
      <Txt x={56} y={378.4} s={8}>
        <T>
          {
            "\u09E7\u09EB\u0964 \u099C\u09A8\u09CD\u09AE \u09A4\u09BE\u09B0\u09BF\u0996 :\n      "
          }
        </T>
      </Txt>
      <Boxes x={122} y={371.7} w={135} h={13.8} n={8} value={dob} />
      <Txt x={265} y={378.4} s={7.8}>
        <T>
          {
            "\u09E7\u09EC\u0964 \u099C\u09A8\u09CD\u09AE \u09B8\u09CD\u09A5\u09BE\u09A8 (\u099C\u09C7\u09B2\u09BE):\n      "
          }
        </T>
      </Txt>
      <Dots x1={348} x2={462} y={382.4} />
      <Val x1={348} x2={462} y={382.4} text={d.placeOfBirth.trim()} />

      <Txt x={57.8} y={400.2} s={7.4}>
        <T>{"\u09E7\u09ED\u0964 \u09B2\u09BF\u0999\u09CD\u0997\n      "}</T>
      </Txt>
      <Tick x={97.3} y={393.4} w={15} h={15.8} on={d.gender === "Male"} />
      <Txt x={117} y={400.2} s={7}>
        <T>{"\u09AA\u09C1\u09B0\u09C1\u09B7\n      "}</T>
      </Txt>
      <Tick x={136.9} y={393.4} w={15.8} h={15.8} on={d.gender === "Female"} />
      <Txt x={155.9} y={400.2} s={7}>
        <T>{"\u09AE\u09B9\u09BF\u09B2\u09BE\n      "}</T>
      </Txt>
      <Txt x={195.4} y={400.2} s={5}>
        <T>
          {
            "\u09E7\u09EE\u0964 \u09AC\u09C8\u09AC\u09BE\u09B9\u09BF\u0995 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE:\n      "
          }
        </T>
      </Txt>
      {MARITAL.map((status, i) => (
        <div key={status}>
          <Tick
            x={MARITAL_TICK_X[i]}
            y={393.6}
            w={13.8}
            h={15.6}
            on={d.maritalStatus === status}
          />
          <Txt x={MARITAL_LABEL_X[i]} y={400.2} s={MARITAL_LABEL_S[i]}>
            {MARITAL_LABEL[i]}
          </Txt>
        </div>
      ))}

      <Txt x={57.8} y={423.5} s={7.8}>
        <T>
          {
            "\u09E7\u09EF\u0964 \u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u0997\u09A4 \u09AF\u09CB\u0997\u09CD\u09AF\u09A4\u09BE (\u09A8\u09BF\u09B0\u09CD\u09A7\u09BE\u09B0\u09BF\u09A4 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE \u0985\u09A8\u09C1\u09AF\u09BE\u09AF\u09BC\u09C0):\n      "
          }
        </T>
      </Txt>
      <Dots x1={243.6} x2={462} y={427} />
      <Val x1={243.6} x2={462} y={427} text={d.education.trim()} />

      <Txt x={57.8} y={439.7} s={7.8}>
        <T>
          {
            "\u09E8\u09E6\u0964 \u09AA\u09C7\u09B6\u09BE (\u09A8\u09BF\u09B0\u09CD\u09A7\u09BE\u09B0\u09BF\u09A4 \u09EA\u09EA):\n      "
          }
        </T>
      </Txt>
      <Dots x1={160.6} x2={268.5} y={443.2} />
      <Val x1={160.6} x2={268.5} y={443.2} text={d.occupation.trim()} s={8} />
      <Txt x={276.5} y={439.7} s={6.8}>
        <T>
          {
            "\u09E8\u09E7\u0964 \u0985\u09B8\u09BE\u09AE\u09B0\u09CD\u09A5\u09CD\u09AF\u09A4\u09BE/\u09AA\u09CD\u09B0\u09A4\u09BF\u09AC\u09A8\u09CD\u09A7\u09C0\u09B0 \u09AA\u09CD\u09B0\u0995\u09C3\u09A4\u09BF (\u2713 \u09A6\u09BF\u09A8):\n      "
          }
        </T>
      </Txt>
      <Txt x={410.5} y={439.7} s={6.4}>
        <T>
          {
            "\u09AA\u09CD\u09B0\u09AF\u09CB\u099C\u09CD\u09AF \u09A8\u09AF\u09BC\n      "
          }
        </T>
      </Txt>
      <Tick x={447} y={429.8} w={15} h={14.2} on={false} />

      <Txt x={85.5} y={453.6} s={5.8}>
        <T>
          {
            "\u09A6\u09C3\u09B7\u09CD\u099F\u09BF \u09AA\u09CD\u09B0\u09A4\u09BF\u09AC\u09A8\u09CD\u09A7\u09C0\n      "
          }
        </T>
      </Txt>
      <Tick x={131.7} y={446.8} w={15} h={14} on={has("Visually impaired")} />
      <Txt x={152.7} y={453.6} s={5.8}>
        <T>
          {
            "\u09B6\u09BE\u09B0\u09C0\u09B0\u09BF\u0995 \u09AA\u09CD\u09B0\u09A4\u09BF\u09AC\u09A8\u09CD\u09A7\u09C0\n      "
          }
        </T>
      </Txt>
      <Tick x={212} y={446.8} w={15.8} h={14} on={has("Physically disabled")} />
      <Txt x={229.8} y={453.6} s={5.8}>
        <T>
          {
            "\u09B6\u09CD\u09B0\u09AC\u09A3 \u09AA\u09CD\u09B0\u09A4\u09BF\u09AC\u09A8\u09CD\u09A7\u09C0\n      "
          }
        </T>
      </Txt>
      <Tick x={287} y={446.8} w={16} h={14} on={has("Hearing impaired")} />
      <Txt x={316.8} y={453.6} s={5.8}>
        <T>
          {
            "\u09AC\u09BE\u0995 \u09AA\u09CD\u09B0\u09A4\u09BF\u09AC\u09A8\u09CD\u09A7\u09C0\n      "
          }
        </T>
      </Txt>
      <Tick x={364} y={446.8} w={15} h={14} on={has("Speech impaired")} />
      <Txt x={384} y={453.6} s={5.8}>
        <T>{"\u0985\u09A8\u09CD\u09AF\u09BE\u09A8\u09CD\u09AF\n      "}</T>
      </Txt>
      <Dots x1={414.8} x2={466} y={457.4} />
      <Val
        x1={414.8}
        x2={466}
        y={457.4}
        text={has("Other") ? "✓" : ""}
        align="center"
      />

      <Txt x={57.8} y={474.5} s={7.4}>
        <T>
          {
            "\u09E8\u09E8\u0964 \u09A6\u09C3\u09B6\u09CD\u09AF\u09AE\u09BE\u09A8 \u09B8\u09A8\u09BE\u0995\u09CD\u09A4\u0995\u09B0\u09A3 \u099A\u09BF\u09B9\u09CD\u09A8 :\n      "
          }
        </T>
      </Txt>
      <Dots x1={160.6} x2={462} y={478} />
      <Val x1={160.6} x2={462} y={478} text={d.identificationMark.trim()} />

      <Txt x={57.8} y={490.3} s={7.4}>
        <T>
          {
            "\u09E8\u09E9\u0964 \u09B0\u0995\u09CD\u09A4\u09C7\u09B0 \u0997\u09CD\u09B0\u09C1\u09AA (\u09AF\u09A6\u09BF \u099C\u09BE\u09A8\u09BE \u09A5\u09BE\u0995\u09C7 \u2713 \u09A6\u09BF\u09A8):\n      "
          }
        </T>
      </Txt>
      {BLOOD_GROUPS.map((group, i) => (
        <div
          key={group}
          style={{
            position: "absolute",
            left: `${BLOOD_X[i]}em`,
            top: "482em",
            width: `${BLOOD_W[i]}em`,
            height: "15em",
            border: `${LW} solid ${INK}`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              d.bloodGroup === group ? "rgba(29,27,23,0.16)" : "transparent",
          }}
        >
          <span
            style={{
              fontSize: "6.4em",
              lineHeight: 1,
              fontWeight: d.bloodGroup === group ? 700 : 400,
            }}
          >
            {group}
          </span>
        </div>
      ))}

      <Txt x={57} y={512.6} s={7.4}>
        <T>
          {
            "\u09A6\u09CD\u09B0\u09B7\u09CD\u099F\u09AC\u09CD\u09AF : \u09AA\u09BF\u09A4\u09BE/\u09AE\u09BE\u09A4\u09BE/\u09B8\u09CD\u09AC\u09BE\u09AE\u09C0/\u09B8\u09CD\u09A4\u09CD\u09B0\u09C0/ \u09E8\u09E6\u09E6\u09ED \u098F\u09B0 \u09AA\u09B0 \u09AE\u09C3\u09A4\u09CD\u09AF\u09C1\u09AC\u09B0\u09A3 \u0995\u09B0\u09C7 \u09A5\u09BE\u0995\u09B2\u09C7\n        \u09AB\u09B0\u09AE-\u09E7\u09E8 \u09AA\u09C2\u09B0\u09A3 \u0995\u09B0\u09A4\u09C7 \u09B9\u09AC\u09C7\u0964\n      "
          }
        </T>
      </Txt>
      <Dots x1={57} x2={465} y={536.7} />

      <Txt x={266.6} y={554.5} a="c" s={7.4}>
        <T>
          {
            "\u09A8\u09BF\u09AC\u09A8\u09CD\u09A7\u09A8 \u09B8\u09CD\u09B2\u09BF\u09AA\n      "
          }
        </T>
      </Txt>
      <Txt x={266.6} y={567} a="c" s={6.8}>
        <T>{"(\u09AB\u09B0\u09AE-\u09EB)\n      "}</T>
      </Txt>
      <Txt x={266.6} y={573.4} a="c" s={5.2}>
        <T>
          {
            "[\u09AC\u09BF\u09A7\u09BF-\u09E7\u09E8 (\u0996) \u09A6\u09CD\u09B0\u09B7\u09CD\u099F\u09AC\u09CD\u09AF]\n      "
          }
        </T>
      </Txt>

      <Txt x={59} y={588} s={7.4}>
        <T>
          {
            "\u09AD\u09CB\u099F\u09BE\u09B0 \u098F\u09B2\u09BE\u0995\u09BE\u09B0 \u09A8\u09AE\u09CD\u09AC\u09B0 :\n      "
          }
        </T>
      </Txt>
      <Boxes
        x={138.9}
        y={578}
        w={79.1}
        h={15.6}
        n={4}
        value={d.voterAreaNumber}
      />
      <Txt x={287} y={588} s={7.4}>
        <T>{"\u09AB\u09B0\u09AE \u09A8\u09AE\u09CD\u09AC\u09B0 :\n      "}</T>
      </Txt>
      <WideBox
        x={330.6}
        y={578}
        w={136.4}
        h={15.6}
        text={d.formNumber.trim()}
      />

      <Txt x={59} y={602.8} s={7.4}>
        <T>{"\u09E7\u0964 \u09A8\u09BE\u09AE :\n      "}</T>
      </Txt>
      <Dots x1={95} x2={461} y={606.3} />
      <Val x1={95} x2={461} y={606.3} text={d.nameBn.trim()} />

      <Txt x={59} y={616.6} s={7.4}>
        <T>
          {
            "\u09E8\u0964 \u09A8\u09BF\u09AC\u09A8\u09CD\u09A7\u09A8 \u0995\u09C7\u09A8\u09CD\u09A6\u09CD\u09B0 :\n      "
          }
        </T>
      </Txt>
      <Dots x1={125} x2={263.4} y={620.1} />
      <Txt x={265.4} y={616.6} s={7.4}>
        <T>
          {
            "\u0989\u09AA\u09B8\u09CD\u09A5\u09BF\u09A4\u09BF\u09B0 \u09A4\u09BE\u09B0\u09BF\u0996 \u0993 \u09B8\u09AE\u09AF\u09BC :\n      "
          }
        </T>
      </Txt>
      <Dots x1={369} x2={463} y={620.1} />

      <Txt x={59} y={634.4} s={7.4}>
        <T>
          {
            "\u09E9\u0964 \u09A4\u09A5\u09CD\u09AF \u09B8\u0982\u0997\u09CD\u09B0\u09B9\u0995\u09BE\u09B0\u09C0\u09B0 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0 \u0993 \u09A4\u09BE\u09B0\u09BF\u0996 :\n      "
          }
        </T>
      </Txt>
      <Dots x1={188} x2={463} y={637.9} />
    </>
  );
}
/* ------------------------------- PAGE 2 ------------------------------------ */
const RMO_TICK: Array<[number, number]> = [
  [98, 25.9],
  [157.5, 27.5],
  [224.7, 27.7],
  [281.2, 26.5],
  [356.4, 23.3],
];
const RMO_LABEL_X = [135.7, 191, 258.3, 314.8, 386];
const RMO_LABEL = ["পল্লী", "পৌরসভা", "শহর", "অন্য এলাকা", "সিটি কর্পোরেশন"];
function AddressBlock({
  d,
  prefix,
  title,
  rows,
}: {
  d: VoterFormState;
  prefix: "current" | "permanent";
  title: string;
  rows: [number, number, number, number, number];
}) {
  const vt = useVoterText();
  const get = (name: string) =>
    String(d[`${prefix}${name}` as FormKey] ?? "").trim();
  const [r1, r2, r3, r4, r5] = rows;
  const rmo = get("Rmo");
  return (
    <>
      <Txt x={35} y={r1} s={7.8}>
        {title}
      </Txt>
      <Dots x1={140.5} x2={205} y={r1 + 3.6} />
      <Val x1={140.5} x2={205} y={r1 + 3.6} text={get("Division")} s={8} />
      <Txt x={207} y={r1} s={7.8}>
        <T>{"\u099C\u09C7\u09B2\u09BE :\n      "}</T>
      </Txt>
      <Dots x1={234.6} x2={293} y={r1 + 3.6} />
      <Val x1={234.6} x2={293} y={r1 + 3.6} text={get("District")} s={8} />
      <Txt x={294} y={r1} s={7.8}>
        <T>
          {
            "\u0989\u09AA\u099C\u09C7\u09B2\u09BE/\u09A5\u09BE\u09A8\u09BE :\n      "
          }
        </T>
      </Txt>
      <Dots x1={361} x2={438.2} y={r1 + 3.6} />
      <Val x1={361} x2={438.2} y={r1 + 3.6} text={get("Upazila")} s={8} />

      <Txt x={35} y={r2} s={6.9}>
        <T>
          {
            "\u09B8\u09BF\u099F\u09BF \u0995\u09B0\u09CD\u09AA\u09CB\u09B0\u09C7\u09B6\u09A8/\u09AA\u09CC\u09B0\u09B8\u09AD\u09BE/\u0987\u0989\u09A8\u09BF\u09AF\u09BC\u09A8/\u0995\u09CD\u09AF\u09BE\u09A8\u09CD\u099F : \u09AC\u09CB\u09B0\u09CD\u09A1 :\n      "
          }
        </T>
      </Txt>
      <Dots x1={189} x2={329.5} y={r2 + 3.6} />
      <Val x1={189} x2={329.5} y={r2 + 3.6} text={get("City")} s={8} />
      <Txt x={331.5} y={r2} s={7.4}>
        <T>
          {
            "\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1 \u09A8\u09AE\u09CD\u09AC\u09B0 :\n      "
          }
        </T>
      </Txt>
      <Dots x1={378} x2={438} y={r2 + 3.6} />
      <Val x1={378} x2={438} y={r2 + 3.6} text={get("Ward")} s={8} />

      <Txt x={35} y={r3} s={7.6}>
        <T>{"\u09AE\u09CC\u099C\u09BE :\n      "}</T>
      </Txt>
      <Dots x1={62.6} x2={175.3} y={r3 + 3.6} />
      <Val x1={62.6} x2={175.3} y={r3 + 3.6} text={get("Mouza")} s={8} />
      <Txt x={176.4} y={r3} s={6.6}>
        <T>
          {
            "\u0997\u09CD\u09B0\u09BE\u09AE/\u09AE\u09B9\u09B2\u09CD\u09B2\u09BE/\u09B0\u09BE\u09B8\u09CD\u09A4\u09BE\u09B0 \u09A8\u09BE\u09AE \u0993 \u09A8\u09AE\u09CD\u09AC\u09B0 :\n      "
          }
        </T>
      </Txt>
      <Dots x1={275} x2={438} y={r3 + 3.6} />
      <Val x1={275} x2={438} y={r3 + 3.6} text={get("Village")} s={8} />

      <Txt x={35} y={r4} s={7.4}>
        <T>
          {
            "\u09AC\u09BE\u09B8\u09BE/\u09B9\u09CB\u09B2\u09CD\u09A1\u09BF\u0982 \u09A8\u0982\u0983\n      "
          }
        </T>
      </Txt>
      <Dots x1={90} x2={177} y={r4 + 3.6} />
      <Val x1={90} x2={177} y={r4 + 3.6} text={get("House")} s={8} />
      <Txt x={178.4} y={r4} s={7.4}>
        <T>{"\u09A1\u09BE\u0995\u0998\u09B0\n      "}</T>
      </Txt>
      <Dots x1={206} x2={289} y={r4 + 3.6} />
      <Val x1={206} x2={289} y={r4 + 3.6} text={get("PostOffice")} s={8} />
      <Txt x={303.8} y={r4} s={7.4}>
        <T>{"\u09AA\u09CB\u09B8\u09CD\u099F \u0995\u09CB\u09A1 :\n      "}</T>
      </Txt>
      <Boxes
        x={356.4}
        y={r4 - 5.4}
        w={86.6}
        h={10.8}
        n={4}
        value={digitString(get("PostCode"), 4)}
        fs={8.4}
      />

      <Txt x={35} y={r5} s={7.6}>
        <T>{"\u0986\u09B0. \u098F\u09AE. \u0993.:\n      "}</T>
      </Txt>
      {RMO_OPTIONS.map((option, i) => (
        <div key={option}>
          <Tick
            x={RMO_TICK[i][0]}
            y={r5 - 6}
            w={RMO_TICK[i][1]}
            h={12}
            on={rmo === option}
          />
          <Txt x={RMO_LABEL_X[i]} y={r5} s={7.4}>
            {RMO_LABEL[i]}
          </Txt>
        </div>
      ))}
    </>
  );
}
const RELIGION_TICK: Array<[number, number]> = [
  [99.3, 19.8],
  [153.5, 26.5],
  [216.8, 25.7],
  [273.3, 27.7],
  [335.4, 25.7],
];
const RELIGION_LABEL_X = [128.6, 186.3, 248.4, 307.7, 365.9];
const RELIGION_LABEL = ["ইসলাম", "হিন্দু", "খ্রিস্টান", "বৌদ্ধ", "অন্যান্য"];
function SignatureRow({
  y,
  x,
  n,
  label,
  nid,
}: {
  y: number;
  x: number;
  n: number;
  label: string;
  nid?: string;
}) {
  return (
    <>
      <Txt x={35} y={y} s={6.4}>
        {label}
      </Txt>
      <Boxes
        x={x}
        y={y - 6.4}
        w={368.2 - x}
        h={12.4}
        n={n}
        value={nid ?? ""}
        fs={8.4}
      />
    </>
  );
}
function Page2({ d }: { d: VoterFormState }) {
  const vt = useVoterText();
  const religionIndex = RELIGIONS.indexOf(d.religion);
  return (
    <>
      <AddressBlock
        d={d}
        prefix="current"
        title={vt("২৪। বর্তমান ঠিকানা : বিভাগ :")}
        rows={[28.6, 46.4, 62.6, 79.6, 97]}
      />
      <AddressBlock
        d={d}
        prefix="permanent"
        title={vt("২৫। স্থায়ী ঠিকানা : বিভাগ :")}
        rows={[116.8, 134.6, 151.2, 168.2, 191.9]}
      />

      <Txt x={35} y={209.6} s={7.4}>
        <T>
          {
            "\u09E8\u09EC\u0964 TIN (\u09AF\u09A6\u09BF \u09A5\u09BE\u0995\u09C7):\n      "
          }
        </T>
      </Txt>
      <Boxes
        x={129.75}
        y={203.8}
        w={270.2}
        h={11.6}
        n={14}
        value={d.tin}
        fs={8.4}
      />
      <Txt x={35} y={228.3} s={7.4}>
        <T>
          {
            "\u09E8\u09ED\u0964 \u09A1\u09CD\u09B0\u09BE\u0987\u09AD\u09BF\u0982 \u09B2\u09BE\u0987\u09B8\u09C7\u09A8\u09CD\u09B8 (\u09AF\u09A6\u09BF \u09A5\u09BE\u0995\u09C7):\n      "
          }
        </T>
      </Txt>
      <Boxes
        x={149.8}
        y={222.5}
        w={293.3}
        h={11.6}
        n={14}
        value={d.drivingLicense}
        fs={8.4}
      />
      <Txt x={35} y={247.7} s={7.4}>
        <T>
          {
            "\u09E8\u09EE\u0964 \u09AA\u09BE\u09B8\u09AA\u09CB\u09B0\u09CD\u099F \u09A8\u09AE\u09CD\u09AC\u09B0 (\u09AF\u09A6\u09BF \u09A5\u09BE\u0995\u09C7):\n      "
          }
        </T>
      </Txt>
      <Boxes
        x={149.8}
        y={241.5}
        w={293.3}
        h={12.4}
        n={14}
        value={d.passportNumber}
        fs={8.4}
      />

      <Txt x={35} y={267.4} s={7.4}>
        <T>
          {
            "\u09E8\u09EF\u0964 \u099F\u09C7\u09B2\u09BF\u09AB\u09CB\u09A8 \u09A8\u09AE\u09CD\u09AC\u09B0 (\u09AF\u09A6\u09BF \u09A5\u09BE\u0995\u09C7):\n      "
          }
        </T>
      </Txt>
      <Dots x1={150.7} x2={256.3} y={270.9} />
      <Val x1={150.7} x2={256.3} y={270.9} text={d.telephone.trim()} />
      <Txt x={262} y={267.4} s={7.4}>
        <T>
          {
            "\u09E9\u09E6\u0964 \u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09A8\u09AE\u09CD\u09AC\u09B0 :\n      "
          }
        </T>
      </Txt>
      <Dots x1={332.6} x2={438} y={270.9} />
      <Val x1={332.6} x2={438} y={270.9} text={d.mobile.trim()} />

      <Txt x={35} y={284.4} s={7.4}>
        <T>
          {
            "\u09E9\u09E7\u0964 \u09A7\u09B0\u09CD\u09AE : (\u2713 \u09A6\u09BF\u09A8)\n      "
          }
        </T>
      </Txt>
      {RELIGIONS.map((religion, i) => (
        <div key={religion}>
          <Tick
            x={RELIGION_TICK[i][0]}
            y={277}
            w={RELIGION_TICK[i][1]}
            h={11.8}
            on={religionIndex === i}
          />
          <Txt x={RELIGION_LABEL_X[i]} y={284.4} s={7.4}>
            {RELIGION_LABEL[i]}
          </Txt>
        </div>
      ))}
      <Dots x1={403.4} x2={438} y={288.2} />
      <Val
        x1={403.4}
        x2={438}
        y={288.2}
        text={d.religion === "Other" ? d.religionOther.trim() : ""}
        s={7.6}
      />

      <Txt x={35} y={301.8} s={7.4}>
        <T>
          {
            "\u09E9\u09E8\u0964 \u09AC\u09BE\u09A6\u09AA\u09A1\u09BC\u09BE \u09AD\u09CB\u099F\u09BE\u09B0\u09A6\u09C7\u09B0 \u0995\u09CD\u09B7\u09C7\u09A4\u09CD\u09B0\u09C7\u2013\n      "
          }
        </T>
      </Txt>
      <Txt x={35} y={320.7} s={7.4}>
        <T>
          {
            "\u09AC\u09BE\u09A6\u09AA\u09A1\u09BC\u09BE\u09B0 \u0995\u09BE\u09B0\u09A3 :\n      "
          }
        </T>
      </Txt>
      <Dots x1={106} x2={438} y={324.2} />
      <Val x1={106} x2={438} y={324.2} text={d.exclusionReason.trim()} />

      <Txt x={35} y={336.6} s={7.4}>
        <T>
          {
            "\u09E9\u09E9\u0964 \u0986\u09AC\u09C7\u09A6\u09A8\u0995\u09BE\u09B0\u09C0\u09B0 \u09AA\u09CD\u09B0\u09A4\u09CD\u09AF\u09AF\u09BC\u09A8 :\n      "
          }
        </T>
      </Txt>
      <Txt x={54.7} y={347.2} s={4.5}>
        <T>
          {
            "\u0986\u09AE\u09BF \u09B6\u09AA\u09A5 \u0995\u09B0\u09BF\u09AF\u09BC\u09BE \u09AC\u09B2\u09BF\u09A4\u09C7\u099B\u09BF \u09AF\u09C7, \u0986\u09AE\u09BF \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C7\u09B0 \u09A8\u09BE\u0997\u09B0\u09BF\u0995 \u098F\u09AC\u0982 \u098F\u0987 \u09AB\u09B0\u09AE\u09C7 \u09AC\u09B0\u09CD\u09A3\u09BF\u09A4\n        \u09A4\u09A5\u09CD\u09AF\u09BE\u09A6\u09BF \u0986\u09AE\u09BE\u09B0 \u099C\u09CD\u099E\u09BE\u09A8 \u0993 \u09AC\u09BF\u09B6\u09CD\u09AC\u09BE\u09B8 \u09AE\u09A4\u09C7 \u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3 \u09B8\u09A4\u09CD\u09AF\u0964 \u0986\u09AE\u09BF \u09AC\u09B0\u09CD\u09A3\u09BF\u09A4 \u09AD\u09CB\u099F\u09BE\u09B0 \u098F\u09B2\u09BE\u0995\u09BE\n        \u09AC\u09CD\u09AF\u09A4\u09C0\u09A4 \u0985\u09A8\u09CD\u09AF\n      "
          }
        </T>
      </Txt>
      <Txt x={54.7} y={364.2} s={4.5}>
        <T>
          {
            "\u0995\u09CB\u09A8 \u09AD\u09CB\u099F\u09BE\u09B0 \u098F\u09B2\u09BE\u0995\u09BE\u09B0 \u09AD\u09CB\u099F\u09BE\u09B0 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE\u09AF\u09BC \u0986\u09AE\u09BE\u09B0 \u09A8\u09BE\u09AE \u0985\u09A8\u09CD\u09A4\u09B0\u09CD\u09AD\u09C1\u0995\u09CD\u09A4\u09BF\u09B0 \u099C\u09A8\u09CD\u09AF \u098F\u0987 \u09AB\u09B0\u09AE\n        \u09AC\u09CD\u09AF\u09A4\u09C0\u09A4 \u0985\u09A8\u09CD\u09AF \u0995\u09CB\u09A8 \u09AB\u09B0\u09AE \u09AA\u09C2\u09B0\u09A3 \u0995\u09B0\u09BF \u09A8\u09BE\u0987\u0964\n      "
          }
        </T>
      </Txt>
      <Txt x={310.5} y={364.2} s={6.6}>
        <T>
          {
            "\u0986\u09AC\u09C7\u09A6\u09A8\u0995\u09BE\u09B0\u09C0\u09B0 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0/\u099F\u09BF\u09AA\u09B8\u09B9\u09BF :\n      "
          }
        </T>
      </Txt>
      <Dots x1={414.5} x2={438} y={367.7} />

      <SignatureRow
        y={378}
        x={109.2}
        n={17}
        label="৩৪। শনাক্তকারীর NID নংঃ"
        nid={d.identifierNid}
      />
      <Txt x={373} y={378} s={6.6}>
        <T>
          {
            "\u09E9\u09EB\u0964 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0 : ........\n      "
          }
        </T>
      </Txt>
      <SignatureRow
        y={396.6}
        x={127}
        n={17}
        label="৩৬। তথ্য সংগ্রহকারীর NID নংঃ"
        nid={d.dataCollectorNid}
      />
      <Txt x={373} y={396.6} s={6.6}>
        <VT>
          {
            "\u09E9\u09ED\u0964 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0 : ........\n      "
          }
        </VT>
      </Txt>
      <SignatureRow
        y={416.4}
        x={127}
        n={17}
        label="৩৮। সুপারভাইজারের NID নংঃ"
      />
      <Txt x={373} y={416.4} s={6.6}>
        <VT>
          {
            "\u09E9\u09EF\u0964 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0 : ........\n      "
          }
        </VT>
      </Txt>

      <Txt x={35} y={438.2} s={7.2}>
        <VT>
          {
            "\u09EA\u09E6\u0964 \u09AF\u09BE\u099A\u09BE\u0987\u0995\u09BE\u09B0\u09C0\u09B0 \u09A8\u09BE\u09AE :\n      "
          }
        </VT>
      </Txt>
      <Dots x1={112.8} x2={438} y={441.7} />
      <SignatureRow y={456} x={109} n={17} label="৪১। যাচাইকারীর NID নংঃ" />
      <Txt x={373} y={456} s={6.6}>
        <VT>
          {
            "\u09EA\u09E8\u0964 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0 : ........\n      "
          }
        </VT>
      </Txt>

      <Txt x={35} y={475.7} s={4.4}>
        <VT>
          {
            "\u09EA\u09E9\u0964 \u0986\u09AC\u09C7\u09A6\u09A8\u0995\u09BE\u09B0\u09C0\u09B0 \u099B\u09AC\u09BF, \u0986\u0999\u09C1\u09B2\u09C7\u09B0 \u099B\u09BE\u09AA \u0993 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0 (\u09B0\u09C7\u099C\u09BF\u09B8\u09CD\u099F\u09CD\u09B0\u09C7\u09B6\u09A8 \u0995\u09C7\u09A8\u09CD\u09A6\u09CD\u09B0\u09C7 \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8\n        \u0995\u09B0\u09A4\u09C7 \u09B9\u09AC\u09C7); \u0986\u09AC\u09C7\u09A6\u09A8\u0995\u09BE\u09B0\u09C0\u09B0 \u09AA\u09CD\u09B0\u09A4\u09CD\u09AF\u09AF\u09BC\u09A8-\u0995\u09AE\u09CD\u09AA\u09BF\u0989\u099F\u09BE\u09B0\u09C7 \u0986\u09AE\u09BE\u09B0 \u09B8\u0995\u09B2\n      "
          }
        </VT>
      </Txt>
      <Txt x={35} y={487.2} s={4.4}>
        <VT>
          {
            "\u09A1\u09BE\u099F\u09BE\u09B0 \u09B8\u09A0\u09BF\u0995 \u098F\u09A8\u09CD\u099F\u09CD\u09B0\u09BF \u09A8\u09BF\u09B6\u09CD\u099A\u09BF\u09A4 \u0995\u09B0\u09B2\u09BE\u09AE (\u0986\u09AC\u09C7\u09A6\u09A8\u0995\u09BE\u09B0\u09C0\u09B0 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0/\u099F\u09BF\u09AA\u09B8\u09B9\u09BF):\n      "
          }
        </VT>
      </Txt>
      <Dots x1={234.6} x2={321.6} y={490.7} />
      <Txt x={323.5} y={487.2} s={6.6}>
        <VT>{"\u09A4\u09BE\u09B0\u09BF\u0996 :\n      "}</VT>
      </Txt>
      <Dots x1={358.3} x2={438} y={490.7} />

      <Txt x={35} y={505.4} s={6.4}>
        <VT>
          {
            "\u09EA\u09EA\u0964 \u09A1\u09BE\u099F\u09BE \u098F\u09A8\u09CD\u099F\u09CD\u09B0\u09BF \u0985\u09AA\u09BE\u09B0\u09C7\u099F\u09B0\u09C7\u09B0 NID \u09A8\u0982\u0983\n      "
          }
        </VT>
      </Txt>
      <Boxes x={139.7} y={498.5} w={226.2} h={13} n={17} />
      <Txt x={371} y={505.4} s={6.6}>
        <VT>
          {
            "\u09EA\u09EB\u0964 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0 : ........\n      "
          }
        </VT>
      </Txt>

      <Txt x={35} y={520} s={6.6}>
        <VT>
          {
            "\u09EA\u09EC\u0964 \u09B0\u09C7\u099C\u09BF\u09B8\u09CD\u099F\u09CD\u09B0\u09C7\u09B6\u09A8/\u09B8\u09B9\u0995\u09BE\u09B0\u09C0 \u09B0\u09C7\u099C\u09BF\u09B8\u09CD\u099F\u09CD\u09B0\u09C7\u09B6\u09A8 \u0995\u09B0\u09CD\u09AE\u0995\u09B0\u09CD\u09A4\u09BE\u09B0 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0 \u0993 \u09A4\u09BE\u09B0\u09BF\u0996 :\n      "
          }
        </VT>
      </Txt>
      <Dots x1={232.6} x2={438} y={523.5} />
      <Dots x1={35} x2={438} y={534} />

      <Txt x={236.5} y={548} a="c" s={7}>
        <VT>
          {
            "\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4\u09BF \u09B0\u09B6\u09BF\u09A6\n      "
          }
        </VT>
      </Txt>
      <Txt x={35} y={565.9} s={6.8}>
        <VT>
          {
            "\u09A1\u09BE\u099F\u09BE \u098F\u09A8\u09CD\u099F\u09CD\u09B0\u09BF \u0985\u09AA\u09BE\u09B0\u09C7\u099F\u09B0\u09C7\u09B0 \u09A8\u09BE\u09AE, \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0 \u0993 \u09A4\u09BE\u09B0\u09BF\u0996 :\n      "
          }
        </VT>
      </Txt>
      <Dots x1={180} x2={438} y={569.4} />
      <Txt x={236} y={582.5} a="c" s={6.8}>
        <VT>
          {
            "\u09A8\u09BF\u09AC\u09A8\u09CD\u09A7\u09A8 \u09B8\u09CD\u09B2\u09BF\u09AA \u098F\u09AC\u0982 \u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4\u09BF \u09B0\u09B6\u09BF\u09A6 \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u0995\u09B0\u09C1\u09A8\u0964\n      "
          }
        </VT>
      </Txt>
    </>
  );
}
/** One fixed-size Form-2 page. `unit` is the CSS length of one layout unit (e.g. "1.2px"). */
function FormPage({
  page,
  data,
  unit,
}: {
  page: 1 | 2;
  data: VoterFormState;
  unit: string;
}) {
  return (
    <div
      data-form-page={page}
      style={{
        position: "relative",
        width: `${PAGE_W}em`,
        height: `${PAGE_H}em`,
        fontSize: unit,
        background: PAPER,
        color: INK,
        fontFamily: FORM_FONT,
        overflow: "hidden",
        lineHeight: 1,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {page === 1 ? <Page1 d={data} /> : <Page2 d={data} />}
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/*  Preview                                                                    */
/* -------------------------------------------------------------------------- */
function useElementWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setWidth(node.getBoundingClientRect().width);
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}
function ScaledPaper({ page, data }: { page: 1 | 2; data: VoterFormState }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const width = useElementWidth(ref);
  return (
    <div
      ref={ref}
      data-voter-paper={`page-${page}`}
      className="w-full overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
      style={{ aspectRatio: `${PAGE_W}/${PAGE_H}`, background: PAPER }}
    >
      {width > 0 ? (
        <FormPage page={page} data={data} unit={`${width / PAGE_W}px`} />
      ) : null}
    </div>
  );
}
const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 10;
function PreviewFrame({
  data,
  hasData,
}: {
  data: VoterFormState;
  hasData: boolean;
}) {
  const vt = useVoterText();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState<1 | 2>(1);
  const [zoom, setZoom] = useState(100);
  const [panning, setPanning] = useState(false);
  const panRef = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
    id: number;
  } | null>(null);
  /* ---- grab-and-drag the form (like a PDF viewer / video player) ---- */
  const onPanStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Touch/pen already scroll natively; only take over for the mouse.
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const node = scrollRef.current;
    if (!node) return;
    // Leave the native scrollbars alone.
    const rect = node.getBoundingClientRect();
    if (
      event.clientX - rect.left >= node.clientWidth ||
      event.clientY - rect.top >= node.clientHeight
    )
      return;
    panRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: node.scrollLeft,
      top: node.scrollTop,
      id: event.pointerId,
    };
    node.setPointerCapture(event.pointerId);
    setPanning(true);
  };
  const onPanMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = panRef.current;
    const node = scrollRef.current;
    if (!start || !node) return;
    node.scrollLeft = start.left - (event.clientX - start.x);
    node.scrollTop = start.top - (event.clientY - start.y);
  };
  const onPanEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = panRef.current;
    if (!start) return;
    panRef.current = null;
    setPanning(false);
    try {
      scrollRef.current?.releasePointerCapture(start.id);
    } catch {
      // Pointer capture may already be released.
    }
    void event;
  };
  const updatePageFromScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    const viewport = node.getBoundingClientRect();
    const papers = Array.from(
      node.querySelectorAll<HTMLElement>("[data-voter-paper]"),
    );
    let bestPage: 1 | 2 = 1;
    let bestVisible = -Infinity;
    papers.forEach((paper) => {
      const rect = paper.getBoundingClientRect();
      const visible =
        Math.min(rect.bottom, viewport.bottom) -
        Math.max(rect.top, viewport.top);
      if (visible > bestVisible) {
        bestVisible = visible;
        bestPage = paper.dataset.voterPaper === "page-2" ? 2 : 1;
      }
    });
    setPage(bestPage);
  }, []);
  useEffect(() => {
    updatePageFromScroll();
  }, [updatePageFromScroll, zoom]);
  const nudgeZoom = (delta: number) => {
    setZoom((current) =>
      Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, current + delta)),
    );
  };
  const jumpToPage = (target: 1 | 2) => {
    const node = scrollRef.current;
    if (!node) return;
    const paper = node.querySelector<HTMLElement>(
      `[data-voter-paper="page-${target}"]`,
    );
    if (!paper) return;
    const top =
      paper.getBoundingClientRect().top -
      node.getBoundingClientRect().top +
      node.scrollTop -
      14;
    node.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    setPage(target);
  };
  return (
    <div className="rounded-xl border border-[#EFE3C5] bg-white p-3 shadow-[0_5px_20px_rgba(119,93,41,0.08)]">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[12px] font-semibold text-[#4B5563]">
          <VT>{"Preview\n        "}</VT>
        </span>
        <div className="flex items-center gap-2">
          <div className="flex h-8 items-center overflow-hidden rounded-md border border-[#EAE1C9] bg-white/70">
            <button
              type="button"
              title={vt("Zoom out")}
              aria-label={vt("Zoom out")}
              disabled={zoom <= ZOOM_MIN}
              onClick={() => nudgeZoom(-ZOOM_STEP)}
              className="h-full px-2 text-[#857F74] hover:bg-[#FAF6E9] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-11 text-center text-[10px] font-semibold text-[#696359]">
              {zoom}
              <VT>{"%\n            "}</VT>
            </span>
            <button
              type="button"
              title={vt("Zoom in")}
              aria-label={vt("Zoom in")}
              disabled={zoom >= ZOOM_MAX}
              onClick={() => nudgeZoom(ZOOM_STEP)}
              className="h-full px-2 text-[#857F74] hover:bg-[#FAF6E9] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title={vt("Reset zoom")}
              aria-label={vt("Reset zoom to 100%")}
              disabled={zoom === 100}
              onClick={() => setZoom(100)}
              className="h-full border-l border-[#EAE1C9] px-2 text-[#857F74] hover:bg-[#FAF6E9] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
          <span
            className={cx(
              "rounded-md px-2.5 py-1.5 text-[9px] font-semibold",
              hasData
                ? "bg-[#FBE4E4] text-[#C23A4D]"
                : "bg-[#F6E7B4] text-[#796838]",
            )}
          >
            {hasData ? <VT>{"Preview"}</VT> : <VT>{"Empty"}</VT>}
          </span>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-1.5 px-1 text-[10px] text-[#6D675D]">
        <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-[#D8D2C2] bg-white">
          <Check className="h-2.5 w-2.5 text-[#7E786E]" />
        </span>
        <VT>{"Live preview\n      "}</VT>
      </div>

      <div className="relative rounded-lg bg-[#2C2923] p-3.5 shadow-inner">
        <div className="absolute right-6 top-6 z-20">
          <button
            type="button"
            onClick={() => jumpToPage(page === 1 ? 2 : 1)}
            title={page === 1 ? vt("Go to page 2") : vt("Go to page 1")}
            className="flex items-center gap-1 rounded-full bg-[#37332D] px-2.5 py-1.5 text-[9px] font-semibold text-white shadow-lg"
          >
            <VT>{"Page "}</VT>
            {page}
            <VT>{"of 2\n            "}</VT>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={updatePageFromScroll}
          onPointerDown={onPanStart}
          onPointerMove={onPanMove}
          onPointerUp={onPanEnd}
          onPointerCancel={onPanEnd}
          onDragStart={(event) => event.preventDefault()}
          className={cx(
            "relative max-h-[calc(100vh-250px)] min-h-[420px] select-none overflow-auto rounded-md bg-[#3B352F] px-3 py-3.5 sm:min-h-[620px] sm:px-8",
            panning ? "cursor-grabbing" : "cursor-grab",
          )}
        >
          <div
            className="mx-auto"
            style={{
              width: `${zoom}%`,
              maxWidth: zoom <= 100 ? "640px" : undefined,
            }}
          >
            <div className="space-y-4">
              <ScaledPaper page={1} data={data} />
              <ScaledPaper page={2} data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/*  Print / PDF root: real A4 pages, only mounted while printing or exporting  */
/* -------------------------------------------------------------------------- */
const PRINT_CSS = `
#voter-print-root { position: fixed; left: -10000px; top: 0; width: 210mm; background: #fff; pointer-events: none; }
@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  body > *:not(#voter-print-root) { display: none !important; }
  #voter-print-root { position: static !important; left: auto !important; top: auto !important; width: 210mm !important; }
  #voter-print-root .voter-print-page { break-after: page; page-break-after: always; }
  #voter-print-root .voter-print-page:last-child { break-after: auto; page-break-after: auto; }
  #voter-print-root, #voter-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
function PrintRoot({
  data,
  mode,
}: {
  data: VoterFormState;
  mode: "print" | "pdf";
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div id="voter-print-root" aria-hidden="true">
      {([1, 2] as const).map((page) => (
        <div
          key={page}
          id={`voter-print-page-${page}`}
          className="voter-print-page"
          style={{
            position: "relative",
            width: "210mm",
            height: mode === "pdf" ? "297mm" : "296.5mm",
            overflow: "hidden",
            background: PAPER,
          }}
        >
          <FormPage page={page} data={data} unit={`${210 / PAGE_W}mm`} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
/* -------------------------------------------------------------------------- */
/*  Address block (left side)                                                  */
/* -------------------------------------------------------------------------- */
function AddressFields({
  prefix,
  data,
  setText,
  disabled = false,
}: {
  prefix: "current" | "permanent";
  data: VoterFormState;
  setText: (key: FreeTextKey, value: string) => void;
  disabled?: boolean;
}) {
  const vt = useVoterText();
  const suffix = prefix === "current" ? "current address" : "permanent address";
  const key = (name: string) => `${prefix}${name}` as FreeTextKey;
  const get = (name: string) => data[key(name)];
  const rmoKey = `${prefix}Rmo` as FreeTextKey;
  const rmo = data[rmoKey];
  return (
    <div className="space-y-3">
      <FieldRow>
        <TextField
          label={vt(`Division (${suffix})`)}
          placeholder={vt(`Division (${suffix})`)}
          maxLength={30}
          disabled={disabled}
          value={get("Division")}
          onChange={(v) => setText(key("Division"), v)}
        />
        <TextField
          label={vt(`District (${suffix})`)}
          placeholder={vt(`District (${suffix})`)}
          maxLength={30}
          disabled={disabled}
          value={get("District")}
          onChange={(v) => setText(key("District"), v)}
        />
      </FieldRow>
      <FieldRow>
        <TextField
          label={vt(`Upazila / thana (${suffix})`)}
          placeholder={vt(`Upazila / thana (${suffix})`)}
          maxLength={30}
          disabled={disabled}
          value={get("Upazila")}
          onChange={(v) => setText(key("Upazila"), v)}
        />
        <TextField
          label={vt(`Ward number (${suffix})`)}
          placeholder={vt("e.g. 05")}
          maxLength={10}
          disabled={disabled}
          value={get("Ward")}
          onChange={(v) => setText(key("Ward"), v)}
        />
      </FieldRow>
      <TextField
        label={vt(
          `City corporation / municipality / union / cantonment board (${suffix})`,
        )}
        placeholder={vt(
          "City corporation / municipality / union / cantonment board",
        )}
        maxLength={60}
        disabled={disabled}
        value={get("City")}
        onChange={(v) => setText(key("City"), v)}
      />
      <FieldRow>
        <TextField
          label={vt(`Mouza (${suffix})`)}
          placeholder={vt(`Mouza (${suffix})`)}
          maxLength={40}
          disabled={disabled}
          value={get("Mouza")}
          onChange={(v) => setText(key("Mouza"), v)}
        />
        <TextField
          label={vt(`Village / mahalla / road name and number (${suffix})`)}
          placeholder={vt("Village / mahalla / road name and number")}
          maxLength={60}
          disabled={disabled}
          value={get("Village")}
          onChange={(v) => setText(key("Village"), v)}
        />
      </FieldRow>
      <FieldRow>
        <TextField
          label={vt(`House / holding number (${suffix})`)}
          placeholder={vt("House / holding number")}
          maxLength={30}
          disabled={disabled}
          value={get("House")}
          onChange={(v) => setText(key("House"), v)}
        />
        <TextField
          label={vt(`Post office (${suffix})`)}
          placeholder={vt("Post office")}
          maxLength={30}
          disabled={disabled}
          value={get("PostOffice")}
          onChange={(v) => setText(key("PostOffice"), v)}
        />
      </FieldRow>
      <TextField
        label={vt(`Post code (${suffix})`)}
        placeholder={vt("e.g. 1230")}
        maxLength={4}
        inputMode="numeric"
        disabled={disabled}
        validate={validatePostCode}
        value={get("PostCode")}
        onChange={(v) => setText(key("PostCode"), digitString(v, 4))}
      />
      <div>
        <FieldLabel>{vt(`R.M.O. (${suffix})`)}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {RMO_OPTIONS.map((option) => (
            <ChoicePill
              key={option}
              active={rmo === option}
              onClick={() => {
                if (!disabled) setText(rmoKey, rmo === option ? "" : option);
              }}
            >
              {vt(option)}
            </ChoicePill>
          ))}
        </div>
      </div>
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */
export default function VoterRegistrationForm() {
  const vt = useVoterText();
  const { locale } = useSohozI18n();
  void locale;
  const [form, setForm] = useState<VoterFormState>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [usedCount, setUsedCount] = useState(0);
  const [mode, setMode] = useState<RenderMode>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const toastTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const pdfBusy = mode === "pdf";
  const hasData = useMemo(() => !isFormEmpty(form), [form]);
  /* ---- toasts ---- */
  const dismissToast = useCallback((id: number) => {
    const timer = toastTimers.current.get(id);
    if (timer) clearTimeout(timer);
    toastTimers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const pushToast = useCallback(
    (kind: ToastKind, title: string, message: string) => {
      toastId.current += 1;
      const id = toastId.current;
      setToasts((current) => [
        ...current.slice(-3),
        { id, kind, title, message },
      ]);
      toastTimers.current.set(
        id,
        setTimeout(() => dismissToast(id), 4000),
      );
    },
    [dismissToast],
  );
  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);
  /* ---- load saved data once, after mount (keeps SSR/hydration identical) ---- */
  useEffect(() => {
    const saved = safeReadJson(STORAGE_KEY);
    if (saved) setForm(saved);
    try {
      setFavorite(window.localStorage.getItem(FAVORITE_KEY) === "1");
      setUsedCount(
        Math.max(0, Number(window.localStorage.getItem(USED_KEY)) || 0),
      );
    } catch {
      // Storage may be unavailable (private mode); the tool still works.
    }
    setHydrated(true);
  }, []);
  /* ---- Bengali web font (system fonts remain as fallback) ---- */
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, []);
  /* ---- auto-persist ---- */
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (isFormEmpty(form)) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        const json = JSON.stringify(form);
        window.localStorage.setItem(STORAGE_KEY, json);
        window.localStorage.setItem(LAST_KEY, json);
      }
    } catch {
      // Local persistence is best-effort only.
    }
  }, [form, hydrated]);
  /* ---- field updates ---- */
  const setField = useCallback(
    <K extends FormKey>(key: K, value: VoterFormState[K]) => {
      setForm((current) => {
        let next = { ...current, [key]: value } as VoterFormState;
        if (
          current.permanentSameAsCurrent &&
          typeof key === "string" &&
          key.startsWith("current")
        ) {
          const mirrored = `permanent${key.slice("current".length)}` as FormKey;
          if (mirrored in next)
            next = { ...next, [mirrored]: value } as VoterFormState;
        }
        return next;
      });
    },
    [],
  );
  const setText = useCallback(
    (key: FreeTextKey, value: string) => setField(key, value),
    [setField],
  );
  const toggleDisability = (value: string) => {
    setForm((current) => ({
      ...current,
      disability: current.disability.includes(value)
        ? current.disability.filter((item) => item !== value)
        : DISABILITIES.filter(
            (item) => item === value || current.disability.includes(item),
          ),
    }));
  };
  const togglePermanentSame = () => {
    setForm((current) => {
      if (current.permanentSameAsCurrent)
        return { ...current, permanentSameAsCurrent: false };
      return {
        ...current,
        permanentSameAsCurrent: true,
        permanentDivision: current.currentDivision,
        permanentDistrict: current.currentDistrict,
        permanentUpazila: current.currentUpazila,
        permanentWard: current.currentWard,
        permanentCity: current.currentCity,
        permanentMouza: current.currentMouza,
        permanentVillage: current.currentVillage,
        permanentHouse: current.currentHouse,
        permanentPostOffice: current.currentPostOffice,
        permanentPostCode: current.currentPostCode,
        permanentRmo: current.currentRmo,
      };
    });
  };
  /* ---- clear / restore ---- */
  const clearAll = () => {
    if (!hasData) return;
    try {
      // "Last form" already mirrors the current data; keep it so Restore can undo this.
      window.localStorage.setItem(LAST_KEY, JSON.stringify(form));
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
    setForm({ ...EMPTY_FORM, disability: [] });
    pushToast("info", "Cleared", "All fields have been reset.");
  };
  const restoreLast = () => {
    const saved = safeReadJson(LAST_KEY);
    if (!saved || isFormEmpty(saved)) {
      pushToast(
        "info",
        "Nothing to restore",
        "There is no previously saved form on this device.",
      );
      return;
    }
    setForm(saved);
    pushToast("success", "Restored", "Your last form has been loaded.");
  };
  /* ---- favourite / share / usage ---- */
  const toggleFavorite = () => {
    setFavorite((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(FAVORITE_KEY, next ? "1" : "0");
      } catch {
        // Ignore storage errors.
      }
      return next;
    });
  };
  const bumpUsage = () => {
    setUsedCount((count) => {
      const next = count + 1;
      try {
        window.localStorage.setItem(USED_KEY, String(next));
      } catch {
        // Ignore storage errors.
      }
      return next;
    });
  };
  const share = async () => {
    const url = window.location.href;
    const payload = {
      title: vt("Voter Registration Form"),
      text: vt("Fill in the voter registration Form-2 details online."),
      url,
    };
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(payload);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        pushToast(
          "success",
          "Link copied",
          "The page link is on your clipboard.",
        );
      } else {
        pushToast(
          "error",
          "Could not share",
          "Sharing is not supported in this browser.",
        );
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return; // user dismissed the sheet
      pushToast(
        "error",
        "Could not share",
        "Sharing was blocked by the browser.",
      );
    }
  };
  /* ---- print ---- */
  useEffect(() => {
    // Also covers Ctrl/Cmd+P: mount the printable pages before the browser snapshots the DOM.
    const before = () =>
      flushSync(() => setMode((current) => current ?? "print"));
    const after = () =>
      setMode((current) => (current === "print" ? null : current));
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
  const print = async () => {
    if (mode === "pdf") return;
    flushSync(() => setMode("print"));
    await waitForFonts();
    bumpUsage();
    window.print();
  };
  /* ---- PDF ---- */
  const downloadPdf = async () => {
    if (mode) return;
    flushSync(() => setMode("pdf"));
    try {
      await waitForFonts();
      const pages = [1, 2].map((n) =>
        document.getElementById(`voter-print-page-${n}`),
      );
      if (pages.some((node) => !node))
        throw new Error("Printable pages were not found.");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      pdf.setProperties({
        title: vt("Voter Registration Form (Form-2)"),
        subject: vt("Voter registration application"),
      });
      for (let index = 0; index < pages.length; index += 1) {
        const canvas = await html2canvas(pages[index] as HTMLElement, {
          backgroundColor: PAPER,
          scale: 3,
          useCORS: true,
          logging: false,
          onclone: (clonedDocument) => {
            const root = clonedDocument.getElementById("voter-print-root");
            if (root) {
              root.style.left = "0";
              root.style.top = "0";
            }
          },
        });
        if (index > 0) pdf.addPage("a4", "portrait");
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 0.95),
          "JPEG",
          0,
          0,
          210,
          297,
          undefined,
          "FAST",
        );
      }
      const slug = form.nameEn
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
      pdf.save(
        slug
          ? `voter-registration-form-${slug}.pdf`
          : "voter-registration-form.pdf",
      );
      bumpUsage();
      pushToast(
        "success",
        "PDF ready",
        "Your 2-page Form-2 has been downloaded.",
      );
    } catch {
      pushToast(
        "error",
        "PDF failed",
        "The PDF could not be created. Please try again or use Print → Save as PDF.",
      );
    } finally {
      setMode(null);
    }
  };
  /* ---- render ---- */
  return (
    <div
      id="voter-registration-tool"
      className="relative -mx-4 -mt-6 min-h-[calc(100vh-72px)] bg-[#F8FAFC] px-4 pb-28 pt-5 text-[#0F172A] shadow-[0_0_0_100vmax_#F8FAFC] [clip-path:inset(0_-100vmax)] print:bg-white print:shadow-none"
    >
      <style>{PRINT_CSS}</style>
      {/* Pointer cursor on every clickable element of this tool */}
      <style>{`
        :where(#voter-registration-tool) a[href],
        :where(#voter-registration-tool) button:not(:disabled),
        :where(#voter-registration-tool) summary,
        :where(#voter-registration-tool) [role="button"],
        :where(#voter-registration-tool) select,
        :where(#voter-registration-tool) input[type="color"],
        :where(#voter-registration-tool) input[type="range"],
        :where(#voter-registration-tool) input[type="checkbox"],
        :where(#voter-registration-tool) input[type="radio"],
        :where(#voter-registration-tool) input[type="file"] {
          cursor: pointer;
        }

        :where(#voter-registration-tool) button:disabled {
          cursor: not-allowed;
        }
      `}</style>
      <datalist id="voter-district-list">
        {DISTRICTS.map(([bn, en]) => (
          <option key={en} value={bn} label={vt(en)} />
        ))}
      </datalist>

      <div className="mx-auto max-w-[1180px]">
        <div className="mb-2 flex items-center gap-2 px-1 text-[9px] text-[#9A9284]">
          <span>
            <VT>{"\u2302"}</VT>
          </span>
          <span>
            <VT>{"/"}</VT>
          </span>
          <span>
            <VT>{"Sohoz Tools"}</VT>
          </span>
          <span>
            <VT>{"/"}</VT>
          </span>
          <span>
            <VT>{"General Tools"}</VT>
          </span>
          <span>
            <VT>{"/"}</VT>
          </span>
          <span className="font-semibold text-[#71695E]">
            <VT>{"Voter Registration Form\n          "}</VT>
          </span>
        </div>

        <div className="mb-4 flex items-start justify-between gap-4 px-1">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#2563EB]">
                <FileText className="h-4 w-4" />
              </span>
              <h1 className="text-[23px] font-bold tracking-[-0.02em] text-[#111827]">
                <VT>{"Voter Registration Form\n              "}</VT>
              </h1>
              <span className="rounded-full bg-[#DDF2D4] px-2 py-1 text-[9px] font-bold text-[#4B8C44]">
                <VT>{"Free\n              "}</VT>
              </span>
              <span className="text-[9px] text-[#A59D90]">
                <VT>{"\u2713 Used "}</VT>
                {usedCount}{" "}
                {usedCount === 1 ? <VT>{"time"}</VT> : <VT>{"times"}</VT>}
              </span>
            </div>
            <p className="mt-1 pl-10 text-[10px] text-[#71695E]">
              <VT>
                {
                  "Fill in your details on the left \u2014 see the live Form-2 on the\n              right and download it as PDF.\n            "
                }
              </VT>
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              title={
                favorite ? vt("Remove from favorites") : vt("Add to favorites")
              }
              aria-pressed={favorite}
              onClick={toggleFavorite}
              className={cx(
                "flex h-9 w-9 items-center justify-center rounded-lg border bg-white/60 transition",
                favorite
                  ? "border-[#E6C37F] text-[#C58C2C]"
                  : "border-[#EEE3C5] text-[#A49B8B] hover:bg-white",
              )}
            >
              <Star className={cx("h-4 w-4", favorite && "fill-current")} />
            </button>
            <button
              type="button"
              title={vt("Share")}
              aria-label={vt("Share")}
              onClick={share}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EEE3C5] bg-white/60 text-[#A49B8B] transition hover:bg-white"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid items-start gap-3.5 lg:grid-cols-[295px_minmax(0,1fr)]">
          <div className="space-y-3.5">
            <SectionCard
              number={1}
              title={vt("Voter area")}
              description={vt(
                "The election office issues these numbers; leave them blank if you do not have them yet.",
              )}
            >
              <div className="space-y-3">
                <FieldRow>
                  <TextField
                    label={vt("Voter area name")}
                    placeholder={vt("Voter area name")}
                    maxLength={40}
                    value={form.voterAreaName}
                    onChange={(v) => setText("voterAreaName", v)}
                  />
                  <TextField
                    label={vt("Voter area number")}
                    placeholder={vt("e.g. 0512")}
                    maxLength={4}
                    inputMode="numeric"
                    validate={validateAreaNumber}
                    value={form.voterAreaNumber}
                    onChange={(v) =>
                      setText("voterAreaNumber", digitString(v, 4))
                    }
                  />
                </FieldRow>
                <TextField
                  label={vt("Form number")}
                  placeholder={vt("Form number")}
                  maxLength={24}
                  value={form.formNumber}
                  onChange={(v) => setText("formNumber", v)}
                />
              </div>
            </SectionCard>

            <SectionCard number={2} title={vt("Applicant")}>
              <div className="space-y-3">
                <TextField
                  label={vt("Name (in Bangla)")}
                  placeholder={vt("Name (in Bangla)")}
                  maxLength={60}
                  value={form.nameBn}
                  onChange={(v) => setText("nameBn", v)}
                />
                <TextField
                  label={vt("Name (ENGLISH, capitals)")}
                  placeholder={vt("Name (ENGLISH, capitals)")}
                  maxLength={60}
                  value={form.nameEn}
                  onChange={(v) => setText("nameEn", v.toUpperCase())}
                />
                <FieldRow>
                  <DateField
                    label={vt("Date of birth")}
                    placeholder={vt("01-01-1990")}
                    value={form.dateOfBirth}
                    onChange={(v) => setText("dateOfBirth", v)}
                  />
                  <TextField
                    label={vt("Place of birth (district)")}
                    placeholder={vt("Place of birth (district)")}
                    maxLength={30}
                    list="voter-district-list"
                    value={form.placeOfBirth}
                    onChange={(v) => setText("placeOfBirth", v)}
                  />
                </FieldRow>
                <TextField
                  label={vt("17-digit birth registration number")}
                  placeholder={vt("17-digit birth registration number")}
                  maxLength={17}
                  inputMode="numeric"
                  validate={validateBirthReg}
                  value={form.birthRegistration}
                  onChange={(v) =>
                    setText("birthRegistration", digitString(v, 17))
                  }
                />
                <div>
                  <FieldLabel>
                    <VT>{"Gender"}</VT>
                  </FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {GENDERS.map((option) => (
                      <ChoicePill
                        key={option}
                        active={form.gender === option}
                        onClick={() =>
                          setField(
                            "gender",
                            form.gender === option ? "" : option,
                          )
                        }
                      >
                        {vt(option)}
                      </ChoicePill>
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel>
                    <VT>{"Marital status"}</VT>
                  </FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {MARITAL.map((option) => (
                      <ChoicePill
                        key={option}
                        active={form.maritalStatus === option}
                        onClick={() =>
                          setField(
                            "maritalStatus",
                            form.maritalStatus === option ? "" : option,
                          )
                        }
                      >
                        {vt(option)}
                      </ChoicePill>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              number={3}
              title={vt("Parents")}
              description={vt(
                "If a parent died after 2007, Form-12 has to be filled in as well.",
              )}
            >
              <div className="space-y-3">
                <TextField
                  label={vt("Father's name")}
                  placeholder={vt("Father's name")}
                  maxLength={60}
                  value={form.fatherName}
                  onChange={(v) => setText("fatherName", v)}
                />
                <FieldRow>
                  <TextField
                    label={vt("Father's NID number")}
                    placeholder={vt("10, 13 or 17-digit NID")}
                    maxLength={17}
                    inputMode="numeric"
                    disabled={form.fatherNidNotApplicable}
                    validate={validateNid}
                    value={form.fatherNid}
                    onChange={(v) => setText("fatherNid", digitString(v, 17))}
                  />
                  <TextField
                    label={vt("Father's voter number")}
                    placeholder={vt("Father's voter number")}
                    maxLength={13}
                    inputMode="numeric"
                    validate={validateVoterNumber}
                    value={form.fatherVoterNumber}
                    onChange={(v) =>
                      setText("fatherVoterNumber", digitString(v, 13))
                    }
                  />
                </FieldRow>
                <div className="flex items-end gap-3">
                  <TextField
                    label={vt("Year of father's death")}
                    placeholder={vt("e.g. 2015")}
                    maxLength={4}
                    inputMode="numeric"
                    validate={validateYear}
                    value={form.fatherDeathYear}
                    onChange={(v) =>
                      setText("fatherDeathYear", digitString(v, 4))
                    }
                    className="flex-1"
                  />
                  <div className="pb-2">
                    <CheckBox
                      checked={form.fatherNidNotApplicable}
                      label={vt("Father's NID not applicable")}
                      onChange={(v) => setField("fatherNidNotApplicable", v)}
                    />
                  </div>
                </div>
                <TextField
                  label={vt("Mother's name")}
                  placeholder={vt("Mother's name")}
                  maxLength={60}
                  value={form.motherName}
                  onChange={(v) => setText("motherName", v)}
                />
                <FieldRow>
                  <TextField
                    label={vt("Mother's NID number")}
                    placeholder={vt("10, 13 or 17-digit NID")}
                    maxLength={17}
                    inputMode="numeric"
                    disabled={form.motherNidNotApplicable}
                    validate={validateNid}
                    value={form.motherNid}
                    onChange={(v) => setText("motherNid", digitString(v, 17))}
                  />
                  <TextField
                    label={vt("Mother's voter number")}
                    placeholder={vt("Mother's voter number")}
                    maxLength={13}
                    inputMode="numeric"
                    validate={validateVoterNumber}
                    value={form.motherVoterNumber}
                    onChange={(v) =>
                      setText("motherVoterNumber", digitString(v, 13))
                    }
                  />
                </FieldRow>
                <div className="flex items-end gap-3">
                  <TextField
                    label={vt("Year of mother's death")}
                    placeholder={vt("e.g. 2015")}
                    maxLength={4}
                    inputMode="numeric"
                    validate={validateYear}
                    value={form.motherDeathYear}
                    onChange={(v) =>
                      setText("motherDeathYear", digitString(v, 4))
                    }
                    className="flex-1"
                  />
                  <div className="pb-2">
                    <CheckBox
                      checked={form.motherNidNotApplicable}
                      label={vt("Mother's NID not applicable")}
                      onChange={(v) => setField("motherNidNotApplicable", v)}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              number={4}
              title={vt("Spouse")}
              description={
                'Unmarried? Tick the "not applicable" boxes instead.'
              }
            >
              <div className="space-y-3">
                <div>
                  <FieldLabel>
                    <VT>{"Husband or wife"}</VT>
                  </FieldLabel>
                  <div className="flex gap-2">
                    {SPOUSE_RELATIONS.map((option) => (
                      <ChoicePill
                        key={option}
                        active={form.spouseRelation === option}
                        onClick={() =>
                          setField(
                            "spouseRelation",
                            form.spouseRelation === option ? "" : option,
                          )
                        }
                      >
                        {vt(option)}
                      </ChoicePill>
                    ))}
                  </div>
                </div>
                <TextField
                  label={vt("Spouse's name")}
                  placeholder={vt("Spouse's name")}
                  maxLength={60}
                  disabled={form.spouseNameNotApplicable}
                  value={form.spouseName}
                  onChange={(v) => setText("spouseName", v)}
                />
                <TextField
                  label={vt("Spouse's NID number")}
                  placeholder={vt("10, 13 or 17-digit NID")}
                  maxLength={17}
                  inputMode="numeric"
                  disabled={form.spouseNidNotApplicable}
                  validate={validateNid}
                  value={form.spouseNid}
                  onChange={(v) => setText("spouseNid", digitString(v, 17))}
                />
                <TextField
                  label={vt("Year of spouse's death")}
                  placeholder={vt("e.g. 2015")}
                  maxLength={4}
                  inputMode="numeric"
                  disabled={form.spouseDeathNotApplicable}
                  validate={validateYear}
                  value={form.spouseDeathYear}
                  onChange={(v) =>
                    setText("spouseDeathYear", digitString(v, 4))
                  }
                />
                <div className="space-y-2 pt-1">
                  <CheckBox
                    checked={form.spouseNameNotApplicable}
                    label={vt("Name not applicable")}
                    onChange={(v) => setField("spouseNameNotApplicable", v)}
                  />
                  <CheckBox
                    checked={form.spouseNidNotApplicable}
                    label={vt("NID not applicable")}
                    onChange={(v) => setField("spouseNidNotApplicable", v)}
                  />
                  <CheckBox
                    checked={form.spouseDeathNotApplicable}
                    label={vt("Year of death not applicable")}
                    onChange={(v) => setField("spouseDeathNotApplicable", v)}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard number={5} title={vt("Personal details")}>
              <div className="space-y-3">
                <TextField
                  label={vt("Educational qualification")}
                  placeholder={vt("Educational qualification")}
                  maxLength={50}
                  value={form.education}
                  onChange={(v) => setText("education", v)}
                />
                <TextField
                  label={vt("Occupation")}
                  placeholder={vt("Occupation")}
                  maxLength={30}
                  value={form.occupation}
                  onChange={(v) => setText("occupation", v)}
                />
                <TextField
                  label={vt("Visible identification mark")}
                  placeholder={vt("Visible identification mark")}
                  maxLength={80}
                  value={form.identificationMark}
                  onChange={(v) => setText("identificationMark", v)}
                />
                <div>
                  <FieldLabel>
                    <VT>{"Blood group"}</VT>
                  </FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {BLOOD_GROUPS.map((group) => (
                      <ChoicePill
                        key={group}
                        active={form.bloodGroup === group}
                        onClick={() =>
                          setText(
                            "bloodGroup",
                            form.bloodGroup === group ? "" : group,
                          )
                        }
                      >
                        {group}
                      </ChoicePill>
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel>
                    <VT>{"Religion"}</VT>
                  </FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {RELIGIONS.map((religion) => (
                      <ChoicePill
                        key={religion}
                        active={form.religion === religion}
                        onClick={() =>
                          setText(
                            "religion",
                            form.religion === religion ? "" : religion,
                          )
                        }
                      >
                        {vt(religion)}
                      </ChoicePill>
                    ))}
                  </div>
                </div>
                {form.religion === "Other" ? (
                  <TextField
                    label={vt("Other religion")}
                    placeholder={vt("Other")}
                    maxLength={16}
                    value={form.religionOther}
                    onChange={(v) => setText("religionOther", v)}
                  />
                ) : null}
                <div>
                  <FieldLabel>
                    <VT>{"Nature of disability"}</VT>
                  </FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {DISABILITIES.map((item) => (
                      <ChoicePill
                        key={item}
                        active={form.disability.includes(item)}
                        onClick={() => toggleDisability(item)}
                      >
                        {vt(item)}
                      </ChoicePill>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard number={6} title={vt("Present address")}>
              <AddressFields prefix="current" data={form} setText={setText} />
            </SectionCard>

            <SectionCard number={7} title={vt("Permanent address")}>
              <div className="mb-3 rounded-lg border border-[#EEDDBA] bg-[#FFF8DF] px-3 py-2">
                <CheckBox
                  checked={form.permanentSameAsCurrent}
                  label={vt("Same as present address")}
                  onChange={togglePermanentSame}
                />
              </div>
              <AddressFields
                prefix="permanent"
                data={form}
                setText={setText}
                disabled={form.permanentSameAsCurrent}
              />
            </SectionCard>

            <SectionCard number={8} title={vt("Contact and other numbers")}>
              <div className="space-y-3">
                <FieldRow>
                  <TextField
                    label={vt("Mobile number")}
                    placeholder={vt("01783666743")}
                    maxLength={11}
                    inputMode="tel"
                    validate={validateMobile}
                    value={form.mobile}
                    onChange={(v) => setText("mobile", digitString(v, 11))}
                  />
                  <TextField
                    label={vt("Telephone number")}
                    placeholder={vt("01783666743")}
                    maxLength={15}
                    inputMode="tel"
                    validate={validatePhone}
                    value={form.telephone}
                    onChange={(v) => setText("telephone", digitString(v, 15))}
                  />
                </FieldRow>
                <TextField
                  label={vt("TIN")}
                  placeholder={vt("TIN")}
                  maxLength={12}
                  inputMode="numeric"
                  validate={validateTin}
                  value={form.tin}
                  onChange={(v) => setText("tin", digitString(v, 12))}
                />
                <TextField
                  label={vt("Driving licence number")}
                  placeholder={vt("Driving licence number")}
                  maxLength={14}
                  value={form.drivingLicense}
                  onChange={(v) =>
                    setText(
                      "drivingLicense",
                      v.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                    )
                  }
                />
                <TextField
                  label={vt("Passport number")}
                  placeholder={vt("Passport number")}
                  maxLength={14}
                  value={form.passportNumber}
                  onChange={(v) =>
                    setText(
                      "passportNumber",
                      v.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                    )
                  }
                />
              </div>
            </SectionCard>

            <SectionCard
              number={9}
              title={vt("Filled in at the centre")}
              description={vt(
                "Items 36-46 are completed by the registration centre.",
              )}
            >
              <div className="space-y-3">
                <TextField
                  label={vt("Reason for exclusion")}
                  placeholder={vt("Reason for exclusion")}
                  maxLength={80}
                  value={form.exclusionReason}
                  onChange={(v) => setText("exclusionReason", v)}
                />
                <TextField
                  label={vt("Identifier's NID number")}
                  placeholder={vt("10, 13 or 17-digit NID")}
                  maxLength={17}
                  inputMode="numeric"
                  validate={validateNid}
                  value={form.identifierNid}
                  onChange={(v) => setText("identifierNid", digitString(v, 17))}
                />
                <TextField
                  label={vt("Data collector's NID number")}
                  placeholder={vt("10, 13 or 17-digit NID")}
                  maxLength={17}
                  inputMode="numeric"
                  validate={validateNid}
                  value={form.dataCollectorNid}
                  onChange={(v) =>
                    setText("dataCollectorNid", digitString(v, 17))
                  }
                />
              </div>
            </SectionCard>
          </div>

          <div className="lg:sticky lg:top-5">
            <PreviewFrame data={form} hasData={hasData} />
          </div>
        </div>

        <section className="mt-4 rounded-xl border border-[#BFE3CF] bg-[#F6FFF3]/80 p-4">
          <h2 className="border-b border-[#CDE9D8] pb-2 text-[11px] font-bold text-[#2F6B5E]">
            <VT>{"Important notes:\n          "}</VT>
          </h2>
          <p className="mt-3 text-[10px] text-[#4B5563]">
            <VT>{"Bring the following with the form:\n          "}</VT>
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[10px] text-[#374151]">
            <li>
              <VT>{"A photocopy of the birth registration certificate."}</VT>
            </li>
            <li>
              <VT>{"Photocopies of both parents&apos; NIDs."}</VT>
            </li>
            <li>
              <VT>{"Educational certificates, if any."}</VT>
            </li>
            <li>
              <VT>
                {
                  "Proof of the present address \u2014 a utility bill, or a certificate\n              from the chairman or councillor.\n            "
                }
              </VT>
            </li>
          </ul>
          <p className="mt-3 text-[10px] text-[#B4232F]">
            <VT>
              {
                "Fill everything in accurately \u2014 wrong information can get the\n            application rejected.\n          "
              }
            </VT>
          </p>
          <p className="mt-3 text-[10px] text-[#B7791F]">
            <VT>
              {
                "Print the filled form and attend the registration centre for your\n            photo, fingerprints and signature. Keep the registration slip and\n            the receipt.\n          "
              }
            </VT>
          </p>
        </section>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-[#E2E8F0] bg-[#F8FAFC]/95 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur print:hidden">
        <div className="pointer-events-auto mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5">
          <div className="flex items-center gap-2 text-[9px] font-medium text-[#0F172A]">
            <span
              className={cx(
                "h-2 w-2 rounded-full",
                hasData ? "bg-[#10B981]" : "bg-[#94A3B8]",
              )}
            />
            {hasData ? (
              <VT>{"Form complete — download or print it."}</VT>
            ) : (
              <VT>{"Add an input to get started"}</VT>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={!hasData}
              onClick={clearAll}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[10px] font-semibold text-[#0F172A] hover:bg-[#E2E8F0] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <X className="h-3.5 w-3.5" />
              <VT>{"Clear all\n            "}</VT>
            </button>
            <button
              type="button"
              onClick={restoreLast}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-[#E2E8F0] px-3 text-[10px] font-semibold text-[#0F172A] hover:bg-[#CBD5E1]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <VT>{"Restore last form\n            "}</VT>
            </button>
            <button
              type="button"
              disabled={pdfBusy}
              onClick={print}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-[#E2E8F0] px-3 text-[10px] font-semibold text-[#0F172A] hover:bg-[#CBD5E1] disabled:cursor-wait disabled:opacity-60"
            >
              <Printer className="h-3.5 w-3.5" />
              <VT>{"Print\n            "}</VT>
            </button>
            <button
              type="button"
              disabled={pdfBusy}
              onClick={downloadPdf}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#2563EB] px-3.5 text-[10px] font-bold text-white shadow-sm hover:bg-[#1D4ED8] disabled:cursor-wait disabled:opacity-70"
            >
              <FileDown className="h-3.5 w-3.5" />
              {pdfBusy ? <VT>{"Processing..."}</VT> : <VT>{"Download PDF"}</VT>}
            </button>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[min(320px,calc(100vw-2rem))] flex-col gap-2 print:hidden"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cx(
              "pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 shadow-lg",
              toast.kind === "success" && "border-[#BFE3CF] bg-[#F1FBF4]",
              toast.kind === "info" && "border-[#EADFC4] bg-[#FFFBEF]",
              toast.kind === "error" && "border-[#EBB4B9] bg-[#FFF3F3]",
            )}
          >
            {toast.kind === "success" ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3D8B57]" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p
                className={cx(
                  "text-[10px] font-bold",
                  toast.kind === "success"
                    ? "text-[#2F7A4B]"
                    : toast.kind === "error"
                      ? "text-[#B4232F]"
                      : "text-[#4B5563]",
                )}
              >
                {vt(toast.title)}
              </p>
              <p className="mt-0.5 text-[9.5px] leading-4 text-[#5F5A50]">
                {vt(toast.message)}
              </p>
            </div>
            <button
              type="button"
              aria-label={vt("Dismiss")}
              onClick={() => dismissToast(toast.id)}
              className="text-[#9A9284] hover:text-[#4B5563]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {mode ? <PrintRoot data={form} mode={mode} /> : null}
    </div>
  );
}
