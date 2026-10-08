"use client";

import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import { useCallback, type ReactNode } from "react";

/**
 * Manual Editor page-local English ↔ Bangla translator.
 *
 * The shared i18n provider is used for locale detection and as a fallback, but
 * the tool-specific copy is kept here so this multi-component page never falls
 * back to partial/mixed translations such as "Image ছবি" or "Click করে...".
 */
const MANUAL_EDITOR_BN: Record<string, string> = {
  "manual editor": "ম্যানুয়াল এডিটর",
  "print photo": "ছবি প্রিন্ট করুন",
  "print photo layout": "ছবির প্রিন্ট বিন্যাস",
  "stamp": "স্ট্যাম্প",
  "current photo": "বর্তমান ছবি",
  "close print studio": "প্রিন্ট স্টুডিও বন্ধ করুন",
  "print layout": "প্রিন্ট বিন্যাস",
  "click to preview": "পূর্বরূপ দেখতে ক্লিক করুন",
  "close preview": "পূর্বরূপ বন্ধ করুন",
  "saved generated result": "সংরক্ষিত তৈরি ফলাফল",
  "saved result": "সংরক্ষিত ফলাফল",
  "original photo": "মূল ছবি",
  "edited photo": "সম্পাদিত ছবি",
  "uploaded": "আপলোড করা ছবি",
  "cancel processing": "প্রসেসিং বাতিল করুন",
  "remove photo": "ছবি মুছে দিন",
  "zoom out": "জুম কমান",
  "zoom in": "জুম বাড়ান",
  "compare edited and original": "সম্পাদিত ও মূল ছবির তুলনা",
  "brush": "ব্রাশ",
  "erase": "মুছে ফেলুন",
  "undo": "পূর্বাবস্থায় নিন",
  "redo": "পুনরায় করুন",
  "show / hide selection": "নির্বাচন দেখান / লুকান",
  "browser editing is local; ai processing runs in your browser.": "ছবি সম্পাদনা আপনার ব্রাউজারেই সম্পন্ন হয়; এআই প্রসেসিংও আপনার ব্রাউজারেই চলে।",
  "checking…": "যাচাই করা হচ্ছে…",
  "checking...": "যাচাই করা হচ্ছে…",
  "image adjustments": "ছবির সমন্বয়",
  "download": "ডাউনলোড",
  "print": "প্রিন্ট",
  "saving": "সংরক্ষণ করা হচ্ছে",
  "save": "সংরক্ষণ করুন",
  "ai tools": "এআই টুলস",
  "ai face enhance": "এআই দিয়ে মুখ উন্নত করুন",
  "object adjust": "বস্তু সমন্বয়",
  "transparent": "ব্যাকগ্রাউন্ড স্বচ্ছ করুন",
  "upscale": "ছবির মান ও আকার বাড়ান",
  "upscaling…": "ছবির মান ও আকার বাড়ানো হচ্ছে…",
  "upscaling...": "ছবির মান ও আকার বাড়ানো হচ্ছে…",
  "enhancing…": "উন্নত করা হচ্ছে…",
  "enhancing...": "উন্নত করা হচ্ছে…",
  "cutout editor": "কাটআউট এডিটর",
  "brightness": "উজ্জ্বলতা",
  "contrast": "কনট্রাস্ট",
  "saturation": "রঙের তীব্রতা",
  "hue": "রঙের টোন",
  "clear shadow": "ছায়া পরিষ্কার করুন",
  "brush size": "ব্রাশের আকার",
  "preparing automatic selection…": "স্বয়ংক্রিয় নির্বাচন প্রস্তুত করা হচ্ছে…",
  "live adjustment preview is active. the eye button only shows the soft selection overlay.": "লাইভ সমন্বয় পূর্বরূপ চালু আছে। চোখের বোতামটি শুধু নরম নির্বাচন স্তরটি দেখায়।",
  "cancel": "বাতিল করুন",
  "applying…": "প্রয়োগ করা হচ্ছে…",
  "applying...": "প্রয়োগ করা হচ্ছে…",
  "apply": "প্রয়োগ করুন",
  "background": "ব্যাকগ্রাউন্ড",
  "removing...": "সরানো হচ্ছে…",
  "removing…": "সরানো হচ্ছে…",
  "bg removed": "ব্যাকগ্রাউন্ড সরানো হয়েছে",
  "remove bg": "ব্যাকগ্রাউন্ড সরান",
  "phone upload": "ফোন থেকে আপলোড",
  "scan qr code": "QR কোড স্ক্যান করুন",
  "scan now": "এখনই স্ক্যান করুন",
  "scan": "স্ক্যান",
  "photo already loaded": "ছবি ইতিমধ্যে লোড করা আছে",
  "qr upload session will be connected in the backend step.": "QR আপলোড সেশনটি পরবর্তী ব্যাকএন্ড ধাপে সংযুক্ত করা হবে।",
  "for now this is the production-ready ui shell.": "এই মুহূর্তে এটি ব্যবহারের জন্য প্রস্তুত UI কাঠামো।",
  "photo size": "ছবির আকার",
  "passport": "পাসপোর্ট",
  "dual": "দুটি ছবি",
  "visa": "ভিসা",
  "r sizes": "আর সাইজ",
  "free size": "নিজস্ব আকার",
  "free size (mm)": "নিজস্ব আকার (মিমি)",
  "visa photo size": "ভিসা ছবির আকার",
  "print size": "প্রিন্টের আকার",
  "width": "প্রস্থ",
  "height": "উচ্চতা",
  "current:": "বর্তমান:",
  "apply size": "আকার প্রয়োগ করুন",
  "reset editor": "এডিটর রিসেট করুন",
  "custom color": "নিজস্ব রঙ",
  "choose custom color": "নিজস্ব রঙ নির্বাচন করুন",
  "use custom background color": "নিজস্ব ব্যাকগ্রাউন্ডের রঙ ব্যবহার করুন",
  "remove background": "ব্যাকগ্রাউন্ড সরান",
  "crop &amp; rotate image": "ছবি ক্রপ ও ঘোরান",
  "crop & rotate image": "ছবি ক্রপ ও ঘোরান",
  "independent photo crop • canvas fit after crop": "আলাদাভাবে ছবি ক্রপ করুন • ক্রপের পর ক্যানভাসের সাথে মানিয়ে নেওয়া হবে",
  "preparing image…": "ছবি প্রস্তুত করা হচ্ছে…",
  "rotate": "ঘোরান",
  "mirror": "আয়না করুন",
  "no crop needed": "ক্রপ করার দরকার নেই",
  "cropping…": "ক্রপ করা হচ্ছে…",
  "crop": "ক্রপ",
  "close crop editor": "ক্রপ এডিটর বন্ধ করুন",
  "rotate image": "ছবি ঘোরান",
  "mirror image": "ছবি আয়না করুন",
  "crop preview": "ক্রপের পূর্বরূপ",
  "saved photo preview": "সংরক্ষিত ছবির পূর্বরূপ",
  "preview the saved image before downloading, printing, or deleting it.": "ডাউনলোড, প্রিন্ট বা মুছে ফেলার আগে সংরক্ষিত ছবিটি দেখে নিন।",
  "loading preview…": "পূর্বরূপ লোড হচ্ছে…",
  "loading preview...": "পূর্বরূপ লোড হচ্ছে…",
  "this saved image could not be loaded.": "সংরক্ষিত ছবিটি লোড করা যায়নি।",
  "saved image": "সংরক্ষিত ছবি",
  "downloading…": "ডাউনলোড করা হচ্ছে…",
  "preparing…": "প্রস্তুত করা হচ্ছে…",
  "opening…": "খোলা হচ্ছে…",
  "use in editor": "এডিটরে ব্যবহার করুন",
  "deleting…": "মুছে ফেলা হচ্ছে…",
  "delete": "মুছে দিন",
  "generated photos": "তৈরি করা ছবি",
  "recent output history": "সাম্প্রতিক আউটপুট ইতিহাস",
  "preview": "পূর্বরূপ",
  "empty slot": "খালি স্থান",
  "print this image": "এই ছবি প্রিন্ট করুন",
  "photo layout & print studio": "ছবির বিন্যাস ও প্রিন্ট স্টুডিও",
  "quick add": "দ্রুত যোগ করুন",
  "add multiple copies of the current photo in different sizes.": "বর্তমান ছবির বিভিন্ন আকারের একাধিক কপি যোগ করুন।",
  "units": "একক",
  "photo sizes": "ছবির আকারসমূহ",
  "options": "অপশন",
  "image gap (mm):": "ছবির ফাঁক (মিমি):",
  "page & layout": "পৃষ্ঠা ও বিন্যাস",
  "portrait": "পোর্ট্রেট",
  "landscape": "ল্যান্ডস্কেপ",
  "center": "মাঝখানে",
  "right": "ডানদিকে",
  "auto": "স্বয়ংক্রিয়",
  "total": "মোট",
  "photo": "ছবি",
  "photos": "ছবি",
  "download pdf": "PDF ডাউনলোড করুন",
  "your print page is empty": "আপনার প্রিন্ট পৃষ্ঠা খালি",
  "use quick add to place photos.": "ছবি বসাতে ‘দ্রুত যোগ করুন’ ব্যবহার করুন।",
  "drag": "টেনে সরান",
  "resize": "আকার পরিবর্তন",
  "page full": "পৃষ্ঠা পূর্ণ",
  "rotate selected 90°": "নির্বাচিত ছবিকে ৯০° ঘোরান",
  "remove all": "সব মুছে দিন",
  "remove": "মুছে দিন",
  "one zip": "একটি ZIP",
  "separate files": "আলাদা ফাইল",
  "cutting border": "কাটার সীমানা",
  "image border": "ছবির সীমানা",
  "your files stay in your browser. nothing is uploaded to a server.": "আপনার ফাইল আপনার ব্রাউজারেই থাকে। কোনো ফাইল সার্ভারে আপলোড করা হয় না।",
  "ai image processing is only available in the browser.": "এআই ছবি প্রসেসিং শুধু ব্রাউজারেই ব্যবহার করা যায়।",
  "another image operation is already running.": "আরেকটি ছবি প্রসেসিং কাজ ইতিমধ্যে চলছে।",
  "ai operation cancelled.": "এআই অপারেশন বাতিল করা হয়েছে।",
  "the selected image has invalid dimensions.": "নির্বাচিত ছবির আকার সঠিক নয়।",
  "no face was detected in the photo.": "ছবিতে কোনো মুখ শনাক্ত করা যায়নি।",
  "image segmentation worker returned an invalid result.": "ছবি সেগমেন্টেশন প্রসেস থেকে সঠিক ফল পাওয়া যায়নি।",
  "image segmentation is only available in the browser.": "ছবি সেগমেন্টেশন শুধু ব্রাউজারেই ব্যবহার করা যায়।",
  "the segmentation model returned an unexpected result.": "সেগমেন্টেশন মডেল থেকে অপ্রত্যাশিত ফল পাওয়া গেছে।",
  "could not load this saved photo.": "সংরক্ষিত ছবিটি লোড করা যায়নি।",
  "could not prepare the saved photo.": "সংরক্ষিত ছবিটি প্রস্তুত করা যায়নি।",
  "could not download this photo.": "ছবিটি ডাউনলোড করা যায়নি।",
  "could not save the image details.": "ছবির তথ্য সংরক্ষণ করা যায়নি।",
  "could not save this image. please try again.": "ছবিটি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।",
  "please allow pop-ups to print.": "প্রিন্ট করার জন্য পপ-আপ অনুমতি দিন।",
  "could not delete this photo.": "ছবিটি মুছে ফেলা যায়নি।",
  "how to use": "ব্যবহারবিধি",
  "reset": "রিসেট করুন",
  "face": "মুখ",
  "skin": "ত্বক",
  "hair": "চুল",
  "shadow": "ছায়া",
  "ai scan in progress": "এআই স্ক্যান চলছে",
  "drop your photo here": "আপনার ছবি এখানে ছেড়ে দিন",
  "upload a photo": "একটি ছবি আপলোড করুন",
  "click or drag &amp; drop to upload": "আপলোড করতে ক্লিক করুন অথবা টেনে এনে ছেড়ে দিন",
  "upload photo": "ছবি আপলোড করুন",
  "jpg, png, webp • max 10 mb": "JPG, PNG, WebP • সর্বোচ্চ ১০ MB",
  "empty": "খালি",
  "left": "বাম",
  "slot": "স্লট",
  "active": "সক্রিয়",
  "swap": "অদলবদল",
  "upload slot": "স্লটে আপলোড করুন",
  "edited": "সম্পাদিত",
  "original": "মূল",
  "compare": "তুলনা",
};

const MOJIBAKE: Record<string, string> = {
  "applyingâ¦": "Applying…",
  "croppingâ¦": "Cropping…",
  "downloadingâ¦": "Downloading…",
  "preparingâ¦": "Preparing…",
  "openingâ¦": "Opening…",
  "deletingâ¦": "Deleting…",
};

function normalizeManualEditorText(value: string): string {
  const fixed = MOJIBAKE[value] ?? value;
  return fixed
    .replace(/&amp;/g, "&")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function translateManualEditorText(
  value: string,
  locale: string | undefined,
  baseL: (value: string) => string,
): string {
  const raw = String(value ?? "");
  if (!locale || !String(locale).toLowerCase().startsWith("bn")) return MOJIBAKE[raw] ?? raw;

  const key = normalizeManualEditorText(raw);
  const exact = MANUAL_EDITOR_BN[key];
  if (exact) return exact;

  if (key === "সহজকাজ") return "সহজকাজ";

  const dynamic = [
    [/^select (.+) background$/, (_m: string, name: string) => `${name === "custom" ? "নিজস্ব" : name} ব্যাকগ্রাউন্ড নির্বাচন করুন`],
    [/^add (\d+) (.+) photo(?:s)?$/, (_m: string, count: string, label: string) => `${count}টি ${MANUAL_EDITOR_BN[normalizeManualEditorText(label)] ?? label} ছবি যোগ করুন`],
    [/^open (.+) size menu$/, (_m: string, label: string) => `${MANUAL_EDITOR_BN[normalizeManualEditorText(label)] ?? label} আকারের মেনু খুলুন`],
    [/^(.+) is not connected yet\.$/, (_m: string, label: string) => `${MANUAL_EDITOR_BN[normalizeManualEditorText(label)] ?? label} এখনো সংযুক্ত নয়।`],
    [/^page full - page is full, can't add more images$/i, () => "পৃষ্ঠা পূর্ণ — আর ছবি যোগ করা যাবে না"],
    [/^you can change either file anytime, then export both together or separately\.$/i, () => "যেকোনো সময় যেকোনো ফাইল পরিবর্তন করতে পারেন, তারপর দুটিকে একসাথে বা আলাদাভাবে এক্সপোর্ট করুন।"],
    [/^first-time setup may take a little longer while the ai model loads\.$/i, () => "প্রথমবার সেটআপ হতে একটু বেশি সময় লাগতে পারে, কারণ এআই মডেল লোড হচ্ছে।"],
    [/^removing background\.\.\.$/i, () => "ব্যাকগ্রাউন্ড সরানো হচ্ছে…"],
    [/^removing background…$/i, () => "ব্যাকগ্রাউন্ড সরানো হচ্ছে…"],
    [/^ai processing cancelled\.$/i, () => "এআই প্রসেসিং বাতিল করা হয়েছে।"],
    [/^upload a photo first\.$/i, () => "প্রথমে একটি ছবি আপলোড করুন।"],
    [/^please wait for the selected mask to load\.$/i, () => "নির্বাচিত মাস্ক লোড হওয়া পর্যন্ত অপেক্ষা করুন।"],
    [/^automatic selection failed\.$/i, () => "স্বয়ংক্রিয় নির্বাচন ব্যর্থ হয়েছে।"],
    [/^object adjustment applied successfully\.$/i, () => "বস্তু সমন্বয় সফলভাবে প্রয়োগ হয়েছে।"],
    [/^object adjustment failed\.$/i, () => "বস্তু সমন্বয় ব্যর্থ হয়েছে।"],
    [/^background removed successfully\.$/i, () => "ব্যাকগ্রাউন্ড সফলভাবে সরানো হয়েছে।"],
    [/^background removal failed\.$/i, () => "ব্যাকগ্রাউন্ড সরানো ব্যর্থ হয়েছে।"],
    [/^upscaling image\.\.\.$/i, () => "ছবির মান ও আকার বাড়ানো হচ্ছে…"],
    [/^upscale complete\. the canvas has been updated\.$/i, () => "ছবির মান ও আকার বাড়ানো সম্পন্ন হয়েছে। ক্যানভাস আপডেট করা হয়েছে।"],
    [/^upscaling failed\.$/i, () => "ছবির মান ও আকার বাড়ানো ব্যর্থ হয়েছে।"],
    [/^enhancing face\.\.\.$/i, () => "মুখ উন্নত করা হচ্ছে…"],
    [/^no face was detected in the photo\.$/i, () => "ছবিতে কোনো মুখ শনাক্ত করা যায়নি।"],
    [/^face selection is being prepared…$/i, () => "মুখের নির্বাচন প্রস্তুত করা হচ্ছে…"],
    [/^(.+) selection is being prepared…$/i, (_m: string, label: string) => `${MANUAL_EDITOR_BN[normalizeManualEditorText(label)] ?? label}-এর নির্বাচন প্রস্তুত করা হচ্ছে…`],
    [/^no (face|skin|hair|shadow) area was detected\. use brush to paint the area manually\.$/i, (_m: string, label: string) => `${MANUAL_EDITOR_BN[normalizeManualEditorText(label)] ?? label} অংশ শনাক্ত করা যায়নি। ব্রাশ ব্যবহার করে অংশটি নিজে নির্বাচন করুন।`],
    [/^(face|skin|hair|shadow) selection ready\. use brush or erase to refine it\.$/i, (_m: string, label: string) => `${MANUAL_EDITOR_BN[normalizeManualEditorText(label)] ?? label} নির্বাচন প্রস্তুত। ব্রাশ বা ইরেজ ব্যবহার করে আরও ঠিক করুন।`],
    [/^could not save this image\. please try again\.$/i, () => "ছবিটি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।"],
    [/^could not download this photo\.$/i, () => "ছবিটি ডাউনলোড করা যায়নি।"],
    [/^please allow pop-ups to print\.$/i, () => "প্রিন্ট করার জন্য পপ-আপ অনুমতি দিন।"],
    [/^deleted$/i, () => "মুছে ফেলা হয়েছে"],
    [/^no image is available for printing\.$/i, () => "প্রিন্ট করার জন্য কোনো ছবি পাওয়া যাচ্ছে না।"],
    [/^unable to load the photo for printing\.$/i, () => "প্রিন্ট করার জন্য ছবিটি লোড করা যায়নি।"],
    [/^could not create print canvas\.$/i, () => "প্রিন্ট ক্যানভাস তৈরি করা যায়নি।"],
    [/^could not create pdf\.?$/i, () => "PDF তৈরি করা যায়নি।"],
    [/^could not open print preview\.$/i, () => "প্রিন্টের পূর্বরূপ খোলা যায়নি।"],
    [/^no photo is available for printing\.$/i, () => "প্রিন্ট করার জন্য কোনো ছবি পাওয়া যাচ্ছে না।"],
    [/^the selected image has invalid dimensions\.$/i, () => "নির্বাচিত ছবির আকার সঠিক নয়।"],
    [/^image size must be 10 mb or less\.$/i, () => "ছবির আকার সর্বোচ্চ ১০ MB হতে হবে।"],
    [/^please upload a jpg, jpeg, png or webp image\.$/i, () => "JPG, JPEG, PNG অথবা WebP ছবি আপলোড করুন।"],
    [/^this image could not be read\. please choose another image\.$/i, () => "এই ছবিটি পড়া যায়নি। অন্য একটি ছবি নির্বাচন করুন।"],
    [/^image segmentation is only available in the browser\.$/i, () => "ছবি সেগমেন্টেশন শুধু ব্রাউজারেই ব্যবহার করা যায়।"],
    [/^automatic selection failed\.$/i, () => "স্বয়ংক্রিয় নির্বাচন ব্যর্থ হয়েছে।"],
  ];
  for (const [pattern, renderer] of dynamic) {
    const match = key.match(pattern as RegExp);
    if (match) return (renderer as (...args: string[]) => string)(...match);
  }

  const translated = baseL(raw);
  if (translated && translated !== raw) {
    // Do not allow the shared fallback to produce half-translated UI.
    const hasBangla = /[\u0980-\u09FF]/.test(translated);
    const hasLatin = /[A-Za-z]/.test(translated);
    if (hasBangla && !hasLatin) return translated;
  }
  return MOJIBAKE[raw] ?? raw;
}

export function useManualEditorText() {
  const { locale, L: baseL } = useSohozI18n();
  const t = useCallback(
    (value: string) => translateManualEditorText(value, locale, baseL),
    [locale, baseL],
  );
  return { t, locale };
}

export function ManualT({ children }: { children: ReactNode }) {
  const { t } = useManualEditorText();
  if (typeof children !== "string") return <>{children}</>;
  return <>{t(children)}</>;
}
