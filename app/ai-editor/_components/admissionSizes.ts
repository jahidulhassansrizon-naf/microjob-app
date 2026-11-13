/**
 * Admission / application photo presets (exact pixels + file-size limit + format).
 *
 * HOW TO ADD A NEW UNIVERSITY: add one object to ADMISSION_PRESETS below.
 * That is all. The editor, the step-by-step guide, the download (exact pixels,
 * KB limit, JPG/PNG) and the recent-photos export all pick it up automatically.
 *
 * Numbers marked "verified" were checked against the official portal / a news
 * report of the official notice (see `source`). Universities change these rules
 * almost every year, so re-check `source` before each admission season.
 */

export type AdmissionFormat = "jpg" | "png" | "any";

export type AdmissionPreset = {
  id: string;
  /** Short title shown on the button. */
  title: string;
  /** Group heading inside the popup. */
  group: "university" | "job" | "general";
  widthPx: number;
  heightPx: number;
  minKB?: number;
  maxKB: number;
  format: AdmissionFormat;
  /** Short extra hint shown under the title (Bangla). */
  note?: string;
  /** Where the numbers came from. */
  source?: string;
};

export const ADMISSION_PRESETS: AdmissionPreset[] = [
  {
    id: "du",
    title: "ঢাকা বিশ্ববিদ্যালয় (DU)",
    group: "university",
    widthPx: 470,
    heightPx: 610,
    minKB: 30,
    maxKB: 200,
    format: "jpg",
    note: "প্রস্থ ৪৬০–৪৮০, উচ্চতা ৬০০–৬২০ পিক্সেল",
    source: "admission.eis.du.ac.bd (2026-27 undergraduate)",
  },
  {
    id: "gst",
    title: "গুচ্ছ (GST) ১৯ বিশ্ববিদ্যালয়",
    group: "university",
    widthPx: 300,
    heightPx: 300,
    maxKB: 100,
    format: "jpg",
    note: "সাদা ব্যাকগ্রাউন্ড, স্টুডিও কোয়ালিটি",
    source: "Prothom Alo, GST notice 2025-26 (check the 2026-27 notice)",
  },
  {
    id: "cuet",
    title: "চুয়েট (CUET)",
    group: "university",
    widthPx: 300,
    heightPx: 300,
    maxKB: 300,
    format: "jpg",
    source: "admissioncuet.ac.bd FAQ",
  },
  {
    id: "niter",
    title: "নাইটার (NITER)",
    group: "university",
    widthPx: 300,
    heightPx: 300,
    maxKB: 200,
    format: "any",
    note: "নাইটারের নির্দেশনায় ২০০–৪০০ KB পাওয়া যায়, নিরাপদ ২০০ KB",
    source: "admission.niter.edu.bd (form + manual differ; 200 KB is safe for both)",
  },
  {
    id: "bcs",
    title: "BCS / সরকারি চাকরি",
    group: "job",
    widthPx: 300,
    heightPx: 300,
    maxKB: 100,
    format: "jpg",
    note: "BPSC ও NBR চাকরির আবেদনে একই",
    source: "Prothom Alo (51st BCS notice), jobs.nbr.gov.bd",
  },
  {
    id: "school70",
    title: "স্কুল / কলেজ ভর্তি",
    group: "general",
    widthPx: 300,
    heightPx: 300,
    maxKB: 70,
    format: "jpg",
    note: "অনেক স্কুলের অনলাইন আবেদনে ৩০০×৩০০, ৭০ KB",
    source: "Udayan Higher Secondary School 2027 notice (varies by school)",
  },
];

export const ADMISSION_CUSTOM_ID = "custom";

const FORMAT_WORD: Record<AdmissionFormat, string> = { jpg: "JPG", png: "PNG", any: "JPG/PNG" };

/**
 * The label is self-describing on purpose: e.g. "470×610 px · ≥30KB · ≤200KB · JPG".
 * It is what gets saved as the photo's `size`, so every part of the app (crop shape,
 * exact pixels, KB limit, download format) can be recovered from that one string.
 */
export function buildAdmissionLabel(spec: {
  widthPx: number;
  heightPx: number;
  minKB?: number;
  maxKB?: number;
  format?: AdmissionFormat;
}): string {
  const parts = [`${Math.round(spec.widthPx)}×${Math.round(spec.heightPx)} px`];
  if (spec.minKB) parts.push(`≥${Math.round(spec.minKB)}KB`);
  if (spec.maxKB) parts.push(`≤${Math.round(spec.maxKB)}KB`);
  if (spec.format) parts.push(FORMAT_WORD[spec.format]);
  return parts.join(" · ");
}

export function presetLabel(preset: AdmissionPreset): string {
  return buildAdmissionLabel(preset);
}

export type ParsedAdmissionLabel = {
  widthPx: number;
  heightPx: number;
  minKB?: number;
  maxKB?: number;
  format: AdmissionFormat;
};

/** Returns null when the label is not an exact-pixel admission label. */
export function parseAdmissionLabel(label: string | undefined | null): ParsedAdmissionLabel | null {
  const text = String(label || "");
  const px = text.match(/(\d+)\s*[×x]\s*(\d+)\s*px/i);
  if (!px) return null;
  const max = text.match(/≤\s*(\d+)\s*KB/i);
  const min = text.match(/≥\s*(\d+)\s*KB/i);
  let format: AdmissionFormat = "any";
  if (/JPG\/PNG/i.test(text)) format = "any";
  else if (/\bJPG\b/i.test(text)) format = "jpg";
  else if (/\bPNG\b/i.test(text)) format = "png";
  return {
    widthPx: Number(px[1]),
    heightPx: Number(px[2]),
    minKB: min ? Number(min[1]) : undefined,
    maxKB: max ? Number(max[1]) : undefined,
    format,
  };
}

/** JPG-only admission portals must never receive a PNG; everything else keeps the user's choice. */
export function resolveExportFormat(format: "jpg" | "png", label: string | undefined | null): "jpg" | "png" {
  const spec = parseAdmissionLabel(label);
  if (spec && spec.format === "jpg") return "jpg";
  if (spec && spec.format === "png") return "png";
  return format;
}
