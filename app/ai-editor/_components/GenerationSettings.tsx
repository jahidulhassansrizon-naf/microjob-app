"use client";
import { AiT, useAiEditorText } from "./aiEditorI18n";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  RefreshCw,
  Sparkles,
  Check,
  Palette,
  X,
  ImageIcon,
  Loader2,
  Ban,
  Search,
} from "lucide-react";
import { EDITING_GUIDE_CATEGORIES, EDITING_GUIDES } from "./editingGuides";
import GuideIcon from "./GuideIcon";
import { CLOTHING_NAMES } from "./clothingStyles";
export interface PhotoSizeOption {
  id: string;
  label: string;
  tooltip?: string;
}
export interface VisaSizeOption {
  label: string;
}
export interface BgColorOption {
  type?: string;
  className?: string;
  value?: string;
}
export interface GenerationSettingsProps {
  photoSizes?: PhotoSizeOption[];
  selectedSize?: string;
  handleSizeClick?: (id: string) => void;
  showVisaPopup?: boolean;
  setShowVisaPopup?: (show: boolean) => void;
  visaSizesList?: VisaSizeOption[];
  selectedVisaSize?: string;
  setSelectedVisaSize?: (size: string) => void;
  setSelectedSize?: (size: string) => void;
  isDualMode?: boolean;
  exitDualMode?: (nextSize?: string) => void;
  backgroundColors?: BgColorOption[];
  selectedBg?: number;
  setSelectedBg?: (bg: number) => void;
  setShowColorPicker?: React.Dispatch<React.SetStateAction<boolean>>;
  showColorPicker?: boolean;
  customBgColor?: string;
  setCustomBgColor?: (color: string) => void;
  selectedClothing?: number;
  setSelectedClothing?: (clothing: number) => void;
  selectedClothingColor?: string;
  setSelectedClothingColor?: (color: string) => void;
  leftClothing?: number;
  setLeftClothing?: (clothing: number) => void;
  rightClothing?: number;
  setRightClothing?: (clothing: number) => void;
  colorPickerRef?: React.RefObject<HTMLDivElement | null>;
  visaPopupRef?: React.RefObject<HTMLDivElement | null>;
  onGenerate?: () => void;
  isGenerating?: boolean;
  onEditingGuidesChange?: (guides: string[]) => void;
  clearCustomInstructionSignal?: number;
  onResetSettings?: () => void;
}
const QUICK_EDITING_GUIDES = [
  "Glow & Makeup",
  "Smooth Skin",
  "Brighten Image",
  "Studio Lighting",
  "Straighten Head",
  "Keep Marks",
  "Lipstick",
  "Restore Old Photo",
];
const CLOTHING_COLORS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#1E1E1E" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#22C55E" },
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Brown", hex: "#78350F" },
  { name: "Yellow", hex: "#FACC15" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Orange", hex: "#F97316" },
  { name: "Maroon", hex: "#881337" },
  { name: "Teal", hex: "#0D9488" },
  { name: "Sky Blue", hex: "#0EA5E9" },
  { name: "Olive", hex: "#65A30D" },
  { name: "Beige", hex: "#E5E7EB" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Magenta", hex: "#C026D3" },
  { name: "Cyan", hex: "#06B6D4" },
];
const RECOLOR_PALETTE: Record<number, string[]> = {
  14: ["#8FAFD6", "#BFD4EE"],
  15: ["#0A0A0F", "#1B1B22"],
  16: ["#374151", "#4B5563"],
  17: ["#1F2937", "#374151"],
  18: ["#4B5563", "#6B7280"],
  19: ["#5B2323", "#7C3A3A"],
  20: ["#6B563D", "#8B7355"],
  21: ["#334155", "#475569"],
  22: ["#3F5F94", "#5B7DB1"],
  23: ["#18181B", "#27272A"],
  24: ["#36402A", "#4D5A3A"],
  25: ["#A88A5E", "#C9A87C"],
  26: ["#27272A", "#3F3F46"],
  27: ["#E39BB4", "#F3C4D4"],
  28: ["#CBD5E1"],
  29: ["#0F766E", "#14B8A6"],
  30: ["#CBD5E1"],
  31: ["#0F2744", "#1E3A5F"],
  32: ["#111A33", "#1E2A4A"],
  33: ["#7DD3FC", "#BAE6FD"],
  34: ["#172554", "#1E3A8A"],
  35: ["#111827", "#1F2937"],
  36: ["#5A1220", "#7C1D2E"],
  37: ["#D9C79F", "#F5E9D0"],
  38: ["#4B5563", "#6B7280"],
  39: ["#5F9276", "#8FB8A0"],
  40: ["#1F3547", "#2F4B63"],
  41: ["#1F6B6B", "#2E8B8B"],
  42: ["#8E1244", "#C2185B"],
  43: ["#5B21B6", "#7C3AED"],
  44: ["#111111", "#1B1B1B"],
  45: ["#94A3B8", "#64748B"],
  46: ["#D1D5DB"],
  47: ["#7F1D1D", "#B91C1C"],
  48: ["#EC4899", "#F9A8D4"],
  49: ["#991B1B", "#DC2626"],
  50: ["#F59E0B", "#FDE68A"],
  51: ["#D6C39A", "#F3E8D0"],
  52: ["#0D9488", "#115E59"],
  53: ["#9A3412", "#EA580C"],
  0: [
    "#A0B7D8",
    "#6F86AE",
    "#EEEEEE",
    "#ADC2E6",
    "#F4F4F4",
    "#C5D4F3",
    "#F6F6F6",
    "#FBFBFB",
    "#A5BEEA",
    "#DDE8FB",
  ],
  1: ["#E53935"],
  2: [
    "#A0B7D8",
    "#6F86AE",
    "#171D2D",
    "#243056",
    "#ADC2E6",
    "#262D3F",
    "#161D33",
  ],
  3: [
    "#A0B7D8",
    "#6F86AE",
    "#171D2D",
    "#243056",
    "#ADC2E6",
    "#0D1426",
    "#161D33",
    "#272F49",
    "#B7CDED",
    "#9AB6D8",
    "#C7D8FF",
    "#97AED3",
    "#AABDE2",
    "#DEE9FF",
    "#C4D5F7",
  ],
  4: ["#6F0D0C", "#951C1E", "#1B0B0C"],
  5: [
    "#121212",
    "#8D0307",
    "#0F0F0E",
    "#8C0005",
    "#0A0B0A",
    "#A23034",
    "#A63B3E",
    "#8E050A",
    "#0A0A0A",
    "#A83D41",
    "#131311",
    "#080806",
    "#930F14",
    "#050505",
    "#050605",
    "#A12E32",
    "#040403",
    "#A43639",
    "#131211",
    "#070706",
  ],
  6: ["#EAEAEA", "#D6D6D6"],
  7: ["#6F0D0C", "#951C1E"],
  8: ["#243056", "#3B5BDB"],
  9: ["#AED3FF", "#91C2F2", "#1A5B87", "#3776AA", "#D4ECFF", "#2E81AF"],
  10: ["#444A51", "#383D44", "#1C222B", "#080C14", "#20252B", "#DAE1E5"],
  11: ["#B969FF", "#5C5CFF", "#CB83FF"],
  12: ["#3131DB", "#3B3BEA", "#5C5CFF", "#4E4EF9"],
  13: [
    "#A7A9AB",
    "#3776AA",
    "#2F3033",
    "#AED3FF",
    "#134B70",
    "#D8D8D8",
    "#6FA6DD",
  ],
};
const rawSvgCache = new Map<number, string>();
const recoloredSvgCache = new Map<string, string>();
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
function hexToRgb(hex: string) {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}
function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) =>
    Math.round(clamp(value, 0, 255))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  if (delta !== 0) {
    switch (max) {
      case r:
        h = 60 * (((g - b) / delta) % 6);
        break;
      case g:
        h = 60 * ((b - r) / delta + 2);
        break;
      default:
        h = 60 * ((r - g) / delta + 4);
        break;
    }
  }
  if (h < 0) h += 360;
  return { h, s, l };
}
function hslToRgb(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  return {
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255,
  };
}
function recolorHex(sourceHex: string, targetHex: string) {
  const source = hexToRgb(sourceHex);
  const target = hexToRgb(targetHex);
  const sourceHsl = rgbToHsl(source.r, source.g, source.b);
  const targetHsl = rgbToHsl(target.r, target.g, target.b);
  const saturation = targetHsl.s === 0 ? 0 : clamp(targetHsl.s * 0.96, 0, 1);
  const rgb = hslToRgb(targetHsl.h, saturation, clamp(sourceHsl.l, 0.08, 0.97));
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}
function recolorSvgMarkup(
  svg: string,
  clothingIndex: number,
  targetColor: string,
) {
  const palette = RECOLOR_PALETTE[clothingIndex] ?? [];
  let result = svg;
  for (const sourceColor of palette) {
    const replacement = recolorHex(sourceColor, targetColor);
    const safeSource = sourceColor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(safeSource, "gi"), replacement);
  }
  return result;
}
const MAX_RECOLORED_SVG_CACHE_ENTRIES = 24;
function svgToObjectUrl(svg: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  return URL.createObjectURL(blob);
}
async function getRecoloredSvgUrl(clothingIndex: number, targetColor: string) {
  const cacheKey = `${clothingIndex}:${targetColor.toUpperCase()}`;
  const cachedUrl = recoloredSvgCache.get(cacheKey);
  if (cachedUrl) {
    // Refresh insertion order so this small cache behaves like an LRU cache.
    recoloredSvgCache.delete(cacheKey);
    recoloredSvgCache.set(cacheKey, cachedUrl);
    return cachedUrl;
  }
  let rawSvg = rawSvgCache.get(clothingIndex);
  if (!rawSvg) {
    const response = await fetch(`/icons/clothing-${clothingIndex + 1}.svg`, {
      cache: "force-cache",
    });
    if (!response.ok) {
      throw new Error(`Could not load clothing-${clothingIndex + 1}.svg`);
    }
    rawSvg = await response.text();
    rawSvgCache.set(clothingIndex, rawSvg);
  }
  const recolored = recolorSvgMarkup(rawSvg, clothingIndex, targetColor);
  const objectUrl = svgToObjectUrl(recolored);
  if (recoloredSvgCache.size >= MAX_RECOLORED_SVG_CACHE_ENTRIES) {
    const oldestEntry = recoloredSvgCache.entries().next().value;
    if (oldestEntry) {
      const [oldestKey, oldestUrl] = oldestEntry;
      recoloredSvgCache.delete(oldestKey);
      URL.revokeObjectURL(oldestUrl);
    }
  }
  recoloredSvgCache.set(cacheKey, objectUrl);
  return objectUrl;
}
function RawSvgClothingPreview({
  index,
  selected,
  color,
  alt,
}: {
  index: number;
  selected: boolean;
  color?: string;
  alt: string;
}) {
  const originalSrc = `/icons/clothing-${index + 1}.svg`;
  const [displaySrc, setDisplaySrc] = useState(originalSrc);
  const [isReady, setIsReady] = useState(!selected);
  useEffect(() => {
    let cancelled = false;
    if (!selected || !color) {
      setDisplaySrc(originalSrc);
      setIsReady(true);
      return;
    }
    setIsReady(false);
    getRecoloredSvgUrl(index, color)
      .then((url) => {
        if (!cancelled) {
          setDisplaySrc(url);
          setIsReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDisplaySrc(originalSrc);
          setIsReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [index, originalSrc, selected, color]);
  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg bg-slate-50">
      <img
        src={displaySrc}
        alt={alt}
        className={`w-full h-full object-cover rounded-lg scale-105 transition-opacity duration-150 ${isReady ? "opacity-100" : "opacity-80"}`}
      />
    </div>
  );
}
export default function GenerationSettings({
  photoSizes = [],
  selectedSize = "",
  handleSizeClick = () => {},
  showVisaPopup = false,
  setShowVisaPopup = () => {},
  visaSizesList = [],
  selectedVisaSize = "",
  setSelectedVisaSize = () => {},
  setSelectedSize = () => {},
  isDualMode = false,
  exitDualMode = () => {},
  backgroundColors = [],
  selectedBg = 0,
  setSelectedBg = () => {},
  setShowColorPicker = () => {},
  showColorPicker = false,
  customBgColor = "#FFFFFF",
  setCustomBgColor = () => {},
  selectedClothing = 0,
  setSelectedClothing = () => {},
  selectedClothingColor = "#EF4444",
  setSelectedClothingColor,
  leftClothing = 0,
  setLeftClothing = () => {},
  rightClothing = 0,
  setRightClothing = () => {},
  colorPickerRef,
  visaPopupRef,
  onGenerate = () => {},
  isGenerating = false,
  onEditingGuidesChange,
  clearCustomInstructionSignal = 0,
  onResetSettings,
}: GenerationSettingsProps) {
  const { t } = useAiEditorText();
  const [showClothingColorPicker, setShowClothingColorPicker] = useState(false);
  const [internalClothingColor, setInternalClothingColor] = useState("#EF4444");
  const [activeGuides, setActiveGuides] = useState<string[]>([]);
  const [showEditingGuideLibrary, setShowEditingGuideLibrary] = useState(false);
  const [guideSearch, setGuideSearch] = useState("");
  const [guideCategory, setGuideCategory] = useState<string>("all");
  const filteredEditingGuides = useMemo(() => {
    const query = guideSearch.trim().toLocaleLowerCase();
    return EDITING_GUIDES.filter((guide) => {
      const category = EDITING_GUIDE_CATEGORIES.find(
        (entry) => entry.id === guide.category,
      );
      const matchesCategory =
        guideCategory === "all" || guide.category === guideCategory;
      const searchableText = [
        guide.label,
        t(guide.label),
        category?.label ?? "",
        category ? t(category.label) : "",
      ]
        .join(" ")
        .toLocaleLowerCase();
      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [guideSearch, guideCategory, t]);
  const [showCustomInstructionModal, setShowCustomInstructionModal] =
    useState(false);
  const [customInstructionDraft, setCustomInstructionDraft] = useState("");
  const previousCustomInstructionClearSignalRef = useRef(
    clearCustomInstructionSignal,
  );
  const customInstructionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editingGuideSearchRef = useRef<HTMLInputElement>(null);
  const clothingColorPopupRef = useRef<HTMLDivElement>(null);
  const currentColor = setSelectedClothingColor
    ? selectedClothingColor
    : internalClothingColor;
  const handleColorChange = (hex: string) => {
    const normalized = hex.toUpperCase();
    if (setSelectedClothingColor) {
      setSelectedClothingColor(normalized);
    } else {
      setInternalClothingColor(normalized);
    }
  };
  const toggleGuide = (guide: string) => {
    setActiveGuides((prev) =>
      prev.includes(guide)
        ? prev.filter((item) => item !== guide)
        : [...prev, guide],
    );
  };
  const handleCustomInstructionSubmit = () => {
    const instruction = customInstructionDraft.trim();
    if (!instruction) return;
    const guide = `Custom Instruction: ${instruction}`;
    setActiveGuides((prev) => [
      ...prev.filter((entry) => !entry.startsWith("Custom Instruction:")),
      guide,
    ]);
    setShowCustomInstructionModal(false);
    setCustomInstructionDraft("");
  };
  useEffect(() => {
    if (!showCustomInstructionModal && !showEditingGuideLibrary) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleModalKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCustomInstructionModal(false);
        setShowEditingGuideLibrary(false);
      }
      if (
        event.key === "Enter" &&
        (event.ctrlKey || event.metaKey) &&
        showCustomInstructionModal
      ) {
        event.preventDefault();
        handleCustomInstructionSubmit();
      }
    };
    document.addEventListener("keydown", handleModalKeyDown);
    if (showCustomInstructionModal) {
      customInstructionTextareaRef.current?.focus();
    } else if (showEditingGuideLibrary) {
      editingGuideSearchRef.current?.focus();
    }
    return () => {
      document.removeEventListener("keydown", handleModalKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [showCustomInstructionModal, showEditingGuideLibrary, customInstructionDraft]);
  useEffect(() => {
    if (
      previousCustomInstructionClearSignalRef.current !==
      clearCustomInstructionSignal
    ) {
      previousCustomInstructionClearSignalRef.current =
        clearCustomInstructionSignal;
      setActiveGuides((prev) =>
        prev.filter((entry) => !entry.startsWith("Custom Instruction:")),
      );
      setCustomInstructionDraft("");
    }
  }, [clearCustomInstructionSignal]);
  useEffect(() => {
    onEditingGuidesChange?.(activeGuides);
  }, [activeGuides, onEditingGuidesChange]);
  const handleClothingClick = (idx: number) => {
    setSelectedClothing(idx);
    setShowClothingColorPicker(true);
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        clothingColorPopupRef.current &&
        !clothingColorPopupRef.current.contains(target)
      ) {
        setShowClothingColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keep the whole settings panel inside the viewport on desktop (no inner scrolling).
  const panelRootRef = useRef<HTMLDivElement | null>(null);
  const fitPanelToViewport = () => {
    const root = panelRootRef.current;
    if (!root) return;
    const kids = Array.from(root.children) as HTMLElement[];
    kids.forEach((kid) => {
      kid.style.zoom = "";
    });
    if (window.innerWidth < 1280) return;
    const pad = 32;
    const available = root.clientHeight - pad;
    const needed = root.scrollHeight - pad;
    if (needed > available + 1 && needed > 0) {
      const zoom = Math.max(0.7, available / needed);
      kids.forEach((kid) => {
        kid.style.zoom = String(zoom);
      });
    }
  };
  useLayoutEffect(() => {
    fitPanelToViewport();
  });
  useEffect(() => {
    const onResize = () => fitPanelToViewport();
    window.addEventListener("resize", onResize);
    const root = panelRootRef.current;
    const observer = root && typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    if (root && observer) observer.observe(root);
    return () => {
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, []);
  return (
    <div ref={panelRootRef} className="w-full max-w-full lg:w-[320px] xl:w-[380px] bg-[#F8FAFC] rounded-2xl p-4 xl:p-[clamp(10px,1.5vh,16px)] shadow-sm overflow-y-auto max-h-none lg:max-h-[calc(100vh-100px)] xl:max-h-full flex flex-col justify-between relative shrink-0 text-[#0F172A]">
      <div>
        <div className="flex items-center justify-between mb-4 xl:mb-[clamp(6px,1.2vh,16px)]">
          <span className="font-semibold text-sm text-[#0F172A] flex items-center gap-2">
            <span className="w-1 h-4 bg-[#2563EB] rounded-full" />
            <AiT>{"Generation settings\n          "}</AiT>
          </span>
        </div>

        {/* PHOTO SIZE SECTION */}
        <div
          className="mb-6 xl:mb-[clamp(6px,1.3vh,20px)] relative"
          ref={visaPopupRef}
        >
          <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
            <span>
              <AiT>{"PHOTO SIZE"}</AiT>
            </span>
            <button
              type="button"
              onClick={() => {
                setShowClothingColorPicker(false);
                setActiveGuides([]);
                onEditingGuidesChange?.([]);
                onResetSettings?.();
              }}
              title={t("Reset generation settings")}
              className="text-[#2563EB] hover:rotate-180 transition-transform duration-300 cursor-pointer"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-5 gap-2">
            {photoSizes.map((size) => {
              const isActive = selectedSize === size.id;
              return (
                <button
                  key={size.id}
                  onClick={() => handleSizeClick(size.id)}
                  title={size.tooltip ? t(size.tooltip) : undefined}
                  type="button"
                  className={`flex flex-col items-center justify-center p-2 xl:p-[clamp(2px,0.55vh,8px)] rounded-xl border text-[10px] relative transition-all cursor-pointer ${
                    isActive
                      ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB] font-medium"
                      : "border-[#E2E8F0] text-[#0F172A] hover:border-slate-300"
                  }`}
                >
                  <div className="w-6 h-6 mb-1 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                    <ImageIcon size={14} />
                  </div>

                  <span className="truncate max-w-full">
                    <AiT>{size.label}</AiT>
                  </span>

                  {isActive && (
                    <span className="absolute -top-1 -right-1 bg-[#2563EB] text-white rounded-full p-0.5">
                      <Check size={8} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {showVisaPopup && (
            <div className="absolute left-0 top-[85px] w-full max-w-[300px] bg-white border-2 border-[#2563EB] rounded-2xl shadow-xl p-4 z-50">
              <h4 className="text-xs font-semibold text-[#0F172A] mb-3">
                <AiT>{"Visa Photo Size\n              "}</AiT>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {visaSizesList.map((vItem, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedVisaSize(vItem.label);
                      setSelectedSize("Visa");
                      setShowVisaPopup(false);
                      if (isDualMode) {
                        exitDualMode("Visa");
                      }
                    }}
                    className={`py-2 px-1 text-[11px] rounded-lg border text-center transition-all cursor-pointer ${
                      selectedVisaSize === vItem.label &&
                      selectedSize === "Visa"
                        ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB] font-medium"
                        : "border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50"
                    }`}
                  >
                    {vItem.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BACKGROUND SECTION */}
        <div
          className="mb-6 xl:mb-[clamp(6px,1.3vh,20px)] relative"
          ref={colorPickerRef}
        >
          <div className="text-xs text-slate-500 mb-2">
            <AiT>{"BACKGROUND"}</AiT>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {backgroundColors.map((bg, idx) => {
              const isSelected = selectedBg === idx;
              if (bg.type === "transparent") {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedBg(isSelected ? -1 : idx);
                      setShowColorPicker(false);
                    }}
                    title={t("Transparent background")}
                    aria-label={t("Transparent background")}
                    className={`h-9 xl:h-[clamp(22px,3.3vh,36px)] rounded-xl relative flex items-center justify-center overflow-hidden transition-transform hover:scale-105 cursor-pointer border border-slate-300 ${isSelected ? "ring-2 ring-[#2563EB] ring-offset-2" : ""}`}
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, #d1d5db 25%, transparent 25%), linear-gradient(-45deg, #d1d5db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d1d5db 75%), linear-gradient(-45deg, transparent 75%, #d1d5db 75%)",
                      backgroundSize: "12px 12px",
                      backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <span className="rounded-md bg-black/70 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white shadow-sm">
                      <AiT>{"PNG\n                    "}</AiT>
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 bg-[#2563EB] text-white rounded-full p-0.5">
                        <Check size={8} />
                      </span>
                    )}
                  </button>
                );
              }
              if (bg.type === "custom") {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (isSelected && showColorPicker) {
                        // Second click while the picker is open clears the choice.
                        setSelectedBg(-1);
                        setShowColorPicker(false);
                        return;
                      }
                      setSelectedBg(idx);
                      setShowColorPicker(true);
                    }}
                    style={{ backgroundColor: customBgColor }}
                    className={`h-9 xl:h-[clamp(22px,3.3vh,36px)] rounded-xl relative flex items-center justify-center transition-transform hover:scale-105 shadow-inner cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-[#2563EB] ring-offset-2"
                        : "border border-slate-200"
                    }`}
                  >
                    <Palette size={16} className="text-white drop-shadow-md" />

                    {isSelected && (
                      <span className="absolute -top-1 -right-1 bg-[#2563EB] text-white rounded-full p-0.5">
                        <Check size={8} />
                      </span>
                    )}
                  </button>
                );
              }
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedBg(isSelected ? -1 : idx);
                    setShowColorPicker(false);
                  }}
                  className={`h-9 xl:h-[clamp(22px,3.3vh,36px)] rounded-xl ${bg.className || ""} relative flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${isSelected ? "ring-2 ring-[#2563EB] ring-offset-2" : ""}`}
                >
                  {isSelected && (
                    <span className="absolute bg-[#2563EB] text-white rounded-full p-0.5">
                      <Check size={10} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {showColorPicker && (
            <div className="absolute left-0 top-[90px] w-full max-w-[260px] bg-white border-2 border-[#2563EB] rounded-2xl shadow-xl p-4 z-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-[#0F172A]">
                  <AiT>{"Custom Background Color\n                "}</AiT>
                </span>

                <button
                  type="button"
                  onClick={() => setShowColorPicker(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) =>
                      setCustomBgColor(e.target.value.toUpperCase())
                    }
                    className="w-12 h-10 rounded-lg cursor-pointer border border-slate-200 p-0 bg-transparent"
                  />

                  <input
                    type="text"
                    value={customBgColor}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      if (/^#?[0-9A-F]{0,6}$/.test(value)) {
                        setCustomBgColor(
                          value.startsWith("#") ? value : `#${value}`,
                        );
                      }
                    }}
                    onBlur={() => {
                      if (!/^#[0-9A-F]{6}$/i.test(customBgColor)) {
                        setCustomBgColor("#8B1E1E");
                      }
                    }}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-[#0F172A] uppercase focus:outline-none focus:border-[#2563EB]"
                    aria-label={t("Custom background hex color")}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CLOTHING STYLE SECTION */}
        <div
          className="mb-6 xl:mb-[clamp(6px,1.3vh,20px)] relative"
          ref={clothingColorPopupRef}
        >
          <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
            <span>
              <AiT>{"CLOTHING STYLE"}</AiT>
            </span>

            <span className="text-[10px] bg-[#E2E8F0] text-[#0F172A] px-1.5 py-0.5 rounded font-medium">
              {CLOTHING_NAMES.length}/{CLOTHING_NAMES.length}
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden p-0.5">
            {!isDualMode ? (
              <div className="grid grid-cols-8 xl:grid-cols-10 gap-1 xl:gap-[clamp(2px,0.45vh,5px)] justify-items-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClothing(-1);
                    setShowClothingColorPicker(false);
                  }}
                  className={`aspect-square w-full xl:aspect-auto xl:w-[clamp(20px,3.4vh,36px)] xl:h-[clamp(20px,3.4vh,36px)] rounded-xl border flex items-center justify-center relative bg-slate-50 cursor-pointer transition-all hover:bg-slate-100 p-0.5 ${
                    selectedClothing === -1
                      ? "border-[#2563EB] ring-2 ring-[#2563EB]/50 bg-[#2563EB]/10"
                      : "border-[#E2E8F0]"
                  }`}
                  aria-label={t("No clothing")}
                >
                  <Ban size={18} className="text-slate-400" />
                </button>

                {CLOTHING_NAMES.map((name, idx) => {
                  const isSelected = selectedClothing === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleClothingClick(idx)}
                      className={`aspect-square w-full xl:aspect-auto xl:w-[clamp(20px,3.4vh,36px)] xl:h-[clamp(20px,3.4vh,36px)] rounded-xl border flex items-center justify-center relative bg-slate-50 cursor-pointer transition-all hover:bg-slate-100 p-0.5 overflow-hidden ${
                        isSelected
                          ? "border-[#2563EB] ring-2 ring-[#2563EB]/50 bg-[#2563EB]/10"
                          : "border-[#E2E8F0]"
                      }`}
                      aria-label={t(name)}
                    >
                      <RawSvgClothingPreview
                        index={idx}
                        selected={isSelected}
                        color={isSelected ? currentColor : undefined}
                        alt={t(name)}
                      />

                      {isSelected && (
                        <span className="absolute bottom-0.5 right-0.5 bg-[#2563EB] text-white rounded-full p-0.5 shadow-sm z-10">
                          <Check size={8} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-medium text-slate-600 mb-1.5">
                    <AiT>{"Left Person\n                  "}</AiT>
                  </p>

                  <div className="grid grid-cols-8 xl:grid-cols-10 gap-1 xl:gap-[clamp(2px,0.45vh,5px)] justify-items-center">
                    {CLOTHING_NAMES.map((name, idx) => (
                      <button
                        key={`left-${idx}`}
                        type="button"
                        onClick={() => setLeftClothing(idx)}
                        className={`aspect-square w-full xl:aspect-auto xl:w-[clamp(20px,3.4vh,36px)] xl:h-[clamp(20px,3.4vh,36px)] rounded-xl border flex items-center justify-center relative bg-slate-50 cursor-pointer transition-all hover:bg-slate-100 p-0.5 overflow-hidden ${
                          leftClothing === idx
                            ? "border-[#2563EB] ring-2 ring-[#2563EB]/50 bg-[#2563EB]/10"
                            : "border-[#E2E8F0]"
                        }`}
                      >
                        <RawSvgClothingPreview
                          index={idx}
                          selected={false}
                          alt={t(`${name} left person`)}
                        />

                        {leftClothing === idx && (
                          <span className="absolute bottom-0.5 right-0.5 bg-[#2563EB] text-white rounded-full p-0.5 shadow-sm z-10">
                            <Check size={8} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-slate-600 mb-1.5">
                    <AiT>{"Right Person\n                  "}</AiT>
                  </p>

                  <div className="grid grid-cols-8 xl:grid-cols-10 gap-1 xl:gap-[clamp(2px,0.45vh,5px)] justify-items-center">
                    {CLOTHING_NAMES.map((name, idx) => (
                      <button
                        key={`right-${idx}`}
                        type="button"
                        onClick={() => setRightClothing(idx)}
                        className={`aspect-square w-full xl:aspect-auto xl:w-[clamp(20px,3.4vh,36px)] xl:h-[clamp(20px,3.4vh,36px)] rounded-xl border flex items-center justify-center relative bg-slate-50 cursor-pointer transition-all hover:bg-slate-100 p-0.5 overflow-hidden ${
                          rightClothing === idx
                            ? "border-[#2563EB] ring-2 ring-[#2563EB]/50 bg-[#2563EB]/10"
                            : "border-[#E2E8F0]"
                        }`}
                      >
                        <RawSvgClothingPreview
                          index={idx}
                          selected={false}
                          alt={t(`${name} right person`)}
                        />

                        {rightClothing === idx && (
                          <span className="absolute bottom-0.5 right-0.5 bg-[#2563EB] text-white rounded-full p-0.5 shadow-sm z-10">
                            <Check size={8} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {showClothingColorPicker && selectedClothing >= 0 && (
            <div className="absolute left-0 top-12 w-full max-w-[280px] bg-white border-2 border-[#2563EB] rounded-2xl shadow-xl p-4 z-[60] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-[#0F172A]">
                  <AiT>{CLOTHING_NAMES[selectedClothing] || "Clothing"}</AiT>
                  <AiT>
                    {"\u2014 Pick a\n                  Color\n                "}
                  </AiT>
                </span>

                <button
                  type="button"
                  onClick={() => setShowClothingColorPicker(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  aria-label={t("Close clothing color picker")}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-6 gap-2.5">
                {CLOTHING_COLORS.map((color) => {
                  const isColorActive =
                    currentColor.toUpperCase() === color.hex.toUpperCase();
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => handleColorChange(color.hex)}
                      title={t(color.name)}
                      style={{ backgroundColor: color.hex }}
                      className={`w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer relative ${
                        isColorActive
                          ? "ring-2 ring-[#2563EB] ring-offset-2"
                          : ""
                      }`}
                    >
                      {isColorActive && (
                        <Check
                          size={12}
                          className={
                            color.hex === "#FFFFFF" || color.hex === "#E5E7EB"
                              ? "text-slate-900"
                              : "text-white"
                          }
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* EXTRA EDITING GUIDE */}
        <div className="mb-4 xl:mb-[clamp(4px,0.8vh,12px)] relative">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
            <span className="font-medium">
              <AiT>{"EXTRA EDITING GUIDE"}</AiT>
            </span>
            <span
              className="text-[10px] bg-[#E2E8F0] text-[#0F172A] px-1.5 py-0.5 rounded font-medium tabular-nums"
              title={t("Editing presets plus custom instruction")}
            >
              {activeGuides.length}/{EDITING_GUIDES.length + 1}
            </span>
          </div>

          <div className="rounded-2xl p-0.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xl:gap-[clamp(4px,0.8vh,8px)]">
              {QUICK_EDITING_GUIDES.map((item) => {
                const active = activeGuides.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleGuide(item)}
                    title={t(item)}
                    className={`xl:min-h-0 min-h-[50px] flex flex-col items-center justify-center p-2 xl:p-[clamp(2px,0.5vh,8px)] rounded-xl border text-[11px] xl:text-[clamp(11px,1.3vh,12.5px)] font-medium text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                      active
                        ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
                        : "border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mb-0.5 flex h-11 w-11 xl:h-[clamp(24px,3.4vh,40px)] xl:w-[clamp(24px,3.4vh,40px)] items-center justify-center rounded-lg transition-colors ${
                        active ? "bg-transparent" : "bg-transparent"
                      }`}
                    >
                      <GuideIcon label={item} size="100%" />
                    </span>
                    <span className="leading-[1.15] line-clamp-2">{t(item)}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                aria-pressed={activeGuides.some((entry) =>
                  entry.startsWith("Custom Instruction:"),
                )}
                onClick={() => {
                  const customActive = activeGuides.some((entry) =>
                    entry.startsWith("Custom Instruction:"),
                  );
                  if (customActive) {
                    setActiveGuides((prev) =>
                      prev.filter(
                        (entry) => !entry.startsWith("Custom Instruction:"),
                      ),
                    );
                    return;
                  }
                  setCustomInstructionDraft("");
                  setShowCustomInstructionModal(true);
                }}
                className={`min-h-[36px] flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                  activeGuides.some((entry) =>
                    entry.startsWith("Custom Instruction:"),
                  )
                    ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
                    : "border-dashed border-[#94A3B8] bg-white text-[#334155] hover:bg-slate-50"
                }`}
              >
                <Sparkles size={13} aria-hidden="true" />
                {activeGuides.some((entry) =>
                  entry.startsWith("Custom Instruction:"),
                ) ? (
                  <AiT>{"Custom added"}</AiT>
                ) : (
                  <AiT>{"Custom Instruction"}</AiT>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowEditingGuideLibrary(true)}
                className="min-h-[36px] flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8] text-[11px] font-medium transition-colors hover:bg-[#DBEAFE] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                <Search size={13} aria-hidden="true" />
                <AiT>{"Browse all editing guides"}</AiT>
                <span className="rounded-full bg-white/80 px-1.5 py-0.5 tabular-nums">
                  {EDITING_GUIDES.length}
                </span>
              </button>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
              <AiT>{"Choose a few compatible edits for the best result."}</AiT>
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2 mt-auto">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full font-medium py-3 xl:py-[clamp(7px,1.2vh,12px)] rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 ${
            isGenerating
              ? "bg-[#10B981]/70 text-white cursor-not-allowed opacity-90"
              : "bg-[#10B981] hover:bg-[#059669] text-white cursor-pointer active:scale-[0.98]"
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>
                <AiT>{"Generating Photo..."}</AiT>
              </span>
            </>
          ) : (
            <span>
              <AiT>{"Generate Photo"}</AiT>
            </span>
          )}
        </button>
      </div>
      {showEditingGuideLibrary &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget)
                setShowEditingGuideLibrary(false);
            }}
            role="presentation"
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="editing-guide-library-title"
              aria-describedby="editing-guide-library-description"
              className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
            >
              <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-4 sm:px-7 sm:py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Sparkles size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2
                    id="editing-guide-library-title"
                    className="text-base sm:text-lg font-semibold tracking-tight text-slate-900"
                  >
                    <AiT>{"Editing Guide Library"}</AiT>
                  </h2>
                  <p
                    id="editing-guide-library-description"
                    className="mt-1 text-xs sm:text-sm leading-5 text-slate-500"
                  >
                    <AiT>{"Choose compatible edits to apply to your photo."}</AiT>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditingGuideLibrary(false)}
                  aria-label={t("Close")}
                  className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:px-6">
                <div className="relative">
                  <Search
                    size={15}
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    ref={editingGuideSearchRef}
                    type="search"
                    value={guideSearch}
                    onChange={(event) => setGuideSearch(event.target.value)}
                    placeholder={t("Search editing guides...")}
                    aria-label={t("Search editing guides...")}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
                <select
                  value={guideCategory}
                  onChange={(event) => setGuideCategory(event.target.value)}
                  aria-label={t("Filter editing guides by category")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
                >
                  {EDITING_GUIDE_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {t(category.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>
                    {filteredEditingGuides.length} <AiT>{"presets shown"}</AiT>
                  </span>
                  <span className="tabular-nums">
                    {activeGuides.length} <AiT>{"selected"}</AiT>
                  </span>
                </div>
                {filteredEditingGuides.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {filteredEditingGuides.map((guide) => {
                      const active = activeGuides.includes(guide.label);
                      const category = EDITING_GUIDE_CATEGORIES.find(
                        (entry) => entry.id === guide.category,
                      );
                      return (
                        <button
                          key={guide.label}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleGuide(guide.label)}
                          title={t(guide.label)}
                          className={`flex min-h-[76px] flex-col items-start justify-between rounded-xl border p-3 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            active
                              ? "border-blue-500 bg-blue-50 ring-1 ring-blue-100"
                              : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex w-full items-start justify-between gap-2">
                            <span className="flex min-w-0 items-start gap-2">
                              <span
                                aria-hidden="true"
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors`}
                              >
                                <GuideIcon label={guide.label} size={36} />
                              </span>
                              <span className={`min-w-0 text-xs sm:text-sm font-medium leading-5 ${active ? "text-blue-700" : "text-slate-800"}`}>
                                {t(guide.label)}
                              </span>
                            </span>
                            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-transparent"}`}>
                              <Check size={10} strokeWidth={3} aria-hidden="true" />
                            </span>
                          </span>
                          {category && (
                            <span className="mt-2 text-[10px] leading-4 text-slate-500">
                              {t(category.label)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-12 text-center text-sm text-slate-500">
                    <AiT>{"No matching editing guides."}</AiT>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-[11px] leading-5 text-slate-500">
                  <AiT>{"Choose a few compatible edits for the best result."}</AiT>
                </p>
                <button
                  type="button"
                  onClick={() => setShowEditingGuideLibrary(false)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <Check size={16} aria-hidden="true" />
                  <AiT>{"Done"}</AiT>
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
      {showCustomInstructionModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget)
                setShowCustomInstructionModal(false);
            }}
            role="presentation"
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="custom-instruction-title"
              aria-describedby="custom-instruction-description"
              className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
            >
              <div className="flex items-start gap-4 border-b border-slate-100 px-6 pb-5 pt-6 sm:px-7">
                <div className="min-w-0 flex-1 pt-0.5">
                  <h2
                    id="custom-instruction-title"
                    className="text-lg font-semibold tracking-tight text-slate-900"
                  >
                    {t("Custom Editing Instruction")}
                  </h2>
                  <p
                    id="custom-instruction-description"
                    className="mt-1.5 text-sm leading-6 text-slate-500"
                  >
                    {t("Describe the edit you want the AI to make.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomInstructionModal(false)}
                  aria-label={t("Close")}
                  className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <X size={19} />
                </button>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleCustomInstructionSubmit();
                }}
                className="px-6 py-6 sm:px-7"
              >
                <label
                  htmlFor="custom-instruction-input"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  {t("Your instruction")}
                </label>
                <textarea
                  ref={customInstructionTextareaRef}
                  id="custom-instruction-input"
                  value={customInstructionDraft}
                  onChange={(event) =>
                    setCustomInstructionDraft(event.target.value)
                  }
                  placeholder={t("Write your custom instruction here...")}
                  rows={5}
                  className="block w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {t(
                    "Your instruction will be used when generating the photo.",
                  )}
                </p>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-slate-400">
                    {t("Press Esc to close")}
                  </span>
                  <div className="flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowCustomInstructionModal(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                    >
                      {t("Cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={!customInstructionDraft.trim()}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                      {t("Add Instruction")}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>,
          document.body,
        )}
    </div>
  );
}
