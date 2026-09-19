"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  RefreshCw,
  Sparkles,
  Check,
  Palette,
  X,
  ImageIcon,
  Loader2,
  Ban,
} from "lucide-react";

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
  exitDualMode?: () => void;
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
}

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

const CLOTHING_NAMES = [
  "Shirt",
  "Polo",
  "Suit",
  "Blazer",
  "Saree",
  "Hijab",
  "Panjabi",
  "Dress",
  "T-Shirt",
  "Abaya",
  "Burqa",
  "Kameez",
  "Kurti",
  "Jacket",
];

/*
 * IMPORTANT:
 * These are the actual paint colors used by your uploaded raw SVGs.
 * We recolor only these paint groups. Skin, outlines, background-card
 * fills, ties, and unrelated details stay untouched.
 */
const RECOLOR_PALETTE: Record<number, string[]> = {
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

/*
 * Preserve the original SVG shade/lightness while moving the hue/saturation
 * to the selected garment color. This makes folds, shadows and highlights
 * survive the recolor instead of putting a flat translucent tint on top.
 */
function recolorHex(sourceHex: string, targetHex: string) {
  const source = hexToRgb(sourceHex);
  const target = hexToRgb(targetHex);

  const sourceHsl = rgbToHsl(source.r, source.g, source.b);
  const targetHsl = rgbToHsl(target.r, target.g, target.b);

  // Keep original light/dark structure. Slightly tame saturation for
  // very bright target colors so highlight shades do not become neon.
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

function svgToObjectUrl(svg: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  return URL.createObjectURL(blob);
}

async function getRecoloredSvgUrl(clothingIndex: number, targetColor: string) {
  const cacheKey = `${clothingIndex}:${targetColor.toUpperCase()}`;
  const cachedUrl = recoloredSvgCache.get(cacheKey);

  if (cachedUrl) return cachedUrl;

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
          // Do not apply a fake CSS tint on failure.
          // Showing the original SVG is safer than recoloring the wrong parts.
          setDisplaySrc(originalSrc);
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [index, originalSrc, selected, color]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg bg-gray-50">
      <img
        src={displaySrc}
        alt={alt}
        className={`w-full h-full object-cover rounded-lg scale-105 transition-opacity duration-150 ${
          isReady ? "opacity-100" : "opacity-80"
        }`}
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
}: GenerationSettingsProps) {
  const [showClothingColorPicker, setShowClothingColorPicker] = useState(false);
  const [internalClothingColor, setInternalClothingColor] = useState("#EF4444");
  const clothingColorPopupRef = useRef<HTMLDivElement>(null);

  const currentColor = setSelectedClothingColor
    ? selectedClothingColor
    : internalClothingColor;

  const handleColorChange = (hex: string) => {
    if (setSelectedClothingColor) {
      setSelectedClothingColor(hex);
    } else {
      setInternalClothingColor(hex);
    }
  };

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

  return (
    <div className="w-full max-w-full lg:w-[320px] bg-white rounded-2xl p-4 shadow-sm overflow-y-auto max-h-none lg:max-h-[calc(100vh-100px)] flex flex-col justify-between relative shrink-0">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-sm text-gray-800 flex items-center gap-2">
            <span className="w-1 h-4 bg-orange-500 rounded-full" />
            Generation settings
          </span>
        </div>

        {/* PHOTO SIZE SECTION */}
        <div className="mb-6 relative" ref={visaPopupRef}>
          <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
            <span>PHOTO SIZE</span>
            <RefreshCw
              size={14}
              className="cursor-pointer text-orange-500 hover:rotate-180 transition-transform duration-300"
            />
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-5 gap-2">
            {photoSizes.map((size) => {
              const isActive = selectedSize === size.id;

              return (
                <button
                  key={size.id}
                  onClick={() => handleSizeClick(size.id)}
                  title={size.tooltip}
                  type="button"
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] relative transition-all cursor-pointer ${
                    isActive
                      ? "border-orange-500 bg-orange-50/50 text-orange-600 font-medium"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <div className="w-6 h-6 mb-1 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                    <ImageIcon size={14} />
                  </div>

                  <span className="truncate max-w-full">{size.label}</span>

                  {isActive && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-0.5">
                      <Check size={8} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {showVisaPopup && (
            <div className="absolute left-0 top-[85px] w-full max-w-[300px] bg-white border-2 border-orange-400 rounded-2xl shadow-xl p-4 z-50">
              <h4 className="text-xs font-semibold text-gray-800 mb-3">
                Visa Photo Size
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
                        exitDualMode();
                      }
                    }}
                    className={`py-2 px-1 text-[11px] rounded-lg border text-center transition-all cursor-pointer ${
                      selectedVisaSize === vItem.label &&
                      selectedSize === "Visa"
                        ? "border-orange-500 bg-orange-50 text-orange-600 font-medium"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
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
        <div className="mb-6 relative" ref={colorPickerRef}>
          <div className="text-xs text-gray-500 mb-2">BACKGROUND</div>

          <div className="grid grid-cols-4 gap-2">
            {backgroundColors.map((bg, idx) => {
              const isSelected = selectedBg === idx;

              if (bg.type === "custom") {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedBg(idx);
                      setShowColorPicker((prev) => !prev);
                    }}
                    style={{ backgroundColor: customBgColor }}
                    className={`h-9 rounded-xl relative flex items-center justify-center transition-transform hover:scale-105 shadow-inner cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-orange-500 ring-offset-2"
                        : "border border-gray-200"
                    }`}
                  >
                    <Palette size={16} className="text-white drop-shadow-md" />

                    {isSelected && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-0.5">
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
                    setSelectedBg(idx);
                    setShowColorPicker(false);
                  }}
                  className={`h-9 rounded-xl ${bg.className || ""} relative flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${
                    isSelected ? "ring-2 ring-orange-500 ring-offset-2" : ""
                  }`}
                >
                  {isSelected && (
                    <span className="absolute bg-orange-500 text-white rounded-full p-0.5">
                      <Check size={10} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {showColorPicker && (
            <div className="absolute left-0 top-[90px] w-full max-w-[260px] bg-white border-2 border-orange-400 rounded-2xl shadow-xl p-4 z-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-gray-800">
                  Custom Background Color
                </span>

                <button
                  type="button"
                  onClick={() => setShowColorPicker(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200 p-0 bg-transparent"
                  />

                  <input
                    type="text"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-700 uppercase focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CLOTHING STYLE SECTION */}
        <div className="mb-6 relative" ref={clothingColorPopupRef}>
          <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
            <span>CLOTHING STYLE</span>

            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
              14/14
            </span>
          </div>

          {!isDualMode ? (
            <div className="grid grid-cols-7 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedClothing(-1);
                  setShowClothingColorPicker(false);
                }}
                className={`h-11 rounded-xl border flex items-center justify-center relative bg-gray-50 cursor-pointer transition-all hover:bg-gray-100 p-0.5 ${
                  selectedClothing === -1
                    ? "border-orange-500 ring-2 ring-orange-500/50 bg-orange-50/20"
                    : "border-gray-200"
                }`}
                aria-label="No clothing"
              >
                <Ban size={18} className="text-gray-400" />
              </button>

              {CLOTHING_NAMES.map((name, idx) => {
                const isSelected = selectedClothing === idx;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleClothingClick(idx)}
                    className={`h-11 rounded-xl border flex items-center justify-center relative bg-gray-50 cursor-pointer transition-all hover:bg-gray-100 p-0.5 overflow-hidden ${
                      isSelected
                        ? "border-orange-500 ring-2 ring-orange-500/50 bg-orange-50/20"
                        : "border-gray-200"
                    }`}
                    aria-label={name}
                  >
                    <RawSvgClothingPreview
                      index={idx}
                      selected={isSelected}
                      color={isSelected ? currentColor : undefined}
                      alt={name}
                    />

                    {isSelected && (
                      <span className="absolute bottom-0.5 right-0.5 bg-orange-500 text-white rounded-full p-0.5 shadow-sm z-10">
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
                <p className="text-[11px] font-medium text-gray-600 mb-1.5">
                  Left Person
                </p>

                <div className="grid grid-cols-7 gap-1.5">
                  {CLOTHING_NAMES.map((name, idx) => (
                    <button
                      key={`left-${idx}`}
                      type="button"
                      onClick={() => setLeftClothing(idx)}
                      className={`h-11 rounded-xl border flex items-center justify-center relative bg-gray-50 cursor-pointer transition-all hover:bg-gray-100 p-0.5 overflow-hidden ${
                        leftClothing === idx
                          ? "border-orange-500 ring-2 ring-orange-500/50 bg-orange-50/20"
                          : "border-gray-200"
                      }`}
                    >
                      <RawSvgClothingPreview
                        index={idx}
                        selected={false}
                        alt={`${name} left person`}
                      />

                      {leftClothing === idx && (
                        <span className="absolute bottom-0.5 right-0.5 bg-orange-500 text-white rounded-full p-0.5 shadow-sm z-10">
                          <Check size={8} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-gray-600 mb-1.5">
                  Right Person
                </p>

                <div className="grid grid-cols-7 gap-1.5">
                  {CLOTHING_NAMES.map((name, idx) => (
                    <button
                      key={`right-${idx}`}
                      type="button"
                      onClick={() => setRightClothing(idx)}
                      className={`h-11 rounded-xl border flex items-center justify-center relative bg-gray-50 cursor-pointer transition-all hover:bg-gray-100 p-0.5 overflow-hidden ${
                        rightClothing === idx
                          ? "border-orange-500 ring-2 ring-orange-500/50 bg-orange-50/20"
                          : "border-gray-200"
                      }`}
                    >
                      <RawSvgClothingPreview
                        index={idx}
                        selected={false}
                        alt={`${name} right person`}
                      />

                      {rightClothing === idx && (
                        <span className="absolute bottom-0.5 right-0.5 bg-orange-500 text-white rounded-full p-0.5 shadow-sm z-10">
                          <Check size={8} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showClothingColorPicker && selectedClothing >= 0 && (
            <div className="absolute left-0 top-12 w-full max-w-[280px] bg-white border-2 border-orange-400 rounded-2xl shadow-xl p-4 z-[60] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-gray-800">
                  {CLOTHING_NAMES[selectedClothing] || "Clothing"} — Pick a
                  Color
                </span>

                <button
                  type="button"
                  onClick={() => setShowClothingColorPicker(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                  aria-label="Close clothing color picker"
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
                      title={color.name}
                      style={{ backgroundColor: color.hex }}
                      className={`w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer relative ${
                        isColorActive
                          ? "ring-2 ring-orange-500 ring-offset-2"
                          : ""
                      }`}
                    >
                      {isColorActive && (
                        <Check
                          size={12}
                          className={
                            color.hex === "#FFFFFF" || color.hex === "#E5E7EB"
                              ? "text-gray-900"
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
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
            <span>EXTRA EDITING GUIDE</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
              7/22
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2">
            {[
              "Glow & Makeup",
              "Smooth Skin",
              "Brighten Image",
              "Studio Lighting",
              "Straighten Head",
              "Keep Marks",
              "Lipstick",
              "Custom Instruction",
            ].map((item) => (
              <button
                key={item}
                type="button"
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-gray-200 text-[9px] text-center text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Sparkles size={14} className="mb-1 text-gray-400" />
                <span className="leading-tight">{item}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2 mt-auto">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full font-medium py-3 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 ${
            isGenerating
              ? "bg-amber-400 text-white cursor-not-allowed opacity-90"
              : "bg-[#f59e0b] hover:bg-[#d97706] text-white cursor-pointer active:scale-[0.98]"
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Generating Photo...</span>
            </>
          ) : (
            <span>Generate Photo</span>
          )}
        </button>
      </div>
    </div>
  );
}
