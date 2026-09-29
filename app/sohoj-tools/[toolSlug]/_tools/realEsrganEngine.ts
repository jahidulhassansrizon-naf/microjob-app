/**
 * In-browser Real-ESRGAN ("realesr-general-x4v3") engine built on onnxruntime-web.
 *
 * - WebGPU first, automatic WASM fallback.
 * - Model is downloaded once (with progress) and kept in the Cache API.
 * - The session is kept at module level, so it is created only once per page load.
 *
 * Client-side only: call enhanceCanvas() from an event handler, never during SSR.
 */
import type * as Ort from "onnxruntime-web";

type OrtModule = typeof Ort;
type Device = "webgpu" | "wasm";

interface Bundle {
  ort: OrtModule;
  session: Ort.InferenceSession;
}

export type EnhanceStage = "download" | "load" | "enhance";

export interface EnhanceProgress {
  stage: EnhanceStage;
  percent: number;
}

export interface EnhanceOptions {
  /** Final size factor. 2 runs the 4x model and shrinks the result (sharper). */
  scale?: 2 | 4;
  /** Inputs whose longest side is bigger than this are shrunk first (speed). */
  maxInputSide?: number;
  /** Safety cap for the output canvas (browser canvas limit). */
  maxOutputPixels?: number;
  onProgress?: (progress: EnhanceProgress) => void;
  signal?: AbortSignal;
}

const MODEL_URL = "/models/realesr-general-x4v3.onnx";
const MODEL_CACHE_NAME = "sohoj-upscaler-models-v1"; // shared with ImageUpscaler
const MODEL_APPROX_BYTES = 4.6 * 1024 * 1024;
const MODEL_MIN_BYTES = 512 * 1024;
const MODEL_SCALE = 4;

/** Images up to this size (longest side) run in one piece: no tile seams. */
const WHOLE_IMAGE_MAX_SIDE = 256;
const TILE_SIZE = 128;
/** The network sees ~17 px around a pixel, 20 px of context hides the joints. */
const TILE_OVERLAP = 20;

const DEFAULT_MAX_INPUT_SIDE = 1600;
const DEFAULT_MAX_OUTPUT_PIXELS = 4096 * 4096;

/* -------------------------------------------------------------------------- */
/*                                Module state                                */
/* -------------------------------------------------------------------------- */

let bundlePromise: Promise<Bundle> | null = null;
let device: Device | null = null;
/** Only the download progress of the model that is loading right now. */
let onModelDownload: ((percent: number) => void) | undefined;

const nextTick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
};

/* -------------------------------------------------------------------------- */
/*                                Model loading                               */
/* -------------------------------------------------------------------------- */

const loadModelBytes = async (
  url: string,
  onProgress?: (percent: number) => void,
): Promise<Uint8Array> => {
  const cache =
    typeof caches !== "undefined"
      ? await caches.open(MODEL_CACHE_NAME).catch(() => null)
      : null;

  if (cache) {
    const hit = await cache.match(url).catch(() => undefined);
    if (hit) return new Uint8Array(await hit.arrayBuffer());
  }

  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error("MODEL_FETCH_FAILED");

  const total =
    Number(response.headers.get("content-length")) || MODEL_APPROX_BYTES;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress?.(Math.min(99, Math.round((received / total) * 100)));
  }

  // A real model is MBs. A tiny body is an error page, never cache that.
  if (received < MODEL_MIN_BYTES) throw new Error("MODEL_FETCH_FAILED");

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  if (cache) {
    await cache
      .put(
        url,
        new Response(bytes.buffer as ArrayBuffer, {
          headers: { "Content-Type": "application/octet-stream" },
        }),
      )
      .catch(() => undefined);
  }

  return bytes;
};

const getBundle = (): Promise<Bundle> => {
  if (bundlePromise) return bundlePromise;

  const promise: Promise<Bundle> = (async () => {
    const ort = await import("onnxruntime-web");

    // Next.js does not ship ORT's .wasm/.mjs runtime files. Load them from a
    // CDN pinned to the installed version. To self-host instead: copy
    // node_modules/onnxruntime-web/dist/*.{wasm,mjs} to /public/ort/ and use
    // ort.env.wasm.wasmPaths = "/ort/".
    ort.env.logLevel = "error";
    const version = ort.env.versions.web;
    if (version) {
      ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${version}/dist/`;
    }
    if (typeof crossOriginIsolated !== "undefined" && crossOriginIsolated) {
      ort.env.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency || 2);
    }

    const bytes = await loadModelBytes(MODEL_URL, (p) => onModelDownload?.(p));

    const createSession = (provider: Device) =>
      ort.InferenceSession.create(bytes, {
        executionProviders: [provider],
        graphOptimizationLevel: "all",
        logSeverityLevel: 3,
      });

    const preferred: Device =
      device ??
      (typeof navigator !== "undefined" && "gpu" in navigator
        ? "webgpu"
        : "wasm");

    try {
      const session = await createSession(preferred);
      device = preferred;
      return { ort, session };
    } catch (err) {
      if (preferred === "webgpu") {
        device = "wasm"; // WebGPU could not start: fall back to CPU
        return { ort, session: await createSession("wasm") };
      }
      throw err;
    }
  })().catch((err) => {
    if (bundlePromise === promise) bundlePromise = null;
    throw err;
  });

  bundlePromise = promise;
  return promise;
};

const releaseBundle = () => {
  const current = bundlePromise;
  bundlePromise = null;
  current?.then((b) => b.session.release()).catch(() => undefined);
};

/* -------------------------------------------------------------------------- */
/*                               Tensor helpers                               */
/* -------------------------------------------------------------------------- */

/** Canvas RGBA pixels -> planar RGB floats [R..., G..., B...], range 0..1. */
const imageDataToPlanarRgb = (image: ImageData): Float32Array => {
  const { data, width, height } = image;
  const plane = width * height;
  const out = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i += 1) {
    const s = i * 4;
    out[i] = data[s] / 255;
    out[plane + i] = data[s + 1] / 255;
    out[2 * plane + i] = data[s + 2] / 255;
  }
  return out;
};

/** Model float (0..1) -> byte (0..255), clamped. */
const toByte = (value: number): number => {
  const n = Math.round(value * 255);
  return n < 0 ? 0 : n > 255 ? 255 : n;
};

interface TileResult {
  data: Float32Array;
  width: number;
  height: number;
}

const runModel = async (
  { ort, session }: Bundle,
  input: Float32Array,
  width: number,
  height: number,
): Promise<TileResult> => {
  const tensor = new ort.Tensor("float32", input, [1, 3, height, width]);
  const outputs = await session.run({ [session.inputNames[0]]: tensor });
  const output = outputs[session.outputNames[0]];
  const data = (await output.getData()) as Float32Array;
  const [, , outH, outW] = output.dims;
  return { data, width: outW, height: outH };
};

/** Runs one tile. If WebGPU fails while running, retries once on WASM. */
const runTile = async (
  input: Float32Array,
  width: number,
  height: number,
): Promise<TileResult> => {
  try {
    return await runModel(await getBundle(), input, width, height);
  } catch (err) {
    if (device === "webgpu") {
      device = "wasm";
      releaseBundle();
      return runModel(await getBundle(), input, width, height);
    }
    throw err;
  }
};

/* -------------------------------------------------------------------------- */
/*                                 Public API                                 */
/* -------------------------------------------------------------------------- */

/** True when the error means "the user cancelled". */
export const isEnhanceAbort = (err: unknown): boolean =>
  err instanceof DOMException && err.name === "AbortError";

/**
 * Enhances a canvas with Real-ESRGAN and returns a NEW canvas
 * (source untouched). Output is `scale` times bigger than the (possibly
 * pre-shrunk) input.
 */
export const enhanceCanvas = async (
  source: HTMLCanvasElement,
  options: EnhanceOptions = {},
): Promise<HTMLCanvasElement> => {
  const {
    scale = 2,
    maxInputSide = DEFAULT_MAX_INPUT_SIDE,
    maxOutputPixels = DEFAULT_MAX_OUTPUT_PIXELS,
    onProgress,
    signal,
  } = options;

  throwIfAborted(signal);

  // 1) Decide the input size: shrink big photos so it finishes in reasonable
  //    time and the result stays inside the browser canvas limit.
  let inputScale = Math.min(
    1,
    maxInputSide / Math.max(source.width, source.height),
  );
  const fitScale = Math.sqrt(
    maxOutputPixels / (source.width * source.height * scale * scale),
  );
  inputScale = Math.min(inputScale, fitScale);

  const inW = Math.max(1, Math.round(source.width * inputScale));
  const inH = Math.max(1, Math.round(source.height * inputScale));

  let input = source;
  if (inW !== source.width || inH !== source.height) {
    input = document.createElement("canvas");
    input.width = inW;
    input.height = inH;
    const ictx = input.getContext("2d");
    if (!ictx) throw new Error("EXPORT_FAILED");
    ictx.imageSmoothingEnabled = true;
    ictx.imageSmoothingQuality = "high";
    ictx.drawImage(source, 0, 0, inW, inH);
  }
  const inCtx = input.getContext("2d", { willReadFrequently: true });
  if (!inCtx) throw new Error("EXPORT_FAILED");

  // 2) Load model (download on first use, cached afterwards).
  onProgress?.({ stage: "load", percent: 0 });
  onModelDownload = (percent) => onProgress?.({ stage: "download", percent });
  try {
    await getBundle();
  } finally {
    onModelDownload = undefined;
  }
  throwIfAborted(signal);

  // 3) Output canvas.
  const outW = inW * scale;
  const outH = inH * scale;
  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) throw new Error("EXPORT_FAILED");
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = "high";

  const tileOutCanvas = document.createElement("canvas");
  const tileOutCtx = tileOutCanvas.getContext("2d");
  if (!tileOutCtx) throw new Error("EXPORT_FAILED");

  // 4) Enhance: whole image if small, otherwise tile by tile with context.
  const whole = Math.max(inW, inH) <= WHOLE_IMAGE_MAX_SIDE;
  const tileSize = whole ? Math.max(inW, inH) : TILE_SIZE;
  const overlap = whole ? 0 : TILE_OVERLAP;
  const cols = Math.ceil(inW / tileSize);
  const rows = Math.ceil(inH / tileSize);
  const totalTiles = cols * rows;
  let doneTiles = 0;
  let lastPercent = -1;

  onProgress?.({ stage: "enhance", percent: 0 });

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      throwIfAborted(signal);

      const x = col * tileSize;
      const y = row * tileSize;
      const coreW = Math.min(tileSize, inW - x);
      const coreH = Math.min(tileSize, inH - y);

      const sx0 = Math.max(0, x - overlap);
      const sy0 = Math.max(0, y - overlap);
      const sx1 = Math.min(inW, x + coreW + overlap);
      const sy1 = Math.min(inH, y + coreH + overlap);
      const sw = sx1 - sx0;
      const sh = sy1 - sy0;

      const tileInput = imageDataToPlanarRgb(
        inCtx.getImageData(sx0, sy0, sw, sh),
      );
      const tile = await runTile(tileInput, sw, sh);
      throwIfAborted(signal);

      const { width: tw, height: th, data } = tile;
      const imageData = tileOutCtx.createImageData(tw, th);
      const px = imageData.data;
      const plane = tw * th;
      for (let i = 0; i < plane; i += 1) {
        const d = i * 4;
        px[d] = toByte(data[i]);
        px[d + 1] = toByte(data[plane + i]);
        px[d + 2] = toByte(data[2 * plane + i]);
        px[d + 3] = 255;
      }
      tileOutCanvas.width = tw;
      tileOutCanvas.height = th;
      tileOutCtx.putImageData(imageData, 0, 0);

      // Copy only the tile core (without the context margin), scaled to the
      // requested factor (4x stays 1:1, 2x is shrunk by half).
      const modelScale = tw / sw; // = MODEL_SCALE
      outCtx.drawImage(
        tileOutCanvas,
        (x - sx0) * modelScale,
        (y - sy0) * modelScale,
        coreW * modelScale,
        coreH * modelScale,
        x * scale,
        y * scale,
        coreW * scale,
        coreH * scale,
      );

      doneTiles += 1;
      const percent = Math.min(99, Math.round((doneTiles / totalTiles) * 100));
      if (percent !== lastPercent) {
        lastPercent = percent;
        onProgress?.({ stage: "enhance", percent });
      }

      await nextTick(); // let the browser paint the progress
    }
  }

  onProgress?.({ stage: "enhance", percent: 100 });
  return outCanvas;
};

/** Frees the model / GPU memory (call when leaving the page if you like). */
export const disposeEnhanceEngine = () => releaseBundle();

export const ENHANCE_MODEL_SCALE = MODEL_SCALE;
