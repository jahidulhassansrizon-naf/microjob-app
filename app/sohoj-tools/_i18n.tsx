"use client";

import React, { useCallback, useMemo } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";

const EXACT: Record<string, string> = {
  "sohoz tools": "সহজ টুলস",
  "image tools": "ইমেজ টুলস",
  "text tools": "টেক্সট টুলস",
  "video tools": "ভিডিও টুলস",
  "general tools": "সাধারণ টুলস",
  "educational tools": "শিক্ষামূলক টুলস",
  "all": "সব",
  "favorites": "পছন্দের",
  "all tools": "সব টুল",
  "free": "বিনামূল্যে",
  "paid": "পেইড",
  "free tools": "ফ্রি টুলস",
  "paid tools": "পেইড টুলস",
  "all categories": "সব ক্যাটাগরি",
  "category": "ক্যাটাগরি",
  "search tools...": "টুল খুঁজুন...",
  "search tools": "টুল খুঁজুন",
  "what would you like to find today?": "আজ আপনি কী খুঁজতে চান?",
  "your everyday toolkit": "আপনার প্রতিদিনের প্রয়োজনীয় টুলস",
  "find the right tool for every task": "প্রতিটি কাজের জন্য সঠিক টুল খুঁজুন",
  "search images, pdfs, documents and more in seconds.": "ছবি, PDF, ডকুমেন্টসহ আরও অনেক টুল খুঁজুন কয়েক সেকেন্ডেই।",
  "popular searches": "জনপ্রিয় সার্চ",
  "explore all tools": "সব টুল ঘুরে দেখুন",
  "clear search": "সার্চ পরিষ্কার করুন",
  "no tools found": "কোনো টুল পাওয়া যায়নি",
  "loading tools...": "টুল লোড হচ্ছে...",
  "showing results from": "ফলাফল দেখানো হচ্ছে",
  "we couldn't find any tool matching": "আপনার খোঁজের সঙ্গে মিলে এমন কোনো টুল পাওয়া যায়নি",
  "try searching for something else.": "অন্য কোনো শব্দ দিয়ে খুঁজে দেখুন।",
  "pdf tools": "PDF টুলস",
  "bijoy ↔ unicode": "বিজয় ↔ ইউনিকোড",
  "bijoy (ansi)": "বিজয় (ANSI)",
  "unicode": "ইউনিকোড",
  "characters": "অক্ষর",
  "conversion input": "রূপান্তরের ইনপুট",
  "conversion direction": "রূপান্তরের দিক",
  "bijoy to unicode": "বিজয় থেকে ইউনিকোড",
  "unicode to bijoy": "ইউনিকোড থেকে বিজয়",
  "converted text": "রূপান্তরিত লেখা",
  "paste text to get started": "শুরু করতে লেখা পেস্ট করুন",
  "choose a direction, paste your text, then convert it in the browser.": "একটি দিক নির্বাচন করুন, লেখা পেস্ট করুন, তারপর ব্রাউজারেই তা রূপান্তর করুন।",
  "copied!": "কপি হয়েছে!",
  "copy converted text": "রূপান্তরিত লেখা কপি করুন",
  "convert to": "রূপান্তর করুন",
  "your files are processed in the browser — they are not uploaded to any server.": "আপনার ফাইলগুলো ব্রাউজারেই প্রক্রিয়াকরণ করা হয়—কোনো সার্ভারে আপলোড করা হয় না।",
  "how to use": "যেভাবে ব্যবহার করবেন",
  "tools in the same category": "একই ক্যাটাগরির টুলস",
  "new background": "নতুন ব্যাকগ্রাউন্ড",
  "transparent": "স্বচ্ছ",
  "solid color": "এক রঙের ব্যাকগ্রাউন্ড",
  "select color": "রঙ নির্বাচন করুন",
  "removing background...": "ব্যাকগ্রাউন্ড সরানো হচ্ছে...",
  "remove background": "ব্যাকগ্রাউন্ড সরান",
  "download result": "ফলাফল ডাউনলোড করুন",
  "preview": "পূর্বরূপ",
  "processed": "প্রক্রিয়া সম্পন্ন",
  "add an image to get started": "শুরু করতে একটি ছবি যোগ করুন",
  "the cut-out preview will appear here after processing.": "প্রক্রিয়াকরণ শেষ হলে কাটা ছবির পূর্বরূপ এখানে দেখা যাবে।",
  "or press ctrl+v to paste a copied image": "অথবা কপি করা ছবি পেস্ট করতে Ctrl+V চাপুন",
  "shrink jpg, png, and webp photos in your browser — quality stays sharp.": "ব্রাউজারেই JPG, PNG ও WebP ছবির আকার কমান—ছবির মান পরিষ্কার থাকবে।",
  "turn nid card front and back photos into a clean a4 pdf — all in your browser.": "NID কার্ডের সামনের ও পেছনের ছবি থেকে পরিষ্কার A4 PDF তৈরি করুন—সবকিছু ব্রাউজারেই।",
  "turn passport front and back page photos into a clean a4 pdf — icao 88×125 mm layout, all in your browser.": "পাসপোর্টের সামনের ও পেছনের পাতার ছবি থেকে পরিষ্কার A4 PDF তৈরি করুন—ICAO 88×125 মিমি বিন্যাসে, সবকিছু ব্রাউজারেই।",
  "type bangla with an english keyboard — live banglish to bangla and bangla to banglish conversion in your browser.": "ইংরেজি কিবোর্ড দিয়ে বাংলা টাইপ করুন—ব্রাউজারেই বাংলিশ থেকে বাংলা এবং বাংলা থেকে বাংলিশে তাৎক্ষণিক রূপান্তর।",
  "type here": "এখানে লিখুন",
  "conversion mode": "রূপান্তরের ধরন",
  "banglish — type here": "বাংলিশ — এখানে লিখুন",
  "bangla — paste here": "বাংলা — এখানে পেস্ট করুন",
  "start typing to convert": "রূপান্তর করতে লেখা শুরু করুন",
  "choose a mode, type in the left panel, and the converted text appears instantly.": "একটি মোড বেছে নিয়ে বাম পাশের ঘরে লিখুন; রূপান্তরিত লেখা সঙ্গে সঙ্গে ডান পাশে দেখা যাবে।",
  "quick reference": "দ্রুত সহায়িকা",
  "this tool supports pure banglish.": "এই টুলে শুদ্ধ বাংলিশ লেখা সমর্থিত।",
  "convert text": "লেখা রূপান্তর করুন",
  "preview unavailable — check the crop.": "পূর্বরূপ দেখা যাচ্ছে না—ক্রপ ঠিক আছে কি না দেখুন।",
  "crop & straighten passport page": "পাসপোর্টের পাতা ক্রপ ও সোজা করুন",
  "drag inside to move": "ভেতরে টেনে সরান",
  "reset crop": "ক্রপ পুনরায় সেট করুন",
  "apply crop": "ক্রপ প্রয়োগ করুন",
  "click or drop an image here": "এখানে ক্লিক করুন অথবা ছবি টেনে এনে ছেড়ে দিন",
  "maximum 20 mb": "সর্বোচ্চ ২০ MB",
  "settings": "সেটিংস",
  "page orientation": "পাতার দিক",
  "portrait": "উল্লম্ব",
  "landscape": "অনুভূমিক",
  "layout": "বিন্যাস",
  "switch": "পরিবর্তন করুন",
  "rotate": "ঘোরান",
  "rotate 90°": "৯০° ঘোরান",
  "both pages rotate together.": "দুটি পাতাই একসঙ্গে ঘুরবে।",
  "position on page": "পাতায় অবস্থান",
  "copies": "কপি সংখ্যা",
  "two copies are placed on the same a4 sheet, at actual size when they fit.": "একই A4 পাতায় দুটি কপি বসানো হবে; জায়গা থাকলে আসল আকারে রাখা হবে।",
  "rounded corners (14px)": "গোলাকার কোণ (১৪px)",
  "round the corners of each page image": "প্রতিটি পাতার ছবির কোণ গোল করুন",
  "adjustments": "সমন্বয়",
  "actual size: each page is 88×125 mm.": "আসল আকার: প্রতিটি পাতা ৮৮×১২৫ মিমি।",
  "live preview": "সরাসরি পূর্বরূপ",
  "upload your passport page": "আপনার পাসপোর্টের পাতা আপলোড করুন",
  "add the front and back page photos from the controls below.": "নিচের নিয়ন্ত্রণগুলো থেকে সামনের ও পেছনের পাতার ছবি যোগ করুন।",
  "images ready — review the crop and create your pdf.": "ছবিগুলো প্রস্তুত—ক্রপ দেখে PDF তৈরি করুন।",
  "upload front and back page photos to get started.": "শুরু করতে সামনের ও পেছনের পাতার ছবি আপলোড করুন।",
  "processing…": "প্রক্রিয়াকরণ চলছে…",
  "create pdf": "PDF তৈরি করুন",
  "image to text": "ছবি থেকে লেখা",
  "extract text from images with ocr in your browser — supports english and bengali.": "ব্রাউজারে OCR ব্যবহার করে ছবি থেকে লেখা বের করুন—ইংরেজি ও বাংলা দুটোই সমর্থিত।",
  "files": "ফাইলসমূহ",
  "remove": "সরান",
  "drop an image here or click to upload": "এখানে একটি ছবি টেনে আনুন অথবা আপলোড করতে ক্লিক করুন",
  "jpg, png, webp, bmp, or gif — max 50mb": "JPG, PNG, WebP, BMP বা GIF — সর্বোচ্চ ৫০MB",
  "ocr language": "OCR-এর ভাষা",
  "english + bengali (উভয়ই)": "ইংরেজি + বাংলা (উভয়ই)",
  "english only": "শুধু ইংরেজি",
  "bengali only (বাংলা)": "শুধু বাংলা (বাংলা)",
  "image preview & extracted text": "ছবির পূর্বরূপ ও বের করা লেখা",
  "upload an image to extract text": "লেখা বের করতে একটি ছবি আপলোড করুন",
  "your image preview and extracted text will appear here.": "আপনার ছবির পূর্বরূপ এবং বের করা লেখা এখানে দেখা যাবে।",
  "result": "ফলাফল",
  "select all": "সব নির্বাচন করুন",
  "text copied to clipboard": "লেখা ক্লিপবোর্ডে কপি হয়েছে",
  "try again": "আবার চেষ্টা করুন",
  "use english only": "শুধু ইংরেজি ব্যবহার করুন",
  "no text found in this image": "এই ছবিতে কোনো লেখা পাওয়া যায়নি",
  "scanning image…": "ছবি স্ক্যান করা হচ্ছে…",
  "ready to scan text": "লেখা স্ক্যান করার জন্য প্রস্তুত",
  "extracting…": "লেখা বের করা হচ্ছে…",
  "extract text": "লেখা বের করুন",
  "images to pdf": "ছবি থেকে PDF",
  "combine jpg, png, webp, and more into one pdf — reorder pages in your browser.": "JPG, PNG, WebPসহ বিভিন্ন ছবি একটি PDF-এ একত্র করুন—ব্রাউজারেই পাতার ক্রম সাজিয়ে নিন।",
  "customize pdf output": "PDF-এর আউটপুট নিজের মতো সাজান",
  "page": "পাতা",
  "image": "ছবি",
  "effects": "প্রভাব",
  "orientation": "পাতার দিক",
  "auto orientation": "স্বয়ংক্রিয় দিক নির্ধারণ",
  "page size": "পাতার আকার",
  "margin": "মার্জিন",
  "page numbers": "পৃষ্ঠা নম্বর",
  "add page numbers": "পৃষ্ঠা নম্বর যোগ করুন",
  "image fit": "ছবির ফিট",
  "fit to page": "পাতায় ফিট করুন",
  "maintain full image aspect ratio": "ছবির সম্পূর্ণ অনুপাত বজায় রাখুন",
  "fill page": "পুরো পাতা পূরণ করুন",
  "stretch to fill full page printable area": "প্রিন্টযোগ্য পুরো পৃষ্ঠা ভরাট করতে ছবিটি প্রসারিত করুন",
  "grayscale mode": "ধূসর রঙের মোড",
  "convert color images to black & white pdf": "রঙিন ছবিকে সাদা-কালো PDF-এ রূপান্তর করুন",
  "generating pdf...": "PDF তৈরি করা হচ্ছে...",
  "pdf preview": "PDF-এর পূর্বরূপ",
  "add more": "আরও যোগ করুন",
  "add images to get started": "শুরু করতে ছবি যোগ করুন",
  "drag and drop jpg, png, or webp images here": "JPG, PNG বা WebP ছবি এখানে টেনে এনে ছেড়ে দিন",
  "download": "ডাউনলোড করুন",
  "close preview": "পূর্বরূপ বন্ধ করুন",
  "preview not available": "পূর্বরূপ পাওয়া যাচ্ছে না",
  "this file type cannot be displayed directly in the browser.": "এই ধরনের ফাইল ব্রাউজারে সরাসরি দেখানো যায় না।",
  "open file": "ফাইল খুলুন",
  "newest first": "নতুনগুলো আগে",
  "oldest first": "পুরনোগুলো আগে",
  "sort files": "ফাইল সাজান",
  "filter by file type": "ফাইলের ধরন অনুযায়ী ফিল্টার করুন",
  "search by file or tool name": "ফাইল বা টুলের নাম দিয়ে খুঁজুন",
  "search tool files": "টুলের ফাইল খুঁজুন",
  "sohoztools files": "সহজটুলসের ফাইল",
  "loading…": "লোড হচ্ছে…",
  "close sohoztools sidebar": "সহজটুলসের সাইডবার বন্ধ করুন",
  "anything you save from a sohoztools tool — a scanned document, a compressed pdf, a resized photo — is stored here.": "সহজটুলসের যেকোনো টুল থেকে সেভ করা ফাইল—স্ক্যান করা ডকুমেন্ট, কমপ্রেস করা PDF বা সাইজ কমানো ছবি—এখানে সংরক্ষিত থাকে।",
  "browse sohoztools": "সহজটুলস দেখুন",
  "delete this file?": "এই ফাইলটি মুছে ফেলবেন?",
  "this action will permanently remove the saved file.": "এই কাজটি ফাইলটিকে স্থায়ীভাবে মুছে দেবে।",
  "delete": "মুছুন",
  "deleting…": "মুছে ফেলা হচ্ছে…",
  "cancel": "বাতিল",
  "save": "সেভ করুন",
  "saved": "সেভ হয়েছে",
  "ready": "প্রস্তুত",
  "done": "সম্পন্ন",
  "create": "তৈরি করুন",
  "open": "খুলুন",
  "view": "দেখুন",
  "edit": "এডিট করুন",
  "reset": "পুনরায় সেট করুন",
  "upload": "আপলোড করুন",
  "download pdf": "PDF ডাউনলোড করুন",
  "download image": "ছবি ডাউনলোড করুন",
  "print": "প্রিন্ট করুন",
  "next step": "পরবর্তী ধাপ",
  "previous step": "আগের ধাপ",
  "required fields:": "প্রয়োজনীয় ঘরগুলো:",
  "optional": "ঐচ্ছিক",
  "add photo": "ছবি যোগ করুন",
  "change photo": "ছবি পরিবর্তন করুন",
  "remove photo": "ছবি সরান",
  "experience": "অভিজ্ঞতা",
  "education": "শিক্ষা",
  "project": "প্রকল্প",
  "add skill": "দক্ষতা যোগ করুন",
  "custom section": "নিজস্ব বিভাগ",
  "add another experience": "আরও একটি অভিজ্ঞতা যোগ করুন",
  "add another education": "আরও একটি শিক্ষাগত যোগ্যতা যোগ করুন",
  "add another project": "আরও একটি প্রকল্প যোগ করুন",
  "add new section": "নতুন বিভাগ যোগ করুন",
  "your cv preview will appear here": "আপনার CV-এর পূর্বরূপ এখানে দেখা যাবে",
  "start filling the form to build your ats-friendly cv.": "ATS-উপযোগী CV তৈরি করতে ফর্ম পূরণ করা শুরু করুন।",
  "reading pdf…": "PDF পড়া হচ্ছে…",
  "upload an existing cv pdf": "আগের একটি CV PDF আপলোড করুন",
  "up to 8 mb. text-based pdfs can be parsed in the browser; scanned image-only pdfs may require manual entry.": "সর্বোচ্চ ৮ MB। লেখাযুক্ত PDF ব্রাউজারেই পড়া যাবে; শুধু স্ক্যান করা ছবির PDF হলে হাতে তথ্য দিতে হতে পারে।",
  "photo (optional)": "ছবি (ঐচ্ছিক)",
  "recommended: square image": "প্রস্তাবিত: বর্গাকার ছবি",
  "photo design on": "ছবির নকশা চালু",
  "design photo": "ছবির নকশা",
  "shape": "আকৃতি",
  "build an ats-friendly cv — live preview and high-quality a4 print/pdf flow.": "ATS-উপযোগী CV তৈরি করুন—সরাসরি পূর্বরূপ এবং উচ্চমানের A4 প্রিন্ট/PDF সুবিধাসহ।",
  "fill in your cv step by step. the preview updates as you type.": "ধাপে ধাপে আপনার CV পূরণ করুন। আপনি লিখলেই পূর্বরূপ আপডেট হবে।",
  "more designs coming soon": "আরও নকশা শীঘ্রই আসছে",
  "view preview": "পূর্বরূপ দেখুন",
  "cv ready for download / print.": "CV ডাউনলোড বা প্রিন্টের জন্য প্রস্তুত।",
  "complete the required fields to export your cv.": "CV রপ্তানি করতে প্রয়োজনীয় ঘরগুলো পূরণ করুন।",
  "clear all": "সব পরিষ্কার করুন",
  "preparing…": "প্রস্তুত করা হচ্ছে…",
  "choose a template from the top section.": "উপরের অংশ থেকে একটি টেমপ্লেট বেছে নিন।",
  "import an existing pdf or fill each step manually.": "আগের একটি PDF ইমপোর্ট করুন অথবা প্রতিটি ধাপ হাতে পূরণ করুন।",
  "watch the a4 preview update instantly as you type.": "লিখতে থাকলে A4 পূর্বরূপের তাৎক্ষণিক পরিবর্তন দেখুন।",
  "use print or download pdf, then choose save as pdf in your browser’s print dialog.": "প্রিন্ট বা PDF ডাউনলোড করুন, তারপর ব্রাউজারের প্রিন্ট ডায়ালগে “PDF হিসেবে সেভ করুন” নির্বাচন করুন।",
  "all sohoz tools": "সব সহজটুলস",
  "explore the complete collection of browser-based tools in one place.": "ব্রাউজারভিত্তিক সব টুল এক জায়গায় দেখুন।",
  "government job photo & sign resizer": "সরকারি চাকরির ছবি ও স্বাক্ষর রিসাইজার",
  "lock / unlock pdf": "PDF লক / আনলক",
  "pdf to image": "PDF থেকে ছবি",
  "compress pdf": "PDF কমপ্রেস করুন",
  "merge pdfs": "PDF একত্র করুন",
  "image size reducer": "ছবির আকার কমান",
  "image upscaler": "ছবির মান বাড়ান",
  "ats friendly cv maker": "ATS-উপযোগী CV মেকার",
  "family card form": "ফ্যামিলি কার্ড ফর্ম",
  "voter migration form": "ভোটার স্থানান্তর ফর্ম",
  "voter registration form": "ভোটার নিবন্ধন ফর্ম",
  "passport joiner": "পাসপোর্ট জয়নার",
  "crop image": "ছবি ক্রপ করুন",
  "age calculator": "বয়স ক্যালকুলেটর",
  "reduce video file size": "ভিডিওর আকার কমান",
  "change speed": "গতি পরিবর্তন করুন",
  "add watermark": "ওয়াটারমার্ক যোগ করুন",
  "image convert": "ছবি রূপান্তর করুন",
  "split pdf": "PDF ভাগ করুন",
  "edit pdf": "PDF এডিট করুন",
  "banglish typing": "বাংলিশ টাইপিং",
  "special information form": "বিশেষ তথ্য ফর্ম",
  "fuel card form": "ফুয়েল কার্ড ফর্ম",
  "nid joiner": "NID জয়নার",
  "nid information correction form": "NID তথ্য সংশোধন ফর্ম",
  "document scanner": "ডকুমেন্ট স্ক্যানার",
  "govt job photo & sign resizer": "সরকারি চাকরির ছবি ও স্বাক্ষর রিসাইজার",
  "video preview": "ভিডিওর পূর্বরূপ",
  "image preview": "ছবির পূর্বরূপ",
  "use the controls on the left to continue.": "চালিয়ে যেতে বাম পাশের নিয়ন্ত্রণগুলো ব্যবহার করুন।",
  "please wait…": "অনুগ্রহ করে অপেক্ষা করুন…",
  "please try again.": "আবার চেষ্টা করুন।",
  "something went wrong.": "কিছু একটা সমস্যা হয়েছে।",
  "failed to load": "লোড করা যায়নি",
  "failed to save": "সেভ করা যায়নি",
  "failed to delete": "মুছে ফেলা যায়নি",
  "ready to process": "প্রক্রিয়া শুরু করার জন্য প্রস্তুত",
  "processing": "প্রক্রিয়াকরণ চলছে",
  "processing complete": "প্রক্রিয়াকরণ সম্পন্ন",
  "saving...": "সেভ করা হচ্ছে...",
  "saving…": "সেভ করা হচ্ছে…",
  "saved documents": "সেভ করা ডকুমেন্টসমূহ",
  "saved documents are linked to your account.": "সেভ করা ডকুমেন্ট আপনার অ্যাকাউন্টের সঙ্গে সংযুক্ত।",
  "document print": "ডকুমেন্ট প্রিন্ট",
  "all kind of documents print ready.": "সব ধরনের ডকুমেন্ট প্রিন্টের জন্য প্রস্তুত করুন।",
  "pdf download": "PDF ডাউনলোড",
  "save current document?": "বর্তমান ডকুমেন্টটি সেভ করবেন?",
  "you can save your current work before switching to another document.": "অন্য ডকুমেন্টে যাওয়ার আগে আপনার বর্তমান কাজটি সেভ করে নিতে পারেন।",
  "no": "না",
  "yes, save": "হ্যাঁ, সেভ করুন",
  "deleting...": "মুছে ফেলা হচ্ছে...",
  "saved documents load হচ্ছে...": "সেভ করা ডকুমেন্ট লোড হচ্ছে...",
  "এই টেক্সটটি": "এই টেক্সটটি"
};

const STATUS_EXACT: Record<string, string> = {
  "saved documents could not be loaded. please try again.": "সেভ করা ডকুমেন্ট লোড করা যায়নি। আবার চেষ্টা করুন।",
  "there was a problem loading the opencv script.": "OpenCV স্ক্রিপ্ট লোড করতে সমস্যা হয়েছে।",
  "document saving was cancelled or timed out. please try again.": "ডকুমেন্ট সেভ বাতিল হয়েছে বা সময় শেষ হয়ে গেছে। আবার চেষ্টা করুন।",
  "the document could not be saved. please try again.": "ডকুমেন্ট সেভ করা যায়নি। আবার চেষ্টা করুন।",
  "the saved document url could not be found.": "সেভ করা ডকুমেন্টের URL পাওয়া যায়নি।",
  "the pdf could not be created. please try again.": "PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।",
  "the print preview could not be opened. please try again.": "প্রিন্টের পূর্বরূপ খোলা যায়নি। আবার চেষ্টা করুন।",
  "printing failed. please try again.": "প্রিন্ট করা যায়নি। আবার চেষ্টা করুন।",
  "the print preview could not be created. please try again.": "প্রিন্টের পূর্বরূপ তৈরি করা যায়নি। আবার চেষ্টা করুন।",
  "the document could not be loaded in the print preview. please try again.": "প্রিন্টের পূর্বরূপে ডকুমেন্ট লোড করা যায়নি। আবার চেষ্টা করুন।",
  "the current document has unsaved changes. do you want to discard them and edit the saved document?": "বর্তমান ডকুমেন্টে সেভ না করা পরিবর্তন আছে। এগুলো বাদ দিয়ে সেভ করা ডকুমেন্টটি এডিট করতে চান?",
  "the image could not be loaded for editing the saved document.": "সেভ করা ডকুমেন্ট এডিট করার জন্য ছবি লোড করা যায়নি।",
  "the document could not be deleted. please try again.": "ডকুমেন্ট মুছে ফেলা যায়নি। আবার চেষ্টা করুন।",
  "the ai model could not be loaded. check your internet connection and try again.": "AI মডেল লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।",
  "document processing could not be completed. please try again.": "ডকুমেন্ট প্রক্রিয়াকরণ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।",
  "opencv could not be loaded. check your internet connection and try again, or use manual crop.": "OpenCV লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন, অথবা ম্যানুয়াল ক্রপ ব্যবহার করুন।",
  "the document edges could not be detected. use manual crop.": "ডকুমেন্টের কিনারা শনাক্ত করা যায়নি। ম্যানুয়াল ক্রপ ব্যবহার করুন।",
  "auto crop could not be completed. please try again.": "অটো ক্রপ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।",
  "use ${enhance_label} first, then ${label} will become available.": "আগে ${ENHANCE_LABEL} করুন, তারপর ${label} ব্যবহার করা যাবে।",
  "remove ${label}": "${label} সরান",
  "this cannot be removed separately after cropping — press undo.": "ক্রপ করার পরে এটি আলাদাভাবে সরানো যায় না—আনডু চাপুন।",
  "add ${label}": "${label} যোগ করুন",
  "remove the last magic clean step.": "সর্বশেষ ম্যাজিক ক্লিন ধাপটি সরান।",
  "add ${enhance_label}": "${ENHANCE_LABEL} যোগ করুন",
  "${enhance_label} has reached the maximum.": "${ENHANCE_LABEL}-এর সর্বোচ্চ সীমায় পৌঁছেছে।",
  "downloading ai model… ${enhanceprogress.percent}% (first run)": "AI মডেল ডাউনলোড হচ্ছে… ${enhanceProgress.percent}% (প্রথমবার)",
  "starting ai engine…": "AI ইঞ্জিন চালু হচ্ছে…",
  "${enhance_label} in progress… ${enhanceprogress.percent}%": "${ENHANCE_LABEL} চলছে… ${enhanceProgress.percent}%",
  "loading opencv… auto crop will start as soon as it is ready.": "OpenCV লোড হচ্ছে… প্রস্তুত হলেই অটো ক্রপ শুরু হবে।",
  "auto crop is running…": "অটো ক্রপ চলছে…",
  "cleaning document…": "ডকুমেন্ট পরিষ্কার করা হচ্ছে…",
  "coloring document…": "ডকুমেন্টে রঙ প্রয়োগ করা হচ্ছে…"
};

const TERMS: Record<string, string> = {
  "tools": "টুলস",
  "tool": "টুল",
  "files": "ফাইলসমূহ",
  "file": "ফাইল",
  "image": "ছবি",
  "images": "ছবিগুলো",
  "photo": "ছবি",
  "photos": "ছবিগুলো",
  "document": "ডকুমেন্ট",
  "documents": "ডকুমেন্টগুলো",
  "video": "ভিডিও",
  "videos": "ভিডিওগুলো",
  "page": "পাতা",
  "pages": "পাতাগুলো",
  "text": "লেখা",
  "input": "ইনপুট",
  "output": "আউটপুট",
  "result": "ফলাফল",
  "results": "ফলাফলগুলো",
  "preview": "পূর্বরূপ",
  "browser": "ব্রাউজার",
  "server": "সার্ভার",
  "settings": "সেটিংস",
  "category": "ক্যাটাগরি",
  "categories": "ক্যাটাগরিগুলো",
  "conversion": "রূপান্তর",
  "convert": "রূপান্তর করুন",
  "converted": "রূপান্তরিত",
  "direction": "দিক",
  "mode": "মোড",
  "position": "অবস্থান",
  "size": "আকার",
  "quality": "মান",
  "format": "ফরম্যাট",
  "orientation": "পাতার দিক",
  "portrait": "উল্লম্ব",
  "landscape": "অনুভূমিক",
  "layout": "বিন্যাস",
  "margin": "মার্জিন",
  "effect": "প্রভাব",
  "effects": "প্রভাবসমূহ",
  "opacity": "স্বচ্ছতা",
  "transparent": "স্বচ্ছ",
  "solid": "অস্বচ্ছ",
  "background": "ব্যাকগ্রাউন্ড",
  "color": "রঙ",
  "colors": "রঙগুলো",
  "rotate": "ঘোরান",
  "rotation": "ঘোরানো",
  "crop": "ক্রপ",
  "reset": "পুনরায় সেট করুন",
  "upload": "আপলোড করুন",
  "download": "ডাউনলোড করুন",
  "select": "নির্বাচন করুন",
  "selected": "নির্বাচিত",
  "choose": "বেছে নিন",
  "add": "যোগ করুন",
  "remove": "সরান",
  "delete": "মুছুন",
  "edit": "এডিট করুন",
  "create": "তৈরি করুন",
  "open": "খুলুন",
  "view": "দেখুন",
  "search": "খুঁজুন",
  "filter": "ফিল্টার করুন",
  "sort": "সাজান",
  "save": "সেভ করুন",
  "saved": "সেভ হয়েছে",
  "saving": "সেভ হচ্ছে",
  "print": "প্রিন্ট করুন",
  "copy": "কপি",
  "paste": "পেস্ট করুন",
  "close": "বন্ধ করুন",
  "cancel": "বাতিল",
  "done": "সম্পন্ন",
  "next": "পরবর্তী",
  "previous": "আগের",
  "loading": "লোড হচ্ছে",
  "processing": "প্রক্রিয়াকরণ চলছে",
  "ready": "প্রস্তুত",
  "failed": "ব্যর্থ",
  "error": "ত্রুটি",
  "warning": "সতর্কতা",
  "success": "সফল",
  "new": "নতুন",
  "free": "ফ্রি",
  "paid": "পেইড",
  "hot": "জনপ্রিয়",
  "used": "ব্যবহৃত",
  "time": "বার",
  "times": "বার",
  "application": "আবেদন",
  "form": "ফর্ম",
  "card": "কার্ড",
  "signature": "স্বাক্ষর",
  "name": "নাম",
  "address": "ঠিকানা",
  "phone": "ফোন",
  "email": "ইমেইল",
  "date": "তারিখ",
  "month": "মাস",
  "year": "বছর",
  "day": "দিন",
  "age": "বয়স",
  "gender": "লিঙ্গ",
  "male": "পুরুষ",
  "female": "নারী",
  "education": "শিক্ষা",
  "experience": "অভিজ্ঞতা",
  "project": "প্রকল্প",
  "skill": "দক্ষতা",
  "skills": "দক্ষতাসমূহ",
  "template": "টেমপ্লেট",
  "templates": "টেমপ্লেটগুলো",
  "subject": "বিষয়",
  "question": "প্রশ্ন",
  "questions": "প্রশ্নগুলো",
  "chapter": "অধ্যায়",
  "account": "অ্যাকাউন্ট",
  "profile": "প্রোফাইল",
  "subscription": "সাবস্ক্রিপশন",
  "current": "বর্তমান",
  "original": "মূল",
  "manual": "ম্যানুয়াল",
  "automatic": "স্বয়ংক্রিয়",
  "auto": "অটো",
  "front": "সামনের দিক",
  "back": "পেছনের দিক",
  "both": "উভয়",
  "left": "বামদিকে",
  "right": "ডানদিকে",
  "top": "উপরে",
  "bottom": "নিচে",
  "center": "মাঝখানে",
  "here": "এখানে",
  "there": "সেখানে",
  "again": "আবার",
  "another": "আরেকটি",
  "more": "আরও",
  "less": "কম",
  "full": "পূর্ণ",
  "empty": "খালি",
  "required": "প্রয়োজনীয়",
  "optional": "ঐচ্ছিক",
  "available": "উপলব্ধ",
  "unavailable": "অনুপলব্ধ",
  "information": "তথ্য",
  "details": "বিস্তারিত",
  "instructions": "নির্দেশনা",
  "description": "বিবরণ",
  "title": "শিরোনাম",
  "subtitle": "উপশিরোনাম",
  "label": "লেবেল",
  "maximum": "সর্বোচ্চ",
  "minimum": "সর্বনিম্ন",
  "max": "সর্বোচ্চ",
  "min": "সর্বনিম্ন",
  "sheet": "পাতা",
  "sheets": "পাতাগুলো",
  "copies": "কপি",
  "width": "প্রস্থ",
  "height": "উচ্চতা",
  "printable": "প্রিন্টযোগ্য",
  "fit": "ফিট",
  "stretch": "প্রসারিত করুন",
  "maintain": "বজায় রাখুন",
  "sharp": "পরিষ্কার",
  "live": "সরাসরি",
  "scan": "স্ক্যান",
  "scanning": "স্ক্যান করা হচ্ছে",
  "extract": "বের করুন",
  "extracted": "বের করা",
  "generate": "তৈরি করুন",
  "generating": "তৈরি করা হচ্ছে",
  "downloaded": "ডাউনলোড হয়েছে",
  "replace": "পরিবর্তন করুন",
  "change": "পরিবর্তন করুন",
  "apply": "প্রয়োগ করুন",
  "previewing": "পূর্বরূপ দেখা হচ্ছে",
  "processed": "প্রক্রিয়া সম্পন্ন"
};

const TECHNICAL = new Set([
  "PDF","MP4","PNG","JPG","JPEG","WebP","WEBP","BMP","GIF","HEIC","SVG","CSV","JSON","XML","HTML",
  "OCR","NID","AI","CV","ATS","A4","ICAO","FFmpeg","OpenCV","Ctrl","URL","MB","GB","KB","px","mm","%", "2D","3D"
]);

const normalize = (value: string) => value.replace(/\\u00a0/g, " ").replace(/\\s+/g, " ").trim().toLowerCase();

function preserveWhitespace(source: string, translated: string) {
  const leading = source.match(/^\\s*/)?.[0] ?? "";
  const trailing = source.match(/\\s*$/)?.[0] ?? "";
  return `${leading}${translated.trim()}${trailing}`;
}

function translatePattern(source: string): string | null {
  const s = source.replace(/\\s+/g, " ").trim();

  let m = s.match(/^no (.+?) yet[.!]?$/i);
  if (m) return `এখনও কোনো ${translateSmart(m[1])} নেই।`;

  m = s.match(/^no (.+?) found[.!]?$/i);
  if (m) return `কোনো ${translateSmart(m[1])} পাওয়া যায়নি।`;

  m = s.match(/^no (.+?) available[.!]?$/i);
  if (m) return `কোনো ${translateSmart(m[1])} উপলব্ধ নেই।`;

  m = s.match(/^(.+?) will appear here(?: after (.+?))?[.!]?$/i);
  if (m) {
    const subject = translateSmart(m[1]);
    return m[2] ? `${subject} ${translateSmart(m[2])} শেষ হলে এখানে দেখা যাবে।` : `${subject} এখানে দেখা যাবে।`;
  }

  m = s.match(/^your (.+?) will appear here[.!]?$/i);
  if (m) return `আপনার ${translateSmart(m[1])} এখানে দেখা যাবে।`;

  m = s.match(/^add (?:an?|the) (.+?) to get started[.!]?$/i);
  if (m) return `শুরু করতে ${translateSmart(m[1])} যোগ করুন।`;

  m = s.match(/^upload (?:an?|the) (.+?) to get started[.!]?$/i);
  if (m) return `শুরু করতে ${translateSmart(m[1])} আপলোড করুন।`;

  m = s.match(/^upload (?:an?|the) (.+?)[.!]?$/i);
  if (m) return `${translateSmart(m[1])} আপলোড করুন।`;

  m = s.match(/^download (?:the )?(.+?)[.!]?$/i);
  if (m) return `${translateSmart(m[1])} ডাউনলোড করুন।`;

  m = s.match(/^select (?:the )?(.+?)[.!]?$/i);
  if (m) return `${translateSmart(m[1])} নির্বাচন করুন।`;

  m = s.match(/^choose (?:a |an |the )?(.+?)[.!]?$/i);
  if (m) return `${translateSmart(m[1])} বেছে নিন।`;

  m = s.match(/^add (?:a |an |the )?(.+?)[.!]?$/i);
  if (m) return `${translateSmart(m[1])} যোগ করুন।`;

  m = s.match(/^remove (?:the )?(.+?)[.!]?$/i);
  if (m) return `${translateSmart(m[1])} সরান।`;

  m = s.match(/^delete (?:the )?(.+?)[.!]?$/i);
  if (m) return `${translateSmart(m[1])} মুছে দিন।`;

  m = s.match(/^open (?:the )?(.+?)[.!]?$/i);
  if (m) return `${translateSmart(m[1])} খুলুন।`;

  m = s.match(/^view (?:the )?(.+?)[.!]?$/i);
  if (m) return `${translateSmart(m[1])} দেখুন।`;

  m = s.match(/^search (?:by )?(.+?)[.!]?$/i);
  if (m) return `${translateSmart(m[1])} দিয়ে খুঁজুন।`;

  m = s.match(/^click (?:the )?(.+?) to (.+?)[.!]?$/i);
  if (m) return `${translateSmart(m[1])} ক্লিক করে ${translateSmart(m[2])}।`;

  m = s.match(/^use (?:the )?(.+?) to (.+?)[.!]?$/i);
  if (m) return `${translateSmart(m[1])} ব্যবহার করে ${translateSmart(m[2])}।`;

  m = s.match(/^ready to (.+?)[.!]?$/i);
  if (m) return `${translateSmart(m[1])}-এর জন্য প্রস্তুত।`;

  m = s.match(/^please (.+?)[.!]?$/i);
  if (m) return `অনুগ্রহ করে ${translateSmart(m[1])}।`;

  m = s.match(/^loading (.+?)\.\.\.$/i);
  if (m) return `${translateSmart(m[1])} লোড হচ্ছে...`;

  m = s.match(/^processing (.+?)\.\.\.$/i);
  if (m) return `${translateSmart(m[1])} প্রক্রিয়াকরণ চলছে...`;

  return null;
}

function translateSmart(source: string): string {
  const compact = normalize(source);
  if (!compact) return source;
  const exact = EXACT[compact] ?? STATUS_EXACT[compact];
  if (exact) return exact;

  let out = source;

  // Keep common technical tokens unchanged while translating ordinary English terms.
  out = out.replace(/[A-Za-z][A-Za-z'-]*/g, (token) => {
    if (TECHNICAL.has(token) || TECHNICAL.has(token.toUpperCase())) return token;
    const term = TERMS[token.toLowerCase()];
    return term ?? token;
  });

  // Small grammar clean-ups for common UI phrases.
  out = out
    .replace(/\\b([A-Za-z]+)\\s+করুনed\\b/gi, "$1 করা হয়েছে")
    .replace(/\\bload করা হয়েছে\\b/gi, "লোড করা হয়েছে")
    .replace(/\\btypeing\\b/gi, "টাইপিং")
    .replace(/\\bprocessed\\b/gi, "প্রক্রিয়া সম্পন্ন")
    .replace(/\\bready\\b/gi, "প্রস্তুত")
    .replace(/\\s+/g, " ");

  return out.trim();
}

export function translateSohozText(value: unknown, locale: "en" | "bn", fallback: (value: unknown) => string): string {
  const source = String(value ?? "");
  if (locale === "en" || !/[A-Za-z]/.test(source)) return source;
  const compact = normalize(source);
  const exact = EXACT[compact] ?? STATUS_EXACT[compact];
  if (exact) return preserveWhitespace(source, exact);
  const patterned = translatePattern(source);
  if (patterned) return preserveWhitespace(source, patterned);
  const fallbackValue = fallback(source);
  // Prefer our contextual translation when it actually changes the string.
  const smart = translateSmart(source);
  if (/[A-Za-z]/.test(smart) && smart.toLowerCase() !== source.toLowerCase()) {
    return preserveWhitespace(source, smart);
  }
  return fallbackValue;
}


export function L(value: string): string {
  if (typeof document === "undefined") return value;
  const locale = document.documentElement.getAttribute("data-locale") === "bn" ? "bn" : "en";
  // We cannot call React hooks here; the parent page consumes useSohozI18n so
  // language changes trigger a rerender, after which this pure helper reads
  // the latest locale from the document.
  const fallback = value;
  if (locale === "en") return value;
  const compact = normalize(value);
  const exact = EXACT[compact] ?? STATUS_EXACT[compact];
  if (exact) return preserveWhitespace(value, exact);
  const patterned = translatePattern(value);
  if (patterned) return preserveWhitespace(value, patterned);
  const smart = translateSmart(value);
  if (/[A-Za-z]/.test(smart) && smart.toLowerCase() !== value.toLowerCase()) return preserveWhitespace(value, smart);
  return fallback;
}
export function useSohozI18n() {
  const { locale, t } = useI18n();
  const L = useCallback((value: string) => translateSohozText(value, locale, t), [locale, t]);
  return useMemo(() => ({ locale, t, L }), [locale, t, L]);
}

export function T({ children }: { children: React.ReactNode }) {
  const { locale, t } = useI18n();
  if (typeof children === "string" || typeof children === "number") {
    return <>{translateSohozText(children, locale, t)}</>;
  }
  return <>{children}</>;
}
