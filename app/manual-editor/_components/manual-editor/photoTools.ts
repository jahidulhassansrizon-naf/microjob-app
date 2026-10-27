/**
 * photoTools.ts
 *
 * Pure pixel-processing helpers for the Retouch / Object Remover editor.
 * Nothing here touches the DOM, so every function can be unit-tested in Node.
 *
 * All functions mutate the supplied RGBA buffer in place and take a `mask`
 * (one byte per pixel, 0 = untouched, 255 = fully affected).
 *
 * HONEST LIMITS
 *  - `repairRegion` is a classic diffusion/"onion-peel" fill. It is NOT a
 *    generative AI inpainting model. It works well for small objects, dust,
 *    scratches and blemishes on simple or smooth backgrounds. Large objects on
 *    detailed backgrounds will look smeared.
 *  - `smoothSkin` is an edge-preserving filter limited to skin-coloured pixels.
 *    It is not face recognition.
 */

export type Pixels = { data: Uint8ClampedArray; width: number; height: number };

export type Point = { x: number; y: number };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ------------------------------------------------------------------ */
/* Mask helpers                                                        */
/* ------------------------------------------------------------------ */

/** Paint a round-brush segment into a mask (hard core, soft 1.5px edge). */
export function paintMaskSegment(
  mask: Uint8Array,
  width: number,
  height: number,
  a: Point,
  b: Point,
  brushSize: number,
) {
  const radius = Math.max(0.5, brushSize / 2);
  const left = clamp(Math.floor(Math.min(a.x, b.x) - radius - 2), 0, width - 1);
  const right = clamp(Math.ceil(Math.max(a.x, b.x) + radius + 2), 0, width - 1);
  const top = clamp(Math.floor(Math.min(a.y, b.y) - radius - 2), 0, height - 1);
  const bottom = clamp(Math.ceil(Math.max(a.y, b.y) + radius + 2), 0, height - 1);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const t = lenSq < 1e-4 ? 0 : clamp(((px - a.x) * dx + (py - a.y) * dy) / lenSq, 0, 1);
      const dist = Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
      if (dist >= radius + 1.5) continue;
      const cover = clamp((radius + 1.5 - dist) / 1.5, 0, 1);
      const i = y * width + x;
      const v = Math.round(cover * 255);
      if (v > mask[i]) mask[i] = v;
    }
  }
}

export function maskIsEmpty(mask: Uint8Array) {
  for (let i = 0; i < mask.length; i += 1) if (mask[i] > 0) return false;
  return true;
}

/** Grow a mask by `radius` pixels (binary dilation, square kernel). */
export function dilateMask(mask: Uint8Array, width: number, height: number, radius: number) {
  const r = Math.round(radius);
  if (r <= 0) return new Uint8Array(mask);
  const tmp = new Uint8Array(mask.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let m = 0;
      for (let k = -r; k <= r && m < 255; k += 1) {
        const xx = x + k;
        if (xx >= 0 && xx < width) m = Math.max(m, mask[y * width + xx]);
      }
      tmp[y * width + x] = m;
    }
  }
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let m = 0;
      for (let k = -r; k <= r && m < 255; k += 1) {
        const yy = y + k;
        if (yy >= 0 && yy < height) m = Math.max(m, tmp[yy * width + x]);
      }
      out[y * width + x] = m;
    }
  }
  return out;
}

/** Soften a mask edge with three box-blur passes (~Gaussian). */
export function featherMask(mask: Uint8Array, width: number, height: number, radius: number) {
  const r = Math.round(radius);
  if (r <= 0) return new Uint8Array(mask);
  let src = new Float32Array(mask.length);
  for (let i = 0; i < mask.length; i += 1) src[i] = mask[i];
  for (let pass = 0; pass < 3; pass += 1) src = boxBlurPlane(src, width, height, r);
  const out = new Uint8Array(mask.length);
  for (let i = 0; i < out.length; i += 1) out[i] = clamp(Math.round(src[i]), 0, 255);
  return out;
}

function boxBlurPlane(src: Float32Array, width: number, height: number, r: number) {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const win = r * 2 + 1;
  for (let y = 0; y < height; y += 1) {
    let sum = 0;
    const row = y * width;
    for (let k = -r; k <= r; k += 1) sum += src[row + clamp(k, 0, width - 1)];
    for (let x = 0; x < width; x += 1) {
      tmp[row + x] = sum / win;
      sum += src[row + clamp(x + r + 1, 0, width - 1)] - src[row + clamp(x - r, 0, width - 1)];
    }
  }
  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let k = -r; k <= r; k += 1) sum += tmp[clamp(k, 0, height - 1) * width + x];
    for (let y = 0; y < height; y += 1) {
      out[y * width + x] = sum / win;
      sum += tmp[clamp(y + r + 1, 0, height - 1) * width + x] - tmp[clamp(y - r, 0, height - 1) * width + x];
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Object removal / spot repair                                        */
/* ------------------------------------------------------------------ */

/**
 * Fill every masked pixel from the unmasked pixels around it.
 *
 * 1. "Onion-peel": repeatedly fill the outer ring of the hole with a
 *    distance-weighted average of already-known neighbours.
 * 2. A few masked-only smoothing passes remove ring artefacts.
 * 3. The result is cross-faded with the original along the (feathered) mask
 *    edge so there is no hard seam.
 *
 * Alpha is repaired the same way so a hole on a transparent cutout is
 * reconstructed consistently with its surroundings.
 */
export function repairRegion(
  image: Pixels,
  mask: Uint8Array,
  options: { searchRadius?: number; grain?: number } = {},
) {
  const { width, height, data } = image;
  const searchRadius = options.searchRadius ?? 6;
  const grain = options.grain ?? 0;

  // Treat any partially-covered pixel as part of the hole.
  const hole = new Uint8Array(width * height);
  let remaining = 0;
  for (let i = 0; i < hole.length; i += 1) {
    if (mask[i] > 24) {
      hole[i] = 1;
      remaining += 1;
    }
  }
  if (remaining === 0) return 0;
  if (remaining === hole.length) return -1; // nothing to learn from

  const original = new Uint8ClampedArray(data);
  const known = new Uint8Array(hole.length);
  for (let i = 0; i < known.length; i += 1) known[i] = hole[i] ? 0 : 1;

  let guard = 0;
  while (remaining > 0 && guard < 4096) {
    guard += 1;
    const newlyFilled: number[] = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = y * width + x;
        if (known[i]) continue;
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 0;
        let wSum = 0;
        for (let dy = -searchRadius; dy <= searchRadius; dy += 1) {
          const yy = y + dy;
          if (yy < 0 || yy >= height) continue;
          for (let dx = -searchRadius; dx <= searchRadius; dx += 1) {
            const xx = x + dx;
            if (xx < 0 || xx >= width) continue;
            const j = yy * width + xx;
            if (!known[j]) continue;
            const d2 = dx * dx + dy * dy;
            const w = 1 / (1 + d2);
            const o = j * 4;
            r += data[o] * w;
            g += data[o + 1] * w;
            b += data[o + 2] * w;
            a += data[o + 3] * w;
            wSum += w;
          }
        }
        if (wSum > 0) {
          const o = i * 4;
          data[o] = r / wSum;
          data[o + 1] = g / wSum;
          data[o + 2] = b / wSum;
          data[o + 3] = a / wSum;
          newlyFilled.push(i);
        }
      }
    }
    if (newlyFilled.length === 0) {
      // Hole is further than `searchRadius` from any known pixel: undo the
      // partial fill and retry with a wider search window.
      data.set(original);
      return repairRegion(image, mask, { ...options, searchRadius: searchRadius * 2 });
    }
    for (const i of newlyFilled) {
      known[i] = 1;
      remaining -= 1;
    }
  }

  // Smooth the filled area only (Jacobi passes, 4-neighbour average).
  for (let pass = 0; pass < 6; pass += 1) {
    const snap = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const i = y * width + x;
        if (!hole[i]) continue;
        const o = i * 4;
        for (let c = 0; c < 4; c += 1) {
          data[o + c] =
            (snap[o + c] * 2 + snap[o - 4 + c] + snap[o + 4 + c] + snap[o - width * 4 + c] + snap[o + width * 4 + c]) / 6;
        }
      }
    }
  }

  // Optional film grain so a repaired patch does not look unnaturally flat.
  if (grain > 0) {
    let seed = 1234567;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296 - 0.5;
    };
    for (let i = 0; i < hole.length; i += 1) {
      if (!hole[i]) continue;
      const n = rnd() * grain;
      const o = i * 4;
      data[o] = clamp(data[o] + n, 0, 255);
      data[o + 1] = clamp(data[o + 1] + n, 0, 255);
      data[o + 2] = clamp(data[o + 2] + n, 0, 255);
    }
  }

  // Blend with the original using the brush mask's own soft edge, so the
  // repaired patch has no hard seam. Fully-covered pixels are fully replaced.
  let repaired = 0;
  for (let i = 0; i < hole.length; i += 1) {
    if (!hole[i]) continue;
    repaired += 1;
    const m = mask[i];
    if (m >= 255) continue;
    const t = m / 255;
    const o = i * 4;
    for (let c = 0; c < 4; c += 1) data[o + c] = original[o + c] * (1 - t) + data[o + c] * t;
  }
  return repaired;
}

/* ------------------------------------------------------------------ */
/* Clone / heal                                                        */
/* ------------------------------------------------------------------ */

/**
 * Copy pixels from `source` offset by (dx, dy) into the masked area.
 * mode "clone": exact copy, feathered by the mask.
 * mode "heal":  copy, then shift colour so the patch matches the average
 *               colour of the ring around the destination (texture from the
 *               source, tone from the target).
 */
export function cloneFrom(
  image: Pixels,
  reference: Uint8ClampedArray,
  mask: Uint8Array,
  dx: number,
  dy: number,
  mode: "clone" | "heal",
) {
  const { width, height, data } = image;
  let offR = 0;
  let offG = 0;
  let offB = 0;

  if (mode === "heal") {
    // Mean colour of source patch vs. mean colour of ring around destination.
    let sr = 0, sg = 0, sb = 0, sn = 0;
    let tr = 0, tg = 0, tb = 0, tn = 0;
    const grown = dilateMask(mask, width, height, 4);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = y * width + x;
        if (mask[i] > 128) {
          const sx = x + dx;
          const sy = y + dy;
          if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
          const so = (sy * width + sx) * 4;
          sr += reference[so]; sg += reference[so + 1]; sb += reference[so + 2]; sn += 1;
        } else if (grown[i] > 128) {
          const o = i * 4;
          tr += reference[o]; tg += reference[o + 1]; tb += reference[o + 2]; tn += 1;
        }
      }
    }
    if (sn > 0 && tn > 0) {
      offR = tr / tn - sr / sn;
      offG = tg / tn - sg / sn;
      offB = tb / tn - sb / sn;
    }
  }

  let changed = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const m = mask[i];
      if (m === 0) continue;
      const sx = x + dx;
      const sy = y + dy;
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
      const so = (sy * width + sx) * 4;
      const o = i * 4;
      const t = m / 255;
      data[o] = reference[o] * (1 - t) + clamp(reference[so] + offR, 0, 255) * t;
      data[o + 1] = reference[o + 1] * (1 - t) + clamp(reference[so + 1] + offG, 0, 255) * t;
      data[o + 2] = reference[o + 2] * (1 - t) + clamp(reference[so + 2] + offB, 0, 255) * t;
      data[o + 3] = reference[o + 3] * (1 - t) + reference[so + 3] * t;
      changed += 1;
    }
  }
  return changed;
}

/* ------------------------------------------------------------------ */
/* Red-eye                                                             */
/* ------------------------------------------------------------------ */

/**
 * Replace over-saturated red inside the painted area with a dark neutral
 * tone. Only pixels that are *strongly* red relative to green/blue are
 * touched, so brushing a little outside the pupil does not discolour skin.
 */
export function removeRedEye(image: Pixels, mask: Uint8Array) {
  const { data, width, height } = image;
  let changed = 0;
  for (let i = 0; i < width * height; i += 1) {
    const m = mask[i];
    if (m === 0) continue;
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const other = Math.max(g, b);
    if (r < 60 || r < other * 1.6) continue;
    const t = (m / 255) * clamp((r / Math.max(1, other) - 1.6) / 1.2 + 0.6, 0, 1);
    const neutral = Math.min(g, b) * 0.85;
    data[o] = r * (1 - t) + neutral * t;
    data[o + 1] = g * (1 - t) + Math.min(g, neutral + 6) * t;
    data[o + 2] = b * (1 - t) + Math.min(b, neutral + 6) * t;
    changed += 1;
  }
  return changed;
}

/* ------------------------------------------------------------------ */
/* Skin smoothing                                                      */
/* ------------------------------------------------------------------ */

function isSkin(r: number, g: number, b: number) {
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173 && r > 40;
}

/**
 * Edge-preserving smoothing (bilateral filter) restricted to skin-coloured
 * pixels inside the brush. `strength` 0..1 controls how much of the smoothed
 * result is blended in; the default 0.5 is deliberately subtle so the result
 * stays natural. Fine detail is partially kept via `keepDetail`.
 */
export function smoothSkin(
  image: Pixels,
  mask: Uint8Array,
  strength: number,
  options: { radius?: number; keepDetail?: number } = {},
) {
  const { data, width, height } = image;
  const radius = options.radius ?? 3;
  const keepDetail = clamp(options.keepDetail ?? 0.25, 0, 1);
  const src = new Uint8ClampedArray(data);
  const sigmaColor = 24 + strength * 26;
  const inv2c = 1 / (2 * sigmaColor * sigmaColor);
  const inv2s = 1 / (2 * (radius * 0.7) * (radius * 0.7));
  let changed = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const m = mask[i];
      if (m === 0) continue;
      const o = i * 4;
      if (src[o + 3] < 8 || !isSkin(src[o], src[o + 1], src[o + 2])) continue;
      let r = 0, g = 0, b = 0, wSum = 0;
      for (let dy = -radius; dy <= radius; dy += 1) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -radius; dx <= radius; dx += 1) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          const so = (yy * width + xx) * 4;
          if (src[so + 3] < 8) continue;
          const dr = src[so] - src[o];
          const dg = src[so + 1] - src[o + 1];
          const db = src[so + 2] - src[o + 2];
          const w = Math.exp(-(dx * dx + dy * dy) * inv2s - (dr * dr + dg * dg + db * db) * inv2c);
          r += src[so] * w; g += src[so + 1] * w; b += src[so + 2] * w; wSum += w;
        }
      }
      if (wSum <= 0) continue;
      const t = clamp(strength, 0, 1) * (m / 255);
      const k = 1 - keepDetail * 0.5;
      const sr = r / wSum;
      const sg = g / wSum;
      const sb = b / wSum;
      data[o] = src[o] * (1 - t * k) + sr * t * k;
      data[o + 1] = src[o + 1] * (1 - t * k) + sg * t * k;
      data[o + 2] = src[o + 2] * (1 - t * k) + sb * t * k;
      changed += 1;
    }
  }
  return changed;
}

/* ------------------------------------------------------------------ */
/* Privacy: blur / pixelate                                            */
/* ------------------------------------------------------------------ */

/** Gaussian-like blur of the masked area. `amount` is blur radius in px. */
export function blurRegion(image: Pixels, mask: Uint8Array, amount: number) {
  const { data, width, height } = image;
  const r = Math.max(1, Math.round(amount));
  const planes = [0, 1, 2].map((c) => {
    let p = new Float32Array(width * height);
    for (let i = 0; i < p.length; i += 1) p[i] = data[i * 4 + c];
    for (let pass = 0; pass < 3; pass += 1) p = boxBlurPlane(p, width, height, r);
    return p;
  });
  let changed = 0;
  for (let i = 0; i < width * height; i += 1) {
    const m = mask[i];
    if (m === 0) continue;
    const t = m / 255;
    const o = i * 4;
    for (let c = 0; c < 3; c += 1) data[o + c] = data[o + c] * (1 - t) + planes[c][i] * t;
    changed += 1;
  }
  return changed;
}

/** Replace the masked area with coarse blocks of `blockSize` pixels. */
export function pixelateRegion(image: Pixels, mask: Uint8Array, blockSize: number) {
  const { data, width, height } = image;
  const bs = Math.max(2, Math.round(blockSize));
  const src = new Uint8ClampedArray(data);
  let changed = 0;
  for (let by = 0; by < height; by += bs) {
    for (let bx = 0; bx < width; bx += bs) {
      let r = 0, g = 0, b = 0, a = 0, n = 0, covered = 0;
      const ex = Math.min(width, bx + bs);
      const ey = Math.min(height, by + bs);
      for (let y = by; y < ey; y += 1) {
        for (let x = bx; x < ex; x += 1) {
          const o = (y * width + x) * 4;
          r += src[o]; g += src[o + 1]; b += src[o + 2]; a += src[o + 3]; n += 1;
          if (mask[y * width + x] > 0) covered += 1;
        }
      }
      if (covered === 0 || n === 0) continue;
      r /= n; g /= n; b /= n; a /= n;
      for (let y = by; y < ey; y += 1) {
        for (let x = bx; x < ex; x += 1) {
          const m = mask[y * width + x];
          if (m === 0) continue;
          const t = m / 255;
          const o = (y * width + x) * 4;
          data[o] = src[o] * (1 - t) + r * t;
          data[o + 1] = src[o + 1] * (1 - t) + g * t;
          data[o + 2] = src[o + 2] * (1 - t) + b * t;
          data[o + 3] = src[o + 3] * (1 - t) + a * t;
          changed += 1;
        }
      }
    }
  }
  return changed;
}

/* ------------------------------------------------------------------ */
/* CSS-filter fallback for browsers without CanvasRenderingContext2D.filter */
/* ------------------------------------------------------------------ */

export type CssFilterValues = {
  brightness: number; // -100..100  (CSS brightness(100 + value %))
  contrast: number;   // -100..100
  saturation: number; // -100..100
  hue: number;        // degrees
  sepia: number;      // 0..100
  grayscale: number;  // 0..100
};

export function isNeutralCssFilter(v: CssFilterValues) {
  return v.brightness === 0 && v.contrast === 0 && v.saturation === 0 && v.hue === 0 && v.sepia === 0 && v.grayscale === 0;
}

/** True when this browser honours `ctx.filter` (Chrome, Edge, Firefox; Safari < 18 does not). */
export function supportsCanvasFilter(ctx: CanvasRenderingContext2D) {
  return "filter" in ctx;
}

/**
 * Applies the same chain the browser would for
 * `brightness() contrast() saturate() hue-rotate() sepia() grayscale()`
 * using the matrices from the CSS Filter Effects specification, so photos
 * exported from browsers without `ctx.filter` match the on-screen preview.
 * Alpha is never modified.
 */
export function applyCssFilterPixels(image: Pixels, v: CssFilterValues) {
  const { data } = image;
  const br = Math.max(0, 1 + v.brightness / 100);
  const co = Math.max(0, 1 + v.contrast / 100);
  const sa = Math.max(0, 1 + v.saturation / 100);
  const hueRad = (v.hue * Math.PI) / 180;
  const se = clamp(v.sepia / 100, 0, 1);
  const gr = clamp(v.grayscale / 100, 0, 1);

  const cos = Math.cos(hueRad);
  const sin = Math.sin(hueRad);
  const hm = [
    0.213 + cos * 0.787 - sin * 0.213, 0.715 - cos * 0.715 - sin * 0.715, 0.072 - cos * 0.072 + sin * 0.928,
    0.213 - cos * 0.213 + sin * 0.143, 0.715 + cos * 0.285 + sin * 0.140, 0.072 - cos * 0.072 - sin * 0.283,
    0.213 - cos * 0.213 - sin * 0.787, 0.715 - cos * 0.715 + sin * 0.715, 0.072 + cos * 0.928 + sin * 0.072,
  ];
  const sm = [
    0.213 + 0.787 * sa, 0.715 - 0.715 * sa, 0.072 - 0.072 * sa,
    0.213 - 0.213 * sa, 0.715 + 0.285 * sa, 0.072 - 0.072 * sa,
    0.213 - 0.213 * sa, 0.715 - 0.715 * sa, 0.072 + 0.928 * sa,
  ];
  const sp = 1 - se;
  const sepiaM = [
    0.393 + 0.607 * sp, 0.769 - 0.769 * sp, 0.189 - 0.189 * sp,
    0.349 - 0.349 * sp, 0.686 + 0.314 * sp, 0.168 - 0.168 * sp,
    0.272 - 0.272 * sp, 0.534 - 0.534 * sp, 0.131 + 0.869 * sp,
  ];
  const gp = 1 - gr;
  const grayM = [
    0.2126 + 0.7874 * gp, 0.7152 - 0.7152 * gp, 0.0722 - 0.0722 * gp,
    0.2126 - 0.2126 * gp, 0.7152 + 0.2848 * gp, 0.0722 - 0.0722 * gp,
    0.2126 - 0.2126 * gp, 0.7152 - 0.7152 * gp, 0.0722 + 0.9278 * gp,
  ];

  const mul = (m: number[], r: number, g: number, b: number): [number, number, number] => [
    m[0] * r + m[1] * g + m[2] * b,
    m[3] * r + m[4] * g + m[5] * b,
    m[6] * r + m[7] * g + m[8] * b,
  ];
  const c01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;
    // brightness, then contrast (each clamped like the browser does between steps)
    r = c01(r * br); g = c01(g * br); b = c01(b * br);
    r = c01((r - 0.5) * co + 0.5); g = c01((g - 0.5) * co + 0.5); b = c01((b - 0.5) * co + 0.5);
    [r, g, b] = mul(sm, r, g, b); r = c01(r); g = c01(g); b = c01(b);
    [r, g, b] = mul(hm, r, g, b); r = c01(r); g = c01(g); b = c01(b);
    [r, g, b] = mul(sepiaM, r, g, b); r = c01(r); g = c01(g); b = c01(b);
    [r, g, b] = mul(grayM, r, g, b); r = c01(r); g = c01(g); b = c01(b);
    data[i] = Math.round(r * 255);
    data[i + 1] = Math.round(g * 255);
    data[i + 2] = Math.round(b * 255);
  }
}
