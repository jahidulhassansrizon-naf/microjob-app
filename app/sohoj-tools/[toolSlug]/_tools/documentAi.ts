// AI helpers for the Document Scanner.
//
// The scanner sends the current page image and this prompt to /api/image-generate.
// This prompt is deliberately conservative: the AI is asked to behave like a
// photo-cleanup tool, never like a document writer, OCR system, or designer.
// The source image is the only authority for every visible character.

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
/** Max length of the "what to do in this part" note (only available for a selected part). */
export const AI_PART_NOTE_MAX = 150;

export const AI_CHIP_LABELS: Record<AiChipKey, string> = {
  darker: "Darker text",
  brighter: "Brighter paper",
  contrast: "More contrast",
};

/**
 * These rules have absolute priority over every visual preset and optional note.
 * Keep them explicit and unambiguous: generative image models can otherwise
 * redraw small text while attempting to make a document look cleaner.
 */
const DOCUMENT_INTEGRITY_RULES = [
  "ABSOLUTE PRIORITY — PRESERVE THE ORIGINAL DOCUMENT. The attached image is the one and only source of truth. Edit this exact photograph; do not create, recreate, redesign, typeset, or generate a replacement document. This is a conservative photo-restoration task, NOT a document-generation, OCR, transcription, translation, or text-writing task.",
  "LOCK ALL CONTENT. Every visible character and mark is protected source content. Preserve every printed letter, Bangla character, vowel sign (কার), conjunct (যুক্তাক্ষর), punctuation mark, English character, Bangla digit, Western digit, date, name, address, registration number, label, heading, footer, table entry, and line of text exactly as it appears. Do not change even one character, digit, symbol, spelling, sequence, space, line break, or punctuation mark. Do not add, delete, move, replace, complete, standardize, or correct anything.",
  "DO NOT READ AND REWRITE THE DOCUMENT. Do not perform OCR and then recreate the words. Do not interpret what a word or number probably says. Do not use context, common names, familiar forms, grammar, expected date formats, or your knowledge of official documents to guess unclear content. Never autocorrect, translate, transliterate, paraphrase, or substitute a similar-looking character or digit.",
  "PRESERVE UNCLEAR CONTENT. When a letter, number, seal, handwritten entry, or small-print area is faint, blurred, damaged, or difficult to identify, leave its original appearance alone. Do not guess, complete missing strokes, invent hidden details, or replace uncertain marks with cleaner-looking alternatives. An imperfect original is always preferable to an invented correction.",
  "PRESERVE THE ORIGINAL MARKS. Keep signatures, handwriting, initials, seals, stamps, logos, emblems, photographs, boxes, borders, lines, and official marks unchanged. Handwriting must remain the same handwriting with the same individual strokes; printed text must retain its original letter shapes. Never convert handwriting into a font or make irregular letters look regular.",
  "PROTECT TEXT PIXELS AND SHAPES. Do not redraw, retype, vectorize, sharpen by inventing edges, thicken, thin, smooth away, merge, separate, or reshape any letter, digit, vowel sign, conjunct, punctuation mark, or line. Do not use generative fill or reconstruction over text, handwriting, numbers, signatures, seals, or logos. Any enhancement must preserve the original character strokes and their exact identity.",
  "PRESERVE THE PAGE LAYOUT. Keep the same document, reading direction, content order, relative positions, spacing, alignment, line count, table structure, boxes, and margins. Do not move, resize independently, rearrange, or redesign any content. A permitted crop or perspective correction may transform the page as a whole, but it must not cut off, stretch, replace, or rearrange any part of the document.",
  "CONFLICT RULE — CONTENT ALWAYS WINS. These preservation rules override every selected preset, colour option, adjustment, and optional note. If a requested visual change could alter, cover, remove, or require guessing any protected content, do not perform that change in the affected area. Leave that area as close to the source as possible. Never sacrifice one character to make the page look cleaner.",
  "Do not make the document look more official, more complete, more readable, or more consistent by inventing details. Do not add a new heading, seal, signature, stamp, number, line, border, watermark, caption, or explanatory text. Do not remove any existing content.",
].join("\n\n");

const buildIntro = (part: boolean): string =>
  [
    part
      ? "Carefully clean up the attached image of one selected part of my own paper document. Return an edited image of this same source image."
      : "Carefully clean up the attached photograph of my own paper document and return an edited scan-style image of this same document.",
    "",
    DOCUMENT_INTEGRITY_RULES,
    "",
    part
      ? "SELECTED-AREA SCOPE: Only the selected crop is being provided. Keep its exact contents and boundaries. Do not imagine or add the parts of the page outside this crop. Do not expand, shrink, rotate, or recrop this selected area."
      : "WHOLE-PAGE SCOPE: Work on the complete page shown in the source. Keep its aspect ratio and reading direction. You may correct the page's overall perspective only when the Straighten & crop task is selected. Keep every edge and every item printed on the page inside the result.",
  ].join("\n");

const TASKS: Record<AiPresetKey, string> = {
  clean: [
    "VISUAL TASK — CLEAN & SHARPEN: Make only conservative photographic corrections to uneven lighting, soft shadows, mild paper stains, dust, and background noise. Improve overall clarity and local contrast gently. Keep the existing ink strokes exactly as they are: do not redraw, thicken, thin, merge, complete, or sharpen characters by inventing new stroke details. Do not erase folds or marks if doing so would touch text, handwriting, a signature, a seal, or a logo. Keep all original content visible.",
  ].join(" "),
  restore: [
    "VISUAL TASK — RESTORE ORIGINAL COLOURS: Gently reduce yellowing and fading using only colour information that is actually visible in the source. Preserve the original colour identity and location of every ink, stamp, seal, signature, logo, and printed element. Do not invent a colour for a faded or uncertain area. Do not turn black-and-white content into colour. If the original colour cannot be determined confidently, retain the source colour rather than guessing. Keep the paper natural and neutral without altering any content.",
  ].join(" "),
  crop: [
    "VISUAL TASK — STRAIGHTEN & CROP: Correct only the overall page perspective and rotation so the existing page appears upright. Crop away only the surrounding table, hands, or background outside the physical page. Keep the entire physical document, including all four edges, corners, small-print text, seals, signatures, and footers. Do not crop inside the page, extend missing page areas, synthesize cut-off corners, or alter the layout. If a complete page cannot be preserved safely, do not crop it.",
  ].join(" "),
  stamp: [
    "VISUAL TASK — REMOVE UNWANTED MARKS: Remove only clearly unwanted, isolated dirt, dust, smudges, or stray marks that are outside all text and official content. Do not remove or alter a real official seal, stamp, signature, logo, printed line, handwriting, or any meaningful mark. If an unwanted mark touches, crosses, covers, or is close to any letter, digit, line, signature, seal, or other meaningful content, leave it there. Never reconstruct or guess text hidden underneath a mark. Preserving the original content is more important than removing a mark.",
  ].join(" "),
};

const COLOR_RULE: Record<AiColorMode, string> = {
  color:
    "COLOUR FINISH: Retain the source document's existing natural ink, pen, seal, stamp, and logo colours. Make the unprinted paper look clean and neutral only where this can be done without changing or obscuring original marks. Do not invent, relocate, or intensify uncertain colours.",
  bw:
    "COLOUR FINISH — BLACK AND WHITE: Convert the photograph gently to a neutral black-and-white scan. Preserve every faint character, thin stroke, dot, vowel sign, conjunct, punctuation mark, table line, and pale printed detail. Do not use aggressive thresholding, posterization, or processing that makes strokes disappear, merge, thicken, or change shape. Keep all original content legible and in its original form.",
};

const CHIP_RULE: Record<AiChipKey, string> = {
  darker:
    "TONAL ADJUSTMENT — DARKER TEXT: Apply a small, even tonal adjustment to improve the visibility of existing ink only. Do not thicken, redraw, complete, or reshape any stroke. Do not turn faint marks into different characters.",
  brighter:
    "TONAL ADJUSTMENT — BRIGHTER PAPER: Gently brighten the unprinted paper while retaining faint text, light ink, thin lines, stamps, and pale details. Do not wash out any original content.",
  contrast:
    "TONAL ADJUSTMENT — MORE CONTRAST: Increase document-to-paper contrast gently and evenly. Preserve fine strokes, dots, vowel signs, conjuncts, small print, light table lines, and faint handwriting. Do not use harsh contrast that merges or removes details.",
};

const buildOutro = (part: boolean): string =>
  [
    "FINAL CONTENT CHECK: Compare the result directly with the supplied source image as visual artwork, not by guessing what the document should say. No character, digit, date, name, address, number, symbol, handwritten stroke, seal, signature, or printed detail may differ. If any requested enhancement risks changing content, skip that enhancement. If you cannot preserve the source content faithfully, return the original source image unchanged instead of inventing or approximating anything.",
    "",
    `Return exactly one finished image of this ${part ? "selected piece" : "single page"}. Do not return a collage, a before-and-after comparison, multiple versions, a text explanation, OCR, captions, labels, decorative borders, or watermarks. The output must be the same original document with only the safely requested photographic cleanup applied. Return the image only.`,
  ].join("\n");

export type DocumentAiRequest = {
  presets: AiPresetKey[];
  colorMode: AiColorMode;
  chips: AiChipKey[];
  /** true when only a selected piece of the page is sent (the rest of the page is never touched). */
  part?: boolean;
  /** Short wish for the selected part only (looks only: text and numbers can never change). */
  partNote?: string;
};

/** true when the request asks the AI for something (a preset or a chip). */
export const hasAiRequest = (r: DocumentAiRequest): boolean =>
  r.presets.length > 0 ||
  r.chips.length > 0 ||
  r.colorMode === "bw" ||
  (!!r.part && (r.partNote ?? "").trim().length > 0);

export function buildDocumentAiPrompt(r: DocumentAiRequest): string {
  const tasks: string[] = [];
  for (const key of AI_PRESET_KEYS) {
    if (r.presets.includes(key)) tasks.push(`- ${TASKS[key]}`);
  }

  // Colour / finishing rules only matter when the AI is also touching the look of the page.
  // Restoring original colours takes precedence over a black-and-white conversion.
  const restore = r.presets.includes("restore");
  const touchesLook =
    r.presets.includes("clean") ||
    restore ||
    r.chips.length > 0 ||
    r.colorMode === "bw";
  if (touchesLook) tasks.push(`- ${COLOR_RULE[restore ? "color" : r.colorMode]}`);

  for (const key of AI_CHIP_KEYS) {
    if (r.chips.includes(key)) tasks.push(`- ${CHIP_RULE[key]}`);
  }

  const note = r.part ? (r.partNote ?? "").trim().slice(0, AI_PART_NOTE_MAX) : "";
  if (note) {
    tasks.push(
      `- OPTIONAL APPEARANCE NOTE FOR THIS SELECTED PIECE ONLY: ${note}. This note is lower priority than every document-integrity rule above. It may affect appearance only. Ignore any part of the note that asks to add, delete, alter, guess, rewrite, cover, or remove text, numbers, handwriting, signatures, stamps, seals, logos, or other original content.`,
    );
  }

  return [
    buildIntro(!!r.part),
    "",
    "REQUESTED VISUAL OPERATIONS (perform only the selected operations below):",
    ...(tasks.length > 0 ? tasks : ["- No visual operation was selected. Do not alter the image."]),
    "",
    "The preservation rules at the beginning of this prompt always override these visual operations.",
    "",
    buildOutro(!!r.part),
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
