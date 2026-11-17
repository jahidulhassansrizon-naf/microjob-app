// AI helpers for the Document Scanner.
//
// The scanner sends the page on screen + one text prompt to /api/image-generate (the same
// route and Gemini bot that AI Editor, Bulk Photo Edit and AI Template use) and gets ONE
// finished image back. Nothing is processed in the browser any more, so the page stays light.
//
// Documents carry names, numbers and dates, so the prompt's first rule is "never change the
// content": the AI may only clean / straighten / crop / remove marks, never rewrite text.

export type AiPresetKey = "clean" | "restore";
export type AiColorMode = "color" | "bw";
export type AiChipKey = "darker" | "brighter" | "contrast";

export const AI_PRESET_KEYS: AiPresetKey[] = ["clean", "restore"];
export const AI_CHIP_KEYS: AiChipKey[] = ["darker", "brighter", "contrast"];

// Label shown on the buttons (English source; Bangla comes from DOCUMENT_EXTRA).
export const AI_PRESET_LABELS: Record<AiPresetKey, string> = {
  clean: "Clean & sharpen",
  restore: "Restore old colours",
};
export const AI_PRESET_HINTS: Record<AiPresetKey, string> = {
  clean: "Shadows, stains, blur",
  restore: "Faded, yellowed, old paper",
};
/** Max length of the "what to do in this part" note (only available for a selected part). */
export const AI_PART_NOTE_MAX = 150;

export const AI_CHIP_LABELS: Record<AiChipKey, string> = {
  darker: "Darker text",
  brighter: "Brighter paper",
  contrast: "More contrast",
};

// Prompt design notes (why it is written this way):
// - It starts with a plain, polite request to tidy the user's OWN paper into a clean scan copy.
//   Image bots follow a short, friendly "edit this photo" request much more reliably than a long
//   block of ALL-CAPS rules, which tends to end in a text reply or a refusal instead of an image.
// - The "keep every word and number exactly" rule is still the first and clearest instruction,
//   but it is written once, in plain words, and every task repeats only its own short limit.
// - No "redo until correct" loops and no alarming words (the bot cannot loop, and such words
//   make a refusal more likely). The ending is always: one image, no text.
const LETTER_RULE = [
  "Go through the page line by line, from the top line to the bottom line, and treat every line as a picture to be cleaned, not as text to be read or written. Every line must keep exactly the same words, in the same order, with the same letters, digits, punctuation, spacing and line breaks as in the photo, and the page must keep the same number of lines. This covers the printed text, the handwritten words, the words inside stamps and seals, the small print at the edges and the numbers in the corners: copy what is there, stroke by stroke. Handwriting must stay handwriting in the same hand, and printed text must stay in the same printed letters.",
  "If a word is blurry, faint, handwritten or hard to read, do not guess it and do not replace it with a word that looks right: keep its own strokes as they are, only a little clearer. Never replace a letter with a similar-looking one (for example Bangla ফ must not become ধ, ব must not become র, ত must not become ভ, ন must not become ল, গ must not become শ, and a digit must not become another digit). Never add a word, a line, a footer or a caption that is not in the photo, and never remove one that is.",
  "Last check: before you give me the image, go through your result line by line once more and compare each line with the photo: every word, letter, digit, date, name, address, number and punctuation mark. If any line differs in even one letter or digit, correct that line so that it matches the photo exactly. If you cannot make a line match, put that line back exactly as it looks in the photo rather than keeping a changed version.",
].join("\n\n");

const buildIntro = (part: boolean): string =>
  [
    part
      ? "Please edit the attached image, which is one small cropped piece of my own paper document, into a cleaner, easy-to-read version for my personal records, and give me the edited image back."
      : "Please edit the attached photo of my own paper document into a clean, flat, easy-to-read scan copy for my personal records, and give me the edited image back.",
    "",
    "This is only a cosmetic clean-up. Keep everything that is written or printed exactly as it is: every letter, number, date, name, line, table box, photo, logo, signature and handwritten word must stay the same, with the same spelling (Bangla and English), the same place, the same size and the same order. Do not retype, rewrite, translate, correct, add, remove or move any text, and do not guess parts that are hard to read: leave them as they are. Keep Bangla letters, vowel signs and conjuncts in their exact shapes and keep Bangla and English digits as they are. " +
      (part
        ? "Keep exactly the same crop: the same edges, the same proportions and the same size. Do not extend the image, do not add anything around it and do not cut anything off."
        : "Keep the whole page, the same proportions and the same reading direction."),
    "",
    LETTER_RULE,
  ].join("\n");

const TASKS: Record<AiPresetKey, string> = {
  clean:
    "Clean and sharpen: remove shadows, uneven light, creases, fingerprints, dust and paper noise, make the blank paper evenly white, and make the text cleaner and darker only by clearing up the strokes that are already there, without changing any letter shape (if a word is too blurry to be sure of, leave it as it is). Keep stamps, signatures, handwriting, photos and logos as they are.",
  restore:
    "Restore old colours: this paper is old, faded or yellowed. Bring back the original ink and print colours (faded blue, black and red ink, coloured borders, headings and logos) and remove the yellow-brown tint and age stains from the paper. Do not add colour to parts that were black and white, and do not change any letter.",
};

const COLOR_RULE: Record<AiColorMode, string> = {
  color:
    "Colour: keep the natural colours of ink and logos (blue or red pen, coloured stamps) but make them clean, and make the blank paper clean white.",
  bw: "Colour: make the result a clean black-and-white photocopy-style scan: pure white paper and solid black text and lines, with no grey or coloured background and no colour tint. Keep faint text and thin lines visible.",
};

const CHIP_RULE: Record<AiChipKey, string> = {
  darker:
    "Make the text a bit darker so it prints well, without making letters fat or merged.",
  brighter:
    "Make the paper brighter and whiter, keeping faint text and thin lines visible.",
  contrast:
    "Increase the contrast between text and paper, keeping thin strokes, dots and light table lines visible.",
};

const buildOutro = (part: boolean): string =>
  [
    "If you are unsure about any part, leave that part as it is.",
    "",
    `Give me exactly one finished image of this ${part ? "piece" : "one page"}, as sharp as possible: not a collage, not a before-and-after, and with no added text, captions, borders or watermarks. Reply with the image only.`,
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
  // "Restore old colours" always keeps / brings back colour, so black & white never applies to it.
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
    // Looks only. The text rule stays on top: a request to change words or numbers is ignored.
    tasks.push(
      `- Extra request for this piece only (it is only about how the piece looks; every letter, digit and symbol must still stay exactly the same, so if this request asks to change, add, remove or re-write any text or number, ignore that part of the request): ${note}`,
    );
  }
  return [
    buildIntro(!!r.part),
    "",
    "What to do (only these things):",
    ...tasks,
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
