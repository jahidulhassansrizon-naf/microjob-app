"use client";

import {
  canvasToBlob,
  clamp,
  createCanvas,
  fitSize,
  get2d,
  releaseCanvas,
} from "./canvasUtils";
import {
  buildTileSpecs,
  planUpscale,
  tilePlacement,
  type TileSpec,
} from "./upscaleMath";

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

/** Opaque RGBA tile, already converted and averaged down to the x2 result. */
type TileResult = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

export type UpscaleDevice = "webgpu" | "wasm";

type UpscaleReply =
  | { kind: "tile"; tile: TileResult }
  | { kind: "ready"; device: UpscaleDevice };

/** The editor keeps a x2 result (the model itself is x4). */
const UPSCALE_FACTOR = 2;
const WHOLE_IMAGE_MAX_SIDE = 256;
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
/* Several tiles can be in flight at once (see upscaleImageWithEsrgan). */
const upscaleWorkerPending = new Map<
  number,
  {
    resolve: (reply: UpscaleReply) => void;
    reject: (error: Error) => void;
  }
>();
let upscaleReady: Promise<UpscaleDevice> | null = null;

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

function rejectAllUpscalePending(error: Error) {
  const pending = [...upscaleWorkerPending.values()];

  upscaleWorkerPending.clear();

  for (const entry of pending) {
    entry.reject(error);
  }
}

function terminateUpscaleWorker() {
  upscaleWorker?.terminate();
  upscaleWorker = null;
  upscaleReady = null;

  rejectAllUpscalePending(createCancelledError());
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
        device?: UpscaleDevice;
        message?: string;
      }>,
    ) => {
      const message = event.data;
      const pending = upscaleWorkerPending.get(message.id);

      if (!pending) return;

      upscaleWorkerPending.delete(message.id);

      if (
        message.type === "tile-result" &&
        message.data &&
        message.width &&
        message.height
      ) {
        pending.resolve({
          kind: "tile",
          tile: {
            data: new Uint8ClampedArray(message.data),
            width: message.width,
            height: message.height,
          },
        });
      } else if (message.type === "ready") {
        pending.resolve({ kind: "ready", device: message.device ?? "wasm" });
      } else if (message.type === "error") {
        pending.reject(
          new Error(message.message || "Upscale worker failed."),
        );
      } else {
        pending.reject(new Error("Upscale worker returned an invalid reply."));
      }
    };

    worker.onerror = (event) => {
      upscaleWorker = null;
      upscaleReady = null;
      rejectAllUpscalePending(
        new Error(event.message || "Upscale worker failed."),
      );
    };

    upscaleWorker = worker;
  }

  return upscaleWorker;
}

/**
 * Loads the model in the worker (once) and reports which device it runs on:
 * "webgpu" = real GPU, "wasm" = CPU fallback (much slower).
 */
export function warmupUpscaler(): Promise<UpscaleDevice> {
  if (!upscaleReady) {
    const worker = getUpscaleWorker();
    const id = ++upscaleWorkerRequestId;

    const promise = new Promise<UpscaleDevice>((resolve, reject) => {
      upscaleWorkerPending.set(id, {
        resolve: (reply) =>
          reply.kind === "ready"
            ? resolve(reply.device)
            : reject(new Error("Upscale worker returned an invalid reply.")),
        reject,
      });

      worker.postMessage({ type: "warmup", id });
    });

    upscaleReady = promise;

    promise.catch(() => {
      if (upscaleReady === promise) upscaleReady = null;
    });
  }

  return upscaleReady;
}

function runTileInWorker(
  rgba: ArrayBuffer,
  width: number,
  height: number,
  signal: AbortSignal,
): Promise<TileResult> {
  throwIfAborted(signal);

  const worker = getUpscaleWorker();
  const id = ++upscaleWorkerRequestId;

  return new Promise((resolve, reject) => {
    upscaleWorkerPending.set(id, {
      resolve: (reply) =>
        reply.kind === "tile"
          ? resolve(reply.tile)
          : reject(new Error("Upscale worker returned an invalid reply.")),
      reject,
    });

    // Cancelling terminates the worker, which rejects every pending tile.
    worker.postMessage(
      {
        type: "tile",
        id,
        input: rgba,
        width,
        height,
        targetScale: UPSCALE_FACTOR,
      },
      [rgba],
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

export type UpscaleOptions = {
  /** Called once the model is ready, before the first tile is processed. */
  onDevice?: (device: UpscaleDevice) => void;
};

/**
 * 2x Super Resolution. Model inference lives in a dedicated worker so a
 * long ONNX/WebGPU/WASM inference cannot freeze the editor's main thread.
 *
 * Speed design (the work is dominated by input pixels x overlap waste):
 *  - the input is capped per device (GPU 1280 px, CPU 640 px longest side);
 *    a 2x result of that is already far above passport/print needs;
 *  - larger tiles with a small overlap (waste 1.27x instead of 1.72x);
 *  - the worker converts and 2x2-averages each tile, so only a small RGBA
 *    tile is sent back, and the UI thread just copies it into place;
 *  - two tiles are kept in flight: while the model works on tile N, the UI
 *    thread already cuts tile N+1 and paints tile N-1.
 */
export function upscaleImageWithEsrgan(
  source: CanvasSource,
  onProgress?: ProgressCallback,
  options?: UpscaleOptions,
): Promise<Blob> {
  assertBrowser();

  return exclusive(async (signal) => {
    const report = throttleProgress(onProgress);
    report(0);

    const device = await warmupUpscaler();
    throwIfAborted(signal);
    options?.onDevice?.(device);

    const plan = planUpscale(device);

    // Upscale is for small photos. A photo above the cap would have to be
    // shrunk first, which defeats the purpose (and costs minutes), so say so.
    const original = sourceSize(source);

    if (Math.max(original.width, original.height) > plan.maxInputSide) {
      throw new Error(
        `This photo is already large (${original.width} x ${original.height} px). Upscale is for small photos (up to ${plan.maxInputSide} px on the longest side on this device).`,
      );
    }

    const input = drawToCanvas(source, plan.maxInputSide);
    const sourceWidth = input.width;
    const sourceHeight = input.height;
    const factor = UPSCALE_FACTOR;

    const output = createCanvas(sourceWidth * factor, sourceHeight * factor);
    const outputCtx = get2d(output);
    const tileIn = createCanvas(1, 1);
    const tileInCtx = get2d(tileIn);
    const tileOut = createCanvas(1, 1);
    const tileOutCtx = get2d(tileOut);

    try {
      const whole = Math.max(sourceWidth, sourceHeight) <= WHOLE_IMAGE_MAX_SIDE;
      const tileSize = whole
        ? Math.max(sourceWidth, sourceHeight)
        : plan.tileSize;
      const overlap = whole ? 0 : plan.overlap;
      const specs: TileSpec[] = buildTileSpecs(
        sourceWidth,
        sourceHeight,
        tileSize,
        overlap,
      );

      const totalTiles = specs.length;
      const jobs: Array<Promise<TileResult> | undefined> = [];

      const launch = (index: number) => {
        if (index >= totalTiles || jobs[index]) return;

        const spec = specs[index];

        tileIn.width = spec.tileWidth;
        tileIn.height = spec.tileHeight;
        tileInCtx.drawImage(
          input,
          spec.sx0,
          spec.sy0,
          spec.tileWidth,
          spec.tileHeight,
          0,
          0,
          spec.tileWidth,
          spec.tileHeight,
        );

        const rgba = tileInCtx.getImageData(
          0,
          0,
          spec.tileWidth,
          spec.tileHeight,
        ).data;

        const job = runTileInWorker(
          rgba.buffer as ArrayBuffer,
          spec.tileWidth,
          spec.tileHeight,
          signal,
        );

        // A tile that is never awaited (cancel / earlier error) must not
        // surface as an unhandled rejection.
        job.catch(() => undefined);
        jobs[index] = job;
      };

      launch(0);
      launch(1);

      for (let index = 0; index < totalTiles; index += 1) {
        throwIfAborted(signal);

        const spec = specs[index];
        const tile = await jobs[index];

        jobs[index] = undefined;
        throwIfAborted(signal);

        // Cut the tile after next while the model is busy with the next one.
        launch(index + 2);

        if (
          tile &&
          tile.width === spec.tileWidth * factor &&
          tile.height === spec.tileHeight * factor
        ) {
          // Exact x2 tile: copy only the core region straight into place.
          const imageData = new ImageData(
            tile.data as Uint8ClampedArray<ArrayBuffer>,
            tile.width,
            tile.height,
          );

          const place = tilePlacement(spec, factor);

          outputCtx.putImageData(
            imageData,
            place.dx,
            place.dy,
            place.dirtyX,
            place.dirtyY,
            place.dirtyWidth,
            place.dirtyHeight,
          );
        } else if (tile) {
          // Unexpected model scale: fall back to canvas resampling.
          const imageData = new ImageData(
            tile.data as Uint8ClampedArray<ArrayBuffer>,
            tile.width,
            tile.height,
          );

          tileOut.width = tile.width;
          tileOut.height = tile.height;
          tileOutCtx.putImageData(imageData, 0, 0);

          const scale = tile.width / spec.tileWidth;

          outputCtx.drawImage(
            tileOut,
            (spec.x - spec.sx0) * scale,
            (spec.y - spec.sy0) * scale,
            spec.coreWidth * scale,
            spec.coreHeight * scale,
            spec.x * factor,
            spec.y * factor,
            spec.coreWidth * factor,
            spec.coreHeight * factor,
          );
        }

        report(((index + 1) / totalTiles) * 0.97);
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
    void warmupUpscaler().catch(() => undefined);
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
