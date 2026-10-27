"use client";

import {
  canvasToBlob,
  clamp,
  createCanvas,
  fitSize,
  get2d,
  releaseCanvas,
} from "./canvasUtils";

type CanvasSource = HTMLImageElement | HTMLCanvasElement;
type ProgressCallback = (progress: number) => void;

export type Box = {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
};

export type Detection = {
  score: number;
  label: string;
  box: Box;
};

type TileResult = {
  data: Float32Array;
  width: number;
  height: number;
};

const UPSCALE_MAX_INPUT_SIDE = 1600;
const WHOLE_IMAGE_MAX_SIDE = 256;
const TILE_SIZE = 128;
const TILE_OVERLAP = 20;
const FACE_DETECTION_SIDE = 512;
const FACE_MAX_WORKING_SIDE = 4096;

let busy = false;
let currentAbortController: AbortController | null = null;

let faceWorker: Worker | null = null;
let faceWorkerRequestId = 0;
let faceWorkerPending: {
  id: number;
  resolve: (detections: Detection[]) => void;
  reject: (error: Error) => void;
} | null = null;

let upscaleWorker: Worker | null = null;
let upscaleWorkerRequestId = 0;
let upscaleWorkerPending: {
  id: number;
  resolve: (result: TileResult) => void;
  reject: (error: Error) => void;
} | null = null;

function assertBrowser() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("AI image processing is only available in the browser.");
  }
}

async function exclusive<T>(
  job: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  if (busy) {
    throw new Error("Another image operation is already running.");
  }

  busy = true;
  const controller = new AbortController();
  currentAbortController = controller;

  try {
    return await job(controller.signal);
  } finally {
    if (currentAbortController === controller) {
      currentAbortController = null;
    }
    busy = false;
  }
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) {
    throw new Error("AI operation cancelled.");
  }
}

function createCancelledError() {
  return new Error("AI operation cancelled.");
}

function terminateFaceWorker() {
  faceWorker?.terminate();
  faceWorker = null;

  if (faceWorkerPending) {
    faceWorkerPending.reject(createCancelledError());
    faceWorkerPending = null;
  }
}

function terminateUpscaleWorker() {
  upscaleWorker?.terminate();
  upscaleWorker = null;

  if (upscaleWorkerPending) {
    upscaleWorkerPending.reject(createCancelledError());
    upscaleWorkerPending = null;
  }
}

function getFaceWorker(): Worker {
  assertBrowser();

  if (!faceWorker) {
    const worker = new Worker(
      new URL("./faceDetector.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (
      event: MessageEvent<{
        type: string;
        id: number;
        detections?: Detection[];
        message?: string;
      }>,
    ) => {
      const message = event.data;
      if (!faceWorkerPending || message.id !== faceWorkerPending.id) return;

      const pending = faceWorkerPending;
      faceWorkerPending = null;

      if (message.type === "result") {
        pending.resolve(message.detections ?? []);
      } else if (message.type === "error") {
        pending.reject(
          new Error(message.message || "Face detection failed."),
        );
      }
    };

    worker.onerror = (event) => {
      const pending = faceWorkerPending;
      faceWorkerPending = null;
      faceWorker = null;
      pending?.reject(
        new Error(event.message || "Face detector worker failed."),
      );
    };

    faceWorker = worker;
  }

  return faceWorker;
}

function detectFacesInWorker(
  blob: Blob,
  signal: AbortSignal,
): Promise<Detection[]> {
  throwIfAborted(signal);

  const worker = getFaceWorker();
  const id = ++faceWorkerRequestId;

  return new Promise((resolve, reject) => {
    let settled = false;

    const onAbort = () => {
      if (faceWorkerPending?.id === id) {
        faceWorkerPending = null;
      }
      terminateFaceWorker();
      finish(() => reject(createCancelledError()));
    };

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      fn();
    };

    faceWorkerPending = {
      id,
      resolve: (detections) => finish(() => resolve(detections)),
      reject: (error) => finish(() => reject(error)),
    };

    signal.addEventListener("abort", onAbort, { once: true });
    worker.postMessage({ type: "detect", id, blob });
  });
}

function getUpscaleWorker(): Worker {
  assertBrowser();

  if (!upscaleWorker) {
    const worker = new Worker(
      new URL("./upscale.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (
      event: MessageEvent<{
        type: string;
        id: number;
        data?: ArrayBuffer;
        width?: number;
        height?: number;
        message?: string;
      }>,
    ) => {
      const message = event.data;
      if (!upscaleWorkerPending || message.id !== upscaleWorkerPending.id) {
        return;
      }

      const pending = upscaleWorkerPending;
      upscaleWorkerPending = null;

      if (
        message.type === "tile-result" &&
        message.data &&
        message.width &&
        message.height
      ) {
        pending.resolve({
          data: new Float32Array(message.data),
          width: message.width,
          height: message.height,
        });
      } else if (message.type === "error") {
        pending.reject(
          new Error(message.message || "Upscale worker failed."),
        );
      }
    };

    worker.onerror = (event) => {
      const pending = upscaleWorkerPending;
      upscaleWorkerPending = null;
      upscaleWorker = null;
      pending?.reject(new Error(event.message || "Upscale worker failed."));
    };

    upscaleWorker = worker;
  }

  return upscaleWorker;
}

function runTileInWorker(
  input: Float32Array,
  width: number,
  height: number,
  signal: AbortSignal,
): Promise<TileResult> {
  throwIfAborted(signal);

  const worker = getUpscaleWorker();
  const id = ++upscaleWorkerRequestId;

  return new Promise((resolve, reject) => {
    let settled = false;

    const onAbort = () => {
      if (upscaleWorkerPending?.id === id) {
        upscaleWorkerPending = null;
      }
      terminateUpscaleWorker();
      finish(() => reject(createCancelledError()));
    };

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      fn();
    };

    upscaleWorkerPending = {
      id,
      resolve: (result) => finish(() => resolve(result)),
      reject: (error) => finish(() => reject(error)),
    };

    signal.addEventListener("abort", onAbort, { once: true });

    worker.postMessage(
      {
        type: "tile",
        id,
        input: input.buffer,
        width,
        height,
      },
      [input.buffer],
    );
  });
}

export function cancelCurrentAiOperation() {
  currentAbortController?.abort();
  currentAbortController = null;
  terminateFaceWorker();
  terminateUpscaleWorker();
}

function throttleProgress(cb?: ProgressCallback): ProgressCallback {
  let last = -1;

  return (value) => {
    const step = Math.round(clamp(value, 0, 1) * 20) / 20;
    if (step !== last) {
      last = step;
      cb?.(step);
    }
  };
}

function sourceSize(source: CanvasSource) {
  return source instanceof HTMLCanvasElement
    ? { width: source.width, height: source.height }
    : { width: source.naturalWidth, height: source.naturalHeight };
}

function drawToCanvas(source: CanvasSource, maxSide: number) {
  const { width, height } = sourceSize(source);

  if (width <= 0 || height <= 0) {
    throw new Error("The selected image has invalid dimensions.");
  }

  const size = fitSize(width, height, maxSide);
  const canvas = createCanvas(size.width, size.height);
  get2d(canvas).drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

const nextTick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const toByte = (value: number) => {
  const rounded = Math.round(value * 255);
  return rounded < 0 ? 0 : rounded > 255 ? 255 : rounded;
};

/**
 * 2x Super Resolution. Model inference lives in a dedicated worker so a
 * long ONNX/WebGPU/WASM inference cannot freeze the editor's main thread.
 */
export function upscaleImageWithEsrgan(
  source: CanvasSource,
  onProgress?: ProgressCallback,
): Promise<Blob> {
  assertBrowser();

  return exclusive(async (signal) => {
    const report = throttleProgress(onProgress);
    report(0);

    const input = drawToCanvas(source, UPSCALE_MAX_INPUT_SIDE);
    const sourceWidth = input.width;
    const sourceHeight = input.height;
    const factor = 2;

    const output = createCanvas(sourceWidth * factor, sourceHeight * factor);
    const outputCtx = get2d(output);
    const tileIn = createCanvas(1, 1);
    const tileInCtx = get2d(tileIn);
    const tileOut = createCanvas(1, 1);
    const tileOutCtx = get2d(tileOut);

    try {
      const whole = Math.max(sourceWidth, sourceHeight) <= WHOLE_IMAGE_MAX_SIDE;
      const tileSize = whole ? Math.max(sourceWidth, sourceHeight) : TILE_SIZE;
      const overlap = whole ? 0 : TILE_OVERLAP;
      const cols = Math.ceil(sourceWidth / tileSize);
      const rows = Math.ceil(sourceHeight / tileSize);
      const totalTiles = cols * rows;
      let completed = 0;

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          throwIfAborted(signal);

          const x = col * tileSize;
          const y = row * tileSize;
          const coreWidth = Math.min(tileSize, sourceWidth - x);
          const coreHeight = Math.min(tileSize, sourceHeight - y);
          const sx0 = Math.max(0, x - overlap);
          const sy0 = Math.max(0, y - overlap);
          const sx1 = Math.min(sourceWidth, x + coreWidth + overlap);
          const sy1 = Math.min(sourceHeight, y + coreHeight + overlap);
          const tileWidth = sx1 - sx0;
          const tileHeight = sy1 - sy0;

          tileIn.width = tileWidth;
          tileIn.height = tileHeight;
          tileInCtx.drawImage(
            input,
            sx0,
            sy0,
            tileWidth,
            tileHeight,
            0,
            0,
            tileWidth,
            tileHeight,
          );

          const rgba = tileInCtx.getImageData(
            0,
            0,
            tileWidth,
            tileHeight,
          ).data;
          const plane = tileWidth * tileHeight;
          const planar = new Float32Array(3 * plane);

          for (let i = 0; i < plane; i += 1) {
            const index = i * 4;
            planar[i] = rgba[index] / 255;
            planar[plane + i] = rgba[index + 1] / 255;
            planar[2 * plane + i] = rgba[index + 2] / 255;
          }

          const tile = await runTileInWorker(
            planar,
            tileWidth,
            tileHeight,
            signal,
          );
          throwIfAborted(signal);

          const imageData = tileOutCtx.createImageData(
            tile.width,
            tile.height,
          );
          const pixels = imageData.data;
          const outputPlane = tile.width * tile.height;

          for (let i = 0; i < outputPlane; i += 1) {
            const index = i * 4;
            pixels[index] = toByte(tile.data[i]);
            pixels[index + 1] = toByte(tile.data[outputPlane + i]);
            pixels[index + 2] = toByte(tile.data[2 * outputPlane + i]);
            pixels[index + 3] = 255;
          }

          tileOut.width = tile.width;
          tileOut.height = tile.height;
          tileOutCtx.putImageData(imageData, 0, 0);

          const scale = tile.width / tileWidth;
          outputCtx.drawImage(
            tileOut,
            (x - sx0) * scale,
            (y - sy0) * scale,
            coreWidth * scale,
            coreHeight * scale,
            x * factor,
            y * factor,
            coreWidth * factor,
            coreHeight * factor,
          );

          completed += 1;
          report((completed / totalTiles) * 0.97);
          await nextTick();
        }
      }

      const alpha = createCanvas(output.width, output.height);
      get2d(alpha).drawImage(
        input,
        0,
        0,
        alpha.width,
        alpha.height,
      );
      outputCtx.globalCompositeOperation = "destination-in";
      outputCtx.drawImage(alpha, 0, 0);
      outputCtx.globalCompositeOperation = "source-over";
      releaseCanvas(alpha);

      const blob = await canvasToBlob(output, "image/png");
      report(1);
      return blob;
    } finally {
      releaseCanvas(input);
      releaseCanvas(tileIn);
      releaseCanvas(tileOut);
      releaseCanvas(output);
    }
  });
}

type Roi = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Convert a person detection into a deliberately tight facial ROI.
 * The person detector's box usually contains shoulders/clothing, so the
 * working region is kept narrow and near the upper-center of the person.
 */
function headRoi(
  box: Box,
  scaleX: number,
  scaleY: number,
  width: number,
  height: number,
): Roi {
  const boxWidth = (box.xmax - box.xmin) * scaleX;
  const boxHeight = (box.ymax - box.ymin) * scaleY;
  const centerX = ((box.xmin + box.xmax) / 2) * scaleX;

  const faceWidth = Math.min(boxWidth * 0.48, boxHeight * 0.28);
  const faceHeight = Math.min(boxHeight * 0.28, faceWidth * 1.18);
  const x = clamp(
    centerX - faceWidth / 2,
    0,
    Math.max(0, width - faceWidth),
  );
  const y = clamp(
    box.ymin * scaleY + boxHeight * 0.035,
    0,
    Math.max(0, height - faceHeight),
  );

  return {
    x,
    y,
    w: Math.min(faceWidth, width - x),
    h: Math.min(faceHeight, height - y),
  };
}

async function sharpenCanvas(
  canvas: HTMLCanvasElement,
  amount: number,
  signal: AbortSignal,
) {
  const width = canvas.width;
  const height = canvas.height;
  if (width < 3 || height < 3) return;

  const ctx = get2d(canvas);
  const imageData = ctx.getImageData(0, 0, width, height);
  const source = imageData.data;
  const copy = new Uint8ClampedArray(source);

  for (let y = 1; y < height - 1; y += 1) {
    if (y % 24 === 0) {
      throwIfAborted(signal);
      await nextTick();
    }

    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4;
      if (copy[index + 3] < 8) continue;

      for (let channel = 0; channel < 3; channel += 1) {
        const average =
          (copy[index - 4 + channel] +
            copy[index + 4 + channel] +
            copy[index - width * 4 + channel] +
            copy[index + width * 4 + channel]) /
          4;

        source[index + channel] = clamp(
          copy[index + channel] +
            (copy[index + channel] - average) * amount,
          0,
          255,
        );
      }
    }
  }

  throwIfAborted(signal);
  ctx.putImageData(imageData, 0, 0);
}

export function enhanceFacesWithTransformers(
  source: CanvasSource,
  onProgress?: ProgressCallback,
): Promise<{ blob: Blob; faceCount: number }> {
  assertBrowser();

  return exclusive(async (signal) => {
    const report = throttleProgress(onProgress);
    report(0);

    const work = drawToCanvas(source, FACE_MAX_WORKING_SIDE);
    const small = drawToCanvas(work, FACE_DETECTION_SIDE);

    try {
      throwIfAborted(signal);
      report(0.18);

      const smallBlob = await canvasToBlob(small, "image/jpeg", 0.82);
      const people = await detectFacesInWorker(smallBlob, signal);
      throwIfAborted(signal);
      report(0.46);

      const rois = people
        .map((detection) =>
          headRoi(
            detection.box,
            work.width / small.width,
            work.height / small.height,
            work.width,
            work.height,
          ),
        )
        .filter((roi) => roi.w >= 8 && roi.h >= 8);

      if (rois.length === 0) {
        throw new Error("No face was detected in the photo.");
      }

      const workContext = get2d(work);
      const step = 0.26 / Math.max(1, rois.length);

      for (const roi of rois) {
        throwIfAborted(signal);

        const pad = Math.round(Math.max(roi.w, roi.h) * 0.04);
        const x = Math.max(0, Math.floor(roi.x - pad));
        const y = Math.max(0, Math.floor(roi.y - pad));
        const width = Math.min(
          work.width - x,
          Math.ceil(roi.w + pad * 2),
        );
        const height = Math.min(
          work.height - y,
          Math.ceil(roi.h + pad * 2),
        );

        const crop = createCanvas(width, height);
        const cropContext = get2d(crop);
        cropContext.filter =
          "brightness(1.04) contrast(1.08) saturate(1.04)";
        cropContext.drawImage(
          work,
          x,
          y,
          width,
          height,
          0,
          0,
          width,
          height,
        );

        const soft = createCanvas(width, height);
        const softContext = get2d(soft);
        softContext.filter = `blur(${Math.max(
          1,
          Math.round(Math.max(width, height) / 110),
        )}px)`;
        softContext.drawImage(crop, 0, 0);
        cropContext.filter = "none";
        cropContext.globalAlpha = 0.24;
        cropContext.drawImage(soft, 0, 0);
        cropContext.globalAlpha = 1;
        releaseCanvas(soft);

        await sharpenCanvas(crop, 1.45, signal);

        /* Keep the enhancement tightly on the face instead of the surrounding area. */
        const maskContext = get2d(crop);
        maskContext.globalCompositeOperation = "destination-in";

        const centerX = width * 0.5;
        const centerY = height * 0.47;
        const radiusX = Math.max(1, width * 0.47);
        const radiusY = Math.max(1, height * 0.48);
        const gradientRadius = Math.max(radiusX, radiusY);

        const gradient = maskContext.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          gradientRadius,
        );
        gradient.addColorStop(0, "rgba(0,0,0,1)");
        gradient.addColorStop(0.72, "rgba(0,0,0,0.96)");
        gradient.addColorStop(0.92, "rgba(0,0,0,0.32)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        maskContext.fillStyle = gradient;
        maskContext.fillRect(0, 0, width, height);
        maskContext.globalCompositeOperation = "source-over";

        throwIfAborted(signal);
        workContext.drawImage(crop, x, y);
        releaseCanvas(crop);

        report(0.62 + step);
        await nextTick();
      }

      throwIfAborted(signal);
      report(0.92);

      const blob = await canvasToBlob(work, "image/png");
      report(1);
      return {
        blob,
        faceCount: rois.length,
      };
    } finally {
      releaseCanvas(small);
      releaseCanvas(work);
    }
  });
}

export function preloadUpscaler() {
  if (typeof window === "undefined") return;

  try {
    const worker = getUpscaleWorker();
    const id = ++upscaleWorkerRequestId;
    worker.postMessage({ type: "warmup", id });
  } catch {
    // Best-effort warmup only.
  }
}

export function preloadFaceDetector() {
  if (typeof window === "undefined") return;

  try {
    const worker = getFaceWorker();
    const id = ++faceWorkerRequestId;
    worker.postMessage({ type: "warmup", id });
  } catch {
    // Best-effort warmup only.
  }
}

export type HeadBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
};

/**
 * Estimates head regions (in pixels of `source`) by reusing the existing
 * person detector and the same head-ROI heuristic Face Enhance already uses.
 *
 * Accuracy note: this is NOT a landmark/face-mesh detector. The head box is
 * derived from a detected person's bounding box, so it is a good starting
 * point for auto-framing and fill-light, but the user must be able to adjust
 * the result manually. Throws if another AI operation is running.
 */
export function detectHeadBoxes(source: CanvasSource): Promise<HeadBox[]> {
  assertBrowser();

  return exclusive(async (signal) => {
    const { width, height } = sourceSize(source);
    const small = drawToCanvas(source, FACE_DETECTION_SIDE);

    try {
      const blob = await canvasToBlob(small, "image/jpeg", 0.82);
      const people = await detectFacesInWorker(blob, signal);
      throwIfAborted(signal);

      return people
        .map((detection) => {
          const roi = headRoi(
            detection.box,
            width / small.width,
            height / small.height,
            width,
            height,
          );
          return { x: roi.x, y: roi.y, width: roi.w, height: roi.h, score: detection.score };
        })
        .filter((box) => box.width >= 8 && box.height >= 8);
    } finally {
      releaseCanvas(small);
    }
  });
}
