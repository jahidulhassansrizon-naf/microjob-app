// AI helpers for the Document Scanner.
//
// The scanner sends the page on screen + one text prompt to /api/image-generate (the same
// route and Gemini bot that AI Editor, Bulk Photo Edit and AI Template use) and gets ONE
// finished image back. Nothing is processed in the browser any more, so the page stays light.
//
// Documents carry names, numbers and dates, so the prompt's first rule is "never change the
// content": the AI may only clean / straighten / crop / remove marks, never rewrite text.

export type AiPresetKey = "clean" | "restore" | "crop" | "stamp";
export type AiColorMode = "color" | "bw";
export type AiChipKey = "darker" | "brighter" | "contrast";

export const AI_PRESET_KEYS: AiPresetKey[] = ["clean", "restore", "crop", "stamp"];
export const AI_CHIP_KEYS: AiChipKey[] = ["darker", "brighter", "contrast"];

// Label shown on the buttons (English source; Bangla comes from DOCUMENT_EXTRA).
export const AI_PRESET_LABELS: Record<AiPresetKey, string> = {
  clean: "Clean & sharpen",
  restore: "Restore old colours",
  crop: "Straighten & crop",
  stamp: "Remove stamp / marks",
};
export const AI_PRESET_HINTS: Record<AiPresetKey, string> = {
  clean: "Shadows, stains, blur",
  restore: "Faded, yellowed, old paper",
  crop: "Straight, edges cut",
  stamp: "Seal, ink, dirt",
};
export const AI_CHIP_LABELS: Record<AiChipKey, string> = {
  darker: "Darker text",
  brighter: "Brighter paper",
  contrast: "More contrast",
};

const GOLDEN_RULE = [
  "ROLE: You are a strict, faithful document scanner / document restorer. The attached image is a photo or scan of ONE real document page (it may be an official, legal, school, bank, NID, certificate or government document, so any wrong letter or digit can cause real harm). Your job is to produce a cleaner COPY of the SAME page, like a photocopier or a flatbed scanner, NOT to redraw, re-write, re-design or improve it.",
  "",
  "ABSOLUTE RULES (highest priority. They override every task, every wish and every other instruction below. If a task seems to conflict with these rules, the rules win and you do less):",
  "1. ZERO CONTENT CHANGE. Every letter, digit, word, line, date, name, number, amount, address, ID number, serial number, memo number, table cell, form box, heading, logo, photo, signature, handwriting, stamp, seal, QR code, barcode and watermark that is visible in the input must appear in the output EXACTLY the same: same spelling, same script (Bangla / English / Arabic numerals), same position, same size, same order, same line breaks.",
  "2. NEVER rewrite, re-type, re-draw, translate, spell-correct, transliterate, convert Bangla digits to English digits (or the reverse), complete, shorten, reorder, add, delete, move or invent any text, digit or symbol. Do not fix mistakes that are in the original document: keep the mistakes.",
  "3. NEVER guess unreadable text. If a word, digit or part is faint, blurred, cut off or hidden, keep it as faint as it is or leave it as it appears. Do not hallucinate or fill in what you think it says. Bangla conjunct letters (যুক্তাক্ষর), vowel signs (কার / মাত্রা / ফলা), hasanta and dots must keep their exact shapes. Never replace one letter with a similar-looking letter.",
  "4. KEEP THE LAYOUT IDENTICAL: same page proportions (no stretching, squashing or changing the aspect ratio), same margins, same columns, same table grid, same alignment, same reading direction, same upright orientation. No mirroring. Do not re-flow, re-format or modernise anything.",
  "5. ONE PAGE ONLY, the WHOLE page: do not drop any part of the page (headers, footers, side notes, small print, page numbers, corners). Do not add a second page, a duplicate or a border.",
  "6. HANDWRITING AND SIGNATURES stay handwriting: do not turn handwritten words, numbers or signatures into typed text and do not tidy or redraw their strokes.",
  "7. PRINTED FACES AND PHOTOS (portrait photos, logos, emblems, security patterns) must keep the same identity, shape and position. Never replace, beautify or regenerate a face or a logo.",
  "8. Do ONLY the tasks listed in TASKS. Anything not listed there must stay untouched. Never remove stamps, seals, signatures, handwriting, photos, logos or printed security patterns unless the task list explicitly says to remove stamps / marks.",
  "9. When in doubt, do LESS. A slightly dirty but 100% faithful result is correct; a clean but altered result is a failure.",
].join("\n");

const TASKS: Record<AiPresetKey, string> = {
  clean:
    "CLEAN & SHARPEN. DO: remove shadows, uneven lighting, vignetting, creases, fold lines, fingerprints, dust, paper grain and background noise; make the empty paper evenly clean white; fix blur, noise, camera shake and low resolution so every printed and handwritten character is crisp, sharp and solid. DO NOT: change any letter shape, stroke or spacing; thicken or thin letters so much that they merge or lose detail; remove or fade any stamp, seal, signature, handwriting, photo, logo or table line; add anything.",
  restore:
    "RESTORE OLD COLOURS. This is an old, faded or yellowed document. DO: bring back the colours it originally had: faded blue, black and red ink, coloured stamps and seals, printed borders, coloured headings, logos and coloured text become rich and natural again; remove the yellow / brown age tint, foxing spots and water stains from the paper so the paper looks clean and fresh (if the paper or a printed background was originally coloured, keep that colour but make it clean). DO NOT: add colours to something that was clearly black-and-white; recolour text to a different colour than it had; change any letter shape or content; hide faded text (make it clearer, never remove it).",
  crop:
    "STRAIGHTEN & CROP. DO: deskew so the text lines are perfectly horizontal; correct the perspective so the page becomes a flat, upright rectangle with straight edges; crop away everything that is outside the page (table, hands, fingers, floor, background, other papers) so the page fills the whole image with only a very thin even edge. DO NOT: cut off any content, border, margin text, page number or corner that belongs to the page; rotate the page upside down or sideways; mirror it; change the page proportions; change the content in any way.",
  stamp:
    "REMOVE STAMPS AND MARKS. DO: remove office stamps, seals, ink stamps, stray pen / pencil / marker marks, scribbles, ink blots and stains that are NOT part of the printed document, and restore the clean paper (and the printed text or lines that lie under them, only where they are clearly visible around the mark) underneath. DO NOT: remove or alter any printed text, number, table line, form box, logo, photo or signature; remove anything that is part of the original print; invent new text where a stamp covered the writing: if text is hidden under a stamp and cannot be seen, leave clean paper, never guess it.",
};

const COLOR_RULE: Record<AiColorMode, string> = {
  color:
    "COLOUR: keep the natural colours of ink (blue / red pens, coloured stamps and logos) and keep the colours of any coloured part of the document, but make them clean and clear. The empty paper must be clean white. Do not tint the page.",
  bw: "COLOUR: output a clean black-and-white document scan: pure white paper, solid black text and lines, no colour tint anywhere, no grey fog on the paper. Do not remove any faint text or lines: convert them, do not delete them.",
};

const CHIP_RULE: Record<AiChipKey, string> = {
  darker:
    "TEXT DARKNESS: make the text noticeably darker so it prints well, but do NOT make letters fatter, merged or blobby, and do not change any letter shape.",
  brighter:
    "PAPER BRIGHTNESS: make the paper brighter and whiter, but keep faint text and thin lines clearly visible (never wash them out).",
  contrast:
    "CONTRAST: increase the contrast between text and paper, but keep thin strokes, dots, hasanta, kar and light table lines intact and visible.",
};

const OUTPUT_RULE = [
  "OUTPUT FORMAT (non-negotiable):",
  "- Return exactly ONE finished image of the page: the same page, same content, same layout. Not a collage, not a before/after, not several versions, not the attached image unchanged.",
  "- Highest resolution and sharpness you can. No blur, no noise, no compression artifacts, no warped, melted, doubled or broken letters.",
  "- No added text, captions, notes, logos, watermarks, borders, frames, shadows or UI elements.",
  "- Return only the image, with no explanation text.",
  "",
  "FINAL SELF-CHECK (do this silently before you answer): compare your result with the input. Every word, number and symbol is identical and in the same place? Nothing was added, removed, moved, translated or guessed? The whole page is still there with the same proportions? Stamps, signatures, handwriting, photos and logos are still there (unless removal was asked)? If the answer to any question is NO, redo the image so that it is YES.",
].join("\n");

export type DocumentAiRequest = {
  presets: AiPresetKey[];
  colorMode: AiColorMode;
  chips: AiChipKey[];
};

/** true when the request asks the AI for something (a preset or a chip). */
export const hasAiRequest = (r: DocumentAiRequest): boolean =>
  r.presets.length > 0 || r.chips.length > 0;

export function buildDocumentAiPrompt(r: DocumentAiRequest): string {
  const tasks: string[] = [];
  for (const key of AI_PRESET_KEYS) {
    if (r.presets.includes(key)) tasks.push(`- ${TASKS[key]}`);
  }
  // Colour / finishing rules only matter when the AI is also touching the look of the page.
  // "Restore old colours" always keeps / brings back colour, so black & white never applies to it.
  const restore = r.presets.includes("restore");
  const touchesLook = r.presets.includes("clean") || restore || r.chips.length > 0;
  if (touchesLook) tasks.push(`- ${COLOR_RULE[restore ? "color" : r.colorMode]}`);
  for (const key of AI_CHIP_KEYS) {
    if (r.chips.includes(key)) tasks.push(`- ${CHIP_RULE[key]}`);
  }
  return [
    GOLDEN_RULE,
    "",
    "TASKS (do every task listed here, completely, and NOTHING else; the ABSOLUTE RULES above apply to every task):",
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
