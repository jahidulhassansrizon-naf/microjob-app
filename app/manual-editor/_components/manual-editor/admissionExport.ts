import type { SizePreset } from "./types";

/**
 * Exact-size / exact-KB export for admission and job-portal photos.
 *
 * Portals reject a photo when the pixels, the file size or the format is even a
 * little off, so the Manual Editor encodes these photos here instead of using a
 * plain `canvas.toBlob(...)` with a fixed quality.
 *
 * - Pixel size is never changed here (the canvas is already the exact size).
 * - JPEG: the highest quality that still fits under the KB limit is found by
 *   binary search. If the file is under the minimum KB, quality 100 is used and,
 *   only if that is still too small, harmless zero bytes are appended after the
 *   JPEG end marker (every viewer and every upload form ignores them).
 * - PNG cannot be tuned, so it is only checked against the limit.
 */

export type ExportFormat = "png" | "jpeg" | "webp";

export type EncodedExport = {
  blob: Blob;
  format: ExportFormat;
  /** Short message when something could not be met (Bangla). */
  warning?: string;
  /** Short message when the app changed the format for the user (Bangla). */
  info?: string;
};

/** Conservative limit: some portals count 1 KB = 1000 bytes, some 1024. */
const maxBytesFor = (kb: number) => Math.floor(kb * 1000);
/** The minimum must satisfy the larger definition. */
const minBytesFor = (kb: number) => Math.ceil(kb * 1024) + 64;

function mimeOf(format: ExportFormat) {
  return format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
}

function toBlob(canvas: HTMLCanvasElement, format: ExportFormat, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("The edited image could not be exported."))),
      mimeOf(format),
      quality,
    );
  });
}

export function isAdmissionPreset(preset: SizePreset | null | undefined): preset is SizePreset & {
  widthPx: number;
  heightPx: number;
} {
  return Boolean(preset && preset.widthPx && preset.heightPx);
}

/**
 * Which format the file must have. `null` = the user may choose (PNG or JPG;
 * WebP is never offered for admission photos).
 */
export function forcedAdmissionFormat(preset: SizePreset | null | undefined): ExportFormat | null {
  if (!isAdmissionPreset(preset)) return null;
  if (preset.format === "jpg") return "jpeg";
  if (preset.format === "png") return "png";
  return null;
}

/** JPEG has no transparency: flatten on white so transparent pixels never turn black. */
function flattenOnWhite(source: HTMLCanvasElement) {
  const flat = document.createElement("canvas");
  flat.width = source.width;
  flat.height = source.height;
  const ctx = flat.getContext("2d");
  if (!ctx) return source;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, flat.width, flat.height);
  ctx.drawImage(source, 0, 0);
  return flat;
}

async function fitJpeg(source: HTMLCanvasElement, preset: SizePreset): Promise<{ blob: Blob; warning?: string }> {
  const canvas = flattenOnWhite(source);
  const maxBytes = preset.maxKB ? maxBytesFor(preset.maxKB) : Infinity;
  const minBytes = preset.minKB ? minBytesFor(preset.minKB) : 0;

  let best = await toBlob(canvas, "jpeg", 1);

  if (best.size > maxBytes) {
    let low = 0.05;
    let high = 1;
    let fitted: Blob | null = null;
    for (let i = 0; i < 9; i += 1) {
      const mid = (low + high) / 2;
      const candidate = await toBlob(canvas, "jpeg", mid);
      if (candidate.size <= maxBytes) {
        fitted = candidate;
        low = mid;
      } else {
        high = mid;
      }
    }
    if (!fitted) {
      const smallest = await toBlob(canvas, "jpeg", 0.05);
      if (smallest.size > maxBytes) {
        return {
          blob: smallest,
          warning: `ফাইল ${preset.maxKB} KB-এর বেশি রয়ে গেছে। ছবিতে নয়েজ/ডিটেইল কমান (Sharpness কমান) আর আবার ডাউনলোড করুন।`,
        };
      }
      fitted = smallest;
    }
    best = fitted;
  }

  if (best.size < minBytes) {
    // Quality 100 was already tried above (or the fitted one is already the best that
    // fits). Pad after the end-of-image marker so the file reaches the minimum size.
    const padding = new Uint8Array(minBytes - best.size);
    const padded = new Blob([best, padding], { type: "image/jpeg" });
    if (padded.size > maxBytes) {
      return {
        blob: best,
        warning: `ফাইল ${preset.minKB} KB-এর কম হয়ে গেছে। এই মাপের জন্য আরও ডিটেইলসহ ছবি দিন।`,
      };
    }
    return { blob: padded };
  }

  return { blob: best };
}

/**
 * Encode a canvas for download. For admission presets the KB limit and the format
 * are enforced; for every other size it behaves exactly like before.
 */
export async function encodeCanvasForPreset(
  canvas: HTMLCanvasElement,
  requested: ExportFormat,
  quality: number,
  preset: SizePreset | null | undefined,
): Promise<EncodedExport> {
  if (!isAdmissionPreset(preset)) {
    return { blob: await toBlob(canvas, requested, Math.max(0.4, Math.min(1, quality))), format: requested };
  }

  const forced = forcedAdmissionFormat(preset);
  let format: ExportFormat = forced ?? (requested === "webp" ? "jpeg" : requested);
  let info: string | undefined;
  if (!forced && requested === "webp") {
    info = "এই ভর্তির মাপের জন্য JPG নেওয়া হয়েছে।";
  }

  if (format === "png") {
    const png = await toBlob(canvas, "png");
    const maxBytes = preset.maxKB ? maxBytesFor(preset.maxKB) : Infinity;
    if (png.size <= maxBytes) return { blob: png, format, info };
    if (!forced) {
      // PNG is too big but the portal accepts JPG too: switch automatically.
      format = "jpeg";
      info = `PNG ${preset.maxKB} KB-এর বেশি হচ্ছিল, তাই JPG করে দেওয়া হয়েছে।`;
    } else {
      return {
        blob: png,
        format,
        warning: `PNG ফাইল ${preset.maxKB} KB-এর বেশি। এই পোর্টাল শুধু PNG চায়, ছবির ডিটেইল/নয়েজ কমিয়ে আবার চেষ্টা করুন।`,
      };
    }
  }

  const { blob, warning } = await fitJpeg(canvas, preset);
  return { blob, format, warning, info };
}
