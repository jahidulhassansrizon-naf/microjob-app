import { createHash } from "node:crypto";

// A pending QR remains active until one photo is successfully uploaded.
// Time limits only clean up abandoned in-progress transfers and uploaded image data.
export const QR_UPLOAD_IN_PROGRESS_TTL_MS = 15 * 60 * 1000;
export const QR_UPLOAD_DATA_CLEANUP_TTL_MS = 10 * 60 * 1000;
export const QR_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

export function hashQrUploadToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isValidQrUploadToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{40,50}$/.test(token);
}

export function detectRasterImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export function safeUploadFileName(name: string): string {
  const clean = name.replace(/[\\/\r\n\0]/g, "_").replace(/[^a-zA-Z0-9._() -]/g, "_").trim().slice(0, 100);
  return clean || "mobile-photo.jpg";
}

export function noStoreHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    ...extra,
  };
}
