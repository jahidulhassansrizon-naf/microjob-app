"use client";

import React from "react";
import { useI18n } from "@/components/i18n/I18nProvider";

const DASHBOARD_BN: Record<string, string> = {
  "popular tools": "জনপ্রিয় টুলস",
  "free tools to speed up your daily work.": "দৈনন্দিন কাজ আরও দ্রুত করতে বিনামূল্যের টুলস।",
  "view all": "সব দেখুন",
  "tools": "টুলস",
  "welcome back,": "আবারও স্বাগতম,",
  "good morning": "শুভ সকাল",
  "good afternoon": "শুভ বিকেল",
  "good evening": "শুভ সন্ধ্যা",
  "good night": "শুভ রাত্রি",
  "nid, pdf, images and videos — all your everyday digital tasks are now in one place. choose the tool you need and finish the job in minutes.":
    "NID, PDF, ছবি ও ভিডিও—আপনার দৈনন্দিন সব ডিজিটাল কাজ এখন এক জায়গায়। প্রয়োজনীয় টুলটি বেছে নিন এবং কয়েক মিনিটেই কাজ শেষ করুন।",
  "explore all tools": "সব টুল দেখুন",
  "my files": "আমার ফাইল",
  "free tools · no installation needed": "টি ফ্রি টুলস • কোনো ইনস্টলেশন প্রয়োজন নেই",
  "login successful!": "লগইন সফল হয়েছে!",
  "checking authentication...": "অথেনটিকেশন যাচাই করা হচ্ছে...",
  "close modal": "পপ-আপ বন্ধ করুন",
  "contact": "যোগাযোগ",
  "facebook": "ফেসবুক",
  "crafted with": "ভালোবাসায় তৈরি",
  "by": "দ্বারা",
  "inspired by": "অনুপ্রেরণায়",
  "srizon": "srizon",
  "free": "বিনামূল্যে",
  "new": "নতুন",
  "hot": "জনপ্রিয়",
  "popular": "জনপ্রিয়",
  "ai photo edit": "AI ফটো এডিট",
  "manually edited photos": "ম্যানুয়ালি এডিট করা ছবি",
  "bulk edited photos": "বাল্ক এডিট করা ছবি",
  "ai template images": "AI টেমপ্লেটের ছবি",
  "documents generated": "তৈরি করা ডকুমেন্ট",
  "print media saved": "সংরক্ষিত প্রিন্ট মিডিয়া",
  "question papers": "প্রশ্নপত্র",
  "account summary": "অ্যাকাউন্টের সারসংক্ষেপ",
  "live": "সরাসরি",
  "today": "আজ",
  "this week": "এই সপ্তাহ",
  "this month": "এই মাস",
  "income": "আয়",
  "expense": "ব্যয়",
  "balance": "ব্যালেন্স",
  "stable": "স্থিতিশীল",
  "current balance": "বর্তমান ব্যালেন্স",
  "due": "বকেয়া",
  "income due": "বকেয়া আয়",
  "expense due": "বকেয়া ব্যয়",
  "credits remaining": "টি ক্রেডিট বাকি",
  "total 2 · 0 used": "মোট ২ • ব্যবহার হয়েছে ০",
  "recharge credit": "ক্রেডিট রিচার্জ করুন",
  "latest jobs": "সাম্প্রতিক চাকরি",
  "newest recruitment notices": "সর্বশেষ নিয়োগ বিজ্ঞপ্তি",
  "view all jobs": "সব চাকরি দেখুন",
  "posts": "পদসংখ্যা",
  "published": "প্রকাশিত",
  "deadline": "শেষ তারিখ",
  "details": "বিস্তারিত",
  "apply": "আবেদন করুন",
  "government": "সরকারি",
  "features & tools": "ফিচার ও টুলস",
  "accounts & invoice": "হিসাব ও ইনভয়েস",
  "other": "অন্যান্য",
  "dashboard": "ড্যাশবোর্ড",
  "my profile": "আমার প্রোফাইল",
  "ai editor": "AI এডিটর",
  "manual editor": "ম্যানুয়াল এডিটর",
  "bulk photo edit": "বাল্ক ফটো এডিট",
  "ai template": "AI টেমপ্লেট",
  "print media": "প্রিন্ট মিডিয়া",
  "sohoztools": "সহজ টুলস",
  "income & expenses": "আয় ও ব্যয়",
  "customers & invoices": "কাস্টমার ও ইনভয়েস",
  "settings": "সেটিংস",
  "whatsapp সাপোর্ট": "হোয়াটসঅ্যাপ সাপোর্ট",
  "tutorial video": "টিউটোরিয়াল ভিডিও",
  "buy subscription": "সাবস্ক্রিপশন কিনুন",
  "language": "ভাষা",
  "logout": "লগআউট",
  "user account": "ইউজার অ্যাকাউন্ট",
  "user": "ইউজার",
  "guest": "অতিথি",
  "main navigation": "প্রধান নেভিগেশন",
  "close menu": "মেনু বন্ধ করুন",
  "log out": "লগআউট",
  "open menu": "মেনু খুলুন",
  "search": "খুঁজুন",
  "search tools and features...": "টুলস ও ফিচার খুঁজুন...",
  "press esc to close": "বন্ধ করতে Esc চাপুন",
  "open": "খুলুন",
  "no matching tools found": "মিলে যাওয়া কোনো টুল পাওয়া যায়নি",
  "try another tool name, category, or keyword.": "অন্য কোনো টুলের নাম, ক্যাটাগরি বা কীওয়ার্ড দিয়ে চেষ্টা করুন।",
  "start typing to find what you need.": "প্রয়োজনীয় জিনিস খুঁজতে টাইপ করা শুরু করুন।",
  "more": "আরও",
  "upcoming": "শীঘ্রই আসছে",
  "subscription": "সাবস্ক্রিপশন",
  "terms": "শর্তাবলি",
  "privacy policy": "প্রাইভেসি পলিসি",
  "copyright": "কপিরাইট",
  "refund policy": "রিফান্ড পলিসি",
  "all rights reserved.": "সর্বস্বত্ব সংরক্ষিত।",
  "form auto fillup": "ফর্ম স্বয়ংক্রিয়ভাবে পূরণ",
  "image size reducer": "ছবির আকার কমান",
  "image convert": "ছবি কনভার্ট করুন",
  "nid to pdf": "NID থেকে PDF",
  "passport to pdf": "পাসপোর্ট থেকে PDF",
  "edit pdf": "PDF এডিট করুন",
  "image to text": "ছবি থেকে টেক্সট",
  "document cleanup": "ডকুমেন্ট পরিষ্কার করুন",
  "invoice": "ইনভয়েস",
  "income & expense": "আয় ও ব্যয়",
  "income/expense list": "আয়/ব্যয়ের তালিকা",
  "customers": "কাস্টমার",
  "photo edit settings": "ফটো এডিট সেটিংস",
  "useful links": "প্রয়োজনীয় লিংক",
  "manage shop": "দোকান পরিচালনা",
  "sohoz tools": "সহজ টুলস",
  "document generate": "ডকুমেন্ট তৈরি",
  "jobs": "চাকরি",
  "accounts & settings": "অ্যাকাউন্ট ও সেটিংস",
  "close preview": "প্রিভিউ বন্ধ করুন",
  "download": "ডাউনলোড",
  "view": "দেখুন",
  "delete": "মুছুন",
  "preview": "প্রিভিউ",
};

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function patternTranslate(source: string): string | null {
  const s = source.trim();
  let m = s.match(/^(\d+)\s+files?$/i);
  if (m) return `${m[1]}টি ফাইল`;
  m = s.match(/^showing results from (.+)$/i);
  if (m) return `${m[1]} থেকে ফলাফল দেখানো হচ্ছে`;
  m = s.match(/^no (.+) files yet$/i);
  if (m) return `এখনও কোনো ${m[1]} ফাইল নেই`;
  m = s.match(/^files you save from (.+) tools will appear here\.$/i);
  if (m) return `আপনি ${m[1]} টুল থেকে যে ফাইল সংরক্ষণ করবেন, সেগুলো এখানে দেখা যাবে।`;
  m = s.match(/^(\d+)\s+file$/i);
  if (m) return `${m[1]}টি ফাইল`;
  m = s.match(/^(\d+)\s+credits remaining$/i);
  if (m) return `${m[1]}টি ক্রেডিট বাকি`;
  return null;
}

export function DT({ children }: { children: React.ReactNode }) {
  const { locale, t } = useI18n();
  if (typeof children !== "string" && typeof children !== "number") return <>{children}</>;
  const source = String(children);
  if (locale === "en" || !/[A-Za-z]/.test(source)) return <>{source}</>;
  const key = normalize(source);
  const exact = DASHBOARD_BN[key];
  if (exact) {
    const leading = source.match(/^\s*/)?.[0] ?? "";
    const trailing = source.match(/\s*$/)?.[0] ?? "";
    return <>{leading}{exact}{trailing}</>;
  }
  const patterned = patternTranslate(source);
  if (patterned) {
    const leading = source.match(/^\s*/)?.[0] ?? "";
    const trailing = source.match(/\s*$/)?.[0] ?? "";
    return <>{leading}{patterned}{trailing}</>;
  }
  return <>{t(source)}</>;
}
