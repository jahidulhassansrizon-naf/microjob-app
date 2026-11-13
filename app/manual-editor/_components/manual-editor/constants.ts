import { ADMISSION_PRESETS, type AdmissionFormat } from "@/app/ai-editor/_components/admissionSizes";
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

/**
 * Exact photo-lab sizes (defined in inches). Using rounded millimetres here made
 * 4R come out as 1205×1795 px instead of the real 1200×1800 px at 300 DPI.
 */
export const R_SIZE_PRESETS: SizePreset[] = [
  { id: "2r", label: "2R — 2.5×3.5 inch", widthMm: 63.5, heightMm: 88.9 },
  { id: "3r", label: "3R — 3.5×5 inch", widthMm: 88.9, heightMm: 127 },
  { id: "4r", label: "4R — 4×6 inch", widthMm: 101.6, heightMm: 152.4 },
  { id: "5r", label: "5R — 5×7 inch", widthMm: 127, heightMm: 177.8 },
  { id: "6r", label: "6R — 6×8 inch", widthMm: 152.4, heightMm: 203.2 },
  { id: "8r", label: "8R — 8×10 inch", widthMm: 203.2, heightMm: 254 },
  { id: "a4", label: "A4 — 210×297 mm", widthMm: 210, heightMm: 297 },
  { id: "a4-landscape", label: "A4 ↔ — 297×210 mm", widthMm: 297, heightMm: 210 },
  { id: "letter", label: "Letter — 8.5×11 inch", widthMm: 215.9, heightMm: 279.4 },
];

/** Physical size (mm) that `px` pixels cover at DPI. Used only for preview and printing. */
export function pxToMm(px: number) {
  return Math.round(((px / DPI) * 25.4) * 100) / 100;
}

export const ADMISSION_ID_PREFIX = "adm-";

export function buildAdmissionSizePreset(spec: {
  id: string;
  label: string;
  widthPx: number;
  heightPx: number;
  minKB?: number;
  maxKB?: number;
  format: AdmissionFormat;
  note?: string;
}): SizePreset {
  return {
    id: `${ADMISSION_ID_PREFIX}${spec.id}`,
    label: spec.label,
    widthMm: pxToMm(spec.widthPx),
    heightMm: pxToMm(spec.heightPx),
    widthPx: Math.round(spec.widthPx),
    heightPx: Math.round(spec.heightPx),
    minKB: spec.minKB,
    maxKB: spec.maxKB,
    format: spec.format,
    note: spec.note,
  };
}

/**
 * Same list the AI Editor uses (app/ai-editor/_components/admissionSizes.ts),
 * so a new university added there shows up in the Manual Editor automatically.
 */
export const ADMISSION_SIZE_PRESETS: SizePreset[] = ADMISSION_PRESETS.map((p) =>
  buildAdmissionSizePreset({
    id: p.id,
    label: p.title,
    widthPx: p.widthPx,
    heightPx: p.heightPx,
    minKB: p.minKB,
    maxKB: p.maxKB,
    format: p.format,
    note: p.note,
  }),
);

/**
 * Real-world photo backgrounds (passport / visa / NID / job / admission forms).
 * Order matters: the most commonly required background comes first.
 */
export const BACKGROUNDS = [
  // Passport, visa, NID, most govt. & admission forms
  { id: "white", color: "#ffffff" },
  // UK / Schengen / many online exams (neutral light grey)
  { id: "lightgray", color: "#e6e6e6" },
  // UK passport "cream" option, some old-style forms
  { id: "cream", color: "#f3ead3" },
  // Studio pale blue - very common for CV, school & college photos
  { id: "paleblue", color: "#dcebf9" },
  // Light sky blue - job / board / university application photos
  { id: "skyblue", color: "#a9cff0" },
  // Standard ID blue (#438EDB) - China visa/ID, many ID cards
  { id: "idblue", color: "#438edb" },
  // Standard red (#D9261C) - China / Vietnam ID, some job & govt. forms
  { id: "red", color: "#d9261c" },
];

export const DEFAULT_FILTERS: EditorFilters = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharp: 0,
};
