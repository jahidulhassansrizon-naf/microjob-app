/*
 * Cleans the soft alpha mask returned by the background-removal model so that
 * no faint "ghost" of the old background is left behind the cut-out.
 *
 * Pure TypeScript, no dependencies, runs on a plain alpha plane.
 *
 *  1. Tone curve: very low alpha (haze, shadows the model was unsure about)
 *     becomes fully transparent, high alpha becomes fully opaque, and only a
 *     narrow band in between stays soft so edges and hair keep a smooth fade.
 *  2. Speck removal: separate floating pieces that are tiny compared with the
 *     main subject (leftover background blobs) are deleted.
 *  3. Edge choke: pulls the edge in by about half a mask pixel so the thin
 *     halo of old background colour on the border disappears.
 */

export interface MaskRefineOptions {
  /** Alpha (0-255) at or below which a pixel becomes fully transparent. */
  low?: number;
  /** Alpha (0-255) at or above which a pixel becomes fully opaque. */
  high?: number;
  /** Components smaller than this fraction of the largest one are removed. */
  minComponentRatio?: number;
  /** 0 = off, 1 = full 3x3 erosion of the soft edge. */
  choke?: number;
}

const DEFAULTS: Required<MaskRefineOptions> = {
  low: 36,
  high: 220,
  minComponentRatio: 0.02,
  choke: 0.5,
};

export function refineAlpha(
  source: ArrayLike<number>,
  width: number,
  height: number,
  options: MaskRefineOptions = {},
): Uint8ClampedArray {
  const { low, high, minComponentRatio, choke } = { ...DEFAULTS, ...options };
  const total = width * height;
  const alpha = new Uint8ClampedArray(total);

  /* 1. Tone curve */
  const span = Math.max(1, high - low);

  for (let index = 0; index < total; index += 1) {
    const value = source[index];

    if (value <= low) {
      alpha[index] = 0;
    } else if (value >= high) {
      alpha[index] = 255;
    } else {
      const t = (value - low) / span;

      alpha[index] = Math.round(t * t * (3 - 2 * t) * 255);
    }
  }

  /* 2. Remove small disconnected pieces (4-connected components) */
  const label = new Int32Array(total);
  const stack = new Int32Array(total);
  const areas: number[] = [0];
  let componentCount = 0;

  for (let start = 0; start < total; start += 1) {
    if (alpha[start] === 0 || label[start] !== 0) continue;

    componentCount += 1;
    let area = 0;
    let top = 0;

    stack[top++] = start;
    label[start] = componentCount;

    while (top > 0) {
      const current = stack[--top];
      const x = current % width;
      const y = (current - x) / width;

      area += 1;

      if (x > 0) {
        const n = current - 1;

        if (alpha[n] !== 0 && label[n] === 0) {
          label[n] = componentCount;
          stack[top++] = n;
        }
      }

      if (x < width - 1) {
        const n = current + 1;

        if (alpha[n] !== 0 && label[n] === 0) {
          label[n] = componentCount;
          stack[top++] = n;
        }
      }

      if (y > 0) {
        const n = current - width;

        if (alpha[n] !== 0 && label[n] === 0) {
          label[n] = componentCount;
          stack[top++] = n;
        }
      }

      if (y < height - 1) {
        const n = current + width;

        if (alpha[n] !== 0 && label[n] === 0) {
          label[n] = componentCount;
          stack[top++] = n;
        }
      }
    }

    areas.push(area);
  }

  if (componentCount > 1) {
    const largest = Math.max(...areas);
    const minArea = Math.max(4, largest * minComponentRatio);

    for (let index = 0; index < total; index += 1) {
      const id = label[index];

      if (id !== 0 && areas[id] < minArea) alpha[index] = 0;
    }
  }

  /* 3. Edge choke */
  if (choke > 0) {
    const out = new Uint8ClampedArray(alpha);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;
        const value = alpha[index];

        if (value === 0) continue;

        let min = value;

        for (let dy = -1; dy <= 1; dy += 1) {
          const ny = y + dy;

          if (ny < 0 || ny >= height) continue;

          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx;

            if (nx < 0 || nx >= width) continue;

            const neighbour = alpha[ny * width + nx];

            if (neighbour < min) min = neighbour;
          }
        }

        if (min < value) out[index] = Math.round(value - (value - min) * choke);
      }
    }

    return out;
  }

  return alpha;
}
