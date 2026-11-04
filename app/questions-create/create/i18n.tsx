"use client";

import { T as BaseT, useSebaLagbeToolsI18n } from "@/app/sohoj-tools/_i18n";
import { useCallback, type ReactNode } from "react";

/**
 * Page-local, hydration-safe English ↔ Bangla translation layer for the
 * Question Paper Creator. English remains canonical; Bangla is applied only
 * to UI strings, never to user-authored question content.
 */
const QUESTION_BN: Record<string, string> = {
  "saved question papers": "সংরক্ষিত প্রশ্নপত্র",
  "preview any paper, or delete the ones you no longer need.": "যেকোনো প্রশ্নপত্রের পূর্বরূপ দেখুন, অথবা যেগুলো আর লাগবে না সেগুলো মুছে দিন।",
  "search saved papers...": "সংরক্ষিত প্রশ্নপত্র খুঁজুন...",
  "clear search": "সার্চ মুছুন",
  "refresh": "রিফ্রেশ",
  "close": "বন্ধ করুন",
  "could not load saved papers.": "সংরক্ষিত প্রশ্নপত্র লোড করা যায়নি।",
  "try again": "আবার চেষ্টা করুন",
  "no saved papers yet": "এখনো কোনো সংরক্ষিত প্রশ্নপত্র নেই",
  "save a paper from the creator and it will appear here automatically.": "প্রশ্নপত্র তৈরির পেজ থেকে একটি প্রশ্নপত্র সংরক্ষণ করলে সেটি স্বয়ংক্রিয়ভাবে এখানে দেখা যাবে।",
  "no papers match your search.": "আপনার সার্চের সাথে কোনো প্রশ্নপত্র মেলেনি।",
  "untitled paper": "নামহীন প্রশ্নপত্র",
  "open in editor": "এডিটরে খোলা আছে",
  "preview": "পূর্বরূপ",
  "delete this paper?": "এই প্রশ্নপত্রটি মুছে ফেলবেন?",
  "this removes the saved copy permanently.": "সংরক্ষিত কপিটি স্থায়ীভাবে মুছে যাবে।",
  "yes, delete": "হ্যাঁ, মুছুন",
  "deleting...": "মুছে ফেলা হচ্ছে...",
  "show answers": "উত্তর দেখান",
  "hide answers": "উত্তর লুকান",
  "answer": "উত্তর",
  "could not delete this paper.": "প্রশ্নপত্রটি মুছে ফেলা যায়নি।",
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
  "delete this page?": "এই পৃষ্ঠা মুছে ফেলবেন?",
  grab: "ধরে সরান",
  "text size": "লেখার সাইজ",
  "the questions go back to the available list, so you can add them again anytime.": "প্রশ্নগুলো আবার \"Available questions\" তালিকায় ফিরে যাবে, চাইলে যেকোনো সময় আবার যোগ করতে পারবেন।",
  "yes, delete page": "হ্যাঁ, পৃষ্ঠা মুছুন",
  "press esc to cancel": "বাতিল করতে Esc চাপুন",
  "delete this page / এই পৃষ্ঠা মুছুন": "এই পৃষ্ঠা মুছুন",
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
  "close demo": "ডেমো বন্ধ করুন",
  "demo preview is active": "ডেমো প্রিভিউ চালু আছে",
  "close the demo to return to your own question paper.":
    "নিজের প্রশ্নপত্রে ফিরে যেতে ডেমো বন্ধ করুন।",
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
  "paper creator": "প্রশ্নপত্র তৈরি",
  "choose questions, arrange your paper and download it as a pdf.": "প্রশ্ন বাছাই করুন, প্রশ্নপত্র সাজান এবং PDF ডাউনলোড করুন।",
  "paper style": "প্রশ্নপত্রের ধরন",
  "create a question paper in 3 simple steps": "৩টি সহজ ধাপে প্রশ্নপত্র তৈরি করুন",
  "follow the steps below. your selected questions will appear in the paper preview.": "নিচের ধাপগুলো অনুসরণ করুন। আপনার বাছাই করা প্রশ্নগুলো পাশে প্রিভিউতে দেখা যাবে।",
  "choose class & chapter": "শ্রেণি ও অধ্যায় নির্বাচন",
  "select questions": "প্রশ্ন বাছাই করুন",
  "customize & download": "সাজান ও ডাউনলোড করুন",
  "find questions": "প্রশ্ন খুঁজুন",
  "choose a source and add questions to your paper.": "প্রশ্নের উৎস বেছে নিয়ে প্রশ্নপত্রে যোগ করুন।",
  "set question filters": "প্রশ্নের ফিল্টার নির্বাচন",
  "choose class, subject and chapter.": "শ্রেণি, বিষয় ও অধ্যায় নির্বাচন করুন।",
  class: "শ্রেণি",
  subject: "বিষয়",
  chapter: "অধ্যায়",
  "question type": "প্রশ্নের ধরন",
  "select all required fields to load matching questions.": "প্রশ্ন আনতে প্রয়োজনীয় সব ঘর নির্বাচন করুন।",
  "2. choose questions": "২. প্রশ্ন বাছাই করুন",
  "click a question to add or remove it.": "প্রশ্নে ক্লিক করে প্রশ্নপত্রে যোগ করুন বা বাদ দিন।",
  "filter by type": "ধরন অনুযায়ী বাছাই",
  "no questions to show yet": "এখনও কোনো প্রশ্ন দেখানোর মতো নেই",
  "choose your class, subject and chapter, then apply the filter.": "শ্রেণি, বিষয় ও অধ্যায় নির্বাচন করে ফিল্টার প্রয়োগ করুন।",
  "questions selected": "টি প্রশ্ন নির্বাচিত",
  "your question paper": "আপনার প্রশ্নপত্র",
  "total marks": "মোট নম্বর",
  "clear all": "সব মুছুন",
  "questions you choose will appear here. select a question above to get started.": "আপনার বাছাই করা প্রশ্নগুলো এখানে দেখা যাবে। শুরু করতে উপরের তালিকা থেকে প্রশ্ন নির্বাচন করুন।",
  "drag questions in the preview to change their order. edit individual marks directly on the paper.": "প্রশ্নের ক্রম বদলাতে প্রিভিউতে টেনে সরান। কাগজের ওপর সরাসরি প্রতিটি প্রশ্নের নম্বর সম্পাদনা করুন।",
  "automatic question selection": "স্বয়ংক্রিয় প্রশ্ন নির্বাচন",
  "let the tool choose a random set from the questions you have loaded.": "লোড করা প্রশ্নগুলো থেকে টুলটি এলোমেলোভাবে একটি সেট বেছে নেবে।",
  available: "পাওয়া গেছে",
  "3. customize your paper": "৩. প্রশ্নপত্র সাজান",
  "choose a page size. you can adjust more settings below.": "পৃষ্ঠার আকার বেছে নিন। নিচে আরও সেটিংস পরিবর্তন করতে পারবেন।",
  "change logo": "লোগো পরিবর্তন",
  "remove logo": "লোগো সরান",
  "paper size": "পৃষ্ঠার আকার",
  "set number": "সেট নম্বর",
  "font size": "ফন্টের আকার",
  "layout options": "লেআউট অপশন",
  "more paper settings": "আরও প্রশ্নপত্র সেটিংস",
  "font, layout, answer options and more": "ফন্ট, লেআউট, উত্তর অপশনসহ অন্যান্য সেটিংস",
  "demo preview": "ডেমো প্রিভিউ",
  "add a custom text area to your question paper (optional)": "প্রশ্নপত্রে নিজের মতো করে লেখার জায়গা যোগ করুন (ঐচ্ছিক)",
  "paper preview": "প্রশ্নপত্রের প্রিভিউ",
  "your question paper starts here": "আপনার প্রশ্নপত্র এখানে তৈরি হবে",
  "choose questions from the panel on the left. each question you add will appear here in your paper layout.": "বাম পাশের প্যানেল থেকে প্রশ্ন বাছাই করুন। যোগ করা প্রতিটি প্রশ্ন এখানে প্রশ্নপত্রের আকারে দেখা যাবে।",
  "choose your class": "শ্রেণি নির্বাচন করুন",
  "select class, subject and chapter.": "শ্রেণি, বিষয় ও অধ্যায় নির্বাচন করুন।",
  "apply the filter": "ফিল্টার প্রয়োগ করুন",
  "load the matching questions.": "মিলে যাওয়া প্রশ্নগুলো লোড করুন।",
  "add questions": "প্রশ্ন যোগ করুন",
  "click each question you want to include.": "যে প্রশ্নগুলো রাখতে চান সেগুলোতে ক্লিক করুন।",
  "start with the question filters on the left": "বাম পাশের প্রশ্ন ফিল্টার থেকে শুরু করুন",
  "load more questions": "আরও প্রশ্ন আনুন",
  "fetching more questions...": "আরও প্রশ্ন আনা হচ্ছে...",
  "no more new questions found for this selection.": "এই নির্বাচনের জন্য আর নতুন প্রশ্ন পাওয়া যায়নি।",
  "questions already on your paper stay safe. new ones are added to this list.": "কাগজে থাকা প্রশ্নগুলো অক্ষত থাকবে। নতুন প্রশ্নগুলো এই তালিকায় যোগ হবে।",
  "all questions found for this selection are already on your paper.": "এই নির্বাচনের সব প্রশ্ন ইতিমধ্যে আপনার কাগজে আছে।",
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

  match = /^page (\d+) and its (\d+) questions? will be removed from your paper\.$/i.exec(key);
  if (match)
    return `পৃষ্ঠা ${match[1]} এবং এর ${match[2]}টি প্রশ্ন আপনার প্রশ্নপত্র থেকে সরে যাবে।`;

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
