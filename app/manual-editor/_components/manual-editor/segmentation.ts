/*
 * Client-side segmentation built on @mediapipe/tasks-vision.
 *
 * Everything runs in the browser. One multi-class selfie model gives us
 * per-pixel confidence for: background, hair, body-skin, face-skin,
 * clothes and accessories. From those we derive:
 *
 *   face   -> face-skin
 *   skin   -> face-skin + body-skin
 *   hair   -> hair
 *   shadow -> darker-than-surroundings areas inside the skin region
 *             (MediaPipe has no shadow model, so this part is a luminance
 *             heuristic that is constrained by the skin segmentation)
 *   background removal -> 1 - background confidence
 *
 * Masks are returned as white PNG data URLs whose ALPHA channel holds the
 * selection strength, which is the format ObjectMaskCanvas expects.
 */

import type { ObjectTab } from "./types";
import {
  canvasToBlob,
  createCanvas,
  fitSize,
  get2d,
  releaseCanvas,
  smoothstep,
} from "./canvasUtils";

/*
 * The MediaPipe model is kept out of the browser main thread. Object Adjust
 * used to call ImageSegmenter.segment() directly from React, which is a
 * synchronous CPU inference and can freeze Chrome long enough to trigger
 * the browser's "Page Unresponsive" dialog on the first/cold run.
 *
 * The worker owns the MediaPipe runtime and returns only the small 256x256
 * confidence planes to the UI thread.
 */

const CLASS_BACKGROUND = 0;
const CLASS_HAIR = 1;
const CLASS_BODY_SKIN = 2;
const CLASS_FACE_SKIN = 3;
const CLASS_COUNT = 6;

/* Longest side of the selection masks that are generated. */
const MASK_MAX_SIDE = 768;

/* Longest side of the transparent PNG produced by background removal. */
const CUTOUT_MAX_SIDE = 4096;

/* Below this share of selected pixels we tell the user nothing was found. */
export const MIN_SELECTION_COVERAGE = 0.002;

type ClassMasks = {
  width: number;
  height: number;
  classes: Float32Array[];
};

type WorkerResponse =
  | { type: "ready"; id: number }
  | {
      type: "result";
      id: number;
      width: number;
      height: number;
      classes: ArrayBuffer[];
    }
  | { type: "error"; id: number; message: string };

type PendingRequest = {
  resolve: (value: WorkerResponse) => void;
  reject: (error: Error) => void;
};

let segmentationWorker: Worker | null = null;
let segmentationRequestId = 0;
const segmentationPending = new Map<number, PendingRequest>();

function rejectAllPending(error: Error) {
  for (const pending of segmentationPending.values()) {
    pending.reject(error);
  }

  segmentationPending.clear();
}

function getSegmentationWorker() {
  if (typeof window === "undefined") {
    throw new Error("Image segmentation is only available in the browser.");
  }

  if (!segmentationWorker) {
    const worker = new Worker(
      new URL("./segmentation.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      const pending = segmentationPending.get(message.id);
      if (!pending) return;

      segmentationPending.delete(message.id);
      pending.resolve(message);
    };

    worker.onerror = (event) => {
      const error = new Error(
        event.message || "Image segmentation worker failed.",
      );

      rejectAllPending(error);
      segmentationWorker = null;
      worker.terminate();
    };

    segmentationWorker = worker;
  }

  return segmentationWorker;
}

function requestWorker(
  message:
    | { type: "warmup"; id: number }
    | { type: "segment"; id: number; bitmap: ImageBitmap },
  transfer?: Transferable[],
) {
  const worker = getSegmentationWorker();

  return new Promise<WorkerResponse>((resolve, reject) => {
    segmentationPending.set(message.id, { resolve, reject });

    try {
      worker.postMessage(message, transfer ?? []);
    } catch (error) {
      segmentationPending.delete(message.id);
      reject(
        error instanceof Error
          ? error
          : new Error("Unable to start image segmentation."),
      );
    }
  });
}

/** Starts the worker/model in the background without blocking the page. */
export function preloadSegmenter(): Promise<void> {
  const id = ++segmentationRequestId;

  return requestWorker({ type: "warmup", id }).then((response) => {
    if (response.type === "error") {
      throw new Error(response.message);
    }
  });
}

/* ------------------------------------------------------------------ */
/* Running the model (with a tiny per-image cache)                     */
/* ------------------------------------------------------------------ */

const classMaskCache = new Map<string, Promise<ClassMasks>>();
const CACHE_LIMIT = 3;

/** Clears image-specific segmentation results while keeping the model warm. */
export function clearSegmenterImageCache() {
  classMaskCache.clear();
}

/** Releases the worker/cache when the editor itself is unmounted. */
export function disposeSegmenter() {
  const worker = segmentationWorker;
  segmentationWorker = null;

  const error = new Error("Image segmentation worker disposed.");
  rejectAllPending(error);
  classMaskCache.clear();

  worker?.terminate();
}

async function runSegmentation(image: HTMLImageElement): Promise<ClassMasks> {
  const bitmap = await createImageBitmap(image);
  const id = ++segmentationRequestId;

  try {
    const response = await requestWorker(
      { type: "segment", id, bitmap },
      [bitmap],
    );

    if (response.type === "error") {
      throw new Error(response.message);
    }

    if (response.type !== "result") {
      throw new Error("Image segmentation worker returned an invalid result.");
    }

    return {
      width: response.width,
      height: response.height,
      classes: response.classes.map((buffer) => new Float32Array(buffer)),
    };
  } catch (error) {
    try {
      bitmap.close();
    } catch {
      // A transferred ImageBitmap is already detached from the main thread.
    }

    throw error;
  }
}

/**
 * `key` identifies the image (the object URL of the photo works well), so
 * switching between Face / Skin / Hair / Shadow does not re-run the model.
 */
function getClassMasks(image: HTMLImageElement, key: string) {
  const cached = classMaskCache.get(key);

  if (cached) {
    return cached;
  }

  const promise = runSegmentation(image);

  classMaskCache.set(key, promise);

  promise.catch(() => classMaskCache.delete(key));

  while (classMaskCache.size > CACHE_LIMIT) {
    const oldest = classMaskCache.keys().next().value;

    if (oldest === undefined) break;

    classMaskCache.delete(oldest);
  }

  return promise;
}

/* ------------------------------------------------------------------ */
/* Mask math helpers                                                   */
/* ------------------------------------------------------------------ */

function maxOf(...planes: Float32Array[]) {
  const out = new Float32Array(planes[0].length);

  for (const plane of planes) {
    for (let index = 0; index < out.length; index += 1) {
      if (plane[index] > out[index]) out[index] = plane[index];
    }
  }

  return out;
}

/** Bilinear/bicubic upscale of a 0..1 plane using the canvas scaler. */
function resizePlane(
  values: Float32Array,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) {
  const small = createCanvas(sourceWidth, sourceHeight);
  const smallCtx = get2d(small);
  const smallData = smallCtx.createImageData(sourceWidth, sourceHeight);

  for (let index = 0; index < values.length; index += 1) {
    const offset = index * 4;

    smallData.data[offset] = 255;
    smallData.data[offset + 1] = 255;
    smallData.data[offset + 2] = 255;
    smallData.data[offset + 3] = Math.round(
      Math.min(1, Math.max(0, values[index])) * 255,
    );
  }

  smallCtx.putImageData(smallData, 0, 0);

  const large = createCanvas(targetWidth, targetHeight);
  const largeCtx = get2d(large);

  largeCtx.drawImage(small, 0, 0, targetWidth, targetHeight);

  const pixels = largeCtx.getImageData(0, 0, targetWidth, targetHeight).data;
  const out = new Float32Array(targetWidth * targetHeight);

  for (let index = 0; index < out.length; index += 1) {
    out[index] = pixels[index * 4 + 3] / 255;
  }

  releaseCanvas(small);
  releaseCanvas(large);

  return out;
}

function blurAxis(
  source: Float32Array,
  target: Float32Array,
  lines: number,
  length: number,
  lineStep: number,
  step: number,
  radius: number,
  prefix: Float64Array,
) {
  for (let line = 0; line < lines; line += 1) {
    const base = line * lineStep;

    prefix[0] = 0;

    for (let index = 0; index < length; index += 1) {
      prefix[index + 1] = prefix[index] + source[base + index * step];
    }

    for (let index = 0; index < length; index += 1) {
      const low = index - radius < 0 ? 0 : index - radius;
      const high = index + radius >= length ? length - 1 : index + radius;

      target[base + index * step] =
        (prefix[high + 1] - prefix[low]) / (high - low + 1);
    }
  }
}

/** Three box-blur passes ≈ gaussian blur. */
function blurPlane(
  plane: Float32Array,
  width: number,
  height: number,
  radius: number,
) {
  let current = plane;

  const prefix = new Float64Array(Math.max(width, height) + 1);

  for (let pass = 0; pass < 3; pass += 1) {
    const horizontal = new Float32Array(current.length);
    const vertical = new Float32Array(current.length);

    blurAxis(current, horizontal, height, width, width, 1, radius, prefix);
    blurAxis(horizontal, vertical, width, height, 1, width, radius, prefix);

    current = vertical;
  }

  return current;
}

/** Blur that only averages pixels where `weights` is > 0. */
function weightedBlur(
  values: Float32Array,
  weights: Float32Array,
  width: number,
  height: number,
  radius: number,
) {
  const weighted = new Float32Array(values.length);

  for (let index = 0; index < values.length; index += 1) {
    weighted[index] = values[index] * weights[index];
  }

  const numerator = blurPlane(weighted, width, height, radius);
  const denominator = blurPlane(weights, width, height, radius);

  for (let index = 0; index < numerator.length; index += 1) {
    numerator[index] /= Math.max(denominator[index], 1e-3);
  }

  return numerator;
}

function planeToMaskDataUrl(plane: Float32Array, width: number, height: number) {
  const canvas = createCanvas(width, height);
  const ctx = get2d(canvas);
  const image = ctx.createImageData(width, height);

  for (let index = 0; index < plane.length; index += 1) {
    const offset = index * 4;

    image.data[offset] = 255;
    image.data[offset + 1] = 255;
    image.data[offset + 2] = 255;
    image.data[offset + 3] = Math.round(
      Math.min(1, Math.max(0, plane[index])) * 255,
    );
  }

  ctx.putImageData(image, 0, 0);

  const dataUrl = canvas.toDataURL("image/png");

  releaseCanvas(canvas);

  return dataUrl;
}

/* ------------------------------------------------------------------ */
/* Shadow detection                                                    */
/* ------------------------------------------------------------------ */

/*
 * A shadow is a region that is clearly darker than its surroundings on the
 * SAME skin area. We compare a large-scale local average of luminance with
 * a medium-scale one: the medium scale removes small features (eyes,
 * brows, lips) so only broad dark patches (under the chin, one side of the
 * face, nose shadow) stay darker than the large scale average.
 */
function computeShadowPlane(
  image: HTMLImageElement,
  region: Float32Array,
  width: number,
  height: number,
) {
  const canvas = createCanvas(width, height);
  const ctx = get2d(canvas);

  ctx.drawImage(image, 0, 0, width, height);

  const pixels = ctx.getImageData(0, 0, width, height).data;

  releaseCanvas(canvas);

  const luma = new Float32Array(width * height);

  for (let index = 0; index < luma.length; index += 1) {
    const offset = index * 4;

    luma[index] =
      0.2126 * pixels[offset] +
      0.7152 * pixels[offset + 1] +
      0.0722 * pixels[offset + 2];
  }

  const longest = Math.max(width, height);

  const mediumRadius = Math.max(2, Math.round(longest * 0.04));
  const largeRadius = Math.max(4, Math.round(longest * 0.16));

  const medium = weightedBlur(luma, region, width, height, mediumRadius);
  const large = weightedBlur(luma, region, width, height, largeRadius);

  const shadow = new Float32Array(width * height);

  for (let index = 0; index < shadow.length; index += 1) {
    const darkness = large[index] - medium[index];

    shadow[index] = region[index] * smoothstep(6, 26, darkness);
  }

  // Soften so lifted areas blend smoothly into their surroundings.
  return blurPlane(shadow, width, height, Math.max(1, Math.round(longest * 0.008)));
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export type TargetMaskResult = {
  /** White PNG whose alpha channel is the selection strength. */
  maskDataUrl: string;
  /** Share of the image (0..1) that is selected. */
  coverage: number;
};

export async function detectTargetMask(
  image: HTMLImageElement,
  key: string,
  target: ObjectTab,
): Promise<TargetMaskResult> {
  const masks = await getClassMasks(image, key);

  const { width: maskWidth, height: maskHeight, classes } = masks;

  let region: Float32Array;

  if (target === "face") {
    region = classes[CLASS_FACE_SKIN];
  } else if (target === "hair") {
    region = classes[CLASS_HAIR];
  } else {
    // "skin" and "shadow" both work on all visible skin.
    region = maxOf(classes[CLASS_FACE_SKIN], classes[CLASS_BODY_SKIN]);
  }

  const size = fitSize(image.naturalWidth, image.naturalHeight, MASK_MAX_SIDE);

  const upscaled = resizePlane(
    region,
    maskWidth,
    maskHeight,
    size.width,
    size.height,
  );

  // Firm up the soft model edges a little.
  for (let index = 0; index < upscaled.length; index += 1) {
    upscaled[index] = smoothstep(0.3, 0.7, upscaled[index]);
  }

  const plane =
    target === "shadow"
      ? computeShadowPlane(image, upscaled, size.width, size.height)
      : upscaled;

  let selected = 0;

  for (let index = 0; index < plane.length; index += 1) {
    if (plane[index] > 0.5) selected += 1;
  }

  return {
    maskDataUrl: planeToMaskDataUrl(plane, size.width, size.height),
    coverage: selected / plane.length,
  };
}

/**
 * Cuts the person out of the photo and returns a transparent PNG.
 */
export async function removeBackgroundFromImage(
  imageFile: Blob,
): Promise<Blob> {
  /*
   * Keep Object Adjust / Face / Skin / Hair segmentation on the existing
   * MediaPipe pipeline above. Background removal intentionally mirrors the
   * dedicated Remove Background tool and uses the same @imgly/background-removal
   * implementation supplied by that production-ready screen.
   *
   * Dynamic import keeps this browser-only package out of SSR and avoids
   * loading its model assets until the user actually requests BG removal.
   */
  const { removeBackground } = await import("@imgly/background-removal");

  return removeBackground(imageFile, {
    output: { format: "image/png" },
  });
}
