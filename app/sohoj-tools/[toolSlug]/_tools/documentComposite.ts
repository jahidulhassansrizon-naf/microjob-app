// Text-safe finishing for the Document Scanner's AI step.
//
// An image AI redraws the whole page, so it can change Bangla letters or digits. To make that
// impossible, we never use the AI's letters. The AI picture is only used as the clean PAPER
// (even white, colours back, shadows gone). Every letter, line, logo and signature comes from
// the person's own photo:
//
//   result = AI paper  x  (original pixel / original paper)
//
// "original paper" is the original photo with all the thin dark strokes taken out (a large
// max-filter, like a flat-field correction). The division removes shadows, yellow tint and
// uneven light from the original ink without moving a single stroke. The AI paper only has to
// be smooth, so a small shift or stretch in the AI picture can never double the text.

export type ComposeOptions = {
  /** "bw": pure white paper and black ink. */
  colorMode: "color" | "bw";
  darker?: boolean;
  brighter?: boolean;
  contrast?: boolean;
  /** Sharpen the strokes of the person's own photo (no AI: no letter is ever redrawn). */
  sharpen?: boolean;
};

type Plane = { data: Float32Array; w: number; h: number };

function boxDownscale(
  src: Uint8ClampedArray,
  w: number,
  h: number,
  f: number,
): Plane {
  const sw = Math.max(1, Math.ceil(w / f));
  const sh = Math.max(1, Math.ceil(h / f));
  const out = new Float32Array(sw * sh * 3);
  for (let sy = 0; sy < sh; sy++) {
    const y0 = sy * f;
    const y1 = Math.min(h, y0 + f);
    for (let sx = 0; sx < sw; sx++) {
      const x0 = sx * f;
      const x1 = Math.min(w, x0 + f);
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let y = y0; y < y1; y++) {
        let i = (y * w + x0) * 4;
        for (let x = x0; x < x1; x++) {
          r += src[i];
          g += src[i + 1];
          b += src[i + 2];
          n++;
          i += 4;
        }
      }
      const o = (sy * sw + sx) * 3;
      const inv = n > 0 ? 1 / n : 0;
      out[o] = r * inv;
      out[o + 1] = g * inv;
      out[o + 2] = b * inv;
    }
  }
  return { data: out, w: sw, h: sh };
}

/** Separable max filter (dilate), radius r, per channel. */
function dilate(p: Plane, r: number): Plane {
  const { w, h } = p;
  const tmp = new Float32Array(p.data.length);
  const out = new Float32Array(p.data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = Math.max(0, x - r);
      const b = Math.min(w - 1, x + r);
      for (let c = 0; c < 3; c++) {
        let m = 0;
        for (let k = a; k <= b; k++) {
          const v = p.data[(y * w + k) * 3 + c];
          if (v > m) m = v;
        }
        tmp[(y * w + x) * 3 + c] = m;
      }
    }
  }
  for (let y = 0; y < h; y++) {
    const a = Math.max(0, y - r);
    const b = Math.min(h - 1, y + r);
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 3; c++) {
        let m = 0;
        for (let k = a; k <= b; k++) {
          const v = tmp[(k * w + x) * 3 + c];
          if (v > m) m = v;
        }
        out[(y * w + x) * 3 + c] = m;
      }
    }
  }
  return { data: out, w, h };
}

/** Separable box blur, radius r, per channel (edges clamp). */
function boxBlur(p: Plane, r: number): Plane {
  const { w, h } = p;
  const tmp = new Float32Array(p.data.length);
  const out = new Float32Array(p.data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = Math.max(0, x - r);
      const b = Math.min(w - 1, x + r);
      const n = b - a + 1;
      for (let c = 0; c < 3; c++) {
        let s = 0;
        for (let k = a; k <= b; k++) s += p.data[(y * w + k) * 3 + c];
        tmp[(y * w + x) * 3 + c] = s / n;
      }
    }
  }
  for (let y = 0; y < h; y++) {
    const a = Math.max(0, y - r);
    const b = Math.min(h - 1, y + r);
    const n = b - a + 1;
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 3; c++) {
        let s = 0;
        for (let k = a; k <= b; k++) s += tmp[(k * w + x) * 3 + c];
        out[(y * w + x) * 3 + c] = s / n;
      }
    }
  }
  return { data: out, w, h };
}

/** Value that 90 % of the samples of one channel stay under (the typical paper level). */
function percentile90(p: Plane, c: number): number {
  const hist = new Uint32Array(256);
  const n = p.w * p.h;
  for (let i = 0; i < n; i++) {
    hist[Math.max(0, Math.min(255, Math.round(p.data[i * 3 + c])))]++;
  }
  const target = n * 0.9;
  let acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= target) return v;
  }
  return 255;
}

/**
 * Smooth paper picture (same size as the input, as a small plane that is sampled bilinearly):
 * the photo with every thin dark stroke taken out.
 * `floorRatio` keeps big dark areas (a logo, a black marker) from being mistaken for paper.
 */
function estimatePaper(
  src: Uint8ClampedArray,
  w: number,
  h: number,
  floorRatio: number,
): { plane: Plane; f: number } {
  const f = Math.max(1, Math.round(Math.max(w, h) / 500));
  const small = boxDownscale(src, w, h, f);
  const radius = 7;
  let paper = dilate(small, radius);
  paper = boxBlur(boxBlur(paper, 4), 4);
  for (let c = 0; c < 3; c++) {
    const floor = percentile90(paper, c) * floorRatio;
    for (let i = c; i < paper.data.length; i += 3) {
      if (paper.data[i] < floor) paper.data[i] = floor;
    }
  }
  return { plane: paper, f };
}

function sample(
  p: Plane,
  f: number,
  x: number,
  y: number,
  c: number,
): number {
  const fx = Math.min(p.w - 1, Math.max(0, (x + 0.5) / f - 0.5));
  const fy = Math.min(p.h - 1, Math.max(0, (y + 0.5) / f - 0.5));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(p.w - 1, x0 + 1);
  const y1 = Math.min(p.h - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const a = p.data[(y0 * p.w + x0) * 3 + c];
  const b = p.data[(y0 * p.w + x1) * 3 + c];
  const d = p.data[(y1 * p.w + x0) * 3 + c];
  const e = p.data[(y1 * p.w + x1) * 3 + c];
  return (a * (1 - tx) + b * tx) * (1 - ty) + (d * (1 - tx) + e * tx) * ty;
}


/** Unsharp mask on the "ink" picture (values 0..1, 3 channels). Makes blurry strokes crisper
 *  and darker using only the person's own pixels. */
function sharpenInk(ink: Float32Array, w: number, h: number): void {
  const plane: Plane = { data: ink, w, h };
  const blurred = boxBlur(boxBlur(plane, 1), 1).data;
  const amount = 1.6;
  for (let i = 0; i < ink.length; i++) {
    const v = ink[i] + amount * (ink[i] - blurred[i]);
    ink[i] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
}

/**
 * Pure pixel version (also used by the tests).
 * `orig` and `ai` are RGBA arrays of the SAME size w x h.
 * Returns RGBA with every stroke taken from `orig` and the paper taken from `ai`.
 */
export function composeTextSafePixels(
  orig: Uint8ClampedArray,
  ai: Uint8ClampedArray,
  w: number,
  h: number,
  opts: ComposeOptions,
): Uint8ClampedArray {
  // Original paper: allow shadows down to ~55 % of the usual paper level.
  const po = estimatePaper(orig, w, h, 0.55);
  // AI paper: already even, so only a gentle floor.
  const pa = estimatePaper(ai, w, h, 0.85);
  const out = new Uint8ClampedArray(orig.length);
  const bw = opts.colorMode === "bw";
  // Pass 1: the ink picture (original pixel / original paper), 0 = full ink, 1 = paper.
  const ink = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const o = (y * w + x) * 3;
      for (let c = 0; c < 3; c++) {
        const paper = Math.max(8, sample(po.plane, po.f, x, y, c));
        let r = orig[i + c] / paper;
        if (r > 1) r = 1;
        // Near-white noise on the paper becomes clean paper.
        ink[o + c] = Math.min(1, r / 0.94);
      }
    }
  }
  if (opts.sharpen) sharpenInk(ink, w, h);
  // Pass 2: put the ink on the AI paper.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const o = (y * w + x) * 3;
      const ratio = [ink[o], ink[o + 1], ink[o + 2]];
      if (bw) {
        const g = 0.299 * ratio[0] + 0.587 * ratio[1] + 0.114 * ratio[2];
        ratio[0] = ratio[1] = ratio[2] = Math.max(0, Math.min(1, (g - 0.25) / 0.75));
      }
      for (let c = 0; c < 3; c++) {
        let r = ratio[c];
        if (opts.darker) r = Math.pow(r, 1.5);
        if (opts.contrast) r = Math.max(0, Math.min(1, (r - 0.5) * 1.25 + 0.5));
        let paperA = sample(pa.plane, pa.f, x, y, c);
        if (bw || opts.brighter) paperA = 255;
        let v = paperA * r;
        if (v > 255) v = 255;
        out[i + c] = v;
      }
      out[i + 3] = 255;
    }
  }
  return out;
}

/** Canvas wrapper: `ai` is stretched to the original's size first (the paper is smooth, so
 *  a small difference in framing does not matter). */
export function composeTextSafe(
  original: HTMLCanvasElement,
  ai: CanvasImageSource,
  opts: ComposeOptions,
): HTMLCanvasElement {
  const w = original.width;
  const h = original.height;
  const octx = original.getContext("2d", { willReadFrequently: true });
  if (!octx) throw new Error("Canvas context unavailable");
  const origData = octx.getImageData(0, 0, w, h);
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  const tctx = tmp.getContext("2d", { willReadFrequently: true });
  if (!tctx) throw new Error("Canvas context unavailable");
  tctx.fillStyle = "#ffffff";
  tctx.fillRect(0, 0, w, h);
  tctx.imageSmoothingEnabled = true;
  tctx.imageSmoothingQuality = "high";
  tctx.drawImage(ai, 0, 0, w, h);
  const aiData = tctx.getImageData(0, 0, w, h);
  const result = composeTextSafePixels(origData.data, aiData.data, w, h, opts);
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  const img = ctx.createImageData(w, h);
  img.data.set(result);
  ctx.putImageData(img, 0, 0);
  return out;
}
