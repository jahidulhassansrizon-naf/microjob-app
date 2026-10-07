/*
 * Client-side "Document Clean".
 *
 * Replaces the old Python endpoint (/api/clean-document), which ran out of
 * memory on high-resolution pages. Everything happens in the browser and the
 * heavy part (background estimation) runs on a small copy of the page, so
 * memory use stays low.
 *
 * Steps
 *   1. Estimate the paper background / shadows on a downscaled copy:
 *      grey "closing" (dilate + erode: removes dark text strokes but keeps
 *      the edge of a shadow sharp) + smoothing, per channel.
 *   2. Divide the page by that background (flat-field correction). Paper
 *      becomes uniformly bright, shadows and uneven lighting disappear.
 *   3. Sharpen the BRIGHTNESS only (unsharp mask on luminance), so no colour
 *      fringes appear around the letters.
 *   4. Contrast curve on the brightness: everything that is paper-like snaps
 *      to pure white (#FFFFFF, all three channels), ink gets dark and bold.
 *      Colour is only kept on real ink (blue pen, red stamp) and fades to
 *      zero near the paper, so no yellow / red tint or blotches survive.
 *
 * The output has exactly the same pixel size as the input, so the
 * "Normal" comparison twin and the crop / rotation chain stay aligned.
 */

export type CleanDocumentOptions = {
  signal?: AbortSignal;
};

/* Longest side of the copy used to estimate the background. */
const BACKGROUND_SIDE = 800;

/*
 * Brightness (0..1, after shadow removal) at or above which a pixel becomes
 * pure white. Lower = more aggressive white paper, higher = keeps more of the
 * light grey. 0.86 also swallows faint tint, JPEG noise and soft shadows.
 */
const WHITE_POINT = 0.86;

/* > 1 darkens mid-tones, which makes text look bolder and darker. */
const TEXT_GAMMA = 1.5;

/* Strength of the sharpening of the letters. */
const SHARPEN_AMOUNT = 1.0;

/*
 * The paper estimate may never be darker than this share of the real paper
 * level, so big dark logos / photos are not erased as "shadow".
 */
const MIN_BACKGROUND_SHARE = 0.45;

/* How much colour real ink keeps (0 = pure black & white, 1 = full colour). */
const INK_COLOR_KEEP = 0.55;

const ROWS_PER_CHUNK = 192;

class CleanAbortError extends Error {
  constructor() {
    super("Document clean was cancelled.");
    this.name = "AbortError";
  }
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new CleanAbortError();
}

/** Lets the browser paint (spinner) between heavy steps. */
function nextTick() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  return canvas;
}

function get2d(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  return ctx;
}

/** Separable grey dilation (max) or erosion (min) with a square window. */
function morph(
  plane: Uint8Array,
  width: number,
  height: number,
  radius: number,
  mode: "max" | "min",
) {
  const isMax = mode === "max";
  const horizontal = new Uint8Array(plane.length);

  for (let y = 0; y < height; y += 1) {
    const row = y * width;

    for (let x = 0; x < width; x += 1) {
      const from = x - radius < 0 ? 0 : x - radius;
      const to = x + radius >= width ? width - 1 : x + radius;

      let best = isMax ? 0 : 255;

      for (let k = from; k <= to; k += 1) {
        const value = plane[row + k];
        if (isMax ? value > best : value < best) best = value;
      }

      horizontal[row + x] = best;
    }
  }

  const out = new Uint8Array(plane.length);

  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      const from = y - radius < 0 ? 0 : y - radius;
      const to = y + radius >= height ? height - 1 : y + radius;

      let best = isMax ? 0 : 255;

      for (let k = from; k <= to; k += 1) {
        const value = horizontal[k * width + x];
        if (isMax ? value > best : value < best) best = value;
      }

      out[y * width + x] = best;
    }
  }

  return out;
}

/** Box blur (prefix sums), applied `passes` times ≈ gaussian. */
function boxBlur(
  plane: Float32Array,
  width: number,
  height: number,
  radius: number,
  passes: number,
) {
  let current = plane;

  const prefix = new Float64Array(Math.max(width, height) + 1);

  const axis = (
    source: Float32Array,
    target: Float32Array,
    lines: number,
    length: number,
    lineStep: number,
    step: number,
  ) => {
    for (let line = 0; line < lines; line += 1) {
      const base = line * lineStep;

      prefix[0] = 0;

      for (let i = 0; i < length; i += 1) {
        prefix[i + 1] = prefix[i] + source[base + i * step];
      }

      for (let i = 0; i < length; i += 1) {
        const low = i - radius < 0 ? 0 : i - radius;
        const high = i + radius >= length ? length - 1 : i + radius;

        target[base + i * step] =
          (prefix[high + 1] - prefix[low]) / (high - low + 1);
      }
    }
  };

  for (let pass = 0; pass < passes; pass += 1) {
    const horizontal = new Float32Array(current.length);
    const vertical = new Float32Array(current.length);

    axis(current, horizontal, height, width, width, 1);
    axis(horizontal, vertical, width, height, 1, width);

    current = vertical;
  }

  return current;
}

/** Percentile (0..1) of an 8-bit plane. */
function percentile(plane: Uint8Array, share: number) {
  const histogram = new Uint32Array(256);

  for (let i = 0; i < plane.length; i += 1) histogram[plane[i]] += 1;

  const target = plane.length * share;

  let seen = 0;

  for (let level = 0; level < 256; level += 1) {
    seen += histogram[level];
    if (seen >= target) return level;
  }

  return 255;
}

/**
 * Smooth RGBA canvas (same aspect as the page) holding the paper colour,
 * plus the typical paper level of every channel.
 */
function estimateBackground(source: HTMLCanvasElement) {
  const scale = Math.min(
    1,
    BACKGROUND_SIDE / Math.max(source.width, source.height),
  );

  const smallWidth = Math.max(1, Math.round(source.width * scale));
  const smallHeight = Math.max(1, Math.round(source.height * scale));

  const small = createCanvas(smallWidth, smallHeight);
  const smallCtx = get2d(small);

  smallCtx.drawImage(source, 0, 0, smallWidth, smallHeight);

  const pixels = smallCtx.getImageData(0, 0, smallWidth, smallHeight);

  const count = smallWidth * smallHeight;
  const longest = Math.max(smallWidth, smallHeight);

  // Window must be wider than any text stroke, but small enough to follow
  // real shadows.
  const closeRadius = Math.max(4, Math.round(longest * 0.014));
  const blurRadius = Math.max(3, Math.round(longest * 0.012));

  const paper: [number, number, number] = [255, 255, 255];

  for (let channel = 0; channel < 3; channel += 1) {
    const plane = new Uint8Array(count);

    for (let i = 0; i < count; i += 1) {
      plane[i] = pixels.data[i * 4 + channel];
    }

    // Closing = dilate then erode: text disappears, but the border of a
    // shadow stays where it really is (no dark / bright bands next to it).
    const grown = morph(plane, smallWidth, smallHeight, closeRadius, "max");
    const closed = morph(grown, smallWidth, smallHeight, closeRadius, "min");

    const asFloat = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      asFloat[i] = closed[i];
    }

    const smooth = boxBlur(asFloat, smallWidth, smallHeight, blurRadius, 2);

    const rounded = new Uint8Array(count);

    for (let i = 0; i < count; i += 1) {
      const value = Math.round(smooth[i]);

      rounded[i] = value;
      pixels.data[i * 4 + channel] = value;
    }

    paper[channel] = Math.max(1, percentile(rounded, 0.9));
  }

  for (let i = 0; i < count; i += 1) {
    pixels.data[i * 4 + 3] = 255;
  }

  smallCtx.putImageData(pixels, 0, 0);

  const full = createCanvas(source.width, source.height);

  get2d(full).drawImage(small, 0, 0, source.width, source.height);

  small.width = 0;
  small.height = 0;

  return { canvas: full, paper };
}

/** Separable box blur on one 8-bit plane (used for the unsharp mask). */
function blurPlane(
  src: Uint8Array,
  width: number,
  height: number,
  radius: number,
) {
  const size = radius * 2 + 1;
  const tmp = new Uint8Array(src.length);
  const out = new Uint8Array(src.length);

  for (let y = 0; y < height; y += 1) {
    const row = y * width;

    let sum = 0;

    for (let x = -radius; x <= radius; x += 1) {
      sum += src[row + Math.min(width - 1, Math.max(0, x))];
    }

    for (let x = 0; x < width; x += 1) {
      tmp[row + x] = (sum / size + 0.5) | 0;

      sum +=
        src[row + Math.min(width - 1, x + radius + 1)] -
        src[row + Math.max(0, x - radius)];
    }
  }

  const columnSum = new Int32Array(width);

  for (let y = -radius; y <= radius; y += 1) {
    const row = Math.min(height - 1, Math.max(0, y)) * width;

    for (let x = 0; x < width; x += 1) columnSum[x] += tmp[row + x];
  }

  for (let y = 0; y < height; y += 1) {
    const row = y * width;

    for (let x = 0; x < width; x += 1) {
      out[row + x] = (columnSum[x] / size + 0.5) | 0;
    }

    const add = Math.min(height - 1, y + radius + 1) * width;
    const sub = Math.max(0, y - radius) * width;

    for (let x = 0; x < width; x += 1) {
      columnSum[x] += tmp[add + x] - tmp[sub + x];
    }
  }

  return out;
}

/**
 * Returns a NEW canvas with the same size as `input`. The input canvas is
 * not modified.
 */
export async function cleanDocumentCanvas(
  input: HTMLCanvasElement,
  options: CleanDocumentOptions = {},
): Promise<HTMLCanvasElement> {
  const { signal } = options;

  const width = input.width;
  const height = input.height;

  if (!width || !height) throw new Error("Invalid image dimensions");

  /* ---- 1. paper background / shadow map (small, cheap) ------------ */
  const estimate = estimateBackground(input);

  const background = get2d(estimate.canvas).getImageData(0, 0, width, height);

  estimate.canvas.width = 0;
  estimate.canvas.height = 0;

  throwIfAborted(signal);
  await nextTick();

  // Never divide by something much darker than the real paper.
  const floorR = Math.max(16, estimate.paper[0] * MIN_BACKGROUND_SHARE);
  const floorG = Math.max(16, estimate.paper[1] * MIN_BACKGROUND_SHARE);
  const floorB = Math.max(16, estimate.paper[2] * MIN_BACKGROUND_SHARE);

  /* ---- 2. flat-field correction ----------------------------------- */
  const output = createCanvas(width, height);
  const outputCtx = get2d(output);

  outputCtx.drawImage(input, 0, 0);

  const image = outputCtx.getImageData(0, 0, width, height);
  const data = image.data;
  const bg = background.data;

  // Brightness of every pixel after shadow removal.
  const luma = new Uint8Array(width * height);

  for (let startRow = 0; startRow < height; startRow += ROWS_PER_CHUNK) {
    throwIfAborted(signal);

    const endRow = Math.min(height, startRow + ROWS_PER_CHUNK);

    for (let y = startRow; y < endRow; y += 1) {
      let i = y * width * 4;
      let p = y * width;

      for (let x = 0; x < width; x += 1, i += 4, p += 1) {
        const paperR = bg[i] < floorR ? floorR : bg[i];
        const paperG = bg[i + 1] < floorG ? floorG : bg[i + 1];
        const paperB = bg[i + 2] < floorB ? floorB : bg[i + 2];

        const r = (data[i] * 255) / paperR;
        const g = (data[i + 1] * 255) / paperG;
        const b = (data[i + 2] * 255) / paperB;

        const nr = r > 255 ? 255 : r;
        const ng = g > 255 ? 255 : g;
        const nb = b > 255 ? 255 : b;

        data[i] = nr;
        data[i + 1] = ng;
        data[i + 2] = nb;

        luma[p] = (0.299 * nr + 0.587 * ng + 0.114 * nb) | 0;
      }
    }

    await nextTick();
  }

  /* ---- 3. unsharp mask on the brightness only ---------------------- */
  const blurRadius = Math.max(1, Math.round(Math.max(width, height) / 1400));
  const blurred = blurPlane(luma, width, height, blurRadius);

  throwIfAborted(signal);
  await nextTick();

  /* ---- 4. contrast curve: pure white paper, dark bold ink ---------- */
  // Darkest ink level (1st percentile) decides where "black" starts.
  // Never stretch more than a third of the range: keeps faint pencil and
  // stamps from turning black.
  const low = Math.min(percentile(luma, 0.01) / 255, 0.35);

  const lutLevel = new Uint8Array(256);
  const lutKeep = new Float32Array(256);

  for (let value = 0; value < 256; value += 1) {
    const t = Math.min(
      1,
      Math.max(0, (value / 255 - low) / (WHITE_POINT - low)),
    );

    const smooth = t * t * (3 - 2 * t);
    const curved = Math.pow(0.4 * t + 0.6 * smooth, TEXT_GAMMA);

    lutLevel[value] = t >= 1 ? 255 : Math.round(curved * 255);

    // Colour only on real ink; it fades out completely towards the paper.
    lutKeep[value] = INK_COLOR_KEEP * (1 - t) * (1 - t);
  }

  for (let startRow = 0; startRow < height; startRow += ROWS_PER_CHUNK) {
    throwIfAborted(signal);

    const endRow = Math.min(height, startRow + ROWS_PER_CHUNK);

    for (let y = startRow; y < endRow; y += 1) {
      let i = y * width * 4;
      let p = y * width;

      for (let x = 0; x < width; x += 1, i += 4, p += 1) {
        const original = luma[p];

        let sharp = original + SHARPEN_AMOUNT * (original - blurred[p]);

        sharp = sharp < 0 ? 0 : sharp > 255 ? 255 : sharp;

        const index = sharp | 0;
        const level = lutLevel[index];

        if (level === 255) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else {
          const keep = lutKeep[index];

          const r = level + (data[i] - original) * keep;
          const g = level + (data[i + 1] - original) * keep;
          const b = level + (data[i + 2] - original) * keep;

          data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
          data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
          data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
        }

        data[i + 3] = 255;
      }
    }

    await nextTick();
  }

  throwIfAborted(signal);

  outputCtx.putImageData(image, 0, 0);

  return output;
}

export function isCleanAbort(error: unknown) {
  return error instanceof CleanAbortError;
}
