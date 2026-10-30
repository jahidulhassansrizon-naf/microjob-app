"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "EN" | "BN";

const STORAGE_KEY = "sohojkaj-language";
const COOKIE_KEY = "sohojkaj_language";

/**
 * Local, React-owned translation layer.
 *
 * This intentionally does not touch document text nodes and does not load a
 * third-party translator. That keeps React's virtual DOM and the browser DOM
 * in sync, avoiding the Google-Translate `insertBefore`/`removeChild` class of
 * crashes.
 */
const PHRASES: Record<string, string> = {
  "Seba Lagbe": "সেবা লাগবে",
  "Seba Lagbe Tools": "সেবা লাগবে টুলস",
  "DIGITAL SERVICES": "ডিজিটাল সেবা",
  "ATS Friendly CV Maker": "ATS ফ্রেন্ডলি CV মেকার",
  "Add Watermark": "ওয়াটারমার্ক যোগ করুন",
  "Age Calculator": "বয়স ক্যালকুলেটর",
  "Banglish Typing": "বাংলিশ টাইপিং",
  "Bijoy - Unicode": "বিজয় - ইউনিকোড",
  "Change Speed": "গতি পরিবর্তন করুন",
  "Compress PDF": "PDF কমপ্রেস করুন",
  "Crop Image": "ছবি ক্রপ করুন",
  "Document Scanner": "ডকুমেন্ট স্ক্যানার",
  "Edit PDF": "PDF এডিট করুন",
  "Family Card Form": "ফ্যামিলি কার্ড ফর্ম",
  "Fuel Card Form": "ফুয়েল কার্ড ফর্ম",
  "Image Convert": "ইমেজ কনভার্ট",
  "Image Size Reducer": "ইমেজ সাইজ কমান",
  "Image Upscaler": "ইমেজ আপস্কেলার",
  "Image to Text": "ছবি থেকে টেক্সট",
  "Images to PDF": "ছবি থেকে PDF",
  "Lock / Unlock PDF": "PDF লক / আনলক",
  "Merge PDFs": "PDF মার্জ করুন",
  "NID Information Correction Form": "NID তথ্য সংশোধন ফর্ম",
  "Nid Joiner": "NID জয়েনার",
  "PDF to Image": "PDF থেকে ছবি",
  "Passport Joiner": "পাসপোর্ট জয়েনার",
  "Reduce Video File Size": "ভিডিওর ফাইল সাইজ কমান",
  "Remove Background": "ব্যাকগ্রাউন্ড সরান",
  "Special Information Form": "বিশেষ তথ্য ফর্ম",
  "Split PDF": "PDF ভাগ করুন",
  "Voter Migration Form": "ভোটার মাইগ্রেশন ফর্ম",
  "Voter Registration Form": "ভোটার নিবন্ধন ফর্ম",
  "Good morning": "সুপ্রভাত",
  "Good afternoon": "শুভ অপরাহ্ন",
  "Good evening": "শুভ সন্ধ্যা",
  "Good night": "শুভ রাত্রি",
  "Welcome back,": "আবারও স্বাগতম,",
  "View all tools": "সব টুল দেখুন",
  "Free tools to speed up your daily work.": "দৈনন্দিন কাজ দ্রুত করতে ফ্রি টুল ব্যবহার করুন।",
  "Try another tool name, category, or keyword.": "অন্য টুলের নাম, ক্যাটাগরি বা কীওয়ার্ড দিয়ে চেষ্টা করুন।",
  "Search tools...": "টুলস সার্চ করুন...",
  "Clear search": "সার্চ পরিষ্কার করুন",
  "All Tools": "সব টুল",
  "PDF Tools": "PDF টুলস",
  "Image Tools": "ইমেজ টুলস",
  "Text Tools": "টেক্সট টুলস",
  "Video Tools": "ভিডিও টুলস",
  "General Tools": "সাধারণ টুলস",
  "Educational Tools": "শিক্ষামূলক টুলস",
  "Features & Tools": "ফিচার ও টুলস",
  "Other": "অন্যান্য",
  "Filter tools by access": "অ্যাক্সেস অনুযায়ী টুল ফিল্টার করুন",
  "Filter tools by category": "ক্যাটাগরি অনুযায়ী টুল ফিল্টার করুন",
  "AI Editor": "এআই এডিটর",
  "AI Template": "এআই টেমপ্লেট",
  "AI Templates": "এআই টেমপ্লেটসমূহ",
  "AI tools": "এআই টুলস",
  "AI TOOLS": "এআই টুলস",
  "About": "আমাদের সম্পর্কে",
  "Account": "অ্যাকাউন্ট",
  "Account Summary": "অ্যাকাউন্টের সারাংশ",
  "Account registration information": "অ্যাকাউন্ট নিবন্ধনের তথ্য",
  "Accounts & Settings": "অ্যাকাউন্ট ও সেটিংস",
  "Actions": "অ্যাকশন",
  "Add": "যোগ করুন",
  "Add a PDF to get started": "শুরু করতে একটি PDF যোগ করুন",
  "Add an image to get started": "শুরু করতে একটি ছবি যোগ করুন",
  "Add a video to get started": "শুরু করতে একটি ভিডিও যোগ করুন",
  "Add another education": "আরও একটি শিক্ষাগত তথ্য যোগ করুন",
  "Add another experience": "আরও একটি অভিজ্ঞতা যোগ করুন",
  "Add another project": "আরও একটি প্রজেক্ট যোগ করুন",
  "Add another section": "আরও একটি সেকশন যোগ করুন",
  "Add customer": "কাস্টমার যোগ করুন",
  "Add entry": "এন্ট্রি যোগ করুন",
  "Add files to get started": "শুরু করতে ফাইল যোগ করুন",
  "Add images to get started": "শুরু করতে ছবি যোগ করুন",
  "Add more": "আরও যোগ করুন",
  "Add more images": "আরও ছবি যোগ করুন",
  "Add new section": "নতুন সেকশন যোগ করুন",
  "Add page numbers": "পৃষ্ঠা নম্বর যোগ করুন",
  "Add photos": "ছবি যোগ করুন",
  "Add skill": "দক্ষতা যোগ করুন",
  "Add your first entry": "আপনার প্রথম এন্ট্রি যোগ করুন",
  "Address": "ঠিকানা",
  "Adjustments": "সমন্বয়",
  "Age": "বয়স",
  "All categories": "সব ক্যাটাগরি",
  "All generated images": "সব তৈরি করা ছবি",
  "All pages": "সব পৃষ্ঠা",
  "All payments": "সব পেমেন্ট",
  "All statuses": "সব স্ট্যাটাস",
  "All your conversion work": "আপনার সব কনভার্সন কাজ",
  "Already have an account?": "ইতিমধ্যে অ্যাকাউন্ট আছে?",
  "Amount": "পরিমাণ",
  "Amount paid": "পরিশোধিত পরিমাণ",
  "Apply": "প্রয়োগ করুন",
  "Apply crop": "ক্রপ প্রয়োগ করুন",
  "Aspect Ratio": "অ্যাসপেক্ট রেশিও",
  "Aspect ratio": "অ্যাসপেক্ট রেশিও",
  "Auto": "অটো",
  "Auto balance": "অটো ব্যালেন্স",
  "Auto create": "অটো তৈরি",
  "Auto crop": "অটো ক্রপ",
  "Auto cropping": "অটো ক্রপিং",
  "Back": "ফিরে যান",
  "Back to Home": "হোমে ফিরে যান",
  "Back to Sign In": "সাইন ইন-এ ফিরে যান",
  "Back to Tools": "টুলসে ফিরে যান",
  "Back to dashboard": "ড্যাশবোর্ডে ফিরে যান",
  "Balance": "ব্যালেন্স",
  "Balance due": "বকেয়া ব্যালেন্স",
  "Balanced": "ভারসাম্যপূর্ণ",
  "Bangla to Banglish": "বাংলা থেকে বাংলিশ",
  "Banglish to Bangla": "বাংলিশ থেকে বাংলা",
  "Before": "আগে",
  "Bijoy to Unicode": "বিজয় থেকে ইউনিকোড",
  "Bijoy ↔ Unicode": "বিজয় ↔ ইউনিকোড",
  "Both sides": "উভয় পাশ",
  "Brightness": "উজ্জ্বলতা",
  "Brush": "ব্রাশ",
  "Brush Size": "ব্রাশের আকার",
  "Bulk Photo Edit": "বাল্ক ফটো এডিট",
  "Business Address": "ব্যবসার ঠিকানা",
  "Buy Subscription": "সাবস্ক্রিপশন কিনুন",
  "Calculate age on a different date": "অন্য তারিখ অনুযায়ী বয়স হিসাব করুন",
  "Cancel": "বাতিল",
  "Category": "ক্যাটাগরি",
  "Change": "পরিবর্তন করুন",
  "Change Image": "ছবি পরিবর্তন করুন",
  "Change Password": "পাসওয়ার্ড পরিবর্তন করুন",
  "Choose Auto Crop": "অটো ক্রপ বেছে নিন",
  "Choose image": "ছবি বেছে নিন",
  "Choose output size": "আউটপুটের আকার বেছে নিন",
  "Choose your subscription plan": "আপনার সাবস্ক্রিপশন প্ল্যান বেছে নিন",
  "Clear": "পরিষ্কার করুন",
  "Clear Mask": "মাস্ক পরিষ্কার করুন",
  "Clear all": "সব পরিষ্কার করুন",
  "Clear filters": "ফিল্টার পরিষ্কার করুন",
  "Close": "বন্ধ করুন",
  "Close menu": "মেনু বন্ধ করুন",
  "Clothing Area": "পোশাকের এলাকা",
  "Clothing Style": "পোশাকের স্টাইল",
  "Compare": "তুলনা করুন",
  "Compare with another person": "অন্য ব্যক্তির সাথে তুলনা করুন",
  "Completed": "সম্পন্ন",
  "Compressing your PDF…": "আপনার PDF কমপ্রেস করা হচ্ছে…",
  "Compressing your video…": "আপনার ভিডিও কমপ্রেস করা হচ্ছে…",
  "Compression failed": "কমপ্রেশন ব্যর্থ হয়েছে",
  "Confirm New Password": "নতুন পাসওয়ার্ড নিশ্চিত করুন",
  "Confirm Password": "পাসওয়ার্ড নিশ্চিত করুন",
  "Contact": "যোগাযোগ",
  "Continue anyway": "তারপরও চালিয়ে যান",
  "Contrast": "কনট্রাস্ট",
  "Conversion failed": "কনভার্সন ব্যর্থ হয়েছে",
  "Conversion input": "কনভার্সন ইনপুট",
  "Conversion mode": "কনভার্সন মোড",
  "Conversion preview": "কনভার্সন প্রিভিউ",
  "Converted text": "কনভার্ট করা টেক্সট",
  "Converting...": "কনভার্ট করা হচ্ছে...",
  "Copies": "কপি সংখ্যা",
  "Copyright Policy": "কপিরাইট নীতি",
  "Country": "দেশ",
  "Create PDF": "PDF তৈরি করুন",
  "Create invoice": "ইনভয়েস তৈরি করুন",
  "Create your account": "আপনার অ্যাকাউন্ট তৈরি করুন",
  "Create your signature": "আপনার স্বাক্ষর তৈরি করুন",
  "Creating...": "তৈরি করা হচ্ছে...",
  "Crop": "ক্রপ",
  "Crop & Download": "ক্রপ ও ডাউনলোড",
  "Crop & Rotate Image": "ছবি ক্রপ ও ঘোরান",
  "Crop preview": "ক্রপ প্রিভিউ",
  "Current balance": "বর্তমান ব্যালেন্স",
  "Current password": "বর্তমান পাসওয়ার্ড",
  "Customer": "কাস্টমার",
  "Customer Reviews": "কাস্টমারদের রিভিউ",
  "Dashboard": "ড্যাশবোর্ড",
  "Date": "তারিখ",
  "Date of birth": "জন্মতারিখ",
  "Day": "দিন",
  "Days": "দিনসমূহ",
  "Delete": "ডিলিট",
  "Delete this entry?": "এই এন্ট্রিটি ডিলিট করবেন?",
  "Delete this file?": "এই ফাইলটি ডিলিট করবেন?",
  "Deleting...": "ডিলিট করা হচ্ছে...",
  "Description": "বিবরণ",
  "Details": "বিস্তারিত",
  "Devices login": "ডিভাইস লগইন",
  "District": "জেলা",
  "Document": "ডকুমেন্ট",
  "Document Print": "ডকুমেন্ট প্রিন্ট",
  "Download": "ডাউনলোড",
  "Download All": "সব ডাউনলোড করুন",
  "Download PDF": "PDF ডাউনলোড করুন",
  "Download Result": "রেজাল্ট ডাউনলোড করুন",
  "Download image": "ছবি ডাউনলোড করুন",
  "Download video": "ভিডিও ডাউনলোড করুন",
  "Drag": "টেনে নিন",
  "Drop your video here": "আপনার ভিডিও এখানে ছেড়ে দিন",
  "Edit": "এডিট",
  "Edit Personal Information": "ব্যক্তিগত তথ্য এডিট করুন",
  "Edit Question": "প্রশ্ন এডিট করুন",
  "Education": "শিক্ষা",
  "Email": "ইমেইল",
  "Email Address": "ইমেইল ঠিকানা",
  "Email address": "ইমেইল ঠিকানা",
  "English Only": "শুধু ইংরেজি",
  "Enter 6-Digit OTP": "৬ সংখ্যার OTP লিখুন",
  "Eraser": "ইরেজার",
  "Error": "ত্রুটি",
  "Explore all tools": "সব টুল দেখুন",
  "Export": "এক্সপোর্ট",
  "FAQ": "প্রায়শই জিজ্ঞাসিত প্রশ্ন",
  "Family Card Application": "ফ্যামিলি কার্ড আবেদন",
  "File format": "ফাইল ফরম্যাট",
  "File size": "ফাইলের আকার",
  "Files": "ফাইলসমূহ",
  "Filter": "ফিল্টার",
  "Filters": "ফিল্টারসমূহ",
  "Forgot password?": "পাসওয়ার্ড ভুলে গেছেন?",
  "Form progress": "ফর্মের অগ্রগতি",
  "Free": "ফ্রি",
  "Free Size (mm)": "ফ্রি সাইজ (মিমি)",
  "Front only": "শুধু সামনের অংশ",
  "Full Name": "পূর্ণ নাম",
  "Generate Photo": "ছবি তৈরি করুন",
  "Generate your image": "আপনার ছবি তৈরি করুন",
  "Generated Photos": "তৈরি করা ছবিসমূহ",
  "Generating PDF...": "PDF তৈরি করা হচ্ছে...",
  "Generating Photo...": "ছবি তৈরি করা হচ্ছে...",
  "Generation Info": "জেনারেশনের তথ্য",
  "Generation settings": "জেনারেশন সেটিংস",
  "Gender": "লিঙ্গ",
  "Govt Job Photo & Sign Resizer": "সরকারি চাকরির ছবি ও সাইন সাইজ ঠিক করুন",
  "Grayscale Mode": "গ্রেস্কেল মোড",
  "HD PNG Image": "HD PNG ছবি",
  "How to use": "কীভাবে ব্যবহার করবেন",
  "Image": "ছবি",
  "Image Editing": "ইমেজ এডিটিং",
  "Important:": "গুরুত্বপূর্ণ:",
  "Income": "আয়",
  "Income and expense entries": "আয় ও ব্যয়ের এন্ট্রি",
  "Invoice": "ইনভয়েস",
  "Invoices / Due": "ইনভয়েস / বকেয়া",
  "Language": "ভাষা",
  "Latest Jobs": "সর্বশেষ কাজ",
  "Layout": "লেআউট",
  "Left": "বাম",
  "Left Person": "বাম পাশের ব্যক্তি",
  "Light compression": "হালকা কমপ্রেশন",
  "Links": "লিংকসমূহ",
  "Live preview": "লাইভ প্রিভিউ",
  "Loading...": "লোড হচ্ছে...",
  "Loading image…": "ছবি লোড হচ্ছে…",
  "Lock": "লক",
  "Login Successful!": "লগইন সফল হয়েছে!",
  "Login to your account": "আপনার অ্যাকাউন্টে লগইন করুন",
  "Logout": "লগআউট",
  "Manual Controls": "ম্যানুয়াল কন্ট্রোল",
  "Manual Editor": "ম্যানুয়াল এডিটর",
  "Marital status": "বৈবাহিক অবস্থা",
  "Merge failed": "মার্জ ব্যর্থ হয়েছে",
  "Merging your PDFs…": "আপনার PDFগুলো মার্জ করা হচ্ছে…",
  "Month": "মাস",
  "Months": "মাসসমূহ",
  "More": "আরও",
  "More categories": "আরও ক্যাটাগরি",
  "My Favorites": "আমার পছন্দসমূহ",
  "My Files": "আমার ফাইল",
  "My Profile": "আমার প্রোফাইল",
  "Name": "নাম",
  "National University Result": "জাতীয় বিশ্ববিদ্যালয়ের ফলাফল",
  "New Password": "নতুন পাসওয়ার্ড",
  "New question paper": "নতুন প্রশ্নপত্র",
  "Next step": "পরবর্তী ধাপ",
  "No": "না",
  "No active plan": "কোনো সক্রিয় প্ল্যান নেই",
  "No country found": "কোনো দেশ পাওয়া যায়নি",
  "No device data found": "কোনো ডিভাইসের তথ্য পাওয়া যায়নি",
  "No matching document templates found.": "মিলছে এমন কোনো ডকুমেন্ট টেমপ্লেট পাওয়া যায়নি।",
  "No matching links found": "মিলছে এমন কোনো লিংক পাওয়া যায়নি",
  "No matching tools found": "মিলছে এমন কোনো টুল পাওয়া যায়নি",
  "No photo": "কোনো ছবি নেই",
  "No photos added yet": "এখনও কোনো ছবি যোগ করা হয়নি",
  "No questions selected yet": "এখনও কোনো প্রশ্ন নির্বাচন করা হয়নি",
  "No results found": "কোনো ফলাফল পাওয়া যায়নি",
  "No templates found": "কোনো টেমপ্লেট পাওয়া যায়নি",
  "No text found in this image": "এই ছবিতে কোনো টেক্সট পাওয়া যায়নি",
  "No tools found": "কোনো টুল পাওয়া যায়নি",
  "Not correct? Crop manually": "সঠিক নয়? ম্যানুয়ালি ক্রপ করুন",
  "OCR Language": "OCR ভাষা",
  "Oldest first": "পুরোনো আগে",
  "Open": "খুলুন",
  "Open file": "ফাইল খুলুন",
  "Open editor": "এডিটর খুলুন",
  "Open this editor on your phone": "আপনার ফোনে এই এডিটরটি খুলুন",
  "Options": "অপশন",
  "Orientation": "অরিয়েন্টেশন",
  "Original": "মূল",
  "Original Photo": "মূল ছবি",
  "Output format": "আউটপুট ফরম্যাট",
  "Output preview": "আউটপুট প্রিভিউ",
  "Output size:": "আউটপুট সাইজ:",
  "Paid": "পেইড",
  "Partial": "আংশিক",
  "Password": "পাসওয়ার্ড",
  "Password settings": "পাসওয়ার্ড সেটিংস",
  "Passwords don't match.": "পাসওয়ার্ড মিলছে না।",
  "Paste text to get started": "শুরু করতে টেক্সট পেস্ট করুন",
  "Payment": "পেমেন্ট",
  "Payment Result": "পেমেন্ট ফলাফল",
  "Phone": "ফোন",
  "Phone Number": "ফোন নম্বর",
  "Photo": "ছবি",
  "Photo Size:": "ছবির সাইজ:",
  "Photo Sizes": "ছবির সাইজসমূহ",
  "Popular": "জনপ্রিয়",
  "Popular Tools": "জনপ্রিয় টুলস",
  "Portrait": "পোর্ট্রেট",
  "Position": "অবস্থান",
  "Preview": "প্রিভিউ",
  "Pricing": "মূল্য",
  "Print": "প্রিন্ট",
  "Print / Save": "প্রিন্ট / সেভ",
  "Print Media": "প্রিন্ট মিডিয়া",
  "Print This Image": "এই ছবি প্রিন্ট করুন",
  "Privacy Policy": "গোপনীয়তা নীতি",
  "Processing…": "প্রসেসিং চলছে…",
  "Profile": "প্রোফাইল",
  "Project": "প্রজেক্ট",
  "Quality": "কোয়ালিটি",
  "Quality preset": "কোয়ালিটি প্রিসেট",
  "Quick Add": "দ্রুত যোগ",
  "Quick Presets": "দ্রুত প্রিসেট",
  "Recent Output History": "সাম্প্রতিক আউটপুট ইতিহাস",
  "Recharge Credit": "ক্রেডিট রিচার্জ করুন",
  "Redo": "আবার করুন",
  "Refresh": "রিফ্রেশ",
  "Register": "রেজিস্টার",
  "Remember me": "আমাকে মনে রাখুন",
  "Remove": "সরিয়ে দিন",
  "Remove background": "ব্যাকগ্রাউন্ড সরান",
  "Remove photo": "ছবি সরিয়ে দিন",
  "Replace": "বদলে দিন",
  "Required fields:": "আবশ্যিক ফিল্ড:",
  "Reset": "রিসেট",
  "Reset All": "সব রিসেট করুন",
  "Reset Filters": "ফিল্টার রিসেট করুন",
  "Resize": "সাইজ পরিবর্তন",
  "Resolution": "রেজোলিউশন",
  "Restore": "পুনরুদ্ধার করুন",
  "Result": "ফলাফল",
  "Retry": "আবার চেষ্টা করুন",
  "Return to homepage": "হোমপেজে ফিরে যান",
  "Review the final crop": "চূড়ান্ত ক্রপ পর্যালোচনা করুন",
  "Right": "ডান",
  "Right Person": "ডান পাশের ব্যক্তি",
  "Rotate": "ঘোরান",
  "Rotate 90°": "৯০° ঘোরান",
  "Save": "সেভ করুন",
  "Save changes": "পরিবর্তন সেভ করুন",
  "Saved": "সেভ হয়েছে",
  "Saved Documents": "সেভ করা ডকুমেন্ট",
  "Scan": "স্ক্যান",
  "Scan Now": "এখন স্ক্যান করুন",
  "Scan QR Code": "QR কোড স্ক্যান করুন",
  "Search tools and features": "টুলস ও ফিচার সার্চ করুন",
  "See all": "সব দেখুন",
  "See details": "বিস্তারিত দেখুন",
  "Select all": "সব নির্বাচন করুন",
  "Select customer": "কাস্টমার নির্বাচন করুন",
  "Select Format": "ফরম্যাট নির্বাচন করুন",
  "Select Aspect Ratio Crop": "অ্যাসপেক্ট রেশিও ক্রপ নির্বাচন করুন",
  "Select Clothing Area": "পোশাকের এলাকা নির্বাচন করুন",
  "Select Color": "রং নির্বাচন করুন",
  "Select image": "ছবি নির্বাচন করুন",
  "Selected AI operations": "নির্বাচিত AI অপারেশন",
  "Send on WhatsApp": "WhatsApp-এ পাঠান",
  "Settings": "সেটিংস",
  "Share": "শেয়ার",
  "Share your review": "আপনার রিভিউ শেয়ার করুন",
  "Sign In": "সাইন ইন",
  "Sign in": "সাইন ইন",
  "Sign up": "সাইন আপ",
  "Signing in...": "সাইন ইন করা হচ্ছে...",
  "Simple Credit System": "সহজ ক্রেডিট সিস্টেম",
  "Seba Lagbe Tools Files": "সেবা লাগবে টুলসের ফাইল",
  "Sort": "সাজান",
  "Sort By": "সাজানোর ধরন",
  "Split failed": "স্প্লিট ব্যর্থ হয়েছে",
  "Start typing to convert": "কনভার্ট করতে টাইপ করা শুরু করুন",
  "Status": "স্ট্যাটাস",
  "Subscription": "সাবস্ক্রিপশন",
  "Subscription Required": "সাবস্ক্রিপশন প্রয়োজন",
  "Support": "সাপোর্ট",
  "Swap": "অদলবদল",
  "Terms & Conditions": "শর্তাবলি",
  "Today": "আজ",
  "Tools": "টুলস",
  "Total": "মোট",
  "Total Days": "মোট দিন",
  "Total Months": "মোট মাস",
  "Total Weeks": "মোট সপ্তাহ",
  "Try again": "আবার চেষ্টা করুন",
  "Tutorial": "টিউটোরিয়াল",
  "Tutorial Videos": "টিউটোরিয়াল ভিডিও",
  "Undo": "আনডু",
  "Unicode to Bijoy": "ইউনিকোড থেকে বিজয়",
  "Unit price": "একক মূল্য",
  "Unlock": "আনলক",
  "Unpaid": "অপরিশোধিত",
  "Upcoming": "আসন্ন",
  "Update preview": "প্রিভিউ আপডেট করুন",
  "Upload Document": "ডকুমেন্ট আপলোড করুন",
  "Upload Photo": "ছবি আপলোড করুন",
  "Upload an image to extract text": "টেক্সট বের করতে একটি ছবি আপলোড করুন",
  "Upload back side photo": "পেছনের পাশের ছবি আপলোড করুন",
  "Upload front side photo": "সামনের পাশের ছবি আপলোড করুন",
  "Upload or replace your files anytime.": "যেকোনো সময় ফাইল আপলোড বা বদলে দিতে পারবেন।",
  "Upload photo and signature": "ছবি ও স্বাক্ষর আপলোড করুন",
  "Upload signature": "স্বাক্ষর আপলোড করুন",
  "Upload your passport page": "আপনার পাসপোর্টের পৃষ্ঠা আপলোড করুন",
  "Upload your photo": "আপনার ছবি আপলোড করুন",
  "Uploading image and saving your record": "ছবি আপলোড ও রেকর্ড সেভ করা হচ্ছে",
  "Use this signature": "এই স্বাক্ষরটি ব্যবহার করুন",
  "Used": "ব্যবহৃত",
  "Verification Code Sent": "ভেরিফিকেশন কোড পাঠানো হয়েছে",
  "Vertical": "ভার্টিক্যাল",
  "View": "দেখুন",
  "View Subscription Plans": "সাবস্ক্রিপশন প্ল্যান দেখুন",
  "View all": "সব দেখুন",
  "View all images": "সব ছবি দেখুন",
  "View all jobs": "সব কাজ দেখুন",
  "View plans": "প্ল্যান দেখুন",
  "View preview": "প্রিভিউ দেখুন",
  "View template": "টেমপ্লেট দেখুন",
  "Visa Photo Size": "ভিসা ছবির সাইজ",
  "Waiting": "অপেক্ষা করছে",
  "Watermark text": "ওয়াটারমার্ক টেক্সট",
  "Watermark type": "ওয়াটারমার্কের ধরন",
  "Welcome back!": "আবারও স্বাগতম!",
  "Width": "প্রস্থ",
  "Year": "বছর",
  "Years": "বছরসমূহ",
  "Zoom": "জুম",
  "Create documents, designs, and print media with photo editing, AI photo editing, manual editing, and bulk editing -": "ফটো এডিটিং, এআই ফটো এডিটিং, ম্যানুয়াল এডিটিং ও বাল্ক এডিটিং দিয়ে ডকুমেন্ট, ডিজাইন ও প্রিন্ট মিডিয়া তৈরি করুন -",
  "easy to use.": "ব্যবহার করা সহজ।",
  "Loading PDF…": "PDF লোড হচ্ছে…",
  "Loading devices...": "ডিভাইস লোড হচ্ছে...",
  "Loading preview…": "প্রিভিউ লোড হচ্ছে…",
  "Loading settings...": "সেটিংস লোড হচ্ছে...",
  "Loading tools...": "টুলস লোড হচ্ছে...",
  "Generating...": "তৈরি করা হচ্ছে...",
  "Saving...": "সেভ করা হচ্ছে...",
  "Saving document...": "ডকুমেন্ট সেভ করা হচ্ছে...",
  "Deleting Photo...": "ছবি ডিলিট করা হচ্ছে...",
  "Removing your photo, please wait...": "আপনার ছবি সরানো হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...",
  "Remove your photo, please wait...": "আপনার ছবি সরানো হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...",
  "Background:": "ব্যাকগ্রাউন্ড:",
  "Clothing:": "পোশাক:",
  "Search tools and features...": "টুলস ও ফিচার সার্চ করুন..."
};

const WORDS: Record<string, string> = {
  account: "অ্যাকাউন্ট",
  active: "সক্রিয়",
  add: "যোগ",
  address: "ঠিকানা",
  after: "পরে",
  all: "সব",
  area: "এলাকা",
  apply: "প্রয়োগ",
  application: "আবেদন",
  as: "হিসাবে",
  auto: "অটো",
  back: "পেছনে",
  badge: "ব্যাজ",
  balance: "ব্যালেন্স",
  background: "ব্যাকগ্রাউন্ড",
  birth: "জন্ম",
  browser: "ব্রাউজার",
  button: "বাটন",
  calculate: "হিসাব",
  card: "কার্ড",
  category: "ক্যাটাগরি",
  change: "পরিবর্তন",
  choose: "বেছে নিন",
  clear: "পরিষ্কার",
  click: "ক্লিক",
  close: "বন্ধ",
  clothing: "পোশাক",
  code: "কোড",
  color: "রং",
  column: "কলাম",
  compressed: "কমপ্রেসড",
  compression: "কমপ্রেশন",
  confirm: "নিশ্চিত",
  contact: "যোগাযোগ",
  convert: "কনভার্ট",
  converted: "কনভার্ট করা",
  copy: "কপি",
  credit: "ক্রেডিট",
  current: "বর্তমান",
  customer: "কাস্টমার",
  dashboard: "ড্যাশবোর্ড",
  date: "তারিখ",
  delete: "ডিলিট",
  details: "বিস্তারিত",
  device: "ডিভাইস",
  document: "ডকুমেন্ট",
  download: "ডাউনলোড",
  drag: "টানুন",
  edit: "এডিট",
  education: "শিক্ষা",
  email: "ইমেইল",
  english: "ইংরেজি",
  error: "ত্রুটি",
  export: "এক্সপোর্ট",
  family: "পরিবার",
  file: "ফাইল",
  filter: "ফিল্টার",
  format: "ফরম্যাট",
  free: "ফ্রি",
  front: "সামনে",
  full: "পূর্ণ",
  generate: "তৈরি",
  generated: "তৈরি করা",
  gender: "লিঙ্গ",
  general: "সাধারণ",
  help: "সহায়তা",
  image: "ছবি",
  images: "ছবিসমূহ",
  important: "গুরুত্বপূর্ণ",
  income: "আয়",
  information: "তথ্য",
  invoice: "ইনভয়েস",
  language: "ভাষা",
  left: "বাম",
  loading: "লোড হচ্ছে",
  login: "লগইন",
  logout: "লগআউট",
  manual: "ম্যানুয়াল",
  merge: "মার্জ",
  month: "মাস",
  name: "নাম",
  new: "নতুন",
  next: "পরবর্তী",
  no: "না",
  open: "খুলুন",
  options: "অপশন",
  original: "মূল",
  output: "আউটপুট",
  paid: "পেইড",
  page: "পৃষ্ঠা",
  password: "পাসওয়ার্ড",
  payment: "পেমেন্ট",
  phone: "ফোন",
  photo: "ছবি",
  popular: "জনপ্রিয়",
  preview: "প্রিভিউ",
  print: "প্রিন্ট",
  profile: "প্রোফাইল",
  project: "প্রজেক্ট",
  quality: "কোয়ালিটি",
  question: "প্রশ্ন",
  register: "রেজিস্টার",
  remove: "সরান",
  replace: "বদলে দিন",
  reset: "রিসেট",
  result: "ফলাফল",
  retry: "আবার চেষ্টা করুন",
  right: "ডান",
  rotate: "ঘোরান",
  save: "সেভ",
  saved: "সেভ হয়েছে",
  search: "সার্চ",
  select: "নির্বাচন",
  send: "পাঠান",
  settings: "সেটিংস",
  share: "শেয়ার",
  sign: "সাইন",
  signature: "স্বাক্ষর",
  size: "সাইজ",
  sort: "সাজান",
  split: "বিভক্ত",
  status: "স্ট্যাটাস",
  subscription: "সাবস্ক্রিপশন",
  template: "টেমপ্লেট",
  templates: "টেমপ্লেটসমূহ",
  text: "টেক্সট",
  today: "আজ",
  tool: "টুল",
  tools: "টুলস",
  total: "মোট",
  tutorial: "টিউটোরিয়াল",
  type: "টাইপ",
  undo: "আনডু",
  unlock: "আনলক",
  upload: "আপলোড",
  used: "ব্যবহৃত",
  user: "ইউজার",
  video: "ভিডিও",
  view: "দেখুন",
  voter: "ভোটার",
  waiting: "অপেক্ষা",
  watermark: "ওয়াটারমার্ক",
  year: "বছর",
  zoom: "জুম",
  banglish: "বাংলিশ",
  bangla: "বাংলা",
  pdf: "PDF",
  imageconvert: "ইমেজ কনভার্ট",
  convertor: "কনভার্টার",
  scanner: "স্ক্যানার",
  "or": "অথবা",
  "and": "এবং",
  "to": "করতে",
  "your": "আপনার",
  "this": "এই",
  "with": "সাথে",
  "on": "উপর",
  "from": "থেকে",
  "in": "ভিতরে",
  "of": "এর",
  "by": "দিয়ে",
  "only": "শুধু",
  "more": "আরও",
  "less": "কম",
  "not": "নয়",
  "yes": "হ্যাঁ",
  "requires": "প্রয়োজন",
  "available": "উপলব্ধ",
  "selected": "নির্বাচিত",
  "required": "প্রয়োজনীয়",
  "menu": "মেনু",
  "home": "হোম"
};

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function preserveWhitespace(original: string, translated: string) {
  const start = original.match(/^\s*/)?.[0] ?? "";
  const end = original.match(/\s*$/)?.[0] ?? "";
  return start + translated.trim() + end;
}

function looksLikeCodeOrUrl(text: string) {
  return (
    /^https?:\/\//i.test(text) ||
    /\b(?:className|onClick|useState|useEffect|function|const|return|import|export)\b/.test(text) ||
    /[{}<>;]/.test(text)
  );
}

export function translateToBn(input: string): string {
  if (!input || /[\u0980-\u09FF]/.test(input) || looksLikeCodeOrUrl(input)) return input;
  const key = normalize(input);
  if (!key) return input;
  const exact = PHRASES[key];
  if (exact) return preserveWhitespace(input, exact);

  // Translate short UI labels word-by-word. Long prose intentionally stays as
  // written unless it has an exact phrase entry; this prevents ugly accidental
  // sentence translations and keeps technical/legal copy safe.
  const words = key.split(/(\s+|[.,:;!?()\[\]—–/-]+)/);
  const wordCount = key.split(/\s+/).length;
  if (wordCount <= 6) {
    const translated = words
      .map((part) => {
        const lower = part.toLowerCase();
        return WORDS[lower] ?? part;
      })
      .join("");
    if (translated !== key) return preserveWhitespace(input, translated);
  }
  return input;
}

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (text: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readInitialLanguage(): AppLanguage {
  if (typeof window === "undefined") return "EN";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "BN" || stored === "EN") return stored;
    const match = document.cookie.match(/(?:^|; )sohojkaj_language=([^;]+)/);
    if (match?.[1] === "BN" || match?.[1] === "EN") return match[1] as AppLanguage;
  } catch {
    // Ignore storage/cookie failures.
  }
  return "EN";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("EN");

  useEffect(() => {
    setLanguageState(readInitialLanguage());

    const sync = () => setLanguageState(readInitialLanguage());
    window.addEventListener("sohojkaj:language-change", sync);
    return () => window.removeEventListener("sohojkaj:language-change", sync);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "BN" ? "bn" : "en";
    document.documentElement.setAttribute("translate", "no");
    document.documentElement.classList.add("notranslate");
  }, [language]);

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.cookie = `${COOKIE_KEY}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
      window.dispatchEvent(new Event("sohojkaj:language-change"));
    } catch {
      // Keep UI working even if storage is blocked.
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, t: language === "BN" ? translateToBn : (text) => text }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}

export function T({ children }: { children: React.ReactNode }) {
  const { language } = useI18n();
  if (language !== "BN") return <>{children}</>;
  if (typeof children === "string") return <>{translateToBn(children)}</>;
  return <>{children}</>;
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useI18n();
  return (
    <div className={`inline-flex items-center rounded-md bg-slate-100 p-0.5 text-xs font-semibold ${className}`} translate="no">
      <button
        type="button"
        onClick={() => setLanguage("EN")}
        aria-pressed={language === "EN"}
        className={`cursor-pointer rounded px-3 py-1 transition-all ${
          language === "EN" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("BN")}
        aria-pressed={language === "BN"}
        className={`cursor-pointer rounded px-3 py-1 transition-all ${
          language === "BN" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        বাং
      </button>
    </div>
  );
}
