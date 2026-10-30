"use client";

import { T as BaseT, useSebaLagbeToolsI18n } from "@/app/sohoj-tools/_i18n";
import { useCallback, type ReactNode } from "react";

/**
 * Page-local, hydration-safe English ↔ Bangla translation layer for the
 * Question Paper Creator. English remains canonical; Bangla is applied only
 * to UI strings, never to user-authored question content.
 */
const QUESTION_BN: Record<string, string> = {
  "go back": "পেছনে যান",
  "new question paper": "নতুন প্রশ্নপত্র",
  "questions · full marks": "প্রশ্ন · পূর্ণমান",
  classic: "ক্লাসিক",
  compact: "কমপ্যাক্ট",
  save: "সংরক্ষণ",
  print: "প্রিন্ট",
  "download pdf": "PDF ডাউনলোড",
  "smaller text": "লেখা ছোট করুন",
  "larger text": "লেখা বড় করুন",
  bold: "গাঢ়",
  italic: "তির্যক",
  "delete selected area": "নির্বাচিত অংশ মুছে দিন",
  "%": "%",
  "+ page": "+ পৃষ্ঠা",
  "− page": "− পৃষ্ঠা",
  "manual page distribution": "ম্যানুয়ালি পৃষ্ঠা বণ্টন",
  "auto-balanced distribution": "স্বয়ংক্রিয়ভাবে ভারসাম্যপূর্ণ বণ্টন",
  "overflow:": "অতিরিক্ত:",
  "auto balance": "স্বয়ংক্রিয় ভারসাম্য",
  "drag anywhere on the paper to mark a custom text region":
    "নিজস্ব লেখার অংশ নির্ধারণ করতে কাগজের যেকোনো জায়গায় টেনে নির্বাচন করুন",
  "select an area to place custom inline text":
    "নিজস্ব ইনলাইন লেখা বসাতে একটি এলাকা নির্বাচন করুন",
  "cancel area": "এলাকা বাতিল",
  "select area": "এলাকা নির্বাচন",
  "drag across any page area to create a custom inline text box":
    "নিজস্ব ইনলাইন লেখার বাক্স তৈরি করতে পৃষ্ঠার যেকোনো অংশে টেনে নির্বাচন করুন",
  "drag questions to reorder them within a section or move them between pages":
    "প্রশ্নগুলো টেনে একই অংশে ক্রম পরিবর্তন করুন বা অন্য পৃষ্ঠায় সরান",
  "no questions selected yet": "এখনও কোনো প্রশ্ন নির্বাচন করা হয়নি",
  "filter and pick questions from the left — they will appear here as a paper.":
    "বাম দিক থেকে প্রশ্ন বাছাই করুন—সেগুলো এখানে প্রশ্নপত্র হিসেবে দেখা যাবে।",
  sheet: "শিট",
  front: "সামনের অংশ",
  "back / flip": "পেছনের অংশ / উল্টে দিন",
  "edit question": "প্রশ্ন সম্পাদনা",
  "change question": "প্রশ্ন পরিবর্তন",
  "select replacement…": "বিকল্প প্রশ্ন নির্বাচন করুন…",
  "question text": "প্রশ্নের লেখা",
  "stimulus / context": "উদ্দীপক / প্রেক্ষাপট",
  cancel: "বাতিল",
  "save changes": "পরিবর্তন সংরক্ষণ",
  logo: "লোগো",
  "add logo": "লোগো যোগ করুন",
  change: "পরিবর্তন",
  remove: "মুছে দিন",
  font: "ফন্ট",
  page: "পৃষ্ঠা",
  "a5 (small)": "A5 (ছোট)",
  "joint (2-in-1)": "জয়েন্ট (২-ইন-১)",
  "set no": "সেট নম্বর",
  off: "বন্ধ",
  on: "চালু",
  "shuffle selected questions": "নির্বাচিত প্রশ্ন এলোমেলো করুন",
  shuffle: "এলোমেলো করুন",
  layout: "বিন্যাস",
  options: "অপশন",
  columns: "কলাম",
  "compact spacing": "কম ফাঁকা স্থান",
  "select answer": "উত্তর নির্বাচন",
  "header note": "হেডার নোট",
  "enter a note": "একটি নোট লিখুন",
  footer: "ফুটার",
  demo: "ডেমো",
  "load a complete demo question paper for ui testing":
    "ইউআই পরীক্ষা করার জন্য একটি সম্পূর্ণ ডেমো প্রশ্নপত্র লোড করুন",
  "demo loaded": "ডেমো লোড হয়েছে",
  "load demo": "ডেমো লোড করুন",
  "marks per section": "প্রতিটি অংশের নম্বর",
  "total marks: ": "মোট নম্বর: ",
  clear: "সব মুছুন",
  marks: "নম্বর",
  selected: "নির্বাচিত",
  "drag questions to reorder them within a section. click a mark in the preview to set it individually.":
    "একই অংশে প্রশ্নের ক্রম পরিবর্তন করতে টেনে সরান। আলাদাভাবে নম্বর নির্ধারণ করতে পূর্বরূপে নম্বরে ক্লিক করুন।",
  "auto create": "স্বয়ংক্রিয়ভাবে তৈরি",
  "pick a random set from the fetched questions.":
    "লোড করা প্রশ্নগুলো থেকে এলোমেলো একটি সেট বেছে নিন।",
  "number of questions": "প্রশ্নের সংখ্যা",
  "create random set": "এলোমেলো সেট তৈরি করুন",
  "fetch questions first from browse & pick, then use auto create to select a random set.":
    "প্রথমে ‘ব্রাউজ ও বাছাই’ থেকে প্রশ্ন আনুন, তারপর ‘স্বয়ংক্রিয়ভাবে তৈরি’ ব্যবহার করে একটি এলোমেলো সেট নির্বাচন করুন।",
  "browse &amp; pick": "ব্রাউজ ও বাছাই",
  filters: "ফিল্টার",
  "select class": "শ্রেণি নির্বাচন",
  "select subject": "বিষয় নির্বাচন",
  "select chapter": "অধ্যায় নির্বাচন",
  "all question types": "সব ধরনের প্রশ্ন",
  "search questions...": "প্রশ্ন খুঁজুন...",
  "apply filter": "ফিল্টার প্রয়োগ করুন",
  "loading...": "লোড হচ্ছে...",
  "loading class...": "শ্রেণি লোড হচ্ছে...",
  "loading subject...": "বিষয় লোড হচ্ছে...",
  "loading chapter...": "অধ্যায় লোড হচ্ছে...",
  "fetching questions via ai...": "AI দিয়ে প্রশ্ন আনা হচ্ছে...",
  "set your filters and press “apply filter” to load questions.":
    "প্রশ্ন লোড করতে ফিল্টার সেট করে ‘ফিল্টার প্রয়োগ করুন’ চাপুন।",
  "0 found": "০টি পাওয়া গেছে",
  all: "সব",
  short: "সংক্ষিপ্ত",
  "creative / cq": "সৃজনশীল / CQ",
  descriptive: "বর্ণনামূলক",
  "creative / cq questions": "সৃজনশীল / CQ প্রশ্ন",
  "descriptive questions": "বর্ণনামূলক প্রশ্ন",
  "short questions": "সংক্ষিপ্ত প্রশ্ন",
  mcq: "MCQ",
  "select all": "সব নির্বাচন",
  "search in fetched questions...": "আনা প্রশ্নগুলোর মধ্যে খুঁজুন...",
  "model high school": "মডেল হাই স্কুল",
  "half yearly exam": "অর্ধবার্ষিক পরীক্ষা",
  ssc: "SSC",
  "bangla demo chapter": "বাংলা ডেমো অধ্যায়",
  delete: "মুছে দিন",
  "fabric question paper editor": "ফ্যাব্রিক প্রশ্নপত্র এডিটর",
  "select an area on the question paper":
    "প্রশ্নপত্রে একটি এলাকা নির্বাচন করুন",
  "close selected area": "নির্বাচিত এলাকা বন্ধ করুন",
  "type text in selected area": "নির্বাচিত এলাকায় লেখা লিখুন",
  "select a region to edit directly on the page":
    "পৃষ্ঠায় সরাসরি সম্পাদনার জন্য একটি অংশ নির্বাচন করুন",
  "move question horizontally": "প্রশ্নটি আড়াআড়িভাবে সরান",
  "drag to move question left or right": "প্রশ্নটি বাম বা ডানে সরাতে টেনে নিন",
  "double-click to edit": "সম্পাদনা করতে ডাবল-ক্লিক করুন",
  edit: "সম্পাদনা",
  "decrease question font size": "প্রশ্নের ফন্ট ছোট করুন",
  "increase question font size": "প্রশ্নের ফন্ট বড় করুন",
  "reduce spacing": "ফাঁকা স্থান কমান",
  "increase spacing": "ফাঁকা স্থান বাড়ান",
  "move question to page": "প্রশ্নটি যে পৃষ্ঠায় নিন",
  "remove question": "প্রশ্নটি সরিয়ে দিন",
  "question paper": "প্রশ্নপত্র",
  "print frame is not available.": "প্রিন্ট ফ্রেম পাওয়া যাচ্ছে না।",
  "could not create print document.": "প্রিন্ট ডকুমেন্ট তৈরি করা যায়নি।",
  "request failed": "অনুরোধ ব্যর্থ হয়েছে",
  "the server returned an invalid response.":
    "সার্ভার থেকে অবৈধ উত্তর পাওয়া গেছে।",
  "the ai service took too long to respond. please try again.":
    "AI সেবা উত্তর দিতে বেশি সময় নিচ্ছে। আবার চেষ্টা করুন।",
  "no subjects were returned for this class.":
    "এই শ্রেণির জন্য কোনো বিষয় পাওয়া যায়নি।",
  "no chapters were returned for this subject.":
    "এই বিষয়ের জন্য কোনো অধ্যায় পাওয়া যায়নি।",
  "no usable questions were returned.":
    "ব্যবহারযোগ্য কোনো প্রশ্ন পাওয়া যায়নি।",
  "question paper preview is not available for printing.":
    "প্রিন্ট করার জন্য প্রশ্নপত্রের পূর্বরূপ পাওয়া যাচ্ছে না।",
  "that question is already selected.":
    "এই প্রশ্নটি ইতিমধ্যেই নির্বাচিত হয়েছে।",
  "nothing to save": "সংরক্ষণ করার মতো কিছু নেই",
  "saving...": "সংরক্ষণ করা হচ্ছে...",
  saved: "সংরক্ষিত হয়েছে",
  "save failed": "সংরক্ষণ ব্যর্থ হয়েছে",
  "layout broke": "বিন্যাস ঠিক নেই",
  "page ": "পৃষ্ঠা ",
  "of ": "এর মধ্যে ",
  question: "প্রশ্ন",
  questions: "প্রশ্ন",
  column: "কলাম",
  "a+": "A+",
  "s+": "S+",
  "s−": "S−",
  l: "L",
  "classic / compact": "ক্লাসিক / কমপ্যাক্ট",
  "institution name (school / coaching / college)":
    "প্রতিষ্ঠানের নাম (স্কুল / কোচিং / কলেজ)",
  "set the exam name here": "এখানে পরীক্ষার নাম লিখুন",
  "subject:": "বিষয়:",
  "class:": "শ্রেণি:",
  "time:": "সময়:",
  "full marks:": "পূর্ণমান:",
  "chapter:": "অধ্যায়:",
  "set no:": "সেট নম্বর:",
  "browse & pick": "ব্রাউজ ও বাছাই",
};

function normalizeQuestionText(value: string) {
  return value
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function translateQuestionText(
  value: string,
  locale: string | undefined,
  baseL: (value: string) => string,
): string {
  const raw = String(value ?? "");
  if (!locale || !String(locale).toLowerCase().startsWith("bn")) return raw;
  const key = normalizeQuestionText(raw);
  const exact = QUESTION_BN[key];
  if (exact !== undefined) return exact;

  let match = /^loading (.+)\.\.\.$/i.exec(key);
  if (match)
    return `${translateQuestionText(match[1], locale, baseL)} লোড হচ্ছে...`;

  match = /^(\d+) found$/i.exec(key);
  if (match) return `${match[1]}টি পাওয়া গেছে`;

  match = /^(\d+) selected$/i.exec(key);
  if (match) return `${match[1]}টি নির্বাচিত`;

  match = /^showing (\d+) of (\d+)$/i.exec(key);
  if (match) return `${match[1]}টির মধ্যে ${match[2]}টি দেখানো হচ্ছে`;

  match = /^(\d+) questions? · full marks$/i.exec(key);
  if (match) return `${match[1]}টি প্রশ্ন · পূর্ণমান`;

  match = /^page\s+(\d+)$/i.exec(key);
  if (match) return `পৃষ্ঠা ${match[1]}`;

  match = /^page\s+(\d+)\s+of\s+(\d+)$/i.exec(key);
  if (match) return `পৃষ্ঠা ${match[1]} / ${match[2]}`;

  match = /^·\s*(\d+)\s*pages$/i.exec(key);
  if (match) return `· ${match[1]} পৃষ্ঠা`;

  match =
    /^(MCQ|Short Questions|Creative \/ CQ|Descriptive Questions) \((\d+) marks\)$/i.exec(
      key,
    );
  if (match) {
    const labels: Record<string, string> = {
      MCQ: "MCQ",
      "Short Questions": "সংক্ষিপ্ত প্রশ্ন",
      "Creative / CQ": "সৃজনশীল / CQ",
      "Descriptive Questions": "বর্ণনামূলক প্রশ্ন",
    };
    return `${labels[match[1]] ?? match[1]} (${match[2]} নম্বর)`;
  }

  const translated = baseL(raw);
  if (translated && translated !== raw) {
    const hasBangla = /[\u0980-\u09FF]/.test(translated);
    const hasLatin = /[A-Za-z]/.test(translated);
    if (hasBangla && !hasLatin) return translated;
  }
  return raw;
}

export function useQuestionText() {
  const { locale, L: baseL } = useSebaLagbeToolsI18n();
  const t = useCallback(
    (value: string) => translateQuestionText(value, locale, baseL),
    [locale, baseL],
  );
  return { t, locale };
}

export function T({ children }: { children: ReactNode }) {
  const { t } = useQuestionText();
  if (typeof children !== "string") return <>{children}</>;
  return <>{t(children)}</>;
}

export function QuestionTranslationFallback({
  children,
}: {
  children: string;
}) {
  const { t } = useQuestionText();
  return <>{t(children)}</>;
}

export { BaseT };
