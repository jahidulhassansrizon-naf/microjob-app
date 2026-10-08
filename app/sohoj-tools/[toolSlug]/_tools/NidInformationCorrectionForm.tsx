"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
/**
 * NID Information Correction Form (Form-2) — Sohoj Tools
 *
 * Dependencies (install once):
 *   npm i lucide-react html2canvas jspdf
 *
 * - Live A4 preview is rendered as real HTML (Bangla text), driven by React state.
 * - Autosaves to localStorage (only when the form is not empty) and can be restored.
 * - Print uses the browser print dialog on a clean A4 copy of the form.
 * - Download PDF rasterises each A4 sheet of the same copy at 3x (one PDF page per sheet).
 */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  Eye,
  FileText,
  Home,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
/* -------------------------------------------------------------------------- */
/* Constants & types                                                          */
/* -------------------------------------------------------------------------- */
const TITLE = "NID Information Correction Form";
const STORAGE_KEY = "sohoj-tools:nid-correction-form:v1";
const USES_KEY = "sohoj-tools:nid-correction-form:uses";
const FAV_KEY = "sohoj-tools:nid-correction-form:fav";
const PRINT_ID = "nid-correction-print-root";
const PAGE_W = 794; // A4 @ 96dpi
const PAGE_H = 1123;
type SubjectKey =
  | "nameBangla"
  | "nameEnglish"
  | "fatherName"
  | "motherName"
  | "spouseName"
  | "dateOfBirth"
  | "address"
  | "bloodGroup"
  | "other";
type Subject = {
  key: SubjectKey;
  letter: string;
  en: string;
  bn: string;
  multiline?: boolean;
};
type SubjectValue = {
  current: string;
  corrected: string;
  remarks: string;
};
type Contact = {
  name: string;
  address: string;
  mobile: string;
  email: string;
};
type FormState = {
  cardHolderName: string;
  nidNumber: string;
  guardianName: string;
  guardianNid: string;
  subjects: Record<SubjectKey, SubjectValue>;
  feePaid: string;
  receipt: string;
  attachments: string;
  applicant: Contact;
  guardianSign: Contact;
};
const SUBJECTS: Subject[] = [
  { key: "nameBangla", letter: "ক", en: "Name (Bangla)", bn: "নাম (বাংলা)" },
  { key: "nameEnglish", letter: "খ", en: "Name (English)", bn: "নাম (ইংরেজি)" },
  { key: "fatherName", letter: "গ", en: "Father's name", bn: "পিতার নাম" },
  { key: "motherName", letter: "ঘ", en: "Mother's name", bn: "মাতার নাম" },
  { key: "spouseName", letter: "ঙ", en: "Spouse's name", bn: "স্বামীর নাম" },
  { key: "dateOfBirth", letter: "চ", en: "Date of birth", bn: "জন্মতারিখ" },
  { key: "address", letter: "ছ", en: "Address", bn: "ঠিকানা", multiline: true },
  { key: "bloodGroup", letter: "জ", en: "Blood group", bn: "রক্তের গ্রুপ" },
  { key: "other", letter: "ঝ", en: "Other", bn: "অন্যান্য", multiline: true },
];

/**
 * Page-local translator for the NID correction form.
 * English is used as the canonical key for the shared translator. Existing
 * official Bangla form text is preserved verbatim when Bangla mode is active,
 * while an accurate English equivalent is shown in English mode.
 */
const NID_BN_TO_EN: Record<string, string> = {
  নামঃ: "Name: ",
  ঠিকানাঃ: "Address: ",
  "মোবাইল নম্বরঃ": "Mobile number: ",
  "ই-মেইল (যদি থাকে):": "E-mail (if available): ",
  "ফরম-২": "Form-2",
  "[প্রবিধান ৪ দ্রষ্টব্য]": "[See Regulation 4]",
  "জাতীয় পরিচয়পত্র বা তথ্য-উপাত্ত সংশোধনের আবেদন":
    "Application for correction of National ID card or stored data",
  "ক্রমিক নম্বর : ................ (অফিস কর্তৃক পূরণীয়)":
    "Serial number: ................ (To be filled in by the office)",
  "১। জাতীয় পরিচয়পত্রধারীর-": "1. National ID card holder's",
  "২। আঠারো বৎসরের কম বয়স্ক/আদালত কর্তৃক অপ্রকৃতিস্থ ঘোষিত জাতীয় পরিচয়পত্রধারীর ক্ষেত্রে, আইনানুগ অভিভাবকের -":
    "2. For a National ID card holder under 18 years of age or declared mentally incompetent by a court, the lawful guardian's -",
  "৩। জাতীয় পরিচয়পত্র বা সংরক্ষিত তথ্য-উপাত্তে যে তথ্য সংশোধন করিতে হইবে (অপ্রয়োজনীয় অংশ কাটিয়া দিন):":
    "3. Information to be corrected in the National ID card or stored data (strike out the unnecessary portion):",
  বিষয়: "Subject",
  "বর্তমানে জাতীয় পরিচয়পত্র বা সংরক্ষিত তথ্য উপাত্তে বিদ্যমান তথ্য":
    "Information currently appearing on the National ID card or in stored data",
  "চাহিত সংশোধিত তথ্য": "Requested corrected information",
  "সংযুক্ত দলিলাদি/মন্তব্য": "Attached documents/comments",
  "৪। জমাকৃত ফি এর পরিমাণ (১১ এর উপ-প্রবিধান (১) এর ক্রমিক নং ১ বা, প্রযোজ্য ক্ষেত্রে, ২ এ উল্লিখিত ফি অনুসারে):":
    "4. Amount of fee paid (as stated in serial 1 of sub-regulation (1) of Regulation 11, or serial 2 where applicable):",
  "৫। প্রযোজ্য ক্ষেত্রে ফি জমা দানের রশিদ :":
    "5. Fee payment receipt, where applicable:",
  "৬। আবেদনপত্রের সহিত সংযুক্ত দলিলাদির বিবরণ:":
    "6. Details of documents attached with the application:",
  "অংশ - খ (ফরম-২)": "Part-B (Form-2)",
  "জাতীয় পরিচয়পত্র প্রদানের রশিদ": "National ID card issuance receipt",
  "[প্রবিধান ৪ (৪) (খ) দ্রষ্টব্য]": "[See Regulation 4(4)(b)]",
  "ক্রমিক নম্বর : ................": "Serial number: ................",
  "(সিলমোহর)": "(Seal)",
  "দায়িত্বপ্রাপ্ত কর্মকর্তার স্বাক্ষর": "Signature of the authorized officer",
  "আবেদনকারীর জন্য নির্দেশাবলী": "Instructions for the applicant",
  "অংশ-ক (ফরম-২)": "Part-A (Form-2)",
  "প্রাপ্তিস্বীকারের রশিদ": "Acknowledgement receipt",
  "[প্রবিধান ৪(৩) দ্রষ্টব্য]": "[See Regulation 4(3)]",
  Filled: "Filled",
  Close: "Close",
  "Fill in": "Fill in",
  "This subject appears in the correction table.":
    "This subject appears in the correction table.",
  "Clear this subject": "Clear this subject",
  "জাতীয় পরিচয়পত্রধারীর নাম (বাংলা/ইংরেজি) এবং জন্মতারিখ সংশোধনের ক্ষেত্রে, উক্ত সংশোধনের স্বপক্ষে, ক্ষেত্রমত, নিম্নবর্ণিত কাগজপত্র/তথ্যাদি জমা দিতে হইবে, যথা:-":
    "6. For correction of the National ID card holder's name (Bangla/English) or date of birth, the following documents/information shall be submitted in support of the correction, as applicable:",
  "শিক্ষাগত যোগ্যতা ন্যূনতম এসএসসি/সমমান হইলে এসএসসি/সমমান সনদপত্র;":
    "(a) If the minimum educational qualification is SSC/equivalent, the SSC/equivalent certificate;",
  "শিক্ষাগত যোগ্যতা ন্যূনতম এসএসসি/সমমান না হইলে এবং তিনি সরকারি, স্বায়ত্তশাসিত, আধা-স্বায়ত্তশাসিত কিংবা সংবিধিবদ্ধ কোনো সংস্থার চাকুরীরত হইলে, চাকুরী বই/মাস্টার পেমেন্ট অর্ডার (এমপিও);":
    "(b) If the person does not have SSC/equivalent and works for a government, autonomous, semi-autonomous, or statutory organization, the service book/Master Pay Order (MPO);",
  "অন্যান্য ক্ষেত্রে, জাতীয় পরিচয়পত্রধারীর পাসপোর্ট/জন্ম নিবন্ধন সনদ/ড্রাইভিং লাইসেন্স/ট্রেড লাইসেন্স/কাবিননামার সত্যায়িত অনুলিপি;":
    "(c) In other cases, an attested copy of the National ID card holder's passport/birth registration certificate/driving licence/trade licence/marriage deed;",
  "নামের আমূল পরিবর্তনের ক্ষেত্রে, প্রার্থিত পরিবর্তনের যথার্থতা সম্পর্কে গ্রহণযোগ্য দলিলাদি [এসএসসি সনদ/পাসপোর্ট/চাকুরী বই/মাস্টার পেমেন্ট অর্ডার (এমপিও)/ড্রাইভিং লাইসেন্স, যাহার ক্ষেত্রে যেটি প্রযোজ্য] ছাড়াও ম্যাজিস্ট্রেট আদালতে সম্পাদিত হলফনামা ও জাতীয় দৈনিক পত্রিকায় প্রকাশিত বিজ্ঞপ্তির কপি;":
    "(d) For a major change of name, in addition to acceptable documents supporting the requested change [SSC certificate/passport/service book/MPO/driving licence, as applicable], an affidavit executed before a magistrate court and a copy of the notice published in a national daily newspaper;",
  "ধর্ম পরিবর্তনের কারণে নাম পরিবর্তনের ক্ষেত্রে, ম্যাজিস্ট্রেট আদালতে সম্পাদিত হলফনামা ও জাতীয় দৈনিক পত্রিকায় প্রকাশিত বিজ্ঞপ্তির কপি এবং আবেদনের যথার্থতা সম্পর্কে গ্রহণযোগ্য দলিলাদি (শিক্ষাগত যোগ্যতার সনদপত্র/পাসপোর্ট/ড্রাইভিং লাইসেন্স/জন্ম নিবন্ধন সনদ, ইত্যাদি যাহার ক্ষেত্রে যেটি প্রযোজ্য)।":
    "(e) For a name change due to change of religion, an affidavit executed before a magistrate court, a copy of the notice published in a national daily newspaper, and acceptable documents supporting the application (educational certificate/passport/driving licence/birth registration certificate, etc., as applicable).",
  "বিবাহ বা বিবাহ বিচ্ছেদ বা অন্য কোন কারণে কোনো মহিলা তাহার নামের সহিত স্বামীর নামের অংশ (টাইটেল) সংযোজন বা বিয়োজন বা সংশোধন করিতে চাহিলে, তাহাকে কাবিননামা/তালাকনামা/মৃত্যু সনদ/ম্যাজিস্ট্রেট আদালতে সম্পাদিত হলফনামা/বিবাহ বিচ্ছেদ ডিক্রির সত্যায়িত অনুলিপি জমা দিতে হইবে। এক্ষেত্রে দায়িত্বপ্রাপ্ত কর্মকর্তা, প্রয়োজনে, সরেজমিন তদন্ত করিতে পারিবেন।":
    "7. If a woman wants to add, remove, or correct her husband's name as part of her name because of marriage, divorce, or another reason, she must submit an attested copy of the marriage deed/divorce deed/death certificate/affidavit executed before a magistrate court/divorce decree. The authorized officer may conduct a field investigation where necessary.",
  "পিতা/মাতার নাম সংশোধনের ক্ষেত্রে, জাতীয় পরিচয়পত্রধারীর এসএসসি, এইচএসসি বা সমমান সনদপত্র (যদি উহাতে পিতা/মাতার নাম উল্লিখিত থাকে) এবং জাতীয় পরিচয়পত্রধারীর পিতা, মাতা, ভাই ও বোনের জাতীয় পরিচয়পত্রের সত্যায়িত অনুলিপি জমা দিতে হইবে। এক্ষেত্রে দায়িত্বপ্রাপ্ত কর্মকর্তা, প্রয়োজনে, সরেজমিন তদন্ত করিতে পারিবেন।":
    "8. For correction of a father’s or mother’s name, submit the National ID card holder’s SSC, HSC, or equivalent certificate (if the parent’s name is mentioned there) and attested copies of the National ID cards of the holder’s father, mother, brothers, and sisters. The authorized officer may conduct a field investigation where necessary.",
  "পিতা/মাতার নামের পূর্বে “মৃত” অভিব্যক্তিটি সংযোজন বা বিয়োজন করিতে চাহিলে, প্রযোজ্য ক্ষেত্রে, পিতা/মাতার মৃত্যু সনদের সত্যায়িত অনুলিপি বা তাহাদের জাতীয় পরিচয়পত্রের সত্যায়িত অনুলিপি ও জীবিত থাকিবার সমর্থনে সংশ্লিষ্ট এলাকার ইউপি চেয়ারম্যান/পৌর মেয়র/কাউন্সিলরের প্রত্যয়নপত্র জমা দিতে হইবে।":
    "9. To add or remove the word “deceased” before a parent’s name, where applicable, submit an attested copy of the parent’s death certificate or attested copy of the parent’s National ID card and, as evidence that the parent is alive, a certificate from the relevant UP chairman/municipal mayor/councillor.",
  "ঠিকানা (বাসা/হোল্ডিং/গ্রাম/রাস্তা/ডাকঘর) সংশোধনের ক্ষেত্রে, সঠিক ঠিকানার স্বপক্ষে বাড়ির দলিল/টেলিফোন, গ্যাস বা পানির বিল/বাড়ি ভাড়ার চুক্তিপত্র/বাড়িভাড়া রশিদের সত্যায়িত অনুলিপি জমা দিতে হইবে।":
    "10. For correction of an address (house/holding/village/road/post office), submit an attested copy of the house deed/telephone, gas, or water bill/rent agreement/rent receipt in support of the correct address.",
  "রক্তের গ্রুপ সংযোজন বা সংশোধনের ক্ষেত্রে, উহার স্বপক্ষে ডাক্তারী সনদপত্র জমা দিতে হইবে।":
    "11. For adding or correcting a blood group, submit a medical certificate in support of it.",
  "শিক্ষাগত যোগ্যতা সংশোধনের জন্য জাতীয় পরিচয়পত্রধারীর সর্বোচ্চ শিক্ষাগত যোগ্যতার সনদপত্রের সত্যায়িত অনুলিপি জমা দিতে হইবে।":
    "12. For correction of educational qualification, submit an attested copy of the certificate for the National ID card holder’s highest educational qualification.",
  "টিআইএন/ড্রাইভিং লাইসেন্স নম্বর/পাসপোর্ট নম্বর সংশোধনের ক্ষেত্রে, প্রয়োজনে, টিআইএন সনদ/ড্রাইভিং লাইসেন্স/পাসপোর্টের সত্যায়িত অনুলিপি জমা দিতে হইবে।":
    "13. For correction of TIN/driving licence/passport numbers, where necessary, submit an attested copy of the TIN certificate/driving licence/passport.",
  "অন্যবিধ যে কোনো সংশোধনের ক্ষেত্রে, উক্তরূপ সংশোধনের স্বপক্ষে উপযুক্ত সনদ, দলিল ইত্যাদির সত্যায়িত অনুলিপি জমা দিতে হইবে।":
    "14. For any other correction, submit an attested copy of the appropriate certificate, document, or other evidence supporting the correction.",
  "আবেদনপত্রের সহিত দাখিলকৃত অনুলিপিসমূহ নিম্নবর্ণিত ব্যক্তিবর্গ সত্যায়ন করিতে পারিবেন: (ক) সংসদ সদস্য, (খ) স্থানীয় সরকারের নির্বাচিত জনপ্রতিনিধি, (গ) গেজেটেড সরকারি কর্মকর্তা, এবং (ঘ) মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা প্রতিষ্ঠানের প্রধান।":
    "15. Copies submitted with the application may be attested by the following persons: (a) a Member of Parliament, (b) an elected local government representative, (c) a gazetted government officer, and (d) the head of a secondary or higher secondary educational institution.",
  "অসম্পূর্ণ বা ত্রুটিপূর্ণ আবেদন বাতিল বলিয়া গণ্য হইবে।":
    "16. An incomplete or defective application will be considered cancelled.",
  "জাতীয় পরিচয়পত্রধারীর নাম (বাংলা)": "Name (Bangla)",
  "জাতীয় পরিচয়পত্রধারীর নাম (ইংরেজি)": "Name (English)",
  "পিতার নাম": "Father's name",
  "মাতার নাম": "Mother's name",
  "স্বামীর নাম": "Spouse's name",
  জন্মতারিখ: "Date of birth",
  ঠিকানা: "Address",
  "রক্তের গ্রুপ": "Blood group",
  অন্যান্য: "Other",
  "নাম (বাংলা)": "Name (Bangla)",
  "নাম (ইংরেজি)": "Name (English)",
  "(ক) নাম": "(a) Name",
  "(খ) জাতীয় পরিচিতি নম্বর (NID)": "(b) National Identification Number (NID)",
  "আবেদনকারীর স্বাক্ষর/টিপসহি": "Applicant's signature/thumb impression",
  "আইনানুগ অভিভাবকের স্বাক্ষর/টিপসহি (প্রযোজ্য ক্ষেত্রে)":
    "Legal guardian's signature/thumb impression (where applicable)",
  "প্রবিধান ৪ (৪) (খ) দ্রষ্টব্য": "[See Regulation 4(4)(b)]",
  "প্রবিধান ৪(৩) দ্রষ্টব্য": "[See Regulation 4(3)]",
  "প্রবিধান ৪(৪) (খ) দ্রষ্টব্য": "[See Regulation 4(4)(b)]",
  "জাতীয় পরিচয়পত্রধারীর নাম (বাংলা/ইংরেজি)": "Name (Bangla/English)",
  "(১) আবেদনকারীর নাম এবং জাতীয় পরিচিতি নম্বর":
    "(1) Applicant's name and National Identification Number",
  "(২) প্রযোজ্য ক্ষেত্রে, আইনানুগ অভিভাবকের নাম এবং জাতীয় পরিচিতি নম্বর":
    "(2) Where applicable, legal guardian's name and National Identification Number",
  "(৩) আবেদনের তারিখ": "(3) Application date",
  "(৪) পরবর্তী যোগাযোগের তারিখ/জাতীয় পরিচয়পত্র প্রদানের তারিখ":
    "(4) Next contact date/National ID card issuance date",
  "(৪) বায়োমেট্রিক্স ফিচার প্রদানের নিমিত্ত উপস্থিতির স্থান, তারিখ ও সময়":
    "(4) Place, date, and time to appear for biometric features",
  "আবেদনপত্রে প্রদত্ত আবেদনকারীর স্বাক্ষর কমিশনে সংরক্ষিত তথ্য-উপাত্তে আবেদনকারীর স্বাক্ষরের অনুরূপ হইতে হইবে।":
    "1. The applicant's signature on the application must match the signature in the information and data preserved by the Commission.",
  "আঠারো বৎসরের কম বয়স্ক কিংবা আদালত কর্তৃক অপ্রকৃতিস্থ ঘোষিত জাতীয় পরিচয়পত্রধারীর ক্ষেত্রে, আইনানুগ অভিভাবক অত্র আবেদনপত্রে স্বাক্ষর করিবেন এবং আবেদনপত্রের সহিত উক্ত অভিভাবকের জাতীয় পরিচয়পত্রের অনুলিপি অবশ্যই জমা দিতে হইবে।":
    "2. For a National ID card holder under 18 years of age or declared mentally incompetent by a court, the lawful guardian shall sign this application, and a copy of the guardian's National ID card must be submitted with the application.",
  "প্রবিধান ১১ এর উপ-প্রবিধান (১) এর ক্রমিক নং ১ বা, প্রযোজ্য ক্ষেত্রে, ২ এ উল্লিখিত ফি ও উহাতে বর্ণিত পদ্ধতি অনুসারে জমাদানের পর উহার রশিদ সংযুক্ত/তথ্যাদি প্রদান করিতে হইবে।":
    "3. After payment of the fee specified in serial 1 of sub-regulation (1) of Regulation 11 or, where applicable, serial 2, the receipt/details must be attached or provided in accordance with the prescribed procedure.",
  "আবেদনপত্রের সহিত জাতীয় পরিচয়পত্রধারীর জাতীয় পরিচয়পত্রের মূল কপি জমা দিতে হইবে।":
    "4. The original National ID card of the holder must be submitted with the application.",
  "আবেদনপত্র দাখিলের সময় দায়িত্বপ্রাপ্ত কর্মকর্তা আবেদনের বিষয়ে আবেদনকারীর ব্যক্তিগত শুনানি গ্রহণ করিবেন এবং ব্যক্তিগত শুনানি গ্রহণ করিয়া সন্তুষ্ট না হইয়া উক্ত আবেদন নামঞ্জুর করিলে উক্ত নামঞ্জুরের আদেশ প্রাপ্তির তারিখ হইতে ৪৫ (পঁয়তাল্লিশ) কার্যদিবসের মধ্যে আবেদনকারী বা, ক্ষেত্রমত, তাহার আইনানুগ অভিভাবক উক্ত আদেশের বিরুদ্ধে কমিশন বরাবর আপিল করিতে পারিবেন।":
    "5. At the time of submitting the application, the authorized officer will conduct a personal hearing of the applicant. If the application is rejected because the officer is not satisfied after the hearing, the applicant or, where applicable, the lawful guardian may appeal to the Commission within 45 (forty-five) working days from the date of receiving the rejection order.",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
  "১০": "10",
  "১১": "11",
  "১২": "12",
  "১৩": "13",
  "১৪": "14",
  "১৫": "15",
  "১৬": "16",
  ক: "a",
  খ: "b",
  গ: "c",
  ঘ: "d",
  ঙ: "e",
  চ: "f",
  ছ: "g",
  জ: "h",
  ঝ: "i",
};

/**
 * Exact English → Bangla translations for all visible UI copy on this page.
 * The shared translator remains the language source, but page copy is translated
 * as complete phrases so we never produce mixed strings such as “কার্ড holder নাম”.
 */
const NID_EN_TO_BN: Record<string, string> = {
  "NID Information Correction Form": "জাতীয় পরিচয়পত্রের তথ্য সংশোধন ফর্ম",
  "Sohoz Tools": "সহজ টুলস",
  "General Tools": "সাধারণ টুলস",
  Free: "বিনামূল্যে",
  Used: "ব্যবহার হয়েছে",
  time: "বার",
  times: "বার",
  Breadcrumb: "ব্রেডক্রাম্ব",
  "Fill in your details on the left — see a live Form-2 on the right and download it as PDF.":
    "বাম পাশে আপনার তথ্য পূরণ করুন—ডান পাশে ফর্ম-২-এর সরাসরি পূর্বরূপ দেখুন এবং PDF হিসেবে ডাউনলোড করুন।",
  "Add to favorites": "পছন্দের তালিকায় যোগ করুন",
  "Remove from favorites": "পছন্দের তালিকা থেকে সরিয়ে দিন",
  Share: "শেয়ার করুন",
  "National ID card holder": "জাতীয় পরিচয়পত্রধারী",
  "Card holder name": "কার্ডধারীর নাম",
  "Name as printed on the NID": "NID-এ যেভাবে নামটি মুদ্রিত আছে",
  "National ID (NID) number": "জাতীয় পরিচয়পত্রের (NID) নম্বর",
  "National ID number": "জাতীয় পরিচয়পত্রের নম্বর",
  "Legal guardian (where applicable)": "আইনানুগ অভিভাবক (প্রযোজ্য ক্ষেত্রে)",
  "Only for a holder under 18 or declared incapable by a court.":
    "শুধু ১৮ বছরের কম বয়সী অথবা আদালত কর্তৃক অপ্রকৃতিস্থ ঘোষিত জাতীয় পরিচয়পত্রধারীর ক্ষেত্রে।",
  "Legal guardian name": "আইনানুগ অভিভাবকের নাম",
  "Guardian name": "অভিভাবকের নাম",
  "Guardian's National ID (NID) number":
    "অভিভাবকের জাতীয় পরিচয়পত্রের (NID) নম্বর",
  "Guardian NID number": "অভিভাবকের NID নম্বর",
  "Information to be corrected": "সংশোধনযোগ্য তথ্য",
  "Open only the subjects you want corrected. The rest stay blank on the printed form.":
    "যে তথ্যগুলো সংশোধন করতে চান শুধু সেগুলো খুলে পূরণ করুন। মুদ্রিত ফর্মে বাকি ঘরগুলো খালি থাকবে।",
  "Name (Bangla)": "নাম (বাংলা)",
  "Name (English)": "নাম (ইংরেজি)",
  "Father's name": "পিতার নাম",
  "Mother's name": "মাতার নাম",
  "Spouse's name": "স্বামী/স্ত্রীর নাম",
  "Date of birth": "জন্মতারিখ",
  Address: "ঠিকানা",
  "Blood group": "রক্তের গ্রুপ",
  Other: "অন্যান্য",
  "Fill in": "পূরণ করুন",
  Filled: "পূরণ করা হয়েছে",
  Close: "বন্ধ করুন",
  "What the NID says now": "NID-এ বর্তমানে যে তথ্য আছে",
  "Corrected value requested": "প্রস্তাবিত সংশোধিত তথ্য",
  "Attached documents / remarks": "সংযুক্ত কাগজপত্র / মন্তব্য",
  "Documents you are attaching": "আপনি যে কাগজপত্র সংযুক্ত করছেন",
  "This subject appears in the correction table.":
    "এই তথ্যটি সংশোধনের টেবিলে দেখানো হবে।",
  "Clear this subject": "এই তথ্যের ঘরগুলো পরিষ্কার করুন",
  "No subject is ready yet — fill in both sides of at least one subject.":
    "এখনও কোনো তথ্য প্রস্তুত নয়—কমপক্ষে একটি তথ্যের বর্তমান ও সংশোধিত, উভয় ঘর পূরণ করুন।",
  "Fee and attached documents": "ফি ও সংযুক্ত কাগজপত্র",
  "Fee paid": "জমাকৃত ফি",
  "e.g. BDT 230": "যেমন: ২৩০ টাকা",
  "Fee payment receipt": "ফি জমার রশিদ",
  "Receipt number / date": "রশিদ নম্বর / তারিখ",
  "List of attached documents": "সংযুক্ত কাগজপত্রের তালিকা",
  "e.g. SSC certificate, birth registration":
    "যেমন: এসএসসি সনদ, জন্মনিবন্ধন সনদ",
  "Applicant signature block": "আবেদনকারীর স্বাক্ষরের অংশ",
  "Guardian signature block (where applicable)":
    "অভিভাবকের স্বাক্ষরের অংশ (প্রযোজ্য ক্ষেত্রে)",
  "Fill this in only if the guardian signs the application.":
    "অভিভাবক আবেদনপত্রে স্বাক্ষর করলে শুধু তখন এটি পূরণ করুন।",
  "Applicant name": "আবেদনকারীর নাম",
  "Applicant address": "আবেদনকারীর ঠিকানা",
  "Applicant mobile number": "আবেদনকারীর মোবাইল নম্বর",
  "Applicant e-mail": "আবেদনকারীর ই-মেইল",
  "Guardian address": "অভিভাবকের ঠিকানা",
  "Guardian mobile number": "অভিভাবকের মোবাইল নম্বর",
  "Guardian e-mail": "অভিভাবকের ই-মেইল",
  "Village / road, post office, upazila, district":
    "গ্রাম / সড়ক, ডাকঘর, উপজেলা, জেলা",
  "01783666743": "০১৭৮৩৬৬৬৭৪৩",
  "Live preview": "লাইভ পূর্বরূপ",
  "Zoom out": "ছোট করে দেখুন",
  "Zoom in": "বড় করে দেখুন",
  "Fit to width": "প্রস্থ অনুযায়ী মানিয়ে নিন",
  Empty: "খালি",
  Live: "লাইভ",
  Page: "পৃষ্ঠা",
  of: "এর মধ্যে",
  "Important information and instructions:": "গুরুত্বপূর্ণ তথ্য ও নির্দেশনা:",
  "Attach the following documents with the application:":
    "আবেদনের সঙ্গে নিচের কাগজপত্রগুলো সংযুক্ত করুন:",
  "The original National ID card must be submitted with the application.":
    "আবেদনের সঙ্গে মূল জাতীয় পরিচয়পত্র জমা দিতে হবে।",
  "To correct a name (Bangla/English) or date of birth: the SSC or equivalent certificate; otherwise an attested copy of a passport, birth registration, driving licence, or marriage deed.":
    "নাম (বাংলা/ইংরেজি) বা জন্মতারিখ সংশোধনের জন্য এসএসসি বা সমমানের সনদ দিতে হবে; অন্যথায় পাসপোর্ট, জন্মনিবন্ধন, ড্রাইভিং লাইসেন্স বা কাবিননামার সত্যায়িত অনুলিপি দিতে হবে।",
  "To correct a father's or mother's name: SSC/HSC certificates plus attested copies of the NIDs of the father, mother, brothers and sisters.":
    "পিতা বা মাতার নাম সংশোধনের জন্য এসএসসি/এইচএসসি সনদ এবং পিতা, মাতা, ভাই ও বোনের NID-এর সত্যায়িত অনুলিপি দিতে হবে।",
  "To add or drop a husband's name (title): an attested copy of the marriage deed, divorce deed, death certificate or affidavit.":
    "স্বামীর নামের অংশ (টাইটেল) সংযোজন বা বাদ দেওয়ার জন্য কাবিননামা, তালাকনামা, মৃত্যু সনদ অথবা হলফনামার সত্যায়িত অনুলিপি দিতে হবে।",
  "To correct an address: the house deed, an electricity, gas or water bill, or a rent agreement or receipt.":
    "ঠিকানা সংশোধনের জন্য বাড়ির দলিল, বিদ্যুৎ/গ্যাস/পানির বিল অথবা বাড়িভাড়ার চুক্তিপত্র/রশিদের অনুলিপি দিতে হবে।",
  "To add or correct a blood group: a doctor's certificate.":
    "রক্তের গ্রুপ সংযোজন বা সংশোধনের জন্য চিকিৎসকের সনদ দিতে হবে।",
  "Where applicable, the fee payment receipt and a copy of the guardian's NID.":
    "প্রযোজ্য ক্ষেত্রে ফি জমার রশিদ এবং অভিভাবকের NID-এর অনুলিপি দিতে হবে।",
  "Fill in every field accurately. An incomplete or incorrect application is treated as cancelled.":
    "প্রতিটি ঘর সঠিকভাবে পূরণ করুন। অসম্পূর্ণ বা ভুল আবেদন বাতিল বলে গণ্য হবে।",
  "Print the completed Form-2, sign it, and submit it to your upazila / thana election office.":
    "সম্পূর্ণ ফর্ম-২ প্রিন্ট করে স্বাক্ষর করুন এবং আপনার উপজেলা/থানা নির্বাচন কার্যালয়ে জমা দিন।",
  "Clear all": "সব মুছে ফেলুন",
  Restore: "পুনরুদ্ধার করুন",
  "last application": "সর্বশেষ আবেদন",
  Print: "প্রিন্ট করুন",
  "Preparing…": "প্রস্তুত করা হচ্ছে…",
  "Download PDF": "PDF ডাউনলোড করুন",
  "Nothing saved yet": "এখনও কিছু সংরক্ষণ করা হয়নি",
  Saved: "সংরক্ষিত",
  "card holder name": "কার্ডধারীর নাম",
  "NID number": "NID নম্বর",
  "one subject with both sides filled":
    "অন্তত একটি তথ্যের বর্তমান ও সংশোধিত—উভয় ঘর পূরণ করা",
  "Add an input to get started": "শুরু করতে একটি তথ্য দিন",
  "Still needed": "এখনও প্রয়োজন",
  "Form complete — download or print your application.":
    "ফর্ম সম্পূর্ণ হয়েছে—আবেদনটি ডাউনলোড বা প্রিন্ট করুন।",
  "Form cleared.": "ফর্মের সব তথ্য মুছে ফেলা হয়েছে।",
  "Form cleared — use “Restore last application” to bring it back.":
    "ফর্মের সব তথ্য মুছে ফেলা হয়েছে—ফিরিয়ে আনতে “সর্বশেষ আবেদন” পুনরুদ্ধার করুন।",
  "No saved application found.": "সংরক্ষিত কোনো আবেদন পাওয়া যায়নি।",
  "Restored application saved": "সর্বশেষ সংরক্ষিত আবেদন পুনরুদ্ধার করা হয়েছে:",
  "PDF downloaded.": "PDF ডাউনলোড হয়েছে।",
  "Could not create the PDF. Please try again or use Print → Save as PDF.":
    "PDF তৈরি করা যায়নি। আবার চেষ্টা করুন অথবা প্রিন্ট করে “PDF হিসেবে সংরক্ষণ” নির্বাচন করুন।",
  "Link copied to clipboard.": "লিংক ক্লিপবোর্ডে কপি করা হয়েছে।",
  "The subject(s) is/are ready for correction.": "তথ্য সংশোধনের জন্য প্রস্তুত।",
  "Name (Bangla) — as it is now": "নাম (বাংলা)—বর্তমানে যেমন আছে",
  "Name (English) — as it is now": "নাম (ইংরেজি)—বর্তমানে যেমন আছে",
  "Father's name — as it is now": "পিতার নাম—বর্তমানে যেমন আছে",
  "Mother's name — as it is now": "মাতার নাম—বর্তমানে যেমন আছে",
  "Spouse's name — as it is now": "স্বামী/স্ত্রীর নাম—বর্তমানে যেমন আছে",
  "Date of birth — as it is now": "জন্মতারিখ—বর্তমানে যেমন আছে",
  "Address — as it is now": "ঠিকানা—বর্তমানে যেমন আছে",
  "Blood group — as it is now": "রক্তের গ্রুপ—বর্তমানে যেমন আছে",
  "Other — as it is now": "অন্যান্য—বর্তমানে যেমন আছে",
  "Name (Bangla) — as it should be": "নাম (বাংলা)—যেমন হওয়া উচিত",
  "Name (English) — as it should be": "নাম (ইংরেজি)—যেমন হওয়া উচিত",
  "Father's name — as it should be": "পিতার নাম—যেমন হওয়া উচিত",
  "Mother's name — as it should be": "মাতার নাম—যেমন হওয়া উচিত",
  "Spouse's name — as it should be": "স্বামী/স্ত্রীর নাম—যেমন হওয়া উচিত",
  "Date of birth — as it should be": "জন্মতারিখ—যেমন হওয়া উচিত",
  "Address — as it should be": "ঠিকানা—যেমন হওয়া উচিত",
  "Blood group — as it should be": "রক্তের গ্রুপ—যেমন হওয়া উচিত",
  "Other — as it should be": "অন্যান্য—যেমন হওয়া উচিত",
  "Legal guardian's signature/thumb impression (where applicable)":
    "আইনানুগ অভিভাবকের স্বাক্ষর/টিপসহি (প্রযোজ্য ক্ষেত্রে)",
  "Applicant's signature/thumb impression": "আবেদনকারীর স্বাক্ষর/টিপসহি",
  "name@example.com": "name@example.com",
};

function nidNorm(value: string) {
  return value
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function nidPreserveWhitespace(source: string, translated: string) {
  return `${source.match(/^\s*/)?.[0] ?? ""}${translated}${source.match(/\s*$/)?.[0] ?? ""}`;
}

function nidTranslateText(value: string, locale: string | undefined): string {
  const raw = String(value ?? "");
  const key = nidNorm(raw);
  const isBangla = String(locale ?? "")
    .toLowerCase()
    .startsWith("bn");
  if (!isBangla) {
    const english = NID_BN_TO_EN[key];
    return english ?? raw;
  }
  const bangla = NID_EN_TO_BN[key];
  if (bangla) return nidPreserveWhitespace(raw, bangla);
  if (isBanglaText(raw)) return raw;
  return raw;
}

function isBanglaText(value: string) {
  return /[\u0980-\u09FF]/.test(value);
}
function NidT({ children }: { children: ReactNode }) {
  const { locale } = useSohozI18n();
  if (typeof children !== "string") return <>{children}</>;
  return <>{nidTranslateText(children, locale)}</>;
}

/* -------------------------------------------------------------------------- */
/* State helpers                                                              */
/* -------------------------------------------------------------------------- */
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};
function sanitizeContact(v: unknown): Contact {
  const c = rec(v);
  return {
    name: str(c.name),
    address: str(c.address),
    mobile: str(c.mobile),
    email: str(c.email),
  };
}
/** Normalises any unknown value (e.g. parsed localStorage) into a valid FormState. */
function sanitizeForm(raw: unknown): FormState {
  const r = rec(raw);
  const subj = rec(r.subjects);
  const subjects = {} as Record<SubjectKey, SubjectValue>;
  for (const { key } of SUBJECTS) {
    const x = rec(subj[key]);
    subjects[key] = {
      current: str(x.current),
      corrected: str(x.corrected),
      remarks: str(x.remarks),
    };
  }
  return {
    cardHolderName: str(r.cardHolderName),
    nidNumber: str(r.nidNumber),
    guardianName: str(r.guardianName),
    guardianNid: str(r.guardianNid),
    subjects,
    feePaid: str(r.feePaid),
    receipt: str(r.receipt),
    attachments: str(r.attachments),
    applicant: sanitizeContact(r.applicant),
    guardianSign: sanitizeContact(r.guardianSign),
  };
}
const EMPTY_FORM: FormState = sanitizeForm({});
const EMPTY_JSON = JSON.stringify(EMPTY_FORM);
const isFormEmpty = (f: FormState) =>
  JSON.stringify(sanitizeForm(f)) === EMPTY_JSON;
const subjectHasValue = (v: SubjectValue) =>
  Boolean(v.current.trim() || v.corrected.trim() || v.remarks.trim());
function readLS(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLS(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode / quota) — ignore */
  }
}
function readSaved(): {
  savedAt: number;
  form: FormState;
} | null {
  const raw = readLS(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = rec(JSON.parse(raw));
    return {
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
      form: sanitizeForm(parsed.form),
    };
  } catch {
    return null;
  }
}
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
type Instruction = {
  n: string;
  t: string;
  sub?: boolean;
};
const INSTRUCTIONS: Instruction[] = [
  {
    n: "১",
    t: "আবেদনপত্রে প্রদত্ত আবেদনকারীর স্বাক্ষর কমিশনে সংরক্ষিত তথ্য-উপাত্তে আবেদনকারীর স্বাক্ষরের অনুরূপ হইতে হইবে।",
  },
  {
    n: "২",
    t: "আঠারো বৎসরের কম বয়স্ক কিংবা আদালত কর্তৃক অপ্রকৃতিস্থ ঘোষিত জাতীয় পরিচয়পত্রধারীর ক্ষেত্রে, আইনানুগ অভিভাবক অত্র আবেদনপত্রে স্বাক্ষর করিবেন এবং আবেদনপত্রের সহিত উক্ত অভিভাবকের জাতীয় পরিচয়পত্রের অনুলিপি অবশ্যই জমা দিতে হইবে।",
  },
  {
    n: "৩",
    t: "প্রবিধান ১১ এর উপ-প্রবিধান (১) এর ক্রমিক নং ১ বা, প্রযোজ্য ক্ষেত্রে, ২ এ উল্লিখিত ফি ও উহাতে বর্ণিত পদ্ধতি অনুসারে জমাদানের পর উহার রশিদ সংযুক্ত/তথ্যাদি প্রদান করিতে হইবে।",
  },
  {
    n: "৪",
    t: "আবেদনপত্রের সহিত জাতীয় পরিচয়পত্রধারীর জাতীয় পরিচয়পত্রের মূল কপি জমা দিতে হইবে।",
  },
  {
    n: "৫",
    t: "আবেদনপত্র দাখিলের সময় দায়িত্বপ্রাপ্ত কর্মকর্তা আবেদনের বিষয়ে আবেদনকারীর ব্যক্তিগত শুনানি গ্রহণ করিবেন এবং ব্যক্তিগত শুনানি গ্রহণ করিয়া সন্তুষ্ট না হইয়া উক্ত আবেদন নামঞ্জুর করিলে উক্ত নামঞ্জুরের আদেশ প্রাপ্তির তারিখ হইতে ৪৫ (পঁয়তাল্লিশ) কার্যদিবসের মধ্যে আবেদনকারী বা, ক্ষেত্রমত, তাহার আইনানুগ অভিভাবক উক্ত আদেশের বিরুদ্ধে কমিশন বরাবর আপিল করিতে পারিবেন।",
  },
  {
    n: "৬",
    t: "জাতীয় পরিচয়পত্রধারীর নাম (বাংলা/ইংরেজি) এবং জন্মতারিখ সংশোধনের ক্ষেত্রে, উক্ত সংশোধনের স্বপক্ষে, ক্ষেত্রমত, নিম্নবর্ণিত কাগজপত্র/তথ্যাদি জমা দিতে হইবে, যথা:-",
  },
  {
    n: "ক",
    sub: true,
    t: "শিক্ষাগত যোগ্যতা ন্যূনতম এসএসসি/সমমান হইলে এসএসসি/সমমান সনদপত্র;",
  },
  {
    n: "খ",
    sub: true,
    t: "শিক্ষাগত যোগ্যতা ন্যূনতম এসএসসি/সমমান না হইলে এবং তিনি সরকারি, স্বায়ত্তশাসিত, আধা-স্বায়ত্তশাসিত কিংবা সংবিধিবদ্ধ কোনো সংস্থার চাকুরীরত হইলে, চাকুরী বই/মাস্টার পেমেন্ট অর্ডার (এমপিও);",
  },
  {
    n: "গ",
    sub: true,
    t: "অন্যান্য ক্ষেত্রে, জাতীয় পরিচয়পত্রধারীর পাসপোর্ট/জন্ম নিবন্ধন সনদ/ড্রাইভিং লাইসেন্স/ট্রেড লাইসেন্স/কাবিননামার সত্যায়িত অনুলিপি;",
  },
  {
    n: "ঘ",
    sub: true,
    t: "নামের আমূল পরিবর্তনের ক্ষেত্রে, প্রার্থিত পরিবর্তনের যথার্থতা সম্পর্কে গ্রহণযোগ্য দলিলাদি [এসএসসি সনদ/পাসপোর্ট/চাকুরী বই/মাস্টার পেমেন্ট অর্ডার (এমপিও)/ড্রাইভিং লাইসেন্স, যাহার ক্ষেত্রে যেটি প্রযোজ্য] ছাড়াও ম্যাজিস্ট্রেট আদালতে সম্পাদিত হলফনামা ও জাতীয় দৈনিক পত্রিকায় প্রকাশিত বিজ্ঞপ্তির কপি;",
  },
  {
    n: "ঙ",
    sub: true,
    t: "ধর্ম পরিবর্তনের কারণে নাম পরিবর্তনের ক্ষেত্রে, ম্যাজিস্ট্রেট আদালতে সম্পাদিত হলফনামা ও জাতীয় দৈনিক পত্রিকায় প্রকাশিত বিজ্ঞপ্তির কপি এবং আবেদনের যথার্থতা সম্পর্কে গ্রহণযোগ্য দলিলাদি (শিক্ষাগত যোগ্যতার সনদপত্র/পাসপোর্ট/ড্রাইভিং লাইসেন্স/জন্ম নিবন্ধন সনদ, ইত্যাদি যাহার ক্ষেত্রে যেটি প্রযোজ্য)।",
  },
  {
    n: "৭",
    t: "বিবাহ বা বিবাহ বিচ্ছেদ বা অন্য কোন কারণে কোনো মহিলা তাহার নামের সহিত স্বামীর নামের অংশ (টাইটেল) সংযোজন বা বিয়োজন বা সংশোধন করিতে চাহিলে, তাহাকে কাবিননামা/তালাকনামা/মৃত্যু সনদ/ম্যাজিস্ট্রেট আদালতে সম্পাদিত হলফনামা/বিবাহ বিচ্ছেদ ডিক্রির সত্যায়িত অনুলিপি জমা দিতে হইবে। এক্ষেত্রে দায়িত্বপ্রাপ্ত কর্মকর্তা, প্রয়োজনে, সরেজমিন তদন্ত করিতে পারিবেন।",
  },
  {
    n: "৮",
    t: "পিতা/মাতার নাম সংশোধনের ক্ষেত্রে, জাতীয় পরিচয়পত্রধারীর এসএসসি, এইচএসসি বা সমমান সনদপত্র (যদি উহাতে পিতা/মাতার নাম উল্লিখিত থাকে) এবং জাতীয় পরিচয়পত্রধারীর পিতা, মাতা, ভাই ও বোনের জাতীয় পরিচয়পত্রের সত্যায়িত অনুলিপি জমা দিতে হইবে। এক্ষেত্রে দায়িত্বপ্রাপ্ত কর্মকর্তা, প্রয়োজনে, সরেজমিন তদন্ত করিতে পারিবেন।",
  },
  {
    n: "৯",
    t: "পিতা/মাতার নামের পূর্বে “মৃত” অভিব্যক্তিটি সংযোজন বা বিয়োজন করিতে চাহিলে, প্রযোজ্য ক্ষেত্রে, পিতা/মাতার মৃত্যু সনদের সত্যায়িত অনুলিপি বা তাহাদের জাতীয় পরিচয়পত্রের সত্যায়িত অনুলিপি ও জীবিত থাকিবার সমর্থনে সংশ্লিষ্ট এলাকার ইউপি চেয়ারম্যান/পৌর মেয়র/কাউন্সিলরের প্রত্যয়নপত্র জমা দিতে হইবে।",
  },
  {
    n: "১০",
    t: "ঠিকানা (বাসা/হোল্ডিং/গ্রাম/রাস্তা/ডাকঘর) সংশোধনের ক্ষেত্রে, সঠিক ঠিকানার স্বপক্ষে বাড়ির দলিল/টেলিফোন, গ্যাস বা পানির বিল/বাড়ি ভাড়ার চুক্তিপত্র/বাড়িভাড়া রশিদের সত্যায়িত অনুলিপি জমা দিতে হইবে।",
  },
  {
    n: "১১",
    t: "রক্তের গ্রুপ সংযোজন বা সংশোধনের ক্ষেত্রে, উহার স্বপক্ষে ডাক্তারী সনদপত্র জমা দিতে হইবে।",
  },
  {
    n: "১২",
    t: "শিক্ষাগত যোগ্যতা সংশোধনের জন্য জাতীয় পরিচয়পত্রধারীর সর্বোচ্চ শিক্ষাগত যোগ্যতার সনদপত্রের সত্যায়িত অনুলিপি জমা দিতে হইবে।",
  },
  {
    n: "১৩",
    t: "টিআইএন/ড্রাইভিং লাইসেন্স নম্বর/পাসপোর্ট নম্বর সংশোধনের ক্ষেত্রে, প্রয়োজনে, টিআইএন সনদ/ড্রাইভিং লাইসেন্স/পাসপোর্টের সত্যায়িত অনুলিপি জমা দিতে হইবে।",
  },
  {
    n: "১৪",
    t: "অন্যবিধ যে কোনো সংশোধনের ক্ষেত্রে, উক্তরূপ সংশোধনের স্বপক্ষে উপযুক্ত সনদ, দলিল ইত্যাদির সত্যায়িত অনুলিপি জমা দিতে হইবে।",
  },
  {
    n: "১৫",
    t: "আবেদনপত্রের সহিত দাখিলকৃত অনুলিপিসমূহ নিম্নবর্ণিত ব্যক্তিবর্গ সত্যায়ন করিতে পারিবেন: (ক) সংসদ সদস্য, (খ) স্থানীয় সরকারের নির্বাচিত জনপ্রতিনিধি, (গ) গেজেটেড সরকারি কর্মকর্তা, এবং (ঘ) মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা প্রতিষ্ঠানের প্রধান।",
  },
  { n: "১৬", t: "অসম্পূর্ণ বা ত্রুটিপূর্ণ আবেদন বাতিল বলিয়া গণ্য হইবে।" },
];
/* -------------------------------------------------------------------------- */
/* Styles (preview page + print rules)                                        */
/* -------------------------------------------------------------------------- */
const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&display=swap');

.nid-page{width:${PAGE_W}px;box-sizing:border-box;background:#fff;color:#0F172A;
  font-family:'Noto Serif Bengali','Siyam Rupali','Kalpurush','Nirmala UI','Noto Sans Bengali',serif;font-size:12px;line-height:1.5}
.nid-sheet{width:${PAGE_W}px;min-height:${PAGE_H}px;box-sizing:border-box;padding:58px 64px 46px;background:#fff;position:relative}
.nid-preview .nid-sheet+.nid-sheet{border-top:1px solid #E2E8F0}
.nid-page *{box-sizing:border-box}
.nid-page b{font-weight:700}
.nid-c{text-align:center}
.nid-u{text-decoration:underline;text-underline-offset:3px}
.nid-sn{text-align:right;margin:10px 0 12px}
.nid-h{margin:10px 0 2px}
.nid-row{display:flex;align-items:flex-end;margin:5px 0 5px 6px}
.nid-row>.l{flex:0 0 172px}
.nid-row>.c{flex:0 0 14px}
.nid-row>.v{flex:1;border-bottom:1px dotted #333;min-height:19px;padding:0 4px 1px;font-weight:700;word-break:break-word;white-space:pre-wrap}
.nid-tbl{width:100%;border-collapse:collapse;table-layout:fixed;margin:9px 0 10px}
.nid-tbl th,.nid-tbl td{border:1.5px solid #222;padding:4px 7px;word-break:break-word}
.nid-tbl th{font-weight:400;text-decoration:underline;text-underline-offset:3px;text-align:center;line-height:1.35}
.nid-tbl td{height:30px;vertical-align:middle}
.nid-tbl td.s{padding-left:24px}
.nid-tbl td.v{font-weight:700;white-space:pre-wrap}
.nid-tbl tr{break-inside:avoid}
.nid-item{margin:8px 0;word-break:break-word}
.nid-sig{display:grid;grid-template-columns:1.05fr 1fr;gap:24px;margin:24px 0 12px}
.nid-sig .ln{width:120px;border-top:1.5px dashed #222;margin-bottom:3px}
.nid-sig .f{margin:1px 0;word-break:break-word;white-space:pre-wrap}
.nid-sig .addr{min-height:36px}
.nid-sig .gap{height:18px}
.nid-sep{border-top:1px dotted #333;margin:10px 6% 14px}
.nid-rc{display:flex;margin:4px 0 4px 26px}
.nid-rc>.l{flex:0 0 322px}
.nid-rc>.c{flex:0 0 14px}
.nid-rc>.v{flex:1;font-weight:700;word-break:break-word}
.nid-end{display:flex;justify-content:space-between;align-items:flex-end;margin:34px 10px 0 96px}
.nid-end .ln{width:110px;border-top:1.5px dashed #222;margin:0 0 3px auto}
.nid-ins-t{text-align:center;margin:8px 0 12px}
.nid-in{display:flex;margin:0 0 5px;font-size:11px;line-height:1.5}
.nid-in>.n{flex:0 0 30px}
.nid-in>.t{flex:1;text-align:justify;word-break:break-word}
.nid-in.sub{margin-left:30px}
.nid-in.sub>.n{flex:0 0 28px}
.nid-rcpt{margin-top:16px}
.nid-rl{display:flex;align-items:flex-end;margin:5px 0 5px 4px;font-size:11.5px}
.nid-rl>.l{flex:0 0 290px}
.nid-rl>.c{flex:0 0 14px}
.nid-rl>.d{flex:1;border-bottom:1px dotted #333;min-height:18px}
.nid-print-root{position:fixed;left:-10000px;top:0;width:${PAGE_W}px;pointer-events:none;z-index:-1}

@media print{
  @page{size:A4;margin:0}
  html,body{background:#fff !important;margin:0 !important;padding:0 !important}
  body>*:not(#${PRINT_ID}){display:none !important}
  #${PRINT_ID}{position:static !important;left:auto !important;width:210mm !important}
  #${PRINT_ID} .nid-page{width:210mm;background:#fff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  #${PRINT_ID} .nid-sheet{width:210mm;height:296mm;min-height:0;overflow:hidden;padding:26px 64px 10px;background:#fff !important;break-inside:avoid;page-break-inside:avoid}
  #${PRINT_ID} .nid-sheet+.nid-sheet{break-before:page;page-break-before:always}
  #${PRINT_ID} .nid-sheet:last-child{break-after:auto;page-break-after:auto}
  #${PRINT_ID} .nid-sn{margin:6px 0 8px}
  #${PRINT_ID} .nid-h{margin:6px 0 2px}
  #${PRINT_ID} .nid-row{margin:3px 0 3px 6px}
  #${PRINT_ID} .nid-tbl{margin:6px 0 6px}
  #${PRINT_ID} .nid-tbl td{height:26px}
  #${PRINT_ID} .nid-item{margin:5px 0}
  #${PRINT_ID} .nid-sig{margin:12px 0 4px}
  #${PRINT_ID} .nid-sig .gap{height:10px}
  #${PRINT_ID} .nid-sep{margin:6px 6% 8px}
  #${PRINT_ID} .nid-rc{margin:3px 0 3px 26px}
  #${PRINT_ID} .nid-end{margin-top:14px}
}
`;
/* -------------------------------------------------------------------------- */
/* The Form-2 document (used for preview, print & PDF)                        */
/* -------------------------------------------------------------------------- */
function LeaderRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="nid-row">
      <span className="l">
        <NidT>{label}</NidT>
      </span>
      <span className="c">
        <NidT>{":"}</NidT>
      </span>
      <span className="v">{value}</span>
    </div>
  );
}
function ReceiptRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="nid-rc">
      <span className="l">
        <NidT>{label}</NidT>
      </span>
      <span className="c">
        <NidT>{":"}</NidT>
      </span>
      <span className="v">{value}</span>
    </div>
  );
}
function SigBlock({ title, contact }: { title: string; contact: Contact }) {
  return (
    <div>
      <div className="ln" />
      <div>
        <NidT>{title}</NidT>
      </div>
      <div className="f">
        <NidT>{"\u09A8\u09BE\u09AE\u0983 "}</NidT>
        <b>{contact.name}</b>
      </div>
      <div className="f addr">
        <NidT>{"\u09A0\u09BF\u0995\u09BE\u09A8\u09BE\u0983 "}</NidT>
        <b>{contact.address}</b>
      </div>
      <div className="gap" />
      <div className="f">
        <NidT>
          {
            "\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09A8\u09AE\u09CD\u09AC\u09B0\u0983 "
          }
        </NidT>
        <b>{contact.mobile}</b>
      </div>
      <div className="f">
        <NidT>
          {
            "\u0987-\u09AE\u09C7\u0987\u09B2 (\u09AF\u09A6\u09BF \u09A5\u09BE\u0995\u09C7): "
          }
        </NidT>
        <b>{contact.email}</b>
      </div>
    </div>
  );
}
function FormPage({ form }: { form: FormState }) {
  const holder = [form.cardHolderName.trim(), form.nidNumber.trim()]
    .filter(Boolean)
    .join(", ");
  const guardian = [form.guardianName.trim(), form.guardianNid.trim()]
    .filter(Boolean)
    .join(", ");
  return (
    <div className="nid-page">
      {/* ------------------------------ Page 1 ------------------------------ */}
      <div className="nid-sheet">
        <div className="nid-c" style={{ marginTop: 30 }}>
          <div>
            <NidT>{"\u09AB\u09B0\u09AE-\u09E8"}</NidT>
          </div>
          <div>
            <NidT>
              {
                "[\u09AA\u09CD\u09B0\u09AC\u09BF\u09A7\u09BE\u09A8 \u09EA \u09A6\u09CD\u09B0\u09B7\u09CD\u099F\u09AC\u09CD\u09AF]"
              }
            </NidT>
          </div>
          <div className="nid-u">
            <NidT>
              {
                "\u099C\u09BE\u09A4\u09C0\u09AF\u09BC \u09AA\u09B0\u09BF\u099A\u09AF\u09BC\u09AA\u09A4\u09CD\u09B0 \u09AC\u09BE \u09A4\u09A5\u09CD\u09AF-\u0989\u09AA\u09BE\u09A4\u09CD\u09A4 \u09B8\u0982\u09B6\u09CB\u09A7\u09A8\u09C7\u09B0 \u0986\u09AC\u09C7\u09A6\u09A8\n          "
              }
            </NidT>
          </div>
        </div>
        <div className="nid-sn">
          <NidT>
            {
              "\u0995\u09CD\u09B0\u09AE\u09BF\u0995 \u09A8\u09AE\u09CD\u09AC\u09B0 : ................ (\u0985\u09AB\u09BF\u09B8 \u0995\u09B0\u09CD\u09A4\u09C3\u0995 \u09AA\u09C2\u09B0\u09A3\u09C0\u09AF\u09BC)\n        "
            }
          </NidT>
        </div>

        <div className="nid-h">
          <NidT>
            {
              "\u09E7\u0964 \u099C\u09BE\u09A4\u09C0\u09AF\u09BC \u09AA\u09B0\u09BF\u099A\u09AF\u09BC\u09AA\u09A4\u09CD\u09B0\u09A7\u09BE\u09B0\u09C0\u09B0-"
            }
          </NidT>
        </div>
        <LeaderRow label="(ক) নাম" value={form.cardHolderName} />
        <LeaderRow
          label="(খ) জাতীয় পরিচিতি নম্বর (NID)"
          value={form.nidNumber}
        />

        <div className="nid-h">
          <NidT>
            {
              "\u09E8\u0964 \u0986\u09A0\u09BE\u09B0\u09CB \u09AC\u09CE\u09B8\u09B0\u09C7\u09B0 \u0995\u09AE \u09AC\u09AF\u09BC\u09B8\u09CD\u0995/\u0986\u09A6\u09BE\u09B2\u09A4 \u0995\u09B0\u09CD\u09A4\u09C3\u0995 \u0985\u09AA\u09CD\u09B0\u0995\u09C3\u09A4\u09BF\u09B8\u09CD\u09A5 \u0998\u09CB\u09B7\u09BF\u09A4 \u099C\u09BE\u09A4\u09C0\u09AF\u09BC\n          \u09AA\u09B0\u09BF\u099A\u09AF\u09BC\u09AA\u09A4\u09CD\u09B0\u09A7\u09BE\u09B0\u09C0\u09B0 \u0995\u09CD\u09B7\u09C7\u09A4\u09CD\u09B0\u09C7, \u0986\u0987\u09A8\u09BE\u09A8\u09C1\u0997 \u0985\u09AD\u09BF\u09AD\u09BE\u09AC\u0995\u09C7\u09B0 -\n        "
            }
          </NidT>
        </div>
        <LeaderRow label="(ক) নাম" value={form.guardianName} />
        <LeaderRow
          label="(খ) জাতীয় পরিচিতি নম্বর (NID)"
          value={form.guardianNid}
        />

        <div className="nid-h" style={{ marginTop: 14 }}>
          <NidT>
            {
              "\u09E9\u0964 \u099C\u09BE\u09A4\u09C0\u09AF\u09BC \u09AA\u09B0\u09BF\u099A\u09AF\u09BC\u09AA\u09A4\u09CD\u09B0 \u09AC\u09BE \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09BF\u09A4 \u09A4\u09A5\u09CD\u09AF-\u0989\u09AA\u09BE\u09A4\u09CD\u09A4\u09C7 \u09AF\u09C7 \u09A4\u09A5\u09CD\u09AF \u09B8\u0982\u09B6\u09CB\u09A7\u09A8 \u0995\u09B0\u09BF\u09A4\u09C7\n          \u09B9\u0987\u09AC\u09C7 (\u0985\u09AA\u09CD\u09B0\u09AF\u09BC\u09CB\u099C\u09A8\u09C0\u09AF\u09BC \u0985\u0982\u09B6 \u0995\u09BE\u099F\u09BF\u09AF\u09BC\u09BE \u09A6\u09BF\u09A8):\n        "
            }
          </NidT>
        </div>
        <table className="nid-tbl">
          <colgroup>
            <col style={{ width: "21%" }} />
            <col style={{ width: "34%" }} />
            <col style={{ width: "26%" }} />
            <col style={{ width: "19%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>
                <NidT>{"\u09AC\u09BF\u09B7\u09AF\u09BC"}</NidT>
              </th>
              <th>
                <NidT>
                  {
                    "\u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8\u09C7 \u099C\u09BE\u09A4\u09C0\u09AF\u09BC \u09AA\u09B0\u09BF\u099A\u09AF\u09BC\u09AA\u09A4\u09CD\u09B0 \u09AC\u09BE \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09BF\u09A4 \u09A4\u09A5\u09CD\u09AF \u0989\u09AA\u09BE\u09A4\u09CD\u09A4\u09C7 \u09AC\u09BF\u09A6\u09CD\u09AF\u09AE\u09BE\u09A8\n                \u09A4\u09A5\u09CD\u09AF\n              "
                  }
                </NidT>
              </th>
              <th>
                <NidT>
                  {
                    "\u099A\u09BE\u09B9\u09BF\u09A4 \u09B8\u0982\u09B6\u09CB\u09A7\u09BF\u09A4 \u09A4\u09A5\u09CD\u09AF"
                  }
                </NidT>
              </th>
              <th>
                <NidT>
                  {
                    "\u09B8\u0982\u09AF\u09C1\u0995\u09CD\u09A4 \u09A6\u09B2\u09BF\u09B2\u09BE\u09A6\u09BF/\u09AE\u09A8\u09CD\u09A4\u09AC\u09CD\u09AF"
                  }
                </NidT>
              </th>
            </tr>
          </thead>
          <tbody>
            {SUBJECTS.map((s) => {
              const v = form.subjects[s.key];
              return (
                <tr key={s.key}>
                  <td className="s">
                    <NidT>{"("}</NidT>
                    <NidT>{s.letter}</NidT>
                    <NidT>{") "}</NidT>
                    <NidT>{s.bn}</NidT>
                  </td>
                  <td className="v">{v.current}</td>
                  <td className="v">{v.corrected}</td>
                  <td className="v">{v.remarks}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="nid-item">
          <NidT>
            {
              "\u09EA\u0964 \u099C\u09AE\u09BE\u0995\u09C3\u09A4 \u09AB\u09BF \u098F\u09B0 \u09AA\u09B0\u09BF\u09AE\u09BE\u09A3 (\u09E7\u09E7 \u098F\u09B0 \u0989\u09AA-\u09AA\u09CD\u09B0\u09AC\u09BF\u09A7\u09BE\u09A8 (\u09E7) \u098F\u09B0 \u0995\u09CD\u09B0\u09AE\u09BF\u0995 \u09A8\u0982 \u09E7 \u09AC\u09BE,\n          \u09AA\u09CD\u09B0\u09AF\u09CB\u099C\u09CD\u09AF \u0995\u09CD\u09B7\u09C7\u09A4\u09CD\u09B0\u09C7, \u09E8 \u098F \u0989\u09B2\u09CD\u09B2\u09BF\u0996\u09BF\u09A4 \u09AB\u09BF \u0985\u09A8\u09C1\u09B8\u09BE\u09B0\u09C7): "
            }
          </NidT>
          <b>{form.feePaid}</b>
        </div>
        <div className="nid-item">
          <NidT>
            {
              "\u09EB\u0964 \u09AA\u09CD\u09B0\u09AF\u09CB\u099C\u09CD\u09AF \u0995\u09CD\u09B7\u09C7\u09A4\u09CD\u09B0\u09C7 \u09AB\u09BF \u099C\u09AE\u09BE \u09A6\u09BE\u09A8\u09C7\u09B0 \u09B0\u09B6\u09BF\u09A6 : "
            }
          </NidT>
          <b>{form.receipt}</b>
        </div>
        <div className="nid-item">
          <NidT>
            {
              "\u09EC\u0964 \u0986\u09AC\u09C7\u09A6\u09A8\u09AA\u09A4\u09CD\u09B0\u09C7\u09B0 \u09B8\u09B9\u09BF\u09A4 \u09B8\u0982\u09AF\u09C1\u0995\u09CD\u09A4 \u09A6\u09B2\u09BF\u09B2\u09BE\u09A6\u09BF\u09B0 \u09AC\u09BF\u09AC\u09B0\u09A3: "
            }
          </NidT>
          <b>{form.attachments}</b>
        </div>

        <div className="nid-sig">
          <SigBlock
            title="Legal guardian's signature/thumb impression (where applicable)"
            contact={form.guardianSign}
          />
          <SigBlock
            title="Applicant's signature/thumb impression"
            contact={form.applicant}
          />
        </div>

        <div className="nid-sep" />

        <div className="nid-c">
          <div>
            <b>
              <NidT>
                {"\u0985\u0982\u09B6 - \u0996 (\u09AB\u09B0\u09AE-\u09E8)"}
              </NidT>
            </b>
          </div>
          <div className="nid-u">
            <NidT>
              {
                "\u099C\u09BE\u09A4\u09C0\u09AF\u09BC \u09AA\u09B0\u09BF\u099A\u09AF\u09BC\u09AA\u09A4\u09CD\u09B0 \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8\u09C7\u09B0 \u09B0\u09B6\u09BF\u09A6"
              }
            </NidT>
          </div>
          <div>
            <NidT>
              {
                "[\u09AA\u09CD\u09B0\u09AC\u09BF\u09A7\u09BE\u09A8 \u09EA (\u09EA) (\u0996) \u09A6\u09CD\u09B0\u09B7\u09CD\u099F\u09AC\u09CD\u09AF]"
              }
            </NidT>
          </div>
        </div>
        <div className="nid-sn" style={{ margin: "8px 0 10px" }}>
          <NidT>
            {
              "\u0995\u09CD\u09B0\u09AE\u09BF\u0995 \u09A8\u09AE\u09CD\u09AC\u09B0 : ................\n        "
            }
          </NidT>
        </div>

        <ReceiptRow
          label="(১) আবেদনকারীর নাম এবং জাতীয় পরিচিতি নম্বর"
          value={holder}
        />
        <ReceiptRow
          label="(২) প্রযোজ্য ক্ষেত্রে, আইনানুগ অভিভাবকের নাম এবং জাতীয় পরিচিতি নম্বর"
          value={guardian}
        />
        <ReceiptRow label="(৩) আবেদনের তারিখ" />
        <ReceiptRow label="(৪) পরবর্তী যোগাযোগের তারিখ/জাতীয় পরিচয়পত্র প্রদানের তারিখ" />

        <div className="nid-end">
          <span>
            <NidT>{"(\u09B8\u09BF\u09B2\u09AE\u09CB\u09B9\u09B0)"}</NidT>
          </span>
          <span className="nid-c">
            <div className="ln" />
            <NidT>
              {
                "\u09A6\u09BE\u09AF\u09BC\u09BF\u09A4\u09CD\u09AC\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4 \u0995\u09B0\u09CD\u09AE\u0995\u09B0\u09CD\u09A4\u09BE\u09B0 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0\n          "
              }
            </NidT>
          </span>
        </div>
      </div>

      {/* ------------------------------ Page 2 ------------------------------ */}
      <div className="nid-sheet">
        <div className="nid-ins-t">
          <span className="nid-u">
            <NidT>
              {
                "\u0986\u09AC\u09C7\u09A6\u09A8\u0995\u09BE\u09B0\u09C0\u09B0 \u099C\u09A8\u09CD\u09AF \u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6\u09BE\u09AC\u09B2\u09C0"
              }
            </NidT>
          </span>
        </div>
        {INSTRUCTIONS.map((it, i) => (
          <div key={i} className={`nid-in${it.sub ? " sub" : ""}`}>
            <span className="n">
              <NidT>{"("}</NidT>
              <NidT>{it.n}</NidT>
              <NidT>{")"}</NidT>
            </span>
            <span className="t">
              <NidT>{it.t}</NidT>
            </span>
          </div>
        ))}

        <div className="nid-sep" style={{ marginTop: 14 }} />

        <div className="nid-rcpt">
          <div className="nid-c">
            <div>
              <b>
                <NidT>
                  {"\u0985\u0982\u09B6-\u0995 (\u09AB\u09B0\u09AE-\u09E8)"}
                </NidT>
              </b>
            </div>
            <div className="nid-u">
              <NidT>
                {
                  "\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4\u09BF\u09B8\u09CD\u09AC\u09C0\u0995\u09BE\u09B0\u09C7\u09B0 \u09B0\u09B6\u09BF\u09A6"
                }
              </NidT>
            </div>
            <div>
              <NidT>
                {
                  "[\u09AA\u09CD\u09B0\u09AC\u09BF\u09A7\u09BE\u09A8 \u09EA(\u09E9) \u09A6\u09CD\u09B0\u09B7\u09CD\u099F\u09AC\u09CD\u09AF]"
                }
              </NidT>
            </div>
          </div>
          <div style={{ height: 8 }} />
          <ReceiptLine label="(১) আবেদনকারীর নাম এবং জাতীয় পরিচিতি নম্বর" />
          <ReceiptLine label="(২) প্রযোজ্য ক্ষেত্রে, আইনানুগ অভিভাবকের নাম এবং জাতীয় পরিচিতি নম্বর" />
          <ReceiptLine label="(৩) আবেদনের তারিখ" />
          <ReceiptLine label="(৪) বায়োমেট্রিক্স ফিচার প্রদানের নিমিত্ত উপস্থিতির স্থান, তারিখ ও সময়" />
          <div className="nid-end" style={{ marginTop: 26 }}>
            <span>
              <NidT>{"(\u09B8\u09BF\u09B2\u09AE\u09CB\u09B9\u09B0)"}</NidT>
            </span>
            <span className="nid-c">
              <div className="ln" />
              <NidT>
                {
                  "\u09A6\u09BE\u09AF\u09BC\u09BF\u09A4\u09CD\u09AC\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4 \u0995\u09B0\u09CD\u09AE\u0995\u09B0\u09CD\u09A4\u09BE\u09B0 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0\n            "
                }
              </NidT>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
function ReceiptLine({ label }: { label: string }) {
  return (
    <div className="nid-rl">
      <span className="l">
        <NidT>{label}</NidT>
      </span>
      <span className="c">
        <NidT>{":"}</NidT>
      </span>
      <span className="d" />
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/* Left-column UI pieces                                                      */
/* -------------------------------------------------------------------------- */
const INPUT_CLS =
  "w-full rounded-[11px] border border-[#E2E8F0] bg-white px-3 text-[13px] font-medium text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";
function InputField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
}) {
  const id = useId();
  const { locale } = useSohozI18n();
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-2 block text-[12px] font-semibold leading-none text-[#0F172A]"
      >
        <NidT>{label}</NidT>
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={nidTranslateText(placeholder, locale)}
        className={`${INPUT_CLS} h-[39px]`}
      />
    </div>
  );
}
function SectionCard({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-[#E2E8F0] bg-white px-4 py-[17px] shadow-sm">
      <h2 className="text-[14px] font-extrabold leading-tight text-[#2563EB]">
        {number}
        <NidT>{". "}</NidT>
        <NidT>{title}</NidT>
      </h2>
      <div className="mt-[14px]">{children}</div>
    </section>
  );
}
function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="mb-[15px] text-[11px] font-medium leading-[1.5] text-slate-500">
      {children}
    </p>
  );
}
function ContactFields({
  prefix,
  value,
  onChange,
}: {
  prefix: "Applicant" | "Guardian";
  value: Contact;
  onChange: (key: keyof Contact, v: string) => void;
}) {
  return (
    <div className="space-y-[14px]">
      <InputField
        label={`${prefix} name`}
        placeholder={`${prefix} name`}
        value={value.name}
        onChange={(v) => onChange("name", v)}
      />
      <InputField
        label={`${prefix} address`}
        placeholder="Village / road, post office, upazila, district"
        value={value.address}
        onChange={(v) => onChange("address", v)}
      />
      <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
        <InputField
          label={`${prefix} mobile number`}
          placeholder="01783666743"
          value={value.mobile}
          onChange={(v) => onChange("mobile", v)}
          type="tel"
          inputMode="tel"
        />
        <InputField
          label={`${prefix} e-mail`}
          placeholder="name@example.com"
          value={value.email}
          onChange={(v) => onChange("email", v)}
          type="email"
          inputMode="email"
        />
      </div>
    </div>
  );
}
function SubjectField({
  label,
  placeholder,
  value,
  onChange,
  multiline,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const id = useId();
  const { locale } = useSohozI18n();
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] font-semibold text-[#0F172A]"
      >
        <NidT>{label}</NidT>
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={nidTranslateText(placeholder, locale)}
          className={`${INPUT_CLS} resize-y py-2 text-[12px]`}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={nidTranslateText(placeholder, locale)}
          autoComplete="off"
          className={`${INPUT_CLS} h-[39px] text-[12px]`}
        />
      )}
    </div>
  );
}
function SubjectEditor({
  subject,
  isOpen,
  value,
  onToggle,
  onChange,
  onClear,
}: {
  subject: Subject;
  isOpen: boolean;
  value: SubjectValue;
  onToggle: () => void;
  onChange: (next: SubjectValue) => void;
  onClear: () => void;
}) {
  const filled = subjectHasValue(value);
  const panelId = useId();
  return (
    <div
      className={`rounded-[12px] border transition-colors ${
        isOpen
          ? "border-[#2563EB]/40 bg-[#EFF6FF]"
          : "border-[#E2E8F0] bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex min-h-[46px] w-full items-center justify-between gap-3 rounded-[12px] px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
      >
        <span className="text-[12px] font-bold text-[#0F172A]">
          <NidT>{"("}</NidT>
          <NidT>{subject.letter}</NidT>
          <NidT>{") "}</NidT>
          <NidT>{subject.en}</NidT>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {filled ? (
            <span className="rounded-full bg-[#10B981]/15 px-2 py-[2px] text-[10px] font-extrabold text-[#10B981]">
              <NidT>{"Filled\n            "}</NidT>
            </span>
          ) : null}
          <span className="text-[11px] font-extrabold text-[#2563EB]">
            {isOpen ? <NidT>{"Close"}</NidT> : <NidT>{"Fill in"}</NidT>}
          </span>
        </span>
      </button>

      {isOpen ? (
        <div
          id={panelId}
          className="space-y-3 border-t border-[#E2E8F0] px-3 pb-3 pt-3"
        >
          <SubjectField
            label="What the NID says now"
            placeholder={`${subject.en} — as it is now`}
            value={value.current}
            onChange={(v) => onChange({ ...value, current: v })}
            multiline={subject.multiline}
          />
          <SubjectField
            label="Corrected value requested"
            placeholder={`${subject.en} — as it should be`}
            value={value.corrected}
            onChange={(v) => onChange({ ...value, corrected: v })}
            multiline={subject.multiline}
          />
          <SubjectField
            label="Attached documents / remarks"
            placeholder="Documents you are attaching"
            value={value.remarks}
            onChange={(v) => onChange({ ...value, remarks: v })}
            multiline
          />
          {filled ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold text-[#10B981]">
                <NidT>
                  {
                    "This subject appears in the correction table.\n              "
                  }
                </NidT>
              </p>
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50"
              >
                <Trash2 size={11} />
                <NidT>{"Clear this subject\n              "}</NidT>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */
const ACTION_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-[11px] border border-[#E2E8F0] bg-white px-3 py-[11px] text-[11px] font-extrabold text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4";
const ICON_BTN =
  "flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]";
export default function NidInformationCorrectionForm() {
  const { locale } = useSohozI18n();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [openSubject, setOpenSubject] = useState<SubjectKey | null>(null);
  const [mounted, setMounted] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [uses, setUses] = useState(0);
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [pageHeight, setPageHeight] = useState(PAGE_H);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    l: number;
    t: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  const computeFit = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return 100;
    return clamp(Math.floor(((el.clientWidth - 32) / PAGE_W) * 100), 40, 200);
  }, []);
  // Initial view: fit one complete A4 sheet inside the preview viewport
  // instead of fitting only to width. This keeps the full first form page
  // visible immediately without changing the preview layout or controls.
  const computeInitialPageFit = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return 70;
    const widthFit = (el.clientWidth - 32) / PAGE_W;
    const heightFit = (el.clientHeight - 32) / PAGE_H;
    return clamp(Math.floor(Math.min(widthFit, heightFit) * 100), 40, 200);
  }, []);
  /* ---- mount: read saved data / counters, fit preview -------------------- */
  useEffect(() => {
    setMounted(true);
    setSavedAt(readSaved()?.savedAt ?? null);
    setUses(Number(readLS(USES_KEY)) || 0);
    setFav(readLS(FAV_KEY) === "1");
    setZoom(computeInitialPageFit());
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [computeInitialPageFit]);
  /* ---- autosave (debounced; never overwrites the last application with an empty form) */
  useEffect(() => {
    if (!mounted || isFormEmpty(form)) return;
    const t = setTimeout(() => {
      const now = Date.now();
      writeLS(STORAGE_KEY, JSON.stringify({ savedAt: now, form }));
      setSavedAt(now);
    }, 400);
    return () => clearTimeout(t);
  }, [form, mounted]);
  /* ---- measure preview page height (for page count / scaling) ------------ */
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const update = () => setPageHeight(Math.max(PAGE_H, el.offsetHeight));
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = zoom / 100;
  const totalPages = Math.max(1, Math.ceil((pageHeight - 4) / PAGE_H));
  const onPanDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      l: el.scrollLeft,
      t: el.scrollTop,
    };
    el.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPanMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const el = scrollerRef.current;
    if (!d || !el) return;
    el.scrollLeft = d.l - (e.clientX - d.x);
    el.scrollTop = d.t - (e.clientY - d.y);
  };
  const onPanEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    scrollerRef.current?.releasePointerCapture(e.pointerId);
  };
  const onPreviewScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const pagePx = PAGE_H * scale;
    const mid = el.scrollTop + el.clientHeight / 2 - 16;
    setCurrentPage(clamp(Math.floor(mid / pagePx) + 1, 1, totalPages));
  };
  /* ---- updaters ---------------------------------------------------------- */
  const setField = <
    K extends
      | "cardHolderName"
      | "nidNumber"
      | "guardianName"
      | "guardianNid"
      | "feePaid"
      | "receipt"
      | "attachments",
  >(
    key: K,
    value: string,
  ) => setForm((f) => ({ ...f, [key]: value }));
  const setContact =
    (who: "applicant" | "guardianSign") =>
    (key: keyof Contact, value: string) =>
      setForm((f) => ({ ...f, [who]: { ...f[who], [key]: value } }));
  const setSubject = (key: SubjectKey, value: SubjectValue) =>
    setForm((f) => ({ ...f, subjects: { ...f.subjects, [key]: value } }));
  /* ---- derived status ---------------------------------------------------- */
  const empty = useMemo(() => isFormEmpty(form), [form]);
  const filledSubjectCount = useMemo(
    () => SUBJECTS.filter((s) => subjectHasValue(form.subjects[s.key])).length,
    [form.subjects],
  );
  const readySubjectCount = useMemo(
    () =>
      SUBJECTS.filter(
        (s) =>
          form.subjects[s.key].current.trim() &&
          form.subjects[s.key].corrected.trim(),
      ).length,
    [form.subjects],
  );
  const missing: string[] = [];
  if (!form.cardHolderName.trim())
    missing.push(nidTranslateText("card holder name", locale));
  if (!form.nidNumber.trim())
    missing.push(nidTranslateText("NID number", locale));
  if (readySubjectCount === 0)
    missing.push(
      nidTranslateText("one subject with both sides filled", locale),
    );
  const status: {
    text: string;
    dot: string;
  } = empty
    ? {
        text: nidTranslateText("Add an input to get started", locale),
        dot: "bg-slate-400",
      }
    : missing.length > 0
      ? {
          text: `${nidTranslateText("Still needed", locale)}: ${missing.join(", ")}`,
          dot: "bg-amber-500",
        }
      : {
          text: nidTranslateText(
            "Form complete — download or print your application.",
            locale,
          ),
          dot: "bg-[#10B981]",
        };
  /* ---- actions ----------------------------------------------------------- */
  const bumpUses = () => {
    setUses((n) => {
      const next = n + 1;
      writeLS(USES_KEY, String(next));
      return next;
    });
  };
  const handleClear = () => {
    setForm(sanitizeForm({}));
    setOpenSubject(null);
    notify(
      savedAt
        ? nidTranslateText(
            "Form cleared — use “Restore last application” to bring it back.",
            locale,
          )
        : nidTranslateText("Form cleared.", locale),
    );
  };
  const handleRestore = () => {
    const saved = readSaved();
    if (!saved) {
      notify(nidTranslateText("No saved application found.", locale));
      return;
    }
    setForm(saved.form);
    setOpenSubject(null);
    const restoredAt = new Date(saved.savedAt).toLocaleString(
      String(locale ?? "")
        .toLowerCase()
        .startsWith("bn")
        ? "bn-BD"
        : undefined,
    );
    notify(
      `${nidTranslateText("Restored application saved", locale)} ${restoredAt}`,
    );
  };
  const handlePrint = () => {
    bumpUses();
    // Let React flush, then open the print dialog for the clean A4 copy.
    window.setTimeout(() => window.print(), 50);
  };
  const handleDownload = async () => {
    const node = document.getElementById(PRINT_ID);
    if (!node || busy) return;
    setBusy(true);
    try {
      if (document.fonts) {
        await document.fonts.load("12px 'Noto Serif Bengali'", "অআকখগ");
        await document.fonts.ready;
      }
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const sheets = Array.from(
        node.querySelectorAll<HTMLElement>(".nid-sheet"),
      );
      const targets = sheets.length ? sheets : [node];
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      });
      let firstPage = true;
      for (const target of targets) {
        const canvas = await html2canvas(target, {
          scale: 3,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: PAGE_W,
          onclone: (doc) => {
            const el = doc.getElementById(PRINT_ID);
            if (el) {
              el.style.position = "static";
              el.style.left = "0";
              el.style.top = "0";
            }
          },
        });
        // Each sheet starts on its own A4 page; overflow spills to extra pages.
        const pagePx = Math.round((canvas.width * 297) / 210);
        const pages = Math.max(1, Math.ceil((canvas.height - 4) / pagePx));
        for (let i = 0; i < pages; i++) {
          const sliceH = Math.min(pagePx, canvas.height - i * pagePx);
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = pagePx;
          const ctx = slice.getContext("2d");
          if (!ctx) throw new Error("Canvas 2D context unavailable");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, slice.width, slice.height);
          ctx.drawImage(
            canvas,
            0,
            i * pagePx,
            canvas.width,
            sliceH,
            0,
            0,
            canvas.width,
            sliceH,
          );
          if (!firstPage) pdf.addPage("a4", "portrait");
          firstPage = false;
          pdf.addImage(
            slice.toDataURL("image/png"),
            "PNG",
            0,
            0,
            210,
            297,
            undefined,
            "FAST",
          );
        }
      }
      const safeNid = form.nidNumber.replace(/[^0-9A-Za-z-]/g, "");
      pdf.save(`NID-Correction-Form-${safeNid || "draft"}.pdf`);
      bumpUses();
      notify(nidTranslateText("PDF downloaded.", locale));
    } catch (error) {
      console.error("PDF generation failed", error);
      notify(
        nidTranslateText(
          "Could not create the PDF. Please try again or use Print → Save as PDF.",
          locale,
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: nidTranslateText(TITLE, locale), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify(nidTranslateText("Link copied to clipboard.", locale));
    } catch {
      /* user dismissed the share sheet */
    }
  };
  const toggleFav = () => {
    setFav((current) => {
      writeLS(FAV_KEY, current ? "0" : "1");
      return !current;
    });
  };
  /* ---- render ------------------------------------------------------------ */
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] pb-[104px] font-sans text-[#0F172A]">
      <style>{PAGE_CSS}</style>

      <div className="mx-auto w-full max-w-[1320px] px-4 pb-10 pt-5 sm:px-5 xl:px-0">
        {/* Breadcrumb */}
        <nav
          aria-label={nidTranslateText("Breadcrumb", locale)}
          className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500"
        >
          <Home size={12} />
          <span>
            <NidT>{"/"}</NidT>
          </span>
          <span>
            <NidT>{"Sohoj Tools"}</NidT>
          </span>
          <span>
            <NidT>{"/"}</NidT>
          </span>
          <span>
            <NidT>{"General Tools"}</NidT>
          </span>
          <span>
            <NidT>{"/"}</NidT>
          </span>
          <span className="font-extrabold text-[#0F172A]">
            <NidT>{TITLE}</NidT>
          </span>
        </nav>

        {/* Header */}
        <header className="mb-[18px] flex items-start justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[#2563EB]/20 bg-[#EFF6FF] text-[#2563EB] shadow-sm">
              <FileText size={21} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-[#0F172A] sm:text-[26px]">
                  <NidT>{TITLE}</NidT>
                </h1>
                <span className="rounded-full bg-[#10B981]/15 px-2.5 py-[5px] text-[10px] font-extrabold text-[#10B981]">
                  <NidT>{"Free\n                "}</NidT>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                  <Check size={11} />
                  <NidT>{"Used "}</NidT>
                  {uses}
                  {<NidT> </NidT>}
                  {uses === 1 ? <NidT>{"time"}</NidT> : <NidT>{"times"}</NidT>}
                </span>
              </div>
              <p className="mt-1 text-[13px] font-medium text-slate-500">
                <NidT>
                  {
                    "Fill in your details on the left \u2014 see a live Form-2 on the\n                right and download it as PDF.\n              "
                  }
                </NidT>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFav}
              aria-pressed={fav}
              className={`${ICON_BTN} ${fav ? "text-amber-500" : ""}`}
              aria-label={
                fav
                  ? nidTranslateText("Remove from favorites", locale)
                  : nidTranslateText("Add to favorites", locale)
              }
            >
              <Star size={17} fill={fav ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className={ICON_BTN}
              aria-label={nidTranslateText("Share", locale)}
            >
              <Share2 size={16} />
            </button>
          </div>
        </header>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[390px_minmax(0,1fr)]">
          {/* ------------------------------ Left: form ------------------------------ */}
          <div className="space-y-[12px]">
            <SectionCard number="1" title="National ID card holder">
              <div className="space-y-[14px]">
                <InputField
                  label="Card holder name"
                  placeholder="Name as printed on the NID"
                  value={form.cardHolderName}
                  onChange={(v) => setField("cardHolderName", v)}
                />
                <InputField
                  label="National ID (NID) number"
                  placeholder="National ID number"
                  value={form.nidNumber}
                  onChange={(v) => setField("nidNumber", v)}
                  inputMode="numeric"
                />
              </div>
            </SectionCard>

            <SectionCard number="2" title="Legal guardian (where applicable)">
              <Hint>
                <NidT>
                  {
                    "Only for a holder under 18 or declared incapable by a court.\n              "
                  }
                </NidT>
              </Hint>
              <div className="space-y-[14px]">
                <InputField
                  label="Legal guardian name"
                  placeholder="Guardian name"
                  value={form.guardianName}
                  onChange={(v) => setField("guardianName", v)}
                />
                <InputField
                  label="Guardian's National ID (NID) number"
                  placeholder="Guardian NID number"
                  value={form.guardianNid}
                  onChange={(v) => setField("guardianNid", v)}
                  inputMode="numeric"
                />
              </div>
            </SectionCard>

            <SectionCard number="3" title="Information to be corrected">
              <Hint>
                <NidT>
                  {
                    "Open only the subjects you want corrected. The rest stay blank\n                on the printed form.\n              "
                  }
                </NidT>
              </Hint>
              <div className="space-y-[6px]">
                {SUBJECTS.map((subject) => (
                  <SubjectEditor
                    key={subject.key}
                    subject={subject}
                    isOpen={openSubject === subject.key}
                    value={form.subjects[subject.key]}
                    onToggle={() =>
                      setOpenSubject((c) =>
                        c === subject.key ? null : subject.key,
                      )
                    }
                    onChange={(v) => setSubject(subject.key, v)}
                    onClear={() =>
                      setSubject(subject.key, {
                        current: "",
                        corrected: "",
                        remarks: "",
                      })
                    }
                  />
                ))}
              </div>
              <p
                className={`mt-[13px] text-[11px] font-semibold ${filledSubjectCount > 0 ? "text-[#10B981]" : "text-slate-400"}`}
              >
                {filledSubjectCount > 0 ? (
                  String(locale ?? "")
                    .toLowerCase()
                    .startsWith("bn") ? (
                    `${filledSubjectCount}টি তথ্য সংশোধনের জন্য পূরণ করা হয়েছে।`
                  ) : (
                    `${filledSubjectCount} subject(s) filled in for correction.`
                  )
                ) : (
                  <NidT>
                    {
                      "No subject is ready yet — fill in both sides of at least one subject."
                    }
                  </NidT>
                )}
              </p>
            </SectionCard>

            <SectionCard number="4" title="Fee and attached documents">
              <div className="space-y-[14px]">
                <InputField
                  label="Fee paid"
                  placeholder="e.g. BDT 230"
                  value={form.feePaid}
                  onChange={(v) => setField("feePaid", v)}
                />
                <InputField
                  label="Fee payment receipt"
                  placeholder="Receipt number / date"
                  value={form.receipt}
                  onChange={(v) => setField("receipt", v)}
                />
                <InputField
                  label="List of attached documents"
                  placeholder="e.g. SSC certificate, birth registration"
                  value={form.attachments}
                  onChange={(v) => setField("attachments", v)}
                />
              </div>
            </SectionCard>

            <SectionCard number="5" title="Applicant signature block">
              <ContactFields
                prefix="Applicant"
                value={form.applicant}
                onChange={setContact("applicant")}
              />
            </SectionCard>

            <SectionCard
              number="6"
              title="Guardian signature block (where applicable)"
            >
              <Hint>
                <NidT>
                  {
                    "Fill this in only if the guardian signs the application.\n              "
                  }
                </NidT>
              </Hint>
              <ContactFields
                prefix="Guardian"
                value={form.guardianSign}
                onChange={setContact("guardianSign")}
              />
            </SectionCard>
          </div>

          {/* ----------------------------- Right: preview ---------------------------- */}
          <section
            aria-label={nidTranslateText("Live preview", locale)}
            className="flex flex-col rounded-[18px] border border-[#E2E8F0] bg-white p-4 shadow-sm lg:sticky lg:top-4"
            style={{ height: "clamp(560px, calc(100vh - 140px), 900px)" }}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[12px] font-extrabold text-[#0F172A]">
                <Eye size={14} />
                <span>
                  <NidT>{"Live preview"}</NidT>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center overflow-hidden rounded-[11px] border border-[#E2E8F0] bg-[#F8FAFC]">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => clamp(z - 10, 40, 250))}
                    className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-white"
                    aria-label={nidTranslateText("Zoom out", locale)}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-[46px] text-center text-[10px] font-extrabold tabular-nums text-[#0F172A]">
                    {zoom}
                    <NidT>{"%\n                  "}</NidT>
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => clamp(z + 10, 40, 250))}
                    className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-white"
                    aria-label={nidTranslateText("Zoom in", locale)}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(computeFit())}
                    className="flex h-8 w-9 items-center justify-center border-l border-[#E2E8F0] text-slate-600 hover:bg-white"
                    aria-label={nidTranslateText("Fit to width", locale)}
                    title={nidTranslateText("Fit to width", locale)}
                  >
                    <Maximize2 size={12} />
                  </button>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold ${
                    empty
                      ? "bg-[#E2E8F0] text-slate-500"
                      : "bg-[#10B981]/15 text-[#10B981]"
                  }`}
                >
                  {empty ? <NidT>{"Empty"}</NidT> : <NidT>{"Live"}</NidT>}
                </span>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden rounded-[12px] bg-slate-900">
              <div
                ref={scrollerRef}
                onScroll={onPreviewScroll}
                onPointerDown={onPanDown}
                onPointerMove={onPanMove}
                onPointerUp={onPanEnd}
                onPointerCancel={onPanEnd}
                className={`h-full select-none overflow-auto p-4 ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                style={{
                  scrollbarColor: "#475569 transparent",
                  touchAction: "auto",
                }}
              >
                <div
                  className="mx-auto shadow-2xl"
                  style={{ width: PAGE_W * scale, height: pageHeight * scale }}
                >
                  <div
                    ref={pageRef}
                    className="nid-preview"
                    style={{
                      width: PAGE_W,
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <FormPage form={form} />
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute right-6 top-3 inline-flex items-center gap-1 rounded-full bg-[#0F172A]/90 px-4 py-[7px] text-[11px] font-bold text-white shadow-lg backdrop-blur-sm">
                <NidT>{"Page "}</NidT>
                {currentPage}
                <NidT>{"of "}</NidT>
                {totalPages}
                <ChevronDown size={13} />
              </div>
            </div>
          </section>
        </div>

        {/* Important information & instructions */}
        <section
          aria-label={nidTranslateText(
            "Important information and instructions",
            locale,
          )}
          className="mt-6 rounded-[16px] border border-[#E2E8F0] bg-white px-6 py-5 shadow-sm text-[12px] leading-[1.7] text-[#0F172A]"
        >
          <h2 className="border-b border-[#E2E8F0] pb-5 text-[14px] font-extrabold text-[#2563EB]">
            <NidT>{"Important information and instructions:\n          "}</NidT>
          </h2>
          <p className="mt-5">
            <NidT>
              {
                "Attach the following documents with the application:\n          "
              }
            </NidT>
          </p>
          <ul className="mt-3 list-disc space-y-2.5 pl-6 marker:text-[#2563EB]">
            <li>
              <NidT>
                {
                  "The original National ID card must be submitted with the\n              application.\n            "
                }
              </NidT>
            </li>
            <li>
              <NidT>
                {
                  "To correct a name (Bangla/English) or date of birth: the SSC or\n              equivalent certificate; otherwise an attested copy of a passport,\n              birth registration, driving licence, or marriage deed.\n            "
                }
              </NidT>
            </li>
            <li>
              <NidT>
                {
                  "To correct a father&apos;s or mother&apos;s name: SSC/HSC\n              certificates plus attested copies of the NIDs of the father,\n              mother, brothers and sisters.\n            "
                }
              </NidT>
            </li>
            <li>
              <NidT>
                {
                  "To add or drop a husband&apos;s name (title): an attested copy of\n              the marriage deed, divorce deed, death certificate or affidavit.\n            "
                }
              </NidT>
            </li>
            <li>
              <NidT>
                {
                  "To correct an address: the house deed, an electricity, gas or\n              water bill, or a rent agreement or receipt.\n            "
                }
              </NidT>
            </li>
            <li>
              <NidT>
                {
                  "To add or correct a blood group: a doctor&apos;s certificate.\n            "
                }
              </NidT>
            </li>
            <li>
              <NidT>
                {
                  "Where applicable, the fee payment receipt and a copy of the\n              guardian&apos;s NID.\n            "
                }
              </NidT>
            </li>
          </ul>
          <p className="mt-5 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 font-semibold text-[#4F46E5]">
            <NidT>
              {
                "Fill in every field accurately. An incomplete or incorrect\n            application is treated as cancelled.\n          "
              }
            </NidT>
          </p>
          <p className="mt-3 rounded-[10px] border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 font-semibold text-[#047857]">
            <NidT>
              {
                "Print the completed Form-2, sign it, and submit it to your upazila /\n            thana election office.\n          "
              }
            </NidT>
          </p>
        </section>
      </div>

      {/* Fixed action bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E2E8F0] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[68px] max-w-[1320px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-5 xl:px-0">
          <div
            className="hidden items-center gap-2 text-[11px] font-semibold text-slate-500 md:flex"
            role="status"
          >
            <span className={`h-[7px] w-[7px] rounded-full ${status.dot}`} />
            <span>{status.text}</span>
          </div>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClear}
              disabled={empty}
              className={ACTION_BTN}
            >
              <NidT>{"Clear all\n            "}</NidT>
            </button>
            <button
              type="button"
              onClick={handleRestore}
              disabled={!savedAt}
              title={
                savedAt
                  ? `${nidTranslateText("Saved", locale)} ${new Date(
                      savedAt,
                    ).toLocaleString(
                      String(locale ?? "")
                        .toLowerCase()
                        .startsWith("bn")
                        ? "bn-BD"
                        : undefined,
                    )}`
                  : nidTranslateText("Nothing saved yet", locale)
              }
              className={ACTION_BTN}
            >
              <RotateCcw size={13} />
              <span>
                <NidT>{"Restore\n                "}</NidT>
                <span className="hidden sm:inline">
                  <NidT>{"last application"}</NidT>
                </span>
              </span>
            </button>
            <button type="button" onClick={handlePrint} className={ACTION_BTN}>
              <Printer size={13} />
              <NidT>{"Print\n            "}</NidT>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-[11px] bg-[#10B981] px-4 py-[11px] text-[11px] font-extrabold text-white shadow-md transition hover:bg-[#059669] disabled:cursor-wait disabled:opacity-70 sm:px-5"
            >
              {busy ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ArrowDownToLine size={13} />
              )}
              {busy ? (
                <NidT>{"Preparing…"}</NidT>
              ) : (
                <NidT>{"Download PDF"}</NidT>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast ? (
        <div
          role="status"
          className="fixed bottom-[84px] left-1/2 z-[60] max-w-[92vw] -translate-x-1/2 rounded-full bg-[#0F172A] px-4 py-2 text-[12px] font-semibold text-white shadow-xl"
        >
          {toast}
        </div>
      ) : null}

      {/* Clean A4 copy used for Print and PDF export (portalled to <body>) */}
      {mounted
        ? createPortal(
            <div id={PRINT_ID} className="nid-print-root" aria-hidden="true">
              <FormPage form={form} />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
