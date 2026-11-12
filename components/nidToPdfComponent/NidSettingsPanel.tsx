"use client";
import { useSebaLagbeToolsI18n } from "@/app/sohoj-tools/_i18n";
import React from "react";
import {
  RotateCw,
  Wand2,
  Sparkles,
  Palette,
  Contrast,
  Check,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Shared English ↔ Bangla translation for the NID PDF settings panel        */
/* -------------------------------------------------------------------------- */
const NID_SETTINGS_TRANSLATIONS: Record<string, string> = {
  "auto crop": "স্বয়ংক্রিয় ক্রপ",
  on: "চালু",
  off: "বন্ধ",
  "detecting front card edges…": "সামনের কার্ডের প্রান্ত শনাক্ত করা হচ্ছে…",
  "detecting back card edges…": "পেছনের কার্ডের প্রান্ত শনাক্ত করা হচ্ছে…",
  "new uploads are cropped automatically.":
    "নতুন আপলোড করা ছবিগুলো স্বয়ংক্রিয়ভাবে ক্রপ করা হবে।",
  "images stay original. use crop manually.":
    "ছবিগুলো মূল অবস্থায় থাকবে। প্রয়োজনে নিজে ক্রপ করুন।",
  "page settings": "পৃষ্ঠার সেটিংস",
  layout: "বিন্যাস",
  switch: "পরিবর্তন করুন",
  rotate: "ঘোরানো",
  "rotate 90°": "৯০° ঘোরান",
  "position on page": "পৃষ্ঠায় অবস্থান",
  top: "উপরে",
  center: "মাঝখানে",
  bottom: "নিচে",
  copies: "কপি সংখ্যা",
  "cleanup style": "পরিষ্কার করার ধরন",
  reset: "রিসেট করুন",
  "plain clean": "সাধারণ পরিষ্কার",
  "colour clean": "রঙ পরিষ্কার",
  "colour scan": "রঙিন স্ক্যান",
  "black & white": "সাদা-কালো",
  "fine tuning": "সূক্ষ্ম সমন্বয়",
  "remove shadows and stains": "ছায়া ও দাগ সরানো",
  "increase blacks": "কালো অংশ গাঢ় করা",
  "colour intensity": "রঙের তীব্রতা",
  "deepen text": "লেখা আরও গাঢ় করা",
  "turn auto crop off": "স্বয়ংক্রিয় ক্রপ বন্ধ করুন",
  "turn auto crop on": "স্বয়ংক্রিয় ক্রপ চালু করুন",
  portrait: "উল্লম্ব",
  landscape: "আড়াআড়ি",
  "rounded corners": "গোলাকার কোণা",
  "what is it for?": "কী কাজে লাগবে?",
  photocopy: "ফটোকপি",
  "2 copies": "২ কপি",
  "colour print": "রঙিন",
  "online pdf": "অনলাইন PDF",
  "pick one — the other settings are set for you.":
    "একটি বেছে নিন — বাকি সেটিং নিজে থেকে ঠিক হবে।",
  "black & white, 1 copy — for banks, offices and sim shops.":
    "সাদা-কালো, ১ কপি — ব্যাংক, অফিস, সিমে জমা দিতে।",
  "black & white, 2 copies — to submit in two places.":
    "সাদা-কালো, ২ কপি — দুই জায়গায় জমা দিতে।",
  "clean colour copy, 1 copy.": "রঙিন পরিষ্কার কপি, ১টি।",
  "front above back, centred — for uploading to online applications.":
    "সামনে উপরে, পেছনে নিচে, মাঝখানে — অনলাইন আবেদনে আপলোড দিতে।",
  "text on the copy": "কপির ওপর লেখা",
  "(stops misuse)": "(অপব্যবহার ঠেকাতে)",
  "with date": "তারিখসহ",
  examples: "উদাহরণ",
  "e.g. for bank account opening only": "যেমন: শুধু ব্যাংক হিসাব খোলার জন্য",
  "appears as light red text across each card in print and pdf.":
    "প্রিন্ট ও PDF-এ প্রতিটি কার্ডের ওপর হালকা লাল লেখা থাকবে।",
  "for bank account opening only": "শুধু ব্যাংক হিসাব খোলার জন্য",
  "for sim registration only": "শুধু সিম নিবন্ধনের জন্য",
  "for job application only": "শুধু চাকরির আবেদনের জন্য",
  "for admission only": "শুধু ভর্তির জন্য",
  "clear text": "লেখা মুছুন",
};

function normalizeNidSettingsText(value: string) {
  return value
    .replace(/\\r?\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function translateNidSettingsText(
  value: string,
  locale: string | undefined,
  baseL: (value: string) => string,
) {
  const raw = value ?? "";
  if (!locale || !String(locale).toLowerCase().startsWith("bn")) return raw;
  const exact = NID_SETTINGS_TRANSLATIONS[normalizeNidSettingsText(raw)];
  if (exact) {
    const lead = raw.match(/^\s*/)?.[0] ?? "";
    const trail = raw.match(/\s*$/)?.[0] ?? "";
    return `${lead}${exact}${trail}`;
  }

  const dynamicDetect = /^detecting (front|back) card edges…$/i.exec(
    normalizeNidSettingsText(raw),
  );
  if (dynamicDetect) {
    return dynamicDetect[1] === "front"
      ? "সামনের কার্ডের প্রান্ত শনাক্ত করা হচ্ছে…"
      : "পেছনের কার্ডের প্রান্ত শনাক্ত করা হচ্ছে…";
  }

  return raw;
}

function useNidSettingsText() {
  const { locale, L: baseL } = useSebaLagbeToolsI18n();
  const t = React.useCallback(
    (value: string) => translateNidSettingsText(value, locale, baseL),
    [locale, baseL],
  );
  return { t, locale };
}

function NidSettingsT({ children }: { children: React.ReactNode }) {
  const { t } = useNidSettingsText();
  if (typeof children !== "string") return <>{children}</>;
  return <>{t(children)}</>;
}

type FilterPresetId = "plain" | "color" | "scan" | "bw";
type Orientation = "portrait" | "landscape";
type LayoutMode = "side-by-side" | "stacked";
type PagePosition = "top" | "center" | "bottom";

// What each cleanup style sets: [shadowRemoval, blackBoost, saturation, textDeepen].
const CLEANUP_PRESETS: Record<
  FilterPresetId,
  { shadowRemoval: number; blackBoost: number; saturation: number; textDeepen: number }
> = {
  plain: { shadowRemoval: 0, blackBoost: 0, saturation: 0, textDeepen: 0 },
  color: { shadowRemoval: 20, blackBoost: 10, saturation: 30, textDeepen: 10 },
  scan: { shadowRemoval: 40, blackBoost: 30, saturation: 50, textDeepen: 30 },
  bw: { shadowRemoval: 60, blackBoost: 50, saturation: 0, textDeepen: 50 },
};
const CLEANUP_BUTTONS: {
  id: FilterPresetId;
  label: string;
  icon: typeof Wand2;
}[] = [
  { id: "plain", label: "Plain clean", icon: Wand2 },
  { id: "color", label: "Colour clean", icon: Sparkles },
  { id: "scan", label: "Colour scan", icon: Palette },
  { id: "bw", label: "Black & white", icon: Contrast },
];

// One-click setups for the most common real-life uses of an NID copy.
const QUICK_SETUPS: {
  key: string;
  label: string;
  hint: string;
  cleanup: FilterPresetId;
  layout: LayoutMode;
  position: PagePosition;
  copies: number;
}[] = [
  {
    key: "photocopy",
    label: "Photocopy",
    hint: "Black & white, 1 copy \u2014 for banks, offices and SIM shops.",
    cleanup: "bw",
    layout: "side-by-side",
    position: "top",
    copies: 1,
  },
  {
    key: "twoCopies",
    label: "2 copies",
    hint: "Black & white, 2 copies \u2014 to submit in two places.",
    cleanup: "bw",
    layout: "side-by-side",
    position: "top",
    copies: 2,
  },
  {
    key: "colourPrint",
    label: "Colour print",
    hint: "Clean colour copy, 1 copy.",
    cleanup: "color",
    layout: "side-by-side",
    position: "top",
    copies: 1,
  },
  {
    key: "onlinePdf",
    label: "Online PDF",
    hint: "Front above back, centred \u2014 for uploading to online applications.",
    cleanup: "plain",
    layout: "stacked",
    position: "center",
    copies: 1,
  },
];
const WATERMARK_EXAMPLES = [
  "For bank account opening only",
  "For SIM registration only",
  "For job application only",
  "For admission only",
];
const DEFAULT_QUICK_HINT = "Pick one \u2014 the other settings are set for you.";

const SEGMENT_ACTIVE =
  "bg-[#F6D9A8] text-[#B91C1C] shadow-sm border border-[#DC2626]";
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40";

interface NidSettingsPanelProps {
  autoCrop: boolean;
  setAutoCrop: (val: boolean) => void;
  processingSide?: "front" | "back" | null;
  processingError?: string | null;
  orientation: Orientation;
  setOrientation: (val: Orientation) => void;
  layout: LayoutMode;
  setLayout: (val: LayoutMode) => void;
  rotation: number;
  setRotation: React.Dispatch<React.SetStateAction<number>>;
  position: PagePosition;
  setPosition: (val: PagePosition) => void;
  copies: number;
  setCopies: React.Dispatch<React.SetStateAction<number>>;
  roundedCorners: boolean;
  setRoundedCorners: (val: boolean) => void;
  filterPreset: FilterPresetId;
  setFilterPreset: (val: FilterPresetId) => void;
  shadowRemoval: number;
  setShadowRemoval: (val: number) => void;
  blackBoost: number;
  setBlackBoost: (val: number) => void;
  saturation: number;
  setSaturation: (val: number) => void;
  textDeepen: number;
  setTextDeepen: (val: number) => void;
  /** "For ... only" text stamped on the copy; empty = no stamp. */
  watermarkInput: string;
  setWatermarkInput: (val: string) => void;
  watermarkDate: boolean;
  setWatermarkDate: (val: boolean) => void;
  watermarkMaxLength: number;
}
export default function NidSettingsPanel({
  autoCrop,
  setAutoCrop,
  processingSide = null,
  processingError = null,
  orientation,
  setOrientation,
  layout,
  setLayout,
  rotation,
  setRotation,
  position,
  setPosition,
  copies,
  setCopies,
  roundedCorners,
  setRoundedCorners,
  filterPreset,
  setFilterPreset,
  shadowRemoval,
  setShadowRemoval,
  blackBoost,
  setBlackBoost,
  saturation,
  setSaturation,
  textDeepen,
  setTextDeepen,
  watermarkInput,
  setWatermarkInput,
  watermarkDate,
  setWatermarkDate,
  watermarkMaxLength,
}: NidSettingsPanelProps) {
  const { t } = useNidSettingsText();

  const applyCleanup = (id: FilterPresetId) => {
    const values = CLEANUP_PRESETS[id];
    setFilterPreset(id);
    setShadowRemoval(values.shadowRemoval);
    setBlackBoost(values.blackBoost);
    setSaturation(values.saturation);
    setTextDeepen(values.textDeepen);
  };
  const applyQuickSetup = (setup: (typeof QUICK_SETUPS)[number]) => {
    applyCleanup(setup.cleanup);
    setLayout(setup.layout);
    setOrientation("portrait");
    setPosition(setup.position);
    setCopies(setup.copies);
    setRoundedCorners(false);
  };
  // The quick setup that matches every current setting exactly (if any).
  const activeQuickSetup =
    QUICK_SETUPS.find((setup) => {
      const values = CLEANUP_PRESETS[setup.cleanup];
      return (
        filterPreset === setup.cleanup &&
        shadowRemoval === values.shadowRemoval &&
        blackBoost === values.blackBoost &&
        saturation === values.saturation &&
        textDeepen === values.textDeepen &&
        layout === setup.layout &&
        orientation === "portrait" &&
        position === setup.position &&
        copies === setup.copies &&
        !roundedCorners
      );
    }) ?? null;

  const fineTuning: {
    label: string;
    value: number;
    set: (val: number) => void;
  }[] = [
    { label: "Remove shadows and stains", value: shadowRemoval, set: setShadowRemoval },
    { label: "Increase blacks", value: blackBoost, set: setBlackBoost },
    { label: "Colour intensity", value: saturation, set: setSaturation },
    { label: "Deepen text", value: textDeepen, set: setTextDeepen },
  ];

  return (
    <div className="nid-settings-panel lg:col-span-4 bg-[#F2E8D2] p-4 rounded-2xl border border-[#E3D6B8] shadow-sm space-y-4 text-[#3B2F1E]">
      {/* Quick setup: what is the copy for? */}
      <div className="nid-settings-quick space-y-1.5">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-[15px] font-bold text-[#3B2F1E] shrink-0">
            <NidSettingsT>{"What is it for?"}</NidSettingsT>
          </span>
          <span
            className="text-[12.5px] font-medium text-[#6B5A40] truncate"
            title={t(activeQuickSetup?.hint ?? DEFAULT_QUICK_HINT)}
          >
            <NidSettingsT>
              {activeQuickSetup?.hint ?? DEFAULT_QUICK_HINT}
            </NidSettingsT>
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 bg-[#F3E9D2] p-1 rounded-xl border border-[#E3D6B8]">
          {QUICK_SETUPS.map((setup) => {
            const isActive = setup.key === activeQuickSetup?.key;
            return (
              <button
                key={setup.key}
                type="button"
                onClick={() => applyQuickSetup(setup)}
                aria-pressed={isActive}
                title={t(setup.hint)}
                className={`min-w-0 px-1 py-1.5 text-[14px] font-bold leading-tight rounded-lg transition-all duration-200 cursor-pointer active:scale-[0.98] ${FOCUS_RING} ${
                  isActive
                    ? SEGMENT_ACTIVE
                    : "text-[#5A4A32] hover:text-[#3B2F1E] hover:bg-[#EFE3C8] border border-transparent"
                }`}
              >
                <NidSettingsT>{setup.label}</NidSettingsT>
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto crop */}
      <div
        className={`nid-settings-auto-crop rounded-xl border p-2.5 transition-all duration-200 ${
          autoCrop
            ? "bg-[#DC2626]/10 border-[#DC2626]/30"
            : "bg-[#F6EEDB] border-[#E3D6B8]"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-[#3B2F1E]">
                <NidSettingsT>{"Auto crop"}</NidSettingsT>
              </span>
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  autoCrop
                    ? "bg-emerald-600 text-white"
                    : "bg-[#E3D6B8] text-[#5A4A32]"
                }`}
              >
                <NidSettingsT>{autoCrop ? "ON" : "OFF"}</NidSettingsT>
              </span>
            </div>
            <span
              role="status"
              className="text-[13px] text-[#6B5A40] mt-0.5 leading-relaxed flex items-center gap-1.5"
            >
              {processingSide && (
                <RotateCw size={11} className="animate-spin shrink-0" />
              )}
              {processingSide ? (
                <NidSettingsT>{`Detecting ${processingSide} card edges…`}</NidSettingsT>
              ) : autoCrop ? (
                <NidSettingsT>
                  {"New uploads are cropped automatically."}
                </NidSettingsT>
              ) : (
                <NidSettingsT>
                  {"Images stay original. Use Crop manually."}
                </NidSettingsT>
              )}
            </span>
          </div>

          <button
            type="button"
            aria-pressed={autoCrop}
            title={t(autoCrop ? "Turn Auto crop off" : "Turn Auto crop on")}
            onClick={() => setAutoCrop(!autoCrop)}
            disabled={processingSide !== null}
            className={`w-12 h-7 rounded-full transition-all duration-200 p-0.5 flex items-center shrink-0 ${FOCUS_RING} ${
              processingSide !== null
                ? "opacity-70 cursor-not-allowed"
                : "cursor-pointer active:scale-[0.98]"
            } ${
              autoCrop
                ? "bg-[#DC2626] justify-end shadow-sm"
                : "bg-[#D8C9A6] justify-start"
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-[#FBF6E8] shadow-md" />
          </button>
        </div>

        {processingError && (
          <div className="mt-2 rounded-lg bg-[#FEE9E9] border border-[#FBB6B6] text-[#B91C1C] px-2 py-1.5 text-[13px] font-medium leading-relaxed">
            <NidSettingsT>{processingError}</NidSettingsT>
          </div>
        )}
      </div>

      {/* Page orientation */}
      <div className="nid-settings-page space-y-1.5">
        <div className="text-[13px] font-bold text-[#5A4A32]">
          <NidSettingsT>{"Page settings"}</NidSettingsT>
        </div>
        <div className="grid grid-cols-2 gap-1.5 bg-[#F3E9D2] p-1 rounded-xl border border-[#E3D6B8]">
          {(
            [
              { id: "portrait", box: "w-3 h-4" },
              { id: "landscape", box: "w-4 h-3" },
            ] as const
          ).map(({ id, box }) => (
            <button
              key={id}
              type="button"
              onClick={() => setOrientation(id)}
              aria-pressed={orientation === id}
              className={`py-1.5 text-[15px] font-bold rounded-lg transition-all duration-200 flex justify-center items-center gap-1.5 cursor-pointer active:scale-[0.98] ${FOCUS_RING} ${
                orientation === id
                  ? SEGMENT_ACTIVE
                  : "text-[#5A4A32] hover:text-[#3B2F1E] hover:bg-[#EFE3C8]"
              }`}
            >
              <div className={`${box} border-2 border-current rounded-xs`} />
              <NidSettingsT>{id}</NidSettingsT>
            </button>
          ))}
        </div>
      </div>

      {/* Layout */}
      <div className="nid-settings-layout space-y-1.5">
        <div className="flex justify-between items-center text-[13px] font-bold text-[#5A4A32]">
          <span>
            <NidSettingsT>{"Layout"}</NidSettingsT>
          </span>
          <button
            type="button"
            onClick={() =>
              setLayout(layout === "side-by-side" ? "stacked" : "side-by-side")
            }
            className={`text-[13px] text-[#DC2626] hover:text-[#B91C1C] font-bold hover:underline cursor-pointer transition-colors duration-150 rounded ${FOCUS_RING}`}
          >
            <NidSettingsT>{"Switch"}</NidSettingsT>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 bg-[#F3E9D2] p-1 rounded-xl border border-[#E3D6B8]">
          <button
            type="button"
            onClick={() => setLayout("side-by-side")}
            aria-pressed={layout === "side-by-side"}
            className={`py-2 text-[15px] font-bold rounded-lg flex justify-center items-center gap-1 transition-all duration-200 cursor-pointer active:scale-[0.98] ${FOCUS_RING} ${
              layout === "side-by-side"
                ? SEGMENT_ACTIVE
                : "text-[#5A4A32] hover:text-[#3B2F1E] hover:bg-[#EFE3C8]"
            }`}
          >
            <div className="flex gap-0.5">
              <div className="w-3 h-4 bg-[#DC2626] rounded-xs" />
              <div className="w-3 h-4 bg-[#DC2626] rounded-xs" />
            </div>
          </button>
          <button
            type="button"
            onClick={() => setLayout("stacked")}
            aria-pressed={layout === "stacked"}
            className={`py-2 text-[15px] font-bold rounded-lg flex justify-center items-center gap-1 transition-all duration-200 cursor-pointer active:scale-[0.98] ${FOCUS_RING} ${
              layout === "stacked"
                ? SEGMENT_ACTIVE
                : "text-[#5A4A32] hover:text-[#3B2F1E] hover:bg-[#EFE3C8]"
            }`}
          >
            <div className="flex flex-col gap-0.5">
              <div className="w-5 h-2 bg-[#DC2626] rounded-xs" />
              <div className="w-5 h-2 bg-[#DC2626] rounded-xs" />
            </div>
          </button>
        </div>
      </div>

      {/* Rotate */}
      <div className="nid-settings-rotate space-y-1.5">
        <div className="flex justify-between items-center text-[13px] font-bold text-[#5A4A32]">
          <span>
            <NidSettingsT>{"Rotate"}</NidSettingsT>
          </span>
          <button
            type="button"
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            className={`text-[13px] text-[#DC2626] hover:text-[#B91C1C] font-bold flex items-center gap-1 hover:underline cursor-pointer transition-colors duration-150 rounded ${FOCUS_RING}`}
          >
            <RotateCw size={12} />
            <NidSettingsT>{"Rotate 90\u00B0"}</NidSettingsT>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 bg-[#F3E9D2] p-1 rounded-xl border border-[#E3D6B8] text-[15px] font-bold text-[#5A4A32]">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={() => setRotation(deg)}
              aria-pressed={rotation === deg}
              className={`py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-[0.98] ${FOCUS_RING} ${
                rotation === deg ? SEGMENT_ACTIVE : "hover:bg-[#EFE3C8]"
              }`}
            >
              {deg}&deg;
            </button>
          ))}
        </div>
      </div>

      {/* Position on page */}
      <div className="nid-settings-position space-y-1.5">
        <span className="text-[13px] font-bold text-[#5A4A32] block">
          <NidSettingsT>{"Position on page"}</NidSettingsT>
        </span>
        <div className="grid grid-cols-3 gap-1.5 bg-[#F3E9D2] p-1 rounded-xl border border-[#E3D6B8] text-[15px] font-bold text-[#5A4A32]">
          {(["top", "center", "bottom"] as const).map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setPosition(pos)}
              aria-pressed={position === pos}
              className={`py-1.5 rounded-lg capitalize transition-all duration-200 cursor-pointer active:scale-[0.98] ${FOCUS_RING} ${
                position === pos ? SEGMENT_ACTIVE : "hover:bg-[#EFE3C8]"
              }`}
            >
              <NidSettingsT>{pos}</NidSettingsT>
            </button>
          ))}
        </div>
      </div>

      {/* Copies */}
      <div className="nid-settings-copies space-y-1.5">
        <span className="text-[13px] font-bold text-[#5A4A32] block">
          <NidSettingsT>{"Copies"}</NidSettingsT>
        </span>
        <div className="grid grid-cols-4 gap-1 bg-[#F3E9D2] p-1 rounded-xl border border-[#E3D6B8] text-[15px] font-bold text-[#5A4A32]">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setCopies(num)}
              aria-pressed={copies === num}
              className={`py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-[0.98] ${FOCUS_RING} ${
                copies === num ? SEGMENT_ACTIVE : "hover:bg-[#EFE3C8]"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Rounded corners */}
      <div className="nid-settings-rounded flex items-center justify-between pt-1">
        <span className="text-[15px] font-bold text-[#3B2F1E]">
          <NidSettingsT>{"Rounded corners"}</NidSettingsT>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={roundedCorners}
          aria-label={t("Rounded corners")}
          onClick={() => setRoundedCorners(!roundedCorners)}
          className={`w-11 h-6 rounded-full transition-colors duration-200 p-0.5 flex items-center cursor-pointer active:scale-[0.98] ${FOCUS_RING} ${
            roundedCorners
              ? "bg-[#DC2626] justify-end"
              : "bg-[#D8C9A6] justify-start"
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-[#FBF6E8] shadow-md" />
        </button>
      </div>

      {/* Text stamped on the copy, so it cannot be reused for something else */}
      <div className="nid-settings-watermark space-y-1.5 border-t border-[#E3D6B8] pt-2">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="nid-watermark-input"
            className="text-[15px] font-bold text-[#3B2F1E] min-w-0 truncate"
          >
            <NidSettingsT>{"Text on the copy"}</NidSettingsT>{" "}
            <span className="text-[12.5px] font-medium text-[#6B5A40]">
              <NidSettingsT>{"(stops misuse)"}</NidSettingsT>
            </span>
          </label>
          <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#3B2F1E] cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={watermarkDate}
              onChange={(e) => setWatermarkDate(e.target.checked)}
              disabled={!watermarkInput.trim()}
              className="h-4 w-4 accent-[#DC2626]"
            />
            <NidSettingsT>{"With date"}</NidSettingsT>
          </label>
        </div>
        <div className="flex gap-1.5">
          <input
            id="nid-watermark-input"
            type="text"
            value={watermarkInput}
            maxLength={watermarkMaxLength}
            onChange={(e) => setWatermarkInput(e.target.value)}
            placeholder={t("e.g. For bank account opening only")}
            title={t("Appears as light red text across each card in print and PDF.")}
            className={`min-w-0 flex-1 rounded-lg border border-[#E3D6B8] bg-white px-2.5 py-1.5 text-[14px] font-medium text-[#3B2F1E] placeholder:text-[#A8977A] ${FOCUS_RING}`}
          />
          <select
            aria-label={t("Examples")}
            value=""
            onChange={(e) => {
              if (e.target.value) setWatermarkInput(t(e.target.value));
            }}
            className={`w-[84px] shrink-0 rounded-lg border border-[#E3D6B8] bg-[#F6EEDB] px-1.5 text-[13px] font-semibold text-[#5A4A32] cursor-pointer ${FOCUS_RING}`}
          >
            <option value="">{t("Examples")}</option>
            {WATERMARK_EXAMPLES.map((example) => (
              <option key={example} value={example}>
                {t(example)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cleanup style */}
      <div className="nid-settings-cleanup space-y-4 border-t border-[#E3D6B8] pt-3">
        <div className="flex justify-between items-center">
          <span className="text-[15px] font-bold text-[#3B2F1E]">
            <NidSettingsT>{"Cleanup style"}</NidSettingsT>
          </span>
          <button
            type="button"
            onClick={() => applyCleanup("plain")}
            className={`text-[15px] text-[#DC2626] hover:text-[#B91C1C] font-bold hover:underline cursor-pointer transition-colors duration-150 rounded ${FOCUS_RING}`}
          >
            <NidSettingsT>{"Reset"}</NidSettingsT>
          </button>
        </div>

        <div className="nid-settings-presets bg-[#F3E9D2] p-2 rounded-2xl grid grid-cols-2 gap-2">
          {CLEANUP_BUTTONS.map(({ id, label, icon: Icon }) => {
            const isActive = filterPreset === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => applyCleanup(id)}
                aria-pressed={isActive}
                className={`relative py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-[0.98] ${FOCUS_RING} ${
                  isActive
                    ? `${SEGMENT_ACTIVE} ring-2 ring-[#DC2626]/40 font-semibold`
                    : "border border-transparent text-[#5A4A32] hover:bg-[#EFE3C8] hover:-translate-y-0.5 hover:shadow-sm"
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#DC2626] text-white flex items-center justify-center"
                  >
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
                <Icon
                  size={18}
                  className={isActive ? "text-[#DC2626]" : "text-[#5A4A32]"}
                />
                <span className="text-[15px] font-semibold text-center leading-tight">
                  <NidSettingsT>{label}</NidSettingsT>
                </span>
              </button>
            );
          })}
        </div>

        {/* Fine tuning */}
        <div className="nid-settings-fine-tuning space-y-3 pt-1 border-t border-[#E3D6B8]">
          <span className="text-[15px] font-bold text-[#3B2F1E] block">
            <NidSettingsT>{"Fine tuning"}</NidSettingsT>
          </span>
          <div className="nid-settings-range-grid space-y-3">
            {fineTuning.map(({ label, value, set }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between items-center text-[13px] font-bold text-[#5A4A32]">
                  <span>
                    <NidSettingsT>{label}</NidSettingsT>
                  </span>
                  <span className="min-w-[28px] h-6 px-1 rounded bg-[#FEE9E9] text-[#DC2626] border border-[#FBB6B6] flex items-center justify-center text-[13px] font-bold">
                    {value}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  aria-label={t(label)}
                  onChange={(e) => set(Number(e.target.value))}
                  className="w-full h-2 bg-[#E3D6B8] rounded-lg appearance-none cursor-pointer accent-[#DC2626]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
