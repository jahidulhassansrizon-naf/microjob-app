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
  Loader2,
  Ban,
  Search,
  ListChecks,
} from "lucide-react";
import { EDITING_GUIDE_CATEGORIES, EDITING_GUIDES, isOptionEntry } from "./editingGuides";
import TiePicker, { canHaveTie, getTieFromGuides, withTie } from "./TiePicker";
import GuideIcon from "./GuideIcon";
import PhotoSizeIcon from "./PhotoSizeIcon";
import AdmissionPicker from "./AdmissionPicker";
import { CLOTHING_NAMES } from "./clothingStyles";
import AiEditorVideoGuide from "./AiEditorVideoGuide";
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
  showAdmissionPopup?: boolean;
  setShowAdmissionPopup?: (show: boolean) => void;
  selectedAdmissionLabel?: string;
  setSelectedAdmissionLabel?: (label: string) => void;
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
  leftClothingColor?: string;
  setLeftClothingColor?: (color: string) => void;
  rightClothingColor?: string;
  setRightClothingColor?: (color: string) => void;
  colorPickerRef?: React.RefObject<HTMLDivElement | null>;
  visaPopupRef?: React.RefObject<HTMLDivElement | null>;
  onGenerate?: () => void;
  /** Opens the step-by-step setup guide (shown above the Generate button). */
  onOpenSetupWizard?: () => void;
  isGenerating?: boolean;
  onEditingGuidesChange?: (guides: string[]) => void;
  /** Lets another part of the page (the setup wizard) replace the selected editing guides. */
  applyGuidesSignal?: { id: number; guides: string[] } | null;
  onResetSettings?: () => void;
}
// Quick tiles follow the same order as the full library: top of the head -> chin,
// then whole-face and whole-photo essentials. (Change the order here freely.)
const QUICK_EDITING_GUIDES = [
  // Only situational choices live here. The edits that suit ~90% of photos (clean face in the person's own
  // skin color, bright eyes, stray hair, exposure, head straightening...) are always applied by the backend
  // prompt (see AUTO_APPLIED_GUIDES), so the user never has to tick them. Everything is still in "Browse all".
  "Neat Short Haircut",
  "Black Hair Color",
  "Cover Gray Hair",
  "Clean Shave",
  "Tidy Facial Hair",
  "Enhance Eyebrows",
  "Fair & Bright Skin",
  "Keep Marks",
  "Glow & Makeup",
  "Reduce Glasses Glare",
  "Keep Earrings",
  "Keep Nose Pin",
  "Studio Straight Pose",
];
// When the screen is short, only the most important quick guides stay on the panel (in this order);
// the rest move into the "Browse all editing guides" popup. Change the order here freely.
const GUIDE_PRIORITY = [
  "Fair & Bright Skin",
  "Neat Short Haircut",
  "Clean Shave",
  "Black Hair Color",
  "Cover Gray Hair",
  "Keep Earrings",
  "Keep Nose Pin",
  "Studio Straight Pose",
  "Tidy Facial Hair",
  "Glow & Makeup",
  "Enhance Eyebrows",
  "Keep Marks",
  "Reduce Glasses Glare",
];
const guideRank = (item: string) => {
  const i = GUIDE_PRIORITY.indexOf(item);
  return i === -1 ? 99 : i + 1;
};
export const CLOTHING_COLORS = [
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
export function RawSvgClothingPreview({
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
    <div className="relative w-full h-full overflow-hidden rounded-lg bg-transparent">
      <img
        src={displaySrc}
        alt={alt}
        draggable={false}
        className={`w-full h-full object-contain rounded-lg transition-opacity duration-150 ${isReady ? "opacity-100" : "opacity-80"}`}
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
  showAdmissionPopup = false,
  setShowAdmissionPopup = () => {},
  selectedAdmissionLabel = "",
  setSelectedAdmissionLabel = () => {},
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
  leftClothingColor = "#EF4444",
  setLeftClothingColor,
  rightClothingColor = "#EF4444",
  setRightClothingColor,
  colorPickerRef,
  visaPopupRef,
  onGenerate = () => {},
  onOpenSetupWizard,
  isGenerating = false,
  onEditingGuidesChange,
  applyGuidesSignal = null,
  onResetSettings,
}: GenerationSettingsProps) {
  const { t } = useAiEditorText();
  const [showClothingColorPicker, setShowClothingColorPicker] = useState(false);
  useEffect(() => {
    const clearEditorPreviewCache = () => {
      // These blob URLs are editor-local previews, not persistent user files.
      for (const objectUrl of recoloredSvgCache.values()) {
        URL.revokeObjectURL(objectUrl);
      }
      recoloredSvgCache.clear();
      rawSvgCache.clear();
    };
    window.addEventListener("beforeunload", clearEditorPreviewCache);
    return () => {
      window.removeEventListener("beforeunload", clearEditorPreviewCache);
      clearEditorPreviewCache();
    };
  }, []);
  // Where the colour popup sits: right next to the clothing tile that was clicked.
  const [clothingPopupPos, setClothingPopupPos] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    caretX: number;
    above: boolean;
  }>({ left: 0, top: 0, caretX: 24, above: false });
  const clothingPopupRef = useRef<HTMLDivElement>(null);
  const popupScrollTopRef = useRef(0);
  const [internalClothingColor, setInternalClothingColor] = useState("#EF4444");
  const [activeGuides, setActiveGuides] = useState<string[]>([]);
  const [showEditingGuideLibrary, setShowEditingGuideLibrary] = useState(false);
  // "Browse all clothing" popup (used when the panel is too short to show every clothing tile).
  const [clothModal, setClothModal] = useState<null | "single" | "left" | "right">(null);
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
  // Library results grouped by face part, in head-to-chin order, so every part's options sit together.
  const groupedEditingGuides = useMemo(() => {
    const groups: { id: string; label: string; guides: typeof EDITING_GUIDES }[] = [];
    for (const guide of filteredEditingGuides) {
      const last = groups[groups.length - 1];
      if (last && last.id === guide.category) {
        last.guides.push(guide);
        continue;
      }
      const category = EDITING_GUIDE_CATEGORIES.find((entry) => entry.id === guide.category);
      groups.push({ id: guide.category, label: category?.label ?? guide.category, guides: [guide] });
    }
    return groups;
  }, [filteredEditingGuides]);
  const editingGuideSearchRef = useRef<HTMLInputElement>(null);
  const clothingColorPopupRef = useRef<HTMLDivElement>(null);
  // Dual mode: the colour popup edits the person whose clothing tile was clicked.
  const [dualColorTarget, setDualColorTarget] = useState<"left" | "right">("left");
  const [internalLeftColor, setInternalLeftColor] = useState("#EF4444");
  const [internalRightColor, setInternalRightColor] = useState("#EF4444");
  const dualLeftColor = setLeftClothingColor ? leftClothingColor : internalLeftColor;
  const dualRightColor = setRightClothingColor ? rightClothingColor : internalRightColor;
  const currentColor = isDualMode
    ? dualColorTarget === "left"
      ? dualLeftColor
      : dualRightColor
    : setSelectedClothingColor
      ? selectedClothingColor
      : internalClothingColor;
  const activeClothingIndex = isDualMode
    ? dualColorTarget === "left"
      ? leftClothing
      : rightClothing
    : selectedClothing;
  const handleColorChange = (hex: string) => {
    const normalized = hex.toUpperCase();
    if (isDualMode) {
      if (dualColorTarget === "left") {
        if (setLeftClothingColor) setLeftClothingColor(normalized);
        else setInternalLeftColor(normalized);
      } else if (setRightClothingColor) {
        setRightClothingColor(normalized);
      } else {
        setInternalRightColor(normalized);
      }
      return;
    }
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
  useEffect(() => {
    if (!showEditingGuideLibrary) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleModalKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowEditingGuideLibrary(false);
      }
    };
    document.addEventListener("keydown", handleModalKeyDown);
    editingGuideSearchRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleModalKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [showEditingGuideLibrary]);
  useEffect(() => {
    onEditingGuidesChange?.(activeGuides);
  }, [activeGuides, onEditingGuidesChange]);
  // Setup wizard: apply the guides the user picked there, exactly once per signal.
  const lastApplyGuidesIdRef = useRef(applyGuidesSignal?.id ?? 0);
  useEffect(() => {
    if (!applyGuidesSignal || applyGuidesSignal.id === lastApplyGuidesIdRef.current) return;
    lastApplyGuidesIdRef.current = applyGuidesSignal.id;
    setActiveGuides(applyGuidesSignal.guides);
  }, [applyGuidesSignal]);
  const handleClothingClick = (
    idx: number,
    tile?: HTMLElement | null,
    side?: "left" | "right",
  ) => {
    if (side === "left") {
      setDualColorTarget("left");
      setLeftClothing(idx);
    } else if (side === "right") {
      setDualColorTarget("right");
      setRightClothing(idx);
    } else {
      setSelectedClothing(idx);
    }
    const cont = clothingColorPopupRef.current?.getBoundingClientRect();
    popupScrollTopRef.current =
      (tile?.closest("[data-scroller]") as HTMLElement | null)?.scrollTop ?? 0;
    if (tile && cont) {
      const r = tile.getBoundingClientRect();
      const panelRect = panelRootRef.current?.getBoundingClientRect();
      const popupW = Math.min(280, cont.width);
      const popupH = 215;
      const spaceBelow = (panelRect ? panelRect.bottom : window.innerHeight) - r.bottom;
      const spaceAbove = r.top - (panelRect ? panelRect.top : 0);
      const above = spaceBelow < popupH + 12 && spaceAbove > spaceBelow;
      const centerX = r.left - cont.left + r.width / 2;
      const left = Math.max(0, Math.min(centerX - popupW / 2, cont.width - popupW));
      setClothingPopupPos({
        left,
        caretX: Math.max(16, Math.min(centerX - left, popupW - 16)),
        above,
        ...(above
          ? { bottom: cont.bottom - r.top + 8 }
          : { top: r.bottom - cont.top + 8 }),
      });
    }
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

  useEffect(() => {
    if (showClothingColorPicker) {
      clothingPopupRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [showClothingColorPicker, clothingPopupPos]);

  // Drag-to-scroll (grab the panel with the mouse and pull up/down).
  const dragRef = useRef({ active: false, moved: false, startY: 0, startTop: 0 });
  const onPanelMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, select, [data-no-drag]")) return;
    const root = target.closest("[data-scroller]") as HTMLElement | null;
    if (!root || root.scrollHeight <= root.clientHeight) return;
    // Don't hijack a drag on the native scrollbar itself.
    if (e.clientX > root.getBoundingClientRect().right - 14) return;
    // Stop the browser starting its own text/image drag, which would cancel ours.
    e.preventDefault();
    dragRef.current = { active: true, moved: false, startY: e.clientY, startTop: root.scrollTop };
    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dy = ev.clientY - d.startY;
      if (!d.moved && Math.abs(dy) > 5) {
        d.moved = true;
        panelRootRef.current?.classList.add("ai-dragging");
      }
      if (d.moved) root.scrollTop = d.startTop - dy;
    };
    const onUp = () => {
      const d = dragRef.current;
      d.active = false;
      panelRootRef.current?.classList.remove("ai-dragging");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (d.moved) {
        // A drag must not count as a click on whatever tile is under the cursor.
        const block = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        window.addEventListener("click", block, { capture: true, once: true });
        setTimeout(() => window.removeEventListener("click", block, true), 0);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Layout is pure CSS now (see the <style> block below): fluid sizes + auto-fill grids.
  // The panel scrolls by itself when the screen is too short; nothing is hidden or zoomed by JS.
  const panelRootRef = useRef<HTMLDivElement | null>(null);
  const clothMoreButton = (side: "single" | "left" | "right") => (
    <button
      type="button"
      data-no-drag
      onClick={() => {
        setShowClothingColorPicker(false);
        setClothModal(side);
      }}
      className="gs-cloth-more mt-2 w-full min-h-[36px] items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-[#FBB6B6] bg-[#FEE9E9] text-[#B91C1C] text-[13px] xl:text-[length:0.875rem] font-semibold transition-colors hover:bg-[#FDDADA] cursor-pointer"
    >
      <Search size={16} aria-hidden="true" />
      <AiT>{"Browse all clothing"}</AiT>
      <span className="rounded-full bg-white/80 px-1.5 py-0.5 tabular-nums">{CLOTHING_NAMES.length}</span>
    </button>
  );
  const modalSelected = clothModal === "left" ? leftClothing : clothModal === "right" ? rightClothing : selectedClothing;
  const modalColor = clothModal === "left" ? dualLeftColor : clothModal === "right" ? dualRightColor : currentColor;
  const pickClothingInModal = (idx: number) => {
    if (clothModal === "left") {
      setDualColorTarget("left");
      setLeftClothing(idx);
    } else if (clothModal === "right") {
      setDualColorTarget("right");
      setRightClothing(idx);
    } else {
      setSelectedClothing(idx);
    }
    setShowClothingColorPicker(false);
  };
  const pickColorInModal = (hex: string) => {
    const normalized = hex.toUpperCase();
    if (clothModal === "left") {
      setDualColorTarget("left");
      if (setLeftClothingColor) setLeftClothingColor(normalized);
      else setInternalLeftColor(normalized);
    } else if (clothModal === "right") {
      setDualColorTarget("right");
      if (setRightClothingColor) setRightClothingColor(normalized);
      else setInternalRightColor(normalized);
    } else {
      handleColorChange(normalized);
    }
  };
  // Fit-to-screen: on wide screens everything must be visible without scrolling. If the content is taller than
  // the panel, it is scaled down just enough (never below 55%) instead of showing a scrollbar.
  //
  // IMPORTANT (anti-jitter): the scale is a PURE function of (panel size, content). It is found by trying candidate
  // scales synchronously on the DOM node (no React state, no paint in between) and it never looks at the previous
  // scale. The old version fed the wrapper's own scaled width/height back into the next measurement, so around one
  // particular window size the scale kept flipping up and down every frame (the "shaking" users reported).
  const fitRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = panelRootRef.current;
    const wrap = fitRef.current;
    if (!root || !wrap) return;
    let raf = 0;
    const MIN_SCALE = 0.55;
    const apply = (scale: number) => {
      if (scale >= 1) {
        wrap.style.removeProperty("transform");
        wrap.style.removeProperty("transform-origin");
        wrap.style.removeProperty("width");
      } else {
        wrap.style.transform = `scale(${scale})`;
        wrap.style.transformOrigin = "top left";
        wrap.style.width = `${100 / scale}%`;
      }
    };
    const measureNow = () => {
      if (!window.matchMedia("(min-width: 1280px)").matches) { apply(1); return; }
      const cs = getComputedStyle(root);
      const avail = root.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (!avail) return;
      // wrap.offsetHeight is the UNSCALED layout height at the tried scale (the transform does not change it).
      const fits = (scale: number) => {
        apply(scale);
        return wrap.offsetHeight * scale <= avail + 0.5;
      };
      let best = 1;
      if (!fits(1)) {
        // binary search in whole percents: largest scale that still fits (deterministic, ~6 tries)
        let lo = Math.round(MIN_SCALE * 100); // assumed to fit (it is the floor)
        let hi = 99;
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2);
          if (fits(mid / 100)) lo = mid; else hi = mid - 1;
        }
        best = lo / 100;
      }
      apply(best);
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measureNow);
    };
    measureNow();
    const ro = new ResizeObserver(schedule);
    ro.observe(root);
    ro.observe(wrap);
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("resize", schedule); };
  }, []);
  return (
    <div ref={panelRootRef} onMouseDown={onPanelMouseDown} onDragStart={(e) => e.preventDefault()} className="gs-root ai-scroll w-full max-w-full lg:w-full xl:w-full bg-[#F2E8D2] rounded-2xl p-4 xl:p-[clamp(10px,1.5vh,16px)] shadow-sm overflow-visible xl:overflow-hidden xl:h-full xl:min-h-0 max-h-none flex flex-col justify-between relative shrink-0 text-[#3B2F1E]">
      <style>{`
        .ai-scroll [data-grab], .ai-scroll [data-grab] * { cursor: grab; }
        .ai-scroll input, .ai-scroll textarea { cursor: text; }
        .ai-scroll [data-no-drag], .ai-scroll [data-no-drag] * { cursor: pointer; }
        .ai-scroll.ai-dragging, .ai-scroll.ai-dragging * { cursor: grabbing !important; user-select: none; }
        .ai-scroll { scrollbar-width: thin; scrollbar-color: #F87171 transparent; }
        .ai-scroll::-webkit-scrollbar { width: 12px; }
        .ai-scroll::-webkit-scrollbar-track { background: rgba(148,163,184,0.18); border-radius: 999px; margin: 10px 0; }
        .ai-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#F87171,#DC2626); border-radius: 999px; border: 3px solid #F2E8D2; min-height: 48px; }
        .ai-scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,#EF4444,#B91C1C); }
        .ai-scroll::-webkit-scrollbar-thumb:active { background: #991B1B; }
        /* clothing list is never an inner scroller: it shows a limited number of tiles + a "browse all" popup */
        .gs-wrap .gs-noscroll { overflow: visible; max-height: none; }
        .gs-wrap .gs-cloth-more { display: none; }
        .gs-wrap[data-cap] .gs-cloth-more { display: flex; }
        ${[15].map((n) => `.gs-wrap[data-cap="${n}"] .gs-cloth-grid > button:nth-child(n+${n + 2}) { display: none; }`).join("\n        ")}
        .gs-wrap[data-cap] .gs-cloth-grid > button:has(.gs-sel-badge) { display: flex !important; }
        /* short screens: only the top-priority quick guides stay (selected ones always stay); the rest live in "Browse all" */
        ${[8].map((n) => `.gs-wrap[data-gcap="${n}"] .gs-guide-grid > button:is(${Array.from({ length: 14 - n }, (_, i) => `[data-prio="${n + 1 + i}"]`).join(",")}):not(.gs-guide-on) { display: none; }`).join("\n        ")}
        .gs-wrap[data-gcap] .gs-guide-grid > button[data-prio="99"]:not(.gs-guide-on) { display: none; }
        /* ---- Layout: no JS. Grids auto-fill the available width; sizes are fluid (clamp / vh) with readable minimums. ---- */
        .gs-wrap {
          --gs-cloth-min: 52px; --gs-guide-min: 92px;
          --gs-sec-gap: 0px; --gs-label-gap: 8px; --gs-label-font: 1.0625rem;
          --gs-size-icon: 44px; --gs-size-gap: 4px; --gs-bg: 40px;
          --gs-cloth-gap: 6px; --gs-guide-gap: 8px; --gs-guide-pad: 8px; --gs-guide-icon: 48px;
          --gs-guide-font: 0.8125rem; --gs-guide-lines: 3;
          --gs-btn-h: 36px; --gs-hint-font: 0.8125rem; --gs-hint-gap: 6px; --gs-gen-py: 10px;
        }
        .gs-wrap .gs-cloth-grid { grid-template-columns: repeat(auto-fill, minmax(var(--gs-cloth-min), 1fr)); }
        .gs-wrap .gs-guide-grid { grid-template-columns: repeat(auto-fill, minmax(var(--gs-guide-min), 1fr)); }
        @media (min-width: 1280px) {
          .gs-wrap {
            --gs-sec-gap: clamp(8px, 1.5vh, 20px); --gs-label-gap: clamp(4px, 0.9vh, 8px);
            --gs-size-icon: clamp(34px, 5.4vh, 48px); --gs-size-gap: clamp(1px, 0.4vh, 4px); --gs-bg: clamp(28px, 4.4vh, 40px);
            --gs-cloth-min: clamp(46px, 6.2vh, 58px); --gs-cloth-gap: clamp(3px, 0.6vh, 6px);
            --gs-guide-min: clamp(84px, 7vw, 104px); --gs-guide-gap: clamp(4px, 0.8vh, 8px); --gs-guide-pad: clamp(4px, 0.8vh, 8px); --gs-guide-icon: clamp(28px, 5.6vh, 52px);
            --gs-btn-h: clamp(32px, 4.2vh, 38px); --gs-hint-gap: clamp(3px, 0.6vh, 6px); --gs-gen-py: clamp(7px, 1.2vh, 12px);
          }
          /* fill the panel when the content is shorter than the screen; scroll the panel when it is taller */
          .gs-wrap { flex: 1 0 auto; }
          .gs-wrap .gs-sec, .gs-wrap .gs-head { margin-bottom: var(--gs-sec-gap); }
          .gs-wrap .gs-label { margin-bottom: var(--gs-label-gap); font-size: var(--gs-label-font); }
          .gs-wrap .gs-size-icon { width: var(--gs-size-icon); height: var(--gs-size-icon); margin-bottom: var(--gs-size-gap); }
          .gs-wrap .gs-size-icon svg { width: calc(var(--gs-size-icon) - 8px); height: calc(var(--gs-size-icon) - 8px); }
          .gs-wrap .gs-bgs > button { max-width: var(--gs-bg); }
          .gs-wrap .gs-cloth-grid { gap: var(--gs-cloth-gap); }
          .gs-wrap .gs-guide-grid { gap: var(--gs-guide-gap); }
          .gs-wrap .gs-guide-tile { padding: var(--gs-guide-pad); }
          .gs-wrap .gs-guide-icon { width: var(--gs-guide-icon); height: var(--gs-guide-icon); }
          .gs-wrap .gs-guide-text { font-size: var(--gs-guide-font); -webkit-line-clamp: var(--gs-guide-lines); }
          .gs-wrap .gs-actions > button { min-height: var(--gs-btn-h); padding-top: 2px; padding-bottom: 2px; }
          .gs-wrap .gs-hint { margin-top: var(--gs-hint-gap); font-size: var(--gs-hint-font); }
          .gs-wrap .gs-gen { padding-top: var(--gs-gen-py); padding-bottom: var(--gs-gen-py); }
          /* lists are never inner scrollers on desktop: the whole panel scrolls instead */
          .gs-wrap .gs-noscroll { overflow: visible; max-height: none; height: auto; min-height: 0; flex: 0 0 auto; }
          .ai-scroll .gs-noscroll, .ai-scroll .gs-noscroll * { cursor: auto; }
          .ai-scroll .gs-noscroll button, .ai-scroll .gs-noscroll button * { cursor: pointer; }
        }
      `}</style>
      <div ref={fitRef} className="gs-wrap flex flex-col shrink-0" data-cap="15" data-gcap="8">
      <div className="xl:flex-1 xl:min-h-0 xl:justify-between flex flex-col">
        <div className="gs-head flex items-center justify-between mb-4 xl:mb-[clamp(6px,1.2vh,16px)]">
          <span className="font-semibold text-base xl:text-[length:1.25rem] text-[#3B2F1E] flex items-center gap-2">
            <span className="w-1 h-4 bg-[#DC2626] rounded-full" />
            <AiT>{"Generation settings\n          "}</AiT>
          </span>
          <AiEditorVideoGuide />
        </div>

        {/* PHOTO SIZE SECTION */}
        <div
          className="gs-sec mb-6 xl:mb-[clamp(6px,1.3vh,20px)] relative"
          ref={visaPopupRef}
        >
          <div className="gs-label flex justify-between items-center text-sm text-stone-500 xl:text-[length:1.0625rem] xl:font-bold xl:text-[#3B2F1E] mb-2">
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
              className="text-[#DC2626] hover:rotate-180 transition-transform duration-300 cursor-pointer"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="gs-sizes grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-2">
            {photoSizes.map((size) => {
              const isActive = selectedSize === size.id;
              return (
                <button
                  key={size.id}
                  onClick={() => handleSizeClick(size.id)}
                  title={size.tooltip ? t(size.tooltip) : undefined}
                  type="button"
                  className={`flex flex-col items-center justify-center p-2 xl:p-[clamp(2px,0.55vh,8px)] rounded-xl border text-[12px] xl:text-[length:0.875rem] xl:font-semibold relative transition-all cursor-pointer ${
                    isActive
                      ? "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626] font-medium"
                      : "border-[#E3D6B8] text-[#3B2F1E] hover:border-stone-300"
                  }`}
                >
                  <div
                    className={`gs-size-icon w-12 h-12 mb-1 rounded-xl flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-[#DC2626]/10 text-[#DC2626]"
                        : "bg-[#F5EDD8] text-[#5A4A32]"
                    }`}
                  >
                    <PhotoSizeIcon id={size.id} size={40} />
                  </div>

                  <span className="truncate max-w-full">
                    <AiT>{size.label}</AiT>
                  </span>

                  {isActive && (
                    <span className="absolute -top-1 -right-1 bg-[#DC2626] text-white rounded-full p-0.5">
                      <Check size={8} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {showVisaPopup && (
            <div className="gs-pop absolute left-0 top-[85px] w-full max-w-[300px] bg-[#FBF6E8] border-2 border-[#DC2626] rounded-2xl shadow-xl p-4 z-50">
              <h4 className="text-sm font-semibold text-[#3B2F1E] mb-3">
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
                    className={`py-2 px-1 text-[13px] rounded-lg border text-center transition-all cursor-pointer ${
                      selectedVisaSize === vItem.label &&
                      selectedSize === "Visa"
                        ? "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626] font-medium"
                        : "border-[#E3D6B8] text-[#3B2F1E] hover:bg-[#EFE3C8]"
                    }`}
                  >
                    {vItem.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {showAdmissionPopup && (
            <div className="gs-pop absolute left-0 top-[85px] w-full max-w-[340px] max-h-[70vh] overflow-y-auto bg-[#FBF6E8] border-2 border-[#DC2626] rounded-2xl shadow-xl p-4 z-50">
              <h4 className="text-sm font-semibold text-[#3B2F1E] mb-3">
                <AiT>{"Admission Photo Size"}</AiT>
              </h4>
              <AdmissionPicker
                selectedLabel={selectedSize === "Admission" ? selectedAdmissionLabel : ""}
                onSelect={(label) => {
                  setSelectedAdmissionLabel(label);
                  setSelectedSize("Admission");
                  setShowAdmissionPopup(false);
                  if (isDualMode) {
                    exitDualMode("Admission");
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* BACKGROUND SECTION */}
        <div
          className="gs-sec gs-bg-sec mb-6 xl:mb-[clamp(6px,1.3vh,20px)] relative"
          ref={colorPickerRef}
        >
          <div className="gs-label text-sm text-stone-500 xl:text-[length:1.0625rem] xl:font-bold xl:text-[#3B2F1E] mb-2">
            <AiT>{"BACKGROUND"}</AiT>
          </div>

          <div className="gs-bgs grid grid-cols-5 xl:grid-cols-10 gap-x-2 gap-y-3 xl:gap-y-[clamp(4px,0.8vh,12px)] justify-items-center">
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
                    className={`w-full max-w-[40px] aspect-square rounded-full relative flex items-center justify-center overflow-hidden transition-transform hover:scale-110 cursor-pointer border border-stone-300 ${isSelected ? "ring-2 ring-[#DC2626] ring-offset-2 ring-offset-[#F2E8D2] shadow-md" : ""}`}
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, #d1d5db 25%, transparent 25%), linear-gradient(-45deg, #d1d5db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d1d5db 75%), linear-gradient(-45deg, transparent 75%, #d1d5db 75%)",
                      backgroundSize: "12px 12px",
                      backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <span className="rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
                      <AiT>{"PNG\n                    "}</AiT>
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 bg-[#DC2626] text-white rounded-full p-0.5">
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
                    className={`w-full max-w-[40px] aspect-square rounded-full relative flex items-center justify-center transition-transform hover:scale-110 shadow-[0_2px_6px_rgba(60,40,10,0.25)] cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-[#DC2626] ring-offset-2 ring-offset-[#F2E8D2] shadow-md"
                        : "border border-stone-200"
                    }`}
                  >
                    <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.14),transparent_50%)] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.28)]" />
                    <Palette size={16} className="relative text-white drop-shadow-md" />

                    {isSelected && (
                      <span className="absolute -top-1 -right-1 bg-[#DC2626] text-white rounded-full p-0.5">
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
                  className={`w-full max-w-[40px] aspect-square rounded-full ${bg.className || ""} relative flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-[0_2px_6px_rgba(60,40,10,0.25)] ${isSelected ? "ring-2 ring-[#DC2626] ring-offset-2 ring-offset-[#F2E8D2]" : ""}`}
                >
                  <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.14),transparent_50%)] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.28)]" />
                  {isSelected && (
                    <span className="absolute bg-[#DC2626] text-white rounded-full p-1 shadow">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {showColorPicker && (
            <div className="gs-pop absolute left-0 top-[90px] w-full max-w-[260px] bg-[#FBF6E8] border-2 border-[#DC2626] rounded-2xl shadow-xl p-4 z-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-[#3B2F1E]">
                  <AiT>{"Custom Background Color\n                "}</AiT>
                </span>

                <button
                  type="button"
                  onClick={() => setShowColorPicker(false)}
                  className="text-stone-400 hover:text-stone-600 cursor-pointer p-1"
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
                    className="w-12 h-10 rounded-lg cursor-pointer border border-stone-200 p-0 bg-transparent"
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
                    className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-mono text-[#3B2F1E] uppercase focus:outline-none focus:border-[#DC2626]"
                    aria-label={t("Custom background hex color")}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CLOTHING STYLE SECTION */}
        <div
          className="gs-sec mb-6 xl:mb-[clamp(6px,1.3vh,20px)] relative flex flex-col xl:flex-none"
          ref={clothingColorPopupRef}
        >
          <div className="gs-label flex justify-between items-center text-sm text-stone-500 xl:text-[length:1.0625rem] xl:font-bold xl:text-[#3B2F1E] mb-2">
            <span>
              <AiT>{"CLOTHING STYLE"}</AiT>
            </span>

            <span className="text-[12px] xl:text-[length:0.875rem] bg-[#E3D6B8] text-[#3B2F1E] px-1.5 py-0.5 rounded font-semibold">
              {CLOTHING_NAMES.length}/{CLOTHING_NAMES.length}
            </span>
          </div>

          <div
            data-scroller
            data-grab
            onScroll={(e) => {
              if (Math.abs(e.currentTarget.scrollTop - popupScrollTopRef.current) > 6) {
                setShowClothingColorPicker(false);
              }
            }}
            className="gs-noscroll ai-scroll cursor-grab relative rounded-2xl overflow-y-auto overflow-x-hidden p-0.5 pr-1.5 max-h-[340px]"
          >
            {!isDualMode ? (
              <>
              <div className="gs-cloth-grid grid gap-2 xl:gap-1.5 justify-items-stretch">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClothing(-1);
                    setShowClothingColorPicker(false);
                  }}
                  className={`w-full rounded-xl border flex flex-col items-center justify-start gap-1 relative bg-[#FBF6E8] cursor-pointer transition-all hover:bg-[#EFE3C8] hover:shadow-sm hover:-translate-y-0.5 px-1 pt-1.5 pb-1 ${
                    selectedClothing === -1
                      ? "border-[#DC2626] ring-2 ring-[#DC2626]/40 bg-[#F6D9A8]"
                      : "border-[#E3D6B8]"
                  }`}
                  aria-label={t("No clothing")}
                  title={t("No clothing")}
                >
                  <span className="flex w-full aspect-square items-center justify-center"><Ban size={28} className="text-stone-400" /></span>
                  <span className="gs-cloth-label w-full truncate text-center text-[12px] xl:text-[length:0.75rem] leading-tight font-semibold text-stone-700">{t("No clothing")}</span>
                </button>

                {CLOTHING_NAMES.map((name, idx) => {
                  const isSelected = selectedClothing === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => handleClothingClick(idx, e.currentTarget)}
                      className={`w-full rounded-xl border flex flex-col items-center justify-start gap-1 relative bg-[#FBF6E8] cursor-pointer transition-all hover:bg-[#EFE3C8] hover:shadow-sm hover:-translate-y-0.5 px-1 pt-1.5 pb-1 overflow-hidden ${
                        isSelected
                          ? "border-[#DC2626] ring-2 ring-[#DC2626]/40 bg-[#F6D9A8]"
                          : "border-[#E3D6B8]"
                      }`}
                      aria-label={t(name)}
                    >
                      <span className="block w-full aspect-square"><RawSvgClothingPreview
                        index={idx}
                        selected={isSelected}
                        color={isSelected ? currentColor : undefined}
                        alt={t(name)}
                      /></span>

                      {isSelected && (
                        <span className="gs-sel-badge absolute top-1 right-1 bg-[#DC2626] text-white rounded-full p-0.5 shadow-sm z-10">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {clothMoreButton("single")}
              </>
            ) : (
              <div className="space-y-4 xl:space-y-0 xl:flex xl:flex-col xl:gap-[var(--gs-dual-gap,16px)]">
                <div>
                  <p className="text-[13px] xl:text-[length:0.875rem] font-semibold text-stone-700 mb-1.5">
                    <AiT>{"Left Person\n                  "}</AiT>
                  </p>

                  <div className="gs-cloth-grid grid gap-2 xl:gap-1.5 justify-items-stretch">
                    <button
                      type="button"
                      onClick={() => {
                        setLeftClothing(-1);
                        setShowClothingColorPicker(false);
                      }}
                      className={`w-full rounded-xl border flex flex-col items-center justify-start gap-1 relative bg-[#FBF6E8] cursor-pointer transition-all hover:bg-[#EFE3C8] hover:shadow-sm hover:-translate-y-0.5 px-1 pt-1.5 pb-1 ${
                        leftClothing === -1
                          ? "border-[#DC2626] ring-2 ring-[#DC2626]/40 bg-[#F6D9A8]"
                          : "border-[#E3D6B8]"
                      }`}
                      aria-label={t("No clothing")}
                  title={t("No clothing")}
                    >
                      <span className="flex w-full aspect-square items-center justify-center"><Ban size={28} className="text-stone-400" /></span>
                      <span className="gs-cloth-label w-full truncate text-center text-[12px] xl:text-[length:0.75rem] leading-tight font-semibold text-stone-700">{t("No clothing")}</span>
                    </button>

                    {CLOTHING_NAMES.map((name, idx) => (
                      <button
                        key={`left-${idx}`}
                        type="button"
                        onClick={(e) => handleClothingClick(idx, e.currentTarget, "left")}
                        className={`w-full rounded-xl border flex flex-col items-center justify-start gap-1 relative bg-[#FBF6E8] cursor-pointer transition-all hover:bg-[#EFE3C8] hover:shadow-sm hover:-translate-y-0.5 px-1 pt-1.5 pb-1 overflow-hidden ${
                          leftClothing === idx
                            ? "border-[#DC2626] ring-2 ring-[#DC2626]/40 bg-[#F6D9A8]"
                            : "border-[#E3D6B8]"
                        }`}
                      >
                        <span className="block w-full aspect-square"><RawSvgClothingPreview
                          index={idx}
                          selected={leftClothing === idx}
                          color={leftClothing === idx ? dualLeftColor : undefined}
                          alt={t(`${name} left person`)}
                        /></span>

                        {leftClothing === idx && (
                          <span className="gs-sel-badge absolute top-1 right-1 bg-[#DC2626] text-white rounded-full p-0.5 shadow-sm z-10">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {clothMoreButton("left")}
                </div>

                <div>
                  <p className="text-[13px] xl:text-[length:0.875rem] font-semibold text-stone-700 mb-1.5">
                    <AiT>{"Right Person\n                  "}</AiT>
                  </p>

                  <div className="gs-cloth-grid grid gap-2 xl:gap-1.5 justify-items-stretch">
                    <button
                      type="button"
                      onClick={() => {
                        setRightClothing(-1);
                        setShowClothingColorPicker(false);
                      }}
                      className={`w-full rounded-xl border flex flex-col items-center justify-start gap-1 relative bg-[#FBF6E8] cursor-pointer transition-all hover:bg-[#EFE3C8] hover:shadow-sm hover:-translate-y-0.5 px-1 pt-1.5 pb-1 ${
                        rightClothing === -1
                          ? "border-[#DC2626] ring-2 ring-[#DC2626]/40 bg-[#F6D9A8]"
                          : "border-[#E3D6B8]"
                      }`}
                      aria-label={t("No clothing")}
                  title={t("No clothing")}
                    >
                      <span className="flex w-full aspect-square items-center justify-center"><Ban size={28} className="text-stone-400" /></span>
                      <span className="gs-cloth-label w-full truncate text-center text-[12px] xl:text-[length:0.75rem] leading-tight font-semibold text-stone-700">{t("No clothing")}</span>
                    </button>

                    {CLOTHING_NAMES.map((name, idx) => (
                      <button
                        key={`right-${idx}`}
                        type="button"
                        onClick={(e) => handleClothingClick(idx, e.currentTarget, "right")}
                        className={`w-full rounded-xl border flex flex-col items-center justify-start gap-1 relative bg-[#FBF6E8] cursor-pointer transition-all hover:bg-[#EFE3C8] hover:shadow-sm hover:-translate-y-0.5 px-1 pt-1.5 pb-1 overflow-hidden ${
                          rightClothing === idx
                            ? "border-[#DC2626] ring-2 ring-[#DC2626]/40 bg-[#F6D9A8]"
                            : "border-[#E3D6B8]"
                        }`}
                      >
                        <span className="block w-full aspect-square"><RawSvgClothingPreview
                          index={idx}
                          selected={rightClothing === idx}
                          color={rightClothing === idx ? dualRightColor : undefined}
                          alt={t(`${name} right person`)}
                        /></span>

                        {rightClothing === idx && (
                          <span className="gs-sel-badge absolute top-1 right-1 bg-[#DC2626] text-white rounded-full p-0.5 shadow-sm z-10">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {clothMoreButton("right")}
                </div>
              </div>
            )}
          </div>

          {showClothingColorPicker && activeClothingIndex >= 0 && (
            <div
              ref={clothingPopupRef}
              data-no-drag
              style={{
                left: clothingPopupPos.left,
                top: clothingPopupPos.above ? undefined : clothingPopupPos.top,
                bottom: clothingPopupPos.above ? clothingPopupPos.bottom : undefined,
              }}
              className="absolute w-full max-w-[280px] bg-[#F0DDB5] border-2 border-[#DC2626] rounded-2xl shadow-xl p-4 z-[60] animate-in fade-in zoom-in-95 duration-150"
            >
              <span
                aria-hidden="true"
                style={{ left: clothingPopupPos.caretX - 7 }}
                className={`absolute h-3.5 w-3.5 rotate-45 bg-[#F0DDB5] border-[#DC2626] ${
                  clothingPopupPos.above
                    ? "-bottom-[9px] border-b-2 border-r-2"
                    : "-top-[9px] border-t-2 border-l-2"
                }`}
              />
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-[#3B2F1E]">
                  <AiT>{CLOTHING_NAMES[activeClothingIndex] || "Clothing"}</AiT>
                  <AiT>
                    {"\u2014 Pick a\n                  Color\n                "}
                  </AiT>
                </span>

                <button
                  type="button"
                  onClick={() => setShowClothingColorPicker(false)}
                  className="text-stone-400 hover:text-stone-600 cursor-pointer p-0.5"
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
                      className={`w-8 h-8 rounded-full border border-stone-400/40 shadow-sm flex items-center justify-center transition-transform hover:scale-110 cursor-pointer relative ${
                        isColorActive
                          ? "ring-2 ring-[#DC2626] ring-offset-2 ring-offset-[#F0DDB5]"
                          : ""
                      }`}
                    >
                      {isColorActive && (
                        <Check
                          size={12}
                          className={
                            color.hex === "#FFFFFF" || color.hex === "#E5E7EB"
                              ? "text-stone-900"
                              : "text-white"
                          }
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              {!isDualMode && canHaveTie(CLOTHING_NAMES[activeClothingIndex]) && (
                <TiePicker
                  compact
                  className="mt-3"
                  value={getTieFromGuides(activeGuides)}
                  onChange={(name) => setActiveGuides((prev) => withTie(prev, name))}
                />
              )}
            </div>
          )}
        </div>

        {/* EXTRA EDITING GUIDE */}
        <div className="gs-sec mb-4 xl:mb-[clamp(4px,0.8vh,12px)] relative shrink-0">
          <div className="gs-label flex justify-between items-center text-sm text-stone-500 xl:text-[length:1.0625rem] xl:font-bold xl:text-[#3B2F1E] mb-2 pt-1">
            <span className="font-semibold">
              <AiT>{"EXTRA EDITING GUIDE"}</AiT>
            </span>
            <span
              className="text-[12px] xl:text-[length:0.875rem] bg-[#E3D6B8] text-[#3B2F1E] px-1.5 py-0.5 rounded font-semibold tabular-nums"
              title={t("Editing presets plus custom instruction")}
            >
              {activeGuides.filter((g) => !isOptionEntry(g)).length}/{EDITING_GUIDES.length}
            </span>
          </div>

          <div className="rounded-2xl p-0.5">
            <div data-guide-scroller data-scroller data-grab className="gs-noscroll rounded-xl p-0.5">
            <div className="gs-guide-grid grid gap-2">
              {QUICK_EDITING_GUIDES.map((item) => {
                const active = activeGuides.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleGuide(item)}
                    title={t(item)}
                    data-prio={guideRank(item)}
                    className={`gs-guide-tile xl:min-h-0 min-h-[50px] flex flex-col items-center justify-center p-2 xl:p-2 rounded-xl border text-[13px] xl:text-[length:0.8125rem] font-semibold text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] ${
                      active
                        ? "gs-guide-on border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]"
                        : "border-[#E3D6B8] text-[#3B2F1E] hover:bg-[#EFE3C8]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`gs-guide-icon mb-0.5 flex h-11 w-11 xl:h-[56px] xl:w-[56px] items-center justify-center rounded-lg transition-colors ${
                        active ? "bg-transparent" : "bg-transparent"
                      }`}
                    >
                      <GuideIcon label={item} size="100%" />
                    </span>
                    <span className="gs-guide-text leading-[1.15] line-clamp-2 xl:line-clamp-3 break-words">{t(item)}</span>
                  </button>
                );
              })}
            </div>
            </div>

            <div className="gs-actions grid grid-cols-1 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowEditingGuideLibrary(true)}
                className="min-h-[36px] flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-[#FBB6B6] bg-[#FEE9E9] text-[#B91C1C] text-[13px] xl:text-[length:0.9375rem] font-semibold transition-colors hover:bg-[#F6D9A8] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
              >
                <Search size={18} aria-hidden="true" />
                <AiT>{"Browse all editing guides"}</AiT>
                <span className="rounded-full bg-white/80 px-1.5 py-0.5 tabular-nums">
                  {EDITING_GUIDES.length}
                </span>
              </button>
            </div>
            <p className="gs-hint mt-1.5 text-[13px] xl:text-[length:0.8125rem] leading-snug text-stone-700">
              <AiT>{"Choose a few compatible edits for the best result."}</AiT>
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2 mt-auto">
        {onOpenSetupWizard && (
          <button
            type="button"
            onClick={onOpenSetupWizard}
            disabled={isGenerating}
            className="mb-2 w-full rounded-xl border-2 border-[#DC2626]/70 bg-[#FBF6E8] px-3 py-2 xl:py-[clamp(5px,0.9vh,9px)] flex items-center justify-center gap-3 text-left transition-all hover:bg-[#F6D9A8] hover:shadow-md cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DC2626] text-white">
              <ListChecks size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] xl:text-[length:1rem] font-bold leading-tight text-[#3B2F1E]">ধাপে ধাপে গাইড নিন</span>
              <span className="block text-[12px] xl:text-[length:0.75rem] leading-tight text-stone-600">কী সিলেক্ট করবেন বুঝতে না পারলে ক্লিক করুন, আমি সাজিয়ে দিচ্ছি</span>
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className={`gs-gen w-full font-medium py-3 xl:py-[clamp(7px,1.2vh,12px)] rounded-xl shadow-md transition-all text-base xl:text-[length:1.125rem] flex items-center justify-center gap-2 ${
            isGenerating
              ? "bg-[#D42020]/70 text-white cursor-not-allowed opacity-90"
              : "bg-[#D42020] hover:bg-[#AE1717] text-white cursor-pointer active:scale-[0.98]"
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
      </div>
      {clothModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="ai-editor-font fixed inset-0 z-[1000] flex items-center justify-center bg-stone-950/60 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setClothModal(null);
            }}
            role="presentation"
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="clothing-library-title"
              className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-stone-200 bg-[#FBF6E8] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
            >
              <div className="flex items-start gap-4 border-b border-stone-100 px-5 py-4 sm:px-7 sm:py-5">
                <div className="min-w-0 flex-1">
                  <h2 id="clothing-library-title" className="text-lg sm:text-xl font-semibold tracking-tight text-stone-900">
                    <AiT>{"Clothing Library"}</AiT>
                    {isDualMode && (
                      <span className="ml-2 text-base font-semibold text-[#DC2626]">
                        — <AiT>{clothModal === "left" ? "Left Person" : "Right Person"}</AiT>
                      </span>
                    )}
                  </h2>
                  <p className="mt-1 text-sm sm:text-base leading-5 text-stone-500">
                    <AiT>{"Choose a clothing style and its color."}</AiT>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setClothModal(null)}
                  aria-label={t("Close")}
                  className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                  <button
                    type="button"
                    onClick={() => pickClothingInModal(-1)}
                    aria-label={t("No clothing")}
                    title={t("No clothing")}
                    className={`flex w-full flex-col items-center justify-start gap-1 rounded-xl border px-1 pt-1.5 pb-1 transition-all cursor-pointer hover:bg-[#EFE3C8] ${
                      modalSelected === -1 ? "border-[#DC2626] ring-2 ring-[#DC2626]/40 bg-[#F6D9A8]" : "border-[#E3D6B8] bg-[#FBF6E8]"
                    }`}
                  >
                    <span className="flex w-full aspect-square items-center justify-center"><Ban size={26} className="text-stone-400" /></span>
                    <span className="w-full truncate text-center text-[12px] leading-tight font-semibold text-stone-700">{t("No clothing")}</span>
                  </button>
                  {CLOTHING_NAMES.map((name, idx) => {
                    const picked = modalSelected === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => pickClothingInModal(idx)}
                        aria-label={t(name)}
                        title={t(name)}
                        className={`relative flex w-full flex-col items-center justify-start gap-1 overflow-hidden rounded-xl border px-1 pt-1.5 pb-1 transition-all cursor-pointer hover:bg-[#EFE3C8] ${
                          picked ? "border-[#DC2626] ring-2 ring-[#DC2626]/40 bg-[#F6D9A8]" : "border-[#E3D6B8] bg-[#FBF6E8]"
                        }`}
                      >
                        <span className="block w-full aspect-square">
                          <RawSvgClothingPreview index={idx} selected={picked} color={picked ? modalColor : undefined} alt={t(name)} />
                        </span>
                        {picked && (
                          <span className="absolute top-1 right-1 z-10 rounded-full bg-[#DC2626] p-0.5 text-white shadow-sm">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-stone-100 bg-stone-50/70 px-4 py-3 sm:px-6">
                {modalSelected >= 0 && (
                  <div className="mb-3">
                    <p className="mb-2 text-sm font-semibold text-[#3B2F1E]">
                      <AiT>{CLOTHING_NAMES[modalSelected] || "Clothing"}</AiT> <AiT>{"— Pick a Color"}</AiT>
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {CLOTHING_COLORS.map((color) => {
                        const active = modalColor.toUpperCase() === color.hex.toUpperCase();
                        return (
                          <button
                            key={color.hex}
                            type="button"
                            onClick={() => pickColorInModal(color.hex)}
                            title={t(color.name)}
                            aria-label={t(color.name)}
                            style={{ backgroundColor: color.hex }}
                            className={`relative flex h-8 w-8 items-center justify-center rounded-full border border-stone-400/40 shadow-sm transition-transform hover:scale-110 cursor-pointer ${
                              active ? "ring-2 ring-[#DC2626] ring-offset-2 ring-offset-[#FBF6E8]" : ""
                            }`}
                          >
                            {active && (
                              <Check size={12} strokeWidth={3} className={color.hex === "#FFFFFF" || color.hex === "#E5E7EB" ? "text-stone-900" : "text-white"} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setClothModal(null)}
                  className="w-full cursor-pointer rounded-xl bg-[#DC2626] px-4 py-2.5 text-base font-bold text-white transition hover:bg-[#B91C1C]"
                >
                  <AiT>{"Done"}</AiT>
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
      {showEditingGuideLibrary &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="ai-editor-font fixed inset-0 z-[1000] flex items-center justify-center bg-stone-950/60 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200"
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
              className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-stone-200 bg-[#FBF6E8] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
            >
              <div className="flex items-start gap-4 border-b border-stone-100 px-5 py-4 sm:px-7 sm:py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <Sparkles size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2
                    id="editing-guide-library-title"
                    className="text-lg sm:text-xl font-semibold tracking-tight text-stone-900"
                  >
                    <AiT>{"Editing Guide Library"}</AiT>
                  </h2>
                  <p
                    id="editing-guide-library-description"
                    className="mt-1 text-sm sm:text-base leading-5 text-stone-500"
                  >
                    <AiT>{"Choose compatible edits to apply to your photo."}</AiT>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditingGuideLibrary(false)}
                  aria-label={t("Close")}
                  className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 border-b border-stone-100 bg-stone-50/70 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:px-6">
                <div className="relative">
                  <Search
                    size={15}
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                  />
                  <input
                    ref={editingGuideSearchRef}
                    type="search"
                    value={guideSearch}
                    onChange={(event) => setGuideSearch(event.target.value)}
                    placeholder={t("Search editing guides...")}
                    aria-label={t("Search editing guides...")}
                    className="w-full rounded-xl border border-stone-200 bg-[#FBF6E8] py-2.5 pl-9 pr-3 text-base text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/10"
                  />
                </div>
                <select
                  value={guideCategory}
                  onChange={(event) => setGuideCategory(event.target.value)}
                  aria-label={t("Filter editing guides by category")}
                  className="w-full rounded-xl border border-stone-200 bg-[#FBF6E8] px-3 py-2.5 text-base text-stone-800 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/10 cursor-pointer"
                >
                  {EDITING_GUIDE_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {t(category.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                <div className="mb-3 flex items-center justify-between gap-3 text-sm text-stone-500">
                  <span>
                    {filteredEditingGuides.length} <AiT>{"presets shown"}</AiT>
                  </span>
                  <span className="tabular-nums">
                    {activeGuides.filter((g) => !isOptionEntry(g)).length} <AiT>{"selected"}</AiT>
                  </span>
                </div>
                {filteredEditingGuides.length > 0 ? (
                  <div className="space-y-5">
                    {groupedEditingGuides.map((group) => (
                      <section key={group.id} aria-label={t(group.label)}>
                        <h3 className="sticky top-0 z-[1] -mx-1 mb-2 flex items-center gap-2 bg-[#FBF6E8]/95 px-1 py-1.5 text-sm sm:text-base font-bold text-[#3B2F1E] backdrop-blur">
                          <span className="h-4 w-1 rounded-full bg-red-600" aria-hidden="true" />
                          <span>{t(group.label)}</span>
                          <span className="rounded-full bg-[#E3D6B8] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[#3B2F1E]">
                            {group.guides.length}
                          </span>
                        </h3>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                          {group.guides.map((guide) => {
                            const active = activeGuides.includes(guide.label);
                            return (
                              <button
                                key={guide.label}
                                type="button"
                                aria-pressed={active}
                                onClick={() => toggleGuide(guide.label)}
                                title={t(guide.label)}
                                className={`flex min-h-[64px] items-start rounded-xl border p-3 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
                                  active
                                    ? "border-red-600 bg-red-50 ring-1 ring-red-100"
                                    : "border-stone-200 bg-[#FBF6E8] hover:border-red-200 hover:bg-[#EFE3C8]"
                                }`}
                              >
                                <span className="flex w-full items-start justify-between gap-2">
                                  <span className="flex min-w-0 items-start gap-2">
                                    <span
                                      aria-hidden="true"
                                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
                                    >
                                      <GuideIcon label={guide.label} size={36} />
                                    </span>
                                    <span className={`min-w-0 text-sm sm:text-base font-medium leading-5 ${active ? "text-red-700" : "text-stone-800"}`}>
                                      {t(guide.label)}
                                    </span>
                                  </span>
                                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? "border-red-600 bg-red-600 text-white" : "border-stone-300 text-transparent"}`}>
                                    <Check size={10} strokeWidth={3} aria-hidden="true" />
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-12 text-center text-base text-stone-500">
                    <AiT>{"No matching editing guides."}</AiT>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-stone-100 bg-[#FBF6E8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-[13px] leading-5 text-stone-500">
                  <AiT>{"Choose a few compatible edits for the best result."}</AiT>
                </p>
                <button
                  type="button"
                  onClick={() => setShowEditingGuideLibrary(false)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-base font-semibold text-white transition-colors hover:bg-red-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                >
                  <Check size={16} aria-hidden="true" />
                  <AiT>{"Done"}</AiT>
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </div>
  );
}
