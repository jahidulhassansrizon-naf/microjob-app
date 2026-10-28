/*
 * Pure pixel helpers used by upscale.worker.ts (kept dependency-free so they
 * can be unit-tested in Node).
 *
 * Why this exists: the upscaler model is a x4 model but the editor only
 * keeps a x2 result. Previously the worker returned the full x4 float tile
 * (~5 MB per tile) and the UI thread converted + downscaled it. Now the
 * worker does the float -> byte conversion AND the 2x2 averaging itself, so
 * only a small RGBA tile crosses the thread boundary and the UI thread just
 * paints it.
 */

/** RGBA bytes -> planar float32 [R plane, G plane, B plane] in 0..1. */
export function rgbaToPlanar(
  rgba: ArrayLike<number>,
  width: number,
  height: number,
): Float32Array {
  const plane = width * height;
  const out = new Float32Array(3 * plane);
  const inv = 1 / 255;

  for (let i = 0; i < plane; i += 1) {
    const index = i * 4;

    out[i] = rgba[index] * inv;
    out[plane + i] = rgba[index + 1] * inv;
    out[2 * plane + i] = rgba[index + 2] * inv;
  }

  return out;
}

const toByte = (value: number) => {
  const rounded = Math.round(value * 255);

  return rounded < 0 ? 0 : rounded > 255 ? 255 : rounded;
};

/**
 * Planar float32 (0..1, model output) -> opaque RGBA bytes, averaging
 * `block` x `block` pixels into one (box filter). `block` = 1 keeps the size.
 * Output size is floor(width / block) x floor(height / block).
 */
export function planarToRgbaBox(
  data: ArrayLike<number>,
  width: number,
  height: number,
  block: number,
): { rgba: Uint8ClampedArray; width: number; height: number } {
  const step = Math.max(1, Math.floor(block));
  const outW = Math.max(1, Math.floor(width / step));
  const outH = Math.max(1, Math.floor(height / step));
  const plane = width * height;
  const rgba = new Uint8ClampedArray(outW * outH * 4);
  const norm = 1 / (step * step);

  for (let oy = 0; oy < outH; oy += 1) {
    for (let ox = 0; ox < outW; ox += 1) {
      let r = 0;
      let g = 0;
      let b = 0;

      for (let dy = 0; dy < step; dy += 1) {
        const rowBase = (oy * step + dy) * width + ox * step;

        for (let dx = 0; dx < step; dx += 1) {
          const p = rowBase + dx;

          r += data[p];
          g += data[plane + p];
          b += data[2 * plane + p];
        }
      }

      const o = (oy * outW + ox) * 4;

      rgba[o] = toByte(r * norm);
      rgba[o + 1] = toByte(g * norm);
      rgba[o + 2] = toByte(b * norm);
      rgba[o + 3] = 255;
    }
  }

  return { rgba, width: outW, height: outH };
}

/**
 * How many model-output pixels must be averaged into one result pixel so
 * that a tile ends up `targetScale` times bigger than its input.
 * Returns 1 when the model scale is not an integer multiple of the target.
 */
export function boxBlockFor(
  inputWidth: number,
  outputWidth: number,
  targetScale: number,
): number {
  const modelScale = outputWidth / inputWidth;
  const ratio = modelScale / targetScale;

  return Number.isInteger(ratio) && ratio >= 1 ? ratio : 1;
}

export type UpscalePlan = {
  /** Longest side of the image that is fed to the model. */
  maxInputSide: number;
  tileSize: number;
  overlap: number;
};

/**
 * Work per photo is dominated by (input pixels x overlap waste). Plans keep
 * both low. `webgpu` is a real GPU; `wasm` is the CPU fallback, which is far
 * slower per pixel, so it gets a smaller input cap.
 */
export function planUpscale(device: "webgpu" | "wasm"): UpscalePlan {
  return device === "webgpu"
    ? { maxInputSide: 1280, tileSize: 256, overlap: 16 }
    : { maxInputSide: 640, tileSize: 192, overlap: 12 };
}

/** Rough overlap waste: processed pixels / useful pixels. */
export function overlapWaste(tileSize: number, overlap: number): number {
  const full = tileSize + 2 * overlap;

  return (full * full) / (tileSize * tileSize);
}

export type TileSpec = {
  /** Core region in source pixels (what this tile is responsible for). */
  x: number;
  y: number;
  coreWidth: number;
  coreHeight: number;
  /** Tile origin and size in source pixels (core + overlap margin). */
  sx0: number;
  sy0: number;
  tileWidth: number;
  tileHeight: number;
};

/** Splits an image into tiles whose core regions cover it exactly once. */
export function buildTileSpecs(
  width: number,
  height: number,
  tileSize: number,
  overlap: number,
): TileSpec[] {
  const cols = Math.ceil(width / tileSize);
  const rows = Math.ceil(height / tileSize);
  const specs: TileSpec[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = col * tileSize;
      const y = row * tileSize;
      const coreWidth = Math.min(tileSize, width - x);
      const coreHeight = Math.min(tileSize, height - y);
      const sx0 = Math.max(0, x - overlap);
      const sy0 = Math.max(0, y - overlap);
      const sx1 = Math.min(width, x + coreWidth + overlap);
      const sy1 = Math.min(height, y + coreHeight + overlap);

      specs.push({
        x,
        y,
        coreWidth,
        coreHeight,
        sx0,
        sy0,
        tileWidth: sx1 - sx0,
        tileHeight: sy1 - sy0,
      });
    }
  }

  return specs;
}

/**
 * Where a finished x`factor` tile goes: the arguments of
 * CanvasRenderingContext2D.putImageData(img, dx, dy, dirtyX, dirtyY, dirtyW, dirtyH)
 * that copy only the core region into place.
 */
export function tilePlacement(spec: TileSpec, factor: number) {
  return {
    dx: spec.sx0 * factor,
    dy: spec.sy0 * factor,
    dirtyX: (spec.x - spec.sx0) * factor,
    dirtyY: (spec.y - spec.sy0) * factor,
    dirtyWidth: spec.coreWidth * factor,
    dirtyHeight: spec.coreHeight * factor,
  };
}
