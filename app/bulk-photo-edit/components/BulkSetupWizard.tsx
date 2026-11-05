"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Hand, Layers, Lightbulb, Sparkles, X } from "lucide-react";
import { BulkT, useBulkPhotoText } from "./bulkPhotoI18n";
import { TOOL_PRESETS } from "./toolCatalog";
import type { ApplyMode, PhotoToolsMap, SelectedTools, ToolPreset } from "./types";

/**
 * Guided setup shown right after photos are added (same idea as the AI Editor's setup wizard).
 * Path 1 "Same for all": one plain question per tool group, applied to every photo.
 * Path 2 "Different for each": one screen per photo, so each photo gets exactly what it needs.
 * Nothing is applied until the user finishes, so closing the popup never changes their settings.
 */
export interface BulkWizardResult {
  mode: ApplyMode;
  common: SelectedTools;
  perPhoto: PhotoToolsMap;
}

export interface BulkWizardPhoto {
  id: string;
  preview: string;
  name: string;
}

interface BulkSetupWizardProps {
  open: boolean;
  photos: BulkWizardPhoto[];
  initial: BulkWizardResult;
  /** start=true: apply and start enhancing. start=false: only apply the choices. */
  onApply: (result: BulkWizardResult, options: { start: boolean }) => void;
  onClose: (dontShowAgain: boolean) => void;
}

type Bi = { en: string; bn: string };

/** One plain question per tool group, so nobody has to read a paragraph. */
const PRESET_TEXT: Record<string, { q: Bi; hint: Bi; when: Bi }> = {
  "face-enhance": {
    q: { en: "Want to fix anything on the face or skin?", bn: "মুখ বা ত্বকে কিছু ঠিক করতে চান?" },
    hint: { en: "Skin, spots, eyes, teeth — pick what you need (optional).", bn: "ত্বক, দাগ, চোখ, দাঁত – যা দরকার বেছে নিন (ঐচ্ছিক)।" },
    when: { en: "Choose this if the skin looks rough, there are spots, tired eyes or yellow teeth.", bn: "ত্বক অমসৃণ হলে, দাগ বা ব্রণ থাকলে, চোখ ক্লান্ত দেখালে বা দাঁত হলদেটে লাগলে বাছুন।" },
  },
  "photo-color": {
    q: { en: "Do the colors of the photo need fixing?", bn: "ছবির রং ঠিক করতে চান?" },
    hint: { en: "Dull, yellowish or bluish colors? (optional)", bn: "রং ফ্যাকাশে, হলদেটে বা নীলচে লাগলে বাছুন (ঐচ্ছিক)।" },
    when: { en: "Choose this if colors look faded, too warm or too cold, or the photo is black & white.", bn: "রং বিবর্ণ, বেশি হলদে বা নীলচে হলে, অথবা সাদা-কালো ছবিতে রং চাইলে বাছুন।" },
  },
  "photo-light": {
    q: { en: "Is the photo too dark or too bright?", bn: "ছবির আলো ঠিক করতে চান?" },
    hint: { en: "Fix dark faces, harsh light or hazy photos (optional).", bn: "অন্ধকার, বেশি উজ্জ্বল বা কুয়াশাচ্ছন্ন ছবি ঠিক করুন (ঐচ্ছিক)।" },
    when: { en: "Choose this if the face is in shadow, the photo is too dark/bright or looks foggy.", bn: "মুখে ছায়া পড়লে, ছবি বেশি অন্ধকার বা উজ্জ্বল হলে, অথবা ঝাপসা কুয়াশার মতো লাগলে বাছুন।" },
  },
  "dress-style": {
    q: { en: "Want to change anything on the clothes?", bn: "পোশাকে কিছু বদলাতে চান?" },
    hint: { en: "Change color, pattern or clean the outfit (optional).", bn: "পোশাকের রং, নকশা বদলান বা পরিষ্কার করুন (ঐচ্ছিক)।" },
    when: { en: "Choose this if the outfit color should change or the clothes look messy or stained.", bn: "পোশাকের রং বদলাতে চাইলে বা পোশাক এলোমেলো, দাগযুক্ত হলে বাছুন।" },
  },
  "photo-background": {
    q: { en: "Want to do something with the background?", bn: "ব্যাকগ্রাউন্ডে কিছু করতে চান?" },
    hint: { en: "Remove, replace, blur or clean the background (optional).", bn: "ব্যাকগ্রাউন্ড সরান, বদলান, ঝাপসা বা পরিষ্কার করুন (ঐচ্ছিক)।" },
    when: { en: "Choose this for a new background color/photo or to remove clutter behind the person.", bn: "নতুন ব্যাকগ্রাউন্ড চাইলে বা পেছনের ময়লা, অপ্রয়োজনীয় জিনিস সরাতে চাইলে বাছুন।" },
  },
  "old-photo-to-new": {
    q: { en: "Is the photo old or damaged?", bn: "ছবিটা কি পুরোনো বা নষ্ট হয়ে গেছে?" },
    hint: { en: "Only for old, torn, faded photos (optional).", bn: "শুধু পুরোনো, ছেঁড়া বা বিবর্ণ ছবির জন্য (ঐচ্ছিক)।" },
    when: { en: "Skip this for normal phone photos. Choose it only for scratched, faded or very old photos.", bn: "সাধারণ মোবাইলের ছবি হলে এড়িয়ে যান। শুধু দাগ পড়া, বিবর্ণ বা খুব পুরোনো ছবিতে বাছুন।" },
  },
  "studio-image": {
    q: { en: "Want a studio-photo look?", bn: "স্টুডিওতে তোলা ছবির মতো লুক চান?" },
    hint: { en: "Studio light and a professional finish (optional).", bn: "স্টুডিও আলো ও পেশাদার ফিনিশ (ঐচ্ছিক)।" },
    when: { en: "Choose this for a clean professional portrait look.", bn: "পরিচ্ছন্ন, পেশাদার প্রতিকৃতির লুক চাইলে বাছুন।" },
  },
};

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

const emptyTools = (): SelectedTools => Object.fromEntries(TOOL_PRESETS.map((preset) => [preset.name, []]));
const cloneTools = (tools: SelectedTools | undefined): SelectedTools => {
  const next = emptyTools();
  Object.entries(tools ?? {}).forEach(([name, list]) => {
    next[name] = [...list];
  });
  return next;
};
const countTools = (tools: SelectedTools | undefined) => Object.values(tools ?? {}).reduce((sum, list) => sum + list.length, 0);

export default function BulkSetupWizard({ open, photos, initial, onApply, onClose }: BulkSetupWizardProps) {
  const { locale } = useBulkPhotoText();
  const isBn = String(locale ?? "").toLowerCase().startsWith("bn");
  const L = (value: Bi) => (isBn ? value.bn : value.en);
  const s = (en: string, bn: string) => (isBn ? bn : en);
  const num = (n: number) => (isBn ? String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]) : String(n));

  const [mounted, setMounted] = useState(false);
  const [intro, setIntro] = useState(true);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<ApplyMode>("all");
  const [common, setCommon] = useState<SelectedTools>(emptyTools);
  const [perPhoto, setPerPhoto] = useState<PhotoToolsMap>({});
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => setMounted(true), []);

  // Every time the popup opens, start from the page's current choices.
  useEffect(() => {
    if (!open) return;
    setIntro(true);
    setStep(0);
    setMode(initial.mode);
    setCommon(cloneTools(initial.common));
    setPerPhoto(Object.fromEntries(Object.entries(initial.perPhoto).map(([id, tools]) => [id, cloneTools(tools)])));
    setOpenGroup(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || !mounted) return null;

  const eachMode = mode === "each";
  const stageCount = eachMode ? photos.length : TOOL_PRESETS.length;
  const confirmStep = stageCount;
  const isConfirm = !intro && step === confirmStep;
  const currentPreset: ToolPreset | null = !intro && !eachMode && step < TOOL_PRESETS.length ? TOOL_PRESETS[step] : null;
  const currentPhoto = !intro && eachMode && step < photos.length ? photos[step] : null;

  const toolsOf = (photoId: string): SelectedTools => perPhoto[photoId] ?? emptyTools();
  const photoCount = (photoId: string) => countTools(perPhoto[photoId]);
  const photosReady = photos.filter((photo) => photoCount(photo.id) > 0).length;
  const commonTotal = countTools(common);
  const canStart = eachMode ? photos.length > 0 && photosReady === photos.length : commonTotal > 0;
  const currentCount = currentPhoto ? photoCount(currentPhoto.id) : currentPreset ? (common[currentPreset.name] ?? []).length : 0;

  const toggleTool = (presetName: string, toolName: string, photoId?: string) => {
    const update = (current: SelectedTools): SelectedTools => {
      const selected = current[presetName] ?? [];
      return { ...current, [presetName]: selected.includes(toolName) ? selected.filter((name) => name !== toolName) : [...selected, toolName] };
    };
    if (eachMode && photoId) setPerPhoto((current) => ({ ...current, [photoId]: update(current[photoId] ?? emptyTools()) }));
    else setCommon((current) => update(current));
  };
  const setGroup = (preset: ToolPreset, all: boolean, photoId?: string) => {
    const names = all ? preset.tools.map((tool) => tool.name) : [];
    if (eachMode && photoId) setPerPhoto((current) => ({ ...current, [photoId]: { ...(current[photoId] ?? emptyTools()), [preset.name]: names } }));
    else setCommon((current) => ({ ...current, [preset.name]: names }));
  };
  const copyFromPrevious = () => {
    if (!currentPhoto || step === 0) return;
    const previous = photos[step - 1];
    setPerPhoto((current) => ({ ...current, [currentPhoto.id]: cloneTools(current[previous.id]) }));
  };
  const copyToAll = () => {
    if (!currentPhoto) return;
    const source = toolsOf(currentPhoto.id);
    setPerPhoto(Object.fromEntries(photos.map((photo) => [photo.id, cloneTools(source)])));
  };

  const result = (): BulkWizardResult => ({ mode, common, perPhoto });
  const goNext = () => setStep((current) => Math.min(current + 1, confirmStep));
  const goBack = () => {
    if (step === 0) {
      setIntro(true);
      return;
    }
    setStep((current) => current - 1);
  };
  const finish = (start: boolean) => onApply(result(), { start });
  const chooseMode = (next: ApplyMode) => {
    setMode(next);
    setStep(0);
    setOpenGroup(null);
    setIntro(false);
  };

  // ---------- header texts ----------
  let title: string;
  let hint: string;
  if (intro) {
    title = s("How do you want to start?", "কীভাবে শুরু করবেন?");
    hint = s("Pick whichever is easier for you.", "আপনার সুবিধামতো একটা বেছে নিন।");
  } else if (isConfirm) {
    title = s("Everything okay?", "সব ঠিক আছে?");
    hint = s("Check your choices, then start.", "নির্বাচন দেখে নিন, তারপর শুরু করুন।");
  } else if (currentPreset) {
    title = L(PRESET_TEXT[currentPreset.id]?.q ?? { en: currentPreset.name, bn: currentPreset.name });
    hint = L(PRESET_TEXT[currentPreset.id]?.hint ?? { en: "", bn: "" });
  } else {
    title = s(`Photo ${step + 1}: what should we do?`, `ছবি ${num(step + 1)}: কী করতে চান?`);
    hint = s("Open a group and tick what this photo needs.", "একটি বিভাগ খুলে এই ছবির জন্য যা দরকার টিক দিন।");
  }
  const progress = intro ? 0 : Math.round(((step + 1) / (confirmStep + 1)) * 100);

  // ---------- pieces ----------
  const renderToolGrid = (preset: ToolPreset, photoId?: string) => {
    const selected = (eachMode && photoId ? toolsOf(photoId) : common)[preset.name] ?? [];
    const allSelected = selected.length === preset.tools.length;
    return (
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-[#6B5A40]"><BulkT>{"Select any tools you want to apply."}</BulkT></p>
          <button type="button" onClick={() => setGroup(preset, !allSelected, photoId)} className="cursor-pointer rounded-lg px-2 py-1 text-[13px] font-bold text-[#B91C1C] transition hover:bg-[#FEE9E9]">
            <BulkT>{allSelected ? "Clear" : "Select all"}</BulkT>
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {preset.tools.map((tool) => {
            const checked = selected.includes(tool.name);
            return (
              <button key={tool.name} type="button" aria-pressed={checked} onClick={() => toggleTool(preset.name, tool.name, photoId)} className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3 text-left transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${checked ? "border-[#DC2626] bg-[#FEF1E0]" : "border-[#E3D6B8] bg-white/70 hover:border-[#DC2626]/50"}`}>
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${checked ? "border-[#DC2626] bg-[#DC2626] text-white" : "border-[#D8C9A6] bg-white text-transparent"}`}>
                  <Check size={15} strokeWidth={3.5} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[16px] font-bold leading-snug text-[#3B2F1E]">
                    <span className="shrink-0 text-[#DC2626]">{tool.icon}</span>
                    <BulkT>{tool.name}</BulkT>
                  </span>
                  <span className="mt-0.5 block text-[14px] leading-snug text-stone-600"><BulkT>{tool.description}</BulkT></span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderIntro = () => (
    <>
      <div className="mb-3 mt-1 rounded-2xl border-2 border-[#F59E0B] bg-[#FFF7E0] p-3 shadow-sm sm:p-4">
        <p className="mb-2 flex items-center gap-2 text-[16px] font-extrabold leading-snug text-[#92400E] sm:text-[19px]">
          <Lightbulb size={22} className="shrink-0" /> {s("Which one should you pick?", "কোনটা বেছে নেবেন? এক নজরে বুঝে নিন")}
        </p>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <p className="rounded-xl border border-[#059669]/40 bg-[#ECFDF5] px-3 py-2.5 text-[14px] leading-snug text-[#3B2F1E] sm:text-[16px]">
            <b className="text-[#065F46]">{s("All photos need the same fix?", "সব ছবিতে একই কাজ করাতে চান?")}</b>{" "}
            {s("Pick option 1. You answer a few simple questions once.", "তাহলে ১ নম্বর বেছে নিন। একবারই কয়েকটা সহজ প্রশ্নের উত্তর দিতে হবে।")}
          </p>
          <p className="rounded-xl border border-[#DC2626]/40 bg-[#FEF2F2] px-3 py-2.5 text-[14px] leading-snug text-[#3B2F1E] sm:text-[16px]">
            <b className="text-[#B91C1C]">{s("Each photo needs something different?", "প্রতিটি ছবিতে আলাদা আলাদা কাজ চান?")}</b>{" "}
            {s("Pick option 2. We go photo by photo.", "তাহলে ২ নম্বর বেছে নিন। একটা একটা করে ছবি ধরে কাজ হবে।")}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button type="button" onClick={() => chooseMode("all")} className="relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-4 border-[#059669] bg-[#ECFDF5] p-4 text-center shadow-md transition hover:-translate-y-0.5 hover:shadow-xl sm:p-6">
          <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#059669] text-[17px] font-extrabold text-white">{num(1)}</span>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#059669] text-white sm:h-16 sm:w-16"><Layers size={30} /></span>
          <span className="text-[19px] font-extrabold leading-tight text-[#065F46] sm:text-[22px]">{s("Same for all photos", "সব ছবিতে একই")}</span>
          <span className="text-[15px] leading-snug text-[#3B2F1E]">{s("Choose once. The same fixes are applied to every photo.", "একবার বেছে নিন। প্রতিটি ছবিতে একই কাজ হবে।")}</span>
          <span className="rounded-full bg-white/80 px-3 py-1 text-[13px] font-semibold text-[#065F46]">{s(`${TOOL_PRESETS.length} quick questions`, `${num(TOOL_PRESETS.length)}টা সহজ প্রশ্ন`)}</span>
          <span className="rounded-xl bg-[#059669] px-6 py-2.5 text-base font-extrabold text-white">{s("Do this", "এটাই করুন")}</span>
        </button>
        <button type="button" onClick={() => chooseMode("each")} className="relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-4 border-[#E3D6B8] bg-[#FBF6E8] p-4 text-center shadow-md transition hover:-translate-y-0.5 hover:border-[#DC2626] hover:shadow-xl sm:p-6">
          <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#DC2626] text-[17px] font-extrabold text-white">{num(2)}</span>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DC2626] text-white sm:h-16 sm:w-16"><Hand size={30} /></span>
          <span className="text-[19px] font-extrabold leading-tight text-[#3B2F1E] sm:text-[22px]">{s("Different for each photo", "প্রতিটি ছবিতে আলাদা")}</span>
          <span className="text-[15px] leading-snug text-[#3B2F1E]">{s("You see each photo and choose exactly what it needs.", "প্রতিটি ছবি দেখে ঠিক কী কী দরকার তা নিজে বেছে নিন।")}</span>
          <span className="rounded-full bg-[#F6D9A8] px-3 py-1 text-[13px] font-semibold text-[#3B2F1E]">{s(`${photos.length} photos, one by one`, `${num(photos.length)}টা ছবি, একটা একটা করে`)}</span>
          <span className="rounded-xl bg-[#DC2626] px-6 py-2.5 text-base font-extrabold text-white">{s("Step by step", "ধাপে ধাপে করব")}</span>
        </button>
      </div>
    </>
  );

  const renderAllStep = (preset: ToolPreset) => (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-2xl border border-[#E3D6B8] bg-[#F6EEDB] px-3 py-2.5">
        <span className="mt-0.5 shrink-0 text-[#DC2626]">{preset.icon}</span>
        <p className="text-[14px] leading-snug text-stone-700 sm:text-[15px]">{L(PRESET_TEXT[preset.id]?.when ?? { en: "", bn: "" })}</p>
      </div>
      {renderToolGrid(preset)}
    </div>
  );

  const renderEachStep = (photo: BulkWizardPhoto) => (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {step > 0 && (
          <button type="button" onClick={copyFromPrevious} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E3D6B8] bg-[#F3E9D2] px-3 py-2 text-[14px] font-bold text-[#5A4A32] transition hover:bg-[#E3D6B8]">
            <Copy size={15} /> {s("Same as previous photo", "আগের ছবির মতোই করুন")}
          </button>
        )}
        {photos.length > 1 && currentCount > 0 && (
          <button type="button" onClick={copyToAll} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E3D6B8] bg-[#F3E9D2] px-3 py-2 text-[14px] font-bold text-[#5A4A32] transition hover:bg-[#E3D6B8]">
            <Copy size={15} /> {s("Use this for all photos", "সব ছবিতে এটাই দিন")}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {TOOL_PRESETS.map((preset) => {
          const selected = toolsOf(photo.id)[preset.name] ?? [];
          const expanded = openGroup === preset.id;
          return (
            <div key={preset.id} className={`overflow-hidden rounded-2xl border-2 bg-white/70 transition ${expanded || selected.length > 0 ? "border-[#DC2626]/60" : "border-[#E3D6B8]"}`}>
              <button type="button" aria-expanded={expanded} onClick={() => setOpenGroup(expanded ? null : preset.id)} className={`flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-left transition ${expanded ? "bg-[#F6D9A8]/50" : "hover:bg-[#EFE3C8]/60"}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E3D6B8] bg-[#F6EEDB]">{preset.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-bold leading-snug text-[#3B2F1E]">{L(PRESET_TEXT[preset.id]?.q ?? { en: preset.name, bn: preset.name })}</span>
                  <span className="block truncate text-[13px] text-stone-500"><BulkT>{preset.name}</BulkT></span>
                </span>
                {selected.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-2.5 py-0.5 text-[13px] font-bold text-white"><Check size={12} strokeWidth={3} />{num(selected.length)}</span>
                )}
                <ChevronDown size={18} className={`shrink-0 text-stone-500 transition-transform ${expanded ? "rotate-180 text-[#DC2626]" : ""}`} />
              </button>
              {expanded && <div className="border-t border-[#E3D6B8] bg-[#F6EEDB]/60 p-3">{renderToolGrid(preset, photo.id)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderChips = (tools: SelectedTools) => {
    const chips = TOOL_PRESETS.flatMap((preset) => (tools[preset.name] ?? []).map((name) => ({ key: `${preset.id}-${name}`, name })));
    if (chips.length === 0) return <p className="text-[13px] font-semibold text-amber-700">{s("Nothing chosen yet", "এখনও কিছু বাছা হয়নি")}</p>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span key={chip.key} className="inline-flex items-center rounded-full bg-[#F6D9A8] px-2.5 py-1 text-[13px] font-semibold text-[#3B2F1E]"><BulkT>{chip.name}</BulkT></span>
        ))}
      </div>
    );
  };

  const renderConfirm = () => (
    <div className="space-y-3">
      {eachMode ? photos.map((photo, index) => (
        <div key={photo.id} className="flex items-start gap-3 rounded-xl border border-[#E3D6B8] bg-white/70 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.preview} alt="" draggable={false} className="h-16 w-14 shrink-0 rounded-lg border border-white object-cover shadow" />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[13px] text-stone-500">{s(`Photo ${index + 1}`, `ছবি ${num(index + 1)}`)}</p>
            {renderChips(toolsOf(photo.id))}
          </div>
          <button type="button" onClick={() => { setStep(index); }} className="shrink-0 cursor-pointer rounded-lg bg-[#F3E9D2] px-3 py-1.5 text-[13px] font-semibold text-[#5A4A32] hover:bg-[#E3D6B8]">{s("Change", "বদলান")}</button>
        </div>
      )) : TOOL_PRESETS.map((preset, index) => {
        const names = common[preset.name] ?? [];
        if (names.length === 0) return null;
        return (
          <div key={preset.id} className="flex items-start gap-3 rounded-xl border border-[#E3D6B8] bg-white/70 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E3D6B8] bg-[#F6EEDB]">{preset.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[14px] font-bold text-[#3B2F1E]"><BulkT>{preset.name}</BulkT></p>
              {renderChips({ [preset.name]: names })}
            </div>
            <button type="button" onClick={() => setStep(index)} className="shrink-0 cursor-pointer rounded-lg bg-[#F3E9D2] px-3 py-1.5 text-[13px] font-semibold text-[#5A4A32] hover:bg-[#E3D6B8]">{s("Change", "বদলান")}</button>
          </div>
        );
      })}
      {!eachMode && commonTotal === 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[15px] font-semibold text-amber-800">{s("You have not chosen any tool yet. Go back and pick at least one.", "এখনও কোনো টুল বাছা হয়নি। পেছনে গিয়ে অন্তত একটি বেছে নিন।")}</p>
      )}
      {eachMode && !canStart && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[15px] font-semibold text-amber-800">{s("Some photos have no tool yet. Tap “Change” on those photos.", "কিছু ছবির জন্য এখনও টুল বাছা হয়নি। ওই ছবিগুলোর “বদলান” চাপুন।")}</p>
      )}
      {canStart && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[15px] font-semibold text-emerald-800">
          {eachMode
            ? s(`${photos.length} photos are ready, each with its own tools.`, `${num(photos.length)}টি ছবি প্রস্তুত, প্রতিটিতে নিজস্ব টুল বাছা আছে।`)
            : s(`${commonTotal} tools will be applied to all ${photos.length} photos.`, `${num(photos.length)}টি ছবিতেই ${num(commonTotal)}টি টুল প্রয়োগ হবে।`)}
        </p>
      )}
    </div>
  );

  // Left side: which photo(s) are being edited + the user's choices so far.
  const sidebarSummary = eachMode
    ? photos.map((photo, index) => ({ key: photo.id, label: s(`Photo ${index + 1}`, `ছবি ${num(index + 1)}`), count: photoCount(photo.id), active: !intro && !isConfirm && index === step, onClick: () => { setIntro(false); setStep(index); } }))
    : TOOL_PRESETS.map((preset, index) => ({ key: preset.id, label: isBn ? preset.name : preset.name, count: (common[preset.name] ?? []).length, active: !intro && !isConfirm && index === step, onClick: () => { setIntro(false); setStep(index); } }));

  const modal = (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={s("Bulk photo setup guide", "একসঙ্গে ছবি সম্পাদনার গাইড")}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose(dontShowAgain);
      }}
    >
      <div className="page-font flex h-[100dvh] w-full max-w-[1000px] select-none flex-col overflow-hidden rounded-t-2xl bg-[#FBF6E8] shadow-2xl sm:h-auto sm:max-h-[96dvh] sm:rounded-2xl">
        {/* Header + progress */}
        <div className="shrink-0 border-b border-[#E3D6B8] px-3 pt-2 sm:px-6 sm:pt-3">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 sm:gap-y-2">
            <div className="order-2 flex w-full min-w-0 items-start gap-3 sm:order-none sm:w-auto sm:flex-1">
              <span className="mt-0.5 hidden rounded-xl bg-[#D42020] p-2 text-white sm:block"><Camera size={20} /></span>
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold leading-snug text-[#3B2F1E] sm:text-2xl">{title}</h2>
                <p className="text-[13px] leading-snug text-stone-600 sm:text-[15px]">{hint}</p>
              </div>
            </div>
            <div className="order-1 flex w-full items-center justify-end gap-2 sm:order-none sm:w-auto sm:shrink-0">
              {!intro && (
                <span className="order-first mr-auto whitespace-nowrap rounded-full bg-[#DC2626] px-3 py-1.5 text-[13px] font-extrabold tabular-nums text-white sm:order-none sm:mr-0 sm:text-sm">
                  {s(`Step ${step + 1} / ${confirmStep + 1}`, `ধাপ ${num(step + 1)} / ${num(confirmStep + 1)}`)}
                </span>
              )}
              <button type="button" onClick={() => onClose(dontShowAgain)} className="cursor-pointer rounded-lg p-2 text-stone-500 hover:bg-[#EFE3C8]" aria-label={s("Close", "বন্ধ করুন")}><X size={20} /></button>
            </div>
          </div>
          {!intro ? (
            <>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E3D6B8] sm:mt-3 sm:h-2.5">
                <div className="h-full rounded-full bg-gradient-to-r from-[#059669] to-[#34D399] transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
              </div>
              <div className="scroll flex items-center gap-1.5 overflow-x-auto pb-2 pt-2 sm:pb-3 sm:pt-3">
                {Array.from({ length: confirmStep + 1 }, (_, i) => {
                  const done = i < step;
                  const active = i === step;
                  const last = i === confirmStep;
                  return (
                    <React.Fragment key={i}>
                      {i > 0 && <span className={`h-1 min-w-3 flex-1 rounded-full ${i <= step ? "bg-[#059669]" : "bg-[#E3D6B8]"}`} />}
                      <button type="button" disabled={!done} onClick={() => setStep(i)} aria-label={`${i + 1}`} className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-[15px] font-extrabold shadow-sm transition sm:h-10 sm:w-10 ${done ? "cursor-pointer bg-[#059669] text-white" : active ? "bg-[#DC2626] text-white ring-4 ring-[#DC2626]/25" : "bg-[#E3D6B8] text-stone-500"}`}>
                        {done ? <Check size={19} strokeWidth={3.5} /> : last ? <Sparkles size={17} /> : num(i + 1)}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          ) : <div className="pb-2 sm:pb-3" />}
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className={`${intro ? "hidden md:flex" : "flex"} shrink-0 items-center gap-2.5 border-b border-[#E3D6B8] bg-[#F3E9D2] px-3 py-2 md:w-[250px] md:flex-col md:items-stretch md:gap-3 md:border-b-0 md:border-r md:p-4`}>
            {currentPhoto ? (
              <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg border-2 border-white bg-white shadow-md md:aspect-[45/55] md:h-auto md:w-full md:rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentPhoto.preview} alt="" draggable={false} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="hidden shrink-0 grid-cols-3 gap-1 md:grid">
                {photos.slice(0, 6).map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={photo.id} src={photo.preview} alt="" draggable={false} className="aspect-[45/55] w-full rounded-md border border-white object-cover shadow-sm" />
                ))}
              </div>
            )}
            <div className="min-w-0 flex-1 md:flex-none">
              <p className="mb-1.5 hidden text-[11px] font-bold uppercase tracking-wide text-stone-500 md:block">{s("Your choices", "আপনার নির্বাচন")}</p>
              <div className="scroll flex gap-1.5 overflow-x-auto pb-0.5 md:block md:max-h-[300px] md:space-y-1.5 md:overflow-y-auto md:overflow-x-visible md:pb-0">
                {sidebarSummary.map((row) => (
                  <button key={row.key} type="button" onClick={row.onClick} className={`flex w-[148px] shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-2 py-1 text-left md:w-full md:px-2.5 md:py-1.5 ${row.active ? "border-[#DC2626] bg-white" : "border-[#E3D6B8] bg-[#FBF6E8]"}`}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[12px] font-extrabold ${row.count > 0 ? "bg-[#DC2626] text-white" : "bg-[#E3D6B8] text-stone-500"}`}>{row.count > 0 ? num(row.count) : "–"}</span>
                    <span className={`min-w-0 flex-1 truncate text-[12.5px] font-semibold ${row.count > 0 ? "text-[#3B2F1E]" : "text-stone-500"}`}>{eachMode ? row.label : <BulkT>{row.label}</BulkT>}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5">
            {intro ? renderIntro() : isConfirm ? renderConfirm() : currentPreset ? renderAllStep(currentPreset) : currentPhoto ? renderEachStep(currentPhoto) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col gap-2 border-t border-[#E3D6B8] bg-[#F7EFD9] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3">
          <label className="flex cursor-pointer items-center gap-2 text-[11px] leading-tight text-stone-600 sm:text-xs">
            <input type="checkbox" checked={dontShowAgain} onChange={(event) => setDontShowAgain(event.target.checked)} className="h-4 w-4 accent-[#DC2626]" />
            {s("Don’t show this guide again (I will choose myself)", "এই গাইড আর দেখাবেন না (আমি নিজে সিলেক্ট করব)")}
          </label>

          <div className={`flex flex-wrap items-center justify-end gap-2 ${intro ? "hidden" : ""}`}>
            <button type="button" onClick={goBack} className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xl bg-[#F3E9D2] px-3 py-3 text-[14px] font-bold text-[#5A4A32] hover:bg-[#E3D6B8] sm:px-4 sm:text-[15px]">
              <ChevronLeft size={16} /> {step === 0 ? s("Back to start", "শুরুতে ফিরুন") : s("Back", "পেছনে")}
            </button>

            {!isConfirm ? (
              <>
                {canStart && (
                  <button type="button" onClick={() => finish(true)} className="rounded-lg px-3 py-2 text-center text-[13px] font-semibold text-stone-500 underline underline-offset-2 hover:text-[#DC2626] max-sm:order-first max-sm:w-full sm:py-2.5 sm:text-sm cursor-pointer">
                    {s("Skip the rest and start now", "বাকি সব বাদ দিয়ে এখনই শুরু করুন")}
                  </button>
                )}
                <button type="button" onClick={goNext} className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#059669] px-4 py-3 text-base font-extrabold text-white shadow-lg hover:bg-[#047857] sm:flex-none sm:px-8">
                  {!eachMode && currentCount === 0 ? s("No, not needed", "না, দরকার নেই") : s("Next", "পরবর্তী")} <ChevronRight size={20} />
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => finish(false)} className="rounded-lg px-3 py-2 text-center text-[13px] font-semibold text-stone-500 underline underline-offset-2 hover:text-[#059669] max-sm:order-first max-sm:w-full sm:py-2.5 sm:text-sm cursor-pointer">
                  {s("Only apply my choices", "শুধু নির্বাচন প্রয়োগ করুন")}
                </button>
                <button type="button" disabled={!canStart} onClick={() => finish(true)} className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#D42020] px-4 py-3 text-base font-extrabold text-white shadow-lg hover:bg-[#AE1717] disabled:cursor-not-allowed disabled:opacity-55 sm:flex-none sm:px-8">
                  <Sparkles size={20} /> {s(`Enhance ${photos.length} photos`, `${num(photos.length)}টি ছবিতে শুরু করুন`)}
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
