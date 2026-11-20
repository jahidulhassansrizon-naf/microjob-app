// Shared client-side image helpers used by documentClean.ts and
// colorDocument.ts. Everything here runs in the browser (Canvas + typed
// arrays). Nothing is sent to a server.

export const FILTER_ABORT_NAME = "ImageFilterAbortError";

export function createFilterAbortError(): Error {
  const error = new Error("Image filter aborted");
  error.name = FILTER_ABORT_NAME;
  return error;
}

export function isFilterAbort(error: unknown): boolean {
  return error instanceof Error && error.name === FILTER_ABORT_NAME;
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw createFilterAbortError();
}

// Lets the browser paint (spinner, cancel button) between heavy chunks.
export const yieldToBrowser = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

export function createContext2d(
  canvas: HTMLCanvasElement,
): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas context unavailable");
  return ctx;
}

/** Separable box blur on a single 8-bit channel (edge pixels are clamped). */
export function boxBlurU8(
  src: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): Uint8Array {
  const r = Math.max(0, Math.floor(radius));
  const size = r * 2 + 1;
  const tmp = new Uint8Array(src.length);
  const out = new Uint8Array(src.length);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;
    for (let x = -r; x <= r; x++) {
      sum += src[row + Math.min(width - 1, Math.max(0, x))];
    }
    for (let x = 0; x < width; x++) {
      tmp[row + x] = (sum / size + 0.5) | 0;
      sum +=
        src[row + Math.min(width - 1, x + r + 1)] -
        src[row + Math.max(0, x - r)];
    }
  }

  // Vertical pass (row by row, keeps memory access cache friendly)
  const colSum = new Int32Array(width);
  for (let y = -r; y <= r; y++) {
    const row = Math.min(height - 1, Math.max(0, y)) * width;
    for (let x = 0; x < width; x++) colSum[x] += tmp[row + x];
  }
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) out[row + x] = (colSum[x] / size + 0.5) | 0;
    const add = Math.min(height - 1, y + r + 1) * width;
    const sub = Math.max(0, y - r) * width;
    for (let x = 0; x < width; x++) colSum[x] += tmp[add + x] - tmp[sub + x];
  }

  return out;
}

/** Separable max filter (grey dilation) on a single 8-bit channel. */
function maxFilterU8(
  src: Uint8Array,
  width: number,
  height: number,
  radius: number,
): Uint8Array {
  const tmp = new Uint8Array(src.length);
  const out = new Uint8Array(src.length);

  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const from = Math.max(0, x - radius);
      const to = Math.min(width - 1, x + radius);
      let max = 0;
      for (let k = from; k <= to; k++) {
        const v = src[row + k];
        if (v > max) max = v;
      }
      tmp[row + x] = max;
    }
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const from = Math.max(0, y - radius);
      const to = Math.min(height - 1, y + radius);
      let max = 0;
      for (let k = from; k <= to; k++) {
        const v = tmp[k * width + x];
        if (v > max) max = v;
      }
      out[y * width + x] = max;
    }
  }

  return out;
}

function percentileU8(values: Uint8Array, percentile: number): number {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < values.length; i++) histogram[values[i]]++;
  const target = values.length * percentile;
  let seen = 0;
  for (let v = 0; v < 256; v++) {
    seen += histogram[v];
    if (seen >= target) return v;
  }
  return 255;
}

export type BackgroundLayer = {
  /** RGBA, same size as the source: the estimated "blank paper" colour. */
  data: Uint8ClampedArray;
  /** Typical paper level per channel (R, G, B). */
  paper: [number, number, number];
};

/**
 * Estimates the colour/brightness of the blank paper under the text, including
 * shadows, uneven light and colour casts. Works on a small copy (fast):
 * grey dilation removes the text, a blur smooths the result, and the canvas
 * scales it back to full size.
 */
export async function buildBackgroundLayer(
  source: HTMLCanvasElement,
  options: {
    signal?: AbortSignal;
    maxSide?: number;
    dilateRadius?: number;
  } = {},
): Promise<BackgroundLayer> {
  const { signal, maxSide = 560, dilateRadius = 12 } = options;
  const width = source.width;
  const height = source.height;

  const scale = Math.min(1, maxSide / Math.max(width, height));
  const sw = Math.max(1, Math.round(width * scale));
  const sh = Math.max(1, Math.round(height * scale));

  const small = document.createElement("canvas");
  small.width = sw;
  small.height = sh;
  const smallCtx = createContext2d(small);
  smallCtx.imageSmoothingEnabled = true;
  smallCtx.imageSmoothingQuality = "high";
  smallCtx.drawImage(source, 0, 0, sw, sh);
  const smallData = smallCtx.getImageData(0, 0, sw, sh);

  const channels: Uint8Array[] = [];
  for (let c = 0; c < 3; c++) {
    const ch = new Uint8Array(sw * sh);
    for (let i = 0, p = c; i < ch.length; i++, p += 4)
      ch[i] = smallData.data[p];
    channels.push(ch);
  }

  const filtered: Uint8Array[] = [];
  for (let c = 0; c < 3; c++) {
    throwIfAborted(signal);
    const dilated = maxFilterU8(channels[c], sw, sh, dilateRadius);
    const blurred = boxBlurU8(
      boxBlurU8(dilated, sw, sh, Math.max(2, Math.round(dilateRadius * 0.8))),
      sw,
      sh,
      Math.max(2, Math.round(dilateRadius * 0.8)),
    );
    filtered.push(blurred);
    await yieldToBrowser();
  }

  const paper: [number, number, number] = [
    Math.max(1, percentileU8(filtered[0], 0.9)),
    Math.max(1, percentileU8(filtered[1], 0.9)),
    Math.max(1, percentileU8(filtered[2], 0.9)),
  ];

  const layer = smallCtx.createImageData(sw, sh);
  for (let i = 0, p = 0; i < sw * sh; i++, p += 4) {
    layer.data[p] = filtered[0][i];
    layer.data[p + 1] = filtered[1][i];
    layer.data[p + 2] = filtered[2][i];
    layer.data[p + 3] = 255;
  }
  smallCtx.putImageData(layer, 0, 0);

  throwIfAborted(signal);

  const full = document.createElement("canvas");
  full.width = width;
  full.height = height;
  const fullCtx = createContext2d(full);
  fullCtx.imageSmoothingEnabled = true;
  fullCtx.imageSmoothingQuality = "high";
  fullCtx.drawImage(small, 0, 0, width, height);

  return { data: fullCtx.getImageData(0, 0, width, height).data, paper };
}
