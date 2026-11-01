"use client";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Check, ChevronLeft, ChevronRight, Ban, Image as ImageIcon, Palette, Ruler, Shirt, SlidersHorizontal, X } from "lucide-react";
import { useAiEditorText } from "./aiEditorI18n";
import PhotoSizeIcon from "./PhotoSizeIcon";
import GuideIcon from "./GuideIcon";
import { CLOTHING_NAMES } from "./clothingStyles";
import { EDITING_GUIDE_CATEGORIES, EDITING_GUIDES, LIPSTICK_COLORS, LIPSTICK_COLOR_PREFIX } from "./editingGuides";
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

const BASE_STEPS = [
  { title: "ছবির ধরন", hint: "এই ছবিটি কোন কাজের জন্য বানাতে চান?", stage: 0 },
  { title: "ব্যাকগ্রাউন্ড", hint: "ছবির পেছনে কোন রং চান?", stage: 1 },
  { title: "পোশাক", hint: "কোন ধরনের পোশাক পরাতে চান?", stage: 2 },
];
/** One wizard step per editing category (hair style, hair colour, eyebrows, ...), in head-to-chin order. */
const GUIDE_STEP_CATEGORIES = EDITING_GUIDE_CATEGORIES.filter(
  (c) => c.id !== "all" && EDITING_GUIDES.some((g) => g.category === c.id),
);
const STAGES = ["ছবির ধরন", "ব্যাকগ্রাউন্ড", "পোশাক", "চেহারার পরিবর্তন", "নিশ্চিত করুন"];

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

  useEffect(() => setMounted(true), []);

  // Every time the popup opens, start from the page's current settings.
  useEffect(() => {
    if (open) {
      setStep(0);
      setDraft(initial);
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
  const guideEnd = guideStart + GUIDE_STEP_CATEGORIES.length; // index of the confirm step
  const currentCat = step >= guideStart && step < guideEnd ? GUIDE_STEP_CATEGORIES[step - guideStart] : null;
  const categoryGuides = useMemo(
    () => (currentCat ? EDITING_GUIDES.filter((g) => g.category === currentCat.id) : []),
    [currentCat],
  );

  if (!open || !mounted) return null;

  const isDual = draft.size === "Dual";
  const lastStep = guideEnd;
  const totalSteps = lastStep + 1;
  const progress = ((step + 1) / totalSteps) * 100;
  const stageOf = (i: number) => (i < guideStart ? i : i < guideEnd ? 3 : 4);
  const stage = stageOf(step);
  const currentStepInfo = currentCat
    ? {
        title: t(currentCat.label),
        hint: "এই অংশে কিছু বদলাতে চাইলে বাছাই করুন, না চাইলে \"এড়িয়ে যান\" চাপুন।",
      }
    : step === lastStep
      ? { title: "নিশ্চিত করুন", hint: "সব ঠিক থাকলে ছবি তৈরি শুরু করুন।" }
      : BASE_STEPS[step];
  const selectedInCat = (catId: string) =>
    draft.guides.filter((g) => EDITING_GUIDES.find((e) => e.label === g)?.category === catId).length;

  const update = (patch: Partial<WizardResult>) => setDraft((d) => ({ ...d, ...patch }));
  const toggleGuide = (label: string) =>
    setDraft((d) => {
      if (!d.guides.includes(label)) return { ...d, guides: [...d.guides, label] };
      const removed = d.guides.filter((g) => g !== label);
      // A lipstick colour means nothing without the lipstick itself.
      return { ...d, guides: label === "Lipstick" ? removed.filter((g) => !g.startsWith(LIPSTICK_COLOR_PREFIX)) : removed };
    });
  const lipstickColorName = draft.guides.find((g) => g.startsWith(LIPSTICK_COLOR_PREFIX))?.slice(LIPSTICK_COLOR_PREFIX.length).trim() ?? "";
  const setLipstickColor = (name: string) =>
    setDraft((d) => ({
      ...d,
      guides: [...d.guides.filter((g) => !g.startsWith(LIPSTICK_COLOR_PREFIX)), ...(name ? [`${LIPSTICK_COLOR_PREFIX} ${name}`] : [])],
    }));
  const guideCount = draft.guides.filter((g) => !g.startsWith(LIPSTICK_COLOR_PREFIX)).length;

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
    <span className="absolute top-1.5 right-1.5 bg-[#DC2626] text-white rounded-full p-0.5 shadow z-10">
      <Check size={11} strokeWidth={3} />
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
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
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
                  <span className="text-[11px] font-semibold leading-tight text-center line-clamp-1 w-full">{t(name)}</span>
                </button>
              );
            })}
          </div>

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
                      className={`w-8 h-8 rounded-full border border-stone-400/40 shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
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

    if (currentCat) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-stone-500">
              {bn(step - guideStart + 1)}/{bn(GUIDE_STEP_CATEGORIES.length)} · {t(currentCat.label)}
            </span>
            <span className="rounded-full bg-[#DC2626] px-3 py-1 text-xs font-bold text-white whitespace-nowrap">
              মোট {bn(guideCount)}টি বাছাই করা হয়েছে
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categoryGuides.map((g) => {
              const on = draft.guides.includes(g.label);
              return (
                <button
                  key={g.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleGuide(g.label)}
                  className={`${optionBase} ${on ? optionOn : optionOff} flex items-center gap-3 px-3 py-3 text-left`}
                >
                  {on && <CheckBadge />}
                  <span className="shrink-0 text-[#DC2626]">
                    <GuideIcon label={g.label} size={30} />
                  </span>
                  <span className="text-[14px] font-semibold leading-tight pr-4">{t(g.label)}</span>
                </button>
              );
            })}
          </div>

          {currentCat.id === "lips-teeth" && draft.guides.includes("Lipstick") && (
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
    }

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
            {draft.guides.filter((g) => !g.startsWith(LIPSTICK_COLOR_PREFIX)).map((g) => (
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

  const modal = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-2 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="ছবি সেটআপ গাইড"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose(dontShowAgain);
      }}
    >
      <div className="flex max-h-[96dvh] w-full max-w-[1000px] flex-col overflow-hidden rounded-2xl bg-[#FBF6E8] shadow-2xl ai-editor-font select-none">
        {/* Header + progress */}
        <div className="shrink-0 border-b border-[#E3D6B8] px-4 pt-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="rounded-lg bg-[#D42020] p-1.5 text-white">
                <Camera size={16} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-[#3B2F1E] leading-tight truncate">
                  {currentStepInfo.title}
                </h2>
                <p className="text-[12px] sm:text-[13px] text-stone-500 leading-tight">{currentStepInfo.hint}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-[#DC2626] tabular-nums">
                ধাপ {bn(step + 1)}/{bn(totalSteps)}
              </span>
              <button
                type="button"
                onClick={() => onClose(dontShowAgain)}
                className="rounded-lg p-1.5 text-stone-500 hover:bg-[#EFE3C8] cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#E3D6B8]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#DC2626] to-[#F97316] transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex gap-1 pb-2 pt-2">
            {STAGES.map((label, i) => {
              const done = i < stage;
              const active = i === stage;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (!done) return;
                    setStep(i < 3 ? i : i === 3 ? guideStart : lastStep);
                  }}
                  className={`flex-1 truncate text-center text-[10.5px] sm:text-[11.5px] font-semibold transition ${
                    active ? "text-[#DC2626]" : done ? "text-[#059669] cursor-pointer" : "text-stone-400"
                  }`}
                >
                  {done ? "✓ " : ""}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Photo preview: always visible so the user sees which photo they are editing */}
          <div className="shrink-0 border-b md:border-b-0 md:border-r border-[#E3D6B8] bg-[#F3E9D2] p-3 md:w-[250px] md:p-4 flex md:flex-col items-center gap-3">
            <div className="h-24 w-[76px] md:h-auto md:w-full md:aspect-[45/55] shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-md bg-white">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="আপনার ছবি" draggable={false} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 md:flex-none md:w-full">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">আপনার নির্বাচন</p>
              <div className="space-y-1.5">
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
                  <div key={label} className="flex items-center gap-2.5 rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2.5 py-1.5">
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

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{renderStep()}</div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex flex-col gap-2 border-t border-[#E3D6B8] bg-[#F7EFD9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 accent-[#DC2626]"
            />
            এই গাইড আর দেখাবেন না (আমি নিজে সিলেক্ট করব)
          </label>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 rounded-lg bg-[#F3E9D2] px-4 py-2.5 text-sm font-semibold text-[#5A4A32] hover:bg-[#E3D6B8] cursor-pointer"
              >
                <ChevronLeft size={16} /> পেছনে
              </button>
            )}

            {step < lastStep ? (
              <>
                {currentCat && (
                  <button
                    type="button"
                    onClick={() => setStep(lastStep)}
                    className="rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-500 hover:text-[#DC2626] cursor-pointer"
                  >
                    বাকিগুলো এড়িয়ে শেষ করুন
                  </button>
                )}
                {step > 0 && !isDual && (
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 1) update({ bg: -1 });
                      if (step === 2) update({ clothing: -1 });
                      goNext();
                    }}
                    className="rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-500 hover:text-[#DC2626] cursor-pointer"
                  >
                    এড়িয়ে যান
                  </button>
                )}
                <button
                  type="button"
                  onClick={goNext}
                  className="flex items-center gap-1.5 rounded-lg bg-[#059669] px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-[#047857] cursor-pointer"
                >
                  {step === 0 && isDual ? "ঠিক আছে" : "পরবর্তী"} <ChevronRight size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onApply(draft, { generate: false })}
                  className="rounded-lg border border-[#059669] px-4 py-2.5 text-sm font-semibold text-[#059669] hover:bg-[#059669]/10 cursor-pointer"
                >
                  শুধু সেটিংস প্রয়োগ করুন
                </button>
                <button
                  type="button"
                  onClick={() => onApply(draft, { generate: true })}
                  className="flex items-center gap-2 rounded-lg bg-[#D42020] px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-[#AE1717] cursor-pointer"
                >
                  <ImageIcon size={16} /> ছবি তৈরি শুরু করুন
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
