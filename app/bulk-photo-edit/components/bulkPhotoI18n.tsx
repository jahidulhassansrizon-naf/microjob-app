"use client";

import { useCallback, type ReactNode } from "react";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";

/**
 * Page-local, hydration-safe English ↔ Bangla translations for Bulk Photo Edit.
 *
 * English stays the canonical source string. Bangla is applied only when the
 * shared Sohoj language provider reports `bn`, so the processing/data layer can
 * continue using the original English catalog names and AI prompts unchanged.
 */
const BULK_PHOTO_BN: Record<string, string> = {
  "bulk photo edit": "একসঙ্গে অনেক ছবি সম্পাদনা",
  "select 2 or more photos, choose exact ai operations, and apply the same selected operation set to each photo individually.": "২টি বা তার বেশি ছবি নির্বাচন করুন, প্রয়োজনীয় এআই কাজগুলো বেছে নিন এবং একই নির্বাচিত কাজ প্রতিটি ছবিতে আলাদাভাবে প্রয়োগ করুন।",
  "2 or more photos": "২টি বা তার বেশি ছবি",
  "add photos": "ছবি যোগ করুন",
  "select 2 or more photos": "২টি বা তার বেশি ছবি নির্বাচন করুন",
  "photo queue": "ছবির তালিকা",
  "selected": "নির্বাচিত",
  "clear all": "সব মুছে দিন",
  "no photos added yet": "এখনও কোনো ছবি যোগ করা হয়নি",
  "bulk editing needs at least two photos in the queue.": "একসঙ্গে সম্পাদনা করতে তালিকায় অন্তত ২টি ছবি থাকতে হবে।",
  "ai": "এআই",
  "done": "সম্পন্ন",
  "error": "ত্রুটি",
  "photos are ready for bulk editing.": "টি ছবি একসঙ্গে সম্পাদনার জন্য প্রস্তুত।",
  "ai editing tools": "এআই সম্পাদনার সরঞ্জাম",
  "ai editing tools ": "এআই সম্পাদনার সরঞ্জাম ",
  "ai tools": "এআই টুল",
  "select any tools you want to apply.": "যে টুলগুলো ব্যবহার করতে চান সেগুলো নির্বাচন করুন।",
  "clear": "পরিষ্কার করুন",
  "done · ": "সম্পন্ন · ",
  "selected ai operations": "নির্বাচিত এআই কাজ",
  "open a group, choose exact ai operations, then apply that same operation set to every photo separately.": "একটি বিভাগ খুলে নির্দিষ্ট এআই কাজগুলো বেছে নিন, তারপর একই কাজের সেট প্রতিটি ছবিতে আলাদাভাবে প্রয়োগ করুন।",
  "add at least 2 photos to enable bulk ai enhancement.": "একসঙ্গে এআই সম্পাদনা চালু করতে অন্তত ২টি ছবি যোগ করুন।",
  "choose one or more ai tools above to prepare this bulk edit.": "এই একসঙ্গে সম্পাদনা প্রস্তুত করতে উপরের তালিকা থেকে অন্তত একটি এআই টুল নির্বাচন করুন।",
  "processing photo ": "ছবি প্রক্রিয়াকরণ চলছে ",
  "of ": "এর মধ্যে ",
  ". keep this tab open until the batch finishes.": ". কাজটি শেষ না হওয়া পর্যন্ত এই ট্যাবটি খোলা রাখুন।",
  "enhance": "উন্নত করুন",
  "selected ai tools will apply to every selected photo": "নির্বাচিত এআই টুলগুলো প্রতিটি নির্বাচিত ছবিতে প্রয়োগ হবে",
  "selected ai tools will apply to every selected photo.": "নির্বাচিত এআই টুলগুলো প্রতিটি নির্বাচিত ছবিতে প্রয়োগ হবে।",
  "exact ai tools will apply to every selected photo": "নির্বাচিত সব ছবিতে এই সংখ্যক নির্দিষ্ট এআই টুল প্রয়োগ হবে",
  "exact ai tools will apply to every selected photo.": "নির্বাচিত সব ছবিতে এই নির্দিষ্ট এআই টুলগুলো প্রয়োগ হবে।",
  "bulk ai results": "একসঙ্গে এআই সম্পাদনার ফলাফল",
  "each photo is sent to the existing ai edit pipeline separately, so one photo never becomes a collage or a replacement for another.": "প্রতিটি ছবি বিদ্যমান এআই সম্পাদনা প্রক্রিয়ায় আলাদাভাবে পাঠানো হয়, তাই একটি ছবি কখনও অন্য ছবির সঙ্গে মিশে যায় না বা অন্য ছবির জায়গা নেয় না।",
  "processing": "প্রক্রিয়াকরণ চলছে",
  "failed": "ব্যর্থ",
  "add more": "আরও যোগ করুন",
  "photo ": "ছবি ",
  "ai result": "এআই ফলাফল",
  "waiting": "অপেক্ষমাণ",
  "ai editing...": "এআই সম্পাদনা চলছে…",
  "applying selected operations only": "শুধু নির্বাচিত কাজগুলোই প্রয়োগ করা হচ্ছে",
  "completed": "সম্পন্ন হয়েছে",
  "ai edit failed": "এআই সম্পাদনা ব্যর্থ হয়েছে",
  "ready to download": "ডাউনলোডের জন্য প্রস্তুত",
  "this photo is being edited": "এই ছবিটি সম্পাদনা করা হচ্ছে",
  "retry this photo": "এই ছবিতে আবার চেষ্টা করুন",
  "waiting for the ai queue": "এআই কিউতে অপেক্ষা করছে",
  "download": "ডাউনলোড",
  "retry": "আবার চেষ্টা করুন",
  "subscription required": "সাবস্ক্রিপশন প্রয়োজন",
  "checking access...": "অ্যাক্সেস যাচাই করা হচ্ছে…",
  "locked": "লক করা আছে",
  "close": "বন্ধ করুন",
  "an active subscription is required to use the ai features on this page.": "এই পৃষ্ঠার এআই ফিচারগুলো ব্যবহার করতে একটি সক্রিয় সাবস্ক্রিপশন প্রয়োজন।",
  "once your subscription is active, this lock will disappear automatically and you can use all features on the page.": "আপনার সাবস্ক্রিপশন সক্রিয় হলে এই লকটি স্বয়ংক্রিয়ভাবে সরে যাবে এবং আপনি পৃষ্ঠার সব ফিচার ব্যবহার করতে পারবেন।",
  "view subscription plans": "সাবস্ক্রিপশনের প্ল্যান দেখুন",
  "add 2 or more photos": "২টি বা তার বেশি ছবি যোগ করুন",
  "add your photos, select the exact ai operations you need, and process the batch one photo at a time.": "আপনার ছবি যোগ করুন, প্রয়োজনীয় এআই কাজগুলো নির্বাচন করুন এবং ব্যাচটি একবারে একটি করে ছবি প্রক্রিয়াকরণ করুন।",
  "bulk editing requires at least 2 photos.": "একসঙ্গে সম্পাদনার জন্য অন্তত ২টি ছবি প্রয়োজন।",
  "choose at least one ai tool before enhancing.": "উন্নত সম্পাদনা শুরু করার আগে অন্তত একটি এআই টুল নির্বাচন করুন।",
  "add at least one more photo before bulk enhancement can run.": "একসঙ্গে এআই সম্পাদনা চালানোর আগে আরও অন্তত একটি ছবি যোগ করুন।",
  "starting ai bulk editing for": "এআই-এর মাধ্যমে একসঙ্গে সম্পাদনা শুরু হচ্ছে",
  "photos. each photo is processed separately to preserve its own identity and details.": "টি ছবি। প্রতিটি ছবির পরিচয় ও নিজস্ব বিবরণ ঠিক রাখতে ছবি আলাদাভাবে প্রক্রিয়াকরণ করা হচ্ছে।",
  "completed successfully": "সফলভাবে সম্পন্ন হয়েছে",
  "photos were ai edited.": "টি ছবিতে এআই সম্পাদনা করা হয়েছে।",
  "bulk editing finished": "একসঙ্গে সম্পাদনা শেষ হয়েছে",
  "completed and": "টি সম্পন্ন এবং",
  "failed. you can run the batch again after checking the failed photos.": "টি ব্যর্থ হয়েছে। ব্যর্থ ছবিগুলো দেখে আবার ব্যাচটি চালাতে পারেন।",
  "retrying": "আবার চেষ্টা করা হচ্ছে",
  "with the same selected ai tools...": "একই নির্বাচিত এআই টুলগুলো দিয়ে…",
  "was edited successfully.": "ছবিটি সফলভাবে সম্পাদনা করা হয়েছে।",
  "retry failed for": "আবার চেষ্টা ব্যর্থ হয়েছে:",
  "unknown ai editing error.": "অজানা এআই সম্পাদনা ত্রুটি।",
  "unknown error.": "অজানা ত্রুটি।",
  "ai service returned an unreadable response": "এআই সেবা পাঠযোগ্য নয় এমন উত্তর দিয়েছে",
  "ai editing failed for photo": "এই ছবির এআই সম্পাদনা ব্যর্থ হয়েছে",
  "ai editing failed": "এআই সম্পাদনা ব্যর্থ হয়েছে",
  "non-image files were skipped.": "ছবির ফাইল নয় এমন ফাইলগুলো বাদ দেওয়া হয়েছে।",
  "files over 15 mb were skipped.": "১৫ এমবির বেশি ফাইলগুলো বাদ দেওয়া হয়েছে।",
  "non-image files were skipped and files over 15 mb were skipped.": "ছবির ফাইল নয় এমন ফাইল এবং ১৫ এমবির বেশি ফাইলগুলো বাদ দেওয়া হয়েছে।",
  "non-image files were skipped and files over 15 mb were skipped": "ছবির ফাইল নয় এমন ফাইল এবং ১৫ এমবির বেশি ফাইলগুলো বাদ দেওয়া হয়েছে",
  "only 20 photos can be kept in one batch.": "একটি ব্যাচে সর্বোচ্চ ২০টি ছবি রাখা যাবে।",
  "retry failed": "আবার চেষ্টা ব্যর্থ হয়েছে",
  "photo": "ছবি",
  "photos": "ছবি",
  "processed": "প্রক্রিয়াকৃত",
  "ready": "প্রস্তুত",
  "upload": "আপলোড",
  "remove photo": "ছবি সরান",
  "selected photo": "নির্বাচিত ছবি",
  "ai edited photo": "এআই সম্পাদিত ছবি",
  "bulk preview": "একসঙ্গে সম্পাদনার পূর্বরূপ",
  "keep this tab open until the batch finishes.": "কাজটি শেষ না হওয়া পর্যন্ত এই ট্যাবটি খোলা রাখুন।",

  // Catalog: preset names and descriptions.
  "face enhance": "মুখের উন্নতিসাধন",
  "ai retouching for face, skin and facial details.": "মুখ, ত্বক ও মুখের সূক্ষ্ম বিবরণ উন্নত করার জন্য এআই সম্পাদনা।",
  "photo color": "ছবির রঙ",
  "ai color correction, recovery and color balance.": "এআই-এর মাধ্যমে রঙ সংশোধন, রঙ পুনরুদ্ধার ও রঙের ভারসাম্য ঠিক করা।",
  "photo light": "ছবির আলো",
  "ai exposure, lighting and tonal corrections.": "এআই-এর মাধ্যমে এক্সপোজার, আলো ও টোনের সংশোধন।",
  "dress style": "পোশাকের ধরন",
  "ai clothing edits while preserving the person.": "ব্যক্তির পরিচয় অক্ষুণ্ন রেখে এআই-এর মাধ্যমে পোশাক সম্পাদনা।",
  "photo background": "ছবির ব্যাকগ্রাউন্ড",
  "ai background separation, replacement and cleanup.": "এআই-এর মাধ্যমে ব্যাকগ্রাউন্ড আলাদা করা, পরিবর্তন ও পরিষ্কার করা।",
  "old photo to new": "পুরোনো ছবি থেকে নতুন",
  "restore damaged, faded and low-detail old photos.": "ক্ষতিগ্রস্ত, বিবর্ণ ও কম-বিবরণযুক্ত পুরোনো ছবি পুনরুদ্ধার করুন।",
  "studio image": "স্টুডিও ছবি",
  "ai studio lighting and professional portrait finishing.": "এআই স্টুডিও আলো ও পেশাদার প্রতিকৃতি সম্পাদনা।",

  // Face Enhance tools.
  "skin smoothing": "ত্বক মসৃণ করা",
  "smooth skin while keeping natural texture.": "প্রাকৃতিক ত্বকের গঠন বজায় রেখে ত্বক মসৃণ করুন।",
  "blemish removal": "দাগ দূর করা",
  "clean spots, acne and small distractions.": "দাগ, ব্রণ ও ছোটখাটো ত্রুটি পরিষ্কার করুন।",
  "dark circle fix": "চোখের নিচের কালচে ভাব কমানো",
  "reduce visible under-eye darkness naturally.": "চোখের নিচের দৃশ্যমান কালচে ভাব স্বাভাবিকভাবে কমান।",
  "teeth whitening": "দাঁত সাদা করা",
  "brighten teeth with a natural finish.": "স্বাভাবিক দেখায় এমনভাবে দাঁত উজ্জ্বল করুন।",
  "eye enhance": "চোখের উন্নতিসাধন",
  "improve eye clarity, brightness and detail.": "চোখের স্বচ্ছতা, উজ্জ্বলতা ও সূক্ষ্ম বিবরণ উন্নত করুন।",
  "wrinkle softening": "ভাঁজের রেখা নরম করা",
  "soften prominent wrinkles without flattening the face.": "মুখের স্বাভাবিক গঠন নষ্ট না করে স্পষ্ট ভাঁজের রেখা নরম করুন।",
  "face relighting": "মুখের আলো সামঞ্জস্য করা",
  "add balanced light to the face and restore depth.": "মুখে ভারসাম্যপূর্ণ আলো যোগ করে স্বাভাবিক গভীরতা ফিরিয়ে আনুন।",
  "hair detail enhance": "চুলের সূক্ষ্ম বিবরণ উন্নত করা",
  "recover fine hair detail and reduce dullness.": "চুলের সূক্ষ্ম বিবরণ ফিরিয়ে এনে নিস্তেজভাব কমান।",

  // Photo Color tools.
  "auto color": "স্বয়ংক্রিয় রঙ সংশোধন",
  "automatically correct overall color and cast.": "ছবির সামগ্রিক রঙ ও রঙের আভা স্বয়ংক্রিয়ভাবে সংশোধন করুন।",
  "white balance": "সাদা ভারসাম্য",
  "neutralize unwanted warm or cool color casts.": "অপ্রয়োজনীয় উষ্ণ বা ঠান্ডা রঙের আভা নিরপেক্ষ করুন।",
  "vibrance boost": "রঙের প্রাণবন্ততা বাড়ানো",
  "add life to muted colors while protecting skin tones.": "ত্বকের রঙ ঠিক রেখে ম্লান রঙগুলোকে আরও প্রাণবন্ত করুন।",
  "saturation balance": "রঙের তীব্রতার ভারসাম্য",
  "recover color intensity without harsh oversaturation.": "অতিরিক্ত তীব্রতা না বাড়িয়ে রঙের শক্তি ফিরিয়ে আনুন।",
  "skin tone balance": "ত্বকের রঙের ভারসাম্য",
  "keep facial skin tones consistent and natural.": "মুখের ত্বকের রঙকে সামঞ্জস্যপূর্ণ ও স্বাভাবিক রাখুন।",
  "colorize b&w": "সাদা-কালো ছবিতে রঙ যোগ",
  "add realistic color to black-and-white photos.": "সাদা-কালো ছবিতে বাস্তবসম্মত রঙ যোগ করুন।",
  "color harmony": "রঙের সামঞ্জস্য",
  "balance the main colors for a cleaner visual palette.": "আরও পরিষ্কার দৃশ্যমান রঙের সমন্বয়ের জন্য প্রধান রঙগুলোর ভারসাম্য ঠিক করুন।",

  // Photo Light tools.
  "exposure fix": "এক্সপোজার ঠিক করা",
  "correct underexposure or overexposure.": "কম বা বেশি এক্সপোজার ঠিক করুন।",
  "highlight recovery": "উজ্জ্বল অংশের বিবরণ ফিরিয়ে আনা",
  "recover detail from bright areas.": "অতিরিক্ত উজ্জ্বল অংশ থেকে হারিয়ে যাওয়া বিবরণ ফিরিয়ে আনুন।",
  "shadow recovery": "অন্ধকার অংশের বিবরণ ফিরিয়ে আনা",
  "lift dark areas while preserving contrast.": "কনট্রাস্ট বজায় রেখে অন্ধকার অংশ উজ্জ্বল করুন।",
  "ai relight": "এআই দিয়ে আলো ঠিক করা",
  "rebalance light direction and depth across the photo.": "পুরো ছবিতে আলোর দিক ও গভীরতার ভারসাম্য ঠিক করুন।",
  "contrast balance": "কনট্রাস্টের ভারসাম্য",
  "improve tonal separation without crushing details.": "বিবরণ নষ্ট না করে টোনের পার্থক্য আরও পরিষ্কার করুন।",
  "dehaze": "কুয়াশা কমানো",
  "reduce haze and restore scene clarity.": "কুয়াশা বা ধোঁয়াশা কমিয়ে দৃশ্যের স্বচ্ছতা ফিরিয়ে আনুন।",

  // Dress Style tools.
  "outfit color change": "পোশাকের রঙ পরিবর্তন",
  "change clothing color while preserving the outfit shape.": "পোশাকের আকৃতি ঠিক রেখে তার রঙ পরিবর্তন করুন।",
  "pattern swap": "নকশা পরিবর্তন",
  "replace a clothing pattern or texture.": "পোশাকের নকশা বা গঠন পরিবর্তন করুন।",
  "clothing cleanup": "পোশাক পরিষ্কার করা",
  "remove wrinkles, lint and minor clothing distractions.": "পোশাকের ভাঁজ, লিন্ট ও ছোটখাটো ত্রুটি দূর করুন।",
  "outfit relight": "পোশাকে আলো সামঞ্জস্য করা",
  "match clothing lighting to the scene naturally.": "দৃশ্যের সঙ্গে সামঞ্জস্য রেখে পোশাকের আলো স্বাভাবিকভাবে ঠিক করুন।",

  // Photo Background tools.
  "background remove": "ব্যাকগ্রাউন্ড সরানো",
  "cut out the main subject cleanly.": "মূল বিষয়টিকে পরিষ্কারভাবে আলাদা করুন।",
  "background blur": "ব্যাকগ্রাউন্ড ঝাপসা করা",
  "create a portrait-style depth blur.": "প্রতিকৃতি ছবির মতো গভীরতার ঝাপসা প্রভাব তৈরি করুন।",
  "background replace": "ব্যাকগ্রাউন্ড পরিবর্তন",
  "generate or place a new background behind the subject.": "বিষয়ের পেছনে নতুন ব্যাকগ্রাউন্ড তৈরি বা বসান।",
  "background cleanup": "ব্যাকগ্রাউন্ড পরিষ্কার করা",
  "remove distracting background objects or clutter.": "ব্যাকগ্রাউন্ডের বিরক্তিকর বস্তু বা অগোছালো অংশ সরান।",
  "background relight": "ব্যাকগ্রাউন্ডের আলো সামঞ্জস্য করা",
  "match background light with the subject.": "বিষয়ের সঙ্গে ব্যাকগ্রাউন্ডের আলোর সামঞ্জস্য করুন।",

  // Old photo tools.
  "scratch repair": "আঁচড় মেরামত",
  "repair scratches and visible surface damage.": "আঁচড় ও দৃশ্যমান পৃষ্ঠের ক্ষতি মেরামত করুন।",
  "dust & artifact removal": "ধুলো ও ত্রুটি দূর করা",
  "clean dust, marks and scanning artifacts.": "ধুলো, দাগ ও স্ক্যানিংয়ের ত্রুটি পরিষ্কার করুন।",
  "photo colorize": "ছবিতে রঙ যোগ",
  "colorize faded or black-and-white historical photos.": "বিবর্ণ বা সাদা-কালো পুরোনো ছবিতে রঙ যোগ করুন।",
  "face restoration": "মুখ পুনরুদ্ধার",
  "recover missing or soft facial details.": "হারিয়ে যাওয়া বা ঝাপসা মুখের সূক্ষ্ম বিবরণ ফিরিয়ে আনুন।",
  "detail recovery": "বিবরণ পুনরুদ্ধার",
  "improve sharpness and lost fine detail.": "তীক্ষ্ণতা ও হারিয়ে যাওয়া সূক্ষ্ম বিবরণ উন্নত করুন।",

  // Studio tools.
  "studio light": "স্টুডিও আলো",
  "create a clean professional portrait lighting setup.": "পরিষ্কার ও পেশাদার প্রতিকৃতির মতো আলোর ব্যবস্থা তৈরি করুন।",
  "professional background": "পেশাদার ব্যাকগ্রাউন্ড",
  "place the subject into a clean studio environment.": "বিষয়টিকে একটি পরিষ্কার স্টুডিও পরিবেশে বসান।",
  "portrait relight": "প্রতিকৃতির আলো ঠিক করা",
  "shape facial light for a studio-style result.": "স্টুডিও-ধাঁচের ফলাফলের জন্য মুখের আলোকে সুন্দরভাবে সামঞ্জস্য করুন।",
  "softbox effect": "সফটবক্স প্রভাব",
  "simulate soft, flattering studio light.": "নরম ও আকর্ষণীয় স্টুডিও আলোর প্রভাব তৈরি করুন।",
  "studio retouch": "স্টুডিও রিটাচ",
  "apply a final clean professional portrait finish.": "পরিষ্কার ও পেশাদার প্রতিকৃতির জন্য চূড়ান্ত রিটাচ প্রয়োগ করুন।",
};

function normalizeBulkText(value: string) {
  return value
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function formatPreserved(source: string, translated: string) {
  const lead = source.match(/^\s*/)?.[0] ?? "";
  const trail = source.match(/\s*$/)?.[0] ?? "";
  return `${lead}${translated}${trail}`;
}

function translateBulkPhotoText(value: string, locale: string | undefined): string {
  const source = String(value ?? "");
  if (!locale || !String(locale).toLowerCase().startsWith("bn")) return source;

  const key = normalizeBulkText(source);
  const exact = BULK_PHOTO_BN[key];
  if (exact) return formatPreserved(source, exact);

  let match = key.match(/^(\d+)\s+selected$/i);
  if (match) return `${match[1]}টি নির্বাচিত`;

  match = key.match(/^(\d+)\s+photos?$/i);
  if (match) return `${match[1]}টি ছবি`;

  match = key.match(/^(\d+)\s+ai tools?$/i);
  if (match) return `${match[1]}টি এআই টুল`;

  match = key.match(/^(\d+)\/(\d+)\s+processed$/i);
  if (match) return `${match[1]}/${match[2]} প্রক্রিয়াকৃত`;

  match = key.match(/^(\d+)\s+ready$/i);
  if (match) return `${match[1]}টি প্রস্তুত`;

  match = key.match(/^(\d+)\s+failed$/i);
  if (match) return `${match[1]}টি ব্যর্থ`;

  match = key.match(/^(\d+)\s+processing$/i);
  if (match) return `${match[1]}টি প্রক্রিয়াকরণে`;

  match = key.match(/^photo\s+(\d+)$/i);
  if (match) return `ছবি ${match[1]}`;

  match = key.match(/^selected photo\s+(\d+)$/i);
  if (match) return `নির্বাচিত ছবি ${match[1]}`;

  match = key.match(/^ai edited photo\s+(\d+)$/i);
  if (match) return `এআই সম্পাদিত ছবি ${match[1]}`;

  match = key.match(/^bulk preview\s+(\d+)$/i);
  if (match) return `একসঙ্গে সম্পাদনার পূর্বরূপ ${match[1]}`;

  match = key.match(/^processing (\d+)\/(\d+)$/i);
  if (match) return `প্রক্রিয়াকরণ চলছে ${match[1]}/${match[2]}`;

  match = key.match(/^enhance (\d+) photos?$/i);
  if (match) return `${match[1]}টি ছবিতে উন্নত সম্পাদনা করুন`;

  match = key.match(/^processing photo (\d+) of (\d+)\. keep this tab open until the batch finishes\.$/i);
  if (match) return `ছবি ${match[1]} প্রক্রিয়াকরণ চলছে, মোট ${match[2]}টির মধ্যে। কাজটি শেষ না হওয়া পর্যন্ত এই ট্যাবটি খোলা রাখুন।`;

  match = key.match(/^starting ai bulk editing for (\d+) photos\. each photo is processed separately to preserve its own identity and details\.$/i);
  if (match) return `${match[1]}টি ছবিতে এআই-এর মাধ্যমে একসঙ্গে সম্পাদনা শুরু হচ্ছে। প্রতিটি ছবির পরিচয় ও নিজস্ব বিবরণ ঠিক রাখতে ছবি আলাদাভাবে প্রক্রিয়াকরণ করা হচ্ছে।`;

  match = key.match(/^completed successfully: (\d+)\/(\d+) photos were ai edited\.$/i);
  if (match) return `সফলভাবে সম্পন্ন হয়েছে: ${match[1]}/${match[2]}টি ছবিতে এআই সম্পাদনা করা হয়েছে।`;

  match = key.match(/^bulk editing finished: (\d+) completed and (\d+) failed\. you can run the batch again after checking the failed photos\.$/i);
  if (match) return `একসঙ্গে সম্পাদনা শেষ হয়েছে: ${match[1]}টি সম্পন্ন এবং ${match[2]}টি ব্যর্থ হয়েছে। ব্যর্থ ছবিগুলো দেখে আবার ব্যাচটি চালাতে পারেন।`;

  match = key.match(/^retrying (.+) with the same selected ai tools\.\.\.$/i);
  if (match) return `${match[1]} ছবিতে একই নির্বাচিত এআই টুলগুলো দিয়ে আবার চেষ্টা করা হচ্ছে…`;

  match = key.match(/^(.+) was edited successfully\.$/i);
  if (match) return `${match[1]} ছবিটি সফলভাবে সম্পাদনা করা হয়েছে।`;

  match = key.match(/^retry failed for (.+): (.+)$/i);
  if (match) return `${match[1]} ছবিতে আবার চেষ্টা ব্যর্থ হয়েছে: ${match[2]}`;

  if (key.includes("non-image files were skipped") && key.includes("files over 15 mb were skipped")) {
    return "ছবির ফাইল নয় এমন ফাইল এবং ১৫ এমবির বেশি ফাইলগুলো বাদ দেওয়া হয়েছে।";
  }
  if (key.includes("non-image files were skipped")) {
    return "ছবির ফাইল নয় এমন ফাইলগুলো বাদ দেওয়া হয়েছে।";
  }
  if (key.includes("files over 15 mb were skipped")) {
    return "১৫ এমবির বেশি ফাইলগুলো বাদ দেওয়া হয়েছে।";
  }

  match = key.match(/^only (\d+) photos? can be kept in one batch\.$/i);
  if (match) return `একটি ব্যাচে সর্বোচ্চ ${match[1]}টি ছবি রাখা যাবে।`;

  match = key.match(/^add (\d+) or more photos$/i);
  if (match) return `${match[1]}টি বা তার বেশি ছবি যোগ করুন`;

  match = key.match(/^(\d+) photos? are ready for bulk editing\.$/i);
  if (match) return `${match[1]}টি ছবি একসঙ্গে সম্পাদনার জন্য প্রস্তুত।`;

  match = key.match(/^(.+) ai tools$/i);
  if (match) {
    const presetName = translateBulkPhotoText(match[1], locale);
    return `${presetName} এআই টুল`;
  }

  // Keep unknown backend/API messages untouched rather than inventing a translation.
  return source;
}

export function useBulkPhotoText() {
  const { locale } = useSohozI18n();
  const t = useCallback(
    (value: string) => translateBulkPhotoText(value, locale),
    [locale],
  );
  return { locale, t };
}

export function BulkT({ children }: { children: ReactNode }) {
  const { t } = useBulkPhotoText();
  if (typeof children !== "string") return <>{children}</>;
  return <>{t(children)}</>;
}
