"use client";
import { useSebaLagbeToolsI18n } from "@/app/sohoj-tools/_i18n";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  FileDown,
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
import { createPortal, flushSync } from "react-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";

/* -------------------------------------------------------------------------- */
/* Page-specific, hydration-safe English ↔ Bangla translation                */
/* -------------------------------------------------------------------------- */
const SPECIAL_TRANSLATIONS: Record<string, string> = {
  "Seba Lagbe Tools": "সেবা লাগবে টুলস",
  "General Tools": "সাধারণ টুলস",
  "Special Information Form": "বিশেষ তথ্য ফর্ম",
  Free: "বিনামূল্যে",
  "✓ Used": "✓ ব্যবহার হয়েছে",
  time: "বার",
  times: "বার",
  Applicant: "আবেদনকারী",
  "Form-2 number": "ফর্ম-২ নম্বর",
  "Name (in Bangla)": "নাম (বাংলায়)",
  "Father's / husband's name": "পিতা/স্বামীর নাম",
  "Father's / husband's permanent address": "পিতা/স্বামীর স্থায়ী ঠিকানা",
  Guardian: "অভিভাবক",
  "Fill this in only when the parents or husband are no longer living.":
    "বাবা-মা বা স্বামী জীবিত না থাকলে শুধু এই অংশটি পূরণ করুন।",
  "Guardian's name": "অভিভাবকের নাম",
  "Guardian's NID number": "অভিভাবকের NID নম্বর",
  "10, 13 or 17-digit NID": "১০, ১৩ অথবা ১৭ সংখ্যার NID",
  "Relation to guardian": "অভিভাবকের সঙ্গে সম্পর্ক",
  "Guardian's date of birth": "অভিভাবকের জন্মতারিখ",
  "Paternal grandfather": "পিতামহ",
  "Paternal grandfather's name": "পিতামহের নাম",
  "Grandfather's NID number": "পিতামহের NID নম্বর",
  "Grandfather's NID not applicable": "পিতামহের NID প্রযোজ্য নয়",
  "Grandfather's permanent address": "পিতামহের স্থায়ী ঠিকানা",
  "Three NID-holding relatives": "NIDধারী তিনজন আত্মীয়",
  "Brother / sister / uncle / aunt, in that order.":
    "ভাই/বোন/চাচা/ফুফু—এই ক্রমে।",
  "First relative": "প্রথম আত্মীয়",
  "Second relative": "দ্বিতীয় আত্মীয়",
  "Third relative": "তৃতীয় আত্মীয়",
  "Present address": "বর্তমান ঠিকানা",
  "How the present address is held": "বর্তমান ঠিকানার মালিকানা/ব্যবহারের ধরন",
  "Own property": "নিজস্ব মালিকানাধীন",
  Rented: "ভাড়া",
  Other: "অন্যান্য",
  "Owner's name (other)": "অন্য মালিকের নাম",
  "Owner's NID (other)": "অন্য মালিকের NID নম্বর",
  "Applicants born abroad": "বিদেশে জন্মগ্রহণকারী আবেদনকারী",
  "Born outside Bangladesh? Add passport and arrival details.":
    "বাংলাদেশের বাইরে জন্মেছেন? পাসপোর্ট ও দেশে আগমনের তথ্য দিন।",
  "Date of arrival in Bangladesh": "বাংলাদেশে আগমনের তারিখ",
  "Passport issue date": "পাসপোর্ট ইস্যুর তারিখ",
  "Passport issue place": "পাসপোর্ট ইস্যুর স্থান",
  "Passport expiry date": "পাসপোর্টের মেয়াদ শেষ হওয়ার তারিখ",
  "Present occupation": "বর্তমান পেশা",
  "Date joined present occupation": "বর্তমান পেশায় যোগদানের তারিখ",
  "Employer's name": "নিয়োগকর্তার নাম",
  "Employer's address": "নিয়োগকর্তার ঠিকানা",
  "Employer's address (second line)": "নিয়োগকর্তার ঠিকানা (দ্বিতীয় লাইন)",
  "Employer's mobile": "নিয়োগকর্তার মোবাইল নম্বর",
  "Last two institutions": "সর্বশেষ দুটি শিক্ষা প্রতিষ্ঠান",
  "First institution — name and address":
    "প্রথম শিক্ষা প্রতিষ্ঠানের নাম ও ঠিকানা",
  "Second institution — name and address":
    "দ্বিতীয় শিক্ষা প্রতিষ্ঠানের নাম ও ঠিকানা",
  "Study period from (first)": "অধ্যয়নের সময়কাল—শুরু (প্রথম)",
  "Study period to (first)": "অধ্যয়নের সময়কাল—শেষ (প্রথম)",
  "Study period from (second)": "অধ্যয়নের সময়কাল—শুরু (দ্বিতীয়)",
  "Study period to (second)": "অধ্যয়নের সময়কাল—শেষ (দ্বিতীয়)",
  "Qualification earned (first)": "অর্জিত শিক্ষাগত যোগ্যতা (প্রথম)",
  "Qualification earned (second)": "অর্জিত শিক্ষাগত যোগ্যতা (দ্বিতীয়)",
  "Data collector": "তথ্য সংগ্রহকারী",
  "The NID of the person who collected the information.":
    "যে ব্যক্তি তথ্য সংগ্রহ করেছেন, তাঁর NID নম্বর।",
  Preview: "পূর্বরূপ",
  Empty: "খালি",
  "Live preview": "সরাসরি পূর্বরূপ",
  "Zoom out": "ছোট করুন",
  "Zoom in": "বড় করুন",
  "Reset zoom": "জুম পুনরায় সেট করুন",
  "Reset zoom to 100%": "জুম ১০০%-এ পুনরায় সেট করুন",
  "Go to page 1": "১ নম্বর পাতায় যান",
  "Go to page 2": "২ নম্বর পাতায় যান",
  "Page ": "পাতা ",
  "of 2 ": "এর মধ্যে ২টি ",
  "Important notes:": "গুরুত্বপূর্ণ তথ্য:",
  "Attach the following with the form:":
    "ফর্মের সঙ্গে নিচের কাগজপত্র সংযুক্ত করুন:",
  "A photocopy of the land deed, when the address is owned.":
    "ঠিকানাটি নিজস্ব মালিকানাধীন হলে জমির দলিলের একটি ফটোকপি সংযুক্ত করুন।",
  "The landlord's NID and proof of tenancy, for rented or other tenures.":
    "ভাড়া বা অন্যান্য মালিকানা/ব্যবহারের ক্ষেত্রে বাড়ির মালিকের NID এবং ভাড়াটিয়া/দখলের প্রমাণ সংযুক্ত করুন।",
  "A copy of the Home Ministry citizenship certificate, if born abroad.":
    "বিদেশে জন্মগ্রহণ করলে স্বরাষ্ট্র মন্ত্রণালয়ের নাগরিকত্ব সনদের একটি কপি সংযুক্ত করুন।",
  "Photocopies of educational certificates, if any.":
    "শিক্ষাগত সনদপত্র থাকলে সেগুলোর ফটোকপি সংযুক্ত করুন।",
  "Fill everything in accurately — wrong information can get the application rejected.":
    "সব তথ্য সঠিকভাবে পূরণ করুন—ভুল তথ্যের কারণে আবেদন বাতিল হতে পারে।",
  "Print the filled form, sign it, and submit it with Form-2 at your upazila / thana election office.":
    "ফর্মটি পূরণ করে প্রিন্ট করুন, স্বাক্ষর করুন এবং ফর্ম-২-এর সঙ্গে আপনার উপজেলা/থানা নির্বাচন কার্যালয়ে জমা দিন।",
  "Form complete — download or print it.":
    "ফর্ম সম্পূর্ণ হয়েছে—এখন ডাউনলোড অথবা প্রিন্ট করুন।",
  "Add an input to get started": "শুরু করতে একটি তথ্য দিন",
  "Clear all": "সব মুছে ফেলুন",
  "Restore last form": "সর্বশেষ ফর্ম পুনরুদ্ধার করুন",
  Print: "প্রিন্ট করুন",
  "Processing...": "প্রক্রিয়াকরণ চলছে...",
  "Download PDF": "PDF ডাউনলোড করুন",
  "Remove from favorites": "প্রিয় তালিকা থেকে সরান",
  "Add to favorites": "প্রিয় তালিকায় যোগ করুন",
  Share: "শেয়ার করুন",
  Dismiss: "বন্ধ করুন",
  "Open calendar": "ক্যালেন্ডার খুলুন",
  "e.g. 05": "যেমন ০৫",
  "e.g. 1230": "যেমন ১২৩০",
  "e.g. 2010": "যেমন ২০১০",
  "e.g. SSC": "যেমন এসএসসি",
  Mouza: "মৌজা",
  "Post office": "ডাকঘর",
  "Village / mahalla / road": "গ্রাম / মহল্লা / সড়ক",
  "House / holding number": "বাসা / হোল্ডিং নম্বর",
  "City corporation / municipality / union / cantonment board":
    "সিটি কর্পোরেশন / পৌরসভা / ইউনিয়ন / ক্যান্টনমেন্ট বোর্ড",
  "Ward number": "ওয়ার্ড নম্বর",
  "NID must be 10, 13 or 17 digits.":
    "NID অবশ্যই ১০, ১৩ অথবা ১৭ সংখ্যার হতে হবে।",
  "Post code must be 4 digits.": "পোস্ট কোড অবশ্যই ৪ সংখ্যার হতে হবে।",
  "Enter a valid 11-digit mobile number.": "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন।",
  "Enter the full date as DD-MM-YYYY.":
    "তারিখটি DD-MM-YYYY ফরম্যাটে সম্পূর্ণ লিখুন।",
  "This is not a valid date.": "এটি সঠিক তারিখ নয়।",
  Cleared: "মুছে ফেলা হয়েছে",
  "All fields have been reset.": "সব তথ্য নতুন করে খালি করা হয়েছে।",
  "Nothing to restore": "পুনরুদ্ধার করার মতো কিছু নেই",
  "There is no previously saved form on this device.":
    "এই ডিভাইসে আগের কোনো সংরক্ষিত ফর্ম নেই।",
  Restored: "পুনরুদ্ধার করা হয়েছে",
  "Your last form has been loaded.": "আপনার সর্বশেষ ফর্মটি লোড করা হয়েছে।",
  "Link copied": "লিংক কপি হয়েছে",
  "The page link is on your clipboard.":
    "পৃষ্ঠার লিংকটি আপনার ক্লিপবোর্ডে কপি হয়েছে।",
  "Could not share": "শেয়ার করা যায়নি",
  "Sharing is not supported in this browser.":
    "এই ব্রাউজারে শেয়ার করার সুবিধা নেই।",
  "Sharing was blocked by the browser.":
    "ব্রাউজার শেয়ার করা বন্ধ করে দিয়েছে।",
  "PDF ready": "PDF প্রস্তুত",
  "Your 2-page Special Information Form has been downloaded.":
    "আপনার ২ পাতার বিশেষ তথ্য ফর্ম ডাউনলোড হয়েছে।",
  "PDF failed": "PDF তৈরি করা যায়নি",
  "The PDF could not be created. Please try again or use Print → Save as PDF.":
    "PDF তৈরি করা যায়নি। আবার চেষ্টা করুন অথবা প্রিন্ট থেকে ‘PDF হিসেবে সংরক্ষণ’ ব্যবহার করুন।",
  "Printable pages were not found.": "প্রিন্ট করার পাতা পাওয়া যায়নি।",
  "Special Information Form has been downloaded.":
    "বিশেষ তথ্য ফর্ম ডাউনলোড হয়েছে।",
  "Print → Save as PDF": "প্রিন্ট → PDF হিসেবে সংরক্ষণ",
  "Form-2 additional information": "ফর্ম-২-এর অতিরিক্ত তথ্য",
  "Fill in your details on the left — see the live form on the right and download it as PDF.":
    "বাম পাশে আপনার তথ্য পূরণ করুন—ডান পাশে ফর্মের সরাসরি পূর্বরূপ দেখুন এবং PDF হিসেবে ডাউনলোড করুন।",
};

function normalizeSpecialText(value: string) {
  return value.replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
}

function translateSpecialText(
  value: string,
  locale: string | undefined,
): string {
  const raw = value ?? "";
  if (!locale || !String(locale).toLowerCase().startsWith("bn")) return raw;
  const key = normalizeSpecialText(raw);
  if (SPECIAL_TRANSLATIONS[key]) return SPECIAL_TRANSLATIONS[key];

  const residence =
    /^Residence (start|end) date \((rent|rented|other)\)$/i.exec(key);
  if (residence) {
    const action =
      residence[1].toLowerCase() === "start" ? "শুরুর" : "শেষ হওয়ার";
    const mode =
      residence[2].toLowerCase() === "rented" ||
      residence[2].toLowerCase() === "rent"
        ? "ভাড়ায়"
        : "অন্যান্যভাবে";
    return `বাসস্থানে থাকার ${action} তারিখ (${mode})`;
  }

  const addressSuffix =
    /^(Division|District|Upazila \/ thana|City corporation \/ municipality \/ union \/ cantonment board|Mouza|Village \/ mahalla \/ road name and number|House \/ holding number|Post office|Post code) \(([^)]+)\)$/i.exec(
      key,
    );
  if (addressSuffix) {
    const labels: Record<string, string> = {
      Division: "বিভাগ",
      District: "জেলা",
      "Upazila / thana": "উপজেলা / থানা",
      "City corporation / municipality / union / cantonment board":
        "সিটি কর্পোরেশন / পৌরসভা / ইউনিয়ন / ক্যান্টনমেন্ট বোর্ড",
      Mouza: "মৌজা",
      "Village / mahalla / road name and number":
        "গ্রাম / মহল্লা / সড়কের নাম ও নম্বর",
      "House / holding number": "বাসা / হোল্ডিং নম্বর",
      "Post office": "ডাকঘর",
      "Post code": "পোস্ট কোড",
    };
    const suffix: string = translateSpecialText(addressSuffix[2], locale);
    return `${labels[addressSuffix[1]] ?? addressSuffix[1]} (${suffix})`;
  }

  const relative =
    /^(First|Second|Third) relative — (name|NID number|relation|date of birth|mobile)$/i.exec(
      key,
    );
  if (relative) {
    const ord: Record<string, string> = {
      First: "প্রথম",
      Second: "দ্বিতীয়",
      Third: "তৃতীয়",
    };
    const part: Record<string, string> = {
      name: "নাম",
      "NID number": "NID নম্বর",
      relation: "সম্পর্ক",
      "date of birth": "জন্মতারিখ",
      mobile: "মোবাইল নম্বর",
    };
    return `${ord[relative[1]] ?? relative[1]} আত্মীয় — ${part[relative[2]] ?? relative[2]}`;
  }

  const simpleDash = /^(First|Second) institution — name and address$/i.exec(
    key,
  );
  if (simpleDash)
    return `${simpleDash[1] === "First" ? "প্রথম" : "দ্বিতীয়"} শিক্ষা প্রতিষ্ঠানের নাম ও ঠিকানা`;

  return raw;
}

function useSpecialTranslator() {
  const { locale } = useSebaLagbeToolsI18n();
  const tx = useCallback(
    (value: string) => translateSpecialText(value, locale),
    [locale],
  );
  return { locale, tx };
}

function T({ children }: { children: ReactNode }) {
  const { tx } = useSpecialTranslator();
  if (typeof children === "string") return <>{tx(children)}</>;
  return <>{children}</>;
}

/* -------------------------------------------------------------------------- */
/*  State / constants                                                          */
/* -------------------------------------------------------------------------- */
type SpecialInformationFormState = {
  form2Number: string;
  nameBn: string;
  fatherHusbandName: string;
  fatherAddressDivision: string;
  fatherAddressDistrict: string;
  fatherAddressUpazila: string;
  fatherAddressWard: string;
  fatherAddressCity: string;
  fatherAddressMouza: string;
  fatherAddressVillage: string;
  fatherAddressHouse: string;
  fatherAddressPostOffice: string;
  fatherAddressPostCode: string;
  guardianName: string;
  guardianNid: string;
  guardianRelation: string;
  guardianDob: string;
  grandfatherName: string;
  grandfatherNid: string;
  grandfatherNidNotApplicable: boolean;
  grandfatherAddressDivision: string;
  grandfatherAddressDistrict: string;
  grandfatherAddressUpazila: string;
  grandfatherAddressWard: string;
  grandfatherAddressCity: string;
  grandfatherAddressMouza: string;
  grandfatherAddressVillage: string;
  grandfatherAddressHouse: string;
  grandfatherAddressPostOffice: string;
  grandfatherAddressPostCode: string;
  firstRelativeName: string;
  firstRelativeNid: string;
  firstRelativeRelation: string;
  firstRelativeDob: string;
  firstRelativeMobile: string;
  secondRelativeName: string;
  secondRelativeNid: string;
  secondRelativeRelation: string;
  secondRelativeDob: string;
  secondRelativeMobile: string;
  thirdRelativeName: string;
  thirdRelativeNid: string;
  thirdRelativeRelation: string;
  thirdRelativeDob: string;
  thirdRelativeMobile: string;
  presentHoldingType: "Own property" | "Rented" | "Other" | "";
  ownerOtherName: string;
  ownerOtherNid: string;
  residenceStartDate: string;
  residenceEndDate: string;
  abroadArrivalDate: string;
  passportIssueDate: string;
  passportIssuePlace: string;
  passportExpiryDate: string;
  occupationJoinDate: string;
  employerName: string;
  employerAddress: string;
  employerAddress2: string;
  employerMobile: string;
  firstInstitutionNameAddress: string;
  firstStudyFrom: string;
  firstStudyTo: string;
  firstQualification: string;
  secondInstitutionNameAddress: string;
  secondStudyFrom: string;
  secondStudyTo: string;
  secondQualification: string;
  dataCollectorNid: string;
};
type FormKey = keyof SpecialInformationFormState;
type StringKey = {
  [K in FormKey]: SpecialInformationFormState[K] extends string ? K : never;
}[FormKey];
type ToastKind = "success" | "info" | "error";
type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  message: string;
};
type RenderMode = "print" | "pdf" | null;
const STORAGE_KEY = "sohoj-special-information-form";
const LAST_KEY = "sohoj-special-information-form-last";
const FAVORITE_KEY = "sohoj-special-information-form-favorite";
const USED_KEY = "sohoj-special-information-form-used";
const FONT_LINK_ID = "special-information-bengali-fonts";
const EMPTY_FORM: SpecialInformationFormState = {
  form2Number: "",
  nameBn: "",
  fatherHusbandName: "",
  fatherAddressDivision: "",
  fatherAddressDistrict: "",
  fatherAddressUpazila: "",
  fatherAddressWard: "",
  fatherAddressCity: "",
  fatherAddressMouza: "",
  fatherAddressVillage: "",
  fatherAddressHouse: "",
  fatherAddressPostOffice: "",
  fatherAddressPostCode: "",
  guardianName: "",
  guardianNid: "",
  guardianRelation: "",
  guardianDob: "",
  grandfatherName: "",
  grandfatherNid: "",
  grandfatherNidNotApplicable: false,
  grandfatherAddressDivision: "",
  grandfatherAddressDistrict: "",
  grandfatherAddressUpazila: "",
  grandfatherAddressWard: "",
  grandfatherAddressCity: "",
  grandfatherAddressMouza: "",
  grandfatherAddressVillage: "",
  grandfatherAddressHouse: "",
  grandfatherAddressPostOffice: "",
  grandfatherAddressPostCode: "",
  firstRelativeName: "",
  firstRelativeNid: "",
  firstRelativeRelation: "",
  firstRelativeDob: "",
  firstRelativeMobile: "",
  secondRelativeName: "",
  secondRelativeNid: "",
  secondRelativeRelation: "",
  secondRelativeDob: "",
  secondRelativeMobile: "",
  thirdRelativeName: "",
  thirdRelativeNid: "",
  thirdRelativeRelation: "",
  thirdRelativeDob: "",
  thirdRelativeMobile: "",
  presentHoldingType: "",
  ownerOtherName: "",
  ownerOtherNid: "",
  residenceStartDate: "",
  residenceEndDate: "",
  abroadArrivalDate: "",
  passportIssueDate: "",
  passportIssuePlace: "",
  passportExpiryDate: "",
  occupationJoinDate: "",
  employerName: "",
  employerAddress: "",
  employerAddress2: "",
  employerMobile: "",
  firstInstitutionNameAddress: "",
  firstStudyFrom: "",
  firstStudyTo: "",
  firstQualification: "",
  secondInstitutionNameAddress: "",
  secondStudyFrom: "",
  secondStudyTo: "",
  secondQualification: "",
  dataCollectorNid: "",
};
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
const HOLDING_OPTIONS = ["Own property", "Rented", "Other"] as const;
/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
function toAsciiDigits(value: string) {
  return value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}
function digitString(value: string, max = 17) {
  return toAsciiDigits(value).replace(/\D/g, "").slice(0, max);
}
function formatDateInput(raw: string) {
  const d = digitString(raw, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
}
function parseDateValue(value: string): Date | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}
function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function dateToIso(value: string) {
  const date = parseDateValue(value);
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function isFormEmpty(form: SpecialInformationFormState) {
  return (Object.keys(EMPTY_FORM) as FormKey[]).every((key) => {
    const value = form[key];
    if (typeof value === "boolean") return value === false;
    return String(value ?? "").trim() === "";
  });
}
function sanitizeForm(raw: unknown): SpecialInformationFormState {
  const result: SpecialInformationFormState = { ...EMPTY_FORM };
  if (!raw || typeof raw !== "object") return result;
  const source = raw as Record<string, unknown>;
  const target = result as unknown as Record<string, unknown>;
  (Object.keys(EMPTY_FORM) as FormKey[]).forEach((key) => {
    const fallback = EMPTY_FORM[key];
    const value = source[key];
    if (typeof fallback === "boolean") {
      target[key] = typeof value === "boolean" ? value : false;
    } else {
      target[key] = typeof value === "string" ? value : fallback;
    }
  });
  if (
    !(HOLDING_OPTIONS as readonly string[]).includes(result.presentHoldingType)
  ) {
    result.presentHoldingType = "";
  }
  return result;
}
function safeReadJson(key: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? sanitizeForm(JSON.parse(raw)) : null;
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
const validateNid = (v: string) =>
  v && ![10, 13, 17].includes(v.length)
    ? "NID must be 10, 13 or 17 digits."
    : "";
const validatePostCode = (v: string) =>
  v && v.length !== 4 ? "Post code must be 4 digits." : "";
const validateMobile = (v: string) =>
  v && !/^01[3-9]\d{8}$/.test(v) ? "Enter a valid 11-digit mobile number." : "";
const validateDate = (v: string) => {
  if (!v) return "";
  if (v.length < 10) return "Enter the full date as DD-MM-YYYY.";
  if (!parseDateValue(v)) return "This is not a valid date.";
  return "";
};
const PAPER_W = 478;
const PAPER_H = 676;
const INK = "#0F172A";
const PAPER = "#FFFFFF";
const FORM_FONT =
  '"SolaimanLipi","Kalpurush","Noto Serif Bengali","Noto Sans Bengali","Nirmala UI","Vrinda","Siyam Rupali",serif';
async function waitForFonts() {
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
    // Fallback fonts are fine.
  }
  await nextFrames(2);
}
/* -------------------------------------------------------------------------- */
/*  Left UI building blocks                                                    */
/* -------------------------------------------------------------------------- */
function FieldLabel({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  const { tx } = useSpecialTranslator();
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2 text-[15px] font-semibold text-[#3B2F1E]">
      <span>{typeof children === "string" ? tx(children) : children}</span>
      {hint ? (
        <span className="font-normal text-[14px] text-[#7A6A50]">
          {tx(hint)}
        </span>
      ) : null}
    </div>
  );
}
const INPUT_CLASS =
  "h-10 w-full rounded-xl border bg-[#FBF6E8] px-3 text-[17px] text-[#3B2F1E] outline-none transition placeholder:text-[#B0A080] focus:bg-[#FBF6E8] focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50";
const INPUT_OK = "border-[#E3D6B8] focus:border-[#DC2626] focus:ring-[#DC2626]/20";
const INPUT_BAD =
  "border-[#FCA5A5] focus:border-[#DC2626] focus:ring-[#FECACA]";
function FieldError({ message }: { message: string }) {
  const { tx } = useSpecialTranslator();
  return (
    <p role="alert" className="mt-1 text-[13.5px] leading-5 text-[#B91C1C]">
      {tx(message)}
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
  const { tx } = useSpecialTranslator();
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
        placeholder={placeholder ? tx(placeholder) : placeholder}
        disabled={disabled}
        inputMode={inputMode}
        list={list}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={showError}
        onBlur={() => setTouched(true)}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        className={cx(INPUT_CLASS, showError ? INPUT_BAD : INPUT_OK)}
      />
      {showError ? <FieldError message={message} /> : null}
    </label>
  );
}
function DateField({
  label,
  value,
  placeholder = "01-01-1990",
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const { tx } = useSpecialTranslator();
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const [touched, setTouched] = useState(false);
  const message = validateDate(value);
  const showError = Boolean(message) && (touched || value.length === 10);
  const openPicker = () => {
    const el = pickerRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
        return;
      }
    } catch {}
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
          aria-label={tx("Open calendar")}
          className="absolute left-2 top-2 z-10 text-[#B0A080] hover:text-[#DC2626]"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
        <input
          type="text"
          value={value}
          placeholder={tx(placeholder)}
          inputMode="numeric"
          maxLength={10}
          autoComplete="off"
          aria-label={tx(label)}
          aria-invalid={showError}
          onBlur={() => setTouched(true)}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange(formatDateInput(event.target.value))
          }
          className={cx(INPUT_CLASS, "pl-8", showError ? INPUT_BAD : INPUT_OK)}
        />
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          min="1900-01-01"
          max={todayIso()}
          value={dateToIso(value)}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
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
  const { tx } = useSpecialTranslator();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "rounded-xl border px-3 py-2 text-[15px] font-medium transition",
        active
          ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C] ring-2 ring-[#DC2626]/40"
          : "border-[#D8C9A6] bg-[#FBF6E8]/60 text-[#5A4A32] hover:border-[#B0A080] hover:bg-[#EFE3C8]",
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
  const { tx } = useSpecialTranslator();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-left text-[15px] text-[#5A4A32]"
    >
      <span
        className={cx(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border bg-[#FBF6E8] transition",
          checked ? "border-[#DC2626] bg-[#F6D9A8]" : "border-[#D8C9A6]",
        )}
      >
        {checked ? <Check className="h-3 w-3 text-[#DC2626]" /> : null}
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
  const { tx } = useSpecialTranslator();
  return (
    <section className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-[16px] font-bold text-[#DC2626]">
          {number}
          <T>{". "}</T>
          {tx(title)}
        </h2>
        {description ? (
          <p className="mt-1 text-[13.5px] leading-5 text-[#5A4A32]">
            {tx(description)}
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
function AddressInputs({
  prefix,
  form,
  setText,
}: {
  prefix: "fatherAddress" | "grandfatherAddress";
  form: SpecialInformationFormState;
  setText: (key: StringKey, value: string) => void;
}) {
  const { tx } = useSpecialTranslator();
  const label =
    prefix === "fatherAddress" ? "father's address" : "grandfather's address";
  const key = (name: string) => `${prefix}${name}` as StringKey;
  const get = (name: string) => String(form[key(name)] ?? "");
  return (
    <div className="space-y-3">
      <FieldRow>
        <TextField
          label={`Division (${label})`}
          placeholder={`Division (${label})`}
          maxLength={30}
          list="special-district-list"
          value={get("Division")}
          onChange={(v) => setText(key("Division"), v)}
        />
        <TextField
          label={`District (${label})`}
          placeholder={`District (${label})`}
          maxLength={30}
          list="special-district-list"
          value={get("District")}
          onChange={(v) => setText(key("District"), v)}
        />
      </FieldRow>
      <FieldRow>
        <TextField
          label={`Upazila / thana (${label})`}
          placeholder={`Upazila / thana (${label})`}
          maxLength={30}
          value={get("Upazila")}
          onChange={(v) => setText(key("Upazila"), v)}
        />
        <TextField
          label="Ward number"
          placeholder={tx("e.g. 05")}
          maxLength={2}
          inputMode="numeric"
          value={get("Ward")}
          onChange={(v) => setText(key("Ward"), digitString(v, 2))}
        />
      </FieldRow>
      <TextField
        label={`City corporation / municipality / union / cantonment board (${label})`}
        placeholder={tx(
          "City corporation / municipality / union / cantonment board",
        )}
        maxLength={70}
        value={get("City")}
        onChange={(v) => setText(key("City"), v)}
      />
      <FieldRow>
        <TextField
          label={`Mouza (${label})`}
          placeholder={tx("Mouza")}
          maxLength={40}
          value={get("Mouza")}
          onChange={(v) => setText(key("Mouza"), v)}
        />
        <TextField
          label={`Village / mahalla / road name and number (${label})`}
          placeholder={tx("Village / mahalla / road")}
          maxLength={60}
          value={get("Village")}
          onChange={(v) => setText(key("Village"), v)}
        />
      </FieldRow>
      <FieldRow>
        <TextField
          label={`House / holding number (${label})`}
          placeholder={tx("House / holding number")}
          maxLength={30}
          value={get("House")}
          onChange={(v) => setText(key("House"), v)}
        />
        <TextField
          label={`Post office (${label})`}
          placeholder={tx("Post office")}
          maxLength={30}
          value={get("PostOffice")}
          onChange={(v) => setText(key("PostOffice"), v)}
        />
      </FieldRow>
      <TextField
        label={`Post code (${label})`}
        placeholder={tx("e.g. 1230")}
        maxLength={4}
        inputMode="numeric"
        validate={validatePostCode}
        value={get("PostCode")}
        onChange={(v) => setText(key("PostCode"), digitString(v, 4))}
      />
    </div>
  );
}
function RelativeInputs({
  title,
  prefix,
  form,
  setText,
}: {
  title: string;
  prefix: "first" | "second" | "third";
  form: SpecialInformationFormState;
  setText: (key: StringKey, value: string) => void;
}) {
  const { tx } = useSpecialTranslator();
  const key = (name: string) => `${prefix}Relative${name}` as StringKey;
  const get = (name: string) => String(form[key(name)] ?? "");
  return (
    <div className="space-y-3">
      <p className="text-[14px] font-semibold text-[#5A4A32]">
        <T>{title}</T>
      </p>
      <TextField
        label={`${title} — name`}
        placeholder={`${title} — name`}
        maxLength={60}
        value={get("Name")}
        onChange={(v) => setText(key("Name"), v)}
      />
      <FieldRow>
        <TextField
          label={`${title} — NID number`}
          placeholder={tx("10, 13 or 17-digit NID")}
          maxLength={17}
          inputMode="numeric"
          validate={validateNid}
          value={get("Nid")}
          onChange={(v) => setText(key("Nid"), digitString(v, 17))}
        />
        <TextField
          label={`${title} — relation`}
          placeholder={`${title} — relation`}
          maxLength={30}
          value={get("Relation")}
          onChange={(v) => setText(key("Relation"), v)}
        />
      </FieldRow>
      <FieldRow>
        <DateField
          label={`${title} — date of birth`}
          value={get("Dob")}
          onChange={(v) => setText(key("Dob"), v)}
        />
        <TextField
          label={`${title} — mobile`}
          placeholder={tx("01783666743")}
          maxLength={11}
          inputMode="tel"
          validate={validateMobile}
          value={get("Mobile")}
          onChange={(v) => setText(key("Mobile"), digitString(v, 11))}
        />
      </FieldRow>
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/*  Paper layout                                                                */
/* -------------------------------------------------------------------------- */
let measureCtx: CanvasRenderingContext2D | null | undefined;
const measureCache = new Map<string, number>();
function measureBold(text: string, size: number) {
  const key = `${text}|${size}`;
  let measured = measureCache.get(key);
  if (measured === undefined) {
    if (measureCtx === undefined) {
      measureCtx =
        typeof document !== "undefined"
          ? document.createElement("canvas").getContext("2d")
          : null;
    }
    if (measureCtx) {
      measureCtx.font = `700 ${size * 100}px ${FORM_FONT}`;
      measured = Math.max(measureCtx.measureText(text).width / 100, 0.01);
    } else {
      measured = Math.max(Array.from(text).length * size * 0.62, 0.01);
    }
    measureCache.set(key, measured);
  }
  return measured;
}
function fitSize(text: string, width: number, base: number, min = 0.45 * base) {
  if (!text) return base;
  const safeWidth = Math.max(width, 1);
  const measured = measureBold(text, base);
  if (measured <= safeWidth) return base;
  return Math.max(min, base * (safeWidth / measured));
}
const PAPER_CONTENT_WIDTH = PAPER_W - 70;
function PaperValue({
  text,
  width,
  size = 7.2,
  align = "left",
}: {
  text: string;
  width: number;
  size?: number;
  align?: "left" | "center" | "right";
}) {
  const value = text.trim();
  const fontSize = fitSize(value, Math.max(width - 4, 1), size);
  return (
    <span
      style={{
        display: "block",
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "clip",
        textAlign: align,
        fontSize: `${fontSize}em`,
        fontWeight: 700,
        lineHeight: 1.1,
        padding: "0 2em 0.25em",
        boxSizing: "border-box",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </span>
  );
}
function PaperLine({
  label,
  value = "",
  labelSize = 7.2,
  valueSize = 7.2,
  height = 16.5,
  gap = 3,
}: {
  label: string;
  value?: string;
  labelSize?: number;
  valueSize?: number;
  height?: number;
  gap?: number;
}) {
  const labelWidth = label ? measureBold(label, labelSize) : 0;
  const valueWidth = Math.max(PAPER_CONTENT_WIDTH - labelWidth - gap, 1);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "max-content minmax(0, 1fr)",
        alignItems: "end",
        columnGap: `${gap}em`,
        height: `${height}em`,
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          minWidth: 0,
          whiteSpace: "nowrap",
          fontSize: `${labelSize}em`,
          lineHeight: 1.1,
        }}
      >
        {label}
      </span>

      <div
        style={{
          minWidth: 0,
          width: "100%",
          overflow: "hidden",
          borderBottom: `0.8px dotted ${INK}`,
          boxSizing: "border-box",
        }}
      >
        <PaperValue text={value} width={valueWidth} size={valueSize} />
      </div>
    </div>
  );
}
function PaperInlineFields({
  columns,
  height = 16.5,
}: {
  columns: Array<
    | {
        type: "label";
        text: string;
        size?: number;
      }
    | {
        type: "value";
        text: string;
        width?: number;
        size?: number;
      }
  >;
  height?: number;
}) {
  const template = columns
    .map((column) =>
      column.type === "label"
        ? "max-content"
        : column.width
          ? `minmax(0, ${column.width}em)`
          : "minmax(0, 1fr)",
    )
    .join(" ");
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: template,
        alignItems: "end",
        columnGap: "3em",
        height: `${height}em`,
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {columns.map((column, index) => {
        if (column.type === "label") {
          return (
            <span
              key={`${column.text}-${index}`}
              style={{
                whiteSpace: "nowrap",
                fontSize: `${column.size ?? 7}em`,
                lineHeight: 1.1,
              }}
            >
              {<T>{column.text}</T>}
            </span>
          );
        }
        return (
          <div
            key={`value-${index}`}
            style={{
              minWidth: 0,
              width: "100%",
              overflow: "hidden",
              borderBottom: `0.8px dotted ${INK}`,
              boxSizing: "border-box",
            }}
          >
            <PaperValue
              text={column.text}
              width={column.width ?? 100}
              size={column.size ?? 7}
            />
          </div>
        );
      })}
    </div>
  );
}
function PaperBoxes({
  value = "",
  count,
  width,
  height = 12.5,
  fontSize = 8.1,
}: {
  value?: string;
  count: number;
  width?: number;
  height?: number;
  fontSize?: number;
}) {
  const chars = Array.from(value).slice(0, count);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
        width: width ? `${width}em` : "100%",
        maxWidth: "100%",
        height: `${height}em`,
        minWidth: 0,
        border: `0.8px solid ${INK}`,
        boxSizing: "border-box",
        overflow: "hidden",
        background: PAPER,
      }}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 0,
            overflow: "hidden",
            borderLeft: index === 0 ? undefined : `0.8px solid ${INK}`,
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              display: "block",
              maxWidth: "100%",
              overflow: "hidden",
              whiteSpace: "nowrap",
              fontSize: `${fontSize}em`,
              fontWeight: 700,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {chars[index] ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}
function PaperWideField({
  text,
  width = 112,
  height = 12,
  fontSize = 7,
}: {
  text: string;
  width?: number;
  height?: number;
  fontSize?: number;
}) {
  const value = text.trim();
  const size = fitSize(value, Math.max(width - 6, 1), fontSize);
  return (
    <div
      style={{
        width: `${width}em`,
        maxWidth: "100%",
        height: `${height}em`,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        padding: "0 3em",
        border: `0.8px solid ${INK}`,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          display: "block",
          minWidth: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "clip",
          fontSize: `${size}em`,
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
    </div>
  );
}
function PaperCheckBox({
  checked,
  label,
}: {
  checked: boolean;
  label: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4em",
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden
        style={{
          width: "13em",
          height: "13em",
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `0.8px solid ${INK}`,
          boxSizing: "border-box",
        }}
      >
        {checked ? (
          <span
            style={{
              fontSize: "10em",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            <T>{"\u2713\n          "}</T>
          </span>
        ) : null}
      </span>

      <span
        style={{
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "clip",
          fontSize: "6.6em",
          lineHeight: 1.1,
        }}
      >
        {label}
      </span>
    </div>
  );
}
function PaperBoxField({
  label,
  value,
  count,
  width,
  labelSize = 7,
  boxFontSize = 8,
  height = 16.5,
  trailing,
}: {
  label: string;
  value: string;
  count: number;
  width: number;
  labelSize?: number;
  boxFontSize?: number;
  height?: number;
  trailing?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `max-content minmax(0, ${width}em) minmax(0, 1fr)`,
        alignItems: "center",
        columnGap: "3em",
        height: `${height}em`,
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          whiteSpace: "nowrap",
          fontSize: `${labelSize}em`,
          lineHeight: 1.1,
        }}
      >
        {label}
      </span>

      <PaperBoxes
        value={value}
        count={count}
        width={width}
        height={12.5}
        fontSize={boxFontSize}
      />

      <div
        style={{
          minWidth: 0,
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {trailing}
      </div>
    </div>
  );
}
function PaperDateRow({
  label,
  value,
  width = 66,
  labelSize = 7.0,
  boxFontSize = 8,
  height = 16.5,
}: {
  label: string;
  value: string;
  width?: number;
  labelSize?: number;
  boxFontSize?: number;
  height?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `max-content minmax(0, ${width}em)`,
        alignItems: "center",
        columnGap: "3em",
        height: `${height}em`,
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          whiteSpace: "nowrap",
          fontSize: `${labelSize}em`,
          lineHeight: 1.1,
        }}
      >
        {label}
      </span>
      <PaperBoxes
        value={digitString(value, 8)}
        count={8}
        width={width}
        height={12}
        fontSize={boxFontSize}
      />
    </div>
  );
}
function PaperSpacer({ height }: { height: number }) {
  return <div aria-hidden style={{ height: `${height}em` }} />;
}
function PaperSignatureLine({
  label,
  width = 110,
  align = "left",
}: {
  label: string;
  width?: number;
  align?: "left" | "center";
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: `${width}em`,
        maxWidth: "100%",
        gap: "4em",
        alignItems: align === "center" ? "center" : "flex-start",
      }}
    >
      <div
        style={{
          width: "100%",
          minHeight: "10em",
          borderBottom: `0.8px dotted ${INK}`,
        }}
      />
      <span
        style={{
          fontSize: "6.6em",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}
function AddressPaperBlock({
  title,
  data,
  prefix,
}: {
  title: string;
  data: SpecialInformationFormState;
  prefix: "fatherAddress" | "grandfatherAddress";
}) {
  const get = (name: string) =>
    String(data[`${prefix}${name}` as FormKey] ?? "").trim();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <PaperInlineFields
        height={16.5}
        columns={[
          { type: "label", text: `${title} বিভাগঃ`, size: 7.2 },
          { type: "value", text: get("Division"), width: 60, size: 7 },
          { type: "label", text: "জেলাঃ", size: 7.2 },
          { type: "value", text: get("District"), width: 63, size: 7 },
          { type: "label", text: "উপজেলা/থানাঃ", size: 7.2 },
          { type: "value", text: get("Upazila"), size: 7 },
        ]}
      />

      <PaperInlineFields
        height={16.5}
        columns={[
          {
            type: "label",
            text: "সিটি কর্পোরেশন/পৌরসভা/ইউনিয়ন/ক্যান্টঃ বোর্ডঃ",
            size: 6.5,
          },
          { type: "value", text: get("City"), width: 166, size: 6.8 },
          { type: "label", text: "ওয়ার্ড নম্বরঃ", size: 6.8 },
          {
            type: "value",
            text: digitString(get("Ward"), 2),
            width: 45,
            size: 8,
          },
        ]}
      />

      <PaperInlineFields
        height={16.5}
        columns={[
          { type: "label", text: "মৌজাঃ", size: 6.9 },
          { type: "value", text: get("Mouza"), width: 118, size: 6.9 },
          {
            type: "label",
            text: "গ্রাম/মহল্লা/রাস্তার নাম ও নম্বরঃ",
            size: 6.5,
          },
          { type: "value", text: get("Village"), size: 6.8 },
        ]}
      />

      <PaperInlineFields
        height={16.5}
        columns={[
          { type: "label", text: "বাসা/হোল্ডিং নংঃ", size: 6.8 },
          { type: "value", text: get("House"), width: 86, size: 6.8 },
          { type: "label", text: "ডাকঘরঃ", size: 6.8 },
          { type: "value", text: get("PostOffice"), width: 95, size: 6.8 },
          { type: "label", text: "পোস্ট কোডঃ", size: 6.8 },
          {
            type: "value",
            text: digitString(get("PostCode"), 4),
            width: 81,
            size: 8.1,
          },
        ]}
      />
    </div>
  );
}
function PageHeader({ form2Number }: { form2Number: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "35em",
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          textAlign: "center",
          fontSize: "7.7em",
          fontWeight: 700,
          lineHeight: 1.35,
          whiteSpace: "nowrap",
        }}
      >
        <T>
          {
            "\u0986\u09AC\u09C7\u09A6\u09A8\u0995\u09BE\u09B0\u09C0\u09B0 \u09AC\u09BF\u09B6\u09C7\u09B7 \u09A4\u09A5\u09CD\u09AF \u09AB\u09B0\u09AE (\u09AB\u09B0\u09AE-\u09E8 \u098F\u09B0 \u0985\u09A4\u09BF\u09B0\u09BF\u0995\u09CD\u09A4 \u09A4\u09A5\u09CD\u09AF)\n      "
          }
        </T>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "4em",
          minWidth: 0,
          marginTop: "5em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "7.2em", whiteSpace: "nowrap" }}>
          <T>
            {
              "\u09AB\u09B0\u09AE-\u09E8 \u098F\u09B0 \u09A8\u09AE\u09CD\u09AC\u09B0\u0983\n        "
            }
          </T>
        </span>
        <PaperWideField
          text={form2Number}
          width={112}
          height={12}
          fontSize={6.8}
        />
      </div>
    </div>
  );
}
function RelativePaperBlock({
  keyLabel,
  relative,
}: {
  keyLabel: string;
  relative: {
    name: string;
    nid: string;
    relation: string;
    dob: string;
    mobile: string;
  };
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <PaperLine
        label={`(${keyLabel}) নামঃ`}
        value={relative.name}
        labelSize={7}
        valueSize={7}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "max-content minmax(0, 1fr) max-content minmax(0, 60em)",
          alignItems: "center",
          columnGap: "3em",
          height: "16.5em",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <span style={{ whiteSpace: "nowrap", fontSize: "6.6em" }}>
          <T>{"NID \u09A8\u09AE\u09CD\u09AC\u09B0\u0983\n        "}</T>
        </span>
        <PaperBoxes
          value={digitString(relative.nid, 17)}
          count={17}
          height={12}
          fontSize={7.9}
        />
        <span style={{ whiteSpace: "nowrap", fontSize: "6.6em" }}>
          <T>{"\u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u0983\n        "}</T>
        </span>
        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
            borderBottom: `0.8px dotted ${INK}`,
          }}
        >
          <PaperValue text={relative.relation} width={60} size={7} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 85em max-content minmax(0, 1fr)",
          alignItems: "center",
          columnGap: "3em",
          height: "16.5em",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <span style={{ whiteSpace: "nowrap", fontSize: "6.5em" }}>
          <T>
            {
              "\u099C\u09A8\u09CD\u09AE \u09A4\u09BE\u09B0\u09BF\u0996\u0983\n        "
            }
          </T>
        </span>
        <PaperBoxes
          value={relative.dob}
          count={8}
          width={85}
          height={12}
          fontSize={7.9}
        />
        <span style={{ whiteSpace: "nowrap", fontSize: "6.5em" }}>
          <T>
            {
              "\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 (\u09AC\u09CD\u09AF\u0995\u09CD\u09A4\u09BF\u09B0 \u09A8\u09BE\u09AE\u09C7\u0983)\n        "
            }
          </T>
        </span>
        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
            borderBottom: `0.8px dotted ${INK}`,
          }}
        >
          <PaperValue text={relative.mobile} width={150} size={7} />
        </div>
      </div>
    </div>
  );
}
function SpecialPage1({ d }: { d: SpecialInformationFormState }) {
  const relatives = [
    {
      keyLabel: "ক",
      name: d.firstRelativeName.trim(),
      nid: d.firstRelativeNid,
      relation: d.firstRelativeRelation.trim(),
      dob: String(d.firstRelativeDob ?? "").replace(/\D/g, ""),
      mobile: d.firstRelativeMobile.trim(),
    },
    {
      keyLabel: "খ",
      name: d.secondRelativeName.trim(),
      nid: d.secondRelativeNid,
      relation: d.secondRelativeRelation.trim(),
      dob: String(d.secondRelativeDob ?? "").replace(/\D/g, ""),
      mobile: d.secondRelativeMobile.trim(),
    },
    {
      keyLabel: "গ",
      name: d.thirdRelativeName.trim(),
      nid: d.thirdRelativeNid,
      relation: d.thirdRelativeRelation.trim(),
      dob: String(d.thirdRelativeDob ?? "").replace(/\D/g, ""),
      mobile: d.thirdRelativeMobile.trim(),
    },
  ];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "10em 35em 10em",
      }}
    >
      <PageHeader form2Number={d.form2Number} />
      <PaperSpacer height={25} />

      <PaperLine
        label="১। নাম (বাংলায়):"
        value={d.nameBn}
        labelSize={7.7}
        valueSize={8}
      />
      <PaperLine
        label="২। পিতা/স্বামীর নাম:"
        value={d.fatherHusbandName}
        labelSize={7.7}
        valueSize={8}
      />

      <PaperSpacer height={2} />
      <AddressPaperBlock
        title="৩। পিতা/স্বামীর স্থায়ী ঠিকানা:"
        data={d}
        prefix="fatherAddress"
      />

      <PaperSpacer height={1.5} />
      <PaperLine
        label="৪। পিতা/স্বামী/মাতা জীবিত না থাকিলে অভিভাবকের তথ্য দিন: অভিভাবকের নামঃ"
        value={d.guardianName}
        labelSize={7.2}
        valueSize={7.4}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "max-content minmax(0, 247em) max-content minmax(0, 64em)",
          alignItems: "center",
          columnGap: "3em",
          height: "16.5em",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <span style={{ whiteSpace: "nowrap", fontSize: "7.1em" }}>
          <T>{"NID \u09A8\u09AE\u09CD\u09AC\u09B0\u0983\n        "}</T>
        </span>
        <PaperBoxes
          value={digitString(d.guardianNid, 17)}
          count={17}
          width={247}
          height={12.5}
          fontSize={8.2}
        />
        <span style={{ whiteSpace: "nowrap", fontSize: "7em" }}>
          <T>{"\u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u0983"}</T>
        </span>
        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
            borderBottom: `0.8px dotted ${INK}`,
          }}
        >
          <PaperValue text={d.guardianRelation} width={64} size={7.5} />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 66em",
          alignItems: "center",
          gap: "3em",
          height: "16.5em",
        }}
      >
        <span style={{ whiteSpace: "nowrap", fontSize: "7.1em" }}>
          <T>
            {
              "\u099C\u09A8\u09CD\u09AE \u09A4\u09BE\u09B0\u09BF\u0996\u0983\n        "
            }
          </T>
        </span>
        <PaperBoxes
          value={digitString(d.guardianDob.replace(/\D/g, ""), 8)}
          count={8}
          width={66}
          height={12}
          fontSize={8.1}
        />
      </div>

      <PaperSpacer height={5} />
      <PaperLine
        label="৫। পিতামহের নামঃ"
        value={d.grandfatherName}
        labelSize={7.5}
        valueSize={7.8}
      />

      <PaperBoxField
        label="৬। পিতামহের NID নম্বরঃ"
        value={
          d.grandfatherNidNotApplicable ? "" : digitString(d.grandfatherNid, 17)
        }
        count={17}
        width={238}
        labelSize={7.5}
        boxFontSize={8.1}
        trailing={
          <PaperCheckBox
            checked={d.grandfatherNidNotApplicable}
            label="প্রযোজ্য নয়ঃ"
          />
        }
      />

      <PaperSpacer height={2} />
      <AddressPaperBlock
        title="৭। পিতামহের স্থায়ী ঠিকানা:"
        data={d}
        prefix="grandfatherAddress"
      />

      <PaperSpacer height={2.5} />
      <div style={{ fontSize: "6.9em", lineHeight: 1.2 }}>
        <T>
          {
            "\u09EE\u0964 \u099C\u09BE\u09A4\u09C0\u09AF\u09BC \u09AA\u09B0\u09BF\u099A\u09AF\u09BC\u09AA\u09A4\u09CD\u09B0 \u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4 \u0986\u09AA\u09A8 \u09A4\u09BF\u09A8 \u099C\u09A8\u09C7\u09B0 (\u09AD\u09BE\u0987/\u09AC\u09CB\u09A8/\u099A\u09BE\u099A\u09BE/\u09AB\u09C1\u09AB\u09C1 \u098F\u0987\n        \u0995\u09CD\u09B0\u09AE\u09BE\u09A8\u09C1\u09B8\u09BE\u09B0\u09C7) \u09AC\u09BF\u09AC\u09B0\u09A3 \u09A6\u09BF\u09A8\u0983\n      "
          }
        </T>
      </div>
      <PaperSpacer height={1.5} />

      {relatives.map((relative) => (
        <RelativePaperBlock
          key={relative.keyLabel}
          keyLabel={relative.keyLabel}
          relative={relative}
        />
      ))}

      <PaperSpacer height={3} />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12em",
          minHeight: "18em",
          overflow: "hidden",
        }}
      >
        <span style={{ whiteSpace: "nowrap", fontSize: "7.2em" }}>
          <T>
            {
              "\u09EF\u0964 \u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u09A0\u09BF\u0995\u09BE\u09A8\u09BE\u09B0 \u09AC\u09BF\u09AC\u09B0\u09A3\u0983\n        "
            }
          </T>
        </span>
        <PaperCheckBox
          checked={d.presentHoldingType === "Own property"}
          label="নিজস্ব মালিকানাধীন"
        />
        <PaperCheckBox
          checked={d.presentHoldingType === "Rented"}
          label="ভাড়া"
        />
        <PaperCheckBox
          checked={d.presentHoldingType === "Other"}
          label="অন্যান্য"
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          minHeight: "18em",
          gap: "4em",
          fontSize: "6.3em",
          overflow: "hidden",
        }}
      >
        <T>
          {
            "(\u0995) \u09A8\u09BF\u099C\u09B8\u09CD\u09AC \u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE\u09B0 \u0995\u09CD\u09B7\u09C7\u09A4\u09CD\u09B0\u09C7: \u099C\u09AE\u09BF\u09B0 \u09A6\u09B2\u09BF\u09B2\u09C7\u09B0 \u09AB\u099F\u09CB\u0995\u09AA\u09BF \u09B8\u0982\u09AF\u09C1\u0995\u09CD\u09A4 \u0995\u09B0\u09BF\u09A4\u09C7 \u09B9\u0987\u09AC\u09C7\u0983\n      "
          }
        </T>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 82em max-content 82em max-content",
          alignItems: "center",
          columnGap: "5em",
          minHeight: "18em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "6.7em", whiteSpace: "nowrap" }}>
          <T>
            {
              "(\u0996) \u09AD\u09BE\u09A1\u09BC\u09BE\u09B0 \u0995\u09CD\u09B7\u09C7\u09A4\u09CD\u09B0\u09C7: \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8\u09C7\u09B0 \u09AE\u09C7\u09AF\u09BC\u09BE\u09A6:\n        "
            }
          </T>
        </span>
        <PaperBoxes
          value={digitString(d.residenceStartDate.replace(/\D/g, ""), 8)}
          count={8}
          width={82}
          height={11.8}
          fontSize={7.7}
        />
        <span style={{ fontSize: "6.3em", whiteSpace: "nowrap" }}>
          <T>{"\u09B9\u0987\u09A4\u09C7"}</T>
        </span>
        <PaperBoxes
          value={digitString(d.residenceEndDate.replace(/\D/g, ""), 8)}
          count={8}
          width={82}
          height={11.8}
          fontSize={7.7}
        />
        <span style={{ fontSize: "6.3em", whiteSpace: "nowrap" }}>
          <T>{"\u09AA\u09B0\u09CD\u09AF\u09A8\u09CD\u09A4"}</T>
        </span>
      </div>

      <PaperSpacer height={17} />
      <div
        style={{
          fontSize: "5.8em",
          lineHeight: 1.15,
          whiteSpace: "nowrap",
        }}
      >
        <T>
          {
            "\u09AC\u09BF\u09B6\u09C7\u09B7 \u09A4\u09A5\u09CD\u09AF \u09AB\u09B0\u09AE\u09C7\u09B0 \u09AA\u09B0\u09AC\u09B0\u09CD\u09A4\u09C0 \u0985\u0982\u09B6\u09C7\u09B0 \u09A4\u09A5\u09CD\u09AF \u09AA\u09B0\u09AC\u09B0\u09CD\u09A4\u09C0 \u09AA\u09C3\u09B7\u09CD\u09A0\u09BE\u09AF\u09BC \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8 \u0995\u09B0\u09A4\u09C7 \u09B9\u09AC\u09C7\u0964\n      "
          }
        </T>
      </div>
    </div>
  );
}
function SpecialPage2({ d }: { d: SpecialInformationFormState }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "10em 35em 10em",
      }}
    >
      <PaperSpacer height={8} />

      <PaperLine
        label="(গ) অন্যান্য ক্ষেত্রে: বাড়ির মালিকের নামঃ"
        value={d.ownerOtherName}
        labelSize={6.6}
        valueSize={7}
      />

      <PaperBoxField
        label="বাড়ির মালিকের NID নম্বরঃ"
        value={digitString(d.ownerOtherNid, 17)}
        count={17}
        width={264}
        labelSize={6.6}
        boxFontSize={8}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 82em max-content 82em",
          alignItems: "center",
          columnGap: "6em",
          height: "18em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "6.7em", whiteSpace: "nowrap" }}>
          <T>
            {
              "\u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8\u0995\u09BE\u09B2:\n        "
            }
          </T>
        </span>
        <PaperBoxes
          value={digitString(d.residenceStartDate.replace(/\D/g, ""), 8)}
          count={8}
          width={82}
          height={11.8}
          fontSize={7.7}
        />
        <span style={{ fontSize: "6.3em", whiteSpace: "nowrap" }}>
          <T>{"\u09B9\u0987\u09A4\u09C7"}</T>
        </span>
        <PaperBoxes
          value={digitString(d.residenceEndDate.replace(/\D/g, ""), 8)}
          count={8}
          width={82}
          height={11.8}
          fontSize={7.7}
        />
      </div>

      <PaperSpacer height={2} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 87em max-content minmax(0, 1fr)",
          alignItems: "center",
          columnGap: "5em",
          height: "18em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "6.6em", whiteSpace: "nowrap" }}>
          <T>
            {
              "\u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C7 \u0986\u0997\u09AE\u09A8\u09C7\u09B0 \u09A4\u09BE\u09B0\u09BF\u0996\u0983\n        "
            }
          </T>
        </span>
        <PaperBoxes
          value={digitString(d.abroadArrivalDate.replace(/\D/g, ""), 8)}
          count={8}
          width={87}
          height={12}
          fontSize={7.8}
        />
        <span
          style={{
            fontSize: "6.2em",
            whiteSpace: "nowrap",
          }}
        >
          <T>
            {
              "\u09AA\u09BE\u09B8\u09AA\u09CB\u09B0\u09CD\u099F\u09C7\u09B0 \u09AC\u09BF\u09AC\u09B0\u09A3: \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8\u09C7\u09B0 \u09A4\u09BE\u09B0\u09BF\u0996\u0983\n        "
            }
          </T>
        </span>
        <PaperBoxes
          value={digitString(d.passportIssueDate.replace(/\D/g, ""), 8)}
          count={8}
          width={76}
          height={12}
          fontSize={7.5}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content minmax(0, 1fr) max-content 79em",
          alignItems: "center",
          columnGap: "5em",
          height: "18em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "6.6em", whiteSpace: "nowrap" }}>
          <T>
            {
              "\u09AA\u09CD\u09B0\u09A6\u09BE\u09A8\u09C7\u09B0 \u09B8\u09CD\u09A5\u09BE\u09A8\u0983\n        "
            }
          </T>
        </span>
        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
            borderBottom: `0.8px dotted ${INK}`,
          }}
        >
          <PaperValue text={d.passportIssuePlace} width={159} size={7} />
        </div>
        <span style={{ fontSize: "6.5em", whiteSpace: "nowrap" }}>
          <T>
            {
              "\u09AE\u09C7\u09AF\u09BC\u09BE\u09A6 \u0989\u09A4\u09CD\u09A4\u09C0\u09B0\u09CD\u09A3\u09C7\u09B0 \u09A4\u09BE\u09B0\u09BF\u0996\u0983\n        "
            }
          </T>
        </span>
        <PaperBoxes
          value={digitString(d.passportExpiryDate.replace(/\D/g, ""), 8)}
          count={8}
          width={79}
          height={12}
          fontSize={7.5}
        />
      </div>

      <PaperSpacer height={3} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 87em max-content minmax(0, 1fr)",
          alignItems: "center",
          columnGap: "4em",
          height: "18em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "7em", whiteSpace: "nowrap" }}>
          <T>
            {
              "\u09E7\u09E7\u0964 \u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u09AA\u09C7\u09B6\u09BE \u0997\u09CD\u09B0\u09B9\u09A3\u09C7\u09B0 \u09A4\u09BE\u09B0\u09BF\u0996\u0983\n        "
            }
          </T>
        </span>
        <PaperBoxes
          value={digitString(d.occupationJoinDate.replace(/\D/g, ""), 8)}
          count={8}
          width={87}
          height={12}
          fontSize={7.7}
        />
        <span style={{ fontSize: "6.7em", whiteSpace: "nowrap" }}>
          <T>
            {
              "\u09A8\u09BF\u09AF\u09BC\u09CB\u0997\u0995\u09BE\u09B0\u09C0\u09B0 \u09A8\u09BE\u09AE\u0983\n        "
            }
          </T>
        </span>
        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
            borderBottom: `0.8px dotted ${INK}`,
          }}
        >
          <PaperValue text={d.employerName} width={80} size={6.9} />
        </div>
      </div>

      <PaperLine
        label="নিয়োগকারীর ঠিকানাঃ"
        value={d.employerAddress}
        labelSize={6.6}
        valueSize={7}
      />
      <PaperInlineFields
        height={16.5}
        columns={[
          { type: "label", text: "", size: 6.6 },
          { type: "value", text: d.employerAddress2, width: 208, size: 7 },
          { type: "label", text: "মোবাইলঃ", size: 6.3 },
          { type: "value", text: d.employerMobile, width: 63, size: 6.8 },
        ]}
      />

      <PaperSpacer height={4} />

      <div style={{ fontSize: "6.9em", lineHeight: 1.2 }}>
        <T>
          {
            "\u09E7\u09E8\u0964 \u09B8\u09B0\u09CD\u09AC\u09B6\u09C7\u09B7 \u09A6\u09C1\u0987\u099F\u09BF \u09B6\u09BF\u0995\u09CD\u09B7\u09BE \u09AA\u09CD\u09B0\u09A4\u09BF\u09B7\u09CD\u09A0\u09BE\u09A8\u09C7\u09B0 \u09AC\u09BF\u09AC\u09B0\u09A3\u0983\n      "
          }
        </T>
      </div>

      <PaperSpacer height={2} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <PaperLine
          label="(ক) শিক্ষা প্রতিষ্ঠানের নাম ও ঠিকানাঃ"
          value={d.firstInstitutionNameAddress}
          labelSize={6.4}
          valueSize={6.9}
        />
        <PaperInlineFields
          height={16.5}
          columns={[
            { type: "label", text: "অধ্যয়নকালঃ", size: 6.2 },
            { type: "value", text: d.firstStudyFrom, width: 84, size: 6.7 },
            { type: "label", text: "হইতে", size: 6.1 },
            { type: "value", text: d.firstStudyTo, width: 83, size: 6.7 },
            {
              type: "label",
              text: "পর্যন্ত, অর্জিত শিক্ষাগত যোগ্যতাঃ",
              size: 6,
            },
          ]}
        />
        <PaperLine
          label=""
          value={d.firstQualification}
          labelSize={6.2}
          valueSize={6.8}
        />
      </div>

      <PaperSpacer height={2} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <PaperLine
          label="(খ) শিক্ষা প্রতিষ্ঠানের নাম ও ঠিকানাঃ"
          value={d.secondInstitutionNameAddress}
          labelSize={6.4}
          valueSize={6.9}
        />
        <PaperInlineFields
          height={16.5}
          columns={[
            { type: "label", text: "অধ্যয়নকালঃ", size: 6.2 },
            { type: "value", text: d.secondStudyFrom, width: 84, size: 6.7 },
            { type: "label", text: "হইতে", size: 6.1 },
            { type: "value", text: d.secondStudyTo, width: 83, size: 6.7 },
            {
              type: "label",
              text: "পর্যন্ত, অর্জিত শিক্ষাগত যোগ্যতাঃ",
              size: 6,
            },
          ]}
        />
        <PaperLine
          label=""
          value={d.secondQualification}
          labelSize={6.2}
          valueSize={6.8}
        />
      </div>

      <PaperSpacer height={5} />

      <div
        style={{
          fontSize: "6.7em",
          lineHeight: 1.25,
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <T>
          {
            "\u09E7\u09E9\u0964 \u0986\u09AC\u09C7\u09A6\u09A8\u0995\u09BE\u09B0\u09C0\u09B0 \u09AA\u09CD\u09B0\u09A4\u09CD\u09AF\u09AF\u09BC\u09A8\u0983 \u0986\u09AE\u09BF \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C7\u09B0 \u09A8\u09BE\u0997\u09B0\u09BF\u0995 \u098F\u09AC\u0982 \u098F\u0987 \u09AB\u09B0\u09AE\u09C7 \u09AC\u09B0\u09CD\u09A3\u09BF\u09A4 \u09A4\u09A5\u09CD\u09AF\n        \u0986\u09AE\u09BE\u09B0 \u099C\u09CD\u099E\u09BE\u09A8 \u0993 \u09AC\u09BF\u09B6\u09CD\u09AC\u09BE\u09B8 \u09AE\u09A4\u09C7 \u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3 \u09B8\u09A4\u09CD\u09AF;\n      "
          }
        </T>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 90em",
          alignItems: "end",
          columnGap: "4em",
          height: "22em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "5em", whiteSpace: "nowrap" }}>
          <T>
            {
              "\u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0/\u099F\u09BF\u09AA\u09B8\u09B9\u09BF\u0983\n        "
            }
          </T>
        </span>
        <div
          style={{
            width: "100%",
            minWidth: 0,
            borderBottom: `0.8px dotted ${INK}`,
          }}
        />
      </div>

      <PaperBoxField
        label="১৪। তথ্য সংগ্রহকারীর NID নম্বরঃ"
        value={digitString(d.dataCollectorNid, 17)}
        count={17}
        width={252}
        labelSize={7}
        boxFontSize={8.1}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 111em",
          alignItems: "end",
          columnGap: "4em",
          height: "22em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "6.7em", whiteSpace: "nowrap" }}>
          <T>
            {"\u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0\u0983\n        "}
          </T>
        </span>
        <div
          style={{
            width: "100%",
            minWidth: 0,
            borderBottom: `0.8px dotted ${INK}`,
          }}
        />
      </div>

      <PaperSpacer height={6} />

      <div style={{ fontSize: "7em", lineHeight: 1.2 }}>
        <T>
          {
            "\u09E7\u09EB\u0964 \u09AC\u09BF\u09B6\u09C7\u09B7 \u0995\u09AE\u09BF\u099F\u09BF\u09B0 \u09B8\u09BF\u09A6\u09CD\u09A7\u09BE\u09A8\u09CD\u09A4\u0983\n      "
          }
        </T>
      </div>

      <PaperSpacer height={28} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30em",
          alignItems: "end",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <PaperSignatureLine
          label="সদস্য সচিবের স্বাক্ষর ও তারিখঃ"
          width={161}
          align="center"
        />
        <PaperSignatureLine
          label="আহ্বায়কের স্বাক্ষর ও তারিখঃ"
          width={161}
          align="center"
        />
      </div>
    </div>
  );
}
function FormPage({
  page,
  data,
  unit,
}: {
  page: 1 | 2;
  data: SpecialInformationFormState;
  unit: string;
}) {
  return (
    <div
      data-form-page={page}
      style={{
        width: `${PAPER_W}em`,
        height: `${PAPER_H}em`,
        fontSize: unit,
        background: PAPER,
        color: INK,
        fontFamily: FORM_FONT,
        overflow: "hidden",
        lineHeight: 1,
        boxSizing: "border-box",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {page === 1 ? <SpecialPage1 d={data} /> : <SpecialPage2 d={data} />}
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
function ScaledPaper({
  page,
  data,
}: {
  page: 1 | 2;
  data: SpecialInformationFormState;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const width = useElementWidth(ref);
  return (
    <div
      ref={ref}
      data-special-paper={`page-${page}`}
      className="w-full overflow-hidden rounded-[2px] shadow-[0_2px_10px_rgba(59,47,30,0.25)]"
      style={{ aspectRatio: `${PAPER_W}/${PAPER_H}`, background: PAPER }}
    >
      {width > 0 ? (
        <FormPage page={page} data={data} unit={`${width / PAPER_W}px`} />
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
  data: SpecialInformationFormState;
  hasData: boolean;
}) {
  const { tx } = useSpecialTranslator();
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
  const onPanStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const node = scrollRef.current;
    if (!node) return;
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
  const onPanEnd = () => {
    const start = panRef.current;
    if (!start) return;
    panRef.current = null;
    setPanning(false);
    try {
      scrollRef.current?.releasePointerCapture(start.id);
    } catch {}
  };
  const updatePageFromScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    const viewport = node.getBoundingClientRect();
    const papers = Array.from(
      node.querySelectorAll<HTMLElement>("[data-special-paper]"),
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
        bestPage = paper.dataset.specialPaper === "page-2" ? 2 : 1;
      }
    });
    setPage(bestPage);
  }, []);
  useEffect(() => {
    updatePageFromScroll();
  }, [updatePageFromScroll, zoom]);
  const nudgeZoom = (delta: number) =>
    setZoom((current) =>
      Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, current + delta)),
    );
  const jumpToPage = (target: 1 | 2) => {
    const node = scrollRef.current;
    if (!node) return;
    const paper = node.querySelector<HTMLElement>(
      `[data-special-paper="page-${target}"]`,
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
    <div className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[16px] font-semibold text-[#3B2F1E]">
          <T>{"Preview\n        "}</T>
        </span>
        <div className="flex items-center gap-2">
          <div className="flex h-8 items-center overflow-hidden rounded-md border border-[#D8C9A6] bg-[#FBF6E8]/70">
            <button
              type="button"
              title={tx("Zoom out")}
              aria-label={tx("Zoom out")}
              disabled={zoom <= ZOOM_MIN}
              onClick={() => nudgeZoom(-ZOOM_STEP)}
              className="h-full px-2 text-[#7A6A50] hover:bg-[#EFE3C8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-11 text-center text-[14px] font-semibold text-[#5A4A32]">
              {zoom}
              <T>{"%\n            "}</T>
            </span>
            <button
              type="button"
              title={tx("Zoom in")}
              aria-label={tx("Zoom in")}
              disabled={zoom >= ZOOM_MAX}
              onClick={() => nudgeZoom(ZOOM_STEP)}
              className="h-full px-2 text-[#7A6A50] hover:bg-[#EFE3C8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title={tx("Reset zoom")}
              aria-label={tx("Reset zoom to 100%")}
              disabled={zoom === 100}
              onClick={() => setZoom(100)}
              className="h-full border-l border-[#D8C9A6] px-2 text-[#7A6A50] hover:bg-[#EFE3C8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
          <span
            className={cx(
              "rounded-md px-2.5 py-1.5 text-[13px] font-semibold",
              hasData
                ? "bg-[#F6D9A8] text-[#B91C1C]"
                : "bg-[#FBF6E8] text-[#5A4A32]",
            )}
          >
            {hasData ? <T>{"Preview"}</T> : <T>{"Empty"}</T>}
          </span>
        </div>
      </div>
      <div className="mb-2 flex items-center gap-1.5 px-1 text-[14px] text-[#5A4A32]">
        <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-[#D8C9A6] bg-[#FBF6E8]">
          <Check className="h-2.5 w-2.5 text-[#7A6A50]" />
        </span>
        <T>{"Live preview\n      "}</T>
      </div>
      <div className="relative rounded-2xl bg-[#4A3B26] p-3.5 shadow-inner">
        <div className="absolute right-6 top-6 z-20">
          <button
            type="button"
            onClick={() => jumpToPage(page === 1 ? 2 : 1)}
            title={tx(page === 1 ? "Go to page 2" : "Go to page 1")}
            className="flex items-center gap-1 rounded-full bg-[#3B2F1E] px-2.5 py-1.5 text-[15px] font-semibold text-white shadow-lg"
          >
            <T>{"Page "}</T>
            {page}
            <T>{"of 2 "}</T>
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
          onDragStart={(event: ReactDragEvent<HTMLDivElement>) =>
            event.preventDefault()
          }
          className={cx(
            "relative max-h-[calc(100vh-250px)] min-h-[420px] select-none overflow-auto rounded-xl bg-[#6B5A40] px-3 py-3.5 sm:min-h-[620px] sm:px-8",
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
/*  Print / PDF                                                                */
/* -------------------------------------------------------------------------- */
const PRINT_CSS = `
#special-print-root { position: fixed; left: -10000px; top: 0; width: 210mm; background: #fff; pointer-events: none; }
@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  body > *:not(#special-print-root) { display: none !important; }
  #special-print-root { position: static !important; left: auto !important; top: auto !important; width: 210mm !important; }
  #special-print-root .special-print-page { break-after: page; page-break-after: always; }
  #special-print-root .special-print-page:last-child { break-after: auto; page-break-after: auto; }
  #special-print-root, #special-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
function PrintRoot({
  data,
  mode,
}: {
  data: SpecialInformationFormState;
  mode: "print" | "pdf";
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div id="special-print-root" aria-hidden="true">
      {([1, 2] as const).map((page) => (
        <div
          key={page}
          id={`special-print-page-${page}`}
          className="special-print-page"
          style={{
            position: "relative",
            width: "210mm",
            height: mode === "pdf" ? "297mm" : "296.5mm",
            overflow: "hidden",
            background: PAPER,
          }}
        >
          <FormPage page={page} data={data} unit={`${210 / PAPER_W}mm`} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
/* -------------------------------------------------------------------------- */
/*  Main                                                                       */
/* -------------------------------------------------------------------------- */
export default function SpecialInformationForm() {
  const { tx } = useSpecialTranslator();
  const [form, setForm] = useState<SpecialInformationFormState>(EMPTY_FORM);
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
  useEffect(() => {
    const saved = safeReadJson(STORAGE_KEY);
    if (saved) setForm(saved);
    try {
      setFavorite(window.localStorage.getItem(FAVORITE_KEY) === "1");
      setUsedCount(
        Math.max(0, Number(window.localStorage.getItem(USED_KEY)) || 0),
      );
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, []);
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
    } catch {}
  }, [form, hydrated]);
  const setField = useCallback(
    <K extends FormKey>(key: K, value: SpecialInformationFormState[K]) => {
      setForm(
        (current) =>
          ({ ...current, [key]: value }) as SpecialInformationFormState,
      );
    },
    [],
  );
  const setText = useCallback(
    (key: StringKey, value: string) => setField(key, value),
    [setField],
  );
  const setHoldingType = (
    value: SpecialInformationFormState["presentHoldingType"],
  ) =>
    setField(
      "presentHoldingType",
      form.presentHoldingType === value ? "" : value,
    );
  const clearAll = () => {
    if (!hasData) return;
    try {
      window.localStorage.setItem(LAST_KEY, JSON.stringify(form));
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setForm({ ...EMPTY_FORM });
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
  const toggleFavorite = () => {
    setFavorite((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(FAVORITE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };
  const bumpUsage = () => {
    setUsedCount((count) => {
      const next = count + 1;
      try {
        window.localStorage.setItem(USED_KEY, String(next));
      } catch {}
      return next;
    });
  };
  const share = async () => {
    const url = window.location.href;
    const payload = {
      title: tx("Special Information Form"),
      text: tx(
        "Fill in your details on the left — see the live form on the right and download it as PDF.",
      ),
      url,
    };
    try {
      if (typeof navigator.share === "function") await navigator.share(payload);
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        pushToast(
          "success",
          "Link copied",
          "The page link is on your clipboard.",
        );
      } else
        pushToast(
          "error",
          "Could not share",
          "Sharing is not supported in this browser.",
        );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      pushToast(
        "error",
        "Could not share",
        "Sharing was blocked by the browser.",
      );
    }
  };
  useEffect(() => {
    const before = () =>
      flushSync(() => setMode((current) => current ?? "print"));
    const after = () =>
      flushSync(() =>
        setMode((current) => (current === "print" ? null : current)),
      );
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
  const downloadPdf = async () => {
    if (mode) return;
    flushSync(() => setMode("pdf"));
    try {
      await waitForFonts();
      const pages = [1, 2].map((n) =>
        document.getElementById(`special-print-page-${n}`),
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
        title: tx("Special Information Form"),
        subject: tx("Form-2 additional information"),
      });
      for (let index = 0; index < pages.length; index += 1) {
        const canvas = await html2canvas(pages[index] as HTMLElement, {
          backgroundColor: PAPER,
          scale: 3,
          useCORS: true,
          logging: false,
          onclone: (clonedDocument: Document) => {
            const root = clonedDocument.getElementById("special-print-root");
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
      const slug = form.nameBn
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
      pdf.save(
        slug
          ? `special-information-form-${slug}.pdf`
          : "special-information-form.pdf",
      );
      bumpUsage();
      pushToast(
        "success",
        "PDF ready",
        "Your 2-page Special Information Form has been downloaded.",
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
  return (
    <div
      className="special-information-page relative isolate -mx-4 -mt-6 min-h-[calc(100vh-72px)] px-4 pb-36 pt-5 text-[#3B2F1E] print:bg-white print:shadow-none"
      style={{ background: "linear-gradient(180deg, #E9DDC3 0%, #EFE5CE 100%)" }}
    >
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
` + PRINT_CSS + `
html:has(.special-information-page),
body:has(.special-information-page) {
  background: linear-gradient(180deg, #E9DDC3 0%, #EFE5CE 100%) !important;
}
.special-information-page::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(180deg, #E9DDC3 0%, #EFE5CE 100%);
}
@media print {
  html:has(.special-information-page),
  body:has(.special-information-page) { background: #FFFFFF !important; }
  .special-information-page::before { display: none !important; }
}
.special-information-page {
  font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-optical-sizing: auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
.special-information-page h1, .special-information-page h2, .special-information-page h3, .special-information-page h4 { letter-spacing: -0.01em; }
.special-information-page button { transition-duration: 180ms; }
.special-information-page button:active:not(:disabled) { transform: scale(0.98); }
.special-information-page button:focus-visible, .special-information-page input:focus-visible { outline: 2px solid rgba(220,38,38,0.35); outline-offset: 2px; }
`}
      </style>
      <datalist id="special-district-list">
        {DISTRICTS.map(([bn, en]) => (
          <option key={en} value={bn} label={tx(en)} />
        ))}
      </datalist>
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-2 flex items-center gap-2 px-1 text-[13px] text-[#7A6A50]">
          <span>
            <T>{"\u2302"}</T>
          </span>
          <span>
            <T>{"/"}</T>
          </span>
          <span>
            <T>{"Seba Lagbe Tools"}</T>
          </span>
          <span>
            <T>{"/"}</T>
          </span>
          <span>
            <T>{"General Tools"}</T>
          </span>
          <span>
            <T>{"/"}</T>
          </span>
          <span className="font-semibold text-[#5A4A32]">
            <T>{"Special Information Form\n          "}</T>
          </span>
        </div>
        <div className="mb-4 flex items-start justify-between gap-4 px-1">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#F6D9A8] text-[#DC2626]">
                <ClipboardList className="h-4 w-4" />
              </span>
              <h1 className="text-[23px] font-bold tracking-[-0.02em] text-[#3B2F1E]">
                <T>{"Special Information Form\n              "}</T>
              </h1>
              <span className="rounded-full bg-[#F6EEDB] px-2 py-1 text-[13px] font-bold text-[#5A4A32]">
                <T>{"Free\n              "}</T>
              </span>
              <span className="text-[13px] text-[#7A6A50]">
                <T>{"\u2713 Used "}</T>
                {usedCount}{" "}
                {usedCount === 1 ? <T>{"time"}</T> : <T>{"times"}</T>}
              </span>
            </div>
            <p className="mt-1 pl-10 text-[14px] text-[#5A4A32]">
              <T>
                {
                  "Fill in your details on the left \u2014 see the live form on the right\n              and download it as PDF.\n            "
                }
              </T>
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              title={tx(
                favorite ? "Remove from favorites" : "Add to favorites",
              )}
              aria-pressed={favorite}
              onClick={toggleFavorite}
              className={cx(
                "flex h-9 w-9 items-center justify-center rounded-lg border bg-[#FBF6E8]/60 transition",
                favorite
                  ? "border-[#DC2626] text-[#DC2626]"
                  : "border-[#D8C9A6] text-[#7A6A50] hover:bg-[#EFE3C8]",
              )}
            >
              <Star className={cx("h-4 w-4", favorite && "fill-current")} />
            </button>
            <button
              type="button"
              title={tx("Share")}
              aria-label={tx("Share")}
              onClick={share}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8C9A6] bg-[#FBF6E8]/60 text-[#7A6A50] transition hover:bg-[#EFE3C8]"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid items-start gap-3.5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-3.5">
            <SectionCard number={1} title={tx("Applicant")}>
              <div className="space-y-3">
                <TextField
                  label="Form-2 number"
                  placeholder={tx("Form-2 number")}
                  maxLength={24}
                  value={form.form2Number}
                  onChange={(v) => setText("form2Number", v)}
                />
                <TextField
                  label="Name (in Bangla)"
                  placeholder={tx("Name (in Bangla)")}
                  maxLength={60}
                  value={form.nameBn}
                  onChange={(v) => setText("nameBn", v)}
                />
                <TextField
                  label="Father's / husband's name"
                  placeholder={tx("Father's / husband's name")}
                  maxLength={60}
                  value={form.fatherHusbandName}
                  onChange={(v) => setText("fatherHusbandName", v)}
                />
              </div>
            </SectionCard>

            <SectionCard
              number={2}
              title={tx("Father's / husband's permanent address")}
            >
              <AddressInputs
                prefix="fatherAddress"
                form={form}
                setText={setText}
              />
            </SectionCard>

            <SectionCard
              number={3}
              title={tx("Guardian")}
              description="Fill this in only when the parents or husband are no longer living."
            >
              <div className="space-y-3">
                <TextField
                  label="Guardian's name"
                  placeholder={tx("Guardian's name")}
                  maxLength={60}
                  value={form.guardianName}
                  onChange={(v) => setText("guardianName", v)}
                />
                <FieldRow>
                  <TextField
                    label="Guardian's NID number"
                    placeholder={tx("10, 13 or 17-digit NID")}
                    maxLength={17}
                    inputMode="numeric"
                    validate={validateNid}
                    value={form.guardianNid}
                    onChange={(v) => setText("guardianNid", digitString(v, 17))}
                  />
                  <TextField
                    label="Relation to guardian"
                    placeholder={tx("Relation to guardian")}
                    maxLength={30}
                    value={form.guardianRelation}
                    onChange={(v) => setText("guardianRelation", v)}
                  />
                </FieldRow>
                <DateField
                  label="Guardian's date of birth"
                  value={form.guardianDob}
                  onChange={(v) => setText("guardianDob", v)}
                />
              </div>
            </SectionCard>

            <SectionCard number={4} title={tx("Paternal grandfather")}>
              <div className="space-y-3">
                <TextField
                  label="Paternal grandfather's name"
                  placeholder={tx("Paternal grandfather's name")}
                  maxLength={60}
                  value={form.grandfatherName}
                  onChange={(v) => setText("grandfatherName", v)}
                />
                <TextField
                  label="Grandfather's NID number"
                  placeholder={tx("10, 13 or 17-digit NID")}
                  maxLength={17}
                  inputMode="numeric"
                  disabled={form.grandfatherNidNotApplicable}
                  validate={validateNid}
                  value={form.grandfatherNid}
                  onChange={(v) =>
                    setText("grandfatherNid", digitString(v, 17))
                  }
                />
                <CheckBox
                  checked={form.grandfatherNidNotApplicable}
                  label="Grandfather's NID not applicable"
                  onChange={(v) => setField("grandfatherNidNotApplicable", v)}
                />
              </div>
            </SectionCard>

            <SectionCard
              number={5}
              title={tx("Grandfather's permanent address")}
            >
              <AddressInputs
                prefix="grandfatherAddress"
                form={form}
                setText={setText}
              />
            </SectionCard>

            <SectionCard
              number={6}
              title={tx("Three NID-holding relatives")}
              description="Brother / sister / uncle / aunt, in that order."
            >
              <div className="space-y-5">
                <RelativeInputs
                  title="First relative"
                  prefix="first"
                  form={form}
                  setText={setText}
                />
                <RelativeInputs
                  title="Second relative"
                  prefix="second"
                  form={form}
                  setText={setText}
                />
                <RelativeInputs
                  title="Third relative"
                  prefix="third"
                  form={form}
                  setText={setText}
                />
              </div>
            </SectionCard>

            <SectionCard number={7} title={tx("Present address")}>
              <div className="space-y-3">
                <div>
                  <FieldLabel>
                    <T>{"How the present address is held"}</T>
                  </FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {HOLDING_OPTIONS.map((option) => (
                      <ChoicePill
                        key={option}
                        active={form.presentHoldingType === option}
                        onClick={() => setHoldingType(option)}
                      >
                        {option}
                      </ChoicePill>
                    ))}
                  </div>
                </div>
                {form.presentHoldingType === "Other" ? (
                  <>
                    <TextField
                      label="Owner's name (other)"
                      placeholder={tx("Owner's name (other)")}
                      maxLength={60}
                      value={form.ownerOtherName}
                      onChange={(v) => setText("ownerOtherName", v)}
                    />
                    <TextField
                      label="Owner's NID (other)"
                      placeholder={tx("10, 13 or 17-digit NID")}
                      maxLength={17}
                      inputMode="numeric"
                      validate={validateNid}
                      value={form.ownerOtherNid}
                      onChange={(v) =>
                        setText("ownerOtherNid", digitString(v, 17))
                      }
                    />
                  </>
                ) : null}
                {form.presentHoldingType === "Rented" ||
                form.presentHoldingType === "Other" ? (
                  <FieldRow>
                    <DateField
                      label={`Residence start date (${form.presentHoldingType.toLowerCase()})`}
                      value={form.residenceStartDate}
                      onChange={(v) => setText("residenceStartDate", v)}
                    />
                    <DateField
                      label={`Residence end date (${form.presentHoldingType.toLowerCase()})`}
                      value={form.residenceEndDate}
                      onChange={(v) => setText("residenceEndDate", v)}
                    />
                  </FieldRow>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              number={8}
              title={tx("Applicants born abroad")}
              description="Born outside Bangladesh? Add passport and arrival details."
            >
              <div className="space-y-3">
                <FieldRow>
                  <DateField
                    label="Date of arrival in Bangladesh"
                    value={form.abroadArrivalDate}
                    onChange={(v) => setText("abroadArrivalDate", v)}
                  />
                  <DateField
                    label="Passport issue date"
                    value={form.passportIssueDate}
                    onChange={(v) => setText("passportIssueDate", v)}
                  />
                </FieldRow>
                <FieldRow>
                  <TextField
                    label="Passport issue place"
                    placeholder={tx("Passport issue place")}
                    maxLength={50}
                    value={form.passportIssuePlace}
                    onChange={(v) => setText("passportIssuePlace", v)}
                  />
                  <DateField
                    label="Passport expiry date"
                    value={form.passportExpiryDate}
                    onChange={(v) => setText("passportExpiryDate", v)}
                  />
                </FieldRow>
              </div>
            </SectionCard>

            <SectionCard number={9} title={tx("Present occupation")}>
              <div className="space-y-3">
                <FieldRow>
                  <DateField
                    label="Date joined present occupation"
                    value={form.occupationJoinDate}
                    onChange={(v) => setText("occupationJoinDate", v)}
                  />
                  <TextField
                    label="Employer's name"
                    placeholder={tx("Employer's name")}
                    maxLength={60}
                    value={form.employerName}
                    onChange={(v) => setText("employerName", v)}
                  />
                </FieldRow>
                <TextField
                  label="Employer's address"
                  placeholder={tx("Employer's address")}
                  maxLength={100}
                  value={form.employerAddress}
                  onChange={(v) => setText("employerAddress", v)}
                />
                <TextField
                  label="Employer's address (second line)"
                  placeholder={tx("Employer's address (second line)")}
                  maxLength={100}
                  value={form.employerAddress2}
                  onChange={(v) => setText("employerAddress2", v)}
                />
                <TextField
                  label="Employer's mobile"
                  placeholder={tx("01783666743")}
                  maxLength={11}
                  inputMode="tel"
                  validate={validateMobile}
                  value={form.employerMobile}
                  onChange={(v) =>
                    setText("employerMobile", digitString(v, 11))
                  }
                />
              </div>
            </SectionCard>

            <SectionCard number={10} title={tx("Last two institutions")}>
              <div className="space-y-5">
                <div className="space-y-3">
                  <TextField
                    label="First institution — name and address"
                    placeholder={tx("First institution — name and address")}
                    maxLength={120}
                    value={form.firstInstitutionNameAddress}
                    onChange={(v) => setText("firstInstitutionNameAddress", v)}
                  />
                  <FieldRow>
                    <TextField
                      label="Study period from (first)"
                      placeholder={tx("e.g. 2010")}
                      maxLength={4}
                      inputMode="numeric"
                      value={form.firstStudyFrom}
                      onChange={(v) =>
                        setText("firstStudyFrom", digitString(v, 4))
                      }
                    />
                    <TextField
                      label="Study period to (first)"
                      placeholder={tx("e.g. 2010")}
                      maxLength={4}
                      inputMode="numeric"
                      value={form.firstStudyTo}
                      onChange={(v) =>
                        setText("firstStudyTo", digitString(v, 4))
                      }
                    />
                  </FieldRow>
                  <TextField
                    label="Qualification earned (first)"
                    placeholder={tx("e.g. SSC")}
                    maxLength={50}
                    value={form.firstQualification}
                    onChange={(v) => setText("firstQualification", v)}
                  />
                </div>
                <div className="space-y-3">
                  <TextField
                    label="Second institution — name and address"
                    placeholder={tx("Second institution — name and address")}
                    maxLength={120}
                    value={form.secondInstitutionNameAddress}
                    onChange={(v) => setText("secondInstitutionNameAddress", v)}
                  />
                  <FieldRow>
                    <TextField
                      label="Study period from (second)"
                      placeholder={tx("e.g. 2010")}
                      maxLength={4}
                      inputMode="numeric"
                      value={form.secondStudyFrom}
                      onChange={(v) =>
                        setText("secondStudyFrom", digitString(v, 4))
                      }
                    />
                    <TextField
                      label="Study period to (second)"
                      placeholder={tx("e.g. 2010")}
                      maxLength={4}
                      inputMode="numeric"
                      value={form.secondStudyTo}
                      onChange={(v) =>
                        setText("secondStudyTo", digitString(v, 4))
                      }
                    />
                  </FieldRow>
                  <TextField
                    label="Qualification earned (second)"
                    placeholder={tx("e.g. SSC")}
                    maxLength={50}
                    value={form.secondQualification}
                    onChange={(v) => setText("secondQualification", v)}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              number={11}
              title={tx("Data collector")}
              description="The NID of the person who collected the information."
            >
              <TextField
                label="Data collector's NID number"
                placeholder={tx("10, 13 or 17-digit NID")}
                maxLength={17}
                inputMode="numeric"
                validate={validateNid}
                value={form.dataCollectorNid}
                onChange={(v) =>
                  setText("dataCollectorNid", digitString(v, 17))
                }
              />
            </SectionCard>
          </div>

          <div className="lg:sticky lg:top-5">
            <PreviewFrame data={form} hasData={hasData} />
          </div>
        </div>

        <section
          className="mt-5 rounded-2xl border border-[#E3D6B8] bg-[#F2E8D2] px-5 py-5 shadow-sm print:hidden"
          aria-labelledby="special-information-important-notes"
        >
          <h2
            id="special-information-important-notes"
            className="text-[17px] font-bold text-[#DC2626]"
          >
            <T>{"Important notes:\n          "}</T>
          </h2>
          <div className="my-4 border-t border-[#FBB6B6]" />
          <div className="space-y-3 text-[14px] leading-5 text-[#3B2F1E]">
            <p>
              <T>{"Attach the following with the form:"}</T>
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <T>
                  {"A photocopy of the land deed, when the address is owned."}
                </T>
              </li>
              <li>
                <T>
                  {
                    "The landlord's NID and proof of tenancy, for rented or other\n                tenures.\n              "
                  }
                </T>
              </li>
              <li>
                <T>
                  {
                    "A copy of the Home Ministry citizenship certificate, if born\n                abroad.\n              "
                  }
                </T>
              </li>
              <li>
                <T>{"Photocopies of educational certificates, if any."}</T>
              </li>
            </ul>
            <p className="pt-1 font-medium text-[#DC2626]">
              <T>
                {
                  "Fill everything in accurately \u2014 wrong information can get the\n              application rejected.\n            "
                }
              </T>
            </p>
            <p className="pt-1 text-[#5A4A32]">
              <T>
                {
                  "Print the filled form, sign it, and submit it with Form-2 at your\n              upazila / thana election office.\n            "
                }
              </T>
            </p>
          </div>
        </section>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-[#D8C9A6] bg-[#FBF6E8]/95 shadow-[0_-6px_24px_rgba(59,47,30,0.12)] backdrop-blur print:hidden">
        <div className="pointer-events-auto mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#3B2F1E]">
            <span
              className={cx(
                "h-2 w-2 rounded-full",
                hasData ? "bg-[#10B981]" : "bg-[#B0A080]",
              )}
            />
            {hasData ? (
              <T>{"Form complete — download or print it."}</T>
            ) : (
              <T>{"Add an input to get started"}</T>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={!hasData}
              onClick={clearAll}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#FBB6B6] bg-[#FBF6E8] px-3 py-1.5 text-[15px] font-semibold text-[#B91C1C] hover:bg-[#FEE9E9] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-[#FBF6E8]"
            >
              <X className="h-3.5 w-3.5" />
              <T>{"Clear all\n            "}</T>
            </button>
            <button
              type="button"
              onClick={restoreLast}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#FBB6B6] bg-[#FBF6E8] px-3 py-1.5 text-[15px] font-semibold text-[#B91C1C] hover:bg-[#FEE9E9]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <T>{"Restore last form\n            "}</T>
            </button>
            <button
              type="button"
              disabled={pdfBusy}
              onClick={print}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#FBB6B6] bg-[#FBF6E8] px-3 py-1.5 text-[15px] font-semibold text-[#B91C1C] hover:bg-[#FEE9E9] disabled:cursor-wait disabled:opacity-70"
            >
              <Printer className="h-3.5 w-3.5" />
              <T>{"Print\n            "}</T>
            </button>
            <button
              type="button"
              disabled={pdfBusy}
              onClick={downloadPdf}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#D42020] px-3.5 py-1.5 text-[15px] font-bold text-white shadow-sm hover:bg-[#AE1717] active:bg-[#991B1B] disabled:cursor-wait disabled:opacity-70"
            >
              <FileDown className="h-3.5 w-3.5" />
              {pdfBusy ? <T>{"Processing..."}</T> : <T>{"Download PDF"}</T>}
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
              toast.kind === "success" && "border-[#A7F3D0] bg-[#ECFDF5]",
              toast.kind === "info" && "border-[#D8C9A6] bg-[#F6EEDB]",
              toast.kind === "error" && "border-[#FCA5A5] bg-[#FEF2F2]",
            )}
          >
            {toast.kind === "success" ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#059669]" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p
                className={cx(
                  "text-[14px] font-bold",
                  toast.kind === "success"
                    ? "text-[#047857]"
                    : toast.kind === "error"
                      ? "text-[#B91C1C]"
                      : "text-[#5A4A32]",
                )}
              >
                {tx(toast.title)}
              </p>
              <p className="mt-0.5 text-[13.5px] leading-5 text-[#5A4A32]">
                {tx(toast.message)}
              </p>
            </div>
            <button
              type="button"
              aria-label={tx("Dismiss")}
              onClick={() => dismissToast(toast.id)}
              className="text-[#7A6A50] hover:text-[#5A4A32]"
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
