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
    "ছবিগুলো মূল অবস্থায় থাকবে। প্রয়োজনে নিজে Crop ব্যবহার করুন।",
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
    <div className="lg:col-span-4 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4 text-[#0F172A]">
      <h2 className="text-xs font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2">
        <NidSettingsT>{"Settings\r\n      "}</NidSettingsT>
      </h2>

      {/* Auto crop Toggle */}
      <div
        className={`rounded-xl border p-2.5 transition-all ${
          autoCrop
            ? "bg-[#2563EB]/10 border-[#2563EB]/30"
            : "bg-[#E2E8F0]/40 border-[#E2E8F0]"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A]">
                <NidSettingsT>{"Auto crop\r\n              "}</NidSettingsT>
              </span>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  autoCrop
                    ? "bg-[#10B981] text-white"
                    : "bg-[#E2E8F0] text-[#0F172A]/70"
                }`}
              >
                {autoCrop ? (
                  <NidSettingsT>{"ON"}</NidSettingsT>
                ) : (
                  <NidSettingsT>{"OFF"}</NidSettingsT>
                )}
              </span>
            </div>
            <span className="text-[10px] text-[#0F172A]/70 block mt-0.5 leading-relaxed">
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
            className={`w-12 h-7 rounded-full transition-all p-0.5 flex items-center shrink-0 ${
              processingSide !== null
                ? "opacity-60 cursor-not-allowed"
                : "cursor-pointer"
            } ${
              autoCrop
                ? "bg-[#2563EB] justify-end shadow-sm"
                : "bg-[#E2E8F0] justify-start"
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-white shadow-md" />
          </button>
        </div>

        <div
          className={`mt-2 rounded-lg px-2 py-1.5 text-[10px] font-semibold flex items-center gap-1.5 ${
            processingSide
              ? "bg-[#0F172A] text-white"
              : autoCrop
                ? "bg-white text-[#2563EB] border border-[#2563EB]/20"
                : "bg-white text-[#0F172A]/60 border border-[#E2E8F0]"
          }`}
        >
          {processingSide ? (
            <RotateCw size={11} className="animate-spin shrink-0" />
          ) : (
            <span
              className={`w-1.5 h-1.5 rounded-full ${autoCrop ? "bg-[#10B981]" : "bg-gray-400"}`}
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
          <div className="mt-2 rounded-lg bg-red-50 border border-red-100 text-red-600 px-2 py-1.5 text-[10px] font-medium leading-relaxed">
            <NidSettingsT>{processingError}</NidSettingsT>
          </div>
        )}
      </div>

      {/* Page settings */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] font-bold text-[#0F172A]/80">
          <span>
            <NidSettingsT>{"Page settings"}</NidSettingsT>
          </span>
          <span className="text-[#0F172A]/50 text-[10px]">
            <NidSettingsT>{orientation.toUpperCase()}</NidSettingsT>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 bg-[#E2E8F0]/40 p-1 rounded-xl border border-[#E2E8F0]">
          <button
            onClick={() => setOrientation("portrait")}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all flex justify-center items-center cursor-pointer ${
              orientation === "portrait"
                ? "bg-white text-[#2563EB] shadow-xs border border-[#E2E8F0]"
                : "text-[#0F172A]/70 hover:text-[#0F172A]"
            }`}
          >
            <NidSettingsT>{"Auto\r\n          "}</NidSettingsT>
          </button>
          <button
            onClick={() => setOrientation("portrait")}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all flex justify-center items-center cursor-pointer ${
              orientation === "portrait"
                ? "bg-white text-[#2563EB] shadow-xs border border-[#E2E8F0]"
                : "text-[#0F172A]/70 hover:text-[#0F172A]"
            }`}
          >
            <div className="w-3 h-4 border-2 border-current rounded-xs" />
          </button>
          <button
            onClick={() => setOrientation("landscape")}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all flex justify-center items-center cursor-pointer ${
              orientation === "landscape"
                ? "bg-white text-[#2563EB] shadow-xs border border-[#E2E8F0]"
                : "text-[#0F172A]/70 hover:text-[#0F172A]"
            }`}
          >
            <div className="w-4 h-3 border-2 border-current rounded-xs" />
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] font-bold text-[#0F172A]/80">
          <span>
            <NidSettingsT>{"Layout"}</NidSettingsT>
          </span>
          <button
            onClick={() =>
              setLayout(layout === "side-by-side" ? "stacked" : "side-by-side")
            }
            className="text-[10px] text-[#2563EB] font-bold hover:underline cursor-pointer"
          >
            <NidSettingsT>{"Switch\r\n          "}</NidSettingsT>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 bg-[#E2E8F0]/40 p-1 rounded-xl border border-[#E2E8F0]">
          <button
            onClick={() => setLayout("side-by-side")}
            className={`py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-1 transition-all cursor-pointer ${
              layout === "side-by-side"
                ? "bg-white text-[#2563EB] shadow-xs border border-[#E2E8F0]"
                : "text-[#0F172A]/70 hover:text-[#0F172A]"
            }`}
          >
            <div className="flex gap-0.5">
              <div className="w-3 h-4 bg-[#2563EB] rounded-xs" />
              <div className="w-3 h-4 bg-[#2563EB] rounded-xs" />
            </div>
          </button>
          <button
            onClick={() => setLayout("stacked")}
            className={`py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-1 transition-all cursor-pointer ${
              layout === "stacked"
                ? "bg-white text-[#2563EB] shadow-xs border border-[#E2E8F0]"
                : "text-[#0F172A]/70 hover:text-[#0F172A]"
            }`}
          >
            <div className="flex flex-col gap-0.5">
              <div className="w-5 h-2 bg-[#2563EB] rounded-xs" />
              <div className="w-5 h-2 bg-[#2563EB] rounded-xs" />
            </div>
          </button>
        </div>
      </div>

      {/* Rotate */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] font-bold text-[#0F172A]/80">
          <span>
            <NidSettingsT>{"Rotate"}</NidSettingsT>
          </span>
          <button
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            className="text-[10px] text-[#2563EB] font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RotateCw size={10} />
            <NidSettingsT>{"Rotate 90\u00B0\r\n          "}</NidSettingsT>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 bg-[#E2E8F0]/40 p-1 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#0F172A]/80">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              onClick={() => setRotation(deg)}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                rotation === deg
                  ? "bg-white text-[#2563EB] shadow-xs border border-[#E2E8F0]"
                  : "hover:bg-white/50"
              }`}
            >
              {deg}
              <NidSettingsT>{"\u00B0\r\n            "}</NidSettingsT>
            </button>
          ))}
        </div>
      </div>

      {/* Position on page */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-[#0F172A]/80 block">
          <NidSettingsT>{"Position on page\r\n        "}</NidSettingsT>
        </span>
        <div className="grid grid-cols-3 gap-1.5 bg-[#E2E8F0]/40 p-1 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#0F172A]/80">
          {(["top", "center", "bottom"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => setPosition(pos)}
              className={`py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                position === pos
                  ? "bg-white text-[#2563EB] shadow-xs border border-[#E2E8F0]"
                  : "hover:bg-white/50"
              }`}
            >
              <NidSettingsT>{pos}</NidSettingsT>
            </button>
          ))}
        </div>
      </div>

      {/* Copies */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-[#0F172A]/80 block">
          <NidSettingsT>{"Copies\r\n        "}</NidSettingsT>
        </span>
        <div className="grid grid-cols-4 gap-1 bg-[#E2E8F0]/40 p-1 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#0F172A]/80">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => setCopies(num)}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                copies === num
                  ? "bg-white text-[#2563EB] shadow-xs border border-[#E2E8F0]"
                  : "hover:bg-white/50"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Rounded corners */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-xs font-bold text-[#0F172A] block">
            <NidSettingsT>
              {"Rounded corners (14px)\r\n          "}
            </NidSettingsT>
          </span>
        </div>
        <button
          onClick={() => setRoundedCorners(!roundedCorners)}
          className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
            roundedCorners
              ? "bg-[#2563EB] justify-end"
              : "bg-[#E2E8F0] justify-start"
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-white shadow-md" />
        </button>
      </div>

      {/* Cleanup style Controls */}
      <div className="space-y-4 border-t border-[#E2E8F0] pt-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-[#0F172A]">
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
            className="text-xs text-[#2563EB] font-bold hover:underline cursor-pointer"
          >
            <NidSettingsT>{"Reset\r\n          "}</NidSettingsT>
          </button>
        </div>

        {/* Preset Grid */}
        <div className="bg-[#E2E8F0]/50 p-2 rounded-2xl grid grid-cols-2 gap-2">
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
                className={`py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-[#2563EB] shadow-xs border border-[#E2E8F0] font-semibold"
                    : "text-[#0F172A]/70 hover:bg-white/60"
                }`}
              >
                <Icon
                  size={16}
                  className={isActive ? "text-[#2563EB]" : "text-[#0F172A]/70"}
                />
                <span className="text-[11px] font-semibold text-center leading-tight">
                  <NidSettingsT>{preset.label}</NidSettingsT>
                </span>
              </button>
            );
          })}
        </div>

        {/* Fine tuning */}
        <div className="space-y-3 pt-1 border-t border-[#E2E8F0]">
          <span className="text-xs font-bold text-[#0F172A] block">
            <NidSettingsT>{"Fine tuning\r\n          "}</NidSettingsT>
          </span>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-[#0F172A]/80">
                <span>
                  <NidSettingsT>{"Remove shadows and stains"}</NidSettingsT>
                </span>
                <span className="w-4 h-4 rounded bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 flex items-center justify-center text-[10px] font-bold">
                  {shadowRemoval}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={shadowRemoval}
                onChange={(e) => setShadowRemoval(Number(e.target.value))}
                className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-[#0F172A]/80">
                <span>
                  <NidSettingsT>{"Increase blacks"}</NidSettingsT>
                </span>
                <span className="w-4 h-4 rounded bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 flex items-center justify-center text-[10px] font-bold">
                  {blackBoost}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={blackBoost}
                onChange={(e) => setBlackBoost(Number(e.target.value))}
                className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-[#0F172A]/80">
                <span>
                  <NidSettingsT>{"Colour intensity"}</NidSettingsT>
                </span>
                <span className="w-4 h-4 rounded bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 flex items-center justify-center text-[10px] font-bold">
                  {saturation}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-[#0F172A]/80">
                <span>
                  <NidSettingsT>{"Deepen text"}</NidSettingsT>
                </span>
                <span className="w-4 h-4 rounded bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 flex items-center justify-center text-[10px] font-bold">
                  {textDeepen}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={textDeepen}
                onChange={(e) => setTextDeepen(Number(e.target.value))}
                className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
              />
            </div>
          </div>
        </div>

        {/* Print Button (CTA using Accent Emerald Green) */}
        <button
          onClick={handlePrint}
          className="w-full py-2.5 bg-[#10B981] hover:bg-[#0d9668] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Printer size={14} />
          <span>
            <NidSettingsT>{"Print"}</NidSettingsT>
          </span>
        </button>
      </div>
    </div>
  );
}
