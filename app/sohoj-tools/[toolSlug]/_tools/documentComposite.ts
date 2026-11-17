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
  /** "Restore old colours": faded ink is made strong again, and the ink COLOUR is read from the
   *  person's own photo (after the light and tint are removed). The AI picture gives only the
   *  paper, never a letter shape and never an ink colour, so it cannot give a wrong colour. */
  restoreColor?: boolean;
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
  radius = 7,
): { plane: Plane; f: number } {
  const f = Math.max(1, Math.round(Math.max(w, h) / 500));
  const small = boxDownscale(src, w, h, f);
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


/** Box downscale for float planes (3 channels). */
function boxDownscaleFloat(src: Float32Array, w: number, h: number, f: number): Plane {
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
        let i = (y * w + x0) * 3;
        for (let x = x0; x < x1; x++) {
          r += src[i];
          g += src[i + 1];
          b += src[i + 2];
          n++;
          i += 3;
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

/**
 * Ink colour field from the PERSON'S OWN photo (not from the AI).
 * `ink` is already (original pixel / original paper), so shadows, yellow tint and uneven light
 * are gone and what is left is the real colour of the ink. For every place we average how much
 * each channel is absorbed by the strokes nearby (darker strokes count more). The AI picture
 * is not used here at all, so the AI can never give a wrong ink colour.
 */
function inkColorField(
  ink: Float32Array,
  inkN: Float32Array,
  w: number,
  h: number,
): { color: Plane; weight: Plane; f: number } {
  const n = w * h;
  const cs = new Float32Array(n * 3);
  const ws = new Float32Array(n * 3);
  for (let p = 0; p < n; p++) {
    const o = p * 3;
    // How much ink (the paper's own tint removed) decides who votes ...
    const d = Math.max(
      0,
      1 - (0.299 * ink[o] + 0.587 * ink[o + 1] + 0.114 * ink[o + 2]),
    );
    // ... and the colour of the vote is measured against a GREY paper level, so black ink on
    // yellowish paper stays grey instead of looking blue.
    const a0 = Math.max(0, 1 - inkN[o]);
    const a1 = Math.max(0, 1 - inkN[o + 1]);
    const a2 = Math.max(0, 1 - inkN[o + 2]);
    // Only real strokes vote (paper noise below ~6 % does not).
    const wgt = d < 0.06 ? 0 : d * d;
    ws[o] = ws[o + 1] = ws[o + 2] = wgt;
    cs[o] = wgt * a0;
    cs[o + 1] = wgt * a1;
    cs[o + 2] = wgt * a2;
  }
  const f = Math.max(1, Math.round(Math.max(w, h) / 500));
  // Small blur: just enough to average out camera noise inside one stroke / one word, so a red
  // seal next to black text does not bleed far into the text.
  const color = boxBlur(boxBlur(boxDownscaleFloat(cs, w, h, f), 2), 2);
  const weight = boxBlur(boxBlur(boxDownscaleFloat(ws, w, h, f), 2), 2);
  return { color, weight, f };
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
  // Same picture, but the page's own paper tint (yellowish / bluish, one value for the whole
  // page) is put back, so black ink on tinted paper stays grey. Local changes (a watermark, a
  // shadow) are still divided out per channel, so they can never tint the text that lies on them.
  const inkN = new Float32Array(w * h * 3);
  const pref = [0, 1, 2].map((c) => percentile90(po.plane, c));
  const gref = Math.max(8, 0.299 * pref[0] + 0.587 * pref[1] + 0.114 * pref[2]);
  const tint = pref.map((v) => Math.max(8, v) / gref);
  // Paper seen from very close (a few stroke widths). Used ONLY to read the ink colour: next to
  // a big pale area (a watermark) the "paper" is that area, so it cannot tint the text on it.
  const pl = estimatePaper(orig, w, h, 0.55, 3);
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
        const near = Math.max(8, sample(pl.plane, pl.f, x, y, c));
        inkN[o + c] = Math.min(1, (orig[i + c] / near) * tint[c]);
      }
    }
  }
  if (opts.sharpen) sharpenInk(ink, w, h);
  const field =
    opts.restoreColor && opts.colorMode !== "bw"
      ? inkColorField(ink, inkN, w, h)
      : null;
  // Faded ink: stretch the darkest strokes of the page up to full strength, so old pale ink
  // comes back as strong as new ink (only the strokes' own strength changes, never their shape).
  let inkStretch = 1;
  if (field) {
    const hist = new Uint32Array(101);
    let count = 0;
    for (let k = 0; k < ink.length; k += 3) {
      const dd = 1 - (0.299 * ink[k] + 0.587 * ink[k + 1] + 0.114 * ink[k + 2]);
      if (dd > 0.15) {
        hist[Math.min(100, Math.round(dd * 100))]++;
        count++;
      }
    }
    if (count > 200) {
      let acc = 0;
      for (let v = 0; v <= 100; v++) {
        acc += hist[v];
        if (acc >= count * 0.97) {
          inkStretch = 1 / Math.max(0.3, v / 100);
          break;
        }
      }
    }
  }
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
      const base = [0, 0, 0];
      const paperV = [0, 0, 0];
      for (let c = 0; c < 3; c++) {
        let r = ratio[c];
        if (opts.darker) r = Math.pow(r, 1.5);
        if (opts.contrast) r = Math.max(0, Math.min(1, (r - 0.5) * 1.25 + 0.5));
        let paperA = sample(pa.plane, pa.f, x, y, c);
        if (bw || opts.brighter) paperA = 255;
        paperV[c] = paperA;
        base[c] = Math.min(255, paperA * r);
        ratio[c] = r;
      }
      if (field) {
        // How much ink is here (from the person's own strokes only).
        const lum = 0.299 * ratio[0] + 0.587 * ratio[1] + 0.114 * ratio[2];
        const d = Math.max(0, Math.min(1, (1 - lum) * inkStretch));
        const wsum = sample(field.weight, field.f, x, y, 0);
        if (d > 0 && wsum > 1e-5) {
          // Ink colour here = how much each channel is absorbed, averaged nearby.
          const A = [
            sample(field.color, field.f, x, y, 0) / wsum,
            sample(field.color, field.f, x, y, 1) / wsum,
            sample(field.color, field.f, x, y, 2) / wsum,
          ];
          const mx = Math.max(A[0], A[1], A[2], 1e-6);
          let u = [A[0] / mx, A[1] / mx, A[2] / mx];
          const mean = (u[0] + u[1] + u[2]) / 3;
          const spread = Math.max(u[0], u[1], u[2]) - Math.min(u[0], u[1], u[2]);
          // Almost no colour difference between channels = black / grey ink: keep it neutral
          // (this removes the faint blue / yellow cast a camera puts on black ink).
          // Colour limit is kept high on purpose: a faint colour difference (a pale watermark, a
          // dim green border) is too weak to trust, and boosting it would tint black text blue.
          // The darker the stroke, the more colour difference we need before we believe it:
          // a very dark stroke with only a faint tint is black ink with camera noise, while a
          // pale stroke (a dim green border) can be truly coloured with only a faint difference.
          const rawDark = Math.max(0, Math.min(1, 1 - lum));
          const lo = 0.035 + 0.06 * Math.max(0, Math.min(1, (rawDark - 0.45) / 0.35));
          let t = Math.max(0, Math.min(1, (spread - lo) / 0.06));
          t = t * t * (3 - 2 * t);
          // Real coloured ink (blue pen, red seal) gets its colour a bit stronger.
          const k = 1.3 + 6 * Math.max(0, 1 - spread / 0.3);
          const boosted = u.map((v) => Math.max(0, Math.min(1, mean + k * (v - mean))));
          const bm = Math.max(boosted[0], boosted[1], boosted[2], 1e-6);
          u = [0, 1, 2].map((c) => (1 - t) + t * (boosted[c] / bm));
          const lumU = 0.299 * u[0] + 0.587 * u[1] + 0.114 * u[2];
          // Coloured ink also gets stronger, so a pale green line looks freshly drawn.
          const s = Math.max(
            0,
            Math.min(1, (d / Math.max(0.2, lumU)) * (1 + 0.7 * t)),
          );
          for (let c = 0; c < 3; c++) {
            base[c] = paperV[c] * (1 - s * u[c]);
          }
        }
      }
      for (let c = 0; c < 3; c++) out[i + c] = base[c];
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
