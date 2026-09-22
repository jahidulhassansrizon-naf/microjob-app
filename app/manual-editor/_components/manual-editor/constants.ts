import type { EditorFilters, SizePreset } from "./types";

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const DPI = 300;

export const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const PASSPORT_PRESET: SizePreset = {
  id: "passport-45x55",
  label: "45 × 55 mm",
  widthMm: 45,
  heightMm: 55,
};

export const VISA_PRESETS: SizePreset[] = [
  {
    id: "2x2",
    label: "2×2 inch",
    widthMm: 50.8,
    heightMm: 50.8,
  },
  {
    id: "35x45",
    label: "35×45 mm",
    widthMm: 35,
    heightMm: 45,
  },
  {
    id: "40x60",
    label: "40×60 mm",
    widthMm: 40,
    heightMm: 60,
  },
  {
    id: "40x50",
    label: "40×50 mm",
    widthMm: 40,
    heightMm: 50,
  },
  {
    id: "40x40",
    label: "40×40 mm",
    widthMm: 40,
    heightMm: 40,
  },
  {
    id: "50x50",
    label: "50×50 mm",
    widthMm: 50,
    heightMm: 50,
  },
  {
    id: "50x70",
    label: "50×70 mm",
    widthMm: 50,
    heightMm: 70,
  },
  {
    id: "33x48",
    label: "33×48 mm",
    widthMm: 33,
    heightMm: 48,
  },
  {
    id: "35x50",
    label: "35×50 mm",
    widthMm: 35,
    heightMm: 50,
  },
  {
    id: "36x47",
    label: "36×47 mm",
    widthMm: 36,
    heightMm: 47,
  },
  {
    id: "38x48",
    label: "38×48 mm",
    widthMm: 38,
    heightMm: 48,
  },
  {
    id: "50x60",
    label: "50×60 mm",
    widthMm: 50,
    heightMm: 60,
  },
];

export const R_SIZE_PRESETS: SizePreset[] = [
  {
    id: "2r",
    label: "2R — 60×89 mm",
    widthMm: 60,
    heightMm: 89,
  },
  {
    id: "3r",
    label: "3R — 89×127 mm",
    widthMm: 89,
    heightMm: 127,
  },
  {
    id: "4r",
    label: "4R — 102×152 mm",
    widthMm: 102,
    heightMm: 152,
  },
  {
    id: "5r",
    label: "5R — 127×178 mm",
    widthMm: 127,
    heightMm: 178,
  },
  {
    id: "6r",
    label: "6R — 152×203 mm",
    widthMm: 152,
    heightMm: 203,
  },
  {
    id: "8r",
    label: "8R — 203×254 mm",
    widthMm: 203,
    heightMm: 254,
  },
  {
    id: "a4",
    label: "A4 — 210×297 mm",
    widthMm: 210,
    heightMm: 297,
  },
  {
    id: "a4-landscape",
    label: "A4 ↔ — 297×210 mm",
    widthMm: 297,
    heightMm: 210,
  },
  {
    id: "letter",
    label: "Letter — 216×279 mm",
    widthMm: 216,
    heightMm: 279,
  },
];

export const BACKGROUNDS = [
  {
    id: "white",
    color: "#ffffff",
  },
  {
    id: "blue1",
    color: "#bae6fd",
  },
  {
    id: "blue2",
    color: "#7dd3fc",
  },
  {
    id: "gray",
    color: "#d1d5db",
  },
  {
    id: "periwinkle",
    color: "#c7d2fe",
  },
  {
    id: "mint",
    color: "#99f6e4",
  },
  {
    id: "cream",
    color: "#fef9c3",
  },
];

export const DEFAULT_FILTERS: EditorFilters = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharp: 0,
};
