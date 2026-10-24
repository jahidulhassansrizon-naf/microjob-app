"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React from "react";
import {
  RotateCw,
  Wand2,
  Sparkles,
  Palette,
  Contrast,
  Printer,
  Check,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Shared English ↔ Bangla translation for the NID PDF settings panel        */
/* -------------------------------------------------------------------------- */
const NID_SETTINGS_TRANSLATIONS: Record<string, string> = {
  settings: "সেটিংস",
  "auto crop": "স্বয়ংক্রিয় ক্রপ",
  on: "চালু",
  off: "বন্ধ",
  "detecting front card edges…": "সামনের কার্ডের প্রান্ত শনাক্ত করা হচ্ছে…",
  "detecting back card edges…": "পেছনের কার্ডের প্রান্ত শনাক্ত করা হচ্ছে…",
  "new uploads are cropped automatically.":
    "নতুন আপলোড করা ছবিগুলো স্বয়ংক্রিয়ভাবে ক্রপ করা হবে।",
  "images stay original. use crop manually.":
    "ছবিগুলো মূল অবস্থায় থাকবে। প্রয়োজনে নিজে ক্রপ করুন।",
  "auto crop is working — please wait":
    "স্বয়ংক্রিয় ক্রপ চলছে — অনুগ্রহ করে অপেক্ষা করুন",
  "auto crop active": "স্বয়ংক্রিয় ক্রপ চালু",
  "auto crop inactive": "স্বয়ংক্রিয় ক্রপ বন্ধ",
  "page settings": "পৃষ্ঠার সেটিংস",
  auto: "স্বয়ংক্রিয়",
  layout: "বিন্যাস",
  switch: "পরিবর্তন করুন",
  rotate: "ঘোরানো",
  "rotate 90°": "৯০° ঘোরান",
  "position on page": "পৃষ্ঠায় অবস্থান",
  top: "উপরে",
  center: "মাঝখানে",
  bottom: "নিচে",
  copies: "কপি সংখ্যা",
  "rounded corners (14px)": "গোলাকার কোণা (১৪ পিক্সেল)",
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
  print: "প্রিন্ট করুন",
  "turn auto crop off": "স্বয়ংক্রিয় ক্রপ বন্ধ করুন",
  "turn auto crop on": "স্বয়ংক্রিয় ক্রপ চালু করুন",
  portrait: "উল্লম্ব",
  landscape: "আড়াআড়ি",
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
  const { locale, L: baseL } = useSohozI18n();
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

interface NidSettingsPanelProps {
  autoCrop: boolean;
  setAutoCrop: (val: boolean) => void;
  processingSide?: "front" | "back" | null;
  processingError?: string | null;
  orientation: "portrait" | "landscape";
  setOrientation: (val: "portrait" | "landscape") => void;
  layout: "side-by-side" | "stacked";
  setLayout: (val: "side-by-side" | "stacked") => void;
  rotation: number;
  setRotation: React.Dispatch<React.SetStateAction<number>>;
  position: "top" | "center" | "bottom";
  setPosition: (val: "top" | "center" | "bottom") => void;
  copies: number;
  setCopies: React.Dispatch<React.SetStateAction<number>>;
  roundedCorners: boolean;
  setRoundedCorners: (val: boolean) => void;
  filterPreset: "plain" | "color" | "scan" | "bw";
  setFilterPreset: (val: "plain" | "color" | "scan" | "bw") => void;
  shadowRemoval: number;
  setShadowRemoval: (val: number) => void;
  blackBoost: number;
  setBlackBoost: (val: number) => void;
  saturation: number;
  setSaturation: (val: number) => void;
  textDeepen: number;
  setTextDeepen: (val: number) => void;
  handlePrint: () => void;
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
  handlePrint,
}: NidSettingsPanelProps) {
  const { t } = useNidSettingsText();
  return (
    <div className="nid-settings-panel lg:col-span-4 bg-[#F2E8D2] p-4 rounded-2xl border border-[#E3D6B8] shadow-sm space-y-4 text-[#3B2F1E]">
      <h2 className="nid-settings-heading text-[17px] font-semibold text-[#3B2F1E] border-b border-[#E3D6B8] pb-2">
        <NidSettingsT>{"Settings\r\n      "}</NidSettingsT>
      </h2>

      {/* Auto crop Toggle */}
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
                <NidSettingsT>{"Auto crop\r\n              "}</NidSettingsT>
              </span>
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  autoCrop
                    ? "bg-emerald-600 text-white"
                    : "bg-[#E3D6B8] text-[#5A4A32]"
                }`}
              >
                {autoCrop ? (
                  <NidSettingsT>{"ON"}</NidSettingsT>
                ) : (
                  <NidSettingsT>{"OFF"}</NidSettingsT>
                )}
              </span>
            </div>
            <span className="text-[13px] text-[#6B5A40] block mt-0.5 leading-relaxed">
              {processingSide ? (
                <NidSettingsT>{`Detecting ${processingSide === "front" ? "front" : "back"} card edges…`}</NidSettingsT>
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
            className={`w-12 h-7 rounded-full transition-all duration-200 p-0.5 flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${
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

        <div
          className={`mt-2 rounded-lg px-2 py-1.5 text-[13px] font-semibold flex items-center gap-1.5 ${
            processingSide
              ? "bg-[#3B2F1E] text-white"
              : autoCrop
                ? "bg-[#FBF6E8] text-[#DC2626] border border-[#DC2626]/20"
                : "bg-[#FBF6E8] text-[#6B5A40] border border-[#E3D6B8]"
          }`}
        >
          {processingSide ? (
            <RotateCw size={11} className="animate-spin shrink-0" />
          ) : (
            <span
              className={`w-1.5 h-1.5 rounded-full ${autoCrop ? "bg-emerald-600" : "bg-[#B0A080]"}`}
            />
          )}
          <span>
            {processingSide ? (
              <NidSettingsT>
                {"Auto crop is working — please wait"}
              </NidSettingsT>
            ) : autoCrop ? (
              <NidSettingsT>{"Auto crop active"}</NidSettingsT>
            ) : (
              <NidSettingsT>{"Auto crop inactive"}</NidSettingsT>
            )}
          </span>
        </div>

        {processingError && (
          <div className="mt-2 rounded-lg bg-[#FEE9E9] border border-[#FBB6B6] text-[#B91C1C] px-2 py-1.5 text-[13px] font-medium leading-relaxed">
            <NidSettingsT>{processingError}</NidSettingsT>
          </div>
        )}
      </div>

      {/* Page settings */}
      <div className="nid-settings-page space-y-1.5">
        <div className="flex justify-between items-center text-[13px] font-bold text-[#5A4A32]">
          <span>
            <NidSettingsT>{"Page settings"}</NidSettingsT>
          </span>
          <span className="text-[#6B5A40] text-[13px]">
            <NidSettingsT>{orientation.toUpperCase()}</NidSettingsT>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 bg-[#F3E9D2] p-1 rounded-xl border border-[#E3D6B8]">
          <button
            onClick={() => setOrientation("portrait")}
            className={`py-1.5 text-[15px] font-bold rounded-lg transition-all duration-200 flex justify-center items-center cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${
              orientation === "portrait"
                ? "bg-[#F6D9A8] text-[#B91C1C] shadow-sm border border-[#DC2626]"
                : "text-[#5A4A32] hover:text-[#3B2F1E] hover:bg-[#EFE3C8]"
            }`}
          >
            <NidSettingsT>{"Auto\r\n          "}</NidSettingsT>
          </button>
          <button
            onClick={() => setOrientation("portrait")}
            className={`py-1.5 text-[15px] font-bold rounded-lg transition-all duration-200 flex justify-center items-center cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${
              orientation === "portrait"
                ? "bg-[#F6D9A8] text-[#B91C1C] shadow-sm border border-[#DC2626]"
                : "text-[#5A4A32] hover:text-[#3B2F1E] hover:bg-[#EFE3C8]"
            }`}
          >
            <div className="w-3 h-4 border-2 border-current rounded-xs" />
          </button>
          <button
            onClick={() => setOrientation("landscape")}
            className={`py-1.5 text-[15px] font-bold rounded-lg transition-all duration-200 flex justify-center items-center cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${
              orientation === "landscape"
                ? "bg-[#F6D9A8] text-[#B91C1C] shadow-sm border border-[#DC2626]"
                : "text-[#5A4A32] hover:text-[#3B2F1E] hover:bg-[#EFE3C8]"
            }`}
          >
            <div className="w-4 h-3 border-2 border-current rounded-xs" />
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="nid-settings-layout space-y-1.5">
        <div className="flex justify-between items-center text-[13px] font-bold text-[#5A4A32]">
          <span>
            <NidSettingsT>{"Layout"}</NidSettingsT>
          </span>
          <button
            onClick={() =>
              setLayout(layout === "side-by-side" ? "stacked" : "side-by-side")
            }
            className="text-[13px] text-[#DC2626] hover:text-[#B91C1C] font-bold hover:underline cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 rounded"
          >
            <NidSettingsT>{"Switch\r\n          "}</NidSettingsT>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 bg-[#F3E9D2] p-1 rounded-xl border border-[#E3D6B8]">
          <button
            onClick={() => setLayout("side-by-side")}
            className={`py-2 text-[15px] font-bold rounded-lg flex justify-center items-center gap-1 transition-all duration-200 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${
              layout === "side-by-side"
                ? "bg-[#F6D9A8] text-[#B91C1C] shadow-sm border border-[#DC2626]"
                : "text-[#5A4A32] hover:text-[#3B2F1E] hover:bg-[#EFE3C8]"
            }`}
          >
            <div className="flex gap-0.5">
              <div className="w-3 h-4 bg-[#DC2626] rounded-xs" />
              <div className="w-3 h-4 bg-[#DC2626] rounded-xs" />
            </div>
          </button>
          <button
            onClick={() => setLayout("stacked")}
            className={`py-2 text-[15px] font-bold rounded-lg flex justify-center items-center gap-1 transition-all duration-200 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${
              layout === "stacked"
                ? "bg-[#F6D9A8] text-[#B91C1C] shadow-sm border border-[#DC2626]"
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
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            className="text-[13px] text-[#DC2626] hover:text-[#B91C1C] font-bold flex items-center gap-1 hover:underline cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 rounded"
          >
            <RotateCw size={12} />
            <NidSettingsT>{"Rotate 90\u00B0\r\n          "}</NidSettingsT>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 bg-[#F3E9D2] p-1 rounded-xl border border-[#E3D6B8] text-[15px] font-bold text-[#5A4A32]">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              onClick={() => setRotation(deg)}
              className={`py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${
                rotation === deg
                  ? "bg-[#F6D9A8] text-[#B91C1C] shadow-sm border border-[#DC2626]"
                  : "hover:bg-[#EFE3C8]"
              }`}
            >
              {deg}
              <NidSettingsT>{"\u00B0\r\n            "}</NidSettingsT>
            </button>
          ))}
        </div>
      </div>

      {/* Position on page */}
      <div className="nid-settings-position space-y-1.5">
        <span className="text-[13px] font-bold text-[#5A4A32] block">
          <NidSettingsT>{"Position on page\r\n        "}</NidSettingsT>
        </span>
        <div className="grid grid-cols-3 gap-1.5 bg-[#F3E9D2] p-1 rounded-xl border border-[#E3D6B8] text-[15px] font-bold text-[#5A4A32]">
          {(["top", "center", "bottom"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => setPosition(pos)}
              className={`py-1.5 rounded-lg capitalize transition-all duration-200 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${
                position === pos
                  ? "bg-[#F6D9A8] text-[#B91C1C] shadow-sm border border-[#DC2626]"
                  : "hover:bg-[#EFE3C8]"
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
          <NidSettingsT>{"Copies\r\n        "}</NidSettingsT>
        </span>
        <div className="grid grid-cols-4 gap-1 bg-[#F3E9D2] p-1 rounded-xl border border-[#E3D6B8] text-[15px] font-bold text-[#5A4A32]">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => setCopies(num)}
              className={`py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${
                copies === num
                  ? "bg-[#F6D9A8] text-[#B91C1C] shadow-sm border border-[#DC2626]"
                  : "hover:bg-[#EFE3C8]"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Rounded corners */}
      <div className="nid-settings-rounded flex items-center justify-between pt-1">
        <div>
          <span className="text-[15px] font-bold text-[#3B2F1E] block">
            <NidSettingsT>
              {"Rounded corners (14px)\r\n          "}
            </NidSettingsT>
          </span>
        </div>
        <button
          onClick={() => setRoundedCorners(!roundedCorners)}
          className={`w-11 h-6 rounded-full transition-colors duration-200 p-0.5 flex items-center cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${
            roundedCorners
              ? "bg-[#DC2626] justify-end"
              : "bg-[#D8C9A6] justify-start"
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-[#FBF6E8] shadow-md" />
        </button>
      </div>

      {/* Cleanup style Controls */}
      <div className="nid-settings-cleanup space-y-4 border-t border-[#E3D6B8] pt-3">
        <div className="flex justify-between items-center">
          <span className="text-[15px] font-bold text-[#3B2F1E]">
            <NidSettingsT>{"Cleanup style\r\n          "}</NidSettingsT>
          </span>
          <button
            onClick={() => {
              setFilterPreset("plain");
              setShadowRemoval(0);
              setBlackBoost(0);
              setSaturation(0);
              setTextDeepen(0);
            }}
            className="text-[15px] text-[#DC2626] hover:text-[#B91C1C] font-bold hover:underline cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 rounded"
          >
            <NidSettingsT>{"Reset\r\n          "}</NidSettingsT>
          </button>
        </div>

        {/* Preset Grid */}
        <div className="nid-settings-presets bg-[#F3E9D2] p-2 rounded-2xl grid grid-cols-2 gap-2">
          {[
            { id: "plain", label: "Plain clean", icon: Wand2 },
            { id: "color", label: "Colour clean", icon: Sparkles },
            { id: "scan", label: "Colour scan", icon: Palette },
            { id: "bw", label: "Black & white", icon: Contrast },
          ].map((preset) => {
            const Icon = preset.icon;
            const isActive = filterPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setFilterPreset(preset.id as any);
                  if (preset.id === "plain") {
                    setShadowRemoval(0);
                    setBlackBoost(0);
                    setSaturation(0);
                    setTextDeepen(0);
                  } else if (preset.id === "color") {
                    setShadowRemoval(20);
                    setBlackBoost(10);
                    setSaturation(30);
                    setTextDeepen(10);
                  } else if (preset.id === "scan") {
                    setShadowRemoval(40);
                    setBlackBoost(30);
                    setSaturation(50);
                    setTextDeepen(30);
                  } else if (preset.id === "bw") {
                    setShadowRemoval(60);
                    setBlackBoost(50);
                    setSaturation(0);
                    setTextDeepen(50);
                  }
                }}
                className={`relative py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${
                  isActive
                    ? "bg-[#F6D9A8] text-[#B91C1C] shadow-sm border border-[#DC2626] ring-2 ring-[#DC2626]/40 font-semibold"
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
                  <NidSettingsT>{preset.label}</NidSettingsT>
                </span>
              </button>
            );
          })}
        </div>

        {/* Fine tuning */}
        <div className="nid-settings-fine-tuning space-y-3 pt-1 border-t border-[#E3D6B8]">
          <span className="text-[15px] font-bold text-[#3B2F1E] block">
            <NidSettingsT>{"Fine tuning\r\n          "}</NidSettingsT>
          </span>
          <div className="nid-settings-range-grid space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[13px] font-bold text-[#5A4A32]">
                <span>
                  <NidSettingsT>{"Remove shadows and stains"}</NidSettingsT>
                </span>
                <span className="min-w-[28px] h-6 px-1 rounded bg-[#FEE9E9] text-[#DC2626] border border-[#FBB6B6] flex items-center justify-center text-[13px] font-bold">
                  {shadowRemoval}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={shadowRemoval}
                onChange={(e) => setShadowRemoval(Number(e.target.value))}
                className="w-full h-2 bg-[#E3D6B8] rounded-lg appearance-none cursor-pointer accent-[#DC2626]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[13px] font-bold text-[#5A4A32]">
                <span>
                  <NidSettingsT>{"Increase blacks"}</NidSettingsT>
                </span>
                <span className="min-w-[28px] h-6 px-1 rounded bg-[#FEE9E9] text-[#DC2626] border border-[#FBB6B6] flex items-center justify-center text-[13px] font-bold">
                  {blackBoost}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={blackBoost}
                onChange={(e) => setBlackBoost(Number(e.target.value))}
                className="w-full h-2 bg-[#E3D6B8] rounded-lg appearance-none cursor-pointer accent-[#DC2626]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[13px] font-bold text-[#5A4A32]">
                <span>
                  <NidSettingsT>{"Colour intensity"}</NidSettingsT>
                </span>
                <span className="min-w-[28px] h-6 px-1 rounded bg-[#FEE9E9] text-[#DC2626] border border-[#FBB6B6] flex items-center justify-center text-[13px] font-bold">
                  {saturation}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full h-2 bg-[#E3D6B8] rounded-lg appearance-none cursor-pointer accent-[#DC2626]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[13px] font-bold text-[#5A4A32]">
                <span>
                  <NidSettingsT>{"Deepen text"}</NidSettingsT>
                </span>
                <span className="min-w-[28px] h-6 px-1 rounded bg-[#FEE9E9] text-[#DC2626] border border-[#FBB6B6] flex items-center justify-center text-[13px] font-bold">
                  {textDeepen}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={textDeepen}
                onChange={(e) => setTextDeepen(Number(e.target.value))}
                className="w-full h-2 bg-[#E3D6B8] rounded-lg appearance-none cursor-pointer accent-[#DC2626]"
              />
            </div>
          </div>
        </div>

        {/* Print Button (main call-to-action) */}
        <button
          onClick={handlePrint}
          className="nid-settings-print w-full py-2.5 bg-[#D42020] hover:bg-[#AE1717] text-white text-[15px] font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
        >
          <Printer size={16} />
          <span>
            <NidSettingsT>{"Print"}</NidSettingsT>
          </span>
        </button>
      </div>
    </div>
  );
}
