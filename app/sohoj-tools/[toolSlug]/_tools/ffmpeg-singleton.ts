import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

const CORE_VERSION = "0.12.10";
const CORE_BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

interface CoreAssets {
  coreURL: string;
  wasmURL: string;
}

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;
let assetsPromise: Promise<CoreAssets> | null = null;

/** Downloads the core once and keeps the blob URLs so a reload after cancel doesn't re-convert ~30 MB. */
function getCoreAssets(): Promise<CoreAssets> {
  if (!assetsPromise) {
    const pending = Promise.all([
      toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
      toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
    ]).then(([coreURL, wasmURL]) => ({ coreURL, wasmURL }));

    assetsPromise = pending;
    // Allow a retry after a network failure instead of caching the rejection forever.
    pending.catch(() => {
      if (assetsPromise === pending) assetsPromise = null;
    });
  }
  return assetsPromise;
}

/** Returns the shared, loaded FFmpeg instance. Concurrent callers share one load. */
export function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return Promise.resolve(ffmpegInstance);
  if (loadPromise) return loadPromise;

  const ffmpeg = new FFmpeg();
  ffmpegInstance = ffmpeg;

  const pending = (async () => {
    const assets = await getCoreAssets();
    // terminateFFmpeg() may have run while assets were downloading.
    if (ffmpegInstance !== ffmpeg) throw new Error("FFmpeg load cancelled");

    await ffmpeg.load(assets);
    if (ffmpegInstance !== ffmpeg) {
      ffmpeg.terminate();
      throw new Error("FFmpeg load cancelled");
    }
    return ffmpeg;
  })();

  loadPromise = pending;
  pending.then(
    () => {
      if (loadPromise === pending) loadPromise = null;
    },
    () => {
      if (loadPromise === pending) loadPromise = null;
      if (ffmpegInstance === ffmpeg) ffmpegInstance = null;
    },
  );

  return pending;
}

/**
 * Kills the worker (and any running exec()), so the next getFFmpeg() starts fresh.
 * This is the only way to truly stop an in-flight ffmpeg.wasm command.
 * Pass releaseAssets to also free the cached core blob URLs (e.g. on final unmount).
 */
export function terminateFFmpeg({ releaseAssets = false }: { releaseAssets?: boolean } = {}): void {
  const ffmpeg = ffmpegInstance;
  ffmpegInstance = null;
  loadPromise = null;

  try {
    ffmpeg?.terminate();
  } catch {
    // Already terminated / never started.
  }

  if (releaseAssets && assetsPromise) {
    const pending = assetsPromise;
    assetsPromise = null;
    pending.then(
      ({ coreURL, wasmURL }) => {
        URL.revokeObjectURL(coreURL);
        URL.revokeObjectURL(wasmURL);
      },
      () => undefined,
    );
  }
}
