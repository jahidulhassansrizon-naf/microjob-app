"use client";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Check, ChevronLeft, ChevronRight, Ban, Image as ImageIcon, Palette, Ruler, Shirt, SlidersHorizontal, Sparkles, Hand, Volume2, VolumeX, X, Lightbulb, PlayCircle } from "lucide-react";
import { useAiEditorText } from "./aiEditorI18n";
import PhotoSizeIcon from "./PhotoSizeIcon";
import GuideIcon from "./GuideIcon";
import { CLOTHING_NAMES } from "./clothingStyles";
import { EDITING_GUIDE_CATEGORIES, EDITING_GUIDE_META, AUTO_APPLIED_GUIDES, EDITING_GUIDES, LIPSTICK_COLORS, LIPSTICK_COLOR_PREFIX, isOptionEntry } from "./editingGuides";
import TiePicker, { canHaveTie, getTieFromGuides, withTie } from "./TiePicker";
import SkinTonePicker, { getSkinToneFromGuides, withSkinTone } from "./SkinTonePicker";
import { CLOTHING_COLORS, RawSvgClothingPreview } from "./GenerationSettings";

/**
 * Guided setup shown right after a photo is uploaded + cropped.
 * Walks the user through: photo type -> background -> clothing (+ colour) -> face/photo changes -> confirm.
 * Nothing is applied until the user finishes, so closing the popup never changes their settings.
 */
export interface WizardResult {
  size: string;
  visaSize: string;
  bg: number;
  customBg: string;
  clothing: number;
  clothingColor: string;
  guides: string[];
}

interface WizardPhotoSize {
  id: string;
  label: string;
  tooltip?: string;
  dims?: string;
}
interface WizardBg {
  type?: string;
  value?: string;
}

interface PhotoSetupWizardProps {
  open: boolean;
  image: string | null;
  initial: WizardResult;
  photoSizes: WizardPhotoSize[];
  visaSizesList: { label: string }[];
  backgroundColors: WizardBg[];
  /** generate=true: apply and start generating. generate=false: only apply the settings. */
  onApply: (result: WizardResult, options: { generate: boolean }) => void;
  onClose: (dontShowAgain: boolean) => void;
}

/** Optional tutorial video for the "নিজে বেছে নিতে চাই" path. Leave empty to hide the video button. */
const GUIDE_VIDEO_URL = "";

const BASE_STEPS = [
  { title: "ছবিটা কোন কাজে লাগবে?", hint: "নিচের যেকোনো একটাতে চাপ দিন।", stage: 0 },
  { title: "ছবির পেছনের রং কী চান?", hint: "পছন্দের রঙে একবার চাপ দিন।", stage: 1 },
  { title: "কোন পোশাক পরাতে চান?", hint: "পোশাকে চাপ দিন, তারপর নিচে রং বেছে নিন।", stage: 2 },
];

/** The four big stages the user sees (the many small face questions all live inside the last one). */
const STAGES4 = [
  { label: "ছবির ধরন", Icon: Ruler },
  { label: "ব্যাকগ্রাউন্ড", Icon: Palette },
  { label: "পোশাক", Icon: Shirt },
  { label: "চেহারা", Icon: SlidersHorizontal },
];

/** One plain yes/no style question per face step, so nobody has to read a paragraph. */
const STEP_QUESTIONS: Record<string, string> = {
  "hair-style": "চুল গুছিয়ে নিতে বা নতুন স্টাইল চান?",
  forehead: "কপালে ভাঁজ বা এলোমেলো চুল আছে?",
  eyebrows: "ভ্রু ঠিক করতে চান?",
  "eyes-details": "চোখ বা চশমায় কোনো সমস্যা আছে?",
  ears: "কানের রং মুখের সাথে মেলাতে চান?",
  nose: "নাক তেলতেলে বা লালচে দেখাচ্ছে?",
  cheeks: "গালে লালচে ভাব আছে?",
  "lips-teeth": "ঠোঁট বা দাঁতে কিছু ঠিক করতে চান?",
  "beard-style": "দাড়ি-গোঁফ কামাতে বা ঠিক করতে চান?",
  "portrait-skin": "ত্বক আরও ফর্সা করতে বা গায়ের রং বদলাতে চান?",
  "head-pose": "মাথা বা ছবি কাত হয়ে আছে?",
  "lighting-color": "ছবির আলো বা রঙে সমস্যা আছে?",
  "image-quality": "ছবি ঝাপসা বা দানাদার?",
  "old-photo": "ছবিটা কি পুরোনো বা নষ্ট হয়ে গেছে?",
  "background-composition": "ছবির ফ্রেমিং বা কিনারা ঠিক করতে চান?",
  "id-studio": "এটা কি সরকারি বা আইডির মতো নিয়মের ছবি?",
  "creative-finish": "ছবিতে কোনো বিশেষ লুক চান?",
};
/**
 * One wizard step per editing category, in head-to-chin order.
 * Hair colour and beard colour are NOT separate steps: they appear as a small dropdown right under
 * the hair style / beard style they belong to (see COLOR_PICKERS below).
 */
const COLOR_CATEGORY_IDS = new Set(["hair-color", "beard-color"]);
const GUIDE_STEP_CATEGORIES = EDITING_GUIDE_CATEGORIES.filter(
  (c) => c.id !== "all" && !COLOR_CATEGORY_IDS.has(c.id) && EDITING_GUIDES.some((g) => g.category === c.id),
);
const CAT_ORDER = new Map<string, number>(EDITING_GUIDE_CATEGORIES.map((c, i) => [c.id, i]));
const CAT_OF = new Map<string, string>(EDITING_GUIDES.map((g) => [g.label, g.category]));
const orderOf = (label: string) => CAT_ORDER.get(CAT_OF.get(label) ?? "") ?? 99;

/** Steps whose title says what they really contain (colour lives inside them). */
const STEP_TITLES: Record<string, string> = {
  "hair-style": "চুলের স্টাইল ও রং",
  "beard-style": "দাড়ি ও গোঁফ (স্টাইল ও রং)",
};

/** Clear, plain instructions for every step: when to use it and what happens if you skip. */
const STEP_TEXT: Record<string, { hint: string; when: string }> = {
  "hair-style": {
    hint: "চুল গুছিয়ে নিতে বা নতুন স্টাইল ও রং চাইলে বাছুন (ঐচ্ছিক)",
    when: "চুল এলোমেলো, অগোছালো হলে অথবা নতুন কাটিং বা রং চাইলে বাছুন। কোনো স্টাইল বাছলেই নিচে চুলের রং বেছে নেওয়ার অপশন আসবে, আলাদা ধাপ নেই।",
  },
  forehead: {
    hint: "কপাল ও হেয়ারলাইন পরিষ্কার করতে চাইলে বাছুন (ঐচ্ছিক)",
    when: "কপালে ভাঁজ বা তেলতেলে ভাব থাকলে, অথবা হেয়ারলাইনের পাশে ছোট ছোট এলোমেলো চুল থাকলে বাছুন।",
  },
  eyebrows: {
    hint: "ভ্রুর আকার বা রং ঠিক করতে চাইলে বাছুন (ঐচ্ছিক)",
    when: "ভ্রু পাতলা, অসমান বা বেশি ঘন হলে বাছুন। আকার আর রং একসাথে বাছা যায়।",
  },
  "eyes-details": {
    hint: "চোখ ও চশমার সমস্যা থাকলে বাছুন (ঐচ্ছিক)",
    when: "চোখ নিস্তেজ বা লালচে হলে, চোখের নিচে কালচে ভাব বা ফোলা থাকলে, অথবা চশমায় ঝলক পড়লে বাছুন। চশমা হুবহু যেমন আছে তেমন রাখতে চাইলে “মূল চশমা অপরিবর্তিত” বাছুন।",
  },
  ears: {
    hint: "কানের রং মুখের সাথে মেলাতে চাইলে বাছুন (ঐচ্ছিক)",
    when: "কান লালচে বা মুখের চেয়ে আলাদা রঙের দেখালে, অথবা কানে লোম থাকলে বাছুন।",
  },
  nose: {
    hint: "নাকের তেলতেলে বা লালচে ভাব থাকলে বাছুন (ঐচ্ছিক)",
    when: "নাকে আলো চকচক করলে বা লালচে দেখালে বাছুন।",
  },
  cheeks: {
    hint: "গালের রং ঠিক করতে চাইলে বাছুন (ঐচ্ছিক)",
    when: "গাল লালচে হলে কমাতে, অথবা ফ্যাকাশে লাগলে সামান্য স্বাভাবিক আভা দিতে বাছুন।",
  },
  "lips-teeth": {
    hint: "ঠোঁট ও দাঁতে সামান্য পরিমার্জন চাইলে বাছুন (ঐচ্ছিক)",
    when: "দাঁত হলদেটে লাগলে বা ঠোঁটের রং ফ্যাকাশে লাগলে বাছুন। লিপস্টিক বাছলে নিচে রং বেছে নেবেন। হাসি বা মুখের ভাব যেমন আছে তেমন রাখতে চাইলে “স্বাভাবিক অভিব্যক্তি বজায় রাখুন” বাছুন।",
  },
  "beard-style": {
    hint: "দাড়ি-গোঁফ কামাতে, ছাঁটতে বা রং বদলাতে চাইলে বাছুন (ঐচ্ছিক)",
    when: "দাড়ি-গোঁফ কামাতে বা নতুন ধাঁচ চাইলে বাছুন। দাড়ি যেমন আছে তেমন রেখে শুধু পরিপাটি বা রং বদলাতেও পারেন। দাড়ি না থাকলে এড়িয়ে যান।",
  },
  "portrait-skin": {
    hint: "ত্বক আরও ফর্সা করতে, গায়ের রং বদলাতে বা স্বাভাবিক তিল-দাগ রাখতে চাইলে বাছুন (ঐচ্ছিক)",
    when: "মুখ ক্লিন করা এবং দাগ, তিল, ব্রণ ও তেলতেলে ভাব দূর করা সবসময় নিজে থেকেই হয়, গায়ের রং একই থাকে। তাই এখানে শুধু ত্বক আরও ফর্সা করতে চাইলে, নির্দিষ্ট গায়ের রং চাইলে, অথবা তিল-দাগ রেখে দিতে চাইলে বাছুন।",
  },
  "head-pose": {
    hint: "ছবি বা মাথা কাত হলে সোজা করতে বাছুন (ঐচ্ছিক)",
    when: "ফোন কাত করে ছবি তোলা হলে, অথবা মাথা বা কাঁধ বাঁকা থাকলে বাছুন। ছবি সোজা থাকলে এড়িয়ে যান।",
  },
  "lighting-color": {
    hint: "আলো ও রঙের সমস্যা থাকলে বাছুন (ঐচ্ছিক)",
    when: "ছবি অন্ধকার বা বেশি উজ্জ্বল হলে, মুখে ছায়া পড়লে, অথবা রঙে হলদে বা নীলচে আভা থাকলে বাছুন। আলো ঠিক থাকলে এড়িয়ে যান।",
  },
  "image-quality": {
    hint: "ছবি ঝাপসা বা দানাদার হলে বাছুন (ঐচ্ছিক)",
    when: "ছবি ঝাপসা, দানাদার বা ভাঙা ভাঙা দেখালে বাছুন। একই কাজের একটা বাছলে বাকিগুলো পরের ধাপে আর দেখানো হবে না।",
  },
  "old-photo": {
    hint: "শুধু পুরোনো বা নষ্ট হয়ে যাওয়া ছবির জন্য (ঐচ্ছিক)",
    when: "ছবি পুরোনো, ছেঁড়া, বিবর্ণ বা সাদা-কালো হলেই বাছুন। সাধারণ মোবাইলে তোলা ছবি হলে এড়িয়ে যান।",
  },
  "background-composition": {
    hint: "ছবির ফ্রেমিং ও কিনারা ঠিক করতে চাইলে বাছুন (ঐচ্ছিক)",
    when: "ব্যক্তি মাঝখানে না থাকলে, মাথার ওপরে বেশি বা কম ফাঁকা থাকলে, অথবা চুলের কিনারা এবড়োখেবড়ো হলে বাছুন।",
  },
  "id-studio": {
    hint: "পাসপোর্ট, ভিসা বা আইডির মতো নিয়মের ছবির জন্য (ঐচ্ছিক)",
    when: "সরকারি বা অফিসিয়াল কাজের ছবি হলে বাড়তি পরিমার্জনের জন্য বাছুন। সাধারণ ছবির জন্য এড়িয়ে যেতে পারেন।",
  },
  "creative-finish": {
    hint: "ছবিকে বিশেষ লুক দিতে চাইলে বাছুন (ঐচ্ছিক)",
    when: "সাদা-কালো, ভিনটেজ বা সিনেমাটিক লুক চাইলে বাছুন। পাসপোর্ট, ভিসা বা আইডি ছবিতে এগুলো দেবেন না, এড়িয়ে যান।",
  },
};
const BG_STEP_WHEN_CHOSEN =
  "আপনি ব্যাকগ্রাউন্ড আগেই বেছে নিয়েছেন, তাই ব্যাকগ্রাউন্ড পরিষ্কারের অপশন এখানে দেখানো হচ্ছে না। শুধু ফ্রেমিং আর চুলের কিনারার অপশন আছে।";
const BG_STEP_WHEN_ORIGINAL =
  "আপনি ব্যাকগ্রাউন্ড বদলাননি, তাই পেছনের ময়লা বা অপ্রয়োজনীয় জিনিস পরিষ্কার করতে চাইলে এখান থেকে বাছুন। ফ্রেমিংও ঠিক করতে পারেন।";

/** Colour dropdowns shown under the style they belong to. */
const COLOR_PICKERS: Record<
  string,
  { colorCategory: string; styleLabels: string[]; hideWhen?: string[]; withStyleTitle: string; aloneTitle: string; none: string }
> = {
  "hair-style": {
    colorCategory: "hair-color",
    styleLabels: [
      "Neat Short Haircut", "Side Part Hair", "Slick Back Hair", "Crew Cut", "Buzz Cut", "Textured Quiff", "Taper Fade",
      "Long Straight Hair", "Long Wavy Hair", "Shoulder-Length Bob", "Pixie Cut", "Low Bun", "High Ponytail", "Side Braid",
      "Curtain Bangs", "Curly Hair",
    ],
    withStyleTitle: "এই স্টাইলে চুলের রং কেমন চান?",
    aloneTitle: "স্টাইল না বদলে শুধু চুলের রং বদলাতে চান?",
    none: "রং বদলাতে চাই না (আগের রং থাকবে)",
  },
  "beard-style": {
    colorCategory: "beard-color",
    styleLabels: [
      "Light Stubble", "Short Beard", "Medium Beard", "Full Beard", "Long Beard", "Goatee", "Chin Strap Beard", "Circle Beard",
      "Van Dyke Beard", "Mustache Only",
    ],
    hideWhen: ["Clean Shave"],
    withStyleTitle: "এই দাড়ির রং কেমন চান?",
    aloneTitle: "আগের দাড়ি-গোঁফ রেখে শুধু রং বদলাতে চান?",
    none: "রং বদলাতে চাই না (আগের রং থাকবে)",
  },
};
const COLOR_DOTS: Record<string, string> = {
  "Black Hair Color": "#1A1A1A", "Cover Gray Hair": "#1A1A1A", "Dark Brown Hair Color": "#3B2416", "Cover Gray Hair Brown": "#3B2416",
  "Brown Hair Color": "#6B4226", "Auburn Hair Color": "#8B3A1F", "Dark Blonde Hair Color": "#B08D57", "Silver Gray Hair Color": "#B8BCC2",
  "White Hair Color": "#F5F5F5",
  "Black Beard Color": "#1A1A1A", "Cover Gray Beard": "#1A1A1A", "Dark Brown Beard Color": "#3B2416", "Brown Beard Color": "#6B4226",
  "Silver Gray Beard Color": "#B8BCC2", "White Beard Color": "#F5F5F5",
};

/** Head coverings: hair edits would be ignored anyway, so that step is skipped. */
const HEAD_COVERED_CLOTHING = new Set(["Hijab", "Burqa", "Niqab", "Khimar"]);
const FACE_COVERED_CLOTHING = new Set(["Niqab"]);

/** Options that make no sense once the user already chose a new background / new clothing. */
const BG_CLEANING = ["Clean Background", "Remove Background Distractions", "Smooth Background", "Clean ID Photo Background", "Neutral Background Cleanup"];
const HIDDEN_AFTER_BACKGROUND = [...BG_CLEANING, "Separate Subject from Background"];
const HIDDEN_AFTER_CLOTHING = ["Clean Clothing Edges", "Refine Collar & Tie"];
/** Groups doing (almost) the same job: once one is chosen in an earlier step, later steps do not offer the others. */
const EQUIVALENT_GROUPS: string[][] = [
  BG_CLEANING,
  ["Straighten Head", "Align Eye Line"],
  ["Brighten Face Shadows", "Reduce Harsh Shadows", "Even Face Lighting"],
  ["Brighten Image", "Fix Underexposure", "Improve Low-Light Photo"],
  ["Sharpen Details", "Deblur Image", "Correct Soft Focus", "Improve Print Clarity", "Improve ID Photo Clarity"],
  ["Smooth Skin", "Natural Professional Retouch"],
  ["Improve Contrast", "Improve Black & White Contrast"],
];

/** Labels that must not be offered (and must not stay selected) given the user's earlier choices. */
function getHiddenLabels(d: { bg: number; clothing: number; guides: string[] }): Set<string> {
  // Already applied to every photo by the backend, so never asked.
  const hidden = new Set<string>(AUTO_APPLIED_GUIDES);
  if (d.bg >= 0) HIDDEN_AFTER_BACKGROUND.forEach((l) => hidden.add(l));
  if (d.clothing >= 0) HIDDEN_AFTER_CLOTHING.forEach((l) => hidden.add(l));
  for (const group of EQUIVALENT_GROUPS) {
    const picked = group.filter((l) => d.guides.includes(l));
    if (!picked.length) continue;
    const earliest = Math.min(...picked.map(orderOf));
    for (const l of group) if (orderOf(l) > earliest) hidden.add(l);
  }
  return hidden;
}
/** Drops selected guides that became pointless because of an earlier choice. */
function normalizeDraft(d: WizardResult): WizardResult {
  const hidden = getHiddenLabels(d);
  const guides = d.guides.filter((g) => !hidden.has(g));
  return guides.length === d.guides.length ? d : { ...d, guides };
}


const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const bn = (n: number) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

const TRANSPARENT_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg,#cbd5e1 25%,transparent 25%),linear-gradient(-45deg,#cbd5e1 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#cbd5e1 75%),linear-gradient(-45deg,transparent 75%,#cbd5e1 75%)",
  backgroundSize: "10px 10px",
  backgroundPosition: "0 0,0 5px,5px -5px,-5px 0",
  backgroundColor: "#fff",
};

export default function PhotoSetupWizard({
  open,
  image,
  initial,
  photoSizes,
  visaSizesList,
  backgroundColors,
  onApply,
  onClose,
}: PhotoSetupWizardProps) {
  const { t } = useAiEditorText();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WizardResult>(initial);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [mounted, setMounted] = useState(false);
  // First screen: "fix everything for me" or "let me choose".
  const [intro, setIntro] = useState(true);
  // Quick mode: only size, background and clothing are asked; everything else is automatic.
  const [quick, setQuick] = useState(false);

  useEffect(() => setMounted(true), []);

  // Every time the popup opens, start from the page's current settings.
  useEffect(() => {
    if (open) {
      setStep(0);
      setDraft(initial);
      setIntro(true);
      setQuick(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(dontShowAgain);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, dontShowAgain]);

  const guideStart = BASE_STEPS.length;
  const hiddenLabels = useMemo(() => getHiddenLabels(draft), [draft]);
  const clothingName = draft.clothing >= 0 ? CLOTHING_NAMES[draft.clothing] : "";
  // Only the steps that still make sense for this person (skips steps whose every option is redundant).
  const guideCats = useMemo(
    () =>
      GUIDE_STEP_CATEGORIES.filter((c) => {
        if (c.id === "hair-style" && HEAD_COVERED_CLOTHING.has(clothingName)) return false;
        if (c.id === "beard-style" && FACE_COVERED_CLOTHING.has(clothingName)) return false;
        return EDITING_GUIDES.some((g) => g.category === c.id && !hiddenLabels.has(g.label));
      }),
    [hiddenLabels, clothingName],
  );
  const guideEnd = guideStart + guideCats.length; // index of the confirm step
  // "Choose myself": ONE question (category) per step, the next one comes only after this one is done.
  const currentCat = step >= guideStart && step < guideEnd ? guideCats[step - guideStart] : null;

  // Read-aloud (free, uses the browser's own Bengali voice). Hidden when the device has none.
  const [hasBnVoice, setHasBnVoice] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const check = () => setHasBnVoice(window.speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith("bn")));
    check();
    window.speechSynthesis.addEventListener("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", check);
  }, []);
  // Stop talking whenever the screen changes or the popup closes.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    return () => window.speechSynthesis.cancel();
  }, [step, intro, open]);

  if (!open || !mounted) return null;

  const isDual = draft.size === "Dual";
  const lastStep = quick ? BASE_STEPS.length - 1 : guideEnd;
  const stageList = quick ? STAGES4.slice(0, 3) : STAGES4;
  const stageOf = (i: number) => (i < guideStart ? i : 3);
  const stage = stageOf(step);
  // Bar fills by the 4 big stages; inside the last stage it fills with every small question.
  const progress = quick
    ? ((stage + 0.5) / 3) * 100
    : stage < 3
      ? ((stage + 0.5) / 4) * 100
      : ((3 + (step - guideStart + 1) / (guideCats.length + 1)) / 4) * 100;
  const currentStepInfo = currentCat
    ? {
        title: STEP_QUESTIONS[currentCat.id] ?? STEP_TITLES[currentCat.id] ?? t(currentCat.label),
        hint: "যা লাগবে তাতে চাপ দিন। কিছু না লাগলে নিচে “না, দরকার নেই” চাপুন।",
      }
    : step === lastStep && !quick
      ? { title: "সব ঠিক আছে তো?", hint: "নিচে আপনার পছন্দ দেখে নিন, তারপর “ছবি তৈরি করুন” চাপুন।" }
      : BASE_STEPS[step];
  const selectedInCat = (catId: string) =>
    draft.guides.filter((g) => EDITING_GUIDES.find((e) => e.label === g)?.category === catId).length;

  const update = (patch: Partial<WizardResult>) => setDraft((d) => normalizeDraft({ ...d, ...patch }));
  const toggleGuide = (label: string) =>
    setDraft((d) => {
      if (!d.guides.includes(label)) {
        // Choosing one preset removes the ones that cannot live with it (the newest choice wins).
        const clashes = (other: string) =>
          EDITING_GUIDE_META[label]?.conflictsWith?.includes(other) || EDITING_GUIDE_META[other]?.conflictsWith?.includes(label);
        return normalizeDraft({ ...d, guides: [...d.guides.filter((g) => !clashes(g)), label] });
      }
      const removed = d.guides.filter((g) => g !== label);
      // A lipstick colour means nothing without the lipstick itself.
      return normalizeDraft({ ...d, guides: label === "Lipstick" ? removed.filter((g) => !g.startsWith(LIPSTICK_COLOR_PREFIX)) : removed });
    });
  /** Dropdown choice for a colour category (hair colour / beard colour). Empty = no colour change. */
  const setColorChoice = (colorCategory: string, label: string) =>
    setDraft((d) => {
      const rest = d.guides.filter((g) => CAT_OF.get(g) !== colorCategory);
      return normalizeDraft({ ...d, guides: label ? [...rest, label] : rest });
    });
  const lipstickColorName = draft.guides.find((g) => g.startsWith(LIPSTICK_COLOR_PREFIX))?.slice(LIPSTICK_COLOR_PREFIX.length).trim() ?? "";
  const setLipstickColor = (name: string) =>
    setDraft((d) => ({
      ...d,
      guides: [...d.guides.filter((g) => !g.startsWith(LIPSTICK_COLOR_PREFIX)), ...(name ? [`${LIPSTICK_COLOR_PREFIX} ${name}`] : [])],
    }));
  const skinToneName = getSkinToneFromGuides(draft.guides);
  const guideCount = draft.guides.filter((g) => !isOptionEntry(g)).length;

  const goNext = () => {
    // Dual needs two people, so hand control back to the normal Dual screen.
    if (step === 0 && isDual) {
      onApply(draft, { generate: false });
      return;
    }
    setStep((s) => Math.min(s + 1, lastStep));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const sizeLabel = draft.size
    ? `${t(draft.size)}${draft.size === "Visa" ? ` (${t(draft.visaSize)})` : ""}`
    : "নির্দিষ্ট মাপ নেই";
  const bgOption = backgroundColors[draft.bg];
  const bgLabel =
    draft.bg < 0 || !bgOption
      ? "মূল ব্যাকগ্রাউন্ড থাকবে"
      : bgOption.type === "transparent"
        ? "স্বচ্ছ (Transparent)"
        : bgOption.type === "custom"
          ? `কাস্টম ${draft.customBg.toUpperCase()}`
          : (bgOption.value || "").toUpperCase();
  const clothingColorName = CLOTHING_COLORS.find((c) => c.hex.toUpperCase() === draft.clothingColor.toUpperCase())?.name;
  const clothingLabel =
    draft.clothing < 0
      ? "পোশাক অপরিবর্তিত"
      : `${t(CLOTHING_NAMES[draft.clothing] || "Clothing")}${clothingColorName ? ` · ${t(clothingColorName)}` : ""}`;

  const swatchStyle = (bg: WizardBg): React.CSSProperties =>
    bg.type === "transparent" ? TRANSPARENT_STYLE : { backgroundColor: bg.value };

  const optionBase =
    "relative rounded-xl border-2 transition-all cursor-pointer text-[#3B2F1E] hover:-translate-y-0.5 hover:shadow-md";
  const optionOn = "border-[#DC2626] bg-[#F6D9A8] ring-2 ring-[#DC2626]/30";
  const optionOff = "border-[#E3D6B8] bg-[#FBF6E8] hover:bg-[#EFE3C8]";

  const CheckBadge = () => (
    <span className="absolute top-1.5 right-1.5 bg-[#059669] text-white rounded-full p-1 shadow-md z-10">
      <Check size={15} strokeWidth={3.5} />
    </span>
  );

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photoSizes.map((size) => {
              const on = draft.size === size.id;
              return (
                <button
                  key={size.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ size: size.id })}
                  className={`${optionBase} ${on ? optionOn : optionOff} flex flex-col items-center gap-1.5 px-2 py-4`}
                >
                  {on && <CheckBadge />}
                  <PhotoSizeIcon id={size.id} size={44} />
                  <span className="text-[15px] font-bold leading-tight">{t(size.id)}</span>
                  <span className="text-[11px] text-stone-500 leading-tight text-center">
                    {size.tooltip ? t(size.tooltip) : size.dims}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={draft.size === ""}
              onClick={() => update({ size: "" })}
              className={`${optionBase} ${draft.size === "" ? optionOn : optionOff} flex flex-col items-center justify-center gap-1.5 px-2 py-4`}
            >
              {draft.size === "" && <CheckBadge />}
              <Ban size={34} className="text-stone-400" />
              <span className="text-[15px] font-bold leading-tight">অন্য / মাপ লাগবে না</span>
              <span className="text-[11px] text-stone-500 leading-tight text-center">ছবির নিজস্ব মাপ থাকবে</span>
            </button>
          </div>

          {draft.size === "Visa" && (
            <div className="rounded-xl border border-[#E3D6B8] bg-[#F7EFD9] p-3">
              <p className="text-sm font-semibold mb-2">ভিসা ছবির মাপ বাছাই করুন</p>
              <div className="flex flex-wrap gap-2">
                {visaSizesList.map((v) => {
                  const on = draft.visaSize === v.label;
                  return (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => update({ visaSize: v.label })}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-semibold cursor-pointer transition ${
                        on ? "bg-[#DC2626] border-[#DC2626] text-white" : "bg-[#FBF6E8] border-[#E3D6B8] hover:bg-[#EFE3C8]"
                      }`}
                    >
                      {t(v.label)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isDual && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              ডুয়াল ফরম্যাটে দুইজনের ছবি লাগে। "ঠিক আছে" চাপলে ডুয়াল মোড চালু হবে, তারপর ডান পাশের ব্যক্তির ছবি আপলোড করুন।
            </div>
          )}
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            <button
              type="button"
              aria-pressed={draft.bg < 0}
              onClick={() => update({ bg: -1 })}
              className={`${optionBase} ${draft.bg < 0 ? optionOn : optionOff} flex flex-col items-center justify-center gap-1.5 px-2 py-3`}
            >
              {draft.bg < 0 && <CheckBadge />}
              <span className="h-9 w-9 rounded-full border border-stone-300 bg-gradient-to-br from-stone-100 to-stone-300 flex items-center justify-center">
                <Ban size={16} className="text-stone-500" />
              </span>
              <span className="text-[12px] font-semibold text-center leading-tight">মূল ব্যাকগ্রাউন্ড রাখুন</span>
            </button>
            {backgroundColors.map((bg, idx) => {
              if (bg.type === "custom") return null;
              const on = draft.bg === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ bg: idx })}
                  className={`${optionBase} ${on ? optionOn : optionOff} flex flex-col items-center justify-center gap-1.5 px-2 py-3`}
                >
                  {on && <CheckBadge />}
                  <span className="h-9 w-9 rounded-full border border-stone-300 shadow-inner" style={swatchStyle(bg)} />
                  <span className="text-[12px] font-semibold text-center leading-tight">
                    {bg.type === "transparent" ? "স্বচ্ছ" : (bg.value || "").toUpperCase()}
                  </span>
                </button>
              );
            })}
            {(() => {
              const customIdx = backgroundColors.findIndex((b) => b.type === "custom");
              if (customIdx < 0) return null;
              const on = draft.bg === customIdx;
              return (
                <label
                  className={`${optionBase} ${on ? optionOn : optionOff} flex flex-col items-center justify-center gap-1.5 px-2 py-3`}
                >
                  {on && <CheckBadge />}
                  <input
                    type="color"
                    value={/^#[0-9A-F]{6}$/i.test(draft.customBg) ? draft.customBg : "#8B1E1E"}
                    onChange={(e) => update({ bg: customIdx, customBg: e.target.value.toUpperCase() })}
                    onClick={() => update({ bg: customIdx })}
                    className="h-9 w-9 cursor-pointer rounded-full border border-stone-300 bg-transparent p-0"
                  />
                  <span className="text-[12px] font-semibold text-center leading-tight">নিজের পছন্দের রং</span>
                </label>
              );
            })()}
          </div>
          {draft.size === "Passport" || draft.size === "E-Pass" || draft.size === "Birth" ? (
            <p className="text-xs text-stone-500">টিপ: সরকারি ফরমের জন্য সাধারণত সাদা বা হালকা রঙের ব্যাকগ্রাউন্ড ব্যবহার করা হয়।</p>
          ) : null}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 min-[480px]:grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-2.5">
            <button
              type="button"
              aria-pressed={draft.clothing < 0}
              onClick={() => update({ clothing: -1 })}
              className={`${optionBase} ${draft.clothing < 0 ? optionOn : optionOff} flex flex-col items-center justify-start gap-1 px-1 pt-2 pb-1.5`}
            >
              {draft.clothing < 0 && <CheckBadge />}
              <span className="flex w-full aspect-square items-center justify-center">
                <Ban size={26} className="text-stone-400" />
              </span>
              <span className="text-[11px] font-semibold leading-tight text-center">পোশাক অপরিবর্তিত</span>
            </button>
            {CLOTHING_NAMES.map((name, idx) => {
              const on = draft.clothing === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ clothing: idx })}
                  title={t(name)}
                  className={`${optionBase} ${on ? optionOn : optionOff} flex flex-col items-center justify-start gap-1 px-1 pt-2 pb-1.5 overflow-hidden`}
                >
                  {on && <CheckBadge />}
                  <span className="block w-full aspect-square">
                    <RawSvgClothingPreview
                      index={idx}
                      selected={on}
                      color={on ? draft.clothingColor : undefined}
                      alt={t(name)}
                    />
                  </span>
                  <span className="text-[11px] font-semibold leading-tight text-center line-clamp-2 sm:line-clamp-1 w-full">{t(name)}</span>
                </button>
              );
            })}
          </div>

          {draft.clothing >= 0 && canHaveTie(CLOTHING_NAMES[draft.clothing]) && (
            <TiePicker value={getTieFromGuides(draft.guides)} onChange={(name) => setDraft((d) => ({ ...d, guides: withTie(d.guides, name) }))} />
          )}

          {quick && (
            <p className="rounded-xl border border-[#059669]/40 bg-[#ECFDF5] px-3 py-2 text-[14px] font-semibold text-[#065F46]">
              ✓ পোশাক বাছা হলে নিচের “ছবি তৈরি করুন” চাপুন। মুখ ক্লিন, চোখ, চুল ও আলো নিজে থেকেই ঠিক হয়ে যাবে।
            </p>
          )}

          {draft.clothing >= 0 && (
            <div className="sticky bottom-0 rounded-xl border-2 border-[#DC2626]/60 bg-[#F0DDB5] p-3 shadow-lg">
              <p className="text-sm font-semibold mb-2">
                {t(CLOTHING_NAMES[draft.clothing] || "Clothing")} — কোন রঙের চান?
              </p>
              <div className="flex flex-wrap gap-2.5">
                {CLOTHING_COLORS.map((c) => {
                  const on = draft.clothingColor.toUpperCase() === c.hex.toUpperCase();
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      title={t(c.name)}
                      aria-pressed={on}
                      onClick={() => update({ clothingColor: c.hex })}
                      style={{ backgroundColor: c.hex }}
                      className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full border border-stone-400/40 shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                        on ? "ring-2 ring-[#DC2626] ring-offset-2 ring-offset-[#F0DDB5]" : ""
                      }`}
                    >
                      {on && (
                        <Check
                          size={13}
                          strokeWidth={3}
                          className={c.hex === "#FFFFFF" || c.hex === "#E5E7EB" ? "text-stone-900" : "text-white"}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    const renderCategory = (cat: (typeof guideCats)[number], combined: boolean) => {
      const catGuides = EDITING_GUIDES.filter((g) => g.category === cat.id && !hiddenLabels.has(g.label));
      const whenText =
        cat.id === "background-composition"
          ? draft.bg >= 0
            ? BG_STEP_WHEN_CHOSEN
            : BG_STEP_WHEN_ORIGINAL
          : STEP_TEXT[cat.id]?.when;
      const picker = COLOR_PICKERS[cat.id];
      const pickerStyleChosen = picker ? picker.styleLabels.some((l) => draft.guides.includes(l)) : false;
      const pickerHidden = picker ? (picker.hideWhen ?? []).some((l) => draft.guides.includes(l)) : false;
      const pickerOptions = picker ? EDITING_GUIDES.filter((g) => g.category === picker.colorCategory) : [];
      const pickerValue = picker ? pickerOptions.find((g) => draft.guides.includes(g.label))?.label ?? "" : "";
      const pickerNode =
        picker && !pickerHidden ? (
          <div className="rounded-xl border-2 border-[#DC2626]/50 bg-[#F0DDB5] p-3 shadow">
                <p className="text-sm font-semibold mb-0.5">{pickerStyleChosen ? picker.withStyleTitle : picker.aloneTitle}</p>
                <p className="text-[12px] text-stone-600 mb-2">ঐচ্ছিক। রং না বদলাতে চাইলে প্রথম অপশনটাই রেখে দিন।</p>
                <div className="flex items-center gap-2">
                  <span
                    className="h-7 w-7 shrink-0 rounded-full border border-black/15"
                    style={{ backgroundColor: COLOR_DOTS[pickerValue] ?? "transparent" }}
                    aria-hidden
                  />
                  <select
                    value={pickerValue}
                    onChange={(e) => setColorChoice(picker.colorCategory, e.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2.5 text-sm font-semibold text-[#3B2F1E] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/40"
                  >
                    <option value="">{picker.none}</option>
                    {pickerOptions.map((g) => (
                      <option key={g.label} value={g.label}>
                        {t(g.label)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
        ) : null;
      // The colour dropdown opens right under the style the user just picked (end of that row on wide screens).
      const selectedStyleIndex = picker ? catGuides.findIndex((g) => picker.styleLabels.includes(g.label) && draft.guides.includes(g.label)) : -1;
      const pairEndIndex = selectedStyleIndex >= 0 ? Math.min(selectedStyleIndex - (selectedStyleIndex % 2) + 1, catGuides.length - 1) : -1;
      return (
        <div className={combined ? "break-inside-avoid mb-3 space-y-2 rounded-2xl border-2 border-[#E3D6B8] bg-white/60 p-3" : "space-y-3"}>
          {combined && (
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-extrabold leading-snug text-[#3B2F1E]">{STEP_TITLES[cat.id] ?? t(cat.label)}</h3>
              {selectedInCat(cat.id) > 0 && (
                <span className="shrink-0 rounded-full bg-[#059669] px-2 py-0.5 text-[12px] font-bold text-white">✓ {bn(selectedInCat(cat.id))}</span>
              )}
            </div>
          )}
          {!combined && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-stone-500">
              প্রশ্ন {bn(step - guideStart + 1)} / {bn(guideCats.length)}
            </span>
            <span
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold whitespace-nowrap ${
                guideCount > 0 ? "bg-[#059669] text-white" : "bg-[#E3D6B8] text-stone-600"
              }`}
            >
              {guideCount > 0 ? `✓ ${bn(guideCount)}টি বাছাই হয়েছে` : "এখনও কিছু বাছা হয়নি"}
            </span>
          </div>
          )}
          {!combined && whenText && (
            <details className="rounded-xl border border-[#E3D6B8] bg-white/70 px-3 py-2 text-[14px] leading-snug text-[#5A4A32]">
              <summary className="cursor-pointer font-bold text-[#3B2F1E]">কখন এটা লাগে? (বিস্তারিত দেখুন)</summary>
              <p className="mt-1.5">{whenText}</p>
            </details>
          )}
          <div className={combined ? "grid grid-cols-1 gap-1.5" : "grid grid-cols-1 sm:grid-cols-2 gap-2"}>
            {catGuides.map((g, i) => {
              const on = draft.guides.includes(g.label);
              return (
                <React.Fragment key={g.label}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleGuide(g.label)}
                    className={`${optionBase} ${on ? optionOn : optionOff} flex items-center ${combined ? "gap-2 px-2.5 py-2" : "gap-3 px-3 py-3 sm:px-3.5 sm:py-4"} text-left`}
                  >
                    {on && <CheckBadge />}
                    <span className="shrink-0 text-[#DC2626]">
                      <GuideIcon label={g.label} size={combined ? 30 : 38} />
                    </span>
                    <span className={`${combined ? "text-[14.5px]" : "text-[15px] sm:text-[16px]"} font-bold leading-tight pr-7`}>{t(g.label)}</span>
                  </button>
                  {pickerNode && i === selectedStyleIndex && <div className="col-span-full sm:hidden">{pickerNode}</div>}
                  {pickerNode && i === pairEndIndex && <div className="col-span-full hidden sm:block">{pickerNode}</div>}
                </React.Fragment>
              );
            })}
            {pickerNode && selectedStyleIndex < 0 && <div className="col-span-full">{pickerNode}</div>}
          </div>

          {!combined && <p className="text-[13px] text-stone-500">ভুল চাপলে আবার চাপুন, বাছাই বাতিল হয়ে যাবে।</p>}

          {cat.id === "portrait-skin" && (
            <SkinTonePicker
              compact={combined}
              value={skinToneName}
              onChange={(name) => setDraft((d) => ({ ...d, guides: withSkinTone(d.guides, name) }))}
            />
          )}

          {cat.id === "lips-teeth" && draft.guides.includes("Lipstick") && (
            <div className="rounded-xl border-2 border-[#DC2626]/60 bg-[#F0DDB5] p-3 shadow">
              <p className="text-sm font-semibold mb-2">লিপস্টিক — কোন রঙের চান?</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={!lipstickColorName}
                  onClick={() => setLipstickColor("")}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                    !lipstickColorName ? "bg-[#DC2626] border-[#DC2626] text-white" : "bg-[#FBF6E8] border-[#E3D6B8] hover:bg-[#EFE3C8]"
                  }`}
                >
                  ত্বকের সাথে মানানসই (অটো)
                </button>
                {LIPSTICK_COLORS.map((c) => {
                  const on = lipstickColorName === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setLipstickColor(c.name)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                        on ? "bg-[#F6D9A8] border-[#DC2626] ring-2 ring-[#DC2626]/30" : "bg-[#FBF6E8] border-[#E3D6B8] hover:bg-[#EFE3C8]"
                      }`}
                    >
                      <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                      {c.bn}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    };

    if (currentCat) return renderCategory(currentCat, false);

    // Summary
    const rows: { label: string; value: string; goTo: number }[] = [
      { label: "ছবির ধরন", value: sizeLabel, goTo: 0 },
      { label: "ব্যাকগ্রাউন্ড", value: bgLabel, goTo: 1 },
      { label: "পোশাক", value: clothingLabel, goTo: 2 },
      {
        label: "চেহারার পরিবর্তন",
        value: guideCount ? `${bn(guideCount)}টি পরিবর্তন` : "কোনো অতিরিক্ত পরিবর্তন নেই",
        goTo: guideStart,
      },
    ];
    return (
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border border-[#E3D6B8] bg-white/70 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-stone-500">{row.label}</p>
              <p className="text-[15px] font-bold text-[#3B2F1E] truncate">{row.value}</p>
            </div>
            <button
              type="button"
              onClick={() => setStep(row.goTo)}
              className="shrink-0 rounded-lg bg-[#F3E9D2] px-3 py-1.5 text-xs font-semibold text-[#5A4A32] hover:bg-[#E3D6B8] cursor-pointer"
            >
              বদলান
            </button>
          </div>
        ))}
        {guideCount > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {draft.guides.filter((g) => !isOptionEntry(g)).map((g) => (
              <span key={g} className="inline-flex items-center gap-1 rounded-full bg-[#F6D9A8] px-2.5 py-1 text-xs font-semibold text-[#3B2F1E]">
                {t(g.startsWith("Custom Instruction:") ? "Custom added" : g)}
                {g === "Lipstick" && lipstickColorName ? ` · ${LIPSTICK_COLORS.find((c) => c.name === lipstickColorName)?.bn ?? lipstickColorName}` : ""}
                <button type="button" onClick={() => toggleGuide(g)} className="cursor-pointer hover:text-[#DC2626]" aria-label="সরান">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const speakScreen = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    let text: string;
    if (intro) {
      text = "কীভাবে শুরু করবেন? ছবি প্রায় ঠিকঠাক থাকলে এবং দ্রুত কাজ সারতে চাইলে এক নম্বর অপশন, সব ঠিক করে দিন, ব্যবহার করুন। আর চুল, ভ্রু, ঠোঁট, দাড়ি, ত্বক সহ সবকিছু নিজের ইচ্ছামতো ঠিক করতে চাইলে দুই নম্বর অপশন, আমি নিজে বেছে নিতে চাই, ব্যবহার করুন। সেখানে বাড়তি গাইডিংও আছে।";
    } else {
      text = `${currentStepInfo.title}। ${currentStepInfo.hint}`;
      if (currentCat) {
        const names = EDITING_GUIDES.filter((g) => g.category === currentCat.id && !hiddenLabels.has(g.label)).slice(0, 8).map((g) => t(g.label)).join("। ");
        if (names) text += ` অপশনগুলো হলো: ${names}।`;
      }
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "bn-BD";
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("bn"));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  };

  const renderIntroBanner = () => (
    <div className="mt-3 mb-3 rounded-2xl border-2 border-[#F59E0B] bg-[#FFF7E0] p-3 sm:p-4 shadow-sm">
      <p className="mb-2 flex items-center gap-2 text-[16px] sm:text-[19px] font-extrabold leading-snug text-[#92400E]">
        <Lightbulb size={22} className="shrink-0" /> কোনটা বেছে নেবেন? এক নজরে বুঝে নিন
      </p>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div className="flex items-start gap-2.5 rounded-xl bg-[#ECFDF5] border border-[#059669]/40 px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#059669] text-[17px] font-extrabold text-white">১</span>
          <p className="text-[14px] sm:text-[16px] leading-snug text-[#3B2F1E]">
            <b className="text-[#065F46]">ছবি প্রায় ঠিকঠাক আছে, শর্টকাটে কাজ সারতে চান?</b> তাহলে <b>১ নম্বর “সব ঠিক করে দিন”</b> ব্যবহার করুন। মাত্র ৩ ধাপ।
          </p>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/40 px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DC2626] text-[17px] font-extrabold text-white">২</span>
          <div className="min-w-0 text-[14px] sm:text-[16px] leading-snug text-[#3B2F1E]">
            <p>
              <b className="text-[#B91C1C]">নিজের ইচ্ছামতো সবকিছু ঠিক করতে চান?</b> তাহলে <b>২ নম্বর “আমি নিজে বেছে নিতে চাই”</b> ব্যবহার করুন। চুল, ভ্রু, ঠোঁট, দাড়ি, ত্বক, চেহারা সহ সবকিছু নিজে ঠিক করা যাবে, সাথে বাড়তি গাইডিংও আছে।
            </p>
            {GUIDE_VIDEO_URL && (
              <a
                href={GUIDE_VIDEO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#DC2626] px-3 py-1.5 text-[14px] font-extrabold text-white hover:bg-[#B91C1C]"
              >
                <PlayCircle size={18} /> ভিডিওতে দেখে নিন
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntro = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => {
          setQuick(true);
          setIntro(false);
        }}
        className="relative flex flex-col items-center gap-3 rounded-2xl border-4 border-[#059669] bg-[#ECFDF5] p-4 sm:p-6 text-center shadow-md transition hover:-translate-y-0.5 hover:shadow-xl cursor-pointer"
      >
        <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#059669] text-[17px] font-extrabold text-white">১</span>
        <span className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#059669] text-white">
          <Sparkles size={30} />
        </span>
        <span className="text-[19px] sm:text-[22px] font-extrabold leading-tight text-[#065F46]">সব ঠিক করে দিন</span>
        <span className="text-[15px] leading-snug text-[#3B2F1E]">
          শুধু ছবির মাপ, ব্যাকগ্রাউন্ড আর পোশাক বেছে নিন। বাকি সব (মুখ ক্লিন, চোখ, চুল, আলো) নিজে থেকেই ঠিক হয়ে যাবে। গায়ের রং একই থাকবে।
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1 text-[13px] font-semibold text-[#065F46]">মাত্র ৩টা ধাপ</span>
        <span className="rounded-xl bg-[#059669] px-6 py-2.5 text-base font-extrabold text-white">এটাই করুন</span>
      </button>
      <button
        type="button"
        onClick={() => setIntro(false)}
        className="relative flex flex-col items-center gap-3 rounded-2xl border-4 border-[#E3D6B8] bg-[#FBF6E8] p-4 sm:p-6 text-center shadow-md transition hover:-translate-y-0.5 hover:border-[#DC2626] hover:shadow-xl cursor-pointer"
      >
        <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#DC2626] text-[17px] font-extrabold text-white">২</span>
        <span className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#DC2626] text-white">
          <Hand size={30} />
        </span>
        <span className="text-[19px] sm:text-[22px] font-extrabold leading-tight text-[#3B2F1E]">আমি নিজে বেছে নিতে চাই</span>
        <span className="text-[15px] leading-snug text-[#3B2F1E]">
          মাপ, ব্যাকগ্রাউন্ড, পোশাক আর চুল, দাড়ি, ত্বকের মতো বাড়তি পরিবর্তনও আমি নিজে ঠিক করব। ৪টা ধাপ।
        </span>
        <span className="rounded-xl bg-[#DC2626] px-6 py-2.5 text-base font-extrabold text-white">ধাপে ধাপে করব</span>
      </button>
    </div>
  );

  const modal = (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="ছবি সেটআপ গাইড"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose(dontShowAgain);
      }}
    >
      <div className={`flex h-[100dvh] w-full max-w-[1000px] flex-col overflow-hidden rounded-t-2xl bg-[#FBF6E8] shadow-2xl ai-editor-font select-none sm:h-auto sm:max-h-[96dvh] sm:rounded-2xl`}>
        {/* Header + progress */}
        <div className="shrink-0 border-b border-[#E3D6B8] px-3 pt-2 sm:px-6 sm:pt-3">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 sm:gap-y-2">
            <div className="order-2 flex w-full min-w-0 items-start gap-3 sm:order-none sm:w-auto sm:flex-1">
              <span className="mt-0.5 hidden rounded-xl bg-[#D42020] p-2 text-white sm:block">
                <Camera size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-extrabold text-[#3B2F1E] leading-snug">
                  {intro ? "কীভাবে শুরু করবেন?" : currentStepInfo.title}
                </h2>
                <p className="text-[13px] sm:text-[15px] text-stone-600 leading-snug">
                  {intro ? "আপনার সুবিধামতো একটা বেছে নিন।" : currentStepInfo.hint}
                </p>
              </div>
            </div>
            <div className="order-1 flex w-full items-center justify-end gap-2 sm:order-none sm:w-auto sm:shrink-0">
              {hasBnVoice && (
                <button
                  type="button"
                  onClick={speakScreen}
                  aria-label={speaking ? "পড়া বন্ধ করুন" : "বাংলায় পড়ে শোনান"}
                  className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[13px] sm:text-sm font-extrabold cursor-pointer transition ${
                    speaking ? "border-[#DC2626] bg-[#DC2626] text-white" : "border-[#059669] bg-[#ECFDF5] text-[#065F46] hover:bg-[#D1FAE5]"
                  }`}
                >
                  {speaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  {speaking ? "থামান" : "শুনুন"}
                </button>
              )}
              {!intro && (
                <span className="order-first mr-auto rounded-full bg-[#DC2626] px-3 py-1.5 text-[13px] sm:order-none sm:mr-0 sm:text-sm font-extrabold text-white tabular-nums whitespace-nowrap">
                  ধাপ {bn(stage + 1)} / {bn(stageList.length)}
                </span>
              )}
              <button
                type="button"
                onClick={() => onClose(dontShowAgain)}
                className="rounded-lg p-2 text-stone-500 hover:bg-[#EFE3C8] cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          {!intro && (
            <>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E3D6B8] sm:mt-3 sm:h-2.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#059669] to-[#34D399] transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-start pb-2 pt-2 sm:pb-3 sm:pt-3">
                {stageList.map(({ label, Icon }, i) => {
                  const done = i < stage;
                  const active = i === stage;
                  return (
                    <React.Fragment key={label}>
                      {i > 0 && <span className={`mt-[15px] sm:mt-[19px] h-1 flex-1 rounded-full ${i <= stage ? "bg-[#059669]" : "bg-[#E3D6B8]"}`} />}
                      <button
                        type="button"
                        disabled={!done}
                        onClick={() => setStep(i < 3 ? i : guideStart)}
                        className={`flex w-[60px] min-[420px]:w-[76px] sm:w-[96px] shrink-0 flex-col items-center gap-0.5 sm:gap-1 ${done ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <span
                          className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-base font-extrabold shadow-sm transition ${
                            done
                              ? "bg-[#059669] text-white"
                              : active
                                ? "bg-[#DC2626] text-white ring-4 ring-[#DC2626]/25"
                                : "bg-[#E3D6B8] text-stone-500"
                          }`}
                        >
                          {done ? <Check size={20} strokeWidth={3.5} /> : <Icon size={18} />}
                        </span>
                        <span
                          className={`text-center text-[12px] sm:text-[14px] font-bold leading-tight ${
                            active ? "text-[#DC2626]" : done ? "text-[#059669]" : "text-stone-400"
                          }`}
                        >
                          {label}
                        </span>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          )}
          {intro && <div className="pb-2 sm:pb-3" />}
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Photo preview: always visible so the user sees which photo they are editing */}
          <div className={`${intro ? "hidden md:flex" : "flex"} shrink-0 border-b md:border-b-0 md:border-r border-[#E3D6B8] bg-[#F3E9D2] px-3 py-2 md:w-[250px] md:p-4 md:flex-col items-center gap-2.5 md:gap-3`}>
            <div className="h-14 w-11 md:h-auto md:w-full md:aspect-[45/55] shrink-0 overflow-hidden rounded-lg md:rounded-xl border-2 border-white shadow-md bg-white">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="আপনার ছবি" draggable={false} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 md:flex-none md:w-full">
              <p className="mb-1.5 hidden text-[11px] font-bold uppercase tracking-wide text-stone-500 md:block">আপনার নির্বাচন</p>
              {/* Phones: one swipeable row of chips. Desktop: vertical list. */}
              <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 md:block md:space-y-1.5 md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                  { Icon: Ruler, label: "ছবির ধরন", value: sizeLabel, set: draft.size !== "", swatch: null as React.ReactNode },
                  {
                    Icon: Palette,
                    label: "ব্যাকগ্রাউন্ড",
                    value: bgLabel,
                    set: draft.bg >= 0 && !!bgOption,
                    swatch:
                      draft.bg >= 0 && bgOption ? (
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15"
                          style={
                            bgOption.type === "transparent"
                              ? TRANSPARENT_STYLE
                              : { backgroundColor: bgOption.type === "custom" ? draft.customBg : bgOption.value }
                          }
                        />
                      ) : null,
                  },
                  {
                    Icon: Shirt,
                    label: "পোশাক",
                    value: clothingLabel,
                    set: draft.clothing >= 0,
                    swatch:
                      draft.clothing >= 0 ? (
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15" style={{ backgroundColor: draft.clothingColor }} />
                      ) : null,
                  },
                  {
                    Icon: SlidersHorizontal,
                    label: "চেহারার পরিবর্তন",
                    value: guideCount ? `${bn(guideCount)}টি পরিবর্তন` : "কোনো পরিবর্তন নেই",
                    set: guideCount > 0,
                    swatch: null as React.ReactNode,
                  },
                ].map(({ Icon, label, value, set, swatch }) => (
                  <div key={label} className="flex w-[148px] shrink-0 items-center gap-2 rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2 py-1 md:w-auto md:shrink md:gap-2.5 md:px-2.5 md:py-1.5">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${set ? "bg-[#DC2626] text-white" : "bg-[#E3D6B8] text-stone-500"}`}>
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10.5px] leading-tight text-stone-500">{label}</p>
                      <p className={`flex items-center gap-1.5 text-[12.5px] font-semibold leading-tight ${set ? "text-[#3B2F1E]" : "text-stone-400"}`}>
                        {swatch}
                        <span className="truncate">{value}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5">{intro ? (<>{renderIntroBanner()}{renderIntro()}</>) : renderStep()}</div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex flex-col gap-2 border-t border-[#E3D6B8] bg-[#F7EFD9] px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3">
          <label className="flex items-center gap-2 text-[11px] leading-tight sm:text-xs text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 accent-[#DC2626]"
            />
            এই গাইড আর দেখাবেন না (আমি নিজে সিলেক্ট করব)
          </label>

          <div className={`flex flex-wrap items-center justify-end gap-2 ${intro ? "hidden" : ""}`}>
            {step === 0 && (
              <button
                type="button"
                onClick={() => {
                  setIntro(true);
                  setQuick(false);
                }}
                className="flex shrink-0 items-center gap-1 rounded-xl bg-[#F3E9D2] px-3 py-3 text-[14px] sm:px-4 sm:text-[15px] font-bold text-[#5A4A32] hover:bg-[#E3D6B8] cursor-pointer"
              >
                <ChevronLeft size={16} /> শুরুতে ফিরুন
              </button>
            )}
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex shrink-0 items-center gap-1 rounded-xl bg-[#F3E9D2] px-3 py-3 text-[14px] sm:px-4 sm:text-[15px] font-bold text-[#5A4A32] hover:bg-[#E3D6B8] cursor-pointer"
              >
                <ChevronLeft size={16} /> পেছনে
              </button>
            )}

            {step < lastStep ? (
              <>
                {currentCat && (
                  <button
                    type="button"
                    onClick={() => onApply(draft, { generate: true })}
                    className="rounded-lg px-3 py-2 text-center text-[13px] sm:py-2.5 sm:text-sm font-semibold text-stone-500 underline underline-offset-2 hover:text-[#DC2626] cursor-pointer max-sm:order-first max-sm:w-full"
                  >
                    বাকি সব বাদ দিয়ে এখনই ছবি তৈরি করুন
                  </button>
                )}
                {(step === 1 || step === 2) && !isDual && (
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 1) update({ bg: -1 });
                      if (step === 2) update({ clothing: -1 });
                      goNext();
                    }}
                    className="rounded-xl bg-[#F3E9D2] px-4 py-3 text-center text-[14px] sm:text-[15px] font-bold text-[#5A4A32] hover:bg-[#E3D6B8] cursor-pointer max-sm:order-first max-sm:w-full"
                  >
                    {step === 1 ? "আমার ব্যাকগ্রাউন্ডই থাক" : "আমার পোশাকই থাক"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={goNext}
                  className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#059669] px-4 py-3 text-base font-extrabold text-white shadow-lg hover:bg-[#047857] cursor-pointer sm:flex-none sm:px-8"
                >
                  {step === 0 && isDual
                    ? "ঠিক আছে"
                    : currentCat && guideCount === 0 && !skinToneName
                      ? "না, দরকার নেই"
                      : "পরবর্তী"}{" "}
                  <ChevronRight size={20} />
                </button>
              </>
            ) : (
              <>
                {!quick && (
                  <button
                    type="button"
                    onClick={() => onApply(draft, { generate: false })}
                    className="rounded-lg px-3 py-2 text-center text-[13px] sm:py-2.5 sm:text-sm font-semibold text-stone-500 underline underline-offset-2 hover:text-[#059669] cursor-pointer max-sm:order-first max-sm:w-full"
                  >
                    শুধু সেটিংস প্রয়োগ করুন
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onApply(draft, { generate: true })}
                  className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#D42020] px-4 py-3 text-base font-extrabold text-white shadow-lg hover:bg-[#AE1717] cursor-pointer sm:flex-none sm:px-8"
                >
                  <ImageIcon size={20} /> ছবি তৈরি করুন
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
