"use client";
import { useSebaLagbeToolsI18n, L as baseI18nL } from "@/app/sohoj-tools/_i18n";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode, } from "react";
import Link from "next/link";
import { Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Download, ExternalLink, FileText, ImagePlus, LayoutTemplate, Link2, Mail, MapPin, Minus, Phone, Plus, Printer, RotateCw, Share2, ShieldCheck, Star, Trash2, Upload, UserRound, X, } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                 Page-specific English ↔ Bangla localization               */
/* -------------------------------------------------------------------------- */
const ATS_CV_BN: Record<string, string> = {
  "seba lagbe tools": "সেবা লাগবে টুলস",
  "educational tools": "শিক্ষামূলক টুলস",
  "ats friendly cv maker": "ATS উপযোগী CV তৈরির টুল",
  "free": "বিনামূল্যে",
  "build an ats-friendly cv — live preview and high-quality a4 print/pdf flow.": "ATS উপযোগী CV তৈরি করুন—লাইভ প্রিভিউ এবং মানসম্মত A4 প্রিন্ট/PDF সুবিধাসহ।",
  "import": "আমদানি",
  "pdf import": "PDF আমদানি",
  "name, contact": "নাম ও যোগাযোগের তথ্য",
  "personal": "ব্যক্তিগত তথ্য",
  "summary": "সারাংশ",
  "profile": "প্রোফাইল",
  "experience": "অভিজ্ঞতা",
  "work history": "কাজের অভিজ্ঞতা",
  "education": "শিক্ষা",
  "degrees & institutions": "ডিগ্রি ও শিক্ষাপ্রতিষ্ঠান",
  "projects": "প্রকল্প",
  "portfolio work": "পোর্টফোলিওর কাজ",
  "skills": "দক্ষতা",
  "skills, certifications": "দক্ষতা ও সনদ",
  "custom": "নিজস্ব বিভাগ",
  "custom section": "নিজস্ব বিভাগ",
  "extra sections": "অতিরিক্ত বিভাগ",
  "classic ats": "ক্লাসিক ATS",
  "modern": "আধুনিক",
  "professional": "পেশাদার",
  "elegant": "মার্জিত",
  "your cv preview will appear here": "আপনার CV-এর প্রিভিউ এখানে দেখা যাবে",
  "start filling the form to build your ats-friendly cv.": "ATS উপযোগী CV তৈরি করতে ফর্মটি পূরণ করা শুরু করুন।",
  "ats cv preview": "ATS CV প্রিভিউ",
  "your name": "আপনার নাম",
  "professional title": "পেশাগত পদবি",
  "start date": "শুরুর তারিখ",
  "present": "বর্তমান",
  "job title": "পদবি",
  "degree / certificate": "ডিগ্রি / সনদ",
  "project": "প্রকল্প",
  "professional experience": "পেশাগত অভিজ্ঞতা",
  "certifications": "সনদপত্র",
  "languages": "ভাষাসমূহ",
  "0. import from pdf": "০. PDF থেকে তথ্য নিন",
  "upload an existing text-based cv pdf to pre-fill common fields directly in your browser.": "আগের কোনো টেক্সট-ভিত্তিক CV PDF আপলোড করে ব্রাউজারেই সাধারণ তথ্যের ঘরগুলো স্বয়ংক্রিয়ভাবে পূরণ করুন।",
  "reading pdf…": "PDF পড়া হচ্ছে…",
  "upload an existing cv pdf": "আগের CV-এর PDF আপলোড করুন",
  "up to 8 mb. text-based pdfs can be parsed in the browser; scanned image-only pdfs may require manual entry.": "সর্বোচ্চ ৮ MB। টেক্সট-ভিত্তিক PDF ব্রাউজারেই পড়া যায়; স্ক্যান করা ছবির PDF-এর তথ্য হাতে লিখতে হতে পারে।",
  "imported:": "আমদানি করা ফাইল:",
  "1. personal information": "১. ব্যক্তিগত তথ্য",
  "these details appear at the top of your cv and are synced with the preview instantly.": "এই তথ্যগুলো CV-এর শুরুতে দেখানো হবে এবং টাইপ করার সঙ্গে সঙ্গে প্রিভিউতে আপডেট হবে।",
  "photo (optional)": "ছবি (ঐচ্ছিক)",
  "recommended: square image": "বর্গাকার ছবি ব্যবহার করার পরামর্শ দেওয়া হচ্ছে",
  "change photo": "ছবি পরিবর্তন করুন",
  "add photo": "ছবি যোগ করুন",
  "remove photo": "ছবি সরান",
  "photo design on": "ছবির নকশা চালু",
  "design photo": "ছবির নকশা",
  "shape": "আকৃতি",
  "square": "বর্গাকার",
  "rounded": "গোল কোণা",
  "circle": "বৃত্তাকার",
  "full name": "পূর্ণ নাম",
  "naphia jannatul mowa": "আপনার পূর্ণ নাম লিখুন",
  "job title / headline": "পদবি / পেশাগত পরিচিতি",
  "senior marketing manager": "সিনিয়র মার্কেটিং ম্যানেজার",
  "email": "ইমেইল",
  "name@example.com": "name@example.com",
  "phone": "ফোন নম্বর",
  "+880 1xxxxxxxxx": "+880 1XXXXXXXXX",
  "location / address": "অবস্থান / ঠিকানা",
  "dhaka, bangladesh": "ঢাকা, বাংলাদেশ",
  "linkedin (optional)": "LinkedIn (ঐচ্ছিক)",
  "linkedin.com/in/username": "linkedin.com/in/username",
  "website / portfolio (optional)": "ওয়েবসাইট / পোর্টফোলিও (ঐচ্ছিক)",
  "portfolio.com": "portfolio.com",
  "2. professional summary": "২. পেশাগত সারাংশ",
  "write a concise value statement. keep it focused on experience, strengths, and the type of role you want.": "আপনার অভিজ্ঞতা, দক্ষতা এবং কাঙ্ক্ষিত পদের সঙ্গে মিল রেখে সংক্ষিপ্ত পেশাগত পরিচিতি লিখুন।",
  "section title on cv": "CV-তে বিভাগের শিরোনাম",
  "results-oriented professional with experience in…": "অভিজ্ঞতাসম্পন্ন পেশাজীবী, যিনি ফলাফল ও উন্নতিতে গুরুত্ব দেন…",
  "3. work experience": "৩. কাজের অভিজ্ঞতা",
  "add roles in reverse chronological order. use measurable responsibilities and achievements where possible.": "সর্বশেষ কাজটি আগে দিয়ে অভিজ্ঞতাগুলো যোগ করুন। সম্ভব হলে দায়িত্ব ও অর্জন পরিমাপযোগ্যভাবে লিখুন।",
  "add": "যোগ করুন",
  "no experience added yet. add your first role below.": "এখনো কোনো কাজের অভিজ্ঞতা যোগ করা হয়নি। নিচে প্রথম অভিজ্ঞতাটি যোগ করুন।",
  "remove": "সরান",
  "marketing manager": "মার্কেটিং ম্যানেজার",
  "company": "প্রতিষ্ঠান",
  "company name": "প্রতিষ্ঠানের নাম",
  "location": "অবস্থান",
  "city, country": "শহর, দেশ",
  "jan 2022": "জানুয়ারি ২০২২",
  "end date": "শেষের তারিখ",
  "dec 2024": "ডিসেম্বর ২০২৪",
  "currently employed": "এখনো এই প্রতিষ্ঠানে কর্মরত",
  "responsibilities & achievements": "দায়িত্ব ও অর্জন",
  "led a team of 6… improved campaign performance by 40%…": "৬ জনের একটি দল পরিচালনা করেছি… প্রচারণার কার্যকারিতা ৪০% বাড়িয়েছি…",
  "add another experience": "আরও অভিজ্ঞতা যোগ করুন",
  "4. education": "৪. শিক্ষাগত যোগ্যতা",
  "add degrees, certificates, training, or other academic credentials.": "ডিগ্রি, সনদ, প্রশিক্ষণ বা অন্যান্য শিক্ষাগত যোগ্যতা যোগ করুন।",
  "no education added yet. add your first qualification below.": "এখনো কোনো শিক্ষাগত যোগ্যতা যোগ করা হয়নি। নিচে প্রথম যোগ্যতাটি যোগ করুন।",
  "b.sc. in computer science": "কম্পিউটার সায়েন্সে স্নাতক (B.Sc.)",
  "institution": "শিক্ষাপ্রতিষ্ঠান",
  "university name": "বিশ্ববিদ্যালয়ের নাম",
  "toronto, canada": "টরন্টো, কানাডা",
  "start / year": "শুরুর তারিখ / বছর",
  "graduation / end date": "স্নাতক / শেষের তারিখ",
  "details (one per line, optional)": "বিস্তারিত (প্রতি লাইনে একটি, ঐচ্ছিক)",
  "dean’s list relevant coursework: marketing analytics": "ডিনস লিস্ট\nপ্রাসঙ্গিক পাঠ্যক্রম: মার্কেটিং অ্যানালিটিক্স",
  "add another education": "আরও শিক্ষাগত যোগ্যতা যোগ করুন",
  "5. projects": "৫. প্রকল্প",
  "showcase relevant portfolio projects, freelance work, case studies, or coursework.": "প্রাসঙ্গিক পোর্টফোলিও প্রকল্প, ফ্রিল্যান্স কাজ, কেস স্টাডি বা কোর্সের কাজ তুলে ধরুন।",
  "no projects added yet. this section is optional.": "এখনো কোনো প্রকল্প যোগ করা হয়নি। এই বিভাগটি ঐচ্ছিক।",
  "project name": "প্রকল্পের নাম",
  "portfolio website": "পোর্টফোলিও ওয়েবসাইট",
  "role / technology": "ভূমিকা / প্রযুক্তি",
  "react developer": "React ডেভেলপার",
  "project link (optional)": "প্রকল্পের লিংক (ঐচ্ছিক)",
  "description": "বিবরণ",
  "built a responsive… improved performance…": "সব ধরনের পর্দায় মানানসই ব্যবস্থা তৈরি করেছি… কার্যকারিতা উন্নত করেছি…",
  "add another project": "আরও প্রকল্প যোগ করুন",
  "6. additional": "৬. অতিরিক্ত তথ্য",
  "skills section title on cv": "CV-তে দক্ষতা বিভাগের শিরোনাম",
  "add ats-readable skills, certifications, and languages. each entry is kept as real text in the cv, not as an image.": "ATS সহজে পড়তে পারে এমন দক্ষতা, সনদ ও ভাষা যোগ করুন। প্রতিটি তথ্য CV-তে ছবি নয়, আসল টেক্সট হিসেবে থাকবে।",
  "digital marketing": "ডিজিটাল মার্কেটিং",
  "level (optional)": "দক্ষতার স্তর (ঐচ্ছিক)",
  "advanced": "উন্নত",
  "add skill": "দক্ষতা যোগ করুন",
  "certifications section title": "সনদপত্র বিভাগের শিরোনাম",
  "certifications (one per line, optional)": "সনদপত্র (প্রতি লাইনে একটি, ঐচ্ছিক)",
  "google ads certification hubspot inbound marketing": "Google Ads সনদ\nHubSpot Inbound Marketing",
  "languages section title": "ভাষা বিভাগের শিরোনাম",
  "languages (one per line, optional)": "ভাষাসমূহ (প্রতি লাইনে একটি, ঐচ্ছিক)",
  "english — fluent french — intermediate": "ইংরেজি — সাবলীল\nফরাসি — মধ্যম স্তর",
  "7. custom sections (optional)": "৭. নিজস্ব বিভাগ (ঐচ্ছিক)",
  "add extra sections such as awards, volunteer work, publications, interests, or leadership. empty sections will not appear on the cv.": "পুরস্কার, স্বেচ্ছাসেবা, প্রকাশনা, আগ্রহ বা নেতৃত্বের মতো অতিরিক্ত বিভাগ যোগ করুন। ফাঁকা বিভাগ CV-তে দেখা যাবে না।",
  "no extra sections yet. add one only when you need it.": "এখনো কোনো অতিরিক্ত বিভাগ নেই। প্রয়োজন হলেই যোগ করুন।",
  "section title": "বিভাগের শিরোনাম",
  "awards": "পুরস্কার",
  "content": "বিষয়বস্তু",
  "awarded… led…": "পুরস্কার পেয়েছি… নেতৃত্ব দিয়েছি…",
  "add new section": "নতুন বিভাগ যোগ করুন",
  "favorite": "প্রিয় তালিকায় যোগ করুন",
  "share": "শেয়ার করুন",
  "zoom out": "ছোট করে দেখুন",
  "zoom in": "বড় করে দেখুন",
  "settings": "সেটিংস",
  "fill in your cv step by step. the preview updates as you type.": "ধাপে ধাপে CV পূরণ করুন। টাইপ করার সঙ্গে সঙ্গে প্রিভিউ আপডেট হবে।",
  "template": "টেমপ্লেট",
  "more designs coming soon": "নতুন নকশা শিগগিরই আসছে",
  "previous step": "আগের ধাপ",
  "‹ previous step": "‹ আগের ধাপ",
  "next step": "পরের ধাপ",
  "view preview": "প্রিভিউ দেখুন",
  "preview": "প্রিভিউ",
  "live preview": "লাইভ প্রিভিউ",
  "steps ·": "ধাপ ·",
  "· a4": "· A4",
  "ready": "প্রস্তুত",
  "draft": "খসড়া",
  "cv ready for download / print.": "CV ডাউনলোড বা প্রিন্ট করার জন্য প্রস্তুত।",
  "complete the required fields to export your cv.": "CV ডাউনলোড করতে প্রয়োজনীয় ঘরগুলো পূরণ করুন।",
  "clear all": "সব মুছে দিন",
  "preparing…": "প্রস্তুত করা হচ্ছে…",
  "print": "প্রিন্ট করুন",
  "download pdf": "PDF ডাউনলোড করুন",
  "your cv and images are processed in your browser. this component does not upload your cv data to a server.": "আপনার CV ও ছবি ব্রাউজারেই প্রক্রিয়াকরণ করা হয়। এই টুল আপনার CV-এর তথ্য সার্ভারে আপলোড করে না।",
  "how to use": "ব্যবহারের নিয়ম",
  "1. choose a template from the top section.": "১. উপরের অংশ থেকে একটি টেমপ্লেট বেছে নিন।",
  "2. import an existing pdf or fill each step manually.": "২. আগের কোনো PDF থেকে তথ্য নিন অথবা প্রতিটি ধাপ হাতে পূরণ করুন।",
  "3. watch the a4 preview update instantly as you type.": "৩. টাইপ করার সঙ্গে সঙ্গে A4 প্রিভিউ আপডেট হতে দেখুন।",
  "4. use print or download pdf, then choose save as pdf in your browser’s print dialog.": "৪. প্রিন্ট বা PDF ডাউনলোড নির্বাচন করুন, এরপর ব্রাউজারের প্রিন্ট উইন্ডোতে ‘Save as PDF’ বেছে নিন।",
  "tools in the same category": "একই বিভাগের অন্যান্য টুল",
  "all seba lagbe tools": "সব সহজ টুল",
  "explore the complete collection of browser-based tools in one place.": "ব্রাউজারেই ব্যবহারযোগ্য সব টুল এক জায়গায় দেখুন।",
  "uploaded profile": "আপলোড করা প্রোফাইল ছবি",
  "reset to fit the panel width": "প্রিভিউকে প্যানেলের প্রস্থ অনুযায়ী দেখান",
  "scrollable a4 cv preview": "স্ক্রল করা যায় এমন A4 CV প্রিভিউ",
  "cv preview panel": "CV প্রিভিউ প্যানেল",
  "add your full name in personal information before continuing.": "পরবর্তী ধাপে যাওয়ার আগে ব্যক্তিগত তথ্য অংশে আপনার পূর্ণ নাম লিখুন।",
  "add your email address in personal information before continuing.": "পরবর্তী ধাপে যাওয়ার আগে ব্যক্তিগত তথ্য অংশে আপনার ইমেইল ঠিকানা লিখুন।",
  "enter a valid email address in personal information before continuing.": "পরবর্তী ধাপে যাওয়ার আগে ব্যক্তিগত তথ্য অংশে সঠিক ইমেইল ঠিকানা লিখুন।",
  "enter a valid email address.": "সঠিক ইমেইল ঠিকানা লিখুন।",
  "please select a valid image file.": "সঠিক ছবি ফাইল নির্বাচন করুন।",
  "profile photo must be 5 mb or smaller.": "প্রোফাইল ছবির আকার সর্বোচ্চ ৫ MB হতে পারবে।",
  "profile photo added to your cv.": "CV-তে প্রোফাইল ছবি যোগ করা হয়েছে।",
  "the photo could not be read. please try another image.": "ছবিটি পড়া যায়নি। অন্য একটি ছবি দিয়ে চেষ্টা করুন।",
  "please upload a pdf cv file.": "CV-এর PDF ফাইল আপলোড করুন।",
  "pdf import is limited to 8 mb.": "PDF আমদানির সর্বোচ্চ সীমা ৮ MB।",
  "the pdf was uploaded, but no selectable text was found. this usually means the cv is scanned; fill the fields manually or import a text-based pdf.": "PDF আপলোড হয়েছে, কিন্তু নির্বাচনযোগ্য টেক্সট পাওয়া যায়নি। সম্ভবত CV-টি স্ক্যান করা ছবি। ঘরগুলো হাতে পূরণ করুন অথবা টেক্সট-ভিত্তিক PDF ব্যবহার করুন।",
  "the pdf was read in your browser and the detected fields were added to the form.": "ব্রাউজারে PDF পড়ে পাওয়া তথ্য ফর্মে যোগ করা হয়েছে।",
  "this pdf could not be read in the browser. you can still fill the cv manually.": "ব্রাউজারে এই PDF পড়া যায়নি। আপনি চাইলে হাতে CV পূরণ করতে পারেন।",
  "add your full name and email before exporting the cv.": "CV তৈরি বা ডাউনলোডের আগে আপনার পূর্ণ নাম ও ইমেইল দিন।",
  "print dialog opened. choose ‘save as pdf’ and keep paper size set to a4.": "প্রিন্ট উইন্ডো খোলা হয়েছে। ‘Save as PDF’ বেছে নিন এবং কাগজের মাপ A4 রাখুন।",
  "print dialog opened with only the cv preview visible.": "শুধু CV প্রিভিউ দেখিয়ে প্রিন্ট উইন্ডো খোলা হয়েছে।",
  "share sheet opened.": "শেয়ার করার উইন্ডো খোলা হয়েছে।",
  "tool link copied to your clipboard.": "টুলের লিংক ক্লিপবোর্ডে কপি করা হয়েছে।",
  "copy the page url from your browser to share this cv maker.": "CV তৈরির টুলটি শেয়ার করতে ব্রাউজার থেকে পেজের URL কপি করুন।",
  "the form is already clear.": "ফর্মটি ইতিমধ্যেই ফাঁকা আছে।",
  "clear all cv data? this will remove your personal details, experience, education, projects, skills, and custom sections.": "CV-এর সব তথ্য মুছে ফেলবেন? এতে ব্যক্তিগত তথ্য, অভিজ্ঞতা, শিক্ষা, প্রকল্প, দক্ষতা এবং নিজস্ব বিভাগ মুছে যাবে।",
  "all cv fields were reset.": "CV-এর সব ঘর রিসেট করা হয়েছে।",
  "dismiss error": "ত্রুটির বার্তা বন্ধ করুন",
  "dismiss notice": "বিজ্ঞপ্তি বন্ধ করুন",
  "private & on-device": "ব্যক্তিগত ও আপনার ডিভাইসেই প্রক্রিয়াকৃত",
  "your image is processed in your browser and is never uploaded. the ai model downloads once on first use and is cached after that. it also removes noise and jpeg blockiness, so larger images take more time.": "আপনার ছবি ব্রাউজারেই প্রক্রিয়াকরণ করা হয়, কোথাও আপলোড করা হয় না। AI মডেল প্রথম ব্যবহারে একবার ডাউনলোড হয় এবং পরে ক্যাশে থাকে। এটি ছবির নয়েজ ও JPEG-এর ব্লকজাতীয় দাগও কমায়, তাই বড় ছবিতে বেশি সময় লাগে।",
};

function normalizeAtsCvText(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\\r\\n/g, " ")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getAtsCvLocale(): string {
  if (typeof document === "undefined") return "en";
  return document.documentElement.getAttribute("data-locale") || "en";
}

function translateAtsCvText(value: unknown, locale: string | undefined, fallback?: string): string {
  const raw = String(value ?? "");
  if (!locale || !String(locale).toLowerCase().startsWith("bn") || !/[A-Za-z]/.test(raw)) return raw;
  const key = normalizeAtsCvText(raw);
  let translated = ATS_CV_BN[key];

  let match: RegExpExecArray | null;
  if (translated === undefined && (match = /^skill (\d+)$/i.exec(key))) translated = `দক্ষতা ${match[1]}`;
  if (translated === undefined && (match = /^remove skill (\d+)$/i.exec(key))) translated = `দক্ষতা ${match[1]} সরান`;
  if (translated === undefined && (match = /^(experience|education|project|custom section) (\d+)$/i.exec(key))) {
    const labels: Record<string, string> = { experience: "অভিজ্ঞতা", education: "শিক্ষাগত যোগ্যতা", project: "প্রকল্প", "custom section": "নিজস্ব বিভাগ" };
    translated = `${labels[match[1]]} ${match[2]}`;
  }
  if (translated === undefined && (match = /^(\d+) of (\d+) fields filled$/i.exec(key))) translated = `${match[2]}টির মধ্যে ${match[1]}টি ঘর পূরণ হয়েছে`;
  if (translated === undefined && (match = /^this file is (.+)\. the maximum size is (.+)\.$/i.exec(key))) translated = `ফাইলটির আকার ${match[1]}। সর্বোচ্চ অনুমোদিত আকার ${match[2]}।`;
  if (translated === undefined && (match = /^output size: ([\d,]+) × ([\d,]+) px$/i.exec(key))) translated = `আউটপুটের মাপ: ${match[1]} × ${match[2]} পিক্সেল`;
  if (translated === undefined && (match = /^([\d,]+) × ([\d,]+) px is over the ([\d,]+) × ([\d,]+) px browser limit\. choose 2x or use a smaller image\.$/i.exec(key))) translated = `${match[1]} × ${match[2]} পিক্সেল ব্রাউজারের ${match[3]} × ${match[4]} পিক্সেল সীমার চেয়ে বড়। 2x নির্বাচন করুন অথবা ছোট ছবি ব্যবহার করুন।`;
  if (translated === undefined && (match = /^remove skill (\d+)$/i.exec(key))) translated = `দক্ষতা ${match[1]} সরান`;

  if (translated === undefined && fallback && fallback !== raw) {
    const hasBangla = /[\u0980-\u09FF]/.test(fallback);
    const technicalRemoved = fallback.replace(/\b(?:PDF|CV|ATS|A4|URL|NID|AI|MB|KB|LinkedIn|React|Google|HubSpot)\b/gi, "");
    if (hasBangla && !/[A-Za-z]/.test(technicalRemoved)) translated = fallback;
  }
  if (translated === undefined) translated = raw;

  // Keep deliberate spacing in JSX fragments such as labels joined to a count.
  const leading = raw.match(/^\s*/)?.[0] ?? "";
  const trailing = raw.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function L(value: string): string {
  return translateAtsCvText(value, getAtsCvLocale(), baseI18nL(value));
}

function AtsCvText({ children }: { children: ReactNode }) {
  const { locale, L: globalL } = useSebaLagbeToolsI18n();
  if (typeof children === "string" || typeof children === "number") {
    return <>{translateAtsCvText(children, locale, globalL(String(children)))}</>;
  }
  return <>{children}</>;
}


/* -------------------------------------------------------------------------- */
/*                                Type system                                 */
/* -------------------------------------------------------------------------- */
type TemplateId = "classic" | "modern" | "professional" | "elegant";
type PhotoShape = "square" | "rounded" | "circle";
export interface PersonalDetails {
    fullName: string;
    jobTitle: string;
    address: string;
    email: string;
    phone: string;
    linkedin: string;
    website: string;
    photo: string;
    designPhoto: boolean;
    photoShape: PhotoShape;
}
export interface Experience {
    id: string;
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    currentlyEmployed: boolean;
    description: string;
}
export interface Education {
    id: string;
    degree: string;
    institution: string;
    location: string;
    startDate: string;
    endDate: string;
    details: string;
}
export interface Skill {
    id: string;
    name: string;
    level: string;
}
export interface Project {
    id: string;
    name: string;
    role: string;
    link: string;
    description: string;
}
export interface CustomSection {
    id: string;
    title: string;
    content: string;
}
export interface CVData {
    personal: PersonalDetails;
    summary: string;
    summaryTitle: string;
    experiences: Experience[];
    experienceTitle: string;
    education: Education[];
    educationTitle: string;
    projects: Project[];
    projectTitle: string;
    skills: Skill[];
    skillsTitle: string;
    certificates: string;
    certificateTitle: string;
    languages: string;
    languageTitle: string;
    customSections: CustomSection[];
    selectedTemplate: TemplateId;
    importedFileName: string;
}
type CVAction = {
    type: "LOAD";
    data: CVData;
} | {
    type: "SET_TEMPLATE";
    template: TemplateId;
} | {
    type: "SET_SUMMARY";
    value: string;
} | {
    type: "SET_SECTION_TITLE";
    section: "summary" | "experience" | "education" | "project" | "skills" | "certificate" | "language";
    value: string;
} | {
    type: "UPDATE_PERSONAL";
    field: keyof PersonalDetails;
    value: string | boolean | PhotoShape;
} | {
    type: "ADD_EXPERIENCE";
} | {
    type: "UPDATE_EXPERIENCE";
    id: string;
    field: keyof Experience;
    value: string | boolean;
} | {
    type: "REMOVE_EXPERIENCE";
    id: string;
} | {
    type: "ADD_EDUCATION";
} | {
    type: "UPDATE_EDUCATION";
    id: string;
    field: keyof Education;
    value: string;
} | {
    type: "REMOVE_EDUCATION";
    id: string;
} | {
    type: "ADD_PROJECT";
} | {
    type: "UPDATE_PROJECT";
    id: string;
    field: keyof Project;
    value: string;
} | {
    type: "REMOVE_PROJECT";
    id: string;
} | {
    type: "SET_SKILLS";
    skills: Skill[];
} | {
    type: "UPDATE_SKILL";
    id: string;
    field: keyof Skill;
    value: string;
} | {
    type: "ADD_SKILL";
} | {
    type: "REMOVE_SKILL";
    id: string;
} | {
    type: "SET_CERTIFICATES";
    value: string;
} | {
    type: "SET_LANGUAGES";
    value: string;
} | {
    type: "ADD_CUSTOM";
} | {
    type: "UPDATE_CUSTOM";
    id: string;
    field: keyof CustomSection;
    value: string;
} | {
    type: "REMOVE_CUSTOM";
    id: string;
} | {
    type: "SET_IMPORTED_FILE";
    value: string;
} | {
    type: "RESET";
};
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const createExperience = (): Experience => ({
    id: uid("exp"),
    jobTitle: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    currentlyEmployed: false,
    description: "",
});
const createEducation = (): Education => ({
    id: uid("edu"),
    degree: "",
    institution: "",
    location: "",
    startDate: "",
    endDate: "",
    details: "",
});
const createProject = (): Project => ({
    id: uid("project"),
    name: "",
    role: "",
    link: "",
    description: "",
});
const createSkill = (): Skill => ({ id: uid("skill"), name: "", level: "" });
const createCustomSection = (): CustomSection => ({
    id: uid("custom"),
    title: "",
    content: "",
});
const createInitialCVData = (): CVData => ({
    personal: {
        fullName: "",
        jobTitle: "",
        address: "",
        email: "",
        phone: "",
        linkedin: "",
        website: "",
        photo: "",
        designPhoto: false,
        photoShape: "square",
    },
    summary: "",
    summaryTitle: "SUMMARY",
    experiences: [],
    experienceTitle: "PROFESSIONAL EXPERIENCE",
    education: [],
    educationTitle: "EDUCATION",
    projects: [],
    projectTitle: "PROJECTS",
    skills: [],
    skillsTitle: "SKILLS",
    certificates: "",
    certificateTitle: "CERTIFICATIONS",
    languages: "",
    languageTitle: "LANGUAGES",
    customSections: [],
    selectedTemplate: "classic",
    importedFileName: "",
});
function reducer(state: CVData, action: CVAction): CVData {
    switch (action.type) {
        case "LOAD":
            return action.data;
        case "SET_TEMPLATE":
            return { ...state, selectedTemplate: action.template };
        case "SET_SUMMARY":
            return { ...state, summary: action.value };
        case "SET_SECTION_TITLE":
            switch (action.section) {
                case "summary":
                    return { ...state, summaryTitle: action.value };
                case "experience":
                    return { ...state, experienceTitle: action.value };
                case "education":
                    return { ...state, educationTitle: action.value };
                case "project":
                    return { ...state, projectTitle: action.value };
                case "skills":
                    return { ...state, skillsTitle: action.value };
                case "certificate":
                    return { ...state, certificateTitle: action.value };
                case "language":
                    return { ...state, languageTitle: action.value };
            }
        case "UPDATE_PERSONAL":
            return {
                ...state,
                personal: {
                    ...state.personal,
                    [action.field]: action.value,
                } as PersonalDetails,
            };
        case "ADD_EXPERIENCE":
            return {
                ...state,
                experiences: [...state.experiences, createExperience()],
            };
        case "UPDATE_EXPERIENCE":
            return {
                ...state,
                experiences: state.experiences.map((item) => item.id === action.id
                    ? { ...item, [action.field]: action.value }
                    : item),
            };
        case "REMOVE_EXPERIENCE":
            return {
                ...state,
                experiences: state.experiences.filter((item) => item.id !== action.id),
            };
        case "ADD_EDUCATION":
            return { ...state, education: [...state.education, createEducation()] };
        case "UPDATE_EDUCATION":
            return {
                ...state,
                education: state.education.map((item) => item.id === action.id
                    ? { ...item, [action.field]: action.value }
                    : item),
            };
        case "REMOVE_EDUCATION":
            return {
                ...state,
                education: state.education.filter((item) => item.id !== action.id),
            };
        case "ADD_PROJECT":
            return { ...state, projects: [...state.projects, createProject()] };
        case "UPDATE_PROJECT":
            return {
                ...state,
                projects: state.projects.map((item) => item.id === action.id
                    ? { ...item, [action.field]: action.value }
                    : item),
            };
        case "REMOVE_PROJECT":
            return {
                ...state,
                projects: state.projects.filter((item) => item.id !== action.id),
            };
        case "ADD_SKILL":
            return { ...state, skills: [...state.skills, createSkill()] };
        case "UPDATE_SKILL":
            return {
                ...state,
                skills: state.skills.map((item) => item.id === action.id
                    ? { ...item, [action.field]: action.value }
                    : item),
            };
        case "REMOVE_SKILL":
            return {
                ...state,
                skills: state.skills.filter((item) => item.id !== action.id),
            };
        case "SET_SKILLS":
            return { ...state, skills: action.skills };
        case "SET_CERTIFICATES":
            return { ...state, certificates: action.value };
        case "SET_LANGUAGES":
            return { ...state, languages: action.value };
        case "ADD_CUSTOM":
            return {
                ...state,
                customSections: [...state.customSections, createCustomSection()],
            };
        case "UPDATE_CUSTOM":
            return {
                ...state,
                customSections: state.customSections.map((item) => item.id === action.id
                    ? { ...item, [action.field]: action.value }
                    : item),
            };
        case "REMOVE_CUSTOM":
            return {
                ...state,
                customSections: state.customSections.filter((item) => item.id !== action.id),
            };
        case "SET_IMPORTED_FILE":
            return { ...state, importedFileName: action.value };
        case "RESET":
            return createInitialCVData();
        default:
            return state;
    }
}
const steps = [
    { id: 1, label: "Import", meta: "PDF import" },
    { id: 2, label: "Personal", meta: "Name, contact" },
    { id: 3, label: "Summary", meta: "Profile" },
    { id: 4, label: "Experience", meta: "Work history" },
    { id: 5, label: "Education", meta: "Degrees & institutions" },
    { id: 6, label: "Projects", meta: "Portfolio work" },
    { id: 7, label: "Skills", meta: "Skills, certifications" },
    { id: 8, label: "Custom", meta: "Extra sections" },
] as const;
const templates: Array<{
    id: TemplateId;
    label: string;
    accent: string;
    preview: string;
}> = [
    { id: "classic", label: "Classic ATS", accent: "#2563EB", preview: "amber" },
    { id: "modern", label: "Modern", accent: "#0f8d91", preview: "teal" },
    {
        id: "professional",
        label: "Professional",
        accent: "#2f8f63",
        preview: "green",
    },
    { id: "elegant", label: "Elegant", accent: "#8c4ab8", preview: "purple" },
];
/* -------------------------------------------------------------------------- */
/*                              Small UI helpers                              */
/* -------------------------------------------------------------------------- */
type FieldProps = {
    label: string;
    value: string;
    placeholder?: string;
    required?: boolean;
    type?: string;
    onChange: (value: string) => void;
    icon?: ReactNode;
    error?: string;
    disabled?: boolean;
};
function Field({ label, value, placeholder, required, type = "text", onChange, icon, error, disabled = false, }: FieldProps) {
    return (<label className="block space-y-1.5">
      <span className="flex items-center justify-between gap-2 text-[12px] font-semibold text-[#3B2F1E]">
        <span>
          {L(label)} {required ? <span className="text-[#DC2626]"><AtsCvText>{"*"}</AtsCvText></span> : null}
        </span>
      </span>
      <div className={`relative ${error ? "" : ""}`}>
        {icon ? (<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A50]">
            {icon}
          </span>) : null}
        <input type={type} value={/section title/i.test(label) ? L(value) : value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder ? L(placeholder) : undefined} disabled={disabled} className={`w-full rounded-lg border bg-[#FBF6E8] px-3 py-2 text-[13px] text-[#3B2F1E] outline-none transition focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 ${icon ? "pl-9" : ""} ${error ? "border-rose-300 ring-1 ring-rose-100" : "border-[#E3D6B8]"}`}/>
      </div>
      {error ? (<span className="text-[11px] font-medium text-[#DC2626]">{L(error)}</span>) : null}
    </label>);
}
function TextAreaField({ label, value, placeholder, onChange, rows = 5, }: {
    label: string;
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
    rows?: number;
}) {
    return (<label className="block space-y-1.5">
      <span className="text-[12px] font-semibold text-[#3B2F1E]">{L(label)}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder ? L(placeholder) : undefined} rows={rows} className="w-full resize-y rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2 text-[13px] leading-relaxed text-[#3B2F1E] outline-none transition focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"/>
    </label>);
}
function PrimaryButton({ children, onClick, type = "button", disabled, className = "", title, }: {
    children: ReactNode;
    onClick?: () => void;
    type?: "button" | "submit";
    disabled?: boolean;
    className?: string;
    title?: string;
}) {
    return (<button type={type} onClick={onClick} disabled={disabled} title={title ? L(title) : undefined} className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#D42020] px-3 py-2 text-[12px] font-bold text-white shadow-sm transition hover:bg-[#AE1717] disabled:cursor-not-allowed disabled:opacity-70 ${className}`}>
      {children}
    </button>);
}
function SecondaryButton({ children, onClick, disabled, className = "", }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}) {
    return (<button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2 text-[12px] font-semibold text-[#5A4A32] transition hover:bg-[#EFE3C8] disabled:cursor-not-allowed disabled:opacity-70 ${className}`}>
      {children}
    </button>);
}
function SectionCard({ title, description, children, action, }: {
    title: string;
    description?: string;
    children: ReactNode;
    action?: ReactNode;
}) {
    return (<section className="space-y-3 rounded-xl border border-[#E3D6B8]/80 bg-[#FBF6E8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-[#DC2626]">
            {L(title)}
          </h3>
          {description ? (<p className="mt-1 text-[12px] leading-relaxed text-[#5A4A32]">
              {L(description)}
            </p>) : null}
        </div>
        {action}
      </div>
      {children}
    </section>);
}
function IconButton({ label, onClick, children, active, }: {
    label: string;
    onClick: () => void;
    children: ReactNode;
    active?: boolean;
}) {
    return (<button type="button" title={L(label)} aria-label={L(label)} onClick={onClick} className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${active
            ? "border-[#DC2626] bg-[#F6EEDB] text-[#DC2626]"
            : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:bg-[#EFE3C8] hover:text-[#3B2F1E]"}`}>
      {children}
    </button>);
}
function EmptyState({ text }: {
    text: string;
}) {
    return (<div className="rounded-lg border border-dashed border-[#E3D6B8] bg-[#F6EEDB]/70 p-4 text-center text-[12px] text-[#7A6A50]">
      {L(text)}
    </div>);
}
/* -------------------------------------------------------------------------- */
/*                          Browser-only PDF import                           */
/* -------------------------------------------------------------------------- */
function decodePdfLiteral(input: string): string {
    return input
        .replace(/\\([\\()])/g, "$1")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\b/g, "\b")
        .replace(/\\f/g, "\f");
}
function extractTextOperators(source: string): string {
    const chunks: string[] = [];
    const literal = /\((?:\\.|[^\\)])*\)\s*Tj/g;
    const array = /\[([\s\S]*?)\]\s*TJ/g;
    let match: RegExpExecArray | null;
    while ((match = literal.exec(source))) {
        const raw = match[0].replace(/\)\s*Tj$/, "").slice(1);
        chunks.push(decodePdfLiteral(raw));
    }
    while ((match = array.exec(source))) {
        const pieces = match[1].match(/\((?:\\.|[^\\)])*\)/g) ?? [];
        for (const piece of pieces) {
            chunks.push(decodePdfLiteral(piece.slice(1, -1)));
        }
        chunks.push("\n");
    }
    return chunks
        .join(" ")
        .replace(/\s{2,}/g, " ")
        .trim();
}
/* -------------------------------------------------------------------------- */
/*                    Concrete ArrayBuffer helper for Blob                    */
/* -------------------------------------------------------------------------- */
function toRealArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const buffer = new ArrayBuffer(bytes.byteLength);
    const view = new Uint8Array(buffer);
    view.set(bytes);
    return buffer;
}
async function inflateDeflatedStream(data: Uint8Array): Promise<Uint8Array> {
    if (typeof DecompressionStream === "undefined") {
        throw new Error("This browser does not support PDF stream decompression.");
    }
    const dataBuffer = toRealArrayBuffer(data);
    const stream = new Blob([dataBuffer])
        .stream()
        .pipeThrough(new DecompressionStream("deflate"));
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
}
async function extractPdfText(file: File): Promise<string> {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const latin = new TextDecoder("latin1").decode(bytes);
    const collected: string[] = [];
    const flateRegex = /\/Filter\s*\/FlateDecode[\s\S]*?stream\r?\n/g;
    let match: RegExpExecArray | null;
    while ((match = flateRegex.exec(latin))) {
        const start = match.index + match[0].length;
        const end = latin.indexOf("endstream", start);
        if (end === -1)
            continue;
        let raw = bytes.slice(start, end);
        while (raw.length && (raw[0] === 10 || raw[0] === 13)) {
            raw = raw.slice(1);
        }
        while (raw.length &&
            (raw[raw.length - 1] === 10 || raw[raw.length - 1] === 13)) {
            raw = raw.slice(0, -1);
        }
        try {
            const inflated = await inflateDeflatedStream(raw);
            const decoded = new TextDecoder("latin1").decode(inflated);
            const extracted = extractTextOperators(decoded);
            if (extracted)
                collected.push(extracted);
        }
        catch {
            // Continue with uncompressed PDF text blocks.
        }
    }
    const direct = extractTextOperators(latin);
    if (direct)
        collected.push(direct);
    return collected
        .join("\n")
        .replace(/\s{2,}/g, " ")
        .trim();
}
function normalizeTextLines(text: string): string[] {
    return text
        .split(/\r?\n|(?<=\.)\s{2,}/)
        .map((line) => line.replace(/[•▪◦]/g, "-").replace(/\s+/g, " ").trim())
        .filter(Boolean);
}
function parseImportedCV(text: string): Partial<CVData> {
    const lines = normalizeTextLines(text);
    const joined = lines.join("\n");
    const email = joined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
    const phone = joined.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? "";
    const linkedin = lines.find((line) => /linkedin\.com/i.test(line)) ?? "";
    const website = lines.find((line) => /(?:https?:\/\/|www\.)/i.test(line) && !/linkedin\.com/i.test(line)) ?? "";
    const headingPatterns: Record<string, RegExp> = {
        summary: /^(summary|professional summary|profile|about me)$/i,
        experience: /^(experience|work experience|professional experience|employment history)$/i,
        education: /^(education|academic background|qualifications)$/i,
        projects: /^(projects|selected projects|portfolio)$/i,
        skills: /^(skills|technical skills|core skills|competencies)$/i,
        certificates: /^(certifications|certificates|licenses)$/i,
        languages: /^(languages|language)$/i,
    };
    const indices: Record<string, number> = {};
    for (let index = 0; index < lines.length; index += 1) {
        for (const [key, pattern] of Object.entries(headingPatterns)) {
            if (pattern.test(lines[index])) {
                indices[key] = index;
            }
        }
    }
    const firstHeading = Math.min(...Object.values(indices).filter((value) => Number.isFinite(value)), lines.length);
    const candidateName = lines.find((line, index) => {
        if (index >= firstHeading)
            return false;
        if (line.length < 2 || line.length > 70)
            return false;
        if (line.includes("@") || /\d{3,}/.test(line))
            return false;
        return true;
    }) ?? "";
    const nextSection = (start: number | undefined) => {
        if (start === undefined)
            return "";
        const future = Object.values(indices).filter((value) => value > start);
        const end = future.length ? Math.min(...future) : lines.length;
        return lines.slice(start + 1, end).join("\n");
    };
    const summaryText = nextSection(indices.summary);
    const skillText = nextSection(indices.skills);
    const certificateText = nextSection(indices.certificates);
    const languageText = nextSection(indices.languages);
    const skills = skillText
        ? skillText
            .split(/[\n,;|]+/)
            .map((name) => name.replace(/^[-•]\s*/, "").trim())
            .filter(Boolean)
            .slice(0, 24)
            .map((name) => ({
            id: uid("skill"),
            name,
            level: "",
        }))
        : [];
    const initialPersonal = createInitialCVData().personal;
    const candidateNameIndex = candidateName ? lines.indexOf(candidateName) : -1;
    const partial: Partial<CVData> = {
        personal: {
            ...initialPersonal,
            fullName: candidateName,
            email,
            phone,
            linkedin,
            website: website.replace(/^https?:\/\//i, ""),
            jobTitle: candidateName &&
                candidateNameIndex >= 0 &&
                lines[candidateNameIndex + 1]
                ? lines[candidateNameIndex + 1]
                : "",
        },
        summary: summaryText,
        skills,
        certificates: certificateText,
        languages: languageText,
    };
    return partial;
}
/* -------------------------------------------------------------------------- */
/*                              CV preview                                    */
/* -------------------------------------------------------------------------- */
function formatContactUrl(value: string): string {
    if (!value)
        return "";
    return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}
function TemplateDocument({ data }: {
    data: CVData;
}) {
    const { personal } = data;
    const hasExperience = data.experiences.some((item) => [
        item.jobTitle,
        item.company,
        item.location,
        item.startDate,
        item.endDate,
        item.description,
    ].some(Boolean));
    const hasEducation = data.education.some((item) => [
        item.degree,
        item.institution,
        item.location,
        item.startDate,
        item.endDate,
        item.details,
    ].some(Boolean));
    const hasProjects = data.projects.some((item) => [item.name, item.role, item.link, item.description].some(Boolean));
    const hasSkills = data.skills.some((item) => item.name.trim());
    const hasCertificates = data.certificates.trim();
    const hasLanguages = data.languages.trim();
    const hasCustom = data.customSections.some((item) => item.title.trim() && item.content.trim());
    const hasAny = Boolean(personal.fullName ||
        personal.jobTitle ||
        personal.address ||
        personal.email ||
        personal.phone ||
        personal.linkedin ||
        personal.website ||
        personal.photo ||
        data.summary.trim() ||
        hasExperience ||
        hasEducation ||
        hasProjects ||
        hasSkills ||
        hasCertificates ||
        hasLanguages ||
        hasCustom);
    const templateClass = `cv-template cv-template-${data.selectedTemplate}`;
    return (<article className={templateClass} aria-label={L("ATS CV preview")}>
      <div className="cv-page-inner">
        <header className="cv-header">
          <div className={`cv-photo cv-photo-${personal.photoShape} ${personal.designPhoto ? "cv-photo-designed" : ""}`}>
            {personal.photo ? (<img src={personal.photo} alt={L("Profile")}/>) : (<UserRound className="cv-placeholder-icon" aria-hidden="true"/>)}
          </div>

          <div className="cv-header-main">
            <h1>{personal.fullName || L("Your Name")}</h1>

            <p className="cv-role">
              {personal.jobTitle || L("Professional title")}
            </p>

            <div className="cv-contact-grid">
              {personal.address ? (<span>
                  <MapPin size={8}/>
                  {personal.address}
                </span>) : null}

              {personal.email ? (<span>
                  <Mail size={8}/>
                  {personal.email}
                </span>) : null}

              {personal.phone ? (<span>
                  <Phone size={8}/>
                  {personal.phone}
                </span>) : null}

              {personal.linkedin ? (<span>
                  <Link2 size={8}/>
                  {formatContactUrl(personal.linkedin)}
                </span>) : null}

              {personal.website ? (<span>
                  <ExternalLink size={8}/>
                  {formatContactUrl(personal.website)}
                </span>) : null}
            </div>
          </div>
        </header>

        {!hasAny ? (<div className="cv-empty-state">
            <FileText size={24}/>
            <strong><AtsCvText>{"Your CV preview will appear here"}</AtsCvText></strong>
            <span><AtsCvText>{"Start filling the form to build your ATS-friendly CV."}</AtsCvText></span>
          </div>) : null}

        {data.summary.trim() ? (<CVSection title={L(data.summaryTitle || "SUMMARY")}>
            <p className="cv-paragraph pre-wrap">{data.summary}</p>
          </CVSection>) : null}

        {hasExperience ? (<CVSection title={L(data.experienceTitle || "PROFESSIONAL EXPERIENCE")}>
            <div className="cv-stack">
              {data.experiences.map((item) => {
                if (![
                    item.jobTitle,
                    item.company,
                    item.location,
                    item.startDate,
                    item.endDate,
                    item.description,
                ].some((value) => value.trim()))
                    return null;
                const period = item.currentlyEmployed
                    ? `${item.startDate || L("Start date")} – ${L("Present")}`
                    : [item.startDate, item.endDate].filter(Boolean).join(" – ");
                return (<div className="cv-entry" key={item.id}>
                    <div className="cv-entry-top">
                      <div>
                        <div className="cv-entry-title">
                          {item.jobTitle || L("Job title")}
                        </div>

                        <div className="cv-entry-subtitle">
                          {[item.company, item.location]
                        .filter(Boolean)
                        .join(" • ")}
                        </div>
                      </div>

                      {period ? (<div className="cv-entry-period">{period}</div>) : null}
                    </div>

                    {item.description ? (<p className="cv-paragraph pre-wrap">
                        {item.description}
                      </p>) : null}
                  </div>);
            })}
            </div>
          </CVSection>) : null}

        {hasEducation ? (<CVSection title={L(data.educationTitle || "EDUCATION")}>
            <div className="cv-stack">
              {data.education.map((item) => {
                if (![
                    item.degree,
                    item.institution,
                    item.location,
                    item.startDate,
                    item.endDate,
                    item.details,
                ].some((value) => value.trim()))
                    return null;
                const period = [item.startDate, item.endDate]
                    .filter(Boolean)
                    .join(" – ");
                return (<div className="cv-entry" key={item.id}>
                    <div className="cv-entry-top">
                      <div>
                        <div className="cv-entry-title">
                          {item.degree || L("Degree / certificate")}
                        </div>

                        <div className="cv-entry-subtitle">
                          {[item.institution, item.location]
                        .filter(Boolean)
                        .join(" • ")}
                        </div>
                      </div>

                      {period ? (<div className="cv-entry-period">{period}</div>) : null}
                    </div>

                    {item.details ? (<p className="cv-paragraph pre-wrap">{item.details}</p>) : null}
                  </div>);
            })}
            </div>
          </CVSection>) : null}

        {hasProjects ? (<CVSection title={L(data.projectTitle || "PROJECTS")}>
            <div className="cv-stack">
              {data.projects.map((item) => {
                if (![item.name, item.role, item.link, item.description].some((value) => value.trim()))
                    return null;
                return (<div className="cv-entry" key={item.id}>
                    <div className="cv-entry-top">
                      <div>
                        <div className="cv-entry-title">
                          {item.name || L("Project")}
                        </div>

                        {item.role ? (<div className="cv-entry-subtitle">{item.role}</div>) : null}
                      </div>

                      {item.link ? (<div className="cv-entry-period">
                          {formatContactUrl(item.link)}
                        </div>) : null}
                    </div>

                    {item.description ? (<p className="cv-paragraph pre-wrap">
                        {item.description}
                      </p>) : null}
                  </div>);
            })}
            </div>
          </CVSection>) : null}

        {hasSkills ? (<CVSection title={L(data.skillsTitle || "SKILLS")}>
            <div className="cv-skill-list">
              {data.skills.map((skill) => {
                if (!skill.name.trim())
                    return null;
                return (<span className="cv-skill" key={skill.id}>
                    {skill.name}
                    {skill.level ? ` — ${skill.level}` : ""}
                  </span>);
            })}
            </div>
          </CVSection>) : null}

        {hasCertificates ? (<CVSection title={L(data.certificateTitle || "CERTIFICATIONS")}>
            <p className="cv-paragraph pre-wrap">{data.certificates}</p>
          </CVSection>) : null}

        {hasLanguages ? (<CVSection title={L(data.languageTitle || "LANGUAGES")}>
            <p className="cv-paragraph pre-wrap">{data.languages}</p>
          </CVSection>) : null}

        {hasCustom
            ? data.customSections.map((item) => item.title.trim() && item.content.trim() ? (<CVSection key={item.id} title={item.title.toUpperCase()}>
                  <p className="cv-paragraph pre-wrap">{item.content}</p>
                </CVSection>) : null)
            : null}
      </div>
    </article>);
}
function CVSection({ title, children, }: {
    title: string;
    children: ReactNode;
    key?: string;
}) {
    return (<section className="cv-section">
      <div className="cv-section-title">{L(title)}</div>
      {children}
    </section>);
}
/* -------------------------------------------------------------------------- */
/*                                Main tool                                    */
/* -------------------------------------------------------------------------- */
const CV_STORAGE_KEY = "sohoz-ats-cv-maker-v1";
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const MM_TO_PX = 96 / 25.4;
const A4_WIDTH_PX = 210 * MM_TO_PX;
const MIN_PREVIEW_ZOOM = 40;
const MAX_PREVIEW_ZOOM = 150;
/**
 * Only the Personal information step (step 2) has required fields today
 * (full name + a valid email). Centralising the check here means both the
 * "Next step" button and the step-navigation dots stay in sync, and it's
 * easy to extend if another step gains required fields later.
 */
function getStepBlockingError(step: number, data: CVData): string | null {
    if (step < 2)
        return null;
    const fullName = data.personal.fullName.trim();
    const email = data.personal.email.trim();
    if (!fullName) {
        return "Add your full name in Personal information before continuing.";
    }
    if (!email) {
        return "Add your email address in Personal information before continuing.";
    }
    if (!EMAIL_REGEX.test(email)) {
        return "Enter a valid email address in Personal information before continuing.";
    }
    return null;
}
function isValidStoredCV(value: unknown): value is CVData {
    if (!value || typeof value !== "object")
        return false;
    const candidate = value as Partial<CVData>;
    return Boolean(candidate.personal &&
        typeof candidate.personal === "object" &&
        typeof candidate.summary === "string");
}
function loadStoredCV(): CVData | null {
    if (typeof window === "undefined")
        return null;
    try {
        const raw = window.localStorage.getItem(CV_STORAGE_KEY);
        if (!raw)
            return null;
        const parsed: unknown = JSON.parse(raw);
        if (!isValidStoredCV(parsed))
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
async function optimizeImageDataUrl(dataUrl: string): Promise<string> {
    const image = new Image();
    image.decoding = "async";
    image.src = dataUrl;
    await image.decode();
    const maxDimension = 1200;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context)
        return dataUrl;
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.84);
}
export default function AtsCvMaker() {
    const { locale } = useSebaLagbeToolsI18n();
    const L = useCallback((value: string) => translateAtsCvText(value, locale, baseI18nL(value)), [locale]);
    const [cvData, dispatch] = useReducer(reducer, undefined, createInitialCVData);
    const [currentStep, setCurrentStep] = useState(1);
    const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
    const [isTemplateOpen, setIsTemplateOpen] = useState(true);
    const [previewZoom, setPreviewZoom] = useState(100);
    const [favorite, setFavorite] = useState(false);
    const [notice, setNotice] = useState<{
        type: "success" | "info" | "error";
        text: string;
    } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const importInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const stepContentRef = useRef<HTMLDivElement>(null);
    const previewPanelRef = useRef<HTMLDivElement>(null);
    const previewStageRef = useRef<HTMLDivElement>(null);
    const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasManualZoomRef = useRef(false);
    const fitZoomRef = useRef(100);
    const notify = useCallback((type: "success" | "info" | "error", text: string) => {
        setNotice({ type, text });
        if (noticeTimerRef.current) {
            clearTimeout(noticeTimerRef.current);
        }
        noticeTimerRef.current = setTimeout(() => setNotice(null), 4500);
    }, []);
    useEffect(() => {
        const stored = loadStoredCV();
        if (stored) {
            dispatch({
                type: "LOAD",
                data: stored,
            });
        }
        setIsHydrated(true);
    }, []);
    useEffect(() => {
        if (!isHydrated || typeof window === "undefined")
            return;
        const timer = window.setTimeout(() => {
            try {
                window.localStorage.setItem(CV_STORAGE_KEY, JSON.stringify(cvData));
            }
            catch {
                // Storage can be unavailable or full; the live editor still works normally.
            }
        }, 250);
        return () => window.clearTimeout(timer);
    }, [cvData, isHydrated]);
    useEffect(() => {
        return () => {
            if (noticeTimerRef.current) {
                clearTimeout(noticeTimerRef.current);
            }
        };
    }, []);
    // Fit the A4 preview to the available panel width on load and whenever the
    // panel is resized, so the full page is visible without a manual zoom-out.
    // Once the person manually changes the zoom we stop overriding their choice
    // until they explicitly reset it (tapping the zoom-percentage pill).
    useEffect(() => {
        const el = previewStageRef.current;
        if (!el || typeof ResizeObserver === "undefined")
            return;
        const applyFit = () => {
            const horizontalPadding = window.innerWidth < 640 ? 24 : 48;
            const available = el.clientWidth - horizontalPadding;
            if (available <= 0)
                return;
            const fit = Math.min(100, Math.max(MIN_PREVIEW_ZOOM, Math.floor((available / A4_WIDTH_PX) * 100)));
            fitZoomRef.current = fit;
            if (!hasManualZoomRef.current) {
                setPreviewZoom(fit);
            }
        };
        applyFit();
        const observer = new ResizeObserver(applyFit);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    const requiredCount = useMemo(() => Number(Boolean(cvData.personal.fullName.trim())) +
        Number(Boolean(cvData.personal.email.trim())), [cvData.personal.email, cvData.personal.fullName]);
    const completionPercent = Math.round((currentStep / steps.length) * 100);
    const formReady = requiredCount === 2;
    const hasContent = useMemo(() => {
        const personal = cvData.personal;
        return Boolean(personal.fullName.trim() ||
            personal.jobTitle.trim() ||
            personal.address.trim() ||
            personal.email.trim() ||
            personal.phone.trim() ||
            personal.linkedin.trim() ||
            personal.website.trim() ||
            personal.photo ||
            cvData.summary.trim() ||
            cvData.experiences.some((item) => item.jobTitle ||
                item.company ||
                item.location ||
                item.startDate ||
                item.endDate ||
                item.description) ||
            cvData.education.some((item) => item.degree ||
                item.institution ||
                item.location ||
                item.startDate ||
                item.endDate ||
                item.details) ||
            cvData.projects.some((item) => item.name || item.role || item.link || item.description) ||
            cvData.skills.some((item) => item.name || item.level) ||
            cvData.certificates.trim() ||
            cvData.languages.trim() ||
            cvData.customSections.some((item) => item.title || item.content));
    }, [cvData]);
    const scrollToStepContent = useCallback(() => {
        requestAnimationFrame(() => {
            stepContentRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        });
    }, []);
    // Non-null only when required fields in an earlier step (currently just
    // Personal information) are missing or invalid, which blocks moving past it.
    const personalStepError = useMemo(() => getStepBlockingError(2, cvData), [cvData]);
    const goToStep = useCallback((step: number) => {
        const next = Math.min(Math.max(step, 1), steps.length);
        if (next > 2 && personalStepError) {
            notify("error", personalStepError);
            setCurrentStep(2);
            scrollToStepContent();
            return;
        }
        setCurrentStep(next);
        scrollToStepContent();
    }, [personalStepError, notify, scrollToStepContent]);
    const handleNextStep = useCallback(() => {
        if (currentStep === 2 && personalStepError) {
            notify("error", personalStepError);
            return;
        }
        if (currentStep < steps.length) {
            goToStep(currentStep + 1);
        }
    }, [currentStep, goToStep, notify, personalStepError]);
    const handlePrevStep = useCallback(() => {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    }, [currentStep, goToStep]);
    const handlePhotoUpload = (file: File | undefined) => {
        if (!file)
            return;
        if (!file.type.startsWith("image/")) {
            notify("error", "Please select a valid image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            notify("error", "Profile photo must be 5 MB or smaller.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = String(reader.result ?? "");
            void optimizeImageDataUrl(dataUrl)
                .then((optimizedDataUrl) => {
                dispatch({
                    type: "UPDATE_PERSONAL",
                    field: "photo",
                    value: optimizedDataUrl,
                });
                notify("success", "Profile photo added to your CV.");
            })
                .catch(() => {
                dispatch({
                    type: "UPDATE_PERSONAL",
                    field: "photo",
                    value: dataUrl,
                });
                notify("success", "Profile photo added to your CV.");
            });
        };
        reader.onerror = () => notify("error", "The photo could not be read. Please try another image.");
        reader.readAsDataURL(file);
    };
    const handleImportPdf = async (file: File | undefined) => {
        if (!file)
            return;
        if (file.type !== "application/pdf") {
            notify("error", "Please upload a PDF CV file.");
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            notify("error", "PDF import is limited to 8 MB.");
            return;
        }
        setIsImporting(true);
        dispatch({
            type: "SET_IMPORTED_FILE",
            value: file.name,
        });
        try {
            const text = await extractPdfText(file);
            if (!text) {
                notify("info", "The PDF was uploaded, but no selectable text was found. This usually means the CV is scanned; fill the fields manually or import a text-based PDF.");
                return;
            }
            const parsed = parseImportedCV(text);
            if (parsed.personal) {
                const importedPersonal = parsed.personal;
                const importedTextFields: Array<keyof PersonalDetails> = [
                    "fullName",
                    "jobTitle",
                    "address",
                    "email",
                    "phone",
                    "linkedin",
                    "website",
                ];
                for (const field of importedTextFields) {
                    const value = importedPersonal[field];
                    if (typeof value === "string" && value.trim()) {
                        dispatch({
                            type: "UPDATE_PERSONAL",
                            field,
                            value,
                        });
                    }
                }
            }
            if (typeof parsed.summary === "string") {
                dispatch({
                    type: "SET_SUMMARY",
                    value: parsed.summary,
                });
            }
            if (parsed.skills) {
                dispatch({
                    type: "SET_SKILLS",
                    skills: parsed.skills,
                });
            }
            if (typeof parsed.certificates === "string") {
                dispatch({
                    type: "SET_CERTIFICATES",
                    value: parsed.certificates,
                });
            }
            if (typeof parsed.languages === "string") {
                dispatch({
                    type: "SET_LANGUAGES",
                    value: parsed.languages,
                });
            }
            notify("success", "The PDF was read in your browser and the detected fields were added to the form.");
            goToStep(2);
        }
        catch (error) {
            console.error(error);
            notify("error", "This PDF could not be read in the browser. You can still fill the CV manually.");
        }
        finally {
            setIsImporting(false);
            if (importInputRef.current) {
                importInputRef.current.value = "";
            }
        }
    };
    const handlePrint = useCallback(async (mode: "print" | "pdf") => {
        if (!formReady) {
            notify("info", "Add your full name and email before exporting the CV.");
            return;
        }
        if (isExporting)
            return;
        setIsExporting(true);
        const previousTitle = document.title;
        document.title = `${cvData.personal.fullName || "ATS-CV"} — CV`;
        try {
            if (document.fonts?.ready) {
                await document.fonts.ready;
            }
            const images = Array.from(document.querySelectorAll<HTMLImageElement>("#cv-print-root img"));
            await Promise.all(images.map(async (image) => {
                try {
                    if (image.complete)
                        return;
                    await image.decode();
                }
                catch {
                    // A failed image should not prevent exporting the text CV.
                }
            }));
            notify("success", mode === "pdf"
                ? "Print dialog opened. Choose ‘Save as PDF’ and keep paper size set to A4."
                : "Print dialog opened with only the CV preview visible.");
            await new Promise<void>((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            });
            window.print();
        }
        finally {
            window.setTimeout(() => {
                document.title = previousTitle;
                setIsExporting(false);
            }, 300);
        }
    }, [cvData.personal.fullName, formReady, isExporting, notify]);
    const handleShare = async () => {
        const shareText = `${cvData.personal.fullName || "My CV"} — ATS-friendly CV created with ATS Friendly CV Maker.`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: shareText,
                    text: shareText,
                    url: window.location.href,
                });
                notify("success", "Share sheet opened.");
            }
            else if (navigator.clipboard) {
                await navigator.clipboard.writeText(window.location.href);
                notify("success", "Tool link copied to your clipboard.");
            }
            else {
                notify("info", "Copy the page URL from your browser to share this CV maker.");
            }
        }
        catch {
            // User may close the native share dialog; no error toast needed.
        }
    };
    const resetPreviewZoom = () => {
        hasManualZoomRef.current = false;
        setPreviewZoom(fitZoomRef.current);
    };
    const handleClearAll = () => {
        if (!hasContent) {
            dispatch({
                type: "RESET",
            });
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(CV_STORAGE_KEY);
            }
            setCurrentStep(1);
            resetPreviewZoom();
            notify("info", "The form is already clear.");
            return;
        }
        const confirmed = window.confirm(L("Clear all CV data? This will remove your personal details, experience, education, projects, skills, and custom sections."));
        if (!confirmed)
            return;
        dispatch({
            type: "RESET",
        });
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(CV_STORAGE_KEY);
        }
        setCurrentStep(1);
        resetPreviewZoom();
        notify("success", "All CV fields were reset.");
    };
    const handleViewPreview = () => {
        previewPanelRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    };
    const updatePersonal = (field: keyof PersonalDetails, value: string | boolean | PhotoShape) => {
        dispatch({
            type: "UPDATE_PERSONAL",
            field,
            value,
        });
    };
    const renderStepNavigation = () => (<div className="space-y-3 rounded-xl border border-[#E3D6B8]/80 bg-[#F6EEDB]/40 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-bold text-[#3B2F1E]">
            {L(steps[currentStep - 1].label)}
          </div>

          <div className="text-[11px] text-[#5A4A32]">
            {L(steps[currentStep - 1].meta)}
          </div>
        </div>

        <div className="rounded-md bg-[#F6EEDB] px-2 py-1 text-right">
          <div className="text-[12px] font-extrabold text-[#DC2626]">
            {currentStep}<AtsCvText>{"/8\n          "}</AtsCvText></div>

          <div className="text-[10px] text-[#7A6A50]"><AtsCvText>{"steps \u00B7 "}</AtsCvText>{completionPercent}<AtsCvText>{"%\n          "}</AtsCvText></div>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[#F3E9D2]">
        <div className="h-full rounded-full bg-[#D42020] transition-all duration-300" style={{
            width: `${completionPercent}%`,
        }}/>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={handlePrevStep} disabled={currentStep === 1} className="rounded-md p-1 text-[#7A6A50] hover:bg-[#FBF6E8] hover:text-[#3B2F1E] disabled:opacity-30" aria-label={L("Previous step")}>
          <ChevronLeft size={13}/>
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-1 overflow-x-auto py-1">
          {steps.map((step) => {
            const isLocked = step.id > 2 && Boolean(personalStepError);
            return (<button type="button" key={step.id} onClick={() => goToStep(step.id)} className={`group flex min-w-[42px] flex-col items-center gap-1 ${isLocked ? "cursor-not-allowed opacity-50" : ""}`} aria-current={step.id === currentStep ? "step" : undefined} aria-disabled={isLocked} title={isLocked && personalStepError ? L(personalStepError) : undefined}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition ${step.id === currentStep
                    ? "bg-[#D42020] text-white shadow-sm"
                    : step.id < currentStep
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-[#FBF6E8] text-[#7A6A50] ring-1 ring-[#E3D6B8] group-hover:bg-[#EFE3C8]"}`}>
                  {step.id < currentStep ? <Check size={10}/> : step.id}
                </span>

                <span className={`text-[9px] font-semibold ${step.id === currentStep ? "text-[#DC2626]" : "text-[#7A6A50]"}`}>
                  {L(step.label)}
                </span>
              </button>);
        })}
        </div>

        <button type="button" onClick={handleNextStep} disabled={currentStep === steps.length} className="rounded-md p-1 text-[#7A6A50] hover:bg-[#FBF6E8] hover:text-[#3B2F1E] disabled:opacity-30" aria-label={L("Next step")}>
          <ChevronRight size={13}/>
        </button>
      </div>

      <div className="text-center text-[10px] text-[#7A6A50]"><AtsCvText>{"Required fields:"}</AtsCvText>{<AtsCvText>{" "}</AtsCvText>}
        <span className={requiredCount === 2
            ? "font-bold text-emerald-600"
            : "font-bold text-[#DC2626]"}>
          {requiredCount}<AtsCvText>{"/2\n        "}</AtsCvText></span>
      </div>
    </div>);
    const renderImportStep = () => (<SectionCard title={L("0. Import from PDF")} description="Upload an existing text-based CV PDF to pre-fill common fields directly in your browser.">
      <button type="button" onClick={() => importInputRef.current?.click()} disabled={isImporting} className="group flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#FBB6B6] bg-[#FEE9E9]/30 p-6 text-center transition hover:border-[#DC2626] hover:bg-[#FEE9E9] disabled:cursor-wait disabled:opacity-70">
        <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEE9E9] text-[#DC2626] transition group-hover:scale-105">
          {isImporting ? (<RotateCw size={18} className="animate-spin"/>) : (<Upload size={18}/>)}
        </span>

        <span className="text-[13px] font-bold text-[#DC2626]">
          {isImporting ? <AtsCvText>{"Reading PDF…"}</AtsCvText> : <AtsCvText>{"Upload an existing CV PDF"}</AtsCvText>}
        </span>

        <span className="mt-1 max-w-xs text-[11px] leading-relaxed text-[#7A6A50]"><AtsCvText>{"Up to 8 MB. Text-based PDFs can be parsed in the browser; scanned\n          image-only PDFs may require manual entry.\n        "}</AtsCvText></span>
      </button>

      <input ref={importInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => void handleImportPdf(event.target.files?.[0])}/>

      {cvData.importedFileName ? (<div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
          <span className="truncate pr-3"><AtsCvText>{"Imported: "}</AtsCvText>{cvData.importedFileName}
          </span>
          <CheckCircle2 size={13}/>
        </div>) : null}
    </SectionCard>);
    const renderPersonalStep = () => {
        const emailError = cvData.personal.email && !/^\S+@\S+\.\S+$/.test(cvData.personal.email)
            ? "Enter a valid email address."
            : "";
        return (<SectionCard title={L("1. Personal information")} description="These details appear at the top of your CV and are synced with the preview instantly.">
        <div className="rounded-lg border border-[#E3D6B8] bg-[#F6EEDB]/40 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold text-[#3B2F1E]"><AtsCvText>{"Photo (optional)\n            "}</AtsCvText></span>

            <span className="text-[11px] text-[#7A6A50]"><AtsCvText>{"Recommended: square image\n            "}</AtsCvText></span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="h-14 w-14 overflow-hidden rounded-lg border border-[#E3D6B8] bg-[#FBF6E8]">
              {cvData.personal.photo ? (<img src={cvData.personal.photo} alt={L("Uploaded profile")} className="h-full w-full object-cover"/>) : (<div className="flex h-full w-full items-center justify-center text-[#7A6A50]">
                  <UserRound size={20}/>
                </div>)}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SecondaryButton onClick={() => photoInputRef.current?.click()}>
                <ImagePlus size={12}/>
                {cvData.personal.photo ? <AtsCvText>{"Change photo"}</AtsCvText> : <AtsCvText>{"Add photo"}</AtsCvText>}
              </SecondaryButton>

              {cvData.personal.photo ? (<SecondaryButton onClick={() => updatePersonal("photo", "")}>
                  <Trash2 size={11}/><AtsCvText>{"Remove photo\n                "}</AtsCvText></SecondaryButton>) : null}

              {cvData.personal.photo ? (<button type="button" onClick={() => updatePersonal("designPhoto", !cvData.personal.designPhoto)} className={`rounded-lg border px-2.5 py-2 text-[11px] font-bold transition ${cvData.personal.designPhoto
                    ? "border-[#DC2626] bg-[#F6EEDB] text-[#DC2626]"
                    : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32]"}`}>
                  {cvData.personal.designPhoto
                ? <AtsCvText>{"Photo design on"}</AtsCvText> : <AtsCvText>{"Design photo"}</AtsCvText>}
                </button>) : null}
            </div>
          </div>

          {cvData.personal.photo && cvData.personal.designPhoto ? (<div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#5A4A32]">
              <span className="font-semibold"><AtsCvText>{"Shape"}</AtsCvText></span>

              {(["square", "rounded", "circle"] as PhotoShape[]).map((shape) => (<button type="button" key={shape} onClick={() => updatePersonal("photoShape", shape)} className={`rounded-md px-2 py-1 ${cvData.personal.photoShape === shape
                        ? "bg-[#D42020] text-white"
                        : "bg-[#FBF6E8] ring-1 ring-[#E3D6B8] hover:bg-[#EFE3C8]"}`}>
                    {L(shape)}
                  </button>))}
            </div>) : null}

          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handlePhotoUpload(event.target.files?.[0])}/>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Full name" value={cvData.personal.fullName} required placeholder={L("Naphia Jannatul Mowa")} onChange={(value) => updatePersonal("fullName", value)}/>

          <Field label="Job title / headline" value={cvData.personal.jobTitle} placeholder={L("Senior Marketing Manager")} onChange={(value) => updatePersonal("jobTitle", value)}/>

          <Field label="Email" value={cvData.personal.email} required type="email" placeholder={L("name@example.com")} icon={<Mail size={12}/>} error={emailError} onChange={(value) => updatePersonal("email", value)}/>

          <Field label="Phone" value={cvData.personal.phone} type="tel" placeholder={L("+880 1XXXXXXXXX")} icon={<Phone size={12}/>} onChange={(value) => updatePersonal("phone", value)}/>

          <Field label="Location / address" value={cvData.personal.address} placeholder={L("Dhaka, Bangladesh")} icon={<MapPin size={12}/>} onChange={(value) => updatePersonal("address", value)}/>

          <Field label="LinkedIn (optional)" value={cvData.personal.linkedin} placeholder={L("linkedin.com/in/username")} icon={<Link2 size={12}/>} onChange={(value) => updatePersonal("linkedin", value)}/>

          <div className="sm:col-span-2">
            <Field label="Website / portfolio (optional)" value={cvData.personal.website} placeholder={L("portfolio.com")} icon={<ExternalLink size={12}/>} onChange={(value) => updatePersonal("website", value)}/>
          </div>
        </div>
      </SectionCard>);
    };
    const renderSummaryStep = () => (<SectionCard title={L("2. Professional summary")} description="Write a concise value statement. Keep it focused on experience, strengths, and the type of role you want.">
      <Field label="Section title on CV" value={cvData.summaryTitle} onChange={(value) => dispatch({
            type: "SET_SECTION_TITLE",
            section: "summary",
            value,
        })}/>

      <TextAreaField label="Summary" value={cvData.summary} rows={7} placeholder={L("Results-oriented professional with experience in…")} onChange={(value) => dispatch({
            type: "SET_SUMMARY",
            value,
        })}/>
    </SectionCard>);
    const renderExperienceStep = () => (<SectionCard title={L("3. Work experience")} description="Add roles in reverse chronological order. Use measurable responsibilities and achievements where possible." action={<button type="button" onClick={() => dispatch({
                type: "ADD_EXPERIENCE",
            })} className="inline-flex items-center gap-1 rounded-lg bg-[#F6EEDB] px-2.5 py-1.5 text-[11px] font-bold text-[#DC2626] hover:bg-[#F3E9D2]">
          <Plus size={11}/><AtsCvText>{"Add\n        "}</AtsCvText></button>}>
      <Field label="Section title on CV" value={cvData.experienceTitle} onChange={(value) => dispatch({
            type: "SET_SECTION_TITLE",
            section: "experience",
            value,
        })}/>

      {cvData.experiences.length === 0 ? (<EmptyState text="No experience added yet. Add your first role below."/>) : null}

      <div className="space-y-3">
        {cvData.experiences.map((item, index) => (<div key={item.id} className="rounded-lg border border-[#E3D6B8] bg-[#F6EEDB]/30 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#5A4A32]"><AtsCvText>{"Experience "}</AtsCvText>{index + 1}
              </span>

              <button type="button" onClick={() => dispatch({
                type: "REMOVE_EXPERIENCE",
                id: item.id,
            })} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626] hover:text-[#B91C1C]">
                <Trash2 size={11}/><AtsCvText>{"Remove\n              "}</AtsCvText></button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Job title" value={item.jobTitle} placeholder={L("Marketing Manager")} onChange={(value) => dispatch({
                type: "UPDATE_EXPERIENCE",
                id: item.id,
                field: "jobTitle",
                value,
            })}/>

              <Field label="Company" value={item.company} placeholder={L("Company Name")} onChange={(value) => dispatch({
                type: "UPDATE_EXPERIENCE",
                id: item.id,
                field: "company",
                value,
            })}/>

              <Field label="Location" value={item.location} placeholder={L("City, Country")} onChange={(value) => dispatch({
                type: "UPDATE_EXPERIENCE",
                id: item.id,
                field: "location",
                value,
            })}/>

              <Field label="Start date" value={item.startDate} placeholder={L("Jan 2022")} onChange={(value) => dispatch({
                type: "UPDATE_EXPERIENCE",
                id: item.id,
                field: "startDate",
                value,
            })}/>

              <Field label="End date" value={item.endDate} placeholder={L("Dec 2024")} disabled={item.currentlyEmployed} onChange={(value) => dispatch({
                type: "UPDATE_EXPERIENCE",
                id: item.id,
                field: "endDate",
                value,
            })}/>

              <label className="flex items-center gap-2 self-end rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2 text-[12px] font-semibold text-[#5A4A32]">
                <input type="checkbox" checked={item.currentlyEmployed} onChange={(event) => dispatch({
                type: "UPDATE_EXPERIENCE",
                id: item.id,
                field: "currentlyEmployed",
                value: event.target.checked,
            })} className="h-3.5 w-3.5 accent-[#DC2626]"/><AtsCvText>{"Currently employed\n              "}</AtsCvText></label>

              <div className="sm:col-span-2">
                <TextAreaField label="Responsibilities & achievements" value={item.description} rows={5} placeholder={"Led a team of 6…\nImproved campaign performance by 40%…"} onChange={(value) => dispatch({
                type: "UPDATE_EXPERIENCE",
                id: item.id,
                field: "description",
                value,
            })}/>
              </div>
            </div>
          </div>))}
      </div>

      <PrimaryButton onClick={() => dispatch({
            type: "ADD_EXPERIENCE",
        })} className="w-full">
        <Plus size={12}/><AtsCvText>{"Add another experience\n      "}</AtsCvText></PrimaryButton>
    </SectionCard>);
    const renderEducationStep = () => (<SectionCard title={L("4. Education")} description="Add degrees, certificates, training, or other academic credentials." action={<button type="button" onClick={() => dispatch({
                type: "ADD_EDUCATION",
            })} className="inline-flex items-center gap-1 rounded-lg bg-[#F6EEDB] px-2.5 py-1.5 text-[11px] font-bold text-[#DC2626] hover:bg-[#F3E9D2]">
          <Plus size={11}/><AtsCvText>{"Add\n        "}</AtsCvText></button>}>
      <Field label="Section title on CV" value={cvData.educationTitle} onChange={(value) => dispatch({
            type: "SET_SECTION_TITLE",
            section: "education",
            value,
        })}/>

      {cvData.education.length === 0 ? (<EmptyState text="No education added yet. Add your first qualification below."/>) : null}

      <div className="space-y-3">
        {cvData.education.map((item, index) => (<div key={item.id} className="rounded-lg border border-[#E3D6B8] bg-[#F6EEDB]/30 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#5A4A32]"><AtsCvText>{"Education "}</AtsCvText>{index + 1}
              </span>

              <button type="button" onClick={() => dispatch({
                type: "REMOVE_EDUCATION",
                id: item.id,
            })} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626] hover:text-[#B91C1C]">
                <Trash2 size={11}/><AtsCvText>{"Remove\n              "}</AtsCvText></button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Degree / certificate" value={item.degree} placeholder={L("B.Sc. in Computer Science")} onChange={(value) => dispatch({
                type: "UPDATE_EDUCATION",
                id: item.id,
                field: "degree",
                value,
            })}/>

              <Field label="Institution" value={item.institution} placeholder={L("University Name")} onChange={(value) => dispatch({
                type: "UPDATE_EDUCATION",
                id: item.id,
                field: "institution",
                value,
            })}/>

              <Field label="Location" value={item.location} placeholder={L("Toronto, Canada")} onChange={(value) => dispatch({
                type: "UPDATE_EDUCATION",
                id: item.id,
                field: "location",
                value,
            })}/>

              <Field label="Start / year" value={item.startDate} placeholder={L("2020")} onChange={(value) => dispatch({
                type: "UPDATE_EDUCATION",
                id: item.id,
                field: "startDate",
                value,
            })}/>

              <Field label="Graduation / end date" value={item.endDate} placeholder={L("2024")} onChange={(value) => dispatch({
                type: "UPDATE_EDUCATION",
                id: item.id,
                field: "endDate",
                value,
            })}/>

              <div className="sm:col-span-2">
                <TextAreaField label="Details (one per line, optional)" value={item.details} rows={4} placeholder={"Dean’s List\nRelevant coursework: Marketing Analytics"} onChange={(value) => dispatch({
                type: "UPDATE_EDUCATION",
                id: item.id,
                field: "details",
                value,
            })}/>
              </div>
            </div>
          </div>))}
      </div>

      <PrimaryButton onClick={() => dispatch({
            type: "ADD_EDUCATION",
        })} className="w-full">
        <Plus size={12}/><AtsCvText>{"Add another education\n      "}</AtsCvText></PrimaryButton>
    </SectionCard>);
    const renderProjectsStep = () => (<SectionCard title={L("5. Projects")} description="Showcase relevant portfolio projects, freelance work, case studies, or coursework." action={<button type="button" onClick={() => dispatch({
                type: "ADD_PROJECT",
            })} className="inline-flex items-center gap-1 rounded-lg bg-[#F6EEDB] px-2.5 py-1.5 text-[11px] font-bold text-[#DC2626] hover:bg-[#F3E9D2]">
          <Plus size={11}/><AtsCvText>{"Add\n        "}</AtsCvText></button>}>
      <Field label="Section title on CV" value={cvData.projectTitle} onChange={(value) => dispatch({
            type: "SET_SECTION_TITLE",
            section: "project",
            value,
        })}/>

      {cvData.projects.length === 0 ? (<EmptyState text="No projects added yet. This section is optional."/>) : null}

      <div className="space-y-3">
        {cvData.projects.map((item, index) => (<div key={item.id} className="rounded-lg border border-[#E3D6B8] bg-[#F6EEDB]/30 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#5A4A32]"><AtsCvText>{"Project "}</AtsCvText>{index + 1}
              </span>

              <button type="button" onClick={() => dispatch({
                type: "REMOVE_PROJECT",
                id: item.id,
            })} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626] hover:text-[#B91C1C]">
                <Trash2 size={11}/><AtsCvText>{"Remove\n              "}</AtsCvText></button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Project name" value={item.name} placeholder={L("Portfolio Website")} onChange={(value) => dispatch({
                type: "UPDATE_PROJECT",
                id: item.id,
                field: "name",
                value,
            })}/>

              <Field label="Role / technology" value={item.role} placeholder={L("React Developer")} onChange={(value) => dispatch({
                type: "UPDATE_PROJECT",
                id: item.id,
                field: "role",
                value,
            })}/>

              <div className="sm:col-span-2">
                <Field label="Project link (optional)" value={item.link} placeholder={L("github.com/username/project")} icon={<Link2 size={12}/>} onChange={(value) => dispatch({
                type: "UPDATE_PROJECT",
                id: item.id,
                field: "link",
                value,
            })}/>
              </div>

              <div className="sm:col-span-2">
                <TextAreaField label="Description" value={item.description} rows={4} placeholder={"Built a responsive…\nImproved performance…"} onChange={(value) => dispatch({
                type: "UPDATE_PROJECT",
                id: item.id,
                field: "description",
                value,
            })}/>
              </div>
            </div>
          </div>))}
      </div>

      <PrimaryButton onClick={() => dispatch({
            type: "ADD_PROJECT",
        })} className="w-full">
        <Plus size={12}/><AtsCvText>{"Add another project\n      "}</AtsCvText></PrimaryButton>
    </SectionCard>);
    const renderSkillsStep = () => (<SectionCard title={L("6. Additional")} description="Add ATS-readable skills, certifications, and languages. Each entry is kept as real text in the CV, not as an image.">
      <Field label="Skills section title on CV" value={cvData.skillsTitle} onChange={(value) => dispatch({
            type: "SET_SECTION_TITLE",
            section: "skills",
            value,
        })}/>

      <div className="space-y-2">
        {cvData.skills.map((skill, index) => (<div key={skill.id} className="grid grid-cols-[1fr_120px_auto] items-end gap-2">
            <Field label={L(`Skill ${index + 1}`)} value={skill.name} placeholder={L("Digital Marketing")} onChange={(value) => dispatch({
                type: "UPDATE_SKILL",
                id: skill.id,
                field: "name",
                value,
            })}/>

            <Field label="Level (optional)" value={skill.level} placeholder={L("Advanced")} onChange={(value) => dispatch({
                type: "UPDATE_SKILL",
                id: skill.id,
                field: "level",
                value,
            })}/>

            <button type="button" onClick={() => dispatch({
                type: "REMOVE_SKILL",
                id: skill.id,
            })} className="mb-0.5 rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#7A6A50] hover:bg-[#FEE9E9] hover:text-[#DC2626]" aria-label={L(`Remove skill ${index + 1}`)}>
              <Trash2 size={12}/>
            </button>
          </div>))}
      </div>

      <button type="button" onClick={() => dispatch({
            type: "ADD_SKILL",
        })} className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-[#E3D6B8] bg-[#F6EEDB]/50 px-3 py-2 text-[12px] font-bold text-[#DC2626] hover:bg-[#F6EEDB]">
        <Plus size={12}/><AtsCvText>{"Add skill\n      "}</AtsCvText></button>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Field label="Certifications section title" value={cvData.certificateTitle} onChange={(value) => dispatch({
            type: "SET_SECTION_TITLE",
            section: "certificate",
            value,
        })}/>

          <div className="mt-1.5">
            <TextAreaField label="Certifications (one per line, optional)" value={cvData.certificates} rows={5} placeholder={"Google Ads Certification\nHubSpot Inbound Marketing"} onChange={(value) => dispatch({
            type: "SET_CERTIFICATES",
            value,
        })}/>
          </div>
        </div>

        <div>
          <Field label="Languages section title" value={cvData.languageTitle} onChange={(value) => dispatch({
            type: "SET_SECTION_TITLE",
            section: "language",
            value,
        })}/>

          <div className="mt-1.5">
            <TextAreaField label="Languages (one per line, optional)" value={cvData.languages} rows={5} placeholder={"English — Fluent\nFrench — Intermediate"} onChange={(value) => dispatch({
            type: "SET_LANGUAGES",
            value,
        })}/>
          </div>
        </div>
      </div>
    </SectionCard>);
    const renderCustomStep = () => (<SectionCard title={L("7. Custom sections (optional)")} description="Add extra sections such as awards, volunteer work, publications, interests, or leadership. Empty sections will not appear on the CV." action={<button type="button" onClick={() => dispatch({
                type: "ADD_CUSTOM",
            })} className="inline-flex items-center gap-1 rounded-lg bg-[#F6EEDB] px-2.5 py-1.5 text-[11px] font-bold text-[#DC2626] hover:bg-[#F3E9D2]">
          <Plus size={11}/><AtsCvText>{"Add\n        "}</AtsCvText></button>}>
      {cvData.customSections.length === 0 ? (<EmptyState text="No extra sections yet. Add one only when you need it."/>) : null}

      <div className="space-y-3">
        {cvData.customSections.map((item, index) => (<div key={item.id} className="rounded-lg border border-[#E3D6B8] bg-[#F6EEDB]/30 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#5A4A32]"><AtsCvText>{"Custom section "}</AtsCvText>{index + 1}
              </span>

              <button type="button" onClick={() => dispatch({
                type: "REMOVE_CUSTOM",
                id: item.id,
            })} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626] hover:text-[#B91C1C]">
                <Trash2 size={11}/><AtsCvText>{"Remove\n              "}</AtsCvText></button>
            </div>

            <div className="space-y-3">
              <Field label="Section title" value={item.title} placeholder={L("AWARDS")} onChange={(value) => dispatch({
                type: "UPDATE_CUSTOM",
                id: item.id,
                field: "title",
                value,
            })}/>

              <TextAreaField label="Content" value={item.content} rows={5} placeholder={"Awarded…\nLed…"} onChange={(value) => dispatch({
                type: "UPDATE_CUSTOM",
                id: item.id,
                field: "content",
                value,
            })}/>
            </div>
          </div>))}
      </div>

      <PrimaryButton onClick={() => dispatch({
            type: "ADD_CUSTOM",
        })} className="w-full">
        <Plus size={12}/><AtsCvText>{"Add new section\n      "}</AtsCvText></PrimaryButton>
    </SectionCard>);
    const renderCurrentStepContent = () => {
        switch (currentStep) {
            case 1:
                return renderImportStep();
            case 2:
                return renderPersonalStep();
            case 3:
                return renderSummaryStep();
            case 4:
                return renderExperienceStep();
            case 5:
                return renderEducationStep();
            case 6:
                return renderProjectsStep();
            case 7:
                return renderSkillsStep();
            case 8:
                return renderCustomStep();
            default:
                return null;
        }
    };
    return (<div className="ats-cv-maker w-full space-y-6 pb-16 font-sans text-[#3B2F1E]">
      <div className="flex flex-col gap-4 print:hidden md:flex-row md:items-center md:justify-between">
        <div>
          <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-[12px] text-[#5A4A32]">
            <Link href="/" className="transition hover:text-[#3B2F1E]">
              <FileText size={12} className="inline"/>
            </Link>

            <span><AtsCvText>{"/"}</AtsCvText></span>

            <Link href="/sohoj-tools" className="transition hover:text-[#3B2F1E]"><AtsCvText>{"Seba Lagbe Tools\n            "}</AtsCvText></Link>

            <span><AtsCvText>{"/"}</AtsCvText></span>
            <span><AtsCvText>{"Educational Tools"}</AtsCvText></span>
            <span><AtsCvText>{"/"}</AtsCvText></span>

            <span className="font-semibold text-[#3B2F1E]"><AtsCvText>{"ATS Friendly CV Maker\n            "}</AtsCvText></span>
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEE9E9] text-[#DC2626]">
              <FileText size={18}/>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-[#3B2F1E] md:text-3xl"><AtsCvText>{"ATS Friendly CV Maker\n            "}</AtsCvText></h1>

            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700"><AtsCvText>{"Free\n            "}</AtsCvText></span>
          </div>

          <p className="mt-1 text-[12px] font-medium text-[#5A4A32]"><AtsCvText>{"Build an ATS-friendly CV \u2014 live preview and high-quality A4\n            print/PDF flow.\n          "}</AtsCvText></p>
        </div>

        <div className="flex items-center gap-2">
          <IconButton label="Favorite" onClick={() => setFavorite((value) => !value)} active={favorite}>
            <Star size={15} className={favorite ? "fill-[#DC2626] text-[#DC2626]" : ""}/>
          </IconButton>

          <IconButton label="Share" onClick={() => void handleShare()}>
            <Share2 size={15}/>
          </IconButton>
        </div>
      </div>

      {notice ? (<div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-semibold print:hidden ${notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : notice.type === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-[#E3D6B8] bg-[#F6EEDB] text-[#DC2626]"}`} role="status">
          {notice.type === "success" ? (<CheckCircle2 size={14}/>) : notice.type === "error" ? (<CircleHelp size={14}/>) : null}

          <span>{L(notice.text)}</span>

          <button type="button" className="ml-auto opacity-70 hover:opacity-100" onClick={() => setNotice(null)} aria-label={L("Dismiss notice")}>
            <X size={13}/>
          </button>
        </div>) : null}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <aside className="space-y-4 print:hidden lg:col-span-5">
          <div className="rounded-2xl border border-[#E3D6B8]/80 bg-[#FBF6E8] p-5 shadow-sm">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-[#3B2F1E]"><AtsCvText>{"Settings"}</AtsCvText></h2>

                <p className="mt-0.5 text-[12px] leading-relaxed text-[#5A4A32]"><AtsCvText>{"Fill in your CV step by step. The preview updates as you type.\n                "}</AtsCvText></p>
              </div>

              <div className="rounded-xl border border-[#E3D6B8] bg-[#F6EEDB]/20 p-3.5">
                <button type="button" onClick={() => setIsTemplateOpen((open) => !open)} className="flex w-full items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#3B2F1E]"><AtsCvText>{"Template\n                    "}</AtsCvText></span>

                    <span className="text-[11px] font-medium text-[#DC2626]"><AtsCvText>{"More designs coming soon\n                    "}</AtsCvText></span>
                  </div>

                  <ChevronDown size={14} className={`text-[#7A6A50] transition ${isTemplateOpen ? "rotate-180" : ""}`}/>
                </button>

                {isTemplateOpen ? (<div className="mt-3 grid grid-cols-2 gap-2.5">
                    {templates.map((template) => {
                const selected = cvData.selectedTemplate === template.id;
                return (<button type="button" key={template.id} onClick={() => dispatch({
                        type: "SET_TEMPLATE",
                        template: template.id,
                    })} className={`relative rounded-xl border p-2.5 text-left transition-all ${selected
                        ? "border-[#DC2626] bg-[#FBF6E8] shadow-sm ring-1 ring-[#DC2626]/40"
                        : "border-[#E3D6B8] bg-[#FBF6E8] hover:border-[#D8C9A6]"}`}>
                          <div className={`mb-2 h-12 rounded-lg p-1.5 ${template.preview === "amber"
                        ? "bg-[#F3E9D2]"
                        : template.preview === "teal"
                            ? "bg-teal-100"
                            : template.preview === "green"
                                ? "bg-emerald-100"
                                : "bg-purple-100"}`}>
                            <div className="h-full w-full rounded border border-white/80 bg-white p-1">
                              <div className="h-1.5 w-2/3 rounded" style={{
                        backgroundColor: template.accent,
                    }}/>

                              <div className="mt-1 h-1 w-full rounded bg-[#F3E9D2]"/>
                              <div className="mt-1 h-1 w-4/5 rounded bg-[#F3E9D2]"/>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#3B2F1E]">
                              {L(template.label)}
                            </span>

                            {selected ? (<CheckCircle2 size={14} className="fill-[#DC2626] text-[#DC2626]"/>) : null}
                          </div>
                        </button>);
            })}
                  </div>) : null}
              </div>

              {renderStepNavigation()}

              <div ref={stepContentRef} className="scroll-mt-6">
                {renderCurrentStepContent()}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <SecondaryButton onClick={handlePrevStep} disabled={currentStep === 1} className="flex-1"><AtsCvText>{"\u2039 Previous step\n                "}</AtsCvText></SecondaryButton>

                {currentStep < steps.length ? (<PrimaryButton onClick={handleNextStep} disabled={currentStep === 2 && Boolean(personalStepError)} title={currentStep === 2
                ? (personalStepError ?? undefined)
                : undefined} className="flex-1"><AtsCvText>{"Next step "}</AtsCvText><ChevronRight size={12}/>
                  </PrimaryButton>) : (<PrimaryButton onClick={handleViewPreview} className="flex-1"><AtsCvText>{"View preview "}</AtsCvText><ExternalLink size={11}/>
                  </PrimaryButton>)}
              </div>
            </div>
          </div>
        </aside>

        <section ref={previewPanelRef} className="min-w-0 lg:sticky lg:top-4 lg:col-span-7" aria-label={L("CV preview panel")}>
          <div className="rounded-2xl border border-[#E3D6B8]/80 bg-[#FBF6E8] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#E3D6B8] pb-3 print:hidden">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#3B2F1E]"><AtsCvText>{"Preview"}</AtsCvText></h2>

                  <span className="flex items-center gap-1 text-[11px] text-[#7A6A50]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>{<AtsCvText>{" "}</AtsCvText>}<AtsCvText>{"Live preview\n                  "}</AtsCvText></span>
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#7A6A50]">
                  <span>
                    {L(templates.find((item) => item.id === cvData.selectedTemplate)?.label ?? "Classic ATS")}{<AtsCvText>{" "}</AtsCvText>}<AtsCvText>{"\u00B7 A4\n                  "}</AtsCvText></span>

                  <span className={`rounded-full px-1.5 py-0.5 font-semibold ${formReady
            ? "bg-emerald-50 text-emerald-600"
            : "bg-[#F3E9D2] text-[#7A6A50]"}`}>
                    {formReady ? <AtsCvText>{"Ready"}</AtsCvText> : <AtsCvText>{"Draft"}</AtsCvText>}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <IconButton label="Zoom out" onClick={() => {
            hasManualZoomRef.current = true;
            setPreviewZoom((value) => Math.max(MIN_PREVIEW_ZOOM, value - 10));
        }}>
                  <Minus size={12}/>
                </IconButton>

                <button type="button" onClick={resetPreviewZoom} title={L("Reset to fit the panel width")} className="h-8 min-w-12 rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2 text-[11px] font-bold text-[#5A4A32] hover:bg-[#EFE3C8]">
                  {previewZoom}<AtsCvText>{"%\n                "}</AtsCvText></button>

                <IconButton label="Zoom in" onClick={() => {
            hasManualZoomRef.current = true;
            setPreviewZoom((value) => Math.min(MAX_PREVIEW_ZOOM, value + 10));
        }}>
                  <Plus size={12}/>
                </IconButton>

                <button type="button" onClick={handleViewPreview} className="rounded-lg border border-[#E3D6B8] bg-[#F6EEDB] px-2.5 py-2 text-[11px] font-bold text-[#DC2626] hover:bg-[#F3E9D2]"><AtsCvText>{"Preview\n                "}</AtsCvText></button>
              </div>
            </div>

            <div ref={previewStageRef} className="preview-stage mt-4 overflow-auto rounded-xl border border-[#E3D6B8]/60 bg-[#38372f] p-3 sm:p-6" aria-label={L("Scrollable A4 CV preview")}>
              <div className="flex min-w-full justify-center py-1">
                <div id="cv-print-root" className="cv-print-root origin-top transition-transform duration-200" style={{
            width: "210mm",
            maxWidth: "none",
            transform: `scale(${previewZoom / 100})`,
            marginBottom: `${Math.max(0, (previewZoom / 100 - 1) * 297)}mm`,
        }}>
                  <TemplateDocument data={cvData}/>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="sticky bottom-3 z-30 rounded-2xl border border-[#E3D6B8]/80 bg-[#FBF6E8]/95 px-4 py-3 shadow-lg backdrop-blur print:hidden">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[#5A4A32]">
            <span className={`h-1.5 w-1.5 rounded-full ${formReady ? "bg-emerald-500" : "bg-[#D42020]"}`}/>

            <span>
              {formReady
        ? <AtsCvText>{"CV ready for download / print."}</AtsCvText> : <AtsCvText>{"Complete the required fields to export your CV."}</AtsCvText>}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
            <SecondaryButton onClick={handleClearAll} disabled={isExporting}>
              <RotateCw size={12}/><AtsCvText>{"Clear all\n            "}</AtsCvText></SecondaryButton>

            <SecondaryButton onClick={() => void handlePrint("print")} disabled={isExporting}>
              <Printer size={12}/> {isExporting ? <AtsCvText>{"Preparing…"}</AtsCvText> : <AtsCvText>{"Print"}</AtsCvText>}
            </SecondaryButton>

            <PrimaryButton onClick={() => void handlePrint("pdf")} disabled={isExporting}>
              <Download size={12}/>{<AtsCvText>{" "}</AtsCvText>}
              {isExporting ? <AtsCvText>{"Preparing…"}</AtsCvText> : <AtsCvText>{"Download PDF"}</AtsCvText>}
            </PrimaryButton>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-[12px] font-medium text-emerald-800 shadow-sm print:hidden">
        <ShieldCheck size={17} className="shrink-0 text-emerald-600"/>

        <span><AtsCvText>{"Your CV and images are processed in your browser. This component does\n          not upload your CV data to a server.\n        "}</AtsCvText></span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E3D6B8]/80 bg-[#FBF6E8] shadow-sm print:hidden">
        <button type="button" onClick={() => setIsHowToUseOpen((open) => !open)} className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-[#EFE3C8]/60">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#DC2626]"><AtsCvText>{"?"}</AtsCvText></span>

            <span className="text-sm font-bold text-[#3B2F1E]"><AtsCvText>{"How to use"}</AtsCvText></span>
          </div>

          <ChevronDown size={15} className={`text-[#7A6A50] transition ${isHowToUseOpen ? "rotate-180" : ""}`}/>
        </button>

        {isHowToUseOpen ? (<div className="space-y-2 border-t border-[#E3D6B8] px-5 pb-4 pt-3 text-[12px] leading-relaxed text-[#5A4A32]">
            <p><AtsCvText>{"1. Choose a template from the top section."}</AtsCvText></p>

            <p><AtsCvText>{"2. Import an existing PDF or fill each step manually."}</AtsCvText></p>

            <p><AtsCvText>{"3. Watch the A4 preview update instantly as you type."}</AtsCvText></p>

            <p><AtsCvText>{"4. Use Print or Download PDF, then choose Save as PDF in your\n              browser\u2019s print dialog.\n            "}</AtsCvText></p>
          </div>) : null}
      </div>

      <div className="space-y-3 print:hidden">
        <h3 className="text-sm font-bold text-[#3B2F1E]"><AtsCvText>{"Tools in the same category\n        "}</AtsCvText></h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link href="/sohoj-tools" className="group flex items-start gap-3 rounded-2xl border border-[#E3D6B8]/80 bg-[#FBF6E8] p-4 shadow-sm transition hover:border-[#DC2626]/50">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <LayoutTemplate size={19}/>
            </div>

            <div>
              <h4 className="text-[12px] font-bold text-[#3B2F1E] transition group-hover:text-[#DC2626]"><AtsCvText>{"All Seba Lagbe Tools\n              "}</AtsCvText></h4>

              <p className="mt-0.5 line-clamp-2 text-[11px] text-[#7A6A50]"><AtsCvText>{"Explore the complete collection of browser-based tools in one\n                place.\n              "}</AtsCvText></p>
            </div>
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .ats-cv-maker {
          position: relative;
          isolation: isolate;
          min-height: 100vh;
          color: #3B2F1E;
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          --ats-bg: #F2E8D2;
          --ats-paper: #ffffff;
        }

        .ats-cv-maker::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: linear-gradient(180deg, #E9DDC3 0%, #EFE5CE 100%);
        }

        .ats-cv-maker,
        .ats-cv-maker :not(.font-mono):not(svg):not(svg *) {
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .ats-cv-maker :where(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), textarea, select) {
          color: #3B2F1E;
          border-color: #E3D6B8;
          background-color: #FBF6E8;
          font-size: 15px;
          font-family: inherit;
          transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
        }

        .ats-cv-maker :where(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), textarea, select):focus-visible {
          border-color: #DC2626;
          outline: none;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.18);
        }

        .ats-cv-maker button {
          transition-duration: 180ms;
        }

        .ats-cv-maker button:active:not(:disabled) {
          transform: scale(0.98);
        }

        /* Pointer cursor on every clickable element of this tool */
        :where(.ats-cv-maker) a[href],
        :where(.ats-cv-maker) button:not(:disabled):not([aria-disabled="true"]),
        :where(.ats-cv-maker) label:has(input[type="checkbox"]),
        :where(.ats-cv-maker) label:has(input[type="radio"]),
        :where(.ats-cv-maker) label:has(input[type="file"]),
        :where(.ats-cv-maker) summary,
        :where(.ats-cv-maker) [role="button"],
        :where(.ats-cv-maker) select,
        :where(.ats-cv-maker) input[type="color"],
        :where(.ats-cv-maker) input[type="range"],
        :where(.ats-cv-maker) input[type="checkbox"],
        :where(.ats-cv-maker) input[type="radio"],
        :where(.ats-cv-maker) input[type="file"] {
          cursor: pointer;
        }

        :where(.ats-cv-maker) button:disabled {
          cursor: not-allowed;
        }

        .ats-cv-maker .cv-print-root {
          box-sizing: border-box;
        }

        .ats-cv-maker .cv-template {
          position: relative;
          box-sizing: border-box;
          width: 210mm;
          min-height: 297mm;
          background: var(--ats-paper);
          color: #1d1d1b;
          font-family: Arial, Helvetica, sans-serif;
          box-shadow: 0 10px 26px -8px rgba(59, 47, 30, 0.20);
          font-size: 9.6pt;
          line-height: 1.4;
          overflow: visible;
        }

        .ats-cv-maker .cv-page-inner {
          box-sizing: border-box;
          min-height: 297mm;
          padding: 17mm 17mm 15mm;
        }

        .ats-cv-maker .cv-header {
          display: flex;
          align-items: flex-start;
          gap: 7mm;
          margin-bottom: 6mm;
        }

        .ats-cv-maker .cv-photo {
          flex: 0 0 28mm;
          width: 28mm;
          height: 28mm;
          overflow: hidden;
          background: #e2e8f0;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ats-cv-maker .cv-photo-rounded {
          border-radius: 4mm;
        }

        .ats-cv-maker .cv-photo-circle {
          border-radius: 999px;
        }

        .ats-cv-maker .cv-photo-designed {
          box-shadow:
            0 0 0 3px #fff,
            0 4px 14px rgba(0, 0, 0, 0.11);
        }

        .ats-cv-maker .cv-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ats-cv-maker .cv-placeholder-icon {
          width: 12mm;
          height: 12mm;
          color: #b7b2a1;
        }

        .ats-cv-maker .cv-header-main {
          min-width: 0;
          flex: 1;
        }

        .ats-cv-maker .cv-header-main h1 {
          margin: 0;
          font-size: 27pt;
          line-height: 1;
          letter-spacing: -0.02em;
          font-weight: 800;
        }

        .ats-cv-maker .cv-role {
          margin: 2mm 0 2.5mm;
          font-size: 11.5pt;
          font-weight: 700;
          color: #57544a;
        }

        .ats-cv-maker .cv-contact-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1.2mm 3.6mm;
          font-size: 8pt;
          color: #55534a;
        }

        .ats-cv-maker .cv-contact-grid span {
          display: inline-flex;
          align-items: center;
          gap: 1mm;
        }

        .ats-cv-maker .cv-section {
          margin-top: 4.6mm;
        }

        .ats-cv-maker .cv-section-title {
          margin-bottom: 2.3mm;
          padding-bottom: 1.2mm;
          border-bottom: 0.35mm solid #333;
          font-size: 10pt;
          line-height: 1;
          font-weight: 900;
          letter-spacing: 0.035em;
        }

        .ats-cv-maker .cv-stack {
          display: grid;
          gap: 3.5mm;
        }

        .ats-cv-maker .cv-entry {
          break-inside: avoid;
        }

        .ats-cv-maker .cv-entry-top {
          display: flex;
          justify-content: space-between;
          gap: 5mm;
          align-items: flex-start;
        }

        .ats-cv-maker .cv-entry-title {
          font-size: 9.8pt;
          font-weight: 800;
        }

        .ats-cv-maker .cv-entry-subtitle {
          margin-top: 0.6mm;
          font-size: 8.5pt;
          font-weight: 600;
          color: #5f5b50;
        }

        .ats-cv-maker .cv-entry-period {
          flex: 0 0 auto;
          max-width: 36%;
          text-align: right;
          font-size: 8.1pt;
          color: #5c5a54;
        }

        .ats-cv-maker .cv-paragraph {
          margin: 1.2mm 0 0;
          font-size: 8.6pt;
          color: #35352f;
        }

        .ats-cv-maker .pre-wrap {
          white-space: pre-wrap;
        }

        .ats-cv-maker .cv-skill-list {
          display: flex;
          flex-wrap: wrap;
          gap: 1.6mm 4.3mm;
        }

        .ats-cv-maker .cv-skill {
          font-size: 8.5pt;
        }

        .ats-cv-maker .cv-empty-state {
          margin-top: 18mm;
          display: flex;
          min-height: 50mm;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 2mm;
          text-align: center;
          color: #b0ac9e;
        }

        .ats-cv-maker .cv-empty-state strong {
          font-size: 10.5pt;
          color: #8a8678;
        }

        .ats-cv-maker .cv-empty-state span {
          font-size: 8.2pt;
        }

        .ats-cv-maker .cv-template-classic .cv-section-title {
          border-color: #34332e;
        }

        .ats-cv-maker .cv-template-classic .cv-header-main h1 {
          font-family: Georgia, "Times New Roman", serif;
        }

        .ats-cv-maker .cv-template-modern .cv-page-inner {
          padding: 0 16mm 15mm;
        }

        .ats-cv-maker .cv-template-modern .cv-header {
          margin: 0 -16mm 7mm;
          padding: 14mm 16mm 9mm;
          border-bottom: 1.2mm solid #0f8d91;
          background: #f4fbfb;
        }

        .ats-cv-maker .cv-template-modern .cv-header-main h1 {
          font-size: 25pt;
        }

        .ats-cv-maker .cv-template-modern .cv-section-title {
          border-color: #0f8d91;
          color: #0f6e72;
        }

        .ats-cv-maker .cv-template-modern .cv-role {
          color: #0f777a;
        }

        .ats-cv-maker .cv-template-professional .cv-page-inner {
          padding: 0 16mm 15mm;
        }

        .ats-cv-maker .cv-template-professional .cv-header {
          margin: 0 -16mm 7mm;
          padding: 14mm 16mm 9mm;
          background: #eef7f2;
          border-bottom: 1mm solid #2f8f63;
        }

        .ats-cv-maker .cv-template-professional .cv-header-main h1 {
          font-family: Arial, Helvetica, sans-serif;
        }

        .ats-cv-maker .cv-template-professional .cv-section-title {
          border-color: #2f8f63;
          color: #246d4d;
        }

        .ats-cv-maker .cv-template-professional .cv-entry-title {
          color: #214f3a;
        }

        .ats-cv-maker .cv-template-elegant .cv-page-inner {
          padding: 17mm 18mm 15mm;
        }

        .ats-cv-maker .cv-template-elegant .cv-header {
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 4mm;
        }

        .ats-cv-maker .cv-template-elegant .cv-header-main h1 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 26pt;
          font-weight: 600;
        }

        .ats-cv-maker .cv-template-elegant .cv-role {
          color: #7c4b9c;
        }

        .ats-cv-maker .cv-template-elegant .cv-contact-grid {
          justify-content: center;
        }

        .ats-cv-maker .cv-template-elegant .cv-section-title {
          border-color: #8c4ab8;
          color: #7a3ca4;
          text-align: center;
        }

        .ats-cv-maker .cv-template-elegant .cv-photo {
          width: 26mm;
          height: 26mm;
          border-radius: 999px;
        }

        @media (max-width: 1023px) {
          .ats-cv-maker .cv-print-root {
            width: 210mm !important;
            max-width: none !important;
          }
        }

        @media (max-width: 640px) {
          .ats-cv-maker .preview-stage {
            padding: 8px;
          }

          .ats-cv-maker .cv-print-root {
            transform-origin: top center !important;
          }
        }

        @media (max-width: 640px) {
          .ats-cv-maker .sticky {
            bottom: 0.5rem;
          }

          .ats-cv-maker .preview-stage {
            -webkit-overflow-scrolling: touch;
          }
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          html,
          body {
            width: 100% !important;
            height: 0 !important;
            min-width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            overflow: hidden !important;
          }

          body * {
            visibility: hidden !important;
          }

          #cv-print-root,
          #cv-print-root * {
            visibility: visible !important;
          }

          #cv-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            max-width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            overflow: visible !important;
          }

          #cv-print-root .cv-template {
            width: 210mm !important;
            min-height: 297mm !important;
            height: auto !important;
            margin: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #cv-print-root .cv-page-inner {
            min-height: 0 !important;
          }

          #cv-print-root .cv-section,
          #cv-print-root .cv-entry,
          #cv-print-root .cv-header {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .ats-cv-maker,
          .ats-cv-maker * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>);
}
