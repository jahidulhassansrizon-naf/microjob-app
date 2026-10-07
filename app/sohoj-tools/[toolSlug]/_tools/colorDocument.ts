// Color Document: 100% client-side replacement for the old
// POST /api/color-document call. It keeps the colours of the page but
// evens out the light: shadows and colour casts are removed, the paper turns
// white, and colours / contrast are made a bit stronger.

import {
  buildBackgroundLayer,
  createContext2d,
  isFilterAbort,
  throwIfAborted,
  yieldToBrowser,
} from "./imageFilters";

export type ColorDocumentOptions = {
  signal?: AbortSignal;
};

export const isColorAbort = isFilterAbort;

const BLACK_POINT = 16;
const WHITE_POINT = 236;
const SATURATION_BOOST = 1.28;
// Mild S-curve strength (0 = none).
const CONTRAST_STRENGTH = 0.35;
const MIN_BACKGROUND_SHARE = 0.45;
const ROWS_PER_CHUNK = 192;

function buildToneTable(): Uint8Array {
  const table = new Uint8Array(256);
  for (let v = 0; v < 256; v++) {
    const t = Math.min(
      1,
      Math.max(0, (v - BLACK_POINT) / (WHITE_POINT - BLACK_POINT)),
    );
    const smooth = t * t * (3 - 2 * t);
    table[v] = Math.round(
      255 * ((1 - CONTRAST_STRENGTH) * t + CONTRAST_STRENGTH * smooth),
    );
  }
  return table;
}

export async function colorDocumentCanvas(
  input: HTMLCanvasElement,
  options: ColorDocumentOptions = {},
): Promise<HTMLCanvasElement> {
  const { signal } = options;
  const width = input.width;
  const height = input.height;
  if (!width || !height) throw new Error("Empty canvas");

  throwIfAborted(signal);

  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  const ctx = createContext2d(output);
  ctx.drawImage(input, 0, 0);
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;

  const background = await buildBackgroundLayer(input, { signal });
  const bg = background.data;
  const floorR = background.paper[0] * MIN_BACKGROUND_SHARE;
  const floorG = background.paper[1] * MIN_BACKGROUND_SHARE;
  const floorB = background.paper[2] * MIN_BACKGROUND_SHARE;
  const tone = buildToneTable();

  for (let startRow = 0; startRow < height; startRow += ROWS_PER_CHUNK) {
    throwIfAborted(signal);
    const endRow = Math.min(height, startRow + ROWS_PER_CHUNK);
    for (let y = startRow; y < endRow; y++) {
      let p = y * width * 4;
      for (let x = 0; x < width; x++, p += 4) {
        // 1) remove shadows / colour cast
        const nr = Math.min(255, (data[p] * 255) / Math.max(bg[p], floorR));
        const ng = Math.min(
          255,
          (data[p + 1] * 255) / Math.max(bg[p + 1], floorG),
        );
        const nb = Math.min(
          255,
          (data[p + 2] * 255) / Math.max(bg[p + 2], floorB),
        );

        // 2) levels + gentle contrast curve
        const r = tone[nr | 0];
        const g = tone[ng | 0];
        const b = tone[nb | 0];

        // 3) stronger colours
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        let outR = lum + (r - lum) * SATURATION_BOOST;
        let outG = lum + (g - lum) * SATURATION_BOOST;
        let outB = lum + (b - lum) * SATURATION_BOOST;

        // Paper stays pure white.
        if (r >= 244 && g >= 244 && b >= 244) {
          outR = 255;
          outG = 255;
          outB = 255;
        }

        data[p] = outR < 0 ? 0 : outR > 255 ? 255 : outR;
        data[p + 1] = outG < 0 ? 0 : outG > 255 ? 255 : outG;
        data[p + 2] = outB < 0 ? 0 : outB > 255 ? 255 : outB;
        data[p + 3] = 255;
      }
    }
    await yieldToBrowser();
  }

  throwIfAborted(signal);
  ctx.putImageData(image, 0, 0);
  return output;
}
