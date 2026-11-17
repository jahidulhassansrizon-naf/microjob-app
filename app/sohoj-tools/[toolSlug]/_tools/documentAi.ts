// AI helpers for the Document Scanner.
//
// The scanner sends the page on screen + one text prompt to /api/image-generate (the same
// route and Gemini bot that AI Editor, Bulk Photo Edit and AI Template use) and gets ONE
// finished image back. Nothing is processed in the browser any more, so the page stays light.
//
// Documents carry names, numbers and dates, so the prompt's first rule is "never change the
// content": the AI may only clean / straighten / crop / remove marks, never rewrite text.

export type AiPresetKey = "clean" | "crop" | "stamp";
export type AiColorMode = "color" | "bw";
export type AiChipKey = "darker" | "brighter" | "contrast";

export const AI_PRESET_KEYS: AiPresetKey[] = ["clean", "crop", "stamp"];
export const AI_CHIP_KEYS: AiChipKey[] = ["darker", "brighter", "contrast"];

// Label shown on the buttons (English source; Bangla comes from DOCUMENT_EXTRA).
export const AI_PRESET_LABELS: Record<AiPresetKey, string> = {
  clean: "Clean & sharpen",
  crop: "Straighten & crop",
  stamp: "Remove stamp / marks",
};
export const AI_PRESET_HINTS: Record<AiPresetKey, string> = {
  clean: "Shadows, stains, blur",
  crop: "Straight, edges cut",
  stamp: "Seal, ink, dirt",
};
export const AI_CHIP_LABELS: Record<AiChipKey, string> = {
  darker: "Darker text",
  brighter: "Brighter paper",
  contrast: "More contrast",
};

export const AI_CUSTOM_MAX = 300;

const GOLDEN_RULE = [
  "You are a professional document scanner and document restorer. The attached image is a photo or scan of ONE document page.",
  "",
  "GOLDEN RULE (highest priority, overrides everything below):",
  "- Do NOT change the content of the document. Every letter, digit, word, date, name, number, table line, form box, logo, photo, signature, QR code and barcode must stay EXACTLY as in the input: same spelling (Bangla and English), same position, same size, same order.",
  "- Never rewrite, re-type, translate, correct, add, remove, move or invent any text or number. Never re-flow or re-design the layout. If a part is hard to read, keep it as it is; do not guess it.",
  "- Keep the page exactly one page, with the same content, same proportions and the same reading direction.",
].join("\n");

const TASKS: Record<AiPresetKey, string> = {
  clean:
    "CLEAN & SHARPEN: remove shadows, uneven lighting, creases, fingerprints, dirt, paper texture and background noise. Make the paper evenly clean white. Fix blur, noise and low resolution so all printed and handwritten text is crisp, sharp and dark, without changing any letter shape.",
  crop:
    "STRAIGHTEN & CROP: deskew so the text lines are perfectly horizontal, and correct the perspective so the page is a flat, upright rectangle. Crop away everything outside the page edges (table, hands, floor, background) so the page fills the whole image. Do not cut off any content or margin that belongs to the page.",
  stamp:
    "REMOVE STAMPS AND MARKS: remove office stamps, seals, stray pen / ink marks, stains and scribbles that are not part of the printed document, and restore the clean paper underneath. Keep the printed text, tables, signatures and logos exactly as they are.",
};

const COLOR_RULE: Record<AiColorMode, string> = {
  color:
    "COLOR: keep the natural colours of ink (blue / red pens, coloured stamps and logos) but make them clean and clear. The paper itself must be white.",
  bw: "COLOR: output a clean black-and-white document scan: pure white paper, solid black text, no colour tint anywhere.",
};

const CHIP_RULE: Record<AiChipKey, string> = {
  darker: "Make the text noticeably darker and a little bolder so it prints well.",
  brighter: "Make the paper brighter and whiter.",
  contrast: "Increase the contrast between text and paper.",
};

const OUTPUT_RULE = [
  "OUTPUT FORMAT (non-negotiable):",
  "- Return exactly ONE finished image of the page. Not a collage, not a before/after, not the attached image itself.",
  "- Highest resolution and sharpness you can. No blur, no noise, no compression artifacts, no warped or melted letters.",
  "- No added text, captions, logos, watermarks, borders, frames or UI elements.",
  "- Return only the image, with no explanation text.",
].join("\n");

export type DocumentAiRequest = {
  presets: AiPresetKey[];
  colorMode: AiColorMode;
  chips: AiChipKey[];
  custom: string;
};

/** true when the request asks the AI for something (a preset, a chip or custom text). */
export const hasAiRequest = (r: DocumentAiRequest): boolean =>
  r.presets.length > 0 || r.chips.length > 0 || r.custom.trim().length > 0;

export function buildDocumentAiPrompt(r: DocumentAiRequest): string {
  const tasks: string[] = [];
  for (const key of AI_PRESET_KEYS) {
    if (r.presets.includes(key)) tasks.push(`- ${TASKS[key]}`);
  }
  // Colour / finishing rules only matter when the AI is also touching the look of the page.
  const touchesLook = r.presets.includes("clean") || r.chips.length > 0;
  if (touchesLook) tasks.push(`- ${COLOR_RULE[r.colorMode]}`);
  for (const key of AI_CHIP_KEYS) {
    if (r.chips.includes(key)) tasks.push(`- ${CHIP_RULE[key]}`);
  }
  const custom = r.custom.trim().slice(0, AI_CUSTOM_MAX);
  if (custom) {
    tasks.push(
      `- EXTRA REQUEST FROM THE USER (do it, but the GOLDEN RULE still applies: never change, add or remove any text or number unless this request explicitly names that exact change): ${custom}`,
    );
  }
  return [
    GOLDEN_RULE,
    "",
    "TASKS (do all of them, nothing else):",
    ...tasks,
    "",
    OUTPUT_RULE,
  ].join("\n");
}

/**
 * Turns the page canvas into a JPEG blob that is small enough to upload quickly.
 * Long side is limited to `maxSide`; transparent areas become white.
 */
export function canvasToAiBlob(
  source: HTMLCanvasElement,
  maxSide = 2000,
  quality = 0.92,
): Promise<Blob> {
  const longest = Math.max(source.width, source.height);
  const ratio = longest > maxSide ? maxSide / longest : 1;
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(source.width * ratio));
  out.height = Math.max(1, Math.round(source.height * ratio));
  const ctx = out.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas context unavailable"));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return new Promise((resolve, reject) => {
    out.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image encode failed"))),
      "image/jpeg",
      quality,
    );
  });
}

/** Marker used for errors that already carry a message written for the visitor. */
export class DocumentAiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentAiError";
  }
}
