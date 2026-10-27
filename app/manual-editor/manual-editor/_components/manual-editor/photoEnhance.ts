/*
 * photoEnhance.ts
 *
 * Dependency-free pixel engine for the "Enhance" tools of the Manual Editor:
 * Auto Enhance, Denoise, Deblur (detail recovery), Relight and the classical
 * part of Old Photo Restoration.
 *
 * IMPORTANT - honesty about what this is:
 *   Everything here is classical image processing (histograms, bilateral
 *   filtering, unsharp masking, tone curves). None of it is a neural network
 *   and none of it should be presented to users as "generative AI". It cannot
 *   invent detail that is not in the photo. Heavy motion blur, large tears or
 *   missing regions need a real model (see the notes delivered with this file).
 *
 * All functions work on RGBA `Pixels` ({ data, width, height }) exactly like
 * photoTools.ts, never touch the DOM, and never modify the alpha channel, so
 * transparent cut-outs stay transparent.
 */

import type { Pixels } from "./photoTools";

export type FaceBox = { x: number; y: number; width: number; height: number };

export type EnhanceRunOptions = {
  onProgress?: (fraction: number) => void;
  isCancelled?: () => boolean;
};

export class EnhanceCancelledError extends Error {
  constructor() {
    super("Processing was cancelled.");
    this.name = "EnhanceCancelledError";
  }
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

const OPAQUE_MIN_ALPHA = 16;

export function clonePixels(p: Pixels): Pixels {
  return { data: new Uint8ClampedArray(p.data), width: p.width, height: p.height };
}

/** Blend `edited` over `original` in place: strength 0 = original, 1 = edited. */
export function blendPixels(original: Pixels, edited: Pixels, strength: number): Pixels {
  const s = clamp(strength, 0, 1);
  if (s >= 1) return edited;
  const out = clonePixels(original);
  const a = original.data;
  const b = edited.data;
  const o = out.data;
  for (let i = 0; i < a.length; i += 4) {
    o[i] = a[i] + (b[i] - a[i]) * s;
    o[i + 1] = a[i + 1] + (b[i + 1] - a[i + 1]) * s;
    o[i + 2] = a[i + 2] + (b[i + 2] - a[i + 2]) * s;
  }
  return out;
}

async function checkpoint(opts: EnhanceRunOptions | undefined, fraction: number) {
  opts?.onProgress?.(clamp(fraction, 0, 1));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  if (opts?.isCancelled?.()) throw new EnhanceCancelledError();
}

/* ------------------------------------------------------------------ */
/* Blur helper                                                          */
/* ------------------------------------------------------------------ */

function blurPass(src: Float32Array, dst: Float32Array, w: number, h: number, r: number, horizontal: boolean) {
  const len = horizontal ? w : h;
  const lines = horizontal ? h : w;
  const stride = horizontal ? 1 : w;
  const lineStride = horizontal ? w : 1;
  const win = 2 * r + 1;
  for (let line = 0; line < lines; line += 1) {
    const base = line * lineStride;
    let sum = 0;
    for (let k = -r; k <= r; k += 1) {
      sum += src[base + Math.min(len - 1, Math.max(0, k)) * stride];
    }
    for (let i = 0; i < len; i += 1) {
      dst[base + i * stride] = sum / win;
      const add = Math.min(len - 1, i + r + 1);
      const sub = Math.max(0, i - r);
      sum += src[base + add * stride] - src[base + sub * stride];
    }
  }
}

/** Repeated box blur (3 passes ~ gaussian). Edge pixels are clamped. */
export function boxBlur(src: Float32Array, w: number, h: number, radius: number, passes = 3): Float32Array {
  const r = Math.max(0, Math.round(radius));
  if (r === 0) return new Float32Array(src);
  let a = new Float32Array(src);
  let b = new Float32Array(src.length);
  for (let p = 0; p < passes; p += 1) {
    blurPass(a, b, w, h, r, true);
    blurPass(b, a, w, h, r, false);
  }
  return a;
}

function lumaPlane(img: Pixels): Float32Array {
  const { data, width, height } = img;
  const out = new Float32Array(width * height);
  for (let i = 0, p = 0; p < out.length; i += 4, p += 1) {
    out[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Analysis                                                             */
/* ------------------------------------------------------------------ */

export type ImageStats = {
  sampled: number;
  meanLuma: number;
  stdLuma: number;
  pLow: number;
  pHigh: number;
  meanSaturation: number;
  neutralMean: [number, number, number] | null;
  neutralFraction: number;
  /** Estimated noise standard deviation in 0-255 luma units (Immerkaer). */
  noiseSigma: number;
  /** Variance of the Laplacian: low = soft/blurry, high = crisp. */
  sharpness: number;
  isGrayscale: boolean;
  transparentFraction: number;
};

export function analyzeImage(img: Pixels): ImageStats {
  const { data, width: w, height: h } = img;
  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 250000)));
  const hist = new Uint32Array(256);
  let n = 0;
  let total = 0;
  let transparent = 0;
  let sumL = 0;
  let sumL2 = 0;
  let sumSat = 0;
  let chromaCount = 0;
  let nr = 0;
  let ng = 0;
  let nb = 0;
  let nn = 0;
  let lapSum = 0;
  let lapSum2 = 0;
  let lapN = 0;
  let noiseSum = 0;
  let noiseN = 0;

  const L = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      total += 1;
      const i = (y * w + x) * 4;
      if (data[i + 3] < OPAQUE_MIN_ALPHA) {
        transparent += 1;
        continue;
      }
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      hist[Math.min(255, Math.round(l))] += 1;
      n += 1;
      sumL += l;
      sumL2 += l * l;
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const sat = mx > 0 ? (mx - mn) / mx : 0;
      sumSat += sat;
      if (mx - mn > 18) chromaCount += 1;
      if (sat < 0.4 && l >= 25 && l <= 230) {
        nr += r;
        ng += g;
        nb += b;
        nn += 1;
      }
      if (x > 0 && y > 0 && x < w - 1 && y < h - 1) {
        const lap = L(x - 1, y) + L(x + 1, y) + L(x, y - 1) + L(x, y + 1) - 4 * l;
        lapSum += lap;
        lapSum2 += lap * lap;
        lapN += 1;
        const m =
          L(x - 1, y - 1) + L(x + 1, y - 1) + L(x - 1, y + 1) + L(x + 1, y + 1) -
          2 * (L(x, y - 1) + L(x - 1, y) + L(x + 1, y) + L(x, y + 1)) +
          4 * l;
        noiseSum += Math.abs(m);
        noiseN += 1;
      }
    }
  }

  if (n === 0) {
    return {
      sampled: 0, meanLuma: 128, stdLuma: 0, pLow: 0, pHigh: 255, meanSaturation: 0,
      neutralMean: null, neutralFraction: 0, noiseSigma: 0, sharpness: 0,
      isGrayscale: false, transparentFraction: total ? transparent / total : 0,
    };
  }

  const percentile = (q: number) => {
    const target = q * n;
    let acc = 0;
    for (let v = 0; v < 256; v += 1) {
      acc += hist[v];
      if (acc >= target) return v;
    }
    return 255;
  };

  const meanLuma = sumL / n;
  const lapMean = lapN ? lapSum / lapN : 0;
  return {
    sampled: n,
    meanLuma,
    stdLuma: Math.sqrt(Math.max(0, sumL2 / n - meanLuma * meanLuma)),
    pLow: percentile(0.005),
    pHigh: percentile(0.995),
    meanSaturation: sumSat / n,
    neutralMean: nn > 0 ? [nr / nn, ng / nn, nb / nn] : null,
    neutralFraction: nn / n,
    noiseSigma: noiseN ? (Math.sqrt(Math.PI / 2) * noiseSum) / (6 * noiseN) : 0,
    sharpness: lapN ? lapSum2 / lapN - lapMean * lapMean : 0,
    isGrayscale: chromaCount / n < 0.02,
    transparentFraction: total ? transparent / total : 0,
  };
}

/** True when the photo is (almost) black & white - used to gate the colorizer. */
export function isGrayscaleImage(img: Pixels): boolean {
  return analyzeImage(img).isGrayscale;
}

/* ------------------------------------------------------------------ */
/* Tone                                                                 */
/* ------------------------------------------------------------------ */

export type AutoEnhanceParams = {
  blackPoint: number;
  whitePoint: number;
  gamma: number;
  gains: [number, number, number];
  contrast: number;
  vibrance: number;
  sharpen: number;
  denoise: 0 | 1 | 2;
};

export function computeAutoEnhance(s: ImageStats): { params: AutoEnhanceParams; notes: string[] } {
  const notes: string[] = [];
  const params: AutoEnhanceParams = {
    blackPoint: 0, whitePoint: 255, gamma: 1, gains: [1, 1, 1],
    contrast: 0, vibrance: 0, sharpen: 0, denoise: 0,
  };
  if (s.sampled === 0) return { params, notes: ["No visible pixels to analyse."] };

  // 1. Levels: stretch only when the histogram really leaves room at either end.
  let bp = clamp(s.pLow - 2, 0, 60);
  let wp = clamp(s.pHigh + 2, 160, 255);
  if (bp < 6) bp = 0;
  if (wp > 249) wp = 255;
  params.blackPoint = bp;
  params.whitePoint = wp;
  if (bp > 0 || wp < 255) notes.push("Tonal range stretched (black/white point).");

  // 2. Exposure via gamma. Only dark photos are brightened; bright
  //    high-key photos (e.g. white passport backgrounds) are left alone
  //    unless they are clearly blown out.
  const meanN = clamp((s.meanLuma - bp) / (wp - bp), 0.03, 0.97);
  if (meanN < 0.43) {
    params.gamma = clamp(Math.log(0.45) / Math.log(meanN), 0.55, 1);
    notes.push("Exposure raised (photo looked under-exposed).");
  } else if (meanN > 0.78) {
    params.gamma = clamp(Math.log(0.6) / Math.log(meanN), 1, 1.3);
    notes.push("Exposure lowered (photo looked over-exposed).");
  }

  // 3. White balance (gray-world on near-neutral pixels, with safeguards).
  if (!s.isGrayscale && s.neutralMean && s.neutralFraction >= 0.03) {
    const [mr, mg, mb] = s.neutralMean;
    const gray = (mr + mg + mb) / 3;
    if (mr > 1 && mg > 1 && mb > 1) {
      const raw: [number, number, number] = [gray / mr, gray / mg, gray / mb];
      const dev = Math.max(Math.abs(raw[0] - 1), Math.abs(raw[1] - 1), Math.abs(raw[2] - 1));
      if (dev > 0.03) {
        // Strongly coloured scenes (sunsets, green fields) are not colour casts.
        const confidence = 1 - clamp((s.meanSaturation - 0.3) / 0.3, 0, 1);
        const g = raw.map((v) => clamp(1 + (v - 1) * confidence, 0.85, 1.15)) as [number, number, number];
        const lum = 0.299 * g[0] + 0.587 * g[1] + 0.114 * g[2];
        params.gains = [g[0] / lum, g[1] / lum, g[2] / lum];
        if (confidence > 0.2) notes.push("Colour cast reduced (white balance).");
      }
    }
  }

  // 4. Contrast
  const stdAfter = s.stdLuma * (255 / (wp - bp));
  if (stdAfter < 52) {
    params.contrast = clamp(((52 - stdAfter) / 52) * 0.9, 0, 0.35);
    if (params.contrast > 0.03) notes.push("Contrast increased.");
  }

  // 5. Vibrance (only for colour photos with muted colours)
  if (!s.isGrayscale && s.meanSaturation < 0.38) {
    params.vibrance = clamp((0.38 - s.meanSaturation) * 1.6, 0, 0.4);
    if (params.vibrance > 0.05) notes.push("Muted colours boosted (vibrance).");
  }

  // 6. Noise and sharpness
  if (s.noiseSigma >= 3) {
    params.denoise = s.noiseSigma < 5 ? 1 : 2;
    notes.push("Light noise reduction applied.");
  }
  let sharpen = s.sharpness < 25 ? 0.6 : s.sharpness < 60 ? 0.45 : s.sharpness < 130 ? 0.3 : s.sharpness < 260 ? 0.15 : 0;
  if (s.noiseSigma > 6) sharpen *= 0.5;
  params.sharpen = sharpen;
  if (sharpen > 0) notes.push("Gentle sharpening applied.");

  if (notes.length === 0) notes.push("This photo already looks balanced; only minimal changes were needed.");
  return { params, notes };
}

/** Applies levels + gamma + contrast + white balance + vibrance in place. */
export function applyTone(img: Pixels, p: AutoEnhanceParams): void {
  const luts = [0, 1, 2].map((c) => {
    const lut = new Uint8ClampedArray(256);
    const range = Math.max(1, p.whitePoint - p.blackPoint);
    for (let v = 0; v < 256; v += 1) {
      const n = clamp((v * p.gains[c] - p.blackPoint) / range, 0, 1);
      let g = Math.pow(n, p.gamma);
      if (p.contrast > 0) {
        const t = g * g * (3 - 2 * g);
        g += p.contrast * (t - g);
      }
      lut[v] = Math.round(g * 255);
    }
    return lut;
  });
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < OPAQUE_MIN_ALPHA) continue;
    let r = luts[0][d[i]];
    let g = luts[1][d[i + 1]];
    let b = luts[2][d[i + 2]];
    if (p.vibrance > 0) {
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const sat = mx > 0 ? (mx - mn) / mx : 0;
      let k = p.vibrance * (1 - sat);
      if (r >= g && g >= b && sat > 0.15 && sat < 0.6) k *= 0.5; // be gentle on skin tones
      const avg = (r + g + b) / 3;
      r += (r - avg) * k;
      g += (g - avg) * k;
      b += (b - avg) * k;
    }
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
}

/* ------------------------------------------------------------------ */
/* Sharpen / Deblur                                                     */
/* ------------------------------------------------------------------ */

/** Luma-only unsharp mask with a noise gate. In place. */
export function unsharp(img: Pixels, amount: number, radius: number, threshold = 3): void {
  if (amount <= 0) return;
  const { data, width: w, height: h } = img;
  const luma = lumaPlane(img);
  const blur = boxBlur(luma, w, h, radius, 3);
  for (let p = 0, i = 0; p < luma.length; p += 1, i += 4) {
    if (data[i + 3] < OPAQUE_MIN_ALPHA) continue;
    const diff = luma[p] - blur[p];
    const gate = smoothstep(threshold, threshold * 2 + 1, Math.abs(diff));
    const delta = diff * amount * gate;
    data[i] += delta;
    data[i + 1] += delta;
    data[i + 2] += delta;
  }
}

/**
 * "Deblur" = two-scale detail recovery with a halo limiter. This is
 * classical sharpening, NOT an AI deblur model: it can reduce mild softness
 * (slightly missed focus, downscaled photos) but cannot undo motion blur.
 */
export function deblur(img: Pixels, strength: number): Pixels {
  const out = clonePixels(img);
  const s = clamp(strength, 0, 1);
  if (s === 0) return out;
  const { data, width: w, height: h } = out;
  const before = lumaPlane(out);

  unsharp(out, 0.7 + 1.3 * s, 1, 2);
  unsharp(out, 0.25 + 0.55 * s, 3, 3);

  // Halo limiter: the new luma may not exceed the local 3x3 range of the
  // original by more than a small overshoot.
  const overshoot = 10 + 14 * s;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const p = y * w + x;
      const i = p * 4;
      if (data[i + 3] < OPAQUE_MIN_ALPHA) continue;
      let mn = 255;
      let mx = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        const yy = clamp(y + dy, 0, h - 1);
        for (let dx = -1; dx <= 1; dx += 1) {
          const v = before[yy * w + clamp(x + dx, 0, w - 1)];
          if (v < mn) mn = v;
          if (v > mx) mx = v;
        }
      }
      const now = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const limited = clamp(now, mn - overshoot, mx + overshoot);
      if (limited !== now) {
        const shift = limited - now;
        data[i] += shift;
        data[i + 1] += shift;
        data[i + 2] += shift;
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Denoise (edge-preserving bilateral filter)                           */
/* ------------------------------------------------------------------ */

export type DenoiseLevel = 1 | 2 | 3; // weak, medium, strong

const DENOISE_TABLE: Record<DenoiseLevel, { radius: number; sigmaS: number; sigmaR: number; keep: number }> = {
  1: { radius: 1, sigmaS: 0.9, sigmaR: 14, keep: 0.18 },
  2: { radius: 2, sigmaS: 1.4, sigmaR: 24, keep: 0.12 },
  3: { radius: 3, sigmaS: 2.0, sigmaR: 38, keep: 0.06 },
};

export async function denoise(src: Pixels, level: DenoiseLevel, opts?: EnhanceRunOptions): Promise<Pixels> {
  const { data, width: w, height: h } = src;
  const out = clonePixels(src);
  const o = out.data;
  const cfg = DENOISE_TABLE[level];
  // Very large photos: cap the radius so the browser stays responsive.
  const radius = w * h > 6_000_000 ? Math.min(cfg.radius, 2) : cfg.radius;

  const rangeLut = new Float32Array(766);
  for (let d = 0; d < 766; d += 1) {
    const avg = d / 3;
    rangeLut[d] = Math.exp(-(avg * avg) / (2 * cfg.sigmaR * cfg.sigmaR));
  }
  const side = radius * 2 + 1;
  const spatial = new Float32Array(side * side);
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      spatial[(dy + radius) * side + dx + radius] = Math.exp(-(dx * dx + dy * dy) / (2 * cfg.sigmaS * cfg.sigmaS));
    }
  }

  const rowsPerChunk = Math.max(1, Math.floor(120000 / w));
  await checkpoint(opts, 0); // honour cancellation before any work, even on tiny images
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < OPAQUE_MIN_ALPHA) continue;
      const r0 = data[i];
      const g0 = data[i + 1];
      const b0 = data[i + 2];
      let wr = 0;
      let wg = 0;
      let wb = 0;
      let wsum = 0;
      for (let dy = -radius; dy <= radius; dy += 1) {
        const yy = clamp(y + dy, 0, h - 1);
        for (let dx = -radius; dx <= radius; dx += 1) {
          const j = (yy * w + clamp(x + dx, 0, w - 1)) * 4;
          if (data[j + 3] < OPAQUE_MIN_ALPHA) continue;
          const diff = Math.abs(data[j] - r0) + Math.abs(data[j + 1] - g0) + Math.abs(data[j + 2] - b0);
          const wt = spatial[(dy + radius) * side + dx + radius] * rangeLut[diff];
          wr += data[j] * wt;
          wg += data[j + 1] * wt;
          wb += data[j + 2] * wt;
          wsum += wt;
        }
      }
      if (wsum > 0) {
        const keep = cfg.keep;
        o[i] = (wr / wsum) * (1 - keep) + r0 * keep;
        o[i + 1] = (wg / wsum) * (1 - keep) + g0 * keep;
        o[i + 2] = (wb / wsum) * (1 - keep) + b0 * keep;
      }
    }
    if ((y + 1) % rowsPerChunk === 0) await checkpoint(opts, (y + 1) / h);
  }
  if (opts?.isCancelled?.()) throw new EnhanceCancelledError();
  opts?.onProgress?.(1);
  return out;
}

/* ------------------------------------------------------------------ */
/* Auto Enhance                                                         */
/* ------------------------------------------------------------------ */

export type AutoEnhanceResult = { pixels: Pixels; params: AutoEnhanceParams; notes: string[]; stats: ImageStats };

export async function runAutoEnhance(
  src: Pixels,
  strength = 1,
  opts?: EnhanceRunOptions,
): Promise<AutoEnhanceResult> {
  const stats = analyzeImage(src);
  const { params, notes } = computeAutoEnhance(stats);
  let work = clonePixels(src);
  if (params.denoise > 0) {
    work = await denoise(work, params.denoise as DenoiseLevel, {
      isCancelled: opts?.isCancelled,
      onProgress: (f) => opts?.onProgress?.(f * 0.8),
    });
  }
  applyTone(work, params);
  unsharp(work, params.sharpen, 1.5, 3);
  opts?.onProgress?.(1);
  return { pixels: blendPixels(src, work, strength), params, notes, stats };
}

/* ------------------------------------------------------------------ */
/* Relight                                                              */
/* ------------------------------------------------------------------ */

export type RelightParams = {
  /** Overall strength 0..1 */
  strength: number;
  /** How much dark regions are lifted 0..1 */
  shadows: number;
  /** How strongly bright areas are protected 0..1 */
  highlightProtect: number;
  /** Optional detected face; if present and dark it gets extra fill light. */
  faceBox?: FaceBox | null;
  /** Extra face fill 0..1 (ignored without faceBox) */
  faceBoost: number;
};

export const DEFAULT_RELIGHT: RelightParams = { strength: 0.7, shadows: 0.7, highlightProtect: 0.7, faceBox: null, faceBoost: 0.6 };

function shoulder(y: number) {
  return y < 0.8 ? y : 0.8 + 0.2 * (1 - Math.exp(-(y - 0.8) / 0.2));
}

/**
 * Region-based light correction: only locally dark areas are lifted (the
 * decision uses a heavily blurred luma map, so a dark jacket next to a bright
 * wall is treated differently from an under-exposed face). RGB is scaled
 * multiplicatively to keep hue. Not a 3-D relighting model.
 */
export function relight(src: Pixels, params: RelightParams): Pixels {
  const out = clonePixels(src);
  const { data, width: w, height: h } = out;
  const luma = lumaPlane(src);
  const local = boxBlur(luma, w, h, Math.max(2, Math.round(Math.max(w, h) * 0.04)), 3);
  const k = 1.8 * clamp(params.shadows, 0, 1) * clamp(params.strength, 0, 1);
  const hp = clamp(params.highlightProtect, 0, 1);

  // Optional face fill-light gain
  let faceGain = 1;
  let fcx = 0;
  let fcy = 0;
  let frx = 1;
  let fry = 1;
  const fb = params.faceBox;
  if (fb && fb.width > 4 && fb.height > 4 && params.faceBoost > 0) {
    let sum = 0;
    let cnt = 0;
    const x0 = clamp(Math.round(fb.x + fb.width * 0.2), 0, w - 1);
    const x1 = clamp(Math.round(fb.x + fb.width * 0.8), 0, w - 1);
    const y0 = clamp(Math.round(fb.y + fb.height * 0.2), 0, h - 1);
    const y1 = clamp(Math.round(fb.y + fb.height * 0.8), 0, h - 1);
    for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) { sum += luma[y * w + x]; cnt += 1; }
    const faceMean = cnt ? sum / cnt / 255 : 0.5;
    if (faceMean > 0.01 && faceMean < 0.5) {
      faceGain = Math.pow(clamp(0.5 / faceMean, 1, 1.8), clamp(params.faceBoost, 0, 1) * clamp(params.strength, 0, 1));
    }
    fcx = fb.x + fb.width / 2;
    fcy = fb.y + fb.height / 2;
    frx = (fb.width / 2) * 1.15;
    fry = (fb.height / 2) * 1.15;
  }

  for (let p = 0, i = 0; p < luma.length; p += 1, i += 4) {
    if (data[i + 3] < OPAQUE_MIN_ALPHA) continue;
    const l = luma[p] / 255;
    if (l < 0.002) continue;
    const dark = 1 - smoothstep(0.15, 0.6, local[p] / 255);
    let gain = 1 + k * dark;
    if (faceGain > 1) {
      const x = p % w;
      const y = (p / w) | 0;
      const e = ((x - fcx) / frx) ** 2 + ((y - fcy) / fry) ** 2;
      if (e < 1.8) gain *= 1 + (faceGain - 1) * Math.exp(-e * 1.6);
    }
    // highlight protection
    gain = 1 + (gain - 1) * (1 - hp * smoothstep(0.55, 0.95, l));
    if (gain <= 1.0001) continue; // untouched pixels stay exactly as they were
    const lifted = Math.max(l, shoulder(l * gain));
    const eff = lifted / l;
    data[i] *= eff;
    data[i + 1] *= eff;
    data[i + 2] *= eff;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Old photo restoration (classical part)                               */
/* ------------------------------------------------------------------ */

/**
 * Removes thin bright/dark defects (dust specks, hairline scratches up to
 * ~5 px wide) by comparing each pixel with its neighbours 3 px away in four
 * directions. Returns the number of repaired pixels.
 *
 * Limits: wide scratches, tears and missing areas are NOT handled (use the
 * Retouch tool or a real inpainting model); single fine hairs / eyelashes can
 * look slightly softer, therefore faces can be protected.
 */
export function removeSpecks(src: Pixels, sensitivity: number, protect: FaceBox[] = []): { pixels: Pixels; repaired: number } {
  const out = clonePixels(src);
  const { data: s, width: w, height: h } = src;
  const o = out.data;
  const luma = lumaPlane(src);
  const thr = 60 - 42 * clamp(sensitivity, 0, 1); // 60 .. 18
  const O = 3;
  const dirs: Array<[number, number]> = [[1, 0], [0, 1], [1, 1], [1, -1]];
  let repaired = 0;

  const isProtected = (x: number, y: number) =>
    protect.some((b) => x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height);

  for (let y = O; y < h - O; y += 1) {
    for (let x = O; x < w - O; x += 1) {
      const p = y * w + x;
      const i = p * 4;
      if (s[i + 3] < OPAQUE_MIN_ALPHA) continue;
      const l = luma[p];
      let best = -1;
      let bestDiff = Infinity;
      let ai = 0;
      let bi = 0;
      for (let d = 0; d < dirs.length; d += 1) {
        const [dx, dy] = dirs[d];
        const pa = (y + dy * O) * w + x + dx * O;
        const pb = (y - dy * O) * w + x - dx * O;
        const la = luma[pa];
        const lb = luma[pb];
        const da = l - la;
        const db = l - lb;
        const sameSign = (da > thr && db > thr) || (da < -thr && db < -thr);
        if (sameSign && Math.abs(la - lb) < thr * 0.7 && Math.abs(la - lb) < bestDiff) {
          best = d;
          bestDiff = Math.abs(la - lb);
          ai = pa * 4;
          bi = pb * 4;
        }
      }
      if (best >= 0 && !isProtected(x, y)) {
        if (s[ai + 3] < OPAQUE_MIN_ALPHA || s[bi + 3] < OPAQUE_MIN_ALPHA) continue;
        o[i] = (s[ai] + s[bi]) / 2;
        o[i + 1] = (s[ai + 1] + s[bi + 1]) / 2;
        o[i + 2] = (s[ai + 2] + s[bi + 2]) / 2;
        repaired += 1;
      }
    }
  }
  return { pixels: out, repaired };
}

/** Per-channel histogram stretch to undo fading / colour drift. In place. */
export function restoreFade(img: Pixels, strength: number, grayscale: boolean): void {
  const s = clamp(strength, 0, 1);
  if (s === 0) return;
  const { data } = img;
  const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < OPAQUE_MIN_ALPHA) continue;
    hist[0][data[i]] += 1;
    hist[1][data[i + 1]] += 1;
    hist[2][data[i + 2]] += 1;
    n += 1;
  }
  if (n === 0) return;
  const pct = (h: Uint32Array, q: number) => {
    let acc = 0;
    for (let v = 0; v < 256; v += 1) { acc += h[v]; if (acc >= q * n) return v; }
    return 255;
  };
  let lows = hist.map((h) => pct(h, 0.005));
  let highs = hist.map((h) => pct(h, 0.995));
  if (grayscale) {
    const lo = Math.min(...lows);
    const hi = Math.max(...highs);
    lows = [lo, lo, lo];
    highs = [hi, hi, hi];
  }
  const luts = [0, 1, 2].map((c) => {
    // never over-stretch: black point <= 70, white point >= 170
    const bp = Math.min(lows[c], 70) * s;
    const wp = 255 - (255 - Math.max(highs[c], 170)) * s;
    const range = Math.max(1, wp - bp);
    const lut = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v += 1) {
      const x = clamp((v - bp) / range, 0, 1);
      const t = x * x * (3 - 2 * x);
      lut[v] = Math.round((x + 0.2 * s * (t - x)) * 255);
    }
    return lut;
  });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < OPAQUE_MIN_ALPHA) continue;
    data[i] = luts[0][data[i]];
    data[i + 1] = luts[1][data[i + 1]];
    data[i + 2] = luts[2][data[i + 2]];
  }
}

export type RestoreParams = {
  /** 0 disables dust/scratch repair */
  dust: number;
  /** 0 disables fade restoration */
  fade: number;
  denoise: 0 | 1 | 2 | 3;
  /** 0 disables detail recovery */
  detail: number;
  /** Faces that dust removal must not touch (identity / eyes / hair safety). */
  protect: FaceBox[];
};

export const DEFAULT_RESTORE: RestoreParams = { dust: 0.5, fade: 0.7, denoise: 1, detail: 0.4, protect: [] };

export type RestoreResult = { pixels: Pixels; repaired: number; grayscale: boolean; notes: string[] };

export async function restorePhoto(src: Pixels, params: RestoreParams, opts?: EnhanceRunOptions): Promise<RestoreResult> {
  const notes: string[] = [];
  const grayscale = analyzeImage(src).isGrayscale;
  let work = clonePixels(src);
  let repaired = 0;

  if (params.dust > 0) {
    const r = removeSpecks(work, params.dust, params.protect);
    work = r.pixels;
    repaired = r.repaired;
    notes.push(`${repaired} dust/scratch pixels repaired.`);
    if (params.protect.length) notes.push("Faces were protected from dust repair.");
  }
  await checkpoint(opts, 0.2);

  if (params.fade > 0) {
    restoreFade(work, params.fade, grayscale);
    notes.push("Faded tones and colour drift corrected.");
  }
  await checkpoint(opts, 0.35);

  if (params.denoise > 0) {
    work = await denoise(work, params.denoise as DenoiseLevel, {
      isCancelled: opts?.isCancelled,
      onProgress: (f) => opts?.onProgress?.(0.35 + f * 0.55),
    });
    notes.push("Noise reduced.");
  }

  if (params.detail > 0) {
    unsharp(work, 0.2 + 0.9 * clamp(params.detail, 0, 1), 2, 3);
    notes.push("Fine detail recovered (sharpening, not AI reconstruction).");
  }
  opts?.onProgress?.(1);
  return { pixels: work, repaired, grayscale, notes };
}
