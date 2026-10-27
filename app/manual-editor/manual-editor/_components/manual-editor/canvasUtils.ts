/*
 * Small browser-only canvas helpers shared by the client-side
 * segmentation (MediaPipe) and adjustment (fabric.js) modules.
 */

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);

  return t * t * (3 - 2 * t);
}

/** Scales (width, height) down so the longest side is at most `maxSide`. */
export function fitSize(width: number, height: number, maxSide: number) {
  const longest = Math.max(width, height);

  if (longest <= maxSide) {
    return {
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
    };
  }

  const scale = maxSide / longest;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  return canvas;
}

export function get2d(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    throw new Error("Canvas is not supported in this browser.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  return ctx;
}

/** Frees the backing store of a temporary canvas (matters on Safari). */
export function releaseCanvas(canvas: HTMLCanvasElement | null | undefined) {
  if (!canvas) return;

  canvas.width = 0;
  canvas.height = 0;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality?: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not encode the image."));
        }
      },
      type,
      quality,
    );
  });
}
