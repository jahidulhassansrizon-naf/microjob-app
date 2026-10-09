"use client";

import { useCallback, type ReactNode } from "react";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";

const UI_BN: Record<string, string> = {
  "AI Template": "এআই টেমপ্লেট",
  "Pick a style you like, upload your photo, and we'll generate the same look for you in seconds.": "আপনার পছন্দের একটি স্টাইল বেছে নিয়ে নিজের ছবি আপলোড করুন—কয়েক সেকেন্ডের মধ্যে একই ধরনের ছবি তৈরি হবে।",
  "Newest first": "নতুনগুলো আগে",
  "Popular": "জনপ্রিয়",
  "Sort: ": "সাজানো: ",
  "Sort": "সাজান",
  "ASC": "এ থেকে জেড",
  "DESC": "জেড থেকে এ",
  "My Favorites": "আমার পছন্দেরগুলো",
  "Search by name or category...": "নাম বা বিভাগ দিয়ে খুঁজুন...",
  "Clear": "মুছুন",
  "templates found": "টি টেমপ্লেট পাওয়া গেছে",
  "Filter": "ফিল্টার",
  "Reset": "রিসেট",
  "CATEGORY": "বিভাগ",
  "GENDER": "ধরন",
  "IMAGE COUNT": "ছবির সংখ্যা",
  "ORIENTATION": "দিকনির্দেশ",
  "COLOR": "রং",
  "SORT": "সাজানোর ধরন",
  "All": "সব",
  "Male": "পুরুষ",
  "Female": "নারী",
  "Children": "শিশু",
  "Product": "পণ্য",
  "Portrait": "পোর্ট্রেট",
  "Landscape": "ল্যান্ডস্কেপ",
  "Square": "বর্গাকার",
  "All colors": "সব রং",
  "Red": "লাল",
  "Orange": "কমলা",
  "Yellow": "হলুদ",
  "Green": "সবুজ",
  "Blue": "নীল",
  "Purple": "বেগুনি",
  "Dark": "গাঢ়",
  "1 image": "১টি ছবি",
  "2 images": "২টি ছবি",
  "3+ images": "৩+টি ছবি",
  "Single portrait": "একজনের পোর্ট্রেট",
  "Couple / family": "জুটি / পরিবার",
  "Group / more than 2 people": "দল / ২ জনের বেশি",
  "Oldest first": "পুরোনোগুলো আগে",
  "By name": "নাম অনুযায়ী",
  "80s Style Vintage": "৮০-এর দশকের ভিনটেজ স্টাইল",
  "Motivational": "অনুপ্রেরণামূলক",
  "Creative Shots": "সৃজনশীল ছবি",
  "Victory Day": "বিজয় দিবস",
  "Photo restoration": "ছবি পুনরুদ্ধার",
  "Wedding Photo": "বিয়ের ছবি",
  "Product Advertisement": "পণ্যের বিজ্ঞাপন",
  "Baby and Kids": "শিশু ও বাচ্চাদের ছবি",
  "Couple Portraits": "জুটির পোর্ট্রেট",
  "Father's Day": "বাবা দিবস",
  "Greeting card": "শুভেচ্ছা কার্ড",
  "Birthday wishes": "জন্মদিনের শুভেচ্ছা",
  "Family photo": "পারিবারিক ছবি",
  "No favorite templates yet.": "এখনও কোনো পছন্দের টেমপ্লেট নেই।",
  "No template found for your current filters.": "আপনার বর্তমান ফিল্টারে কোনো টেমপ্লেট পাওয়া যায়নি।",
  "Reset filters": "ফিল্টার রিসেট করুন",
  "View template": "টেমপ্লেট দেখুন",
  "Remove from favorites": "পছন্দের তালিকা থেকে সরান",
  "Add to favorites": "পছন্দের তালিকায় যোগ করুন",
  "Close preview": "পূর্বরূপ বন্ধ করুন",
  "Previous template": "আগের টেমপ্লেট",
  "Next template": "পরের টেমপ্লেট",
  "Generated": "তৈরি হয়েছে",
  "Download": "ডাউনলোড",
  "Download generated image": "তৈরি করা ছবি ডাউনলোড করুন",
  "Generated result for": "তৈরি করা ফলাফল —",
  "Upload your photo and recreate this template while keeping your own identity.": "নিজের পরিচয় অক্ষুণ্ণ রেখে এই টেমপ্লেটের মতো ছবি তৈরি করতে আপনার ছবি আপলোড করুন।",
  "Upload your photo": "আপনার ছবি আপলোড করুন",
  "Photo selected": "ছবি নির্বাচন করা হয়েছে",
  "Add the photo you want to use for this template.": "এই টেমপ্লেটে ব্যবহার করতে চান এমন ছবিটি যোগ করুন।",
  "Change Photo": "ছবি পরিবর্তন করুন",
  "Choose Photo": "ছবি নির্বাচন করুন",
  "Upload from phone": "ফোন থেকে ছবি আপলোড করুন",
  "Hide phone upload": "ফোন আপলোড বন্ধ করুন",
  "Scan the QR code to send a photo for this template.": "এই টেমপ্লেটে ছবি পাঠাতে QR কোড স্ক্যান করুন।",
  "Your uploaded photo": "আপনার আপলোড করা ছবি",
  "JPG, PNG or WEBP • Max 15 MB": "JPG, PNG অথবা WEBP • সর্বোচ্চ ১৫ MB",
  "Generate photo from this template": "এই টেমপ্লেট থেকে ছবি তৈরি করুন",
  "Generate your image": "ছবি তৈরি করুন",
  "Generating...": "তৈরি করা হচ্ছে...",
  "Generate Photo": "ছবি তৈরি করুন",
  "Saved to favorites": "পছন্দের তালিকায় সংরক্ষিত",
  "Use this template style with your own photo.": "নিজের ছবি দিয়ে এই টেমপ্লেটের স্টাইল ব্যবহার করুন।",
  "Adjust your photo": "আপনার ছবি ঠিক করুন",
  "Move and resize the crop area to select the part of the photo you want to use.": "ব্যবহার করতে চান এমন অংশ নির্বাচন করতে ক্রপের এলাকা সরান ও আকার পরিবর্তন করুন।",
  "Cancel crop": "ক্রপ বাতিল করুন",
  "Crop your photo": "আপনার ছবি ক্রপ করুন",
  "Crop your uploaded photo": "আপলোড করা ছবি ক্রপ করুন",
  "Crop": "ক্রপ",
  "Drag inside the box to move it. Drag any corner or edge to resize freely.": "বক্সের ভেতরে টেনে নিয়ে সেটি সরান। যেকোনো কোণা বা কিনারা টেনে ইচ্ছামতো আকার পরিবর্তন করুন।",
  "Free": "মুক্ত আকার",
  "Cancel": "বাতিল করুন",
  "Preparing...": "প্রস্তুত করা হচ্ছে...",
  "Use This Photo": "এই ছবিটি ব্যবহার করুন",
  "Please adjust the crop and try again.": "ক্রপের অংশ ঠিক করে আবার চেষ্টা করুন।",
  "Could not read the photo. Please try again.": "ছবিটি পড়া যায়নি। আবার চেষ্টা করুন।",
  "Could not prepare the cropped image.": "ক্রপ করা ছবি প্রস্তুত করা যায়নি।",
  "Could not determine the crop image size.": "ছবির ক্রপের আকার নির্ধারণ করা যায়নি।",
  "Could not create the cropped image.": "ক্রপ করা ছবি তৈরি করা যায়নি।",
  "Could not crop the photo.": "ছবিটি ক্রপ করা যায়নি।",
  "Please choose an image file.": "দয়া করে একটি ছবি নির্বাচন করুন।",
  "The photo must be 15 MB or smaller.": "ছবির আকার ১৫ MB বা তার কম হতে হবে।",
  "Please upload your photo first.": "দয়া করে প্রথমে আপনার ছবি আপলোড করুন।",
  "Template image generation failed.": "টেমপ্লেটের ছবি তৈরি করা যায়নি।",
  "Generation took too long. Please try again in a moment.": "ছবি তৈরি করতে বেশি সময় লাগছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
  "Subscription required": "সাবস্ক্রিপশন প্রয়োজন",
  "Checking access...": "অ্যাক্সেস যাচাই করা হচ্ছে...",
  "Locked": "লক করা",
  "Close": "বন্ধ করুন",
  "Subscription Required": "সাবস্ক্রিপশন প্রয়োজন",
  "Before using the AI features on this page, you need an active subscription.": "এই পেজের এআই ফিচার ব্যবহার করার আগে একটি সক্রিয় সাবস্ক্রিপশন নিতে হবে।",
  "Once your subscription is active, this lock will disappear automatically and you can use all features on the page.": "সাবস্ক্রিপশন সক্রিয় হলে এই লকটি নিজে থেকেই সরে যাবে এবং পেজের সব ফিচার ব্যবহার করতে পারবেন।",
  "View Subscription Plans": "সাবস্ক্রিপশন প্ল্যান দেখুন",
  "Color: ": "রং: ",
  "Move tool": "টুল সরান",
  "Play tool": "টুল চালান",
};

const TAG_BN: Record<string, string> = {
  "#3d character": "#৩ডি চরিত্র",
  "#3d illusion": "#৩ডি ইলিউশন",
  "#3d typography": "#৩ডি টাইপোগ্রাফি",
  "#3rd birthday": "#৩য় জন্মদিন",
  "#80s": "#৮০-এর দশক",
  "#80s fashion": "#৮০-এর দশকের ফ্যাশন",
  "#90s": "#৯০-এর দশক",
  "#abduction": "#অপহরণ",
  "#abstract art": "#অ্যাবস্ট্রাক্ট আর্ট",
  "#action": "#অ্যাকশন",
  "#action portrait": "#অ্যাকশন পোর্ট্রেট",
  "#adventure": "#অ্যাডভেঞ্চার",
  "#advertisement": "#বিজ্ঞাপন",
  "#advertising": "#বিজ্ঞাপন",
  "#aesthetic": "#নান্দনিক",
  "#age": "#বয়স",
  "#ai video": "#এআই ভিডিও",
  "#airplane": "#বিমান",
  "#airport": "#বিমানবন্দর",
  "#alley": "#গলি",
  "#art": "#শিল্প",
  "#baby": "#শিশু",
  "#bangladesh": "#বাংলাদেশ",
};

const TEMPLATE_PHRASES_BN: Record<string, string> = {
  "Retro Seventies Hero": "সত্তরের দশকের রেট্রো হিরো",
  "Vintage Pub Portrait": "ভিনটেজ পাব পোর্ট্রেট",
  "Retro London Street Hero": "রেট্রো লন্ডন স্ট্রিট হিরো",
  "Monochrome Power Portrait": "সাদাকালো শক্তিশালী পোর্ট্রেট",
  "Elegant Hanfu Study Portrait": "অভিজাত হানফু পোর্ট্রেট",
  "Sunset Seaside Gentleman": "সূর্যাস্তের সমুদ্রতীরের ভদ্রলোক",
  "Neon Edge Portrait": "নিয়ন এজ পোর্ট্রেট",
  "Cozy Cafe Coffee Portrait": "আরামদায়ক ক্যাফে কফি পোর্ট্রেট",
  "Midnight Music Portrait": "মধ্যরাতের সংগীত পোর্ট্রেট",
  "Editorial Side Profile": "এডিটোরিয়াল সাইড প্রোফাইল",
  "Pastel Summer Street Style": "প্যাস্টেল গ্রীষ্মের স্ট্রিট স্টাইল",
};

const TITLE_WORDS_BN: Record<string, string> = {
  retro: "রেট্রো", vintage: "ভিনটেজ", hero: "হিরো", portrait: "পোর্ট্রেট", street: "স্ট্রিট", style: "স্টাইল", photo: "ছবি", photography: "ফটোগ্রাফি", image: "ছবি",
  london: "লন্ডন", seventies: "সত্তরের দশকের", eighties: "আশির দশকের", nineties: "নব্বইয়ের দশকের", monochrome: "সাদাকালো", power: "শক্তিশালী", elegant: "অভিজাত", hanfu: "হানফু", study: "স্টাডি", wildflower: "বুনোফুল", morning: "সকালের", pause: "বিরতি", sunset: "সূর্যাস্ত", seaside: "সমুদ্রতীরের", gentleman: "ভদ্রলোক", neon: "নিয়ন", edge: "এজ", cozy: "আরামদায়ক", cafe: "ক্যাফে", coffee: "কফি", midnight: "মধ্যরাতের", music: "সংগীত", mirror: "আয়না", editorial: "এডিটোরিয়াল", side: "সাইড", profile: "প্রোফাইল", sunny: "রৌদ্রোজ্জ্বল", garden: "বাগান", summer: "গ্রীষ্মের", rainy: "বৃষ্টির", waterfall: "জলপ্রপাত", elegance: "সৌন্দর্য", urban: "শহুরে", streetwear: "স্ট্রিটওয়্যার", luxury: "বিলাসবহুল", birthday: "জন্মদিনের", golden: "সোনালি", eclipse: "গ্রহণ", dramatic: "নাটকীয়", shadow: "ছায়া", bengali: "বাংলা", quote: "উক্তি", saree: "শাড়ি", royal: "রাজকীয়", heritage: "ঐতিহ্যবাহী", couple: "জুটির", romantic: "রোমান্টিক", wedding: "বিয়ের", bride: "কনের", groom: "বরের", family: "পারিবারিক", father: "বাবার", day: "দিনের", product: "পণ্যের", advertisement: "বিজ্ঞাপনের", greeting: "শুভেচ্ছার", card: "কার্ড", wishes: "শুভেচ্ছা", creative: "সৃজনশীল", adventure: "অ্যাডভেঞ্চার", action: "অ্যাকশন", airport: "বিমানবন্দরের", airplane: "বিমানের", alley: "গলির", abstract: "অ্যাবস্ট্রাক্ট", art: "শিল্প", baby: "শিশুর", kids: "শিশুদের", child: "শিশুর", children: "শিশুদের", female: "নারীর", male: "পুরুষের", woman: "নারীর", women: "নারীদের", man: "পুরুষের", men: "পুরুষদের", boy: "ছেলের", girl: "মেয়ের", cinematic: "সিনেমাটিক", light: "আলো", bright: "উজ্জ্বল", soft: "নরম", floral: "ফুলেল", window: "জানালার", romance: "রোমান্স", forest: "বনের", jungle: "জঙ্গলের", ocean: "সমুদ্রের", flower: "ফুলের", market: "বাজারের", denim: "ডেনিম", fashion: "ফ্যাশন", studio: "স্টুডিও", full: "পূর্ণ", close: "ক্লোজ", up: "আপ", color: "রঙের", colorful: "রঙিন", black: "কালো", blue: "নীল", green: "সবুজ", red: "লাল", purple: "বেগুনি", dark: "গাঢ়", smoky: "ধোঁয়াটে", fire: "আগুনের", noir: "নয়ার", balcony: "বারান্দার", highway: "হাইওয়ের", tunnel: "সুড়ঙ্গের", lounge: "লাউঞ্জের", party: "পার্টির", executive: "এক্সিকিউটিভ", fitness: "ফিটনেস", dream: "স্বপ্নের", typography: "টাইপোগ্রাফি", emerald: "পান্না-সবুজ", dusk: "গোধূলির", modern: "আধুনিক", playful: "প্রাণবন্ত", elevator: "লিফটের", sunglasses: "সানগ্লাস", triptych: "ত্রিচিত্র", rebel: "বিদ্রোহী", angel: "এঞ্জেল", smoke: "ধোঁয়া", lonely: "নিঃসঙ্গ", night: "রাতের", bus: "বাসের", pop: "পপ", explorer: "অভিযাত্রীর", flame: "শিখার", tree: "গাছের", park: "পার্কের", kite: "ঘুড়ির", rooftop: "ছাদের", lakeside: "হ্রদের পাড়ের", dreamy: "স্বপ্নময়", reader: "পাঠকের", storybook: "রূপকথার", sequin: "সিকুইন", glamour: "গ্ল্যামার", fisheye: "ফিশআই", counter: "কাউন্টারের", attitude: "অভিব্যক্তি", breezy: "স্নিগ্ধ", eyes: "চোখ", through: "মধ্যে", teal: "টিল", amber: "অ্যাম্বার", little: "ছোট্ট", rider: "আরোহী", contact: "কন্টাক্ট", sheet: "শিট", collage: "কোলাজ", diptych: "ডিপটিক", miniature: "ক্ষুদ্রাকৃতি", artist: "শিল্পী", mindset: "মানসিকতা", silhouette: "ছায়ামূর্তি", electric: "ইলেকট্রিক", ink: "কালির", blueberry: "ব্লুবেরি", watercolor: "জলরঙের", sketch: "স্কেচ", icon: "আইকন", strip: "স্ট্রিপ", loft: "লফট", couch: "সোফার", old: "পুরোনো", new: "নতুন", words: "শব্দ", strength: "শক্তি", silent: "নীরব", rush: "ব্যস্ততা", sweet: "মিষ্টি", enchanted: "মায়াময়", tailor: "দর্জির", road: "রাস্তার", travel: "ভ্রমণের", passport: "পাসপোর্টের"
};

function normalizeAiTemplateText(value: string) {
  return value.replace(/\r\n/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function translateTitle(value: string): string {
  const exact = TEMPLATE_PHRASES_BN[value.trim()];
  if (exact) return exact;
  const words = value.trim().split(/\s+/);
  let changed = false;
  const translatedWords = words.map((word) => {
    const match = word.match(/^([^A-Za-z0-9]*)([A-Za-z0-9]+)([^A-Za-z0-9]*)$/);
    if (!match) return word;
    const mapped = TITLE_WORDS_BN[match[2].toLowerCase()];
    if (!mapped) return word;
    changed = true;
    return `${match[1]}${mapped}${match[3]}`;
  });
  return changed ? translatedWords.join(" ") : value;
}

export function translateAiTemplateText(value: string, locale: string | undefined, baseL: (value: string) => string): string {
  if (!value) return value;
  if (!locale || !String(locale).toLowerCase().startsWith("bn")) return value;

  const normalized = normalizeAiTemplateText(value);
  const exact = UI_BN[value] ?? UI_BN[normalized];
  if (exact) return exact;
  if (TAG_BN[normalized]) return TAG_BN[normalized];

  const imageCount = /^(\d+) image$|^(\d+) images$|^(\d+)\+ images$/i.exec(normalized);
  if (imageCount) {
    const n = imageCount[1] || imageCount[2] || imageCount[3];
    return normalized.includes("+") ? `${n}+টি ছবি` : `${n}টি ছবি`;
  }

  const found = /^(\d+) templates found$/i.exec(normalized);
  if (found) return `${found[1]}টি টেমপ্লেট পাওয়া গেছে`;

  const generatedFor = /^generated result for\s*:?(.*)$/i.exec(value.trim());
  if (generatedFor) {
    const title = generatedFor[1]?.trim() || "";
    return title ? `তৈরি করা ফলাফল — ${translateTitle(title)}` : "তৈরি করা ফলাফল";
  }

  const translated = baseL(value);
  if (translated && translated !== value) {
    const hasBangla = /[\u0980-\u09FF]/.test(translated);
    const hasLatin = /[A-Za-z]/.test(translated);
    if (hasBangla && !hasLatin) return translated;
  }

  if (/^[A-Za-z0-9][A-Za-z0-9 &'’\-–—.,:+/()]+$/.test(value.trim())) {
    const titleLike = translateTitle(value);
    if (titleLike !== value) return titleLike;
  }
  return value;
}

export function useAiTemplateText() {
  const { locale, L: baseL } = useSohozI18n();
  const t = useCallback((value: string) => translateAiTemplateText(value, locale, baseL), [locale, baseL]);
  return { t, locale };
}

export function AiT({ children }: { children: ReactNode }) {
  const { t } = useAiTemplateText();
  if (typeof children !== "string") return <>{children}</>;
  return <>{t(children)}</>;
}
